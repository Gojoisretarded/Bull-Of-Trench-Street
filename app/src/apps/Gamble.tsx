import { useState } from 'react';
import { useOS } from '../store/os';
import { fmtBal } from '../lib/format';
import { sfx } from '../lib/sound';

export function Gamble() {
  const balance = useOS((s) => s.balance);
  const toast = useOS((s) => s.toast);
  const [bet, setBet] = useState('1.00');
  const [pick, setPick] = useState<'heads' | 'tails'>('heads');
  const [result, setResult] = useState<{ side: 'heads' | 'tails'; won: boolean; delta: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestWin, setBestWin] = useState(0);
  const [worstLoss, setWorstLoss] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [totalWon, setTotalWon] = useState(0);

  const flip = () => {
    const amt = parseFloat(bet);
    if (!amt || amt <= 0) { sfx.err(); toast('Enter a valid bet amount.', 'bad'); return; }
    if (amt > balance) { sfx.err(); toast(`You only have ${fmtBal(balance)}. Down bad.`, 'bad'); return; }

    setFlipping(true);
    sfx.tap();

    setTimeout(() => {
      // 48% win rate (house edge)
      const won = Math.random() < 0.48;
      const side: 'heads' | 'tails' = won ? pick : (pick === 'heads' ? 'tails' : 'heads');
      const delta = won ? amt : -amt;

      const s = useOS.getState();
      const newBal = Math.max(0, s.balance + delta);
      useOS.setState({
        balance: newBal,
        txns: [{ id: Date.now(), label: `Coinflip ${won ? 'W' : 'L'}`, delta, kind: won ? 'in' as const : 'out' as const, t: Date.now() }, ...s.txns].slice(0, 40),
      });

      setResult({ side, won, delta });
      setTotalPlayed((n) => n + 1);
      if (won) {
        setTotalWon((n) => n + 1);
        setStreak((s) => s > 0 ? s + 1 : 1);
        setBestWin((b) => Math.max(b, amt));
        sfx.coin();
        toast(`${side.toUpperCase()}! You won ${fmtBal(amt)} 🎉`, 'good');
      } else {
        setStreak((s) => s < 0 ? s - 1 : -1);
        setWorstLoss((b) => Math.max(b, amt));
        sfx.err();
        toast(`${side.toUpperCase()}. Lost ${fmtBal(amt)}. Pain.`, 'bad');
      }
      setFlipping(false);
    }, 600);
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
