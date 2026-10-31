# Security

- Browser-only app (static site + Supabase). No native app, no server of our own.
- Only the public **anon** key is shipped (`VITE_SUPABASE_ANON_KEY`). The service-role key must never be added to this repo or to Vercel env vars for this app.
- Row Level Security on every table (`supabase/migrations/0001_init.sql`), checked by `supabase/tests/rls_test.sql`:
  - results visible only to self, friends or group mates according to `results_visibility`;
  - `real_hcp` not selectable from `profiles`; exposed only via `profile_public` (respects `show_real_hcp`) or `my_profile()`;
  - clients cannot write server-computed fields (`drill_hcp`, `score`), titles, recommendations or achievements.
- Strict Content-Security-Policy and security headers in `vercel.json`; fonts are self-hosted (no Google Fonts request – relevant for GDPR in Germany).
- No analytics or third-party trackers. CI runs `npm audit`.
- Use a Supabase project in an EU region and enable email confirmation (Auth → Providers → Email).
