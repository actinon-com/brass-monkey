/**
 * Static JSON schemas for MCP tool discovery.
 * These are used instead of dynamic Zod conversion to avoid bundling issues.
 */
export const SETUP_INSTANCE_SCHEMA = {
    type: "object",
    properties: {
        alias: { type: "string", description: 'A unique name for this instance (e.g., "prod", "staging")' },
        url: { type: "string", description: "Odoo instance URL" },
        db: { type: "string", description: "Database name" },
        username: { type: "string", description: "Username/Email" },
        api_key: { type: "string", description: "Odoo External API Key or user password" },
    },
    required: ["alias"],
};
export const LIST_INSTANCES_SCHEMA = {
    type: "object",
    properties: {},
};
export const SWITCH_INSTANCE_SCHEMA = {
    type: "object",
    properties: {
        alias: { type: "string", description: "The alias of the Odoo instance to switch to." },
    },
    required: ["alias"],
};
export const REMOVE_INSTANCE_SCHEMA = {
    type: "object",
    properties: {
        alias: { type: "string", description: "The alias of the Odoo instance to remove." },
    },
    required: ["alias"],
};
export const LIST_MODELS_SCHEMA = {
    type: "object",
    properties: {
        search_term: { type: "string", description: 'Optional filter for model name or description (e.g., "sale")' },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
};
export const INSPECT_MODEL_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "res.partner")' },
        show_base: { type: "boolean", description: "Include standard 'Base' fields (Name, Active, ID, etc.)." },
        show_extended: { type: "boolean", description: "Include fields added by extension modules." },
        show_computed: { type: "boolean", description: "Include non-stored, calculated fields." },
        show_related: { type: "boolean", description: "Include mirror fields from related models." },
        show_lines: { type: "boolean", description: "Include One2many and Many2many field definitions." },
        show_relationships: { type: "boolean", description: "Include relational IDs (Many2one definitions)." },
        show_stats: { type: "boolean", description: "Include record counts (Active vs Archived) and storage metrics." },
        show_access: { type: "boolean", description: "Include Access Control Lists (ACLs) and Record Rules." },
        show_modules: { type: "boolean", description: "Include module lineage (Inheritance hierarchy)." },
        show_ui: { type: "boolean", description: "Include associated View XML IDs and Window Actions." },
        show_methods: { type: "boolean", description: "Include Server Actions and available execution points." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model"],
};
export const TRACE_UI_PATH_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "sale.order")' },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model"],
};
export const GET_MENU_SCHEMA = {
    type: "object",
    properties: {
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
};
export const GET_ACTION_SCHEMA = {
    type: "object",
    properties: {
        action_id: { type: "number", description: "The technical ID of the window action." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["action_id"],
};
export const GET_VIEW_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "res.partner")' },
        view_type: { type: "string", description: 'Type of view: "form", "list", "kanban", etc.' },
        view_id: { type: "number", description: "Optional specific view ID." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model"],
};
export const SEARCH_READ_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "res.partner")' },
        domain: { type: "array", items: {}, description: 'Odoo domain filter (e.g., [["is_company", "=", true]])' },
        fields: { type: "array", items: { type: "string" }, description: "List of fields to read. If empty, defaults to 'Base' fields." },
        include_extended: { type: "boolean", description: "If fields is empty, include fields from extension modules." },
        include_computed: { type: "boolean", description: "If fields is empty, include non-stored/calculated fields." },
        limit: { type: "number", description: "Maximum number of records to return." },
        order: { type: "string", description: 'Order by clause (e.g., "name asc").' },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model"],
};
export const AGGREGATE_RECORDS_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "account.move.line")' },
        domain: { type: "array", items: {}, description: 'Odoo domain filter (e.g., [["move_type", "=", "out_invoice"]])' },
        groupby: { type: "array", items: { type: "string" }, description: "Fields to group by. Use 'field:interval' for dates (e.g., 'date:month')." },
        fields: { type: "array", items: { type: "string" }, description: "Numeric/Monetary fields to aggregate (sum). Defaults to '__count'." },
        limit: { type: "number", description: "Maximum number of groups to return." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model", "groupby"],
};
export const GET_AUDIT_LOG_SCHEMA = {
    type: "object",
    properties: {
        limit: { type: "number", description: "Number of recent entries to retrieve." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
};
export const CREATE_RECORD_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "res.partner")' },
        values: { type: "object", description: "Field values for the new record." },
        justification: { type: "string", description: "Mandatory justification for audit logs." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model", "values", "justification"],
};
export const WRITE_RECORD_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "res.partner")' },
        id: { type: "number", description: "ID of the record to update." },
        values: { type: "object", description: "New field values." },
        justification: { type: "string", description: "Mandatory justification for audit logs." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model", "id", "values", "justification"],
};
export const UNLINK_RECORD_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "res.partner")' },
        id: { type: "number", description: "ID of the record to delete." },
        justification: { type: "string", description: "Mandatory justification for audit logs." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model", "id", "justification"],
};
export const LIST_REPORTS_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "res.partner")' },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model"],
};
export const DOWNLOAD_REPORT_SCHEMA = {
    type: "object",
    properties: {
        model: { type: "string", description: 'Technical name of the model (e.g., "res.partner")' },
        id: { type: "number", description: "Record ID to run report for." },
        report_name: { type: "string", description: 'Internal name of report (e.g. "sale.report_saleorder")' },
        output_path: { type: "string", description: "Optional local path to save the PDF." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model", "id", "report_name"],
};
export const GET_INFO_SCHEMA = {
    type: "object",
    properties: {},
};
export const GET_ENVIRONMENT_SCHEMA = {
    type: "object",
    properties: {
        show_security: { type: "boolean", description: "Include the current user's security groups and roles." },
        show_manifest: { type: "boolean", description: "Include a full list of all installed Odoo modules/apps." },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
};
//# sourceMappingURL=schemas.js.map