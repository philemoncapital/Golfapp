import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DRILLS, CAT_COLOR } from '../lib/drills';
import { CATEGORIES, type Category } from '../engine/types';
import { Pictogram } from '../components/Pictogram';
import { db } from '../lib/db';
import { useLive } from '../lib/useLive';
import { togglePlan } from '../lib/plan';

export default function Library() {
  const { t } = useTranslation();
  const [cat, setCat] = useState<Category | 'all'>('all');
  const plan = useLive(() => db.sessions.where('status').equals('planned').first(), [], undefined);
  const list = DRILLS.filter((d) => cat === 'all' || d.category === cat);
  return (
    <>
      <h1>{t('nav.drills')}</h1>
      <div className="row wrap" role="group">
        <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>{t('drills.all')}</button>
        {CATEGORIES.map((c) => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{t(`cat.${c}`)}</button>)}
      </div>
      <div className="grid2">
        {list.map((d) => {
          const inPlan = plan?.drill_ids.includes(d.id);
          return (
            <article key={d.id} className="card stack" style={{ padding: 12 }}>
              <Link to={`/drills/${d.id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="stack">
                <Pictogram drill={d} size="sm" />
                <span className="row"><span className="dot" style={{ background: CAT_COLOR[d.category] }} /><b>{d.title}</b></span>
                <span className="small muted num">{d.duration_min} {t('drills.min')} · {t('drills.difficulty')} {d.difficulty}/6</span>
              </Link>
              <button className={`btn ${inPlan ? 'on' : ''}`} onClick={() => togglePlan(d.id)} aria-pressed={!!inPlan}>{inPlan ? `✓ ${t('drills.added')}` : t('drills.add')}</button>
            </article>
          );
        })}
      </div>
    </>
  );
}
