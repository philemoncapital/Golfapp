import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onUnlock } from '../lib/achievements';
import { signal } from '../lib/feedback';
import { AchIcon } from './AchIcon';
import type { AchRow } from '../engine/achievements';

/** Short, non-blocking toast per unlock (8.5) with the vibration / cup sound from 9.3. */
export function UnlockToasts() {
  const { t } = useTranslation();
  const [queue, setQueue] = useState<AchRow[]>([]);
  useEffect(() => onUnlock((rows) => { setQueue((q) => [...q, ...rows]); signal('station'); }), []);
  useEffect(() => {
    if (!queue.length) return;
    const h = setTimeout(() => setQueue((q) => q.slice(1)), 3500);
    return () => clearTimeout(h);
  }, [queue]);
  const r = queue[0];
  if (!r) return null;
  const name = t(`ach.${r.key}.name`);
  return (
    <Link to="/achievements" className="toast row" role="status" aria-live="polite" style={{ textDecoration: 'none', color: 'var(--text)' }}>
      <AchIcon k={r.key} tier={r.tier} size={36} label={name} />
      <span>{r.tier ? t('achv.tierUp', { name, tier: t(`tier.${r.tier}`) }) : t('achv.unlocked', { name })}</span>
    </Link>
  );
}
