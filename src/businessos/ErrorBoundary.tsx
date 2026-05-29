import { Component, ReactNode } from "react";

interface State { hasError: boolean; error: Error | null }

/**
 * Catches render errors inside a single Business OS page so a broken
 * sub-page never blanks the whole admin shell (which used to feel like
 * a forced logout). The sidebar / topbar stay mounted; only <main /> is
 * replaced with a recoverable error card.
 */
export default class OsErrorBoundary extends Component<{ children: ReactNode; routeKey?: string }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prev: { routeKey?: string }) {
    // Reset when user navigates to a different route.
    if (prev.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[BusinessOS] page crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="os-glass p-6 rounded-2xl border border-red-500/20 max-w-xl">
        <div className="text-xs uppercase tracking-widest text-red-300/80 mb-2">Page error</div>
        <div className="text-sm font-semibold mb-2">This screen failed to render.</div>
        <div className="text-xs opacity-70 mb-4 break-words">
          {this.state.error?.message || "Unknown error"}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/[0.1]"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = "/admin")}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/[0.1]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
}
