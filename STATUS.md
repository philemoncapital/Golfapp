# Build status (31 Oct 2026)

Order agreed with David: Phase 6 → Phase 7 → Home screen (9.0) → remaining open items of Phases 2–4 → Phase 8. Phase 5 waits for approval.

| Phase | Status | Notes |
|---|---|---|
| 1 Scaffold | ✅ done | Vite/React/TS PWA, Supabase schema + RLS, auth, security headers, i18n DE/EN, design tokens, offline store + sync |
| 2 Drill library | 🟡 partly | Excel import + SQL seed ✅, library/detail ✅, pictogram kit ✅ with 8 drill-specific pictograms. **Open:** remaining 17 pictograms, English drill texts |
| 3 Training | 🟡 mostly | Session builder + "I have X minutes" ✅, live mode ✅, all 8 scoring types ✅, notes ✅, offline queue ✅. **Open:** drag-and-drop reorder (arrows for now), station-change signals per drill |
| 4 Calculations | 🟡 partly | Handicap engine ✅, **server-side recomputation ✅ (0002 trigger, parity-tested)**, personal bests (engine) ✅, dashboard ✅, CSV export ✅. **Open:** charts, XLSX export |
| 5 Research gate | 🟡 partly | Approach drills **verified and added** (A1, A2, A3, A5; migration 0005). **Open:** recommendation engine, time split and category weights (Part B, awaiting approval), 5-session review |
| 6 Social | ✅ done | Friends (search, requests), groups (create/invite/join/leave, admins, titles toggle), leaderboards (category/overall/activity/per drill), fun titles (daily pg_cron), feed, friend profile, privacy settings, rank change after a drill. Migration `0002_social.sql` |
| 7 Achievements | ✅ done | 6 medals, 13 achievements, 10 title badges; server-side checks (triggers + daily job), Achievements screen with progress and detail sheet, unlock toasts with vibration/sound, achievements in group feed. Migration `0003_achievements.sql` |
| 9.0 Home screen | ✅ done | Replaces "Today": real + training HCP, category HCPs with gap, weekly goal, recent sessions (→ session detail), recent achievements, newest friend session, my rank per group and board incl. titles; empty states and offline cache |
| 8 Wrap-up | ⏳ | Round stats, account deletion, polish |

- **Demo mode** (`?demo=1`): invented test data (30 sessions, 10 friends, 2 groups), local only.

- **Redesign (Nov 2026):** pastel accents + gradients, home charts (HCP composition, 4 weeks), saved sessions (name/save/load, home tiles), live how-to, 25 illustrated pictograms (design-reviewed).

**Next:** open items of Phases 2–4 (17 pictograms, English drill texts, drag and drop, station signals, charts, XLSX export), then Phase 8.

## Database migrations (run each once in the Supabase SQL editor, in order)
| File | Status on Supabase |
|---|---|
| `0001_init.sql` + `seed.sql` | presumably applied (please confirm) |
| `0002_social.sql` | **to run** |
| `0003_achievements.sql` | **to run (after 0002)** |
| `0004_design_templates.sql` | **to run (after 0003)** – pastel accents, saved sessions |
| `0005_approach_drills.sql` | **to run (after 0004)** – 4 approach drills + sources |

## Tests
- `npm test` – engine unit tests (Vitest)
- `npm run test:db` – migrations + SQL tests on a throw-away local Postgres (HCP parity 1,520 vectors, RLS, social/privacy, achievements)
