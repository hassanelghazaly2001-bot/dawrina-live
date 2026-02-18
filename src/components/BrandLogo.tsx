import React from "react";

type Props = {
  className?: string;
  showText?: boolean;
};

export const BrandLogo: React.FC<Props> = ({ className, showText = false }) => {
  return (
    <div className={["flex items-center gap-3", className ?? ""].join(" ")}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 128 128"
        width="64"
        height="64"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="trophyGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE56E" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="80" r="36" fill="#111111" stroke="#e5e7eb" strokeWidth="2" />
        <path d="M64 52l11 10-5 15H58l-5-15z" fill="#ffffff" opacity="0.85" />
        <path d="M45 80l10-6 10 6-10 6z" fill="#ffffff" opacity="0.8" />
        <path d="M83 80l-10-6-10 6 10 6z" fill="#ffffff" opacity="0.8" />
        <path d="M64 24c12 0 20 2 20 10 0 8-6 16-20 16s-20-8-20-16c0-8 8-10 20-10z" fill="url(#trophyGold)" />
        <path d="M44 34c-4 0-8 3-8 7 0 9 12 15 20 15-10-4-12-14-12-22z" fill="url(#trophyGold)" opacity="0.8" />
        <path d="M84 34c4 0 8 3 8 7 0 9-12 15-20 15 10-4 12-14 12-22z" fill="url(#trophyGold)" opacity="0.8" />
        <rect x="56" y="50" width="16" height="8" rx="2" fill="#c4a200" />
        <rect x="52" y="58" width="24" height="6" rx="2" fill="#c4a200" />
        <rect x="50" y="64" width="28" height="6" rx="2" fill="#FFD700" />
        <path d="M28 84c0 0 10 2 20 0" stroke="#10b981" strokeWidth="4" fill="none" />
        <path d="M80 84c10 2 20 0 20 0" stroke="#10b981" strokeWidth="4" fill="none" />
      </svg>
      {showText && (
        <div className="flex items-baseline gap-2">
          <span className="font-cairo text-[#FFD700] text-xl sm:text-2xl">دورينـا</span>
          <span className="font-inter text-foreground text-lg sm:text-xl tracking-[0.14em]">DAWRINA</span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
