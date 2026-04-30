import { z } from 'zod';
/**
 * Zod schema for list_reports tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export const ListReportsSchema = z.object({
    model: z.preprocess((val) => {
        if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
            return val[0];
        }
        return val;
    }, z.string()).describe('Technical model name (e.g., "sale.order")'),
    search_term: z.string().optional().describe('Optional filter for report name or technical name.'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to list Odoo reports for a specific model.
 * @param manager The InstanceManager instance.
 * @param input The ListReportsInput parameters.
 * @returns An array of report objects.
 */
export async function listReports(manager, input) {
    const { model, search_term, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    const domain = [['model', '=', model]];
    if (search_term) {
        domain.push('|', ['name', 'ilike', search_term], ['report_name', 'ilike', search_term]);
    }
    const reports = await client.executeKw('ir.actions.report', 'search_read', [domain], {
        fields: ['id', 'name', 'report_name', 'report_type', 'model'],
        order: 'name asc',
    });
    return reports.map((r) => ({
        id: r.id,
        name: r.name,
        report_name: r.report_name,
        report_type: r.report_type,
        model: r.model,
    }));
}
//# sourceMappingURL=list_reports.js.map