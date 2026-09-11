/**
 * S115-E · INSTRUMENTO 1 — WEBHOOK REPETIDO → UN SOLO DOCUMENTO.
 *
 * QUÉ MIDE: que la idempotencia viva en la BASE. Un webhook que llega dos veces
 * (los proveedores reintentan: es su contrato, no una anomalía) no puede producir
 * dos comprobantes fiscales del mismo pago — ante el SRI eso es facturar dos veces.
 *
 * CÓMO: dentro de una transacción que se DESHACE SOLA, inserta dos documentos con
 * el MISMO `pago_intento_id`. Con `uq_documento_fiscal_pago` el segundo rebota.
 *
 * ROJO PROBADO: el mismo par SIN la unique entra dos veces — se ejerce acá mismo
 * sobre una tabla espejo creada en la propia transacción, para que el rojo no sea
 * una promesa sino una corrida. *Un guard que nunca se vio fallar no está medido.*
 *
 * CONTROL POSITIVO: dos documentos con `pago_intento_id` DISTINTO sí entran — si
 * no entraran, el rebote de arriba no probaría nada sobre la unique (podría estar
 * rebotando por un NOT NULL, un CHECK o un enum).
 *
 * Residuo: 0 — todo ocurre en una transacción abortada, y se verifica después.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

const DOC = (pago, extra = '') =>
  `insert into documentos_fiscales (pago_intento_id, total, sentido, rol, tipo, estado, emitida_por_tercero${extra ? ', ' + extra.split('=')[0] : ''})
   values (${pago}, 10.00, 'emitido', 'venta_cliente', 'factura', 'borrador', false${extra ? ', ' + extra.split('=')[1] : ''})`;

await correr('i01 · webhook repetido → UN documento', async (r) => {
  if (uno(`select to_regclass('public.documentos_fiscales') is null as no`).no)
    noConcluyente('documentos_fiscales no existe todavía — no hay qué medir.');

  const uq = q(`select indexdef from pg_indexes
                where schemaname='public' and indexname='uq_documento_fiscal_pago'`);
  r.dato('índice uq_documento_fiscal_pago', uq.length ? 'presente' : '🔴 AUSENTE');

  // ── El intento sobre el que se prueba: uno REAL y aprobado ─────────────────
  const intento = q(`select id from pagos_intentos where estado='aprobado' order by creado_en desc limit 1`);
  if (!intento.length) noConcluyente('no hay ningún pago aprobado sobre el que probar.');
  const pid = intento[0].id;
  r.dato('pago_intento_id usado', pid);

  // ── (a) CONTROL POSITIVO: dos documentos de pagos DISTINTOS sí entran ──────
  const dos = q(`begin;
    ${DOC(`'${pid}'::uuid`)};
    ${DOC('null')};
    select count(*)::int as n from documentos_fiscales;
    rollback;`);
  const nPositivo = dos[dos.length - 1].n;
  r.dato('control positivo (dos pagos distintos)', `${nPositivo} filas → la inserción funciona`);
  if (nPositivo < 2) rojo(`el control positivo falló: sólo entraron ${nPositivo} documentos. El instrumento no puede distinguir la unique de otro rechazo.`);

  // ── (b) ROJO PROBADO: sin la unique, el par duplicado entra dos veces ──────
  const espejo = q(`begin;
    create temp table espejo_sin_uq (pago_intento_id uuid, total numeric);
    insert into espejo_sin_uq values ('${pid}'::uuid, 10.00), ('${pid}'::uuid, 10.00);
    select count(*)::int as n from espejo_sin_uq;
    rollback;`);
  const nSinUq = espejo[espejo.length - 1].n;
  r.dato('rojo ejercido (misma forma SIN unique)', `${nSinUq} filas → el defecto es reproducible`);
  if (nSinUq !== 2) noConcluyente(`el rojo no se pudo ejercer: la tabla espejo aceptó ${nSinUq} en vez de 2.`);

  // ── (c) LA MEDICIÓN: con la unique, el segundo rebota ──────────────────────
  let rebote = null;
  try {
    q(`begin;
       ${DOC(`'${pid}'::uuid`)};
       ${DOC(`'${pid}'::uuid`)};
       rollback;`);
  } catch (e) {
    rebote = String(e?.message ?? e);
  }
  if (rebote === null)
    rojo(`DOS documentos fiscales entraron para el mismo pago ${pid}. Un webhook reintentado factura dos veces.`);

  const esUnique = /uq_documento_fiscal_pago|duplicate key|23505/i.test(rebote);
  r.dato('rebote', esUnique ? 'uq_documento_fiscal_pago (23505)' : rebote.slice(0, 160));
  if (!esUnique)
    noConcluyente(`rebotó, pero NO por la unique — rebotar no es una medición:\n   ${rebote.slice(0, 300)}`);

  // ── (d) Residuo ───────────────────────────────────────────────────────────
  const resto = uno(`select count(*)::int as n from documentos_fiscales where pago_intento_id = '${pid}'`).n;
  r.dato('residuo del instrumento', `${resto} documentos para ese pago`);
  if (resto !== 0) rojo(`el instrumento dejó ${resto} fila(s): una sonda que deja residuo contamina la medición ajena.`);

  r.di('\n   → la idempotencia del outbox vive en la base, y se la vio rebotar.');
});
