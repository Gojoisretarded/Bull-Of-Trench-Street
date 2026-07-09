import { useState } from 'react';
import { useOS } from '../store/os';
import { sfx } from '../lib/sound';

interface Email { id: number; from: string; subject: string; preview: string; body: string; unread: boolean; tag?: string; }

const INBOX: Email[] = [
  { id: 1, from: 'Grandma', subject: 'Fwd: FREE SOL!!!! CLICK NOW', preview: 'Sweetheart, I found this amazing opportunity...', body: 'Sweetheart, I found this amazing opportunity to double your Solana coins! All you have to do is send 5 SOL to this nice man from Nigeria and he will send back 10. I already sent mine! Love, Grandma.\n\nP.S. I also signed up for his exclusive Telegram group. The people there are so friendly!', unread: true, tag: 'scam' },
  { id: 2, from: 'AirdropBot_2000', subject: '🎁 CLAIM 50,000 $PEPE — ELIGIBLE', preview: 'Congratulations! Your wallet has been selected...', body: 'Congratulations! Your wallet has been selected for our exclusive airdrop of 50,000 $PEPE tokens.\n\nTo claim, simply connect your wallet at definitely-not-a-scam.xyz and approve the transaction.\n\nNote: A small gas fee of 2.5 SOL is required to process the airdrop.\n\n— The $PEPE Foundation (not affiliated with the real one)', unread: true, tag: 'scam' },
  { id: 3, from: 'TrenchBro_69', subject: 'bro check $GRUMP before it moons', preview: 'yo i got alpha, $GRUMP is about to...', body: 'yo i got alpha, $GRUMP is about to get listed on a major CEX. my insider at [REDACTED] told me. don\'t tell anyone.\n\nalso can i borrow 2 SOL? i\'ll pay you back when $GRUMP hits $1.\n\n— your boy', unread: true },
  { id: 4, from: 'IRS_Official', subject: 'URGENT: Crypto Tax Audit Notice', preview: 'Dear Taxpayer, our records indicate unreported...', body: 'Dear Taxpayer,\n\nOur records indicate unreported crypto gains of $847,293.41 for the fiscal year.\n\nPlease remit payment immediately in Bitcoin to wallet address: bc1q...fake\n\nFailure to comply will result in arrest.\n\nSincerely,\nDefinitely The Real IRS\n(sent from iPhone)', unread: false, tag: 'scam' },
  { id: 5, from: 'DegenAlert', subject: '⚠ RUGPULL DETECTED: $WOJAK', preview: 'Liquidity pulled. Dev wallet drained...', body: '⚠ RUGPULL ALERT ⚠\n\nToken: $WOJAK (Wojak Feels)\nStatus: RUGGED\n\nLiquidity pool: DRAINED\nDev wallet: Transferred 100% of supply\nTime from launch to rug: 47 minutes\n\nAffected wallets: ~2,400\nTotal value lost: ~$210K\n\nThis is why we can\'t have nice things.', unread: true, tag: 'alert' },
  { id: 6, from: 'CryptoQueen_VIP', subject: 'Join my private group (only 500 spots)', preview: 'I turned $100 into $2.4M and I want to...', body: 'I turned $100 into $2.4M and I want to teach YOU how.\n\nMy private Telegram group has:\n• 98.7% win rate (verified by me)\n• 24/7 signals\n• Exclusive memecoins before they pump\n\nOnly $499/month. But for you, just $299 if you join TODAY.\n\nP.S. I am definitely not just a guy named Kevin in his mom\'s basement.', unread: false, tag: 'scam' },
  { id: 7, from: 'Mom', subject: 'Please eat something', preview: 'I can see you\'re online at 4am again...', body: 'I can see you\'re online at 4am again. Your father and I are worried.\n\nPlease eat something that isn\'t Red Bull and gas station sushi.\n\nAlso, what is a "rug pull"? Your cousin Kevin says he got "rugged" and needs to borrow money.\n\nLove, Mom\n\nP.S. Grandma says to check your email, she sent you something important.', unread: true },
  { id: 8, from: 'SYSTEM', subject: 'Your seed phrase backup', preview: 'This is your encrypted seed phrase backup...', body: '[ENCRYPTED CONTENT]\n\nJust kidding. We would never email you your seed phrase.\n\nBut someone will try. And when they do, remember:\n\n🚨 NEVER share your seed phrase\n🚨 NEVER enter it on a website\n🚨 NEVER send it to "support"\n\nStay safe out there, degen.\n\n— BOTS_OS Security Team', unread: false, tag: 'system' },
];

function TagBadge({ tag }: { tag?: string }) {
  if (!tag) return null;
  const cls = tag === 'scam' ? 'rug' : tag === 'alert' ? 'hot' : 'shill';
  return <span className={'badge ' + cls}>{tag.toUpperCase()}</span>;
}

export function ChudMail() {
  const toast = useOS((s) => s.toast);
  const [emails, setEmails] = useState(INBOX);
  const [selected, setSelected] = useState<Email | null>(null);

  const unread = emails.filter((e) => e.unread).length;

  const open = (e: Email) => {
    sfx.click();
    setSelected(e);
    if (e.unread) setEmails((prev) => prev.map((m) => m.id === e.id ? { ...m, unread: false } : m));
  };

  const reply = () => { sfx.tap(); toast('Reply sent. (It wasn\'t.)', 'info'); };
  const del = () => { sfx.err(); toast('Message archived. (It\'s still there.)', 'info'); };

  return (
    <div className="mail">
      <div className="appbar">
        <strong style={{ color: 'var(--ink)' }}>ChudMail</strong>
        <span className="sub">// inbox</span>
        {unread > 0 && <span className="mail-badge">{unread}</span>}
      </div>
      <div className="mail-body">
        <div className={'mail-list' + (selected ? ' narrow' : '')}>
          {emails.map((e) => (
            <div key={e.id} className={'mail-row' + (e.unread ? ' unread' : '') + (selected?.id === e.id ? ' sel' : '')} onClick={() => open(e)}>
              <div className="mail-from">{e.from}<TagBadge tag={e.tag} /></div>
              <div className="mail-subj">{e.subject}</div>
              <div className="mail-prev">{e.preview}</div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="mail-read">
            <div className="mail-read-head">
              <div className="mail-read-from">{selected.from}<TagBadge tag={selected.tag} /></div>
              <div className="mail-read-subj">{selected.subject}</div>
            </div>
            <div className="mail-read-body">{selected.body}</div>
            <div className="mail-read-acts">
              <button className="btn ghost" onClick={reply}>↩ Reply</button>
              <button className="btn ghost" onClick={del}>🗑 Archive</button>
              <button className="btn ghost" onClick={() => setSelected(null)}>← Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
