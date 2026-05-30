import { InstanceManager } from '../src/services/instance-manager.js';
import { ConfigStore } from '../src/services/config-store.js';
import { CredentialStore } from '../src/services/credential-store.js';
import { aggregateRecords } from '../src/tools/aggregate_records.js';

async function run() {
  try {
    const configStore = new ConfigStore();
    const credentialStore = new CredentialStore();
    const manager = new InstanceManager(configStore, credentialStore);
    const client = await manager.getClient('default');

    console.log("Diagnostic 1: Executing read_group with domain as null...");
    try {
      await client.executeKw('project.task', 'read_group', [null as any, [], ['project_id']], { lazy: false });
    } catch (e: any) {
      console.log("Error 1 Result:", e.message || String(e));
    }

    console.log("\nDiagnostic 2: Executing read_group with domain as empty string...");
    try {
      await client.executeKw('project.task', 'read_group', ['' as any, [], ['project_id']], { lazy: false });
    } catch (e: any) {
      console.log("Error 2 Result:", e.message || String(e));
    }

    console.log("\nDiagnostic 3: Executing read_group with fields as null...");
    try {
      await client.executeKw('project.task', 'read_group', [[], null as any, ['project_id']], { lazy: false });
    } catch (e: any) {
      console.log("Error 3 Result:", e.message || String(e));
    }

  } catch (error: any) {
    console.error("Diagnostic failed:", error);
  }
}

run();
