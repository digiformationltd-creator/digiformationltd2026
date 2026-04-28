## Goal
Match the reference site (`theme-sparkle-check.lovable.app`) exactly by removing the mountain photographic background from the hero — the reference uses only the dark gradient, grid pattern, and floating glow orbs (no photo).

## Changes

### 1. `src/components/DigiHero.tsx`
- Remove the `<div>` that renders `heroBg` as a `background-image` (the mix-blend-screen mountain layer).
- Remove the `import heroBg from "@/assets/hero-bg.jpg"` line.
- Keep everything else intact:
  - `bg-gradient-hero` base
  - `grid-pattern opacity-50` overlay
  - Two floating orbs (480px primary + 520px accent, `animate-float`)
  - Headline rotator, badge, CTAs, trust strip
- Result: clean dark steel gradient + subtle grid + soft glows — identical to the reference hero.

### 2. `src/assets/hero-bg.jpg`
- Delete the now-unused image asset to keep the bundle clean.

## Out of scope
- No changes to nav, services slider, partner bar, stats, CTA, or footer — those already match the reference theme.
- No color, font, or token changes — `src/index.css` and `tailwind.config.ts` already mirror the reference design system.

## Verification
After the edit, the hero should show only: dark gradient background, faint grid lines, two soft blurred orbs (top-left primary, bottom-right accent), and the centered content stack — no mountain silhouette.
