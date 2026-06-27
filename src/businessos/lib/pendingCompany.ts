// Pending-information analyzer for managed_companies.
// Pure / read-only. Drives the Company Detail "Pending Information" panel,
// the global Dashboard "Pending Company Tasks" widget, and the suggested
// AI Quick Actions (which only PREPARE a Command Center prompt — nothing
// is executed automatically; the existing approval/state-machine flow
// remains the single point of execution).

export type Priority = 1 | 2 | 3 | 4 | 5; // 1 = highest

export type PendingItem = {
  key: string;             // stable key, used for dedupe
  label: string;           // human label, e.g. "Registered Address"
  icon: string;            // emoji tag for the quick action
  action: string;          // short button label, e.g. "Fill Address"
  priority: Priority;
  // Pre-built command text that, when opened in the AI Command Center,
  // maps cleanly to an existing intent in parseIntent().
  prompt: string;
};

const DAY = 24 * 60 * 60 * 1000;

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / DAY);
}

export type ManagedCompanyRow = {
  id: string;
  company_name?: string | null;
  company_number?: string | null;
  registered_address?: string | null;
  director?: string | null;
  sic_code?: string | null;
  incorporation_date?: string | null;
  confirmation_due?: string | null;
  accounts_filing_due?: string | null;
  address_expire?: string | null;
  utr_number?: string | null;
  auth_code?: string | null;
  status?: string | null;
};

// Returns the list of pending items for ONE managed company, sorted by
// priority (highest first). Only missing / overdue items are returned —
// completed fields are never listed.
export function analyzePending(c: ManagedCompanyRow): PendingItem[] {
  const items: PendingItem[] = [];
  const id = c.id;
  const name = c.company_name ?? "this company";

  if (!c.registered_address || !c.registered_address.trim()) {
    items.push({
      key: "registered_address",
      label: "Registered Address",
      icon: "🏠",
      action: "Fill Address",
      priority: 1,
      prompt: `Update registered address for company ${id} (${name}): `,
    });
  }

  if (!c.director || !c.director.trim()) {
    items.push({
      key: "director",
      label: "Director",
      icon: "👤",
      action: "Update Director",
      priority: 1,
      prompt: `Update company ${id} (${name}): set director to `,
    });
  }

  if (!c.company_number || !c.company_number.trim()) {
    items.push({
      key: "company_number",
      label: "Company Number",
      icon: "🏢",
      action: "Add Company Number",
      priority: 2,
      prompt: `Update company ${id} (${name}): set company_number to `,
    });
  }

  if (!c.sic_code || !c.sic_code.trim()) {
    items.push({
      key: "sic_code",
      label: "SIC Code",
      icon: "🏷️",
      action: "Add SIC",
      priority: 3,
      prompt: `Add note to company ${id} (${name}): research and confirm SIC code `,
    });
  }

  if (!c.utr_number || !c.utr_number.trim()) {
    items.push({
      key: "utr_number",
      label: "UTR Number",
      icon: "📄",
      action: "Add UTR",
      priority: 3,
      prompt: `Add note to company ${id} (${name}): record UTR number `,
    });
  }

  if (!c.auth_code || !c.auth_code.trim()) {
    items.push({
      key: "auth_code",
      label: "Authentication Code",
      icon: "🔑",
      action: "Add Auth Code",
      priority: 4,
      prompt: `Add note to company ${id} (${name}): record Companies House auth code `,
    });
  }

  if (!c.incorporation_date) {
    items.push({
      key: "incorporation_date",
      label: "Incorporation Date",
      icon: "📅",
      action: "Add Incorporation Date",
      priority: 4,
      prompt: `Update company ${id} (${name}): set incorporation_date to `,
    });
  }

  const confDays = daysUntil(c.confirmation_due);
  if (c.confirmation_due && confDays !== null && confDays <= 30) {
    items.push({
      key: "confirmation_due",
      label: confDays < 0
        ? `Confirmation Statement OVERDUE (${Math.abs(confDays)}d)`
        : `Confirmation Statement due in ${confDays}d`,
      icon: "📋",
      action: "Create Reminder",
      priority: confDays < 0 ? 1 : 2,
      prompt: `Create reminder: file confirmation statement for ${name} (${id}) due ${c.confirmation_due}`,
    });
  }

  const acctDays = daysUntil(c.accounts_filing_due);
  if (c.accounts_filing_due && acctDays !== null && acctDays <= 60) {
    items.push({
      key: "accounts_filing_due",
      label: acctDays < 0
        ? `Annual Accounts OVERDUE (${Math.abs(acctDays)}d)`
        : `Annual Accounts due in ${acctDays}d`,
      icon: "📊",
      action: "Create Reminder",
      priority: acctDays < 0 ? 1 : 2,
      prompt: `Create reminder: file annual accounts for ${name} (${id}) due ${c.accounts_filing_due}`,
    });
  }

  const addrDays = daysUntil(c.address_expire);
  if (c.address_expire && addrDays !== null && addrDays <= 45) {
    items.push({
      key: "address_expire",
      label: addrDays < 0
        ? `Registered Address EXPIRED (${Math.abs(addrDays)}d)`
        : `Registered Address renewal in ${addrDays}d`,
      icon: "🏠",
      action: "Create Reminder",
      priority: addrDays < 0 ? 1 : 2,
      prompt: `Create reminder: renew registered address for ${name} (${id}) expires ${c.address_expire}`,
    });
  }

  items.sort((a, b) => a.priority - b.priority);
  return items;
}

// Builds an admin URL that opens the AI Command Center with the prompt
// pre-filled. Execution still requires the admin to review the preview
// and click Execute — the protected approval flow is unchanged.
export function commandCenterUrl(prompt: string): string {
  return `/admin/automation/command-center?q=${encodeURIComponent(prompt)}`;
}
