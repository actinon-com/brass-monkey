import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { InstanceManager } from "./services/instance-manager.js";
import { ConfigStore } from "./services/config-store.js";
import { CredentialStore } from "./services/credential-store.js";
import * as tools from "./index.js";
const server = new Server({
    name: "brass-monkey",
    version: "1.0.4",
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
        schema: tools.SetupInstanceSchema,
        description: "Configure and authenticate a new Odoo environment.",
        deps: 'both'
    },
    list_instances: {
        handler: tools.listInstances,
        schema: tools.ListInstancesSchema,
        description: "Show all configured Odoo environments.",
        deps: 'config'
    },
    switch_instance: {
        handler: tools.switchInstance,
        schema: tools.SwitchInstanceSchema,
        description: "Change the active Odoo instance for subsequent operations.",
        deps: 'manager'
    },
    remove_instance: {
        handler: tools.removeInstance,
        schema: tools.RemoveInstanceSchema,
        description: "Delete an instance configuration and its credentials.",
        deps: 'both'
    },
    list_models: {
        handler: tools.listModels,
        schema: tools.ListModelsSchema,
        description: "List all available Odoo models in the current instance.",
        deps: 'manager'
    },
    inspect_model: {
        handler: tools.inspectModel,
        schema: tools.InspectModelSchema,
        description: "Get detailed metadata about a model's fields, relationships, and constraints.",
        deps: 'manager'
    },
    get_menu: {
        handler: tools.getMenu,
        schema: tools.GetMenuSchema,
        description: "Retrieve the Odoo menu structure to understand navigation paths.",
        deps: 'manager'
    },
    get_action: {
        handler: tools.getAction,
        schema: tools.GetActionSchema,
        description: "Retrieve window actions that define how views are opened.",
        deps: 'manager'
    },
    get_view: {
        handler: tools.getView,
        schema: tools.GetViewSchema,
        description: "Fetch specific view definitions (form, tree, kanban) for a model.",
        deps: 'manager'
    },
    search_read: {
        handler: tools.searchRead,
        schema: tools.SearchReadSchema,
        description: "Search for records using Odoo domains and read specific fields.",
        deps: 'manager'
    },
    create_record: {
        handler: tools.createRecord,
        schema: tools.CreateRecordSchema,
        description: "Create new records in a specified model with audit logging.",
        deps: 'manager'
    },
    write_record: {
        handler: tools.writeRecord,
        schema: tools.WriteRecordSchema,
        description: "Update existing records with field-level tracking.",
        deps: 'manager'
    },
    unlink_record: {
        handler: tools.unlinkRecord,
        schema: tools.UnlinkRecordSchema,
        description: "Delete records from the system.",
        deps: 'manager'
    },
    list_reports: {
        handler: tools.listReports,
        schema: tools.ListReportsSchema,
        description: "List all available reports for a specific model.",
        deps: 'manager'
    },
    download_report: {
        handler: tools.downloadReport,
        schema: tools.DownloadReportSchema,
        description: "Generate and retrieve report data (e.g., PDFs).",
        deps: 'manager'
    },
};
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: Object.entries(toolRegistry).map(([name, { description, schema }]) => ({
            name,
            description,
            inputSchema: zodToJsonSchema(schema),
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
        return {
            content: [
                {
                    type: "text",
                    text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                },
            ],
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
    console.error("Brass-Monkey MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map