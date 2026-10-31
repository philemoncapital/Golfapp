# Phase 5 – Vorschlag: neue Approach-Drills & Quellen für Trainings-Empfehlungen

Stand: 2026-10-31 · Recherche-Entwurf zur **Freigabe durch David** (noch nichts gebaut, nichts in `/home/user/Golfapp` geändert)

---

## 0. WICHTIG: Verifikationsstatus (bitte zuerst lesen)

In dieser Recherche-Umgebung konnten **keine Webseiten geöffnet werden**. Der Netzwerkzugang der Cloud-Umgebung blockiert die Golf-Seiten (getestet und abgelehnt: `mygolfspy.com`, `www.golfmonthly.com`, `content.schwab.com`, `www.chicagogolfreport.com`; Proxy-Antwort „CONNECT tunnel failed, response 403“). Funktioniert hat nur die **Websuche**, und die liefert Snippets, die ein Modell zusammenfasst.

Das heißt:

- **Keine einzige Quelle in diesem Dokument ist „verifiziert“** im Sinne von „Seite selbst geöffnet und gelesen“. Alle Quellen haben den Status **„nicht verifiziert (Such-Snippet)“**.
- Zitate in „…“ sind Snippet-Text, so wie die Suche ihn ausgegeben hat. Sie können gekürzt oder leicht umformuliert sein. Vor dem Bauen muss jemand die Originalseite öffnen und das Zitat sowie die Zahlen gegenprüfen.
- Ich habe nichts aus dem Gedächtnis ergänzt und als verifiziert ausgegeben. Wo ich Hintergrundwissen nutze (z. B. das Erscheinungsjahr eines Buchs), steht ausdrücklich „aus Erinnerung, nicht verifiziert“.
- **Um echt zu verifizieren:** In den Umgebungseinstellungen (Cloud-Environment-Menü in der Titelleiste der Session → Edit → Network access) mindestens diese Domains erlauben: `mygolfspy.com`, `golfmonthly.com`, `golfdigest.com`, `golf.com`, `todays-golfer.com`, `shotscope.com`, `arccosgolf.com`, `massgolf.org`, `content.schwab.com`, `chicagogolfreport.com`, `golfingfocus.com`, `catdir.loc.gov`, `pubmed.ncbi.nlm.nih.gov`, `researchgate.net`. Danach kann dieser Bericht in einem Durchgang verifiziert werden. Anleitung: https://code.claude.com/docs/en/cloud-environments#network-access

---

## 1. Zusammenfassung

**Teil A – 5 Approach-Drills (≈ 55–140 m)**. Jeder Drill stammt aus einer genannten Quelle. Angepasst wurde nur das Format:

| # | Drill (EN / DE) | Quelle | Scoring-Typ | Status |
|---|---|---|---|---|
| A1 | Luke Donald 30-Ball Wedge Game / Luke-Donald-30-Ball-Wedge-Spiel | Golf Digest (Mai 2025) | radius_by_band | nicht verifiziert |
| A2 | Random Yardage (Justin Thomas) / Zufalls-Distanzen nach Justin Thomas | Golf Digest, Text von Justin Thomas (≈2018) | radius_by_band | nicht verifiziert |
| A3 | Pinseeker / Fahnenjäger | Golf Digest „15 best practice games“ (Juni 2018) + MassGolf | points_per_ball | nicht verifiziert |
| A4 | Approach-Iron Skill Test (adapted) / Approach-Eisen-Test | Robertson, Burnett & Newton, *Eur. J. Sport Sci.* 2013 (peer-reviewed) | count_higher_better | nicht verifiziert |
| A5 | 10-Shot Drill / 10-Schläge-10-Ziele | Today's Golfer | points_per_ball | nicht verifiziert |

Keine Quelle liefert HCP-Benchmarks für den jeweiligen Drill. Ich habe sie deshalb **aus veröffentlichten Proximity-by-Handicap-Daten hergeleitet** (Arccos via MyGolfSpy/Arccos-Blog, Shot Scope via MyGolfSpy). Formeln und Eingabedaten stehen in Abschnitt 2.0.

**Teil B – Empfehlung**

- **Startaufteilung der Trainingszeit** (OTT / APP / SG / PUTT):
  - HCP 54–27: 25 / 40 / 20 / 15
  - HCP 26–12: 25 / 40 / 20 / 15
  - HCP 11–0: 30 / 40 / 15 / 15
- **Gewichte für das Gesamt-Trainings-HCP:** OTT 0,25 · APP 0,40 · SG 0,20 · PUTT 0,15. Das entspricht Broadies Anteilen an der Schlagdifferenz zwischen Amateur-Niveaus. Gleichgewichtung wäre die einfachere Alternative, würde aber Putten deutlich übergewichten.
- **Quellenlage:** Broadie liefert die einzigen konkreten Zahlen zur Kategorie-Aufteilung (Snippets). Pelz dient als Gegengewicht (Schlag-Anteile innerhalb von 100 Yards). Für die Aufteilung der Trainingszeit durch College- oder Tour-Coaches habe ich **keine zitierfähige Quelle** gefunden.

---

## 2. Teil A – Approach-Drills

### 2.0 Gemeinsame Benchmark-Herleitung (gilt für A1–A5)

**Eingabedaten (alle nicht verifiziert, Such-Snippet):**

(D1) **Arccos**, „Course Management 101: What Layup Yardage is Your Sweet Spot?“ (MyGolfSpy Labs, gleicher Text im Arccos-Blog). Durchschnittliche Distanz zur Fahne in **Fuß**:

| Arccos-Bracket | 60–80 yd | 100–120 yd |
|---|---|---|
| 0–5 | 41,38 | 48,82 |
| 6–10 | 45,20 | 54,56 |
| 11–15 | 50,49 | 61,85 |
| 16–20 | 55,21 | 70,76 |
| 20+ | 62,45 | 83,46 |

Snippet: „60-80 yards: 41.38 / 45.20 / 50.49 / 55.21 / 62.45 ft“. Laut Snippet steht beim Wert für 16–20 im Original fälschlich „yards“. Der Artikel ist laut Suche ca. 8–10 Jahre alt.

(D2) **Shot Scope**, über MyGolfSpy „100 Yards Feels Like A Scoring Shot But The Data Says Otherwise“ (ca. Anfang 2026). Proximity in **Fuß**:

| HCP | 0 | 5 | 10 | 15 | 20 | 25 |
|---|---|---|---|---|---|---|
| aus 100 yd | 31 | 41 | 49 | 59 | 65 | 75 |
| aus 150 yd | 44 | 63 | 72 | 92 | 109 | 116 |

Snippet-Aussagen dazu: „A 10-handicap golfer hits the green just 49 percent of the time from 100 yards … From 150 yards, a 10-handicap hits the green 30 percent of the time.“

(D3) Nur zur Plausibilisierung, nicht in die Formeln eingeflossen:
- **Arccos** „Your Chances of Hitting The Green Might Be Lower Than You Think!“: Distanz, aus der man das Grün in 50 % der Fälle trifft. HCP 20 ≈ 92 yd, HCP 15 ≈ 110 yd, HCP 10 ≈ 129 yd, HCP 5 ≈ 147 yd, Scratch ≈ 165 yd.
- **Shot Scope Blog** „Heads or Tails: Golf's 50/50 Scenarios“: Green-Hit-Quote aus 100 yd vom Fairway: Scratch 74 %, HCP 5 65 %, 10 57 %, 15 49 %, 20 42 %, 25 36 %. Das widerspricht D2 beim HCP 10 (49 % vs. 57 %).

**Schritt 1 – Repräsentant je HCP-Band** (Booklet-Bänder 54–27 / 26–12 / 11–0):

| App-Band | Repräsentant | Arccos (D1) | Shot Scope (D2) |
|---|---|---|---|
| 11–0 | HCP 5 | Mittel aus 0–5 und 6–10 | Wert HCP 5 |
| 26–12 | HCP 19 (Bandmitte) | Bracket 16–20 | linear: v15 + 0,8·(v20 − v15) |
| 54–27 | HCP 25 | Bracket 20+ | Wert HCP 25 |

**Achtung:** Für HCP > 25 gibt es keine Daten. Werte für das Band 54–27 sind also **zu streng** für Spieler mit HCP 30–54.

Ergebnis (Fuß):
- 11–0: Arccos 70 yd = 43,29 · 110 yd = 51,69 · Shot Scope 100 yd = 41 · 150 yd = 63
- 26–12: Arccos 70 yd = 55,21 · 110 yd = 70,76 · Shot Scope 100 yd = 59 + 0,8·6 = 63,8 · 150 yd = 92 + 0,8·17 = 105,6
- 54–27: Arccos 70 yd = 62,45 · 110 yd = 83,46 · Shot Scope 100 yd = 75 · 150 yd = 116

**Schritt 2 – Interpolation über die Distanz:**
- Arccos: Bracket-Mitten als 70 yd bzw. 110 yd behandelt, dazwischen linear: p(x) = p70 + (x − 70)/40 · (p110 − p70)
- Shot Scope: p(x) = p100 + (x − 100)/50 · (p150 − p100)
- „gemischt“ (für Drills über 55–140 m): unter 100 yd linear von Arccos-70 yd zu Shot-Scope-100 yd, darüber Shot Scope. **Bekannter Fehler:** Beim Band 11–0 liegt Shot Scope bei 100 yd (41 ft) *unter* Arccos bei 70 yd (43 ft). Zwei Datensätze mit unterschiedlicher Methodik erzeugen hier einen Knick.

**Schritt 3 – Einheiten:** 1 ft = 0,3048 m · 1 yd = 0,9144 m (m → yd: ÷ 0,9144)

**Schritt 4 – Von der mittleren Distanz zur Trefferwahrscheinlichkeit.** Die Quellen geben Mittelwerte an, keine Verteilungen. *Annahme* (nicht aus der Quelle): Die radiale Distanz zur Fahne folgt einer Rayleigh-Verteilung, also einer runden 2D-Normalstreuung.
- σ = Mittel / √(π/2)
- P(r < R) = 1 − exp(−(π/4)·(R/Mittel)²)
- Folge: Mit **R = Mittelwert** landet ein typischer Bandspieler in ≈ **54 %** der Fälle innerhalb (1 − e^(−π/4) = 0,544).
- In Wirklichkeit streuen Amateure in Längsrichtung stärker (Golf Digest: Längenfehler „almost twice as big“ wie seitliche Fehler aus 50–100 yd, Snippet). Die Annahme ist eine Vereinfachung.

**Schritt 5 – Rundung:** Radien auf ganze Meter, erwartete Punkte und Treffer auf ganze Zahlen (kaufmännisch).

Rechenskript: `/tmp/claude-0/-home-user/73cebd44-a604-5aa6-907e-63c9b123cbd4/scratchpad/docs/phase5/bench.py`

**Bedeutung des HCP-Werts in den Tabellen:** Er ist der **erwartete Score eines typischen Spielers dieses Bands**, also kein Ziel für „gute Leistung“. Wenn das Booklet bei „Hit Three Greens“ etwas anderes meint (z. B. ein Ziel oberhalb des Durchschnitts), muss die Tabelle skaliert werden → siehe Offene Fragen.

---

### A1 – Luke Donald 30-Ball Wedge Game / Luke-Donald-30-Ball-Wedge-Spiel

**Quelle:**
- Golf Digest, „One of the best wedge players ever trusts this drill—how it works“
- https://www.golfdigest.com/story/luke-donald-30-ball-wedge-game-golf-digest-improve
- Autor im Snippet nicht genannt · Datum laut Snippet Mai 2025 · abgerufen 2026-10-31 · **nicht verifiziert (Such-Snippet)**

**Was die Quelle sagt (Snippet):**
- Donald verbringe Stunden mit einem „30-golf-ball, scoring wedge game“
- Ablauf: „drops three golf balls at 75 yards, hits them toward a pin, and records how far away each shot finished, then repeats from 78 yards up to 102 yards“
- Zitat Donald: er versuche „to create games that are a bit more golf-like“
- **Unsicher:** Die Stufen 78 → 102 yd kamen nur in einem von zwei Snippets vor. Ein anderes Snippet bestätigt nur „three balls at 75 yards … repeat“. Im Snippet fehlt eine Punktewertung.
- Rechnerisch passt es: 75, 78, …, 102 yd sind 10 Stationen à 3 Bälle = 30 Bälle.

**Drill im Booklet-Format:**
- **Setup:** 10 Stationen von 69 bis 93 m. Original 75–102 yd in 3-yd-Schritten, umgerechnet ≈ 69 / 71 / 74 / 77 / 80 / 82 / 85 / 88 / 91 / 93 m. Eine Fahne oder ein Ziel, mit dem Laser gemessen.
- **Ziel:** Möglichst viele Bälle innerhalb des Band-Radius.
- **Ablauf:** Je 3 Bälle pro Station, kürzeste Distanz zuerst, nach jeder Station ca. 2–3 m zurück. Pre-Shot-Routine vor jedem Ball. Pro Ball den Distanz-Bucket antippen (innerhalb / außerhalb Band-Radius).
- **duration_min:** 25
- **difficulty:** 4 (wie Hit Three Greens, aber 30 Bälle)
- **equipment:** 30 Bälle, Laser, Wedges
- **Scoring-Typ:** radius_by_band

**HCP-Tabelle:**

| HCP-Band | Radius | Erwartung für typischen Bandspieler |
|---|---|---|
| 54–27 | 22 m | ≈ 16 von 30 innerhalb |
| 26–12 | 19 m | ≈ 16 von 30 |
| 11–0 | 14 m | ≈ 16 von 30 |

**Herleitung:** Arccos (D1), interpoliert auf 75…102 yd. Mittlere Proximity über alle 10 Stationen:
- 11–0: Ø 14,38 m (13,5 → 15,2 m)
- 26–12: Ø 19,02 m (17,4 → 20,6 m)
- 54–27: Ø 22,00 m (19,8 → 24,2 m)

Radius = Mittelwert, gerundet. Daraus erwarteter Anteil innerhalb ≈ 54 % × 30 ≈ 16 (Rayleigh-Annahme).

**Angepasst ggü. Quelle:**
- yd → m
- „Distanz notieren“ wurde zu „Bucket innerhalb/außerhalb Radius“ (die App kennt keine freie Distanzeingabe)
- Radius, Dauer, Schwierigkeit und HCP-Tabelle sind von mir

**Unsicherheiten:** Stationen 78–102 yd nicht sicher belegt. Arccos-Daten sind ca. 8–10 Jahre alt. 69–80 m liegt leicht unter dem gewünschten Fenster von 80–200 m, gehört aber laut App-Definition (Short Game ≤ 50 m) zu Approach.

---

### A2 – Random Yardage (Justin Thomas) / Zufalls-Distanzen nach Justin Thomas

**Quelle:**
- Golf Digest, „Justin Thomas: Prep For Golf Like A Pro“, „By Justin Thomas, Photos by Finlay Mackay“
- https://www.golfdigest.com/story/justin-thomas-prep-for-golf-like-a-pro-get-battle-ready
- Datum nicht angezeigt. Die Suche schätzt ≈ 2018 („about 2,993 days old“), unbestätigt.
- Gleicher Text bei Australian Golf Digest: https://www.australiangolfdigest.com.au/justin-thomas-battle-ready/
- abgerufen 2026-10-31 · **nicht verifiziert (Such-Snippet)**

**Was die Quelle sagt (Snippet):**
- „I set it up to spit out random yardages, from 126 to 150 yards as an example, and I have to hit whatever shot it requests.“ (gemeint ist sein TrackMan)
- AU-Version: „Are you randomising your practice? By that I mean, are you hitting the same shot over and over or switching it up?“

**Drill im Booklet-Format:**
- **Setup:** Distanzfenster 115–137 m (≈ 126–150 yd wie im Original). Ohne Launch Monitor lässt die App 10 Zufallsdistanzen im Fenster würfeln, man wählt ein passendes Ziel/Fahne und lasert es.
- **Ziel:** Möglichst viele Bälle innerhalb des Band-Radius.
- **Ablauf:** 10 Bälle. Vor jedem Ball zeigt die App eine neue Zufallsdistanz. Schläger wählen, Pre-Shot-Routine, schlagen, Bucket antippen. Kein Ball zweimal auf dieselbe Distanz hintereinander.
- **duration_min:** 15
- **difficulty:** 5 (wechselnde Distanzen, längere Eisen)
- **equipment:** 10 Bälle, Laser (optional Launch Monitor)
- **Scoring-Typ:** radius_by_band

**HCP-Tabelle:**

| HCP-Band | Radius | Erwartung |
|---|---|---|
| 54–27 | 32 m | ≈ 5 von 10 innerhalb |
| 26–12 | 29 m | ≈ 5 von 10 |
| 11–0 | 18 m | ≈ 5 von 10 |

**Herleitung:** Shot Scope (D2), interpoliert auf die Fenstermitte 138 yd (≈ 126 m). Formel: p = p100 + 38/50·(p150 − p100).
- 11–0: 41 + 0,76·22 = 57,7 ft = 17,6 m (Spanne 126 yd: 16,0 m · 150 yd: 19,2 m)
- 26–12: 63,8 + 0,76·41,8 = 95,6 ft = 29,1 m (26,1–32,2 m)
- 54–27: 75 + 0,76·41 = 106,2 ft = 32,4 m (29,4–35,4 m)

Radius = Mittelwert, gerundet. Erwartung ≈ 54 % von 10.

**Angepasst:**
- Ohne TrackMan erzeugt die App die Zufallsdistanzen
- Ballzahl, Radius und Tabelle sind von mir
- Die Quelle nennt 126–150 yd nur „as an example“

**Unsicherheiten:** Datum des Artikels. Die Bänder 26–12 und 54–27 liegen nah beieinander (29 vs. 32 m), weil Shot Scope keine Daten über HCP 25 hat.

---

### A3 – Pinseeker / Fahnenjäger

**Quellen:**
1. Golf Digest, „The 15 best golf practice games“
   - https://www.golfdigest.com/story/the-15-best-golf-practice-games
   - Juni 2018 (Snippet), Autor im Snippet nicht genannt
   - **nicht verifiziert (Such-Snippet)**. Die Regeln selbst waren im Golf-Digest-Snippet abgeschnitten.
2. MassGolf (Massachusetts Golf Association), „Games For The Driving Range, Putting Green & Short Game Area“
   - https://www.massgolf.org/news/20-practicegames/
   - ca. 2020 (Snippet: „about five years old“)
   - **nicht verifiziert (Such-Snippet)**

**Was die Quelle sagt (MassGolf-Snippet):** „If your range has flagsticks, pick one and hit 10 balls toward it. Whoever gets the greatest number of balls closest to the pin (5 feet, 10 feet, your call), wins.“ Alternative: Ein Entfernungsschild als Fahne, „without going past it“. Golf Digest beschreibt Pinseeker als „played with flagsticks on the range, with each player hitting 10 balls at an agreed pin and the closest wins“ (Snippet).

**Drill im Booklet-Format:**
- **Setup:** 1 Fahne, Standard 120 m (Spieler darf 100–140 m wählen, dann gilt die Tabelle nur näherungsweise)
- **Ziel:** Möglichst nah an die Fahne
- **Ablauf:** 10 Bälle auf dieselbe Fahne, gleicher Schläger, Pre-Shot-Routine. Pro Ball tippen:
  - +2 = innerhalb 10 % der Distanz (12 m)
  - +1 = innerhalb 20 % (24 m)
  - 0 = außerhalb
- **duration_min:** 10
- **difficulty:** 3
- **equipment:** 10 Bälle, Laser
- **Scoring-Typ:** points_per_ball (+2 / +1 / 0)

**HCP-Tabelle** (erwartete Punkte aus 10 Bällen, max. 20):

| HCP-Band | erwartete Punkte |
|---|---|
| 54–27 | 5 |
| 26–12 | 6 |
| 11–0 | 11 |

**Herleitung:** Shot Scope (D2), 120 m = 131,2 yd. Mittlere Proximity:
- 11–0: 16,69 m
- 26–12: 27,40 m
- 54–27: 30,67 m

Erwartung pro Ball = P(r < 12) + P(r < 24) (Rayleigh):
- 11–0: 0,334 + 0,803 = 1,137 → × 10 = 11,4 → **11**
- 26–12: 0,140 + 0,452 = 0,592 → 5,9 → **6**
- 54–27: 0,113 + 0,382 = 0,495 → 4,95 → **5**

**Angepasst:**
- Original ist ein Wettspiel zu zweit („closest wins“). Hier ist es ein Solo-Drill.
- Der Radius „5 oder 10 feet, your call“ wurde zu 10 % / 20 % der Distanz. 5–10 ft auf 120 m wären für Amateure fast nie erreichbar.
- Punktwerte und Tabelle sind von mir

**Unsicherheiten:** Die Golf-Digest-Regeln konnte ich nicht lesen. Die Rundung macht die Bänder 26–12 und 54–27 kaum unterscheidbar (6 vs. 5).

---

### A4 – Approach-Iron Skill Test (adapted) / Approach-Eisen-Test

**Quelle:**
- Robertson, S., Burnett, A. F., Newton, R. U. (2013): „Development and validation of the Approach-Iron Skill Test for use in golf“, *European Journal of Sport Science* 13(6), 615–621
- doi:10.1080/17461391.2012.757809 · PubMed: https://pubmed.ncbi.nlm.nih.gov/24251739
- Folgestudie: Robertson, Burnett, Gupta (2014), *J. Sports Sci.* 32(14), 1341–1349, doi:10.1080/02640414.2014.893370
- abgerufen 2026-10-31 · **nicht verifiziert (Such-Snippet; Volltext vermutlich Paywall)**

**Was die Quelle sagt (Snippet):**
- „The 'Approach-Iron Skill Test' requires players to hit a total of 27 shots.“
- Beschreibung laut Snippet: drei Schläge auf jedes von neun Zielen in zufälliger Reihenfolge, Distanzen 55–165 m
- Wertung überwiegend über den „percent error index (PEI)“, also die Distanz zum Ziel normiert auf die Schlagdistanz
- Ergebnis: Elite-Spieler signifikant besser als „high-level amateurs“ („56.3±5.6 and 58.5±4.6 points versus 46.0±6.3 and 46.1±6.7 points“)
- Gute Test-Retest-Reliabilität
- Folgestudie: der Test war „the slightly stronger predictor of on-course per cent error index“

**Drill im Booklet-Format:**
- **Setup:** 9 Ziele: 55 / 65 / 75 / 85 / 95 / 105 / 115 / 125 / 135 m
- **Ziel:** Möglichst viele Bälle innerhalb 10 % der Zieldistanz (wie bei Hit Three Greens)
- **Ablauf:** 27 Bälle, je 3 pro Ziel. Die App gibt eine **zufällige Reihenfolge** vor (wie im Original). Pre-Shot-Routine. Pro Ball Treffer ja/nein.
- **duration_min:** 35
- **difficulty:** 5
- **equipment:** 27 Bälle, Laser
- **Scoring-Typ:** count_higher_better

**HCP-Tabelle** (erwartete Treffer von 27):

| HCP-Band | erwartete Treffer |
|---|---|
| 54–27 | 3 |
| 26–12 | 4 |
| 11–0 | 8 |

**Herleitung:** „gemischte“ Interpolation (Arccos < 100 yd, Shot Scope ≥ 100 yd). Pro Ziel P(r < 0,1·d) per Rayleigh, Summe × 3:
- 11–0: P von 0,12 (55 m) bis 0,34 (95–115 m) → Σ × 3 = 7,52 → **8**
- 26–12: P 0,09–0,16 → 3,58 → **4**
- 54–27: P 0,07–0,12 → 2,82 → **3**

**Angepasst (wesentlich, bitte bewerten):**
- **Distanzspanne auf 55–135 m gekürzt** (Original bis 165 m), weil die Proximity-Daten nur bis 150 yd ≈ 137 m reichen. Die 9 Zieldistanzen sind von mir; das Original nennt laut Snippet nur die Spanne.
- **Die PEI-Punktewertung wurde durch Treffer im 10 %-Radius ersetzt.** Die Original-Punktezonen kenne ich nicht, daher sind die Original-Mittelwerte (46–58 Punkte) **nicht** mit dieser Tabelle vergleichbar.
- Der Test wurde für Elite- und High-Level-Amateure entwickelt, nicht für HCP 54.

**Unsicherheiten:** Knick in der gemischten Interpolation beim Band 11–0. Sehr niedrige Trefferzahlen bei hohen HCP. Gut möglich, dass David statt 10 % lieber 15 % Radius will (→ Offene Fragen).

---

### A5 – 10-Shot Drill / 10-Schläge-10-Ziele

**Quelle:**
- Today's Golfer, „The 10-shot drill every golfer should do on the driving range“, in einer anderen Version betitelt „Flush it on the range but crumble on the course? This brutal 10-ball drill reveals why“
- https://www.todays-golfer.com/news-and-events/general-news/best-golf-driving-range-drill/
- Autor und Datum im Snippet nicht angezeigt · abgerufen 2026-10-31 · **nicht verifiziert (Such-Snippet)**

**Was die Quelle sagt (Snippet):**
- „hit 10 shots to 10 different targets with 10 different clubs. You'll award each shot a number – one, two or three – based on the result.“
- Kategorien „Good“, „Good Enough“, „Poor“
- Ergebnisse mit einem Coach besprechen und den Test „in a few weeks“ wiederholen

**Drill im Booklet-Format:**
- **Setup:** 10 Ziele von 60 bis 132 m in 8-m-Schritten: 60 / 68 / 76 / 84 / 92 / 100 / 108 / 116 / 124 / 132 m. Für jedes Ziel ein anderer Schläger.
- **Ziel:** Möglichst viele Punkte
- **Ablauf:** 1 Ball pro Ziel, neuer Schläger pro Schlag, volle Routine. Wertung pro Ball:
  - +3 „Good“ = innerhalb 10 % der Distanz
  - +2 „Good enough“ = innerhalb 20 %
  - +1 „Poor“ = außerhalb
- **duration_min:** 15
- **difficulty:** 4
- **equipment:** 10 Bälle, Laser, 10 Schläger
- **Scoring-Typ:** points_per_ball (+3 / +2 / +1)

**HCP-Tabelle** (erwartete Punkte, Min. 10, Max. 30):

| HCP-Band | erwartete Punkte |
|---|---|
| 54–27 | 15 |
| 26–12 | 16 |
| 11–0 | 20 |

**Herleitung:** „gemischte“ Interpolation. Pro Ziel: E = 1 + P(r < 2R) + P(r < R) mit R = 0,1·d. Summe über die 10 Ziele:
- 11–0: 20,18 → 20
- 26–12: 15,79 → 16
- 54–27: 14,70 → 15

**Angepasst:**
- Die Quelle definiert „Good / Good enough / Poor“ nach dem Snippet nicht über Distanzen. Die 10 %/20 %-Grenzen und die Zieldistanzen sind von mir.
- Für die Booklet-Logik wurde die Distanz auf ≤ 132 m begrenzt (Datenlage). Das Original lässt freie Ziele zu, inklusive Driver.

**Unsicherheiten:** Autor und Datum unbekannt. Da 1 Punkt pro Ball garantiert ist, unterscheiden sich die Bänder kaum. Eine Alternative wäre +2 / +1 / 0 (dann 5 / 6 / 10).

---

### 2.6 Geprüfte, aber nicht vorgeschlagene Kandidaten

- **„Nine Shots One Club“** (Tiger Woods, gelistet in Golf Digest „15 best practice games“ und bei Australian Golf Digest): 9 Flugkurven (Draw/Fade/gerade × hoch/mittel/flach) mit einem Schläger. Gut belegt, aber **keine Daten für HCP-Benchmarks**. Eine Tabelle müsste ich erfinden. Nur aufnehmen, wenn David einen Drill ohne HCP-Tabelle akzeptiert oder eine selbst gesetzte Tabelle freigibt.
- **Golf Monthly „Approach Challenge“** („7 Fun Golf Range Games To Instantly Improve Your Skills“, ca. Jan. 2025): 9 Schläge, 50–210 yd. Wertung im Snippet nicht bestätigt, vermutlich ein Toptracer-Spiel. Benchmarks über 150 yd fehlen.
- **TrackMan Combine** (60–180 yd + Driver, Score 0–100): braucht einen Launch Monitor. Die Benchmarks sind Marketing („Tour Pro 83, 5 hcp 67, 15 hcp 50“, TrackMan-Broschüre über clublink-PDF) oder Forenwerte.
- **Golf Digest Stress Tests – „Smarter Iron-Play Test“**: hat Leistungsstufen, liegt aber hinter der Golf-Digest+-Paywall. Regeln nicht einsehbar.

---

## 3. Teil B – Empfehlungsquellen, Aufteilung & Gewichte

### 3.1 Was die Quellen sagen (alle nicht verifiziert, Such-Snippet)

**B1 – Mark Broadie, Schwab „The Challengers“-Video**
- https://content.schwab.com/web/retail/public/corporatesponsorships/challengers-video-mark-broadie.html
- Snippet des Seitentexts: „putting only accounted for about 15% of the stroke difference between the best PGA TOUR Pros and average PGA TOUR Pros, whereas shots outside 100 yards count for 65% of that scoring difference.“
- **Achtung:** Das bezieht sich auf **Tour-Pros**, nicht auf Amateur-Niveaus. Die Aussage „150-yard-Schlag am wichtigsten zum Üben“ habe ich im Schwab-Snippet **nicht** gefunden (siehe B2).

**B2 – Mark Broadie im Interview mit dem Chicago Golf Report**, „Mark Broadie – The Godfather of Golf Analytics“
- https://www.chicagogolfreport.com/mark-broadie/
- Laut Snippet: Wenn er von einem Spieler nur wüsste, dass er HCP 20 hat, würde er zuerst Schläge aus etwa 150 Yards üben lassen, „give or take 25“, also ca. 100–175 yd.
- Außerdem: „roughly six and a half of those strokes come from better shots outside of a hundred yards. And about three and a half of those strokes come from better shots from inside a hundred yards.“ Bezug laut Kontext vermutlich ein 10-Schläge-Unterschied.
- **Nur paraphrasiert im Snippet, kein wörtliches Zitat bestätigt.** Das ist sehr wahrscheinlich die Quelle für die Aussage „~150-yard approach am wichtigsten“. Zuordnung zu Schwab im Auftrag ist vermutlich eine Verwechslung.

**B3 – Mark Broadie, GOLF Magazine / golf.com**, „Improving Your Approach Shots Is the Fastest Way to Lower Scores“
- https://golf.com/instruction/mark-broadie-new-approach-golf-mag-jan-2015
- Januar 2015 (laut URL)
- Snippets: Approach „account[s] for 40 percent of the scoring advantage that the best Tour pros have over average Tour pros“ und „four of the 10 strokes that separate golfers who shoot 90, on average, from 80-shooters“

**B4 – Broadie, „Every Shot Counts“ (2014)**, Tabelle über die Sekundärquelle golfingfocus.com, „Complete Guide to the Good, the Bad & the Ugly of Golf Scores“
- https://golfingfocus.com/complete-guide-to-the-good-the-bad-the-ugly-of-golf-scores/
- Strokes gained zwischen Score-Niveaus:

| von → nach | Driving | Approach | Short | Putt | Summe |
|---|---|---|---|---|---|
| 100 → 90 | 2,6 | 4,0 | 2,0 | 1,4 | 10,0 |
| 90 → 80 | 2,5 | 4,0 | 2,1 | 1,4 | 10,0 |

- Dazu: „The long game, consisting of driving and approach shots, explains two-thirds of the difference in scores between a typical 110-golfer and a typical 100-golfer or between a typical 90-golfer and a typical 80-golfer; the short game and putting explain the remaining one-third.“
- Zeilen 110 → 100 und 80 → 70 nicht im Snippet.
- **Sekundärquelle, Buch nicht eingesehen.** Die Zahlen sind aber konsistent mit B3 (4 von 10).

**B5 – Broadie, Top 40 PGA-Tour-Pros 2004–2012** (über Golf Digest / Buch-Rezensionen): Approach 40 %, Driving 28 %, Short Game 17 %, Putting 15 %.

**B6 – Broadie (2008)**, „Assessing Golfer Performance Using Golfmetrics“
- http://www.columbia.edu/~mnb2/broadie/Assets/broadie_wscg_v_200804.pdf
- Snippet: „the long game is found to be the biggest factor in the difference in scores between pros and amateurs and between low- and high-handicap amateurs“

**B7 – Dave Pelz, „Dave Pelz's Short Game Bible“** (Broadway Books; Erscheinungsjahr 1999 aus Erinnerung, nicht verifiziert)
- Leseprobe der Library of Congress: https://catdir.loc.gov/catdir/samples/random043/99017226.html
- Snippets: „60% to 65% of all golf shots occur inside 100 yards of the hole“ (Basis: über 23 Jahre Datensammlung)
- Außerdem: rund 80 % der „shots golfers lose to par occur inside 100 yards“
- **Wichtig für die App:** „Innerhalb 100 yd“ bei Pelz umfasst Putten, Short Game *und* Wedges von 50–100 yd. Letztere zählen in der App zu Approach.

**B8 – Arccos, „The Arccos Data Behind Getting From 5 Handicap To Scratch“**
- https://eu.arccosgolf.com/blogs/community/the-race-to-scratch-what-it-takes-for-a-5-handicap-to-reach-scratch
- Zahlen über einen GolfWRX-Thread
- 14 Golfer mit Start-HCP Ø 6,1, Verbesserung 2,5 Schläge in einem Jahr: Approach +1,02 (40,8 %), Driving +0,81 (32,4 %), Short Game +0,42 (16,8 %), Putting +0,25 (10,0 %)
- Alternative Methode im selben Artikel: 23 / 36 / 25 / 16 %
- Kleine Stichprobe, Herstellerdaten

**B9 – Arccos/MyGolfSpy, „How Far Are You From the Next Handicap Level? (Full Chart)“**
- https://mygolfspy.com/news-opinion/how-far-are-you-from-the-next-handicap-level-full-chart/
- 329.000 Runden, ca. 21.000 Golfer mit USGA-HCP, Mediane, aufgeteilt in Tee / Approach / Short Game / Putting
- Die Tabellenwerte habe ich **nicht** gesehen. Laut Sekundärquelle dormied.com (15.07.2026) erklärt Approach „roughly 40 percent of the stroke gap between handicap bands“, und Tee-Schläge werden mit sinkendem HCP wichtiger.
- **Wichtigste Quelle zum Nachprüfen**, sobald MyGolfSpy erreichbar ist.

**B10 – Lou Stagner (Arccos Data Insights Lead):** Eine Aufteilung nach Kategorie und HCP habe ich nicht gefunden. Seine Newsletter-Aussagen zum Üben (z. B. #83 „The five keys to better practice“, Randomisierung) sind qualitativ.

**B11 – Aufteilung der Trainingszeit durch College- oder Tour-Coaches:** **keine zitierfähige Quelle gefunden.**
- Nur unbelegte Blog-Aussagen, z. B. juniorgolfscoreboard.com: „Most college golf coaches will tell you that the best players … spend at least two-thirds of their practice time working on their short games“ (ohne Beleg)
- Golf Digest (Luke Kerr-Dineen, Analyse von ca. 250.000 Range-Bällen von Tour-Pros) beschreibt, *was* Pros auf der Range schlagen (u. a. „as many wedges as drivers“). Das ist aber keine Empfehlung zur Zeitaufteilung.
- Kommerzielle Apps und Blogs schlagen sehr unterschiedliche Splits vor (z. B. 60/20/20, 40/30/30). Sie sind nicht zitierfähig.

### 3.2 Wo die Quellen sich widersprechen

| Thema | Broadie (B3, B4, B6, B8, B9) | Pelz (B7) |
|---|---|---|
| Wo entsteht der Score-Unterschied? | ~2/3 im langen Spiel (> 100 yd bzw. Tee + Approach), Approach ≈ 40 % auf allen Niveaus | 80 % der Schläge über Par innerhalb von 100 yd |
| Messgröße | Strokes gained, also *Differenz* zwischen Niveaus | Anzahl Schläge bzw. Schläge über Par |

**Auflösung:** Pelz zählt, *wo Schläge stattfinden* bzw. verloren gehen, relativ zu Par. Broadie misst, *welche Fähigkeit den Unterschied zwischen zwei Niveaus erklärt*. Ein langer Approach-Fehler führt z. B. zu einem schwierigen Chip, und Pelz schreibt diesen Verlust dem Kurzspiel zu. Für „welche Kategorie hebt mein HCP“ ist Broadies Strokes-gained-Methode die passende Metrik. Pelz ist ein Argument für eine **Untergrenze** bei Short Game und Putting: Diese Schläge sind zahlreich und billig zu trainieren.

### 3.3 Vorschlag: Startaufteilung der Trainingszeit

**Regel:** Trainingszeit-Anteil = Anteil der Kategorie an der Strokes-gained-Differenz zum nächsten Niveau (Broadie), gerundet auf 5 %. Untergrenze 15 % für Putting und 15 % für Short Game (Pelz-Argument, Tour-Anteil Putting 15 % aus B1/B5).

**Zuordnung Score-Niveau → HCP** (Annahme, keine Quelle): Durchschnittsscore ≈ Par 72 + HCP + ca. 2–3. Damit entspricht ein 90er-Spieler etwa HCP 15–18, ein 80er etwa HCP 5–8 und ein 100er etwa HCP 25–28.

**Rechnung:**
- **100 → 90** (≈ Band 54–27 / oberes 26–12): 2,6 / 4,0 / 2,0 / 1,4 von 10 = 26 / 40 / 20 / 14 % → gerundet **25 / 40 / 20 / 15**
- **90 → 80** (≈ Band 26–12): 2,5 / 4,0 / 2,1 / 1,4 = 25 / 40 / 21 / 14 % → **25 / 40 / 20 / 15**
- **Band 11–0:** Arccos 5 → Scratch 32 / 41 / 17 / 10 % (B8) und Broadie Top-40-Tour 28 / 40 / 17 / 15 % (B5). Mittel = 30 / 40,5 / 17 / 12,5 → gerundet 30 / 40 / 15 / 15 (Putting auf die 15-%-Untergrenze gehoben, SG auf 15 gerundet)

| HCP-Band | Off the Tee | Approach | Short Game (≤ 50 m inkl. Bunker) | Putting |
|---|---|---|---|---|
| 54–27 | 25 % | 40 % | 20 % | 15 % |
| 26–12 | 25 % | 40 % | 20 % | 15 % |
| 11–0 | 30 % | 40 % | 15 % | 15 % |

**Anmerkungen:**
- Laut Broadie (B4) sind die Anteile bei 110 → 100, 100 → 90 und 90 → 80 nahezu gleich. Deshalb sind 54–27 und 26–12 identisch. Eine feinere Bandeinteilung bringt nach dieser Datenlage nichts.
- **Abgrenzungsproblem:** Broadies „Short Game“ geht bis 100 yd (≈ 91 m), das der App nur bis 50 m. Die Schläge von 50–91 m stecken bei Broadie im Short Game, in der App im Approach. Streng genommen müsste der App-Approach-Anteil also *höher* sein und Short Game niedriger. Ohne Broadies Unterteilung nach Distanz kann ich das nicht beziffern. Ich lasse es bei der obigen Tabelle; die Untergrenze für Short Game kompensiert teilweise.
- Für HCP 30–54 ist anzunehmen, dass Strafschläge vom Tee und Recovery wichtiger sind. Der Arccos Driving Report 2026 erwähnt laut Snippet, „the recovery shot is the bigger problem for 30-handicappers“ (nicht verifiziert). Belastbare Zahlen habe ich nicht → Offene Fragen.

### 3.4 Vorschlag: Gewichte für das Gesamt-Trainings-HCP

**Herleitung:**
- Annahme: Ein Kategorie-Trainings-HCP von h bedeutet, dass der Spieler in dieser Kategorie so spielt wie ein Golfer mit Gesamt-HCP h.
- Dann ändert sich der Score bei einer Verbesserung um ΔHCP in Kategorie k um w_k · ΔHCP. Dabei ist w_k der Anteil der Kategorie an der gesamten Schlagdifferenz zwischen Niveaus.
- Das Gesamt-HCP ist also der gewichtete Mittelwert **HCP_gesamt = Σ w_k · HCP_k** mit Σ w_k = 1.

Broadie (B4), Mittel aus 100 → 90 und 90 → 80:
- OTT (2,6 + 2,5)/20 = 0,255
- APP 8,0/20 = 0,400
- SG (2,0 + 2,1)/20 = 0,205
- PUTT 2,8/20 = 0,140

**Vorschlag (gerundet, Summe 1,0):** OTT **0,25** · APP **0,40** · SG **0,20** · PUTT **0,15**

- Putting von 0,14 auf 0,15, damit es mit der Tour-Zahl aus B1/B5 übereinstimmt und die Summe stimmt. Mit Short Game auf 0,20 und OTT auf 0,25 ergibt das 1,0.
- Gegencheck: Arccos 5 → Scratch (B8) 0,32 / 0,41 / 0,17 / 0,10 liegt in derselben Größenordnung. Approach ist überall ≈ 0,40.
- **Alternative Gleichgewichtung (je 0,25):** Keine Quelle stützt sie. Ein Spieler mit gutem Putting und schwachem Approach würde zu gut eingestuft.
- **Empfehlung:** Bandunabhängig die Gewichte 0,25 / 0,40 / 0,20 / 0,15 verwenden. Die Daten zeigen kaum Unterschiede zwischen Niveaus, und bandabhängige Gewichte würden Sprünge im Gesamt-HCP an Bandgrenzen erzeugen.
- Sobald B9 (Arccos 329k-Runden-Chart) lesbar ist, sollten die Gewichte daran gegengeprüft werden.

---

## 4. Quellenliste (für die Tabelle `sources`)

Alle Einträge: abgerufen (accessed_at) **2026-10-31**, Status **nicht verifiziert (Such-Snippet)**, weil die Seiten aus der Umgebung nicht geöffnet werden konnten.

| # | title | author / org | url | accessed_at | note |
|---|---|---|---|---|---|
| S1 | Course Management 101: What Layup Yardage is Your Sweet Spot? | MyGolfSpy Labs / Arccos | https://mygolfspy.com/labs/course-management-101-what-layup-yardage-is-your-sweet-spot/ | 2026-10-31 | Proximity nach Arccos-Bracket aus 60–80 / 100–120 yd. Benchmarks A1, A4, A5. Ca. 8–10 J. alt. Nicht verifiziert. |
| S2 | Arccos Knows: Where Should Most Golfers Lay Up? (Spiegel von S1) | Arccos | https://www.arccosgolf.com/blogs/community/course-management-101-what-layup-yardage-is-your-sweet-spot | 2026-10-31 | Gleiche Tabelle wie S1. Nicht verifiziert. |
| S3 | 100 Yards Feels Like A Scoring Shot But The Data Says Otherwise | MyGolfSpy (Shot-Scope-Daten) | https://mygolfspy.com/news-opinion/instruction/100-yards-feels-like-a-scoring-shot-but-the-data-says-otherwise/ | 2026-10-31 | Proximity aus 100 / 150 yd für HCP 0–25. Benchmarks A2–A5. Ca. Anfang 2026. Nicht verifiziert. |
| S4 | Your Chances of Hitting The Green Might Be Lower Than You Think! | Arccos | https://www.arccosgolf.com/blogs/community/from-this-distance-you-have-a-50-chance-of-hitting-the-green | 2026-10-31 | Distanz mit 50 % Grün-Treffern je HCP. Plausibilisierung. Nicht verifiziert. |
| S5 | Heads or Tails: Golf's 50/50 Scenarios That Define Your Scores | Shot Scope | https://shotscope.com/blog/practice-green/stats-and-data/heads-or-tails-golfs-50-50-scenarios-that-define-your-scores/ | 2026-10-31 | Green-Hit-Quote aus 100 yd je HCP. Widerspricht S3 bei HCP 10. Nicht verifiziert. |
| S6 | One of the best wedge players ever trusts this drill—how it works | Golf Digest | https://www.golfdigest.com/story/luke-donald-30-ball-wedge-game-golf-digest-improve | 2026-10-31 | Drill A1. Mai 2025. Nicht verifiziert. |
| S7 | Justin Thomas: Prep For Golf Like A Pro | Justin Thomas / Golf Digest | https://www.golfdigest.com/story/justin-thomas-prep-for-golf-like-a-pro-get-battle-ready | 2026-10-31 | Drill A2. Ca. 2018, unbestätigt. Nicht verifiziert. |
| S8 | The 15 best golf practice games | Golf Digest | https://www.golfdigest.com/story/the-15-best-golf-practice-games | 2026-10-31 | Drill A3 (Pinseeker), Nine Shots One Club. Juni 2018. Nicht verifiziert. |
| S9 | Games For The Driving Range, Putting Green & Short Game Area | MassGolf | https://www.massgolf.org/news/20-practicegames/ | 2026-10-31 | Pinseeker-Regeln (A3). Ca. 2020. Nicht verifiziert. |
| S10 | Development and validation of the Approach-Iron Skill Test for use in golf | Robertson, Burnett, Newton – Eur. J. Sport Sci. 13(6) | https://doi.org/10.1080/17461391.2012.757809 | 2026-10-31 | Drill A4. 2013, peer-reviewed. PubMed 24251739. Nicht verifiziert. |
| S11 | Two tests of approach-iron golf skill and their ability to predict tournament performance | Robertson, Burnett, Gupta – J. Sports Sci. 32(14) | https://www.tandfonline.com/doi/full/10.1080/02640414.2014.893370 | 2026-10-31 | Validität A4. 2014. Nicht verifiziert. |
| S12 | The 10-shot drill every golfer should do on the driving range | Today's Golfer | https://www.todays-golfer.com/news-and-events/general-news/best-golf-driving-range-drill/ | 2026-10-31 | Drill A5. Autor und Datum unbekannt. Nicht verifiziert. |
| S13 | The Challengers – Mark Broadie | Charles Schwab | https://content.schwab.com/web/retail/public/corporatesponsorships/challengers-video-mark-broadie.html | 2026-10-31 | Putting 15 %, > 100 yd 65 % (Tour-Pros). Nicht verifiziert. |
| S14 | Mark Broadie – The Godfather of Golf Analytics | Chicago Golf Report | https://www.chicagogolfreport.com/mark-broadie/ | 2026-10-31 | 150 ± 25 yd als Übungs-Priorität für HCP 20; 6,5 vs. 3,5 Schläge außerhalb/innerhalb 100 yd. Nur paraphrasiert. Nicht verifiziert. |
| S15 | Improving Your Approach Shots Is the Fastest Way to Lower Scores | Mark Broadie / GOLF Magazine | https://golf.com/instruction/mark-broadie-new-approach-golf-mag-jan-2015 | 2026-10-31 | Approach 40 % (Tour) bzw. 4 von 10 Schlägen (90 → 80). Jan. 2015. Nicht verifiziert. |
| S16 | Complete Guide to the Good, the Bad & the Ugly of Golf Scores | golfingfocus.com (zitiert Broadie, Every Shot Counts) | https://golfingfocus.com/complete-guide-to-the-good-the-bad-the-ugly-of-golf-scores/ | 2026-10-31 | SG-Tabelle 100 → 90 / 90 → 80. Basis für Split und Gewichte. Sekundärquelle. Nicht verifiziert. |
| S17 | Every Shot Counts | Mark Broadie (Gotham Books, 2014) | https://www.penguinrandomhouse.com/books/309737/every-shot-counts-by-mark-broadie/9781592407507/ | 2026-10-31 | Primärquelle für S16 und Top-40-Aufteilung 40/28/17/15. Buch nicht eingesehen. |
| S18 | Assessing Golfer Performance Using Golfmetrics | Mark Broadie (2008) | http://www.columbia.edu/~mnb2/broadie/Assets/broadie_wscg_v_200804.pdf | 2026-10-31 | Langes Spiel als größter Faktor auch zwischen Amateuren. Nicht verifiziert. |
| S19 | Dave Pelz's Short Game Bible (Leseprobe) | Dave Pelz / Library of Congress | https://catdir.loc.gov/catdir/samples/random043/99017226.html | 2026-10-31 | 60–65 % der Schläge innerhalb 100 yd; ~80 % der Schläge über Par innerhalb 100 yd. Nicht verifiziert. |
| S20 | The Arccos Data Behind Getting From 5 Handicap To Scratch | Arccos | https://eu.arccosgolf.com/blogs/community/the-race-to-scratch-what-it-takes-for-a-5-handicap-to-reach-scratch | 2026-10-31 | 5 → Scratch: 40,8 % APP / 32,4 % OTT / 16,8 % SG / 10 % PUTT (n = 14). Nicht verifiziert. |
| S21 | How Far Are You From the Next Handicap Level? (Full Chart) | MyGolfSpy / Arccos | https://mygolfspy.com/news-opinion/how-far-are-you-from-the-next-handicap-level-full-chart/ | 2026-10-31 | 329k Runden, Kategorien je HCP-Stufe. Werte NICHT gesehen, vorrangig nachprüfen. |
| S22 | Arccos Just Told Every 15-Handicap Where They're Wasting Strokes. It Isn't Putting. | dormied.com | https://dormied.com/news/arccos-just-told-every-15-handicap-where-theyre-wasting-strokes-it-isnt-2026-07-15/ | 2026-10-31 | Sekundär zu S21: Approach ≈ 40 % der Lücke zwischen HCP-Bändern. 15.07.2026. Nicht verifiziert. |

---

## 5. Offene Fragen an David

1. **Netzwerkzugang freigeben?** Ohne Zugriff auf die Golf-Domains (Liste in Abschnitt 0) bleibt alles „nicht verifiziert“. Soll ich nach der Freigabe einen Verifikationslauf machen, bevor du entscheidest?
2. **Bedeutung der HCP-Zahl im Booklet:** Ist der Tabellenwert bei „Hit Three Greens“ (9 / 14 / 20) der *erwartete Durchschnitt* des Bands oder ein *Ziel* über dem Durchschnitt? Meine Tabellen sind Erwartungswerte. Für ein Ziel bräuchte es z. B. das 70. Perzentil.
3. **Band 54–27:** Für HCP > 25 gibt es keine Proximity-Daten. Sollen die Werte für 54–27 bleiben (zu streng für HCP 30+) oder willst du einen Abschlag freigeben, der dann als Annahme markiert wird?
4. **A4 (Approach-Iron Skill Test):** Ist die Kürzung auf 55–135 m und der Ersatz der PEI-Wertung durch Treffer im 10-%-Radius okay? Oder lieber 15 % Radius, mit besserer Trennschärfe bei hohen HCP?
5. **A3 und A5:** Die Bänder 26–12 und 54–27 liegen sehr nah beieinander. Möchtest du für diese Drills die 6-Band-Skala (Shot Scope hat Daten für HCP 0/5/10/15/20/25)?
6. **Nine Shots One Club (Tiger):** Aufnehmen ohne datenbasierte HCP-Tabelle?
7. **Startaufteilung:** Soll das Band 54–27 mehr Off-the-Tee-Anteil bekommen (Strafschläge/Recovery), obwohl Broadies Daten das nicht zeigen? Und ist die 15-%-Untergrenze für Putting und Short Game okay?
8. **Kategorie-Grenze Short Game 50 m vs. Broadie 100 yd:** Akzeptierst du, dass die Split-Tabelle Broadies Kategorien 1:1 übernimmt (siehe Anmerkung in 3.3)?
9. **Gesamt-HCP-Gewichte 0,25 / 0,40 / 0,20 / 0,15** bandunabhängig, oder doch Gleichgewichtung?
