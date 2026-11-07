import { useId, type ReactNode } from 'react';
import { ACH_ICON } from './AchIcon';
import { TITLE_ICON } from './TitleIcon';

export type Tier = 'bronze' | 'silver' | 'gold';
export type BadgeKind = 'medal' | 'achievement' | 'title_badge';

/** Outline gradients per tier / kind (stroke only – the badge body stays dark, section 11). */
export const BADGE_COLORS: Record<string, [string, string]> = {
  bronze: ['#E7A77A', '#9C5F38'], silver: ['#F4F6F8', '#9AA2AC'], gold: ['#FFE39A', '#C99A2E'],
  achievement: ['#9BE3C3', '#A2D8FF'], leader: ['#FFE39A', '#9BE3C3'], last: ['#D9C5FF', '#FFC0A3'], locked: ['#4A4F56', '#2C3036'],
};

const C = 50; // viewBox 0..100, centre 50/50
const hexagon = 'M50,6 L88,28 L88,72 L50,94 L12,72 L12,28 Z';
const shield = 'M50,5 C62,5 76,7 86,12 C88,40 84,70 50,95 C16,70 12,40 14,12 C24,7 38,5 50,5 Z';
function wavy(r = 44, waves = 22, amp = 2.4) {
  const pts: string[] = [];
  for (let i = 0; i <= 360; i += 3) {
    const a = (i * Math.PI) / 180, rr = r + amp * Math.sin(waves * a);
    pts.push(`${(C + rr * Math.cos(a)).toFixed(2)},${(C + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}
const SHAPES: Record<BadgeKind, string> = { medal: hexagon, achievement: shield, title_badge: wavy() };

/**
 * Whoop-inspired badge: dark body, a stack of thin gradient contour lines that swirl inwards, soft glow,
 * a light-grey glyph in the centre. Locked badges are grey without glow.
 */
export function Badge({ k, kind, tier, titleType, locked, size = 96, label }: {
  k: string; kind: BadgeKind; tier?: Tier | null; titleType?: 'leader' | 'last'; locked?: boolean; size?: number; label: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const colorKey = locked ? 'locked' : kind === 'medal' ? (tier ?? 'locked') : kind === 'title_badge' ? (titleType ?? 'leader') : 'achievement';
  const [c1, c2] = BADGE_COLORS[colorKey];
  const shape = SHAPES[kind];
  const lines = size >= 72 ? 9 : 5;
  const glyph: ReactNode = kind === 'title_badge' ? TITLE_ICON[k.replace(/^title_/, '') as keyof typeof TITLE_ICON] : ACH_ICON[k];
  return (
    <svg viewBox="-6 -6 112 112" width={size} height={size} role="img" aria-label={label} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
        <radialGradient id={`b${uid}`} cx="0.5" cy="0.42" r="0.6"><stop offset="0" stopColor="#1B1F24" /><stop offset="1" stopColor="#07080A" /></radialGradient>
        <radialGradient id={`h${uid}`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={c1} stopOpacity="0.45" /><stop offset="1" stopColor={c1} stopOpacity="0" /></radialGradient>
        <linearGradient id={`i${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2F3F5" /><stop offset="1" stopColor="#8A8F96" /></linearGradient>
        <clipPath id={`c${uid}`}><path d={shape} /></clipPath>
      </defs>
      {!locked && <circle cx={C} cy={C} r="58" fill={`url(#h${uid})`} />}
      <path d={shape} fill={`url(#b${uid})`} />
      {/* contour lines swirling inwards */}
      <g clipPath={`url(#c${uid})`} fill="none" stroke={`url(#g${uid})`}>
        {Array.from({ length: lines }, (_, i) => {
          const s = 1 - (i + 1) * (0.34 / lines), rot = (i + 1) * (kind === 'title_badge' ? 4 : 2.2);
          return <path key={i} d={shape} strokeWidth={0.9} strokeOpacity={0.75 - i * (0.55 / lines)} transform={`translate(${C} ${C}) rotate(${rot}) scale(${s}) translate(${-C} ${-C})`} />;
        })}
      </g>
      <path d={shape} fill="none" stroke={`url(#g${uid})`} strokeWidth="2.6" strokeLinejoin="round" />
      {/* glyph: light grey on dark, with a soft lift */}
      <g transform="translate(29 27) scale(1.32)" fill="none" stroke={locked ? '#5B616A' : `url(#i${uid})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: locked ? undefined : `drop-shadow(0 2px 3px rgba(0,0,0,0.6)) drop-shadow(0 0 6px ${c1}55)`, color: locked ? '#5B616A' : '#E6E8EB' }}>
        {glyph}
      </g>
    </svg>
  );
}
