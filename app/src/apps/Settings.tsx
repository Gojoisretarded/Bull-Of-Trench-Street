import { useState, useCallback } from 'react';
import { useOS, wipeSave } from '../store/os';
import { sfx, setMuted } from '../lib/sound';
import { netSend } from '../lib/netBus';
import { useIsMobile } from '../hooks/useIsMobile';

const CHAR_NAMES: Record<string, string> = {
  orphan: 'The Orphan', fumbler: 'The Fumbler', nepo: 'The Nepo', addict: 'The Addict',
};

type ThemeId = 'hood' | 'dark' | 'light';
function getInitialTheme(): ThemeId {
  try { return (localStorage.getItem('trenchos.theme') as ThemeId) || 'hood'; } catch { return 'hood'; }
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', marginTop: 6 }}>
      {children}
    </div>
  );
}

function Row({ label, sub, right, onClick }: { label: string; sub?: string; right: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'var(--surface-2)', border: '1px solid var(--line-soft)', borderRadius: 10, padding: '10px 14px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

export function Settings() {
  const toast = useOS((s) => s.toast);
  const username = useOS((s) => s.username);
  const handle = useOS((s) => s.handle);
  const chosen = useOS((s) => s.chosen);
  const online = useOS((s) => s.online);
  const netReady = useOS((s) => s.netReady);
  const onlineCount = useOS((s) => s.onlineCount);
  const muted = useOS((s) => s.muted);
  const toggleMuted = useOS((s) => s.toggleMuted);
  const openApp = useOS((s) => s.openApp);
  const wallpaper = useOS((s) => s.wallpaper);
  const isMobile = useIsMobile();

  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);
  const applyTheme = useCallback((next: ThemeId) => {
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('trenchos.theme', next); } catch { /* storage blocked */ }
    setThemeState(next);
    sfx.click();
  }, []);

  const logOff = () => {
    if (!window.confirm('Log off and wipe this save? Your bag, clout and coins are gone forever.')) return;
    netSend({ t: 'unregister' }); // release the handle server-side (no-op offline)
    wipeSave();
    setTimeout(() => location.reload(), 250);
  };

  const connLabel = online
    ? `● Online — ${onlineCount} degen${onlineCount === 1 ? '' : 's'} in the trenches`
    : netReady
      ? '◐ Server reachable — not logged in'
      : '○ Offline — solo trenches';
  const connColor = online ? 'var(--green)' : netReady ? 'var(--gold)' : 'var(--muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)' }}>
      <div className="appbar">
        <strong style={{ color: 'var(--ink)' }}>Settings</strong>
        <span className="sub">// tune your trenches</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        <SectionTitle>ACCOUNT</SectionTitle>
        <Row
          label={username || 'Not logged in'}
          sub={chosen ? `@${handle} · ${CHAR_NAMES[chosen.id] ?? chosen.name}` : 'Pick a degen at the login screen'}
          right={
            <button className="btn ghost" onClick={logOff} style={{ fontSize: 11, padding: '6px 12px', color: 'var(--red)' }}>
              LOG OFF & WIPE
            </button>
          }
        />
        <Row
          label="Connection"
          sub="Multiplayer server status"
          right={<span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: connColor }}>{connLabel}</span>}
        />

        <SectionTitle>SOUND &amp; THEME</SectionTitle>
        <Row
          label="Sound effects"
          sub="Clicks, coins and pain"
          right={
            <button className="btn ghost" onClick={() => { toggleMuted(); setMuted(!muted); sfx.click(); }} style={{ fontSize: 11, padding: '6px 12px' }}>
              {muted ? '🔇 MUTED' : '🔊 ON'}
            </button>
          }
        />
        {/* Hood (default) · Dark · Light. Light is a desktop-only option. */}
        <Row
          label="Theme"
          sub="Hood by default — matte black &amp; electric green"
          right={
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { id: 'hood', label: 'Hood', dot: '#00C805' },
                { id: 'dark', label: 'Dark', dot: '#4F8FE6' },
                { id: 'light', label: 'Light', dot: '#EAE8E4' },
              ] as { id: ThemeId; label: string; dot: string }[])
                .filter((t) => !isMobile || t.id !== 'light')
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTheme(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, fontWeight: 700, padding: '7px 10px', borderRadius: 8,
                      background: theme === t.id ? 'var(--surface-3)' : 'transparent',
                      border: `1px solid ${theme === t.id ? 'var(--gold)' : 'var(--line-soft)'}`,
                      color: theme === t.id ? 'var(--ink)' : 'var(--muted)',
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.dot, border: '1px solid rgba(255,255,255,.25)' }} />
                    {t.label}
                  </button>
                ))}
            </div>
          }
        />

        <SectionTitle>APPEARANCE</SectionTitle>
        <Row
          label="Wallpaper"
          sub={`Current: ${wallpaper}`}
          onClick={() => { sfx.click(); openApp('wallpapers'); }}
          right={<span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>🖼 OPEN ›</span>}
        />
      </div>
    </div>
  );
}
