/**
 * Utility to prune and compress Odoo responses for context efficiency.
 */
export declare class ResponsePruner {
    /**
     * Recursively prunes an object to minimize token usage.
     * - Minifies XML/HTML strings (strips newlines and redundant whitespace).
     * - Strips empty strings/objects if they don't add value (optional, but keeping it lossless for now).
     */
    static prune(data: any): any;
    /**
     * Minifies strings, especially XML/HTML content which is common in Odoo.
     */
    private static minifyString;
    /**
     * Ensures the result is always a Record (object) for MCP structuredContent compatibility.
     * Odoo tools often return Arrays (searches) or Numbers (counts) which violate the
     * Record<string, unknown> constraint of the MCP structuredContent field.
     */
    static pack(data: any): Record<string, any>;
}
