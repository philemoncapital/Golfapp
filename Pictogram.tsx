import type { Drill } from '../engine/types';

/** Declarative pictogram spec. Coordinates in metres: x = across (0 = centre line), y = distance from the start point. */
export type El =
  | { t: 'tee' | 'ball' | 'station'; x: number; y: number; label?: string; active?: boolean }
  | { t: 'hole' | 'flag'; x: number; y: number }
  | { t: 'corridor' | 'zone'; x: number; y: number; w: number; h: number; label?: string }
  | { t: 'ring'; x: number; y: number; r: number; label?: string }
  | { t: 'green' | 'bunker'; x: number; y: number; rx: number; ry: number }
  | { t: 'arrow'; from: [number, number]; to: [number, number]; bend?: number; muted?: boolean }
  | { t: 'label'; x: number; y: number; text: string };
export interface Spec { w: number; h: number; els: El[] }

const C = { line: 'var(--muted)', text: 'var(--text-2)', accent: 'var(--accent)', green: 'var(--green-fill)', sand: 'var(--sand-fill)' };

export function Pictogram({ drill, size = 'lg', activeStation }: { drill: Drill; size?: 'sm' | 'lg'; activeStation?: number }) {
  const spec = SPECS[drill.id] ?? fallback(drill);
  const W = 300, H = size === 'sm' ? 150 : 300;
  const pad = 18, sx0 = (W - 2 * pad) / spec.w, sy = (H - 2 * pad) / spec.h, s = Math.min(sx0, sy);
  // Schematic, not to scale across: long-game drills are stretched sideways (max 4×) so they stay readable.
  const sx = Math.min(sx0, s * 4);
  const X = (x: number) => W / 2 + x * sx;
  const Y = (y: number) => H - pad - y * sy;
  const sw = size === 'sm' ? 1.5 : 2;
  let station = 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={drill.title} style={{ display: 'block' }}>
      {spec.els.map((e, i) => {
        switch (e.t) {
          case 'green': return <ellipse key={i} cx={X(e.x)} cy={Y(e.y)} rx={e.rx * sx} ry={e.ry * sy} fill={C.green} />;
          case 'bunker': return <ellipse key={i} cx={X(e.x)} cy={Y(e.y)} rx={e.rx * sx} ry={e.ry * sy} fill={C.sand} />;
          case 'corridor':
          case 'zone': return (
            <g key={i}>
              <rect x={X(e.x - e.w / 2)} y={Y(e.y + e.h)} width={e.w * sx} height={e.h * sy} rx={4} fill={e.t === 'zone' ? 'var(--accent-soft)' : 'none'} stroke={C.accent} strokeWidth={sw * 0.75} strokeDasharray="5 4" />
              {e.label && size === 'lg' && <text x={X(e.x + e.w / 2) + 6} y={Y(e.y + e.h / 2) + 4} fontSize="11" fill={C.text}>{e.label}</text>}
            </g>);
          case 'ring': return (
            <g key={i}>
              <circle cx={X(e.x)} cy={Y(e.y)} r={e.r * s} fill="none" stroke={C.line} strokeWidth={sw * 0.75} strokeDasharray="3 4" />
              {e.label && size === 'lg' && <text x={X(e.x) + e.r * s + 4} y={Y(e.y) - 2} fontSize="11" fill={C.text}>{e.label}</text>}
            </g>);
          case 'hole': return <circle key={i} cx={X(e.x)} cy={Y(e.y)} r={5} fill="var(--bg)" stroke="var(--text)" strokeWidth={sw} />;
          case 'flag': return (
            <g key={i} stroke="var(--text)" strokeWidth={sw}>
              <circle cx={X(e.x)} cy={Y(e.y)} r={4} fill="var(--bg)" />
              <path d={`M${X(e.x)} ${Y(e.y)}V${Y(e.y) - 22}l12 5-12 5`} fill="none" strokeLinejoin="round" />
            </g>);
          case 'arrow': {
            const [x1, y1] = [X(e.from[0]), Y(e.from[1])], [x2, y2] = [X(e.to[0]), Y(e.to[1])];
            const mx = (x1 + x2) / 2 + (e.bend ?? 0) * sx, my = (y1 + y2) / 2;
            const ang = Math.atan2(y2 - my, x2 - mx), a = 7;
            const col = e.muted ? C.line : C.accent;
            return (
              <g key={i} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round">
                <path d={`M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`} />
                <path d={`M${x2 - a * Math.cos(ang - 0.45)} ${y2 - a * Math.sin(ang - 0.45)}L${x2} ${y2}L${x2 - a * Math.cos(ang + 0.45)} ${y2 - a * Math.sin(ang + 0.45)}`} />
              </g>);
          }
          case 'tee':
          case 'ball':
          case 'station': {
            const idx = e.t === 'station' ? station++ : -1;
            const active = e.active || (idx >= 0 && idx === activeStation);
            return (
              <g key={i}>
                <circle cx={X(e.x)} cy={Y(e.y)} r={active ? 6 : e.t === 'tee' ? 3 : 4} fill={active ? C.accent : e.t === 'ball' ? 'var(--text)' : 'var(--bg)'} stroke={active ? C.accent : 'var(--text-2)'} strokeWidth={1.5} />
                {e.label && size === 'lg' && <text x={X(e.x) + 10} y={Y(e.y) + 4} fontSize="11" fill={active ? C.accent : C.text}>{e.label}</text>}
              </g>);
          }
          case 'label': return size === 'lg' ? <text key={i} x={X(e.x)} y={Y(e.y)} fontSize="11" fill={C.text} textAnchor="middle">{e.text}</text> : null;
        }
      })}
    </svg>
  );
}

const line = (n: number, step: number, from = step, prefix = '') =>
  Array.from({ length: n }, (_, i) => ({ t: 'station' as const, x: 0, y: from + i * step, label: `${prefix}${from + i * step} m` }));

export const SPECS: Record<string, Spec> = {
  'hit-the-hall': { w: 6, h: 12, els: [
    { t: 'corridor', x: 0, y: 10, w: 0.9 * 2.5, h: 0.9, label: '+1 · 90 cm' }, { t: 'hole', x: 0, y: 10 },
    { t: 'arrow', from: [0, 0.3], to: [0, 9.7] },
    ...[8, 6, 4, 2, 0].map((y) => ({ t: 'station' as const, x: 0, y, label: `${10 - y} m` })),
  ] },
  'circle-putting': { w: 3, h: 3, els: [
    { t: 'hole', x: 0, y: 1.5 }, { t: 'ring', x: 0, y: 1.5, r: 0.9, label: '90 cm' },
    ...Array.from({ length: 8 }, (_, i) => ({ t: 'tee' as const, x: 0.9 * Math.cos((i * Math.PI) / 4), y: 1.5 + 0.9 * Math.sin((i * Math.PI) / 4) })),
    { t: 'arrow', from: [0, 0.6], to: [0, 1.38] },
  ] },
  'around-the-world': { w: 3.4, h: 3.4, els: [
    { t: 'hole', x: 0, y: 1.7 }, { t: 'ring', x: 0, y: 1.7, r: 0.9, label: '90 cm' }, { t: 'ring', x: 0, y: 1.7, r: 1.2, label: '120 cm' },
    ...[0, 1, 2, 3].flatMap((k) => [0.9, 1.2].map((r) => ({ t: 'tee' as const, x: r * Math.cos((k * Math.PI) / 2 - Math.PI / 2), y: 1.7 + r * Math.sin((k * Math.PI) / 2 - Math.PI / 2) }))),
  ] },
  'pace-putting': { w: 4, h: 10.5, els: [
    { t: 'zone', x: 0, y: 9.7, w: 1.2, h: 0.9, label: '30 / 60 cm' }, { t: 'hole', x: 0, y: 10 },
    { t: 'arrow', from: [0, 1.2], to: [0, 9.6] },
    ...[1, 2.5, 4, 5.5].map((y) => ({ t: 'station' as const, x: 0, y, label: `${10 - y - 0.5} m` })),
  ] },
  'hit-the-spot': { w: 4, h: 11, els: [
    { t: 'zone', x: 0, y: 4, w: 2, h: 2, label: '4–6 m' }, { t: 'zone', x: 0, y: 6, w: 2, h: 2, label: '6–8 m' }, { t: 'zone', x: 0, y: 8, w: 2, h: 2, label: '8–10 m' },
    { t: 'ball', x: 0, y: 0 }, { t: 'arrow', from: [0, 0.2], to: [0, 5], bend: -0.4 }, { t: 'arrow', from: [0, 0.2], to: [0, 7], bend: -0.6, muted: true }, { t: 'arrow', from: [0, 0.2], to: [0, 9], bend: -0.8, muted: true },
  ] },
  '14-fairways': { w: 50, h: 240, els: [
    { t: 'corridor', x: 0, y: 150, w: 30, h: 80, label: '30 m' }, { t: 'tee', x: 0, y: 0 },
    { t: 'arrow', from: [0, 2], to: [-4, 205], bend: -8 }, { t: 'arrow', from: [0, 2], to: [3, 150], bend: 5, muted: true },
    { t: 'label', x: 0, y: 140, text: 'min. 150 m' },
  ] },
  'fade-and-draw': { w: 50, h: 230, els: [
    { t: 'corridor', x: 0, y: 190, w: 30, h: 30, label: '30 m' }, { t: 'tee', x: 0, y: 0 }, { t: 'station', x: 0, y: 10, label: 'Stick 10 m' },
    { t: 'arrow', from: [0, 2], to: [-2, 205], bend: -26 }, { t: 'arrow', from: [0, 2], to: [2, 205], bend: 26 },
  ] },
  'hit-three-greens': { w: 70, h: 175, els: [
    { t: 'green', x: -18, y: 100, rx: 10, ry: 7 }, { t: 'flag', x: -18, y: 100 },
    { t: 'green', x: 18, y: 130, rx: 13, ry: 8 }, { t: 'flag', x: 18, y: 130 },
    { t: 'green', x: -8, y: 160, rx: 16, ry: 9 }, { t: 'flag', x: -8, y: 160 },
    { t: 'tee', x: 0, y: 0 }, { t: 'arrow', from: [0, 2], to: [-18, 96] }, { t: 'arrow', from: [0, 2], to: [18, 126], muted: true }, { t: 'arrow', from: [0, 2], to: [-8, 156], muted: true },
    { t: 'label', x: -18, y: 84, text: '100 m' }, { t: 'label', x: 26, y: 114, text: '130 m' }, { t: 'label', x: 14, y: 168, text: '160 m' },
  ] },
};

/** Generic pictogram until the drill-specific one exists (Phase 2 builds all 25). */
function fallback(d: Drill): Spec {
  if (d.area === 'putting') return { w: 4, h: 10, els: [{ t: 'hole', x: 0, y: 8 }, { t: 'ring', x: 0, y: 8, r: 0.9 }, { t: 'ball', x: 0, y: 1 }, { t: 'arrow', from: [0, 1.3], to: [0, 7.7] }] };
  if (d.area === 'bunker') return { w: 16, h: 14, els: [{ t: 'bunker', x: 0, y: 3, rx: 6, ry: 3 }, { t: 'green', x: 0, y: 10, rx: 7, ry: 3.5 }, { t: 'flag', x: 1, y: 10.5 }, { t: 'ball', x: -1, y: 2.5 }, { t: 'arrow', from: [-1, 3], to: [1, 10], bend: -2 }] };
  if (d.area === 'chipping' || d.area === 'pitching') {
    const far = d.area === 'pitching' ? 30 : 12;
    return { w: far * 0.9, h: far * 1.2, els: [{ t: 'green', x: 0, y: far, rx: far * 0.35, ry: far * 0.18 }, { t: 'flag', x: 0, y: far }, ...line(3, far / 4, far / 4).map((s) => ({ ...s, y: far - s.y })), { t: 'arrow', from: [0, far / 4 + 0.3], to: [0, far - 0.5], bend: -far * 0.06 }] };
  }
  return { w: 50, h: 220, els: [{ t: 'corridor', x: 0, y: 150, w: 30, h: 60 }, { t: 'tee', x: 0, y: 0 }, { t: 'arrow', from: [0, 2], to: [0, 200] }] };
}
