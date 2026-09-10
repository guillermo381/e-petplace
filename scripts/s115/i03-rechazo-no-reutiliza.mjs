/**
 * S115-E · INSTRUMENTO 3 — UN RECHAZO NO DEVUELVE EL SECUENCIAL.
 *
 * QUÉ MIDE: que un documento `no_autorizada` conserve su número y el siguiente
 * tome n+1. Reutilizar el secuencial de un rechazo es peor que dejar el hueco:
 * el hueco se explica, dos comprobantes con el mismo número no.
 *
 * CÓMO: contador de PRUEBA propio (el real no se toca), tres tomas con un rechazo
 * en el medio, todo en transacción abortada.
 *
 * ROJO PROBADO — dos brazos, porque son dos defectos distintos:
 *   (a) reutilizar: se intenta insertar DOS documentos emitidos con el mismo
 *       secuencial; `uq_documento_fiscal_secuencial` tiene que rebotar. Y el mismo
 *       par se ejerce en una tabla espejo SIN la unique, donde sí entra.
 *   (b) retroceder: el contador después de un rechazo tiene que quedar donde estaba,
 *       no volver atrás.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

const RUC = '9999999999002', EST = '998', PTO = '998';
const doc = (sec, estado) =>
  `insert into documentos_fiscales (total, sentido, rol, tipo, estado, emitida_por_tercero,
      establecimiento, punto_emision, secuencial)
   values (10.00,'emitido','venta_cliente','factura','${estado}',false,'${EST}','${PTO}','${sec}')`;

await correr('i03 · un rechazo no devuelve el secuencial', async (r) => {
  if (!q(`select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
          where n.nspname='public' and proname='tomar_secuencial_fiscal'`).length)
    noConcluyente('tomar_secuencial_fiscal no existe.');

  const uq = q(`select indexdef from pg_indexes where schemaname='public'
                and indexname='uq_documento_fiscal_secuencial'`);
  r.dato('uq_documento_fiscal_secuencial', uq.length ? 'presente' : '🔴 AUSENTE');

  // ── (a) ROJO PROBADO: sin la unique, dos emitidos comparten número ────────
  const espejo = q(`begin;
    create temp table sin_uq (est text, pto text, sec text, tipo text);
    insert into sin_uq values ('${EST}','${PTO}','000000001','factura'), ('${EST}','${PTO}','000000001','factura');
    select count(*)::int as n from sin_uq; rollback;`);
  r.dato('rojo ejercido (dos emitidos, mismo secuencial, SIN unique)', `${espejo[espejo.length - 1].n} filas`);
  if (espejo[espejo.length - 1].n !== 2) noConcluyente('el rojo no se pudo ejercer.');

  // ── (b) LA MEDICIÓN: con la unique, el segundo rebota ────────────────────
  let rebote = null;
  try { q(`begin; ${doc('000000001', 'autorizada')}; ${doc('000000001', 'no_autorizada')}; rollback;`); }
  catch (e) { rebote = String(e?.message ?? e); }
  if (rebote === null)
    rojo('DOS documentos emitidos comparten el mismo secuencial. Dos comprobantes con el mismo número no se explican.');
  const porUq = /uq_documento_fiscal_secuencial|23505|duplicate key/i.test(rebote);
  r.dato('dos emitidos con el mismo secuencial', porUq ? 'rebota (uq_documento_fiscal_secuencial)' : rebote.slice(0, 140));
  if (!porUq) noConcluyente(`rebotó por otra causa: ${rebote.slice(0, 250)}`);

  // ── (c) EL CONTADOR NO RETROCEDE TRAS UN RECHAZO ─────────────────────────
  q(`insert into fiscal_sequences (ruc, establecimiento, punto_emision, tipo_documento)
     values ('${RUC}','${EST}','${PTO}','factura') on conflict do nothing`);
  try {
    const corrida = q(`begin;
      -- tres tomas: la del medio "se rechaza" (queda no_autorizada y NO libera el número)
      select tomar_secuencial_fiscal('${RUC}','${EST}','${PTO}','factura') as a;
      select tomar_secuencial_fiscal('${RUC}','${EST}','${PTO}','factura') as b;
      ${doc('000000002', 'no_autorizada')};
      select tomar_secuencial_fiscal('${RUC}','${EST}','${PTO}','factura') as c;
      -- 🔴 LA TOMA SIGUIENTE VA ADENTRO DE ESTA MISMA TRANSACCIÓN. Medirla en un
      --    BEGIN aparte devolvía 000000001 —el rollback había reseteado el
      --    contador— y el instrumento publicaba «nunca reutiliza» sin haberlo
      --    medido: una afirmación cierta por casualidad sobre una corrida que no
      --    era la que decía ser.
      select tomar_secuencial_fiscal('${RUC}','${EST}','${PTO}','factura') as d;
      select jsonb_build_object(
        'ultimo', (select ultimo_secuencial from fiscal_sequences
                    where ruc='${RUC}' and establecimiento='${EST}' and punto_emision='${PTO}' and tipo_documento='factura'),
        'rechazado_conserva', (select secuencial from documentos_fiscales
                    where establecimiento='${EST}' and punto_emision='${PTO}' and estado='no_autorizada'),
        'siguiente', (select ultimo_secuencial from fiscal_sequences
                    where ruc='${RUC}' and establecimiento='${EST}' and punto_emision='${PTO}' and tipo_documento='factura')
      ) as fin;
      rollback;`);
    const fin = corrida[corrida.length - 1].fin;
    r.di('');
    r.dato('tras 4 tomas con un rechazo en el medio', `contador = ${fin.ultimo} (2ª rechazada)`);
    r.dato('el rechazado conserva su número', `${fin.rechazado_conserva}`);

    if (Number(fin.ultimo) !== 4)
      rojo(`el contador quedó en ${fin.ultimo} después de cuatro tomas: un rechazo devolvió numeración.`);
    if (fin.rechazado_conserva !== '000000002')
      rojo(`el documento rechazado no conserva su secuencial (dice ${fin.rechazado_conserva}).`);

    // La toma posterior al rechazo avanzó a 4: nunca volvió al 2.
    r.dato('toma posterior al rechazo', `contador ${fin.siguiente} — no volvió al 000000002`);
    if (Number(fin.siguiente) <= 2)
      rojo(`el contador volvió a ${fin.siguiente}: se reutilizó el número del rechazo.`);
  } finally {
    q(`delete from fiscal_sequences where ruc='${RUC}'`);
    const resto = uno(`select count(*)::int as n from fiscal_sequences where ruc='${RUC}'`).n;
    const docs = uno(`select count(*)::int as n from documentos_fiscales where establecimiento='${EST}'`).n;
    r.dato('residuo', `${resto} contador(es) · ${docs} documento(s)`);
    if (resto !== 0 || docs !== 0) console.log(`   ⚠️ residuo: ${resto} contadores, ${docs} documentos`);
  }

  r.di('\n   → el rechazo conserva su número y el siguiente toma n+1: el hueco se explica, el duplicado no.');
});
