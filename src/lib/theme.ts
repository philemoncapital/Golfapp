/** Pastel accents (section 11, revised). Each has a second gradient stop. Old saturated accents map to the nearest pastel. */
export const ACCENTS = ['#9BE3C3', '#A2D8FF', '#FFC0A3', '#D9C5FF'];
const SECOND: Record<string, string> = { '#9BE3C3': '#A2D8FF', '#A2D8FF': '#D9C5FF', '#FFC0A3': '#FFDDA0', '#D9C5FF': '#FFC0D9' };
const LEGACY: Record<string, string> = { '#3DFFA2': '#9BE3C3', '#2FD6F5': '#A2D8FF', '#FF6B4A': '#FFC0A3', '#FFD23F': '#FFC0A3' };
export const normalizeAccent = (a: string | undefined) => { const u = (a ?? '').toUpperCase(); return LEGACY[u] ?? (ACCENTS.includes(u) ? u : ACCENTS[0]); };

export function applyAccent(a: string | undefined) {
  const acc = normalizeAccent(a);
  const st = document.documentElement.style;
  st.setProperty('--accent', acc);
  st.setProperty('--accent-2', SECOND[acc]);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(acc.slice(i, i + 2), 16));
  st.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.14)`);
}
