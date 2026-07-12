import { useEffect, useState } from 'react';
import { AppIcon } from '../apps/icons';
import { useIsMobile } from '../hooks/useIsMobile';

// Custom lightweight scroll-reveal wrapper for premium animations
function FadeInWhenVisible({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(ref);
      }
    }, { threshold: 0.1 });
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={setRef}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {children}
    </div>
  );
}

export function Landing() {
  const [active, setActive] = useState('');
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  // Scrollspy: highlight the nav link for the section currently in view
  useEffect(() => {
    const ids = ['about', 'market', 'features', 'screenshots', 'memes'];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  // Enable document scrolling on landing page mount, disable on unmount
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    return () => {
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText('TBA');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      backgroundColor: '#020302',
      color: '#EAF2E6',
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative',
      paddingTop: '72px'
    }}>
      {/* Moving Tech Grid Background */}
      <div className="grid-bg" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Decorative premium radial glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '5%',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(198,237,30,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '30%',
        left: '-10%',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(198,237,30,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* CSS STYLES EMBED */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Remove all underlines globally on the landing page */
        a, a:hover, a:focus, a:active {
          text-decoration: none !important;
        }

        /* Smooth anchor scrolling + offset so sections clear the fixed header */
        html { scroll-behavior: smooth; scroll-padding-top: 96px; }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
        
        @keyframes moving-grid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .grid-bg {
          background-image: 
            linear-gradient(to right, rgba(198, 237, 30, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(198, 237, 30, 0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: moving-grid 30s linear infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(198, 237, 30, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(198, 237, 30, 0); }
          100% { box-shadow: 0 0 0 0 rgba(198, 237, 30, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glow-pulse {
          animation: pulse 2s infinite;
        }
        .nav-link {
          font-size: 14px;
          color: #93A38C;
          font-weight: 500;
          transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-link:hover {
          color: #C6ED1E;
        }
        .mkt-card {
          background: #090C09;
          border: 1px solid rgba(198,237,30,0.08);
          border-radius: 16px;
          padding: 28px;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mkt-card:hover {
          border-color: rgba(198,237,30,0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 30px -10px rgba(198, 237, 30, 0.12);
        }
        .feature-card {
          background: #090C09;
          border: 1px solid rgba(198,237,30,0.07);
          border-radius: 20px;
          padding: 32px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feature-card:hover {
          border-color: rgba(198,237,30,0.25);
          transform: translateY(-4px);
          box-shadow: 0 16px 40px -15px rgba(198, 237, 30, 0.08);
        }
        .gallery-item {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(198,237,30,0.12);
          background: #090C09;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }
        .gallery-item:hover {
          border-color: rgba(198,237,30,0.4);
          transform: translateY(-4px);
          box-shadow: 0 16px 40px -10px rgba(198, 237, 30, 0.2);
        }
        .gallery-item img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gallery-item:hover img {
          transform: scale(1.02);
        }
        .gallery-item .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(2,3,2,0.85) 0%, transparent 60%);
          display: flex;
          align-items: flex-end;
          padding: 20px;
        }

        .meme-item {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(198,237,30,0.08);
          aspect-ratio: 4/3;
          background: #090C09;
        }
        .meme-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .meme-item:hover img {
          transform: scale(1.05);
        }
        .meme-item .tag {
          position: absolute;
          left: 12px;
          bottom: 12px;
          font-family: var(--mono);
          font-size: 10px;
          color: #C6ED1E;
          background: rgba(3,5,3,0.8);
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(198,237,30,0.15);
        }

        /* Marquees */
        @keyframes bots-marq-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes bots-marq-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .marq { overflow: hidden; white-space: nowrap; display: flex; align-items: center; height: 40px; }
        .marq .trk { display: inline-flex; font-family: var(--mono); font-size: 12.5px; font-weight: 700; will-change: transform; }
        .marq .trk span { display: inline-flex; align-items: center; padding-left: 34px; letter-spacing: 0.04em; }
        .marq.top { background: #C6ED1E; color: #161c02; }
        .marq.top .trk { animation: bots-marq-l 34s linear infinite; }
        .marq.mid { background: #090C09; color: #93A38C; border-top: 1px solid rgba(198,237,30,0.1); border-bottom: 1px solid rgba(198,237,30,0.1); }
        .marq.mid .trk { animation: bots-marq-r 30s linear infinite; }
        .marq.mid b.l { color: #C6ED1E; } .marq.mid b.r { color: #F5566E; }
        @media (prefers-reduced-motion: reduce) { .marq .trk { animation: none !important; } }
      `}} />

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(2, 3, 2, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(198,237,30,0.08)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '0 16px' : '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px'
        }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '9px' : '12px', fontWeight: 700, fontSize: isMobile ? '15px' : '18px', color: '#EAF2E6' }}>
            <img src="/Logo.jpeg" alt="Bull of Trench Street" style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(198,237,30,0.2)' }} />
            <span>Bull of <span style={{ color: '#C6ED1E' }}>Trench Street</span></span>
          </a>

          <div style={{ display: isMobile ? 'none' : 'flex', gap: '32px', alignItems: 'center' }}>
            {[
              { id: 'about', label: 'About' },
              { id: 'market', label: 'Market' },
              { id: 'features', label: 'Simulation' },
              { id: 'screenshots', label: 'Gameplay' },
              { id: 'memes', label: 'Memes' },
            ].map((l) => (
              <a key={l.id} href={`#${l.id}`} className="nav-link" style={active === l.id ? { color: '#C6ED1E' } : undefined}>{l.label}</a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <a href="/play" style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: isMobile ? '13px' : '14px',
              padding: isMobile ? '10px 16px' : '12px 24px',
              borderRadius: '12px',
              background: '#C6ED1E',
              color: '#060806',
              boxShadow: '0 8px 24px -6px rgba(198,237,30,0.35)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(198,237,30,0.55)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(198,237,30,0.35)';
            }}>
              Enter the Trenches
            </a>
          </div>
        </div>
      </nav>

      {/* MARQUEE 1 — under nav */}
      <div className="marq top">
        <div className="trk">
          <span>BULL OF TRENCH STREET · THE TRENCHES NEVER CLOSE · GM DEGEN · ON ROBINHOOD CHAIN · TOUCH GRASS · IT'S ALL A SIMULATION ·</span>
          <span aria-hidden="true">BULL OF TRENCH STREET · THE TRENCHES NEVER CLOSE · GM DEGEN · ON ROBINHOOD CHAIN · TOUCH GRASS · IT'S ALL A SIMULATION ·</span>
        </div>
      </div>

      {/* HERO SECTION */}
      <header id="top" className="animate-fade-in" style={{ position: 'relative', padding: isMobile ? '36px 0 44px' : '80px 0 60px', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: isMobile ? '36px' : '60px', alignItems: 'center' }}>
          <div>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#C6ED1E',
              marginBottom: '16px'
            }}>
              DEGEN OS SIMULATION ON ROBINHOOD CHAIN
            </div>
            <h1 style={{
              fontFamily: "'Anton', 'Space Grotesk', sans-serif",
              fontSize: 'clamp(48px, 6.5vw, 84px)',
              lineHeight: 0.95,
              textTransform: 'uppercase',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#EAF2E6',
              margin: '0 0 24px 0'
            }}>
              BULL OF<br />
              <span style={{
                color: '#C6ED1E',
                textShadow: '0 0 40px rgba(198, 237, 30, 0.15)'
              }}>TRENCH STREET</span>
            </h1>
            <p style={{ color: '#93A38C', fontSize: '18px', lineHeight: 1.6, marginBottom: '32px', maxWidth: '540px' }}>
              The definitive retail degen lifecycle, now fully simulated inside a retro-modern WebOS. Build clout, trade simulated bonding curves, and survive target rugs with zero real money lost.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '36px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: '#090C09',
                border: '1px solid rgba(198,237,30,0.12)',
                borderRadius: '12px',
                padding: '10px 16px',
                fontFamily: 'var(--mono)',
                fontSize: '13.5px'
              }}>
                <span style={{ color: '#93A38C' }}>CA:</span>
                <span style={{ fontWeight: 'bold', color: '#EAF2E6' }}>TBA</span>
                <button onClick={handleCopy} style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#C6ED1E',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#090C09',
                border: '1px solid rgba(198,237,30,0.12)',
                borderRadius: '12px',
                padding: '10px 16px',
                fontFamily: 'var(--mono)',
                fontSize: '13.5px'
              }}>
                <span style={{ color: '#93A38C' }}>Chain:</span>
                <span style={{ fontWeight: 'bold', color: '#EAF2E6' }}>Robinhood Chain</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="/play" style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 700,
                fontSize: '15px',
                padding: '16px 36px',
                borderRadius: '14px',
                background: '#C6ED1E',
                color: '#060806',
                boxShadow: '0 8px 24px -6px rgba(198,237,30,0.4)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(198,237,30,0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(198,237,30,0.4)';
              }}>
                Launch OS Interface
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 700,
                fontSize: '15px',
                padding: '16px 32px',
                borderRadius: '14px',
                border: '1px solid rgba(198,237,30,0.15)',
                background: 'rgba(255,255,255,0.02)',
                color: '#EAF2E6',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(198,237,30,0.05)';
                e.currentTarget.style.borderColor = 'rgba(198,237,30,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(198,237,30,0.15)';
              }}>
                Follow on X
              </a>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(198,237,30,0.15)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9), 0 0 50px -10px rgba(198,237,30,0.1)',
              background: '#090C09'
            }}>
              <img src="/banner.jpeg" alt="Bull of Trench Street" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </header>

      {/* MARQUEE 2 — below hero */}
      <div className="marq mid">
        <div className="trk">
          <span><b className="l">▲ SOMEONE JUST 100X'D</b> · <b className="r">▼ SOMEONE JUST GOT LIQUIDATED</b> · LARP YOUR PNL · DIAMOND HANDS · PAPER HANDS · NO FINANCIAL ADVICE · WAGMI · NGMI ·</span>
          <span aria-hidden="true"><b className="l">▲ SOMEONE JUST 100X'D</b> · <b className="r">▼ SOMEONE JUST GOT LIQUIDATED</b> · LARP YOUR PNL · DIAMOND HANDS · PAPER HANDS · NO FINANCIAL ADVICE · WAGMI · NGMI ·</span>
        </div>
      </div>

      {/* ABOUT SECTION */}
      <section id="about" style={{ padding: isMobile ? '60px 0' : '100px 0', borderTop: '1px solid rgba(198,237,30,0.05)' }}>
        <FadeInWhenVisible>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr', gap: isMobile ? '32px' : '60px', alignItems: 'center' }}>
            <div>
              <div style={{
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(198,237,30,0.12)',
                boxShadow: '0 20px 50px -15px rgba(0,0,0,0.8)'
              }}>
                <img src="/screenshots/desktop.jpg" alt="Simulation UI Desktop" style={{ width: '100%', display: 'block' }} />
              </div>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#C6ED1E',
                marginBottom: '12px'
              }}>
                THE CORE METAPHOR
              </div>
              <h2 style={{
                fontFamily: "'Anton', 'Space Grotesk', sans-serif",
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                textTransform: 'uppercase',
                fontWeight: 900,
                lineHeight: 1.0,
                color: '#EAF2E6',
                margin: '0 0 20px 0'
              }}>
                THE HERO OF THE TRENCHES
              </h2>
              <p style={{ color: '#93A38C', fontSize: '16px', lineHeight: 1.7, marginBottom: '16px' }}>
                Every cycle needs its bull. Before the new Robinhood Chain launched, retail trade was a warzone of coordinate rugs, fake pumps, and influencer drama.
              </p>
              <p style={{ color: '#93A38C', fontSize: '16px', lineHeight: 1.7, marginBottom: '24px' }}>
                Bull of Trench Street packages that wild ecosystem into a safe virtual desktop console. Trade simulated tokens, launch pump curves, get targeted by hackers on the fake darkweb, and flex your leaderboard status, all completely free of financial risk.
              </p>
              <a href="/play" style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 700,
                fontSize: '14px',
                padding: '13px 30px',
                borderRadius: '11px',
                background: '#C6ED1E',
                color: '#060806',
                boxShadow: '0 8px 24px -6px rgba(198,237,30,0.4)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(198,237,30,0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(198,237,30,0.4)';
              }}>
                Launch Simulator
              </a>
            </div>
          </div>
        </FadeInWhenVisible>
      </section>

      {/* MARKET LIVE WIDGET */}
      <section id="market" style={{ padding: isMobile ? '56px 0' : '80px 0', background: '#050705', borderTop: '1px solid rgba(198,237,30,0.05)' }}>
        <FadeInWhenVisible>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#C6ED1E',
                marginBottom: '10px'
              }}>
                MARKET CAP & VALUE
              </div>
              <h2 style={{
                fontFamily: "'Anton', 'Space Grotesk', sans-serif",
                fontSize: '38px',
                textTransform: 'uppercase',
                fontWeight: 900,
                color: '#EAF2E6',
                margin: 0
              }}>
                LIVE MARKET STATISTICS
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="mkt-card">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#5E6B58', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, color: '#C6ED1E', marginTop: '12px' }}>TBA</div>
              </div>
              <div className="mkt-card">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#5E6B58', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Market Cap</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, color: '#EAF2E6', marginTop: '12px' }}>TBA</div>
              </div>
              <div className="mkt-card">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#5E6B58', textTransform: 'uppercase', letterSpacing: '0.08em' }}>24h Volume</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, color: '#EAF2E6', marginTop: '12px' }}>TBA</div>
              </div>
              <div className="mkt-card">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#5E6B58', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Liquidity Pool</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, color: '#EAF2E6', marginTop: '12px' }}>Locked</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'var(--mono)', fontSize: '13px', color: '#5E6B58' }}>
              Live chart &amp; contract details display here once the pool is finalized. CA: <span style={{ color: '#C6ED1E' }}>TBA</span>
            </div>
          </div>
        </FadeInWhenVisible>
      </section>

      {/* CORE FEATURES (SIMULATION) */}
      <section id="features" style={{ padding: isMobile ? '60px 0' : '100px 0', borderTop: '1px solid rgba(198,237,30,0.05)' }}>
        <FadeInWhenVisible>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#C6ED1E',
                marginBottom: '10px'
              }}>
                SIMULATED APPS
              </div>
              <h2 style={{
                fontFamily: "'Anton', 'Space Grotesk', sans-serif",
                fontSize: '42px',
                textTransform: 'uppercase',
                fontWeight: 900,
                color: '#EAF2E6',
                margin: 0
              }}>
                SYSTEM OPERATIONS
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? '16px' : '30px' }}>
              {/* Feature 1 */}
              <div className="feature-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px' }}>
                    <AppIcon id="degenfun" />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', background: 'rgba(198,237,30,0.1)', color: '#C6ED1E', padding: '4px 10px', borderRadius: '6px' }}>CORE</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#EAF2E6', marginBottom: '10px' }}>Bonding Curve Trading</h3>
                <p style={{ color: '#93A38C', fontSize: '14.5px', lineHeight: 1.6 }}>
                  Simulate early trading entry on bonding curves. Swap tokens instantly and track your virtual portfolio growth with real-time feedback curves.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px' }}>
                    <AppIcon id="chirper" />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', background: 'rgba(198,237,30,0.1)', color: '#C6ED1E', padding: '4px 10px', borderRadius: '6px' }}>SOCIAL</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#EAF2E6', marginBottom: '10px' }}>Clout & Engagement</h3>
                <p style={{ color: '#93A38C', fontSize: '14.5px', lineHeight: 1.6 }}>
                  Chirp, build clout, and farm engagement with simulated replies. Use fake gains to claim dominance on the native OS leaderboard feeds.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px' }}>
                    <AppIcon id="darkweb" />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', background: 'rgba(245, 86, 110, 0.1)', color: '#F5566E', padding: '4px 10px', borderRadius: '6px' }}>HAZARD</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#EAF2E6', marginBottom: '10px' }}>Security & Drainers</h3>
                <p style={{ color: '#93A38C', fontSize: '14.5px', lineHeight: 1.6 }}>
                  Safeguard your wallet from virtual hacker exploits and malicious scripts sold on the fake darkweb interface. Keep your security parameters in check.
                </p>
              </div>
            </div>
          </div>
        </FadeInWhenVisible>
      </section>

      {/* ACTUAL GAMEPLAY SCREENSHOTS */}
      <section id="screenshots" style={{ padding: isMobile ? '60px 0' : '100px 0', background: '#050705', borderTop: '1px solid rgba(198,237,30,0.05)' }}>
        <FadeInWhenVisible>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#C6ED1E',
                marginBottom: '10px'
              }}>
                IN GAME FOOTAGE
              </div>
              <h2 style={{
                fontFamily: "'Anton', 'Space Grotesk', sans-serif",
                fontSize: '42px',
                textTransform: 'uppercase',
                fontWeight: 900,
                color: '#EAF2E6',
                margin: 0
              }}>
                SIMULATOR IN ACTION
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(480px, 1fr))', gap: isMobile ? '16px' : '32px' }}>
              <div className="gallery-item">
                <img src="/screenshots/desktop.jpg" alt="Desktop OS layout" />
                <div className="overlay">
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#C6ED1E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OS Desktop shell</span>
                </div>
              </div>

              <div className="gallery-item">
                <img src="/screenshots/mobile.jpg" alt="Mobile layout view" />
                <div className="overlay">
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#C6ED1E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile layout engine</span>
                </div>
              </div>

              <div className="gallery-item">
                <img src="/screenshots/trade.jpg" alt="Trade dashboard" />
                <div className="overlay">
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#C6ED1E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bonding curves</span>
                </div>
              </div>

              <div className="gallery-item">
                <img src="/screenshots/chat.jpg" alt="Simulated chats feed" />
                <div className="overlay">
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#C6ED1E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clout feeds</span>
                </div>
              </div>
            </div>
          </div>
        </FadeInWhenVisible>
      </section>

      {/* MEMES SECTION (COMES AFTER GAMEPLAY) */}
      <section id="memes" style={{ padding: isMobile ? '60px 0' : '100px 0', borderTop: '1px solid rgba(198,237,30,0.05)' }}>
        <FadeInWhenVisible>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#C6ED1E',
                marginBottom: '10px'
              }}>
                THE ARCHIVE
              </div>
              <h2 style={{
                fontFamily: "'Anton', 'Space Grotesk', sans-serif",
                fontSize: '42px',
                textTransform: 'uppercase',
                fontWeight: 900,
                color: '#EAF2E6',
                margin: 0
              }}>
                MEME LANDSCAPE
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="meme-item">
                <img src="/memes/meme1.jpg" alt="Meme 1" />
                <span className="tag">MARKET CRASH</span>
              </div>
              <div className="meme-item">
                <img src="/memes/meme2.jpg" alt="Meme 2" />
                <span className="tag">REKT</span>
              </div>
              <div className="meme-item">
                <img src="/memes/meme3.jpg" alt="Meme 3" />
                <span className="tag">THE TRENCHES</span>
              </div>
              <div className="meme-item">
                <img src="/memes/meme4.jpg" alt="Meme 4" />
                <span className="tag">FOMO</span>
              </div>
              <div className="meme-item">
                <img src="/memes/meme5.jpg" alt="Meme 5" />
                <span className="tag">LIQUIDATED</span>
              </div>
              <div className="meme-item">
                <img src="/memes/meme6.jpg" alt="Meme 6" />
                <span className="tag">GM DEGENS</span>
              </div>
            </div>
          </div>
        </FadeInWhenVisible>
      </section>

      {/* DISCLAIMER BOX */}
      <section style={{ padding: '60px 0 20px', borderTop: '1px solid rgba(198,237,30,0.05)' }}>
        <FadeInWhenVisible>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{
              border: '1px dashed rgba(198,237,30,0.18)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              fontSize: '13px',
              fontFamily: 'var(--mono)',
              color: '#5E6B58',
              lineHeight: 1.7
            }}>
              <span style={{ color: '#F5566E', fontWeight: 900 }}>WARNING:</span> Bull of Trench Street is a satirical trading simulation with no real financial utility or expectation of monetary return. We are not affiliated with Robinhood Markets. No real assets, trading transactions, or capital risk are involved. Play solely for enjoyment and entertainment.
            </div>
          </div>
        </FadeInWhenVisible>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(198,237,30,0.06)',
        padding: '48px 0',
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
            <img src="/Logo.jpeg" alt="Bull of Trench Street" style={{ width: '30px', height: '30px', borderRadius: '8px', objectFit: 'cover' }} />
            <span>Bull of Trench Street</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#090C09',
              border: '1px solid rgba(198,237,30,0.12)',
              display: 'grid',
              placeItems: 'center',
              color: '#93A38C',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#C6ED1E';
              e.currentTarget.style.borderColor = '#C6ED1E';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#93A38C';
              e.currentTarget.style.borderColor = 'rgba(198,237,30,0.12)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              𝕏
            </a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer" style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#090C09',
              border: '1px solid rgba(198,237,30,0.12)',
              display: 'grid',
              placeItems: 'center',
              color: '#93A38C',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#C6ED1E';
              e.currentTarget.style.borderColor = '#C6ED1E';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#93A38C';
              e.currentTarget.style.borderColor = 'rgba(198,237,30,0.12)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              TG
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" title="DEX Chart" style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#090C09',
              border: '1px solid rgba(198,237,30,0.12)',
              display: 'grid',
              placeItems: 'center',
              color: '#93A38C',
              fontWeight: 700,
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#C6ED1E';
              e.currentTarget.style.borderColor = '#C6ED1E';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#93A38C';
              e.currentTarget.style.borderColor = 'rgba(198,237,30,0.12)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              DEX
            </a>
          </div>

          <a href="/play" style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontWeight: 700,
            fontSize: '13.5px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: '#C6ED1E',
            color: '#060806',
            transition: 'all 0.2s ease'
          }}>
            Enter Simulation
          </a>
        </div>
      </footer>
    </div>
  );
}
