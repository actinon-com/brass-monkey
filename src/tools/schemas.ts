/**
 * Static JSON schemas for MCP tool discovery.
 * These are used instead of dynamic Zod conversion to avoid bundling issues.
 */

export const SETUP_INSTANCE_SCHEMA = {
  type: "object",
  properties: {
    alias: { type: "string", description: 'A unique name for this instance (e.g., "prod", "staging"). Use this alias in other tools to target this instance.' },
    url: { type: "string", description: "Odoo instance URL (e.g., https://my-company.odoo.com). No trailing slash." },
    db: { type: "string", description: "Database name. Find this on the Odoo selector page if unsure." },
    username: { type: "string", description: "Username or Email address for login." },
    api_key: { type: "string", description: "Odoo External API Key (recommended) or user password. SECURE: This is never logged." },
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
    alias: { type: "string", description: "The alias of the instance to set as active for all subsequent calls." },
  },
  required: ["alias"],
};

export const REMOVE_INSTANCE_SCHEMA = {
  type: "object",
  properties: {
    alias: { type: "string", description: "The alias of the Odoo instance to delete from local storage." },
  },
  required: ["alias"],
};

export const LIST_MODELS_SCHEMA = {
  type: "object",
  properties: {
    search_term: { type: "string", description: 'Filter models by technical name or description (e.g., "sale"). Use this to find the correct model name before searching.' },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
};

export const INSPECT_MODEL_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner"). MUST be exact.' },
    show_base: { type: "boolean", description: "Include standard Odoo fields (Name, ID, Create Date). Highly recommended for initial schema discovery." },
    show_extended: { type: "boolean", description: "Include fields added by custom or third-party modules." },
    show_computed: { type: "boolean", description: "Include calculated fields. Note: These may slow down search_read if not stored." },
    show_related: { type: "boolean", description: "Include 'mirror' fields from related records." },
    show_lines: { type: "boolean", description: "Include One2many and Many2many field definitions to understand record links." },
    show_relationships: { type: "boolean", description: "Include Many2one relational field definitions." },
    show_stats: { type: "boolean", description: "Include record counts (Active vs Archived). Use this for a quick high-level overview of data volume." },
    show_access: { type: "boolean", description: "Include Access Control Lists (ACLs) to verify if the current user can Create/Write/Delete." },
    show_modules: { type: "boolean", description: "Include the list of modules that define/extend this model." },
    show_ui: { type: "boolean", description: "Include associated View IDs (Form, List, Search) and Window Actions for UI navigation." },
    show_methods: { type: "boolean", description: "Include available Server Actions and methods triggered by UI buttons." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model"],
};

export const TRACE_UI_PATH_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "sale.order"). Use this to find out WHERE in the Odoo menu this model lives.' },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model"],
};

export const GET_MENU_SCHEMA = {
  type: "object",
  properties: {
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
};

export const GET_ACTION_SCHEMA = {
  type: "object",
  properties: {
    action_id: { type: "number", description: "The technical database ID of the ir.actions.act_window." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["action_id"],
};

export const GET_VIEW_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner").' },
    view_type: { type: "string", description: 'Type of view: "form", "list", "kanban", "search", etc.' },
    view_id: { type: "number", description: "Optional specific database ID of the view. If omitted, returns the default view for the type." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model"],
};

export const SEARCH_READ_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner").' },
    domain: { type: "array", items: {}, description: 'Odoo domain filter. A list of triplets: [["field", "operator", value]]. Example: [["is_company", "=", true]]. Use empty list [] for all records.' },
    fields: { type: "array", items: { type: "string" }, description: "List of field names to retrieve. PRO TIP: Use inspect_model first to find valid field names. If omitted, returns 'Base' fields." },
    include_extended: { type: "boolean", description: "If 'fields' is empty, include fields from extension modules." },
    include_computed: { type: "boolean", description: "If 'fields' is empty, include non-stored/calculated fields." },
    limit: { type: "number", description: "Maximum number of records to return. Keep low for performance unless batching." },
    order: { type: "string", description: 'Order by clause (e.g., "name asc", "create_date desc").' },
    with_translations: { type: "boolean", description: "If True, translatable fields are enriched with their 'Forgiving' format (Matrix)." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model"],
};

export const SEARCH_COUNT_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner").' },
    domain: { type: "array", items: {}, description: 'Odoo domain filter. Example: [["is_company", "=", true]]. Use this for simple record tallies instead of search_read.' },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model"],
};

export const AGGREGATE_RECORDS_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "account.move.line").' },
    domain: { type: "array", items: {}, description: 'Odoo domain filter. Example: [["move_type", "=", "out_invoice"]].' },
    groupby: { type: "array", items: { type: "string" }, description: "Fields to group by. Use 'field:interval' for dates (e.g., 'date:month'). REQUIRED for aggregation." },
    fields: { type: "array", items: { type: "string" }, description: "Numeric/Monetary fields to sum (e.g., ['price_total']). Defaults to '__count' (record count per group)." },
    limit: { type: "number", description: "Maximum number of groups to return." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model", "groupby"],
};

export const GET_AUDIT_LOG_SCHEMA = {
  type: "object",
  properties: {
    limit: { type: "number", description: "Number of recent local actions to retrieve for transparency and verification." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
};

export const CREATE_RECORD_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner").' },
    values: { type: "object", description: "Dictionary of field values: {'field_name': value}. Use inspect_model to find writable fields." },
    justification: { type: "string", description: "MANDATORY: Explain WHY this record is being created. This is logged to Odoo Chatter and local audit logs." },
    with_translations: { type: "boolean", description: "If True, translatable fields can be provided as strings (sync to all) or expanded lists." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model", "values", "justification"],
  description: "Create new records in a specified model with audit logging. MANDATORY: Describe your intent and the specific values in the chat message BEFORE calling this tool to ensure the user can read it clearly during approval.",
};

export const WRITE_RECORD_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner").' },
    id: { type: "number", description: "The database ID of the record to update." },
    values: { type: "object", description: "Dictionary of fields to update. PRO TIP: We take a 'Before Snapshot' automatically for reversibility." },
    justification: { type: "string", description: "MANDATORY: Explain WHY this update is necessary. Logged for audit and safety." },
    with_translations: { type: "boolean", description: "If True, translatable fields can be provided as strings (sync to all) or expanded lists." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model", "id", "values", "justification"],
  description: "Update existing records with field-level tracking. MANDATORY: Describe your intent and the specific values in the chat message BEFORE calling this tool to ensure the user can read it clearly during approval.",
};

export const UNLINK_RECORD_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner").' },
    id: { type: "number", description: "The database ID of the record to delete." },
    justification: { type: "string", description: "MANDATORY: Explain WHY this deletion is necessary. Deletions are hard to reverse; use with caution." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model", "id", "justification"],
  description: "Delete records from the system. MANDATORY: Describe your intent in the chat message BEFORE calling this tool to ensure the user can read it clearly during approval.",
};

export const LIST_REPORTS_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner"). Find available PDF reports like Invoices or Packing Slips.' },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model"],
};

export const DOWNLOAD_REPORT_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model.' },
    id: { type: "number", description: "Database ID of the record to generate the report for." },
    report_name: { type: "string", description: 'The technical name of the report (e.g., "account.report_invoice_with_payments"). Get this from list_reports.' },
    output_path: { type: "string", description: "Optional local path to save the PDF. If omitted, returns raw data (use with caution)." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
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
    show_security: { type: "boolean", description: "Include the current user's security groups and roles. Useful for troubleshooting 'Access Denied' errors." },
    show_manifest: { type: "boolean", description: "Include all installed Odoo modules. Use this to see if apps like 'crm' or 'sale' are available." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
};

export const ACTIVATE_SKILL_SCHEMA = {
  type: "object",
  properties: {
    skill_name: { type: "string", description: 'The name of the domain skill to activate (e.g., "odoo-sales").' },
  },
  required: ["skill_name"],
};
