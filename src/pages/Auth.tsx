import { useSeo } from "@/lib/seo";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { checkAdminSession, recoverSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, UserCircle2, Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/digiformation-logo-official.png";
import { z } from "zod";


const emailSchema = z.string().trim().email("Please enter a valid email").max(255);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");
const signinPasswordSchema = z.string().min(1, "Password is required").max(72);
const nameSchema = z.string().trim().min(2, "Please enter your full name").max(100);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirect") || "", [searchParams]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showForgot, setShowForgot] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const destinationForEmail = (email?: string | null) => {
    if (redirectTo && redirectTo.startsWith("/")) return redirectTo;
    return email?.toLowerCase() === "info@digiformation.uk" ? "/admin" : "/dashboard";
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Could not sign in with Google. Please try again.");
      return;
    }
    if (result.redirected) return;
    // Session set
    setGoogleLoading(false);
  };

  // Redirect if already logged in (but NOT during password recovery)
  useSeo({
    title: "Client Dashboard Login | Digiformation Ltd",
    description: "Sign in to your Digiformation client dashboard to manage your UK LTD, US LLC, banking and compliance services.",
    noindex: true,
  });

  useEffect(() => {
    const isRecovery = /[#&?]type=recovery(&|$)/.test(window.location.hash || "");
    if (isRecovery) return; // let RecoveryRedirect handle it
    let redirected = false;
    const routeForSession = (session: NonNullable<Awaited<ReturnType<typeof recoverSession>>["session"]>) => {
      if (redirected) return;
      redirected = true;
      navigate(destinationForEmail(session.user.email), { replace: true });
    };
    // INITIAL_SESSION fires automatically on mount with current session, so no need
    // to call getSession() separately (which would cause an extra token refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        routeForSession(session);
      }
      if (event === "INITIAL_SESSION" && !session) {
        recoverSession().then(({ session: recovered }) => {
          if (recovered) routeForSession(recovered);
        });
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
    const admin = ev.data.toLowerCase() === "info@digiformation.uk" ? await checkAdminSession() : null;
    const dest = admin?.ok ? "/admin" : destinationForEmail(ev.data);
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
    const dest = destinationForEmail(ev.data);
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

            {redirectTo && (
              <div className="mb-3 text-xs text-center px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                Sign in or create an account to complete your order.
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full mb-3 rounded-full inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium border border-white/40 transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-2 1.4-4.4 2.1-7.1 2.1-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.1 5c-.4.4 6.7-4.9 6.7-14.4 0-1.2-.1-2.4-.4-3.5z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-white/15" />
              <span className="text-[10px] uppercase tracking-wider opacity-60">or</span>
              <div className="h-px flex-1 bg-white/15" />
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
                        placeholder="At least 8 characters"
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
                      At least 8 characters with a letter and a number.
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
