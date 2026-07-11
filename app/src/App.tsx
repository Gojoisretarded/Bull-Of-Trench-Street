import { useEffect, useState, Component, type ReactNode } from 'react';
import { useOS, wipeSave } from './store/os';
import { initNet } from './lib/net';
import { Boot } from './os/Boot';
import { Login } from './os/Login';
import { Desktop } from './os/Desktop';
import { Landing } from './os/Landing';
import { resumeAudio, sfx } from './lib/sound';
import { useIsMobile } from './hooks/useIsMobile';
import { MobileShell } from './os/mobile/MobileShell';

class EB extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error) { (window as any).__ebErr = (err.message || '') + '\n' + (err.stack || ''); }
  render() {
    if (this.state.err) {
      return <pre id="eb" style={{ color: '#F5566E', padding: 20, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
        {this.state.err.message + '\n\n' + (this.state.err.stack || '')}
      </pre>;
    }
    return this.props.children;
  }
}

export function App() {
  const phase = useOS((s) => s.phase);
  const cheater = useOS((s) => s.cheater);
  const chosen = useOS((s) => s.chosen);
  const isMobile = useIsMobile();
  const [route, setRoute] = useState(window.location.pathname);

  // Lightweight routing listener
  useEffect(() => {
    const handlePop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    const onDown = () => resumeAudio();
    window.addEventListener('pointerdown', onDown, { once: true });
    
    // Only connect WebSocket network layer if user is actually in game mode (/play)
    if (route === '/play') {
      initNet();
    }
    
    return () => window.removeEventListener('pointerdown', onDown);
  }, [route]);

  // Play alarm sound if cheater mode is triggered
  useEffect(() => {
    if (!cheater) return;
    sfx.err();
    const id = setInterval(() => sfx.err(), 700);
    return () => clearInterval(id);
  }, [cheater]);

  const resetGame = () => {
    const { username } = useOS.getState();
    if (chosen && username) {
      useOS.getState().choose(chosen, username); // resets starting bag and hashes
    } else {
      wipeSave();
      location.reload();
    }
  };

  // Route: Landing page at /
  if (route !== '/play') {
    return <Landing />;
  }

  return (
    <div id="app">
      {cheater ? (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#0B0204',
          color: '#F5566E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 999999,
          fontFamily: 'monospace',
          textAlign: 'center',
          lineHeight: 1.6
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚨</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 16px 0', textTransform: 'uppercase' }}>
            Memory Tampering Detected
          </h1>
          <div style={{
            background: 'rgba(245, 86, 110, 0.08)',
            border: '1px solid rgba(245, 86, 110, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'left',
            marginBottom: '24px',
            fontSize: '12px',
            color: '#FFB8C2'
          }}>
            <div>[SYS_WARN] INTEGRITY_CHECK_FAILURE</div>
            <div>[SECURITY] EXPECTED_CHECKSUM: MATCH_FAIL</div>
            <div>[STATUS] RUGGING CHEATER ACCOUNT IN PROGRESS...</div>
            <div style={{ marginTop: '12px', color: 'var(--ink)' }}>
              The trench police caught you photoshopping your wallet or altering the local browser memory.
              Degens earn their bags the hard way. Your clout has been nuked and your balance is reset to 0.
            </div>
          </div>
          <button
            onClick={resetGame}
            style={{
              background: '#F5566E',
              color: '#0B0204',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            I promise to trade honestly
          </button>
        </div>
      ) : (
        <EB>
          {phase === 'boot' && <Boot />}
          {phase === 'login' && <Login />}
          {phase === 'desktop' && (isMobile ? <MobileShell /> : <Desktop />)}
        </EB>
      )}
    </div>
  );
}
