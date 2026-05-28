import { describe, it, expect } from 'vitest';
import { ResponsePruner } from '../src/services/response-pruner.js';

describe('ResponsePruner.pack (MCP Structured Content Wrapping)', () => {
  it('should wrap arrays in an "items" object', () => {
    const data = [{ id: 1, name: 'Test' }];
    const packed = ResponsePruner.pack(data);
    expect(packed).toEqual({ items: data });
  });

  it('should wrap numbers in a "value" object', () => {
    const data = 42;
    const packed = ResponsePruner.pack(data);
    expect(packed).toEqual({ value: 42 });
  });

  it('should wrap strings in a "value" object', () => {
    const data = "Record created successfully";
    const packed = ResponsePruner.pack(data);
    expect(packed).toEqual({ value: data });
  });

  it('should wrap booleans in a "value" object', () => {
    const packed = ResponsePruner.pack(true);
    expect(packed).toEqual({ value: true });
  });

  it('should wrap null/undefined in a "value" object', () => {
    expect(ResponsePruner.pack(null)).toEqual({ value: null });
    expect(ResponsePruner.pack(undefined)).toEqual({ value: undefined });
  });

  it('should return existing objects as-is', () => {
    const data = { id: 10, state: 'draft' };
    const packed = ResponsePruner.pack(data);
    expect(packed).toBe(data);
    expect(packed).toEqual({ id: 10, state: 'draft' });
  });

  it('should handle complex pruned objects', () => {
    const data = { 
      metadata: { count: 1 },
      results: [{ name: 'Test' }]
    };
    const packed = ResponsePruner.pack(data);
    expect(packed).toBe(data);
  });
});

describe('ResponsePruner.prune (Minification)', () => {
    it('should minify XML strings', () => {
        const xml = `
            <form>
                <sheet>
                    <group>
                        <field name="name" />
                    </group>
                </sheet>
            </form>
        `;
        const pruned = ResponsePruner.prune(xml);
        expect(pruned).not.toContain('\n');
        expect(pruned).not.toContain('  ');
        expect(pruned).toBe('<form><sheet><group><field name="name" /></group></sheet></form>');
    });

    it('should collapse multiple spaces in standard strings', () => {
        const str = "This    is   a    test";
        const pruned = ResponsePruner.prune(str);
        expect(pruned).toBe("This is a test");
    });
});
