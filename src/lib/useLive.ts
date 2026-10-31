import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';

export function useLive<T>(query: () => Promise<T>, deps: unknown[], initial: T): T {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setV, error: (e) => console.error(e) });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}
