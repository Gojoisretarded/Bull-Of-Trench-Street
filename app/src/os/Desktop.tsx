import { useEffect, type CSSProperties } from 'react';
import { useOS, TOPBAR } from '../store/os';
import type { AppId, WinState } from './types';
import { Wallpaper } from './Wallpaper';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { AppGrid } from './AppGrid';
import { Toasts } from './Toasts';
import { Window } from './Window';
import { isMobile } from '../lib/dom';

function overviewLayout(list: WinState[]): Record<string, CSSProperties> {
  const out: Record<string, CSSProperties> = {};
  const n = list.length; if (!n) return out;
  const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
  const ax = 40, ay = TOPBAR + 34, aw = window.innerWidth - 80, ah = window.innerHeight - TOPBAR - 140;
  const sw = aw / cols, sh = ah / rows;
  list.forEach((w, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const cx = ax + (c + 0.5) * sw, cy = ay + (r + 0.5) * sh;
    const curW = w.max || isMobile() ? window.innerWidth : w.w;
    const curH = w.max || isMobile() ? window.innerHeight - TOPBAR : w.h;
    const s = Math.min((sw - 36) / curW, (sh - 36) / curH, 1);
    out[w.id] = { transform: `translate(${cx - curW * s / 2}px,${cy - curH * s / 2}px) scale(${s})`, width: curW, height: curH };
  });
  return out;
}

export function Desktop() {
  const wins = useOS((s) => s.wins);
  const overview = useOS((s) => s.overview);
  const { openApp, toast, tick, setGrid, toggleOverview } = useOS.getState();

  // welcome + live market tick
  useEffect(() => {
    const { chosen, username } = useOS.getState();
    toast(`gm, ${username || chosen?.name || 'degen'}. the trenches are live.`, 'good');
    const id = setInterval(tick, 1000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (useOS.getState().gridOpen) setGrid(false);
      else if (useOS.getState().overview) toggleOverview(false);
    };
    window.addEventListener('keydown', onKey);
    return () => { clearInterval(id); window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = Object.values(wins) as WinState[];
  const ov = overview ? overviewLayout(list) : null;

  return (
    <div id="desktop" className={overview ? 'ov' : ''}>
      <Wallpaper />
      <div id="snap" />
      <Toasts />
      <TopBar />
      {list.map((w) => <Window key={w.id} win={w} ovStyle={ov ? ov[w.id] : undefined} />)}
      <Dock />
      <AppGrid />
    </div>
  );
}
