import type { Coin } from '../os/types';

// Seed price history for a coin's sparkline.
export function hist(price: number, up: boolean): number[] {
  const a: number[] = [];
  let v = price * (up ? 0.6 : 1.4);
  for (let i = 0; i < 28; i++) {
    v += (price - v) * 0.08 + (Math.random() - 0.5) * price * 0.06;
    a.push(Math.max(v, price * 0.05));
  }
  a[a.length - 1] = price;
  return a;
}

export function initialCoins(): Coin[] {
  return [
    { id: 'grump', name: 'Grumpy Coin', ticker: 'GRUMP', price: 0.0571, change: 427.6, up: true, mcap: '$4.2M', badge: 'HOT', hist: hist(0.0571, true) },
    { id: 'cmr', name: 'Chad Rocket', ticker: 'CMR', price: 0.0092, change: 141.1, up: true, mcap: '$1.1M', hist: hist(0.0092, true) },
    { id: 'dhd', name: 'Doge Hard Die', ticker: 'DHD', price: 0.0235, change: 78.1, up: true, mcap: '$890K', hist: hist(0.0235, true) },
    { id: 'hodl', name: 'HODL Grandma', ticker: 'HODL', price: 0.1214, change: 301.6, up: true, mcap: '$6.8M', hist: hist(0.1214, true) },
    { id: 'wojak', name: 'Wojak Feels', ticker: 'WOJAK', price: 0.0013, change: -85.7, up: false, rug: true, mcap: '$210K', badge: 'RUG', hist: hist(0.0013, false) },
  ];
}

// Advance one market tick (client-side sim — the real game moves this to a server tick worker).
export function tickCoins(coins: Coin[]): Coin[] {
  return coins.map((c) => {
    const last = c.hist[c.hist.length - 1];
    const drift = c.rug ? -last * 0.03 : c.up ? last * 0.006 : -last * 0.006;
    // punchier volatility so the market visibly moves
    const noise = (Math.random() - 0.48) * last * 0.09;
    const nv = Math.max(last + drift + noise, c.price * 0.02);
    const h = [...c.hist.slice(1), nv];
    let change = c.change + ((nv - last) / c.price) * 100;
    if (c.rug) change = Math.min(change, -8);
    change = Math.max(-96, Math.min(9999, change));
    return { ...c, hist: h, price: nv, change };
  });
}

export function fmtPrice(p: number): string {
  const decimals = p < 0.01 ? 5 : 4;
  return p.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtMcap(price: number): string {
  const mcap = price * 75_000_000;
  if (mcap >= 1_000_000_000) {
    const val = mcap / 1_000_000_000;
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;
  }
  if (mcap >= 1_000_000) {
    const val = mcap / 1_000_000;
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (mcap >= 1_000) {
    const val = mcap / 1_000;
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`;
  }
  return `$${mcap.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
