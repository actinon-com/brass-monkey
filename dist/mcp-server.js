import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { InstanceManager } from "./services/instance-manager.js";
import { ConfigStore } from "./services/config-store.js";
import { CredentialStore } from "./services/credential-store.js";
import { ResponsePruner } from "./services/response-pruner.js";
import * as schemas from "./tools/schemas.js";
import * as tools from "./index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Read package.json for metadata
let version = "1.6.1";
try {
    // Try both possible locations (source vs bundled)
    const pkgPaths = [
        path.resolve(__dirname, "../package.json"),
        path.resolve(__dirname, "../../package.json")
    ];
    const pkgPath = pkgPaths.find(p => fs.existsSync(p));
    if (pkgPath) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        version = pkg.version;
    }
}
catch (e) {
    console.error("Warning: Could not read package.json version", e);
}
const server = new Server({
    name: "brass-monkey",
    version: version,
}, {
    capabilities: {
        tools: {},
    },
});
const configStore = new ConfigStore();
const credentialStore = new CredentialStore();
const instanceManager = new InstanceManager(configStore, credentialStore);
/**
 * Mapping of tool names to their implementation and metadata.
 */
const toolRegistry = {
    setup_instance: {
        handler: tools.setupInstance,
        schema: schemas.SETUP_INSTANCE_SCHEMA,
        description: "Configure and authenticate a new Odoo environment.",
        deps: 'both'
    },
    list_instances: {
        handler: tools.listInstances,
        schema: schemas.LIST_INSTANCES_SCHEMA,
        description: "Show all configured Odoo environments.",
        deps: 'config'
    },
    switch_instance: {
        handler: tools.switchInstance,
        schema: schemas.SWITCH_INSTANCE_SCHEMA,
        description: "Change the active Odoo instance for subsequent operations.",
        deps: 'manager'
    },
    remove_instance: {
        handler: tools.removeInstance,
        schema: schemas.REMOVE_INSTANCE_SCHEMA,
        description: "Delete an instance configuration and its credentials.",
        deps: 'both'
    },
    list_models: {
        handler: tools.listModels,
        schema: schemas.LIST_MODELS_SCHEMA,
        description: "List all available Odoo models. Use get_environment first to see if the relevant app is installed.",
        deps: 'manager'
    },
    inspect_model: {
        handler: tools.inspectModel,
        schema: schemas.INSPECT_MODEL_SCHEMA,
        description: "DENSE TOOL: Deeply audit a model's fields, relationships, and UI paths in one call. Use this before search_read if you don't know the schema.",
        deps: 'manager'
    },
    get_menu: {
        handler: tools.getMenu,
        schema: schemas.GET_MENU_SCHEMA,
        description: "Retrieve Odoo's menu structure. Use trace_ui_path for targeted discovery instead.",
        deps: 'manager'
    },
    get_action: {
        handler: tools.getAction,
        schema: schemas.GET_ACTION_SCHEMA,
        description: "Retrieve window actions. Prefer trace_ui_path for navigating to a specific model.",
        deps: 'manager'
    },
    get_view: {
        handler: tools.getView,
        schema: schemas.GET_VIEW_SCHEMA,
        description: "Fetch view XML/definitions. Use inspect_model (show_ui=true) to find view IDs first.",
        deps: 'manager'
    },
    search_records: {
        handler: tools.searchRecords,
        schema: schemas.SEARCH_RECORDS_SCHEMA,
        description: "Search for Odoo records. Returns a pagination envelope containing total matching count and display display-name mapping.",
        deps: 'manager'
    },
    get_record: {
        handler: tools.getRecord,
        schema: schemas.GET_RECORD_SCHEMA,
        description: "Retrieve a highly detailed 360-degree dashboard report for a single Odoo record, including sub-lines and chatter.",
        deps: 'manager'
    },
    get_records: {
        handler: tools.getRecords,
        schema: schemas.GET_RECORDS_SCHEMA,
        description: "Retrieve detailed reports for multiple Odoo records in batch.",
        deps: 'manager'
    },
    create_record: {
        handler: tools.createRecord,
        schema: schemas.CREATE_RECORD_SCHEMA,
        description: "Create new records in a specified model with audit logging.",
        deps: 'manager'
    },
    write_record: {
        handler: tools.writeRecord,
        schema: schemas.WRITE_RECORD_SCHEMA,
        description: "Update existing records with field-level tracking.",
        deps: 'manager'
    },
    unlink_record: {
        handler: tools.unlinkRecord,
        schema: schemas.UNLINK_RECORD_SCHEMA,
        description: "Delete records from the system.",
        deps: 'manager'
    },
    list_reports: {
        handler: tools.listReports,
        schema: schemas.LIST_REPORTS_SCHEMA,
        description: "List all available reports for a specific model.",
        deps: 'manager'
    },
    download_report: {
        handler: tools.downloadReport,
        schema: schemas.DOWNLOAD_REPORT_SCHEMA,
        description: "Generate and retrieve report data (e.g., PDFs).",
        deps: 'manager'
    },
    download_file: {
        handler: tools.downloadFile,
        schema: schemas.DOWNLOAD_FILE_SCHEMA,
        description: "Download any file or attachment from an Odoo database to the local workspace.",
        deps: 'manager'
    },
    get_info: {
        handler: tools.getInfo,
        schema: schemas.GET_INFO_SCHEMA,
        description: "Get version and environment information for the Brass-Monkey extension.",
        deps: 'manager'
    },
    get_environment: {
        handler: tools.getEnvironment,
        schema: schemas.GET_ENVIRONMENT_SCHEMA,
        description: "DENSE TOOL: Mandatory 'World Map' orientation. Provides server, user, company, and app context. Run this FIRST in every session.",
        deps: 'manager'
    },
    trace_ui_path: {
        handler: tools.traceUiPath,
        schema: schemas.TRACE_UI_PATH_SCHEMA,
        description: "DENSE TOOL: Discover exactly how to reach a model through the UI (Menus -> Actions -> Views).",
        deps: 'manager'
    },
    aggregate_records: {
        handler: tools.aggregateRecords,
        schema: schemas.AGGREGATE_RECORDS_SCHEMA,
        description: "Server-side grouping and aggregation (Pivot style). For simple counts, search_read with limit=0 is safer.",
        deps: 'manager'
    },
    get_audit_log: {
        handler: tools.getAuditLog,
        schema: schemas.GET_AUDIT_LOG_SCHEMA,
        description: "Retrieve recent local audit log entries for transparency.",
        deps: 'manager'
    },
};
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: Object.entries(toolRegistry).map(([name, { description, schema }]) => ({
            name,
            description,
            inputSchema: schema,
        })),
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = toolRegistry[name];
    if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    }
    try {
        // 2. Execute Tool
        let result;
        switch (tool.deps) {
            case 'both':
                result = await tool.handler(configStore, credentialStore, args);
                break;
            case 'config':
                result = await tool.handler(configStore, args);
                break;
            case 'manager':
                result = await tool.handler(instanceManager, args);
                break;
            default:
                throw new Error(`Internal error: unknown dependency pattern for tool ${name}`);
        }
        // 3. Compress Response (Minify internal strings/XML)
        const prunedResult = ResponsePruner.prune(result);
        return {
            content: [
                {
                    type: "text",
                    text: typeof prunedResult === 'string' ? prunedResult : JSON.stringify(prunedResult),
                },
            ],
            structuredContent: ResponsePruner.pack(prunedResult),
        };
    }
    catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: error.message || String(error),
                },
            ],
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Brass Monkey MCP Server running on stdio");
    // Handle clean shutdown
    const shutdown = async () => {
        console.error("Shutting down Brass Monkey MCP Server...");
        await server.close();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    // StdioServerTransport doesn't always exit the process on stdin close on Windows
    process.stdin.on("close", shutdown);
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map