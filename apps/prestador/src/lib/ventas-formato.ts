/**
 * Formato local del módulo de ventas — SOLO lo que el riel todavía no da:
 * horas locales de un timestamptz y recortes de horas SQL. Las FECHAS van
 * por `fechaCortaMono` del riel y la PLATA por `monto` del riel (D-448) —
 * acá no se formatea ninguna de las dos.
 *
 * `toISOString` corre el día en UTC-5 (hallazgo harness S55): todo lo de
 * acá resuelve en HORA LOCAL con Intl, como `hoyLocalISO` de la casa.
 */

export function hoyLocalISO(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

/** '2026-08-12T14:00:00+00:00' → '14:00' en hora local del aparato. */
export function horaCorta(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/** La fecha LOCAL (yyyy-mm-dd) de un timestamptz. */
export function fechaLocalISO(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA').format(d);
}

/** 'HH:MM:SS' de Postgres → 'HH:MM'. No toca lo que no matchea. */
export function horaDeSql(hora: string): string {
  const m = /^(\d{2}:\d{2})/.exec(hora);
  return m ? m[1] : hora;
}
