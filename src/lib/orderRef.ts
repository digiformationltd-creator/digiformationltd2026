// Site-wide order reference generator.
// Format: {YY}{DDMM}-{REGION}-{PKG}-{NNNN}
//   YY     : 2-digit year
//   DDMM   : day + month
//   REGION : GB | US | INT (currency-driven; INT = neither)
//   PKG    : 3-letter package code (SIL/STA/GOL/etc.) — omitted if no package
//   NNNN   : zero-padded sequential order number from the DB
// Example: 261205-GB-SIL-0001

import { supabase } from "@/integrations/supabase/client";

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

function regionFrom(currency?: string): Region {
  if (!currency) return "INT";
  const c = currency.toUpperCase();
  if (c === "GBP") return "GB";
  if (c === "USD") return "US";
  return "INT";
}

export interface BuildOrderRefInput {
  service?: string;       // kept for API compat; no longer used in the ref
  packageName?: string;
  currency?: string;      // GBP | USD
  region?: Region;        // overrides currency-derived region
}

export async function buildOrderRef({ packageName, currency, region }: BuildOrderRefInput): Promise<string> {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const reg = region ?? regionFrom(currency);
  const pkg = pkgCode(packageName);

  let seq = 0;
  try {
    const { data, error } = await supabase.rpc("next_order_number");
    if (!error && data != null) seq = Number(data);
  } catch (_) { /* fall through */ }
  if (!seq) seq = Math.floor(Date.now() / 1000) % 10000; // fallback only

  const num = String(seq).padStart(4, "0");
  const parts = [`${yy}${dd}${mm}`, reg];
  if (pkg) parts.push(pkg);
  parts.push(num);
  return parts.join("-");
}
