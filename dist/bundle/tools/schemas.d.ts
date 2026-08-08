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
        limit: {
            type: string;
            description: string;
        };
        offset: {
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
        show_base: {
            type: string;
            description: string;
        };
        show_extended: {
            type: string;
            description: string;
        };
        show_computed: {
            type: string;
            description: string;
        };
        show_related: {
            type: string;
            description: string;
        };
        show_lines: {
            type: string;
            description: string;
        };
        show_relationships: {
            type: string;
            description: string;
        };
        show_stats: {
            type: string;
            description: string;
        };
        show_access: {
            type: string;
            description: string;
        };
        show_modules: {
            type: string;
            description: string;
        };
        show_ui: {
            type: string;
            description: string;
        };
        show_methods: {
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
export declare const TRACE_UI_PATH_SCHEMA: {
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
        parent_id: {
            type: string;
            description: string;
        };
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
export declare const GET_ACTION_SCHEMA: {
    type: string;
    properties: {
        action_id: {
            type: string;
            description: string;
        };
        action_type: {
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
export declare const SEARCH_RECORDS_SCHEMA: {
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
        offset: {
            type: string;
            description: string;
        };
        order: {
            type: string;
            description: string;
        };
        with_translations: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
    description: string;
};
export declare const GET_RECORD_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        res_id: {
            type: string;
            description: string;
        };
        xml_id: {
            type: string;
            description: string;
        };
        show_meta: {
            type: string;
            description: string;
        };
        show_security: {
            type: string;
            description: string;
        };
        show_relationships: {
            type: string;
            description: string;
        };
        show_extended: {
            type: string;
            description: string;
        };
        show_computed: {
            type: string;
            description: string;
        };
        show_related: {
            type: string;
            description: string;
        };
        show_lines: {
            type: string;
            description: string;
        };
        show_chatter: {
            type: string;
            description: string;
        };
        include_binary: {
            type: string;
            description: string;
        };
        show_all_fields: {
            type: string;
            description: string;
        };
        for_user_id: {
            type: string;
            description: string;
        };
        rel_limit: {
            type: string;
            description: string;
        };
        with_translations: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    description: string;
};
export declare const GET_RECORDS_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        res_ids: {
            type: string;
            items: {
                type: string;
            };
            description: string;
        };
        xml_ids: {
            type: string;
            items: {
                type: string;
            };
            description: string;
        };
        show_meta: {
            type: string;
            description: string;
        };
        show_security: {
            type: string;
            description: string;
        };
        show_relationships: {
            type: string;
            description: string;
        };
        show_extended: {
            type: string;
            description: string;
        };
        show_computed: {
            type: string;
            description: string;
        };
        show_related: {
            type: string;
            description: string;
        };
        show_lines: {
            type: string;
            description: string;
        };
        show_chatter: {
            type: string;
            description: string;
        };
        include_binary: {
            type: string;
            description: string;
        };
        show_all_fields: {
            type: string;
            description: string;
        };
        for_user_id: {
            type: string;
            description: string;
        };
        rel_limit: {
            type: string;
            description: string;
        };
        with_translations: {
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
export declare const AGGREGATE_RECORDS_SCHEMA: {
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
        groupby: {
            type: string;
            items: {
                type: string;
            };
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
        offset: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
    description: string;
};
export declare const GET_AUDIT_LOG_SCHEMA: {
    type: string;
    properties: {
        limit: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
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
        with_translations: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
    description: string;
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
        with_translations: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
    description: string;
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
    description: string;
};
export declare const EXECUTE_ACTION_SCHEMA: {
    type: string;
    properties: {
        action_id: {
            type: string;
            description: string;
        };
        model: {
            type: string;
            description: string;
        };
        ids: {
            type: string;
            description: string;
        };
        justification: {
            type: string;
            description: string;
        };
        dry_run: {
            type: string;
            description: string;
        };
        acknowledge_unsafe: {
            type: string;
            description: string;
        };
        allow_empty_recordset: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
    description: string;
};
export declare const EXECUTE_METHOD_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        method: {
            type: string;
            description: string;
        };
        ids: {
            type: string;
            description: string;
        };
        kwargs: {
            type: string;
            description: string;
        };
        justification: {
            type: string;
            description: string;
        };
        dry_run: {
            type: string;
            description: string;
        };
        acknowledge_unsafe: {
            type: string;
            description: string;
        };
        skip_view_validation: {
            type: string;
            description: string;
        };
        allow_empty_recordset: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
    required: string[];
    description: string;
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
export declare const DOWNLOAD_FILE_SCHEMA: {
    type: string;
    properties: {
        model: {
            type: string;
            description: string;
        };
        res_id: {
            type: string;
            description: string;
        };
        field: {
            type: string;
            description: string;
        };
        destination_path: {
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
export declare const GET_INFO_SCHEMA: {
    type: string;
    properties: {};
};
export declare const GET_ENVIRONMENT_SCHEMA: {
    type: string;
    properties: {
        show_security: {
            type: string;
            description: string;
        };
        show_manifest: {
            type: string;
            description: string;
        };
        instance_alias: {
            type: string;
            description: string;
        };
    };
};
export declare const ACTIVATE_SKILL_SCHEMA: {
    type: string;
    properties: {
        skill_name: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
