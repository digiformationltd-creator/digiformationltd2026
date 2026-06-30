// Phase 7 — Address Auto-Fill Agent
// Session-scoped draft staging for the existing AddressesTab. No DB writes
// happen here — the draft is materialised inside the live Address form and
// only persists when the admin clicks "Execute" (which calls the existing
// `client_addresses` insert/update path — never a new code path).

import { supabase } from "@/integrations/supabase/client";

export type Confidence = "high" | "medium" | "low";

// Fields that map 1:1 to columns on `public.client_addresses`. Other AI-extracted
// signals (building_name, building_number) are folded into address_line1 before
// staging — the existing form has no separate column for them.
export const ADDRESS_DRAFT_FIELDS = [
  "label", "service_type",
  "address_line1", "address_line2",
  "city", "county", "postcode", "country",
  "start_date", "expire_date",
] as const;

export type AddressDraftField = typeof ADDRESS_DRAFT_FIELDS[number];

export interface AddressDraftProposal {
  value: string | null;
  confidence?: Confidence;
}

export interface AddressDraft {
  id: string;
  userId: string;                       // client this address belongs to
  companyName?: string;
  matchAddressId?: string | null;       // existing address row this overlays, if any
  source?: string;
  proposed: Partial<Record<AddressDraftField, AddressDraftProposal>>;
  missing: string[];
  warnings: string[];
  createdAt: number;
}

const KEY = (id: string) => `os.addr.draft.${id}`;

function rid() {
  try { return crypto.randomUUID().slice(0, 8); }
  catch { return Math.random().toString(36).slice(2, 10); }
}

/** Build a draft from extracted AI fields. Missing/invalid values are dropped, never invented. */
export function buildAddressDraft(input: {
  userId: string;
  companyName?: string;
  matchAddressId?: string | null;
  source?: string;
  fields: Partial<Record<string, string | null>>;
  confidence?: Partial<Record<string, Confidence>>;
  missing?: string[];
  warnings?: string[];
}): AddressDraft {
  // Fold building_name / building_number into address_line1 if line1 is missing.
  const folded = { ...input.fields };
  if (!folded.address_line1) {
    const bits = [folded.building_name, folded.building_number, folded.street]
      .map((s) => (s ? String(s).trim() : ""))
      .filter(Boolean);
    if (bits.length) folded.address_line1 = bits.join(" ");
  }
  const proposed: AddressDraft["proposed"] = {};
  for (const k of ADDRESS_DRAFT_FIELDS) {
    const v = folded[k];
    if (v == null || String(v).trim() === "") continue;
    proposed[k] = { value: String(v).trim(), confidence: input.confidence?.[k] ?? "medium" };
  }
  return {
    id: rid(),
    userId: input.userId,
    companyName: input.companyName,
    matchAddressId: input.matchAddressId ?? null,
    source: input.source,
    proposed,
    missing: input.missing ?? [],
    warnings: input.warnings ?? [],
    createdAt: Date.now(),
  };
}

export function saveAddressDraft(d: AddressDraft) {
  try { sessionStorage.setItem(KEY(d.id), JSON.stringify(d)); } catch {}
}
export function getAddressDraft(id: string): AddressDraft | null {
  try { const s = sessionStorage.getItem(KEY(id)); return s ? JSON.parse(s) as AddressDraft : null; }
  catch { return null; }
}
export function clearAddressDraft(id: string) {
  try { sessionStorage.removeItem(KEY(id)); } catch {}
}

/** UK postcode regex — used only for an advisory warning, never to invent values. */
export function isValidUkPostcode(s: string | null | undefined): boolean {
  if (!s) return false;
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(String(s).trim());
}

/** Resolve "Haventon Ltd" → owning user_id. Mirrors companyDraft.resolveCompanyUserId. */
export async function resolveCompanyForAddress(name: string): Promise<{ userId: string; companyName: string } | null> {
  const n = (name || "").trim();
  if (!n) return null;
  const { data: c } = await supabase
    .from("client_company_details")
    .select("user_id, company_name")
    .ilike("company_name", n)
    .limit(1);
  if (c && c[0]?.user_id) return { userId: c[0].user_id, companyName: c[0].company_name || n };
  const { data: p } = await supabase
    .from("profiles")
    .select("id, full_name, company_name")
    .ilike("company_name", n)
    .limit(1);
  if (p && p[0]?.id) return { userId: p[0].id, companyName: p[0].company_name || n };
  return null;
}

export type AddressFieldStatus = "unchanged" | "new" | "changed";

export function addressFieldStatus(
  live: any,
  proposed: AddressDraftProposal | undefined,
): AddressFieldStatus {
  if (!proposed || proposed.value == null) return "unchanged";
  const cur = live == null ? "" : String(live).trim();
  const nxt = String(proposed.value).trim();
  if (!cur && nxt) return "new";
  if (cur && nxt && cur !== nxt) return "changed";
  return "unchanged";
}

export function addressToneClasses(status: AddressFieldStatus, confidence?: Confidence): string {
  if (status === "new")     return "bg-emerald-500/10 border-emerald-400/40 text-emerald-50";
  if (status === "changed") return "bg-amber-500/10 border-amber-400/40 text-amber-50";
  if (confidence === "low") return "bg-yellow-500/5 border-yellow-400/30 text-yellow-50";
  return "bg-white/[0.04] border-white/10 text-white/90";
}
