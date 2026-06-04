import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

interface SearchableCountrySelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function SearchableCountrySelect({
  label,
  value,
  onChange,
  required = false,
  placeholder = "Search or select country…",
}: SearchableCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (country: string) => {
    onChange(country);
    setQuery("");
    setOpen(false);
  };

  const displayValue = value || "";

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div
        className="relative w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus-within:border-primary cursor-text flex items-center gap-2"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required && !value}
          className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setQuery("");
              inputRef.current?.focus();
            }}
            className="shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-popover shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No country found
            </div>
          ) : (
            filtered.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => handleSelect(country)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${
                  value === country ? "bg-accent font-medium" : ""
                }`}
              >
                {country}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
