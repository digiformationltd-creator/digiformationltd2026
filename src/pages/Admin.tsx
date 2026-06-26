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
import Placeholder from "@/businessos/pages/Placeholder";

import OsEmailOps from "@/businessos/pages/OsEmailOps";
import OsCompliance from "@/businessos/pages/OsCompliance";
import OsWhatsAppCRM from "@/businessos/pages/whatsapp/OsWhatsAppCRM";
import OsWhatsAppContactDetail from "@/businessos/pages/whatsapp/OsWhatsAppContactDetail";
import OsAttribution from "@/businessos/pages/OsAttribution";
import LegacyAdmin from "@/pages/LegacyAdmin";

export default function Admin() {
  return (
    <Routes>
      <Route path="legacy/*" element={<LegacyAdmin />} />
      <Route element={<BusinessOSLayout />}>
        <Route index element={<OsDashboard />} />
        <Route path="leads" element={<OsLeads />} />
        <Route path="services" element={<OsServices />} />
        <Route path="clients" element={<OsClients />} />
        <Route path="clients/:id" element={<OsClientDetail />} />
        <Route path="companies" element={<OsCompanies />} />
        <Route path="managed-companies" element={<OsManagedCompanies />} />
        <Route path="managed-companies/:id" element={<OsManagedCompanyDetail />} />
        <Route path="orders" element={<OsOrders />} />
        <Route path="invoices" element={<OsInvoices />} />
        <Route path="finance" element={<Placeholder title="Finance" />} />
        <Route path="whatsapp" element={<OsWhatsAppCRM />} />
        <Route path="whatsapp/:id" element={<OsWhatsAppContactDetail />} />
        <Route path="email-marketing" element={<Placeholder title="Email Marketing" description="Campaigns dispatched through the existing email queue — no new sender." />} />
        <Route path="analytics" element={<Placeholder title="Analytics" />} />
        <Route path="attribution" element={<OsAttribution />} />
        <Route path="tasks" element={<Placeholder title="Tasks" />} />
        <Route path="team" element={<Placeholder title="Team" />} />
        <Route path="support" element={<OsSupport />} />
        <Route path="documents" element={<OsDocuments />} />
        <Route path="automation" element={<Placeholder title="Automation" description="Event-based rules that fire the legacy email engine. No new sender." />} />
        
        <Route path="email-ops" element={<OsEmailOps />} />
        <Route path="compliance" element={<OsCompliance />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
      </Route>
    </Routes>
  );
}
