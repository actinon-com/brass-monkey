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
    limit: { type: "number", description: "Maximum number of models to return (defaults to 50)." },
    offset: { type: "number", description: "Number of models to skip (for pagination, defaults to 0)." },
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
    parent_id: { type: "number", description: "Optional parent menu ID. If omitted and search_term is blank, returns top-level apps." },
    search_term: { type: "string", description: 'Optional filter for menu name (e.g., "Sales").' },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
};

export const GET_ACTION_SCHEMA = {
  type: "object",
  properties: {
    action_id: { type: "number", description: "The technical database ID of the Odoo action." },
    action_type: { type: "string", description: "Optional technical type (e.g., 'ir.actions.act_window'). If omitted, the server dynamically auto-resolves the exact model." },
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

export const SEARCH_RECORDS_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner", "project.task").' },
    domain: { type: "array", items: {}, description: 'Odoo domain filter. A list of triplets: [["field", "operator", value]]. Example: [["is_company", "=", true]]. MULTI-COMPANY TIP: By default, Brass-Monkey automatically injects allowed_company_ids so you see all authorized companies. To search within a specific company, always include [["company_id", "=", COMPANY_ID]].' },
    fields: { type: "array", items: { type: "string" }, description: "Optional explicit list of field names to retrieve. If omitted, returns lightweight Breadth fields." },
    limit: { type: "number", description: "Maximum number of records to return (defaults to 10)." },
    offset: { type: "number", description: "Number of records to skip (for pagination, defaults to 0)." },
    order: { type: "string", description: 'Order by clause (e.g., "name asc", "create_date desc").' },
    with_translations: { type: "boolean", description: "If True, translatable fields are enriched with their 'Forgiving' format (Matrix)." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model"],
  description: "Search for Odoo records. WARNING: DO NOT use this tool to inspect details of a single known record ID (you MUST use 'get_record' for 360-degree dashboards). DO NOT use this tool to sum, group, count, or average numeric fields (you MUST use 'aggregate_records' for server-side SQL-level summaries).",
};

export const GET_RECORD_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner"). Required if xml_id is not provided.' },
    res_id: { type: "number", description: "Database ID of the record. Required if xml_id is not provided." },
    xml_id: { type: "string", description: 'Technical XML ID (e.g., "base.user_admin"). Resolves model and ID.' },
    show_meta: { type: "boolean", description: "Include system metadata (creation/write dates and users)." },
    show_security: { type: "boolean", description: "Perform real-time access checks for the current user." },
    show_relationships: { type: "boolean", description: "Resolve display names for relational many2one fields." },
    show_extended: { type: "boolean", description: "Include fields from extension modules." },
    show_computed: { type: "boolean", description: "Include dynamically calculated fields." },
    show_related: { type: "boolean", description: "Include mirror fields from related models." },
    show_lines: { type: "boolean", description: "Resolve and include full data for x2many sub-line fields." },
    show_chatter: { type: "boolean", description: "Include message threads from Odoo Chatter." },
    include_binary: { type: "boolean", description: "Include raw base64 data for binary fields." },
    show_all_fields: { type: "boolean", description: "Force inclusion of EVERY field defined on the model." },
    for_user_id: { type: "number", description: "Evaluate security and data as a specific user ID." },
    rel_limit: { type: "number", description: "Limit the number of sub-lines or linked records resolved." },
    with_translations: { type: "boolean", description: "If True, translatable fields are returned in translation matrix." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  description: "MANDATORY for retrieving a comprehensive 360-degree dashboard report for a single Odoo record. Highly superior to search_records for single record lookups as it resolves sub-lines, relation display names, and chatter threads in one call. Use this immediately once you have a target record ID.",
};

export const GET_RECORDS_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (used for all res_ids).' },
    res_ids: { type: "array", items: { type: "number" }, description: 'JSON list of database IDs (e.g., "[1, 2]").' },
    xml_ids: { type: "array", items: { type: "string" }, description: 'JSON list of XML IDs (e.g., \'["base.user_admin"]\').' },
    show_meta: { type: "boolean", description: "Include system metadata." },
    show_security: { type: "boolean", description: "Perform real-time access checks." },
    show_relationships: { type: "boolean", description: "Resolve relational display names." },
    show_extended: { type: "boolean", description: "Include fields from extension modules." },
    show_computed: { type: "boolean", description: "Include dynamically calculated fields." },
    show_related: { type: "boolean", description: "Include mirror fields from related models." },
    show_lines: { type: "boolean", description: "Resolve and include full data for x2many sub-line fields." },
    show_chatter: { type: "boolean", description: "Include message threads from Odoo Chatter." },
    include_binary: { type: "boolean", description: "Include raw base64 data for binary fields." },
    show_all_fields: { type: "boolean", description: "Force inclusion of EVERY field defined on the model." },
    for_user_id: { type: "number", description: "Evaluate security and data as a specific user ID." },
    rel_limit: { type: "number", description: "Limit the number of sub-lines or linked records resolved." },
    with_translations: { type: "boolean", description: "If True, translatable fields are returned in translation matrix." },
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
    offset: { type: "number", description: "Number of groups to skip (for pagination)." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model", "groupby"],
  description: "Calculate database-level summaries, aggregations, counts, sums, or averages grouped by specified fields. MANDATORY: You MUST use this tool instead of querying lists of records with search_records and computing statistics locally.",
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
    values: { type: "object", description: "Dictionary of field values: {'field_name': value}. Use inspect_model to find writable fields. MULTI-COMPANY CRITICAL: Ensure you specify a valid 'company_id' in values that matches all relational fields (e.g. journals, accounts) to avoid Multi-Company Access/Validation Errors." },
    justification: { type: "string", description: "MANDATORY: Explain WHY this record is being created. This is logged to Odoo Chatter and local audit logs." },
    with_translations: { type: "boolean", description: "If True, translatable fields can be provided as strings (sync to all) or expanded lists." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model", "values", "justification"],
  description: "Create new records in a specified model with audit logging. MULTI-COMPANY RULE: Ensure a correct 'company_id' is supplied in values. MANDATORY: Describe your intent and the specific values in the chat message BEFORE calling this tool to ensure the user can read it clearly during approval.",
};

export const WRITE_RECORD_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: 'Technical name of the model (e.g., "res.partner").' },
    id: { type: "number", description: "The database ID of the record to update." },
    values: { type: "object", description: "Dictionary of fields to update. PRO TIP: We take a 'Before Snapshot' automatically for reversibility. MULTI-COMPANY CRITICAL: Do not mix records from different companies. Ensure any relational values linked match the record's company_id." },
    justification: { type: "string", description: "MANDATORY: Explain WHY this update is necessary. Logged for audit and safety." },
    with_translations: { type: "boolean", description: "If True, translatable fields can be provided as strings (sync to all) or expanded lists." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["model", "id", "values", "justification"],
  description: "Update existing records with field-level tracking. MULTI-COMPANY RULE: Verify relational safety across companies before writing. MANDATORY: Describe your intent and the specific values in the chat message BEFORE calling this tool to ensure the user can read it clearly during approval.",
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

export const DOWNLOAD_FILE_SCHEMA = {
  type: "object",
  properties: {
    model: { type: "string", description: "Technical name of the Odoo model containing the binary field (defaults to 'ir.attachment')." },
    res_id: { type: "number", description: "Database ID of the record containing the file field." },
    field: { type: "string", description: "The technical name of the binary field (e.g., 'datas' or 'raw', defaults to 'datas')." },
    destination_path: { type: "string", description: "Absolute local file path where the file should be saved." },
    justification: { type: "string", description: "Business justification for downloading this file." },
    instance_alias: { type: "string", description: "Optional alias to use an instance other than the active one." },
  },
  required: ["res_id", "destination_path", "justification"],
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
