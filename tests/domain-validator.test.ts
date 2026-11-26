import { describe, it, expect, beforeEach } from 'vitest';
import { DomainValidationService } from '../src/services/domain-validator.js';
import { MetadataCache } from '../src/services/metadata-cache.js';

// Domains taken from the false rejections in issue #95 (act-env, Odoo 19).
const MODEL = 'ir.ui.menu';

function validate(domain: any[]) {
  // client is never used: metadata is pre-seeded in the cache.
  return DomainValidationService.validateAndHeal({}, MODEL, domain, 'default');
}

describe('DomainValidationService (#95)', () => {
  beforeEach(() => {
    const cache = MetadataCache.getInstance();
    cache.clear();
    cache.set('default', MODEL, {
      baseModule: 'base',
      id: 1,
      name: 'Menu',
      transient: false,
      modules: 'base',
      baseFields: ['id', 'name'],
      categorized: {
        base: {
          name: { type: 'char' },
          active: { type: 'boolean' },
          sequence: { type: 'integer' },
        },
        extended: {},
        computed: {},
        related: {},
        relational: { parent_id: { type: 'many2one', relation: 'ir.ui.menu' } },
        lines: { child_id: { type: 'one2many', relation: 'ir.ui.menu' } },
      },
      // Chatter/activity fields exist on the model but are not categorized.
      allFields: {
        name: { type: 'char' },
        active: { type: 'boolean' },
        sequence: { type: 'integer' },
        parent_id: { type: 'many2one', relation: 'ir.ui.menu' },
        child_id: { type: 'one2many', relation: 'ir.ui.menu' },
        activity_ids: { type: 'one2many', relation: 'mail.activity' },
        message_follower_ids: { type: 'one2many', relation: 'mail.followers' },
      },
    });
  });

  describe('implicit AND', () => {
    it('accepts two conditions with no operator', async () => {
      const r = await validate([['name', 'ilike', 'inter_company'], ['active', '=', true]]);
      expect(r.success).toBe(true);
    });

    it('accepts three conditions with no operator', async () => {
      const r = await validate([['name', '=', 'x'], ['active', 'in', [true, false]], ['sequence', '>', 1]]);
      expect(r.success).toBe(true);
    });

    it('accepts an OR group followed by a plain condition', async () => {
      const r = await validate(['|', ['name', '=', 'a'], ['name', '=', 'b'], ['active', '=', true]]);
      expect(r.success).toBe(true);
    });

    it('still rejects an operator left short of operands', async () => {
      const r = await validate(['|', ['name', '=', 'a']]);
      expect(r.success).toBe(false);
      expect(r.errorPayload?.message).toMatch(/Unbalanced operators/);
    });

    it('still rejects a trailing operator after a complete expression', async () => {
      const r = await validate([['name', '=', 'a'], '&']);
      expect(r.success).toBe(false);
    });
  });

  describe('dotted field paths', () => {
    it('accepts a path through a many2one', async () => {
      const r = await validate(['|', ['name', 'in', ['Applications']], ['parent_id.name', '=', 'Configuration']]);
      expect(r.success).toBe(true);
    });

    it('accepts a path through a one2many', async () => {
      const r = await validate([['child_id.name', 'ilike', 'x']]);
      expect(r.success).toBe(true);
    });

    it('rejects a path whose head does not exist, naming the head', async () => {
      const r = await validate([['nope_id.name', '=', 'x']]);
      expect(r.success).toBe(false);
      expect(r.errorPayload?.message).toContain("Field 'nope_id' does not exist");
    });

    it('rejects a path through a non-relational field', async () => {
      const r = await validate([['name.foo', '=', 'x']]);
      expect(r.success).toBe(false);
      expect(r.errorPayload?.message).toMatch(/not relational/);
    });
  });

  describe('operators', () => {
    it.each(['not like', 'not ilike', 'not =like', 'not =ilike', '=?', '<>', 'parent_of'])(
      'accepts %s',
      async (op) => {
        const r = await validate([['name', op, 'x']]);
        expect(r.success).toBe(true);
      }
    );

    it.each(['any', 'not any'])('accepts %s with a sub-domain', async (op) => {
      const r = await validate([['parent_id', op, [['name', '=', 'x']]]]);
      expect(r.success).toBe(true);
    });

    it('still rejects an unknown operator', async () => {
      const r = await validate([['name', 'contains', 'x']]);
      expect(r.success).toBe(false);
      expect(r.errorPayload?.message).toMatch(/Unsupported operator/);
    });
  });

  describe('chatter and activity fields', () => {
    it.each(['activity_ids', 'message_follower_ids'])('accepts %s', async (f) => {
      const r = await validate([[f, '!=', false]]);
      expect(r.success).toBe(true);
    });
  });

  it('still heals a string boolean', async () => {
    const r = await validate([['active', '=', 'true']]);
    expect(r.success).toBe(true);
    expect(r.healedDomain).toEqual([['active', '=', true]]);
  });
});
