import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { db, getSettings, type Settings, type Visibility } from '../lib/db';
import { syncNow } from '../lib/sync';
import { isDemo, setDemo } from '../lib/demo';
import { supabase } from '../lib/supabase';
import { drillById } from '../lib/drills';
import { resultHcp } from '../engine/handicap';
import type { User } from '@supabase/supabase-js';

const ACCENTS = ['#3DFFA2', '#FF6B4A', '#FFD23F', '#2FD6F5'];

export default function Profile() {
  const { t } = useTranslation();
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { void getSettings().then(setS); }, []);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => setUser(sess?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!s) return null;

  const save = async () => {
    // Saved locally first (works offline); the sync pushes it to the server and records the HCP history.
    await db.settings.put({ ...s, dirty: true });
    if (user) void syncNow();
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };
  const exportCsv = async () => {
    const rows = await db.results.orderBy('created_at').toArray();
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['date', 'drill', 'category', 'input', 'drill_hcp', 'notes'].join(',')];
    for (const r of rows) {
      const d = drillById(r.drill_id);
      lines.push([r.created_at, d?.title, d?.category, JSON.stringify(r.input), d ? resultHcp(d, r.input) : '', r.notes].map(esc).join(','));
    }
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `pulse-results-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <h1>{t('profile.title')}</h1>
      <section className="card stack">
        <label className="stack"><span className="label">{t('profile.realHcp')}</span>
          <input className="field num" type="number" inputMode="decimal" step={0.1} min={-10} max={54} value={s.real_hcp ?? ''} onChange={(e) => setS({ ...s, real_hcp: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        <label className="stack"><span className="label">{t('profile.goal')}</span>
          <input className="field num" type="number" inputMode="numeric" step={10} min={0} max={3000} value={s.weekly_goal_min} onChange={(e) => setS({ ...s, weekly_goal_min: Number(e.target.value) })} /></label>
        <div className="stack"><span className="label">{t('profile.language')}</span>
          <div className="row">{(['de', 'en'] as const).map((l) => <button key={l} className="chip" aria-pressed={s.language === l} onClick={() => setS({ ...s, language: l })}>{l === 'de' ? 'Deutsch' : 'English'}</button>)}</div></div>
        <div className="stack"><span className="label">{t('profile.accent')}</span>
          <div className="row">{ACCENTS.map((c) => <button key={c} aria-label={c} aria-pressed={s.accent === c} onClick={() => setS({ ...s, accent: c })} style={{ width: 36, height: 36, borderRadius: 18, background: c, border: s.accent === c ? '3px solid var(--text)' : '1px solid var(--border)', cursor: 'pointer' }} />)}</div></div>
        <button className="btn primary block" onClick={save}>{saved ? `✓ ${t('profile.saved')}` : t('profile.save')}</button>
      </section>
      {supabase && user && (
        <section className="card stack" aria-label={t('privacy.title')}>
          <h2>{t('privacy.title')}</h2>
          <label className="stack"><span className="label">{t('privacy.name')}</span>
            <input className="field" value={s.display_name ?? ''} minLength={2} maxLength={40} onChange={(e) => setS({ ...s, display_name: e.target.value })} autoComplete="nickname" /></label>
          <div className="stack"><span className="label">{t('privacy.results')}</span>
            <div className="row wrap">{(['friends', 'groups', 'nobody'] as Visibility[]).map((v) => <button key={v} className="chip" aria-pressed={s.results_visibility === v} onClick={() => setS({ ...s, results_visibility: v })}>{t(`privacy.${v}`)}</button>)}</div></div>
          <label className="row between"><span className="small">{t('privacy.showHcp')}</span>
            <input type="checkbox" checked={!!s.show_real_hcp} onChange={(e) => setS({ ...s, show_real_hcp: e.target.checked })} style={{ width: 22, height: 22 }} /></label>
          <label className="row between"><span className="small">{t('privacy.hideLast')}</span>
            <input type="checkbox" checked={!!s.hide_last_place_titles} onChange={(e) => setS({ ...s, hide_last_place_titles: e.target.checked })} style={{ width: 22, height: 22 }} /></label>
          <button className="btn block" onClick={save}>{saved ? `✓ ${t('profile.saved')}` : t('profile.save')}</button>
        </section>
      )}
      {supabase ? (user ? (
        <section className="card row between"><span className="small text-2">{user.email}</span><button className="btn" onClick={() => supabase!.auth.signOut()}>{t('profile.signOut')}</button></section>
      ) : <Auth />) : <p className="small muted">{t('profile.local')}</p>}
      <Link to="/achievements" className="btn block">{t('achv.all')}</Link>
      {isDemo ? <button className="btn block" onClick={() => setDemo(false)}>{t('demo.exit')}</button>
        : <button className="btn block" onClick={() => setDemo(true)}>{t('demo.enter')}</button>}
      {!isDemo && <span className="small muted">{t('demo.hint')}</span>}
      <button className="btn block" onClick={exportCsv}>{t('profile.export')}</button>
    </>
  );
}

function Auth() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const submit = async () => {
    setMsg(null);
    if (!supabase) return;
    const res = mode === 'up'
      ? await supabase.auth.signUp({ email, password: pw, options: { data: { display_name: name, language: i18n.language }, emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password: pw });
    if (res.error) setMsg(res.error.message); else if (mode === 'up') setMsg(t('auth.checkMail'));
  };
  return (
    <section className="card stack">
      <h2>{mode === 'in' ? t('auth.signIn') : t('auth.signUp')}</h2>
      {mode === 'up' && <input className="field" placeholder={t('auth.name')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />}
      <input className="field" type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input className="field" type="password" placeholder={t('auth.password')} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} minLength={8} />
      {msg && <span className="small text-2" role="status">{msg}</span>}
      <button className="btn primary block" onClick={submit}>{mode === 'in' ? t('auth.signIn') : t('auth.signUp')}</button>
      <button className="btn" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? t('auth.switchToUp') : t('auth.switchToIn')}</button>
    </section>
  );
}
