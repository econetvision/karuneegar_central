/**
 * Karuneegar Central Logo
 *
 * Symbolism:
 *  - Quill/feather  → Lord Chitragupta, the divine record-keeper
 *  - Open book      → The celestial ledger (Chitragupta's register of karma)
 *  - "K" monogram   → Karuneegar
 *  - Saffron-amber  → Sacred temple colors of Tamil Nadu
 *  - Gold accents   → Heritage and divinity
 */

interface Props {
  /** Icon size in px (width = height for icon-only mode) */
  size?: number;
  className?: string;
}

/** Square icon — used in favicon, app icon, small embeds */
export function LogoIcon({ size = 40, className = '' }: Props) {
  const id = 'kc-logo'; // stable gradient id
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Karuneegar Central"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#7C2D12" />
        </linearGradient>
        <linearGradient id={`${id}-quill`} x1="56" y1="6" x2="30" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFBEB" />
          <stop offset="1" stopColor="#FCD34D" />
        </linearGradient>
      </defs>

      {/* ── Background ─────────────────────────────────────── */}
      <rect width="80" height="80" rx="18" fill={`url(#${id}-bg)`} />

      {/* Subtle inner gold border */}
      <rect x="4" y="4" width="72" height="72" rx="14"
        fill="none" stroke="#FCD34D" strokeWidth="1.2" opacity="0.45" />

      {/* ── Chitragupta Quill (divine pen / feather) ───────── */}
      {/* Main feather body — sweeps top-right to center */}
      <path
        d="M60,8 C72,16 74,34 62,50 L50,44 C60,32 58,18 46,13 Z"
        fill={`url(#${id}-quill)`}
      />
      {/* Feather barbs — left side */}
      <path d="M58,16 C52,24 49,33 48,41" stroke="#92400E" strokeWidth="1" opacity="0.35" strokeLinecap="round" />
      <path d="M63,26 C57,33 54,40 53,46" stroke="#92400E" strokeWidth="1" opacity="0.35" strokeLinecap="round" />
      {/* Feather barbs — right side */}
      <path d="M62,14 C68,20 70,30 66,42" stroke="#FEF3C7" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />

      {/* Quill shaft */}
      <path d="M50,44 L36,64" stroke="#FCD34D" strokeWidth="2.2" strokeLinecap="round" />
      {/* Nib (writing tip) */}
      <path d="M36,64 L31,73 L41,70 Z" fill="#FCD34D" />

      {/* ── Open Book (Chitragupta's karma ledger) ─────────── */}
      {/* Left page */}
      <path d="M12,56 C17,51 24,52 30,54 L30,68 C24,66 17,65 12,68 Z"
        fill="white" opacity="0.90" />
      {/* Right page */}
      <path d="M30,54 C36,52 43,51 48,56 L48,68 C43,65 36,66 30,68 Z"
        fill="#FEF9C3" opacity="0.90" />
      {/* Spine */}
      <line x1="30" y1="54" x2="30" y2="68" stroke="#D97706" strokeWidth="2" />
      {/* Writing lines on left page */}
      <line x1="16" y1="59" x2="27" y2="57.5" stroke="#D97706" strokeWidth="0.9" opacity="0.35" />
      <line x1="15" y1="63" x2="26" y2="61.5" stroke="#D97706" strokeWidth="0.9" opacity="0.35" />
      {/* Writing lines on right page */}
      <line x1="33" y1="57.5" x2="44" y2="59" stroke="#D97706" strokeWidth="0.9" opacity="0.35" />
      <line x1="34" y1="61.5" x2="45" y2="63" stroke="#D97706" strokeWidth="0.9" opacity="0.35" />

      {/* ── "K" Monogram ──────────────────────────────────── */}
      <text
        x="10" y="50"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="32"
        fontWeight="700"
        fill="white"
        opacity="0.88"
      >
        K
      </text>
    </svg>
  );
}

/**
 * Full horizontal logo — icon + wordmark
 * Use in headers, splash screens, footers
 */
export function LogoFull({ height = 40, className = '' }: { height?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={height} />
      <span
        style={{ fontFamily: "'Poppins', sans-serif", lineHeight: 1.1 }}
        className="flex flex-col"
      >
        <span
          style={{ fontSize: height * 0.38, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}
        >
          Karuneegar
        </span>
        <span
          style={{ fontSize: height * 0.28, fontWeight: 600, color: '#EA580C', letterSpacing: '0.04em' }}
        >
          CENTRAL
        </span>
      </span>
    </span>
  );
}

export default LogoIcon;
