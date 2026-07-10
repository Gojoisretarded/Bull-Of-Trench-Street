import { useEffect, useRef } from 'react';
import { useOS } from '../../store/os';
import { MobileStatusBar } from './MobileStatusBar';
import { MobileHome } from './MobileHome';
import { MobileAppView } from './MobileAppView';
import { MobileTabBar } from './MobileTabBar';
import { Wallpaper } from '../Wallpaper';
import { Toasts } from '../Toasts';
import { AppIcon } from '../../apps/icons';
import { APP_META } from '../../apps/registry';
import { sfx } from '../../lib/sound';
import type { AppId } from '../types';

export function MobileShell() {
  const mobileView = useOS((s) => s.mobileView);
  const overview = useOS((s) => s.overview);
  const wins = useOS((s) => s.wins);
  const { tick, toast, openApp, closeApp, toggleOverview } = useOS.getState();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);

  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const rafId = useRef<number | null>(null);

  // Initialize market tick loop on mobile
  useEffect(() => {
    const { chosen, username } = useOS.getState();
    toast(`gm, ${username || chosen?.name || 'degen'}. trenches are live.`, 'good');
    
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decayScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    
    el.scrollLeft -= velocity.current * 16;
    velocity.current *= 0.93; // friction factor
    
    if (Math.abs(velocity.current) > 0.05) {
      rafId.current = requestAnimationFrame(decayScroll);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    dragDistance.current = 0;
    
    lastX.current = e.pageX;
    lastTime.current = performance.now();
    velocity.current = 0;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    
    const x = e.pageX - el.offsetLeft;
    const dist = x - startX.current;
    dragDistance.current = Math.abs(dist);
    el.scrollLeft = scrollLeft.current - dist * 1.5;
    
    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      const dx = e.pageX - lastX.current;
      velocity.current = dx / dt;
    }
    lastX.current = e.pageX;
    lastTime.current = now;
  };

  const onMouseUpOrLeave = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (dragDistance.current > 5 && Math.abs(velocity.current) > 0.1) {
      rafId.current = requestAnimationFrame(decayScroll);
    }
  };

  const runningApps = Object.keys(wins);
  const isAppOpen = mobileView !== null;
  const showTabBar = mobileView === null || mobileView === 'degenfun' || mobileView === 'chirper' || mobileView === 'wallet';

  return (
    <div id="desktop" className="mobile-shell-root">
      <Wallpaper />
      <div className={`mobile-screen-container ${isAppOpen ? 'app-open' : ''}`}>
        <MobileStatusBar />
        <div className="mobile-main-content">
          <MobileHome />
          {isAppOpen && (
            <MobileAppView id={mobileView} key={mobileView} />
          )}

          {/* iOS-Style App Switcher / Overview */}
          {overview && (
            <div className="mobile-switcher" onClick={() => toggleOverview(false)}>
              <button
                className="mobile-switcher-close"
                aria-label="Close app switcher"
                onClick={(e) => { e.stopPropagation(); sfx.tap(); toggleOverview(false); }}
              >
                <span className="x">✕</span> Close
              </button>
              <div className="mobile-switcher-title">RUNNING TRENCH APPS</div>
              
              {runningApps.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--mono)' }}>
                  No apps running
                </div>
              ) : (
                <div 
                  ref={scrollRef}
                  className="mobile-switcher-cards" 
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUpOrLeave}
                  onMouseLeave={onMouseUpOrLeave}
                  style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
                >
                  {runningApps.map((id, idx) => {
                    const appId = id as AppId;
                    const meta = APP_META[appId];
                    return (
                      <div
                        key={appId}
                        className="mobile-switcher-card"
                        style={{ animationDelay: `${idx * 36}ms` }}
                        onClick={(e) => {
                          if (dragDistance.current > 8) {
                            e.stopPropagation();
                            return;
                          }
                          sfx.open();
                          openApp(appId);
                          toggleOverview(false);
                        }}
                      >
                        <div className="mobile-switcher-card-header">
                          <span className="icon">
                            <AppIcon id={appId} />
                          </span>
                          <span className="title">{meta?.title || appId}</span>
                          <button
                            className="close-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              sfx.err();
                              closeApp(appId);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="mobile-switcher-card-preview">
                          <span>{meta?.title || appId} Active</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {showTabBar && <MobileTabBar />}
      </div>
      <Toasts />
    </div>
  );
}
