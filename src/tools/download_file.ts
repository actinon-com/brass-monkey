import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { isAbsolute } from 'path';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for download_file tool input.
 */
export const DownloadFileSchema = z.object({
  model: z.string().default('ir.attachment').describe('Technical name of the Odoo model containing the binary field.'),
  res_id: z.coerce.number().describe('Database ID of the record containing the file field.'),
  field: z.string().default('datas').describe('The technical name of the binary field (e.g., "datas" or "raw").'),
  destination_path: z.string().describe('Absolute local file path where the file should be saved.'),
  justification: z.string().min(1).describe('Business justification for downloading this file.'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type DownloadFileInput = z.infer<typeof DownloadFileSchema>;

/**
 * Tool to download any file or attachment from an Odoo database to the local workspace.
 * @param manager The InstanceManager instance.
 * @param input The DownloadFileInput parameters.
 * @returns The absolute path to the saved file.
 */
export async function downloadFile(manager: InstanceManager, input: DownloadFileInput) {
  // Validate and parse the input using the schema to populate defaults
  const parsedInput = DownloadFileSchema.parse(input);
  const { model, res_id, field, destination_path, justification, instance_alias } = parsedInput;

  const client = await manager.getClient(instance_alias);
  const audit = await manager.getAudit(instance_alias);

  if (!isAbsolute(destination_path)) {
    throw new Error(`The destination_path must be an absolute path: ${destination_path}`);
  }

  // Fetch only the requested binary field
  const records = await client.executeKw(model, 'read', [[res_id], [field]]);

  if (!records || !records[0]) {
    throw new Error(`Record with ID ${res_id} not found in model ${model}`);
  }

  const record = records[0];
  const base64Data = record[field];

  if (base64Data === undefined || base64Data === null || base64Data === false || base64Data === '') {
    throw new Error(`Field '${field}' is empty or not present on record ${res_id} in model ${model}`);
  }

  if (typeof base64Data !== 'string') {
    throw new Error(`Field '${field}' on record ${res_id} in model ${model} did not return a valid base64-encoded string (got type ${typeof base64Data}).`);
  }

  const buffer = Buffer.from(base64Data, 'base64');
  await writeFile(destination_path, buffer);

  // Log the action for traceability
  await audit.logSystemEvent(`Downloaded file from model '${model}' ID ${res_id} field '${field}' to '${destination_path}': ${justification}`);

  return destination_path;
}
