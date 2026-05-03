import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Menu, LayoutDashboard, ShieldCheck, ShoppingBag, FileText, Wallet,
  Building2, MapPin, UserCog, ShoppingCart, Ticket, LifeBuoy, LogOut,
  Handshake, CalendarDays,
} from "lucide-react";

/**
 * Persistent floating hamburger drawer for logged-in users.
 * Visible on every page (mobile AND desktop) so the dashboard / admin
 * panel is always one click away.
 */
const UserDrawer = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    (async () => {
      const ownerEmail = "info@digiformation.uk";
      if (user.email?.toLowerCase() === ownerEmail) { setIsAdmin(true); return; }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  if (!user) return null;

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    setOpen(false);
    navigate("/");
  };

  const go = (path: string) => { setOpen(false); navigate(path); };

  const dashSections: { id: string; label: string; icon: any }[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "subscriptions", label: "Subscriptions", icon: CalendarDays },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "invoices", label: "My Invoices", icon: FileText },
    { id: "wallet", label: "My Wallet", icon: Wallet },
    { id: "company", label: "My Companies", icon: Building2 },
    { id: "editAddress", label: "My Addresses", icon: MapPin },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "editAccount", label: "Edit Account", icon: UserCog },
    { id: "newServices", label: "Order Services", icon: ShoppingCart },
    { id: "affiliate", label: "Affiliate", icon: Handshake },
    { id: "tickets", label: "My Tickets", icon: Ticket },
    { id: "openTicket", label: "Open Ticket", icon: LifeBuoy },
  ];

  const initials = (user.email?.slice(0, 2) || "U").toUpperCase();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="hero"
          size="icon"
          className="fixed bottom-5 right-5 z-50 rounded-full w-14 h-14 shadow-glow"
          aria-label="Open my account menu"
        >
          <Menu className="!w-6 !h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] sm:w-[360px] p-0 flex flex-col">
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-brand grid place-items-center font-semibold text-sm shadow-glow shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">My Account</div>
            <div className="text-xs opacity-70 truncate">{user.email}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {isAdmin && (
            <Button
              variant="hero"
              className="w-full mb-3 rounded-full justify-start"
              onClick={() => go("/admin")}
            >
              <ShieldCheck className="w-4 h-4" /> Admin Panel
            </Button>
          )}

          <div className="text-[10px] uppercase tracking-widest opacity-60 px-3 mb-2">My Dashboard</div>
          {dashSections.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                to={`/dashboard?section=${s.id}`}
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-primary/10 opacity-90"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{s.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/40">
          <Button onClick={signOut} variant="outline" className="w-full rounded-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserDrawer;
