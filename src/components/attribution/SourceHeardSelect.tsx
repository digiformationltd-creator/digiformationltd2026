import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DeclaredSource, SourceCategory } from "@/lib/attribution";
import { SOURCE_OPTIONS } from "@/lib/attribution-sources";

const GROUPS: { key: SourceCategory; label: string }[] = [
  { key: "ai", label: "AI Platforms" },
  { key: "search", label: "Search Engines" },
  { key: "social", label: "Social Media" },
  { key: "direct", label: "Direct / Referral" },
];

export type SourceHeardSelectProps = {
  value: DeclaredSource | null;
  onChange: (v: DeclaredSource) => void;
  error?: boolean;
};

const SourceHeardSelect = ({ value, onChange, error }: SourceHeardSelectProps) => {
  const isOther = value?.id === "other";
  const [otherText, setOtherText] = useState<string>(
    isOther && value && value.label !== "Other" ? value.label.replace(/^Other:\s*/, "") : "",
  );

  const handleSelect = (id: string) => {
    const opt = SOURCE_OPTIONS.find((o) => o.id === id);
    if (!opt) return;
    if (opt.id === "other") {
      onChange({ id: "other", label: otherText ? `Other: ${otherText}` : "Other", category: "direct" });
    } else {
      onChange({ id: opt.id, label: opt.label, category: opt.category });
    }
  };

  const handleOtherText = (txt: string) => {
    setOtherText(txt);
    onChange({ id: "other", label: txt ? `Other: ${txt}` : "Other", category: "direct" });
  };

  return (
    <div
      className={`rounded-2xl border ${error ? "border-destructive/60" : "border-border/40"} p-4 md:p-5 space-y-3`}
    >
      <div className="space-y-1">
        <Label htmlFor="source-heard" className="text-sm font-semibold">
          How did you find us? <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs opacity-70">Required — helps us understand where our customers come from.</p>
      </div>

      <Select value={value?.id ?? ""} onValueChange={handleSelect}>
        <SelectTrigger
          id="source-heard"
          className={`h-11 rounded-xl bg-background/60 ${error ? "border-destructive/60" : ""}`}
        >
          <SelectValue placeholder="Select an option…" />
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-[320px]">
          {GROUPS.map((g) => {
            const items = SOURCE_OPTIONS.filter((o) => o.category === g.key);
            if (items.length === 0) return null;
            return (
              <SelectGroup key={g.key}>
                <SelectLabel className="text-[10px] uppercase tracking-[0.16em] opacity-60">
                  {g.label}
                </SelectLabel>
                {items.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base leading-none">{o.emoji ?? "•"}</span>
                      <span>{o.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>

      {isOther && (
        <Input
          autoFocus
          value={otherText}
          onChange={(e) => handleOtherText(e.target.value)}
          placeholder="Please tell us where you found us"
          className="h-11 rounded-xl bg-background/60"
        />
      )}

      {error && (
        <p className="text-xs text-destructive font-medium">
          Please tell us how you found us before submitting.
        </p>
      )}
    </div>
  );
};

export default SourceHeardSelect;
