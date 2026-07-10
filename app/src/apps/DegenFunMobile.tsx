import { useEffect, useRef, useState, useMemo } from 'react';
import { useOS } from '../store/os';
import { fmtPrice, fmtMcap } from '../lib/market';
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
      const y = h - 20 - ((val - min) / range) * (h - 45);
      return { x, y };
    });

    const clr = up ? '#34D399' : '#F5566E';

    // Draw Area Gradient Fill
    const grad = ctx.createLinearGradient(0, 0, 0, h - 15);
    grad.addColorStop(0, up ? 'rgba(52, 211, 153, 0.12)' : 'rgba(245, 86, 110, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(points[0].x, h - 15);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - 15);
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
      const x = (w / (hist.length - 1)) * idx - 2;
      const barH = 4 + (Math.abs(val - (hist[idx - 1] || val)) / range) * 20;
      const isGreen = val >= (hist[idx - 1] || val);
      ctx.fillStyle = isGreen ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 86, 110, 0.3)';
      ctx.fillRect(Math.max(0, x), h - Math.min(barH, 20), 4, Math.min(barH, 20));
    });

    // Draw Current Price Dot
    const lastP = points[points.length - 1];
    ctx.fillStyle = clr;
    ctx.beginPath();
    ctx.arc(lastP.x, lastP.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw current price line
    ctx.strokeStyle = up ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 86, 110, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, lastP.y);
    ctx.lineTo(w, lastP.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [hist, up]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '130px', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--line-soft)', marginTop: '4px', marginBottom: '4px', display: 'block' }} />;
}

export function DegenFunMobile() {
  const coins = useOS((s) => s.coins);
  const balance = useOS((s) => s.balance);
  const holdings = useOS((s) => s.holdings);
  const trade = useOS((s) => s.trade);
  const toast = useOS((s) => s.toast);
  const openApp = useOS((s) => s.openApp);
  const mobileBack = useOS((s) => s.mobileBack);

  const [activeCoinId, setActiveCoinId] = useState<string | null>(null);
  const [amt, setAmt] = useState('5.00');
  const [search, setSearch] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [localTrades, setLocalTrades] = useState<Record<string, DegenTx[]>>({});
  const [activeTab, setActiveTab] = useState<'chart' | 'trades' | 'position'>('chart');

  const sel = coins.find((c) => c.id === activeCoinId) ?? null;
  const up = sel ? sel.change >= 0 : false;
  const quantityOwned = sel ? (holdings[sel.id] || 0) : 0;
  const holdingValue = sel ? (quantityOwned * sel.price) : 0;

  // Filtered coins list
  const filteredCoins = useMemo(() => {
    return coins.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ticker.toLowerCase().includes(search.toLowerCase())
    );
  }, [coins, search]);

  // Bonding curve progress
  const bondingCurveProgress = useMemo(() => {
    if (!sel) return 20;
    const startVal = 20;
    const growth = Math.min(80, (sel.price * 1000) * 1.5);
    return Math.min(99.9, startVal + growth);
  }, [sel]);

  // Simulated Trades feed initialization
  useEffect(() => {
    setLocalTrades((prev) => {
      const next = { ...prev };
      coins.forEach((c) => {
        if (!next[c.id]) {
          const list: DegenTx[] = [];
          for (let i = 0; i < 6; i++) {
            const isBuy = Math.random() > 0.45;
            const usd = parseFloat((3 + Math.random() * 47).toFixed(2));
            list.push({
              id: Date.now() - i * 5000,
              type: isBuy ? 'BUY' : 'SELL',
              maker: ADDRS[Math.floor(Math.random() * ADDRS.length)],
              usd,
              tokens: Math.round(usd / c.price),
              time: `${i * 5 + 3}s ago`
            });
          }
          next[c.id] = list;
        }
      });
      return next;
    });
  }, [coins]);

  // Simulated bot trades ticker loop
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTrades((prev) => {
        const next = { ...prev };
        const randomCoin = coins[Math.floor(Math.random() * coins.length)];
        const list = next[randomCoin.id] || [];
        
        const isBuy = Math.random() > 0.45;
        const usd = parseFloat((2 + Math.random() * 58).toFixed(2));
        const newTx: DegenTx = {
          id: Date.now(),
          type: isBuy ? 'BUY' : 'SELL',
          maker: ADDRS[Math.floor(Math.random() * ADDRS.length)],
          usd,
          tokens: Math.round(usd / randomCoin.price),
          time: 'now'
        };

        const agedList = list.map((tx) => ({
          ...tx,
          time: tx.time === 'now' ? '4s ago' : `${parseInt(tx.time, 10) + 4}s ago`
        }));

        next[randomCoin.id] = [newTx, ...agedList].slice(0, 10);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [coins]);

  const handleTrade = () => {
    if (!sel) return;
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

    trade(tradeType === 'BUY' ? 'buy' : 'sell', numericAmt, sel.id);

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
      next[sel.id] = [newTx, ...list].slice(0, 10);
      return next;
    });
  };

  const activeTrades = sel ? (localTrades[sel.id] || []) : [];

  return (
    <div className={`df-mobile-container ${sel ? 'df-detail-view' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          flex-shrink: 0;
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

        /* Coins List view specific spacing */
        .df-mobile-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .df-mobile-row {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--line-soft);
          gap: 10px;
          background: transparent;
          border-left: 0;
          width: 100%;
          text-align: left;
        }

        .df-mobile-row:active {
          background: var(--surface-2);
        }

        /* Detail View structure */
        .df-mobile-detail {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .df-detail-body {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 210px; /* Safe space for taller vertical sticky bottom sheet */
          -webkit-overflow-scrolling: touch;
        }

        /* Sticky bottom buy bar styling */
        .df-sticky-buy {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--surface);
          border-top: 1px solid var(--line-soft);
          border-radius: 20px 20px 0 0;
          padding: 12px 16px calc(12px + var(--safe-b));
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 10;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
        }

        .df-sticky-buy .grab {
          width: 36px;
          height: 4px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 99px;
          margin: 0 auto 4px;
        }

        .df-sticky-buy .seg-btn {
          display: flex;
          background: var(--surface-2);
          border-radius: 8px;
          padding: 3px;
          border: 1px solid var(--line-soft);
        }

        .df-sticky-buy .seg-btn button {
          flex: 1;
          padding: 8px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--muted);
          transition: background 0.15s, color 0.15s;
        }

        .df-sticky-buy .seg-btn button.active-buy {
          background: var(--green);
          color: #05130d;
        }

        .df-sticky-buy .seg-btn button.active-sell {
          background: var(--red);
          color: #fff;
        }

        .df-sticky-buy .amt-input {
          display: flex;
          gap: 6px;
          position: relative;
        }

        .df-sticky-buy .amt-input input {
          flex: 1;
          background: var(--ground);
          border: 1px solid var(--line-soft);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--ink);
          font-family: var(--mono);
          font-size: 15px;
        }

        .df-sticky-buy .amt-input .max-btn {
          background: var(--surface-3);
          border: 1px solid var(--line-soft);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          padding: 0 13px;
          color: var(--muted);
        }

        .df-sticky-buy .presets-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .df-sticky-buy .presets-strip button {
          background: var(--surface-2);
          border: 1px solid var(--line-soft);
          border-radius: 6px;
          font-size: 11px;
          font-family: var(--mono);
          padding: 6px 0;
          color: var(--muted);
          text-align: center;
        }

        .df-sticky-buy .execute-btn {
          background: var(--green);
          color: #05130d;
          font-weight: 800;
          font-size: 14px;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
          width: 100%;
          border: none;
          box-shadow: 0 4px 12px rgba(52, 211, 153, 0.2);
          cursor: pointer;
        }

        .df-sticky-buy .execute-btn.sell-mode {
          background: var(--red);
          color: #fff;
          box-shadow: 0 4px 12px rgba(245, 86, 110, 0.2);
        }

        /* Segmented Tabs */
        .df-seg-tabs {
          display: flex;
          border-bottom: 1px solid var(--line-soft);
          flex-shrink: 0;
          background: var(--surface-2);
        }

        .df-seg-tabs button {
          flex: 1;
          text-align: center;
          padding: 10px 0;
          font-size: 12px;
          color: var(--muted);
          font-weight: 600;
          position: relative;
          border: none;
          background: none;
        }

        .df-seg-tabs button.active {
          color: var(--gold);
        }

        .df-seg-tabs button.active::after {
          content: "";
          position: absolute;
          left: 20%;
          right: 20%;
          bottom: 0;
          height: 2px;
          background: var(--gold);
          border-radius: 2px;
        }
      `}</style>

      {!sel ? (
        /* Coin list view */
        <div className="df-mobile-list">
          <div className="apphead">
            <button className="bk" onClick={mobileBack}>‹</button>
            <b>Degen.Fun</b>
            <button
              onClick={() => { sfx.click(); openApp('launchpad'); }}
              style={{
                marginLeft: 'auto',
                background: 'var(--gold)',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 10px'
              }}
            >
              🚀 LAUNCH
            </button>
          </div>

          {/* Marquee ticker */}
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
                        {up ? '▲' : '▼'}{c.change.toFixed(0)}%
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
                        {up ? '▲' : '▼'}{c.change.toFixed(0)}%
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: '8px' }}>
            <input
              style={{
                flex: 1,
                background: 'var(--surface-2)',
                border: '1px solid var(--line-soft)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--ink)',
                fontSize: '13px'
              }}
              placeholder="Search pairs / tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(var(--safe-b) + 10px)' }}>
            {filteredCoins.map((c) => {
              const rowUp = c.change >= 0;
              return (
                <button key={c.id} className="df-mobile-row" onClick={() => { sfx.click(); setActiveCoinId(c.id); }}>
                  <div className="av" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: rowUp ? 'rgba(52,211,153,0.1)' : 'rgba(245,86,110,0.1)',
                    color: rowUp ? 'var(--green)' : 'var(--red)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    flexShrink: 0
                  }}>
                    {c.ticker[0]}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {c.name}
                      {c.badge && <span className={'badge ' + c.badge.toLowerCase()} style={{ padding: '1px 4px', fontSize: '8px' }}>{c.badge}</span>}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>${c.ticker}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600 }}>
                      <PriceCell price={c.price} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <span style={{ fontSize: '10.5px', color: rowUp ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                        {rowUp ? '+' : ''}{c.change.toFixed(0)}%
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--faint)' }}>{fmtMcap(c.price)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Coin Detail view */
        <div className="df-mobile-detail">
          <div className="apphead">
            <button className="bk" onClick={() => setActiveCoinId(null)}>‹</button>
            <b>${sel.ticker}</b>
            <span className="live" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--green)', fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--mono)' }}>
              <span className="d animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
              LIVE
            </span>
          </div>

          <div className="df-seg-tabs">
            <button className={activeTab === 'chart' ? 'active' : ''} onClick={() => { sfx.tap(); setActiveTab('chart'); }}>Chart</button>
            <button className={activeTab === 'trades' ? 'active' : ''} onClick={() => { sfx.tap(); setActiveTab('trades'); }}>Trades</button>
            <button className={activeTab === 'position' ? 'active' : ''} onClick={() => { sfx.tap(); setActiveTab('position'); }}>Position</button>
          </div>

          <div className="df-detail-body">
            {activeTab === 'chart' && (
              <div style={{ padding: '12px 14px' }}>
                <DetailedChart hist={sel.hist} up={up} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '0 4px' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--faint)', fontFamily: 'var(--mono)' }}>PRICE</div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: up ? 'var(--green)' : 'var(--red)' }}>${fmtPrice(sel.price)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--faint)', fontFamily: 'var(--mono)' }}>24H CHANGE</div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '▲' : '▼'} {up ? '+' : ''}{sel.change.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--faint)', fontFamily: 'var(--mono)' }}>MARKET CAP</div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>{fmtMcap(sel.price)}</div>
                  </div>
                </div>

                {/* Bonding curve status */}
                <div style={{ marginTop: '16px', border: '1px solid var(--line-soft)', borderRadius: '10px', padding: '12px', background: 'var(--surface-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 'bold', fontFamily: 'var(--mono)', marginBottom: '6px' }}>
                    <span>BONDING CURVE</span>
                    <span style={{ color: 'var(--gold)' }}>{bondingCurveProgress.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--ground)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${bondingCurveProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--green))' }} />
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--faint)', marginTop: '6px', lineHeight: 1.4 }}>
                    When bonding curve reaches 100%, the token graduates to Binance. Escrow active.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trades' && (
              <div style={{ padding: '8px 14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', fontFamily: 'var(--mono)' }}>
                  <thead>
                    <tr style={{ color: 'var(--faint)', borderBottom: '1px solid var(--line-soft)' }}>
                      <th style={{ padding: '6px 0', textAlign: 'left' }}>TYPE</th>
                      <th style={{ padding: '6px 4px', textAlign: 'left' }}>MAKER</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right' }}>USD</th>
                      <th style={{ padding: '6px 0', textAlign: 'right' }}>TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTrades.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '6px 0', fontWeight: 'bold', color: tx.type === 'BUY' ? 'var(--green)' : 'var(--red)' }}>
                          {tx.type}
                        </td>
                        <td style={{ padding: '6px 4px', color: tx.maker === '0xYOU' ? 'var(--gold)' : 'var(--muted)' }}>
                          {tx.maker}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--ink)' }}>
                          ${tx.usd.toFixed(2)}
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--faint)' }}>
                          {tx.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'position' && (
              <div style={{ padding: '14px' }}>
                <div style={{ border: '1px solid var(--line-soft)', borderRadius: '10px', padding: '14px', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--faint)', fontFamily: 'var(--mono)', marginBottom: '8px' }}>YOUR POSITION</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                    <span style={{ color: 'var(--muted)' }}>Holdings:</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{quantityOwned.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${sel.ticker}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: 'var(--muted)' }}>Value:</span>
                    <span style={{ fontWeight: 700, color: 'var(--gold)' }}>${holdingValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky buy sheet */}
          <div className="df-sticky-buy">
            <div className="grab"></div>
            <div className="seg-btn">
              <button className={tradeType === 'BUY' ? 'active-buy' : ''} onClick={() => { sfx.click(); setTradeType('BUY'); }}>BUY</button>
              <button className={tradeType === 'SELL' ? 'active-sell' : ''} onClick={() => { sfx.click(); setTradeType('SELL'); }}>SELL</button>
            </div>
            
            <div className="amt-input">
              <input value={amt} onChange={(e) => setAmt(e.target.value)} />
              <button className="max-btn" onClick={() => { sfx.click(); setAmt(tradeType === 'BUY' ? balance.toFixed(2) : (quantityOwned * sel.price).toFixed(2)); }}>MAX</button>
            </div>

            <div className="presets-strip">
              <button onClick={() => { sfx.click(); setAmt('1.00'); }}>$1</button>
              <button onClick={() => { sfx.click(); setAmt('5.00'); }}>$5</button>
              <button onClick={() => { sfx.click(); setAmt('10.00'); }}>$10</button>
              <button onClick={() => { sfx.click(); setAmt('50.00'); }}>$50</button>
            </div>

            <button className={`execute-btn ${tradeType === 'SELL' ? 'sell-mode' : ''}`} onClick={handleTrade}>
              QUICK {tradeType} ${sel.ticker}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
