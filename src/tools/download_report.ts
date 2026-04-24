import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { isAbsolute } from 'path';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for download_report tool input.
 */
export const DownloadReportSchema = z.object({
  report_id: z.number().describe('ID of the ir.actions.report record.'),
  record_ids: z.array(z.number()).describe('IDs of the business records to include in the report (e.g., [101]).'),
  destination_path: z.string().describe('Absolute local file path where the report should be saved (e.g., "C:/Users/me/Downloads/invoice.pdf").'),
  justification: z.string().min(1).describe('Business justification for downloading this report.'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type DownloadReportInput = z.infer<typeof DownloadReportSchema>;

/**
 * Tool to render and download an Odoo report to the local workspace.
 * @param manager The InstanceManager instance.
 * @param input The DownloadReportInput parameters.
 * @returns The absolute path to the saved report.
 */
export async function downloadReport(manager: InstanceManager, input: DownloadReportInput) {
  const { report_id, record_ids, destination_path, justification, instance_alias } = input;
  const client = await manager.getClient(instance_alias);
  const audit = await manager.getAudit(instance_alias);
  
  if (!isAbsolute(destination_path)) {
    throw new Error(`The destination_path must be an absolute path: ${destination_path}`);
  }

  // Trigger Odoo's render method (typically _render_qweb_pdf)
  const result = await client.executeKw('ir.actions.report', '_render_qweb_pdf', [report_id, record_ids]);

  if (!result || !result[0]) {
    throw new Error('Odoo failed to render the report (empty result).');
  }

  // Odoo returns a tuple: [base64_pdf_content, format]
  const base64Data = result[0];
  const buffer = Buffer.from(base64Data, 'base64');

  await writeFile(destination_path, buffer);

  // Log the action for traceability
  await audit.logSystemEvent(`Downloaded report ID ${report_id} for records ${record_ids.join(',')}: ${justification}`);

  return destination_path;
}
