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
