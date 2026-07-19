import { getStore } from "@netlify/blobs";

// Realistic victim app: a production page whose content is stored in Netlify Blobs
// (a very common Jamstack pattern — CMS fragments, rendered partials, feature copy).
// The site owner writes `homepage_content` from a trusted deploy; this production
// function reads it from the site-wide store and renders it into the page.
export default async (req, context) => {
  let content = "<p>Loading content…</p>";
  try {
    const v = await getStore("production").get("homepage_content");
    if (v != null && v !== "") content = v;
  } catch (e) {
    content = "<p>content unavailable</p>";
  }
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Sponge — Home</title></head>
<body>
  <header><h1>Sponge</h1></header>
  <main id="content">${content}</main>
  <footer>© Sponge</footer>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
};
