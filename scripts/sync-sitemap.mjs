#!/usr/bin/env node
// Auto-syncs blog post slugs from src/data/blog.ts into public/sitemap.xml.
// Runs before `vite build` via the npm prebuild lifecycle hook.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const BLOG_FILE = path.join(ROOT, "src", "data", "blog.ts");
const SITEMAP = path.join(ROOT, "public", "sitemap.xml");
const MARK_START = "  <!-- Blog Posts (auto-generated) -->";
const MARK_END = "  <!-- /Blog Posts (auto-generated) -->";

function getSlugs() {
  const tsx = fs.readFileSync(BLOG_FILE, "utf8");
  return [...tsx.matchAll(/slug:\s*["'](.*?)["']/g)].map((m) => m[1]);
}

function buildBlock(slugs) {
  const urls = slugs
    .map(
      (s) =>
        `  <url><loc>https://digiformation.uk/blog/${s}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    )
    .join("\n");
  return `${MARK_START}\n${urls}\n${MARK_END}`;
}

function syncSitemap() {
  let xml = fs.readFileSync(SITEMAP, "utf8");
  const slugs = getSlugs();
  const block = buildBlock(slugs);

  if (xml.includes(MARK_START) && xml.includes(MARK_END)) {
    const re = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`);
    xml = xml.replace(re, block);
  } else if (xml.includes(MARK_START)) {
    // Legacy: had start marker only — strip everything after it before </urlset>
    xml = xml.replace(/  <!-- Blog Posts[\s\S]*?(?=<\/urlset>)/, `${block}\n`);
  } else {
    xml = xml.replace("</urlset>", `\n${block}\n</urlset>`);
  }
  fs.writeFileSync(SITEMAP, xml);
  console.log(`✓ sitemap.xml synced with ${slugs.length} blog posts`);
}

syncSitemap();
