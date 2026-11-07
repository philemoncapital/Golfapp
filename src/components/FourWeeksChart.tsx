import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../engine/types';
import type { DayMinutes } from '../engine/stats';
import { CAT_COLOR } from '../lib/drills';
import { locale } from '../lib/format';

/**
 * Practice minutes per day over the last 4 weeks, stacked by category (2 px gaps, rounded tops).
 * Week totals sit under each 7-day block with a mark when the weekly goal was reached. Tap / hover a day.
 */
export function FourWeeksChart({ days, goal }: { days: DayMinutes[]; goal: number }) {
  const { t, i18n } = useTranslation();
  const [sel, setSel] = useState<number | null>(null);
  const W = 340, top = 8, plotH = 104, H = top + plotH + 2;
  const n = days.length, colW = W / n, barW = Math.min(9, colW - 3);
  const maxV = Math.max(30, ...days.map((d) => d.total));
  const step = maxV > 120 ? 60 : 30;
  const yMax = Math.ceil(maxV / step) * step;
  const Y = (v: number) => top + plotH - (v / yMax) * plotH;
  const fmtDay = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(i18n.language), o);
  const weeks = [0, 1, 2, 3].map((w) => { const ds = days.slice(w * 7, w * 7 + 7); return { start: ds[0]?.date, total: ds.reduce((a, d) => a + d.total, 0) }; });
  const d = sel !== null ? days[sel] : null;

  return (
    <div className="stack" style={{ gap: 8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" style={{ display: 'block', overflow: 'visible' }}
        aria-label={t('home.chart4wAria', { total: days.reduce((a, x) => a + x.total, 0) })} onMouseLeave={() => setSel(null)}>
        {[step, yMax].filter((v, i, a) => a.indexOf(v) === i && v <= yMax).map((v) => (
          <g key={v}>
            <line x1={0} x2={W} y1={Y(v)} y2={Y(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={0} y={Y(v) - 3} fontSize="9" fill="var(--muted)">{v}</text>
          </g>
        ))}
        <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke="var(--border)" strokeWidth="1" />
        {days.map((day, i) => {
          const cx = i * colW + colW / 2;
          let acc = 0;
          const segs = CATEGORIES.filter((c) => day[c] > 0);
          const dim = sel !== null && sel !== i;
          return (
            <g key={day.date} onMouseEnter={() => setSel(i)} onClick={() => setSel(sel === i ? null : i)} style={{ cursor: 'pointer' }} opacity={dim ? 0.4 : 1}>
              <rect x={i * colW} y={top} width={colW} height={plotH} fill="transparent" />
              {day.total === 0 && <rect x={cx - barW / 2} y={Y(0) - 2} width={barW} height={2} rx={1} fill="var(--surface-2)" />}
              {segs.map((c, k) => {
                const h = (day[c] / yMax) * plotH;
                const y = Y(acc + day[c]);
                acc += day[c];
                const gap = k < segs.length - 1 ? 2 : 0; // 2 px surface gap between stacked segments
                const isTop = k === segs.length - 1;
                return isTop
                  ? <path key={c} fill={CAT_COLOR[c]} d={`M${cx - barW / 2},${y + h}V${y + 3}a3,3 0 0 1 3,-3h${barW - 6}a3,3 0 0 1 3,3V${y + h}z`} />
                  : <rect key={c} x={cx - barW / 2} y={y + gap} width={barW} height={Math.max(0, h - gap)} fill={CAT_COLOR[c]} />;
              })}
            </g>
          );
        })}
      </svg>
      <div className="grid4 small" style={{ gap: 0 }}>
        {weeks.map((w) => (
          <span key={w.start} className="stack" style={{ gap: 0 }}>
            <span className="muted">{w.start ? fmtDay(w.start, { day: 'numeric', month: 'short' }) : ''}</span>
            <span className="num" style={{ fontWeight: 600 }}>{w.total} {t('common.min')}{goal > 0 && w.total >= goal ? <span aria-label={t('home.goalMet')} style={{ color: 'var(--accent)' }}> ✓</span> : null}</span>
          </span>
        ))}
      </div>
      <div className="small text-2" role="status" style={{ minHeight: 20 }}>
        {d ? (
          <span className="row wrap" style={{ gap: 10 }}>
            <b>{fmtDay(d.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {d.total} {t('common.min')}</b>
            {CATEGORIES.filter((c) => d[c] > 0).map((c) => <span key={c} className="row" style={{ gap: 4 }}><span className="dot" style={{ background: CAT_COLOR[c] }} />{d[c]}</span>)}
          </span>
        ) : (
          <span className="row wrap" style={{ gap: 12 }}>
            {CATEGORIES.map((c) => <span key={c} className="row" style={{ gap: 5 }}><span className="dot" style={{ background: CAT_COLOR[c] }} />{t(`cat.${c}`)}</span>)}
          </span>
        )}
      </div>
      <div className="sr-only"><table>
        <caption>{t('home.train4w')}</caption>
        <thead><tr><th>Date</th>{CATEGORIES.map((c) => <th key={c}>{t(`cat.${c}`)}</th>)}</tr></thead>
        <tbody>{days.filter((x) => x.total > 0).map((x) => <tr key={x.date}><td>{x.date}</td>{CATEGORIES.map((c) => <td key={c}>{x[c]}</td>)}</tr>)}</tbody>
      </table></div>
    </div>
  );
}
