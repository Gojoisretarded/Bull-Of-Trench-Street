import { useState, useEffect } from 'react';
import { useOS } from '../store/os';
import { sfx } from '../lib/sound';

interface Video {
  id: string;
  title: string;
  uploader: string;
  views: string;
  time: string;
  duration: string;
  likes: string;
  category: string;
  type: 'dump' | 'pump' | 'flat';
  src: string;
}

const VIDEOS: Video[] = [
  {
    id: 'rug-pull',
    title: 'TEENAGE DEVELOPER RUGS $5M LIQUIDITY POOL IN 3 SECONDS (AMATEUR DEV)',
    uploader: 'RugPullRandy',
    views: '840K',
    time: '2 hours ago',
    duration: '0:15',
    likes: '12%',
    category: 'Live Rugs',
    type: 'dump',
    src: '/videos/video1.mp4'
  },
  {
    id: 'liquidated',
    title: 'WATCH DEGEN GET LIQUIDATED AT 100X LEVERAGE ON $WOJAK (BRUTAL)',
    uploader: '0xLiquidated',
    views: '1.2M',
    time: '1 day ago',
    duration: '4:20',
    likes: '99%',
    category: 'Liquidations',
    type: 'dump',
    src: '/videos/video2.mp4'
  },
  {
    id: 'grandma',
    title: 'WATCHING MY GRANDMA APING HER PENSION INTO A NEW SEED COIN',
    uploader: 'HODLGrandma',
    views: '430K',
    time: '5 hours ago',
    duration: '6:12',
    likes: '95%',
    category: 'Loss Porn',
    type: 'dump',
    src: '/videos/video3.mp4'
  },
  {
    id: 'giga-pump',
    title: 'GIGA CANDLE OBLITERATES SHORTERS ON $GRUMP (1000% IN ONE TICK)',
    uploader: 'GigaGM',
    views: '2.1M',
    time: '3 days ago',
    duration: '8:45',
    likes: '97%',
    category: 'Gains',
    type: 'pump',
    src: '/videos/video4.mp4'
  },
  {
    id: 'seedphrase',
    title: 'VIRGIN SEED PHRASE ACCIDENTALLY EXPOSED ON GITHUB STREAM (LEAKED)',
    uploader: 'CodeChud42',
    views: '95K',
    time: '30 mins ago',
    duration: '1:30',
    likes: '45%',
    category: 'Loss Porn',
    type: 'flat',
    src: '/videos/video5.mp4'
  },
  {
    id: 'jeet-dump',
    title: 'JEET DUMPS 50 SOL ON DEGENS CALLING THE BOTTOM (EMOTIONAL)',
    uploader: 'JeetMaster',
    views: '150K',
    time: '6 hours ago',
    duration: '3:05',
    likes: '24%',
    category: 'Loss Porn',
    type: 'dump',
    src: '/videos/video1.mp4'
  }
];

const MOCK_COMMENTS: Record<string, string[]> = {
  'rug-pull': [
    'JeetMaster: OMG I lost my rent on this, dev is a subhuman jeet',
    'SolMaxi: LMFAO he drained it so fast, I love the trenches',
    'Chud_Hunter: absolute masterclass in jeeting',
    'AlphaDegen: is he going to jail or launchpad next?'
  ],
  'liquidated': [
    'MarginCall: RIP his savings, liquidation candle hit to the penny',
    'LeverageLover: 100x is the only way to feel alive',
    'WojakTrader: I am in this video and I do not like it.',
    'GigaChud: play stupid games win stupid liquidations'
  ],
  'grandma': [
    'NepoBaby: based grandma, mine only buys bonds',
    'Grandma_Exit_Liquidity: she has a better risk tolerance than me',
    'PanicSeller: she bought wojak didn\'t she?'
  ],
  'giga-pump': [
    'ShorterCrying: my short got liquidated in 0.1 seconds',
    'GreenCandleEnjoyer: this is art. look at the size of that wick!',
    'BullMarket: we are so back'
  ],
  'seedphrase': [
    'WhiteHat: drained in 4 seconds by an MEV bot',
    'SecPriv: next time do not show the notepad config live chud',
    'LmaoDegen: is the wallet address public? asking for a friend'
  ],
  'jeet-dump': [
    'BottomCall: thank you for your exit liquidity jeet',
    'HODL_Soldier: imagine selling for a 5% gain',
    'JeetMaster: I bought back lower anyway'
  ]
};

export function PumpHub() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  const tabs = ['All', 'Loss Porn', 'Liquidations', 'Live Rugs', 'Gains'];

  const filtered = VIDEOS.filter((v) => {
    const matchTab = activeTab === 'All' || v.category === activeTab;
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
                        v.uploader.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="ph-app">
      <style>{`
        .ph-app {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #000000;
          color: #E2E8F0;
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }
        .ph-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: #111111;
          border-bottom: 1.5px solid #222222;
          gap: 12px;
          flex-shrink: 0;
        }
        .ph-logo {
          display: flex;
          align-items: center;
          font-weight: 900;
          font-size: 18px;
          letter-spacing: -0.04em;
          user-select: none;
          cursor: pointer;
        }
        .ph-logo .orange {
          background: #FF9900;
          color: #000;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 2px;
          font-weight: 900;
        }
        .ph-search-bar {
          flex: 1;
          max-width: 480px;
          position: relative;
        }
        .ph-search-bar input {
          width: 100%;
          background: #1F1F1F;
          border: 1px solid #333333;
          border-radius: 20px;
          padding: 6px 14px;
          color: #fff;
          font-size: 12.5px;
          outline: none;
          box-sizing: border-box;
        }
        .ph-search-bar input:focus {
          border-color: #FF9900;
        }
        .ph-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ph-btn-upload {
          background: transparent;
          border: 1px solid #4A4D53;
          border-radius: 4px;
          color: #A0AEC0;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .ph-btn-upload:hover {
          color: #fff;
          border-color: #fff;
        }
        .ph-badge-premium {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          letter-spacing: 0.05em;
          box-shadow: 0 0 8px rgba(255, 165, 0, 0.4);
        }
        .ph-subnav {
          display: flex;
          gap: 8px;
          padding: 10px 16px;
          background: #0C0C0C;
          border-bottom: 1px solid #1C1D1F;
          overflow-x: auto;
          flex-shrink: 0;
        }
        .ph-tag {
          background: #1C1D1F;
          border: none;
          color: #A0AEC0;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .ph-tag.active {
          background: #FF9900;
          color: #000;
          font-weight: 700;
        }
        .ph-tag:hover:not(.active) {
          background: #2D3136;
          color: #fff;
        }
        .ph-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .ph-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .ph-card {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          background: #161616;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #222222;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .ph-card:hover {
          transform: translateY(-2px);
          border-color: #FF9900;
        }
        .ph-thumb {
          width: 100%;
          height: 120px;
          position: relative;
          background: #000;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
        }
        .ph-thumb-duration {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background: rgba(0,0,0,0.8);
          color: #fff;
          font-size: 10px;
          font-family: monospace;
          padding: 2px 4px;
          border-radius: 2px;
          font-weight: bold;
        }
        .ph-thumb-chart {
          width: 100%;
          height: 100%;
          opacity: 0.85;
          display: flex;
          align-items: flex-end;
          padding: 0 4px;
          gap: 3px;
          box-sizing: border-box;
        }
        .ph-thumb-bar {
          flex: 1;
          border-radius: 1px 1px 0 0;
        }
        .ph-thumb-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ph-thumb-play {
          font-size: 28px;
          color: rgba(255,255,255,0.8);
          transition: transform 0.15s ease;
        }
        .ph-card:hover .ph-thumb-play {
          transform: scale(1.15);
          color: #FF9900;
        }
        .ph-card-info {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ph-card-title {
          font-weight: 700;
          font-size: 12px;
          color: #fff;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 32.4px;
        }
        .ph-card-uploader {
          font-size: 10.5px;
          color: #FF9900;
          font-weight: 600;
        }
        .ph-card-uploader:hover {
          text-decoration: underline;
        }
        .ph-card-stats {
          font-size: 10px;
          color: #718096;
          display: flex;
          justify-content: space-between;
          margin-top: 2px;
        }
        .ph-like-rate {
          color: #34D399;
          font-weight: bold;
        }
        .ph-like-rate.low {
          color: #F5566E;
        }
        .ph-thumb-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #000;
        }

        /* ---- Mobile ---- */
        @media (max-width: 640px) {
          .ph-header { flex-wrap: wrap; padding: 8px 12px; gap: 8px; }
          .ph-logo { font-size: 15px; }
          .ph-search-bar { order: 3; flex-basis: 100%; max-width: none; }
          .ph-header-actions { gap: 8px; }
          .ph-btn-upload { padding: 5px 10px; font-size: 11px; }
          .ph-content { padding: 12px; }
          .ph-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .ph-thumb { height: 92px; }
          .ph-card-info { padding: 7px 8px; }
          .ph-card-title { font-size: 11.5px; height: auto; }
          .ph-card-stats { font-size: 9px; }
        }
      `}</style>

      {/* Header */}
      <div className="ph-header">
        <div className="ph-logo" onClick={() => { sfx.click(); setActiveTab('All'); setSearch(''); }}>
          PUMP<span className="orange">hub</span>
        </div>
        <div className="ph-search-bar">
          <input
            placeholder="Search loss porn, massive rugpulls, liquidation candles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ph-header-actions">
          <button className="ph-btn-upload" onClick={() => { sfx.click(); alert('Multiplayer video uploads coming soon to PumpHub Premium.'); }}>
            Upload
          </button>
          <span className="ph-badge-premium">PREMIUM</span>
        </div>
      </div>

      {/* Subnav tags */}
      <div className="ph-subnav">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={'ph-tag' + (activeTab === tab ? ' active' : '')}
            onClick={() => { sfx.click(); setActiveTab(tab); }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="ph-content">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: '13px' }}>
            No loss porn found matching your search. Try looking for "rug".
          </div>
        ) : (
          <div className="ph-grid">
            {filtered.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                onClick={() => { sfx.coin(); setPlayingVideo(v); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Embedded interactive player modal overlay */}
      {playingVideo && (
        <PlayerModal
          video={playingVideo}
          onClose={() => { sfx.close(); setPlayingVideo(null); }}
        />
      )}
    </div>
  );
}

// Subcomponent: VideoCard
function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  const lowLikes = parseInt(video.likes) < 50;

  return (
    <div className="ph-card" onClick={onClick}>
      <div className="ph-thumb">
        <video className="ph-thumb-video" src={video.src + '#t=0.1'} muted playsInline preload="metadata" />
        <div className="ph-thumb-overlay">
          <span className="ph-thumb-play">▶</span>
        </div>
        <span className="ph-thumb-duration">{video.duration}</span>
      </div>
      <div className="ph-card-info">
        <div className="ph-card-title">{video.title}</div>
        <div className="ph-card-uploader">{video.uploader}</div>
        <div className="ph-card-stats">
          <span>{video.views} views · {video.time}</span>
          <span className={'ph-like-rate' + (lowLikes ? ' low' : '')}>{video.likes}</span>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: PlayerModal
function PlayerModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const [comments, setComments] = useState<string[]>(MOCK_COMMENTS[video.id] || []);

  // Append background bot comment stream over time
  useEffect(() => {
    const chatters = ['AlphaDegen', 'SolWhale', 'MarginKing', 'ChadJeet', 'JeetDetector', 'PaperHandPat'];
    const remarks = [
      'lmaoooo this is epic',
      'f in the chat boys',
      'REKT',
      'im crying right now',
      'i literally sold my bag right before this',
      'is this coin dead?',
      'should I buy the dip?',
      'dev is going to launch another coin in 5 minutes mark my words'
    ];

    const interval = setInterval(() => {
      const randomChatter = chatters[Math.floor(Math.random() * chatters.length)];
      const randomRemark = remarks[Math.floor(Math.random() * remarks.length)];
      setComments((prev) => [...prev, `${randomChatter}: ${randomRemark}`].slice(-8));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ph-modal-overlay">
      <style>{`
        .ph-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }
        .ph-modal {
          width: 100%;
          max-width: 780px;
          background: #111214;
          border-radius: 12px;
          border: 1.5px solid #282A2E;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        .ph-modal-player {
          width: 100%;
          position: relative;
          background: #000;
          aspect-ratio: 16 / 9;
        }
        .ph-modal-canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .ph-player-ctrls {
          position: absolute;
          bottom: 15px;
          left: 15px;
          display: flex;
          gap: 12px;
          z-index: 20;
        }
        .ph-player-btn {
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          color: #fff;
          width: 32px;
          height: 32px;
          font-size: 14px;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .ph-player-btn:hover {
          border-color: #FF9900;
          color: #FF9900;
        }
        .ph-modal-info {
          padding: 16px;
          border-bottom: 1.5px solid #232528;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-shrink: 0;
        }
        .ph-modal-title {
          font-weight: 800;
          font-size: 15px;
          color: #fff;
          line-height: 1.4;
          margin-bottom: 6px;
        }
        .ph-modal-meta {
          font-size: 11.5px;
          color: #A0AEC0;
        }
        .ph-modal-close {
          background: #232528;
          border: none;
          color: #fff;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .ph-modal-close:hover {
          background: #FF9900;
          color: #000;
        }
        .ph-modal-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .ph-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          border-right: 1.5px solid #232528;
          overflow: hidden;
        }
        .ph-chat-header {
          font-size: 11px;
          font-weight: 800;
          color: #FF9900;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }
        .ph-chat-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-family: monospace;
          font-size: 11.5px;
        }
        .ph-chat-msg {
          line-height: 1.35;
          word-break: break-all;
        }
        .ph-chat-author {
          color: #E2E8F0;
          font-weight: bold;
          margin-right: 4px;
        }
        .ph-promo {
          width: 250px;
          padding: 12px 16px;
          background: #15171B;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        .ph-promo-title {
          font-size: 11px;
          font-weight: 800;
          color: #A0AEC0;
        }
        .ph-promo-box {
          background: #1E222A;
          border: 1px dashed #FF9900;
          border-radius: 6px;
          padding: 10px;
          font-size: 11px;
          line-height: 1.4;
          text-align: center;
        }
        .ph-promo-box strong {
          color: #FF9900;
        }
        .ph-modal-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
          display: block;
        }

        /* ---- Mobile ---- */
        @media (max-width: 640px) {
          .ph-modal-overlay { padding: 0; }
          .ph-modal { max-width: 100%; max-height: 100%; height: 100%; border-radius: 0; border: none; }
          .ph-modal-info { padding: 12px; gap: 10px; }
          .ph-modal-title { font-size: 13.5px; }
          .ph-modal-meta { font-size: 10.5px; }
          .ph-modal-body { flex-direction: column; overflow-y: auto; }
          .ph-chat { border-right: none; border-bottom: 1.5px solid #232528; min-height: 150px; }
          .ph-promo { width: 100%; }
        }
      `}</style>

      <div className="ph-modal">
        {/* Real video player */}
        <div className="ph-modal-player">
          <video className="ph-modal-video" src={video.src} controls autoPlay loop playsInline />
        </div>

        {/* Video Info Header */}
        <div className="ph-modal-info">
          <div>
            <div className="ph-modal-title">{video.title}</div>
            <div className="ph-modal-meta">
              Uploaded by <span style={{ color: '#FF9900', fontWeight: 'bold' }}>{video.uploader}</span> · {video.views} views · {video.likes} likes ratio
            </div>
          </div>
          <button className="ph-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body columns */}
        <div className="ph-modal-body">
          {/* Comments section */}
          <div className="ph-chat">
            <div className="ph-chat-header">LIVE TAPE COMMENTS</div>
            <div className="ph-chat-list">
              {comments.map((msg, i) => {
                const parts = msg.split(': ');
                return (
                  <div key={i} className="ph-chat-msg">
                    <span className="ph-chat-author">{parts[0]}:</span>
                    <span style={{ color: '#A0AEC0' }}>{parts.slice(1).join(': ')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advertisement / Promo box */}
          <div className="ph-promo">
            <div className="ph-promo-title">SPONSORED LINKS</div>
            <div className="ph-promo-box">
              🚨 <strong>LOST 99% OF YOUR BAG?</strong> 🚨
              <div style={{ marginTop: '6px', color: '#CBD5E0' }}>
                Double your leverage on the Dark Web! Leverage rates up to 500x.
              </div>
            </div>
            <div className="ph-promo-box" style={{ borderColor: 'var(--green)' }}>
              🟢 <strong>10,000 FOLLOWERS INSTANT</strong> 🟢
              <div style={{ marginTop: '6px', color: '#CBD5E0' }}>
                Buy followers in the Shop now to larp your exits better!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
