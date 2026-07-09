import { useState, useEffect, useRef } from 'react';
import { useOS } from '../store/os';
import { POSTS, type Post } from './registry';
import { fmtK } from '../lib/format';
import { sfx } from '../lib/sound';
import { publish, subscribe } from '../lib/sync';
import { netSend, onNetChirp, getNetChirps, type NetChirp } from '../lib/netBus';

const SIM_PROFILES = [
  { name: 'Rug Pull Randy', handle: 'rugpull_randy', followers: '12.4K', verified: false },
  { name: 'Giga GM', handle: 'gigachad_gm', followers: '88.2K', verified: true },
  { name: 'Trench Mommy', handle: 'trenchmommy', followers: '24.9K', verified: false },
  { name: '0xLiquidated', handle: '0xLiquidated', followers: '3.1K', verified: false },
  { name: 'exit liquidity', handle: 'exitliquidity', followers: '6.6K', verified: false },
  { name: 'Solana Whale', handle: 'sol_whale', followers: '150K', verified: true },
  { name: 'Meme Sniper', handle: 'memesniper', followers: '45.1K', verified: false },
];

const SIM_BODIES = [
  'just aped another 5 SOL into $GRUMP. we are so back.',
  'anyone got new alpha? the trenches are dry today.',
  'holding my $WOJAK bag with dear life. please sir do not rug.',
  'just saw a 1000x coin launch on degen.fun and missed it. pain.',
  'gm to everyone except the dev who rugged $WOJAK.',
  'if you sell now, you are exit liquidity. diamond hands only 💎',
  'is $CMR a buy here? chart looks like a sleeping giant.',
  'eating ramen tonight so I can buy more $GRUMP tomorrow.',
  'my wallet is down 80% but my spirits are up 1000%. WAGMI.',
  'what is the play? pump or rug? i don\'t care, i just want volatility.',
  'who is minting the next memecoin? let\'s raid the launchpad.',
];

function body(b: string) {
  return b.split(/(\$[A-Z]+)/g).map((p, i) =>
    /^\$[A-Z]+$/.test(p) ? <span key={i} className="cash">{p}</span> : <span key={i}>{p}</span>);
}

function PostRow({ p }: { p: Post }) {
  return (
    <div className="post">
      <div className="ph">
        <span className="av">{p.name[0].toUpperCase()}</span>
        <div className="un2">
          <span className="un">{p.name}</span>
          {p.verified && <span className="vchk" title="verified">✔</span>}
          <span className="fol">@{p.handle} · {p.followers}</span>
          {p.shill && <span className="badge shill">SHILL</span>}
          {p.larp && <span className="badge rug">LARP</span>}
        </div>
      </div>
      <div className="bd">{body(p.body)}</div>
      <div className="eng">
        <span className="lk">♥ {p.likes}</span>
        <span className="rt">↻ {p.reposts}</span>
        <span className="sh">↗</span>
      </div>
    </div>
  );
}

// Convert format string back to numbers for counting (e.g. 1.2K -> 1200)
function parseVal(s: string): number {
  if (s.endsWith('K')) return parseFloat(s.slice(0, -1)) * 1000;
  if (s.endsWith('M')) return parseFloat(s.slice(0, -1)) * 1000000;
  return parseInt(s, 10) || 0;
}

export function Chirper() {
  const { chosen } = useOS.getState();
  const blueCheck = useOS((s) => s.blueCheck);
  const username = useOS((s) => s.username);
  const handle = useOS((s) => s.handle);
  const online = useOS((s) => s.online);
  const balance = useOS((s) => s.balance);
  const clout = useOS((s) => s.clout);
  const followers = useOS((s) => s.followers);
  const addClout = useOS((s) => s.addClout);
  const toast = useOS((s) => s.toast);
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [draft, setDraft] = useState('');
  
  // Track player posts for rapid viral engagement increments
  const viralPostIndex = useRef<number | null>(null);

  const me = () => ({
    name: username || chosen?.name || 'you',
    handle: handle || 'you',
    followers: fmtK(followers),
    verified: blueCheck,
  });

  const push = (p: Post) => {
    setPosts((prev) => [p, ...prev]);
    viralPostIndex.current = 0; // Newly pushed post will be at index 0
    // Mirror the post to any other open tab. Deferred a microtask so the
    // caller's addClout() lands first and we broadcast the updated stats.
    queueMicrotask(() => {
      const s = useOS.getState();
      publish({
        type: 'CHIRP_POSTED',
        post: { name: p.name, handle: p.handle, body: p.body, followers: p.followers, verified: p.verified === true },
        clout: s.clout,
        followers: s.followers,
      });
    });
  };

  const chirp = () => {
    const v = draft.trim(); if (!v) { sfx.err(); return; }
    sfx.coin();
    if (online) { netSend({ t: 'chirp', kind: 'chirp', body: v }); setDraft(''); return; } // server validates, awards clout, echoes to all
    push({ ...me(), body: v, likes: '0', reposts: '0' });
    addClout(12, 5);
    setDraft(''); toast('Chirped. Clout +12', 'good');
  };

  const flex = () => {
    if (online) { sfx.coin(); netSend({ t: 'chirp', kind: 'flex' }); return; } // server computes real PnL
    const bag = chosen?.bag ?? 5;
    const pnl = ((balance - bag) / bag) * 100;
    if (pnl <= 5) { sfx.err(); toast('Down bad. Nothing to flex (honestly).', 'bad'); return; }
    sfx.coin();
    const gain = Math.min(2000, Math.round(pnl * 6));
    push({ ...me(), body: `up +${pnl.toFixed(0)}% on my bag 📈 receipts attached`, likes: '15', reposts: '3', verified: blueCheck });
    addClout(gain, Math.round(pnl * 10));
    toast(`Flexed +${pnl.toFixed(0)}% (verified). Clout +${fmtK(gain)}`, 'good');
  };

  const larp = () => {
    if (online) { sfx.coin(); netSend({ t: 'chirp', kind: 'larp' }); return; } // server rolls the dice
    const fake = 400 + Math.floor(Math.random() * 3000);
    const caught = Math.random() < 0.32;
    push({ ...me(), body: `just took +${fake}% on a 3AM ape 🚀🚀 trust me bro`, likes: caught ? '3' : '22', reposts: caught ? '0' : '5', larp: caught, verified: blueCheck });
    if (caught) {
      sfx.err();
      addClout(-Math.round(fake * 0.4), -Math.round(fake * 3));
      toast('CAUGHT LARPING. Chart was photoshopped. Clout nuked.', 'bad');
      viralPostIndex.current = null; // No viral traction if caught
    } else {
      sfx.coin();
      addClout(Math.round(fake * 0.5), fake * 4);
      toast(`Larp landed. Nobody checked. Clout +${fmtK(Math.round(fake * 0.5))}`, 'good');
    }
  };

  // 0a. Receive chirps posted from other tabs in real time (offline mode only —
  //     in multiplayer the server echoes chirps to every tab itself).
  //     Payloads are schema-validated + length-capped in sync.ts before they
  //     reach this handler, and React escapes them on render.
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type !== 'CHIRP_POSTED' || useOS.getState().online) return;
      setPosts((prev) => {
        if (viralPostIndex.current !== null) viralPostIndex.current += 1;
        const p: Post = { ...msg.post, likes: '0', reposts: '0' };
        return [p, ...prev].slice(0, 50);
      });
    });
  }, []);

  // 0b. Multiplayer feed: seed with the server's recent chirps, then live-append.
  //     Everything was validated in net.ts; dedupe by server id across reconnects.
  const seenIds = useRef(new Set<number>());
  const toPost = (c: NetChirp): Post => ({
    name: c.name, handle: c.handle, body: c.body, verified: c.verified, larp: c.larp,
    followers: fmtK(c.followers), likes: fmtK(c.likes), reposts: fmtK(c.reposts),
  });
  useEffect(() => {
    if (!online) return;
    const fresh = getNetChirps().filter((c) => !seenIds.current.has(c.id));
    fresh.forEach((c) => seenIds.current.add(c.id));
    if (fresh.length) setPosts((prev) => [...fresh.map(toPost), ...prev].slice(0, 50));
    return onNetChirp((c) => {
      if (seenIds.current.has(c.id)) return;
      seenIds.current.add(c.id);
      sfx.tap();
      setPosts((prev) => {
        if (viralPostIndex.current !== null) viralPostIndex.current += 1;
        return [toPost(c), ...prev].slice(0, 50);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // 1. Inject random new posts over time
  useEffect(() => {
    const interval = setInterval(() => {
      const profile = SIM_PROFILES[Math.floor(Math.random() * SIM_PROFILES.length)];
      const bodyText = SIM_BODIES[Math.floor(Math.random() * SIM_BODIES.length)];
      const newPost: Post = {
        name: profile.name,
        handle: profile.handle,
        followers: profile.followers,
        verified: profile.verified,
        body: bodyText,
        likes: String(Math.floor(Math.random() * 40)),
        reposts: String(Math.floor(Math.random() * 10)),
        shill: Math.random() < 0.25,
      };
      setPosts((prev) => {
        // Shift viral index if we prepended a post
        if (viralPostIndex.current !== null) {
          viralPostIndex.current += 1;
        }
        return [newPost, ...prev].slice(0, 50); // limit to 50 posts
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // 2. Slow incremental likes/reposts ticking on random posts
  useEffect(() => {
    const interval = setInterval(() => {
      setPosts((prev) => {
        if (prev.length === 0) return prev;
        const targetIdx = Math.floor(Math.random() * prev.length);
        return prev.map((p, idx) => {
          if (idx === targetIdx) {
            const likesCount = parseVal(p.likes) + Math.floor(Math.random() * 3) + 1;
            const repCount = parseVal(p.reposts) + (Math.random() < 0.3 ? 1 : 0);
            return { ...p, likes: fmtK(likesCount), reposts: fmtK(repCount) };
          }
          return p;
        });
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 3. Fast viral increment on player's newly created posts
  useEffect(() => {
    const interval = setInterval(() => {
      if (viralPostIndex.current === null) return;
      const targetIdx = viralPostIndex.current;
      setPosts((prev) => {
        if (targetIdx >= prev.length) return prev;
        return prev.map((p, idx) => {
          if (idx === targetIdx) {
            const curL = parseVal(p.likes);
            if (curL > 2500) {
              viralPostIndex.current = null; // stop viral growth
              return p;
            }
            const addL = Math.floor(Math.random() * 40) + 15;
            const addR = Math.floor(addL * 0.25) + 1;
            return { ...p, likes: fmtK(curL + addL), reposts: fmtK(parseVal(p.reposts) + addR) };
          }
          return p;
        });
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="appbar">
        <strong style={{ color: 'var(--ink)' }}>Chirper</strong>
        <span className="sub">// social trenches</span>
        <span className="chstat">☆ {fmtK(clout)} clout · {fmtK(followers)} followers</span>
      </div>
      <div className="chx">
        <div className="composer">
          <span className="cav">{(username?.[0] ?? chosen?.name?.[0] ?? 'U').toUpperCase()}</span>
          <div className="cbox">
            <input className="cin" placeholder="what's cooking, degen?" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') chirp(); }} />
            <div className="crow">
              <div className="cacts">
                <button className="pillbtn flex" title="Post your real PnL (verified)" onClick={flex}>📈 Flex</button>
                <button className="pillbtn larp" title="Fake it. Risky." onClick={larp}>🎭 Larp</button>
              </div>
              <button className="btn gold" onClick={chirp}>Chirp</button>
            </div>
          </div>
        </div>
        <div className="feed">
          {posts.map((p, i) => <PostRow key={i} p={p} />)}
        </div>
      </div>
    </div>
  );
}
