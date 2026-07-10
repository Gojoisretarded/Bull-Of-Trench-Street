import { useClock } from '../../hooks/useClock';
import { useOS } from '../../store/os';
import { fmtUsdCompact, fmtK } from '../../lib/format';

export function MobileStatusBar() {
  const { time } = useClock();
  const balance = useOS((s) => s.balance);
  const clout = useOS((s) => s.clout);
  const online = useOS((s) => s.online);
  const onlineCount = useOS((s) => s.onlineCount);
  const admin = useOS((s) => s.admin);

  return (
    <div className="mobile-status-bar">
      <span className="time">{time.replace(/ (AM|PM)/i, '')}</span>
      <span className="r">
        {admin && <span className="adm">⚡ ADMIN</span>}
        {online && <span className="on">● {onlineCount}</span>}
        <span className="clout" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          ★ {fmtK(clout)}
        </span>
        <span className="bal" title={'$' + Math.round(balance).toLocaleString('en-US')}>{fmtUsdCompact(balance)}</span>
      </span>
    </div>
  );
}
