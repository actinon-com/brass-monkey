// Services
export * from './services/odoo-client.js';
export * from './services/instance-manager.js';
export * from './services/config-store.js';
export * from './services/credential-store.js';
export * from './services/audit-service.js';

export * from './services/skill-guard.js';
export * from './services/response-pruner.js';

// Tools
export * from './tools/setup_instance.js';
export * from './tools/list_instances.js';
export * from './tools/switch_instance.js';
export * from './tools/remove_instance.js';
export * from './tools/list_models.js';
export * from './tools/inspect_model.js';
export * from './tools/get_menu.js';
export * from './tools/get_action.js';
export * from './tools/get_view.js';
export * from './tools/search_read.js';
export * from './tools/create_record.js';
export * from './tools/write_record.js';
export * from './tools/unlink_record.js';
export * from './tools/list_reports.js';
export * from './tools/download_report.js';
export * from './tools/get_info.js';
export * from './tools/get_environment.js';
export * from './tools/trace_ui_path.js';
export * from './tools/aggregate_records.js';
export * from './tools/search_count.js';
export * from './tools/get_audit_log.js';
export * from './tools/activate_skill.js';

// The extension manifest will typically be handled by the Gemini CLI 
// by scanning the exported tools and the src/skills directory.
