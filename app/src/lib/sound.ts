// Synthesised UI sound effects — WebAudio, no asset files.
let AC: AudioContext | null = null;
let muted = false;

function ctx(): AudioContext | null {
  if (!AC) {
    try { AC = new (window.AudioContext || (window as any).webkitAudioContext)(); }
    catch { return null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }
export function resumeAudio() { ctx(); }

function beep(freq: number, dur = 0.09, type: OscillatorType = 'sine', vol = 0.05) {
  if (muted) return;
  const c = ctx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = 0; o.connect(g); g.connect(c.destination);
  const t = c.currentTime;
  g.gain.linearRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => beep(520, 0.05, 'triangle', 0.04),
  open: () => { beep(440, 0.08, 'sine', 0.05); setTimeout(() => beep(660, 0.09, 'sine', 0.05), 60); },
  close: () => { beep(400, 0.07, 'sine', 0.045); setTimeout(() => beep(280, 0.09, 'sine', 0.045), 55); },
  err: () => beep(150, 0.16, 'sawtooth', 0.05),
  coin: () => { beep(720, 0.06, 'square', 0.035); setTimeout(() => beep(960, 0.09, 'square', 0.035), 55); },
  tap: () => beep(340, 0.04, 'triangle', 0.03),
  ov: () => beep(560, 0.07, 'sine', 0.04),
};
