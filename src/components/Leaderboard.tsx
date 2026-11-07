import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Board, type BoardRow } from '../lib/api';
import { useRemote } from '../lib/useRemote';
import { fmtHcp } from '../lib/format';
import { TitleIcon, type TitleBoard } from './TitleIcon';
import { StaleHint, Empty } from './Ui';

export const BOARDS: Board[] = ['overall', 'tee', 'approach', 'short', 'putting', 'activity'];

/** Group leaderboard with board tabs (8.1). Used on the group page and as the landing view of the Friends tab. */
export function Leaderboard({ groupId, header }: { groupId: string; header?: React.ReactNode }) {
  const { t } = useTranslation();
  const [board, setBoard] = useState<Board>('overall');
  const rows = useRemote<BoardRow[]>(`board:${groupId}:${board}`, () => api.leaderboard(groupId, board), [board, groupId]);
  const ranked = (rows.value ?? []).filter((r) => r.eligible);
  const unranked = (rows.value ?? []).filter((r) => !r.eligible);
  const fmtVal = (r: BoardRow) => (board === 'activity' ? `${r.value ?? 0} ${t('common.min')}` : fmtHcp(r.value));
  const rule = board === 'activity' ? t('group.activityRule') : board === 'overall' ? t('group.eligibilityOverall') : t('group.eligibility');
  return (
      <section className="card stack" aria-label={t('group.leaderboard')}>
        {header ?? <div className="row between"><span className="label">{t('group.leaderboard')}</span><span className="small muted">{t('group.last30')}</span></div>}
        <div className="scroll-x" role="tablist">
          {BOARDS.map((b) => <button key={b} role="tab" className="chip" aria-selected={board === b} aria-pressed={board === b} onClick={() => setBoard(b)}>{t(`board.${b}`)}</button>)}
        </div>
        <StaleHint r={rows} />
        {ranked.length === 0 && !rows.loading && <Empty text={rule} />}
        <ol className="list">
          {ranked.map((r) => (
            <li key={r.user_id} className="row between">
              <span className="row" style={{ gap: 8 }}>
                <span className="rank">{r.rank}</span>
                <span className={r.is_me ? 'me' : undefined} style={{ fontWeight: r.is_me ? 600 : 400 }}>{r.is_me ? t('common.you') : r.display_name}</span>
                {r.title && board !== 'activity' && <TitleIcon board={board as TitleBoard} type={r.title} size={22} label={false} />}
              </span>
              <b className="num">{fmtVal(r)}</b>
            </li>
          ))}
        </ol>
        {unranked.length > 0 && (
          <>
            <span className="label">{t('group.notRanked')}</span>
            <span className="small muted">{rule}</span>
            <ul className="list">
              {unranked.map((r) => (
                <li key={r.user_id} className="row between text-2">
                  <span className={r.is_me ? 'me' : undefined}>{r.is_me ? t('common.you') : r.display_name}</span>
                  {board !== 'activity' && <span className="small muted num">{r.n_results} / {r.n_drills}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
  );
}
