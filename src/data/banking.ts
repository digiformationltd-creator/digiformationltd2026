export type BankingProvider = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  requirements: string[];
  setupPrice: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
};

// Region helper for requirements
type Region = "uk" | "usa" | "both";

const buildRequirements = (region: Region): string[] => {
  const numberLine =
    region === "uk"
      ? "UK Number"
      : region === "usa"
      ? "USA Number"
      : "UK / USA Number";
  return [
    "Company Name",
    numberLine,
    "Email Address",
    "Residential Home Address",
    "Residential Bank Statement",
    "Passport Pictures (holding selfie + picture + live selfie)",
    "Website",
    "Business Category",
  ];
};

const REQ_UK = buildRequirements("uk");
const REQ_USA = buildRequirements("usa");
const REQ_BOTH = buildRequirements("both");

export const bankingProviders: BankingProvider[] = [
  {
    slug: "paypal",
    name: "PayPal",
    tagline: "Trusted global online payment platform for businesses and freelancers.",
    description: "Send, receive, and manage payments securely with the world's most recognised online payment brand.",
    features: [],
    requirements: REQ_UK,
    setupPrice: "£20",
    metaTitle: "PayPal Payment Services | Digiformation Ltd",
    metaDescription: "Accept and send payments worldwide with PayPal. Secure, fast, and reliable online payment solutions for businesses.",
    keywords: "PayPal UK, online payment platform, business payments",
  },
  {
    slug: "payoneer",
    name: "Payoneer",
    tagline: "Global payment solution for businesses, freelancers, and e-commerce sellers.",
    description: "Receive funds in multiple currencies and access your money via prepaid card or local withdrawals.",
    features: [],
    requirements: REQ_UK,
    setupPrice: "£20",
    metaTitle: "Payoneer Payment Services | Digiformation Ltd",
    metaDescription: "Receive international payments easily with Payoneer. Multi-currency accounts and prepaid cards for global business.",
    keywords: "Payoneer UK, global payments, e-commerce payments",
  },
  {
    slug: "worldfirst",
    name: "WorldFirst",
    tagline: "Fast, secure, and low-cost international money transfers.",
    description: "Multi-currency accounts and competitive FX for businesses and freelancers selling globally.",
    features: [],
    requirements: REQ_UK,
    setupPrice: "£20",
    metaTitle: "WorldFirst International Transfers | Digiformation Ltd",
    metaDescription: "Send and receive money globally with WorldFirst. Low-cost international transfers for businesses and freelancers.",
    keywords: "WorldFirst UK, international money transfer, multi-currency account",
  },
  {
    slug: "stripe",
    name: "Stripe",
    tagline: "Complete payment processing solution for online businesses.",
    description: "Accept payments globally with developer-friendly tools, fraud protection, and subscription billing.",
    features: [],
    requirements: REQ_UK,
    setupPrice: "£20",
    metaTitle: "Stripe Payment Gateway | Digiformation Ltd",
    metaDescription: "Accept global payments online with Stripe. Payment gateway for businesses with fraud protection and easy integration.",
    keywords: "Stripe UK, payment gateway, online payments",
  },
  {
    slug: "tide",
    name: "Tide",
    tagline: "UK-based business banking platform designed for small businesses and freelancers.",
    description: "Open a UK business account in minutes and manage payments, invoices, and expenses from a single dashboard.",
    features: [],
    requirements: REQ_UK,
    setupPrice: "£50",
    metaTitle: "Tide Business Account UK | Digiformation Ltd",
    metaDescription: "Open a Tide business account in the UK. Manage payments, invoices, and expenses with ease.",
    keywords: "Tide UK, business banking, small business account",
  },
  {
    slug: "sunrate",
    name: "Sunrate",
    tagline: "Fintech platform offering fast and secure cross-border payments for businesses.",
    description: "Global remittance, multi-currency support, and APIs for treasury automation.",
    features: [],
    requirements: REQ_BOTH,
    setupPrice: "£50",
    metaTitle: "Sunrate Cross-Border Payments | Digiformation Ltd",
    metaDescription: "Fast, secure, and low-cost international payments for businesses with Sunrate. Multi-currency and API support.",
    keywords: "Sunrate UK, cross-border payments, business remittance",
  },
  {
    slug: "wise",
    name: "Wise",
    tagline: "Fast, transparent, and low-cost international money transfers.",
    description: "Real exchange rate transfers and a borderless multi-currency account for businesses and individuals.",
    features: [],
    requirements: REQ_BOTH,
    setupPrice: "£70",
    metaTitle: "Wise (TransferWise) International Payments | Digiformation Ltd",
    metaDescription: "Send and receive money globally with Wise. Transparent, fast, and low-cost international payments for businesses.",
    keywords: "Wise UK, international money transfer, multi-currency account",
  },
  {
    slug: "zyla",
    name: "Zyla",
    tagline: "Digital payment solutions for SMEs and e-commerce merchants.",
    description: "Fast and secure transactions with multi-currency support and merchant accounts.",
    features: [],
    requirements: REQ_UK,
    setupPrice: "£50",
    metaTitle: "Zyla Payment Solutions | Digiformation Ltd",
    metaDescription: "Fast and secure online payments for SMEs with Zyla. Multi-currency and merchant account support.",
    keywords: "Zyla UK, SME payments, online payment solutions",
  },
  {
    slug: "airwallex",
    name: "Airwallex",
    tagline: "Global financial platform for businesses.",
    description: "Handle international payments, FX, virtual accounts, and team expense cards from one platform.",
    features: [],
    requirements: REQ_USA,
    setupPrice: "£50",
    metaTitle: "Airwallex Global Payments | Digiformation Ltd",
    metaDescription: "Manage international payments and FX with Airwallex. Multi-currency accounts and virtual cards for businesses.",
    keywords: "Airwallex UK, global business payments, virtual accounts",
  },
  {
    slug: "mollie",
    name: "Mollie",
    tagline: "European payment service provider for businesses.",
    description: "Accept multiple online payment methods with simple APIs and real-time reporting.",
    features: [],
    requirements: REQ_UK,
    setupPrice: "£50",
    metaTitle: "Mollie Payment Gateway Europe | Digiformation Ltd",
    metaDescription: "Accept online payments in Europe with Mollie. Credit cards, e-wallets, subscriptions, and real-time reporting.",
    keywords: "Mollie UK, online payments, European payment provider",
  },
  {
    slug: "zionpe",
    name: "ZionPe",
    tagline: "Modern Payment OS built for startups and online businesses.",
    description: "Create invoices, share payment links, automate subscription billing, and manage customers — all from one powerful dashboard. Supports 195+ countries with instant payouts.",
    features: [
      "Online payments & checkout",
      "Invoicing & payment links",
      "Subscription billing automation",
      "Multi-currency: GBP, USD, EUR",
      "Instant payouts in 195+ countries",
    ],
    requirements: REQ_UK,
    setupPrice: "£50",
    metaTitle: "ZionPe Payment Platform | Digiformation Ltd",
    metaDescription: "Accept payments, send invoices, and automate subscriptions with ZionPe. Modern payment OS for digital businesses worldwide.",
    keywords: "ZionPe, online payments, payment links, subscription billing, invoicing",
  },
  {
    slug: "wallester",
    name: "Wallester",
    tagline: "Secure payment solutions and instant Visa card issuing platform.",
    description: "API-driven platform for issuing virtual and physical Visa cards in real time. Trusted by 5,850+ businesses across 35 countries with 8.4M+ cards issued globally.",
    features: [
      "Instant virtual & physical Visa card issuing",
      "Real-time spend tracking & controls",
      "API-first integration",
      "Multi-currency settlement",
      "Operates in 35+ countries",
    ],
    requirements: REQ_UK,
    setupPrice: "£50",
    metaTitle: "Wallester Visa Card Issuing | Digiformation Ltd",
    metaDescription: "Issue virtual and physical Visa cards instantly with Wallester. API-driven card issuing and payment solutions for businesses.",
    keywords: "Wallester, Visa card issuing, virtual cards, business payments, card API",
  },
  {
    slug: "pingpong",
    name: "PingPong",
    tagline: "Cross-border payment infrastructure for global commerce.",
    description: "Provision multi-currency accounts, accept payments like a local business in dozens of markets, manage FX, and pay anyone, anywhere — all from one platform built for marketplaces, e-commerce sellers, and global teams.",
    features: [
      "Multi-currency local receiving accounts",
      "Cross-border payouts worldwide",
      "Lock-in FX rates & treasury management",
      "Card issuing for global spend",
      "Marketplace & e-commerce integrations",
    ],
    requirements: REQ_USA,
    setupPrice: "£50",
    metaTitle: "PingPong Cross-Border Payments | Digiformation Ltd",
    metaDescription: "Accept and send cross-border payments with PingPong. Multi-currency accounts, FX, and payouts for global businesses and marketplaces.",
    keywords: "PingPong, cross-border payments, multi-currency accounts, marketplace payouts",
  },
  {
    slug: "grey",
    name: "Grey",
    tagline: "Borderless banking for freelancers, remote workers, and global businesses.",
    description: "Receive international payments in USD, GBP, and EUR with foreign accounts, convert to local currency at great rates, and spend globally with virtual cards.",
    features: [
      "Foreign currency accounts (USD, GBP, EUR)",
      "Competitive currency conversion",
      "Virtual USD cards for global spending",
      "Fast international transfers",
    ],
    requirements: REQ_UK,
    setupPrice: "£50",
    metaTitle: "Grey Borderless Banking | Digiformation Ltd",
    metaDescription: "Open foreign currency accounts with Grey. Receive USD, GBP, EUR payments and spend globally with virtual cards.",
    keywords: "Grey banking, borderless accounts, freelancer banking, virtual USD card",
  },
  {
    slug: "taptap",
    name: "TapTap Send",
    tagline: "Fast, low-cost international money transfers to emerging markets.",
    description: "Send money internationally with low fees and competitive exchange rates. Trusted by millions for cross-border remittances and business payouts.",
    features: [
      "Low-cost international transfers",
      "Competitive FX rates",
      "Fast delivery to bank accounts & mobile wallets",
      "Wide global coverage",
    ],
    requirements: REQ_UK,
    setupPrice: "£50",
    metaTitle: "TapTap Send International Transfers | Digiformation Ltd",
    metaDescription: "Send money internationally with TapTap Send. Low fees, competitive FX, and fast delivery for businesses and individuals.",
    keywords: "TapTap Send, international transfers, remittance, low cost FX",
  },
  {
    slug: "nsave-business",
    name: "Nsave Business",
    tagline: "Secure offshore business banking with multi-currency accounts.",
    description: "Protect and grow your business funds with Nsave Business. Multi-currency accounts in stable jurisdictions, international payments, and dedicated business support.",
    features: [
      "Multi-currency business accounts",
      "Offshore account protection",
      "International SWIFT payments",
      "Dedicated business support",
    ],
    requirements: REQ_UK,
    setupPrice: "£50",
    metaTitle: "Nsave Business Banking | Digiformation Ltd",
    metaDescription: "Open a Nsave Business account for secure offshore banking. Multi-currency accounts and international payments for global businesses.",
    keywords: "Nsave Business, offshore business banking, multi-currency account",
  },
];
