import { useOS } from '../store/os';
import { sfx } from '../lib/sound';

interface WallpaperOption {
  id: 'sonoma' | 'blueprint' | 'code' | 'helloworld';
  name: string;
  desc: string;
  previewBg: string;
  textColor: string;
  badge?: string;
}

const OPTIONS: WallpaperOption[] = [
  {
    id: 'sonoma',
    name: 'Sonoma Grid',
    desc: 'Low-poly cyber bull with a neon mesh gradient background.',
    previewBg: 'linear-gradient(135deg, #05070f 0%, #0b0e17 50%, #020306 100%)',
    textColor: '#E7ECF3',
    badge: 'DEFAULT',
  },
  {
    id: 'blueprint',
    name: 'Blueprint Tech',
    desc: 'Deep navy technical blueprint grid with HUD lines.',
    previewBg: '#05141E',
    textColor: '#1a557a',
  },
  {
    id: 'code',
    name: 'Minimal Code',
    desc: 'Minimalist dark equation layout: Laptop + Coffee = Code.',
    previewBg: '#0B0D11',
    textColor: '#788896',
  },
  {
    id: 'helloworld',
    name: 'Hello World',
    desc: 'Classic hacker console theme with green monospace text.',
    previewBg: '#000000',
    textColor: '#34D399',
  },
];

export function Wallpapers() {
  const current = useOS((s) => s.wallpaper);
  const setWallpaper = useOS((s) => s.setWallpaper);
  const toast = useOS((s) => s.toast);

  const select = (opt: WallpaperOption) => {
    sfx.coin();
    setWallpaper(opt.id);
    toast(`Wallpaper changed to ${opt.name}`, 'good');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)' }}>
      <div className="appbar">
        <strong style={{ color: 'var(--ink)' }}>Wallpapers</strong>
        <span className="sub">// dress your desktop</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}>
          CHOOSE DESKTOP BACKGROUND
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {OPTIONS.map((opt) => {
            const isSel = current === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => select(opt)}
                style={{
                  border: isSel ? '2px solid var(--gold)' : '1px solid var(--line)',
                  borderRadius: '12px',
                  background: 'var(--surface-2)',
                  padding: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.12s var(--ease)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isSel ? '0 4px 14px var(--glow)' : 'none',
                }}
              >
                {/* Visual Thumbnail */}
                <div
                  style={{
                    height: '96px',
                    borderRadius: '8px',
                    background: opt.previewBg,
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {opt.id === 'sonoma' && (
                    <div style={{ color: '#00f2ff', opacity: 0.35, fontSize: '18px', fontWeight: 'bold' }}>♉</div>
                  )}
                  {opt.id === 'blueprint' && (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #1a557a', opacity: 0.4, position: 'absolute', top: '10px', right: '10px' }} />
                      <div style={{ width: '100%', height: '1px', background: '#1a557a', opacity: 0.3, position: 'absolute', top: '50%' }} />
                    </div>
                  )}
                  {opt.id === 'code' && (
                    <div style={{ color: opt.textColor, fontFamily: 'var(--mono)', fontSize: '11px' }}>💻+☕=&lt;/&gt;</div>
                  )}
                  {opt.id === 'helloworld' && (
                    <div style={{ color: opt.textColor, fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 'bold' }}>Hello World.</div>
                  )}
                  {opt.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        fontSize: '8px',
                        fontWeight: 800,
                        background: 'var(--gold)',
                        color: 'var(--gold-ink)',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {opt.badge}
                    </span>
                  )}
                </div>

                {/* Title & Info */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>{opt.name}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: '3px', lineHeight: '1.3' }}>{opt.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
