import type { AppId, Character, ShopItem } from '../os/types';
import { WORLD } from '../config/world';

export const APP_META: Record<AppId, { title: string }> = {
  degenfun: { title: 'Degen.Fun' },
  chirper: { title: 'Chirper' },
  wallet: { title: 'Wallet' },
  terminal: { title: 'Terminal' },
  darkweb: { title: 'Dark Web' },
  files: { title: 'Files' },
  chudmail: { title: 'ChudMail' },
  gamble: { title: 'Gamble' },
  internet: { title: 'Internet' },
  launchpad: { title: 'Launchpad' },
  settings: { title: 'Settings' },
  wallpapers: { title: 'Wallpapers' },
};

export const DOCK_APPS: AppId[] = ['degenfun', 'chirper', 'wallet', 'terminal', 'darkweb', 'settings'];
export const ALL_APPS: AppId[] = Object.keys(APP_META) as AppId[];

export const FLAVOR: Partial<Record<AppId, string>> = {
  internet: `NET_LINK severed. Reconnect fee: 0.50 ${WORLD.sym}. You have... priorities.`,
  darkweb: '3 sellers online. Proceed at your own risk. Grandma would not approve of tab #2.',
  files: '12 files found. Mostly screenshots of losses and one blurry seed phrase.',
  chudmail: '47 unread. All scams. One is from grandma. It is also a scam.',
  gamble: `Double or nothing. [ LOCKED — deposit 1.00 ${WORLD.sym} to unlock your doom ]`,
};

export const CHARACTERS: Character[] = [
  { id: 'orphan', emoji: '🕊️', name: 'The Orphan', tag: 'the canon', bag: 5.0, desc: 'Buried both parents. $5k in SOL is all that’s left. Refuses to quit.' },
  { id: 'fumbler', emoji: '😤', name: 'The Fumbler', tag: 'redemption', bag: 2.0, desc: 'Paper-handed a 100x at 2x. Hunting the trade that makes it right.' },
  { id: 'nepo', emoji: '💰', name: 'The Nepo', tag: 'prove it', bag: 50.0, desc: 'Daddy’s allowance. Rich, but nobody respects it. Earn the trenches.' },
  { id: 'addict', emoji: '🎰', name: 'The Addict', tag: 'high tension', bag: 0.8, desc: 'One last win, he swears. Trading the rent money. Brutal.' },
];

export const SHOP: ShopItem[] = [
  { id: 'miner', title: `${WORLD.sym} Miner Rig`, desc: `Passive income. Mines ${WORLD.sym} automatically while you doomscroll.`, price: 5, effect: 'miner', category: 'software', glyph: '⛏', clout: 0, seller: 'CryptoMiner_Pro', rating: 4.7, sales: '2.1k', hot: true },
  { id: 'followers', title: '25K Follower Bot', desc: 'INSTANT delivery. 25,000 real-looking followers. Boost your clout overnight.', price: 0.5, effect: 'followers', category: 'social', glyph: '👥', amount: 25000, clout: 400, seller: 'SocialBoostPro', rating: 4.8, sales: '12.5k', repurchasable: true, hot: true },
  { id: 'bluecheck', title: 'Blue Checkmark Hack', desc: 'The coveted verified badge on Chirper. Without paying. Permanent.', price: 1.5, effect: 'bluecheck', category: 'social', glyph: '✔', clout: 600, seller: 'SocialHacker', rating: 4.9, sales: '4.2k' },
  { id: 'protection', title: 'Hacker Protection', desc: 'Military-grade firewall. Blocks wallet drainers for a while. (PvP soon.)', price: 2.5, effect: 'protection', category: 'software', glyph: '🛡', seller: 'CyberShield_Pro', rating: 4.8, sales: '15.2k', repurchasable: true },
  { id: 'rig', title: '50% Extraction Rig', desc: 'Steal from unprotected players. Advanced rig drains 50% of a target wallet.', price: 40, effect: 'rig', category: 'access', glyph: '🩸', seller: 'WalletDrainer_69', rating: 4.6, sales: '1.8k', hot: true },
  { id: 'cards', title: '10,000 Credit Cards', desc: 'Premium fullz w/ CVV. Visa · MC · Amex. All verified.', price: 5, effect: 'protection', category: 'data', glyph: '💳', seller: 'CardMaster_Pro', rating: 4.7, sales: '2.3k', soon: true },
  { id: 'gov', title: 'Government Database', desc: 'CLASSIFIED. SSH access to [REDACTED] servers. We don\'t ask questions.', price: 50, effect: 'protection', category: 'access', glyph: '🗄', seller: 'Anonymous_Hacker42', rating: 5, sales: '89', soon: true },
];

export interface Post {
  name: string; handle: string; followers: string;
  body: string; likes: string; reposts: string;
  shill?: boolean; verified?: boolean; larp?: boolean;
}
export const POSTS: Post[] = [
  { name: 'Rug Pull Randy', handle: 'rugpull_randy', followers: '12.4K', shill: true, body: 'aped my grandma fund into $HODL — this is the one anon. wagmi 🚀', likes: '892', reposts: '204' },
  { name: 'Giga GM', handle: 'gigachad_gm', followers: '88.2K', body: '$GRUMP is the only coin with real utility (making me rich)', likes: '4.2K', reposts: '1.1K' },
  { name: 'Trench Mommy', handle: 'trenchmommy', followers: '24.9K', body: 'sold a kidney, bought the dip on $CMR. gm degens 🍜', likes: '1.7K', reposts: '340' },
  { name: '0xLiquidated', handle: '0xLiquidated', followers: '3.1K', body: '$WOJAK down bad again. i have become the meme.', likes: '410', reposts: '77' },
  { name: 'exit liquidity', handle: 'exitliquidity', followers: '6.6K', body: 'if you’re reading this you’re still early on $GRUMP (i am not early, i need you to buy)', likes: '203', reposts: '58' },
];
