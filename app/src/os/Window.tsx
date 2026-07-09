import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useOS, TOPBAR } from '../store/os';
import type { WinState } from './types';
import { APP_META } from '../apps/registry';
import { AppIcon } from '../apps/icons';
import { AppBody } from '../apps/AppBody';
import { isMobile, dockIconRect } from '../lib/dom';
import { sfx } from '../lib/sound';

const clearSnap = () => { const s = document.getElementById('snap'); if (s) s.classList.remove('on'); };
function showSnap(zone: 'max' | 'left' | 'right') {
  const s = document.getElementById('snap'); if (!s) return;
  const tb = TOPBAR; const vw = window.innerWidth, vh = window.innerHeight;
  let r: [number, number, number, number];
  if (zone === 'max') r = [6, tb + 6, vw - 12, vh - tb - 90];
  else if (zone === 'left') r = [6, tb + 6, vw / 2 - 9, vh - tb - 90];
  else r = [vw / 2 + 3, tb + 6, vw / 2 - 9, vh - tb - 90];
  s.style.transform = `translate(${r[0]}px,${r[1]}px)`;
  s.style.width = r[2] + 'px'; s.style.height = r[3] + 'px'; s.classList.add('on');
}

export function Window({ win, ovStyle }: { win: WinState; ovStyle?: CSSProperties }) {
  const { focusApp, setGeom, closeApp, minApp, restoreApp, toggleMax, toggleOverview } = useOS.getState();
  const overview = useOS((s) => s.overview);
  const el = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [anim, setAnim] = useState(false);
  const wasMin = useRef(win.min);

  // animate on max / overview transitions
  useEffect(() => { setAnim(true); const t = setTimeout(() => setAnim(false), 320); return () => clearTimeout(t); }, [win.max, overview]);

  // restore animation: min true -> false
  useEffect(() => {
    if (wasMin.current && !win.min && el.current) {
      const node = el.current;
      const r = dockIconRect(win.id);
      const cur = node.getBoundingClientRect();
      const target = maxed() ? { w: window.innerWidth, h: window.innerHeight - TOPBAR } : { w: win.w, h: win.h };
      const s = Math.max(0.06, r.width / target.w);
      node.style.transition = 'none';
      node.style.transform = `translate(${r.left + r.width / 2 - target.w * s / 2}px,${r.top + r.height / 2 - target.h * s / 2}px) scale(${s})`;
      node.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        node.style.transition = '';
        node.classList.add('anim');
        node.style.transform = geomTransform();
        node.style.opacity = '1';
        setTimeout(() => { node.classList.remove('anim'); node.style.opacity = ''; }, 320);
      }));
    }
    wasMin.current = win.min;
  }, [win.min]);

  const maxed = () => win.max || isMobile();
  const geomTransform = () => maxed() ? `translate(0px,${TOPBAR}px)` : `translate(${win.x}px,${win.y}px)`;

  /* ---- drag ---- */
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; nx: number; ny: number; zone: 'max' | 'left' | 'right' | null } | null>(null);
  const raf = useRef(0);

  const onHeaderDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.hb-c')) return;
    if (overview) { focusApp(win.id); toggleOverview(false); return; }
    focusApp(win.id);
    if (isMobile()) return;
    e.preventDefault();
    let x = win.x, y = win.y;
    if (win.max) { toggleMax(win.id); x = e.clientX - win.w / 2; y = TOPBAR + 8; }
    drag.current = { sx: e.clientX, sy: e.clientY, ox: x, oy: y, nx: x, ny: y, zone: null };
    el.current?.classList.add('dragging');
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current; if (!d) return;
    let nx = d.ox + (e.clientX - d.sx), ny = d.oy + (e.clientY - d.sy);
    ny = Math.max(TOPBAR, Math.min(ny, window.innerHeight - 80));
    nx = Math.max(-win.w + 90, Math.min(nx, window.innerWidth - 90));
    d.nx = nx; d.ny = ny;
    const zone = e.clientY < TOPBAR + 6 ? 'max' : e.clientX < 8 ? 'left' : e.clientX > window.innerWidth - 8 ? 'right' : null;
    if (zone !== d.zone) { d.zone = zone; zone ? showSnap(zone) : clearSnap(); }
    if (!raf.current) raf.current = requestAnimationFrame(() => {
      raf.current = 0; if (el.current) el.current.style.transform = `translate(${d.nx}px,${d.ny}px)`;
    });
  };
  const onUp = () => {
    const d = drag.current; if (!d) return;
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    el.current?.classList.remove('dragging');
    clearSnap();
    if (d.zone === 'max') { setGeom(win.id, { max: true }); }
    else if (d.zone === 'left' || d.zone === 'right') {
      const vw = window.innerWidth, vh = window.innerHeight;
      setGeom(win.id, { max: false, y: TOPBAR + 6, h: vh - TOPBAR - 96, w: Math.round(vw / 2) - 12, x: d.zone === 'left' ? 6 : Math.round(vw / 2) + 6 });
    } else {
      setGeom(win.id, { x: d.nx, y: d.ny });
    }
    drag.current = null;
    window.removeEventListener('pointermove', onMove);
  };

  /* ---- resize ---- */
  const rez = useRef<{ sx: number; sy: number; ow: number; oh: number; w: number; h: number } | null>(null);
  const onRezDown = (e: React.PointerEvent) => {
    if (isMobile() || overview) return;
    e.preventDefault(); e.stopPropagation(); focusApp(win.id);
    rez.current = { sx: e.clientX, sy: e.clientY, ow: win.w, oh: win.h, w: win.w, h: win.h };
    el.current?.classList.add('resizing');
    window.addEventListener('pointermove', onRezMove);
    window.addEventListener('pointerup', onRezUp, { once: true });
  };
  const onRezMove = (e: PointerEvent) => {
    const r = rez.current; if (!r) return;
    r.w = Math.max(280, r.ow + (e.clientX - r.sx));
    r.h = Math.max(190, r.oh + (e.clientY - r.sy));
    if (!raf.current) raf.current = requestAnimationFrame(() => {
      raf.current = 0; if (el.current) { el.current.style.width = r.w + 'px'; el.current.style.height = r.h + 'px'; }
    });
  };
  const onRezUp = () => {
    const r = rez.current; if (!r) return;
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    el.current?.classList.remove('resizing');
    setGeom(win.id, { w: r.w, h: r.h });
    rez.current = null;
    window.removeEventListener('pointermove', onRezMove);
  };

  const doMin = () => {
    sfx.tap();
    const node = el.current; if (!node) { minApp(win.id); return; }
    const r = dockIconRect(win.id);
    const cur = node.getBoundingClientRect();
    const s = Math.max(0.06, r.width / cur.width);
    node.classList.add('anim');
    node.style.transform = `translate(${r.left + r.width / 2 - cur.width * s / 2}px,${r.top + r.height / 2 - cur.height * s / 2}px) scale(${s})`;
    node.style.opacity = '0';
    setTimeout(() => { node.classList.remove('anim'); node.style.opacity = ''; node.style.transform = ''; minApp(win.id); }, 300);
  };

  const base: CSSProperties = ovStyle
    ? ovStyle
    : maxed()
      ? { transform: `translate(0px,${TOPBAR}px)`, width: '100%', height: window.innerHeight - TOPBAR - 80 }
      : { transform: `translate(${win.x}px,${win.y}px)`, width: win.w, height: win.h };

  // never mutate `base` — ovStyle is a shared prop object React freezes in dev
  const style: CSSProperties = win.min ? { ...base, display: 'none' } : base;

  const cls = ['win',
    useOS.getState().z === win.z ? 'focused' : '',
    closing ? 'closing' : '',
    (anim || overview) ? 'anim' : '',
    overview ? 'ov-win' : '',
    win.max ? 'maxed' : ''].filter(Boolean).join(' ');

  return (
    <div ref={el} id={`win-${win.id}`} className={cls} style={style}
      onPointerDown={() => { if (overview) { focusApp(win.id); toggleOverview(false); } else focusApp(win.id); }}>
      <div className="headerbar" onPointerDown={onHeaderDown} onDoubleClick={() => !isMobile() && toggleMax(win.id)}>
        <div className="hb-t"><span className="gli"><AppIcon id={win.id} /></span>{APP_META[win.id].title}</div>
        <div className="hb-c">
          <button className="wbtn" title="Minimize" onClick={(e) => { e.stopPropagation(); doMin(); }}>
            <svg viewBox="0 0 12 12"><path d="M2 8.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <button className="wbtn" title="Maximize" onClick={(e) => { e.stopPropagation(); sfx.tap(); toggleMax(win.id); }}>
            <svg viewBox="0 0 12 12"><rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <button className="wbtn cl" title="Close" onClick={(e) => { e.stopPropagation(); sfx.close(); setClosing(true); setTimeout(() => closeApp(win.id), 160); }}>
            <svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
      <div className="win-body">
        <AppBody id={win.id} />
      </div>
      <div className="resize" onPointerDown={onRezDown} />
    </div>
  );
}
