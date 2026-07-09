// Compact number formatting: 1200 -> "1.2K", 3_400_000 -> "3.4M"
export function fmtK(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(n));
}

// Currency display: fmtBal(5) -> "$5.00"
export function fmtBal(n: number): string {
  return '$' + Math.abs(n).toFixed(2);
}
