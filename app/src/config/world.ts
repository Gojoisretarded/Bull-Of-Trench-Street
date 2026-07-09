/**
 * WORLD CONFIG — the single source of truth for branding.
 *
 * This is play-money by design: `sym`/`ticker` are the *in-game* currency.
 * The real $BOTS token lives OUTSIDE the game as a separate hype coin.
 * Rebrand the entire OS by editing this one object.
 */
export const WORLD = {
  os: 'Bull of Trench Street',
  short: 'BOTS_OS',
  currencyName: 'Bull Bucks',
  sym: 'BOTS',
  ticker: '$BOTS',
  version: '0.1',
} as const;

export type World = typeof WORLD;
