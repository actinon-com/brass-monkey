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
}
