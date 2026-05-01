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
        domain: { type: "array", items: { type: "any" }, description: 'Odoo domain filter (e.g., [["is_company", "=", true]])' },
        fields: { type: "array", items: { type: "string" }, description: "List of fields to read." },
        limit: { type: "number", description: "Maximum number of records to return." },
        order: { type: "string", description: 'Order by clause (e.g., "name asc").' },
        instance_alias: { type: "string", description: "Optional alias of the Odoo instance to use." },
    },
    required: ["model"],
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
//# sourceMappingURL=schemas.js.map