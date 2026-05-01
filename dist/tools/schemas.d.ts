/**
 * Static JSON schemas for MCP tool discovery.
 * These are used instead of dynamic Zod conversion to avoid bundling issues.
 */
export declare const SETUP_INSTANCE_SCHEMA: {
    type: string;
    properties: {
        alias: {
            type: string;
            description: string;
        };
        url: {
            type: string;
            description: string;
        };
        db: {
            type: string;
            description: string;
        };
        username: {
            type: string;
            description: string;
        };
        api_key: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const LIST_INSTANCES_SCHEMA: {
    type: string;
    properties: {};
};
export declare const SWITCH_INSTANCE_SCHEMA: {
    type: string;
    properties: {
        alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const REMOVE_INSTANCE_SCHEMA: {
    type: string;
    properties: {
        alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const LIST_MODELS_SCHEMA: {
    type: string;
    properties: {
        search_term: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
};
export declare const INSPECT_MODEL_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const GET_MENU_SCHEMA: {
    type: string;
    properties: {
        instance_alias: {
            type: string;
            description: string;
        };
    };
};
export declare const GET_ACTION_SCHEMA: {
    type: string;
    properties: {
        action_id: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const GET_VIEW_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        view_type: {
            type: string;
            description: string;
        };
        view_id: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const SEARCH_READ_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        domain: {
            type: string;
            items: {};
            description: string;
        };
        fields: {
            type: string;
            items: {
                type: string;
            };
            description: string;
        };
        limit: {
            type: string;
            description: string;
        };
        order: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const CREATE_RECORD_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        values: {
            type: string;
            description: string;
        };
        justification: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const WRITE_RECORD_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        id: {
            type: string;
            description: string;
        };
        values: {
            type: string;
            description: string;
        };
        justification: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const UNLINK_RECORD_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        id: {
            type: string;
            description: string;
        };
        justification: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const LIST_REPORTS_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const DOWNLOAD_REPORT_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        id: {
            type: string;
            description: string;
        };
        report_name: {
            type: string;
            description: string;
        };
        output_path: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
export declare const GET_INFO_SCHEMA: {
    type: string;
    properties: {};
};
