// ═══════════════════════════════════════════════════════════════════════════
// S95-G4 · EL E2E CONTRA EL CATÁLOGO REAL
//
// 🔴 ES LO QUE NUNCA SE PROBÓ. El gate de S95-E monta su propio fixture y lo
// destruye; **nunca corrió contra catálogo cargado y vendedor persistente.**
// Éste sí: la vitrina, la recomendación, la cotización y el pedido salen de los
// SEIS productos reales del vendedor de pruebas.
//
// LO QUE SÍ SE LIMPIA: el pedido y su evento de expediente. **El catálogo
// QUEDA** — es el punto de haberlo cargado. *El expediente de una mascota real
// no se ensucia con una compra de prueba: se mide antes, se mide después, y
// vuelve a su número.*
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { dbQuery } from '../../scripts/lib-db.mjs';
import { initApi, iniciarSesion } from '../../packages/api/src/index.ts';
import {
  listarProductosDespensa, buscarProductosDespensa, obtenerFichaProducto,
  recomendarParaMascota, cotizarEnvioDespensa, nuevaClaveIdempotencia,
  crearPedidoDespensa, reservarStockPedido, iniciarPagoPedido,
  listarMisPedidos, obtenerDetallePedido, obtenerLineasParaEmpaque,
  marcarPedidoEnPreparacion, empacarPedido, marcarPedidoDespachado,
} from '../../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
const check = (c, n, d = '') => {
  console.log(`${c ? '✓' : '✗ FALLO'} ${n}${d ? ` — ${d}` : ''}`);
  if (!c) fallos += 1;
};
const P = '__e2e_real_g4';
const CUENTA = 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';

const base = dbQuery(`SELECT count(*) n FROM eventos_mascota`)[0].n;
console.log(`\n═══ EXPEDIENTE AL EMPEZAR: ${base} eventos ═══\n`);

const ctx = dbQuery(`
  SELECT m.id mascota, m.nombre, m.especie, fm.user_id cliente,
         (SELECT id FROM vendedor_bodegas WHERE cuenta_comercial_id='${CUENTA}' LIMIT 1) bodega,
         coalesce((SELECT alergias::text FROM mascota_perfil_vigente WHERE mascota_id=m.id),'AUSENTE') alergia_previa
  FROM mascotas m
  JOIN familia_miembro fm ON fm.familia_id=m.familia_id AND fm.rol='adulto_titular' AND fm.hasta IS NULL
  JOIN profiles p ON p.id=fm.user_id
  WHERE m.estado_vida='activa' AND m.especie='perro'
    AND p.email='${env.EXPO_PUBLIC_DEMO_EMAIL}'
  LIMIT 1`)[0];
console.log(`Mascota: ${ctx.nombre} (${ctx.especie}) · bodega ${ctx.bodega}\n`);

let pedidoId = null;
try {
  const login = await iniciarSesion({
    email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD,
  });
  if (!login.ok) throw new Error(`sin sesión: ${login.mensaje}`);

  // ── ① LA VITRINA ─────────────────────────────────────────────────────────
  const vit = await listarProductosDespensa({ familia_codigo: 'alimento' });
  check(vit.ok && vit.data.length === 6, '① la vitrina muestra los SEIS productos reales',
    vit.ok ? `${vit.data.length}` : vit.codigo);
  const propac = vit.ok ? vit.data.find((p) => p.nombre.includes('Pollo y Arroz')) : null;
  check(propac !== null && propac !== undefined && propac.precio === 29,
    '①b con su precio del catálogo del vendedor', propac ? `$${propac.precio}` : 'no está');

  const bus = await buscarProductosDespensa('Bisonte');
  check(bus.ok && bus.data.length === 1, '② la búsqueda encuentra por nombre',
    bus.ok ? `${bus.data.length}` : bus.codigo);

  const ficha = await obtenerFichaProducto(propac.producto_id);
  check(ficha.ok && ficha.data.alergenos.length === 2, '③ la ficha trae los DOS alérgenos separados',
    ficha.ok ? JSON.stringify(ficha.data.alergenos) : ficha.codigo);

  // ── ④🔴 EL DISCRIMINADOR DE LA EXCLUSIÓN — la razón de existir del frente ─
  const rec1 = await recomendarParaMascota(ctx.mascota);
  const vePollo1 = rec1.ok && rec1.data.productos.some((p) => p.nombre.includes('Pollo y Arroz'));
  check(vePollo1, '④ SIN alergia documentada, la mascota VE el Pro Pac Pollo-Arroz',
    rec1.ok ? `${rec1.data.productos.length} productos` : rec1.codigo);

  dbQuery(`
    INSERT INTO mascota_perfil_vigente (mascota_id, alergias)
    VALUES ('${ctx.mascota}', '[{"alergeno":"pollo","severidad":"alta","estado":"confirmada"}]'::jsonb)
    ON CONFLICT (mascota_id) DO UPDATE SET alergias = EXCLUDED.alergias`);

  const rec2 = await recomendarParaMascota(ctx.mascota);
  const vePollo2 = rec2.ok && rec2.data.productos.some((p) => p.nombre.includes('Pollo y Arroz'));
  check(rec2.ok && !vePollo2,
    '🔴 ④b CON alergia a pollo, el Pro Pac Pollo-Arroz DESAPARECE',
    rec2.ok ? `${rec2.data.productos.length} productos · excluidos: ${rec2.data.criterio.alergenos_excluidos}` : rec2.codigo);
  // Y no desapareció TODO: los que no llevan pollo siguen ahí.
  check(rec2.ok && rec2.data.productos.length > 0,
    '④c y los que NO llevan pollo siguen ofreciéndose',
    rec2.ok ? rec2.data.productos.map((p) => p.nombre.slice(0, 22)).join(' · ') : '');

  // ── ⑤ LA COTIZACIÓN, con la frontera de cobertura ────────────────────────
  const cot = await cotizarEnvioDespensa({
    cuenta_comercial_id: CUENTA, subtotal: 122, peso_fisico_kg: 12.7, country_code: 'EC',
  });
  check(cot.ok && cot.data.costo === 0, '⑤ cotiza con moto propia · costo 0 al cliente',
    cot.ok ? `${cot.data.tipo_regla}` : cot.codigo);

  // ── ⑥ EL PEDIDO ──────────────────────────────────────────────────────────
  const oferta = rec2.ok ? rec2.data.productos.find((p) => p.nombre.includes('Bisonte')) : null;
  const ped = await crearPedidoDespensa({
    cuenta_comercial_id: CUENTA,
    items: [{ oferta_id: oferta.oferta_id, cantidad: 1 }],
    entrega: { nombre_receptor: 'E2E real', telefono: '+593999999999',
               direccion: 'Av Test 1', ciudad: 'Quito' },
    clave_idempotencia: `${P}-${nuevaClaveIdempotencia()}`,
    bodega_id: ctx.bodega,
  });
  check(ped.ok && ped.data.total === 122, '⑥ pedido con el precio real del catálogo (IVA 0 %)',
    ped.ok ? `sub ${ped.data.subtotal} · iva ${ped.data.impuesto} · total ${ped.data.total}` : ped.codigo);
  pedidoId = ped.ok ? ped.data.pedido_id : null;

  const res = await reservarStockPedido(pedidoId);
  check(res.ok, '⑦ reserva de stock', res.ok ? `${res.data.reservas}` : res.codigo);

  const pago = await iniciarPagoPedido(pedidoId);
  check(pago.ok && pago.data.estado === 'pagando', '⑧ inicia el pago · narrativa «pagando»');

  dbQuery(`SELECT confirmar_pago_pedido('${pedidoId}','__e2e','ref','${P}-pago','{}'::jsonb)`);
  const est1 = dbQuery(`SELECT estado FROM pedidos WHERE id='${pedidoId}'`)[0].estado;
  check(est1 === 'liberado_preparacion', '⑨ el backend confirma el pago', est1);

  // ── ⑩ EL VENDEDOR ────────────────────────────────────────────────────────
  const vend = dbQuery(`SELECT owner_profile_id o FROM cuentas_comerciales WHERE id='${CUENTA}'`)[0].o;
  const comoVend = (s) =>
    dbQuery(`SELECT set_config('request.jwt.claims','{"sub":"${vend}","role":"authenticated"}',false); ${s}`);
  comoVend(`SELECT mover_estado_pedido('${pedidoId}','picking','vendedor')`);
  const it = dbQuery(`SELECT id FROM pedido_items WHERE pedido_id='${pedidoId}'`)[0].id;
  comoVend(`SELECT empacar_pedido('${pedidoId}','[{"item_id":"${it}","lote":"LOTE-G4-001","fecha_vencimiento":"2027-12-31"}]'::jsonb, 12.2)`);
  const est2 = dbQuery(`SELECT estado FROM pedidos WHERE id='${pedidoId}'`)[0].estado;
  check(est2 === 'empacado', '⑩ el vendedor empaca CON LOTE', est2);

  comoVend(`SELECT registrar_factura_pedido('${pedidoId}','001-001-000000777','CLAVE-G4')`);
  const est3 = dbQuery(`SELECT estado FROM pedidos WHERE id='${pedidoId}'`)[0].estado;
  check(est3 === 'documentado', '⑪ registra la factura del vendedor → documentado', est3);

  comoVend(`SELECT mover_estado_pedido('${pedidoId}','esperando_courier','vendedor')`);
  comoVend(`SELECT mover_estado_pedido('${pedidoId}','en_reparto','vendedor')`);
  const est4 = dbQuery(`SELECT estado FROM pedidos WHERE id='${pedidoId}'`)[0].estado;
  check(est4 === 'en_reparto', '⑫ sale a repartir con moto propia', est4);

  // ── ⑬ LA ENTREGA · el expediente recibe, y solo acá ──────────────────────
  const evAntes = dbQuery(`SELECT count(*) n FROM eventos_mascota`)[0].n;
  check(Number(evAntes) === Number(base), '⑬ nada llegó al expediente antes de entregar',
    `${base} → ${evAntes}`);

  dbQuery(`SELECT set_config('request.jwt.claims','{"sub":"${ctx.cliente}","role":"authenticated"}',false);
           SELECT entregar_pedido('${pedidoId}','${ctx.mascota}')`);
  const evPost = dbQuery(`SELECT count(*) n FROM eventos_mascota`)[0].n;
  check(Number(evPost) === Number(base) + 1, '🔴 ⑭ al ENTREGAR el expediente recibe UN evento',
    `${evAntes} → ${evPost}`);

  const asig = dbQuery(`
    SELECT a.nombre_producto, a.lote, e.procedencia
    FROM evento_producto_asignacion a JOIN eventos_mascota e ON e.id=a.evento_id
    WHERE a.mascota_id='${ctx.mascota}' AND a.lote='LOTE-G4-001'`);
  check(asig.length === 1 && asig[0].procedencia === 'declarado_por_familia',
    '⑮ el LOTE y la procedencia viajaron al expediente',
    asig[0] ? `${asig[0].nombre_producto} · ${asig[0].lote} · ${asig[0].procedencia}` : 'sin fila');

  const mis = await listarMisPedidos();
  const mio = mis.ok ? mis.data.find((p) => p.pedido_id === pedidoId) : null;
  check(mio && mio.narrativa === 'entregado', '⑯ el dueño lo ve «Entregado»', mio ? mio.narrativa : '—');

  const det = await obtenerDetallePedido(pedidoId);
  check(det.ok && det.data.items[0].lote === 'LOTE-G4-001', '⑰ el detalle trae el lote');
} catch (e) {
  fallos += 1;
  console.log(`\n✗ EL ENSAYO SE CORTÓ: ${e.message ?? e}\n`);
} finally {
  console.log('\n═══ DESMONTAJE — el pedido se va, el CATÁLOGO QUEDA ═══');
  dbQuery(`
    DELETE FROM evento_producto_asignacion WHERE lote='LOTE-G4-001';
    DELETE FROM eventos_mascota WHERE datos->>'pedido_id' = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000');
    DELETE FROM facturas WHERE clave_acceso='CLAVE-G4';
    DELETE FROM pagos_eventos WHERE clave_idempotencia LIKE '${P}%';
    DELETE FROM pagos_intentos WHERE clave_idempotencia LIKE '${P}%';
    DELETE FROM inventario_reservas WHERE pedido_id = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000')::uuid;
    DELETE FROM inventario_movimientos WHERE referencia_id = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000')::uuid;
    DELETE FROM pedido_estados WHERE pedido_id = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000')::uuid;
    DELETE FROM pedido_items WHERE pedido_id = coalesce('${pedidoId}','00000000-0000-0000-0000-000000000000')::uuid;
    DELETE FROM pedidos WHERE clave_idempotencia LIKE '${P}%';
    UPDATE mascota_perfil_vigente SET alergias = ${
      ctx.alergia_previa === 'AUSENTE' ? 'NULL' : `'${ctx.alergia_previa}'::jsonb`
    } WHERE mascota_id='${ctx.mascota}';`);

  const fin = dbQuery(`
    SELECT (SELECT count(*) FROM eventos_mascota) ev,
           (SELECT count(*) FROM pedidos WHERE clave_idempotencia LIKE '${P}%') ped,
           (SELECT count(*) FROM productos) prod,
           (SELECT count(*) FROM ofertas WHERE estado='publicada') of`)[0];
  check(Number(fin.ev) === Number(base) && Number(fin.ped) === 0,
    '🔴 RESIDUO 0 — el expediente vuelve a su número y no queda pedido propio',
    `expediente ${base}→${fin.ev} · pedidos propios ${fin.ped}`);
  console.log(`   CATÁLOGO VIVO: ${fin.prod} productos · ${fin.of} ofertas publicadas`);

  console.log(`\n${fallos === 0 ? '✅ GATE VERDE' : `❌ ${fallos} FALLO(S)`}\n`);
  process.exit(fallos === 0 ? 0 : 1);
}
