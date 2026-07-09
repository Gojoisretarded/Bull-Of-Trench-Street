import { useState } from 'react';
import { sfx } from '../lib/sound';

interface Article { id: string; title: string; source: string; time: string; tag?: string; body: string; }

const ARTICLES: Article[] = [
  { 
    id: 'fed', 
    title: 'Fed Rate Cut Inbound: Bitcoin Surges 4% as Degens Immediately Rotate into 150x Leverage Memecoins', 
    source: 'TrenchDaily', 
    time: '2h ago', 
    tag: 'TRENDING',
    body: 'WASHINGTON, D.C. — In a move that surprised macroeconomists but delighted leverage junkies, the Federal Reserve has signaled a 50-basis-point rate cut.\n\nWhile traditional markets saw modest gains, degen traders bypassed blue-chip assets entirely, choosing instead to rotate capital into highly volatile microcap tokens.\n\n"Why buy 5% treasury yields when $GRUMP and $CMR offer 5,000% APY in 15 minutes?" asked prominent trader @GigaChad_GM, who was last seen configuring a 150x long position while driving.\n\nAt press time, Jerome Powell was unavailable for comment, though rumor has it he holds a small bag of $HODL.' 
  },
  { 
    id: 'solana', 
    title: 'Solana Active Addresses Hit Record High Amidst Jito Tip Wars and Automated Trench Bot Battles', 
    source: 'SolanaEye', 
    time: '47m ago', 
    tag: 'ALERT',
    body: 'Solana active wallets have reached an all-time high, driven by high-frequency MEV bots fighting for launchpad allocations.\n\nValidator tips via Jito reached a record 50,000 SOL today as bots attempted to frontrun retail traders on pump.fun tokens.\n\n"I tried to buy a coin at launch and was outbid by a bot paying $50 in tips for a $2 transaction," complained one retail trader.\n\nMeanwhile, the network remained online with average fees staying under $0.001, proving that the monothreaded execution model can handle bot warfare.' 
  },
  { 
    id: 'sec', 
    title: 'Gary Gensler Warns: "Mascot Images in Memecoins Constitute Unregistered Investment Contracts"', 
    source: 'RegulatoryWatch', 
    time: '5h ago', 
    tag: 'ALERT',
    body: 'SEC Chairman Gary Gensler issued a stern warning to the crypto community, claiming that memecoins featuring animal drawings violate securities laws.\n\n"When investors buy a token with a picture of a grumpy cat wearing a crown, they have a reasonable expectation of profit derived from the managerial shill efforts of others," Gensler explained.\n\nThe SEC has reportedly filed a subpoena against three prominent cartoonists. The crypto community responded by launching a "GARY" coin, which promptly rugged.' 
  },
  { 
    id: 'vitalik', 
    title: 'Vitalik Buterin Donates Unsolicited Meme Tokens to Animal Charity: Price Collapses 85%', 
    source: 'EthHub', 
    time: '8h ago', 
    tag: 'TRENDING',
    body: 'Ethereum co-founder Vitalik Buterin has cleared out his public wallet, transferring billions of unsolicited meme tokens sent to him by developers to an international wildlife fund.\n\nThe charity immediately liquidated the tokens to pay for veterinary supplies, resulting in an 85% price crash in under 12 minutes.\n\n"We are extremely grateful to Vitalik, although we had to explain to our board of directors what a dog-themed ERC-20 token was," said the charity director.\n\nDevastated holders have requested Vitalik to "consult with the community before doing charity work."' 
  },
  { 
    id: 'guide', 
    title: 'How to Spot a Rug Pull: A Guide You Won\'t Read Until It\'s Too Late', 
    source: 'DegenAcademy', 
    time: '1d ago',
    body: '🚩 RED FLAGS — A COMPREHENSIVE GUIDE:\n\n1. Anonymous team → "Trust us bro"\n2. Locked liquidity... for 7 days → That\'s not locked, that\'s a countdown\n3. "Safu" in the name → It is never safu\n4. 100% buy tax → You are the product\n5. Telegram group bans questions → Democracy was never the goal\n6. Whitepaper is a Google Doc → They couldn\'t even pay for Notion\n7. "Elon tweeted about us" → He did not\n8. Contract not verified → It\'s verified... as a scam\n9. Dev holds 90% of supply → "It\'s for marketing"\n10. You found it at 4 AM → Your judgment is compromised\n\nRemember: If it sounds too good to be true, you\'re already rugged.\n\n— The DegenAcademy (We learned these the hard way)' 
  }
];

export function Internet() {
  const [page, setPage] = useState<'home' | string>('home');
  const [url, setUrl] = useState('trench://homepage');
  const [searchQuery, setSearchQuery] = useState('');
  const article = ARTICLES.find((a) => a.id === page);

  const goArticle = (id: string) => { sfx.click(); setPage(id); setUrl(`trench://news/${id}`); };
  const goHome = () => { sfx.click(); setPage('home'); setUrl('trench://homepage'); };

  const filteredArticles = ARTICLES.filter((a) => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="inet">
      <div className="inet-bar">
        <button className="inet-nav" onClick={goHome}>←</button>
        <button className="inet-nav" onClick={goHome}>⟳</button>
        <div className="inet-url">
          <span className="inet-lock">🔒</span>
          <input value={url} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
        </div>
      </div>

      {page === 'home' ? (
        <div className="inet-home" style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
          <div className="inet-logo" style={{ fontSize: '28px', marginBottom: '8px' }}>🔍 TrenchSearch</div>
          <div style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '12px', marginBottom: '20px', fontFamily: 'var(--mono)' }}>
            // realtime index of the degen trenches
          </div>
          <input 
            className="inet-search" 
            placeholder="Search trending crypto narratives..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ userSelect: 'text' }}
          />
          <div className="inet-section" style={{ fontSize: '11px', marginTop: '12px' }}>TRENDING CRYPTO NEWS</div>
          {filteredArticles.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--faint)', fontSize: '13px', fontFamily: 'var(--mono)' }}>
              No matches found for "{searchQuery}". The trenches are quiet.
            </div>
          ) : (
            filteredArticles.map((a) => (
              <div key={a.id} className="inet-article" onClick={() => goArticle(a.id)}>
                <div className="inet-art-head">
                  <span className="inet-art-src">{a.source}</span>
                  <span className="inet-art-time">{a.time}</span>
                  {a.tag && <span className={'badge ' + (a.tag === 'ALERT' ? 'rug' : 'hot')}>{a.tag}</span>}
                </div>
                <div className="inet-art-title">{a.title}</div>
              </div>
            ))
          )}
        </div>
      ) : article ? (
        <div className="inet-read" style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px' }}>
          <div className="inet-read-meta">
            <span className="inet-art-src">{article.source}</span>
            <span className="inet-art-time">{article.time}</span>
            {article.tag && <span className={'badge ' + (article.tag === 'ALERT' ? 'rug' : 'hot')}>{article.tag}</span>}
          </div>
          <h2 className="inet-read-title" style={{ fontSize: '22px', borderBottom: '1px solid var(--line-soft)', paddingBottom: '14px', marginBottom: '20px' }}>
            {article.title}
          </h2>
          <pre className="inet-read-body" style={{ fontFamily: 'var(--sans)', fontSize: '14px', lineHeight: 1.6 }}>
            {article.body}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
