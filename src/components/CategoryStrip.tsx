import { useTranslation } from 'react-i18next';
import { CATEGORIES, type Drill } from '../engine/types';
import { CAT_COLOR } from '../lib/drills';

/** Share of minutes per category as one segmented bar (2 px gaps, 4 px rounded ends). */
export function CategoryStrip({ drills, height = 6, labels = false }: { drills: Pick<Drill, 'category' | 'duration_min'>[]; height?: number; labels?: boolean }) {
  const { t } = useTranslation();
  const total = drills.reduce((a, d) => a + d.duration_min, 0) || 1;
  const parts = CATEGORIES.map((c) => ({ c, min: drills.filter((d) => d.category === c).reduce((a, d) => a + d.duration_min, 0) })).filter((p) => p.min > 0);
  const desc = parts.map((p) => `${t(`cat.${p.c}`)} ${p.min} min`).join(', ');
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div role="img" aria-label={desc} style={{ display: 'flex', gap: 2, height }}>
        {parts.map((p) => <span key={p.c} title={`${t(`cat.${p.c}`)} · ${p.min} min`} style={{ flex: p.min / total, background: CAT_COLOR[p.c], borderRadius: 4 }} />)}
      </div>
      {labels && (
        <div className="row wrap small text-2" style={{ gap: 12 }}>
          {parts.map((p) => <span key={p.c} className="row" style={{ gap: 5 }}><span className="dot" style={{ background: CAT_COLOR[p.c] }} />{Math.round((p.min / total) * 100)}%</span>)}
        </div>
      )}
    </div>
  );
}
