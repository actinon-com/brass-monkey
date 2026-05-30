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

  public clear(): void {
    this.cache.clear();
  }
}
