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
};

export const NAV: NavItem[] = [
  { label: "Dashboard",           to: "/admin",                 icon: LayoutDashboard, glow: "blue" },
  { label: "Clients",             to: "/admin/clients",         icon: Users,           glow: "cyan" },
  { label: "Companies",           to: "/admin/companies",       icon: Building2,       glow: "blue" },
  { label: "Orders",              to: "/admin/orders",          icon: ShoppingBag,     glow: "green" },
  { label: "Invoices",            to: "/admin/invoices",        icon: FileText,        glow: "lime" },
  { label: "Growth Intelligence", to: "/admin/attribution",     icon: Sparkles,        glow: "purple" },
  { label: "Documents",           to: "/admin/documents",       icon: FolderOpen,      glow: "cyan" },
  { label: "Compliance",          to: "/admin/compliance",      icon: CalendarClock,   glow: "amber" },

  { label: "Automation",          to: "/admin/automation",      icon: Zap,             glow: "lime" },
  { label: "Support",             to: "/admin/support",         icon: LifeBuoy,        glow: "red" },
  { label: "Settings",            to: "/admin/settings",        icon: Settings,        glow: "blue" },
];
