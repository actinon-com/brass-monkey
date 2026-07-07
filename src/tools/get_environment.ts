import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for get_environment tool input.
 */
export const GetEnvironmentSchema = z.object({
  show_security: z.boolean().optional().default(false).describe("Include the current user's security groups and roles."),
  show_manifest: z.boolean().optional().default(false).describe("Include a full list of all installed Odoo modules/apps."),
  instance_alias: z.string().optional().describe("Optional alias of the Odoo instance to use."),
});

export type GetEnvironmentInput = z.infer<typeof GetEnvironmentSchema>;

/**
 * Dense Tool: Get a global 'World Map' of the current Odoo environment.
 * Provides server, user, and organization context in one call.
 */
export async function getEnvironment(manager: InstanceManager, input: GetEnvironmentInput) {
  const { show_security, show_manifest, instance_alias } = input;
  const client = await manager.getClient(instance_alias);

  // Ensure authenticated
  await client.authenticate();

  // 1. Get Version
  const version = (client as any).versionInfo || { server_version: `v${client.majorVersion}` };

  // 2. Get User Info
  const uid = client.activeUid;
  if (!uid) throw new Error("Not authenticated");

  const userData = await client.executeKw('res.users', 'read', [[uid]], {
    fields: ['name', 'login', 'lang', 'company_id', 'company_ids', 'groups_id']
  });
  const user = userData[0];

  // 3. Get Organization Info (Companies, Languages)
  const allCompanies = await client.executeKw('res.company', 'search_read', [[]], {
    fields: ['name', 'currency_id', 'country_id']
  });

  // Filter companies to only those the user actually has access to
  const accessibleCompanies = allCompanies.filter((c: any) => user.company_ids.includes(c.id));

  let languages: any[] = [];
  try {
    languages = await client.executeKw('res.lang', 'search_read', [[['active', '=', true]]], {
      fields: ['name', 'code']
    });
  } catch (e) {
    // res.lang might be restricted
  }

  const res: any = {
    server: {
      version: version.server_version,
      database: client.db,
      url: client.url,
      write_guard: client.writeGuard,
    },
    user: {
      id: uid,
      name: user.name,
      login: user.login,
      lang: user.lang,
      default_company: formatRelation(user.company_id),
      accessible_companies: accessibleCompanies.map((c: any) => ({
        id: c.id,
        name: c.name
      })),
    },
    organization: {
      companies: accessibleCompanies.map((c: any) => ({
        id: c.id,
        name: c.name,
        currency: formatRelation(c.currency_id),
        country: formatRelation(c.country_id),
      })),
      languages: languages.reduce((acc: any, l: any) => {
        acc[l.code] = l.name;
        return acc;
      }, {}),
    },
    session: {
      active_skills: [] as string[]
    }
  };

  if (show_security) {
    const groups = await client.executeKw('res.groups', 'read', [user.groups_id], {
      fields: ['full_name']
    });
    res.user.security_groups = groups.reduce((acc: any, g: any) => {
      acc[g.full_name] = g.id;
      return acc;
    }, {});
  }

  if (show_manifest) {
    const modules = await client.executeKw('ir.module.module', 'search_read', [[['state', '=', 'installed']]], {
      fields: ['name', 'shortdesc']
    });
    res.manifest = {
      count: modules.length,
      apps: modules.reduce((acc: any, m: any) => {
        acc[m.name] = m.shortdesc;
        return acc;
      }, {}),
    };
  }

  const companyList = res.user.accessible_companies.map((c: any) => `${c.name} (${c.id})`).join(', ');
  const summary = `🌍 WORLD MAP: Connected to Odoo ${res.server.version} (${res.server.database}) ${res.server.write_guard ? '🔒 WRITE_GUARD ACTIVE' : '🔓 NO GUARD'}.\n👤 USER: ${res.user.name} (${res.user.login})\n🏢 MULTI-COMPANY: Enabled. Accessible Companies: ${companyList}\n🔑 ACTIVE SKILLS: ${res.session.active_skills.join(', ') || 'none'}\n💡 TIP: You have global visibility. To filter for a specific company, use a domain: [('company_id', '=', ID)].`;

  return {
    summary,
    environment: res,
    active_context: {
      implicit_allowed_company_ids: user.company_ids,
      visibility_scope: "GLOBAL_CROSS_COMPANY",
      tip: "Brass-Monkey automatically injects 'allowed_company_ids' representing all your authorized companies into the context of every tool call. You have global read visibility. To filter for a specific company, always use an explicit domain filter, e.g., [['company_id', '=', ID]] or [['company_id', 'in', [ID1, ID2]]]."
    }
  };
}

/**
 * Helper to format Many2one relations for the agent.
 */
function formatRelation(val: any): string | null {
  if (Array.isArray(val) && val.length >= 2) {
    return val[1];
  }
  return val;
}
