import { useOS } from '../store/os';

export function Toasts() {
  const toasts = useOS((s) => s.toasts);
  return (
    <div id="toasts">
      {toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}
    </div>
  );
}
