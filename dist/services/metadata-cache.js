/**
 * Service to cache Odoo model layouts in memory during the active session.
 * Cuts N+1 query latency down to 0ms for default searches and model inspections.
 */
export class MetadataCache {
    static instance = null;
    cache = new Map();
    constructor() { }
    static getInstance() {
        if (!MetadataCache.instance) {
            MetadataCache.instance = new MetadataCache();
        }
        return MetadataCache.instance;
    }
    getKey(instanceAlias, model) {
        return `${instanceAlias || 'default'}:${model}`;
    }
    get(instanceAlias, model) {
        return this.cache.get(this.getKey(instanceAlias, model)) || null;
    }
    set(instanceAlias, model, metadata) {
        this.cache.set(this.getKey(instanceAlias, model), metadata);
    }
    clear() {
        this.cache.clear();
    }
}
//# sourceMappingURL=metadata-cache.js.map