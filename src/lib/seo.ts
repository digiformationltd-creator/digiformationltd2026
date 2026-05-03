import { useEffect } from "react";

export type Crumb = { name: string; path: string };

export interface SeoOptions {
  title: string;
  description: string;
  keywords?: string;
  path?: string; // canonical path, defaults to current
  image?: string;
  type?: "website" | "article" | "product";
  breadcrumbs?: Crumb[];
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const ORG_NAME = "Digiformation Ltd";
const DEFAULT_IMAGE = "/og-image.jpg";

const upsertMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setName = (n: string, c: string) => upsertMeta(`meta[name="${n}"]`, "name", n, c);
const setProp = (p: string, c: string) => upsertMeta(`meta[property="${p}"]`, "property", p, c);

const setCanonical = (href: string) => {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
};

const setJsonLd = (id: string, data: unknown) => {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(data);
};

export const applySeo = (opts: SeoOptions) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = opts.path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const url = `${origin}${path}`;
  const image = opts.image ? (opts.image.startsWith("http") ? opts.image : `${origin}${opts.image}`) : `${origin}${DEFAULT_IMAGE}`;

  document.title = opts.title;
  setName("description", opts.description);
  if (opts.keywords) setName("keywords", opts.keywords);
  setName("robots", opts.noindex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
  setName("author", ORG_NAME);

  // Open Graph
  setProp("og:title", opts.title);
  setProp("og:description", opts.description);
  setProp("og:type", opts.type || "website");
  setProp("og:url", url);
  setProp("og:image", image);
  setProp("og:site_name", ORG_NAME);
  setProp("og:locale", "en_GB");

  // Twitter
  setName("twitter:card", "summary_large_image");
  setName("twitter:title", opts.title);
  setName("twitter:description", opts.description);
  setName("twitter:image", image);

  setCanonical(url);

  // Breadcrumbs JSON-LD
  if (opts.breadcrumbs && opts.breadcrumbs.length) {
    setJsonLd("ldjson-breadcrumbs", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: opts.breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: `${origin}${b.path}`,
      })),
    });
  }

  // Page-specific JSON-LD
  if (opts.jsonLd) {
    setJsonLd("ldjson-page", opts.jsonLd);
  }
};

export const useSeo = (opts: SeoOptions, deps: React.DependencyList = []) => {
  useEffect(() => {
    applySeo(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
