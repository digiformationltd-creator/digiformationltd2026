import {
  LayoutDashboard, Users, ShoppingBag, FileText,
  LifeBuoy, FolderOpen, Zap, Settings,
  Building2, CalendarClock, Sparkles,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: any;
  glow: "blue"|"purple"|"green"|"amber"|"red"|"cyan"|"pink"|"lime";
  children?: { label: string; to: string }[];
};

export const NAV: NavItem[] = [
  { label: "Dashboard",           to: "/admin",                 icon: LayoutDashboard, glow: "blue" },
  { label: "Clients",             to: "/admin/clients",         icon: Users,           glow: "cyan" },
  { label: "Companies",           to: "/admin/companies",       icon: Building2,       glow: "blue" },
  { label: "Orders",              to: "/admin/orders",          icon: ShoppingBag,     glow: "green" },
  { label: "Invoices",            to: "/admin/invoices",        icon: FileText,        glow: "lime" },
  { label: "Documents",           to: "/admin/documents",       icon: FolderOpen,      glow: "cyan" },
  { label: "Compliance",          to: "/admin/compliance",      icon: CalendarClock,   glow: "amber" },

  {
    label: "Automation",
    to: "/admin/automation",
    icon: Zap,
    glow: "lime",
    children: [
      { label: "Dashboard",          to: "/admin/automation" },
      { label: "AI Command Center",  to: "/admin/automation/command-center" },
      { label: "Email Marketing",    to: "/admin/automation/email-marketing" },
      { label: "Leads",              to: "/admin/automation/leads" },
      { label: "WhatsApp CRM",       to: "/admin/automation/whatsapp" },
      { label: "Reminder Center",    to: "/admin/automation/reminders" },
      { label: "Jobs",               to: "/admin/automation/jobs" },
      { label: "Workflows",          to: "/admin/automation/workflows" },
      { label: "Analytics",          to: "/admin/automation/analytics" },
    ],
  },
  { label: "Support",             to: "/admin/support",         icon: LifeBuoy,        glow: "red" },
  { label: "Settings",            to: "/admin/settings",        icon: Settings,        glow: "blue" },
];
