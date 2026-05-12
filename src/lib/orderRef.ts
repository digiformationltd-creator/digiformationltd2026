// Site-wide order reference generator.
// Format: {YY}{DDMM}-{REGION}-{SVC}-{PKG}-{RAND}
//   YY     : 2-digit year
//   DDMM   : day + month
//   REGION : GB | US | INT (currency-driven; INT = neither)
//   SVC    : first 3 letters of the service name (UPPER, A-Z only)
//   PKG    : 3-letter package code (SIL/STA/GOL/etc.) — omitted if no package
//   RAND   : 4-char base36 to guarantee uniqueness
// Example: 261112-GB-LTD-SIL-K7Q3

export type Region = "GB" | "US" | "INT";

const PACKAGE_MAP: Record<string, string> = {
  starter: "STA",
  silver: "SIL",
  gold: "GOL",
  platinum: "PLA",
  premium: "PRE",
  basic: "BAS",
  standard: "STD",
  pro: "PRO",
  enterprise: "ENT",
};

function pkgCode(pkg?: string): string | null {
  if (!pkg) return null;
  const key = pkg.trim().toLowerCase();
  if (PACKAGE_MAP[key]) return PACKAGE_MAP[key];
  const letters = pkg.toUpperCase().replace(/[^A-Z]/g, "");
  return letters.slice(0, 3) || null;
}

function svcCode(service: string): string {
  // Strip "UK LTD Formation — England & Wales" → take first meaningful word
  const cleaned = service
    .replace(/^(uk|us|usa|u\.s\.|u\.k\.)\s+/i, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, " ")
    .trim();
  const first = cleaned.split(/\s+/)[0] || service.toUpperCase().replace(/[^A-Z]/g, "");
  return first.slice(0, 3) || "SVC";
}

function regionFrom(currency?: string): Region {
  if (!currency) return "INT";
  const c = currency.toUpperCase();
  if (c === "GBP") return "GB";
  if (c === "USD") return "US";
  return "INT";
}

export interface BuildOrderRefInput {
  service: string;
  packageName?: string;
  currency?: string; // GBP | USD
  region?: Region;   // overrides currency-derived region
}

export function buildOrderRef({ service, packageName, currency, region }: BuildOrderRefInput): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const reg = region ?? regionFrom(currency);
  const svc = svcCode(service);
  const pkg = pkgCode(packageName);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const parts = [`${yy}${dd}${mm}`, reg, svc];
  if (pkg) parts.push(pkg);
  parts.push(rand);
  return parts.join("-");
}
