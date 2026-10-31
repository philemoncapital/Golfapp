import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, type LocalResult } from '../lib/db';
import { useLive } from '../lib/useLive';
import { drillById, CAT_COLOR } from '../lib/drills';
import { hcpOf, sessionSummaries } from '../engine/stats';
import { fmtDate, fmtDateTime, fmtHcp } from '../lib/format';
import { Empty } from '../components/Ui';

/** One completed session from the local store: every result with its drill HCP and notes. */
export default function SessionDetail() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const session = useLive(() => db.sessions.get(id), [id], undefined);
  const results = useLive(() => db.results.where('session_id').equals(id).sortBy('created_at'), [id], [] as LocalResult[]);
  const back = <Link to="/" className="small">← {t('nav.home')}</Link>;
  if (!session) return <>{back}<Empty text={t('home.sessionMissing')} /></>;
  const sum = session.completed_at ? sessionSummaries([session], results)[0] : null;
  return (
    <>
      {back}
      <h1>{fmtDate(session.completed_at ?? session.created_at, i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
      {sum && (
        <div className="grid3">
          <div className="card"><span className="label">{t('common.min')}</span><div className="num" style={{ fontSize: 22, fontWeight: 500 }}>{sum.minutes}</div></div>
          <div className="card"><span className="label">{t('live.result')}</span><div className="num" style={{ fontSize: 22, fontWeight: 500 }}>{sum.n_results}</div></div>
          <div className="card"><span className="label">Ø HCP</span><div className="num" style={{ fontSize: 22, fontWeight: 500 }}>{fmtHcp(sum.mean_hcp)}</div></div>
        </div>
      )}
      <section className="card stack">
        {results.length === 0 ? <Empty text={t('home.noResultsInSession')} /> : (
          <ul className="list">
            {results.map((r) => {
              const d = drillById(r.drill_id);
              return (
                <li key={r.id} className="stack" style={{ gap: 2, justifyContent: 'center' }}>
                  <span className="row between">
                    <Link to={`/drills/${r.drill_id}`} className="row" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {d && <span className="dot" style={{ background: CAT_COLOR[d.category] }} />}{d?.title ?? r.drill_id}
                    </Link>
                    <b className="num">{fmtHcp(hcpOf(r))}</b>
                  </span>
                  <span className="small muted">{fmtDateTime(r.created_at, i18n.language)}{r.input.kind === 'value' ? ` · ${r.input.value}` : ''}{r.synced === 2 ? ` · ${t('home.rejected')}` : ''}</span>
                  {r.notes && <span className="small text-2">{r.notes}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
