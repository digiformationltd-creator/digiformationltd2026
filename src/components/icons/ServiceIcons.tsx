/**
 * Bespoke SVG icon set for Digiformation services.
 * Each icon is a hand-drawn 64×64 mark with a brand gradient stroke.
 * Use via <ServiceIcon name="uk-ltd" size={56} /> or import individual marks.
 *
 * Style rules:
 *   - viewBox 0 0 64 64
 *   - 2px stroke (1.75 on small)
 *   - currentColor + linearGradient(id=brand-grad) as the accent
 *   - round caps and joins
 */
import { memo } from "react";

export type ServiceIconName =
  | "uk-ltd"
  | "us-llc"
  | "ein"
  | "itin"
  | "registered-office"
  | "banking"
  | "payments"
  | "compliance"
  | "boi"
  | "utr"
  | "id-verify"
  | "change-service";

type Props = {
  name: ServiceIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  /** Unique suffix when several icons render with shared gradient ids on a page. */
  gradientId?: string;
};

const Defs = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="hsl(var(--primary))" />
      <stop offset="100%" stopColor="hsl(var(--accent, var(--primary)))" stopOpacity="0.7" />
    </linearGradient>
    <linearGradient id={`${id}-soft`} x1="0" y1="0" x2="0" y2="64">
      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
    </linearGradient>
  </defs>
);

const ServiceIcon = memo(({ name, size = 56, className, strokeWidth = 2, gradientId }: Props) => {
  const gid = gradientId ?? `svc-grad-${name}`;
  const stroke = `url(#${gid})`;
  const fill = `url(#${gid}-soft)`;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "uk-ltd":
      // Crown + classical column = UK incorporation
      return (
        <svg {...common}>
          <Defs id={gid} />
          <rect x="14" y="22" width="36" height="32" rx="2" fill={fill} />
          <path d="M14 22 L20 12 L26 22 L32 10 L38 22 L44 12 L50 22" />
          <circle cx="20" cy="12" r="1.4" fill={stroke} />
          <circle cx="32" cy="10" r="1.4" fill={stroke} />
          <circle cx="44" cy="12" r="1.4" fill={stroke} />
          <path d="M14 54 H50" />
          <path d="M22 54 V34 M32 54 V32 M42 54 V34" />
        </svg>
      );

    case "us-llc":
      // 5-pointed star inside shield arch
      return (
        <svg {...common}>
          <Defs id={gid} />
          <path d="M32 6 L52 14 V32 C52 44 43 52 32 58 C21 52 12 44 12 32 V14 Z" fill={fill} />
          <path d="M32 18 L35 26 L43 26 L37 31 L39 39 L32 34 L25 39 L27 31 L21 26 L29 26 Z" />
        </svg>
      );

    case "ein":
      // Document with hashed ID lines + IRS seal dot
      return (
        <svg {...common}>
          <Defs id={gid} />
          <path d="M16 8 H40 L50 18 V54 A2 2 0 0 1 48 56 H16 A2 2 0 0 1 14 54 V10 A2 2 0 0 1 16 8 Z" fill={fill} />
          <path d="M40 8 V18 H50" />
          <path d="M20 28 H44 M20 34 H44 M20 40 H36" />
          <circle cx="44" cy="46" r="5" />
          <path d="M41.5 46 L43.5 48 L46.5 44" />
        </svg>
      );

    case "itin":
      // Globe + ID card overlay
      return (
        <svg {...common}>
          <Defs id={gid} />
          <circle cx="26" cy="28" r="16" fill={fill} />
          <path d="M10 28 H42 M26 12 C20 20 20 36 26 44 M26 12 C32 20 32 36 26 44" />
          <rect x="30" y="36" width="24" height="16" rx="2" fill="hsl(var(--background))" />
          <circle cx="36" cy="44" r="3" />
          <path d="M42 42 H50 M42 46 H48" />
        </svg>
      );

    case "registered-office":
      // Building with a postbox flag
      return (
        <svg {...common}>
          <Defs id={gid} />
          <path d="M12 56 V24 L32 12 L52 24 V56 Z" fill={fill} />
          <path d="M12 56 H52" />
          <rect x="22" y="32" width="8" height="10" />
          <rect x="34" y="32" width="8" height="10" />
          <path d="M28 56 V46 H36 V56" />
          <path d="M44 14 H52 L48 18 L52 22 H44 Z" />
        </svg>
      );

    case "banking":
      // Classical bank facade with coin stack
      return (
        <svg {...common}>
          <Defs id={gid} />
          <path d="M8 24 L32 10 L56 24 Z" fill={fill} />
          <path d="M8 24 H56" />
          <path d="M14 28 V46 M24 28 V46 M40 28 V46 M50 28 V46" />
          <path d="M6 50 H58" />
          <path d="M6 54 H58" />
          <circle cx="32" cy="22" r="2" />
        </svg>
      );

    case "payments":
      // Card with arc representing transfer
      return (
        <svg {...common}>
          <Defs id={gid} />
          <rect x="8" y="16" width="48" height="32" rx="4" fill={fill} />
          <path d="M8 26 H56" />
          <path d="M14 38 H22 M28 38 H38" />
          <path d="M44 38 L50 38 L46 34 M50 38 L46 42" />
        </svg>
      );

    case "compliance":
      // Shield + checkmark stroke
      return (
        <svg {...common}>
          <Defs id={gid} />
          <path d="M32 6 L52 14 V32 C52 44 44 52 32 58 C20 52 12 44 12 32 V14 Z" fill={fill} />
          <path d="M22 32 L29 39 L42 24" />
        </svg>
      );

    case "boi":
      // Eye / beneficial owner
      return (
        <svg {...common}>
          <Defs id={gid} />
          <path d="M6 32 C14 18 24 12 32 12 C40 12 50 18 58 32 C50 46 40 52 32 52 C24 52 14 46 6 32 Z" fill={fill} />
          <circle cx="32" cy="32" r="8" />
          <circle cx="32" cy="32" r="3" fill={stroke} />
        </svg>
      );

    case "utr":
      // Tax tag with hash
      return (
        <svg {...common}>
          <Defs id={gid} />
          <path d="M30 8 H52 V30 L30 52 L10 32 Z" fill={fill} />
          <circle cx="42" cy="20" r="3" />
          <path d="M24 28 L28 32 M22 34 L30 34 M22 38 L30 38" />
        </svg>
      );

    case "id-verify":
      // Passport + check
      return (
        <svg {...common}>
          <Defs id={gid} />
          <rect x="14" y="8" width="36" height="48" rx="3" fill={fill} />
          <circle cx="32" cy="24" r="6" />
          <path d="M22 40 H42 M22 46 H38" />
          <path d="M44 50 L48 54 L54 46" />
        </svg>
      );

    case "change-service":
      // Refresh arrows
      return (
        <svg {...common}>
          <Defs id={gid} />
          <path d="M12 28 A20 20 0 0 1 48 20" />
          <path d="M48 20 V12 M48 20 H40" />
          <path d="M52 36 A20 20 0 0 1 16 44" />
          <path d="M16 44 V52 M16 44 H24" />
        </svg>
      );

    default:
      return null;
  }
});

ServiceIcon.displayName = "ServiceIcon";

export default ServiceIcon;
