import { supabase } from "@/integrations/supabase/client";
import { getRefCookie } from "@/components/RefCapture";

/**
 * Call after a user signs in / signs up. If a referral cookie exists and this
 * user is not already attributed, insert an affiliate_referrals row.
 * Safe to call multiple times (unique constraint on customer_user_id).
 */
export async function attributeReferralIfPresent(userId: string) {
  const ref = getRefCookie();
  if (!ref) return;
  // Find the affiliate this code belongs to
  const { data: aff } = await supabase
    .from("affiliate_profiles")
    .select("user_id, ref_code, status")
    .eq("ref_code", ref)
    .maybeSingle();
  if (!aff || aff.user_id === userId) return;
  // Insert; will silently fail if customer already attributed (unique on customer_user_id)
  await supabase
    .from("affiliate_referrals")
    .insert({
      ref_code: aff.ref_code,
      affiliate_user_id: aff.user_id,
      customer_user_id: userId,
    });
}

export const SERVICE_RATE_LIST = [
  // UK formation
  { category: "UK Ltd Formation", name: "Silver Package", retail: 140, currency: "GBP" },
  { category: "UK Ltd Formation", name: "Gold Package", retail: 150, currency: "GBP" },
  { category: "UK Ltd Formation", name: "Platinum Package", retail: 170, currency: "GBP" },
  { category: "UK Ltd Formation", name: "Diamond Package", retail: 349, currency: "GBP" },
  // Addresses
  { category: "Addresses", name: "Registered Office Address", retail: 40, currency: "GBP" },
  { category: "Addresses", name: "Business Service Address", retail: 60, currency: "GBP" },
  { category: "Addresses", name: "Director Service Address", retail: 24, currency: "GBP" },
  { category: "Addresses", name: "AD01 (Via Post)", retail: 100, currency: "GBP" },
  // Compliance
  { category: "UK Compliance", name: "Confirmation Statement", retail: 65, currency: "GBP" },
  { category: "UK Compliance", name: "Accounts Filing + CT600", retail: 125, currency: "GBP" },
  { category: "UK Compliance", name: "Companies House ID Verification", retail: 30, currency: "GBP" },
  { category: "UK Compliance", name: "Director Appoint / Remove", retail: 25, currency: "GBP" },
  { category: "UK Compliance", name: "Company Name Change", retail: 30, currency: "GBP" },
  // USA
  { category: "USA LLC", name: "Enhanced Package (+ State Fee)", retail: 150, currency: "USD" },
  { category: "USA LLC", name: "Elite Package (+ State Fee)", retail: 222, currency: "USD" },
  { category: "USA LLC", name: "Pro Package (+ State Fee)", retail: 333, currency: "USD" },
  { category: "USA LLC", name: "EIN Only", retail: 75, currency: "USD" },
  { category: "USA LLC", name: "ITIN Only", retail: 225, currency: "USD" },
];

export const COMMISSION_GBP = 15;
