import { useSeo } from "@/lib/seo";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ShieldCheck, Lock, Loader2, ArrowLeft, Eye, EyeOff,
  Check, X, KeyRound, AlertTriangle, CheckCircle2,
} from "lucide-react";
import logo from "@/assets/digiformation-logo-official.png";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

type Status = "checking" | "ready" | "invalid" | "success";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useSeo({
    title: "Reset Password | Digiformation Ltd",
    description: "Set a new password for your Digiformation client account.",
    noindex: true,
  });

  useEffect(() => {
    let mounted = true;
    let timeoutId: number | undefined;

    // Listen for the recovery event fired when Supabase parses the URL hash
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setUserEmail(session?.user.email ?? null);
        setStatus("ready");
      }
    });

    // Also check immediately in case session is already set
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setUserEmail(session.user.email ?? null);
        setStatus("ready");
      } else {
        // Wait briefly for the hash-based session to populate
        timeoutId = window.setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (!mounted) return;
            if (s) {
              setUserEmail(s.user.email ?? null);
              setStatus("ready");
            } else {
              setStatus("invalid");
            }
          });
        }, 1500);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  // Live password rule checks (relaxed: length + letter + number)
  const checks = useMemo(() => ({
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
  }), [password]);

  const passedCount = Object.values(checks).filter(Boolean).length;
  const strengthLabel =
    passedCount === 0 ? "Very weak" :
    passedCount === 1 ? "Weak" :
    passedCount === 2 ? "Fair" : "Strong";
  const strengthColor =
    passedCount === 0 ? "bg-destructive" :
    passedCount === 1 ? "bg-orange-500" :
    passedCount === 2 ? "bg-yellow-500" : "bg-emerald-500";

  const matches = confirm.length > 0 && confirm === password;
  const allValid = passedCount === 3 && matches;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    const pv = passwordSchema.safeParse(password);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pv.data });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("same")
        ? "New password must be different from your current password."
        : error.message;
      return toast.error(msg);
    }
    setStatus("success");
    toast.success("Password updated successfully.");
    // Sign out so they sign in fresh with the new password
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    }, 2200);
  };

  const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className={`flex items-center gap-2 text-xs transition ${ok ? "text-emerald-500" : "opacity-70"}`}>
      <span className={`w-4 h-4 rounded-full grid place-items-center shrink-0 ${ok ? "bg-emerald-500/20" : "bg-muted"}`}>
        {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-50" />}
      </span>
      {label}
    </li>
  );

  return (
    <div className="min-h-screen bg-gradient-hero grid-pattern flex flex-col">
      <div className="container mx-auto px-4 pt-4 pb-2">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-4">
            <img src={logo} alt="Digiformation Ltd logo — UK LTD & US LLC formation for non-residents worldwide" className="h-20 sm:h-24 w-auto object-contain mb-2" />
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full glass">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure password reset · 256-bit encrypted</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 sm:p-7 shadow-elegant">
            {/* Header */}
            <div className="flex flex-col items-center mb-5 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/15 grid place-items-center mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-semibold">Create a new password</h1>
              {userEmail && status === "ready" && (
                <p className="text-xs opacity-70 mt-1">
                  for <span className="font-medium opacity-100">{userEmail}</span>
                </p>
              )}
            </div>

            {/* Checking state */}
            {status === "checking" && (
              <div className="py-12 grid place-items-center">
                <Loader2 className="w-7 h-7 animate-spin opacity-60 mb-3" />
                <p className="text-xs opacity-70">Verifying your reset link…</p>
              </div>
            )}

            {/* Invalid link */}
            {status === "invalid" && (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-destructive/15 grid place-items-center mx-auto">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Reset link invalid or expired</h2>
                  <p className="text-xs opacity-70 mt-1.5 max-w-xs mx-auto">
                    Password reset links expire after 60 minutes and can only be used once. Please request a new one.
                  </p>
                </div>
                <Button asChild variant="hero" className="rounded-full">
                  <Link to="/auth">Request a new reset link</Link>
                </Button>
              </div>
            )}

            {/* Success */}
            {status === "success" && (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 grid place-items-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Password updated</h2>
                  <p className="text-xs opacity-70 mt-1.5">
                    Redirecting you to sign in with your new password…
                  </p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin opacity-50 mx-auto" />
              </div>
            )}

            {/* Form */}
            {status === "ready" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="np">New password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <Input
                      id="np"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      required
                      placeholder="Enter a strong new password"
                      className="pl-9 pr-10"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strengthColor} transition-all duration-300`}
                          style={{ width: `${(passedCount / 5) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[11px]">
                        <span className="opacity-70">Strength</span>
                        <span className={`font-medium ${passedCount >= 4 ? "text-emerald-500" : passedCount >= 3 ? "text-yellow-500" : "text-destructive"}`}>
                          {strengthLabel}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Live checklist */}
                  <ul className="mt-3 grid grid-cols-1 gap-1.5">
                    <Rule ok={checks.length} label="At least 8 characters" />
                    <Rule ok={checks.letter} label="At least one letter (a-z or A-Z)" />
                    <Rule ok={checks.number} label="At least one number (0-9)" />
                  </ul>
                </div>

                <div>
                  <Label htmlFor="cp">Confirm new password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <Input
                      id="cp"
                      name="confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      placeholder="Re-enter your new password"
                      className="pl-9 pr-10"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirm.length > 0 && (
                    <p className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${matches ? "text-emerald-500" : "text-destructive"}`}>
                      {matches ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {matches ? "Passwords match" : "Passwords do not match"}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full rounded-full"
                  disabled={loading || !allValid}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? "Updating password…" : "Update password"}
                </Button>

                <p className="text-[11px] opacity-60 text-center leading-relaxed">
                  After updating, you'll be signed out and asked to sign in again with your new password — on all devices.
                </p>
              </form>
            )}
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

export default ResetPassword;
