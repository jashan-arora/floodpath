/**
 * Southbank skyline header, drawn in place of the Figma raster backdrop (which
 * couldn't be exported). Includes the Arts Centre spire and Eureka Tower.
 */
export function Skyline() {
  return (
    <svg viewBox="0 0 402 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe0f7" />
          <stop offset="0.7" stopColor="#e3f1fb" />
          <stop offset="1" stopColor="#f3f8fc" />
        </linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#f3f8fc" stopOpacity="0" />
          <stop offset="1" stopColor="#f3f8fc" />
        </linearGradient>
      </defs>
      <rect width="402" height="300" fill="url(#sky)" />
      <g fill="#fff" opacity="0.9">
        <ellipse cx="300" cy="62" rx="34" ry="11" />
        <ellipse cx="322" cy="55" rx="20" ry="10" />
        <ellipse cx="70" cy="40" rx="26" ry="8" />
        <ellipse cx="158" cy="92" rx="22" ry="7" />
      </g>
      <g fill="#cfe2f0">
        <rect x="200" y="150" width="34" height="130" />
        <rect x="238" y="128" width="26" height="152" />
        <rect x="340" y="140" width="30" height="140" />
        <rect x="20" y="170" width="40" height="110" />
      </g>
      <g fill="#b6d0e4">
        <rect x="268" y="96" width="30" height="184" />
        <rect x="302" y="118" width="34" height="162" />
        <rect x="372" y="160" width="30" height="120" />
        <path d="M285 96v-12h-4v12z" />
      </g>
      {/* Eureka Tower */}
      <g>
        <rect x="314" y="54" width="22" height="226" fill="#a9c6dc" />
        <rect x="314" y="54" width="22" height="16" fill="#d9b86a" />
        <rect x="324" y="40" width="2" height="14" fill="#a9c6dc" />
      </g>
      {/* Arts Centre spire */}
      <g fill="none" stroke="#9dbad0" strokeWidth="1.6">
        <path d="M150 60L136 214M150 60L164 214M141 160h18M139 186h22M144 120h12M146 96h8" />
      </g>
      <path d="M128 214h44l-6 20h-32z" fill="#b6d0e4" />
      <path d="M150 52v10" stroke="#9dbad0" strokeWidth="2" />
      {/* Trees along the river */}
      <g fill="#c4dfd2">
        <circle cx="30" cy="246" r="24" />
        <circle cx="70" cy="252" r="20" />
        <circle cx="104" cy="250" r="22" />
        <circle cx="196" cy="256" r="20" />
        <circle cx="384" cy="252" r="22" />
      </g>
      <rect width="402" height="300" fill="url(#fade)" />
    </svg>
  );
}
