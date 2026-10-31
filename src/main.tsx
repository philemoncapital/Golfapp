import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './styles.css';
import App from './App';
import { startAutoSync } from './lib/sync';
import { startUnlockWatch } from './lib/achievements';
import { isDemo } from './lib/demo';

startUnlockWatch();
startAutoSync();
const render = () => ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>,
);
if (isDemo) void import('./demo/api').then((m) => m.seedDemo()).finally(render);
else render();
