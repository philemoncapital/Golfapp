import { DRILLS } from '../lib/drills';
import { Pictogram } from '../components/Pictogram';

/** Development-only contact sheet of all pictograms (large + card size) for design review. */
export default function DevPictograms() {
  return (
    <div className="stack">
      <h1>Pictograms</h1>
      {DRILLS.map((d) => (
        <section key={d.id} className="card stack" data-drill={d.id}>
          <b>{d.title} <span className="muted small">{d.id}</span></b>
          <Pictogram drill={d} />
          <div style={{ width: 150 }}><Pictogram drill={d} size="sm" /></div>
        </section>
      ))}
    </div>
  );
}
