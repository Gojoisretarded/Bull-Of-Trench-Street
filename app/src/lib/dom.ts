export const isMobile = () => window.matchMedia('(max-width:720px)').matches;

export function dockIconRect(id: string): { left: number; top: number; width: number; height: number } {
  const el = document.querySelector(`#dock .dk[data-app="${id}"] .ic`)
    ?? document.querySelector('#dk-grid .ic');
  if (el) return el.getBoundingClientRect();
  return { left: window.innerWidth / 2, top: window.innerHeight - 40, width: 44, height: 44 };
}
