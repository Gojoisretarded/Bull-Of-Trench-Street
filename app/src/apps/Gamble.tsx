import { useState, useEffect, useRef } from 'react';
import { useOS } from '../store/os';
import { fmtBal } from '../lib/format';
import { sfx } from '../lib/sound';
import { onGambleResult, type GambleResult } from '../lib/netBus';

/**
 * Coinflip. The flip itself is resolved by the store (offline: locally with
 * a valid anti-cheat checksum; online: by the authoritative server) and the
 * outcome arrives via the gamble-result bus. This component never touches
 * the balance directly — doing so corrupts the integrity hash and triggers
 * the cheater screen.
 */
export function Gamble() {
  const balance = useOS((s) => s.balance);
  const toast = useOS((s) => s.toast);
  const gamble = useOS((s) => s.gamble);
  const [bet, setBet] = useState('1.00');
  const [pick, setPick] = useState<'heads' | 'tails'>('heads');
  const [result, setResult] = useState<GambleResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestWin, setBestWin] = useState(0);
  const [worstLoss, setWorstLoss] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const failsafe = useRef<number | null>(null);

  // Receive flip outcomes (from the store offline, or the server online).
  useEffect(() => {
    return onGambleResult((r) => {
      // small delay so the coin animation reads as a real flip
      window.setTimeout(() => {
        if (failsafe.current !== null) { clearTimeout(failsafe.current); failsafe.current = null; }
        setResult(r);
        setTotalPlayed((n) => n + 1);
        if (r.won) {
          setTotalWon((n) => n + 1);
          setStreak((s) => (s > 0 ? s + 1 : 1));
          setBestWin((b) => Math.max(b, Math.abs(r.delta)));
          sfx.coin();
          toast(`${r.side.toUpperCase()}! You won ${fmtBal(Math.abs(r.delta))} 🎉`, 'good');
        } else {
          setStreak((s) => (s < 0 ? s - 1 : -1));
          setWorstLoss((b) => Math.max(b, Math.abs(r.delta)));
          sfx.err();
          toast(`${r.side.toUpperCase()}. Lost ${fmtBal(Math.abs(r.delta))}. Pain.`, 'bad');
        }
        setFlipping(false);
      }, 550);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flip = () => {
    if (flipping) return;
    const amt = parseFloat(bet);
    if (!Number.isFinite(amt) || amt <= 0) { sfx.err(); toast('Enter a valid bet amount.', 'bad'); return; }
    if (!gamble(amt, pick)) return; // store validated & rejected (toast already shown)
    setFlipping(true);
    sfx.tap();
    // Failsafe: if the server never answers (connection drop mid-flip),
    // release the button instead of spinning forever.
    failsafe.current = window.setTimeout(() => {
      failsafe.current = null;
      setFlipping(false);
      toast('No result from server — bet may not have gone through.', 'info');
    }, 8000);
  };

  const streakText = streak > 0 ? `🔥 ${streak}W streak` : streak < 0 ? `💀 ${Math.abs(streak)}L streak` : '—';
  const winRate = totalPlayed > 0 ? ((totalWon / totalPlayed) * 100).toFixed(0) + '%' : '—';

  return (
    <div className="gmb">
      <div className="appbar">
        <strong style={{ color: 'var(--ink)' }}>Gamble</strong>
        <span className="sub">// double or nothing</span>
        <span className="live" style={{ color: 'var(--red)' }}><span className="d" style={{ background: 'var(--red)', boxShadow: '0 0 8px 1px rgba(245,86,110,.6)' }} />LIVE</span>
      </div>

      <div className="gmb-body">
        {/* Coin display */}
        <div className={'gmb-coin' + (flipping ? ' flip' : '')}>
          <div className="gmb-coin-face">{result ? (result.side === 'heads' ? '👑' : '💀') : '🪙'}</div>
        </div>
        {result && !flipping && (
          <div className={'gmb-result ' + (result.won ? 'won' : 'lost')}>
            {result.won ? `+${fmtBal(Math.abs(result.delta))}` : `-${fmtBal(Math.abs(result.delta))}`}
          </div>
        )}

        {/* Pick side */}
        <div className="gmb-pick">
          <button className={'gmb-side' + (pick === 'heads' ? ' on' : '')} onClick={() => { setPick('heads'); sfx.click(); }}>
            👑 Heads
          </button>
          <button className={'gmb-side' + (pick === 'tails' ? ' on' : '')} onClick={() => { setPick('tails'); sfx.click(); }}>
            💀 Tails
          </button>
        </div>

        {/* Bet amount */}
        <div className="gmb-bet">
          <label className="gmb-lbl">BET AMOUNT</label>
          <div className="gmb-input">
            <input value={bet} inputMode="decimal" onChange={(e) => setBet(e.target.value)} />
            <button className="btn ghost" onClick={() => { setBet((balance / 2).toFixed(2)); sfx.click(); }}>HALF</button>
            <button className="btn ghost" onClick={() => { setBet(balance.toFixed(2)); sfx.click(); }}>ALL IN</button>
          </div>
        </div>

        <button className="btn gold gmb-flip" disabled={flipping} onClick={flip}>
          {flipping ? 'FLIPPING...' : 'FLIP THE COIN'}
        </button>

        {/* Stats */}
        <div className="gmb-stats">
          <div className="gmb-stat"><span className="k">BALANCE</span><span className="v">{fmtBal(balance)}</span></div>
          <div className="gmb-stat"><span className="k">STREAK</span><span className="v">{streakText}</span></div>
          <div className="gmb-stat"><span className="k">WIN RATE</span><span className="v">{winRate}</span></div>
          <div className="gmb-stat"><span className="k">BEST WIN</span><span className="v up">{bestWin > 0 ? fmtBal(bestWin) : '—'}</span></div>
          <div className="gmb-stat"><span className="k">WORST LOSS</span><span className="v down">{worstLoss > 0 ? fmtBal(worstLoss) : '—'}</span></div>
          <div className="gmb-stat"><span className="k">PLAYED</span><span className="v">{totalPlayed}</span></div>
        </div>
      </div>
    </div>
  );
}
