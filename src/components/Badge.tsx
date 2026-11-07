import { useId, type CSSProperties } from 'react';
import { BADGE_GLYPH } from './badgeGlyphs';

export type Tier = 'bronze' | 'silver' | 'gold';
export type BadgeKind = 'medal' | 'achievement' | 'title_badge';

/** Metallic frame gradients (4 stops) per tier / kind. The badge body stays dark (section 11). */
export const BADGE_METAL: Record<string, [string, string, string, string]> = {
  bronze: ['#F3C7A2', '#C98A5B', '#7C4A2A', '#E3A77C'],
  silver: ['#FFFFFF', '#C5CBD3', '#7D858F', '#E6EAEE'],
  gold: ['#FFF0B8', '#E8C25A', '#9C7420', '#F5D67E'],
  achievement: ['#D6F7E8', '#9BE3C3', '#4E9FC4', '#A2D8FF'],
  leader: ['#FFF0B8', '#E8C25A', '#5FB894', '#9BE3C3'],
  last: ['#F1E8FF', '#D9C5FF', '#B07A8E', '#FFC0A3'],
  locked: ['#6A7078', '#454A51', '#2A2E33', '#50555C'],
};
/** Main colour of a badge (glow, bar fill). */
export const BADGE_COLORS: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(BADGE_METAL).map(([k, v]) => [k, [v[1], v[2]]]),
) as Record<string, [string, string]>;

// Soft shapes in a 100×100 box.
const hexagon = 'M46,7.3 Q50,5 54,7.3 L84.5,24.8 Q88.5,27.1 88.5,31.7 L88.5,68.3 Q88.5,72.9 84.5,75.2 L54,92.7 Q50,95 46,92.7 L15.5,75.2 Q11.5,72.9 11.5,68.3 L11.5,31.7 Q11.5,27.1 15.5,24.8 Z';
const crest = 'M18,8 H82 Q90,8 90,16 V50 C90,74 72,91 50,95 C28,91 10,74 10,50 V16 Q10,8 18,8 Z';
function wavy(r = 43, waves = 16, amp = 1.6, phase = 0) {
  const pts: string[] = [];
  for (let i = 0; i <= 360; i += 3) {
    const a = (i * Math.PI) / 180, rr = r + amp * Math.sin(waves * a + phase);
    pts.push(`${(50 + rr * Math.cos(a)).toFixed(2)},${(50 + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}
const SHAPES: Record<BadgeKind, string> = { medal: hexagon, achievement: crest, title_badge: wavy() };

/**
 * Achievement badge in a WHOOP-like design language (not WHOOP assets): dark well, many hairline contour lines
 * drifting off-centre and dissolving inwards, a double metallic frame, a solid sculpted glyph with rim light.
 * `pill`: 'lock' for locked items, 'check' for earned one-time items.
 */
export function Badge({ k, kind, tier, titleType, locked, size = 96, label, pill }: {
  k: string; kind: BadgeKind; tier?: Tier | null; titleType?: 'leader' | 'last'; locked?: boolean; size?: number; label: string; pill?: 'lock' | 'check';
}) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const key = locked ? 'locked' : kind === 'medal' ? (tier ?? 'locked') : kind === 'title_badge' ? (titleType ?? 'leader') : 'achievement';
  const m = BADGE_METAL[key];
  const shape = SHAPES[kind];
  const big = size >= 150, small = size < 72;
  const lines = locked ? 4 : big ? 30 : small ? 6 : 12;
  const lw = big ? 0.35 : small ? 0.7 : 0.55;
  const glyph = BADGE_GLYPH[k.replace(/^title_/, '')] ?? [];
  const id = (s: string) => `${s}${u}`;
  const metal = `url(#${id('m')})`;

  return (
    <svg viewBox="-8 -8 116 116" width={size} height={size} role="img" aria-label={label} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id('m')} gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="90" y2="94">
          {m.map((s, i) => <stop key={i} offset={[0, 0.35, 0.7, 1][i]} stopColor={s} />)}
        </linearGradient>
        <linearGradient id={id('l')} x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(90 .5 .5)">
          <stop offset="0" stopColor={m[0]} /><stop offset="0.5" stopColor={m[1]} /><stop offset="1" stopColor={m[2]} />
        </linearGradient>
        <radialGradient id={id('b')} cx="0.5" cy="0.46" r="0.62">
          <stop offset="0" stopColor="#030405" /><stop offset="0.55" stopColor="#0A0C0F" /><stop offset="1" stopColor="#161A1F" />
        </radialGradient>
        <radialGradient id={id('t')} cx="0.5" cy="0.5" r="0.55">
          <stop offset="0.8" stopColor={m[1]} stopOpacity="0" /><stop offset="1" stopColor={m[1]} stopOpacity={locked ? 0 : 0.14} />
        </radialGradient>
        <radialGradient id={id('h')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={m[1]} stopOpacity="0.35" /><stop offset="0.6" stopColor={m[1]} stopOpacity="0.12" /><stop offset="1" stopColor={m[1]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('g')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E4E6E9" /><stop offset="0.55" stopColor="#9A9FA6" /><stop offset="1" stopColor="#5E636A" />
        </linearGradient>
        <clipPath id={id('c')}><path d={shape} /></clipPath>
        <clipPath id={id('tl')}><path d="M-10,-10 H110 L-10,110 Z" /></clipPath>
        <clipPath id={id('br')}><path d="M110,-10 V110 H-10 Z" /></clipPath>
      </defs>

      {big && !locked && <circle cx="50" cy="50" r="62" fill={`url(#${id('h')})`} />}
      <path d={shape} fill={`url(#${id('b')})`} />
      <path d={shape} fill={`url(#${id('t')})`} />

      {/* hairline contour lines drifting off-centre, dissolving into the dark centre */}
      <g clipPath={`url(#${id('c')})`} fill="none" stroke={`url(#${id('l')})`}>
        {Array.from({ length: lines }, (_, i) => {
          const tt = (i + 1) / lines, s = 0.9 - tt * 0.35, rot = tt * (kind === 'title_badge' ? 24 : 14);
          const d = kind === 'title_badge' ? wavy(43, 16, 1.2 + 0.8 * tt, tt * 0.6) : shape;
          return <path key={i} d={d} strokeWidth={lw} strokeOpacity={0.85 * Math.pow(1 - tt, 1.6) + 0.04}
            transform={`translate(${50 + 6 * tt} ${50 - 4 * tt}) rotate(${rot}) scale(${s}) translate(-50 -50)`} />;
        })}
      </g>

      {/* double frame + bevel */}
      <path d={shape} fill="none" stroke={metal} strokeWidth={small ? 2.6 : 3.2} strokeLinejoin="round" opacity={locked ? 0.7 : 1} />
      <path d={shape} fill="none" stroke={metal} strokeWidth="0.6" opacity="0.6" transform="translate(50 50) scale(0.92) translate(-50 -50)" />
      {!locked && <g clipPath={`url(#${id('tl')})`}><path d={shape} fill="none" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="0.8" /></g>}

      {/* solid sculpted glyph */}
      <g transform="translate(23 16) scale(1.7)" opacity={locked ? 0.55 : 1}
        style={{ filter: locked ? undefined : 'drop-shadow(0 1.6px 2px rgba(0,0,0,0.75))' } as CSSProperties}>
        {glyph.map((l, i) => {
          const body = locked ? '#5B616A' : `url(#${id('g')})`;
          if (l.t === 'fill') return <g key={i}>
            <path d={l.d} fill={body} fillRule="nonzero" />
            {!locked && <g clipPath={`url(#${id('tl')})`}><path d={l.d} fill="#FFFFFF" fillOpacity="0.22" /></g>}
            {!locked && <g clipPath={`url(#${id('br')})`}><path d={l.d} fill="none" stroke={m[1]} strokeOpacity="0.9" strokeWidth="0.5" /></g>}
          </g>;
          if (l.t === 'stroke') return <path key={i} d={l.d} fill="none" stroke={body} strokeWidth={l.w ?? 2} strokeLinecap="round" strokeLinejoin="round" />;
          if (l.t === 'dark') return <path key={i} d={l.d} fill="#101316" />;
          if (l.t === 'darkStroke') return <path key={i} d={l.d} fill="none" stroke="#101316" strokeWidth={l.w ?? 1} strokeLinecap="round" strokeLinejoin="round" />;
          return <path key={i} d={l.d} fill={locked ? '#6A7078' : m[1]} />;
        })}
      </g>

      {pill && (
        <g transform="translate(50 92)">
          <circle r="8" fill="#0B0D10" stroke={metal} strokeWidth="1.4" />
          {pill === 'lock'
            ? <g fill="none" stroke="#8A8F96" strokeWidth="1.4" strokeLinecap="round"><rect x="-3.6" y="-1" width="7.2" height="5.4" rx="1.2" fill="#8A8F96" stroke="none" /><path d="M-2.2,-1 V-3 A2.2,2.2 0 0 1 2.2,-3 V-1" /></g>
            : <path d="M-3.6,0.2 L-1,2.8 L3.8,-2.6" fill="none" stroke={m[1]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
      )}
    </svg>
  );
}
