// ═══════════════════════════════════════════════════════════════════════════
// S95-E · BLOQUE 8 — EL GATE DE ESTA TANDA
//
// No hay pantallas, así que no hay gate en dispositivo. Su equivalente es
// éste: **los wrappers ejercitados de punta a punta contra la base real**,
// por PostgREST y bajo RLS, con una sesión de verdad.
//
// LA FORMA, y es la de la casa (precedente S46: «escribió de verdad y se
// limpió quirúrgicamente por id, verificado 0 residuos»):
//   · MONTAJE por el CLI (rol postgres) — el fixture no puede nacer por
//     wrapper porque hoy no hay vendedor (Bloque 7, frenado).
//   · EJERCICIO por los WRAPPERS con la sesión demo — que es lo que se viene
//     a probar: el camino real, no una simulación.
//   · DESMONTAJE por id, con residuo verificado en CERO.
//
// 🔴 EL CONTEO DEL EXPEDIENTE SE MIDE ANTES Y DESPUÉS. El evento se deposita
//    al ENTREGAR y solo al entregar; y al terminar el expediente tiene que
//    quedar EXACTAMENTE como estaba. Un expediente append-only que viaja con
//    la mascota no perdona un residuo de test.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { dbQuery } from './lib-db.mjs';
import {
  initApi,
  iniciarSesion,
  listarProductosDespensa,
  buscarProductosDespensa,
  obtenerFichaProducto,
  recomendarParaMascota,
  cotizarEnvioDespensa,
  nuevaClaveIdempotencia,
  crearPedidoDespensa,
  reservarStockPedido,
  iniciarPagoPedido,
  listarMisPedidos,
  obtenerDetallePedido,
  listarPedidosDelVendedor,
  obtenerLineasParaEmpaque,
  marcarPedidoEnPreparacion,
  empacarPedido,
  marcarPedidoDespachado,
  listarSkusDelVendedor,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
const check = (cond, nombre, detalle = '') => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
};
const P = '__e2e_s95e';

// El CLI corre como `postgres` y NO trae JWT (regla 68), así que `auth.uid()`
// es NULL y toda transición de actor `cliente`/`vendedor` rebotaría con
// `auth_requerido`. Se inyectan los claims igual que el cinturón de la M13.
const comoUsuario = (uid, sql) =>
  dbQuery(
    `SELECT set_config('request.jwt.claims','{"sub":"${uid}","role":"authenticated"}',false); ${sql}`,
  );

// ── FASE 0 · LÍNEA BASE ─────────────────────────────────────────────────────
const base = dbQuery(
  `SELECT (SELECT count(*) FROM eventos_mascota) ev, (SELECT count(*) FROM pedidos) ped`,
)[0];
console.log(`\n═══ LÍNEA BASE · expediente ${base.ev} eventos · ${base.ped} pedidos ═══\n`);

// ── FASE 1 · MONTAJE ────────────────────────────────────────────────────────
// El vendedor y la mascota salen de datos REALES; lo que se fabrica es el
// catálogo, y va marcado con `__e2e_s95e` para que el desmontaje sea por id.
const ctx = dbQuery(`
  SELECT cc.id cuenta, cc.owner_profile_id vend, m.id mascota, m.especie, m.nombre mnombre,
         fm.user_id cliente
  FROM cuentas_comerciales cc
  JOIN profiles pr ON pr.id = cc.owner_profile_id
  JOIN familia_miembro fm ON fm.user_id = pr.id AND fm.hasta IS NULL
  JOIN mascotas m ON m.familia_id = fm.familia_id AND m.estado_vida = 'activa'
  WHERE cc.estado = 'activa' AND pr.email = '${env.EXPO_PUBLIC_DEMO_EMAIL}'
  LIMIT 1`)[0];

if (ctx === undefined) {
  console.log('✗ ABORTA: la cuenta demo no tiene cuenta comercial activa con mascota viva.');
  process.exit(1);
}
console.log(`Contexto: cuenta ${ctx.cuenta} · mascota ${ctx.mnombre} (${ctx.especie})\n`);

// 🔴 EL ROL DE VENDEDOR ES FIXTURE, NO SIEMBRA. Nace acá y muere en el
//    desmontaje. Bloque 7 quedó frenado justamente para no dejar uno vivo.
const alergiaPrevia = dbQuery(
  `SELECT coalesce((SELECT alergias::text FROM mascota_perfil_vigente WHERE mascota_id='${ctx.mascota}'),'AUSENTE') a`,
)[0].a;

let pedidoId = null;
let ids = null;
try {
dbQuery(`
  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  VALUES ('${ctx.cuenta}', 'seller_productos', 'activo', now(), '{"fixture":"${P}"}'::jsonb)
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING`);

ids = dbQuery(`
  WITH pa AS (
    INSERT INTO productos (nombre, familia_codigo, estado, especies_aplicables, alergenos)
    VALUES ('${P}_apto', 'alimento', 'activo', ARRAY['${ctx.especie}']::text[], ARRAY[]::text[])
    RETURNING id),
  pb AS (
    INSERT INTO productos (nombre, familia_codigo, estado, especies_aplicables, alergenos)
    VALUES ('${P}_con_alergeno', 'alimento', 'activo', ARRAY['${ctx.especie}']::text[], ARRAY['${P}_pollo']::text[])
    RETURNING id),
  va AS (
    INSERT INTO producto_variantes (producto_id, codigo, presentacion, impuesto_codigo, peso_kg, largo_cm, ancho_cm, alto_cm)
    SELECT id, '${P}a', '15 kg', 'EC_IVA_15', 15, 60, 40, 20 FROM pa RETURNING id, producto_id),
  vb AS (
    INSERT INTO producto_variantes (producto_id, codigo, presentacion, impuesto_codigo, peso_kg)
    SELECT id, '${P}b', '3 kg', 'EC_IVA_15', 3 FROM pb RETURNING id, producto_id),
  sa AS (
    INSERT INTO vendedor_skus (cuenta_comercial_id, variante_id, sku_vendedor, estado)
    SELECT '${ctx.cuenta}', id, '${P}_a', 'aceptado' FROM va RETURNING id),
  sb AS (
    INSERT INTO vendedor_skus (cuenta_comercial_id, variante_id, sku_vendedor, estado)
    SELECT '${ctx.cuenta}', id, '${P}_b', 'aceptado' FROM vb RETURNING id),
  oa AS (
    INSERT INTO ofertas (variante_id, sku_id, precio, estado, publicado_por, publicado_en)
    SELECT va.id, sa.id, 100.00, 'publicada', '${ctx.vend}', now() FROM va, sa RETURNING id),
  ob AS (
    INSERT INTO ofertas (variante_id, sku_id, precio, estado, publicado_por, publicado_en)
    SELECT vb.id, sb.id, 40.00, 'publicada', '${ctx.vend}', now() FROM vb, sb RETURNING id),
  mv AS (
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo)
    SELECT id, 'ingreso', 50, 'carga_inicial' FROM sa RETURNING id),
  bo AS (
    INSERT INTO vendedor_bodegas (cuenta_comercial_id, nombre, ciudad, zona_horaria, horas_preparacion, hora_corte, activo)
    VALUES ('${ctx.cuenta}', '${P}', 'Quito', 'America/Guayaquil', 24, '15:00', true) RETURNING id)
  SELECT (SELECT id FROM pa) pa, (SELECT id FROM pb) pb, (SELECT id FROM va) va,
         (SELECT id FROM vb) vb, (SELECT id FROM sa) sa, (SELECT id FROM sb) sb,
         (SELECT id FROM oa) oa, (SELECT id FROM ob) ob, (SELECT id FROM bo) bo`)[0];

  const login = await iniciarSesion({
    email: env.EXPO_PUBLIC_DEMO_EMAIL,
    password: env.EXPO_PUBLIC_DEMO_PASSWORD,
  });
  if (!login.ok) throw new Error(`no se pudo firmar la sesión demo: ${login.mensaje}`);

  // ── FASE 2 · EL EJERCICIO ────────────────────────────────────────────────

  const vitrina = await listarProductosDespensa({ familia_codigo: 'alimento' });
  check(
    vitrina.ok && vitrina.data.some((p) => p.oferta_id === ids.oa),
    'T1 la vitrina muestra el producto publicado',
    vitrina.ok ? `${vitrina.data.length} productos` : vitrina.codigo,
  );

  const busq = await buscarProductosDespensa(`${P}_apto`);
  check(busq.ok && busq.data.length === 1, 'T2 la búsqueda encuentra por nombre',
    busq.ok ? `${busq.data.length}` : busq.codigo);

  const vacio = await buscarProductosDespensa('   ');
  check(vacio.ok && vacio.data.length === 0,
    'T2b término vacío devuelve [] y no la vitrina entera');

  const ficha = await obtenerFichaProducto(ids.pa);
  check(
    ficha.ok && ficha.data.variantes.length === 1 && ficha.data.variantes[0].oferta_id === ids.oa,
    'T3 la ficha trae su variante con la oferta publicada',
    ficha.ok ? `precio ${ficha.data.variantes[0]?.precio}` : ficha.codigo,
  );

  // 🔴 EL DISCRIMINADOR DE LA EXCLUSIÓN — el corazón del frente.
  const rec1 = await recomendarParaMascota(ctx.mascota);
  const veAmbos =
    rec1.ok &&
    rec1.data.productos.some((p) => p.producto_id === ids.pa) &&
    rec1.data.productos.some((p) => p.producto_id === ids.pb);
  check(veAmbos, 'T4 SIN alergia documentada, la recomendación ofrece los DOS',
    rec1.ok ? `${rec1.data.productos.length} productos` : rec1.codigo);

  // Se documenta la alergia y la MISMA llamada tiene que dejar de ofrecerlo.
  dbQuery(`
    INSERT INTO mascota_perfil_vigente (mascota_id, alergias)
    VALUES ('${ctx.mascota}', '[{"alergeno":"${P}_pollo","severidad":"alta","estado":"confirmada"}]'::jsonb)
    ON CONFLICT (mascota_id) DO UPDATE SET alergias = EXCLUDED.alergias`);

  const rec2 = await recomendarParaMascota(ctx.mascota);
  const excluye =
    rec2.ok &&
    rec2.data.productos.some((p) => p.producto_id === ids.pa) &&
    !rec2.data.productos.some((p) => p.producto_id === ids.pb);
  check(excluye, '🔴 T4b CON alergia documentada, el contraindicado DESAPARECE',
    rec2.ok ? `${rec2.data.productos.length} productos · excluidos: ${rec2.data.criterio.alergenos_excluidos}` : rec2.codigo);

  // La misma verdad por el otro lado: la vitrina general NO excluye (no hay
  // mascota contra la cual excluir). Si excluyera, estaría filtrando de más.
  const vit2 = await listarProductosDespensa({ familia_codigo: 'alimento' });
  check(vit2.ok && vit2.data.some((p) => p.producto_id === ids.pb),
    'T4c la vitrina SIN mascota sigue mostrándolo (la exclusión es de la recomendación)');

  // 🔴 SIN REGLA DE ENVÍO: tipado, no crash, y jamás un costo inventado.
  const cot0 = await cotizarEnvioDespensa({ cuenta_comercial_id: ctx.cuenta, subtotal: 100 });
  check(!cot0.ok && cot0.codigo === 'sin_regla_envio',
    '🔴 T5 sin regla de envío el motor NO inventa un costo: sale sin_regla_envio',
    cot0.ok ? `respondió costo ${cot0.data.costo}` : cot0.codigo);

  dbQuery(`
    INSERT INTO reglas_envio (cuenta_comercial_id, country_code, tipo, parametros, moneda, prioridad, vigencia_desde, activo, notas)
    VALUES ('${ctx.cuenta}', 'EC', 'gratis_sobre_umbral',
            '{"umbral":0,"monto_bajo_umbral":0,"pagado_por":"vendedor"}'::jsonb,
            'USD', 100, now(), true, '${P}')`);

  const cot1 = await cotizarEnvioDespensa({
    cuenta_comercial_id: ctx.cuenta, subtotal: 100, peso_fisico_kg: 15, peso_volumetrico_kg: 8,
  });
  check(cot1.ok && cot1.data.costo === 0 && cot1.data.peso_facturable_kg === 15,
    'T5b con la regla firmada: gratis, y el peso facturable es el MAYOR (15 vs 8)',
    cot1.ok ? `costo ${cot1.data.costo} · facturable ${cot1.data.peso_facturable_kg}` : cot1.codigo);
  check(cot1.ok && cot1.data.parametros_aplicados?.pagado_por === 'vendedor',
    '🔴 T5c «gratis» declara QUIÉN paga — viaja en la cotización, no en un doc');

  // ── LA COMPRA ────────────────────────────────────────────────────────────
  const clave = nuevaClaveIdempotencia();
  const ped = await crearPedidoDespensa({
    cuenta_comercial_id: ctx.cuenta,
    items: [{ oferta_id: ids.oa, cantidad: 2 }],
    entrega: { nombre_receptor: 'E2E', telefono: '+593999999999', direccion: 'Av Test 1', ciudad: 'Quito' },
    clave_idempotencia: clave,
    bodega_id: ids.bo,
  });
  check(ped.ok && ped.data.total === 230, 'T6 el pedido nace con totales DEL MOTOR (2×100 + 15% IVA)',
    ped.ok ? `sub ${ped.data.subtotal} · iva ${ped.data.impuesto} · envío ${ped.data.envio} · total ${ped.data.total}` : ped.codigo);
  if (ped.ok) pedidoId = ped.data.pedido_id;

  const ped2 = await crearPedidoDespensa({
    cuenta_comercial_id: ctx.cuenta,
    items: [{ oferta_id: ids.oa, cantidad: 2 }],
    entrega: { nombre_receptor: 'E2E', telefono: '+593999999999', direccion: 'Av Test 1', ciudad: 'Quito' },
    clave_idempotencia: clave,
    bodega_id: ids.bo,
  });
  const nPed = dbQuery(`SELECT count(*) n FROM pedidos WHERE clave_idempotencia LIKE '%${clave}'`)[0].n;
  check(ped2.ok && ped2.data.ya_existia && Number(nPed) === 1,
    '🔴 T7 la MISMA clave NO crea un segundo pedido', `pedidos con la clave: ${nPed}`);

  const res = await reservarStockPedido(pedidoId);
  check(res.ok && res.data.reservas === 1, 'T8 reserva de stock', res.ok ? `${res.data.reservas}` : res.codigo);
  const stock = await listarSkusDelVendedor(ctx.cuenta);
  const skuA = stock.ok ? stock.data.find((s) => s.sku_id === ids.sa) : undefined;
  check(skuA !== undefined && skuA.stock_disponible === 48 && skuA.stock_reservado === 2,
    'T8b el saldo lo materializó el trigger desde el ledger (50 → 48 disp · 2 res)',
    skuA ? `${skuA.stock_disponible}/${skuA.stock_reservado}` : 'sin sku');

  const pago = await iniciarPagoPedido(pedidoId);
  check(pago.ok && pago.data.estado === 'pagando',
    '🔴 T9 iniciar pago devuelve NARRATIVA («pagando»), jamás el estado interno',
    pago.ok ? pago.data.estado : pago.codigo);

  // El backend confirma. Se llama por el CLI a propósito: `confirmar_pago_pedido`
  // NO se exporta desde `packages/api` — si viviera ahí, cualquiera con la anon
  // key podría declarar un pedido pagado sin haber pagado.
  dbQuery(`SELECT confirmar_pago_pedido('${pedidoId}','__e2e','ref-1','${P}-webhook-1','{}'::jsonb)`);
  dbQuery(`SELECT confirmar_pago_pedido('${pedidoId}','__e2e','ref-1','${P}-webhook-1','{}'::jsonb)`);
  const nEv = dbQuery(`SELECT count(*) n FROM pagos_eventos WHERE clave_idempotencia='${P}-webhook-1'`)[0].n;
  check(Number(nEv) === 1, '🔴 T10 el mismo webhook dos veces deja UN evento', `${nEv}`);

  // ── EL VENDEDOR ──────────────────────────────────────────────────────────
  const suyos = await listarPedidosDelVendedor(ctx.cuenta);
  check(suyos.ok && suyos.data.some((p) => p.pedido_id === pedidoId),
    'T11 el vendedor ve el pedido en su panel', suyos.ok ? `${suyos.data.length}` : suyos.codigo);

  const prep = await marcarPedidoEnPreparacion(pedidoId);
  check(prep.ok && prep.data.narrativa === 'preparando', 'T12 botón «preparado»',
    prep.ok ? prep.data.narrativa : prep.codigo);

  const lineas = await obtenerLineasParaEmpaque(pedidoId);
  check(lineas.ok && lineas.data.length === 1 && lineas.data[0].lote === null,
    'T13 las líneas a empacar todavía no tienen lote');

  const sinLote = await empacarPedido(pedidoId, [{ item_id: lineas.data[0].item_id, lote: '  ' }]);
  check(!sinLote.ok && sinLote.codigo === 'lote_requerido',
    '🔴 T14 empacar SIN lote rebota — y el wrapper no lo rellena con un default',
    sinLote.ok ? 'dejó pasar' : sinLote.codigo);

  const emp = await empacarPedido(
    pedidoId, [{ item_id: lineas.data[0].item_id, lote: 'L-2026-08', fecha_vencimiento: '2027-06-30' }], 15.4,
  );
  check(emp.ok && emp.data.items_con_lote === 1, 'T15 botón «empacado» con lote',
    emp.ok ? `${emp.data.items_con_lote}` : emp.codigo);

  // 🔴 ACÁ SE MIDE EL HUECO, no se razona.
  const desp = await marcarPedidoDespachado(pedidoId);
  check(!desp.ok && desp.codigo === 'transicion_no_permitida',
    '🔴 T16 «despachado» NO alcanza desde «empacado»: falta el paso `documentado`',
    desp.ok ? `avanzó a ${desp.data.narrativa}` : desp.codigo);

  comoUsuario(ctx.vend, `SELECT mover_estado_pedido('${pedidoId}','documentado','sistema')`);
  const desp2 = await marcarPedidoDespachado(pedidoId);
  check(desp2.ok && desp2.data.narrativa === 'en_camino',
    'T16b desde «documentado» el botón sí despacha', desp2.ok ? desp2.data.narrativa : desp2.codigo);

  // ── LA ENTREGA · el único momento en que el expediente recibe algo ───────
  const evAntes = dbQuery(`SELECT count(*) n FROM eventos_mascota`)[0].n;
  comoUsuario(ctx.vend, `SELECT mover_estado_pedido('${pedidoId}','entregado_courier','vendedor')`);
  comoUsuario(ctx.vend, `SELECT mover_estado_pedido('${pedidoId}','en_transito','sistema')`);
  comoUsuario(ctx.vend, `SELECT mover_estado_pedido('${pedidoId}','en_reparto','sistema')`);
  const evMedio = dbQuery(`SELECT count(*) n FROM eventos_mascota`)[0].n;
  check(Number(evMedio) === Number(evAntes),
    '🔴 T17 nada llegó al expediente antes de entregar', `${evAntes} → ${evMedio}`);

  comoUsuario(ctx.cliente, `SELECT entregar_pedido('${pedidoId}','${ctx.mascota}')`);
  const evPost = dbQuery(`SELECT count(*) n FROM eventos_mascota`)[0].n;
  check(Number(evPost) === Number(evAntes) + 1,
    '🔴 T18 al ENTREGAR, y solo ahí, el expediente recibe UN evento', `${evAntes} → ${evPost}`);

  const asig = dbQuery(`
    SELECT a.lote, a.fecha_vencimiento::text fv, e.procedencia, e.modo_captura
    FROM evento_producto_asignacion a JOIN eventos_mascota e ON e.id = a.evento_id
    WHERE a.mascota_id='${ctx.mascota}' AND a.nombre_producto='${P}_apto'`);
  check(asig.length === 1 && asig[0].lote === 'L-2026-08' && asig[0].procedencia === 'declarado_por_familia',
    '🔴 T19 el LOTE viajó al expediente y la procedencia es declarado_por_familia',
    asig[0] ? `lote ${asig[0].lote} · ${asig[0].procedencia} · ${asig[0].modo_captura}` : 'sin fila');

  comoUsuario(ctx.cliente, `SELECT entregar_pedido('${pedidoId}','${ctx.mascota}')`);
  const evDoble = dbQuery(`SELECT count(*) n FROM eventos_mascota`)[0].n;
  check(Number(evDoble) === Number(evPost),
    '🔴 T20 entregar dos veces NO duplica el evento', `${evPost} → ${evDoble}`);

  // ── EL SEGUIMIENTO ───────────────────────────────────────────────────────
  const mis = await listarMisPedidos();
  const mio = mis.ok ? mis.data.find((p) => p.pedido_id === pedidoId) : undefined;
  check(mio !== undefined && mio.narrativa === 'entregado',
    'T21 la lista del dueño muestra el pedido en su narrativa', mio ? mio.narrativa : 'no aparece');
  check(
    mis.ok && mis.data.every((p) =>
      ['pagando','confirmado','preparando','en_camino','entregado','no_llego','cancelado'].includes(p.narrativa)),
    '🔴 T21b CERO estados internos: todo lo que sale es una de las SIETE');

  const det = await obtenerDetallePedido(pedidoId);
  check(det.ok && det.data.items[0].lote === 'L-2026-08' && det.data.subtotal === 200,
    'T22 el detalle trae líneas con lote y totales transportados',
    det.ok ? `sub ${det.data.subtotal} · lote ${det.data.items[0].lote}` : det.codigo);
  check(det.ok && det.data.pedido.promesa_desde !== null,
    'T22b la promesa se LEE de lo guardado', det.ok ? String(det.data.pedido.promesa_desde) : det.codigo);

  // ── 🔴 LA SONDA: ¿puede un autenticado cualquiera mover como «sistema»? ──
  // No se afirma leyendo el cuerpo: se INTENTA.
  const sonda = dbQuery(`
    SELECT count(*) n FROM pg_proc p
    WHERE p.proname='mover_estado_pedido'
      AND pg_get_functiondef(p.oid) NOT LIKE '%p_actor = ''sistema''%'`)[0].n;
  const otro = await import('../packages/api/src/index.ts');
  const intento = await otro.iniciarPagoPedido(pedidoId); // ya entregado: debe rebotar
  check(!intento.ok, 'T23 un movimiento inválido del cliente rebota', intento.ok ? 'pasó' : intento.codigo);
  console.log(
    `\n🔴 SONDA (no es un check, es un dato para el founder): \`mover_estado_pedido\` ${
      Number(sonda) === 1 ? 'NO tiene' : 'tiene'
    } rama de autorización para el actor \`sistema\`.\n`,
  );
} catch (e) {
  // 🔴 SIN ESTE CATCH EL ARNÉS MIENTE. La primera corrida murió en T17 y el
  //    `process.exit(0)` del `finally` se comió la excepción: imprimió «GATE
  //    VERDE» con SIETE tests sin correr. Un verde que tapa un error es peor
  //    que un rojo — L-192 en el instrumento, no en el código medido.
  fallos += 1;
  console.log(`\n✗ FALLO el ejercicio se cortó: ${e.message ?? e}\n`);
} finally {
  // ── FASE 3 · DESMONTAJE por id, con residuo verificado ──────────────────
  console.log('\n═══ DESMONTAJE ═══');
  dbQuery(`
    DELETE FROM evento_producto_asignacion WHERE nombre_producto LIKE '${P}%';
    DELETE FROM eventos_mascota WHERE datos->>'pedido_id' = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000');
    DELETE FROM pagos_eventos WHERE clave_idempotencia LIKE '${P}%';
    DELETE FROM pagos_intentos WHERE clave_idempotencia LIKE '${P}%';
    DELETE FROM inventario_reservas WHERE sku_id IN (SELECT id FROM vendedor_skus WHERE sku_vendedor LIKE '${P}%');
    DELETE FROM inventario_movimientos WHERE sku_id IN (SELECT id FROM vendedor_skus WHERE sku_vendedor LIKE '${P}%');
    DELETE FROM pedido_estados WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia LIKE '%${P}%' OR id = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000')::uuid);
    DELETE FROM pedido_items WHERE pedido_id = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000')::uuid;
    DELETE FROM pedidos WHERE id = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000')::uuid;
    DELETE FROM reglas_envio WHERE notas = '${P}';
    DELETE FROM vendedor_bodegas WHERE nombre = '${P}';
    DELETE FROM ofertas WHERE sku_id IN (SELECT id FROM vendedor_skus WHERE sku_vendedor LIKE '${P}%');
    DELETE FROM vendedor_skus WHERE sku_vendedor LIKE '${P}%';
    DELETE FROM producto_variantes WHERE codigo LIKE '${P}%';
    DELETE FROM productos WHERE nombre LIKE '${P}%';
    DELETE FROM cuenta_roles WHERE metadata->>'fixture' = '${P}';
    UPDATE mascota_perfil_vigente SET alergias = ${
      alergiaPrevia === 'AUSENTE' ? 'NULL' : `'${alergiaPrevia}'::jsonb`
    } WHERE mascota_id = '${ctx.mascota}';
  `);

  const fin = dbQuery(`
    SELECT (SELECT count(*) FROM eventos_mascota) ev,
           (SELECT count(*) FROM pedidos) ped,
           (SELECT count(*) FROM productos WHERE nombre LIKE '${P}%') prod,
           (SELECT count(*) FROM vendedor_skus WHERE sku_vendedor LIKE '${P}%') sku,
           (SELECT count(*) FROM cuenta_roles WHERE metadata->>'fixture'='${P}') rol`)[0];
  const limpio =
    Number(fin.ev) === Number(base.ev) && Number(fin.ped) === Number(base.ped) &&
    Number(fin.prod) === 0 && Number(fin.sku) === 0 && Number(fin.rol) === 0;
  check(limpio, '🔴 RESIDUO 0 — el expediente y los pedidos vuelven a su línea base',
    `expediente ${base.ev}→${fin.ev} · pedidos ${base.ped}→${fin.ped} · fixtures ${fin.prod}/${fin.sku}/${fin.rol}`);

  console.log(`\n${fallos === 0 ? '✅ GATE VERDE' : `❌ ${fallos} FALLO(S)`}\n`);
  process.exit(fallos === 0 ? 0 : 1);
}
