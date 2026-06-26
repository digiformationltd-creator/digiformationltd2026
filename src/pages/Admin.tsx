import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import BusinessOSLayout from "@/businessos/BusinessOSLayout";

// Eagerly load the most-used landing page (Dashboard) to avoid an extra
// chunk fetch on first admin render. All other Os* pages are code-split.
import OsDashboard from "@/businessos/pages/OsDashboard";

const OsLeads = lazy(() => import("@/businessos/pages/OsLeads"));
const OsServices = lazy(() => import("@/businessos/pages/OsServices"));
const OsClients = lazy(() => import("@/businessos/pages/OsClients"));
const OsClientDetail = lazy(() => import("@/businessos/pages/OsClientDetail"));
const OsOrders = lazy(() => import("@/businessos/pages/OsOrders"));
const OsInvoices = lazy(() => import("@/businessos/pages/OsInvoices"));
const OsDocuments = lazy(() => import("@/businessos/pages/OsDocuments"));
const OsSupport = lazy(() => import("@/businessos/pages/OsSupport"));
const OsCompanies = lazy(() => import("@/businessos/pages/OsCompanies"));
const OsManagedCompanies = lazy(() => import("@/businessos/pages/OsManagedCompanies"));
const OsManagedCompanyDetail = lazy(() => import("@/businessos/pages/OsManagedCompanyDetail"));
const OsEmailOps = lazy(() => import("@/businessos/pages/OsEmailOps"));
const OsCompliance = lazy(() => import("@/businessos/pages/OsCompliance"));
const OsWhatsAppCRM = lazy(() => import("@/businessos/pages/whatsapp/OsWhatsAppCRM"));
const OsWhatsAppContactDetail = lazy(() => import("@/businessos/pages/whatsapp/OsWhatsAppContactDetail"));
const OsGrowthIntelligence = lazy(() => import("@/businessos/pages/OsGrowthIntelligence"));
const OsAutomation = lazy(() => import("@/businessos/pages/OsAutomation"));
const OsAutomationWorkflows = lazy(() => import("@/businessos/pages/OsAutomationWorkflows"));
const OsAutomationJobs = lazy(() => import("@/businessos/pages/OsAutomationJobs"));
const OsSettings = lazy(() => import("@/businessos/pages/OsSettings"));
const OsEmailMarketing = lazy(() => import("@/businessos/pages/OsEmailMarketing"));
const OsAICommandCenter = lazy(() => import("@/businessos/pages/OsAICommandCenter"));
const OsReminderCenter = lazy(() => import("@/businessos/pages/OsReminderCenter"));
const OsHelpCenter = lazy(() => import("@/businessos/pages/OsHelpCenter"));
const OsAnalytics = lazy(() => import("@/businessos/pages/OsAnalytics"));
const LegacyAdmin = lazy(() => import("@/pages/LegacyAdmin"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default function Admin() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="legacy/*" element={<LegacyAdmin />} />
        <Route element={<BusinessOSLayout />}>
          <Route index element={<OsDashboard />} />
          <Route path="leads" element={<OsLeads />} />
          <Route path="clients" element={<OsClients />} />
          <Route path="clients/:id" element={<OsClientDetail />} />
          <Route path="companies" element={<OsCompanies />} />
          <Route path="managed-companies" element={<OsManagedCompanies />} />
          <Route path="managed-companies/:id" element={<OsManagedCompanyDetail />} />
          <Route path="orders" element={<OsOrders />} />
          <Route path="invoices" element={<OsInvoices />} />
          <Route path="whatsapp" element={<OsWhatsAppCRM />} />
          <Route path="whatsapp/:id" element={<OsWhatsAppContactDetail />} />
          <Route path="attribution" element={<OsGrowthIntelligence />} />
          <Route path="support" element={<OsSupport />} />
          <Route path="documents" element={<OsDocuments />} />
          <Route path="automation" element={<OsAutomation />} />
          <Route path="automation/command-center" element={<OsAICommandCenter />} />
          <Route path="automation/email-marketing" element={<OsEmailMarketing />} />
          <Route path="automation/jobs" element={<OsAutomationJobs />} />
          <Route path="automation/workflows" element={<OsAutomationWorkflows />} />
          <Route path="automation/reminders" element={<OsReminderCenter />} />
          <Route path="automation/analytics" element={<OsAnalytics />} />
          <Route path="email-ops" element={<OsEmailOps />} />
          <Route path="compliance" element={<OsCompliance />} />
          <Route path="settings" element={<OsSettings />} />
          <Route path="settings/services" element={<OsServices />} />
          <Route path="help" element={<OsHelpCenter />} />
          {/* Legacy redirects-by-route for stability */}
          <Route path="services" element={<OsServices />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
