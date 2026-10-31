import type { ReactNode } from 'react';
import { TitleIcon, type TitleBoard, type TitleType } from './TitleIcon';

export type Tier = 'bronze' | 'silver' | 'gold';
const TIER_FILL: Record<Tier, string> = { bronze: '#C98A5B', silver: '#C5CBD3', gold: '#E8C25A' };

/** Pictograms for medals and achievements (8.3, 8.4), 32×32, same stroke kit as the title pictograms. */
const ICONS: Record<string, ReactNode> = {
  // medals
  range_rat: <><path d="M7 13h18l-2.5 13h-13z" /><circle cx="12" cy="10" r="2.5" /><circle cx="17" cy="8.5" r="2.5" /><circle cx="21" cy="11" r="2.2" /><path d="M10 18h12" /></>,
  grinder: <><circle cx="16" cy="18" r="10" /><path d="M16 18v-6M13 4h6M16 4v4M24.5 9.5l2-2" /></>,
  regular: <><rect x="5" y="7" width="22" height="20" rx="3" /><path d="M5 13h22M11 4v5M21 4v5M12 20l3 3 5-6" /></>,
  goal_getter: <><circle cx="15" cy="17" r="10" /><circle cx="15" cy="17" r="5" /><path d="M15 17L27 5M22 5h5v5" /></>,
  pb_machine: <><path d="M10 5h12v6a6 6 0 0 1-12 0z" /><path d="M10 7H6c0 4 2 6 4.5 6.5M22 7h4c0 4-2 6-4.5 6.5M16 17v5M11 27h10M12.5 22h7l1 5h-9z" /></>,
  round_logger: <><rect x="6" y="4" width="16" height="24" rx="2" /><path d="M6 10h16M6 16h16M6 22h16M12 4v24" /><path d="M23 16l4-4 2 2-4 4-3 1z" /></>,
  // achievements
  first_tee: <><path d="M3 27h26" /><path d="M14 27l1-9h2l1 9M12 18h8" /><circle cx="16" cy="13" r="4" /></>,
  flawless: <><path d="M9 5h14l5 7-12 15L4 12z" /><path d="M4 12h24M12 5l4 7 4-7M16 12v15" /></>,
  complete_set: <><path d="M10 9h12l-1.5 19h-9z" /><path d="M12 9V4M16 9V3M20 9V5M10 15h12" /><path d="M11 4h2M15 3h2M19 5h2" /></>,
  collector: <><rect x="4" y="4" width="10" height="10" rx="2" /><rect x="18" y="4" width="10" height="10" rx="2" /><rect x="4" y="18" width="10" height="10" rx="2" /><rect x="18" y="18" width="10" height="10" rx="2" /><path d="M20.5 23l2 2 3.5-4" /></>,
  all_rounder: <><circle cx="16" cy="16" r="11" /><path d="M16 5v22M5 16h22" /><circle cx="16" cy="16" r="3" /></>,
  on_target: <><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="6" /><circle cx="16" cy="16" r="1.6" fill="currentColor" /></>,
  next_level: <><path d="M8 17l8-7 8 7M8 25l8-7 8 7" /><path d="M6 6h20" strokeDasharray="2 3" /></>,
  breakthrough: <><path d="M3 14h26" strokeDasharray="2 3" /><path d="M4 26l7-6 5 3 11-16" /><path d="M21 7h6v6" /></>,
  review_ready: <><rect x="7" y="6" width="18" height="22" rx="2" /><path d="M12 6V4h8v2M11 15l3 3 7-7M11 23h10" /></>,
  early_bird: <><path d="M3 23h26M8 23a8 8 0 0 1 16 0" /><path d="M16 8v4M7 12l2.5 2.5M25 12l-2.5 2.5M3 18h3M26 18h3" /></>,
  team_player: <><circle cx="11" cy="10" r="3.5" /><circle cx="22" cy="12" r="3" /><path d="M4 26c1.2-4 4-6 7-6s5.8 2 7 6M18.5 20c1-.6 2.2-.9 3.5-.9 2.6 0 4.7 1.7 5.7 4.9" /></>,
  captain: <><path d="M6 10c3-2 17-2 20 0v12c-3 2-17 2-20 0z" /><path d="M19 13.5a4 4 0 1 0 0 5" /></>,
  dynasty: <><path d="M5 20l3-11 5 5 3-8 3 8 5-5 3 11z" strokeLinejoin="round" /><path d="M5 25h22" /><circle cx="9" cy="28.5" r="1" fill="currentColor" /><circle cx="14" cy="28.5" r="1" fill="currentColor" /><circle cx="18" cy="28.5" r="1" fill="currentColor" /><circle cx="23" cy="28.5" r="1" fill="currentColor" /></>,
};

/**
 * Badge pictogram on a small disc. Medals get the tier colour as fill (the only filled decorative element, section 11);
 * locked items are greyed out.
 */
export function AchIcon({ k, tier, locked, size = 56, label }: { k: string; tier?: Tier | null; locked?: boolean; size?: number; label: string }) {
  if (k.startsWith('title_')) {
    const [, board, type] = k.split('_') as [string, TitleBoard, TitleType];
    return (
      <span className="ach-disc" style={{ width: size, height: size, opacity: locked ? 0.35 : 1 }} role="img" aria-label={label}>
        <TitleIcon board={board} type={type} size={size * 0.62} label={false} />
      </span>
    );
  }
  const fill = tier && !locked ? TIER_FILL[tier] : undefined;
  return (
    <span className="ach-disc" style={{ width: size, height: size, background: fill ?? 'var(--surface-2)', opacity: locked ? 0.35 : 1, borderColor: fill ?? 'var(--border)' }} role="img" aria-label={label}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="none" stroke={fill ? '#0E0F11' : 'var(--text-2)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: fill ? '#0E0F11' : 'var(--text-2)' }}>
        {ICONS[k]}
      </svg>
    </span>
  );
}
