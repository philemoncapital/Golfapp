import { useEffect } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, getSettings } from './lib/db';
import { useLive } from './lib/useLive';
import Today from './screens/Today';
import Social from './screens/Social';
import Group from './screens/Group';
import FriendProfile from './screens/FriendProfile';
import Library from './screens/Library';
import DrillDetail from './screens/DrillDetail';
import SessionBuilder from './screens/SessionBuilder';
import Live from './screens/Live';
import Profile from './screens/Profile';
import Achievements from './screens/Achievements';
import { UnlockToasts } from './components/UnlockToasts';

const I = {
  today: <path d="M4 12h3l2-6 4 12 2-6h5" />,
  drills: <path d="M5 6h14M5 12h14M5 18h9" />,
  social: <><circle cx="9" cy="9" r="3" /><circle cx="16.5" cy="10.5" r="2.5" /><path d="M3.5 19c.9-3 3-4.6 5.5-4.6s4.6 1.6 5.5 4.6M14.5 15.2c.6-.3 1.3-.4 2-.4 2 0 3.6 1.3 4.3 3.7" /></>,
  session: <><circle cx="12" cy="13" r="7" /><path d="M12 9v4l2.5 2M10 3h4" /></>,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.4-3.6 4-5.5 7-5.5s5.6 1.9 7 5.5" /></>,
};

export default function App() {
  const { t, i18n } = useTranslation();
  const settings = useLive(getSettings, [], null);
  const plan = useLive(() => db.sessions.where('status').equals('planned').first(), [], undefined);
  useEffect(() => {
    if (!settings) return;
    if (i18n.language !== settings.language) void i18n.changeLanguage(settings.language);
    document.documentElement.lang = settings.language;
    document.documentElement.style.setProperty('--accent', settings.accent);
    const hex = settings.accent.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.12)`);
  }, [settings, i18n]);
  const n = plan?.drill_ids.length ?? 0;
  const { pathname } = useLocation();
  const socialActive = /^\/(groups|friends)\//.test(pathname);

  return (
    <div className="app">
      <main className="main">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/drills" element={<Library />} />
          <Route path="/drills/:id" element={<DrillDetail />} />
          <Route path="/session" element={<SessionBuilder />} />
          <Route path="/live" element={<Live />} />
          <Route path="/social" element={<Social />} />
          <Route path="/groups/:id" element={<Group />} />
          <Route path="/friends/:id" element={<FriendProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
        </Routes>
      </main>
      <UnlockToasts />
      <nav className="nav" aria-label="Main">
        <ul>
          {(['today', 'drills', 'session', 'social', 'profile'] as const).map((k) => (
            <li key={k}>
              <NavLink to={k === 'today' ? '/' : `/${k}`} end={k === 'today'} className={({ isActive }) => (isActive || (k === 'social' && socialActive) ? 'active' : undefined)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[k]}</svg>
                {k === 'session' && n > 0 && <span className="badge num">{n}</span>}
                {t(`nav.${k}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
