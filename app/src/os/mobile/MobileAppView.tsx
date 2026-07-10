import { useOS } from '../../store/os';
import { AppBody } from '../../apps/AppBody';
import { APP_META } from '../../apps/registry';
import type { AppId } from '../types';

export function MobileAppView({ id }: { id: AppId }) {
  const mobileBack = useOS((s) => s.mobileBack);
  const clout = useOS((s) => s.clout);

  const title = APP_META[id]?.title || id;

  const renderHeaderRight = () => {
    switch (id) {
      case 'chirper':
        return <span style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--mono)' }}>★ {clout.toLocaleString()}</span>;
      case 'darkweb':
        return <span style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--mono)' }}>3 sellers</span>;
      case 'gamble':
        return (
          <span style={{ color: 'var(--red)', fontSize: '11.5px', fontFamily: 'var(--mono)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 6px var(--red)' }} />
            LIVE
          </span>
        );
      default:
        return null;
    }
  };

  // We let DegenFunMobile handle its own header to manage coin details / list views
  const showDefaultHeader = id !== 'degenfun';

  return (
    <div className="mobile-app-view">
      {showDefaultHeader && (
        <div className="apphead">
          <button className="bk" onClick={mobileBack}>‹</button>
          <b>{title}</b>
          <div style={{ marginLeft: 'auto' }}>
            {renderHeaderRight()}
          </div>
        </div>
      )}
      <div className="mobile-app-body">
        <AppBody id={id} />
      </div>
    </div>
  );
}
