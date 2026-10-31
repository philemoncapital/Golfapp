/** HCP display: plus handicaps (negative numbers internally) are shown as "+2.0". */
export const fmtHcp = (h: number | null | undefined) => (h == null ? '–' : h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1));
export const fmtGap = (g: number) => `${g > 0 ? '+' : ''}${g.toFixed(1)}`;
export const locale = (lang: string) => (lang === 'en' ? 'en-GB' : 'de-DE');
export const fmtDate = (iso: string, lang: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(iso).toLocaleDateString(locale(lang), opts);
export const fmtDateTime = (iso: string, lang: string) =>
  new Date(iso).toLocaleString(locale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Monday 00:00 local time of the week containing d. */
export function weekStart(d = new Date()): Date {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x;
}
