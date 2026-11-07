/**
 * Clearer German drill texts (David's review, Nov 2026). Applied on top of the booklet import (drills.seed.json stays the
 * faithful transcription of Golfuebungen.xlsx). Only the listed fields change; content is clarified, not invented –
 * scoring rules come from the booklet's scoring column.
 */
import type { DrillText } from '../engine/types';

export const TEXT_OVERRIDES_DE: Record<string, Partial<DrillText>> = {
  'fade-and-draw': {
    goal: 'Gezählt wird ein Ball, wenn er im 30-m-Korridor landet und die geforderte Kurve geflogen ist (links bzw. rechts am Stick vorbei und zurück ins Ziel). 10 Bälle: 5 Fades, 5 Draws.',
  },
  'short-aims': {
    setup: 'Nur mit dem Driver. Ziele auf 100, 125, 150 und 175 m abmessen (oder Zielgrüns/Entfernungsmarkierungen nutzen).',
    procedure: 'Mit dem Driver aufs 100-m-Ziel. Treffer = Ball landet im 10-m-Radius ums Ziel (Carry, Ausrollen egal). Nach 3 Treffern weiter zur nächsten Station. Nach 15 Min aufhören und die erreichte Station notieren.',
  },
  '14-fairways': {
    goal: 'Gezählt werden nur die 14 Drives, die inklusive Ausrollen im Korridor liegen (mind. 150 m). Die Schläge mit dem Eisen 7 zählen nicht, sie dienen dem Rhythmus.',
  },
  'nine-drives': {
    goal: '9 Drives, je ein Loch deines Clubs (ohne Par 3). Gezählt wird ein Drive, der inklusive Ausrollen im Korridor liegt und mindestens 150 m weit ist.',
  },
  'hit-three-greens': {
    goal: 'Gezählt werden Punkte: Treffer aufs kurze Ziel = 2, aufs mittlere = 3, aufs weite = 4 (9 Bälle, max. 27). Treffer = Ball auf dem Grün; ohne Zielgrün innerhalb von ca. 10 % der Distanz.',
  },
  'five-different-clubs': {
    goal: '1 Punkt pro Ball, der in deinem Kreis liegt. 20 Bälle, max. 20 Punkte, 10 Punkte sind gut.',
    scoring_note: '1 Punkt je Ball in deinem Kreis. Kreis nach deinem echten HCP: 54-27: Grün | 26-19: < 6 m | 18-12: < 4 m | 11-5: < 3 m | 4-0: < 1,5 m',
  },
  'attack-the-flag': {
    goal: '1 Punkt pro Ball, der in deinem Kreis liegt. 9 Bälle, max. 9 Punkte.',
    scoring_note: '1 Punkt je Ball in deinem Kreis. Kreis nach deinem echten HCP: 54-27: Grün | 26-19: < 7 m | 18-12: < 5 m | 11-5: < 3 m | 4-0: < 2 m',
  },
  'four-stations': {
    goal: 'Pro Ball: eingelocht = 3 P, innerhalb 1 Schlägerlänge (90 cm) = 2 P, innerhalb 3 Schlägerlängen = 1 P, sonst 0. 4 Stationen × 3 Durchgänge = 12 Bälle, max. 36 Punkte.',
  },
  'sandy-par': {
    goal: 'Pro Loch: 1 Bunkerschlag, dann putten bis eingelocht. Gezählt werden alle Schläge. Par ist 2 je Loch, also 10 für alle 5 Löcher; niedriger ist besser.',
  },
  'hit-it-close': {
    goal: 'Pro Ball: eingelocht = 5 P, innerhalb 1 Schlägerlänge (90 cm) = 3 P, innerhalb 3 Schlägerlängen = 2 P, auf dem Grün = 1 P, sonst 0. 5 Bälle, max. 25 Punkte.',
  },
  'hit-the-spot': {
    goal: '1 Punkt, wenn der Ball in der angesagten Landezone aufkommt; Ausrollen ist egal. 15 Bälle, max. 15 Punkte.',
  },
  'chip-to-a-towel': {
    goal: 'Möglichst schnell 8 Treffer. Treffer = Ball landet im Flug auf dem Tuch; ab der 2. Runde muss er auf dem Tuch liegen bleiben. Nach 15 Min beenden und die Treffer notieren.',
  },
  'worstball-chipping': {
    procedure: '9 Situationen. Pro Position 2 Bälle droppen und chippen, mit dem schlechteren weiterspielen und einlochen. Gezählt werden 1 Chip + alle Putts. Par 2 je Situation (18); niedriger ist besser.',
  },
  'up-and-down-series': {
    goal: 'Up & Down = mit höchstens 2 Schlägen (Chip + Putt) eingelocht. Deine längste Serie zählt (max. 20 Min).',
  },
  'beat-21': {
    goal: 'Pro Situation: 1 Chip + Putts bis eingelocht. Par 2 je Situation (22). Ziel: 21 oder weniger – also mindestens ein Chip-in.',
  },
  'draw-back': {
    procedure: 'Bleibt der Ball hinter dem Loch innerhalb 1 Schlägerlänge: von dort einlochen. Sonst (zu kurz oder weiter weg): Ball 1 Schlägerlänge weiter zurück legen und von dort weiterputten, bei jedem Fehlputt erneut. Alle Putts zählen.',
  },
  'five-balls': {
    goal: 'Pro Ball: gelocht = 2 P, auf Lochhöhe oder im Korridor bis zum Schläger = 1 P, zu kurz oder Schläger berührt = −1 P. Serien à 5 Bälle in 15 Min; gezählt werden die Serien mit mindestens 5 Punkten.',
  },
  'up-and-down-omeara': {
    goal: 'Pro Station vom Vorgrün putten und einlochen, höchstens 2 Schläge sind das Ziel. Par 2 je Station (10); niedriger ist besser.',
  },
  'pace-putting': {
    goal: 'Pro Putt: gelocht = 3 P, bis 60 cm hinter dem Loch = 2 P, bis 30 cm vor dem Loch = 1 P, alles andere = −1 P. 12 Putts, max. 36 Punkte.',
  },
  'control-the-line': {
    goal: 'Ball 1 auf das 10-m-Ziel. Jeder weitere Ball muss kürzer liegen als der vorige, aber hinter der 5-m-Marke. Gezählt wird deine beste Reihe aus max. 3 Durchgängen.',
  },
  'hit-the-hall': {
    goal: 'Je Station 3 Bälle: gelocht = 2 P, im Korridor = 1 P. Mit 3 Punkten eine Station weiter, sonst wiederholen. Gezählt werden alle Putts bis zum Ende von 10 m; weniger ist besser (min. 15).',
  },
  'around-the-world': {
    goal: '8 Positionen (erst 4 × 90 cm, dann 4 × 120 cm). Fehlputt = von vorne. Deine beste Serie zählt (max. 8, 10 Min).',
  },
  'shorties-under-pressure': {
    goal: 'Vorgabe je Stufe, z. B. 10 / 4 / 2 in Folge von Position 1 / 2 / 3. Fehlputt = zurück zu Position 1. Gezählt werden deine besten Serien je Position in 10 Min.',
  },
  shootout: {
    goal: 'Abwechselnd von vor und hinter dem Loch (je 1,5 m) einlochen. Fehlputt = von vorne. Deine längste Serie zählt (10 Min).',
  },
  'circle-putting': {
    goal: '8 Tees im Kreis (90 cm), gegen den Uhrzeigersinn. Fehlputt = Serie startet neu. Deine längste Serie zählt (10 Min).',
  },
};
