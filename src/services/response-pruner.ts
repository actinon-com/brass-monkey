/**
 * Utility to prune and compress Odoo responses for context efficiency.
 */
export class ResponsePruner {
  /**
   * Recursively prunes an object to minimize token usage.
   * - Minifies XML/HTML strings (strips newlines and redundant whitespace).
   * - Strips empty strings/objects if they don't add value (optional, but keeping it lossless for now).
   */
  static prune(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.prune(item));
    }

    if (typeof data === 'object') {
      const pruned: any = {};
      for (const [key, value] of Object.entries(data)) {
        // We keep 'false' values as requested for 'lossless' compression, 
        // but we prune the content of the values.
        pruned[key] = this.prune(value);
      }
      return pruned;
    }

    if (typeof data === 'string') {
      return this.minifyString(data);
    }

    return data;
  }

  /**
   * Minifies strings, especially XML/HTML content which is common in Odoo.
   */
  private static minifyString(str: string): string {
    // 1. Handle literal escape sequences that might be returned as part of the string
    let minified = str.replace(/\\n/g, ' ').replace(/\\r/g, ' ');

    // 2. Check if it looks like XML/HTML
    if (minified.includes('<') && minified.includes('>')) {
      return minified
        .replace(/>\s+</g, '><') // Remove whitespace between tags
        .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
        .replace(/[\n\r]+/g, '') // Remove actual newlines
        .trim();
    }

    // 3. Standard string cleaning (remove actual newlines and redundant spaces)
    return minified.replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }
}
