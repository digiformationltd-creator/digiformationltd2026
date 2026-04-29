import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Check, ChevronsUpDown, Flag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type StateRow = {
  state_code: string;
  state_name: string;
  starter_price_usd: number;
  is_popular?: boolean;
};

const UK_JURISDICTIONS = [
  { code: "EW", name: "England & Wales" },
  { code: "SC", name: "Scotland" },
  { code: "NI", name: "Northern Ireland" },
];

// Featured states surfaced as quick chips above the dropdown
const POPULAR_CODES = ["WY", "DE", "FL", "TX", "NM", "MT"];

const LAST_STATE_KEY = "qs_last_us_state";
const LAST_JUR_KEY = "qs_last_uk_jurisdiction";

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const QuickStartWidget = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"usa" | "uk">("usa");
  const [states, setStates] = useState<StateRow[]>([]);
  const [usState, setUsState] = useState<string | undefined>(undefined);
  const [ukJur, setUkJur] = useState<string | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("us_llc_state_pricing")
        .select("state_code, state_name, starter_price_usd, is_popular")
        .order("state_name", { ascending: true });
      if (data) setStates(data as StateRow[]);
    })();

    // Auto-preselect last choices from localStorage
    try {
      const lastState = localStorage.getItem(LAST_STATE_KEY);
      if (lastState) setUsState(lastState);
      const lastJur = localStorage.getItem(LAST_JUR_KEY);
      if (lastJur) setUkJur(lastJur);
    } catch {
      /* ignore */
    }
  }, []);

  const popularStates = useMemo(
    () =>
      POPULAR_CODES.map((c) => states.find((s) => s.state_code === c)).filter(
        (s): s is StateRow => Boolean(s),
      ),
    [states],
  );

  const selectedState = useMemo(
    () => states.find((s) => s.state_code === usState) ?? null,
    [states, usState],
  );
  const selectedJur = useMemo(
    () => UK_JURISDICTIONS.find((j) => j.code === ukJur) ?? null,
    [ukJur],
  );

  const pickState = (code: string) => {
    setUsState(code);
    setPopoverOpen(false);
    try {
      localStorage.setItem(LAST_STATE_KEY, code);
    } catch {
      /* ignore */
    }
  };

  const pickJurisdiction = (code: string) => {
    setUkJur(code);
    try {
      localStorage.setItem(LAST_JUR_KEY, code);
    } catch {
      /* ignore */
    }
  };

  const handleStart = () => {
    if (tab === "usa" && usState) {
      navigate(`/usa-services/us-llc-formation/choose-state?state=${usState}#packages`);
    } else if (tab === "uk" && ukJur) {
      navigate(`/uk-services/uk-ltd-formation/choose-jurisdiction?jurisdiction=${ukJur}`);
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] uppercase tracking-[0.18em] font-semibold opacity-80">
                    Select your state
                  </label>
                  <span className="text-[10px] uppercase tracking-[0.14em] opacity-60">
                    {states.length} states · search by name or code
                  </span>
                </div>

                {/* Searchable Combobox */}
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full h-12 rounded-xl bg-background/60 border border-border/60 hover:border-primary/50 px-4 text-left flex items-center justify-between text-base transition-colors"
                    >
                      {selectedState ? (
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-bold opacity-60 px-1.5 py-0.5 rounded bg-muted">
                            {selectedState.state_code}
                          </span>
                          <span className="font-semibold truncate">{selectedState.state_name}</span>
                          <span className="opacity-70 text-sm whitespace-nowrap">
                            · from {formatUSD(Number(selectedState.starter_price_usd))}
                          </span>
                        </span>
                      ) : (
                        <span className="opacity-60">Search a U.S. state (e.g. Wyoming, TX)…</span>
                      )}
                      <ChevronsUpDown className="w-4 h-4 opacity-60 flex-shrink-0 ml-2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover border-border/60"
                    align="start"
                  >
                    <Command
                      filter={(value, search) => {
                        // value is "name|code" — match against either
                        const v = value.toLowerCase();
                        const s = search.toLowerCase();
                        return v.includes(s) ? 1 : 0;
                      }}
                    >
                      <CommandInput placeholder="Type a state name or code…" className="h-11" />
                      <CommandList className="max-h-72">
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          {states.map((s) => {
                            const isActive = s.state_code === usState;
                            return (
                              <CommandItem
                                key={s.state_code}
                                value={`${s.state_name}|${s.state_code}`}
                                onSelect={() => pickState(s.state_code)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "w-4 h-4 text-primary flex-shrink-0",
                                    isActive ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span className="text-[10px] font-bold opacity-60 px-1.5 py-0.5 rounded bg-muted">
                                  {s.state_code}
                                </span>
                                <span className="font-medium flex-1 truncate">{s.state_name}</span>
                                <span className="text-xs opacity-70 whitespace-nowrap">
                                  from {formatUSD(Number(s.starter_price_usd))}
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Popular state chips */}
                {popularStates.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] opacity-70 mb-2">
                      <Star className="w-3 h-3 text-primary" /> Popular choices
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularStates.map((s) => (
                        <button
                          key={s.state_code}
                          onClick={() => pickState(s.state_code)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                            usState === s.state_code
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border/60 hover:border-primary/60 hover:bg-primary/5",
                          )}
                        >
                          {s.state_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedState && (
                  <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
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
                <Select value={ukJur} onValueChange={pickJurisdiction}>
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
              {tab === "usa" ? "View Packages for this State" : "View UK Ltd Packages"}{" "}
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
