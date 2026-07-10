import { useState, useEffect, useRef } from 'react';
import { useOS } from '../store/os';
import { useClock } from '../hooks/useClock';
import { CHARACTERS } from '../apps/registry';
import { USERNAME_RE } from '../lib/validate';
import { onAuthError } from '../lib/netBus';
import { netRegister } from '../lib/net';
import type { Character } from './types';
import { sfx } from '../lib/sound';

// Suggested handle per character — pre-filled when a card is picked.
const DEFAULT_HANDLES: Record<string, string> = {
  orphan: 'orphan_degen',
  fumbler: 'fumbler_99',
  nepo: 'nepo_prince',
  addict: 'one_last_win',
};

export function Login() {
  const { time, longDate } = useClock();
  const { choose, setPhase } = useOS.getState();
  const [sel, setSel] = useState<Character | null>(null);
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const netReady = useOS((s) => s.netReady);

  const valid = USERNAME_RE.test(username);
  const ready = !!sel && valid;

  // True while we're waiting for the server to answer a register request.
  const awaitingServer = useRef(false);

  // If the server rejects the handle (e.g. taken), un-stick the exit animation.
  useEffect(() => onAuthError(() => { awaitingServer.current = false; setLeaving(false); }), []);

  const pick = (c: Character) => {
    sfx.click();
    setSel(c);
    // Pre-populate with a UNIQUE suggested handle. The suffix matters: these
    // are real multiplayer accounts, so a static default would be claimed by
    // the first player ever and rejected as "taken" for everyone after.
    if (!touched || !username) {
      const base = DEFAULT_HANDLES[c.id] ?? 'trench_degen';
      const suffix = '_' + String(Math.floor(100 + Math.random() * 900));
      setUsername((base + suffix).slice(0, 16));
    }
  };

  const onType = (v: string) => {
    setTouched(true);
    // Input allowlist: letters, digits, underscore, max 16. Everything else
    // is dropped as it's typed (defense in depth — the store re-validates).
    setUsername(v.replace(/[^A-Za-z0-9_]/g, '').slice(0, 16));
  };

  const enter = () => {
    if (!ready || !sel) return;
    sfx.open(); setLeaving(true);
    if (netReady) {
      // Multiplayer: the server creates the account; it flips us to the
      // desktop on auth_ok (or onAuthError resets this screen).
      awaitingServer.current = true;
      netRegister(username, sel.id);
      // Failsafe: never leave the player staring at a blank screen. If the
      // server hasn't confirmed within 6s, enter solo mode instead.
      const chosen = sel;
      const chosenName = username;
      window.setTimeout(() => {
        if (!awaitingServer.current) return; // server answered (ok or error)
        const s = useOS.getState();
        if (s.online || s.phase === 'desktop') return;
        awaitingServer.current = false;
        s.toast('Server not responding — entering solo trenches.', 'info');
        s.choose(chosen, chosenName);
        s.setPhase('desktop');
      }, 6000);
      return;
    }
    // Offline: original local single-player flow.
    choose(sel, username);
    setTimeout(() => setPhase('desktop'), 300);
  };

  return (
    <div id="login" className={leaving ? 'hide' : ''}>
      <div id="lclock">{time}</div>
      <div id="ldate">{longDate}</div>
      <h2>Choose your degen</h2>
      <div className="sub">// same trenches — different come-up</div>
      <div className="roster">
        {CHARACTERS.map((c) => (
          <div key={c.id} className={'pick' + (sel?.id === c.id ? ' sel' : '')}
            onClick={() => pick(c)}>
            <div className="em">{c.emoji}</div>
            <div className="tag">{c.tag}</div>
            <h3>{c.name}</h3>
            <p>{c.desc}</p>
            <div className="bag">{c.bag.toFixed(2)} SOL</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 14 }}>
        <label style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', color: 'var(--muted)' }}>
          PICK YOUR HANDLE
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700 }}>@</span>
          <input
            value={username}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') enter(); }}
            placeholder={sel ? DEFAULT_HANDLES[sel.id] : 'pick a card first'}
            maxLength={16}
            autoComplete="off"
            spellCheck={false}
            aria-label="Username"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: `1px solid ${username && !valid ? 'var(--red)' : 'var(--line)'}`,
              borderRadius: 10,
              padding: '10px 14px',
              color: 'var(--ink)',
              fontSize: 14,
              fontFamily: 'var(--mono)',
              width: 220,
              textAlign: 'center',
            }}
          />
        </div>
        <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: username && !valid ? 'var(--red)' : 'var(--faint)', minHeight: 14 }}>
          {username && !valid ? '3-16 chars — letters, numbers, underscores' : 'a-z · 0-9 · _ · 3-16 chars'}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: netReady ? 'var(--green)' : 'var(--muted)', marginTop: 8 }}>
        {netReady ? '● multiplayer server online' : '○ offline — solo trenches'}
      </div>
      <button id="enter" className={ready ? 'ready' : ''} disabled={!ready} onClick={enter}>ENTER THE TRENCHES →</button>
    </div>
  );
}
