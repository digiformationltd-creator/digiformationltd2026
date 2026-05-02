#!/usr/bin/env node
// Auto-syncs blog post slugs from src/data/blog.ts into public/sitemap.xml
// AND refreshes <lastmod> on every <url>. Runs before `vite build`.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const BLOG_FILE = path.join(ROOT, "src", "data", "blog.ts");
const SITEMAP = path.join(ROOT, "public", "sitemap.xml");
const MARK_START = "  <!-- Blog Posts (auto-generated) -->";
const MARK_END = "  <!-- /Blog Posts (auto-generated) -->";

const TODAY = new Date().toISOString().split("T")[0];

function getSlugs() {
  const tsx = fs.readFileSync(BLOG_FILE, "utf8");
  return [...tsx.matchAll(/slug:\s*["'](.*?)["']/g)].map((m) => m[1]);
}

function buildBlock(slugs) {
  const urls = slugs
    .map(
      (s) =>
        `  <url><loc>https://digiformation.uk/blog/${s}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    )
    .join("\n");
  return `${MARK_START}\n${urls}\n${MARK_END}`;
}

function refreshLastmod(xml) {
  // Ensure every <url> has a <lastmod>; refresh if present.
  return xml.replace(/<url>([\s\S]*?)<\/url>/g, (full, inner) => {
    let updated = inner;
    if (/<lastmod>.*?<\/lastmod>/.test(updated)) {
      updated = updated.replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${TODAY}</lastmod>`);
    } else if (/<loc>.*?<\/loc>/.test(updated)) {
      updated = updated.replace(/(<loc>.*?<\/loc>)/, `$1<lastmod>${TODAY}</lastmod>`);
    }
    return `<url>${updated}</url>`;
  });
}

function syncSitemap() {
  let xml = fs.readFileSync(SITEMAP, "utf8");
  const slugs = getSlugs();
  const block = buildBlock(slugs);

  if (xml.includes(MARK_START) && xml.includes(MARK_END)) {
    const re = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`);
    xml = xml.replace(re, block);
  } else if (xml.includes(MARK_START)) {
    xml = xml.replace(/  <!-- Blog Posts[\s\S]*?(?=<\/urlset>)/, `${block}\n`);
  } else {
    xml = xml.replace("</urlset>", `\n${block}\n</urlset>`);
  }

  xml = refreshLastmod(xml);

  fs.writeFileSync(SITEMAP, xml);
  console.log(`✓ sitemap.xml synced (${slugs.length} blog posts, lastmod=${TODAY})`);
}

syncSitemap();
