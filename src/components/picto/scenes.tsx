/**
 * One illustrated scene per drill, composed from each drill's setup text (seed data, German booklet).
 * Not traced from the booklet artwork. Canvas 320×200, forward = up. Revised after design review (Nov 2026).
 * Colour roles: accent = active target / path, COL.neutral = other targets, COL.marker = tees and sticks, COL.weak = fail.
 */
import type { ReactNode } from 'react';
import {
  Ball, BallCount, Bunker, CcwArrow, ChipPutt, Club, COL, Corridor, Count, Cross, Curve, Dim, Flag, Flight, Green, Hole,
  LoopArrow, Peg, Pts, Range, Ring, Roll, Rough, Slope, Station, Stick, Tag, TeeBall, Towel, Zone, type Ctx,
} from './kit';

type Scene = (id: (k: string) => string, ctx: Ctx) => ReactNode;
const pol = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
/** Points along the line from (x0,y0) towards (x1,y1) at fractions t. */
const along = (x0: number, y0: number, x1: number, y1: number, t: number): [number, number] => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];

export const SCENES: Record<string, Scene> = {
  // ---------------- Off the tee ----------------
  'fade-and-draw': (id, c) => <>
    <Range id={id} />
    <line x1={160} y1={186} x2={160} y2={30} stroke="rgba(242,243,245,0.18)" strokeDasharray="3 5" />
    <Corridor x={95} y={14} w={130} h={40} label="30 m" ctx={c} />
    <Curve d="M160,156 C112,128 118,72 160,36" id={id} />
    <Curve d="M160,156 C208,128 202,72 160,36" id={id} muted />
    <Stick x1={160} y1={188} x2={160} y2={180} color={COL.marker} /><Stick x1={160} y1={166} x2={160} y2={158} color={COL.marker} />
    <TeeBall x={160} y={173} ctx={c} />
    <Stick x1={160} y1={112} x2={160} y2={96} color={COL.marker} />
    <Tag x={100} y={122} ctx={c} accent>Fade ×5</Tag><Tag x={220} y={122} ctx={c}>Draw ×5</Tag>
    <Tag x={160} y={86} ctx={c}>Stick 10 m</Tag>
  </>,
  'short-aims': (id, c) => {
    const st: [number, number, number][] = [[160, 150, 100], [128, 110, 125], [192, 72, 150], [160, 34, 175]];
    return <>
      <Range id={id} />
      {st.slice(0, 3).map(([x, y], i) => <path key={i} d={`M${x},${y - 18} L${st[i + 1][0]},${st[i + 1][1] + 18}`} stroke="rgba(242,243,245,0.3)" strokeDasharray="2 4" />)}
      {st.map(([x, y, m], i) => (
        <g key={m}><Ring x={x} y={y} r={16} strong={i === (c.active ?? 0)} /><Station x={x} y={y} n={i + 1} ctx={c} />
          <Tag x={x + (i % 2 ? -42 : 44)} y={y - 4} ctx={c}>{`${m} m`}</Tag><BallCount x={x + (i % 2 ? -50 : 28)} y={y + 10} n={3} filled={i === 0 ? 3 : 0} /></g>
      ))}
      <TeeBall x={160} y={188} ctx={c} />
      <Flight from={[160, 184]} to={[157, 156]} bend={-10} id={id} />
      <Dim x1={160} x2={176} y={174} label="10 m" ctx={c} />
      <Tag x={42} y={186} ctx={c}>15 Min</Tag><Tag x={270} y={186} ctx={c}>3 Treffer → weiter</Tag>
    </>;
  },
  '14-fairways': (id, c) => <>
    <Range id={id} />
    <Corridor x={100} y={18} w={120} h={90} label="30 m" ctx={c} />
    <TeeBall x={160} y={182} ctx={c} />
    <Flight from={[160, 178]} to={[150, 56]} bend={-18} roll={[146, 36]} id={id} />
    <Flight from={[160, 178]} to={[174, 134]} bend={12} roll={[176, 126]} muted id={id} />
    <Tag x={124} y={112} ctx={c} accent>Driver</Tag><Tag x={210} y={146} ctx={c}>Eisen 7</Tag>
    {['E7', 'D', 'E7', 'D'].map((k, i) => (
      <g key={i}><rect x={14 + i * 22} y={172} width="19" height="16" rx="4" fill={k === 'D' ? 'rgba(155,227,195,0.25)' : 'rgba(242,243,245,0.12)'} stroke={k === 'D' ? 'var(--accent)' : 'rgba(242,243,245,0.3)'} />
        {!c.sm && <text x={23.5 + i * 22} y={183.5} fontSize="8.5" fontWeight="700" textAnchor="middle" fill={k === 'D' ? 'var(--accent)' : 'var(--text-2)'}>{k}</text>}</g>
    ))}
    <Tag x={60} y={160} ctx={c}>abwechselnd 14 + 14</Tag>
  </>,
  'nine-drives': (id, c) => <>
    <Range id={id} />
    <path d="M150,196 C150,150 120,120 128,80 C134,48 180,30 214,18" fill="none" stroke="rgba(242,243,245,0.14)" strokeWidth="44" strokeLinecap="round" />
    <Corridor x={100} y={16} w={120} h={66} label="30 m" ctx={c} />
    <TeeBall x={160} y={182} ctx={c} />
    <Flight from={[160, 178]} to={[166, 44]} bend={16} roll={[168, 30]} id={id} />
    <Dim x1={262} x2={262} y={182} y2={86} vertical label="≥ 150 m" ctx={c} />
    {Array.from({ length: 9 }, (_, i) => (
      <g key={i}><rect x={10 + (i % 3) * 20} y={128 + Math.floor(i / 3) * 20} width="16" height="16" rx="4" fill={i === 0 ? 'rgba(155,227,195,0.25)' : 'rgba(242,243,245,0.1)'} stroke={i === 0 ? 'var(--accent)' : 'rgba(242,243,245,0.28)'} />
        {!c.sm && <text x={18 + (i % 3) * 20} y={139.5 + Math.floor(i / 3) * 20} fontSize="9" fontWeight="700" textAnchor="middle" fill={i === 0 ? 'var(--accent)' : 'var(--text-2)'}>{i + 1}</text>}</g>
    ))}
    <Tag x={40} y={114} ctx={c}>9 Löcher</Tag>
  </>,

  // ---------------- Approach ----------------
  'hit-three-greens': (id, c) => <>
    <Range id={id} />
    <Green id={id} cx={88} cy={128} rx={28} ry={16} /><Ring x={88} y={128} r={26} /><Flag x={88} y={130} h={24} />
    <Green id={id} cx={232} cy={96} rx={30} ry={17} /><Flag x={232} y={98} h={24} color={COL.neutral} />
    <Green id={id} cx={140} cy={40} rx={36} ry={19} /><Flag x={140} y={42} h={24} color={COL.neutral} />
    <TeeBall x={160} y={186} ctx={c} />
    <Flight from={[160, 182]} to={[92, 128]} bend={-6} id={id} />
    <Flight from={[160, 182]} to={[228, 98]} bend={10} muted id={id} />
    <Flight from={[160, 182]} to={[144, 42]} bend={-10} muted id={id} />
    <Station x={58} y={110} n={1} ctx={c} r={7} /><Station x={268} y={78} n={2} ctx={c} r={7} /><Station x={186} y={26} n={3} ctx={c} r={7} />
    <Tag x={60} y={162} ctx={c}>100 m · 2 P</Tag><Tag x={256} y={132} ctx={c}>130 m · 3 P</Tag><Tag x={238} y={34} ctx={c}>160 m · 4 P</Tag>
    <Tag x={262} y={186} ctx={c}>9 Bälle · abwechselnd</Tag>
  </>,

  // ---------------- Short game ----------------
  'five-different-clubs': (id, c) => {
    const pts = [0.3, 0.48, 0.66, 0.84].map((t) => along(160, 46, 70, 196, t));
    return <>
      <Rough />
      <Green id={id} cx={172} cy={52} rx={104} ry={36} />
      <Ring x={160} y={44} r={30} /><Ring x={160} y={44} r={18} strong />
      <Flag x={160} y={46} h={26} />
      {pts.map(([x, y], i) => <g key={i}><Station x={x} y={y} n={i + 1} ctx={c} /><Tag x={x + 34} y={y + 4} ctx={c}>{`${[10, 15, 20, 25][i]} m`}</Tag></g>)}
      <Flight from={[pts[0][0] + 4, pts[0][1] - 6]} to={[156, 52]} bend={-8} roll={[159, 47]} id={id} />
      {[0, 1, 2, 3, 4].map((k) => <Club key={k} x={40} y={128 + k * 9} len={36} angle={-8 + k * 4} />)}
      <Tag x={42} y={182} ctx={c}>5 Schläger</Tag><Tag x={238} y={98} ctx={c}>Radius je HCP</Tag>
    </>;
  },
  'attack-the-flag': (id, c) => {
    const pts = [0.42, 0.62, 0.84].map((t) => along(168, 40, 120, 210, t));
    return <>
      <Rough />
      <Green id={id} cx={168} cy={40} rx={92} ry={28} />
      <Bunker id={id} cx={156} cy={92} rx={60} ry={13} rot={-4} />
      <Ring x={168} y={36} r={18} strong /><Flag x={168} y={38} h={24} />
      {pts.map(([x, y], i) => <g key={i}><Station x={x} y={y} n={i + 1} ctx={c} /><Tag x={x + 36} y={y + 4} ctx={c}>{`${[20, 30, 40][i]} m`}</Tag></g>)}
      <Flight from={[pts[1][0] + 2, pts[1][1] - 8]} to={[166, 42]} bend={-34} id={id} />
      <LoopArrow from={[pts[2][0] - 10, pts[2][1]]} to={[pts[0][0] - 10, pts[0][1] + 2]} bend={36} id={id} />
      <Tag x={60} y={62} ctx={c} leader={[110, 92]}>hoch anspielen</Tag>
      <Tag x={246} y={20} ctx={c}>HCP-Radius</Tag><Tag x={262} y={186} ctx={c}>9 Bälle · 20→40→20</Tag>
    </>;
  },
  'four-stations': (id, c) => {
    const hole: [number, number] = [244, 54];
    const st = [0.52, 0.66, 0.8, 0.94].map((t) => along(hole[0], hole[1], 20, 186, t));
    return <>
      <Rough />
      <Green id={id} cx={204} cy={74} rx={98} ry={56} />
      {[-18, 18].map((a) => { const [x, y] = pol(hole[0], hole[1], 200, 210 + a); return <line key={a} x1={x} y1={y} x2={hole[0]} y2={hole[1]} stroke="rgba(242,243,245,0.12)" strokeDasharray="3 5" />; })}
      <line x1={20} y1={186} x2={hole[0]} y2={hole[1]} stroke="rgba(242,243,245,0.3)" strokeDasharray="3 5" />
      <Ring x={hole[0]} y={hole[1]} r={32} /><Ring x={hole[0]} y={hole[1]} r={14} strong />
      <Flag x={hole[0]} y={hole[1] + 2} h={24} />
      {st.map(([x, y], i) => <Station key={i} x={x} y={y} n={i + 1} ctx={c} />)}
      <Tag x={st[0][0] + 6} y={st[0][1] - 18} ctx={c}>Vorgrün</Tag><Tag x={44} y={140} ctx={c}>je 5 m</Tag>
      <Pts x={282} y={30} v="3" ctx={c} at={[hole[0] + 4, hole[1] - 4]} /><Pts x={286} y={60} v="2" ctx={c} at={[hole[0] + 14, hole[1] + 2]} /><Pts x={292} y={92} v="1" ctx={c} at={[hole[0] + 26, hole[1] + 18]} />
      <Tag x={262} y={186} ctx={c}>3 Durchgänge</Tag>
    </>;
  },
  'sandy-par': (id, c) => <>
    <Rough />
    <Green id={id} cx={164} cy={64} rx={126} ry={50} />
    <Bunker id={id} cx={150} cy={150} rx={78} ry={24} />
    {[[70, 62], [120, 34], [186, 50], [244, 40], [222, 92]].map(([x, y], i) => <Flag key={i} x={x} y={y} h={18} color={i === 2 ? 'var(--accent)' : COL.neutral} />)}
    <Ball x={150} y={154} />
    <ChipPutt from={[150, 150]} hole={[186, 50]} bend={-16} id={id} />
    <BallCount x={104} y={170} n={5} filled={1} />
    <Tag x={60} y={186} ctx={c}>5 Bunkerschläge</Tag><Tag x={262} y={186} ctx={c}>5 Löcher · 3–10 m</Tag>
  </>,
  'hit-it-close': (id, c) => <>
    <Rough />
    <Green id={id} cx={170} cy={58} rx={116} ry={46} />
    <Bunker id={id} cx={160} cy={140} rx={88} ry={24} />
    <Ring x={170} y={52} r={36} /><Ring x={170} y={52} r={15} strong />
    <Flag x={170} y={54} h={24} />
    <Ball x={156} y={144} />
    <Flight from={[156, 140]} to={[166, 64]} bend={-20} roll={[169, 56]} id={id} />
    <LoopArrow from={[140, 150]} to={[134, 172]} bend={30} id={id} />
    <BallCount x={176} y={170} n={5} filled={1} />
    <Pts x={210} y={20} v="5" ctx={c} at={[172, 52]} /><Pts x={214} y={44} v="3" ctx={c} at={[183, 50]} /><Pts x={240} y={72} v="2" ctx={c} at={[204, 62]} /><Pts x={276} y={36} v="1" ctx={c} />
    <Dim x1={110} x2={110} y={146} y2={56} vertical label="~10 m" ctx={c} />
    <Tag x={70} y={186} ctx={c}>Routine: raus & rein</Tag>
  </>,
  'hit-the-spot': (id, c) => <>
    <Rough />
    <Green id={id} cx={160} cy={84} rx={140} ry={84} />
    {[150, 116, 82, 48].map((y) => <Club key={y} x={160} y={y} len={96} />)}
    <Zone x={108} y={118} w={104} h={30} active /><Zone x={108} y={84} w={104} h={30} /><Zone x={108} y={50} w={104} h={30} />
    {[133, 99, 65].map((y, i) => !c.sm && <text key={y} x={120} y={y + 4} fontSize="11" fontWeight="700" fill="var(--text-2)">{i + 1}</text>)}
    <Ball x={160} y={190} />
    <Flight from={[160, 186]} to={[156, 134]} bend={-10} roll={[155, 112]} id={id} />
    <Flight from={[160, 186]} to={[166, 66]} bend={14} muted id={id} />
    <LoopArrow from={[220, 64]} to={[220, 132]} bend={-26} id={id} />
    {[['4 m', 152], ['6 m', 118], ['8 m', 84], ['10 m', 50]].map(([l, y]) => <Tag key={String(l)} x={236} y={Number(y) + 3} ctx={c} anchor="start">{String(l)}</Tag>)}
    <Tag x={60} y={146} ctx={c} leader={[154, 134]}>Landung zählt</Tag><Tag x={60} y={186} ctx={c}>15 Bälle</Tag>
  </>,
  'chip-to-a-towel': (id, c) => {
    const towel: [number, number] = [214, 50];
    const st = [44, 92, 116, 140].map((d, i) => pol(towel[0], towel[1], d, [236, 222, 236, 222][i]));
    return <>
      <Rough />
      <Green id={id} cx={170} cy={84} rx={136} ry={76} />
      <Towel x={towel[0]} y={towel[1]} />
      {st.map(([x, y], i) => <g key={i}><Station x={x} y={y} n={i + 1} ctx={c} /><Tag x={x + (i % 2 ? -30 : 30)} y={y + 4} ctx={c}>{`${[2, 4, 5, 6][i]} m`}</Tag></g>)}
      <Flight from={[st[1][0] + 6, st[1][1] - 6]} to={[210, 52]} bend={-12} id={id} />
      <Ball x={218} y={48} r={3.6} />
      <Ball x={250} y={66} r={3.4} /><Cross x={250} y={66} />
      <Tag x={270} y={92} ctx={c}>muss liegen bleiben</Tag><Tag x={60} y={22} ctx={c}>8 Treffer · 15 Min</Tag>
    </>;
  },
  'worstball-chipping': (id, c) => <>
    <Rough />
    <Green id={id} cx={176} cy={70} rx={120} ry={56} />
    <ellipse cx={176} cy={70} rx={156} ry={98} fill="none" stroke="rgba(242,243,245,0.1)" strokeWidth="18" />
    <Flag x={120} y={56} h={20} color={COL.neutral} /><Flag x={200} y={36} h={22} /><Flag x={252} y={86} h={20} color={COL.neutral} />
    <Peg x={150} y={176} /><Peg x={46} y={150} /><Peg x={296} y={150} />
    <Ball x={142} y={170} /><Ball x={158} y={170} />
    <Flight from={[142, 166]} to={[194, 46]} bend={-12} muted id={id} />
    <Ball x={194} y={46} r={3.4} /><Cross x={194} y={46} />
    <Flight from={[158, 166]} to={[214, 72]} bend={10} id={id} />
    <Ball x={214} y={72} r={3.6} />
    <Roll pts={[[212, 66], [202, 42]]} id={id} />
    <Tag x={74} y={186} ctx={c}>2 Bälle</Tag><Tag x={252} y={124} ctx={c} leader={[216, 76]}>schlechteren putten</Tag>
    <Tag x={262} y={186} ctx={c}>9 × · 6–12 m</Tag>
  </>,
  'up-and-down-series': (id, c) => <>
    <Rough />
    <Green id={id} cx={164} cy={98} rx={92} ry={56} />
    <Flag x={124} y={80} h={20} /><Flag x={206} y={118} h={20} color={COL.neutral} /><Flag x={174} y={62} h={20} color={COL.neutral} />
    <path d="M48,160 C120,196 230,196 278,170 C300,140 296,70 276,44" fill="none" stroke="rgba(242,243,245,0.25)" strokeDasharray="3 5" />
    {[[40, 150], [284, 166], [270, 34]].map(([x, y], i) => <Station key={i} x={x} y={y} n={i + 1} ctx={c} />)}
    <ChipPutt from={[46, 144]} hole={[124, 80]} bend={-10} id={id} />
    <ChipPutt from={[278, 160]} hole={[206, 118]} bend={8} muted id={id} />
    <LoopArrow from={[30, 164]} to={[28, 140]} bend={22} id={id} />
    <Tag x={84} y={22} ctx={c}>Serie: max. 2 Schläge</Tag><Tag x={60} y={120} ctx={c}>sonst wiederholen</Tag>
    <Tag x={160} y={186} ctx={c}>4–20 m</Tag>
  </>,
  'beat-21': (id, c) => {
    const ring = Array.from({ length: 11 }, (_, i) => { const a = (i / 11) * 2 * Math.PI + 0.3; return [160 + 140 * Math.cos(a), 92 + 82 * Math.sin(a)] as [number, number]; });
    const active = ring[3];
    return <>
      <Rough />
      <Green id={id} cx={160} cy={92} rx={92} ry={50} />
      <ellipse cx={160} cy={92} rx={140} ry={82} fill="none" stroke="rgba(242,243,245,0.08)" strokeWidth="16" />
      <Flag x={128} y={82} h={20} /><Flag x={196} y={74} h={20} color={COL.neutral} /><Flag x={176} y={118} h={20} color={COL.neutral} />
      {ring.map(([x, y], i) => <Peg key={i} x={x} y={y} color={i === 3 ? 'var(--accent)' : COL.marker} />)}
      <ChipPutt from={[active[0] + 4, active[1] - 6]} hole={[128, 82]} bend={-12} id={id} />
      <Tag x={270} y={22} ctx={c}>11 × Chip + Putt</Tag><Tag x={50} y={22} ctx={c}>6–12 m</Tag>
    </>;
  },

  // ---------------- Putting ----------------
  'draw-back': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <path d="M134,50 A26,26 0 0 1 186,50 Z" fill="rgba(155,227,195,0.16)" stroke="var(--accent)" strokeDasharray="3 3" strokeWidth="1.2" />
    <path d="M134,50 A26,26 0 0 0 186,50 Z" fill="rgba(255,154,133,0.12)" />
    <Hole x={160} y={50} />
    <Ball x={160} y={184} />
    <Roll pts={[[160, 178], [158, 72]]} id={id} />
    <Ball x={158} y={68} r={4} />
    <Club x={176} y={80} len={26} angle={90} />
    <Roll pts={[[166, 70], [166, 92]]} id={id} muted />
    <circle cx={166} cy={96} r="4" fill="none" stroke="var(--text-2)" strokeDasharray="2 2" />
    <Ball x={168} y={34} r={4} />
    <Tag x={244} y={30} ctx={c} accent leader={[172, 34]}>einlochen</Tag>
    <Tag x={250} y={104} ctx={c} leader={[172, 96]}>1 Schlägerlänge zurück</Tag>
    <Tag x={70} y={184} ctx={c}>9 Löcher · 5–20 m</Tag>
  </>,
  'five-balls': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Slope x={60} y={90} w={44} n={2} id={id} />
    <rect x={130} y={28} width={60} height={24} rx="4" fill="rgba(155,227,195,0.14)" />
    <rect x={130} y={52} width={60} height={22} rx="4" fill="rgba(255,154,133,0.12)" />
    <line x1={118} y1={52} x2={202} y2={52} stroke="rgba(242,243,245,0.5)" strokeDasharray="4 3" />
    <Hole x={160} y={52} />
    <Club x={160} y={26} len={70} />
    <Ball x={160} y={182} />
    <Roll pts={[[160, 176], [160, 60]]} id={id} />
    <BallCount x={176} y={182} n={5} filled={4} />
    <Pts x={110} y={52} v="+2" ctx={c} at={[154, 52]} /><Pts x={220} y={38} v="+1" ctx={c} /><Pts x={220} y={66} v="−1" ctx={c} weak />
    <Tag x={262} y={20} ctx={c}>Schläger 50 cm</Tag><Tag x={250} y={52} ctx={c}>Lochhöhe</Tag>
    <Dim x1={104} x2={104} y={180} y2={56} vertical label="7 m" ctx={c} />
  </>,
  'up-and-down-omeara': (id, c) => {
    const hole: [number, number] = [170, 62];
    const tees: [number, number][] = [[40, 108], [86, 148], [160, 160], [236, 150], [286, 108]];
    return <>
      <Rough /><Green id={id} cx={160} cy={74} rx={116} ry={58} />
      <Hole x={hole[0]} y={hole[1]} /><Ring x={hole[0]} y={hole[1]} r={11} />
      {tees.map(([x, y], i) => <Peg key={i} x={x} y={y} color={i === 1 ? 'var(--accent)' : COL.marker} />)}
      <Roll pts={[[92, 142], [160, 70]]} id={id} />
      <Ball x={161} y={70} r={3.6} />
      <Roll pts={[[164, 68], [168, 66]]} id={id} />
      <Dim x1={300} x2={300} y={108} y2={62} vertical label="7–15 m" ctx={c} />
      <Tag x={160} y={186} ctx={c}>5 Tees auf dem Vorgrün · max. 2</Tag>
    </>;
  },
  'pace-putting': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <rect x={142} y={26} width={36} height={32} rx="6" fill="rgba(155,227,195,0.12)" stroke="var(--accent)" strokeOpacity="0.5" strokeDasharray="3 3" />
    <Hole x={160} y={44} /><Peg x={192} y={58} color={COL.marker} /><Peg x={192} y={26} color={COL.marker} />
    {[92, 120, 148, 176].map((y, i) => <g key={y}><Peg x={160} y={y} color={i === 3 ? 'var(--accent)' : COL.marker} /><Tag x={128} y={y + 3} ctx={c} anchor="end">{['4,5 m', '6 m', '7,5 m', '9 m'][i]}</Tag></g>)}
    <Roll pts={[[160, 170], [160, 52]]} id={id} />
    <BallCount x={176} y={176} n={3} filled={1} />
    <Pts x={112} y={44} v="+3" ctx={c} at={[154, 44]} /><Pts x={222} y={30} v="+2" ctx={c} at={[178, 32]} /><Pts x={222} y={54} v="+1" ctx={c} at={[178, 54]} /><Pts x={240} y={84} v="−1" ctx={c} weak />
    <Tag x={262} y={186} ctx={c}>3 Putts je Position</Tag>
  </>,
  'control-the-line': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Peg x={160} y={22} color={COL.marker} /><Peg x={160} y={110} color={COL.marker} />
    <line x1={124} y1={110} x2={192} y2={110} stroke={COL.weak} strokeWidth="1.5" strokeDasharray="4 3" />
    <Ball x={160} y={184} />
    {[38, 52, 66, 80, 94].map((y, i) => <g key={y} opacity={1 - i * 0.12}><line x1={162} y1={178} x2={166 + i * 6} y2={y + 4} stroke={i === 0 ? 'var(--accent)' : 'var(--text-2)'} strokeOpacity={i === 0 ? 1 : 0.4} strokeWidth="1.5" /><Ball x={166 + i * 6} y={y} r={4} />{!c.sm && <text x={156 - 2} y={y + 4} fontSize="9" fontWeight="700" textAnchor="end" fill="var(--text-2)">{i + 1}</text>}</g>)}
    <Tag x={240} y={26} ctx={c}>Ziel 10 m</Tag><Tag x={240} y={114} ctx={c}>Ende &lt; 5 m</Tag><Tag x={82} y={66} ctx={c}>jeder kürzer</Tag>
  </>,
  'hit-the-hall': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <rect x={142} y={24} width={36} height={30} fill="rgba(155,227,195,0.14)" />
    <Club x={140} y={38} len={34} angle={90} /><Club x={180} y={38} len={34} angle={90} /><Club x={160} y={20} len={44} />
    <Hole x={160} y={58} />
    {[82, 106, 130, 154, 178].map((y, i) => <g key={y}><Peg x={160} y={y} color={i === 0 ? 'var(--accent)' : COL.marker} /><Tag x={198} y={y + 3} ctx={c} anchor="start">{`${(i + 1) * 2} m`}</Tag>
      {i > 0 && <path d={`M136,${y - 9} l5,-5 l5,5`} fill="none" stroke="var(--text-2)" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" />}</g>)}
    <Roll pts={[[160, 76], [160, 64]]} id={id} />
    <BallCount x={168} y={88} n={3} filled={2} />
    <Pts x={110} y={38} v="+1" ctx={c} at={[150, 38]} /><Pts x={110} y={58} v="+2" ctx={c} at={[154, 58]} /><Pts x={110} y={74} v="0" ctx={c} weak />
    <Tag x={74} y={186} ctx={c}>3 P → nächste Station</Tag>
  </>,
  'around-the-world': (id, c) => {
    const pegs = [0, 90, 180, 270].flatMap((a, k) => [{ p: pol(160, 100, 40, a), n: k + 1 }, { p: pol(160, 100, 62, a), n: k + 5 }]);
    return <>
      <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
      <Slope x={60} y={36} w={50} n={3} angle={10} id={id} />
      <line x1={88} y1={100} x2={232} y2={100} stroke="rgba(242,243,245,0.18)" /><line x1={160} y1={28} x2={160} y2={172} stroke="rgba(242,243,245,0.18)" />
      <Hole x={160} y={100} />
      {pegs.map(({ p: [x, y], n }) => <g key={n}><Peg x={x} y={y} color={n === 1 ? 'var(--accent)' : COL.marker} />{!c.sm && <text x={x + 7} y={y - 6} fontSize="9" fontWeight="700" fill="var(--text-2)">{n}</text>}</g>)}
      <CcwArrow cx={160} cy={100} r={80} id={id} />
      <Curve d="M196,104 Q182,112 166,102" id={id} />
      <Dim x1={160} x2={222} y={118} label="90 / 120 cm" ctx={c} />
      <Tag x={60} y={186} ctx={c}>8 in Folge · 10 Min</Tag>
    </>;
  },
  'shorties-under-pressure': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Hole x={160} y={30} />
    <Club x={176} y={54} len={44} angle={90} />
    {[[78, '90 cm', '10×'], [122, '180 cm', '4×'], [166, '270 cm', '2×']].map(([y, l, n], i) => (
      <g key={i}><Peg x={160} y={Number(y)} color={i === 0 ? 'var(--accent)' : COL.marker} /><Station x={130} y={Number(y)} n={i + 1} ctx={c} r={7} /><Tag x={198} y={Number(y) + 3} ctx={c} anchor="start">{String(l)}</Tag><Count x={276} y={Number(y)} v={String(n)} ctx={c} /></g>
    ))}
    <Roll pts={[[160, 70], [160, 38]]} id={id} />
    <LoopArrow from={[112, 166]} to={[114, 82]} bend={26} id={id} />
    <Tag x={56} y={124} ctx={c}>Fehlputt → 1</Tag><Tag x={234} y={54} ctx={c}>1 Putterlänge</Tag>
  </>,
  shootout: (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <line x1={160} y1={30} x2={160} y2={170} stroke="rgba(242,243,245,0.15)" strokeDasharray="3 5" />
    <Hole x={160} y={100} />
    <Peg x={160} y={160} /><Peg x={160} y={40} />
    <Roll pts={[[160, 152], [160, 108]]} id={id} />
    <Roll pts={[[160, 48], [160, 92]]} id={id} muted />
    {!c.sm && <><text x={146} y={156} fontSize="10" fontWeight="700" textAnchor="end" fill="var(--accent)">1</text><text x={146} y={46} fontSize="10" fontWeight="700" textAnchor="end" fill="var(--text-2)">2</text></>}
    <Dim x1={214} x2={214} y={44} y2={100} vertical label="1,5 m" ctx={c} />
    <Dim x1={214} x2={214} y={100} y2={156} vertical label="1,5 m" ctx={c} />
    <Tag x={84} y={22} ctx={c}>5/10/15 in Folge</Tag><Tag x={84} y={186} ctx={c}>Fehlputt: von vorn +1</Tag>
  </>,
  'circle-putting': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Slope x={66} y={150} w={50} n={3} angle={-12} id={id} />
    <Hole x={160} y={100} />
    <Ring x={160} y={100} r={56} />
    {Array.from({ length: 8 }, (_, i) => pol(160, 100, 56, i * 45)).map(([x, y], i) => <g key={i}>
      {i === (c.active ?? 0) && <circle cx={x} cy={y} r="8" fill="none" stroke="var(--accent)" strokeWidth="1.5" />}
      <Peg x={x} y={y} color={i === (c.active ?? 0) ? 'var(--accent)' : COL.marker} />
      {!c.sm && <text x={x + (Math.cos(i * Math.PI / 4) * 14) - 3} y={y - Math.sin(i * Math.PI / 4) * 14 + 3} fontSize="9" fontWeight="700" fill="var(--text-2)">{i + 1}</text>}</g>)}
    <Ball x={212} y={110} r={3.8} /><Curve d="M206,110 Q186,118 166,104" id={id} />
    <CcwArrow cx={160} cy={100} r={76} id={id} />
    <Dim x1={160} x2={216} y={84} label="90 cm" ctx={c} />
    <Tag x={66} y={128} ctx={c}>leichter Break</Tag><Tag x={262} y={186} ctx={c}>Serie zählen</Tag>
  </>,
};
