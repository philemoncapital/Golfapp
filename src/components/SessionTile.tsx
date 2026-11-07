import { useTranslation } from 'react-i18next';
import type { LocalTemplate } from '../lib/db';
import { drillById } from '../lib/drills';
import { CategoryStrip } from './CategoryStrip';

/** Card for a saved session in a horizontally scrolling row (home screen and session builder). */
export function SessionTile({ tpl, onOpen, onDelete, active }: { tpl: LocalTemplate; onOpen: () => void; onDelete?: () => void; active?: boolean }) {
  const { t } = useTranslation();
  const drills = tpl.drill_ids.map((id) => drillById(id)).filter((d): d is NonNullable<typeof d> => !!d);
  const min = drills.reduce((a, d) => a + d.duration_min, 0);
  return (
    <div className={`tile ${active ? 'tile-active' : ''}`}>
      <button className="tile-main" onClick={onOpen} aria-label={`${tpl.name}, ${min} ${t('drills.min')}`}>
        <span className="tile-min num">{min}<small> {t('drills.min')}</small></span>
        <b className="tile-name">{tpl.name}</b>
        <span className="small muted">{t('session.drillsN', { count: drills.length })}</span>
        <CategoryStrip drills={drills} height={4} />
      </button>
      {onDelete && <button className="tile-x" aria-label={`${t('session.remove')}: ${tpl.name}`} onClick={onDelete}>✕</button>}
    </div>
  );
}
