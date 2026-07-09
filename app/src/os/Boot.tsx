import { useEffect, useState } from 'react';
import { useOS } from '../store/os';
import { WORLD } from '../config/world';

const LINES = [
  '[  OK  ] Mounted /wallet.',
  '[  OK  ] Started Market Feed Daemon.',
  '[  OK  ] Reached target Rock Bottom.',
  '[  OK  ] Started Hopium Calibration Service.',
  '[FAILED] Failed to start Financial Advice. (unit not found)',
  '[  OK  ] Connected to Trench Street.',
  `${WORLD.os} v${WORLD.version} (degen/stable) ready.`,
];

function fmtLine(l: string) {
  return l
    .replace('[  OK  ]', '[<span class="ok">  OK  </span>]')
    .replace('[FAILED]', '[<span style="color:var(--red)">FAILED</span>]');
}

export function Boot() {
  const setPhase = useOS((s) => s.setPhase);
  const [shown, setShown] = useState<string[]>([]);
  const [pct, setPct] = useState(0);
  const [hide, setHide] = useState(false);
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  useEffect(() => {
    let idx = 0;
    let timer: number;
    setShown([]); setPct(0);
    const step = () => {
      if (idx < LINES.length) {
        const line = fmtLine(LINES[idx]);
        const p = Math.round(((idx + 1) / LINES.length) * 100);
        setShown((s) => [...s, line]);
        setPct(p);
        idx++;
        timer = window.setTimeout(step, reduce ? 50 : 240);
      } else {
        timer = window.setTimeout(() => {
          setHide(true);
          // Resume a persisted session (survives refresh/close); otherwise log in.
          const { chosen, username } = useOS.getState();
          const target = chosen && username ? 'desktop' : 'login';
          setTimeout(() => setPhase(target), 480);
        }, 480);
      }
    };
    step();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="boot" className={hide ? 'hide' : ''}>
      <div className="logo">Bull of <span className="b">Trench Street</span></div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.28em', marginTop: -14 }}>$BOTS</div>
      <div className="bootlog">
        {shown.map((l, k) => <div key={k} dangerouslySetInnerHTML={{ __html: l }} />)}
      </div>
      <div className="bar"><i style={{ width: pct + '%' }} /></div>
    </div>
  );
}
