import { useEffect, useRef, useState, useMemo } from 'react';
import { useOS } from '../store/os';
import { fmtPrice, fmtMcap } from '../lib/market';
import { Sparkline } from '../os/Sparkline';
import { sfx } from '../lib/sound';
import type { Coin } from '../os/types';

// Predefined list of mock addresses for bots
const ADDRS = [
  '7x2b…a91e', '9oWq…3uFc', '2aM5…d49b', 'H9zX…2aB1',
  '4f8R…1c8D', '8uYs…9pE2', 'D2pL…7f9A', '3k9P…e5aB',
  '5vNs…1b9C', '6xMr…0pQ2', 'Fb9Y…z3A9'
];

interface DegenTx {
  id: number;
  type: 'BUY' | 'SELL';
  maker: string;
  usd: number;
  tokens: number;
  time: string;
}

// Price cell that flashes green/red each time the value ticks.
function PriceCell({ price }: { price: number }) {
  const prev = useRef(price);
  const [dir, setDir] = useState('');
  const [k, setK] = useState(0);

  useEffect(() => {
    if (price > prev.current) setDir('up');
    else if (price < prev.current) setDir('down');
    else return;
    prev.current = price;
    setK((x) => x + 1);
  }, [price]);

  return <span key={k} className={'prval ' + dir}>${fmtPrice(price)}</span>;
}

function Row({ c, sel, onSelect }: { c: Coin; sel: boolean; onSelect: () => void }) {
  const up = c.change >= 0;
  return (
    <div
      className={'df-row' + (sel ? ' sel' : '')}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid var(--line-soft)',
        cursor: 'pointer',
        gap: '8px',
        background: sel ? 'var(--surface-2)' : 'transparent',
        borderLeft: sel ? '3px solid var(--gold)' : 'none',
        boxSizing: 'border-box'
      }}
    >
      <div className="cn" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <div
          className="av"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: up ? 'rgba(52,211,153,0.1)' : 'rgba(245,86,110,0.1)',
            color: up ? 'var(--green)' : 'var(--red)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 'bold',
            fontSize: '13px',
            flexShrink: 0
          }}
        >
          {c.ticker[0]}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            className="nm"
            style={{
              fontWeight: 700,
              fontSize: '13px',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {c.name}
            {c.badge && <span className={'badge ' + c.badge.toLowerCase()} style={{ padding: '1px 4px', fontSize: '8px' }}>{c.badge}</span>}
          </div>
          <div className="tk" style={{ fontSize: '10.5px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>${c.ticker}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="pr" style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600 }}>
          <PriceCell price={c.price} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
          <span style={{ fontSize: '10.5px', color: up ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
            {up ? '+' : ''}{c.change.toFixed(1)}%
          </span>
          <span style={{ fontSize: '10px', color: 'var(--faint)' }}>{fmtMcap(c.price)}</span>
        </div>
      </div>
    </div>
  );
}

// High-fidelity candlestick-like line chart with volume bars at the bottom
function DetailedChart({ hist, up }: { hist: number[]; up: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(136, 150, 168, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const gy = (h / 6) * i;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();

      const gx = (w / 6) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    if (hist.length < 2) return;

    const min = Math.min(...hist);
    const max = Math.max(...hist);
    const range = max - min || 1;

    const points = hist.map((val, idx) => {
      const x = (w / (hist.length - 1)) * idx;
      const y = h - 25 - ((val - min) / range) * (h - 55);
      return { x, y };
    });

    const clr = up ? '#34D399' : '#F5566E';

    // Draw Area Gradient Fill
    const grad = ctx.createLinearGradient(0, 0, 0, h - 20);
    grad.addColorStop(0, up ? 'rgba(52, 211, 153, 0.12)' : 'rgba(245, 86, 110, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(points[0].x, h - 20);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - 20);
    ctx.closePath();
    ctx.fill();

    // Draw Price Line
    ctx.strokeStyle = clr;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Draw Volume Bars at the bottom
    hist.forEach((val, idx) => {
      const x = (w / (hist.length - 1)) * idx - 3;
      const barH = 5 + (Math.abs(val - (hist[idx - 1] || val)) / range) * 35;
      const isGreen = val >= (hist[idx - 1] || val);
      ctx.fillStyle = isGreen ? 'rgba(52, 211, 153, 0.35)' : 'rgba(245, 86, 110, 0.35)';
      ctx.fillRect(Math.max(0, x), h - Math.min(barH, 35), 6, Math.min(barH, 35));
    });

    // Draw Current Price Dot
    const lastP = points[points.length - 1];
    ctx.fillStyle = clr;
    ctx.beginPath();
    ctx.arc(lastP.x, lastP.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw current price line across chart
    ctx.strokeStyle = up ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 86, 110, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, lastP.y);
    ctx.lineTo(w, lastP.y);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [hist, up]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '180px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line-soft)', marginTop: '8px', marginBottom: '8px', display: 'block' }} />;
}

export function DegenFun() {
  const coins = useOS((s) => s.coins);
  const balance = useOS((s) => s.balance);
  const holdings = useOS((s) => s.holdings);
  const trade = useOS((s) => s.trade);
  const openApp = useOS((s) => s.openApp);
  const toast = useOS((s) => s.toast);

  const [selId, setSelId] = useState('cmr');
  const [amt, setAmt] = useState('1.00');
  const [search, setSearch] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [localTrades, setLocalTrades] = useState<Record<string, DegenTx[]>>({});

  const sel = coins.find((c) => c.id === selId) ?? coins[0];
  const up = sel.change >= 0;
  const quantityOwned = holdings[sel.id] || 0;
  const holdingValue = quantityOwned * sel.price;

  // Filtered coins list (DexScreener style search)
  const filteredCoins = useMemo(() => {
    return coins.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ticker.toLowerCase().includes(search.toLowerCase())
    );
  }, [coins, search]);

  // Bonding curve calculation (base 80% to 100%)
  const bondingCurveProgress = useMemo(() => {
    const startVal = 20;
    const growth = Math.min(80, (sel.price * 1000) * 1.5);
    return Math.min(99.9, startVal + growth);
  }, [sel.price]);

  // Initialize and tick transaction feed for coins
  useEffect(() => {
    // Generate initial trades if missing
    setLocalTrades((prev) => {
      const next = { ...prev };
      coins.forEach((c) => {
        if (!next[c.id]) {
          const list: DegenTx[] = [];
          for (let i = 0; i < 6; i++) {
            const isBuy = Math.random() > 0.45;
            const usd = parseFloat((5 + Math.random() * 95).toFixed(2));
            list.push({
              id: Date.now() - i * 5000,
              type: isBuy ? 'BUY' : 'SELL',
              maker: ADDRS[Math.floor(Math.random() * ADDRS.length)],
              usd,
              tokens: Math.round(usd / c.price),
              time: `${i * 4 + 2}s ago`
            });
          }
          next[c.id] = list;
        }
      });
      return next;
    });
  }, [coins]);

  // Periodic bot transaction simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTrades((prev) => {
        const next = { ...prev };
        const randomCoin = coins[Math.floor(Math.random() * coins.length)];
        const list = next[randomCoin.id] || [];
        
        const isBuy = Math.random() > 0.45;
        const usd = parseFloat((3 + Math.random() * 120).toFixed(2));
        const newTx: DegenTx = {
          id: Date.now(),
          type: isBuy ? 'BUY' : 'SELL',
          maker: ADDRS[Math.floor(Math.random() * ADDRS.length)],
          usd,
          tokens: Math.round(usd / randomCoin.price),
          time: 'now'
        };

        // Age existing trade times
        const agedList = list.map((tx, idx) => ({
          ...tx,
          time: tx.time === 'now' ? '3s ago' : `${parseInt(tx.time, 10) + 3}s ago`
        }));

        next[randomCoin.id] = [newTx, ...agedList].slice(0, 15);
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [coins]);

  // Local handler for player trades so we insert them in the stream instantly
  const handleTrade = () => {
    const numericAmt = parseFloat(amt);
    if (isNaN(numericAmt) || numericAmt <= 0) {
      sfx.err();
      toast('Enter a valid amount.', 'bad');
      return;
    }
    if (tradeType === 'BUY' && numericAmt > balance) {
      sfx.err();
      toast('Insufficient funds.', 'bad');
      return;
    }
    if (tradeType === 'SELL' && quantityOwned <= 0) {
      sfx.err();
      toast(`No $${sel.ticker} to sell.`, 'bad');
      return;
    }

    // Call store trade logic
    trade(tradeType === 'BUY' ? 'buy' : 'sell', numericAmt, sel.id);

    // Append to trade list
    setLocalTrades((prev) => {
      const next = { ...prev };
      const list = next[sel.id] || [];
      const newTx: DegenTx = {
        id: Date.now(),
        type: tradeType,
        maker: '0xYOU',
        usd: numericAmt,
        tokens: Math.round(numericAmt / sel.price),
        time: 'now'
      };
      next[sel.id] = [newTx, ...list].slice(0, 15);
      return next;
    });
  };

  const activeTrades = localTrades[sel.id] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        @keyframes dfMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .df-marquee-container {
          display: flex;
          overflow: hidden;
          user-select: none;
          background: var(--surface-2);
          border-bottom: 1px solid var(--line-soft);
          font-family: var(--mono);
          font-size: 10px;
          height: 25px;
          align-items: center;
          position: relative;
          white-space: nowrap;
        }
        .df-marquee-content {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-around;
          min-width: 100%;
          animation: dfMarquee 25s linear infinite;
        }
        .df-marquee-item {
          display: inline-flex;
          align-items: center;
          margin: 0 12px;
          gap: 4px;
        }
      `}</style>
      <div className="appbar">
        <strong style={{ color: 'var(--ink)' }}>Degen.Fun</strong>
        <span className="live"><span className="d" />LIVE MARKET</span>
      </div>

      {/* Live Market Marquee */}
      {coins.length > 0 && (
        <div className="df-marquee-container">
          <div className="df-marquee-content">
            {coins.map((c) => {
              const up = c.change >= 0;
              return (
                <span key={c.id} className="df-marquee-item">
                  <span style={{ fontWeight: 'bold', color: 'var(--ink)' }}>${c.ticker}</span>
                  <span style={{ color: 'var(--muted)' }}>${fmtPrice(c.price)}</span>
                  <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                    {up ? '▲' : '▼'}{c.change.toFixed(1)}%
                  </span>
                </span>
              );
            })}
          </div>
          <div className="df-marquee-content" aria-hidden="true">
            {coins.map((c) => {
              const up = c.change >= 0;
              return (
                <span key={c.id + '_dup'} className="df-marquee-item">
                  <span style={{ fontWeight: 'bold', color: 'var(--ink)' }}>${c.ticker}</span>
                  <span style={{ color: 'var(--muted)' }}>${fmtPrice(c.price)}</span>
                  <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                    {up ? '▲' : '▼'}{c.change.toFixed(1)}%
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="dfx" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: DexScreener List */}
        <div className="left" style={{ width: '310px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--line)', background: 'var(--surface)' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: '8px' }}>
            <input
              style={{
                flex: 1,
                background: 'var(--surface-2)',
                border: '1px solid var(--line-soft)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--ink)',
                fontSize: '12px',
                fontFamily: 'var(--sans)'
              }}
              placeholder="Search pairs / tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => { sfx.click(); openApp('launchpad'); }}
              style={{
                background: 'var(--gold)',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '16px',
                padding: '0 10px',
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center'
              }}
              title="Launch Memecoin"
            >
              🚀
            </button>
          </div>
          <div className="mkt" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredCoins.map((c) => (
              <Row key={c.id} c={c} sel={c.id === selId} onSelect={() => { sfx.click(); setSelId(c.id); }} />
            ))}
          </div>
        </div>

        {/* Center Panel: Chart & Trades Stream */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--ground)', overflow: 'hidden', minWidth: 0 }}>
          
          {/* Header Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--line-soft)', background: 'var(--surface)', gap: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: up ? 'var(--green)' : 'var(--red)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                {sel.ticker[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sel.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>${sel.ticker} / SOL</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexShrink: 1, minWidth: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '9px', color: 'var(--faint)', fontFamily: 'var(--mono)' }}>PRICE</div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: up ? 'var(--green)' : 'var(--red)' }}>${fmtPrice(sel.price)}</div>
              </div>
              <div style={{ whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '9px', color: 'var(--faint)', fontFamily: 'var(--mono)' }}>24H CHANGE</div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '▲' : '▼'} {up ? '+' : ''}{sel.change.toFixed(1)}%</div>
              </div>
              <div style={{ whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '9px', color: 'var(--faint)', fontFamily: 'var(--mono)' }}>MARKET CAP</div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ink)' }}>{fmtMcap(sel.price)}</div>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div style={{ padding: '12px 16px', flexShrink: 0 }}>
            <DetailedChart hist={sel.hist} up={up} />
          </div>

          {/* Live Trades Stream Table */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 20px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', fontFamily: 'var(--mono)', padding: '6px 0', borderBottom: '1px solid var(--line-soft)', letterSpacing: '0.05em' }}>
              LIVE TRADES STREAM
            </div>
            <div style={{ flex: 1, overflowY: 'auto', marginTop: '6px', paddingRight: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', fontFamily: 'var(--mono)', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ color: 'var(--faint)' }}>
                    <th style={{ padding: '6px 0', textAlign: 'left', width: '15%' }}>TYPE</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '30%' }}>MAKER</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '23%' }}>USD</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '20%' }}>TOKENS</th>
                    <th style={{ padding: '6px 0', textAlign: 'right', width: '12%' }}>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrades.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'left', color: tx.type === 'BUY' ? 'var(--green)' : 'var(--red)' }}>
                        {tx.type}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'left', color: tx.maker === '0xYOU' ? 'var(--gold)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.maker}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--ink)' }}>
                        ${tx.usd.toFixed(2)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--muted)' }}>
                        {tx.tokens.toLocaleString()}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--faint)' }}>
                        {tx.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Buy/Sell Trade Panel */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--surface)', borderLeft: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: '8px', padding: '3px', border: '1px solid var(--line-soft)' }}>
            <button
              onClick={() => { sfx.click(); setTradeType('BUY'); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                background: tradeType === 'BUY' ? 'var(--green)' : 'transparent',
                color: tradeType === 'BUY' ? '#000' : 'var(--muted)'
              }}
            >
              BUY
            </button>
            <button
              onClick={() => { sfx.click(); setTradeType('SELL'); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                background: tradeType === 'SELL' ? 'var(--red)' : 'transparent',
                color: tradeType === 'SELL' ? '#fff' : 'var(--muted)'
              }}
            >
              SELL
            </button>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--faint)', marginBottom: '4px', fontFamily: 'var(--mono)' }}>AMOUNT (USD)</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                style={{
                  flex: 1,
                  background: 'var(--ground)',
                  border: '1px solid var(--line-soft)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--ink)',
                  fontSize: '15px',
                  fontFamily: 'var(--mono)',
                  userSelect: 'text'
                }}
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
              />
              <button
                onClick={() => { sfx.click(); setAmt(tradeType === 'BUY' ? balance.toFixed(2) : (quantityOwned * sel.price).toFixed(2)); }}
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line-soft)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '0 12px'
                }}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {['1', '5', '10', '50'].map((val) => (
              <button
                key={val}
                onClick={() => { sfx.click(); setAmt(val + '.00'); }}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line-soft)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  padding: '6px 0',
                  fontFamily: 'var(--mono)'
                }}
              >
                ${val}
              </button>
            ))}
          </div>

          <button
            onClick={handleTrade}
            style={{
              background: tradeType === 'BUY' ? 'var(--green)' : 'var(--red)',
              color: tradeType === 'BUY' ? '#000' : '#fff',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              boxShadow: `0 4px 12px ${tradeType === 'BUY' ? 'rgba(52,211,153,0.2)' : 'rgba(245,86,110,0.2)'}`
            }}
          >
            QUICK {tradeType}
          </button>

          {/* Position Info display */}
          <div style={{ border: '1px solid var(--line-soft)', borderRadius: '8px', padding: '10px 12px', background: 'var(--surface)' }}>
            <div style={{ fontSize: '10px', color: 'var(--faint)', fontFamily: 'var(--mono)', marginBottom: '6px' }}>YOUR POSITION</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--muted)' }}>Holdings:</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{quantityOwned.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${sel.ticker}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
              <span style={{ color: 'var(--muted)' }}>Value:</span>
              <span style={{ fontWeight: 700, color: 'var(--gold)' }}>${holdingValue.toFixed(2)}</span>
            </div>
          </div>

          {/* Bonding curve status (pump.fun style) */}
          <div style={{ marginTop: 'auto', border: '1px solid var(--line-soft)', borderRadius: '8px', padding: '12px', background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 'bold', fontFamily: 'var(--mono)', marginBottom: '6px' }}>
              <span>BONDING CURVE</span>
              <span style={{ color: 'var(--gold)' }}>{bondingCurveProgress.toFixed(1)}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${bondingCurveProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--green))', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: '9px', color: 'var(--faint)', marginTop: '6px', lineHeight: 1.4 }}>
              When bonding curve reaches 100%, the token graduates to Binance. Escrow active.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
