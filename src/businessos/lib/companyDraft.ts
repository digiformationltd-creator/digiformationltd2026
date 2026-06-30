// Company Dashboard Draft — Phase 6
// ----------------------------------------------------------------------------
// Session-scoped staging area for AI-proposed company field changes.
// Nothing here writes to the database. The Company Dashboard reads the draft,
// overlays proposed values on the live record, highlights diffs and only
// commits when the admin clicks "Execute".
//
// Storage: sessionStorage (per browser tab) so opening multiple companies in
// different tabs cannot collide.

import { supabase } from "@/integrations/supabase/client";

/** Fields a draft may propose. Subset of `client_company_details` columns. */
export const DRAFT_FIELDS = [
  "company_name",
  "company_number",
  "director_name",
  "sic_code",
  "utr_number",
  "auth_code",
  "activation_code",
  "companies_house_personal_code",
  "registered_address",
  "correspondence_address",
  "incorporation_date",
  "address_start",
  "address_expire",
  "confirmation_due",
  "accounts_filing_due",
] as const;

export type DraftField = (typeof DRAFT_FIELDS)[number];
export type Confidence = "high" | "medium" | "low";

export type DraftProposal = {
  /** Proposed value. `null`/empty means "no proposal for this field". */
  value: string | null;
  /** AI confidence in the extraction. */
  confidence?: Confidence;
};

export type CompanyDraft = {
  id: string;
  /** profiles.user_id of the client whose company we are filling. */
  userId: string;
  /** Display label used in toasts / banner. */
  companyName: string;
  /** Source of the draft (free-form, used for the banner subtitle). */
  source: string;
  /** Per-field proposed values + confidence. */
  proposed: Partial<Record<DraftField, DraftProposal>>;
  /** Field names the AI flagged as missing / could not extract. */
  missing: string[];
  /** Optional warnings shown in the review panel. */
  warnings: string[];
  createdAt: string;
};

const KEY_PREFIX = "biz-os:company-draft:";

export function saveDraft(draft: CompanyDraft) {
  try {
    sessionStorage.setItem(KEY_PREFIX + draft.id, JSON.stringify(draft));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function getDraft(id: string): CompanyDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + id);
    if (!raw) return null;
    const d = JSON.parse(raw) as CompanyDraft;
    if (!d || !d.id || !d.userId) return null;
    return d;
  } catch {
    return null;
  }
}

export function clearDraft(id: string) {
  try {
    sessionStorage.removeItem(KEY_PREFIX + id);
  } catch {
    /* ignore */
  }
}

/**
 * Decide whether a proposed value is meaningfully different from the current
 * value in the live row. Treats null/undefined/"" as equivalent so an AI that
 * omits a field never marks the dashboard "changed".
 */
export function isFieldChanged(current: unknown, proposed: unknown): boolean {
  const norm = (v: unknown) => (v == null ? "" : String(v).trim());
  const a = norm(current);
  const b = norm(proposed);
  if (!b) return false; // no proposal → not a change
  return a !== b;
}

/** Compute draft status for a single field. */
export function fieldDraftStatus(
  current: unknown,
  proposal: DraftProposal | undefined,
): "unchanged" | "new" | "changed" {
  if (!proposal || proposal.value == null || String(proposal.value).trim() === "") return "unchanged";
  const cur = current == null ? "" : String(current).trim();
  if (!cur) return "new";
  if (cur === String(proposal.value).trim()) return "unchanged";
  return "changed";
}

/**
 * Resolve a free-text company name to a profiles.user_id we can navigate to.
 * Looks in `client_company_details` first (the source of truth for the
 * Company Dashboard), then falls back to `profiles.company_name`.
 *
 * Returns null when there is no confident single match.
 */
export async function resolveCompanyUserId(
  companyName: string,
): Promise<{ userId: string; companyName: string } | null> {
  const needle = companyName.trim();
  if (!needle) return null;

  // 1) Exact / ilike match on client_company_details.
  const ccd = await supabase
    .from("client_company_details")
    .select("user_id, company_name")
    .ilike("company_name", needle)
    .limit(2);

  if (!ccd.error && ccd.data && ccd.data.length === 1 && ccd.data[0].user_id) {
    return { userId: ccd.data[0].user_id, companyName: ccd.data[0].company_name ?? needle };
  }

  // 2) Partial ilike on client_company_details — single hit only.
  const ccdLike = await supabase
    .from("client_company_details")
    .select("user_id, company_name")
    .ilike("company_name", `%${needle}%`)
    .limit(2);

  if (!ccdLike.error && ccdLike.data && ccdLike.data.length === 1 && ccdLike.data[0].user_id) {
    return { userId: ccdLike.data[0].user_id, companyName: ccdLike.data[0].company_name ?? needle };
  }

  // 3) Fall back to profiles.company_name.
  const prof = await supabase
    .from("profiles")
    .select("user_id, company_name")
    .ilike("company_name", `%${needle}%`)
    .limit(2);

  if (!prof.error && prof.data && prof.data.length === 1 && prof.data[0].user_id) {
    return { userId: prof.data[0].user_id, companyName: prof.data[0].company_name ?? needle };
  }

  return null;
}

/**
 * Build a draft from a `{field: value}` map (e.g. AI extraction output) and
 * a per-field confidence map. Unknown fields are dropped silently.
 */
export function buildDraft(args: {
  userId: string;
  companyName: string;
  source: string;
  fields: Record<string, string | null | undefined>;
  confidence?: Record<string, Confidence>;
  missing?: string[];
  warnings?: string[];
}): CompanyDraft {
  const proposed: Partial<Record<DraftField, DraftProposal>> = {};
  for (const k of DRAFT_FIELDS) {
    const v = args.fields[k];
    if (v != null && String(v).trim() !== "") {
      proposed[k] = {
        value: String(v).trim(),
        confidence: args.confidence?.[k] ?? "medium",
      };
    }
  }
  return {
    id: (crypto as any).randomUUID?.() ?? `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: args.userId,
    companyName: args.companyName,
    source: args.source,
    proposed,
    missing: args.missing ?? [],
    warnings: args.warnings ?? [],
    createdAt: new Date().toISOString(),
  };
}
