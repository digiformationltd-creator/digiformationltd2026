import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { DynamicServicePage } from "./pages/DynamicServicePage";
import { UKServicesHub, UKComplianceHub, USAServicesHub, BankingHub } from "./pages/SectionHubs";
import { About, Contact, Pricing, FAQ, ClientArea, WebDevelopment, Privacy, Terms } from "./pages/CorePages";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import UKLtdFormation from "./pages/UKLtdFormation";
import UkLtdChooseJurisdiction from "./pages/UkLtdChooseJurisdiction";
import UkLtdCheckout from "./pages/UkLtdCheckout";
import LtdIdVerification from "./pages/LtdIdVerification";
import LtdIdVerificationCheckout from "./pages/LtdIdVerificationCheckout";
import RegisteredOfficeAddress from "./pages/RegisteredOfficeAddress";
import UtrCodes from "./pages/UtrCodes";
import CompliancePage from "./pages/CompliancePage";
import UKChangeServices from "./pages/UKChangeServices";
import UsaLlcFormation from "./pages/UsaLlcFormation";
import UsaLlcChooseState from "./pages/UsaLlcChooseState";
import UsaLlcCheckout from "./pages/UsaLlcCheckout";
import UsaServicePage from "./pages/UsaServicePage";
import BankingProviderPage from "./pages/BankingProviderPage";
import WhatsAppFloat from "./components/WhatsAppFloat";
import AIAssistant from "./components/AIAssistant";
import ScrollToTop from "./components/ScrollToTop";
import RecoveryRedirect from "./components/RecoveryRedirect";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import Affiliate from "./pages/Affiliate";
import Admin from "./pages/Admin";
import Unsubscribe from "./pages/Unsubscribe";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <RecoveryRedirect />
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Section hubs */}
          <Route path="/uk-services" element={<UKServicesHub />} />
          <Route path="/uk-compliance" element={<UKComplianceHub />} />
          <Route path="/usa-services" element={<USAServicesHub />} />
          <Route path="/banks-payment-solutions" element={<BankingHub />} />

          {/* Dedicated service pages (must come before dynamic route) */}
          <Route path="/uk-services/uk-ltd-formation/choose-jurisdiction" element={<UkLtdChooseJurisdiction />} />
          <Route path="/uk-services/uk-ltd-formation/checkout" element={<UkLtdCheckout />} />
          <Route path="/uk-services/uk-ltd-formation" element={<UKLtdFormation />} />
          <Route path="/uk-services/ltd-id-verification/checkout" element={<LtdIdVerificationCheckout />} />
          <Route path="/uk-services/ltd-id-verification" element={<LtdIdVerification />} />
          <Route path="/uk-services/registered-office-address" element={<RegisteredOfficeAddress />} />
          <Route path="/uk-services/utr-codes" element={<UtrCodes />} />
          {/* Aliases under /ltd-formation-services */}
          <Route path="/ltd-formation-services" element={<UKLtdFormation />} />
          <Route path="/ltd-formation-services/uk-ltd-formation" element={<UKLtdFormation />} />
          <Route path="/ltd-formation-services/ltd-id-verification" element={<LtdIdVerification />} />
          <Route path="/ltd-formation/ltd-id-verification" element={<LtdIdVerification />} />
          <Route path="/ltd-formation-services/registered-office-address" element={<RegisteredOfficeAddress />} />
          <Route path="/ltd-formation-services/utr-codes" element={<UtrCodes />} />

          {/* UK Company Services - expanded change services */}
          <Route path="/uk-company-services/change-services" element={<UKChangeServices />} />
          <Route path="/uk-company-services/registered-office-address" element={<RegisteredOfficeAddress />} />
          <Route path="/uk-company-services/director-service-address" element={<RegisteredOfficeAddress />} />

          {/* UK Compliance dedicated data-driven pages */}
          <Route path="/uk-compliance/:slug" element={<CompliancePage />} />

          {/* USA dedicated pages (must come before dynamic route) */}
          <Route path="/usa-services/us-llc-formation/choose-state" element={<UsaLlcChooseState />} />
          <Route path="/usa-services/us-llc-formation/checkout" element={<UsaLlcCheckout />} />
          <Route path="/usa-services/us-llc-formation" element={<UsaLlcFormation />} />
          <Route path="/usa-services/usa-llc-formation" element={<UsaLlcFormation />} />
          <Route path="/llc-formation-services" element={<UsaLlcFormation />} />
          <Route path="/llc-formation-services/usa-llc-formation" element={<UsaLlcFormation />} />
          <Route path="/usa-services/ein-number" element={<UsaServicePage />} />
          <Route path="/usa-services/itin-number" element={<UsaServicePage />} />
          <Route path="/usa-services/annual-tax-filing" element={<UsaServicePage />} />
          <Route path="/usa-services/bio-report" element={<UsaServicePage />} />
          <Route path="/llc-formation-services/ein-number" element={<UsaServicePage />} />
          <Route path="/llc-formation-services/itin-number" element={<UsaServicePage />} />
          <Route path="/llc-formation-services/annual-tax-filing" element={<UsaServicePage />} />
          <Route path="/llc-formation-services/bio-report" element={<UsaServicePage />} />

          {/* Banking dedicated pages */}
          <Route path="/banks-payment-solutions/:slug" element={<BankingProviderPage />} />

          {/* Dynamic service sub-pages (fallback) */}
          <Route path="/uk-services/:slug" element={<DynamicServicePage />} />
          <Route path="/usa-services/:slug" element={<DynamicServicePage />} />

          {/* Core pages */}
          <Route path="/web-development" element={<WebDevelopment />} />
          <Route path="/client-area" element={<ClientArea />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Client auth + dashboard */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/admin" element={<Admin />} />

          <Route path="/checkout" element={<Checkout />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <WhatsAppFloat />
        <AIAssistant />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
