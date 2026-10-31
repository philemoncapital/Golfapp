/**
 * Demo mode: a separate local database filled with invented test data (you + 10 friends, 2 groups).
 * Nothing is sent to Supabase. Switch on with ?demo=1 or the button in Profile, off with ?demo=0 or the banner.
 */
const KEY = 'pulse-demo';
function read(): boolean {
  try {
    const p = new URLSearchParams(window.location.search).get('demo');
    if (p === '1') localStorage.setItem(KEY, '1');
    if (p === '0') localStorage.removeItem(KEY);
    if (p !== null) window.history.replaceState(null, '', window.location.pathname);
    return localStorage.getItem(KEY) === '1';
  } catch { return false; }
}
export const isDemo = typeof window !== 'undefined' && read();
export const DEMO_ME = 'd0000000-0000-4000-8000-000000000000';
export function setDemo(on: boolean) {
  try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  window.location.assign('/');
}
