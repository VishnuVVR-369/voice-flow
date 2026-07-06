import type { SVGProps } from "react";

/**
 * Lightweight stroke-icon set for the docs. The landing site uses inline SVGs
 * everywhere (no icon dependency), so the docs follow the same approach.
 * All icons share a 24×24 viewBox and paint with currentColor.
 */

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

export type DocsIcon = (props: IconProps) => React.ReactElement;

function make(paths: React.ReactNode, filled = false): DocsIcon {
  function Icon({ size = 18, strokeWidth = 1.7, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        {...rest}
      >
        {paths}
      </svg>
    );
  }
  return Icon;
}

export const ArrowRightIcon = make(
  <>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </>,
);

export const ArrowLeftIcon = make(
  <>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </>,
);

export const ArrowUpRightIcon = make(
  <>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </>,
);

export const ChevronDownIcon = make(<path d="m6 9 6 6 6-6" />);
export const ChevronRightIcon = make(<path d="m9 6 6 6-6 6" />);

export const HashIcon = make(
  <>
    <path d="M4 9h16" />
    <path d="M4 15h16" />
    <path d="M10 3 8 21" />
    <path d="M16 3l-2 18" />
  </>,
);

export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>,
);

export const CopyIcon = make(
  <>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>,
);

export const CheckIcon = make(<path d="m5 12 5 5L20 7" />);

export const CheckCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </>,
);

export const TerminalIcon = make(
  <>
    <path d="m5 8 4 4-4 4" />
    <path d="M13 16h6" />
  </>,
);

export const RocketIcon = make(
  <>
    <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8.8-2.2 0-3-.8-.8-2.2-.8-3 0Z" />
    <path d="M9 12a12 12 0 0 1 8-9 12 12 0 0 1-1 10 6 6 0 0 1-3.5 2L9 12Z" />
    <path d="M9 12 7 10c.6-2 2-3.5 4-4" />
    <path d="M15 9h.01" />
  </>,
);

export const BookIcon = make(
  <>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
    <path d="M20 18v3H6.5A2.5 2.5 0 0 1 4 18.5" />
  </>,
);

export const CpuIcon = make(
  <>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </>,
);

export const DatabaseIcon = make(
  <>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </>,
);

export const SettingsIcon = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </>,
);

export const MicIcon = make(
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </>,
);

export const KeyboardIcon = make(
  <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </>,
);

export const SparklesIcon = make(
  <>
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </>,
);

export const KeyIcon = make(
  <>
    <circle cx="8" cy="8" r="4" />
    <path d="m11 11 8 8" />
    <path d="m16 16 2-2M18.5 18.5l1.5-1.5" />
  </>,
);

export const BoltIcon = make(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />);

export const ClipboardIcon = make(
  <>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9Z" />
    <path d="M9 11h6M9 15h4" />
  </>,
);

export const WaveIcon = make(
  <>
    <path d="M4 12v0M8 8v8M12 5v14M16 8v8M20 12v0" />
  </>,
);

export const LayersIcon = make(
  <>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </>,
);

export const RouteIcon = make(
  <>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6" />
  </>,
);

export const ShieldIcon = make(
  <>
    <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </>,
);

export const InfoIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
);

export const AlertIcon = make(
  <>
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 10v4M12 17h.01" />
  </>,
);

export const LightbulbIcon = make(
  <>
    <path d="M9 18h6M10 21h4" />
    <path d="M8 14a6 6 0 1 1 8 0c-.8.8-1 1.5-1 2.5H9c0-1-.2-1.7-1-2.5Z" />
  </>,
);

export const XCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </>,
);

export const HomeIcon = make(
  <>
    <path d="m4 11 8-7 8 7" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
  </>,
);
