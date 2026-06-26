import { Routes, Route } from "react-router-dom";
import BusinessOSLayout from "@/businessos/BusinessOSLayout";
import OsDashboard from "@/businessos/pages/OsDashboard";
import OsLeads from "@/businessos/pages/OsLeads";
import OsServices from "@/businessos/pages/OsServices";
import OsClients from "@/businessos/pages/OsClients";
import OsClientDetail from "@/businessos/pages/OsClientDetail";
import OsOrders from "@/businessos/pages/OsOrders";
import OsInvoices from "@/businessos/pages/OsInvoices";
import OsDocuments from "@/businessos/pages/OsDocuments";
import OsSupport from "@/businessos/pages/OsSupport";
import OsCompanies from "@/businessos/pages/OsCompanies";
import OsManagedCompanies from "@/businessos/pages/OsManagedCompanies";
import OsManagedCompanyDetail from "@/businessos/pages/OsManagedCompanyDetail";


import OsEmailOps from "@/businessos/pages/OsEmailOps";
import OsCompliance from "@/businessos/pages/OsCompliance";
import OsWhatsAppCRM from "@/businessos/pages/whatsapp/OsWhatsAppCRM";
import OsWhatsAppContactDetail from "@/businessos/pages/whatsapp/OsWhatsAppContactDetail";
import OsGrowthIntelligence from "@/businessos/pages/OsGrowthIntelligence";
import OsAutomation from "@/businessos/pages/OsAutomation";
import OsAutomationWorkflows from "@/businessos/pages/OsAutomationWorkflows";
import OsAutomationJobs from "@/businessos/pages/OsAutomationJobs";
import OsSettings from "@/businessos/pages/OsSettings";
import OsEmailMarketing from "@/businessos/pages/OsEmailMarketing";
import OsAICommandCenter from "@/businessos/pages/OsAICommandCenter";
import OsReminderCenter from "@/businessos/pages/OsReminderCenter";
import OsHelpCenter from "@/businessos/pages/OsHelpCenter";
import OsAnalytics from "@/businessos/pages/OsAnalytics";
import LegacyAdmin from "@/pages/LegacyAdmin";

export default function Admin() {
  return (
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
  );
}

