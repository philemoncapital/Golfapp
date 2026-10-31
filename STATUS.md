# Build status (31 Oct 2026)

| Phase | Status | Notes |
|---|---|---|
| 1 Scaffold | ✅ done | Vite/React/TS PWA, Supabase schema + RLS (tested), auth, security headers, i18n DE/EN, design tokens, offline store + sync |
| 2 Drill library | 🟡 partly | Excel import + SQL seed ✅, library/detail ✅, pictogram kit ✅ with 8 drill-specific pictograms (others use a per-area fallback). **Open:** remaining 17 pictograms, English drill texts |
| 3 Training | 🟡 mostly | Session builder + "I have X minutes" ✅, live mode (timer from timestamps, wake lock, vibration → cup sound) ✅, inputs for all 8 scoring types ✅, notes ✅, offline queue ✅. **Open:** drag-and-drop reorder (arrows for now), station-change signals per drill |
| 4 Calculations | 🟡 partly | Handicap engine + 18 unit tests ✅, dashboard (weekly minutes, category/overall HCP vs real) ✅, CSV export ✅. **Open:** server-side recomputation (edge function), charts, personal bests, XLSX export |
| 5 Research gate | ⏳ not started | Needs your approval of approach drills + coaching sources. Until then: equal split, equal category weights |
| 6 Social | ⏳ schema only | Tables + RLS for friends/groups/titles exist; UI and leaderboards open |
| 7 Achievements | ⏳ schema only | Tables exist; definitions, checks and screen open |
| 8 Wrap-up | ⏳ | Round stats, account deletion, polish |

Continue in Claude Code: "Read PROMPT.md and STATUS.md, then continue with the open items of Phase 2."
