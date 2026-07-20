import { getStore } from "@netlify/blobs";

// Realistic victim app: a session-gated "who am I" endpoint. The site's login flow
// (not modeled here) sets a `sid` cookie and writes the session record to the
// site-wide Blobs store under `session:<sid>`. This function is the standard
// "fetch my account" call a logged-in SPA makes on every page load.
export default async (req, context) => {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)sid=([^;]+)/);
  if (!match) {
    return new Response(JSON.stringify({ error: "not authenticated" }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  const sid = decodeURIComponent(match[1]);
  let account = null;
  try {
    const raw = await getStore("production").get("session:" + sid);
    if (raw != null && raw !== "") account = JSON.parse(raw);
  } catch (e) {
    // fall through, account stays null
  }
  if (!account) {
    return new Response(JSON.stringify({ error: "invalid session" }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  return new Response(JSON.stringify(account), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};
