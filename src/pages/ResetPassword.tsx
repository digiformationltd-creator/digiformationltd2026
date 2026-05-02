import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Lock, Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/digiformation-logo.png";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol (e.g. !@#$)");

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Reset Password | DigiFormation Ltd";
    // Supabase places a recovery session in the URL hash. The client picks it up automatically.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Wait briefly for hash-based session to populate
        const t = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) setReady(true);
            else {
              toast.error("This reset link is invalid or expired. Request a new one.");
              navigate("/auth", { replace: true });
            }
          });
        }, 800);
        return () => clearTimeout(t);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");

    if (password !== confirm) return toast.error("Passwords do not match");
    const pv = passwordSchema.safeParse(password);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pv.data });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in with your new password.");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid-pattern flex flex-col">
      <div className="container mx-auto px-4 py-6">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="DigiFormation Ltd" className="h-20 w-auto object-contain mb-3" />
            <div className="text-base font-semibold tracking-tight">DigiFormation Ltd</div>
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass mt-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure password reset</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8 shadow-elegant">
            <div className="flex flex-col items-center mb-5">
              <Lock className="w-10 h-10 mb-2 opacity-80" />
              <h1 className="text-xl font-semibold">Set a new password</h1>
              <p className="text-xs opacity-70 mt-1 text-center">Choose a strong password you have not used before.</p>
            </div>

            {!ready ? (
              <div className="py-10 grid place-items-center">
                <Loader2 className="w-6 h-6 animate-spin opacity-60" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="np">New Password</Label>
                  <Input id="np" name="password" type="password" required placeholder="Min 8 chars · Aa1!" className="mt-1.5" autoComplete="new-password" />
                  <p className="text-[10px] opacity-60 mt-1">
                    Must include uppercase, lowercase, number & symbol. Leaked passwords are blocked.
                  </p>
                </div>
                <div>
                  <Label htmlFor="cp">Confirm New Password</Label>
                  <Input id="cp" name="confirm" type="password" required placeholder="Re-enter password" className="mt-1.5" autoComplete="new-password" />
                </div>
                <Button type="submit" variant="hero" className="w-full rounded-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Update Password
                </Button>
              </form>
            )}
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

export default ResetPassword;
