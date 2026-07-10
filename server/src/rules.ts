/**
 * Canonical game data. The server never trusts a client's idea of starting
 * bags, item prices or effects — it all lives here.
 */

export interface CharacterDef { id: string; bag: number }
export const CHARACTERS: CharacterDef[] = [
  { id: 'orphan', bag: 5.0 },
  { id: 'fumbler', bag: 2.0 },
  { id: 'nepo', bag: 50.0 },
  { id: 'addict', bag: 0.8 },
];

export interface ShopItemDef {
  id: string; price: number;
  effect: 'miner' | 'followers' | 'bluecheck' | 'protection' | 'rig';
  amount?: number; clout?: number; repurchasable?: boolean; enabled: boolean;
}
export const SHOP: ShopItemDef[] = [
  { id: 'miner', price: 5, effect: 'miner', enabled: true },
  { id: 'followers', price: 0.5, effect: 'followers', amount: 25_000, clout: 400, repurchasable: true, enabled: true },
  { id: 'bluecheck', price: 1.5, effect: 'bluecheck', clout: 600, enabled: true },
  { id: 'protection', price: 2.5, effect: 'protection', repurchasable: true, enabled: true },
  { id: 'rig', price: 40, effect: 'rig', enabled: true },
  { id: 'cards', price: 5, effect: 'protection', enabled: false },  // "soon" items can't be bought
  { id: 'gov', price: 50, effect: 'protection', enabled: false },
];

export interface SeedCoin {
  id: string; name: string; ticker: string; price: number; change: number;
  up: boolean; rug?: boolean; mcap: string; badge?: 'HOT' | 'RUG';
}
export const SEED_COINS: SeedCoin[] = [
  { id: 'grump', name: 'Grumpy Coin', ticker: 'GRUMP', price: 0.0571, change: 427.6, up: true, mcap: '$4.2M', badge: 'HOT' },
  { id: 'cmr', name: 'Chad Rocket', ticker: 'CMR', price: 0.0092, change: 141.1, up: true, mcap: '$1.1M' },
  { id: 'dhd', name: 'Doge Hard Die', ticker: 'DHD', price: 0.0235, change: 78.1, up: true, mcap: '$890K' },
  { id: 'hodl', name: 'HODL Grandma', ticker: 'HODL', price: 0.1214, change: 301.6, up: true, mcap: '$6.8M' },
  { id: 'wojak', name: 'Wojak Feels', ticker: 'WOJAK', price: 0.0013, change: -85.7, up: false, rug: true, mcap: '$210K', badge: 'RUG' },
];

/** Usernames nobody should be able to squat. */
export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'mod', 'moderator', 'system', 'server', 'root',
  'support', 'official', 'staff', 'anthropic', 'trenchos', 'bots',
  // bot display handles — reserved so real players can't impersonate them
  'alphadegen', 'solwhale', 'bagholder', 'jeetmaster', 'rugsurvivor',
  'moonboy', 'gigachad', 'memelord', 'degen0x', 'pumpchaser',
]);

export function seedHist(price: number, up: boolean): number[] {
  const a: number[] = [];
  let v = price * (up ? 0.6 : 1.4);
  for (let i = 0; i < 28; i++) {
    v += (price - v) * 0.08 + (Math.random() - 0.5) * price * 0.06;
    a.push(Math.max(v, price * 0.05));
  }
  a[a.length - 1] = price;
  return a;
}
