# Pulse – golf training (browser app)

Static web app (Vite + React) with Supabase for logins and data. Works offline; installable from the browser.

## Deploy without installing anything (≈ 20 min)

1. **GitHub:** create a free account → *New repository* → name `golf-pulse`, **Private** → *uploading an existing file* → drag in all files and folders from this zip (including `.github`) → *Commit*.
2. **Supabase:** create a free account → *New project* → region **Central EU (Frankfurt)** → save the database password.
   - Open the **SQL Editor** → paste the whole of `supabase/migrations/0001_init.sql` → *Run*.
   - New query → paste `supabase/seed.sql` → *Run* (loads the 25 drills).
   - Then run every further file in `supabase/migrations/` **in order** (`0002_social.sql`, `0003_…`), each once, each in a new query. Never edit an applied migration; changes come as a new file.
   - `0002` tries to enable **pg_cron** for the daily title job. If the editor reports a notice instead, enable *Database → Extensions → pg_cron* and run the `cron.schedule(…)` line from the notice.
   - In the project's **API settings**, copy the *Project URL* and the *anon public* key.
   - In **Authentication → Providers → Email**, keep *Confirm email* switched on.
3. **Vercel:** create a free account with *Continue with GitHub* → *Add New → Project* → import `golf-pulse` (framework is detected as Vite).
   - Under *Environment Variables* add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the two values from step 2 → *Deploy*.
   - Copy the address Vercel shows, e.g. `https://golf-pulse.vercel.app`.
4. **Supabase again:** *Authentication → URL Configuration* → set *Site URL* to the Vercel address and add it under *Redirect URLs*.
5. **iPhone:** open the Vercel address in **Safari** → *Share* → *Add to Home Screen*. Open the app → *Profil* → *Registrieren* → confirm the email → enter your handicap.
6. **Friends:** send them the address; they register the same way. (Friends/groups UI arrives in Phase 6.)

Without step 2–4 the app still runs in **local mode** (data only on that device).

## Local development (optional)
Requires Node 20+.
```
npm install
cp .env.example .env.local   # fill in the two Supabase values
npm run dev                  # http://localhost:5173
npm test                     # engine tests
npm run seed:drills          # re-import Golfuebungen.xlsx → src/data + supabase/seed.sql
```
Database tests: `npm run test:db` starts a throw-away local Postgres 16, applies all migrations + seed with a minimal Supabase auth stub and runs `supabase/tests/*.sql` (HCP parity with the TS engine, RLS, friends/groups/leaderboards/titles). The test files roll back, so they can also be run on a **scratch** Supabase project – never on production. After changing the engine run `npm run gen:hcp-vectors`.

## Docs
`PROMPT.md` (full spec) · `STATUS.md` (what is done) · `ASSUMPTIONS.md` · `SECURITY.md` · `CREDITS.md`
