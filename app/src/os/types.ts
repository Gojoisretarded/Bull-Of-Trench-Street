export type AppId =
  | 'degenfun' | 'chirper' | 'wallet' | 'terminal'
  | 'darkweb' | 'files' | 'chudmail' | 'gamble' | 'internet' | 'launchpad' | 'settings' | 'wallpapers' | 'pumphub';

export interface WinState {
  id: AppId;
  x: number; y: number; w: number; h: number;
  z: number;
  min: boolean;
  max: boolean;
}

export interface Character {
  id: string;
  emoji: string;
  name: string;
  tag: string;
  bag: number;
  desc: string;
}

export interface Coin {
  id: string;
  name: string;
  ticker: string;
  price: number;
  change: number;
  up: boolean;
  rug?: boolean;
  mcap: string;
  badge?: 'HOT' | 'RUG';
  hist: number[];
}

export type ToastKind = 'good' | 'bad' | 'sell' | 'info';
export interface Toast { id: number; text: string; kind: ToastKind; }

export type ShopEffect = 'miner' | 'followers' | 'bluecheck' | 'protection' | 'rig';
export type ShopCategory = 'access' | 'social' | 'software' | 'services' | 'data';
export interface ShopItem {
  id: string;
  title: string;
  desc: string;
  price: number;        // in BOTS
  effect: ShopEffect;
  category: ShopCategory;
  amount?: number;      // e.g. followers granted
  clout?: number;       // clout granted
  seller: string;
  rating: number;
  sales: string;
  glyph: string;
  repurchasable?: boolean;
  hot?: boolean;
  soon?: boolean;
}

export interface Txn { id: number; label: string; delta: number; kind: 'in' | 'out'; t: number; }
