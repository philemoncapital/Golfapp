# Build prompt: Golf Training App ("Pulse")

## 0. Role and working mode

You are building a production-quality, **browser-based** golf training app for one primary user (David) and his friends. There is no native app and no app-store build. The app runs in the browser and can optionally be added to the home screen as a PWA.

Work in phases (see section 14). At the end of each phase: run the app, run the tests, summarise what was built, and list open questions.

**Never invent golf data, drills, benchmarks or coaching claims.** Anything not sourced is either taken from the attached files, derived by a formula documented in this prompt, or explicitly labelled as an assumption in the UI and in `ASSUMPTIONS.md`. The only invented content is the fun titles, medals and achievements in section 8, which are game elements, not golf facts.

**Attached inputs**
- `Golfuebungen.xlsx` – 25 drills from a German drill booklet. Columns: Nr, Bereich, Titel, Gesehen bei, Zeit (Min), Anspruch, Trainingsbereich, Material, Aufbau, Ziel, Ablauf, Scoring nach HCP, Prüfen am Original.
  - The column "Prüfen am Original" flags values that were hard to read in the photos (mostly durations). Seed them as given, but mark those fields `needs_verification = true` and show a small "verify" hint in the drill editor. They stay editable.
- Design reference: claude.ai canvas "Golf Training App – Style Directions", row **D · Pulse**. Use its layout and structure, but apply the adjusted visual style in section 11, which sits between the hairline version and the bolder first version.

## 1. Product summary

1. Pick drills from a library and build a training session. The session's total duration is the sum of drill durations; for example, 3 drills of 20 min make a 1 h session.
2. Run the session on the phone at the range. Each drill has a guided live screen with a timer, a pictogram and big result buttons or number fields.
3. The app estimates a **training handicap**, overall and per game category, from drill results. It compares this estimate with the user's real handicap.
4. The app recommends how to split practice time. The first recommendation is based on the real handicap; after that, a review is produced after every 5 completed sessions. Recommendations are grounded in cited coaching and strokes-gained research.
5. Charts show sessions and building blocks over the last weeks.
6. Friends and groups: accounts with names and logins, friend requests, groups, leaderboards, and fun titles for the leader and the last place in each category.
7. Medals and achievements.
8. Bilingual UI in English and German with a toggle.

## 2. Tech stack (browser-based)

- **Frontend:** Vite + React + TypeScript, deployed as a static site.
  - Mobile-first at 390 px width, works up to desktop.
  - Installable as a PWA (manifest + service worker) for offline use; no native wrappers.
- **Backend:** Supabase.
  - Postgres for data.
  - Supabase Auth: email + password and magic link, with email verification required.
  - Row Level Security on every table.
  - Any privileged logic (leaderboards, title assignment, achievement checks) runs in Postgres functions or Supabase Edge Functions, never in the client.
- **Charts:** custom SVG components in the style of section 11. Do not use a charting library's default look.
- **Offline:** IndexedDB (e.g. Dexie) as the local store, plus a sync queue that pushes to Supabase when online. Conflict rule: last-write-wins per result row; results are append-only.
- **Export:** CSV and XLSX (SheetJS).
- **i18n:** `react-i18next` with `en.json` and `de.json`. Drill content is stored per language, as `title_en`, `title_de`, etc.
- **Hosting:** Vercel. Read the Supabase URL and anon key from environment variables.
- **Tests:** Vitest for all calculation logic (handicap engine, session builder, recommendations, leaderboards, titles, achievements), and Playwright for one end-to-end flow: sign up → build session → run drill → see results → see group leaderboard.

## 3. Security and privacy (keep the attack surface small)

- Only the Supabase **anon key** goes to the browser; the service-role key is never used in client code or committed.
- RLS on every table, with automated policy tests showing that users can only read what their privacy settings and friendships allow.
- Set a strict Content-Security-Policy and security headers via `vercel.json` (no inline scripts, `frame-ancestors 'none'`, HSTS).
- Validate all inputs on the server side (Postgres constraints and checks); never trust client-computed scores. Store raw inputs and recompute derived values server-side.
- Rate-limit friend requests and search. Search only shows display names; email search requires an exact match.
- Use a Supabase project in an **EU region**. Provide data export (section 9.9) and full account deletion (GDPR). Add a short privacy page.
- Keep dependencies minimal and run `npm audit` in CI. Do not add analytics or third-party trackers.

## 4. Drill library

### 4.1 Seed data
- Import all 25 drills from the Excel file into a typed seed file, `drills.seed.ts`. Generate it with a script that reads the xlsx, so it can be re-run.
- Store each drill with:
  - id, area (booklet tab), category (section 5), title, seen_with, duration_min, difficulty (1–6), shot_type, equipment;
  - setup, goal, procedure: in DE and EN, translated faithfully from the German text, without adding content;
  - scoring definition (section 6.1);
  - `max_score` where the drill has a theoretical maximum (needed for "perfect score" achievements; null otherwise);
  - the harder variant text (optional);
  - pictogram spec (section 7);
  - needs_verification flags.
- Parse the "Scoring nach HCP" strings into structured benchmark tables. Write a parser test that covers all 25 rows. Note the irregular bands that must be preserved exactly:
  - Fade and Draw: the first band is 36-27.
  - Hit Three Greens: the middle band is 26-14.
  - Chip to a Towel: the bands are 54-37 and 36-27.

### 4.2 New approach drills (research task, requires approval)
The booklet has only one true approach drill (Hit Three Greens). Find **4–6 additional approach drills (roughly 80–200 m)** from credible, citable sources: college coaches, tour pros or their coaches, PGA/national-federation coaching material, and established instruction outlets.

Requirements:
- **Format:** each drill must fit the booklet format exactly: setup, goal, procedure, duration, difficulty, equipment, and a scoring table by HCP band.
- **No invented drills.** Each drill needs a real source (URL, author, date) stored in `source_url`, `source_author` and `source_note`.
- **Benchmarks:** if the source gives handicap benchmarks, use them. If it does not, derive the HCP table from published proximity-by-handicap data and document the derivation in `ASSUMPTIONS.md`. Good starting points for that data:
  - Arccos proximity to the hole by handicap bracket (e.g. MyGolfSpy, "What layup yardage is your sweet spot?");
  - Shot Scope proximity by handicap (e.g. Golf Monthly, "How close to the pin do amateur golfers hit their approach shots?").
- **Approval gate:** stop and present the candidate drills (name, source, how benchmarks were derived) to the user for approval **before** adding them to the seed.

### 4.3 Custom drills
- The user can create their own drills using the same form: all fields, category, duration, scoring type, and an HCP table with 3, 5 or 6 bands.
- Custom drills are private by default and can optionally be shared with friends or groups.
- A drill is only used in the training handicap and in leaderboards if it has a complete HCP table.

## 5. Game categories (strokes-gained structure)

Use the four strokes-gained categories (Mark Broadie, *Every Shot Counts*):

| Category | Drills |
|---|---|
| **Off the Tee** | Fade and Draw, Short Aims, 14 Fairways, Nine Drives |
| **Approach** | Hit Three Greens, plus the new approach drills from 4.2 |
| **Short Game** (≤ ~50 m incl. bunker) | Five Different Clubs, Attack the Flag, Four Stations, Sandy Par, Hit It Close, Hit the Spot, Chip to a Towel, Worstball Chipping, Up & Down Series, Beat 21 |
| **Putting** | Draw Back, Five Balls, Up & Down (O'Meara), Pace Putting, Control the Line, Hit the Hall, Around the World, Shorties under Pressure, Shootout, Circle Putting |

The booklet areas (Driving Range, Pitching Green, Bunker, Chipping Green, Putting Green) remain a secondary filter.

## 6. Result capture and training-handicap engine

### 6.1 Scoring types
Implement a small set of scoring types. Each drill's live screen is generated from its type.

| Type | Meaning | Examples |
|---|---|---|
| `count_higher_better` | number of hits or points | 14 Fairways, Hit the Spot |
| `count_lower_better` | strokes or putts | Sandy Par, Beat 21, Draw Back |
| `time_lower_better` | minutes until done, with a fallback count | Chip to a Towel |
| `points_per_ball` | buttons with point values, e.g. +2 / +1 / 0 / −1 | Hit the Hall, Pace Putting, Five Balls, Four Stations |
| `streak` | best streak in series | Circle Putting, Shootout, Around the World |
| `stations_reached` | furthest station | Short Aims |
| `radius_by_band` | booklet gives a radius per HCP band, not a score | Five Different Clubs, Attack the Flag |
| `series_triplet` | target like 10/4/2 | Shorties under Pressure |

Input UX:
- Large tap targets (≥ 64 px).
- One tap per ball, with an undo button.
- A numeric stepper for totals.
- Every drill can also be entered as a total afterwards: "quick entry".

For `radius_by_band`:
- Per ball, the user taps the distance bucket the ball finished in (e.g. holed / <1.5 m / <2 m / <3 m / <4 m / <5–7 m / green / missed).
- The app then computes the score under every band's radius.
- A band counts as "met" at ≥ 10 of 20 balls for Five Different Clubs, as stated in the booklet. For Attack the Flag no threshold is given, so use ≥ 5 of 9 balls and label this as an assumption.

### 6.2 From a result to a drill HCP
For each drill, build anchor points (band midpoint HCP, band target). Examples: band 54-27 has midpoint 40.5, band 26-12 has midpoint 19, band 11-0 has midpoint 5.5.

- Map a result to an HCP estimate by **piecewise-linear interpolation** between the anchors, taking the direction into account (higher or lower is better).
- Extrapolate linearly beyond the outer anchors, then clamp to the range [+5, 54].
- For `radius_by_band`, the HCP is the midpoint of the best band met, interpolated towards the next band using the share of hits.
- For `series_triplet`, use a progress index across the 3 positions, then interpolate.
- Document every formula in `ASSUMPTIONS.md` and cover it with unit tests that use the booklet tables.

### 6.3 Aggregation
- **Drill level:** drill HCP = mean of the last 3 results, with older results decaying; show the trend.
- **Category level:** category HCP = mean of the drill HCPs in that category, weighted by the number of results (capped at 5 per drill).
  - Show the category HCP only if there are at least 2 different drills with results, otherwise show "not enough data".
- **Overall training HCP:** weighted mean of the category HCPs.
  - Default weights must come from cited strokes-gained research on how much each category contributes to score differences among amateurs.
  - If no source gives exact weights, use equal weights and label them as such.
  - The user can view the weights; they are not editable in v1.
- Always show the training HCP next to the real HCP and the gap per category. Label it clearly as an estimate based on training drills.

## 7. Pictograms

- Every drill gets a top-down SVG pictogram in the style of section 11: 1.5–2 px strokes, accent colour for the ball path, muted colour for setup items, readable distance labels.
- Build a component kit:
  - setup items: Tee, Hole, Flag, Ball, Club or alignment stick (line);
  - zones: Corridor (dashed rectangle), LandingZone, Radius ring, Green and Bunker shapes;
  - annotations: Arrow (straight or curved for fade/draw), DistanceLabel, Station marker, PointsTag (+1/+2).
- Each drill's `pictogram` field is a declarative JSON spec (elements with coordinates in metres, rendered to scale).
- Show the pictogram on:
  - the drill library card (small);
  - the drill detail page (large, with the setup steps);
  - the live screen (with the active station highlighted).
- Recreate each diagram from the drill description. Do not copy or trace the booklet artwork.

## 8. Leaderboards, fun titles, medals and achievements

### 8.1 Group leaderboards
Leaderboards exist only inside a friends group. Members see only fellow members who allow results to be shown to that group. Show them on:
- the group page;
- each drill's detail page ("in your group");
- the post-drill summary ("you moved from 4th to 2nd").

Leaderboard types:
- **Per category:** ranking by category training HCP over the last 30 days. To be eligible, a member needs ≥ 3 results from ≥ 2 drills in that category within the window.
- **Overall:** ranking by overall training HCP, with the same eligibility logic across categories.
- **Per drill:** best result in the last 30 days and all-time best.
- **Activity:** practice minutes in the last 30 days.

Tie rule: equal values share a rank; between tied members the earlier achievement leads.

### 8.2 Fun titles (leader and last place)
- In each group, the leader and the last place of each category leaderboard and the overall leaderboard hold a title.
- Titles require ≥ 3 eligible members.
- Titles are recomputed daily by a scheduled database function and are shown with their pictogram next to the name.
- Holding a title, or having held it, earns the matching badge on the Achievements screen, with a counter of weeks held.
- Group admins can switch titles off for their group. A member can hide their own last-place titles.

| Board | Leader title (EN / DE) | Leader pictogram | Last-place title (EN / DE) | Last-place pictogram |
|---|---|---|---|---|
| Off the Tee | Big Stick / Der Hammer | Driver with motion lines | Tree Hugger / Baumflüsterer | Tree with ball stuck in it |
| Approach | Pin Seeker / Fahnenjäger | Flag inside crosshair | Air Mail / Luftpost | Ball with envelope wings flying over a green |
| Short Game | Wedge Wizard / Wedge-Zauberer | Wedge with sparkles | Chili Dipper / Erdarbeiter | Wedge digging a divot |
| Putting | Ice Veins / Eiskalt | Snowflake over hole | Lip-Out Legend / Lochrand-Legende | Ball circling the cup rim |
| Overall | Club Champion / Clubmeister | Crown over flag | Ball Donor / Ballspender | Ball sinking with water ripples |

### 8.3 Medals (tiered: bronze / silver / gold)

| Medal (EN / DE) | Criterion (bronze / silver / gold) |
|---|---|
| Range Rat / Rangeratte | completed sessions: 10 / 50 / 150 |
| Grinder / Dauerbrenner | practice minutes: 500 / 2,000 / 5,000 |
| Regular / Stammgast | distinct days with app use (session or result logged): 10 / 30 / 100 |
| Goal Getter / Zielstrebig | weeks in a row with the weekly minute goal met: 2 / 4 / 8 |
| PB Machine / Rekordjäger | personal bests set: 5 / 20 / 50 |
| Round Logger / Rundenbuchhalter | real rounds logged: 5 / 15 / 40 |

### 8.4 Achievements (one-time)

| Achievement (EN / DE) | Criterion |
|---|---|
| First Tee / Erster Abschlag | first completed session |
| Flawless / Makellos | `max_score` reached on any drill; repeatable per drill, and the screen shows which drills are done |
| Complete Set / Komplettes Set | every booklet drill played at least once |
| Collector / Sammler | every drill in the library played, including the approved approach drills |
| All-Rounder / Allrounder | results in all 4 categories within one week |
| On Target / Im Soll | beat the booklet target of your own HCP band on any drill |
| Next Level / Nächste Stufe | beat the target of the next better band on any drill |
| Breakthrough / Durchbruch | a category training HCP improved by ≥ 2.0 within 30 days |
| Review Ready / Bilanzreif | first 5-session review unlocked |
| Early Bird / Frühaufsteher | session started before 08:00 local time |
| Team Player / Teamplayer | first accepted friend |
| Captain / Kapitän | created a group with ≥ 3 members |
| Dynasty / Dynastie | held any leader title for 4 weeks in a row |

### 8.5 Achievements screen
- A grid of medals (with their tier), achievements and title badges.
- Locked items appear greyed out with a progress indicator (e.g. "34 / 50 sessions").
- Tapping an item shows its criterion and the date earned.
- Each item has its own pictogram from the same SVG kit and style.
- Unlocking something during or after a session shows a short, non-blocking toast with the sound or vibration from 9.3.
- Achievement checks run server-side (database functions triggered on result or session insert), never in the client.

## 9. Features

### 9.0 Home screen (start page, replaces "Today")
The home screen is the app's start page (route `/`, nav item "Home"). It replaces the former "Today" screen and pulls together data from the other features. Order from top to bottom:

1. **Handicap header:** real handicap and overall training handicap side by side (big numbers, section 11). The training HCP is labelled as an estimate from training drills (6.3).
2. **Training handicap per category:** one row per category (category colour dot, category HCP, gap to the real handicap, e.g. "+3.2"). A gap > 2.0 uses the weakness highlight colour. Categories without enough data show "not enough data" (6.3 rule).
3. **Weekly goal:** practice minutes this week (Monday–Sunday, local time) versus the weekly minute goal, as a 6 px progress bar (9.4).
4. **Recent sessions:** the last 3–5 completed sessions with date, duration, drills played and result (number of results and the mean drill HCP of that session). Tapping opens the session.
5. **Recent achievements and medals:** the latest unlocked achievements, medal tiers and title badges (8.3–8.5), with pictogram and date; link to the Achievements screen.
6. **Friends:** the newest completed session of any friend (name, date, duration, drills, result), according to that friend's privacy settings (9.8).
7. **My groups:** for every group I am in, my rank on each category board and the overall board ("2 / 5"), plus the titles I currently hold there (8.1, 8.2). Members who are not yet eligible see "not ranked yet" with the eligibility rule.

Rules:
- Style as in section 11: one card per block, labels in 11 px uppercase, tabular numerals, at most one filled primary button (e.g. "Start session"), no charting-library look.
- **Empty states** for every block as long as data is missing, each saying what fills it: no real handicap yet → link to the profile; no results → "build your first session"; no achievements yet; no friends yet → link to add friends; no groups yet → link to create or join a group; signed out or local mode → explain that friends and groups need an account.
- Works offline: own data comes from the local store; friend and group blocks show the last cached values with a "last updated" hint.
- All ranks, titles and achievements come from server-side functions (sections 3 and 8); the client never computes another member's rank.

### 9.1 Onboarding and profile
Sign up (name, email, password, email verification), then display name, real handicap, preferred language and weekly minute goal. The handicap is editable at any time and its history is kept.

### 9.2 Session builder
- Browse the library and filter by category, area, duration, difficulty and equipment.
- Add drills to a session, reorder them by drag and drop, and see the running total duration.
- **"I have X minutes":**
  - The user enters the available time.
  - The app fills the session with drills that match the current recommended category split, prefers drills with little recent data, and avoids repeating the last session.
  - The user can swap any suggested drill.
- Sessions can be saved before starting.

### 9.3 Live drill mode
- Timer counting down from the drill duration. Store start timestamps, never rely on interval ticks only.
- Use the Screen Wake Lock API to keep the screen on, where supported.
- At the time limit, and at each station change, give feedback in this order:
  1. vibration via the Vibration API where supported;
  2. otherwise a "golf ball dropping into the cup" sound, synthesised with the Web Audio API or taken from a CC0-licensed sample (record the source and licence in `CREDITS.md`).
- On iOS, unlock audio on the user's "Start" tap.
- Result input as in 6.1, plus per-drill notes (free text).
- Pause, skip and finish actions. After each drill, show a summary: result, the booklet target for the user's band, the resulting drill HCP, and the change in group rank.

### 9.4 Personal bests and weekly goal
- Personal best per drill, highlighted when broken.
- Weekly minute goal with a progress bar on the dashboard.

### 9.5 Round stats (optional entry)
- After a real round, the user can enter score, fairways hit, greens in regulation, putts, up & downs (attempts and made) and penalty strokes.
- Show the round stats next to the training HCP per category, as a "practice vs. course" view. Label clearly that this is a comparison, not a strokes-gained calculation.

### 9.6 Recommendations
- **Initial split (after onboarding):** a time split across the 4 categories based on the real handicap.
  - It must be grounded in cited sources. Examples:
    - Broadie's finding that shots outside 100 yards account for most of the scoring difference between amateur levels, and that the 150-yard approach is the single most important shot for amateurs to practise (Schwab interview with Mark Broadie);
    - Dave Pelz's short-game research, used to balance this.
  - Research further college-coach or tour-coach sources and cite each one.
  - Where sources disagree, state the rule the app uses and why.
- **Review after every 5 completed sessions:** a review screen showing:
  - sessions done and minutes per category versus the recommendation;
  - change in category HCPs;
  - the largest gap between training HCP and real HCP;
  - a new suggested split, plus 2–3 specific drills to prioritise.
- Every recommendation shows its reasoning in one or two sentences and a "Sources" link.
- Store the sources in a `sources` table and show them in an in-app "Method & sources" page.

### 9.7 Analytics
- Sessions per week (last 8–12 weeks), stacked by category.
- Minutes per category, actual versus recommended.
- Drill HCP trend per drill, with booklet band target lines.
- Category HCP over time, and training HCP versus real HCP over time.
- Charts follow section 11 and use only real user data. Empty states explain what is needed to fill each chart.

### 9.8 Friends and groups
- Search users by display name (or exact email) and send friend requests (accept or decline).
- Create groups, invite friends and leave groups. Group admins can remove members and toggle fun titles.
- **Friend profile:** training HCP overall and per category, recent sessions, personal bests, and earned badges, according to that friend's privacy settings.
- **Group view:** leaderboards (8.1), current title holders (8.2), and an activity feed (session completed, personal best broken, achievement unlocked, title won).
- **Privacy settings:**
  - who can see my results: nobody / friends / groups;
  - whether my real handicap is visible.
- Enforce all of this with RLS and policy tests.

### 9.9 Export and account
- Export all of one's own data (sessions, results, notes, round stats, achievements) as CSV and as XLSX.
- Account deletion removes all personal data.

### 9.10 Offline
- The full session flow works offline. Results queue locally and sync automatically.
- Leaderboards, titles and achievements update after sync.
- A small indicator shows the sync state. Friend data is read-only when offline, from the cache.

## 10. Data model (Supabase)

| Table | Content |
|---|---|
| `profiles` | id, display_name, language, real_hcp, weekly_goal_min, privacy settings, hide_last_place_titles |
| `hcp_history` | real handicap changes over time |
| `drills` | seed drills plus custom drills (owner_id null for seed); bilingual text fields; scoring JSON; max_score; pictogram JSON; sources; needs_verification |
| `sessions` | planned or started or completed, total_min |
| `session_drills` | order, planned_min, actual_min, notes |
| `drill_results` | raw inputs JSON, normalised score (server-computed), drill HCP (server-computed), created_at |
| `round_stats` | stats per real round (9.5) |
| `friendships` | requester, addressee, status |
| `groups`, `group_members` | groups and their members; role; titles_enabled |
| `group_titles` | group_id, board, title_type (leader / last), user_id, since, until |
| `achievement_defs` | key, type (medal / achievement / title_badge), tiers JSON, names EN/DE, pictogram |
| `user_achievements` | user_id, achievement key, tier, earned_at, progress |
| `recommendations` | type (initial / review), split JSON, rationale, source_ids, created_at |
| `sources` | title, author, url, accessed_at, note |

Provide SQL migrations, RLS policies, scheduled functions (daily title computation) and a seed script, including `achievement_defs`.

## 11. Design system (Pulse, balanced)

The goal is a middle ground: dark and modern like current sports apps, but neither ultra-thin and stark nor bubbly and colourful.

- **Background and surfaces:**
  - background #0E0F11 (charcoal, not pure black);
  - surface cards #17191C with a 1 px border #24272B;
  - corner radius 12 px for cards and 10 px for buttons (no pill-shaped cards, no sharp corners).
- **Text:** primary #F2F3F5, secondary #B4B8BE, muted #8A8F96 (check AA contrast on the surface colour).
- **Accent:** #3DFFA2 by default; user-selectable from #FF6B4A, #FFD23F, #2FD6F5. Use at most one accent plus the category colours per screen.
- **Category colours** (slightly muted):
  - Off the Tee: accent
  - Approach: #2FD6F5 (or #F5B83D if the accent is cyan)
  - Short Game: #A48CF0
  - Putting: #5AA2F5
  - Weakness highlight: #FF8A5C
- **Medal tiers:** bronze #C98A5B, silver #C5CBD3, gold #E8C25A, as fills on small pictogram discs. These are the only filled decorative elements.
- **Type:** Inter.
  - Big numbers in weight 500, 48–72 px.
  - Headings 600.
  - Body text 400.
  - Labels 11 px, uppercase, weight 600, letter-spacing 0.08em.
  - Use tabular numerals for all scores and timers.
- **Lines and charts:** dividers 1 px; chart strokes and pictogram lines 1.5–2 px; progress bars 6 px with a 3 px radius (no rings); markers as solid dots of 4–5 px.
- **Buttons:** one filled primary per screen, the rest outlined.
- **Accessibility:** WCAG AA contrast, tap targets ≥ 44 px (≥ 64 px in live mode), and screen-reader labels for all charts, pictograms and badges.

## 12. Bilingual content
- Every UI string goes through i18n, including achievement and title names (EN/DE as in section 8). Drill texts are translated EN↔DE faithfully.
- Units are metres by default, with an optional yards toggle that converts the displayed distances.
- The language toggle is in the profile and also available on the login screen.

## 13. Quality bar
- Lighthouse PWA and accessibility scores ≥ 90.
- No console errors.
- Test coverage of the calculation logic ≥ 90 % (handicap engine, leaderboards, titles, achievements).
- A `README.md` with setup, environment variables, migrations and deployment steps.
- `ASSUMPTIONS.md` listing every assumption (thresholds, weights, extrapolations, eligibility rules, unclear source values).
- `CREDITS.md` listing sources and licences, including the sound file.
- `SECURITY.md` summarising the measures from section 3.

## 14. Phases
1. **Scaffold:** Supabase schema with RLS, auth with email verification, security headers, i18n, design tokens, PWA shell.
2. **Drill library:** Excel import, pictogram kit and the 25 pictograms, library and detail pages.
3. **Training:** session builder (including "I have X minutes"), live mode with timer, vibration or sound and result entry, offline queue.
4. **Calculations:** handicap engine with tests, dashboard, analytics, personal bests and weekly goal.
5. **Research gate:** approach drill research and recommendation sources. **Stop for user approval.** Then seed the approved drills and build the recommendation engine and the 5-session review.
6. **Social:** friends, groups, leaderboards, fun titles, privacy.
7. **Achievements:** medals, achievements and title badges, the Achievements screen, unlock toasts.
   - **Home screen (9.0)** follows directly after Phases 6 and 7, because it needs their data.
8. **Wrap-up:** round stats, notes, export and account deletion, polish, deployment docs.
