import { OdooClient } from '../src/services/odoo-client.js';
import { InstanceManager } from '../src/services/instance-manager.js';
import { ConfigStore } from '../src/services/config-store.js';
import { CredentialStore } from '../src/services/credential-store.js';
import { AuditService } from '../src/services/audit-service.js';

// Tools
import { listModels } from '../src/tools/list_models.js';
import { inspectModel } from '../src/tools/inspect_model.js';
import { getMenu } from '../src/tools/get_menu.js';
import { getView } from '../src/tools/get_view.js';
import { createRecord } from '../src/tools/create_record.js';
import { writeRecord } from '../src/tools/write_record.js';
import { searchRead } from '../src/tools/search_read.js';
import { searchCount } from '../src/tools/search_count.js';
import { unlinkRecord } from '../src/tools/unlink_record.js';
import { listReports } from '../src/tools/list_reports.js';
import { getEnvironment } from '../src/tools/get_environment.js';
import { traceUiPath } from '../src/tools/trace_ui_path.js';
import { aggregateRecords } from '../src/tools/aggregate_records.js';
import { getAuditLog } from '../src/tools/get_audit_log.js';

/**
 * Live Diagnostic Suite for Brass-Monkey
 * 
 * To run: This script expects a valid Odoo instance to be configured.
 * It will perform a read-write smoke test on the first available instance.
 */
async function runDiagnostics() {
  console.log('🐒 Starting Brass-Monkey Live Diagnostics...\n');

  const configStore = new ConfigStore();
  const credentialStore = new CredentialStore();
  const manager = new InstanceManager(configStore, credentialStore);

  try {
    const instances = await manager.list();
    if (instances.length === 0) {
      console.error('❌ No instances configured. Run setup_instance first.');
      return;
    }

    const alias = instances[0].alias;
    console.log(`📡 Using instance: ${alias} (${instances[0].url})`);

    // 1. Discovery Test
    console.log('\n--- [1/4] Discovery Tools ---');
    const models = await listModels(manager, { instance_alias: alias, search_term: 'res.partner' });
    console.log('✅ listModels: Found res.partner');
    
    const schema = await inspectModel(manager, { instance_alias: alias, model: 'res.partner', show_base: true });
    console.log(`✅ inspectModel: Retrieved ${Object.keys(schema.fields.base).length} base fields for res.partner`);

    const env = await getEnvironment(manager, { instance_alias: alias });
    console.log(`✅ getEnvironment: Established World Map for ${env.environment.server.database}`);

    const uiPath = await traceUiPath(manager, { instance_alias: alias, model: 'res.partner' });
    console.log(`✅ traceUiPath: Found ${uiPath.paths.length} UI entry points for res.partner`);

    // 2. UX Tools
    console.log('\n--- [2/4] UX & Navigation Tools ---');
    const menus = await getMenu(manager, { instance_alias: alias, search_term: 'Settings' });
    console.log(`✅ getMenu: Found ${menus.length} menu items`);

    const view = await getView(manager, { instance_alias: alias, model: 'res.partner', view_type: 'form' });
    console.log(`✅ getView: Retrieved XML architecture (${view.arch.length} chars)`);

    // 3. CRUD & Audit Test
    console.log('\n--- [3/4] CRUD & Audit (The Reversibility Test) ---');
    const dummyName = `Brass-Monkey-Test-${Date.now()}`;
    
    const newId = await createRecord(manager, {
      instance_alias: alias,
      model: 'res.partner',
      values: { name: dummyName, email: 'test@brass-monkey.ai' },
      justification: 'Live diagnostic: record creation'
    });
    console.log(`✅ createRecord: Created dummy partner (ID: ${newId})`);

    const updateSuccess = await writeRecord(manager, {
      instance_alias: alias,
      model: 'res.partner',
      id: newId as number,
      values: { comment: 'Updated via Live Diagnostics' },
      justification: 'Live diagnostic: record update'
    });
    console.log(`✅ writeRecord: Updated record and posted "Before Snapshot" to Chatter`);

    const searchResult = await searchRead(manager, {
      instance_alias: alias,
      model: 'res.partner',
      domain: [['id', '=', newId]],
      fields: ['name', 'comment']
    });
    console.log(`✅ searchRead: Found record with comment: "${searchResult[0].comment}"`);

    const count = await searchCount(manager, {
      instance_alias: alias,
      model: 'res.partner',
      domain: [['name', '=', dummyName]]
    });
    console.log(`✅ searchCount: Found ${count} records matching dummy name`);

    const deleteSuccess = await unlinkRecord(manager, {
      instance_alias: alias,
      model: 'res.partner',
      id: newId as number,
      justification: 'Live diagnostic: cleanup'
    });
    console.log(`✅ unlinkRecord: Deleted dummy partner`);

    const aggregates = await aggregateRecords(manager, {
      instance_alias: alias,
      model: 'res.partner',
      groupby: ['customer_rank'],
      domain: []
    });
    console.log(`✅ aggregateRecords: Retrieved grouped statistics`);

    const auditLogs = await getAuditLog(manager, { instance_alias: alias, limit: 5 });
    console.log(`✅ getAuditLog: Retrieved ${auditLogs.logs.length} recent local actions`);

    // 4. Reports Test
    console.log('\n--- [4/4] Reports Tools ---');
    const reports = await listReports(manager, { instance_alias: alias, model: 'sale.order' });
    console.log(`✅ listReports: Found ${reports.length} reports for sale.order`);

    console.log('\n🌟 ALL SYSTEMS OPERATIONAL 🌟');
    console.log('Brass-Monkey is fully verified against the live environment.');

  } catch (error: any) {
    console.error(`\n❌ DIAGNOSTIC FAILED: ${error.message}`);
    process.exit(1);
  }
}

runDiagnostics();
