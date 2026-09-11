/**
 * S115-E · INSTRUMENTO 6 — LA FACHADA NO FACTURA.
 *
 * QUÉ MIDE: que un pago de una cuenta `marketplace_fachada` NO produzca una factura
 * de Satori. En fachada el que factura es el tercero: emitir nosotros sería
 * facturar una venta que no hicimos — y facturarla dos veces entre los dos.
 *
 * CÓMO: se dispara el outbox REAL (`_trg_pago_aprobado_outbox_fiscal`, un trigger
 * sobre la transición a `aprobado`) dentro de una transacción abortada, con la
 * cuenta en un modelo y en el otro.
 *
 * ROJO / CONTROL POSITIVO — son la misma corrida: el MISMO pago con la cuenta en
 * `reventa_pura` SÍ tiene que producir la factura. Si los dos modelos dieran el
 * mismo resultado, el instrumento no estaría midiendo el modelo sino otra cosa.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

/** Dispara el outbox de verdad: pone el intento en `aprobado` desde otro estado. */
function emitirCon(modelo, intento, cuenta) {
  const filas = q(`begin;
    update cuentas_comerciales set modelo_comercial = '${modelo}' where id = '${cuenta}'::uuid;
    update pagos_intentos set estado = 'pendiente' where id = '${intento}'::uuid;
    delete from documentos_fiscales where pago_intento_id = '${intento}'::uuid;
    update pagos_intentos set estado = 'aprobado' where id = '${intento}'::uuid;
    select coalesce(jsonb_agg(jsonb_build_object(
             'sentido', sentido, 'rol', rol, 'estado', estado,
             'emitida_por_tercero', emitida_por_tercero, 'motivo', motivo_rechazo,
             'total', total)), '[]'::jsonb) as docs
      from documentos_fiscales where pago_intento_id = '${intento}'::uuid;
    rollback;`);
  return filas[filas.length - 1].docs;
}

await correr('i06 · la fachada no factura', async (r) => {
  const trg = q(`select tgname from pg_trigger where tgname ~ 'outbox_fiscal' and not tgisinternal`);
  if (!trg.length) noConcluyente('el trigger del outbox fiscal no existe: no hay emisión automática que medir.');
  r.dato('outbox', trg.map((t) => t.tgname).join(', '));

  // Un pago aprobado que se pueda atribuir a una cuenta comercial.
  const cand = q(
    `select pi.id, pi.monto,
            coalesce(
              (select p.cuenta_comercial_id from pedidos p
                where (pi.compra_id is not null and p.compra_id=pi.compra_id)
                   or (pi.compra_id is null and p.id=pi.pedido_id) limit 1),
              (select pr.cuenta_comercial_id from evento_cita_servicio c
                 join prestadores pr on pr.id=c.prestador_id where c.id=pi.cita_id)
            ) as cuenta
       from pagos_intentos pi
      where pi.estado='aprobado'
      order by pi.creado_en desc limit 20`);
  const sujeto = cand.find((c) => c.cuenta);
  if (!sujeto) noConcluyente('ningún pago aprobado se puede atribuir a una cuenta comercial: no hay caso.');
  const modeloOriginal = uno(`select modelo_comercial::text as m from cuentas_comerciales where id='${sujeto.cuenta}'`).m;
  r.dato('sujeto', `pago ${sujeto.id} · $${sujeto.monto} · cuenta ${sujeto.cuenta} (hoy ${modeloOriginal})`);

  // ── (a) FACHADA ──────────────────────────────────────────────────────────
  const fachada = emitirCon('marketplace_fachada', sujeto.id, sujeto.cuenta);
  r.di('\n   marketplace_fachada:');
  for (const d of fachada) r.dato('  ·', JSON.stringify(d));
  if (fachada.length !== 1)
    rojo(`en fachada se produjeron ${fachada.length} documentos, se esperaba exactamente 1.`);
  const f = fachada[0];
  if (f.sentido !== 'recibido' || f.rol !== 'factura_tercero_cliente' || f.estado !== 'pendiente_manual')
    rojo(`en fachada el documento no es «recibido · factura_tercero_cliente · pendiente_manual»: es «${f.sentido} · ${f.rol} · ${f.estado}». Facturar acá sería facturar una venta que no hicimos.`);
  if (f.emitida_por_tercero !== true)
    rojo(`en fachada el documento no está marcado emitida_por_tercero.`);
  const emitidasSatori = fachada.filter((d) => d.sentido === 'emitido');
  if (emitidasSatori.length) rojo(`en fachada se emitieron ${emitidasSatori.length} factura(s) de Satori.`);
  r.dato('  factura de Satori', '0 ✓');

  // ── (b) CONTROL POSITIVO Y ROJO A LA VEZ: reventa_pura SÍ factura ────────
  const reventa = emitirCon('reventa_pura', sujeto.id, sujeto.cuenta);
  r.di('\n   reventa_pura (control positivo):');
  for (const d of reventa) r.dato('  ·', JSON.stringify(d));
  if (reventa.length !== 1) rojo(`en reventa se produjeron ${reventa.length} documentos, se esperaba 1.`);
  const v = reventa[0];
  if (v.sentido !== 'emitido' || v.rol !== 'venta_cliente')
    noConcluyente(`en reventa el documento tampoco es una venta de Satori («${v.sentido} · ${v.rol}»): el instrumento no puede atribuirle a la FACHADA lo de arriba.`);
  r.dato('  factura de Satori', `1 ✓ (${v.estado})`);

  // ── (c) Residuo ─────────────────────────────────────────────────────────
  const modeloAhora = uno(`select modelo_comercial::text as m from cuentas_comerciales where id='${sujeto.cuenta}'`).m;
  const docs = uno(`select count(*)::int as n from documentos_fiscales where pago_intento_id='${sujeto.id}'`).n;
  const estadoAhora = uno(`select estado from pagos_intentos where id='${sujeto.id}'`).estado;
  r.di('');
  r.dato('residuo · modelo de la cuenta', `${modeloAhora} (era ${modeloOriginal})`);
  r.dato('residuo · documentos', `${docs}`);
  r.dato('residuo · estado del pago', `${estadoAhora}`);
  if (modeloAhora !== modeloOriginal) rojo(`el instrumento dejó la cuenta en ${modeloAhora}.`);
  if (docs !== 0) rojo(`el instrumento dejó ${docs} documento(s).`);
  if (estadoAhora !== 'aprobado') rojo(`el instrumento dejó el pago en ${estadoAhora}.`);

  r.di('\n   → la fachada NO emite factura de Satori, y la reventa SÍ: el modelo es lo que decide.');
});
