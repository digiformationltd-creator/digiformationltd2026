import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type StateRow = {
  state_code: string;
  state_name: string;
  starter_price_usd: number;
};

const UK_JURISDICTIONS = [
  { code: "EW", name: "England & Wales" },
  { code: "SC", name: "Scotland" },
  { code: "NI", name: "Northern Ireland" },
];

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const QuickStartWidget = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"usa" | "uk">("usa");
  const [states, setStates] = useState<StateRow[]>([]);
  const [usState, setUsState] = useState<string | undefined>(undefined);
  const [ukJur, setUkJur] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("us_llc_state_pricing")
        .select("state_code, state_name, starter_price_usd")
        .order("state_name", { ascending: true });
      if (data) setStates(data as StateRow[]);
    })();
  }, []);

  const selectedState = useMemo(
    () => states.find((s) => s.state_code === usState) ?? null,
    [states, usState],
  );
  const selectedJur = useMemo(
    () => UK_JURISDICTIONS.find((j) => j.code === ukJur) ?? null,
    [ukJur],
  );

  const handleStart = () => {
    if (tab === "usa" && usState) {
      navigate(`/usa-services/us-llc-formation/checkout?state=${usState}&package=Starter`);
    } else if (tab === "uk" && ukJur) {
      navigate(`/uk-services/uk-ltd-formation?jurisdiction=${ukJur}#packages`);
    }
  };

  const canStart = (tab === "usa" && !!usState) || (tab === "uk" && !!ukJur);

  return (
    <section className="relative -mt-8 md:-mt-16 z-20 pb-16 md:pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-3xl p-6 md:p-8 border border-border/50 shadow-elegant backdrop-blur-xl">
            {/* Heading */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.18em] mb-3">
                Quick Start
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Start your <em className="not-italic text-gradient">company in minutes</em>
              </h2>
              <p className="text-sm opacity-75 mt-2">
                Pick your jurisdiction — pricing updates automatically.
              </p>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-full mb-6">
              <button
                onClick={() => setTab("usa")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === "usa"
                    ? "bg-gradient-brand text-primary-foreground shadow-md"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Flag className="w-4 h-4" /> USA LLC
              </button>
              <button
                onClick={() => setTab("uk")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === "uk"
                    ? "bg-gradient-brand text-primary-foreground shadow-md"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Building2 className="w-4 h-4" /> UK Ltd
              </button>
            </div>

            {/* Selectors */}
            {tab === "usa" ? (
              <>
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold opacity-80 mb-2">
                  Select your state
                </label>
                <Select value={usState} onValueChange={setUsState}>
                  <SelectTrigger className="h-12 text-base rounded-xl bg-background/60 border-border/60">
                    <SelectValue placeholder="— Choose a U.S. state —" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 z-50">
                    {states.map((s) => (
                      <SelectItem key={s.state_code} value={s.state_code}>
                        {s.state_name} — from {formatUSD(Number(s.starter_price_usd))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedState && (
                  <div className="mt-3 text-xs opacity-80">
                    Starter package for <span className="font-semibold">{selectedState.state_name}</span>:{" "}
                    <span className="text-primary font-bold">
                      {formatUSD(Number(selectedState.starter_price_usd))}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold opacity-80 mb-2">
                  Select jurisdiction
                </label>
                <Select value={ukJur} onValueChange={setUkJur}>
                  <SelectTrigger className="h-12 text-base rounded-xl bg-background/60 border-border/60">
                    <SelectValue placeholder="— Choose a UK jurisdiction —" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {UK_JURISDICTIONS.map((j) => (
                      <SelectItem key={j.code} value={j.code}>
                        {j.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedJur && (
                  <div className="mt-3 text-xs opacity-80">
                    Registering in <span className="font-semibold">{selectedJur.name}</span> with Companies House.
                  </div>
                )}
              </>
            )}

            {/* CTA */}
            <Button
              variant="hero"
              size="lg"
              className="w-full mt-6 rounded-full"
              onClick={handleStart}
              disabled={!canStart}
            >
              {tab === "usa" ? "Continue to Checkout" : "View UK Ltd Packages"}{" "}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="mt-4 flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-[10px] uppercase tracking-[0.16em] opacity-60">
              <span>Companies House Authorised</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>IRS Acceptance Agent Network</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickStartWidget;
