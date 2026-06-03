export type NavItem = { name: string; path: string; price?: string };
export type NavGroup = { label: string; basePath?: string; items: NavItem[] };

export const ukServices: NavItem[] = [
  { name: "Register UK Limited Company", path: "/uk-services/uk-ltd-formation" },
  { name: "Companies House ID Verification", path: "/uk-services/ltd-id-verification" },
  { name: "Registered Office Address", path: "/uk-services/registered-office-address" },
  { name: "Confirmation Statement Filing", path: "/uk-services/company-annual-filing" },
  { name: "Get UTR Number (HMRC)", path: "/uk-services/utr-number" },
  { name: "Companies House Authentication Code", path: "/uk-services/auth-code" },
  { name: "Activation Code Service", path: "/uk-services/activation-code" },
  { name: "UK VAT Registration & Submission", path: "/uk-services/uk-vat-registration" },
];

export const ukCompliance: NavItem[] = [
  { name: "Change UK Company Name (NM01)", path: "/uk-compliance/company-name-change" },
  { name: "Change Registered Office Address (AD01)", path: "/uk-compliance/company-address-change" },
  { name: "File Annual Accounts (UK LTD)", path: "/uk-compliance/annual-accounts-filing" },
  { name: "File Confirmation Statement (CS01)", path: "/uk-compliance/confirmation-statement" },
  { name: "Appoint or Remove Director", path: "/uk-compliance/director-appoint-remove" },
  { name: "Appoint or Remove Shareholder", path: "/uk-compliance/shareholder-appoint-remove" },
  { name: "Appoint or Remove PSC & Secretary", path: "/uk-compliance/psc-secretary-appoint-remove" },
  { name: "Change Company Residence Status", path: "/uk-compliance/company-residence-change" },
  { name: "AD01 Postal Filing Service", path: "/uk-compliance/ad01-form-post" },
];

export const usaServices: NavItem[] = [
  { name: "Form US LLC for Non-Residents", path: "/usa-services/us-llc-formation" },
  { name: "EIN Number", path: "/usa-services/ein-number" },
  { name: "ITIN Number", path: "/usa-services/itin-number" },
  { name: "US LLC Annual Tax Return", path: "/usa-services/annual-tax-filing" },
  { name: "BOI Report (Beneficial Ownership)", path: "/usa-services/bio-report" },
];

export const banking: NavItem[] = [
  { name: "PayPal", path: "/banks-payment-solutions/paypal", price: "£20" },
  { name: "Payoneer", path: "/banks-payment-solutions/payoneer", price: "£20" },
  { name: "WorldFirst", path: "/banks-payment-solutions/worldfirst", price: "£20" },
  { name: "Stripe", path: "/banks-payment-solutions/stripe", price: "£20" },
  { name: "Tide", path: "/banks-payment-solutions/tide", price: "£50" },
  { name: "Sunrate", path: "/banks-payment-solutions/sunrate", price: "£50" },
  { name: "Wise", path: "/banks-payment-solutions/wise", price: "£70" },
  { name: "Zyla", path: "/banks-payment-solutions/zyla", price: "£50" },
  { name: "Airwallex", path: "/banks-payment-solutions/airwallex", price: "£50" },
  { name: "Mollie", path: "/banks-payment-solutions/mollie", price: "£50" },
  { name: "ZionPe", path: "/banks-payment-solutions/zionpe", price: "£50" },
  { name: "Wallester", path: "/banks-payment-solutions/wallester", price: "£50" },
  { name: "PingPong", path: "/banks-payment-solutions/pingpong", price: "£50" },
];

export const navGroups: NavGroup[] = [
  { label: "UK Services", basePath: "/uk-services", items: ukServices },
  { label: "UK Compliance", basePath: "/uk-compliance", items: ukCompliance },
  { label: "USA Services", basePath: "/usa-services", items: usaServices },
  { label: "Business Bank Accounts", basePath: "/banks-payment-solutions", items: banking },
];

export const simpleLinks: NavItem[] = [
  { name: "Home", path: "/" },
  { name: "Pricing & Packages", path: "/pricing" },
  { name: "Business Website Development", path: "/web-development" },
  { name: "Blog", path: "/blog" },
  { name: "FAQ", path: "/faq" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export const partners = [
  "Companies House", "IRS", "Stripe", "PayPal", "Wise", "Payoneer",
  "Tide", "Sunrate", "WorldFirst", "eBay", "Shopify", "Airwallex",
  "Zionpe", "Wallester",
];
