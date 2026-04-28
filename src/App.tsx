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

          {/* Dynamic service sub-pages */}
          <Route path="/uk-services/:slug" element={<DynamicServicePage />} />
          <Route path="/uk-compliance/:slug" element={<DynamicServicePage />} />
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
