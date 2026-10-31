import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { drillById, CAT_COLOR } from '../lib/drills';
import { Pictogram } from '../components/Pictogram';
import { db, getSettings } from '../lib/db';
import { useLive } from '../lib/useLive';
import { togglePlan } from '../lib/plan';
import { targetForHcp } from '../engine/handicap';
import type { BandTarget } from '../engine/types';

export const fmtTarget = (x: BandTarget) => (typeof x === 'number' ? String(x) : x === 'green' ? 'Grün / green' : Array.isArray(x) ? x.join('/') : `< ${x.radius_m} m`);

export default function DrillDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const d = drillById(id ?? '');
  const settings = useLive(getSettings, [], null);
  const plan = useLive(() => db.sessions.where('status').equals('planned').first(), [], undefined);
  if (!d) return <p>Not found. <Link to="/drills">←</Link></p>;
  const text = (i18n.language === 'en' && d.text.en) || d.text.de;
  const myBand = settings?.real_hcp != null ? targetForHcp(d.scoring.bands, settings.real_hcp) : null;
  const inPlan = plan?.drill_ids.includes(d.id);
  return (
    <>
      <Link to="/drills" className="small">← {t('nav.drills')}</Link>
      <div className="stack" style={{ gap: 4 }}>
        <span className="row small text-2"><span className="dot" style={{ background: CAT_COLOR[d.category] }} />{t(`cat.${d.category}`)} · {t(`area.${d.area}`)}</span>
        <h1>{d.title}</h1>
        {d.seen_with && <span className="small muted">{d.seen_with}</span>}
      </div>
      <div className="grid3">
        <div className="card"><span className="label">{t('drills.min')}</span><div className="num" style={{ fontSize: 22, fontWeight: 500 }}>{d.duration_min}</div></div>
        <div className="card"><span className="label">{t('drills.difficulty')}</span><div className="num" style={{ fontSize: 22, fontWeight: 500 }}>{d.difficulty}/6</div></div>
        <div className="card"><span className="label">{t('drills.target')}</span><div className="num" style={{ fontSize: 22, fontWeight: 500 }}>{myBand ? fmtTarget(myBand.target) : '–'}</div></div>
      </div>
      {d.needs_verification && <p className="small warn">{t('drills.verify', { what: d.needs_verification })}</p>}
      <div className="card"><Pictogram drill={d} /></div>
      {i18n.language === 'en' && !d.text.en && <p className="small muted">{t('drills.enPending')}</p>}
      <section className="stack">
        <div><h2>{t('drills.setup')}</h2><p className="text-2">{text.setup}</p></div>
        <div><h2>{t('drills.goal')}</h2><p className="text-2">{text.goal}</p></div>
        <div><h2>{t('drills.procedure')}</h2><p className="text-2">{text.procedure}</p></div>
        <div>
          <h2>{t('drills.scoring')}</h2>
          <div className="card stack" style={{ marginTop: 8 }}>
            {d.scoring.bands.map((b) => (
              <div key={`${b.hcp_hi}`} className="row between" style={{ color: b === myBand ? 'var(--accent)' : undefined }}>
                <span className="num">HCP {b.hcp_hi}–{b.hcp_lo}</span><b className="num">{fmtTarget(b.target)}</b>
              </div>
            ))}
          </div>
        </div>
      </section>
      <button className={`btn block ${inPlan ? '' : 'primary'}`} onClick={() => togglePlan(d.id)}>{inPlan ? `✓ ${t('drills.added')}` : t('drills.add')}</button>
    </>
  );
}
