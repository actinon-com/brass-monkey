import { z } from 'zod';
import { MetadataCache } from '../services/metadata-cache.js';
import { buildModelMetadata } from '../services/metadata-resolver.js';
/**
 * Zod schema for inspect_model tool input.
 * Full parity with original brass-compass flags for deep introspection.
 */
export const InspectModelSchema = z.object({
    model: z.string().describe('Technical model name (e.g., "res.partner")'),
    show_base: z.boolean().optional().default(true).describe("Include standard 'Base' fields (Name, Active, ID, etc.)."),
    show_extended: z.boolean().optional().default(false).describe("Include fields added by extension modules."),
    show_computed: z.boolean().optional().default(false).describe("Include non-stored, calculated fields."),
    show_related: z.boolean().optional().default(false).describe("Include mirror fields from related models."),
    show_lines: z.boolean().optional().default(false).describe("Include One2many and Many2many field definitions."),
    show_relationships: z.boolean().optional().default(false).describe("Include relational IDs (Many2one definitions)."),
    show_stats: z.boolean().optional().default(false).describe("Include record counts (Active vs Archived) and storage metrics."),
    show_access: z.boolean().optional().default(false).describe("Include Access Control Lists (ACLs) and Record Rules."),
    show_modules: z.boolean().optional().default(false).describe("Include module lineage (Inheritance hierarchy)."),
    show_ui: z.boolean().optional().default(false).describe("Include associated View XML IDs and Window Actions."),
    show_methods: z.boolean().optional().default(false).describe("Include Server Actions and available execution points."),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to perform a deep architectural audit of an Odoo model's definition.
 * Dynamically categorizes fields and discovers execution/UI entry points.
 * Fully optimized via in-memory MetadataCache.
 */
export async function inspectModel(manager, input) {
    const parsedInput = InspectModelSchema.parse(input);
    const { model, instance_alias, ...flags } = parsedInput;
    const client = await manager.getClient(instance_alias);
    const alias = instance_alias || 'default';
    // 1. Resolve and cache metadata (or load from cache)
    const cache = MetadataCache.getInstance();
    let metadata = cache.get(alias, model);
    if (!metadata) {
        metadata = await buildModelMetadata(client, model, alias);
        cache.set(alias, model, metadata);
    }
    const res = {
        identity: {
            model: model,
            description: metadata.name,
            base_module: metadata.baseModule,
            is_transient: metadata.transient,
        }
    };
    // Compile buckets based on requested flags
    const buckets = metadata.categorized;
    res.fields = {};
    if (flags.show_base)
        res.fields.base = buckets.base;
    if (flags.show_extended)
        res.fields.extended = buckets.extended;
    if (flags.show_computed)
        res.fields.computed = buckets.computed;
    if (flags.show_related)
        res.fields.related = buckets.related;
    if (flags.show_relationships)
        res.fields.relationships = buckets.relational;
    if (flags.show_lines)
        res.fields.lines = buckets.lines;
    // 3. Stats (if requested)
    if (flags.show_stats) {
        const total = await client.executeKw(model, 'search_count', [[]]);
        res.stats = { records: { total } };
        try {
            res.stats.records.active = await client.executeKw(model, 'search_count', [[['active', '=', true]]]);
            res.stats.records.archived = await client.executeKw(model, 'search_count', [[['active', '=', false]]]);
        }
        catch (e) { }
    }
    // 4. Methods (if requested)
    if (flags.show_methods) {
        const serverActions = await client.executeKw('ir.actions.server', 'search_read', [[['model_id', '=', metadata.id]]], {
            fields: ['name', 'state', 'usage']
        });
        res.execution_points = {
            server_actions: serverActions.reduce((acc, a) => {
                acc[a.name] = { state: a.state, usage: a.usage, id: a.id };
                return acc;
            }, {})
        };
        try {
            const vRecs = await client.executeKw('ir.ui.view', 'search_read', [[['model', '=', model], ['type', '=', 'form']]], {
                fields: ['arch_db'],
                limit: 5
            });
            const buttonMethods = new Set();
            for (const v of vRecs) {
                const matches = (v.arch_db || '').matchAll(/<button[^>]+name="([^"]+)"[^>]+type="object"/g);
                for (const match of matches) {
                    buttonMethods.add(match[1]);
                }
            }
            res.execution_points.button_methods = Array.from(buttonMethods).sort();
        }
        catch (e) { }
    }
    // 5. Access Control Lists (if requested)
    if (flags.show_access) {
        try {
            const acls = await client.executeKw('ir.model.access', 'search_read', [[['model_id', '=', metadata.id]]], {
                fields: ['group_id', 'perm_read', 'perm_write', 'perm_create', 'perm_unlink']
            });
            res.security = {
                acls: acls.map((a) => ({
                    group: a.group_id ? a.group_id[1] : 'Global',
                    read: a.perm_read, write: a.perm_write, create: a.perm_create, unlink: a.perm_unlink
                }))
            };
        }
        catch (e) { }
    }
    // 6. UI views and actions (if requested)
    if (flags.show_ui) {
        try {
            const views = await client.executeKw('ir.ui.view', 'search_read', [[['model', '=', model], ['inherit_id', '=', false]]], {
                fields: ['name', 'type', 'xml_id']
            });
            res.ui = {
                views: views.reduce((acc, v) => {
                    if (!acc[v.type])
                        acc[v.type] = {};
                    if (v.xml_id)
                        acc[v.type][v.xml_id] = v.name;
                    return acc;
                }, {})
            };
            const actions = await client.executeKw('ir.actions.act_window', 'search_read', [[['res_model', '=', model]]], {
                fields: ['name', 'xml_id', 'view_mode', 'domain']
            });
            res.ui.actions = actions.reduce((acc, a) => {
                if (a.xml_id) {
                    acc[a.xml_id] = { name: a.name, modes: a.view_mode, domain: a.domain || undefined };
                }
                return acc;
            }, {});
        }
        catch (e) { }
    }
    // 7. Inheritance lineage (if requested)
    if (flags.show_modules) {
        res.inheritance = { base_module: metadata.baseModule, lineage: (metadata.modules || '').split(',').map((mod) => mod.trim()) };
    }
    return res;
}
//# sourceMappingURL=inspect_model.js.map