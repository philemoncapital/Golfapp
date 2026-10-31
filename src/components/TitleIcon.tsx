import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type TitleBoard = 'tee' | 'approach' | 'short' | 'putting' | 'overall';
export type TitleType = 'leader' | 'last';

const A = 'var(--accent)';
/** Title pictograms (section 8.2), 32×32, 1.75 px strokes; accent only for the ball or the key element. */
const ICONS: Record<`${TitleBoard}_${TitleType}`, ReactNode> = {
  // Big Stick: driver with motion lines
  tee_leader: <>
    <path d="M9 4l10 17" /><path d="M18 20.5c2-1 6-1.5 8 0 1 1 .5 3.2-1.5 3.6-2.5.5-5.2.4-6.6-.7-.9-.8-.8-2.3.1-2.9z" />
    <path d="M4 15h6M3 19.5h7M5 24h7" stroke={A} />
  </>,
  // Tree Hugger: tree with ball stuck in it
  tee_last: <>
    <path d="M16 29v-9" /><path d="M16 20c-6 0-9.5-3.5-9.5-7.5S10 4 16 4s9.5 4.5 9.5 8.5S22 20 16 20z" />
    <path d="M12 25l4-3 4 3" /><circle cx="19.5" cy="11" r="2.2" fill={A} stroke={A} />
  </>,
  // Pin Seeker: flag inside crosshair
  approach_leader: <>
    <circle cx="16" cy="16" r="11" /><path d="M16 2v5M16 25v5M2 16h5M25 16h5" />
    <path d="M14 22V10l7 2.8-7 2.8" stroke={A} strokeLinejoin="round" />
  </>,
  // Air Mail: ball with envelope wings flying over a green
  approach_last: <>
    <ellipse cx="16" cy="26.5" rx="11" ry="2.8" /><circle cx="16" cy="11" r="3.2" stroke={A} />
    <path d="M12 9.5H4.5v6H12M6 9.8l3 2.6 3-2.6" /><path d="M20 9.5h7.5v6H20M26 9.8l-3 2.6-3-2.6" />
    <path d="M16 17v3" strokeDasharray="1 2.5" />
  </>,
  // Wedge Wizard: wedge with sparkles
  short_leader: <>
    <path d="M8 3l8 17" /><path d="M15.5 19.5l7.5 2-1 5.2c-3 .6-6.5-.6-8.3-3z" />
    <path d="M24 5v6M21 8h6M5 20v4M3 22h4M26 15v3M24.5 16.5h3" stroke={A} />
  </>,
  // Chili Dipper: wedge digging a divot
  short_last: <>
    <path d="M3 22h26" /><path d="M9 3l7 15" /><path d="M14.5 17l7 2.5-1.5 4.5c-2.6.3-5.6-1-7-3.2z" />
    <path d="M22 13c1.5-2 3.6-2.6 5.5-1.6M24 17.5c1.2-.9 2.6-1 3.7-.3" stroke={A} />
    <path d="M10 26.5c3 1.4 9 1.4 12 0" />
  </>,
  // Ice Veins: snowflake over hole
  putting_leader: <>
    <path d="M16 3v16M9.1 7l13.8 8M9.1 15l13.8-8" stroke={A} />
    <path d="M13.5 4.5L16 6.5l2.5-2M13.5 17.5L16 15.5l2.5 2" stroke={A} />
    <ellipse cx="16" cy="26" rx="6" ry="2.6" />
  </>,
  // Lip-Out Legend: ball circling the cup rim
  putting_last: <>
    <ellipse cx="16" cy="18" rx="7" ry="3.4" /><ellipse cx="16" cy="18" rx="12" ry="7" strokeDasharray="2 3" />
    <circle cx="25.5" cy="13" r="2.4" fill={A} stroke={A} /><path d="M21 10.5c-1.2-.4-2.6-.6-4-.6" />
  </>,
  // Club Champion: crown over flag
  overall_leader: <>
    <path d="M7 12l2.5-7 4 4.5L16 3l2.5 6.5 4-4.5L25 12z" stroke={A} strokeLinejoin="round" />
    <path d="M15 29V16l8 3-8 3" strokeLinejoin="round" /><path d="M11 29h10" />
  </>,
  // Ball Donor: ball sinking with water ripples
  overall_last: <>
    <path d="M10.5 16a5.5 5.5 0 0 1 11 0" stroke={A} />
    <path d="M4 18c3.5 1.6 7 1.6 10.5 0s7-1.6 10.5 0M3 23c4 1.6 8 1.6 13 0s9-1.6 13 0M7 27.5c3 1 6 1 9 0s6-1 9 0" />
  </>,
};

/** Title badge with its pictogram and localised name, e.g. "Der Hammer". */
export function TitleIcon({ board, type, size = 28, label = true }: { board: TitleBoard; type: TitleType; size?: number; label?: boolean }) {
  const { t } = useTranslation();
  const name = t(`titles.${board}_${type}`);
  return (
    <span className="row" style={{ gap: 6 }} title={name}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="var(--text-2)" strokeWidth="1.75" strokeLinecap="round" role="img" aria-label={name}>
        {ICONS[`${board}_${type}`]}
      </svg>
      {label && <span className="small" style={{ fontWeight: 600 }}>{name}</span>}
    </span>
  );
}
