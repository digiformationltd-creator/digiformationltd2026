// Site-wide order reference generator.
// Format: {REGION}{SERVICE}{YYMMDD}{NNNN}
//   REGION : GB | US | INT (currency / service derived)
//   SERVICE: short uppercase code (LTD, LLC, CS, AA, AD01, ITIN, ROA, VAT, PAYE, UTR, ORD)
//   YYMMDD : 2-digit year + month + day
//   NNNN   : zero-padded global sequence from DB (next_order_number)
// Example: GBLTD2605130001

import { supabase } from "@/integrations/supabase/client";

export type Region = "GB" | "US" | "INT";

// Map common service / package text → short code.
// Order matters: more specific keys first.
const SERVICE_CODE_RULES: Array<[RegExp, string]> = [
  [/confirmation\s*statement|\bcs01\b|\bcs\b/i, "CS"],
  [/annual\s*accounts|\baa\b/i, "AA"],
  [/ad01|change\s*of\s*registered\s*office|registered\s*office\s*change/i, "AD01"],
  [/registered\s*office\s*address|\broa\b/i, "ROA"],
  // Address services (virtual / business / mailing / director's service / trading address)
  [/address\s*services?|virtual\s*address|business\s*address|mailing\s*address|service\s*address|trading\s*address|director'?s?\s*service\s*address/i, "ADZ"],
  [/\bitin\b/i, "ITIN"],
  [/\butr\b/i, "UTR"],
  [/\bvat\b/i, "VAT"],
  [/\bpaye\b/i, "PAYE"],
  [/\bllc\b/i, "LLC"],
  [/uk\s*ltd|\bltd\b|limited\s*formation|company\s*formation/i, "LTD"],
  [/id\s*verification/i, "IDV"],
  [/dormant/i, "DORM"],
  [/strike\s*off/i, "SO"],
];

function serviceCodeFor(input?: string): string {
  if (!input) return "ORD";
  for (const [re, code] of SERVICE_CODE_RULES) {
    if (re.test(input)) return code;
  }
  // Fallback: first letters of first 2 words, uppercase, max 4 chars
  const letters = input.toUpperCase().replace(/[^A-Z ]/g, "").trim().split(/\s+/);
  const code = letters.slice(0, 2).map(w => w.slice(0, 2)).join("");
  return code || "ORD";
}

function regionFrom(currency?: string, serviceCode?: string): Region {
  // Service codes that imply region
  if (serviceCode === "LLC" || serviceCode === "ITIN") return "US";
  if (["LTD", "CS", "AA", "AD01", "ROA", "ADZ", "UTR", "VAT", "PAYE", "DORM", "SO", "IDV"].includes(serviceCode || "")) return "GB";
  if (!currency) return "INT";
  const c = currency.toUpperCase();
  if (c === "GBP") return "GB";
  if (c === "USD") return "US";
  return "INT";
}

export interface BuildOrderRefInput {
  service?: string;       // free-text service / page name
  packageName?: string;   // optional package name (kept for back-compat)
  currency?: string;      // GBP | USD
  region?: Region;        // explicit override
  serviceCode?: string;   // explicit override (e.g. "AD01")
}

export async function buildOrderRef({ service, packageName, currency, region, serviceCode }: BuildOrderRefInput): Promise<string> {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");

  const code = (serviceCode || serviceCodeFor(service || packageName)).toUpperCase();
  const reg = region ?? regionFrom(currency, code);

  let seq = 0;
  try {
    const { data, error } = await supabase.rpc("next_order_number");
    if (!error && data != null) seq = Number(data);
  } catch (_) { /* fall through */ }
  if (!seq) seq = Math.floor(Date.now() / 1000) % 10000; // fallback only

  const num = String(seq).padStart(4, "0");
  return `${reg}${code}${yy}${mm}${dd}${num}`;
}
