import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, UserCircle2, Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/digiformation-logo.png";
import { z } from "zod";


const emailSchema = z.string().trim().email("Please enter a valid email").max(255);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol (e.g. !@#$)");
const signinPasswordSchema = z.string().min(1, "Password is required").max(72);
const nameSchema = z.string().trim().min(2, "Please enter your full name").max(100);

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showForgot, setShowForgot] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Redirect if already logged in (but NOT during password recovery)
  useEffect(() => {
    document.title = "Client Dashboard Login | DigiFormation Ltd";
    const isRecovery = /[#&?]type=recovery(&|$)/.test(window.location.hash || "");
    if (isRecovery) return; // let RecoveryRedirect handle it
    // INITIAL_SESSION fires automatically on mount with current session, so no need
    // to call getSession() separately (which would cause an extra token refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        
        const dest = session.user.email?.toLowerCase() === "info@digiformation.uk" ? "/admin" : "/dashboard";
        navigate(dest, { replace: true });
      }
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
    const pv = signinPasswordSchema.safeParse(password);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    setLoading(true);
    localStorage.removeItem("df_remember_me");
    localStorage.removeItem("df_session_started_at");
    const { error } = await supabase.auth.signInWithPassword({ email: ev.data, password: pv.data });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("invalid")
        ? "Invalid email or password"
        : error.message;
      return toast.error(msg);
    }
    toast.success("Welcome back!");
    const dest = ev.data.toLowerCase() === "info@digiformation.uk" ? "/admin" : "/dashboard";
    navigate(dest, { replace: true });
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
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: ev.data,
      password: pv.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: nv.data },
      },
    });
    if (error) {
      setLoading(false);
      const msg = error.message.toLowerCase().includes("already")
        ? "This email is already registered. Please sign in."
        : error.message;
      return toast.error(msg);
    }

    // If auto-confirm is on but no session returned, sign in immediately
    if (!signUpData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ev.data,
        password: pv.data,
      });
      setLoading(false);
      if (signInError) {
        return toast.error("Account created but auto-login failed. Please sign in manually.");
      }
    } else {
      setLoading(false);
    }

    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "welcome",
        recipientEmail: ev.data,
        idempotencyKey: `welcome-${ev.data}`,
        templateData: { customerName: nv.data, loginUrl: `${window.location.origin}/auth` },
      },
    }).catch((err) => console.error("welcome email failed", err));

    toast.success("Account created! Logging you in...");
    const dest = ev.data.toLowerCase() === "info@digiformation.uk" ? "/admin" : "/dashboard";
    navigate(dest, { replace: true });
  };

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const ev = emailSchema.safeParse(email);
    if (!ev.success) return toast.error(ev.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(ev.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      return toast.error("Reset link could not be sent. Please try again or contact support.");
    }
    // Always show same generic message (avoid email enumeration)
    toast.success("If an account exists for that email, a reset link has been sent.");
    setShowForgot(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid-pattern flex flex-col">
      <div className="container mx-auto px-4 pt-3 pb-2">
        <Link to="/" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition">
          <ArrowLeft className="w-4 h-4" /> Back to website
        </Link>
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 pb-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-3 sm:mb-4">
            <img src={logo} alt="Digiformation Ltd logo — UK LTD & US LLC formation for non-residents worldwide" className="h-20 sm:h-24 w-auto object-contain mb-2" />
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full glass">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure client login · 256-bit encrypted</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 sm:p-6 shadow-elegant">
            <div className="flex flex-col items-center mb-4">
              <UserCircle2 className="w-8 h-8 mb-1 opacity-80" />
              <h1 className="text-lg font-semibold">Client Dashboard</h1>
              <p className="text-xs opacity-70 mt-0.5">Manage your company, orders & subscriptions</p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                {showForgot ? (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <p className="text-xs opacity-70">
                      Enter your account email and we'll send you a secure link to reset your password.
                    </p>
                    <div>
                      <Label htmlFor="fp-email">Email</Label>
                      <div className="relative mt-1.5">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary/80" />
                        <Input id="fp-email" name="email" type="email" required placeholder="Enter your email" className="pl-9 bg-background/40 border-white/15 focus-visible:ring-primary/50" autoComplete="email" />
                      </div>
                    </div>
                    <Button type="submit" variant="hero" className="w-full rounded-full" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send Reset Link
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="text-xs opacity-70 hover:opacity-100 underline w-full text-center"
                    >
                      ← Back to sign in
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="si-email">Email</Label>
                      <div className="relative mt-1.5">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary/80" />
                        <Input id="si-email" name="email" type="email" required placeholder="Enter your email" className="pl-9 bg-background/40 border-white/15 focus-visible:ring-primary/50" autoComplete="email" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="si-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-xs opacity-70 hover:opacity-100 underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative mt-1.5">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary/80" />
                        <Input
                          id="si-password"
                          name="password"
                          type={showSignInPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          className="pl-9 pr-12 bg-background/40 border-white/15 focus-visible:ring-primary/50"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition"
                          aria-label={showSignInPassword ? "Hide password" : "Show password"}
                        >
                          {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" variant="hero" className="w-full rounded-full" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCircle2 className="w-4 h-4" />}
                      Sign In to Dashboard
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="su-name">Full Name</Label>
                    <div className="relative mt-1.5">
                      <UserCircle2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary/80" />
                      <Input id="su-name" name="fullName" required placeholder="Enter your full name" className="pl-9 bg-background/40 border-white/15 focus-visible:ring-primary/50" autoComplete="name" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="su-email">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary/80" />
                      <Input id="su-email" name="email" type="email" required placeholder="Enter your email" className="pl-9 bg-background/40 border-white/15 focus-visible:ring-primary/50" autoComplete="email" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="su-password">Password</Label>
                    <div className="relative mt-1.5">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary/80" />
                      <Input
                        id="su-password"
                        name="password"
                        type={showSignUpPassword ? "text" : "password"}
                        required
                        placeholder="Min 8 chars · Aa1!"
                        className="pl-9 pr-12 bg-background/40 border-white/15 focus-visible:ring-primary/50"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition"
                        aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] opacity-60 mt-1">
                      Must include uppercase, lowercase, number & symbol. Leaked passwords are blocked.
                    </p>
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
            <a href="mailto:info@digiformation.uk" className="underline">
              info@digiformation.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
