import {
  LayoutDashboard, Users, UserCheck, ShoppingBag, Package, FileText,
  Wallet, MessageCircle, Mail, BarChart3, CheckSquare, UsersRound,
  LifeBuoy, FolderOpen, Zap, Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: any;
  glow: "blue"|"purple"|"green"|"amber"|"red"|"cyan"|"pink"|"lime";
};

export const NAV: NavItem[] = [
  { label: "Dashboard",       to: "/admin",                 icon: LayoutDashboard, glow: "blue" },
  { label: "Leads",           to: "/admin/leads",           icon: UserCheck,       glow: "purple" },
  { label: "Clients",         to: "/admin/clients",         icon: Users,           glow: "cyan" },
  { label: "Orders",          to: "/admin/orders",          icon: ShoppingBag,     glow: "green" },
  { label: "Services",        to: "/admin/services",        icon: Package,         glow: "amber" },
  { label: "Invoices",        to: "/admin/invoices",        icon: FileText,        glow: "lime" },
  { label: "Finance",         to: "/admin/finance",         icon: Wallet,          glow: "green" },
  { label: "WhatsApp CRM",    to: "/admin/whatsapp",        icon: MessageCircle,   glow: "green" },
  { label: "Email Marketing", to: "/admin/email-marketing", icon: Mail,            glow: "pink" },
  { label: "Analytics",       to: "/admin/analytics",       icon: BarChart3,       glow: "blue" },
  { label: "Tasks",           to: "/admin/tasks",           icon: CheckSquare,     glow: "amber" },
  { label: "Team",            to: "/admin/team",            icon: UsersRound,      glow: "purple" },
  { label: "Support",         to: "/admin/support",         icon: LifeBuoy,        glow: "red" },
  { label: "Documents",       to: "/admin/documents",       icon: FolderOpen,      glow: "cyan" },
  { label: "Automation",      to: "/admin/automation",      icon: Zap,             glow: "lime" },
  { label: "Settings",        to: "/admin/settings",        icon: Settings,        glow: "blue" },
];
