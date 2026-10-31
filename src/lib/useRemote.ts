import { useCallback, useEffect, useState } from 'react';
import { cached } from './api';
import { onSync } from './sync';

export interface Remote<T> { value: T | null; updated_at: string | null; stale: boolean; loading: boolean; error: string | null; reload: () => void }

/** Loads server data with an offline fallback (last cached copy); reloads after every successful sync. */
export function useRemote<T>(key: string | null, load: () => Promise<T>, deps: unknown[] = []): Remote<T> {
  const [st, setSt] = useState<Omit<Remote<T>, 'reload'>>({ value: null, updated_at: null, stale: false, loading: !!key, error: null });
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    if (!key) { setSt({ value: null, updated_at: null, stale: false, loading: false, error: null }); return; }
    let alive = true;
    setSt((s) => ({ ...s, loading: true }));
    cached(key, load)
      .then((r) => alive && setSt({ value: r?.value ?? null, updated_at: r?.updated_at ?? null, stale: r?.stale ?? false, loading: false, error: null }))
      .catch((e: Error) => alive && setSt((s) => ({ ...s, loading: false, error: e.message })));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, n, ...deps]);
  useEffect(() => onSync((s, pushed) => { if (s === 'ok' && pushed > 0) reload(); }), [reload]);
  return { ...st, reload };
}
