import { ModelMetadata } from './metadata-cache.js';
/**
 * Definitively identifies the origin module of a Odoo model using ir.model.data (XML ID).
 */
export declare function resolveBaseModule(client: any, modelId: number, moduleListStr: string): Promise<string>;
/**
 * Builds, categorizes, and resolves complete metadata layout for a model,
 * including auto-detecting the "Belonging Relation" and background warming parent modules.
 */
export declare function buildModelMetadata(client: any, model: string, instanceAlias?: string): Promise<ModelMetadata>;
