# Build status (31 Oct 2026)

Order agreed with David: Phase 6 → Phase 7 → Home screen (9.0) → remaining open items of Phases 2–4 → Phase 8. Phase 5 waits for approval.

| Phase | Status | Notes |
|---|---|---|
| 1 Scaffold | ✅ done | Vite/React/TS PWA, Supabase schema + RLS, auth, security headers, i18n DE/EN, design tokens, offline store + sync |
| 2 Drill library | 🟡 partly | Excel import + SQL seed ✅, library/detail ✅, pictogram kit ✅ with 8 drill-specific pictograms. **Open:** remaining 17 pictograms, English drill texts |
| 3 Training | 🟡 mostly | Session builder + "I have X minutes" ✅, live mode ✅, all 8 scoring types ✅, notes ✅, offline queue ✅. **Open:** drag-and-drop reorder (arrows for now), station-change signals per drill |
| 4 Calculations | 🟡 partly | Handicap engine ✅, **server-side recomputation ✅ (0002 trigger, parity-tested)**, personal bests (engine) ✅, dashboard ✅, CSV export ✅. **Open:** charts, XLSX export |
| 5 Research gate | ⏸ waiting for approval | Draft in `docs/PHASE5_PROPOSAL.md` – sources **not yet verified** (network policy blocked the golf sites). Until approved: equal split, equal category weights |
| 6 Social | ✅ done | Friends (search, requests), groups (create/invite/join/leave, admins, titles toggle), leaderboards (category/overall/activity/per drill), fun titles (daily pg_cron), feed, friend profile, privacy settings, rank change after a drill. Migration `0002_social.sql` |
| 7 Achievements | ⏳ next | Tables exist; definitions, checks and screen open |
| 9.0 Home screen | ⏳ after 7 | Spec in PROMPT.md 9.0 |
| 8 Wrap-up | ⏳ | Round stats, account deletion, polish |

## Database migrations (run each once in the Supabase SQL editor, in order)
| File | Status on Supabase |
|---|---|
| `0001_init.sql` + `seed.sql` | presumably applied (please confirm) |
| `0002_social.sql` | **to run** |

## Tests
- `npm test` – engine unit tests (Vitest)
- `npm run test:db` – migrations + SQL tests on a throw-away local Postgres (HCP parity 1,520 vectors, RLS, social/privacy)
