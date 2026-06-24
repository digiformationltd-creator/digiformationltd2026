/**
 * Category-based glass tint mapping for consistent card identity across the site.
 * Reference design: ID Verification card on Home Page (cyan glass).
 *
 * Each category has its own color identity; all share the same blur, radius,
 * border, shadow, hover lift, and transitions defined in index.css.
 */

export type GlassCategory =
  | "verification"   // Identity / ID Verification — cyan
  | "formation"      // UK LTD, US LLC, EIN, ITIN — emerald/green
  | "banking"        // Stripe, Wise, Tide, PayPal, etc. — purple
  | "compliance"     // Filings, statements, address — amber/gold
  | "web"            // Web dev, digital, e-commerce — pink/magenta
  | "ai"             // AI assistant / AI services — indigo
  | "premium"        // Premium packages / pricing highlight — gold
  | "stats"          // Statistics / metrics — teal
  | "support"        // Help, support, contact — sky blue
  | "warning"        // Warnings / urgent notices — red
  | "success"        // Success messages — green
  | "neutral";       // Default fallback — sky

export const glassTintFor = (category: GlassCategory): string => {
  switch (category) {
    case "verification": return "glass-tint-cyan";
    case "formation":    return "glass-tint-green";
    case "banking":      return "glass-tint-purple";
    case "compliance":   return "glass-tint-mustard";
    case "web":          return "glass-tint-pink";
    case "ai":           return "glass-tint-indigo";
    case "premium":      return "glass-tint-gold";
    case "stats":        return "glass-tint-teal";
    case "support":      return "glass-tint-sky";
    case "warning":      return "glass-tint-red";
    case "success":      return "glass-tint-green";
    case "neutral":      return "glass-tint-sky";
  }
};

/** Heuristic: infer category from a free-text label (route slug, section name, etc.) */
export const inferGlassCategory = (text: string): GlassCategory => {
  const t = text.toLowerCase();
  if (/(id[-\s]?ver|identity|kyc|diatf|verification)/.test(t)) return "verification";
  if (/(bank|payment|stripe|paypal|wise|payoneer|tide|airwallex|mollie|sunrate|worldfirst|wallester|zyla|grey|nsave|fintech)/.test(t)) return "banking";
  if (/(compliance|filing|annual|statement|psc|sic|director|address|registered office|change|legal|utr|tax)/.test(t)) return "compliance";
  if (/(web|website|shop|ecommerce|amazon|shopify|tiktok|ebay|digital|seo)/.test(t)) return "web";
  if (/(ai|assistant|chatbot)/.test(t)) return "ai";
  if (/(premium|gold|silver|platinum|package|pricing)/.test(t)) return "premium";
  if (/(stat|metric|number|growth|kpi)/.test(t)) return "stats";
  if (/(support|help|contact|ticket|faq)/.test(t)) return "support";
  if (/(warning|urgent|alert|deadline|overdue)/.test(t)) return "warning";
  if (/(success|complete|approved|paid|done)/.test(t)) return "success";
  if (/(formation|register|ltd|llc|ein|itin|company|incorporat)/.test(t)) return "formation";
  return "neutral";
};

/** Stable rotation across an index for mixed/neutral grids — keeps variety without randomness. */
const ROTATION: string[] = [
  "glass-tint-cyan",
  "glass-tint-green",
  "glass-tint-purple",
  "glass-tint-mustard",
  "glass-tint-pink",
  "glass-tint-indigo",
  "glass-tint-teal",
  "glass-tint-sky",
];
export const glassRotationTint = (i: number): string => ROTATION[i % ROTATION.length];
