import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, type DrillBoardRow, type MyGroup } from '../lib/api';
import { useRemote } from '../lib/useRemote';
import { useUser } from '../lib/auth';
import { fmtHcp } from '../lib/format';
import { StaleHint, Empty } from './Ui';

/** Drill detail page: best results of group members for this drill (8.1, per drill). Hidden when not in a group. */
export function GroupDrillBoard({ drillId }: { drillId: string }) {
  const { t } = useTranslation();
  const user = useUser();
  const groups = useRemote<MyGroup[]>(user ? 'groups' : null, api.myGroups, [user?.id]);
  const active = (groups.value ?? []).filter((g) => g.my_status === 'active');
  const [pick, setPick] = useState<string | null>(null);
  const gid = pick ?? active[0]?.group_id ?? null;
  const rows = useRemote<DrillBoardRow[]>(gid ? `drillboard:${gid}:${drillId}` : null, () => api.drillBoard(gid!, drillId), [gid, drillId]);
  if (!active.length) return null;
  return (
    <section className="card stack" aria-label={t('group.inYourGroup')}>
      <div className="row between">
        <span className="label">{t('group.inYourGroup')}</span>
        {active.length > 1 ? (
          <select className="field" style={{ width: 'auto', minHeight: 36 }} value={gid ?? ''} onChange={(e) => setPick(e.target.value)} aria-label={t('social.groups')}>
            {active.map((g) => <option key={g.group_id} value={g.group_id}>{g.name}</option>)}
          </select>
        ) : <Link to={`/groups/${gid}`} className="small">{active[0].name}</Link>}
      </div>
      <StaleHint r={rows} />
      {(rows.value ?? []).length === 0 ? <Empty text={t('group.noDrillResults')} /> : (
        <>
          <div className="row between small muted"><span /><span className="row" style={{ gap: 16 }}><span>{t('group.best30')}</span><span>{t('group.bestAll')}</span></span></div>
          <ol className="list">
            {(rows.value ?? []).map((r) => (
              <li key={r.user_id} className="row between">
                <span className="row" style={{ gap: 8 }}><span className="rank">{r.rank ?? '–'}</span><span className={r.is_me ? 'me' : undefined}>{r.is_me ? t('common.you') : r.display_name}</span></span>
                <span className="row num" style={{ gap: 16 }}>
                  <b style={{ minWidth: 44, textAlign: 'right' }}>{r.best30_hcp == null ? '–' : r.best30_score ?? fmtHcp(r.best30_hcp)}</b>
                  <span className="text-2" style={{ minWidth: 44, textAlign: 'right' }}>{r.best_score ?? fmtHcp(r.best_hcp)}</span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
