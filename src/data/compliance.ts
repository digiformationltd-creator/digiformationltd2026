export type ComplianceFormField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "textarea" | "date";
  helper?: string;
};

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
  /** Structured form fields that the checkout will render so we collect
   *  the exact data this filing needs (e.g. Director's Personal Code). */
  formFields?: ComplianceFormField[];
};

// Shared base — every Companies House filing needs CRN + Auth code
const baseCompanyFields: ComplianceFormField[] = [
  { key: "company_number", label: "Company Number (CRN)", placeholder: "e.g. 12345678", required: true },
  { key: "auth_code", label: "Company Authentication Code", placeholder: "6-character code from Companies House", required: true },
];

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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Current Company Name", placeholder: "Existing registered name", required: true },
      { key: "new_company_name", label: "New Company Name", placeholder: "Desired new name (we'll check availability)", required: true },
      { key: "director_personal_code", label: "Director's Companies House Personal Code", placeholder: "e.g. ABCD1234EFGH", required: true },
    ],
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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Company Name", placeholder: "Registered company name", required: true },
      { key: "new_registered_address", label: "New Registered Address", placeholder: "Full UK address with postcode", required: true, type: "textarea" },
    ],
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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Company Name", placeholder: "Registered company name", required: true },
      { key: "utr_number", label: "UTR Number", placeholder: "10-digit HMRC tax reference", required: true },
      { key: "accounting_period", label: "Accounting Period", placeholder: "e.g. 01/04/2024 – 31/03/2025", required: true },
      { key: "financial_summary", label: "Business Financial Statement", placeholder: "Income, expenses, profit/loss, bank balance — share full-year figures here", required: true, type: "textarea", helper: "We'll follow up on WhatsApp for supporting documents." },
    ],
  },
  {
    slug: "confirmation-statement",
    title: "Confirmation Statement Service",
    hero: "File Your Annual Confirmation Statement",
    price: "£65",
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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Company Name", placeholder: "Registered company name", required: true },
      { key: "director_personal_code", label: "Director's Companies House Personal Code", placeholder: "e.g. ABCD1234EFGH", required: true },
      { key: "changes_since_last", label: "Any changes since last statement?", placeholder: "Shareholders, SIC codes, registered address etc. — write 'None' if no changes", type: "textarea" },
    ],
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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Company Name", placeholder: "Registered company name", required: true },
      { key: "action", label: "Appoint or Remove?", placeholder: "Appoint / Remove / Both", required: true },
      { key: "director_full_name", label: "Director's Full Name", placeholder: "As shown on passport", required: true },
      { key: "director_personal_code", label: "Director's Companies House Personal Code", placeholder: "e.g. ABCD1234EFGH", required: true },
      { key: "director_date_of_birth", label: "Director's Date of Birth", placeholder: "DD/MM/YYYY", type: "date" },
    ],
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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Company Name", placeholder: "Registered company name", required: true },
      { key: "action", label: "Appoint or Remove?", placeholder: "Appoint / Remove / Both", required: true },
      { key: "shareholder_full_name", label: "Shareholder's Full Name", placeholder: "As shown on passport", required: true },
      { key: "shareholder_personal_code", label: "Shareholder's Personal Code", placeholder: "Companies House Personal Code", required: true },
      { key: "shares_count", label: "Number of Shares", placeholder: "e.g. 50", required: true },
    ],
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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Company Name", placeholder: "Registered company name", required: true },
      { key: "role_type", label: "PSC or Secretary?", placeholder: "PSC / Secretary / Both", required: true },
      { key: "action", label: "Appoint or Remove?", placeholder: "Appoint / Remove", required: true },
      { key: "person_full_name", label: "Person's Full Name", placeholder: "As shown on passport", required: true },
      { key: "person_personal_code", label: "Person's Personal Code", placeholder: "Companies House Personal Code", required: true },
    ],
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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Company Name", placeholder: "Registered company name", required: true },
      { key: "director_personal_code", label: "Director's Personal Code", placeholder: "Companies House Personal Code", required: true },
      { key: "new_country_residence", label: "New Country of Residence", placeholder: "e.g. United Kingdom", required: true },
    ],
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
    formFields: [
      ...baseCompanyFields,
      { key: "current_company_name", label: "Company Name", placeholder: "Registered company name", required: true },
      { key: "new_registered_address", label: "New Registered Address", placeholder: "Full UK address with postcode", required: true, type: "textarea" },
    ],
  },
];

export const findCompliancePage = (slug?: string) =>
  compliancePages.find((p) => p.slug === slug);

/** Map compliance checkout-item IDs → form field requirements.
 *  These IDs match the `items` defined in src/pages/Checkout.tsx (uk-compliance group). */
export const complianceItemFormFields: Record<string, { title: string; fields: ComplianceFormField[] }> = {
  utr: {
    title: "UTR Number Registration",
    fields: [
      { key: "utr_company_or_personal", label: "For Company or Individual?", placeholder: "Company / Individual", required: true },
      { key: "utr_full_name", label: "Full Name / Company Name", required: true },
      { key: "utr_address", label: "UK Address", type: "textarea", required: true, placeholder: "Full UK address with postcode" },
      { key: "utr_dob_or_crn", label: "Date of Birth (individual) or CRN (company)", required: true },
      { key: "utr_nino", label: "National Insurance Number (if available)", placeholder: "QQ123456C" },
    ],
  },
  vat: {
    title: "VAT Registration",
    fields: [
      { key: "vat_company_name", label: "Company Name", required: true },
      { key: "vat_company_number", label: "Company Number (CRN)", required: true },
      { key: "vat_auth_code", label: "Authentication Code", required: true },
      { key: "vat_utr", label: "UTR Number", required: true },
      { key: "vat_turnover", label: "Expected Annual Turnover (£)", required: true, placeholder: "e.g. 90000" },
      { key: "vat_business_activity", label: "Business Activity / Trade Description", type: "textarea", required: true },
    ],
  },
  cs: {
    title: "Confirmation Statement Filing",
    fields: [
      { key: "cs_company_number", label: "Company Number (CRN)", placeholder: "e.g. 12345678", required: true },
      { key: "cs_company_name", label: "Company Name", required: true },
      { key: "cs_auth_code", label: "Authentication Code", placeholder: "6-character code from Companies House", required: true },
    ],
  },
  aa: {
    title: "Annual Accounts Filing",
    fields: [
      { key: "aa_company_number", label: "Company Number (CRN)", placeholder: "e.g. 12345678", required: true },
      { key: "aa_auth_code", label: "Company Authentication Code", placeholder: "6-character code from Companies House", required: true },
      {
        key: "aa_financials",
        label: "Business Financial Statement",
        type: "textarea",
        required: false,
        placeholder: "Income, expenses, budget — full year figures, bookkeeping details and expenses sheet. If you prefer, email these details to info@digiformation.uk",
        description: "Share income, expenses, budget (full year figures), bookkeeping details and expenses sheet. You can also send these by email to info@digiformation.uk",
      },
    ],
  },
  name: {
    title: "Company Name Change",
    fields: [
      ...baseCompanyFields,
      { key: "name_current", label: "Current Company Name", required: true },
      { key: "name_new", label: "New Company Name", required: true },
      { key: "name_director_personal_code", label: "Director's Personal Code", required: true, placeholder: "e.g. ABCD1234EFGH" },
    ],
  },
  dorm: {
    title: "Dormant Company Filing",
    fields: [
      ...baseCompanyFields,
      { key: "dorm_company_name", label: "Company Name", required: true },
      { key: "dorm_period", label: "Dormant Period", required: true, placeholder: "e.g. 01/04/2024 – 31/03/2025" },
      { key: "dorm_director_personal_code", label: "Director's Personal Code", required: true },
    ],
  },
  idv: {
    title: "LTD ID Verification",
    fields: [
      { key: "idv_full_name", label: "Full Name (as on passport)", required: true },
      { key: "idv_role", label: "Role", required: true, placeholder: "Director / PSC / Shareholder / Secretary" },
      { key: "idv_company_number", label: "Company Number (if already incorporated)" },
      { key: "idv_date_of_birth", label: "Date of Birth", required: true, placeholder: "DD/MM/YYYY" },
    ],
  },
};
