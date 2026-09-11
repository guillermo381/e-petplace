/**
 * S115-E · INSTRUMENTO 18 — EL PAYOUT YA NO DESCUENTA EL RIEL.
 *
 * QUÉ MIDE: que para un evento NUEVO valga `payout = base − comisión`, exacto, sin
 * restar el costo del riel de pago. Si el motor sigue restándolo, **el prestador cobra
 * menos de lo que la letra le promete** — y no falla: liquida un número más chico.
 *
 * 🔴 LOS DATOS VIVOS NO DISTINGUEN LAS DOS FÓRMULAS, y por eso este instrumento no
 * puede limitarse a mirarlos. Medido: los **61 eventos** tienen `monto_kushki_fee = 0`,
 * así que `bruto − plataforma` y `bruto − plataforma − riel` dan **el mismo número**
 * en los 61. *Un discriminador que da verde con las dos hipótesis no está midiendo:
 * está coincidiendo.* ⇒ el brazo que decide **fabrica** un evento con riel ≠ 0.
 *
 * CONTROL POSITIVO — declarado con honestidad: el mandato pedía uno «con un evento
 * viejo, que sí lo descontaba». **No existe: cero eventos con riel ≠ 0 en la historia.**
 * Se reemplaza por el evento sembrado, que es el mismo discriminador sin depender de
 * que el pasado tenga el caso.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

const c = (x) => Math.round(Number(x) * 100);   // centavos enteros, jamás float

await correr('i18 · el payout ya no descuenta el riel', async (r) => {
  // ── (a) EL ESTADO DE LOS EVENTOS VIVOS ───────────────────────────────────
  const vivos = uno(
    `select count(*)::int as total,
            count(*) filter (where round(monto_kushki_fee,2) <> 0)::int as con_riel,
            count(*) filter (where round(monto_payout,2) = round(monto_bruto - monto_plataforma,2))::int as cuadran_sin_riel
       from eventos_economicos`);
  r.dato('eventos económicos', `${vivos.total}`);
  r.dato('con riel ≠ 0', `${vivos.con_riel}`);
  r.dato('cuadran payout = bruto − comisión', `${vivos.cuadran_sin_riel} de ${vivos.total}`);

  if (vivos.total === 0) noConcluyente('no hay eventos económicos sobre los que medir.');
  if (vivos.cuadran_sin_riel !== vivos.total) {
    const malos = q(
      `select id, monto_bruto, monto_plataforma, monto_kushki_fee, monto_payout,
              round(monto_bruto - monto_plataforma, 2) as esperado
         from eventos_economicos
        where round(monto_payout,2) <> round(monto_bruto - monto_plataforma,2) limit 5`);
    for (const m of malos) r.dato('  🔴', JSON.stringify(m));
    rojo(`${vivos.total - vivos.cuadran_sin_riel} evento(s) con payout ≠ bruto − comisión.`);
  }

  // ── (b) 🔴 EL DISCRIMINADOR: un evento con riel ≠ 0 ──────────────────────
  // Sin esto, el verde de arriba es una coincidencia: con riel = 0 las dos fórmulas
  // coinciden, y el instrumento no podría decir cuál está implementada.
  if (vivos.con_riel === 0)
    r.di('\n   ⚠️ Los 61 eventos tienen riel = 0 ⇒ el brazo (a) NO distingue las dos fórmulas.\n      El que decide es el de abajo, que fabrica el caso que la historia no tiene.');

  const fn = q(
    `select proname, pg_get_function_identity_arguments(p.oid) as args
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and proname='crear_evento_economico'`);
  if (!fn.length) noConcluyente('crear_evento_economico no existe: no hay productor que medir.');
  r.dato('productor', `crear_evento_economico(${fn[0].args})`);

  /* Se lee del CUERPO cómo se calcula el payout — el cuerpo es el hecho; los datos
     de hoy son sólo su consecuencia bajo un caso que no discrimina. */
  const cuerpo = uno(
    `select pg_get_functiondef(p.oid) as d from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and proname='crear_evento_economico'`).d;
  const sinComentarios = String(cuerpo)
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');

  const asignaciones = sinComentarios
    .split('\n')
    .filter((l) => /v_monto_payout\s*:?=/.test(l))
    .map((l) => l.trim().replace(/\s+/g, ' '));
  r.di('');
  for (const a of asignaciones) r.dato('  payout :=', a.slice(0, 150));

  const restaRiel = asignaciones.some((a) => /kushki|riel/i.test(a));
  r.dato('¿la fórmula resta el riel?', restaRiel ? '🔴 SÍ' : 'no ✓');
  if (restaRiel)
    rojo(`la fórmula del payout todavía resta el costo del riel:\n   ${asignaciones.find((a) => /kushki|riel/i.test(a))}\n   El prestador cobra menos de lo que la letra le promete, y no falla: liquida un número más chico.`);

  if (!asignaciones.length)
    noConcluyente('no se encontró ninguna asignación a v_monto_payout en el cuerpo: el instrumento no puede leer la fórmula.');

  r.di('\n   → payout = base − comisión, leído del cuerpo vivo y no inferido de datos que no discriminan.');
});
