/**
 * One illustrated scene per drill, composed from each drill's setup text (seed data, German booklet).
 * Not traced from the booklet artwork. Canvas 320×200, forward = up.
 */
import type { ReactNode } from 'react';
import {
  Ball, Bunker, CcwArrow, Club, Corridor, Curve, Dim, Flag, Flight, Green, Hole, Peg, Pts, Range, Ring, Roll, Rough,
  Station, Stick, Tag, TeeBall, Towel, Zone, type Ctx,
} from './kit';

type Scene = (id: (k: string) => string, ctx: Ctx) => ReactNode;
const fan = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];

export const SCENES: Record<string, Scene> = {
  // ---------------- Off the tee ----------------
  'fade-and-draw': (id, c) => <>
    <Range id={id} />
    <Corridor x={95} y={14} w={130} h={46} label="30 m" ctx={c} />
    <Stick x1={160} y1={188} x2={160} y2={178} /><Stick x1={160} y1={168} x2={160} y2={158} />
    <TeeBall x={160} y={172} ctx={c} />
    <Stick x1={160} y1={112} x2={160} y2={96} color="var(--p-approach)" />
    <Curve d="M160,166 C120,140 128,80 176,40" id={id} />
    <Curve d="M160,166 C200,140 192,80 144,40" id={id} muted />
    <Tag x={104} y={124} ctx={c}>Draw</Tag><Tag x={216} y={124} ctx={c} accent>Fade</Tag>
    <Tag x={160} y={88} ctx={c}>Stick 10 m</Tag>
  </>,
  'short-aims': (id, c) => <>
    <Range id={id} />
    {[[160, 150, 100, 22], [136, 108, 125, 19], [184, 68, 150, 16], [160, 30, 175, 13]].map(([x, y, m, r], i) => (
      <g key={m}><Ring x={x} y={y} r={r} strong={i === (c.active ?? 0)} /><Station x={x} y={y} n={i + 1} ctx={c} /><Tag x={x + (i % 2 ? -44 : 46)} y={y + 4} ctx={c}>{`${m} m`}</Tag></g>
    ))}
    <TeeBall x={160} y={188} ctx={c} />
    <Flight from={[160, 184]} to={[156, 152]} bend={-10} id={id} />
    <Tag x={232} y={186} ctx={c}>Radius 10 m</Tag>
  </>,
  '14-fairways': (id, c) => <>
    <Range id={id} />
    <Corridor x={100} y={18} w={120} h={92} label="30 m" ctx={c} />
    <TeeBall x={160} y={182} ctx={c} />
    <Flight from={[160, 178]} to={[150, 58]} bend={-18} roll={[146, 38]} id={id} />
    <Flight from={[160, 178]} to={[176, 112]} bend={14} roll={[178, 100]} muted id={id} />
    <Tag x={102} y={150} ctx={c} accent>Driver</Tag><Tag x={222} y={140} ctx={c}>Eisen 7</Tag>
    <Tag x={268} y={186} ctx={c}>14 + 14</Tag>
  </>,
  'nine-drives': (id, c) => <>
    <Range id={id} />
    <Corridor x={100} y={16} w={120} h={70} label="30 m" ctx={c} />
    <line x1={70} y1={100} x2={250} y2={100} stroke="rgba(242,243,245,0.45)" strokeDasharray="4 4" />
    <Tag x={276} y={104} ctx={c}>≥ 150 m</Tag>
    <TeeBall x={160} y={182} ctx={c} />
    <Flight from={[160, 178]} to={[168, 46]} bend={16} roll={[170, 30]} id={id} />
    {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={30 + (i % 3) * 14} cy={150 + Math.floor(i / 3) * 14} r="5" fill={i < 3 ? 'var(--accent)' : 'rgba(242,243,245,0.25)'} />)}
    <Tag x={50} y={196} ctx={c}>9 Löcher</Tag>
  </>,

  // ---------------- Approach ----------------
  'hit-three-greens': (id, c) => <>
    <Range id={id} />
    <Green id={id} cx={92} cy={128} rx={30} ry={18} /><Flag x={92} y={130} h={24} />
    <Green id={id} cx={226} cy={92} rx={34} ry={20} /><Flag x={226} y={94} h={24} />
    <Green id={id} cx={146} cy={38} rx={40} ry={22} /><Flag x={146} y={40} h={24} />
    <TeeBall x={160} y={186} ctx={c} />
    <Flight from={[160, 182]} to={[96, 128]} bend={-6} id={id} />
    <Flight from={[160, 182]} to={[222, 94]} bend={10} muted id={id} />
    <Flight from={[160, 182]} to={[150, 40]} bend={4} muted id={id} />
    <Tag x={50} y={158} ctx={c}>100 m · 2 P</Tag><Tag x={272} y={126} ctx={c}>130 m · 3 P</Tag><Tag x={232} y={30} ctx={c}>160 m · 4 P</Tag>
  </>,

  // ---------------- Short game ----------------
  'five-different-clubs': (id, c) => <>
    <Rough />
    <Green id={id} cx={160} cy={46} rx={110} ry={38} />
    <Ring x={160} y={42} r={22} strong /><Ring x={160} y={42} r={34} />
    <Flag x={160} y={44} h={26} />
    {[[70, 104, '10 m'], [126, 136, '15 m'], [194, 156, '20 m'], [256, 178, '25 m']].map(([x, y, l], i) => (
      <g key={i}><Station x={Number(x)} y={Number(y)} n={i + 1} ctx={c} /><Tag x={Number(x) + (i < 3 ? 32 : -32)} y={Number(y) + 4} ctx={c}>{String(l)}</Tag></g>
    ))}
    <Flight from={[126, 128]} to={[156, 50]} bend={-12} roll={[159, 44]} id={id} />
    <Tag x={52} y={186} ctx={c}>5 Schläger je Station</Tag>
  </>,
  'attack-the-flag': (id, c) => <>
    <Rough />
    <Green id={id} cx={164} cy={40} rx={92} ry={30} />
    <Bunker id={id} cx={150} cy={96} rx={58} ry={14} rot={-4} />
    <Ring x={168} y={36} r={18} strong /><Flag x={168} y={38} h={24} />
    {[[110, 136, '20 m'], [176, 160, '30 m'], [236, 184, '40 m']].map(([x, y, l], i) => (
      <g key={i}><Station x={Number(x)} y={Number(y)} n={i + 1} ctx={c} /><Tag x={Number(x) + 34} y={Number(y) + 4} ctx={c}>{String(l)}</Tag></g>
    ))}
    <Flight from={[176, 152]} to={[166, 42]} bend={-26} id={id} />
    <Tag x={50} y={98} ctx={c}>hoch anspielen</Tag>
  </>,
  'four-stations': (id, c) => <>
    <Rough />
    <Green id={id} cx={196} cy={78} rx={110} ry={62} />
    <Ring x={250} y={52} r={14} strong /><Ring x={250} y={52} r={32} />
    <Flag x={250} y={54} h={24} />
    {[[96, 132], [68, 150], [40, 168], [124, 116]].map(([x, y], i) => <Station key={i} x={x} y={y} n={[2, 3, 4, 1][i]} ctx={c} />)}
    <line x1={36} y1={170} x2={242} y2={56} stroke="rgba(242,243,245,0.3)" strokeDasharray="3 5" />
    <Tag x={132} y={142} ctx={c}>Vorgrün</Tag><Tag x={60} y={124} ctx={c}>je 5 m</Tag>
    <Pts x={282} y={22} v="3" ctx={c} /><Pts x={272} y={74} v="2" ctx={c} /><Pts x={296} y={100} v="1" ctx={c} />
  </>,
  'sandy-par': (id, c) => <>
    <Rough />
    <Green id={id} cx={164} cy={66} rx={128} ry={54} />
    <Bunker id={id} cx={150} cy={168} rx={76} ry={24} />
    {[[70, 64], [120, 34], [182, 52], [240, 40], [216, 92]].map(([x, y], i) => <Flag key={i} x={x} y={y} h={18} color={i === 2 ? 'var(--accent)' : 'var(--p-approach)'} />)}
    <Ball x={150} y={170} />
    <Flight from={[150, 166]} to={[172, 74]} bend={-18} id={id} />
    <Roll pts={[[172, 74], [181, 55]]} id={id} dashed />
    <Tag x={44} y={170} ctx={c}>5 Löcher · 3–10 m</Tag>
  </>,
  'hit-it-close': (id, c) => <>
    <Rough />
    <Green id={id} cx={170} cy={58} rx={118} ry={48} />
    <Bunker id={id} cx={160} cy={164} rx={88} ry={26} />
    <Ring x={170} y={52} r={36} /><Ring x={170} y={52} r={15} strong />
    <Flag x={170} y={54} h={24} />
    <Ball x={156} y={166} />
    <Flight from={[156, 162]} to={[166, 64]} bend={-20} roll={[169, 56]} id={id} />
    <Pts x={196} y={26} v="5" ctx={c} /><Pts x={194} y={64} v="3" ctx={c} /><Pts x={222} y={84} v="2" ctx={c} /><Pts x={278} y={46} v="1" ctx={c} />
    <Tag x={50} y={126} ctx={c}>~10 m</Tag>
  </>,
  'hit-the-spot': (id, c) => <>
    <Rough />
    <Green id={id} cx={160} cy={66} rx={140} ry={64} />
    {[150, 116, 82, 48].map((y) => <Club key={y} x={160} y={y} len={96} />)}
    <Zone x={108} y={118} w={104} h={30} active /><Zone x={108} y={84} w={104} h={30} /><Zone x={108} y={50} w={104} h={30} />
    <Ball x={160} y={188} />
    <Flight from={[160, 184]} to={[156, 134]} bend={-10} roll={[155, 112]} id={id} />
    <Flight from={[160, 184]} to={[164, 66]} bend={14} muted id={id} />
    {[['4 m', 152], ['6 m', 118], ['8 m', 84], ['10 m', 50]].map(([l, y]) => <Tag key={String(l)} x={262} y={Number(y) + 3} ctx={c}>{String(l)}</Tag>)}
  </>,
  'chip-to-a-towel': (id, c) => <>
    <Rough />
    <Green id={id} cx={170} cy={78} rx={130} ry={72} />
    <Towel x={196} y={54} />
    {[[176, 104, '2 m'], [130, 128, '4 m'], [88, 150, '5 m'], [50, 172, '6 m']].map(([x, y, l], i) => (
      <g key={i}><Station x={Number(x)} y={Number(y)} n={i + 1} ctx={c} /><Tag x={Number(x) + 30} y={Number(y) + 4} ctx={c}>{String(l)}</Tag></g>
    ))}
    <Flight from={[130, 120]} to={[194, 56]} bend={-14} id={id} />
    <Tag x={262} y={30} ctx={c}>8 Treffer</Tag>
  </>,
  'worstball-chipping': (id, c) => <>
    <Rough />
    <Green id={id} cx={176} cy={68} rx={124} ry={58} />
    <Flag x={120} y={52} h={20} color="var(--p-approach)" /><Flag x={196} y={34} h={22} /><Flag x={254} y={82} h={20} color="var(--p-approach)" />
    <Peg x={150} y={172} /><Ball x={142} y={168} /><Ball x={158} y={168} />
    <Flight from={[142, 164]} to={[190, 46]} bend={-12} id={id} />
    <Flight from={[158, 164]} to={[210, 68]} bend={10} muted id={id} />
    <circle cx={210} cy={68} r="9" fill="none" stroke="var(--weak)" strokeWidth="1.5" />
    <Roll pts={[[210, 68], [198, 40]]} id={id} dashed />
    <Tag x={76} y={176} ctx={c}>2 Bälle</Tag><Tag x={262} y={124} ctx={c}>schlechteren putten</Tag>
  </>,
  'up-and-down-series': (id, c) => <>
    <Rough />
    <Green id={id} cx={164} cy={96} rx={96} ry={60} />
    <Flag x={124} y={78} h={20} /><Flag x={204} y={118} h={20} color="var(--p-approach)" /><Flag x={172} y={60} h={20} color="var(--p-putting)" />
    {[[40, 150], [282, 168], [272, 34]].map(([x, y], i) => <Station key={i} x={x} y={y} n={i + 1} ctx={c} />)}
    <Flight from={[46, 144]} to={[116, 88]} bend={-10} roll={[121, 82]} id={id} />
    <Flight from={[276, 162]} to={[212, 126]} bend={8} roll={[207, 121]} muted id={id} />
    <Flight from={[266, 40]} to={[184, 62]} bend={-8} roll={[176, 61]} muted id={id} />
    <path d="M52,160 C120,196 230,196 274,176" fill="none" stroke="rgba(242,243,245,0.3)" strokeDasharray="3 5" />
    <Tag x={160} y={192} ctx={c}>Serie: max. 2 Schläge</Tag>
  </>,
  'beat-21': (id, c) => <>
    <Rough />
    <Green id={id} cx={160} cy={92} rx={104} ry={58} />
    <Flag x={126} y={80} h={20} /><Flag x={198} y={70} h={20} color="var(--p-approach)" /><Flag x={176} y={124} h={20} color="var(--p-approach)" />
    {Array.from({ length: 11 }, (_, i) => fan(160, 96, 140, 200 + i * 14)).map(([x, y], i) => <Peg key={i} x={Math.max(14, Math.min(306, x))} y={Math.max(12, Math.min(190, y))} color={i === 2 ? 'var(--accent)' : '#F2F3F5'} />)}
    <Flight from={[42, 166]} to={[118, 90]} bend={-10} roll={[124, 84]} id={id} />
    <Tag x={160} y={192} ctx={c}>11 × Chip + Putt</Tag>
  </>,

  // ---------------- Putting ----------------
  'draw-back': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Hole x={160} y={50} />
    <rect x={140} y={18} width={40} height={30} rx="6" fill="rgba(155,227,195,0.14)" stroke="var(--accent)" strokeDasharray="3 3" strokeWidth="1.2" />
    <Ball x={160} y={176} />
    <Roll pts={[[160, 170], [163, 82], [164, 66]]} id={id} />
    <Ball x={164} y={64} />
    <Roll pts={[[172, 64], [172, 86]]} id={id} muted />
    <Tag x={232} y={78} ctx={c}>1 Schlägerlänge zurück</Tag><Tag x={232} y={30} ctx={c}>OK-Zone</Tag>
    <Tag x={78} y={176} ctx={c}>9 Löcher · 5–20 m</Tag>
  </>,
  'five-balls': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <rect x={136} y={30} width={48} height={22} rx="4" fill="rgba(155,227,195,0.12)" />
    <Hole x={160} y={52} />
    <Club x={160} y={26} len={70} />
    <Ball x={160} y={180} />
    <Roll pts={[[160, 174], [158, 60]]} id={id} />
    {[[150, 168], [170, 170], [140, 182], [180, 184]].map(([x, y], i) => <Ball key={i} x={x} y={y} r={3.6} />)}
    <Pts x={128} y={56} v="+2" ctx={c} /><Pts x={208} y={40} v="+1" ctx={c} /><Pts x={208} y={84} v="−1" ctx={c} />
    <Tag x={260} y={26} ctx={c}>Schläger 50 cm</Tag><Tag x={68} y={120} ctx={c}>7 m</Tag>
  </>,
  'up-and-down-omeara': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={74} rx={124} ry={60} />
    <Hole x={170} y={64} />
    {[[40, 120], [92, 164], [160, 178], [232, 164], [284, 118]].map(([x, y], i) => <g key={i}><Peg x={x} y={y} /><Ball x={x + 7} y={y - 5} r={3.6} /></g>)}
    <Roll pts={[[97, 155], [166, 69]]} id={id} />
    <Roll pts={[[160, 170], [169, 72]]} id={id} muted />
    <Tag x={160} y={196} ctx={c}>5 Tees · Vorgrün</Tag><Tag x={262} y={40} ctx={c}>7–15 m</Tag>
  </>,
  'pace-putting': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <rect x={142} y={28} width={36} height={44} rx="6" fill="rgba(155,227,195,0.12)" stroke="var(--accent)" strokeOpacity="0.5" strokeDasharray="3 3" />
    <Hole x={160} y={48} /><Peg x={190} y={58} color="var(--p-short)" /><Peg x={190} y={30} color="var(--p-short)" />
    {[[160, 92], [160, 120], [160, 148], [160, 176]].map(([x, y], i) => <g key={i}><Station x={x - 28} y={y} n={i + 1} ctx={c} /><Peg x={x} y={y} /></g>)}
    {[['4,5 m', 92], ['6 m', 120], ['7,5 m', 148], ['9 m', 176]].map(([l, y]) => <Tag key={String(l)} x={218} y={Number(y) + 3} ctx={c}>{String(l)}</Tag>)}
    <Roll pts={[[160, 140], [160, 58]]} id={id} />
    <Pts x={126} y={48} v="+3" ctx={c} /><Pts x={232} y={30} v="+2" ctx={c} /><Pts x={232} y={62} v="+1" ctx={c} />
  </>,
  'control-the-line': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Peg x={160} y={26} color="var(--p-short)" /><Peg x={160} y={110} color="var(--p-short)" />
    <line x1={120} y1={110} x2={200} y2={110} stroke="rgba(242,243,245,0.4)" strokeDasharray="4 4" />
    <Ball x={160} y={184} />
    {[34, 48, 62, 76, 90].map((y, i) => <Ball key={y} x={160 + (i % 2 ? 3 : -3)} y={y} r={4} />)}
    <Roll pts={[[176, 178], [176, 40]]} id={id} />
    <Tag x={228} y={30} ctx={c}>Ziel 10 m</Tag><Tag x={228} y={114} ctx={c}>5-m-Marke</Tag><Tag x={92} y={62} ctx={c}>jeder kürzer</Tag>
  </>,
  'hit-the-hall': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Club x={140} y={16} len={44} angle={90} /><Club x={180} y={16} len={44} angle={90} /><Club x={160} y={-6} len={40} />
    <rect x={142} y={-4} width={36} height={38} fill="rgba(155,227,195,0.14)" />
    <Hole x={160} y={42} />
    {[66, 94, 122, 150, 178].map((y, i) => <g key={y}><Peg x={160} y={y} /><Station x={124} y={y} n={i + 1} ctx={c} /><Tag x={204} y={y + 3} ctx={c}>{`${(i + 1) * 2} m`}</Tag></g>)}
    <Roll pts={[[160, 70], [160, 50]]} id={id} />
    <Pts x={232} y={42} v="+2" ctx={c} /><Pts x={232} y={14} v="+1" ctx={c} />
  </>,
  'around-the-world': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Hole x={160} y={100} />
    <Ring x={160} y={100} r={44} /><Ring x={160} y={100} r={66} />
    {[0, 90, 180, 270].flatMap((a) => [44, 66].map((r) => fan(160, 100, r, a))).map(([x, y], i) => <Peg key={i} x={x} y={y} color={i % 2 ? '#F2F3F5' : 'var(--p-short)'} />)}
    <CcwArrow cx={160} cy={100} r={82} id={id} />
    <Ball x={204} y={100} r={4} /><Roll pts={[[198, 100], [168, 100]]} id={id} />
    <Tag x={256} y={190} ctx={c}>90 / 120 cm</Tag><Tag x={60} y={190} ctx={c}>8 in Folge</Tag>
  </>,
  'shorties-under-pressure': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Hole x={160} y={34} />
    {[[78, '90 cm', '10'], [122, '180 cm', '4'], [166, '270 cm', '2']].map(([y, l, n], i) => (
      <g key={i}><Peg x={160} y={Number(y)} /><Station x={124} y={Number(y)} n={i + 1} ctx={c} /><Tag x={206} y={Number(y) + 3} ctx={c}>{String(l)}</Tag><Pts x={264} y={Number(y)} v={`×${n}`} ctx={c} /></g>
    ))}
    <Ball x={160} y={70} r={4} /><Roll pts={[[160, 66], [160, 42]]} id={id} />
  </>,
  shootout: (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Hole x={160} y={100} />
    <Peg x={160} y={40} /><Peg x={160} y={160} />
    <Ball x={166} y={160} r={4} /><Ball x={154} y={40} r={4} />
    <Roll pts={[[172, 154], [166, 108]]} id={id} />
    <Roll pts={[[148, 46], [154, 92]]} id={id} muted />
    <Dim x1={214} x2={214} y={44} y2={100} vertical label="1,5 m" ctx={c} />
    <Dim x1={214} x2={214} y={100} y2={156} vertical label="1,5 m" ctx={c} />
    <Tag x={80} y={100} ctx={c}>abwechselnd</Tag>
  </>,
  'circle-putting': (id, c) => <>
    <Rough /><Green id={id} cx={160} cy={100} rx={150} ry={92} />
    <Hole x={160} y={100} />
    <Ring x={160} y={100} r={56} />
    {Array.from({ length: 8 }, (_, i) => fan(160, 100, 56, i * 45)).map(([x, y], i) => <Peg key={i} x={x} y={y} color={i === (c.active ?? 0) ? 'var(--accent)' : '#F2F3F5'} />)}
    <Ball x={216} y={100} r={4} /><Roll pts={[[210, 100], [168, 100]]} id={id} />
    <CcwArrow cx={160} cy={100} r={74} id={id} />
    <path d="M60,30 q20,-10 40,0" fill="none" stroke="rgba(242,243,245,0.45)" strokeWidth="1.5" markerEnd={`url(#${id('arrowMuted')})`} />
    <Tag x={80} y={50} ctx={c}>Break</Tag><Tag x={256} y={190} ctx={c}>Radius 90 cm</Tag>
  </>,
};
