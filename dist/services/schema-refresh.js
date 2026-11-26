import { MetadataCache } from './metadata-cache.js';
import { buildModelMetadata } from './metadata-resolver.js';
/**
 * Keeping brass-monkey's copy of a model's fields in step with Odoo.
 *
 * The metadata cache lives for the session and was never refreshed, so after a
 * module upgrade mid-session the copy stayed wrong and `inspect_model` repeated
 * it. When Odoo (or the domain check) rejects a field, brass-monkey now
 * re-reads the model once — what the agent would otherwise do by hand — and
 * says what is actually wrong.
 *
 * Re-reads are rate-limited per model so an agent repeating the same mistake
 * does not hammer the Odoo API: at most one automatic re-read per model every
 * REFRESH_INTERVAL_MS. `inspect_model(refresh: true)` is explicit and always runs.
 */
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
/** Last automatic re-read per model, keyed by the unscoped client (one per Odoo instance). */
let lastRefresh = new WeakMap();
function rootOf(client) {
    return client?.root ?? client;
}
/**
 * Claims the right to re-read `model` now. Returns false if it was re-read
 * within the interval, so the caller must make do with what it has.
 */
export function claimRefresh(client, model, now = Date.now()) {
    const key = rootOf(client);
    let perModel = lastRefresh.get(key);
    if (!perModel) {
        perModel = new Map();
        lastRefresh.set(key, perModel);
    }
    const last = perModel.get(model);
    if (last !== undefined && now - last < REFRESH_INTERVAL_MS)
        return false;
    perModel.set(model, now);
    return true;
}
/** Test hook: forget all re-read times. */
export function resetRefreshLimits() {
    lastRefresh = new WeakMap();
}
/**
 * Re-reads a model's fields from Odoo, replacing every cached copy of it.
 * Not rate-limited: callers decide (claimRefresh, or an explicit request).
 */
export async function refreshModelMetadata(client, instanceAlias, model) {
    const cache = MetadataCache.getInstance();
    cache.invalidateModel(model);
    const metadata = await buildModelMetadata(client, model, instanceAlias);
    cache.set(instanceAlias, model, metadata);
    return metadata;
}
/**
 * Pulls the rejected field out of an Odoo "invalid field" error, across the
 * wordings Odoo versions use:
 *   - `Invalid field 'x_foo' on model 'account.move'`         (read, read_group, older domains)
 *   - `Invalid field account.move.x_foo in leaf ('x_foo', …)`  (17/18 domains)
 *   - `Invalid field account.move.x_foo in condition (…)`      (19 domains)
 * The model in the message can differ from the model called: a dotted path
 * fails on the related model. Returns null for any other error, including
 * Odoo errors that merely mention a field.
 */
export function rejectedFieldName(message, calledModel) {
    const quoted = message.match(/Invalid field '([\w.]+)' on model '([\w.]+)'/);
    if (quoted)
        return { field: quoted[1], model: quoted[2] };
    const dotted = message.match(/Invalid field ([\w.]+) in (?:leaf|condition)/);
    if (dotted) {
        const token = dotted[1];
        const cut = token.lastIndexOf('.');
        if (cut === -1)
            return { field: token, model: calledModel };
        return { field: token.slice(cut + 1), model: token.slice(0, cut) };
    }
    return null;
}
/**
 * Works out why Odoo rejected `field` on `model`, re-reading the model once
 * (rate-limited), and returns advice for the agent.
 */
export async function diagnoseRejectedField(client, model, field) {
    const inspect = `inspect_model(model: "${model}")`;
    if (!claimRefresh(client, model)) {
        return `Odoo does not accept field '${field}' on ${model}. brass-monkey re-checked this model's fields in the last ${REFRESH_INTERVAL_MS / 60000} minutes, so it has not checked again. Check the name with '${inspect}'.`;
    }
    // Drop every cached copy so the next tool call rebuilds it from Odoo.
    MetadataCache.getInstance().invalidateModel(model);
    const loaded = await client.executeKw(model, 'fields_get', [], { attributes: ['type'] });
    if (loaded && field in loaded) {
        return `Odoo has field '${field}' on ${model}, but rejected how it was used in this call (for example a path through it, or grouping or filtering it in a way the field does not support). Change the call, not the field name.`;
    }
    const listed = await client.executeKw('ir.model.fields', 'search_read', [[['model', '=', model], ['name', '=', field]]], {
        fields: ['name', 'modules'],
        limit: 1,
    });
    if (listed && listed.length > 0) {
        const modules = listed[0].modules ? ` (defined by: ${listed[0].modules})` : '';
        return `Odoo's field table lists '${field}' on ${model}${modules}, but the running Odoo does not have it loaded. The module that defines it probably needs upgrading in Odoo (Apps → Upgrade), or the server restarting. Retrying or refreshing will not fix this; tell the user.`;
    }
    return `Field '${field}' does not exist on ${model}. brass-monkey has refreshed its copy of this model; run '${inspect}' to see the valid fields.`;
}
//# sourceMappingURL=schema-refresh.js.map