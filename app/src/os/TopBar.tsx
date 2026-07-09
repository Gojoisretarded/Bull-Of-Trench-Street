import { useState, useCallback } from 'react';
import { useOS, wipeSave } from '../store/os';
import { useClock } from '../hooks/useClock';
import { fmtK, fmtUsd } from '../lib/format';
import { netSend } from '../lib/netBus';
import { sfx, setMuted } from '../lib/sound';

function getInitialTheme(): 'dark' | 'light' {
  try { return (localStorage.getItem('trenchos.theme') as 'dark' | 'light') || 'dark'; } catch { return 'dark'; }
}

export function TopBar() {
  const { time, date } = useClock();
  const balance = useOS((s) => s.balance);
  const clout = useOS((s) => s.clout);
  const overview = useOS((s) => s.overview);
  const muted = useOS((s) => s.muted);
  const handle = useOS((s) => s.handle);
  const online = useOS((s) => s.online);
  const onlineCount = useOS((s) => s.onlineCount);
  const { toggleOverview, setGrid, toggleMuted } = useOS.getState();

  const logOff = () => {
    // Power off = wipe the save (and its salt) and restart the sim.
    // A plain refresh keeps progress; this is the explicit reset.
    if (!window.confirm('Log off and wipe this save? Your bag, clout and coins are gone forever.')) return;
    netSend({ t: 'unregister' }); // release the handle server-side (no-op offline)
    wipeSave();
    setTimeout(() => location.reload(), 250);
  };

  const [theme, setThemeState] = useState<'dark' | 'light'>(getInitialTheme);
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('trenchos.theme', next); } catch {}
    setThemeState(next);
    sfx.click();
  }, [theme]);

  return (
    <div id="topbar">
      <button className={'tbtn' + (overview ? ' on' : '')} onClick={() => toggleOverview()}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        Overview
      </button>
      <button className="tbtn" onClick={() => setGrid(true)}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        Apps
      </button>
      <div id="tb-clock"><span>{time}</span><span className="d">{date}</span></div>
      <div id="tb-right">
        <button className="tbtn" title="Sound" onClick={() => { toggleMuted(); setMuted(!muted); }}>
          {muted ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          )}
        </button>
        <button className="tbtn" title="Toggle theme" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          )}
        </button>
        {online && (
          <span className="tbtn" title={`${onlineCount} degens online`} style={{ pointerEvents: 'none', color: 'var(--green)', fontFamily: 'var(--mono)' }}>
            ● {onlineCount}
          </span>
        )}
        {handle && (
          <span className="tbtn" style={{ pointerEvents: 'none', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>@{handle}</span>
        )}
        <span className="tbtn" style={{ pointerEvents: 'none', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          {fmtK(clout)}
        </span>
        <span className="tbtn" style={{ pointerEvents: 'none', color: 'var(--gold)', fontWeight: 700 }}>{fmtUsd(balance)}</span>
        <button className="tbtn" title="Log off & wipe save" onClick={logOff}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
        </button>
      </div>
    </div>
  );
}
