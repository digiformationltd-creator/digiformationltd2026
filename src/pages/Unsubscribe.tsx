import { useSeo } from "@/lib/seo";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "validating" | "ready" | "already" | "invalid" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("validating");
  const [errorMsg, setErrorMsg] = useState("");

  useSeo({
    title: "Unsubscribe | Digiformation Ltd",
    description: "Unsubscribe from Digiformation email communications.",
    noindex: true,
  });

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (data.valid === true) setState("ready");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setErrorMsg(error.message);
      setState("error");
      return;
    }
    if ((data as any)?.success) setState("done");
    else if ((data as any)?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <Layout>
      <section className="container mx-auto max-w-xl px-4 py-20 text-center">
        <div className="glass glass-tint-sky rounded-3xl p-10">
          {state === "validating" && (
            <>
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin opacity-70" />
              <h1 className="text-2xl font-bold">Checking your link…</h1>
            </>
          )}
          {state === "ready" && (
            <>
              <h1 className="text-3xl font-bold mb-3">Unsubscribe</h1>
              <p className="opacity-80 mb-6">
                Click below to stop receiving emails from Digiformation Ltd at this address.
              </p>
              <Button variant="hero" onClick={confirm} className="rounded-full">
                Confirm Unsubscribe
              </Button>
            </>
          )}
          {state === "submitting" && (
            <>
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin opacity-70" />
              <h1 className="text-2xl font-bold">Processing…</h1>
            </>
          )}
          {state === "done" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h1 className="text-2xl font-bold mb-2">You've been unsubscribed</h1>
              <p className="opacity-80">You won't receive further emails at this address.</p>
            </>
          )}
          {state === "already" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h1 className="text-2xl font-bold mb-2">Already unsubscribed</h1>
              <p className="opacity-80">This address is already on our suppression list.</p>
            </>
          )}
          {state === "invalid" && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h1 className="text-2xl font-bold mb-2">Invalid or expired link</h1>
              <p className="opacity-80">
                This unsubscribe link is no longer valid. Please contact us if you need help.
              </p>
            </>
          )}
          {state === "error" && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="opacity-80">{errorMsg || "Please try again later."}</p>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Unsubscribe;
