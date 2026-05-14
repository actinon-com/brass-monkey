import { z } from 'zod';
/**
 * Zod schema for get_environment tool input.
 */
export const GetEnvironmentSchema = z.object({
    show_security: z.boolean().optional().default(false).describe("Include the current user's security groups and roles."),
    show_manifest: z.boolean().optional().default(false).describe("Include a full list of all installed Odoo modules/apps."),
    instance_alias: z.string().optional().describe("Optional alias of the Odoo instance to use."),
});
/**
 * Dense Tool: Get a global 'World Map' of the current Odoo environment.
 * Provides server, user, and organization context in one call.
 */
export async function getEnvironment(manager, guard, input) {
    const { show_security, show_manifest, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    // Ensure authenticated
    await client.authenticate();
    // 1. Get Version
    const version = client.versionInfo || { server_version: `v${client.majorVersion}` };
    // 2. Get User Info
    const uid = client.activeUid;
    if (!uid)
        throw new Error("Not authenticated");
    const userData = await client.executeKw('res.users', 'read', [[uid]], {
        fields: ['name', 'login', 'lang', 'company_id', 'company_ids', 'groups_id']
    });
    const user = userData[0];
    // 3. Get Organization Info (Companies, Languages)
    const allCompanies = await client.executeKw('res.company', 'search_read', [[]], {
        fields: ['name', 'currency_id', 'country_id']
    });
    // Filter companies to only those the user actually has access to
    const accessibleCompanies = allCompanies.filter((c) => user.company_ids.includes(c.id));
    let languages = [];
    try {
        languages = await client.executeKw('res.lang', 'search_read', [[['active', '=', true]]], {
            fields: ['name', 'code']
        });
    }
    catch (e) {
        // res.lang might be restricted
    }
    const res = {
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
            accessible_companies: accessibleCompanies.map((c) => ({
                id: c.id,
                name: c.name
            })),
        },
        organization: {
            companies: accessibleCompanies.map((c) => ({
                id: c.id,
                name: c.name,
                currency: formatRelation(c.currency_id),
                country: formatRelation(c.country_id),
            })),
            languages: languages.reduce((acc, l) => {
                acc[l.code] = l.name;
                return acc;
            }, {}),
        },
        session: {
            active_skills: guard.getActivated()
        }
    };
    if (show_security) {
        const groups = await client.executeKw('res.groups', 'read', [user.groups_id], {
            fields: ['full_name']
        });
        res.user.security_groups = groups.reduce((acc, g) => {
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
            apps: modules.reduce((acc, m) => {
                acc[m.name] = m.shortdesc;
                return acc;
            }, {}),
        };
    }
    const companyList = res.user.accessible_companies.map((c) => `${c.name} (${c.id})`).join(', ');
    const summary = `🌍 WORLD MAP: Connected to Odoo ${res.server.version} (${res.server.database}) ${res.server.write_guard ? '🔒 WRITE_GUARD ACTIVE' : '🔓 NO GUARD'}.\n👤 USER: ${res.user.name} (${res.user.login})\n🏢 MULTI-COMPANY: Enabled. Accessible Companies: ${companyList}\n🔑 ACTIVE SKILLS: ${res.session.active_skills.join(', ') || 'none'}\n💡 TIP: You have global visibility. To filter for a specific company, use a domain: [('company_id', '=', ID)].`;
    return {
        summary,
        environment: res
    };
}
/**
 * Helper to format Many2one relations for the agent.
 */
function formatRelation(val) {
    if (Array.isArray(val) && val.length >= 2) {
        return val[1];
    }
    return val;
}
//# sourceMappingURL=get_environment.js.map