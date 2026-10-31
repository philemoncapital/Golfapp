# Assumptions

Everything the app computes that is not stated in the drill booklet is listed here.

## Drill data
- Values flagged in the Excel column "Prüfen am Original" are imported as-is and shown with a "verify" hint (`needs_verification`).
- Five Different Clubs and Attack the Flag have **5** HCP bands in the booklet (54-27, 26-19, 18-12, 11-5, 4-0); the importer accepts 3, 5 or 6 bands.
- Scoring type, direction and "perfect score" are not in the sheet; they are set in `scripts/import-drills.mjs` (`META`):
  - Hit Three Greens perfect = 27 (9 balls; 3×2 + 3×3 + 3×4).
  - Four Stations perfect = 36 (3 rounds × 4 balls × 3 points); Hit It Close perfect = 25 (5 × 5).
  - Pace Putting perfect = 36 (12 putts × 3); Hit the Hall perfect = 15 putts (5 stations × 3 balls).
  - Sandy Par perfect = 5, Worstball Chipping 9, Beat 21 11, Draw Back 9, Up & Down (O'Meara) 5, Around the World 8 (each = holing in the minimum possible strokes).
  - No perfect score for open-ended drills (streaks, timed drills, Control the Line, Five Balls).
- Hit the Hall: buttons give 2/1/0 points per putt, but the booklet scores **putts needed** (lower is better), so one tap = one putt.

## Training handicap
- Anchor of each band = its midpoint (e.g. 54-27 → 40.5, 26-12 → 19, 11-0 → 5.5).
- Result → HCP: piecewise-linear interpolation between anchors; beyond the outer anchors the nearest segment is extended; clamped to [+5, 54].
- radius_by_band: the best band where ≥ pass hits land inside its radius gives the band midpoint; the share of hits inside the next tighter radius moves the estimate towards the next band's midpoint.
  - Pass mark Five Different Clubs = 10 of 20 (booklet: "10 Punkte sind ein gutes Ergebnis").
  - Pass mark Attack the Flag = 5 of 9 (**not in the booklet**).
  - "Green" for 54-27 counts any ball on the green; a ball beyond 7 m on the green is stored as 8 m.
- series_triplet (Shorties under Pressure): best band whose 3 targets are all reached; progress towards the next band = average over the 3 positions of (achieved − current target) / (next target − current target).
- Chip to a Towel not finished in time: equivalent minutes = limit × 8 / hits.
- Drill HCP = weighted mean of the last 3 results (weights 1, 0.7, 0.49, newest first).
- Category HCP = mean of drill HCPs weighted by result count (cap 5); shown only with ≥ 2 different drills.
- Overall training HCP = **equal weights** across categories until cited strokes-gained weights are approved (Phase 5); shown only with ≥ 2 categories.
- Session builder ("I have X minutes") uses an **equal 25 % split** until Phase 5.

## Server-side engine (0002)
- `drill_results.drill_hcp` / `score` are recomputed by a database trigger on every insert (client values are overwritten). The SQL engine is a line-by-line port of `src/engine/handicap.ts`; `supabase/tests/hcp_parity_test.sql` checks 1,520 generated inputs for identical results.
- Chip to a Towel "not finished": the time limit is always the drill's duration (server and client), never a value sent by the client.
- Offline results keep their client timestamp, but a timestamp more than 5 minutes in the future is replaced by the server time.
- `score` is the raw number for count/points/streak/minutes drills; it is empty for radius and triplet drills (ranking uses the result HCP).

## Leaderboards, titles, feed (Phase 6)
- **Practice minutes** = for every drill played, its booklet duration, counted once per session (a result without a session counts once). Used for the activity board, the weekly goal and medals. Planned-but-skipped drills do not count; client-reported session totals are not trusted.
- **Category board** (30 days): category HCP from results in the window, same formula as 6.3; eligible with ≥ 3 results from ≥ 2 drills of that category.
- **Overall board** ("same eligibility logic across categories"): weighted mean over the categories in which the member is eligible; eligible with ≥ 2 such categories. Category weights live in `category_weights` (equal until Phase 5 is approved).
- **Ties:** equal values share a rank; the member whose newest counting result is older ("reached it first") is listed first and takes a leader title. The last-place title goes to the last member in this order.
- **Visibility in groups:** members with "who sees my results = nobody" are left out of boards, titles and the feed; "friends" and "groups" both include group mates (as in `can_view_results`).
- **Titles:** recomputed daily at 03:15 UTC (pg_cron) and immediately when an admin switches titles on/off. A title row is kept while the holder stays the same; otherwise it is closed (`until` = today) and a new one starts. Below 3 eligible members, open titles are closed.
- **Hidden last-place titles** are still stored (for the holder's own badge history) but are not shown to other members.
- **Personal best** = a result whose HCP is strictly lower than every earlier result of the same drill; the first result of a drill is not a PB.
- **Declined friend requests** look like "pending" to the requester (they are not told).
- **Per-drill board:** ranked by the best result HCP in the last 30 days; the score shown is the raw score where it is a single number.

## Medals and achievements (Phase 7, 0003)
- All checks run in the database (triggers after results, sessions, friendships, group members, titles, round stats and profile changes; plus the daily job). Clients cannot write `user_achievements`.
- **Distinct days** (Regular) and **weeks** (Goal Getter) use the profile's timezone (sent by the app, default Europe/Berlin); weeks run Monday–Sunday.
- **Goal Getter** = the longest run of consecutive weeks in which practice minutes reached the *current* weekly goal (the goal history is not stored).
- **Flawless**: value drills reach `perfect` (≤ for lower-is-better drills); radius drills need `perfect` balls inside the tightest radius. Each new drill done perfectly is announced again.
- **Complete Set** = all booklet drills; **Collector** = all seed drills (booklet + approved approach drills). They are identical until Phase 5 drills are approved.
- **All-Rounder**: results in all 4 categories within any rolling 7 days.
- **On Target / Next Level**: a result whose HCP is ≤ the midpoint of my own band / the next better band. A result exactly on the booklet target maps to that midpoint, so *reaching* the target counts (German "Im Soll"). Uses the current real handicap; own band = the band containing it, else the nearest band.
- **Breakthrough**: a category HCP (≥ 2 drills) today vs. computed from results up to 30 days ago improved by ≥ 2.0.
- **Review Ready**: 5 completed sessions (the review screen itself comes with Phase 5).
- **Early Bird**: session start before 08:00 in the profile's timezone.
- **Captain**: owner of a group with ≥ 3 active members (invited members do not count).
- **Dynasty / weeks held**: days held as leader in one stretch ≥ 28; title badges count full weeks summed over all stretches.
- Toasts: each device announces an unlock once (key + tier / number of Flawless drills). On the first load of a device nothing is announced; existing unlocks are just recorded.

## Demo mode
- All demo players, sessions and results are invented test data, not golf facts. Results are real drill inputs chosen so that their training HCP follows each player's real HCP ± a random category offset, improving slowly over 100 days, plus noise (σ = 3.5 HCP).
- Demo title "since" dates are pseudo-random (3–40 days ago); achievement dates are reconstructed from the generated history.
