import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './styles.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { startAutoSync } from './lib/sync';
import { startUnlockWatch } from './lib/achievements';
import { isDemo } from './lib/demo';

startUnlockWatch();
startAutoSync();
const render = () => ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary></React.StrictMode>,
);
const start = () => { render(); window.dispatchEvent(new Event('pulse:started')); };
// Demo data is seeded before the first render; if seeding fails (e.g. storage blocked) the app still starts.
if (isDemo) void import('./demo/api').then((m) => m.seedDemo()).catch((e) => console.error('demo seed failed', e)).finally(start);
else start();
