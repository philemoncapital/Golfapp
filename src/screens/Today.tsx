import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, getSettings } from '../lib/db';
import { useLive } from '../lib/useLive';
import { DRILLS, CAT_COLOR, drillById } from '../lib/drills';
import { categoryHcps, overallHcp } from '../engine/handicap';
import type { DrillResult } from '../engine/types';

const fmtHcp = (h: number | null) => (h === null ? '–' : h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1));

function weekStart(d = new Date()) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x.toISOString();
}

export default function Today() {
  const { t } = useTranslation();
  const settings = useLive(getSettings, [], null);
  const results = useLive(() => db.results.toArray(), [], [] as DrillResult[]);
  const since = weekStart();
  const minutes = results.filter((r) => r.created_at >= since).reduce((a, r) => a + (drillById(r.drill_id)?.duration_min ?? 0), 0);
  const goal = settings?.weekly_goal_min ?? 180;
  const cats = categoryHcps(DRILLS, results);
  const overall = overallHcp(cats);

  return (
    <>
      <div className="row between">
        <h1>{t('nav.today')}</h1>
        <span className="small muted">{new Date().toLocaleDateString(settings?.language === 'en' ? 'en-GB' : 'de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>

      <section className="card stack" aria-label={t('today.week')}>
        <span className="label">{t('today.week')}</span>
        <div className="row" style={{ alignItems: 'baseline' }}>
          <span className="big">{minutes}</span>
          <span className="text-2">{t('today.of', { goal })}</span>
        </div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={minutes}><span style={{ width: `${Math.min(100, (minutes / goal) * 100)}%` }} /></div>
      </section>

      <section className="card stack">
        <div className="row between">
          <span className="label">{t('today.trainingHcp')}</span>
          <span className="small text-2">{t('today.realHcp')}: <b className="num">{settings?.real_hcp ?? '–'}</b></span>
        </div>
        <span className="big">{fmtHcp(overall)}</span>
        {overall === null && <span className="small muted">{t('today.needs')}</span>}
        <hr className="divider" />
        {cats.map((c) => {
          const gap = c.hcp !== null && settings?.real_hcp != null ? c.hcp - settings.real_hcp : null;
          return (
            <div key={c.category} className="row between">
              <span className="row"><span className="dot" style={{ background: CAT_COLOR[c.category] }} />{t(`cat.${c.category}`)}</span>
              <span className="row">
                {gap !== null && <span className={`small num ${gap > 2 ? 'warn' : 'muted'}`}>{gap > 0 ? '+' : ''}{gap.toFixed(1)}</span>}
                <b className="num" style={{ minWidth: 44, textAlign: 'right' }}>{fmtHcp(c.hcp)}</b>
              </span>
            </div>
          );
        })}
        <span className="small muted">{t('today.estimate')}</span>
        {settings?.real_hcp == null && <Link to="/profile" className="small">{t('today.setHcp')}</Link>}
      </section>

      {results.length === 0 && <p className="text-2">{t('today.noSessions')}</p>}
      <Link to="/session" className="btn primary block">{t('session.title')}</Link>
    </>
  );
}
