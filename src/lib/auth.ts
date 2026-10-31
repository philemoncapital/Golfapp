import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { isDemo, DEMO_ME } from './demo';

const DEMO_USER = { id: DEMO_ME, email: 'demo@pulse.local' } as User;

/** Current Supabase user; undefined while loading, null when signed out or in local mode. */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(isDemo ? DEMO_USER : supabase ? undefined : null);
  useEffect(() => {
    if (!supabase || isDemo) return;
    void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}
