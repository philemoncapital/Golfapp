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

// ---- Phase 6+ strings (kept separate so the original blocks stay readable)
const de2 = {
  nav: { today: 'Home', home: 'Home', drills: 'Übungen', session: 'Session', social: 'Freunde', profile: 'Profil' },
  common: {
    back: 'Zurück', cancel: 'Abbrechen', save: 'Speichern', retry: 'Erneut versuchen', loading: 'Lädt …', offline: 'Offline – zuletzt aktualisiert {{when}}',
    signedOut: 'Freunde und Gruppen brauchen ein Konto. Melde dich im Profil an.', localMode: 'Lokaler Modus: Freunde und Gruppen brauchen eine Supabase-Verbindung (README).',
    error: 'Das hat nicht geklappt: {{msg}}', rateLimited: 'Zu viele Anfragen – bitte kurz warten.', you: 'Du', min: 'Min',
  },
  social: {
    title: 'Freunde & Gruppen', friends: 'Freunde', groups: 'Gruppen', search: 'Name oder genaue E-Mail', searchHint: 'Mindestens 2 Buchstaben. E-Mail nur bei exakter Eingabe.',
    add: 'Anfragen', requested: 'Angefragt', accept: 'Annehmen', decline: 'Ablehnen', remove: 'Entfernen', isFriend: 'Befreundet',
    incoming: 'Anfragen an dich', outgoing: 'Gesendet', noFriends: 'Noch keine Freunde. Such oben nach Namen.', noResults: 'Niemand gefunden.',
    newGroup: 'Neue Gruppe', groupName: 'Gruppenname', create: 'Gruppe erstellen', noGroups: 'Noch in keiner Gruppe. Erstell eine und lade Freunde ein.',
    invitations: 'Einladungen', join: 'Beitreten', members: '{{n}} Mitglieder', confirmRemove: '{{name}} als Freund entfernen?',
  },
  group: {
    leaderboard: 'Rangliste', last30: 'Letzte 30 Tage', notRanked: 'Noch nicht gewertet', eligibility: 'Für eine Wertung: mindestens 3 Ergebnisse aus 2 Übungen dieses Bereichs in 30 Tagen.',
    eligibilityOverall: 'Für die Gesamtwertung: in mindestens 2 Bereichen gewertet.', activityRule: 'Übungsminuten der letzten 30 Tage.',
    titles: 'Aktuelle Titel', noTitles: 'Titel gibt es ab 3 gewerteten Mitgliedern pro Rangliste (täglich neu berechnet).', titlesOff: 'Titel sind in dieser Gruppe ausgeschaltet.',
    feed: 'Aktivität', noFeed: 'Noch keine Aktivität in den letzten 30 Tagen.', members: 'Mitglieder', invited: 'eingeladen', admin: 'Admin', owner: 'Gründer',
    invite: 'Freund einladen', noInvitable: 'Alle deine Freunde sind schon in der Gruppe – oder du hast noch keine.', inviteSent: 'Eingeladen',
    leave: 'Gruppe verlassen', confirmLeave: 'Gruppe wirklich verlassen?', removeMember: 'Entfernen', makeAdmin: 'Zum Admin machen', makeMember: 'Admin entziehen',
    titlesToggle: 'Spaß-Titel in dieser Gruppe', on: 'An', off: 'Aus',
    ev: { session: 'hat eine Session beendet ({{min}} Min, {{n}} Übungen)', personal_best: 'neue Bestleistung: {{drill}}', title: 'hat den Titel „{{title}}“', achievement: 'hat „{{name}}“ freigeschaltet' },
    inYourGroup: 'In deiner Gruppe', best30: '30 Tage', bestAll: 'Bestwert', noDrillResults: 'Noch niemand aus der Gruppe hat diese Übung gespielt.',
    moved: 'Gruppe {{group}}: von Platz {{from}} auf Platz {{to}}', nowRanked: 'Gruppe {{group}}: jetzt Platz {{to}}',
  },
  board: { overall: 'Gesamt', tee: 'Abschlag', approach: 'Annäherung', short: 'Kurzes Spiel', putting: 'Putten', activity: 'Aktivität' },
  titles: {
    tee_leader: 'Der Hammer', tee_last: 'Baumflüsterer', approach_leader: 'Fahnenjäger', approach_last: 'Luftpost',
    short_leader: 'Wedge-Zauberer', short_last: 'Erdarbeiter', putting_leader: 'Eiskalt', putting_last: 'Lochrand-Legende',
    overall_leader: 'Clubmeister', overall_last: 'Ballspender',
  },
  friend: { trainingHcp: 'Trainings-Handicap', realHcp: 'Echtes Handicap', hidden: 'nicht sichtbar', recent: 'Letzte Sessions', pbs: 'Bestleistungen', badges: 'Abzeichen', private: '{{name}} teilt keine Ergebnisse mit dir.', none: 'Noch keine Ergebnisse.' },
  privacy: {
    title: 'Privatsphäre', results: 'Wer sieht meine Ergebnisse?', nobody: 'Niemand', friends: 'Freunde und Gruppen', groups: 'Nur meine Gruppen',
    showHcp: 'Echtes Handicap für Freunde sichtbar', hideLast: 'Meine Letzter-Platz-Titel verbergen', name: 'Anzeigename',
  },
};
const en2: typeof de2 = {
  nav: { today: 'Home', home: 'Home', drills: 'Drills', session: 'Session', social: 'Friends', profile: 'Profile' },
  common: {
    back: 'Back', cancel: 'Cancel', save: 'Save', retry: 'Try again', loading: 'Loading …', offline: 'Offline – last updated {{when}}',
    signedOut: 'Friends and groups need an account. Sign in under Profile.', localMode: 'Local mode: friends and groups need a Supabase connection (README).',
    error: 'That did not work: {{msg}}', rateLimited: 'Too many requests – please wait a moment.', you: 'You', min: 'min',
  },
  social: {
    title: 'Friends & groups', friends: 'Friends', groups: 'Groups', search: 'Name or exact email', searchHint: 'At least 2 letters. Email only as an exact match.',
    add: 'Add', requested: 'Requested', accept: 'Accept', decline: 'Decline', remove: 'Remove', isFriend: 'Friends',
    incoming: 'Requests for you', outgoing: 'Sent', noFriends: 'No friends yet. Search for a name above.', noResults: 'Nobody found.',
    newGroup: 'New group', groupName: 'Group name', create: 'Create group', noGroups: 'Not in a group yet. Create one and invite friends.',
    invitations: 'Invitations', join: 'Join', members: '{{n}} members', confirmRemove: 'Remove {{name}} as a friend?',
  },
  group: {
    leaderboard: 'Leaderboard', last30: 'Last 30 days', notRanked: 'Not ranked yet', eligibility: 'To be ranked: at least 3 results from 2 drills of this category within 30 days.',
    eligibilityOverall: 'To be ranked overall: ranked in at least 2 categories.', activityRule: 'Practice minutes in the last 30 days.',
    titles: 'Current titles', noTitles: 'Titles start with 3 ranked members per board (recomputed daily).', titlesOff: 'Titles are switched off in this group.',
    feed: 'Activity', noFeed: 'No activity in the last 30 days.', members: 'Members', invited: 'invited', admin: 'Admin', owner: 'Founder',
    invite: 'Invite a friend', noInvitable: 'All your friends are already in this group – or you have none yet.', inviteSent: 'Invited',
    leave: 'Leave group', confirmLeave: 'Really leave this group?', removeMember: 'Remove', makeAdmin: 'Make admin', makeMember: 'Remove admin',
    titlesToggle: 'Fun titles in this group', on: 'On', off: 'Off',
    ev: { session: 'finished a session ({{min}} min, {{n}} drills)', personal_best: 'new personal best: {{drill}}', title: 'holds the title “{{title}}”', achievement: 'unlocked “{{name}}”' },
    inYourGroup: 'In your group', best30: '30 days', bestAll: 'Best', noDrillResults: 'Nobody in the group has played this drill yet.',
    moved: 'Group {{group}}: moved from {{from}} to {{to}}', nowRanked: 'Group {{group}}: now {{to}}',
  },
  board: { overall: 'Overall', tee: 'Off the tee', approach: 'Approach', short: 'Short game', putting: 'Putting', activity: 'Activity' },
  titles: {
    tee_leader: 'Big Stick', tee_last: 'Tree Hugger', approach_leader: 'Pin Seeker', approach_last: 'Air Mail',
    short_leader: 'Wedge Wizard', short_last: 'Chili Dipper', putting_leader: 'Ice Veins', putting_last: 'Lip-Out Legend',
    overall_leader: 'Club Champion', overall_last: 'Ball Donor',
  },
  friend: { trainingHcp: 'Training handicap', realHcp: 'Real handicap', hidden: 'hidden', recent: 'Recent sessions', pbs: 'Personal bests', badges: 'Badges', private: '{{name}} does not share results with you.', none: 'No results yet.' },
  privacy: {
    title: 'Privacy', results: 'Who can see my results?', nobody: 'Nobody', friends: 'Friends and groups', groups: 'My groups only',
    showHcp: 'Real handicap visible to friends', hideLast: 'Hide my last-place titles', name: 'Display name',
  },
};

// ---- Phase 7: achievements (names and criteria from PROMPT.md section 8)
const de3 = {
  tier: { bronze: 'Bronze', silver: 'Silber', gold: 'Gold' },
  achv: {
    title: 'Erfolge', medals: 'Medaillen', achievements: 'Achievements', titles: 'Titel-Abzeichen', earned: 'Erreicht am {{date}}', locked: 'Noch gesperrt',
    weeks: '{{n}} Wochen gehalten', holding: 'Aktuell gehalten', drillsDone: 'Geschafft bei: {{list}}', nextTier: 'Nächste Stufe bei {{n}}',
    unlocked: 'Freigeschaltet: {{name}}', tierUp: '{{name}} – {{tier}}', needsHcp: 'Braucht dein echtes Handicap im Profil.', close: 'Schließen', all: 'Alle Erfolge',
    signedOut: 'Erfolge werden auf dem Server geprüft – dafür brauchst du ein Konto.',
  },
  ach: {
    range_rat: { name: 'Rangeratte', crit: 'Abgeschlossene Sessions: 10 / 50 / 150' },
    grinder: { name: 'Dauerbrenner', crit: 'Übungsminuten: 500 / 2.000 / 5.000' },
    regular: { name: 'Stammgast', crit: 'Verschiedene Tage mit Session oder Ergebnis: 10 / 30 / 100' },
    goal_getter: { name: 'Zielstrebig', crit: 'Wochen in Folge mit erreichtem Wochenziel: 2 / 4 / 8' },
    pb_machine: { name: 'Rekordjäger', crit: 'Aufgestellte Bestleistungen: 5 / 20 / 50' },
    round_logger: { name: 'Rundenbuchhalter', crit: 'Eingetragene echte Runden: 5 / 15 / 40' },
    first_tee: { name: 'Erster Abschlag', crit: 'Erste Session abgeschlossen' },
    flawless: { name: 'Makellos', crit: 'Maximale Punktzahl in einer Übung erreicht – je Übung wiederholbar' },
    complete_set: { name: 'Komplettes Set', crit: 'Jede Übung aus dem Heft mindestens einmal gespielt' },
    collector: { name: 'Sammler', crit: 'Jede Übung der Bibliothek gespielt, inkl. freigegebener Annäherungsübungen' },
    all_rounder: { name: 'Allrounder', crit: 'Ergebnisse in allen 4 Bereichen innerhalb einer Woche' },
    on_target: { name: 'Im Soll', crit: 'Das Heft-Ziel deiner eigenen HCP-Stufe in einer Übung erreicht' },
    next_level: { name: 'Nächste Stufe', crit: 'Das Ziel der nächstbesseren Stufe in einer Übung erreicht' },
    breakthrough: { name: 'Durchbruch', crit: 'Ein Bereichs-Trainings-HCP innerhalb von 30 Tagen um ≥ 2,0 verbessert' },
    review_ready: { name: 'Bilanzreif', crit: 'Erste 5-Session-Bilanz freigeschaltet' },
    early_bird: { name: 'Frühaufsteher', crit: 'Session vor 08:00 Uhr Ortszeit gestartet' },
    team_player: { name: 'Teamplayer', crit: 'Erste angenommene Freundschaft' },
    captain: { name: 'Kapitän', crit: 'Eine Gruppe mit mindestens 3 Mitgliedern gegründet' },
    dynasty: { name: 'Dynastie', crit: 'Einen Spitzen-Titel 4 Wochen in Folge gehalten' },
    title_tee_leader: { name: 'Der Hammer', crit: 'Platz 1 der Abschlag-Rangliste einer Gruppe' },
    title_tee_last: { name: 'Baumflüsterer', crit: 'Letzter Platz der Abschlag-Rangliste einer Gruppe' },
    title_approach_leader: { name: 'Fahnenjäger', crit: 'Platz 1 der Annäherungs-Rangliste einer Gruppe' },
    title_approach_last: { name: 'Luftpost', crit: 'Letzter Platz der Annäherungs-Rangliste einer Gruppe' },
    title_short_leader: { name: 'Wedge-Zauberer', crit: 'Platz 1 der Kurzes-Spiel-Rangliste einer Gruppe' },
    title_short_last: { name: 'Erdarbeiter', crit: 'Letzter Platz der Kurzes-Spiel-Rangliste einer Gruppe' },
    title_putting_leader: { name: 'Eiskalt', crit: 'Platz 1 der Putt-Rangliste einer Gruppe' },
    title_putting_last: { name: 'Lochrand-Legende', crit: 'Letzter Platz der Putt-Rangliste einer Gruppe' },
    title_overall_leader: { name: 'Clubmeister', crit: 'Platz 1 der Gesamt-Rangliste einer Gruppe' },
    title_overall_last: { name: 'Ballspender', crit: 'Letzter Platz der Gesamt-Rangliste einer Gruppe' },
  },
};
// ---- Home screen (9.0)
const de4 = {
  home: {
    noHcp: 'Noch kein echtes Handicap eingetragen.', overallNeeds: 'Gesamtwert ab 2 Bereichen mit genug Daten.', gap: 'Abstand zum echten Handicap',
    sessions: 'Letzte Sessions', noSessions: 'Noch keine abgeschlossene Session.', buildFirst: 'Erste Session zusammenstellen',
    results_one: '{{count}} Ergebnis', results_other: '{{count}} Ergebnisse', noResultsInSession: 'Keine Ergebnisse gespeichert',
    achievements: 'Zuletzt erreicht', noAchievements: 'Noch keine Erfolge – die erste Session bringt „Erster Abschlag“.',
    friend: 'Neu bei Freunden', noFriendSession: 'Noch keine Session von Freunden zu sehen.', addFriends: 'Freunde hinzufügen',
    groups: 'Meine Platzierungen', noGroups: 'Noch in keiner Gruppe.', social: 'Freunde & Gruppen',
    needsAccount: 'Erfolge, Freunde und Platzierungen brauchen ein Konto.', sessionMissing: 'Session nicht gefunden.', rejected: 'vom Server abgelehnt',
  },
};
const en4: typeof de4 = {
  home: {
    noHcp: 'No real handicap entered yet.', overallNeeds: 'Overall value from 2 categories with enough data.', gap: 'Gap to real handicap',
    sessions: 'Recent sessions', noSessions: 'No completed session yet.', buildFirst: 'Build your first session',
    results_one: '{{count}} result', results_other: '{{count}} results', noResultsInSession: 'No results saved',
    achievements: 'Recently earned', noAchievements: 'No achievements yet – your first session earns “First Tee”.',
    friend: 'New from friends', noFriendSession: 'No friend sessions to show yet.', addFriends: 'Add friends',
    groups: 'My placements', noGroups: 'Not in a group yet.', social: 'Friends & groups',
    needsAccount: 'Achievements, friends and placements need an account.', sessionMissing: 'Session not found.', rejected: 'rejected by the server',
  },
};
const en3: typeof de3 = {
  tier: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' },
  achv: {
    title: 'Achievements', medals: 'Medals', achievements: 'Achievements', titles: 'Title badges', earned: 'Earned on {{date}}', locked: 'Locked',
    weeks: 'Held for {{n}} weeks', holding: 'Currently held', drillsDone: 'Done on: {{list}}', nextTier: 'Next tier at {{n}}',
    unlocked: 'Unlocked: {{name}}', tierUp: '{{name}} – {{tier}}', needsHcp: 'Needs your real handicap in Profile.', close: 'Close', all: 'All achievements',
    signedOut: 'Achievements are checked on the server – you need an account for them.',
  },
  ach: {
    range_rat: { name: 'Range Rat', crit: 'Completed sessions: 10 / 50 / 150' },
    grinder: { name: 'Grinder', crit: 'Practice minutes: 500 / 2,000 / 5,000' },
    regular: { name: 'Regular', crit: 'Distinct days with a session or result: 10 / 30 / 100' },
    goal_getter: { name: 'Goal Getter', crit: 'Weeks in a row with the weekly goal met: 2 / 4 / 8' },
    pb_machine: { name: 'PB Machine', crit: 'Personal bests set: 5 / 20 / 50' },
    round_logger: { name: 'Round Logger', crit: 'Real rounds logged: 5 / 15 / 40' },
    first_tee: { name: 'First Tee', crit: 'First completed session' },
    flawless: { name: 'Flawless', crit: 'Maximum score reached on a drill – repeatable per drill' },
    complete_set: { name: 'Complete Set', crit: 'Every booklet drill played at least once' },
    collector: { name: 'Collector', crit: 'Every drill in the library played, including the approved approach drills' },
    all_rounder: { name: 'All-Rounder', crit: 'Results in all 4 categories within one week' },
    on_target: { name: 'On Target', crit: 'Reached the booklet target of your own HCP band on a drill' },
    next_level: { name: 'Next Level', crit: 'Reached the target of the next better band on a drill' },
    breakthrough: { name: 'Breakthrough', crit: 'A category training HCP improved by ≥ 2.0 within 30 days' },
    review_ready: { name: 'Review Ready', crit: 'First 5-session review unlocked' },
    early_bird: { name: 'Early Bird', crit: 'Session started before 08:00 local time' },
    team_player: { name: 'Team Player', crit: 'First accepted friend' },
    captain: { name: 'Captain', crit: 'Created a group with at least 3 members' },
    dynasty: { name: 'Dynasty', crit: 'Held a leader title for 4 weeks in a row' },
    title_tee_leader: { name: 'Big Stick', crit: 'First place on a group’s off-the-tee board' },
    title_tee_last: { name: 'Tree Hugger', crit: 'Last place on a group’s off-the-tee board' },
    title_approach_leader: { name: 'Pin Seeker', crit: 'First place on a group’s approach board' },
    title_approach_last: { name: 'Air Mail', crit: 'Last place on a group’s approach board' },
    title_short_leader: { name: 'Wedge Wizard', crit: 'First place on a group’s short-game board' },
    title_short_last: { name: 'Chili Dipper', crit: 'Last place on a group’s short-game board' },
    title_putting_leader: { name: 'Ice Veins', crit: 'First place on a group’s putting board' },
    title_putting_last: { name: 'Lip-Out Legend', crit: 'Last place on a group’s putting board' },
    title_overall_leader: { name: 'Club Champion', crit: 'First place on a group’s overall board' },
    title_overall_last: { name: 'Ball Donor', crit: 'Last place on a group’s overall board' },
  },
};

i18n.use(initReactI18next).init({ resources: { de: { translation: { ...de, ...de2, ...de3, ...de4 } }, en: { translation: { ...en, ...en2, ...en3, ...en4 } } }, lng: 'de', fallbackLng: 'de', interpolation: { escapeValue: false } });
export default i18n;
