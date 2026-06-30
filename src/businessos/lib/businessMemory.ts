// Business Memory — temporary, per-tab context for AI Command Center.
// Stored in sessionStorage so it survives navigation but not a closed tab.
// Used by the agent to resolve pronouns like "isko", "this", "us".
//
// No backend, no DB. Pure frontend convenience.

export type ActiveCompany = {
  id: string;
  company_name: string;
  company_number?: string | null;
} | null;

export type ActiveCustomer = {
  email: string;
  full_name?: string | null;
} | null;

const KEY_COMPANY = "os.cc.activeCompany";
const KEY_CUSTOMER = "os.cc.activeCustomer";

function safeGet<T>(key: string): T | null {
  try {
    const v = sessionStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch { return null; }
}
function safeSet(key: string, v: unknown) {
  try {
    if (v == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(v));
  } catch { /* ignore */ }
}

export function getActiveCompany(): ActiveCompany   { return safeGet<ActiveCompany>(KEY_COMPANY); }
export function setActiveCompany(c: ActiveCompany)  { safeSet(KEY_COMPANY, c); }
export function getActiveCustomer(): ActiveCustomer { return safeGet<ActiveCustomer>(KEY_CUSTOMER); }
export function setActiveCustomer(c: ActiveCustomer){ safeSet(KEY_CUSTOMER, c); }

export function clearBusinessMemory() {
  safeSet(KEY_COMPANY, null);
  safeSet(KEY_CUSTOMER, null);
}
