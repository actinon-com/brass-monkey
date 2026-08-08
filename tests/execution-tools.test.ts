import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAction } from '../src/tools/execute_action.js';
import { executeMethod } from '../src/tools/execute_method.js';

/**
 * Builds a mock OdooClient that dispatches on `model.method` rather than call
 * order, so tests stay readable when the tools add or reorder pre-flight reads.
 * A handler may inspect (args, kwargs) to distinguish calls that share a key —
 * notably the two `read` calls for target resolution and snapshotting.
 */
function makeClient(handlers: Record<string, any>, majorVersion = 17) {
  return {
    majorVersion,
    executeKw: vi.fn(async (model: string, method: string, args: any[] = [], kwargs: any = {}) => {
      const key = `${model}.${method}`;
      const handler = handlers[key];
      if (handler === undefined) {
        throw new Error(`Unexpected RPC in test: ${key}`);
      }
      return typeof handler === 'function' ? handler(args, kwargs) : handler;
    }),
  };
}

function makeAudit() {
  return {
    logSystemEvent: vi.fn().mockResolvedValue(true),
    postChatterMessage: vi.fn().mockResolvedValue(true),
    logLocalAction: vi.fn().mockResolvedValue(true),
    formatWriteSnapshot: vi.fn().mockReturnValue('Formatted Snapshot'),
  };
}

function makeManager(client: any, audit: any) {
  return {
    getClient: vi.fn().mockResolvedValue(client),
    getAudit: vi.fn().mockResolvedValue(audit),
  };
}

/** fields_get stub advertising every column the action pre-flight asks for. */
const ACTION_FIELDS_GET = {
  name: {}, state: {}, type: {}, model_id: {}, code: {}, child_ids: {},
  update_field_id: {}, update_path: {}, evaluation_type: {}, value: {},
  webhook_url: {}, binding_model_id: {}, groups_id: {}, sequence: {},
};

/** fields_get stub for a business model, backing the display-name probe. */
const TARGET_FIELDS_GET = { display_name: {}, name: {}, state: {}, priority: {} };

describe('execute_action', () => {
  let audit: any;

  beforeEach(() => {
    audit = makeAudit();
  });

  it('runs a declarative action, capturing a real before-snapshot', async () => {
    const client = makeClient({
      'ir.actions.server.fields_get': ACTION_FIELDS_GET,
      'ir.actions.server.read': [
        {
          id: 7, name: 'Flag as Priority', state: 'object_write',
          model_id: [1, 'Sales Order'], update_field_id: [22, 'Priority (sale.order)'],
          child_ids: [],
        },
      ],
      'ir.model.read': [{ id: 1, model: 'sale.order' }],
      'ir.model.fields.read': [{ id: 22, name: 'priority' }],
      'sale.order.fields_get': TARGET_FIELDS_GET,
      'sale.order.read': (args: any[], kwargs: any) =>
        kwargs.fields.includes('priority')
          ? [{ id: 42, priority: '0' }]
          : [{ id: 42, display_name: 'SO0042' }],
      'ir.actions.server.run': false,
    });

    const result = await executeAction(makeManager(client, audit), {
      action_id: 7,
      model: 'sale.order',
      ids: [42],
      justification: 'Customer escalated the order',
    } as any);

    expect(result.executed).toBe(true);
    expect(result.preflight.classification).toBe('declarative');
    expect(result.preflight.snapshottable).toBe(true);

    // Executed against the explicit recordset, via the action's run entry point.
    expect(client.executeKw).toHaveBeenCalledWith(
      'ir.actions.server', 'run', [[7]],
      { context: { active_model: 'sale.order', active_id: 42, active_ids: [42] } }
    );

    expect(audit.logLocalAction).toHaveBeenCalledWith(
      'execute_action', 'sale.order', 42,
      expect.objectContaining({ before: { 42: { priority: '0' } } }),
      'Customer escalated the order'
    );
    expect(audit.logSystemEvent).toHaveBeenCalledWith(expect.any(String), 'warning');
    expect(audit.postChatterMessage).toHaveBeenCalledTimes(1);
  });

  it('refuses a Python code action unless acknowledged', async () => {
    const client = makeClient({
      'ir.actions.server.fields_get': ACTION_FIELDS_GET,
      'ir.actions.server.read': [
        { id: 8, name: 'Recalculate', state: 'code', code: 'records.write({})', child_ids: [] },
      ],
      'sale.order.fields_get': TARGET_FIELDS_GET,
      'sale.order.read': [{ id: 42, display_name: 'SO0042' }],
    });

    await expect(
      executeAction(makeManager(client, audit), {
        action_id: 8, model: 'sale.order', ids: [42], justification: 'Recalculate totals',
      } as any)
    ).rejects.toThrow(/arbitrary Python/);

    expect(client.executeKw).not.toHaveBeenCalledWith(
      'ir.actions.server', 'run', expect.anything(), expect.anything()
    );
  });

  it('detects a code action nested inside a multi action', async () => {
    const client = makeClient({
      'ir.actions.server.fields_get': ACTION_FIELDS_GET,
      'ir.actions.server.read': (args: any[]) => {
        const id = args[0][0];
        if (id === 9) {
          return [{ id: 9, name: 'Close Out', state: 'multi', child_ids: [10, 11] }];
        }
        if (id === 10) {
          return [{ id: 10, name: 'Set Done', state: 'object_write', model_id: [1, 'Sales Order'], update_field_id: [22, 'State'], child_ids: [] }];
        }
        return [{ id: 11, name: 'Notify', state: 'code', code: 'env.cr.execute(...)', child_ids: [] }];
      },
      'ir.model.read': [{ id: 1, model: 'sale.order' }],
      'ir.model.fields.read': [{ id: 22, name: 'state' }],
      'sale.order.fields_get': TARGET_FIELDS_GET,
      'sale.order.read': [{ id: 42, display_name: 'SO0042' }],
    });

    await expect(
      executeAction(makeManager(client, audit), {
        action_id: 9, model: 'sale.order', ids: [42], justification: 'Close the order out',
      } as any)
    ).rejects.toThrow(/child action "Notify" \(11\)/);
  });

  it('reports rather than throws on a dry run of an unsafe action', async () => {
    const client = makeClient({
      'ir.actions.server.fields_get': ACTION_FIELDS_GET,
      'ir.actions.server.read': [
        { id: 8, name: 'Recalculate', state: 'code', code: 'records.write({})', child_ids: [] },
      ],
      'sale.order.fields_get': TARGET_FIELDS_GET,
      'sale.order.read': [{ id: 42, display_name: 'SO0042' }],
    });

    const result = await executeAction(makeManager(client, audit), {
      action_id: 8, model: 'sale.order', ids: [42], justification: 'Inspect first', dry_run: true,
    } as any);

    expect(result.executed).toBe(false);
    expect(result.would_refuse).toBe(true);
    expect(result.preflight.reasons[0]).toMatch(/arbitrary Python/);
    expect(audit.logLocalAction).not.toHaveBeenCalled();
  });

  it('rejects a declarative action invoked against the wrong model', async () => {
    const client = makeClient({
      'ir.actions.server.fields_get': ACTION_FIELDS_GET,
      'ir.actions.server.read': [
        { id: 7, name: 'Flag as Priority', state: 'object_write', model_id: [1, 'Sales Order'], update_field_id: [22, 'Priority'], child_ids: [] },
      ],
      'ir.model.read': [{ id: 1, model: 'sale.order' }],
      'ir.model.fields.read': [{ id: 22, name: 'priority' }],
    });

    await expect(
      executeAction(makeManager(client, audit), {
        action_id: 7, model: 'res.partner', ids: [42], justification: 'Wrong model on purpose',
      } as any)
    ).rejects.toThrow(/declared against model "sale.order"/);
  });

  it('refuses an empty recordset unless explicitly allowed', async () => {
    const client = makeClient({
      'ir.actions.server.fields_get': ACTION_FIELDS_GET,
      'ir.actions.server.read': [
        { id: 7, name: 'Flag', state: 'object_write', model_id: [1, 'Sales Order'], update_field_id: [22, 'Priority'], child_ids: [] },
      ],
      'ir.model.read': [{ id: 1, model: 'sale.order' }],
      'ir.model.fields.read': [{ id: 22, name: 'priority' }],
    });

    await expect(
      executeAction(makeManager(client, audit), {
        action_id: 7, model: 'sale.order', justification: 'No targets given',
      } as any)
    ).rejects.toThrow(/allow_empty_recordset/);
  });

  it('accepts a JSON-serialized id list and returns a follow-up action inert', async () => {
    const followUp = { type: 'ir.actions.act_window', res_model: 'sale.order', res_id: 42 };
    const client = makeClient({
      'ir.actions.server.fields_get': ACTION_FIELDS_GET,
      'ir.actions.server.read': [
        { id: 7, name: 'Flag', state: 'object_write', model_id: [1, 'Sales Order'], update_field_id: [22, 'Priority'], child_ids: [] },
      ],
      'ir.model.read': [{ id: 1, model: 'sale.order' }],
      'ir.model.fields.read': [{ id: 22, name: 'priority' }],
      'sale.order.fields_get': TARGET_FIELDS_GET,
      'sale.order.read': (args: any[], kwargs: any) =>
        kwargs.fields.includes('priority')
          ? [{ id: 42, priority: '1' }]
          : [{ id: 42, display_name: 'SO0042' }],
      'ir.actions.server.run': followUp,
    });

    const result = await executeAction(makeManager(client, audit), {
      action_id: 7, model: 'sale.order', ids: '[42]', justification: 'Escalation',
    } as any);

    expect(result.targets).toEqual([{ id: 42, display_name: 'SO0042' }]);
    expect(result.result).toEqual(followUp);
    expect(result.follow_up_action_note).toMatch(/has NOT been executed/);
  });
});

describe('execute_method', () => {
  let audit: any;

  const FORM_ARCH =
    '<form><header><button name="action_confirm" type="object" string="Confirm"/></header></form>';

  beforeEach(() => {
    audit = makeAudit();
  });

  it('calls a view-verified workflow button and snapshots the state change', async () => {
    let confirmed = false;
    const client = makeClient({
      'sale.order.get_view': { arch: FORM_ARCH },
      'sale.order.fields_get': { display_name: {}, name: {}, state: {} },
      'sale.order.read': (args: any[], kwargs: any) => {
        if (kwargs.fields.includes('state')) return [{ id: 42, state: confirmed ? 'sale' : 'draft' }];
        return [{ id: 42, display_name: 'SO0042' }];
      },
      'sale.order.action_confirm': () => {
        confirmed = true;
        return true;
      },
    });

    const result = await executeMethod(makeManager(client, audit), {
      model: 'sale.order', method: 'action_confirm', ids: [42],
      justification: 'Customer approved the quotation',
    } as any);

    expect(result.executed).toBe(true);
    expect(result.preflight.details.view_validated).toBe(true);
    expect(result.state_change).toEqual({
      before: { 42: { state: 'draft' } },
      after: { 42: { state: 'sale' } },
    });
    expect(client.executeKw).toHaveBeenCalledWith('sale.order', 'action_confirm', [[42]], {});
    expect(audit.logLocalAction).toHaveBeenCalledWith(
      'execute_method', 'sale.order', 42, expect.any(Object), 'Customer approved the quotation'
    );
  });

  it('refuses ORM primitives and names the correct tool', async () => {
    const client = makeClient({});
    const manager = makeManager(client, audit);

    await expect(
      executeMethod(manager, { model: 'sale.order', method: 'write', ids: [42], justification: 'x' } as any)
    ).rejects.toThrow(/use write_record/);

    await expect(
      executeMethod(manager, { model: 'sale.order', method: 'unlink', ids: [42], justification: 'x' } as any)
    ).rejects.toThrow(/use unlink_record/);

    // The deny-list is absolute: acknowledging does not open it.
    await expect(
      executeMethod(manager, {
        model: 'sale.order', method: 'write', ids: [42], justification: 'x', acknowledge_unsafe: true,
      } as any)
    ).rejects.toThrow(/cannot be overridden/);

    expect(client.executeKw).not.toHaveBeenCalled();
  });

  it('refuses private methods', async () => {
    const client = makeClient({});
    await expect(
      executeMethod(makeManager(client, audit), {
        model: 'sale.order', method: '_write', ids: [42], justification: 'x',
      } as any)
    ).rejects.toThrow(/private method/);
  });

  it('refuses a method with no matching view button, pointing at the override', async () => {
    const client = makeClient({
      'sale.order.get_view': { arch: '<form><field name="name"/></form>' },
      'sale.order.fields_get': { display_name: {}, name: {}, state: {} },
      'sale.order.read': [{ id: 42, display_name: 'SO0042' }],
    });

    await expect(
      executeMethod(makeManager(client, audit), {
        model: 'sale.order', method: 'action_mystery', ids: [42], justification: 'Try it',
      } as any)
    ).rejects.toThrow(/skip_view_validation/);
  });

  it('requires acknowledgement for names outside the button convention', async () => {
    const client = makeClient({
      'sale.order.get_view': { arch: '<form><button name="recompute_totals" type="object"/></form>' },
      'sale.order.fields_get': { display_name: {}, name: {}, state: {} },
      'sale.order.read': [{ id: 42, display_name: 'SO0042' }],
    });

    await expect(
      executeMethod(makeManager(client, audit), {
        model: 'sale.order', method: 'recompute_totals', ids: [42], justification: 'Totals look wrong',
      } as any)
    ).rejects.toThrow(/does not follow the action_\/button_\/toggle_ convention/);
  });

  it('falls back to fields_view_get on Odoo below 16', async () => {
    const client = makeClient(
      {
        'sale.order.fields_view_get': { arch: FORM_ARCH },
        'sale.order.fields_get': { display_name: {}, name: {}, state: {} },
        'sale.order.read': (args: any[], kwargs: any) =>
          kwargs.fields.includes('state')
            ? [{ id: 42, state: 'draft' }]
            : [{ id: 42, display_name: 'SO0042' }],
        'sale.order.action_confirm': true,
      },
      15
    );

    const result = await executeMethod(makeManager(client, audit), {
      model: 'sale.order', method: 'action_confirm', ids: [42], justification: 'Legacy instance',
    } as any);

    expect(result.executed).toBe(true);
  });

  it('records honestly when no snapshot is possible', async () => {
    const client = makeClient({
      'x.gadget.get_view': { arch: '<form><button name="action_go" type="object"/></form>' },
      'x.gadget.fields_get': { display_name: {}, name: {} },
      'x.gadget.read': [{ id: 5, display_name: 'Gadget' }],
      'x.gadget.action_go': true,
    });

    const result = await executeMethod(makeManager(client, audit), {
      model: 'x.gadget', method: 'action_go', ids: [5], justification: 'Kick off the gadget',
    } as any);

    expect(result.preflight.snapshottable).toBe(false);
    expect(result.state_change.before).toBeNull();
    expect(audit.logLocalAction).toHaveBeenCalledWith(
      'execute_method', 'x.gadget', 5,
      expect.objectContaining({ snapshot_unavailable_reason: expect.stringContaining('state fields') }),
      'Kick off the gadget'
    );
  });
});
