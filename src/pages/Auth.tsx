import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, UserCircle2, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/digiformation-logo.png";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Please enter your full name").max(100);

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // Redirect if already logged in
  useEffect(() => {
    document.title = "Client Dashboard Login | Digiformation";
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const ev = emailSchema.safeParse(email);
    if (!ev.success) return toast.error(ev.error.issues[0].message);
    const pv = passwordSchema.safeParse(password);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: ev.data, password: pv.data });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("invalid")
        ? "Invalid email or password"
        : error.message;
      return toast.error(msg);
    }
    toast.success("Welcome back!");
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") || "");
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    const nv = nameSchema.safeParse(fullName);
    if (!nv.success) return toast.error(nv.error.issues[0].message);
    const ev = emailSchema.safeParse(email);
    if (!ev.success) return toast.error(ev.error.issues[0].message);
    const pv = passwordSchema.safeParse(password);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: ev.data,
      password: pv.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: nv.data },
      },
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("already")
        ? "This email is already registered. Please sign in."
        : error.message;
      return toast.error(msg);
    }
    toast.success("Account created! Please check your email to verify.");
    setTab("signin");
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid-pattern flex flex-col">
      <div className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition">
          <ArrowLeft className="w-4 h-4" /> Back to website
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Digiformation" className="h-20 w-auto object-contain mb-3" />
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure client login · 256-bit encrypted</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8 shadow-elegant">
            <div className="flex flex-col items-center mb-5">
              <UserCircle2 className="w-10 h-10 mb-2 opacity-80" />
              <h1 className="text-xl font-semibold">Client Dashboard</h1>
              <p className="text-xs opacity-70 mt-1">Manage your company, orders & subscriptions</p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="si-email">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                      <Input id="si-email" name="email" type="email" required placeholder="you@company.com" className="pl-9" autoComplete="email" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="si-password">Password</Label>
                    <div className="relative mt-1.5">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                      <Input id="si-password" name="password" type="password" required placeholder="••••••••" className="pl-9" autoComplete="current-password" />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full rounded-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCircle2 className="w-4 h-4" />}
                    Sign In to Dashboard
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="su-name">Full Name</Label>
                    <Input id="su-name" name="fullName" required placeholder="Muhammad Khurram Ali" className="mt-1.5" autoComplete="name" />
                  </div>
                  <div>
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" name="email" type="email" required placeholder="you@company.com" className="mt-1.5" autoComplete="email" />
                  </div>
                  <div>
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" name="password" type="password" required placeholder="At least 8 characters" className="mt-1.5" autoComplete="new-password" />
                  </div>
                  <Button type="submit" variant="hero" className="w-full rounded-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCircle2 className="w-4 h-4" />}
                    Create Client Account
                  </Button>
                  <p className="text-[11px] opacity-70 text-center">
                    By signing up you agree to our{" "}
                    <Link to="/terms" className="underline">Terms</Link> &{" "}
                    <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-center text-xs opacity-70 mt-5">
            Need help? Email{" "}
            <a href="mailto:digiformationltd@gmail.com" className="underline">
              digiformationltd@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
