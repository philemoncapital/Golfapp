/*
 * Start-up guard (external file because the CSP forbids inline scripts).
 * If the app has not rendered after 8 s – typically a stale offline cache pointing at files of an old deployment –
 * unregister the service worker, delete its caches and reload once. A flag prevents reload loops.
 */
(function () {
  var KEY = 'pulse-boot-recovered';
  window.addEventListener('pulse:started', function () { try { sessionStorage.removeItem(KEY); } catch (e) {} });
  setTimeout(function () {
    var root = document.getElementById('root');
    if (root && root.childElementCount > 0) return;
    try { if (sessionStorage.getItem(KEY)) return; sessionStorage.setItem(KEY, '1'); } catch (e) { return; }
    var jobs = [];
    if ('serviceWorker' in navigator) jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
    if (window.caches) jobs.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
    Promise.all(jobs).catch(function () {}).then(function () { location.reload(); });
  }, 8000);
})();
