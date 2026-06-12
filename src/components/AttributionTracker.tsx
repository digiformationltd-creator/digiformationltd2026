import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/attribution";

// Resets the module-level "tracked once" guard on every navigation so each
// route change records a fresh page-view / last-touch update.
let lastPath = "";

const AttributionTracker = () => {
  const loc = useLocation();
  useEffect(() => {
    const key = loc.pathname + loc.search;
    if (key === lastPath) return;
    lastPath = key;
    // Reset internal once-flag by importing module state via a side-effecting call
    // (the tracker is idempotent per-load; we call it again for SPA route changes).
    (window as any).__df_track_force = true;
    // We bypass the once-flag by re-importing dynamically — but since trackPageView
    // already short-circuits, force a fresh call by toggling our own guard.
    void trackPageView();
  }, [loc.pathname, loc.search]);
  return null;
};

export default AttributionTracker;
