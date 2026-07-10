import type { AppId } from '../os/types';
import { FLAVOR } from './registry';
import { AppIcon } from './icons';
import { DegenFun } from './DegenFun';
import { DegenFunMobile } from './DegenFunMobile';
import { useIsMobile } from '../hooks/useIsMobile';
import { Chirper } from './Chirper';
import { Wallet } from './Wallet';
import { Terminal } from './Terminal';
import { DarkWeb } from './DarkWeb';
import { Launchpad } from './Launchpad';
import { ChudMail } from './ChudMail';
import { Files } from './Files';
import { Gamble } from './Gamble';
import { Internet } from './Internet';
import { Settings } from './Settings';
import { Wallpapers } from './Wallpapers';
import { PumpHub } from './PumpHub';

function Flavor({ id }: { id: AppId }) {
  return (
    <div className="flavor">
      <span className="fbig"><AppIcon id={id} /></span>
      {FLAVOR[id] ?? 'Coming soon to the trenches.'}
    </div>
  );
}

export function AppBody({ id }: { id: AppId }) {
  const isMobile = useIsMobile();
  switch (id) {
    case 'degenfun': return isMobile ? <DegenFunMobile /> : <DegenFun />;
    case 'chirper': return <Chirper />;
    case 'wallet': return <Wallet />;
    case 'terminal': return <Terminal />;
    case 'darkweb': return <DarkWeb />;
    case 'launchpad': return <Launchpad />;
    case 'chudmail': return <ChudMail />;
    case 'files': return <Files />;
    case 'gamble': return <Gamble />;
    case 'internet': return <Internet />;
    case 'settings': return <Settings />;
    case 'wallpapers': return <Wallpapers />;
    case 'pumphub': return <PumpHub />;
    default: return <Flavor id={id} />;
  }
}
