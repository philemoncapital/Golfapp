import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const de = {
  nav: { today: 'Heute', drills: 'Übungen', session: 'Session', profile: 'Profil' },
  cat: { tee: 'Abschlag', approach: 'Annäherung', short: 'Kurzes Spiel', putting: 'Putten' },
  area: { range: 'Driving Range', pitching: 'Pitching Green', bunker: 'Bunker', chipping: 'Chipping Green', putting: 'Putting Green' },
  today: {
    week: 'Training diese Woche', of: 'von {{goal}} Min', trainingHcp: 'Trainings-Handicap', realHcp: 'Echtes Handicap',
    notEnough: 'Noch zu wenig Daten', needs: 'Mindestens 2 verschiedene Übungen pro Bereich nötig.',
    estimate: 'Schätzung aus deinen Übungsergebnissen, kein offizielles Handicap.', setHcp: 'Handicap im Profil eintragen',
    noSessions: 'Noch keine Session. Stell dir unter „Session“ eine zusammen.',
  },
  drills: { all: 'Alle', min: 'Min', difficulty: 'Anspruch', add: 'Zur Session', added: 'In der Session', verify: 'Wert am Original prüfen: {{what}}', target: 'Ziel für dich', setup: 'Aufbau', goal: 'Ziel', procedure: 'Ablauf', scoring: 'Wertung', enPending: '' },
  session: {
    title: 'Session', total: 'Gesamt', empty: 'Noch keine Übungen. Füge welche aus der Bibliothek hinzu oder lass dir eine Session bauen.',
    haveMinutes: 'Ich habe … Minuten', build: 'Session bauen', start: 'Session starten', remove: 'Entfernen', up: 'Nach oben', down: 'Nach unten',
    splitNote: 'Aufteilung vorläufig gleichmäßig, bis die Coaching-Quellen freigegeben sind (Phase 5).',
  },
  live: {
    remaining: 'Restzeit', drill: 'Übung {{i}} von {{n}}', pause: 'Pause', resume: 'Weiter', skip: 'Überspringen', save: 'Ergebnis speichern',
    quick: 'Gesamtwert eingeben', undo: 'Rückgängig', notes: 'Notizen', result: 'Ergebnis', yourHcp: 'Übungs-Handicap', target: 'Ziel deiner Stufe',
    next: 'Nächste Übung', finish: 'Session beenden', done: 'Session beendet', timeUp: 'Zeit ist um', soundHint: 'Ohne Vibration spielt die App einen Ton – Lautlos-Schalter beachten.',
    holed: 'Gelocht', green: 'Grün', missed: 'Verfehlt', notFinished: 'Nicht geschafft – Treffer:', minutes: 'Minuten', ball: 'Ball', pos: 'Position',
  },
  profile: {
    title: 'Profil', realHcp: 'Echtes Handicap', goal: 'Wochenziel (Minuten)', language: 'Sprache', accent: 'Akzentfarbe', save: 'Speichern', saved: 'Gespeichert',
    export: 'Daten als CSV exportieren', signOut: 'Abmelden', local: 'Lokaler Modus: Daten bleiben auf diesem Gerät. Für Freunde und Sync Supabase einrichten (README).',
  },
  auth: { signIn: 'Anmelden', signUp: 'Registrieren', name: 'Name', email: 'E-Mail', password: 'Passwort', checkMail: 'Bestätigungslink gesendet. Bitte E-Mail prüfen.', switchToUp: 'Noch kein Konto? Registrieren', switchToIn: 'Schon registriert? Anmelden' },
  sync: { ok: 'Synchronisiert', offline: 'Offline – wird später synchronisiert', local: 'Nur auf diesem Gerät', error: 'Sync fehlgeschlagen' },
};

const en: typeof de = {
  nav: { today: 'Today', drills: 'Drills', session: 'Session', profile: 'Profile' },
  cat: { tee: 'Off the tee', approach: 'Approach', short: 'Short game', putting: 'Putting' },
  area: { range: 'Driving range', pitching: 'Pitching green', bunker: 'Bunker', chipping: 'Chipping green', putting: 'Putting green' },
  today: {
    week: 'Practice this week', of: 'of {{goal}} min', trainingHcp: 'Training handicap', realHcp: 'Real handicap',
    notEnough: 'Not enough data yet', needs: 'Needs at least 2 different drills per category.',
    estimate: 'Estimated from your drill results, not an official handicap.', setHcp: 'Add your handicap in Profile',
    noSessions: 'No session yet. Build one under “Session”.',
  },
  drills: { all: 'All', min: 'min', difficulty: 'Difficulty', add: 'Add to session', added: 'In session', verify: 'Check against the booklet: {{what}}', target: 'Your target', setup: 'Setup', goal: 'Goal', procedure: 'Procedure', scoring: 'Scoring', enPending: 'English drill text is added in Phase 2; showing the German original.' },
  session: {
    title: 'Session', total: 'Total', empty: 'No drills yet. Add some from the library or let the app build a session.',
    haveMinutes: 'I have … minutes', build: 'Build session', start: 'Start session', remove: 'Remove', up: 'Move up', down: 'Move down',
    splitNote: 'Split is equal for now, until the coaching sources are approved (Phase 5).',
  },
  live: {
    remaining: 'Time left', drill: 'Drill {{i}} of {{n}}', pause: 'Pause', resume: 'Resume', skip: 'Skip', save: 'Save result',
    quick: 'Enter total', undo: 'Undo', notes: 'Notes', result: 'Result', yourHcp: 'Drill handicap', target: 'Target for your band',
    next: 'Next drill', finish: 'Finish session', done: 'Session finished', timeUp: 'Time is up', soundHint: 'Without vibration the app plays a sound – check the silent switch.',
    holed: 'Holed', green: 'Green', missed: 'Missed', notFinished: 'Not finished – hits:', minutes: 'minutes', ball: 'Ball', pos: 'Position',
  },
  profile: {
    title: 'Profile', realHcp: 'Real handicap', goal: 'Weekly goal (minutes)', language: 'Language', accent: 'Accent colour', save: 'Save', saved: 'Saved',
    export: 'Export data as CSV', signOut: 'Sign out', local: 'Local mode: data stays on this device. Set up Supabase for friends and sync (README).',
  },
  auth: { signIn: 'Sign in', signUp: 'Sign up', name: 'Name', email: 'Email', password: 'Password', checkMail: 'Confirmation link sent. Please check your email.', switchToUp: 'No account? Sign up', switchToIn: 'Already registered? Sign in' },
  sync: { ok: 'Synced', offline: 'Offline – will sync later', local: 'This device only', error: 'Sync failed' },
};

i18n.use(initReactI18next).init({ resources: { de: { translation: de }, en: { translation: en } }, lng: 'de', fallbackLng: 'de', interpolation: { escapeValue: false } });
export default i18n;
