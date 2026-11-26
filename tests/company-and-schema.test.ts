import { describe, it, expect, vi, beforeEach } from 'vitest';
import xmlrpc from 'xmlrpc';
import { OdooClient } from '../src/services/odoo-client.js';
import { MetadataCache, ModelMetadata } from '../src/services/metadata-cache.js';
import {
  rejectedFieldName,
  diagnoseRejectedField,
  claimRefresh,
  resetRefreshLimits,
} from '../src/services/schema-refresh.js';
import { DomainValidationService } from '../src/services/domain-validator.js';
import { companyDependentNote } from '../src/services/company-scope.js';
import { writeRecord } from '../src/tools/write_record.js';
import { GetRecordSchema, GetRecordsSchema } from '../src/tools/get_record.js';
import { GET_RECORD_SCHEMA, GET_RECORDS_SCHEMA } from '../src/tools/schemas.js';

vi.mock('xmlrpc', () => ({
  default: {
    createSecureClient: vi.fn().mockImplementation(() => ({ methodCall: vi.fn() })),
  },
}));

/** An authenticated OdooClient whose execute_kw calls are answered by `route`. */
function makeClient(route: (model: string, method: string, args: any[], kwargs: any) => any) {
  const client = new OdooClient({ url: 'https://odoo.test', db: 'db', username: 'u', api_key: 'k' } as any);
  (client as any).uid = 7;
  (client as any).companyIds = [1, 23, 24];
  const objectClient = (xmlrpc.createSecureClient as any).mock.results.at(-1).value;
  const calls: { model: string; method: string; kwargs: any }[] = [];
  objectClient.methodCall.mockImplementation((_m: string, params: any[], cb: Function) => {
    const [, , , model, method, args, kwargs] = params;
    calls.push({ model, method, kwargs });
    try {
      cb(null, route(model, method, args, kwargs));
    } catch (e: any) {
      cb({ faultString: e.message });
    }
  });
  return { client, calls };
}

function meta(partial: Partial<ModelMetadata>): ModelMetadata {
  return {
    baseModule: 'base', id: 1, name: 'M', transient: false, modules: 'base', baseFields: ['id'],
    categorized: { base: {}, extended: {}, computed: {}, related: {}, relational: {}, lines: {} },
    ...partial,
  };
}

beforeEach(() => {
  MetadataCache.getInstance().clear();
  resetRefreshLimits();
});

// ---------------------------------------------------------------------------
// #98 — with_company
// ---------------------------------------------------------------------------
describe('with_company (#98)', () => {
  it('unscoped calls send all companies in their stored order', async () => {
    const { client, calls } = makeClient(() => []);
    await client.executeKw('product.template', 'read', [[1]], {});
    expect(calls[0].kwargs.context.allowed_company_ids).toEqual([1, 23, 24]);
  });

  it('puts the chosen company first and keeps the rest', async () => {
    const { client, calls } = makeClient(() => []);
    const scoped = await client.withCompany(23);
    await scoped.executeKw('product.template', 'write', [[1], { x: 1 }], {});
    expect(calls[0].kwargs.context.allowed_company_ids).toEqual([23, 1, 24]);
    expect(scoped.activeCompany).toBe(23);
    // The original client is unaffected.
    await client.executeKw('product.template', 'read', [[1]], {});
    expect(calls[1].kwargs.context.allowed_company_ids).toEqual([1, 23, 24]);
    expect(scoped.root).toBe(client);
  });

  it("refuses a company the user doesn't have", async () => {
    const { client } = makeClient(() => []);
    await expect(client.withCompany(99)).rejects.toThrow(/not one of this user's companies/);
  });

  it('names the company that company-dependent fields were written for', async () => {
    const { client } = makeClient((model) => (model === 'res.company' ? [{ id: 23, name: 'Anergy Pte Ltd' }] : []));
    const scoped = await client.withCompany(23);
    const md = meta({
      allFields: {
        name: { type: 'char' },
        project_template_id: { type: 'many2one', relation: 'project.project', companyDependent: true },
      },
    });
    const note = await companyDependentNote(scoped, md, ['name', 'project_template_id'], 'written');
    expect(note?.fields).toEqual(['project_template_id']);
    expect(note?.company).toEqual({ id: 23, name: 'Anergy Pte Ltd' });
    expect(note?.note).toMatch(/written for Anergy Pte Ltd \(23\) only/);
  });

  it('says nothing for a single-company user', async () => {
    const { client } = makeClient(() => []);
    (client as any).companyIds = [1];
    const md = meta({ allFields: { p: { type: 'many2one', companyDependent: true } } });
    expect(await companyDependentNote(client, md, ['p'], 'written')).toBeUndefined();
  });

  it('write_record snapshots and writes under the chosen company, and reports it', async () => {
    const { client, calls } = makeClient((model, method) => {
      if (model === 'res.company') return [{ id: 23, name: 'Anergy Pte Ltd' }];
      if (method === 'read') return [{ id: 5, project_template_id: false }];
      if (method === 'write') return true;
      return [];
    });
    MetadataCache.getInstance().set('default', 'product.template', meta({
      allFields: { project_template_id: { type: 'many2one', relation: 'project.project', companyDependent: true } },
    }));
    const audit = {
      logLocalAction: vi.fn(), formatWriteSnapshot: vi.fn().mockReturnValue(''),
      postChatterMessage: vi.fn(), logSystemEvent: vi.fn(),
    };
    const manager: any = { getClient: vi.fn().mockResolvedValue(client), getAudit: vi.fn().mockResolvedValue(audit) };

    const result: any = await writeRecord(manager, {
      model: 'product.template', id: 5, values: { project_template_id: 12 },
      justification: 'test', with_company: 23,
    } as any);

    const snapshot = calls.find(c => c.model === 'product.template' && c.method === 'read');
    const write = calls.find(c => c.model === 'product.template' && c.method === 'write');
    expect(snapshot?.kwargs.context.allowed_company_ids[0]).toBe(23);
    expect(write?.kwargs.context.allowed_company_ids[0]).toBe(23);
    expect(result.success).toBe(true);
    expect(result.company_dependent.company.id).toBe(23);
  });
});

// ---------------------------------------------------------------------------
// #99 — for_user_id removed
// ---------------------------------------------------------------------------
describe('for_user_id removed (#99)', () => {
  it('is no longer advertised or accepted', () => {
    expect((GET_RECORD_SCHEMA as any).properties.for_user_id).toBeUndefined();
    expect((GET_RECORDS_SCHEMA as any).properties.for_user_id).toBeUndefined();
    // An agent still sending it is not broken: the key is dropped.
    const parsed: any = GetRecordSchema.parse({ model: 'res.partner', res_id: 1, for_user_id: 5 });
    expect(parsed.for_user_id).toBeUndefined();
    expect((GetRecordsSchema.parse({ model: 'res.partner', for_user_id: 5 }) as any).for_user_id).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// #100 — honest field-error advice and automatic refresh
// ---------------------------------------------------------------------------
describe('rejectedFieldName (#100)', () => {
  it('reads the wordings Odoo versions use', () => {
    expect(rejectedFieldName("ValueError: Invalid field 'x_foo' on model 'account.move'", 'account.move'))
      .toEqual({ field: 'x_foo', model: 'account.move' });
    expect(rejectedFieldName("Invalid field account.move.x_xero_id in leaf ('x_xero_id', '!=', False)", 'account.move'))
      .toEqual({ field: 'x_xero_id', model: 'account.move' });
    // A path fails on the related model, not the one called.
    expect(rejectedFieldName("Invalid field res.partner.x_bar in condition ('partner_id.x_bar', '=', 1)", 'sale.order'))
      .toEqual({ field: 'x_bar', model: 'res.partner' });
  });

  it('ignores errors that merely mention a field', () => {
    expect(rejectedFieldName("Property name 'company_id' has to be used on a property field.", 'hr.employee')).toBeNull();
  });
});

describe('Odoo error advice (#100)', () => {
  it("passes the 'property field' error through without stale-schema advice", async () => {
    const { client, calls } = makeClient(() => {
      throw new Error("ValueError: Property name 'company_id' has to be used on a property field.");
    });
    const err = await client.executeKw('hr.employee', 'read_group', [[], [], ['employee_id.company_id']], {}).catch(e => e);
    expect(err.message).toContain('has to be used on a property field');
    expect(err.message).not.toMatch(/stale/i);
    expect(calls).toHaveLength(1); // no re-check for a non-field error
  });

  it('a field Odoo really lacks: refreshes once, then says so', async () => {
    const cache = MetadataCache.getInstance();
    cache.set('default', 'account.move', meta({}));
    cache.set('act', 'account.move', meta({}));
    const { client, calls } = makeClient((model, method) => {
      if (model === 'account.move' && method === 'search_read') throw new Error("ValueError: Invalid field 'x_nope' on model 'account.move'");
      if (method === 'fields_get') return { name: { type: 'char' } };
      if (model === 'ir.model.fields') return [];
      return [];
    });
    const err = await client.executeKw('account.move', 'search_read', [[['x_nope', '=', 1]]], {}).catch(e => e);
    expect(err.message).toMatch(/does not exist on account\.move/);
    expect(err.message).not.toMatch(/stale/i);
    // Every cached copy was dropped so the next call rebuilds it.
    expect(cache.get('default', 'account.move')).toBeNull();
    expect(cache.get('act', 'account.move')).toBeNull();
    expect(calls.map(c => c.method)).toEqual(['search_read', 'fields_get', 'search_read']);
  });

  it('a field in the field table but not loaded by Odoo: points at the module (issue #69)', async () => {
    const advice = await diagnoseRejectedField(
      { executeKw: async (model: string, method: string) => {
        if (method === 'fields_get') return { name: { type: 'char' } };
        if (model === 'ir.model.fields') return [{ name: 'x_xero_id', modules: 'ferry_migration' }];
      } },
      'account.move', 'x_xero_id'
    );
    expect(advice).toMatch(/running Odoo does not have it loaded/);
    expect(advice).toMatch(/ferry_migration/);
  });

  it('a field Odoo has: blames the usage, not the name', async () => {
    const advice = await diagnoseRejectedField(
      { executeKw: async () => ({ amount: { type: 'monetary' } }) }, 'account.move', 'amount'
    );
    expect(advice).toMatch(/rejected how it was used/);
  });

  it('repeated mistakes do not hammer the API', async () => {
    const executeKw = vi.fn().mockResolvedValue({});
    const client = { executeKw };
    await diagnoseRejectedField(client, 'account.move', 'x1');
    const after = executeKw.mock.calls.length;
    const advice = await diagnoseRejectedField(client, 'account.move', 'x2');
    expect(executeKw.mock.calls.length).toBe(after); // no further calls
    expect(advice).toMatch(/re-checked this model's fields in the last 5 minutes/);
  });

  it('the limit is per model and lapses after the interval', () => {
    const client = {};
    expect(claimRefresh(client, 'a', 0)).toBe(true);
    expect(claimRefresh(client, 'a', 1000)).toBe(false);
    expect(claimRefresh(client, 'b', 1000)).toBe(true);
    expect(claimRefresh(client, 'a', 5 * 60 * 1000 + 1)).toBe(true);
  });
});

describe('domain check refresh (#100)', () => {
  /** A client whose model now has `x_new` (installed after the cache was built). */
  function upgradedClient() {
    return {
      executeKw: vi.fn(async (model: string, method: string) => {
        if (model === 'ir.model') return [{ id: 1, name: 'Order', modules: 'sale', transient: false }];
        if (model === 'ir.model.data') return [{ module: 'sale' }];
        if (model === 'ir.model.fields' && method === 'fields_get') return {};
        if (model === 'ir.model.fields') return [
          { name: 'name', ttype: 'char', modules: 'sale', store: true },
          { name: 'x_new', ttype: 'char', modules: 'sale', store: true },
          { name: 'x_ghost', ttype: 'char', modules: 'sale', store: true },
        ];
        if (method === 'fields_get') return { name: { type: 'char' }, x_new: { type: 'char' } };
        return [];
      }),
    };
  }

  beforeEach(() => {
    MetadataCache.getInstance().set('default', 'sale.order', meta({ allFields: { name: { type: 'char' } } }));
  });

  it('re-reads the model once when a field is missing, then accepts it', async () => {
    const client = upgradedClient();
    const result = await DomainValidationService.validateAndHeal(client, 'sale.order', [['x_new', '=', 'a']], 'default');
    expect(result.success).toBe(true);
    expect(MetadataCache.getInstance().get('default', 'sale.order')?.allFields?.x_new).toBeDefined();
  });

  it('a field listed but not loaded gets the module advice, not "does not exist"', async () => {
    const client = upgradedClient();
    const result = await DomainValidationService.validateAndHeal(client, 'sale.order', [['x_ghost', '=', 'a']], 'default');
    expect(result.success).toBe(false);
    expect(result.errorPayload?.message).toMatch(/does not have it loaded/);
  });

  it('does not re-read again within the interval', async () => {
    const client = upgradedClient();
    await DomainValidationService.validateAndHeal(client, 'sale.order', [['typo_one', '=', 1]], 'default');
    const after = client.executeKw.mock.calls.length;
    const second = await DomainValidationService.validateAndHeal(client, 'sale.order', [['typo_two', '=', 1]], 'default');
    expect(second.success).toBe(false);
    expect(client.executeKw.mock.calls.length).toBe(after);
  });
});

describe('fields Odoo has not loaded stay off the read paths (#100, #69)', () => {
  it('get_record with show_extended does not request them; inspect_model lists them apart', async () => {
    const { getRecord } = await import('../src/tools/get_record.js');
    const { inspectModel } = await import('../src/tools/inspect_model.js');
    const reads: string[][] = [];
    const client = {
      executeKw: vi.fn(async (model: string, method: string, _args: any[], kwargs: any) => {
        if (model === 'ir.model') return [{ id: 1, name: 'Move', modules: 'account,ferry_migration', transient: false }];
        if (model === 'ir.model.data') return [{ module: 'account' }];
        if (model === 'ir.model.fields' && method === 'fields_get') return {};
        if (model === 'ir.model.fields') return [
          { name: 'name', ttype: 'char', modules: 'account', store: true },
          { name: 'x_ok', ttype: 'char', modules: 'ferry_migration', store: true },
          { name: 'x_xero_id', ttype: 'char', modules: 'ferry_migration', store: true },
        ];
        if (method === 'fields_get') return { name: { type: 'char' }, x_ok: { type: 'char' } };
        if (method === 'search_read') { reads.push(kwargs.fields); return [{ id: 3, name: 'INV/1', x_ok: 'a' }]; }
        return [];
      }),
    };
    const manager: any = { getClient: vi.fn().mockResolvedValue(client) };

    await getRecord(manager, { model: 'account.move', res_id: 3, show_extended: true } as any);
    expect(reads[0]).toContain('x_ok');
    expect(reads[0]).not.toContain('x_xero_id');

    const inspected: any = await inspectModel(manager, { model: 'account.move', show_extended: true } as any);
    expect(inspected.fields_not_loaded.fields).toEqual(['x_xero_id']);
    expect(inspected.fields.extended.x_xero_id).toBeUndefined();
  });
});
