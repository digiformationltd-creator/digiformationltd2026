export type NavItem = { name: string; path: string };
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
  { name: "Company Name Change", path: "/uk-compliance/company-name-change" },
  { name: "Company Address Change", path: "/uk-compliance/company-address-change" },
  { name: "Annual Accounts Filing", path: "/uk-compliance/annual-accounts-filing" },
  { name: "Confirmation Statement", path: "/uk-compliance/confirmation-statement" },
  { name: "Director Appoint & Remove", path: "/uk-compliance/director-appoint-remove" },
  { name: "Shareholder Appoint & Remove", path: "/uk-compliance/shareholder-appoint-remove" },
  { name: "PSC & Secretary Appoint & Remove", path: "/uk-compliance/psc-secretary-appoint-remove" },
  { name: "Company Residence Change", path: "/uk-compliance/company-residence-change" },
  { name: "AD01 Form Post Service", path: "/uk-compliance/ad01-form-post" },
];

export const usaServices: NavItem[] = [
  { name: "Form US LLC for Non-Residents", path: "/usa-services/us-llc-formation" },
  { name: "EIN Number", path: "/usa-services/ein-number" },
  { name: "ITIN Number", path: "/usa-services/itin-number" },
  { name: "US LLC Annual Tax Return", path: "/usa-services/annual-tax-filing" },
  { name: "BOI Report (Beneficial Ownership)", path: "/usa-services/bio-report" },
];

export const banking: NavItem[] = [
  { name: "PayPal", path: "/banks-payment-solutions/paypal" },
  { name: "Payoneer", path: "/banks-payment-solutions/payoneer" },
  { name: "WorldFirst", path: "/banks-payment-solutions/worldfirst" },
  { name: "Stripe", path: "/banks-payment-solutions/stripe" },
  { name: "Tide", path: "/banks-payment-solutions/tide" },
  { name: "Sunrate", path: "/banks-payment-solutions/sunrate" },
  { name: "Wise", path: "/banks-payment-solutions/wise" },
  { name: "Zyla", path: "/banks-payment-solutions/zyla" },
  { name: "Airwallex", path: "/banks-payment-solutions/airwallex" },
  { name: "Mollie", path: "/banks-payment-solutions/mollie" },
  { name: "ZionPe", path: "/banks-payment-solutions/zionpe" },
  { name: "Wallester", path: "/banks-payment-solutions/wallester" },
  { name: "PingPong", path: "/banks-payment-solutions/pingpong" },
];

export const navGroups: NavGroup[] = [
  { label: "UK Services", basePath: "/uk-services", items: ukServices },
  { label: "UK Compliance", basePath: "/uk-compliance", items: ukCompliance },
  { label: "USA Services", basePath: "/usa-services", items: usaServices },
  { label: "Banking & Payments", basePath: "/banks-payment-solutions", items: banking },
];

export const simpleLinks: NavItem[] = [
  { name: "Home", path: "/" },
  { name: "Packages", path: "/pricing" },
  { name: "Web Development", path: "/web-development" },
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
