/**
 * Range feedback: vibration where the browser supports it (Android Chrome),
 * otherwise a synthesised "ball rolls and drops into the cup" sound (Web Audio, no sample file → no licence issue).
 * iOS needs the AudioContext to be created/resumed inside a user tap: call unlockAudio() from the Start button.
 */
let ctx: AudioContext | null = null;

export function unlockAudio() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  // play a silent blip so iOS fully unlocks output
  const o = ctx.createOscillator(); const g = ctx.createGain(); g.gain.value = 0; o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.01);
}

export function canVibrate() { return typeof navigator !== 'undefined' && 'vibrate' in navigator; }

export function cupSound() {
  if (!ctx) return;
  const t = ctx.currentTime;
  // 1) roll: band-passed noise, fading in pitch and level
  const len = 0.9, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const noise = ctx.createBufferSource(); noise.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2;
  bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(400, t + len);
  const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.25, t + 0.15); ng.gain.exponentialRampToValueAtTime(0.0001, t + len);
  noise.connect(bp).connect(ng).connect(ctx.destination); noise.start(t);
  // 2) rattle against the cup liner: three short knocks
  [0.95, 1.05, 1.12].forEach((dt, i) => knock(t + dt, 1400 - i * 250, 0.35 - i * 0.08));
  // 3) final drop: low thunk
  knock(t + 1.22, 180, 0.5, 0.18);
}

function knock(at: number, freq: number, level: number, dur = 0.05) {
  if (!ctx) return;
  const o = ctx.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(freq, at); o.frequency.exponentialRampToValueAtTime(freq * 0.5, at + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(level, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ctx.destination); o.start(at); o.stop(at + dur + 0.02);
}

/** Time limit or station change. */
export function signal(kind: 'limit' | 'station' = 'limit') {
  if (canVibrate() && navigator.vibrate(kind === 'limit' ? [300, 120, 300, 120, 500] : [120])) return;
  cupSound();
}

let lock: WakeLockSentinel | null = null;
export async function keepAwake(on: boolean) {
  try {
    if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
    if (!on) { await lock?.release(); lock = null; }
  } catch { /* not supported or denied: ignore */ }
}
