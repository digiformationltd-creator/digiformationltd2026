// Phase 5 — Command Palette (⌘K)
// Searchable overlay over the Command Library.
// Pure UI: no backend, no AI. Calls back with a prompt string.

import { useEffect, useMemo, useState } from "react";
import {
  Command, CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  COMMANDS, CATEGORIES, getFavorites, getRecents, toggleFavorite,
  isFavorite as checkFav, type LibraryCommand,
} from "@/businessos/lib/commandLibrary";
import { Star, History, Sparkles, ShieldAlert } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (prompt: string, commandId?: string) => void;
};

const RISK_TINT: Record<string, string> = {
  safe: "text-emerald-300",
  sensitive: "text-amber-300",
  destructive: "text-red-300",
};

export function CommandPalette({ open, onOpenChange, onPick }: Props) {
  const [favTick, setFavTick] = useState(0);
  const favorites = useMemo(() => new Set(getFavorites()), [favTick, open]);
  const recents = useMemo(() => getRecents(), [open]);

  const pick = (prompt: string, id?: string) => {
    onPick(prompt, id);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands, categories, examples…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No matching commands.</CommandEmpty>

        {recents.length > 0 && (
          <>
            <CommandGroup heading="Recently used">
              {recents.slice(0, 6).map((r) => (
                <CommandItem
                  key={"rec-" + r.id + r.at}
                  value={"recent " + r.prompt}
                  onSelect={() => pick(r.prompt)}
                  className="gap-2"
                >
                  <History className="w-3.5 h-3.5 text-white/40" />
                  <span className="truncate">{r.prompt}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {favorites.size > 0 && (
          <>
            <CommandGroup heading="Favorites">
              {COMMANDS.filter((c) => favorites.has(c.id)).map((c) => (
                <CommandRow key={"fav-" + c.id} cmd={c} onPick={pick} onFavToggled={() => setFavTick((t) => t + 1)} isFav />
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {CATEGORIES.map((cat) => {
          const items = COMMANDS.filter((c) => c.category === cat.id);
          if (!items.length) return null;
          return (
            <CommandGroup key={cat.id} heading={cat.label}>
              {items.map((c) => (
                <CommandRow
                  key={c.id}
                  cmd={c}
                  onPick={pick}
                  onFavToggled={() => setFavTick((t) => t + 1)}
                  isFav={favorites.has(c.id)}
                />
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

function CommandRow({
  cmd, onPick, onFavToggled, isFav,
}: {
  cmd: LibraryCommand;
  onPick: (prompt: string, id?: string) => void;
  onFavToggled: () => void;
  isFav: boolean;
}) {
  const firstExample = cmd.examples[0];
  const value = `${cmd.title} ${cmd.description} ${cmd.examples.join(" ")} ${cmd.category}`;
  const disabled = cmd.systemOwned || !firstExample;

  return (
    <CommandItem
      value={value}
      onSelect={() => { if (!disabled) onPick(firstExample!, cmd.id); }}
      className="gap-2 items-start"
    >
      <Sparkles className={`w-3.5 h-3.5 mt-0.5 ${RISK_TINT[cmd.risk]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{cmd.title}</span>
          {cmd.systemOwned && (
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
              <ShieldAlert className="w-2.5 h-2.5" /> System
            </span>
          )}
          {cmd.risk !== "safe" && !cmd.systemOwned && (
            <span className={`text-[9px] uppercase tracking-wider px-1 py-0.5 rounded border border-white/10 ${RISK_TINT[cmd.risk]}`}>
              {cmd.risk}
            </span>
          )}
        </div>
        {firstExample && (
          <div className="text-[11px] text-muted-foreground truncate">{firstExample}</div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleFavorite(cmd.id); onFavToggled(); }}
        className="shrink-0 p-1 rounded hover:bg-white/10"
        aria-label={isFav ? "Unfavorite" : "Favorite"}
      >
        <Star className={`w-3.5 h-3.5 ${isFav ? "fill-amber-300 text-amber-300" : "text-white/30"}`} />
      </button>
    </CommandItem>
  );
}

// Global ⌘K / Ctrl+K hook
export function useCommandPaletteHotkey(toggle: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);
}
