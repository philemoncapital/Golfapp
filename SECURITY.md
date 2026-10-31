# Security

- Browser-only app (static site + Supabase). No native app, no server of our own.
- Only the public **anon** key is shipped (`VITE_SUPABASE_ANON_KEY`). The service-role key must never be added to this repo or to Vercel env vars for this app.
- Row Level Security on every table (`supabase/migrations/0001_init.sql`), checked by `supabase/tests/rls_test.sql`:
  - results visible only to self, friends or group mates according to `results_visibility`;
  - `real_hcp` not selectable from `profiles`; exposed only via `profile_public` (respects `show_real_hcp`) or `my_profile()`;
  - clients cannot write server-computed fields (`drill_hcp`, `score`), titles, recommendations or achievements.
- Since `0002_social.sql`:
  - Server-computed values (`drill_hcp`, `score`) are recomputed by a trigger on every insert; raw input is validated (shape, ranges, kind must match the drill's scoring type). Results cannot be updated by clients.
  - Fixed two holes in 0001: an addressee could rewrite `friendships.requester` (forced friendship), and an invited member could change `group_members.group_id` (join any group). Both tables are now written only through column grants (`status`) or security-definer RPCs with their own checks.
  - Friend requests (20/day), search (30 per 5 min), group creation (10/day) and invitations (50/day) are rate-limited in the database (`rate_limits`, not readable by clients). Search returns display names only; email search needs an exact match.
  - All RPCs are revoked from `anon`; internal helpers (`member_category_stats`, `board_rows`, `compute_group_titles`, …) are not callable through the API at all.
  - Leaderboards and the feed check group membership server-side and drop members whose visibility is "nobody"; hidden last-place titles are filtered in RLS as well as in the RPCs.
  - `supabase/tests/*.sql` run against a local Postgres with a Supabase auth stub (`npm run test:db`): parity, RLS and social/privacy tests.
- Strict Content-Security-Policy and security headers in `vercel.json`; fonts are self-hosted (no Google Fonts request – relevant for GDPR in Germany).
- No analytics or third-party trackers. CI runs `npm audit`.
- Use a Supabase project in an EU region and enable email confirmation (Auth → Providers → Email).
