export type UsaService = {
  slug: string;
  title: string;
  hero: string;
  description: string;
  features: string[];
  requirements: string[];
  process: string[];
  price: number;
  currency: "USD";
  turnaround: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
};

export const usaServicePages: UsaService[] = [
  {
    slug: "ein-number",
    title: "EIN Number Service",
    hero: "Get Your U.S. EIN Number Quickly",
    description:
      "Apply for your Employer Identification Number (EIN) for your LLC. Official IRS-recognized digital certificate delivered.",
    features: [
      "EIN Registration with IRS",
      "Digital Certificate Delivery (PDF)",
      "Fast Processing",
      "Compliant & Secure",
      "Support included",
    ],
    requirements: [
      "Registered LLC name & state of formation",
      "Articles of Organization (PDF)",
      "Responsible party full name & address",
      "Passport copy of the responsible party",
      "Business activity description",
      "Contact email & WhatsApp number",
    ],
    process: [
      "Submit your details and documents",
      "We prepare & file Form SS-4 with the IRS",
      "Receive your official EIN confirmation (CP-575 / 147C)",
      "Digital PDF certificate delivered to your email",
    ],
    price: 50,
    currency: "USD",
    turnaround: "3–10 business days",
    metaTitle: "EIN Number Service for U.S. LLC | Digiformation Ltd",
    metaDescription:
      "Get your U.S. LLC EIN number quickly with Digiformation Ltd. Digital certificate and fast processing for all new LLCs.",
    keywords: "EIN number service, US EIN for LLC, LLC EIN registration, EIN issuance online",
  },
  {
    slug: "itin-number",
    title: "ITIN Number Service",
    hero: "Obtain Your U.S. ITIN (Individual Taxpayer Identification Number)",
    description:
      "Ideal for non-resident members of an LLC or individuals needing a U.S. tax ID.",
    features: [
      "ITIN Application Assistance",
      "IRS-Compliant Submission",
      "Digital ITIN Certificate",
      "Fast & Secure Process",
      "Support Included",
    ],
    requirements: [
      "Notarized passport copy (or certified true copy)",
      "Proof of foreign address",
      "Reason for ITIN (LLC ownership, U.S. tax filing, etc.)",
      "LLC formation documents (if applicable)",
      "Signed Form W-7 (we prepare it for you)",
      "Contact email & WhatsApp number",
    ],
    process: [
      "Submit your passport & supporting documents",
      "We prepare and certify your Form W-7 application",
      "IRS Acceptance Agent submission",
      "Receive your ITIN letter from the IRS by post & email",
    ],
    price: 200,
    currency: "USD",
    turnaround: "6–10 weeks (IRS processing)",
    metaTitle: "ITIN Number Service for Non-U.S. Residents | Digiformation Ltd",
    metaDescription:
      "Apply for your U.S. ITIN number with Digiformation Ltd. Fast, secure, and IRS-compliant for non-resident LLC owners.",
    keywords: "ITIN number service, US ITIN for non-residents, IRS ITIN application, ITIN processing online",
  },
  {
    slug: "annual-tax-filing",
    title: "Annual Tax Filing Service",
    hero: "Annual U.S. LLC Tax Filing Made Simple",
    description:
      "File your federal & state taxes accurately with professional guidance and portal access.",
    features: [
      "Federal & State Tax Submission",
      "IRS & State Compliant",
      "Portal Access for Filings",
      "Support & Guidance",
      "Ongoing Tax Assistance",
    ],
    requirements: [
      "LLC name, EIN & state of formation",
      "Members / owners details (name, address, ownership %)",
      "Annual income & expense summary",
      "Bank statements for the tax year",
      "Previous year's tax filings (if any)",
      "Contact email & WhatsApp number",
    ],
    process: [
      "Share your financial summary & documents",
      "We prepare Form 5472 + 1120 (or relevant returns)",
      "Review with you before submission",
      "File with the IRS & deliver confirmation receipt",
    ],
    price: 100,
    currency: "USD",
    turnaround: "5–14 business days",
    metaTitle: "Annual Tax Filing Service for U.S. LLCs | Digiformation Ltd",
    metaDescription:
      "Simplify U.S. LLC annual tax filing with Digiformation Ltd. Secure portal access and expert IRS-compliant support.",
    keywords: "Annual tax filing service, LLC tax filing USA, IRS tax compliance, US LLC taxation",
  },
  {
    slug: "bio-report",
    title: "BOI Report Service",
    hero: "File Your U.S. BOI (Beneficial Ownership Information) Report",
    description:
      "Comply with U.S. BOI requirements quickly with secure digital processing.",
    features: [
      "Digital BOI Report Submission",
      "U.S. Government Compliant",
      "Fast Processing",
      "Secure Document Delivery (PDF)",
      "Support Included",
    ],
    requirements: [
      "LLC name, EIN & state of formation",
      "Beneficial owner(s) full name & date of birth",
      "Residential address of each beneficial owner",
      "Passport or government-issued ID copy",
      "Company applicant details (if formed after 2024)",
      "Contact email & WhatsApp number",
    ],
    process: [
      "Submit owner details & ID documents",
      "We prepare your BOI report for FinCEN",
      "File electronically with FinCEN",
      "Receive confirmation receipt (PDF) by email",
    ],
    price: 20,
    currency: "USD",
    turnaround: "2–5 business days",
    metaTitle: "BOI Report Service for U.S. LLCs | Digiformation Ltd",
    metaDescription:
      "File your U.S. LLC BOI report accurately with Digiformation Ltd. Digital confirmation and full compliance guaranteed.",
    keywords: "BOI report service, Beneficial ownership report USA, LLC compliance filing, BOI report submission",
  },
];

export const usStates = [
  { code: "DE", name: "Delaware", surcharge: 0 },
  { code: "WY", name: "Wyoming", surcharge: 0 },
  { code: "FL", name: "Florida", surcharge: 30 },
  { code: "TX", name: "Texas", surcharge: 50 },
  { code: "NV", name: "Nevada", surcharge: 60 },
  { code: "NM", name: "New Mexico", surcharge: 20 },
  { code: "CA", name: "California", surcharge: 90 },
  { code: "NY", name: "New York", surcharge: 100 },
  { code: "WA", name: "Washington", surcharge: 70 },
  { code: "CO", name: "Colorado", surcharge: 40 },
  { code: "GA", name: "Georgia", surcharge: 35 },
  { code: "IL", name: "Illinois", surcharge: 80 },
];
