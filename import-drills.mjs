// Reads data/Golfuebungen.xlsx and writes src/data/drills.seed.json.
// Re-runnable. Scoring metadata that is not in the sheet (type, direction, perfect score)
// is defined in META below and documented in ASSUMPTIONS.md.
import XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';

const META = {
  'Fade and Draw':          { category: 'tee',      type: 'count_higher_better', perfect: 10 },
  'Short Aims':             { category: 'tee',      type: 'stations_reached',    perfect: 4 },
  '14 Fairways':            { category: 'tee',      type: 'count_higher_better', perfect: 14 },
  'Hit Three Greens':       { category: 'approach', type: 'count_higher_better', perfect: 27 },
  'Nine Drives':            { category: 'tee',      type: 'count_higher_better', perfect: 9 },
  'Five Different Clubs':   { category: 'short',    type: 'radius_by_band', perfect: 20, balls: 20, passHits: 10 },
  'Attack the Flag':        { category: 'short',    type: 'radius_by_band', perfect: 9,  balls: 9,  passHits: 5, passAssumed: true },
  'Four Stations':          { category: 'short',    type: 'points_per_ball',     perfect: 36, buttons: [3, 2, 1, 0] },
  'Sandy Par':              { category: 'short',    type: 'count_lower_better',  perfect: 5 },
  'Hit It Close':           { category: 'short',    type: 'points_per_ball',     perfect: 25, buttons: [5, 3, 2, 1, 0] },
  'Hit the Spot':           { category: 'short',    type: 'count_higher_better', perfect: 15 },
  'Chip to a Towel':        { category: 'short',    type: 'time_lower_better',   perfect: null },
  'Worstball Chipping':     { category: 'short',    type: 'count_lower_better',  perfect: 9 },
  'Up & Down Series':       { category: 'short',    type: 'streak',              perfect: null },
  'Beat 21':                { category: 'short',    type: 'count_lower_better',  perfect: 11 },
  'Draw Back':              { category: 'putting',  type: 'count_lower_better',  perfect: 9 },
  'Five Balls':             { category: 'putting',  type: 'count_higher_better', perfect: null },
  'Up & Down':              { category: 'putting',  type: 'count_lower_better',  perfect: 5 },
  'Pace Putting':           { category: 'putting',  type: 'points_per_ball',     perfect: 36, buttons: [3, 2, 1, -1] },
  'Control the Line':       { category: 'putting',  type: 'count_higher_better', perfect: null },
  'Hit the Hall':           { category: 'putting',  type: 'points_per_ball',     perfect: 15, buttons: [2, 1, 0], resultIsPutts: true },
  'Around the World':       { category: 'putting',  type: 'streak',              perfect: 8 },
  'Shorties under Pressure':{ category: 'putting',  type: 'series_triplet',      perfect: null },
  'Shootout':               { category: 'putting',  type: 'streak',              perfect: null },
  'Circle Putting':         { category: 'putting',  type: 'streak',              perfect: null },
};
const LOWER = new Set(['count_lower_better', 'time_lower_better']);
const AREA = { 'Driving Range': 'range', 'Pitching Green': 'pitching', 'Bunker': 'bunker', 'Chipping Green': 'chipping', 'Putting Green': 'putting' };

function slug(s) { return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

function parseBands(str) {
  const bands = [];
  const re = /(\d+)-(\d+):\s*([^|()]+?)(?=\s*\||\s*\(|$)/g;
  let m;
  while ((m = re.exec(str))) {
    const hi = Number(m[1]), lo = Number(m[2]), raw = m[3].trim();
    let target;
    if (/^\d+\/\d+\/\d+$/.test(raw)) target = raw.split('/').map(Number);
    else if (/gr(ü|u)n/i.test(raw)) target = 'green';
    else if (/^<\s*[\d,]+\s*m$/.test(raw)) target = { radius_m: Number(raw.replace(/[<\sm]/g, '').replace(',', '.')) };
    else target = Number(raw.replace(',', '.'));
    bands.push({ hcp_hi: hi, hcp_lo: lo, target });
  }
  return bands;
}

const wb = XLSX.readFile('data/Golfuebungen.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
const drills = rows.map((r) => {
  const title = String(r['Titel']).trim();
  const meta = META[title];
  if (!meta) throw new Error(`No META for drill "${title}"`);
  const bands = parseBands(String(r['Scoring nach HCP']));
  if (![3, 5, 6].includes(bands.length)) throw new Error(`"${title}": expected 3, 5 or 6 bands, got ${bands.length}`);
  const check = String(r['Prüfen am Original'] || '').trim();
  return {
    id: slug(title === 'Up & Down' ? 'up-and-down-omeara' : title),
    source: 'booklet',
    area: AREA[r['Bereich']],
    category: meta.category,
    title,
    seen_with: r['Gesehen bei'] && r['Gesehen bei'] !== '–' ? String(r['Gesehen bei']) : null,
    duration_min: Number(r['Zeit (Min)']),
    difficulty: Number(String(r['Anspruch']).split('/')[0]),
    shot_type: String(r['Trainingsbereich']),
    equipment_de: String(r['Material']),
    text: {
      de: { setup: String(r['Aufbau']), goal: String(r['Ziel']), procedure: String(r['Ablauf']), scoring_note: String(r['Scoring nach HCP']) },
      en: null, // Phase 2: faithful EN translation (see build prompt §4.1)
    },
    scoring: {
      type: meta.type,
      lower_is_better: LOWER.has(meta.type) || !!meta.resultIsPutts,
      perfect: meta.perfect,
      ...(meta.buttons ? { buttons: meta.buttons } : {}),
      ...(meta.balls ? { balls: meta.balls, pass_hits: meta.passHits, pass_assumed: !!meta.passAssumed } : {}),
      ...(meta.resultIsPutts ? { result_is_putts: true } : {}),
      bands,
    },
    needs_verification: check ? check : null,
  };
});
writeFileSync('src/data/drills.seed.json', JSON.stringify(drills, null, 2));
console.log(`Wrote ${drills.length} drills`);
