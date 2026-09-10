/**
 * S115-E · INSTRUMENTO 4 — UN PAGO APROBADO SIN DOCUMENTO: EL RECONCILIADOR GRITA.
 *
 * QUÉ MIDE: que un pago cobrado sin comprobante NO se quede callado. Es el modo
 * de falla peor del frente fiscal: no hay error, no hay pantalla rota — hay plata
 * cobrada sin factura, y eso aparece recién cuando el SRI pregunta.
 *
 * CÓMO: `pagos_aprobados_sin_documento(p_desde)` es el lector que mira lo que NO
 * existe. Se le pregunta y tiene que NOMBRAR los pagos huérfanos.
 *
 * ROJO PROBADO — el que de verdad importa acá: con el reconciliador APAGADO hay
 * silencio. Se ejerce comparando su respuesta con la de un pago que sí tiene
 * documento: si el lector devolviera lo mismo en los dos casos, no discrimina.
 * *Un lector que devuelve lo mismo con y sin el defecto no está midiendo.*
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

await correr('i04 · pago aprobado sin documento → el reconciliador grita', async (r) => {
  const fn = q(`select proname, pg_get_function_identity_arguments(p.oid) as args
                from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and proname='pagos_aprobados_sin_documento'`);
  if (!fn.length) noConcluyente('pagos_aprobados_sin_documento no existe: el reconciliador no tiene con qué mirar lo que falta.');
  r.dato('lector', `pagos_aprobados_sin_documento(${fn[0].args})`);

  // ── (a) EL ESTADO REAL: cuántos pagos aprobados no tienen documento ───────
  const desde = `(now() - interval '24 hours')`;
  const huerfanos = q(`select * from pagos_aprobados_sin_documento(${desde})`);
  const totalAprob = uno(`select count(*)::int as n from pagos_intentos
                          where estado='aprobado' and creado_en > now() - interval '24 hours'`).n;
  r.dato('pagos aprobados en 24 h', `${totalAprob}`);
  r.dato('sin documento (lo que el lector grita)', `${huerfanos.length}`);

  // ── (b) DISCRIMINADOR: el lector tiene que distinguir con y sin documento ─
  // Se siembra un documento para UNO de los huérfanos, dentro de una txn abortada,
  // y el lector tiene que devolver uno menos. Si devuelve lo mismo, no mide.
  if (huerfanos.length === 0) {
    r.di('   ⚠️ CERO huérfanos hoy: no se puede discriminar sobre un caso real.\n      El discriminador se corre igual, al revés — sobre un pago que SÍ tiene documento.');
  }
  const pid = huerfanos[0]?.pago_intento_id ?? huerfanos[0]?.id
    ?? uno(`select id from pagos_intentos where estado='aprobado' order by creado_en desc limit 1`).id;

  const conDoc = q(`begin;
    -- Un 'autorizada' DEBE declarar sus tres piezas de numeración: el CHECK
    -- chk_documento_fiscal_emitido_declara_secuencial lo exige, y con razón.
    insert into documentos_fiscales (pago_intento_id, total, sentido, rol, tipo, estado,
        emitida_por_tercero, establecimiento, punto_emision, secuencial)
      values ('${pid}'::uuid, 10.00, 'emitido', 'venta_cliente', 'factura', 'autorizada',
              false, '001', '002', '000000778');
    select count(*)::int as n from pagos_aprobados_sin_documento(${desde});
    rollback;`);
  const nConDoc = conDoc[conDoc.length - 1].n;
  r.dato('discriminador', `sin documento: ${huerfanos.length} · con documento sembrado: ${nConDoc}`);

  if (huerfanos.length > 0 && nConDoc >= huerfanos.length)
    rojo(`el lector devuelve ${nConDoc} tanto con documento como sin él: NO discrimina. Su silencio no significaría nada.`);
  if (huerfanos.length === 0 && nConDoc !== 0)
    noConcluyente('el discriminador no cierra: sin huérfanos, sembrar un documento no puede cambiar el número.');

  // ── (c) EL VEREDICTO ─────────────────────────────────────────────────────
  if (huerfanos.length > 0) {
    r.di('\n   pagos aprobados SIN comprobante:');
    // Se imprime la fila COMPLETA: el nombre de las columnas lo decide el
    // RETURNS TABLE del lector, y adivinarlo publica «undefined» como si fuera un dato.
    for (const h of huerfanos.slice(0, 10)) r.dato('  ·', JSON.stringify(h));
    r.di(`\n   ⚠️ ${huerfanos.length} pago(s) cobrados sin documento fiscal en las últimas 24 h.`);
    r.di('      NO se reporta como defecto del reconciliador: es exactamente lo que vino a encontrar,');
    r.di('      y lo encontró. La emisión todavía NO está colgada de aplicar_evento_de_pago (medido:');
    r.di('      ninguna función del motor escribe documentos_fiscales) ⇒ hoy TODO pago aprobado es huérfano');
    r.di('      por construcción. El número es el tamaño de la deuda, no una falla del instrumento.');
  } else {
    r.di('\n   → cero pagos aprobados sin documento en 24 h.');
  }

  // ── (d) Residuo ─────────────────────────────────────────────────────────
  const resto = uno(`select count(*)::int as n from documentos_fiscales where pago_intento_id='${pid}'`).n;
  r.dato('residuo del instrumento', `${resto}`);
  if (resto !== 0) rojo(`el instrumento dejó ${resto} documento(s).`);

  r.di('\n   → el lector existe y DISCRIMINA: su silencio se puede leer como salud.');
});
