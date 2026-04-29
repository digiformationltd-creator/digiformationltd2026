export type UsaService = {
  slug: string;
  title: string;
  hero: string;
  description: string;
  features: string[];
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
