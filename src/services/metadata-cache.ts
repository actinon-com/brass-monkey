import { InstanceConfig } from './config-store.js';

export interface ModelMetadata {
  baseModule: string;
  id: number;
  name: string;
  transient: boolean;
  modules: string;
  baseFields: string[]; // High-signal base fields to read by default
  categorized: {
    base: Record<string, any>;
    extended: Record<string, any>;
    computed: Record<string, any>;
    related: Record<string, any>;
    relational: Record<string, any>;
    lines: Record<string, any>;
  };
  /**
   * Every field on the model, including the chatter/activity fields left out of
   * `categorized`. Used by domain validation, which must accept any real field.
   * Optional so older cache entries (and test fixtures) still type-check.
   */
  allFields?: Record<string, { type: string; relation?: string; companyDependent?: boolean }>;
  /**
   * Fields listed in Odoo's field table (`ir.model.fields`) that the running
   * Odoo does not have loaded (absent from `fields_get`). Usually a module whose
   * code and database disagree after an upgrade. Odoo rejects these in a domain.
   */
  tableOnlyFields?: string[];
}

/**
 * Service to cache Odoo model layouts in memory during the active session.
 * Cuts N+1 query latency down to 0ms for default searches and model inspections.
 */
export class MetadataCache {
  private static instance: MetadataCache | null = null;
  private cache = new Map<string, ModelMetadata>();

  private constructor() {}

  public static getInstance(): MetadataCache {
    if (!MetadataCache.instance) {
      MetadataCache.instance = new MetadataCache();
    }
    return MetadataCache.instance;
  }

  private getKey(instanceAlias: string, model: string): string {
    return `${instanceAlias || 'default'}:${model}`;
  }

  public get(instanceAlias: string, model: string): ModelMetadata | null {
    return this.cache.get(this.getKey(instanceAlias, model)) || null;
  }

  public set(instanceAlias: string, model: string, metadata: ModelMetadata): void {
    this.cache.set(this.getKey(instanceAlias, model), metadata);
  }

  /** Drops a model's entry under every alias, so the next use rebuilds it. */
  public invalidateModel(model: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.endsWith(`:${model}`)) this.cache.delete(key);
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}
