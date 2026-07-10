import { useState } from 'react';
import { useOS } from '../../store/os';
import { ALL_APPS, APP_META } from '../../apps/registry';
import { AppIcon } from '../../apps/icons';
import { sfx } from '../../lib/sound';
import type { AppId } from '../types';

const GRID_APPS: AppId[] = ['terminal', 'darkweb', 'launchpad', 'files', 'pumphub', 'gamble'];

export function MobileHome() {
  const username = useOS((s) => s.username);
  const openApp = useOS((s) => s.openApp);
  const [showDrawer, setShowDrawer] = useState(false);
  const [q, setQ] = useState('');

  const filteredApps = ALL_APPS.filter(
    (id) => APP_META[id].title.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mobile-home">
      <div className="hi">GM, @{(username || 'DEGEN').toUpperCase()} — THE TRENCHES ARE LIVE</div>
      
      {/* Main Apps Grid */}
      <div className="grid">
        {GRID_APPS.map((id) => (
          <button
            key={id}
            className="ga-app"
            onClick={() => {
              sfx.open();
              openApp(id);
            }}
          >
            <span className="ic">
              <AppIcon id={id} />
            </span>
            <span className="app-title">{APP_META[id].title}</span>
          </button>
        ))}
        
        {/* Apps Drawer Trigger */}
        <button
          className="ga-app launcher"
          onClick={() => {
            sfx.open();
            setShowDrawer(true);
          }}
        >
          <span className="ic" style={{ fontSize: '26px', color: 'var(--gold)', background: 'var(--surface-3)' }}>
            ⠿
          </span>
          <span className="app-title" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Apps</span>
        </button>
      </div>

      <div className="homebar"></div>

      {/* Apps Drawer Overlay */}
      {showDrawer && (
        <div className="apps-drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="apps-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="apps-drawer-header">
              <div className="apps-drawer-search-row">
                <input
                  placeholder="Type to search the trenches..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="apps-drawer-close" onClick={() => setShowDrawer(false)}>
                  Cancel
                </button>
              </div>
            </div>
            <div className="apps-drawer-grid">
              {filteredApps.map((id, idx) => (
                <button
                  key={id}
                  className="ga-app animate-in"
                  style={{ animationDelay: `${idx * 24}ms` }}
                  onClick={() => {
                    sfx.open();
                    setShowDrawer(false);
                    openApp(id);
                  }}
                >
                  <span className="ic">
                    <AppIcon id={id} />
                  </span>
                  <span className="app-title">{APP_META[id].title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
