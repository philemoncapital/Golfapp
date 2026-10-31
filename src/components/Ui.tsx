import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fmtDateTime } from '../lib/format';

/** "Offline – last updated …" when a block shows cached server data. */
export function StaleHint({ r }: { r: { stale: boolean; updated_at: string | null } }) {
  const { t, i18n } = useTranslation();
  if (!r.stale || !r.updated_at) return null;
  return <span className="small muted" role="status">{t('common.offline', { when: fmtDateTime(r.updated_at, i18n.language) })}</span>;
}

/** Empty state: one sentence about what fills this block, plus an optional link. */
export function Empty({ text, link }: { text: string; link?: { to: string; label: string } }) {
  return (
    <p className="small text-2" style={{ margin: 0 }}>
      {text}{link && <> <Link to={link.to}>{link.label}</Link></>}
    </p>
  );
}
