import { useState } from 'react';
import { useOS } from '../store/os';
import { sfx } from '../lib/sound';

interface FakeFile { id: string; name: string; ext: string; size: string; icon: string; preview: string; }

const FILES: FakeFile[] = [
  { id: 'sonoma', name: 'wallpaper_sonoma_grid', ext: 'svg', size: '12.4 KB', icon: '🎨', preview: '[DESKTOP WALLPAPER]\n\nType: Dynamic Vector (SVG)\nTheme: Sonoma Mesh Gradient & Low-Poly Cyber Bull Mascot\n\nClick the button below to set this as your desktop wallpaper.' },
  { id: 'blueprint', name: 'wallpaper_blueprint_trench', ext: 'svg', size: '8.2 KB', icon: '🎨', preview: '[DESKTOP WALLPAPER]\n\nType: Technical Grid (SVG)\nTheme: Blueprints & HUD Schematic lines\n\nClick the button below to set this as your desktop wallpaper.' },
  { id: 'code', name: 'wallpaper_coding_equation', ext: 'svg', size: '4.8 KB', icon: '🎨', preview: '[DESKTOP WALLPAPER]\n\nType: Developer Minimalist (SVG)\nTheme: Laptop + Coffee = Code\n\nClick the button below to set this as your desktop wallpaper.' },
  { id: 'helloworld', name: 'wallpaper_hello_world', ext: 'svg', size: '1.2 KB', icon: '🎨', preview: '[DESKTOP WALLPAPER]\n\nType: Terminal Retro (SVG)\nTheme: Green "Hello World" text on pure black\n\nClick the button below to set this as your desktop wallpaper.' },
  { id: 'seed', name: 'seed_phrase_FINAL_v3', ext: 'txt', size: '0.2 KB', icon: '📝', preview: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about\n\n(Just kidding. But you looked.)' },
  { id: 'pnl', name: 'pnl_screenshot_edited', ext: 'png', size: '847 KB', icon: '🖼', preview: '[IMAGE FILE]\n\nA heavily photoshopped PnL screenshot showing +42,069% gains.\n\nMetadata reveals it was edited in MS Paint at 3:47 AM.\n\nExposure risk: HIGH' },
  { id: 'tax', name: 'tax_returns_LOL', ext: 'pdf', size: '0 KB', icon: '📄', preview: '[EMPTY FILE]\n\nThis file has been empty since 2021.\n\nThe IRS would like a word.' },
  { id: 'virus', name: 'definitely_not_a_virus', ext: 'exe', size: '666 KB', icon: '💀', preview: '⚠ EXECUTABLE FILE\n\n"Free SOL generator v4.2"\n\nVirus scan result: 47/52 detections\nThreat level: YES\n\nInstalling this would be very on-brand for you.' },
  { id: 'backup', name: 'wallet_backup_DO_NOT_DELETE', ext: 'json', size: '1.2 KB', icon: '🔐', preview: '{\n  "wallet": "REDACTED",\n  "balance": "lol",\n  "last_good_decision": null,\n  "copium_level": "maximum"\n}' },
  { id: 'diary', name: 'trading_diary', ext: 'md', size: '24 KB', icon: '📓', preview: 'Day 1: Bought $GRUMP. Feeling bullish.\nDay 2: Down 40%. Diamond hands.\nDay 3: Down 80%. This is fine.\nDay 7: Sold at -92%.\nDay 8: $GRUMP pumped 500%.\nDay 9: I am the meme.' },
  { id: 'resume', name: 'resume_wendys_application', ext: 'docx', size: '34 KB', icon: '📋', preview: 'WORK EXPERIENCE:\n\n• Professional Degen (2021-present)\n  - Lost $47,000 across 12 wallets\n  - Clicked 3 phishing links (survived 2)\n  - Community manager for 2 rugged projects\n\nSKILLS: Copium, hopium, coping mechanisms' },
  { id: 'chart', name: 'secret_alpha_chart', ext: 'png', size: '1.1 MB', icon: '📈', preview: '[IMAGE FILE]\n\nAn extremely zoomed-in 1-minute chart with 47 trend lines, 12 Fibonacci levels, and a hand-drawn arrow pointing up.\n\nCaption: "trust me bro"' },
];

export function Files() {
  const toast = useOS((s) => s.toast);
  const setWallpaper = useOS((s) => s.setWallpaper);
  const [sel, setSel] = useState<FakeFile | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const openFile = (f: FakeFile) => { sfx.click(); setSel(f); };
  const del = () => { sfx.err(); toast('File cannot be deleted. It knows too much.', 'bad'); };
  const applyWallpaper = (f: FakeFile) => {
    sfx.coin();
    setWallpaper(f.id as any);
    toast(`Wallpaper changed to ${f.name}.`, 'good');
  };

  return (
    <div className="fm">
      <div className="appbar">
        <strong style={{ color: 'var(--ink)' }}>Files</strong>
        <span className="sub">// ~/Documents</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={'fm-view' + (view === 'grid' ? ' on' : '')} onClick={() => setView('grid')}>▦</button>
          <button className={'fm-view' + (view === 'list' ? ' on' : '')} onClick={() => setView('list')}>☰</button>
        </div>
      </div>
      <div className="fm-body">
        {!sel ? (
          <div className={view === 'grid' ? 'fm-grid' : 'fm-list'}>
            {FILES.map((f) => (
              <div key={f.id} className="fm-file" onClick={() => openFile(f)}>
                <div className="fm-icon">{f.icon}</div>
                <div className="fm-fname">{f.name}<span className="fm-ext">.{f.ext}</span></div>
                {view === 'list' && <div className="fm-size">{f.size}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="fm-preview">
            <div className="fm-preview-head">
              <span className="fm-preview-icon">{sel.icon}</span>
              <div>
                <div className="fm-preview-name">{sel.name}.{sel.ext}</div>
                <div className="fm-preview-size">{sel.size}</div>
              </div>
            </div>
            <pre className="fm-preview-body">{sel.preview}</pre>
            <div className="fm-preview-acts">
              {sel.ext === 'svg' && (
                <button className="btn gold" onClick={() => applyWallpaper(sel)}>🖼 Set as Background</button>
              )}
              <button className="btn ghost" onClick={del}>🗑 Delete</button>
              <button className="btn ghost" onClick={() => { sfx.tap(); toast('Shared to Chirper. Embarrassing.', 'info'); }}>↗ Share</button>
              <button className="btn ghost" onClick={() => setSel(null)}>← Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
