import { useState } from 'react';
import { useOS } from '../store/os';
import { fmtBal } from '../lib/format';
import { SHOP } from './registry';
import type { ShopItem, ShopCategory } from '../os/types';

const CATS: { id: ShopCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All listings' },
  { id: 'access', label: 'Access' },
  { id: 'social', label: 'Social' },
  { id: 'software', label: 'Software' },
  { id: 'data', label: 'Data' },
];

function Listing({ item }: { item: ShopItem }) {
  const owned = useOS((s) => !!s.owned[item.id]);
  const buy = useOS((s) => s.buyItem);
  const toast = useOS((s) => s.toast);
  const isOwned = owned && !item.repurchasable;
  const label = item.soon ? 'SOON' : isOwned ? 'OWNED' : 'BUY';
  return (
    <div className={'dwrow' + (item.soon ? ' soon' : '')}>
      <div className="dw-thumb">{item.glyph}</div>
      <div className="dw-main">
        <div className="dw-title">{item.title}{item.hot && <span className="badge hot">HOT</span>}</div>
        <div className="dw-desc">{item.desc}</div>
        <div className="dw-meta">
          <span className="dw-seller">◈ {item.seller}</span>
          <span className="dw-star">★ {item.rating}</span>
          <span>{item.sales} sold</span>
          <span className="dw-escrow">ESCROW</span>
        </div>
      </div>
      <div className="dw-buy">
        <div className="dw-price">{fmtBal(item.price)}</div>
        <button className={'btn ' + (label === 'BUY' ? 'gold' : 'ghost')} disabled={label !== 'BUY'}
          onClick={() => (item.soon ? toast('Vendor offline. Check back later.', 'bad') : buy(item))}>{label}</button>
      </div>
    </div>
  );
}

export function DarkWeb() {
  const [cat, setCat] = useState<ShopCategory | 'all'>('all');
  const list = cat === 'all' ? SHOP : SHOP.filter((i) => i.category === cat);
  return (
    <div className="dw">
      <div className="appbar">
        <strong style={{ color: 'var(--ink)' }}>Dark Web</strong>
        <span className="sub">// buyer beware</span>
        <span className="live" style={{ color: 'var(--red)' }}>
          <span className="d" style={{ background: 'var(--red)', boxShadow: '0 0 8px 1px rgba(245,86,110,.6)' }} />3 SELLERS
        </span>
      </div>
      <div className="dw-warn">⚠ TOR HIDDEN SERVICE · ESCROW ACTIVE · ALL SALES FINAL · TRANSACTIONS ARE IRREVERSIBLE</div>
      <div className="dw-body">
        <div className="dw-rail">
          {CATS.map((c) => (
            <button key={c.id} className={'dw-cat' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>{c.label}</button>
          ))}
          <div className="dw-note">◈ your identity is (not) safe.<br />clearnet cowards not welcome.</div>
        </div>
        <div className="dw-list">
          {list.map((it) => <Listing key={it.id} item={it} />)}
        </div>
      </div>
    </div>
  );
}
