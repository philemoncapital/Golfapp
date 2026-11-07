import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, type Category } from '../engine/types';
import type { CategoryHcp } from '../engine/handicap';
import { CAT_COLOR } from '../lib/drills';
import { fmtGap, fmtHcp } from '../lib/format';

/**
 * How the training handicap is made up: one row per category on a shared HCP axis (worse left, better right),
 * a dashed line at the real handicap and a connector showing each category's gap to it.
 * Below: share of practice time per category (last 4 weeks). Tap / hover a row for details.
 */
export function HcpBreakdown({ cats, real, minutes }: { cats: CategoryHcp[]; real: number | null; minutes: Record<string, number> }) {
  const { t } = useTranslation();
  const vals = cats.map((c) => c.hcp).filter((x): x is number => x !== null);
  const all = real !== null ? [...vals, real] : vals;
  const worstGap = cats.filter((c) => c.hcp !== null && real !== null).sort((a, b) => (b.hcp! - real!) - (a.hcp! - real!))[0]?.category;
  const [sel, setSel] = useState<Category | null>(null);
  const active = sel ?? worstGap ?? null;
  const totalMin = Object.values(minutes).reduce((a, b) => a + b, 0);

  const W = 340, rowH = 38, top = 22, H = top + rowH * 4 + 6;
  const x0 = 104, x1 = 286;
  const hi = Math.ceil(Math.max(...(all.length ? all : [36])) + 3), lo = Math.floor(Math.min(...(all.length ? all : [0])) - 3);
  const X = (h: number) => x0 + ((hi - h) / Math.max(1, hi - lo)) * (x1 - x0); // worse (higher) left, better right

  const detail = (c: CategoryHcp) => {
    const m = minutes[c.category] ?? 0;
    const share = totalMin ? Math.round((m / totalMin) * 100) : 0;
    if (c.hcp === null) return `${t(`cat.${c.category}`)} · ${t('today.notEnough')} · ${m} ${t('common.min')}`;
    return `${t(`cat.${c.category}`)} · ${fmtHcp(c.hcp)}${real !== null ? ` · ${fmtGap(c.hcp - real)} ${t('home.vsReal')}` : ''} · ${m} ${t('common.min')} (${share}%)`;
  };

  return (
    <div className="stack" style={{ gap: 10 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={cats.map(detail).join('; ')} style={{ display: 'block', overflow: 'visible' }}>
        {/* recessive axis ends */}
        <text x={x0} y={H - 1} fontSize="10" fill="var(--muted)" textAnchor="start">{hi}</text>
        <text x={x1} y={H - 1} fontSize="10" fill="var(--muted)" textAnchor="end">{lo < 0 ? `+${-lo}` : lo}</text>
        {real !== null && (
          <g>
            <line x1={X(real)} x2={X(real)} y1={top - 4} y2={top + rowH * 4 - 6} stroke="var(--text-2)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={X(real)} y={top - 9} fontSize="10" fontWeight="600" fill="var(--text-2)" textAnchor="middle">{t('home.realShort')} {fmtHcp(real)}</text>
          </g>
        )}
        {CATEGORIES.map((cat, i) => {
          const c = cats.find((x) => x.category === cat)!;
          const y = top + i * rowH + rowH / 2;
          const on = active === cat;
          return (
            <g key={cat} onMouseEnter={() => setSel(cat)} onClick={() => setSel(cat)} style={{ cursor: 'pointer' }} opacity={active && !on ? 0.55 : 1}>
              <rect x={0} y={y - rowH / 2} width={W} height={rowH} fill="transparent" />
              <line x1={x0} x2={x1} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x={0} y={y + 4} fontSize="13" fill="var(--text)">{t(`cat.${cat}`)}</text>
              {c.hcp !== null ? (
                <>
                  {real !== null && <line x1={X(real)} x2={X(c.hcp)} y1={y} y2={y} stroke={CAT_COLOR[cat]} strokeWidth="2" strokeLinecap="round" opacity="0.7" />}
                  <circle cx={X(c.hcp)} cy={y} r={on ? 6.5 : 5.5} fill={CAT_COLOR[cat]} stroke="var(--surface)" strokeWidth="2" />
                  <text x={W} y={y + 4} fontSize="14" fontWeight="600" fill="var(--text)" textAnchor="end" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtHcp(c.hcp)}</text>
                </>
              ) : (
                <text x={W} y={y + 4} fontSize="13" fill="var(--muted)" textAnchor="end">–</text>
              )}
            </g>
          );
        })}
      </svg>
      {active && <span className="small text-2" role="status">{detail(cats.find((c) => c.category === active)!)}</span>}
      <div className="stack" style={{ gap: 6 }}>
        <span className="label">{t('home.time4w')}</span>
        {totalMin === 0 ? <span className="small muted">–</span> : (
          <>
            <div role="img" aria-label={CATEGORIES.map((c) => `${t(`cat.${c}`)} ${minutes[c] ?? 0} min`).join(', ')} style={{ display: 'flex', gap: 2, height: 8 }}>
              {CATEGORIES.filter((c) => (minutes[c] ?? 0) > 0).map((c) => (
                <span key={c} onMouseEnter={() => setSel(c)} onClick={() => setSel(c)} style={{ flex: minutes[c], background: CAT_COLOR[c], borderRadius: 4, opacity: active && active !== c ? 0.55 : 1, cursor: 'pointer' }} />
              ))}
            </div>
            <div className="row wrap small text-2" style={{ gap: 12 }}>
              {CATEGORIES.map((c) => <span key={c} className="row" style={{ gap: 5 }}><span className="dot" style={{ background: CAT_COLOR[c] }} />{Math.round(((minutes[c] ?? 0) / totalMin) * 100)}%</span>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
