import { useMemo } from 'react';
import { useOS } from '../store/os';
import { hist } from '../lib/market';
import { fmtK, fmtBal } from '../lib/format';
import { Sparkline } from '../os/Sparkline';
import { SHOP } from './registry';
import { sfx } from '../lib/sound';

const ADDR = '0x7f3a…c29d';

function ago(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 5) return 'now';
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  return Math.floor(s / 3600) + 'h';
}

export function Wallet() {
  const balance = useOS((s) => s.balance);
  const chosen = useOS((s) => s.chosen);
  const username = useOS((s) => s.username);
  const handle = useOS((s) => s.handle);
  const clout = useOS((s) => s.clout);
  const followers = useOS((s) => s.followers);
  const owned = useOS((s) => s.owned);
  const txns = useOS((s) => s.txns);
  const coins = useOS((s) => s.coins);
  const holdings = useOS((s) => s.holdings);
  const toast = useOS((s) => s.toast);

  const bag = chosen?.bag ?? 5;
  const heldCoins = useMemo(() => {
    return coins.map((c) => {
      const quantity = holdings[c.id] || 0;
      return { c, quantity, value: quantity * c.price };
    }).filter((x) => x.quantity > 0);
  }, [coins, holdings]);
  const pnl = balance - bag;
  const pnlPct = (pnl / bag) * 100;
  const up = pnl >= 0;
  const heroData = useMemo(() => hist(Math.max(balance, 0.1), up), [balance, up]);
  const assets = SHOP.filter((it) => owned[it.id]);

  const stub = (msg: string) => () => { sfx.tap(); toast(msg, 'info'); };

  return (
    <div className="wlt">
      {/* ── HERO CARD ── */}
      <div className="wlt-card">
        <div className="wlt-card-top">
          <div className="wlt-av">{(username?.[0] ?? chosen?.name?.[0] ?? 'D').toUpperCase()}</div>
          <div>
            <div className="wlt-name">{username || chosen?.name || 'Degen'}{handle ? <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>@{handle}</span> : null}</div>
            <div className="wlt-addr" onClick={() => { navigator.clipboard?.writeText(ADDR); toast('Address copied (it\'s fake).', 'info'); }}>{ADDR} ⧉</div>
          </div>
        </div>
        <div className="wlt-bal-row">
          <div className="wlt-bal">{fmtBal(balance)}</div>
          <div className={'wlt-pnl ' + (up ? 'up' : 'down')}>
            {up ? '▲' : '▼'} {up ? '+' : ''}{fmtBal(Math.abs(pnl))} ({up ? '+' : ''}{pnlPct.toFixed(1)}%)
          </div>
        </div>
        <Sparkline data={heroData} up={up} fill width={320} height={56} style={{ width: '100%', marginTop: 8, borderRadius: 8 }} />
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="wlt-actions">
        <button className="wlt-act" onClick={stub('Send coming soon. Relax.')}>
          <span className="wlt-act-ic">↑</span>Send
        </button>
        <button className="wlt-act" onClick={stub('Receive address copied (it\'s fake).')}>
          <span className="wlt-act-ic">↓</span>Receive
        </button>
        <button className="wlt-act" onClick={stub('Swap coming soon. Be patient, degen.')}>
          <span className="wlt-act-ic">⇄</span>Swap
        </button>
      </div>

      {/* ── TOKEN HOLDINGS ── */}
      <div className="wlt-sec">
        <div className="wlt-sec-h">TOKEN HOLDINGS</div>
        {heldCoins.length === 0
          ? <div className="wlt-empty">No tokens. Go buy something reckless.</div>
          : heldCoins.map(({ c, quantity, value }) => {
            const cUp = c.change >= 0;
            return (
              <div key={c.id} className="wlt-token">
                <div className="wlt-token-av">{c.ticker[0]}</div>
                <div className="wlt-token-info">
                  <div className="wlt-token-name">{c.name}</div>
                  <div className="wlt-token-ticker" style={{ fontFamily: 'var(--mono)', fontSize: '10.5px', color: 'var(--muted)' }}>
                    {quantity.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${c.ticker}
                  </div>
                </div>
                <div className="wlt-token-chart"><Sparkline data={c.hist} up={cUp} /></div>
                <div className="wlt-token-val">
                  <div className="wlt-token-price" style={{ fontWeight: 700 }}>${value.toFixed(2)}</div>
                  <div className={'wlt-token-chg ' + (cUp ? 'up' : 'down')}>{cUp ? '+' : ''}{c.change.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
      </div>

      {/* ── DARK WEB ASSETS ── */}
      {assets.length > 0 && (
        <div className="wlt-sec">
          <div className="wlt-sec-h">ASSETS</div>
          {assets.map((a) => (
            <div key={a.id} className="wlt-hold">
              <span className="g">{a.glyph}</span>
              <span className="t">{a.title}</span>
              <span className="p">{fmtBal(a.price)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── STATS ── */}
      <div className="wlt-stats">
        <div className="wlt-stat"><div className="k">CLOUT</div><div className="v">☆ {fmtK(clout)}</div></div>
        <div className="wlt-stat"><div className="k">FOLLOWERS</div><div className="v">{fmtK(followers)}</div></div>
        <div className="wlt-stat"><div className="k">ASSETS</div><div className="v">{assets.length}</div></div>
      </div>

      {/* ── ACTIVITY ── */}
      <div className="wlt-sec">
        <div className="wlt-sec-h">RECENT ACTIVITY</div>
        {txns.length === 0
          ? <div className="wlt-empty">No transactions yet. Go make a terrible decision.</div>
          : txns.slice(0, 15).map((t) => (
            <div key={t.id} className="wlt-tx">
              <span className="d">{t.kind === 'in' ? '↓' : '↑'}</span>
              <span className="l">{t.label}</span>
              <span className="ti">{ago(t.t)}</span>
              <span className={'a ' + (t.kind === 'in' ? 'up' : 'down')}>{t.delta >= 0 ? '+' : ''}{fmtBal(Math.abs(t.delta))}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
