import { useEffect } from "react";

/**
 * Observes every element in the document with a `data-reveal` or
 * `data-reveal-stagger` attribute and toggles the `is-visible` class when the
 * element scrolls into view. Re-scans the DOM whenever the route's pathname
 * changes (passed by the consumer) so freshly-mounted sections animate too.
 */
export function useScrollReveal(deps: ReadonlyArray<unknown> = []) {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    const scan = () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        "[data-reveal]:not(.is-visible), [data-reveal-stagger]:not(.is-visible)"
      );
      nodes.forEach((n) => io.observe(n));
    };

    scan();

    // Re-scan when new content is added (route change, lazy mounts, etc.)
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
