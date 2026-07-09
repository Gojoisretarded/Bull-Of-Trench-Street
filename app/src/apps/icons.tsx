import type { AppId } from '../os/types';

// Hand-drawn SVG squircle icons (matte-blue system). Returned as inner-SVG markup strings.
function markup(id: AppId | 'apps'): string {
  const G = (k: string, a: string, b: string) =>
    `<defs><linearGradient id="g-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const T = (k: string) =>
    `<rect x="2" y="2" width="44" height="44" rx="11" fill="url(#g-${k})"/><rect x="2" y="2" width="44" height="44" rx="11" fill="none" stroke="rgba(255,255,255,.08)"/>`;
  const map: Record<string, string> = {
    degenfun: G('df', '#232B38', '#11161F') + T('df') +
      '<path d="M13.5 14v20M24 10v22M34.5 16v22" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>' +
      '<rect x="10.5" y="19" width="6" height="10" rx="1.3" fill="#34D399"/>' +
      '<rect x="21" y="14" width="6" height="12" rx="1.3" fill="#F5566E"/>' +
      '<rect x="31.5" y="22" width="6" height="11" rx="1.3" fill="#34D399"/>',
    chirper: G('ch', '#57A8F2', '#2D6FD8') + T('ch') +
      '<path d="M35.5 15.5l3.5-1.8-2.2 4.1c.6 7.9-4.6 14.8-13 14.8-3.3 0-6.2-1-8.3-2.6 2.9.2 5.5-.6 7.3-2.1-2.5-.4-4.5-2-5.3-4.1.9.2 1.7.2 2.6-.1-2.8-.8-4.6-3-4.6-5.8.8.4 1.7.7 2.6.8-2.4-1.9-3.1-5.1-1.6-7.6 2.8 3.3 6.9 5.5 11.4 5.8-.7-3.1 1.6-5.9 4.7-5.9 1.4 0 2.6.6 3.5 1.5z" fill="#fff"/>',
    wallet: G('wa', '#9A6A33', '#6B4320') + T('wa') +
      '<rect x="9" y="14" width="30" height="21" rx="4" fill="#F5EDE2"/>' +
      '<rect x="9" y="14" width="30" height="6.5" rx="3.2" fill="#E4D3BB"/>' +
      '<rect x="26.5" y="21" width="12.5" height="9.5" rx="2.6" fill="#8A5A2B"/>' +
      '<circle cx="31" cy="25.8" r="1.9" fill="#4F8FE6"/>',
    terminal: G('te', '#242932', '#0F1216') + T('te') +
      '<path d="M12 17l8 7-8 7" stroke="#34D399" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="24" y="28.6" width="11" height="3.2" rx="1.5" fill="#34D399"/>',
    darkweb: G('dw', '#28313E', '#141A22') + T('dw') +
      '<path d="M24 9.5c-7.2 0-12.2 5.1-12.2 11.7 0 4 2 7.1 5 9.1v3.4c0 1.2.9 2.1 2.1 2.1h10.2c1.2 0 2.1-.9 2.1-2.1v-3.4c3-2 5-5.1 5-9.1 0-6.6-5-11.7-12.2-11.7z" fill="#E6ECF3"/>' +
      '<circle cx="18.8" cy="21.5" r="3.1" fill="#141A22"/><circle cx="29.2" cy="21.5" r="3.1" fill="#141A22"/>' +
      '<path d="M21.8 28.5h4.4L24 32.4z" fill="#141A22"/>',
    files: G('fi', '#4F8FE6', '#2F6BC0') + T('fi') +
      '<path d="M10 16.5c0-1.4 1.1-2.5 2.5-2.5h8l3.5 4h11.5c1.4 0 2.5 1.1 2.5 2.5v13c0 1.4-1.1 2.5-2.5 2.5h-23a2.5 2.5 0 0 1-2.5-2.5z" fill="#EAF1FB"/>' +
      '<path d="M10 22.5h28v11c0 1.4-1.1 2.5-2.5 2.5h-23a2.5 2.5 0 0 1-2.5-2.5z" fill="#C9DCF4"/>',
    chudmail: G('cm', '#5C8DF0', '#3B63C4') + T('cm') +
      '<rect x="9" y="15" width="30" height="19.5" rx="3.2" fill="#fff"/>' +
      '<path d="M10 16.8L24 27l14-10.2" stroke="#3B63C4" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    gamble: G('gb', '#3A4657', '#232D3A') + T('gb') +
      '<rect x="12" y="12" width="24" height="24" rx="6.5" fill="#fff"/>' +
      '<circle cx="18.7" cy="18.7" r="2.2" fill="#232D3A"/><circle cx="29.3" cy="18.7" r="2.2" fill="#232D3A"/>' +
      '<circle cx="24" cy="24" r="2.2" fill="#232D3A"/>' +
      '<circle cx="18.7" cy="29.3" r="2.2" fill="#232D3A"/><circle cx="29.3" cy="29.3" r="2.2" fill="#232D3A"/>',
    internet: G('in', '#3E7BE8', '#2452B0') + T('in') +
      '<circle cx="24" cy="24" r="13" fill="none" stroke="#fff" stroke-width="2"/>' +
      '<ellipse cx="24" cy="24" rx="5.8" ry="13" fill="none" stroke="#fff" stroke-width="2"/>' +
      '<path d="M11.6 19.8h24.8M11.6 28.2h24.8" stroke="#fff" stroke-width="2"/>',
    launchpad: G('lp', '#FF6B6B', '#C22323') + T('lp') +
      '<path d="M24 10c-3.2 4.5-5 11.5-5 16.5 0 2.8 2.2 5 5 5s5-2.2 5-5c0-5-1.8-12-5-16.5z" fill="#fff"/>' +
      '<path d="M19 26.5c-2 1.5-4.5 3-4.5 6.5v2h6.5v-8.5z" fill="rgba(255,255,255,.45)"/>' +
      '<path d="M29 26.5c2 1.5 4.5 3 4.5 6.5v2h-6.5v-8.5z" fill="rgba(255,255,255,.45)"/>' +
      '<circle cx="24" cy="19" r="1.8" fill="#C22323"/>',
    settings: G('se', '#8F5AE8', '#5A28A8') + T('se') +
      '<rect x="11" y="11" width="26" height="26" rx="4" fill="none" stroke="#fff" stroke-width="2" />' +
      '<circle cx="18" cy="18" r="2.2" fill="#fff" />' +
      '<polygon points="13,34 21,24 27,31 31,26 35,34" fill="#fff" />',
    apps: G('ap', '#2A3546', '#1A2230') + T('ap') +
      [16, 24, 32].map((y) => [16, 24, 32].map((x) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#E7ECF3"/>`).join('')).join(''),
  };
  return map[id] ?? map.apps;
}

export function AppIcon({ id, className }: { id: AppId | 'apps'; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden
      dangerouslySetInnerHTML={{ __html: markup(id) }} />
  );
}
