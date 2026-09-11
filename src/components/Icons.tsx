import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Base = ({ size = 20, children, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const HomeIcon = (p: IconProps) => <Base {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9h13v-9"/><path d="M9.5 19v-5h5v5"/></Base>;
export const GridIcon = (p: IconProps) => <Base {...p}><rect x="4" y="4" width="6" height="6" rx="1.6"/><rect x="14" y="4" width="6" height="6" rx="1.6"/><rect x="4" y="14" width="6" height="6" rx="1.6"/><rect x="14" y="14" width="6" height="6" rx="1.6"/></Base>;
export const SettingsIcon = (p: IconProps) => <Base {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.5v-.1A1.7 1.7 0 0 0 8.4 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.2V9.5h.1A1.7 1.7 0 0 0 4 8.4a1.7 1.7 0 0 0-.34-1.88L3.6 6.46 6.46 3.6l.06.06A1.7 1.7 0 0 0 8.4 4a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.2h4.1v.1A1.7 1.7 0 0 0 15 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.4a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4.1h-.1A1.7 1.7 0 0 0 19.4 15Z"/></Base>;
export const SearchIcon = (p: IconProps) => <Base {...p}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></Base>;
export const PlusIcon = (p: IconProps) => <Base {...p}><path d="M12 5v14M5 12h14"/></Base>;
export const ArrowIcon = (p: IconProps) => <Base {...p}><path d="M5 12h14M14 7l5 5-5 5"/></Base>;
export const MoreIcon = (p: IconProps) => <Base {...p}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></Base>;
export const PinIcon = (p: IconProps) => <Base {...p}><path d="m9 4 6 0 1 5 3 3H5l3-3 1-5Z"/><path d="M12 12v8"/></Base>;
export const BellIcon = (p: IconProps) => <Base {...p}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M10 20h4"/></Base>;
export const LockIcon = (p: IconProps) => <Base {...p}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></Base>;
export const CheckIcon = (p: IconProps) => <Base {...p}><path d="m5 12 4 4L19 6"/></Base>;
export const UploadIcon = (p: IconProps) => <Base {...p}><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></Base>;
export const ChevronIcon = (p: IconProps) => <Base {...p}><path d="m9 6 6 6-6 6"/></Base>;
export const CloseIcon = (p: IconProps) => <Base {...p}><path d="m6 6 12 12M18 6 6 18"/></Base>;
