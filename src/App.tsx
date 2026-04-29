import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { DynamicServicePage } from "./pages/DynamicServicePage";
import { UKServicesHub, UKComplianceHub, USAServicesHub, BankingHub } from "./pages/SectionHubs";
import { About, Contact, Pricing, FAQ, Blog, ClientArea, WebDevelopment, Privacy, Terms } from "./pages/CorePages";
import UKLtdFormation from "./pages/UKLtdFormation";
import LtdIdVerification from "./pages/LtdIdVerification";
import RegisteredOfficeAddress from "./pages/RegisteredOfficeAddress";
import UtrCodes from "./pages/UtrCodes";
import CompliancePage from "./pages/CompliancePage";
import UKChangeServices from "./pages/UKChangeServices";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Section hubs */}
          <Route path="/uk-services" element={<UKServicesHub />} />
          <Route path="/uk-compliance" element={<UKComplianceHub />} />
          <Route path="/usa-services" element={<USAServicesHub />} />
          <Route path="/banks-payment-solutions" element={<BankingHub />} />

          {/* Dedicated service pages (must come before dynamic route) */}
          <Route path="/uk-services/uk-ltd-formation" element={<UKLtdFormation />} />
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

          {/* Dynamic service sub-pages */}
          <Route path="/uk-services/:slug" element={<DynamicServicePage />} />
          <Route path="/usa-services/:slug" element={<DynamicServicePage />} />
          <Route path="/banks-payment-solutions/:slug" element={<DynamicServicePage />} />

          {/* Core pages */}
          <Route path="/web-development" element={<WebDevelopment />} />
          <Route path="/client-area" element={<ClientArea />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
