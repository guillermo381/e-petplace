/**
 * S115-E · INSTRUMENTO 5 — CARRITO MIXTO: LAS LÍNEAS SUMAN.
 *
 * QUÉ MIDE: que el desglose por línea, redondeado a dos decimales, sume exactamente
 * lo que fue al riel — centavo a centavo. En un carrito mixto (0 % y 15 % juntos)
 * una diferencia de un centavo no rompe nada visible: rompe la conciliación del mes.
 *
 * QUÉ COMPARA, y por qué NO todo contra todo:
 *   · base + IVA por línea  ==  taxable_amount + vat de `totales_fiscales_del_intento`
 *   · subtotal por tarifa   ==  la suma de las líneas de esa tarifa
 *   · con VARIAS tarifas, `tax_percentage` tiene que ser NULL — un promedio de
 *     tarifas no es una tarifa, y el riel no puede declarar una que no existe.
 *
 * 🔴 LA DIVERGENCIA CONOCIDA NO SE REPORTA COMO DEFECTO. La migración (e·2) declara
 * que el catálogo dice EC_IVA_15 para los servicios y los desgloses congelados
 * dicen impuesto = 0 — y que resolverlo es decisión de PRODUCTO, no de migración.
 * Este instrumento la CUENTA y la nombra; no la llama rojo. *Un instrumento que
 * grita sobre una decisión pendiente manda a curar lo que espera una firma.*
 *
 * ROJO PROBADO: una línea con `codigo_iva` NULL tiene que cortar, no salir en 0.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

/* 🔴 EL DINERO SE CUENTA EN CENTAVOS ENTEROS, JAMÁS EN FLOAT.
   La primera versión de este instrumento usó `Math.round(x*100)/100` y produjo un
   ROJO FALSO sobre un motor sano: 15 % de 6,70 es 1,005, que en `numeric` de
   Postgres redondea a 1,01 (half-up) y en float64 cae a 1,00 porque 1.005 no es
   representable. *El rojo era del instrumento.* Acá todo se hace en enteros. */
const cents = (x) => Math.round(Number(x) * 100);          // sólo para leer de la DB
const c2 = (x) => cents(x) / 100;                          // presentación
const ivaEsperadoCent = (baseCent, pct) => {
  // half-up sobre enteros: (base * pct + 50·escala) / 100, sin float intermedio
  const num = baseCent * Number(pct);                      // centavos × porcentaje
  return Math.floor((num + 50) / 100);                     // /100 con redondeo half-up
};

await correr('i05 · carrito mixto · las líneas suman', async (r) => {
  if (uno(`select to_regclass('public.pagos_desglose_lineas') is null as no`).no)
    noConcluyente('pagos_desglose_lineas no existe todavía.');

  // ── (a) ¿Hay líneas escritas? ─────────────────────────────────────────────
  const escritas = uno(`select count(*)::int as n from pagos_desglose_lineas`).n;
  r.dato('líneas escritas hoy', `${escritas}`);

  // ── (b) EL SUJETO: un pago de COMPRA, que es el único con líneas REALES ───
  // (los servicios no llevan IVA en el catálogo de precios: su desglose es el
  //  agregado, no líneas por ítem — por eso la prueba de suma se hace acá.)
  const candidatos = q(
    `select pi.id, pi.monto, pi.compra_id, pi.pedido_id,
            (select count(*) from pedido_items it join pedidos p on p.id=it.pedido_id
              where (pi.compra_id is not null and p.compra_id=pi.compra_id)
                 or (pi.compra_id is null and p.id=pi.pedido_id))::int as items,
            (select count(distinct it.impuesto_codigo) from pedido_items it join pedidos p on p.id=it.pedido_id
              where (pi.compra_id is not null and p.compra_id=pi.compra_id)
                 or (pi.compra_id is null and p.id=pi.pedido_id))::int as tarifas
       from pagos_intentos pi
      where pi.estado='aprobado' and (pi.compra_id is not null or pi.pedido_id is not null)
      order by 6 desc, 5 desc limit 5`);
  if (!candidatos.length) noConcluyente('no hay ningún pago aprobado de compra sobre el que medir.');

  const mixto = candidatos.find((c) => c.tarifas > 1);
  const sujeto = mixto ?? candidatos[0];
  r.dato('sujeto', `${sujeto.id} · ${sujeto.items} ítem(s) · ${sujeto.tarifas} tarifa(s) · $${sujeto.monto}`);
  if (!mixto) r.di('   ⚠️ NO hay ningún pago con DOS tarifas distintas: el caso "mixto" se mide sobre un carrito de una sola tarifa.\n      Lo que NO queda medido: la suma cruzada de 0 % y 15 % en el mismo pago.');

  // ── (c) Escribir las líneas en txn abortada y medir la suma ───────────────
  /* 🔴 UNA SOLA SENTENCIA FINAL, no cuatro: el CLI devuelve ÚNICAMENTE el último
     resultset de un lote multi-statement. Partirlo en cuatro SELECT devolvía sólo
     las filas y perdía los dos jsonb — el instrumento salía NO CONCLUYENTE por su
     propia forma, no por el motor. */
  const sql = `begin;
    select public.escribir_lineas_del_intento('${sujeto.id}'::uuid);
    select jsonb_build_object(
      'totales',    public.totales_fiscales_del_intento('${sujeto.id}'::uuid),
      'reconcilia', public.reconciliar_lineas_con_congelado('${sujeto.id}'::uuid),
      'lineas',     (select jsonb_agg(jsonb_build_object(
                        'linea', linea, 'descripcion', descripcion, 'cantidad', cantidad,
                        'precio_unitario', precio_unitario, 'codigo_iva', codigo_iva,
                        'tarifa_pct', tarifa_pct, 'base', base, 'valor_iva', valor_iva)
                      order by linea)
                     from pagos_desglose_lineas where pago_intento_id='${sujeto.id}'::uuid)
    ) as r;
    rollback;`;
  let filas;
  try { filas = q(sql); }
  catch (e) { noConcluyente(`no se pudo derivar el desglose: ${String(e?.message ?? e).slice(0, 350)}`); }

  const paquete = filas.find((f) => f && f.r)?.r;
  if (!paquete) noConcluyente('la consulta no devolvió el paquete de medición.');
  const totales = paquete.totales;
  const rec = paquete.reconcilia;
  const lineas = paquete.lineas ?? [];
  if (!totales) noConcluyente('totales_fiscales_del_intento no devolvió nada.');
  if (!lineas.length) noConcluyente('no se escribió ninguna línea para el sujeto.');

  r.di(`\n   líneas derivadas (${lineas.length}):`);
  for (const l of lineas)
    r.dato(`  ${l.linea}`, `${String(l.descripcion).slice(0, 34).padEnd(34)} ${l.cantidad}×${l.precio_unitario} · ${l.codigo_iva ?? '(sin código)'} ${l.tarifa_pct}% · base ${l.base} · iva ${l.valor_iva}`);

  // ── (d) LA SUMA, centavo a centavo ───────────────────────────────────────
  const sumaBaseC = lineas.reduce((a, l) => a + cents(l.base), 0);
  const sumaIvaC  = lineas.reduce((a, l) => a + cents(l.valor_iva), 0);
  const tBaseC = cents(totales.taxable_amount), tIvaC = cents(totales.vat), tTotalC = cents(totales.total);
  const sumaBase = sumaBaseC / 100, sumaIva = sumaIvaC / 100;
  const tBase = tBaseC / 100, tIva = tIvaC / 100, tTotal = tTotalC / 100;

  r.di('');
  r.dato('Σ base de las líneas', `${sumaBase}   vs taxable_amount ${tBase}`);
  r.dato('Σ IVA de las líneas', `${sumaIva}   vs vat ${tIva}`);
  r.dato('base + IVA', `${(sumaBaseC + sumaIvaC) / 100}   vs total ${tTotal}`);

  if (sumaBaseC !== tBaseC) rojo(`la base no cierra: las líneas suman ${sumaBase} y taxable_amount dice ${tBase} (${(sumaBaseC - tBaseC)} centavo(s)).`);
  if (sumaIvaC !== tIvaC)   rojo(`el IVA no cierra: las líneas suman ${sumaIva} y vat dice ${tIva} (${(sumaIvaC - tIvaC)} centavo(s)).`);
  if (sumaBaseC + sumaIvaC !== tTotalC) rojo(`base + IVA (${(sumaBaseC + sumaIvaC) / 100}) ≠ total (${tTotal}).`);

  // ── (e) Subtotales POR TARIFA ────────────────────────────────────────────
  /* El IVA esperado se calcula LÍNEA POR LÍNEA y después se suma — que es como lo
     calcula el motor. Calcularlo sobre la base agregada da otro número cuando hay
     varias líneas, y esa diferencia no es un defecto: es la pregunta abierta al
     contador (redondeo por línea vs sobre el total), que nadie firmó todavía. */
  const porTarifa = {};
  for (const l of lineas) {
    const k = String(l.tarifa_pct);
    porTarifa[k] = porTarifa[k] ?? { baseC: 0, ivaC: 0, espC: 0, n: 0 };
    const bC = cents(l.base);
    porTarifa[k].baseC += bC;
    porTarifa[k].ivaC  += cents(l.valor_iva);
    porTarifa[k].espC  += ivaEsperadoCent(bC, l.tarifa_pct);
    porTarifa[k].n++;
  }
  r.di('');
  for (const [pct, v] of Object.entries(porTarifa)) {
    r.dato(`subtotal ${pct}%`, `${v.n} línea(s) · base ${v.baseC / 100} · IVA ${v.ivaC / 100} (esperado por línea: ${v.espC / 100})`);
    if (v.ivaC !== v.espC)
      rojo(`el IVA del ${pct}% no cierra: el motor dice ${v.ivaC / 100} y línea por línea da ${v.espC / 100} (${(v.ivaC - v.espC)} centavo(s) de diferencia).`);

    // Informativo, no rojo: el otro criterio de redondeo — la pregunta al contador.
    const sobreTotal = ivaEsperadoCent(v.baseC, pct);
    if (sobreTotal !== v.espC)
      r.di(`      ⓘ redondeando SOBRE EL TOTAL daría ${sobreTotal / 100} en vez de ${v.espC / 100}.\n         Cuál de los dos rige es la pregunta al contador que la cabecera de _shared/iva.ts declara abierta.`);
  }

  // ── (f) tax_percentage con varias tarifas tiene que ser NULL ─────────────
  r.di('');
  r.dato('tarifas distintas', `${totales.tarifas_distintas}`);
  r.dato('tax_percentage', `${totales.tax_percentage ?? 'NULL'}`);
  if (totales.tarifas_distintas > 1 && totales.tax_percentage !== null)
    rojo(`con ${totales.tarifas_distintas} tarifas el riel declara tax_percentage = ${totales.tax_percentage}. Un promedio de tarifas no es una tarifa.`);
  if (totales.tarifas_distintas === 1 && totales.tax_percentage === null)
    rojo('con UNA sola tarifa el tax_percentage salió NULL: el riel puede declararla y no la declara.');

  // ── (g) La reconciliación contra el congelado ────────────────────────────
  r.di('');
  r.dato('reconciliación', `líneas ${rec?.lineas_total} vs monto ${rec?.monto_intento} · cuadra=${rec?.cuadra}${rec?.motivo ? ` · ${rec.motivo}` : ''}`);
  if (rec && rec.cuadra === false && rec.motivo === 'tarifa_del_catalogo_no_coincide_con_el_congelado')
    r.di(`   ⚠️ DIVERGENCIA CONOCIDA, no defecto: la migración (e·2) la declara y la deja sonar a propósito.\n      Diferencia ${rec.diferencia}. Resolverla es decisión de PRODUCTO (precio bruto vs IVA sumado), no de este instrumento.`);
  else if (rec && rec.cuadra === false)
    rojo(`el desglose no cuadra con el monto cobrado por un motivo NO declarado: ${rec.motivo} (diferencia ${rec.diferencia}).`);

  // ── (h) ROJO PROBADO: una línea sin codigo_iva no puede salir en 0 ───────
  let corto = null;
  try {
    q(`begin;
       insert into pagos_desglose_lineas
         (pago_intento_id, linea, descripcion, cantidad, precio_unitario, descuento,
          codigo_iva, tarifa_pct, base, valor_iva, origen_tipo)
       values ('${sujeto.id}'::uuid, 99, 'sonda sin codigo', 1, 10, 0, null, null, 10, 0, 'sonda');
       rollback;`);
  } catch (e) { corto = String(e?.message ?? e); }
  r.di('');
  r.dato('rojo ejercido · línea con codigo_iva NULL', corto === null
    ? '⚠️ la BASE la acepta (el corte, si existe, vive en pagos-cobro)'
    : `la base la rechaza: ${corto.slice(0, 110)}`);
  if (corto === null)
    r.di('   ⚠️ NO MEDIDO ACÁ: que `pagos-cobro` corte con código propio ante una línea sin tarifa.\n      Ese corte vive en la edge y exige ejercerla; queda declarado, no dado por bueno.');

  // ── (i) Residuo ─────────────────────────────────────────────────────────
  const resto = uno(`select count(*)::int as n from pagos_desglose_lineas where pago_intento_id='${sujeto.id}'::uuid`).n;
  r.dato('residuo del instrumento', `${resto} línea(s)`);
  if (resto !== 0) rojo(`el instrumento dejó ${resto} línea(s) escritas.`);

  r.di('\n   → las líneas suman centavo a centavo lo que va al riel.');
});
