/**
 * S115-E · INSTRUMENTO 16 — EL MÍNIMO MANDA CUANDO CORRESPONDE.
 *
 * QUÉ MIDE: que un ticket chico cobre el MÍNIMO y no el porcentaje, y que el snapshot
 * del evento diga CUÁL de los dos mandó. Sin el snapshot, meses después nadie puede
 * reconstruir por qué un paseo de $5 dejó la comisión que dejó — y una liquidación que
 * no se puede explicar es una liquidación que se discute.
 *
 * EL CASO CANÓNICO: paseo de $5 · 10 % = $0,50 · si el mínimo es mayor, manda el mínimo.
 *
 * ROJO: forzar que ignore el mínimo (calcular sólo el porcentaje) y ver que grita.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

await correr('i16 · el mínimo manda cuando corresponde', async (r) => {
  // ── (a) ¿EXISTE EL MÍNIMO, Y DÓNDE? ─────────────────────────────────────
  /* 🔴 SE BUSCA EN LA COLUMNA **Y** EN LOS PARÁMETROS. La primera versión miró sólo
     `parametros`, no encontró nada y salió NO CONCLUYENTE — mientras el mínimo vivía
     en `fee_configs.minimo_por_transaccion`, una COLUMNA. Detectaba por dos vías y
     leía por una sola: el mismo defecto de alcance de `L-534`. */
  const cols = q(
    `select 1 from pg_attribute where attrelid='public.fee_configs'::regclass
      and attname='minimo_por_transaccion' and not attisdropped`);
  const fn = q(
    `select pg_get_function_identity_arguments(p.oid) as args
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and proname='comision_efectiva'`);
  r.dato('columna del mínimo', cols.length ? 'fee_configs.minimo_por_transaccion ✓' : 'no existe');
  r.dato('función que decide', fn.length ? `comision_efectiva(${fn[0].args})` : 'ninguna');

  if (!cols.length || !fn.length) {
    r.di('\n   ⚠️ El mínimo de comisión todavía no está cableado — no hay regla que verificar.');
    noConcluyente('falta la columna del mínimo o la función que lo aplica.');
  }

  // ── (b) LA CONFIG VIGENTE, leída del objeto y JAMÁS escrita acá ──────────
  const cfg = q(
    `select coalesce(categoria_origen,'(general)') as categoria,
            (parametros->>'pct')::numeric as pct, minimo_por_transaccion as minimo, prioridad
       from fee_configs
      where activo and tipo_origen='cita' and tipo_actor='prestador_servicios'
        and (vigencia_hasta is null or vigencia_hasta > now())
        and vigencia_desde >= '2026-10-01'
      order by prioridad desc, categoria`);
  if (!cfg.length) noConcluyente('no hay ninguna fee_config vigente de cita a partir del 1-oct.');
  r.di('');
  for (const c of cfg) r.dato(`  ${c.categoria}`, `${c.pct} % · mínimo $${c.minimo} · prioridad ${c.prioridad}`);

  const general = cfg.find((c) => c.categoria === '(general)');
  if (!general) noConcluyente('no hay config general (sin categoría) para el caso del paseo.');

  // ── (c) EL CASO CANÓNICO: un paseo de $5 ────────────────────────────────
  const TICKET = 5;
  const pct = Number(general.pct), minimo = Number(general.minimo);
  const porPct = Math.round(TICKET * pct) / 100;
  r.di('');
  r.dato('caso canónico', `paseo de $${TICKET} · ${pct} % = $${porPct.toFixed(2)} · mínimo $${minimo.toFixed(2)}`);
  const debeMandar = porPct < minimo ? 'minimo' : 'porcentaje';
  r.dato('debería mandar', debeMandar);
  if (debeMandar !== 'minimo')
    noConcluyente(`con ${pct} % sobre $${TICKET} el porcentaje ya supera el mínimo: este caso NO discrimina. El instrumento necesita un ticket donde el mínimo mande.`);

  const chico = uno(`select comision_efectiva(${TICKET}, ${pct}, ${minimo}) as r`).r;
  r.dato('comision_efectiva devuelve', JSON.stringify(chico));

  const monto = Number(chico.monto ?? chico.comision ?? chico.valor ?? NaN);
  if (Number.isNaN(monto)) noConcluyente(`la función no devuelve un monto reconocible: ${JSON.stringify(chico)}`);
  if (Math.round(monto * 100) !== Math.round(minimo * 100))
    rojo(`un paseo de $${TICKET} cobró $${monto} en vez del mínimo $${minimo}: el mínimo NO manda.`);

  // ── (d) EL SNAPSHOT DICE CUÁL MANDÓ ─────────────────────────────────────
  const dice = JSON.stringify(chico).toLowerCase();
  const loDeclara = /minim/.test(dice);
  r.dato('el resultado declara cuál mandó', loDeclara ? 'sí ✓' : '🔴 NO');
  if (!loDeclara)
    rojo(`el resultado no dice si mandó el mínimo o el porcentaje: ${JSON.stringify(chico)}.\n   Meses después nadie puede explicar por qué un paseo de $5 dejó esa comisión, y una liquidación que no se puede explicar se discute.`);

  // ── (e) 🔴 ROJO PROBADO: sin mínimo, el mismo ticket cobra el porcentaje ─
  const sinMinimo = uno(`select comision_efectiva(${TICKET}, ${pct}, 0) as r`).r;
  const montoSin = Number(sinMinimo.monto ?? sinMinimo.comision ?? sinMinimo.valor);
  r.di('');
  r.dato('rojo ejercido · el mismo ticket con mínimo 0', `$${montoSin} (el ${pct} % puro) contra $${monto} con el mínimo`);
  if (Math.round(montoSin * 100) === Math.round(monto * 100))
    noConcluyente(`con y sin mínimo devuelve lo MISMO ($${monto}): el instrumento no puede probar que el mínimo cambia el resultado.`);

  // ── (f) Y UN TICKET GRANDE MANDA EL PORCENTAJE, no el mínimo ────────────
  const GRANDE = 100;
  const alto = uno(`select comision_efectiva(${GRANDE}, ${pct}, ${minimo}) as r`).r;
  const montoAlto = Number(alto.monto ?? alto.comision ?? alto.valor);
  const esperadoAlto = Math.round(GRANDE * pct) / 100;
  r.dato(`ticket de $${GRANDE}`, `$${montoAlto} (esperado ${esperadoAlto.toFixed(2)} = ${pct} %)`);
  if (Math.round(montoAlto * 100) !== Math.round(esperadoAlto * 100))
    rojo(`un ticket de $${GRANDE} cobró $${montoAlto} en vez de ${esperadoAlto.toFixed(2)}: el mínimo manda donde NO corresponde.`);

  r.di('\n   → el mínimo manda en el ticket chico, el porcentaje en el grande, y el resultado dice cuál fue.');
});
