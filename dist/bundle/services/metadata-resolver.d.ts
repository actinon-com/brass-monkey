import { ModelMetadata } from './metadata-cache.js';
/**
 * Registry of Expert Domains and their associated Odoo model prefixes
 * used to resolve skill gate breadcrumbs for model listings.
 */
export declare const SKILL_DOMAIN_MAP: Record<string, string[]>;
/**
 * Definitively identifies the origin module of a Odoo model using ir.model.data (XML ID).
 */
export declare function resolveBaseModule(client: any, modelId: number, moduleListStr: string): Promise<string>;
/**
 * Builds, categorizes, and resolves complete metadata layout for a model,
 * including auto-detecting the "Belonging Relation" and background warming parent modules.
 */
export declare function buildModelMetadata(client: any, model: string, instanceAlias?: string): Promise<ModelMetadata>;
