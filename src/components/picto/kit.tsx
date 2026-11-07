/**
 * Pictogram kit (section 7, revised): illustrated top-down scenes on a 320×200 canvas.
 * Forward = up. Not to scale; distances are written on tags. All parts are plain SVG, styled with theme tokens.
 */
import { useId, type ReactNode } from 'react';

export const VW = 320, VH = 200;
export interface Ctx { sm: boolean; active?: number }

/** Unique, stable gradient ids per rendered pictogram (several pictograms share one page). */
export const useIds = () => { const n = useId().replace(/[^a-zA-Z0-9]/g, ''); return (k: string) => `pg${n}-${k}`; };

// ---------- surfaces ----------
export function Defs({ id }: { id: (k: string) => string }) {
  return (
    <defs>
      <linearGradient id={id('range')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1A3226" /><stop offset="1" stopColor="#11211A" />
      </linearGradient>
      <pattern id={id('stripes')} width="40" height="200" patternUnits="userSpaceOnUse">
        <rect width="20" height="200" fill="rgba(255,255,255,0.025)" />
      </pattern>
      <radialGradient id={id('green')} cx="0.5" cy="0.45" r="0.6">
        <stop offset="0" stopColor="#2C5A40" /><stop offset="1" stopColor="#1D3D2C" />
      </radialGradient>
      <radialGradient id={id('sand')} cx="0.5" cy="0.4" r="0.65">
        <stop offset="0" stopColor="#4A3F2C" /><stop offset="1" stopColor="#332B1E" />
      </radialGradient>
      <pattern id={id('grain')} width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="2" r="0.7" fill="rgba(255,230,170,0.22)" /><circle cx="5" cy="5.5" r="0.6" fill="rgba(255,230,170,0.16)" />
      </pattern>
      <radialGradient id={id('ball')} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#C9CDD3" />
      </radialGradient>
      <marker id={id('arrow')} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0,1 L9,5 L0,9 z" fill="var(--accent)" />
      </marker>
      <marker id={id('arrowMuted')} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0,1 L9,5 L0,9 z" fill="var(--text-2)" />
      </marker>
    </defs>
  );
}

export const Range = ({ id }: { id: (k: string) => string }) => (
  <g><rect width={VW} height={VH} fill={`url(#${id('range')})`} /><rect width={VW} height={VH} fill={`url(#${id('stripes')})`} /></g>
);
/** Short-game scene: rough/fringe background. */
export const Rough = () => <rect width={VW} height={VH} fill="#14231B" />;

export function Green({ id, cx, cy, rx, ry, rot = 0 }: { id: (k: string) => string; cx: number; cy: number; rx: number; ry: number; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx={rx + 7} ry={ry + 6} fill="#22432F" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id('green')})`} stroke="rgba(155,227,195,0.25)" strokeWidth="1" />
    </g>
  );
}
export function Bunker({ id, cx, cy, rx, ry, rot = 0 }: { id: (k: string) => string; cx: number; cy: number; rx: number; ry: number; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id('sand')})`} stroke="#5C4E35" strokeWidth="1.5" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id('grain')})`} />
    </g>
  );
}
/** Corridor between two marker flags (fairway band). */
export function Corridor({ x, y, w, h, label, ctx }: { x: number; y: number; w: number; h: number; label?: string; ctx: Ctx }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="10" fill="rgba(155,227,195,0.08)" stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="6 5" />
      <MarkerFlag x={x} y={y + h * 0.35} /><MarkerFlag x={x + w} y={y + h * 0.35} />
      {label && <Dim x1={x} x2={x + w} y={y - 9} label={label} ctx={ctx} />}
    </g>
  );
}

// ---------- objects ----------
export const Ball = ({ x, y, r = 4.5 }: { x: number; y: number; r?: number }) => (
  <g><circle cx={x + 0.8} cy={y + 1.2} r={r} fill="rgba(0,0,0,0.35)" /><circle cx={x} cy={y} r={r} fill="#F4F5F7" /><circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#FFFFFF" /></g>
);
export function TeeBall({ x, y, ctx }: { x: number; y: number; ctx: Ctx }) {
  return (
    <g>
      <rect x={x - 9} y={y - 3} width="18" height="6" rx="3" fill="rgba(0,0,0,0.25)" />
      <circle cx={x} cy={y} r="2.6" fill="#E8C27A" />
      <Ball x={x} y={y - 1} r={ctx.sm ? 5 : 4.5} />
    </g>
  );
}
/** Small tee peg used as a position marker. */
export const Peg = ({ x, y, color = '#F2F3F5' }: { x: number; y: number; color?: string }) => (
  <g><circle cx={x} cy={y} r="3.4" fill="rgba(0,0,0,0.35)" /><circle cx={x} cy={y} r="2.4" fill={color} /></g>
);
export function Hole({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return <g><circle cx={x} cy={y} r={r + 1.5} fill="rgba(255,255,255,0.18)" /><circle cx={x} cy={y} r={r} fill="#06080A" /></g>;
}
export function Flag({ x, y, h = 30, color = 'var(--accent)' }: { x: number; y: number; h?: number; color?: string }) {
  return (
    <g>
      <Hole x={x} y={y} r={3.6} />
      <line x1={x + 3} y1={y + 2} x2={x + 10} y2={y + 4} stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinecap="round" />
      <line x1={x} y1={y} x2={x} y2={y - h} stroke="#E9ECEF" strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M${x},${y - h} q 8,2 14,0 q -3,5 0,10 q -6,2 -14,0 z`} fill={color} />
    </g>
  );
}
const MarkerFlag = ({ x, y }: { x: number; y: number }) => (
  <g><line x1={x} y1={y} x2={x} y2={y - 16} stroke="#E9ECEF" strokeWidth="1.5" /><path d={`M${x},${y - 16} l9,3 l-9,3 z`} fill="var(--p-short)" /><circle cx={x} cy={y} r="1.8" fill="#E9ECEF" /></g>
);
/** Alignment stick / club lying on the ground. */
export function Stick({ x1, y1, x2, y2, color = '#FFD58A' }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  return <g><line x1={x1} y1={y1 + 1.5} x2={x2} y2={y2 + 1.5} stroke="rgba(0,0,0,0.35)" strokeWidth="3.5" strokeLinecap="round" /><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" strokeLinecap="round" /></g>;
}
/** Club lying on the ground: shaft + head. */
export function Club({ x, y, len = 46, angle = 0 }: { x: number; y: number; len?: number; angle?: number }) {
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      <line x1={x - len / 2} y1={y} x2={x + len / 2 - 6} y2={y} stroke="#C8CDD3" strokeWidth="2" strokeLinecap="round" />
      <rect x={x - len / 2 - 4} y={y - 2.5} width="7" height="5" rx="1.5" fill="#2A2E33" />
      <path d={`M${x + len / 2 - 7},${y - 1.5} h6 a3,3 0 0 1 3,3 v1 a2,2 0 0 1 -2,2 h-7 z`} fill="#AEB4BB" />
    </g>
  );
}
export function Towel({ x, y, w = 34, h = 24 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x - w / 2 + 2} y={y - h / 2 + 2} width={w} height={h} rx="3" fill="rgba(0,0,0,0.35)" />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="3" fill="var(--p-putting)" />
      <rect x={x - w / 2} y={y + h / 2 - 6} width={w} height="3" fill="rgba(0,0,0,0.15)" />
    </g>
  );
}

// ---------- annotations ----------
/** Ball flight: dashed in the air, optional solid roll-out. */
export function Flight({ from, to, bend = 0, roll, muted, id }: { from: [number, number]; to: [number, number]; bend?: number; roll?: [number, number]; muted?: boolean; id: (k: string) => string }) {
  const mx = (from[0] + to[0]) / 2 + bend, my = (from[1] + to[1]) / 2;
  const col = muted ? 'var(--text-2)' : 'var(--accent)';
  return (
    <g fill="none" strokeLinecap="round" opacity={muted ? 0.55 : 1}>
      <path d={`M${from[0]},${from[1]} Q${mx},${my} ${to[0]},${to[1]}`} stroke={col} strokeWidth="2" strokeDasharray="1 5" />
      {roll ? <path d={`M${to[0]},${to[1]} L${roll[0]},${roll[1]}`} stroke={col} strokeWidth="2" markerEnd={`url(#${id(muted ? 'arrowMuted' : 'arrow')})`} />
        : <circle cx={to[0]} cy={to[1]} r="2.2" fill={col} />}
    </g>
  );
}
/** Putt / roll line with arrow head. */
export function Roll({ pts, muted, id, dashed }: { pts: [number, number][]; muted?: boolean; id: (k: string) => string; dashed?: boolean }) {
  return <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={muted ? 'var(--text-2)' : 'var(--accent)'} strokeOpacity={muted ? 0.6 : 1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? '4 4' : undefined} markerEnd={`url(#${id(muted ? 'arrowMuted' : 'arrow')})`} />;
}
export function Curve({ d, muted, id }: { d: string; muted?: boolean; id: (k: string) => string }) {
  return <path d={d} fill="none" stroke={muted ? 'var(--text-2)' : 'var(--accent)'} strokeOpacity={muted ? 0.6 : 1} strokeWidth="2" strokeLinecap="round" markerEnd={`url(#${id(muted ? 'arrowMuted' : 'arrow')})`} />;
}
/** Dashed target ring. */
export const Ring = ({ x, y, r, strong }: { x: number; y: number; r: number; strong?: boolean }) => (
  <circle cx={x} cy={y} r={r} fill={strong ? 'rgba(155,227,195,0.10)' : 'none'} stroke={strong ? 'var(--accent)' : 'rgba(242,243,245,0.55)'} strokeWidth="1.3" strokeDasharray="3 3" />
);
/** Landing zone band. */
export const Zone = ({ x, y, w, h, active }: { x: number; y: number; w: number; h: number; active?: boolean }) => (
  <rect x={x} y={y} width={w} height={h} rx="4" fill={active ? 'rgba(155,227,195,0.20)' : 'rgba(155,227,195,0.07)'} stroke="var(--accent)" strokeOpacity={active ? 0.9 : 0.35} strokeWidth="1.2" strokeDasharray="4 3" />
);
/** Text tag on a dark pill. Hidden in the small (card) size. */
export function Tag({ x, y, children, ctx, anchor = 'middle', accent }: { x: number; y: number; children: ReactNode; ctx: Ctx; anchor?: 'start' | 'middle' | 'end'; accent?: boolean }) {
  if (ctx.sm) return null;
  const text = String(children);
  const w = text.length * 6.1 + 12;
  const bx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g>
      <rect x={bx} y={y - 10} width={w} height="16" rx="8" fill="rgba(8,9,11,0.78)" stroke={accent ? 'var(--accent)' : 'rgba(255,255,255,0.08)'} strokeWidth="1" />
      <text x={bx + w / 2} y={y + 1.5} fontSize="10.5" fontWeight="600" fill={accent ? 'var(--accent)' : 'var(--text-2)'} textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>{text}</text>
    </g>
  );
}
/** Dimension line with end ticks and a centred tag. */
export function Dim({ x1, x2, y, label, ctx, vertical, y2 }: { x1: number; x2: number; y: number; label: string; ctx: Ctx; vertical?: boolean; y2?: number }) {
  if (ctx.sm) return null;
  if (vertical) {
    return <g stroke="rgba(242,243,245,0.45)" strokeWidth="1"><line x1={x1} y1={y} x2={x1} y2={y2} /><line x1={x1 - 3} y1={y} x2={x1 + 3} y2={y} /><line x1={x1 - 3} y1={y2} x2={x1 + 3} y2={y2} /><Tag x={x1} y={(y + (y2 ?? y)) / 2 + 3} ctx={ctx}>{label}</Tag></g>;
  }
  return <g stroke="rgba(242,243,245,0.45)" strokeWidth="1"><line x1={x1} y1={y} x2={x2} y2={y} /><line x1={x1} y1={y - 3} x2={x1} y2={y + 3} /><line x1={x2} y1={y - 3} x2={x2} y2={y + 3} /><Tag x={(x1 + x2) / 2} y={y + 3} ctx={ctx}>{label}</Tag></g>;
}
/** Numbered station; the active one (live mode) glows in the accent colour. */
export function Station({ x, y, n, ctx }: { x: number; y: number; n: number; ctx: Ctx }) {
  const on = ctx.active === n - 1;
  return (
    <g>
      {on && <circle cx={x} cy={y} r="13" fill="var(--accent-soft)" />}
      <circle cx={x} cy={y} r="8" fill={on ? 'var(--accent)' : 'rgba(8,9,11,0.85)'} stroke={on ? 'var(--accent)' : 'rgba(242,243,245,0.6)'} strokeWidth="1.3" />
      <text x={x} y={y + 3.5} fontSize="10" fontWeight="700" textAnchor="middle" fill={on ? 'var(--on-accent)' : 'var(--text)'}>{n}</text>
    </g>
  );
}
/** Points chip such as "+2". */
export const Pts = ({ x, y, v, ctx }: { x: number; y: number; v: string; ctx: Ctx }) => (
  ctx.sm ? null : <g><circle cx={x} cy={y} r="10" fill="rgba(8,9,11,0.85)" stroke="var(--accent)" strokeWidth="1.2" /><text x={x} y={y + 3.5} fontSize="9.5" fontWeight="700" textAnchor="middle" fill="var(--accent)">{v}</text></g>
);
/** Counter-clockwise arc arrow around a centre. */
export function CcwArrow({ cx, cy, r, id }: { cx: number; cy: number; r: number; id: (k: string) => string }) {
  const a0 = -20, a1 = -140; // degrees
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return <path d={`M${x0},${y0} A${r},${r} 0 0 0 ${x1},${y1}`} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" markerEnd={`url(#${id('arrow')})`} />;
}
