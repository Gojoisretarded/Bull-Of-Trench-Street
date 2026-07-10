import { useState, useEffect, useRef } from 'react';
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
    type: 'dump'
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
    type: 'dump'
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
    type: 'dump'
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
    type: 'pump'
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
    type: 'flat'
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
    type: 'dump'
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

  // Generate mockup mini candle charts for thumbnails
  const bars = Array.from({ length: 18 }, (_, i) => {
    let height = 30 + Math.sin(i * 0.4) * 20 + Math.random() * 15;
    if (video.type === 'dump') {
      height = Math.max(8, 80 - i * 4.5 + (Math.random() - 0.5) * 15);
      if (i > 14) height = 6; // rug flatline
    } else if (video.type === 'pump') {
      height = Math.max(8, 15 + i * 4.5 + (Math.random() - 0.5) * 15);
    }
    const color = video.type === 'dump' ? (i > 14 ? '#F5566E' : 'rgba(245, 86, 110, 0.6)') : video.type === 'pump' ? 'rgba(52, 211, 153, 0.6)' : 'rgba(160, 174, 192, 0.4)';
    return (
      <div
        key={i}
        className="ph-thumb-bar"
        style={{
          height: `${height}%`,
          background: color
        }}
      />
    );
  });

  return (
    <div className="ph-card" onClick={onClick}>
      <div className="ph-thumb">
        <div className="ph-thumb-chart">{bars}</div>
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [comments, setComments] = useState<string[]>(MOCK_COMMENTS[video.id] || []);
  const [isPlaying, setIsPlaying] = useState(true);

  // Canvas-based real-time simulation player
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animeId: number;
    let ticks = 0;
    const pricePoints: number[] = [];

    // Initialize chart line starting price
    let currentPrice = video.type === 'pump' ? 100 : 1000;

    const render = () => {
      if (!isPlaying) {
        animeId = requestAnimationFrame(render);
        return;
      }
      ticks++;

      // Canvas setup
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#060708';
      ctx.fillRect(0, 0, w, h);

      // Simulate trading behavior
      let drift = 0;
      let noise = (Math.random() - 0.5) * 35;

      if (video.id === 'rug-pull') {
        if (ticks < 120) {
          drift = 8; // pump it up
        } else if (ticks >= 120 && ticks < 130) {
          drift = -currentPrice * 0.45; // INSTANT CRASH
          noise = 0;
        } else {
          drift = 0;
          currentPrice = 1.2; // flatline
          noise = 0;
        }
      } else if (video.id === 'liquidated') {
        if (ticks < 150) {
          drift = -2.5; // slow bleeder down
        } else if (ticks >= 150 && ticks < 155) {
          currentPrice = 0.5; // LIQUIDATION DROP
          drift = 0;
          noise = 0;
        } else {
          drift = 0.2;
          noise = (Math.random() - 0.5) * 0.1;
        }
      } else if (video.type === 'pump') {
        drift = 4.5; // continuous mooning
      } else {
        drift = -1.2; // regular bleeder
      }

      currentPrice = Math.max(0.5, currentPrice + drift + noise);
      pricePoints.push(currentPrice);
      if (pricePoints.length > 120) pricePoints.shift();

      // Draw Grid Lines
      ctx.strokeStyle = '#151719';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = (h / 5) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw the chart path
      if (pricePoints.length > 1) {
        const min = Math.min(...pricePoints);
        const max = Math.max(...pricePoints);
        const diff = max - min || 1;

        ctx.beginPath();
        const startY = h - 20 - ((pricePoints[0] - min) / diff) * (h - 40);
        ctx.moveTo(0, startY);

        for (let i = 1; i < pricePoints.length; i++) {
          const x = (w / (pricePoints.length - 1)) * i;
          const y = h - 20 - ((pricePoints[i] - min) / diff) * (h - 40);
          ctx.lineTo(x, y);
        }

        const isPump = pricePoints[pricePoints.length - 1] >= pricePoints[0];
        ctx.strokeStyle = isPump ? '#34D399' : '#F5566E';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Fill area under line
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, isPump ? 'rgba(52,211,153,0.15)' : 'rgba(245,86,110,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Print Current Price text overlay
        ctx.fillStyle = isPump ? '#34D399' : '#F5566E';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`$${currentPrice.toFixed(2)}`, w - 110, 35);
      }

      // Draw Video Progress Bar Mock
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(10, h - 10, w - 20, 3);
      const prog = (ticks % 300) / 300;
      ctx.fillStyle = '#FF9900';
      ctx.fillRect(10, h - 10, (w - 20) * prog, 3);

      // Flash "LIVE" badge if rug pull
      if (video.id === 'rug-pull') {
        const isCrash = ticks >= 120 && ticks < 135;
        ctx.fillStyle = isCrash ? '#F5566E' : '#FF9900';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(isCrash ? '⚡ RUG PULLING ⚡' : '● DEV STREAM', 20, 30);
      } else if (video.id === 'liquidated' && ticks >= 145 && ticks < 165) {
        ctx.fillStyle = '#F5566E';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('🚨 LIQUIDATING 100x SHORT...', 20, 30);
      } else {
        ctx.fillStyle = '#A0AEC0';
        ctx.font = '10px monospace';
        ctx.fillText('1080p HD  ●  SIMULATED TAPE', 20, 28);
      }

      // Loop video
      if (ticks >= 300) ticks = 0;

      animeId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animeId);
  }, [video, isPlaying]);

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
      `}</style>

      <div className="ph-modal">
        {/* Mock Screen Player */}
        <div className="ph-modal-player">
          <canvas ref={canvasRef} width="640" height="360" className="ph-modal-canvas" />
          <div className="ph-player-ctrls">
            <button className="ph-player-btn" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>
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
