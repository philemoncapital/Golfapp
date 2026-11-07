/**
 * Approach drills from Phase 5 research, approved by David on 7 Nov 2026 (A1, A2, A3, A5).
 * Verification: docs/PHASE5_PROPOSAL.md, section 0a. The procedures follow the cited sources; scoring zones,
 * HCP tables, durations and difficulty are our adaptation (flagged in the app and in ASSUMPTIONS.md).
 * Seeded on the server by supabase/migrations/0005_approach_drills.sql (generated from this file).
 */
import type { Drill } from '../engine/types';

const radiusBands = (r: [number, number, number]) => [
  { hcp_hi: 54, hcp_lo: 27, target: { radius_m: r[0] } },
  { hcp_hi: 26, hcp_lo: 12, target: { radius_m: r[1] } },
  { hcp_hi: 11, hcp_lo: 0, target: { radius_m: r[2] } },
];
const countBands = (v: [number, number, number]) => [
  { hcp_hi: 54, hcp_lo: 27, target: v[0] }, { hcp_hi: 26, hcp_lo: 12, target: v[1] }, { hcp_hi: 11, hcp_lo: 0, target: v[2] },
];

export const APPROACH_DRILLS: Drill[] = [
  {
    id: 'donald-wedge-ladder', source: 'approach_research', area: 'range', category: 'approach',
    title: 'Wedge Ladder (Luke Donald)', seen_with: 'Luke Donald', duration_min: 25, difficulty: 4, shot_type: 'Wedge',
    equipment_de: '30 Bälle, Laser, Wedges', needs_verification: null,
    text: {
      de: {
        setup: 'Eine Fahne auf der Range. 10 Stationen von 69 bis 93 m (75–102 Yards), jede ca. 2,7 m (3 Yards) weiter weg; mit dem Laser messen.',
        goal: 'Möglichst viele Bälle innerhalb des Radius deiner HCP-Stufe.',
        procedure: '3 Bälle von 69 m auf die Fahne, für jeden Ball antippen, wie weit er liegt. 3 Yards zurückgehen, wieder 3 Bälle. 10 Stationen = 30 Bälle. Variante: von einem Platz auf verschiedene Ziele gleicher Distanz.',
        scoring_note: 'Bälle im Radius (von 30): 54-27: 22 m | 26-12: 19 m | 11-0: 14 m – Radien hergeleitet aus Arccos-Daten (Annahme), Stufe erreicht ab 15 Bällen.',
      },
      en: {
        setup: 'One flag on the range. 10 stations from 69 to 93 m (75–102 yards), each about 2.7 m (3 yards) further back; measure with a laser.',
        goal: 'As many balls as possible inside the radius of your HCP band.',
        procedure: 'Hit 3 balls from 69 m at the flag and tap how far each one finished. Step back 3 yards and hit 3 more. 10 stations = 30 balls. Variation: one spot, different targets at the same distance.',
        scoring_note: 'Balls inside the radius (of 30): 54-27: 22 m | 26-12: 19 m | 11-0: 14 m – radii derived from Arccos data (assumption), band met from 15 balls.',
      },
    },
    scoring: { type: 'radius_by_band', lower_is_better: false, perfect: 30, balls: 30, pass_hits: 15, pass_assumed: true, buckets: [5, 10, 14, 19, 22, 30], bands: radiusBands([22, 19, 14]) },
    sources: [{ title: 'One of the best wedge players ever trusts this drill—how it works', author: 'Luke Kerr-Dineen, Golf Digest', date: '2025-05-28', url: 'https://www.golfdigest.com/story/luke-donald-30-ball-wedge-game-golf-digest-improve' }],
  },
  {
    id: 'random-yardage', source: 'approach_research', area: 'range', category: 'approach',
    title: 'Random Yardage (Justin Thomas)', seen_with: 'Justin Thomas', duration_min: 15, difficulty: 5, shot_type: 'Eisen',
    equipment_de: '10 Bälle, Laser (optional Launch-Monitor)', needs_verification: null,
    text: {
      de: {
        setup: 'Zielfenster 115–137 m (126–150 Yards). Ziele oder Fahnen im Fenster mit dem Laser messen; die App würfelt vor jedem Ball eine Distanz.',
        goal: 'Möglichst viele Bälle innerhalb des Radius deiner HCP-Stufe.',
        procedure: '10 Bälle. Vor jedem Ball eine neue Zufallsdistanz, passenden Schläger wählen, Pre-Shot-Routine, schlagen, Abstand zur Fahne antippen. Nie zweimal dieselbe Distanz hintereinander.',
        scoring_note: 'Bälle im Radius (von 10): 54-27: 32 m | 26-12: 29 m | 11-0: 18 m – Radien hergeleitet aus Shot-Scope-Daten (Annahme), Stufe erreicht ab 5 Bällen.',
      },
      en: {
        setup: 'Target window 115–137 m (126–150 yards). Measure targets or flags in the window with a laser; the app rolls a distance before each ball.',
        goal: 'As many balls as possible inside the radius of your HCP band.',
        procedure: '10 balls. Before each ball a new random distance: pick the club, pre-shot routine, hit, tap the distance to the flag. Never the same distance twice in a row.',
        scoring_note: 'Balls inside the radius (of 10): 54-27: 32 m | 26-12: 29 m | 11-0: 18 m – radii derived from Shot Scope data (assumption), band met from 5 balls.',
      },
    },
    scoring: { type: 'radius_by_band', lower_is_better: false, perfect: 10, balls: 10, pass_hits: 5, pass_assumed: true, buckets: [10, 18, 24, 29, 32, 45], random_m: [115, 137], bands: radiusBands([32, 29, 18]) },
    sources: [{ title: 'Justin Thomas: Battle ready', author: 'Justin Thomas, Australian Golf Digest', date: '2019-01-25', url: 'https://www.australiangolfdigest.com.au/justin-thomas-battle-ready/' }],
  },
  {
    id: 'pinseeker', source: 'approach_research', area: 'range', category: 'approach',
    title: 'Pinseeker', seen_with: null, duration_min: 10, difficulty: 3, shot_type: 'Eisen',
    equipment_de: '10 Bälle, Laser', needs_verification: null,
    text: {
      de: {
        setup: 'Eine Fahne auf der Range, Standard 120 m (100–140 m möglich). Zonen: 10 % der Distanz (12 m) und 20 % (24 m).',
        goal: 'Möglichst nah an die Fahne.',
        procedure: '10 Bälle auf dieselbe Fahne mit demselben Schläger, Pre-Shot-Routine. Pro Ball: innerhalb 12 m = 2 P, innerhalb 24 m = 1 P, außerhalb = 0 P.',
        scoring_note: 'Punkte (max. 20): 54-27: 5 | 26-12: 6 | 11-0: 11 – Zonen und Werte hergeleitet aus Shot-Scope-Daten (Annahme).',
      },
      en: {
        setup: 'One flag on the range, 120 m by default (100–140 m possible). Zones: 10 % of the distance (12 m) and 20 % (24 m).',
        goal: 'As close to the flag as possible.',
        procedure: '10 balls at the same flag with the same club, pre-shot routine. Per ball: inside 12 m = 2 pts, inside 24 m = 1 pt, outside = 0.',
        scoring_note: 'Points (max 20): 54-27: 5 | 26-12: 6 | 11-0: 11 – zones and values derived from Shot Scope data (assumption).',
      },
    },
    scoring: { type: 'points_per_ball', lower_is_better: false, perfect: 20, buttons: [2, 1, 0], bands: countBands([5, 6, 11]) },
    sources: [{ title: 'Games for the driving range, putting green & short game area – Pinseeker', author: 'Massachusetts Golf Association', date: '2020-06-12', url: 'https://www.massgolf.org/news/20-practicegames/' }],
  },
  {
    id: 'ten-shot-drill', source: 'approach_research', area: 'range', category: 'approach',
    title: '10-Shot Drill (Karl Morris)', seen_with: 'Karl Morris', duration_min: 15, difficulty: 4, shot_type: 'Eisen / Hölzer',
    equipment_de: '10 Bälle, Laser, 10 Schläger', needs_verification: null,
    text: {
      de: {
        setup: '10 Ziele von 60 bis 132 m (alle 8 m), für jedes Ziel ein anderer Schläger.',
        goal: 'Möglichst niedrige Summe – wie auf dem Platz zählt jeder Schlag nur einmal.',
        procedure: '1 Ball pro Ziel, kein zweiter Versuch. Bewertung: 1 = gut (innerhalb 10 % der Distanz), 2 = gut genug (innerhalb 20 %), 3 = schwach (außerhalb). Summe notieren und bei den 3ern nach Mustern suchen.',
        scoring_note: 'Summe (10–30, niedriger ist besser): 54-27: 25 | 26-12: 24 | 11-0: 20 – Distanzen, 10-%/20 %-Grenzen und Werte sind unsere Anpassung (Annahme).',
      },
      en: {
        setup: '10 targets from 60 to 132 m (every 8 m), a different club for each target.',
        goal: 'As low a total as possible – like on the course, every shot counts once.',
        procedure: '1 ball per target, no second try. Rate each: 1 = good (within 10 % of the distance), 2 = good enough (within 20 %), 3 = poor (outside). Write down the total and look for patterns in the 3s.',
        scoring_note: 'Total (10–30, lower is better): 54-27: 25 | 26-12: 24 | 11-0: 20 – distances, 10 %/20 % limits and values are our adaptation (assumption).',
      },
    },
    scoring: { type: 'points_per_ball', lower_is_better: true, perfect: 10, buttons: [1, 2, 3], bands: countBands([25, 24, 20]) },
    sources: [{ title: 'The 10-shot drill every golfer should do on the driving range', author: 'Karl Morris (drill), Rob McGarr, Today’s Golfer', date: '2025-08-13', url: 'https://www.todays-golfer.com/news-and-events/general-news/best-golf-driving-range-drill/' }],
  },
];
