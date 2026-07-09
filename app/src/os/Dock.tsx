import { useRef } from 'react';
import { useOS } from '../store/os';
import { DOCK_APPS, APP_META } from '../apps/registry';
import type { AppId } from './types';
import { AppIcon } from '../apps/icons';
import { isMobile } from '../lib/dom';
import { sfx } from '../lib/sound';

export function Dock() {
  const wins = useOS((s) => s.wins);
  const z = useOS((s) => s.z);
  const { openApp, restoreApp, minApp, focusApp, setGrid } = useOS.getState();
  const dockRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const running = (Object.keys(wins) as AppId[]);
  const extras = running.filter((id) => !DOCK_APPS.includes(id));
  const list = [...DOCK_APPS, ...extras];

  const onIcon = (id: AppId) => {
    sfx.open();
    const w = wins[id];
    if (!w) openApp(id);
    else if (w.min) restoreApp(id);
    else if (w.z === z) minApp(id);
    else focusApp(id);
  };

  const mag = (e: React.PointerEvent) => {
    if (isMobile() || raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      dockRef.current?.querySelectorAll<HTMLElement>('.dk .ic').forEach((ic) => {
        const r = ic.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width / 2));
        const f = Math.max(0, 1 - d / 110);
        ic.style.transform = `translateY(${-7 * f}px) scale(${1 + 0.3 * f})`;
      });
    });
  };
  const reset = () => {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    dockRef.current?.querySelectorAll<HTMLElement>('.dk .ic').forEach((ic) => (ic.style.transform = ''));
  };

  return (
    <div id="dockwrap">
      <div id="dock" ref={dockRef} onPointerMove={mag} onPointerLeave={reset}>
        {list.map((id) => {
          const w = wins[id];
          return (
            <button key={id} className={'dk' + (w ? ' run' : '')} data-app={id} onClick={() => onIcon(id)}>
              <span className="ic"><AppIcon id={id} /></span>
              <span className="dot" />
              <span className="tip">{APP_META[id].title}</span>
            </button>
          );
        })}
        <div className="dk sep" />
        <button className="dk" id="dk-grid" onClick={() => { sfx.tap(); setGrid(true); }}>
          <span className="ic"><AppIcon id="apps" /></span>
          <span className="dot" />
          <span className="tip">Applications</span>
        </button>
      </div>
    </div>
  );
}
