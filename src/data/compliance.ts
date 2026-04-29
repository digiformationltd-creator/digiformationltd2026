export type CompliancePage = {
  slug: string;
  title: string;
  hero: string;
  price: string;
  eyebrow: string;
  overview: string[];
  requirements: string[];
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
};

export const compliancePages: CompliancePage[] = [
  {
    slug: "company-name-change",
    title: "Company Name Change Service",
    hero: "Change Your UK Company Name with Confidence",
    price: "£30",
    eyebrow: "UK Compliance",
    overview: [
      "Update your registered company name at Companies House",
      "Certificate of name change included",
      "Special resolution document drafted for you",
      "Full compliance with Companies House filing rules",
    ],
    requirements: ["Company Number (CRN)", "Company Authentication Code", "New Company Name"],
    description: "Officially change your UK company name with a fully managed Companies House filing — certificate and resolution document included.",
    metaTitle: "UK Company Name Change Service | Companies House Filing | Digiformation LTD",
    metaDescription: "Officially change your UK company name with Digiformation LTD. Includes Companies House filing, certificate, and resolution document.",
    keywords: "UK company name change, change company name, Companies House name change, NM01 filing",
  },
  {
    slug: "company-address-change",
    title: "Company Address Change Service",
    hero: "Update Your Registered UK Office Address",
    price: "£10",
    eyebrow: "UK Compliance",
    overview: [
      "Update your registered office address at Companies House",
      "Valid for 1 year — includes mail handling options",
      "Email notifications when post is received",
      "Optional mail scanning available",
    ],
    requirements: ["Company Number (CRN)", "Company Authentication Code", "New Registered Address"],
    description: "Update your UK registered office address quickly and stay fully compliant with Companies House.",
    metaTitle: "UK Company Address Change | Registered Office Update | Digiformation LTD",
    metaDescription: "Change your UK registered office address with Digiformation LTD. Fast filing with Companies House and optional mail handling.",
    keywords: "UK company address change, registered office change, Companies House address update",
  },
  {
    slug: "annual-accounts-filing",
    title: "Annual Accounts Filing Service",
    hero: "File Your UK Company Annual Accounts On Time",
    price: "From £120",
    eyebrow: "UK Compliance",
    overview: [
      "Preparation of statutory annual accounts",
      "Submission to Companies House and HMRC",
      "Micro-entity, small company and dormant accounts",
      "Avoid late filing penalties",
    ],
    requirements: [
      "Company Number (CRN)",
      "Company Authentication Code",
      "Business Financial Statement (income, expenses, budget — full year figures)",
    ],
    description: "Stay compliant with UK statutory filing — full preparation and submission of annual accounts to Companies House and HMRC.",
    metaTitle: "UK Annual Accounts Filing | Companies House & HMRC | Digiformation LTD",
    metaDescription: "Prepare and file your UK annual accounts with Digiformation LTD. Covers micro-entity, small and dormant company accounts.",
    keywords: "UK annual accounts filing, Companies House accounts, HMRC accounts filing, dormant company accounts",
  },
  {
    slug: "confirmation-statement",
    title: "Confirmation Statement Service",
    hero: "File Your Annual Confirmation Statement",
    price: "£80",
    eyebrow: "UK Compliance",
    overview: [
      "Prepare your annual confirmation statement",
      "File with Companies House (£50 fee included)",
      "Director identity verification details collected",
      "Avoid strike-off and compliance issues",
    ],
    requirements: ["Company Number (CRN)", "Company Authentication Code"],
    description: "Stay compliant with UK company law by filing your annual confirmation statement with Companies House.",
    metaTitle: "UK Company Annual Filing – Confirmation Statement | DiGiFormation LTD",
    metaDescription: "File your UK company's Confirmation Statement quickly with DiGiFormation LTD. Annual Filing, Directors' Verification, and compliant submission.",
    keywords: "UK Company Annual Filing, Confirmation Statement UK, Companies House Filing, Directors Verification UK, UK Company Compliance",
  },
  {
    slug: "director-appoint-remove",
    title: "Company Director Appoint & Remove Service",
    hero: "Appoint or Remove a Director — Same Day",
    price: "£10",
    eyebrow: "UK Compliance",
    overview: [
      "Appoint a new company director",
      "Remove or resign existing directors",
      "Companies House filing handled end-to-end",
      "Optional ID verification add-on available",
    ],
    requirements: ["Company Number (CRN)", "Company Authentication Code", "Director's Personal Code"],
    description: "Appoint or remove UK company directors with a fully managed Companies House filing.",
    metaTitle: "UK Company Director Change | Appoint & Remove Directors | Digiformation LTD",
    metaDescription: "Appoint or remove UK company directors with Digiformation LTD. Fast Companies House filing with optional ID verification.",
    keywords: "UK director change, appoint director UK, remove director UK, AP01, TM01",
  },
  {
    slug: "shareholder-appoint-remove",
    title: "Company Shareholder Appoint & Remove Service",
    hero: "Update Your UK Company Shareholders Quickly",
    price: "£10",
    eyebrow: "UK Compliance",
    overview: [
      "Add or remove shareholders",
      "Companies House updates",
      "Ownership structure management",
      "Compliance filing support",
    ],
    requirements: ["Company Number (CRN)", "Company Authentication Code", "Shareholder's Personal Code"],
    description: "Easily add or remove shareholders and manage your UK company's ownership structure.",
    metaTitle: "UK Shareholder Change | Add or Remove Shareholders | Digiformation LTD",
    metaDescription: "Add or remove shareholders in your UK company with Digiformation LTD. Companies House compliant and fully managed.",
    keywords: "UK shareholder change, add shareholder, remove shareholder, ownership change UK",
  },
  {
    slug: "psc-secretary-appoint-remove",
    title: "Company PSC & Secretary Appoint & Remove Service",
    hero: "Manage PSC & Secretary Changes with Ease",
    price: "£10",
    eyebrow: "UK Compliance",
    overview: [
      "Appoint or remove a Person of Significant Control (PSC)",
      "Appoint or remove a Company Secretary",
      "Legal compliance updates handled",
      "Official Companies House filing",
    ],
    requirements: ["Company Number (CRN)", "Company Authentication Code", "PSC / Secretary Personal Code"],
    description: "Manage PSC and Company Secretary appointments and removals with full Companies House compliance.",
    metaTitle: "PSC & Secretary Change | UK Companies House Filing | Digiformation LTD",
    metaDescription: "Appoint or remove PSCs and Company Secretaries with Digiformation LTD. Compliant Companies House filing.",
    keywords: "PSC change UK, company secretary change, PSC01, PSC07",
  },
  {
    slug: "company-residence-change",
    title: "Company Residence Change Service",
    hero: "Update Your Company Country of Residence",
    price: "£10",
    eyebrow: "UK Compliance",
    overview: [
      "Change registered country of residence",
      "Update tax residence details",
      "Companies House and HMRC notifications",
      "Full compliance support",
    ],
    requirements: ["Company Number (CRN)", "Company Authentication Code", "New Country of Residence"],
    description: "Update your UK company's country of residence with full Companies House and HMRC compliance.",
    metaTitle: "UK Company Residence Change | Country Update | Digiformation LTD",
    metaDescription: "Change your UK company's country of residence with Digiformation LTD. Compliant filing with Companies House and HMRC.",
    keywords: "UK company residence change, country of residence change, tax residence UK",
  },
  {
    slug: "ad01-form-post",
    title: "AD01 Form Post Service",
    hero: "Secure AD01 Address Filing Service",
    price: "£100",
    eyebrow: "UK Compliance",
    overview: [
      "Official AD01 filing",
      "Registered office address update",
      "Postal handling support",
      "Companies House submission",
    ],
    requirements: ["Company Number (CRN)", "Company Authentication Code", "New Registered Address"],
    description: "Official AD01 filing service to update your UK registered office address with full postal and Companies House handling.",
    metaTitle: "AD01 Form Filing Service | Registered Office Update | Digiformation LTD",
    metaDescription: "Official AD01 filing service from Digiformation LTD. Update your UK registered office address with full postal handling.",
    keywords: "AD01 form, AD01 filing, UK registered office change, Companies House address",
  },
];

export const findCompliancePage = (slug?: string) =>
  compliancePages.find((p) => p.slug === slug);
