import { useEffect, useRef } from 'react';

export function Sparkline({ data, up, fill, width = 72, height = 26, style }:
  { data: number[]; up: boolean; fill?: boolean; width?: number; height?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const W = cv.width, H = cv.height, pad = 3;
    ctx.clearRect(0, 0, W, H);
    const mn = Math.min(...data), mx = Math.max(...data), rg = (mx - mn) || 1;
    const col = up ? '#34D399' : '#F5566E';
    const pt = (v: number, i: number): [number, number] =>
      [pad + (i / (data.length - 1)) * (W - pad * 2), H - pad - ((v - mn) / rg) * (H - pad * 2)];
    ctx.beginPath();
    data.forEach((v, i) => { const [x, y] = pt(v, i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    if (fill) {
      ctx.lineTo(W - pad, H); ctx.lineTo(pad, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00');
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath();
      data.forEach((v, i) => { const [x, y] = pt(v, i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    }
    ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    const [lx, ly] = pt(data[data.length - 1], data.length - 1);
    ctx.beginPath(); ctx.arc(lx, ly, 2, 0, 7); ctx.fillStyle = col; ctx.fill();
  }, [data, up, fill]);
  return <canvas ref={ref} width={width} height={height} style={style} />;
}
