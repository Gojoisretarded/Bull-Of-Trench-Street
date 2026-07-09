import { useState } from 'react';
import { useOS } from '../store/os';
import { ALL_APPS, APP_META } from '../apps/registry';
import { AppIcon } from '../apps/icons';
import { sfx } from '../lib/sound';

export function AppGrid() {
  const open = useOS((s) => s.gridOpen);
  const { setGrid, openApp } = useOS.getState();
  const [q, setQ] = useState('');
  if (!open) return null;
  const apps = ALL_APPS.filter((id) => APP_META[id].title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div id="grid" className="on" onPointerDown={(e) => { if ((e.target as HTMLElement).id === 'grid') setGrid(false); }}>
      <input id="gsearch" autoFocus placeholder="Type to search the trenches…"
        value={q} onChange={(e) => setQ(e.target.value)} />
      <div id="gapps">
        {apps.map((id, i) => (
          <button key={id} className="ga" style={{ animationDelay: `${i * 30}ms` }}
            onClick={() => { sfx.open(); setGrid(false); openApp(id); }}>
            <span className="ic"><AppIcon id={id} /></span>
            <span className="l">{APP_META[id].title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
