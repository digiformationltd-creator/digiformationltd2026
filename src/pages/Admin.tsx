import { Routes, Route } from "react-router-dom";
import BusinessOSLayout from "@/businessos/BusinessOSLayout";
import OsDashboard from "@/businessos/pages/OsDashboard";
import OsLeads from "@/businessos/pages/OsLeads";
import OsServices from "@/businessos/pages/OsServices";
import OsClients from "@/businessos/pages/OsClients";
import OsOrders from "@/businessos/pages/OsOrders";
import OsInvoices from "@/businessos/pages/OsInvoices";
import Placeholder from "@/businessos/pages/Placeholder";
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
        <Route path="orders" element={<OsOrders />} />
        <Route path="invoices" element={<OsInvoices />} />
        <Route path="finance" element={<Placeholder title="Finance" />} />
        <Route path="whatsapp" element={<Placeholder title="WhatsApp CRM" />} />
        <Route path="email-marketing" element={<Placeholder title="Email Marketing" description="Campaigns dispatched through the existing email queue — no new sender." />} />
        <Route path="analytics" element={<Placeholder title="Analytics" />} />
        <Route path="tasks" element={<Placeholder title="Tasks" />} />
        <Route path="team" element={<Placeholder title="Team" />} />
        <Route path="support" element={<Placeholder title="Support" />} />
        <Route path="documents" element={<Placeholder title="Documents" />} />
        <Route path="automation" element={<Placeholder title="Automation" description="Event-based rules that fire the legacy email engine. No new sender." />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
      </Route>
    </Routes>
  );
}
