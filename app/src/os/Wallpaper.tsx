import { useMemo } from 'react';
import { useOS } from '../store/os';

const GLOBAL_DEFS = `
<defs>
  <!-- Main Deep Space Dark Background -->
  <linearGradient id="aurora-bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#05070f" />
    <stop offset="50%" stop-color="#0b0e17" />
    <stop offset="100%" stop-color="#020306" />
  </linearGradient>

  <!-- High-Fidelity Sonoma-style mesh gradient blobs -->
  <radialGradient id="mesh-cyan" cx="20%" cy="30%" r="55%">
    <stop offset="0%" stop-color="#00f2ff" stop-opacity="0.18" />
    <stop offset="50%" stop-color="#0066ff" stop-opacity="0.04" />
    <stop offset="100%" stop-color="#000000" stop-opacity="0" />
  </radialGradient>

  <radialGradient id="mesh-pink" cx="80%" cy="20%" r="60%">
    <stop offset="0%" stop-color="#ff007a" stop-opacity="0.12" />
    <stop offset="60%" stop-color="#7700ff" stop-opacity="0.02" />
    <stop offset="100%" stop-color="#000000" stop-opacity="0" />
  </radialGradient>

  <radialGradient id="mesh-blue" cx="50%" cy="75%" r="50%">
    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.16" />
    <stop offset="50%" stop-color="#6366f1" stop-opacity="0.03" />
    <stop offset="100%" stop-color="#000000" stop-opacity="0" />
  </radialGradient>

  <!-- Glowing Mascot Accent Lines -->
  <linearGradient id="neon-accent" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#00f2ff" stop-opacity="0.65" />
    <stop offset="50%" stop-color="#7000ff" stop-opacity="0.35" />
    <stop offset="100%" stop-color="#ff007a" stop-opacity="0.1" />
  </linearGradient>

  <!-- Glassmorphic panel gradient -->
  <linearGradient id="glass-grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.05" />
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.01" />
  </linearGradient>

  <!-- Global App Icon Gradients to prevent display:none browser resolution bugs -->
  <linearGradient id="g-df" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232B38"/><stop offset="1" stop-color="#11161F"/></linearGradient>
  <linearGradient id="g-ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#57A8F2"/><stop offset="1" stop-color="#2D6FD8"/></linearGradient>
  <linearGradient id="g-wa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A6A33"/><stop offset="1" stop-color="#6B4320"/></linearGradient>
  <linearGradient id="g-te" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#242932"/><stop offset="1" stop-color="#0F1216"/></linearGradient>
  <linearGradient id="g-dw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#28313E"/><stop offset="1" stop-color="#141A22"/></linearGradient>
  <linearGradient id="g-fi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4F8FE6"/><stop offset="1" stop-color="#2F6BC0"/></linearGradient>
  <linearGradient id="g-cm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5C8DF0"/><stop offset="1" stop-color="#3B63C4"/></linearGradient>
  <linearGradient id="g-gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A4657"/><stop offset="1" stop-color="#232D3A"/></linearGradient>
  <linearGradient id="g-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3E7BE8"/><stop offset="1" stop-color="#2452B0"/></linearGradient>
  <linearGradient id="g-lp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6B6B"/><stop offset="1" stop-color="#C22323"/></linearGradient>
  <linearGradient id="g-se" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2E5EA"/><stop offset="1" stop-color="#9BA3AE"/></linearGradient>
  <linearGradient id="g-wp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8F5AE8"/><stop offset="1" stop-color="#5A28A8"/></linearGradient>
  <linearGradient id="g-ap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3546"/><stop offset="1" stop-color="#1A2230"/></linearGradient>
</defs>
`;

const WALLPAPER_SONOMA = `
${GLOBAL_DEFS}
<!-- Background Fill -->
<rect width="1440" height="900" fill="url(#aurora-bg)" />

<!-- Glowing Mesh Blobs -->
<rect width="1440" height="900" fill="url(#mesh-cyan)" />
<rect width="1440" height="900" fill="url(#mesh-pink)" />
<rect width="1440" height="900" fill="url(#mesh-blue)" />

<!-- Tech Grid Matrix overlay (faint, elegant coordinate lines) -->
<g stroke="#ffffff" stroke-opacity="0.025" stroke-width="0.75" fill="none">
  <!-- Horizontal lines -->
  <line x1="0" y1="120" x2="1440" y2="120" />
  <line x1="0" y1="240" x2="1440" y2="240" />
  <line x1="0" y1="360" x2="1440" y2="360" />
  <line x1="0" y1="480" x2="1440" y2="480" />
  <line x1="0" y1="600" x2="1440" y2="600" />
  <line x1="0" y1="720" x2="1440" y2="720" />
  
  <!-- Vertical lines -->
  <line x1="160" y1="0" x2="160" y2="900" />
  <line x1="320" y1="0" x2="320" y2="900" />
  <line x1="480" y1="0" x2="480" y2="900" />
  <line x1="640" y1="0" x2="640" y2="900" />
  <line x1="800" y1="0" x2="800" y2="900" />
  <line x1="960" y1="0" x2="960" y2="900" />
  <line x1="1120" y1="0" x2="1120" y2="900" />
  <line x1="1280" y1="0" x2="1280" y2="900" />
</g>

<!-- Beautiful Sweeping Wave Ribbons -->
<path d="M-100,560 C320,380 480,720 900,490 C1240,310 1280,640 1600,400 L1600,950 L-100,950 Z" fill="none" stroke="#00f2ff" stroke-width="1.5" stroke-opacity="0.22" />
<path d="M-100,680 C360,840 520,440 960,740 C1280,940 1240,560 1600,600 L1600,950 L-100,950 Z" fill="none" stroke="#ff007a" stroke-width="1.25" stroke-opacity="0.12" />

<!-- Floating Glassmorphic Centerpiece Ring -->
<g transform="translate(720, 430)">
  <!-- Outer Glow Ring -->
  <circle cx="0" cy="0" r="160" stroke="#00f2ff" stroke-opacity="0.12" stroke-width="1.5" fill="none" />
  <circle cx="0" cy="0" r="160" stroke="#ffffff" stroke-opacity="0.08" stroke-width="0.75" stroke-dasharray="10 15" fill="none" />
  
  <!-- Translucent Glass Backing plate -->
  <circle cx="0" cy="0" r="130" fill="url(#glass-grad)" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1" />
  
  <!-- Compass-like HUD ticks -->
  <path d="M0,-140 L0,-130 M0,140 L0,130 M-140,0 L-130,0 M140,0 L130,0" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.5" />
</g>

<!-- High-Fidelity low-poly cyber bull head centered inside glass ring -->
<g transform="translate(720, 430) scale(1.3)" stroke="url(#neon-accent)" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round">
  <!-- Horns -->
  <polygon points="-75,-50 -165,-135 -100,-15" stroke-opacity="0.85" />
  <polygon points="75,-50 165,-135 100,-15" stroke-opacity="0.85" />
  
  <!-- Forehead -->
  <polygon points="-75,-50 0,-95 75,-50 0,-15" stroke-opacity="0.9" fill="#00f2ff" fill-opacity="0.02" />
  
  <!-- Eye Bridge -->
  <polygon points="-75,-50 -100,-15 0,-15" stroke-opacity="0.7" />
  <polygon points="75,-50 100,-15 0,-15" stroke-opacity="0.7" />
  
  <!-- Glowing Hex Eyes -->
  <polygon points="-42,-28 -32,-24 -46,-19" fill="#00ffb7" fill-opacity="0.9" stroke="none" />
  <polygon points="42,-28 32,-24 46,-19" fill="#00ffb7" fill-opacity="0.9" stroke="none" />
  
  <!-- Cheek / Face -->
  <polygon points="-100,-15 -42,65 0,10" stroke-opacity="0.6" />
  <polygon points="100,-15 42,65 0,10" stroke-opacity="0.6" />
  
  <!-- Snout / Chin -->
  <polygon points="-42,65 0,105 42,65 0,10" stroke-opacity="0.8" fill="#ff007a" fill-opacity="0.02" />
</g>

<!-- Telemetry Text inside background -->
<g fill="#ffffff" fill-opacity="0.12" font-family="monospace" font-size="9" letter-spacing="0.15em">
  <text x="50" y="80">SYS_STATUS: OPERATIONAL</text>
  <text x="50" y="100">NET_DEPTH: TRENCH_LEVEL_3</text>
  <text x="1220" y="80">MEME_VOL: MAX_FLOW</text>
</g>
`;

const WALLPAPER_BLUEPRINT = `
${GLOBAL_DEFS}
<rect width="1440" height="900" fill="#05141E" />
<!-- Technical blueprint Grid -->
<defs>
  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e2a3c" stroke-width="1"/>
    <path d="M 8 0 L 8 40 M 16 0 L 16 40 M 24 0 L 24 40 M 32 0 L 32 40 M 0 8 L 40 8 M 0 16 L 40 16 M 0 24 L 40 24 M 0 32 L 40 32" fill="none" stroke="#0b1e2c" stroke-width="0.5"/>
  </pattern>
</defs>
<rect width="1440" height="900" fill="url(#grid-pattern)" />

<!-- Blueprint Drawings (Right Aligned) -->
<g stroke="#1a557a" stroke-opacity="0.5" stroke-width="1" fill="none" transform="translate(1080, 450)">
  <!-- Radial Circles Blueprint -->
  <circle cx="0" cy="0" r="320" />
  <circle cx="0" cy="0" r="240" stroke-dasharray="4 6" />
  <circle cx="0" cy="0" r="160" />
  <circle cx="0" cy="0" r="80" />
  <circle cx="0" cy="0" r="30" />
  
  <!-- Intersecting layout guides -->
  <line x1="-380" y1="0" x2="380" y2="0" stroke-dasharray="10 10" />
  <line x1="0" y1="-380" x2="0" y2="380" stroke-dasharray="10 10" />
  <line x1="-260" y1="-260" x2="260" y2="260" stroke-opacity="0.3" />
  <line x1="-260" y1="260" x2="260" y2="-260" stroke-opacity="0.3" />

  <!-- Outer Blueprint schematics (Tech arcs) -->
  <path d="M -200,-200 A 282 282 0 0 1 200,-200" stroke="#2575a7" stroke-width="1.5" />
  <path d="M -220,220 A 311 311 0 0 0 220,220" stroke-dasharray="3 3" />
  
  <!-- Blueprint symbols -->
  <rect x="-10" y="-10" width="20" height="20" stroke-width="0.75" />
  <polygon points="0,-160 10,-145 -10,-145" fill="#1a557a" fill-opacity="0.3" />
  <polygon points="0,160 10,145 -10,145" fill="#1a557a" fill-opacity="0.3" />
  <polygon points="160,0 145,10 145,-10" fill="#1a557a" fill-opacity="0.3" />
  <polygon points="-160,0 -145,10 -145,-10" fill="#1a557a" fill-opacity="0.3" />

  <!-- Circular loop blueprints (mimicking user image loops) -->
  <circle cx="-160" cy="-120" r="50" stroke-width="1.5" />
  <circle cx="-160" cy="-120" r="40" stroke-dasharray="5 5" />
  <path d="M-110,-120 A 50 50 0 0 1 -210,-120" stroke="#00f2ff" stroke-opacity="0.3" stroke-width="2" />
  
  <circle cx="-140" cy="140" r="70" />
  <rect x="-175" y="105" width="70" height="70" stroke-dasharray="4 4" />
</g>
<g fill="#1a557a" fill-opacity="0.6" font-family="monospace" font-size="8" letter-spacing="0.1em">
  <text x="740" y="80">SCALE: 1:25.0</text>
  <text x="740" y="95">REF: BOTS_OS_REVISION_D</text>
  <text x="740" y="110">SHEET 1 OF 3</text>
</g>
`;

const WALLPAPER_CODE = `
${GLOBAL_DEFS}
<rect width="1440" height="900" fill="#0B0D11" />
<g transform="translate(720, 450) scale(1.15)">
  <!-- Laptop Icon (💻) -->
  <g transform="translate(-160, -20)" fill="#788896">
    <rect x="-35" y="-20" width="70" height="42" rx="4" fill="none" stroke="#788896" stroke-width="4.5" />
    <path d="M-45,22 L45,22 M-48,26 L48,26" stroke="#788896" stroke-width="4.5" stroke-linecap="round" />
  </g>

  <!-- Plus Sign (＋) -->
  <g transform="translate(-60, -20)" stroke="#788896" stroke-width="4.5" stroke-linecap="round">
    <line x1="-8" y1="0" x2="8" y2="0" />
    <line x1="0" y1="-8" x2="0" y2="8" />
  </g>

  <!-- Coffee Cup Icon (☕) -->
  <g transform="translate(10, -20)">
    <!-- Cup Body -->
    <path d="M-22,-14 L22,-14 L16,14 C15,18 8,20 0,20 C-8,20 -15,18 -16,14 Z" fill="#788896" />
    <rect x="-24" y="-17" width="48" height="3" rx="1.5" fill="#788896" />
    <!-- Handle -->
    <path d="M22,-8 C28,-8 28,4 22,4" fill="none" stroke="#788896" stroke-width="4" stroke-linecap="round" />
    <!-- Heat Waves -->
    <path d="M-8,-32 C-6,-28 -10,-24 -8,-20 M0,-34 C2,-30 -2,-26 0,-22 M8,-32 C10,-28 6,-24 8,-20" fill="none" stroke="#788896" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Equals Sign (＝) -->
  <g transform="translate(85, -20)" stroke="#788896" stroke-width="4.5" stroke-linecap="round">
    <line x1="-8" y1="-4" x2="8" y2="-4" />
    <line x1="-8" y1="4" x2="8" y2="4" />
  </g>

  <!-- Code Tag Icon (</>) -->
  <g transform="translate(160, -20)" stroke="#788896" stroke-width="4.5" stroke-linecap="round" fill="none" stroke-linejoin="round">
    <polyline points="-12,-15 -25,0 -12,15" />
    <line x1="3" y1="-18" x2="-3" y2="18" />
    <polyline points="12,-15 25,0 12,15" />
  </g>
</g>
`;

const WALLPAPER_HELLOWORLD = `
${GLOBAL_DEFS}
<rect width="1440" height="900" fill="#000000" />
<text x="720" y="460" font-family="monospace, Courier, fixed" font-size="32" fill="#34D399" text-anchor="middle" letter-spacing="1">Hello World.</text>
`;

export function Wallpaper() {
  const wallpaper = useOS((s) => s.wallpaper);

  const activeSVG = useMemo(() => {
    switch (wallpaper) {
      case 'blueprint': return WALLPAPER_BLUEPRINT;
      case 'code': return WALLPAPER_CODE;
      case 'helloworld': return WALLPAPER_HELLOWORLD;
      case 'sonoma':
      default:
        return WALLPAPER_SONOMA;
    }
  }, [wallpaper]);

  return (
    <div id="wall">
      <div className="sky" />
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden
        dangerouslySetInnerHTML={{ __html: activeSVG }} />
      <div className="grain" />
    </div>
  );
}
