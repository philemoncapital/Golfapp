import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Drill, ResultInput as RI, RadiusBall } from '../engine/types';

/** Generates the input UI from the drill's scoring type. Calls onChange with a complete ResultInput (or null). */
export function ResultInput({ drill, onChange, elapsedMin }: { drill: Drill; onChange: (r: RI | null) => void; elapsedMin: number }) {
  const s = drill.scoring;
  switch (s.type) {
    case 'points_per_ball': return <PerBall drill={drill} onChange={onChange} />;
    case 'radius_by_band': return <Radius total={s.balls ?? 20} onChange={onChange} />;
    case 'series_triplet': return <Triplet onChange={onChange} />;
    case 'time_lower_better': return <Timed elapsedMin={elapsedMin} limit={drill.duration_min} onChange={onChange} />;
    default: return <Stepper onChange={onChange} />;
  }
}

function Stepper({ onChange, initial = 0, label }: { onChange: (r: RI | null) => void; initial?: number; label?: string }) {
  const { t } = useTranslation();
  const [v, setV] = useState(initial);
  const set = (n: number) => { const x = Math.max(0, n); setV(x); onChange({ kind: 'value', value: x }); };
  return (
    <div className="stack">
      <span className="label">{label ?? t('live.result')}</span>
      <div className="stepper">
        <button className="btn big" onClick={() => set(v - 1)} aria-label="−1">−</button>
        <output aria-live="polite">{v}</output>
        <button className="btn big primary" onClick={() => set(v + 1)} aria-label="+1">+</button>
      </div>
    </div>
  );
}

function PerBall({ drill, onChange }: { drill: Drill; onChange: (r: RI | null) => void }) {
  const { t } = useTranslation();
  const [taps, setTaps] = useState<number[]>([]);
  const putts = !!drill.scoring.result_is_putts;
  const update = (n: number[]) => { setTaps(n); onChange(n.length ? { kind: 'value', value: putts ? n.length : n.reduce((a, b) => a + b, 0) } : null); };
  const buttons = drill.scoring.buttons ?? [1, 0];
  return (
    <div className="stack">
      <div className="row between">
        <span className="label">{putts ? 'Putts' : t('live.result')}</span>
        <span className="num" style={{ fontSize: 28, fontWeight: 500 }}>{putts ? taps.length : taps.reduce((a, b) => a + b, 0)}</span>
      </div>
      <div className={buttons.length >= 4 ? 'grid4' : 'grid3'}>
        {buttons.map((b, i) => (
          <button key={b} className={`btn big ${i === 0 ? 'primary' : ''}`} onClick={() => update([...taps, b])}>
            {b > 0 ? `+${b}` : b}
          </button>
        ))}
      </div>
      <div className="row between small muted">
        <span className="num">{taps.length} × {t('live.ball')}{putts ? ` · ${taps.reduce((a, b) => a + b, 0)} P` : ''}</span>
        <button className="btn" onClick={() => update(taps.slice(0, -1))} disabled={!taps.length}>{t('live.undo')}</button>
      </div>
    </div>
  );
}

const BUCKETS: { key: string; ball: RadiusBall }[] = [
  { key: 'holed', ball: { dist_m: 0, on_green: true } },
  { key: '<1.5', ball: { dist_m: 1.4, on_green: true } }, { key: '<2', ball: { dist_m: 1.9, on_green: true } },
  { key: '<3', ball: { dist_m: 2.9, on_green: true } }, { key: '<4', ball: { dist_m: 3.9, on_green: true } },
  { key: '<5', ball: { dist_m: 4.9, on_green: true } }, { key: '<6', ball: { dist_m: 5.9, on_green: true } },
  { key: '<7', ball: { dist_m: 6.9, on_green: true } }, { key: 'green', ball: { dist_m: 8, on_green: true } },
  { key: 'missed', ball: { dist_m: null, on_green: false } },
];
function Radius({ total, onChange }: { total: number; onChange: (r: RI | null) => void }) {
  const { t } = useTranslation();
  const [balls, setBalls] = useState<RadiusBall[]>([]);
  const update = (b: RadiusBall[]) => { setBalls(b); onChange(b.length ? { kind: 'radius', balls: b } : null); };
  const name = (k: string) => (k === 'holed' ? t('live.holed') : k === 'green' ? t('live.green') : k === 'missed' ? t('live.missed') : `${k} m`);
  return (
    <div className="stack">
      <div className="row between"><span className="label">{t('live.ball')} {Math.min(balls.length + 1, total)} / {total}</span>
        <button className="btn" onClick={() => update(balls.slice(0, -1))} disabled={!balls.length}>{t('live.undo')}</button></div>
      <div className="grid4">
        {BUCKETS.map((b) => <button key={b.key} className="btn" style={{ minHeight: 56 }} disabled={balls.length >= total} onClick={() => update([...balls, b.ball])}>{name(b.key)}</button>)}
      </div>
    </div>
  );
}

function Triplet({ onChange }: { onChange: (r: RI | null) => void }) {
  const { t } = useTranslation();
  const [a, setA] = useState<[number, number, number]>([0, 0, 0]);
  const set = (i: number, v: number) => { const n = [...a] as [number, number, number]; n[i] = Math.max(0, v); setA(n); onChange({ kind: 'triplet', achieved: n }); };
  return (
    <div className="stack">
      {[0, 1, 2].map((i) => (
        <div key={i} className="row between">
          <span className="label">{t('live.pos')} {i + 1} · {[90, 180, 270][i]} cm</span>
          <span className="row"><button className="btn" onClick={() => set(i, a[i] - 1)}>−</button><b className="num" style={{ minWidth: 32, textAlign: 'center', fontSize: 22 }}>{a[i]}</b><button className="btn primary" onClick={() => set(i, a[i] + 1)}>+</button></span>
        </div>
      ))}
    </div>
  );
}

function Timed({ elapsedMin, limit, onChange }: { elapsedMin: number; limit: number; onChange: (r: RI | null) => void }) {
  const { t } = useTranslation();
  const [done, setDone] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  return (
    <div className="stack">
      <button className="btn big primary" onClick={() => { const m = Math.max(1, Math.round(elapsedMin * 10) / 10); setDone(m); onChange({ kind: 'value', value: m }); }}>
        {done ? `${done} ${t('live.minutes')}` : `8 / 8 ✓`}
      </button>
      <span className="label">{t('live.notFinished')}</span>
      <div className="row">
        <button className="btn" onClick={() => { const h = Math.max(0, hits - 1); setHits(h); setDone(null); onChange({ kind: 'time_fallback', hits: h, limit_min: limit, required_hits: 8 }); }}>−</button>
        <b className="num" style={{ fontSize: 22, minWidth: 32, textAlign: 'center' }}>{hits}</b>
        <button className="btn" onClick={() => { const h = Math.min(7, hits + 1); setHits(h); setDone(null); onChange({ kind: 'time_fallback', hits: h, limit_min: limit, required_hits: 8 }); }}>+</button>
      </div>
    </div>
  );
}
