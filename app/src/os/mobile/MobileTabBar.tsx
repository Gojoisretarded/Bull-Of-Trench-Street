import { useOS } from '../../store/os';
import { sfx } from '../../lib/sound';
import { AppIcon } from '../../apps/icons';

export function MobileTabBar() {
  const mobileView = useOS((s) => s.mobileView);
  const overview = useOS((s) => s.overview);
  const { openApp, goHome, toggleOverview } = useOS.getState();

  const handleTabClick = (view: 'home' | 'degenfun' | 'chirper' | 'wallet') => {
    sfx.click();
    if (useOS.getState().overview) {
      toggleOverview(false);
    }
    if (view === 'home') {
      goHome();
    } else {
      openApp(view);
    }
  };

  const isAct = (view: 'home' | 'degenfun' | 'chirper' | 'wallet') => {
    if (overview) return false;
    if (view === 'home') return mobileView === null;
    return mobileView === view;
  };

  return (
    <div className="mobile-tab-bar">
      <button className={isAct('home') ? 'act' : ''} onClick={() => handleTabClick('home')}>
        <span className="ic" style={{ background: 'linear-gradient(135deg, #2F6BC0, #1A4E96)', color: '#fff' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </span>
        <span className="app-title">Home</span>
      </button>
      <button className={isAct('degenfun') ? 'act' : ''} onClick={() => handleTabClick('degenfun')}>
        <span className="ic app-ic">
          <AppIcon id="degenfun" />
        </span>
        <span className="app-title">Market</span>
      </button>
      <button className={isAct('chirper') ? 'act' : ''} onClick={() => handleTabClick('chirper')}>
        <span className="ic app-ic">
          <AppIcon id="chirper" />
        </span>
        <span className="app-title">Chirper</span>
      </button>
      <button className={isAct('wallet') ? 'act' : ''} onClick={() => handleTabClick('wallet')}>
        <span className="ic app-ic">
          <AppIcon id="wallet" />
        </span>
        <span className="app-title">Wallet</span>
      </button>
      <button className={overview ? 'act' : ''} onClick={() => { sfx.click(); toggleOverview(); }}>
        <span className="ic" style={{ background: 'linear-gradient(135deg, #2A313C, #141A23)', color: '#E7ECF3' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </span>
        <span className="app-title">Running</span>
      </button>
    </div>
  );
}
