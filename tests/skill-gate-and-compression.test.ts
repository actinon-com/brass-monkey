import { describe, it, expect, beforeEach } from 'vitest';
import { ResponsePruner } from '../src/services/response-pruner.js';
import { SkillGuard } from '../src/services/skill-guard.js';

describe('ResponsePruner', () => {
  it('should minify XML strings', () => {
    const xml = `
      <form string="Partner">
        <sheet>
          <group>
            <field name="name"/>
          </group>
        </sheet>
      </form>
    `;
    const result = ResponsePruner.prune({ arch: xml });
    expect(result.arch).toBe('<form string="Partner"><sheet><group><field name="name"/></group></sheet></form>');
  });

  it('should collapse whitespace in standard strings', () => {
    const text = 'This is a   string with\nredundant   newlines and spaces.';
    const result = ResponsePruner.prune(text);
    expect(result).toBe('This is a string with redundant newlines and spaces.');
  });

  it('should handle literal escape sequences', () => {
    const text = 'Line 1\\nLine 2\\rLine 3';
    const result = ResponsePruner.prune(text);
    expect(result).toBe('Line 1 Line 2 Line 3');
  });

  it('should recursively prune arrays and objects', () => {
    const data = {
      items: [
        { xml: '  <tag>  \n  </tag>  ' },
        '  Just a   string  '
      ]
    };
    const result = ResponsePruner.prune(data);
    expect(result).toEqual({
      items: [
        { xml: '<tag></tag>' },
        'Just a string'
      ]
    });
  });
});

describe('SkillGuard', () => {
  let guard: SkillGuard;

  beforeEach(() => {
    guard = new SkillGuard();
  });

  it('should resolve required skills for models', () => {
    expect(guard.getRequiredSkill('sale.order')).toBe('odoo-sales');
    expect(guard.getRequiredSkill('account.move')).toBe('odoo-finance');
    expect(guard.getRequiredSkill('stock.picking')).toBe('odoo-inventory');
    expect(guard.getRequiredSkill('res.partner')).toBe('odoo-sales'); // sales is first match in our map
    expect(guard.getRequiredSkill('unknown.model')).toBeNull();
  });

  it('should block access if skill is not active', () => {
    expect(() => guard.validateAccess('search_read', { model: 'sale.order' }))
      .toThrow(/DOMAIN_LOCKED/);
  });

  it('should allow access if skill is active', () => {
    guard.activate('odoo-sales');
    expect(() => guard.validateAccess('search_read', { model: 'sale.order' }))
      .not.toThrow();
  });

  it('should exempt discovery tools from gating', () => {
    expect(() => guard.validateAccess('list_models', { model: 'sale.order' }))
      .not.toThrow();
    expect(() => guard.validateAccess('get_environment', {}))
      .not.toThrow();
  });

  it('should return activated skills', () => {
    guard.activate('odoo-sales');
    guard.activate('odoo-finance');
    expect(guard.getActivated()).toContain('odoo-sales');
    expect(guard.getActivated()).toContain('odoo-finance');
    expect(guard.getActivated().length).toBe(2);
  });
});
