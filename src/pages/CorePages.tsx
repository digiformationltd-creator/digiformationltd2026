import SimplePage from "@/components/SimplePage";

export const About = () => (
  <SimplePage eyebrow="About Us" title="Building global businesses, one formation at a time" description="Digiformation Ltd is the trusted one-stop platform for UK & US company formation, banking, payment gateways, compliance and web development. We've helped 300+ entrepreneurs in 60+ countries launch and scale." />
);

export const Contact = () => (
  <SimplePage eyebrow="Contact" title="Let's start a conversation" description="Book a free 30-minute consultation or send us a message. Our specialists respond within one business day.">
    <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-4xl">
      <div className="glass rounded-2xl p-8">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-2 opacity-80">Email</div>
        <div className="font-display text-2xl font-semibold">hello@digiformation.co.uk</div>
      </div>
      <div className="glass rounded-2xl p-8">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-2 opacity-80">Phone</div>
        <div className="font-display text-2xl font-semibold">+44 (0) 20 0000 0000</div>
      </div>
    </div>
  </SimplePage>
);

export const Pricing = () => (
  <SimplePage eyebrow="Pricing" title="Transparent pricing, no surprises" description="Fixed fees for every service. No hidden add-ons, no monthly retainers required. Pay only for what you need." />
);

export const FAQ = () => (
  <SimplePage eyebrow="FAQ" title="Frequently asked questions" description="Answers to the most common questions about UK & US company formation, banking, compliance and more." />
);

export const Blog = () => (
  <SimplePage eyebrow="Blog" title="Insights & guides for global founders" description="Practical articles on company formation, taxation, banking and growing your international business." />
);

export const ClientArea = () => (
  <SimplePage eyebrow="Client Area" title="Your dedicated client portal" description="Sign in to track applications, upload documents, and access all your services in one secure place." />
);

export const WebDevelopment = () => (
  <SimplePage eyebrow="Web Development" title="Websites that grow your business" description="Professional websites, landing pages and e-commerce solutions for your UK or US business — from concept to launch." />
);

export const Privacy = () => (
  <SimplePage eyebrow="Legal" title="Privacy Policy" description="How we collect, use and protect your personal data." />
);

export const Terms = () => (
  <SimplePage eyebrow="Legal" title="Terms of Service" description="The terms and conditions that govern use of our services." />
);
