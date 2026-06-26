// Phase 5 — Command Library side panel
// Lives inside AI Command Center left aside as a second tab.
// Pure UI: categories → commands → copy-to-composer examples.

import { useState } from "react";
import {
  CATEGORIES, COMMANDS, KEYBOARD_SHORTCUTS,
  getFavorites, getRecents, toggleFavorite,
  type CategoryId,
} from "@/businessos/lib/commandLibrary";
import { ChevronDown, Star, ShieldAlert, Copy, Keyboard, Sparkles, History } from "lucide-react";

type Props = {
  onPick: (prompt: string, commandId?: string) => void;
};

const RISK_BADGE: Record<string, string> = {
  safe: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  sensitive: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  destructive: "bg-red-500/10 text-red-300 border-red-500/20",
};

export function CommandLibraryPanel({ onPick }: Props) {
  const [openCat, setOpenCat] = useState<CategoryId | null>("companies");
  const [favTick, setFavTick] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const favs = new Set(getFavorites());
  const recents = getRecents();
  void favTick;

  return (
    <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-3 min-h-0">
      {/* Help row */}
      <button
        onClick={() => setShowShortcuts((v) => !v)}
        className="w-full inline-flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1.5 text-[11px] text-white/70"
      >
        <span className="inline-flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5 text-cyan-300" />
          Keyboard shortcuts
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition ${showShortcuts ? "rotate-180" : ""}`} />
      </button>
      {showShortcuts && (
        <div className="rounded-lg border border-white/10 bg-black/30 p-2 space-y-1">
          {KEYBOARD_SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between text-[11px]">
              <span className="text-white/60">{s.label}</span>
              <kbd className="font-mono text-[10px] text-white/80 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">{s.keys}</kbd>
            </div>
          ))}
        </div>
      )}

      {/* Favorites */}
      {favs.size > 0 && (
        <Section icon={<Star className="w-3 h-3 fill-amber-300 text-amber-300" />} label="Favorites">
          <div className="space-y-1">
            {COMMANDS.filter((c) => favs.has(c.id)).map((c) => (
              <CommandPill
                key={"f-" + c.id} cmd={c} fav onPick={onPick}
                onToggleFav={() => { toggleFavorite(c.id); setFavTick((t) => t + 1); }}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Recents */}
      {recents.length > 0 && (
        <Section icon={<History className="w-3 h-3 text-white/40" />} label="Recently used">
          <div className="space-y-1">
            {recents.slice(0, 5).map((r) => (
              <button
                key={r.id + r.at}
                onClick={() => onPick(r.prompt)}
                className="w-full text-left text-[11px] text-white/70 hover:text-white rounded-md px-2 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 truncate"
                title={r.prompt}
              >
                {r.prompt}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Categories */}
      <div className="text-[10px] uppercase tracking-wider text-white/40 px-1 pt-1">Library</div>
      {CATEGORIES.map((cat) => {
        const items = COMMANDS.filter((c) => c.category === cat.id);
        const open = openCat === cat.id;
        const Icon = cat.icon;
        return (
          <div key={cat.id} className="rounded-lg border border-white/10 overflow-hidden bg-white/[0.02]">
            <button
              onClick={() => setOpenCat(open ? null : cat.id)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 hover:bg-white/[0.04]"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className={`w-5 h-5 rounded grid place-items-center shrink-0 ${cat.tint}`}>
                  <Icon className="w-3 h-3" />
                </span>
                <span className="text-[12px] text-white/85 truncate">{cat.label}</span>
                <span className="text-[10px] text-white/30 shrink-0">{items.length}</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="border-t border-white/5 p-2 space-y-1.5">
                <div className="text-[10px] text-white/40 px-1 pb-1">{cat.blurb}</div>
                {items.map((c) => (
                  <CommandPill
                    key={c.id} cmd={c} fav={favs.has(c.id)} onPick={onPick}
                    onToggleFav={() => { toggleFavorite(c.id); setFavTick((t) => t + 1); }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1.5 px-1">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}

function CommandPill({
  cmd, fav, onPick, onToggleFav,
}: {
  cmd: (typeof COMMANDS)[number];
  fav: boolean;
  onPick: (prompt: string, commandId?: string) => void;
  onToggleFav: () => void;
}) {
  const ex = cmd.examples[0];
  const systemOwned = !!cmd.systemOwned;

  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] p-2">
      <div className="flex items-start gap-1.5">
        <Sparkles className="w-3 h-3 mt-0.5 text-purple-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11.5px] font-medium text-white/90 truncate">{cmd.title}</span>
            {systemOwned ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                <ShieldAlert className="w-2.5 h-2.5" /> System
              </span>
            ) : (
              <span className={`text-[9px] uppercase tracking-wider px-1 py-0.5 rounded border ${RISK_BADGE[cmd.risk]}`}>
                {cmd.risk}
              </span>
            )}
          </div>
          <div className="text-[10.5px] text-white/50 mt-0.5 leading-snug">{cmd.description}</div>
        </div>
        <button
          onClick={onToggleFav}
          className="p-0.5 rounded hover:bg-white/10 shrink-0"
          aria-label={fav ? "Unfavorite" : "Favorite"}
          title={fav ? "Unfavorite" : "Favorite"}
        >
          <Star className={`w-3 h-3 ${fav ? "fill-amber-300 text-amber-300" : "text-white/30"}`} />
        </button>
      </div>

      {ex && !systemOwned && (
        <div className="mt-1.5 space-y-1">
          {cmd.examples.map((line, i) => (
            <button
              key={i}
              onClick={() => onPick(line, cmd.id)}
              className="group w-full text-left text-[10.5px] leading-snug rounded bg-black/30 hover:bg-black/45 border border-white/5 hover:border-purple-400/30 px-2 py-1.5 text-white/70 hover:text-white transition flex items-start gap-1.5"
              title="Copy to composer"
            >
              <Copy className="w-2.5 h-2.5 mt-0.5 text-white/30 group-hover:text-purple-300 shrink-0" />
              <span className="flex-1 min-w-0">{line}</span>
            </button>
          ))}
        </div>
      )}
      {systemOwned && (
        <div className="mt-1.5 text-[10px] text-white/40 italic">
          Read-only · runs automatically in the backend.
        </div>
      )}
    </div>
  );
}
