// ─────────────────────────────────────────────────────────────────────────────
// EL JUEZ DE LA DESPENSA — S95-C
//
// Once invariantes sacados de la letra (MODELO_DESPENSA v2.0, BIO_EXPEDIENTE
// E2bis, MODELO_FINANCIERO §7-§8.10, MODELO_LOYALTY §5/§7).
//
// 🔴 SE ESCRIBIÓ ANTES DEL ESQUEMA Y ARRANCA TODO ROJO.
//    Un juez escrito después es un juez escrito para aprobar lo que ya hiciste.
//
// 🔴 UN JUEZ EN ROJO ES UN HALLAZGO, NO UN OBSTÁCULO.
//    Si un invariante no pasa se FRENA y se ELEVA al founder. Jamás se ablanda
//    el test, jamás se comenta, jamás se marca como excepción. Es L-192: todo
//    chequeo tiene que poder salir rojo. Un loop que puede modificar a su propio
//    juez no es un loop — es un agente convenciéndose a sí mismo.
//
// SOLO LECTURA. Uso: node scripts/s95/juez-despensa.mjs
// Exit 0 = los once en verde. Exit 1 = hay rojo.
// ─────────────────────────────────────────────────────────────────────────────
import { dbQuery } from '../lib-db.mjs';
import { execSync } from 'node:child_process';

// ── Los dos dominios, declarados. El invariante 2 vive de esta separación ────

// Tablas del frente de productos (nacen o se enmiendan). El juez las vigila.
const FRENTE = [
  // catálogo
  'productos', 'producto_variantes', 'vendedor_skus', 'ofertas',
  'cat_familias_producto', 'cat_tasas_impuesto',
  // inventario
  'inventario_movimientos', 'inventario_reservas', 'vendedor_bodegas',
  // pedido
  'pedidos', 'pedido_items', 'pedido_estados', 'cat_estados_pedido',
  'pedido_descuentos',
  // plata
  'pagos_intentos', 'pagos_eventos', 'facturas',
  // logística
  'envios', 'envio_eventos', 'zonas_cobertura', 'cat_transportistas',
  // devolución (tabla sí, flujo no)
  'devoluciones',
];

// Tablas del dominio de SERVICIOS. Ninguna FK puede cruzar contra FRENTE.
//
// ⚠️ La lista se amplió tras cazar un VERDE FLOJO: con la lista corta, el
// invariante 2 pasaba porque no miraba las tablas que cruzan de verdad. Las
// dos últimas se clasifican por MEDICIÓN, no por nombre: `servicios_exequiales`
// tiene `prestador_id` y `tickets_soporte` tiene `cita_id` — las dos son del
// dominio de servicios y las dos apuntan a `pedidos`.
// Un invariante verde porque su lista es corta es peor que uno rojo.
const SERVICIOS = [
  'evento_cita_servicio', 'evento_atencion', 'prestadores', 'prestador_empleados',
  'prestador_servicios', 'prestador_horarios', 'tipos_servicio', 'bonos',
  'suscripciones_servicio', 'estadias', 'eventos_mascota_grooming',
  'eventos_mascota_paseo', 'eventos_mascota_adiestramiento',
  'evento_grooming_servicios_aplicados', 'evento_paseo_novedades',
  'prestador_programas', 'programas_contratados', 'prestador_especialidades',
  'servicios_exequiales', 'tickets_soporte',
];

// Tablas del EXPEDIENTE. El rol vendedor no puede tocarlas (invariante 4).
const EXPEDIENTE = [
  'eventos_mascota', 'mascota_perfil_vigente', 'mascotas',
  'evento_vacuna_aplicada', 'evento_medicacion_prescrita',
  'evento_examen_diagnostico', 'evento_historia_clinica_registrada',
  'evento_alergia_diagnosticada', 'evento_condicion_cronica_diagnosticada',
  'evento_caso_clinico_abierto', 'mascota_acceso_prestador',
];

// Tablas que el esqueleto JUBILA. Invariante 10: no pueden seguir existiendo.
const JUBILADAS = [
  'seller_inventario', 'seller_comisiones', 'seller_perfil', 'seller_documentos',
  'seller_reglas_asignacion', 'mensajes_admin_seller', 'pedidos_recurrentes',
  'resenas_productos', 'wishlist', 'lista_espera', 'planes_nutricion',
  'cupones', 'cupon_usos', 'checkout_sesiones', 'vtex_sync_log',
  'seller_liquidaciones', 'liquidacion_pedidos',
];

// Tablas append-only del frente: NADIE tiene UPDATE (invariante 7).
const APPEND_ONLY = ['pedido_estados', 'inventario_movimientos', 'pagos_eventos', 'envio_eventos'];

// Motor de puntos (invariante 3).
const LOYALTY = ['transacciones_puntos', 'puntos_usuario', 'logros_usuario', 'logros', 'loyalty_b2b'];

const lista = (a) => a.map((t) => `'${t}'`).join(',');

// ── Infraestructura del veredicto ───────────────────────────────────────────
const resultados = [];
function invariante(n, titulo, fn) {
  let veredicto, detalle;
  try {
    const r = fn();
    veredicto = r.ok ? 'VERDE' : 'ROJO';
    detalle = r.detalle;
  } catch (e) {
    veredicto = 'ROJO';
    detalle = ['no se pudo medir: ' + e.message.slice(0, 200)];
  }
  resultados.push({ n, titulo, veredicto, detalle });
}

const tablasQueExisten = (nombres) =>
  dbQuery(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r' AND c.relname IN (${lista(nombres)})`)
    .map((r) => r.relname);

// ── ① RLS activa en todo el frente · cero policies ALL ──────────────────────
invariante(1, 'RLS activa en toda tabla del frente · cero policies ALL', () => {
  const existen = tablasQueExisten(FRENTE);
  const faltan = FRENTE.filter((t) => !existen.includes(t));

  const sinRls = dbQuery(`
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname IN (${lista(FRENTE)})
      AND c.relrowsecurity = false`).map((r) => r.relname);

  const policiesAll = dbQuery(`
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename IN (${lista(FRENTE)}) AND cmd='ALL'`)
    .map((r) => `${r.tablename}.${r.policyname}`);

  const detalle = [];
  if (faltan.length) detalle.push(`faltan ${faltan.length} tablas del frente: ${faltan.join(', ')}`);
  if (sinRls.length) detalle.push(`SIN RLS: ${sinRls.join(', ')}`);
  if (policiesAll.length) detalle.push(`policies ALL (${policiesAll.length}): ${policiesAll.join(', ')}`);
  return { ok: !faltan.length && !sinRls.length && !policiesAll.length, detalle };
});

// ── ② EL CINTURÓN: cero FKs entre productos y servicios ─────────────────────
invariante(2, '🔴 EL CINTURÓN — cero FKs entre el dominio de productos y el de servicios', () => {
  const cruces = dbQuery(`
    SELECT src.relname origen, tgt.relname destino, con.conname
    FROM pg_constraint con
    JOIN pg_class src ON src.oid=con.conrelid
    JOIN pg_class tgt ON tgt.oid=con.confrelid
    JOIN pg_namespace n ON n.oid=src.relnamespace
    WHERE n.nspname='public' AND con.contype='f'
      AND ( (src.relname IN (${lista(FRENTE)}) AND tgt.relname IN (${lista(SERVICIOS)}))
         OR (src.relname IN (${lista(SERVICIOS)}) AND tgt.relname IN (${lista(FRENTE)})) )`);
  return {
    ok: cruces.length === 0,
    detalle: cruces.map((c) => `${c.origen} → ${c.destino} (${c.conname})`),
  };
});

// ── ③ Ningún camino de escritura de un pedido al motor de puntos ────────────
invariante(3, 'Ningún camino de escritura de un pedido al motor de puntos', () => {
  const triggers = dbQuery(`
    SELECT c.relname tabla, t.tgname, p.proname
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_proc p ON p.oid=t.tgfoid
    WHERE NOT t.tgisinternal AND c.relname IN (${lista(FRENTE)})
      AND pg_get_functiondef(p.oid) ~* '(${LOYALTY.join('|')}|otorgar_puntos)'`);

  const funciones = dbQuery(`
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND pg_get_functiondef(p.oid) ~* '(${LOYALTY.join('|')}|otorgar_puntos)'
      AND pg_get_functiondef(p.oid) ~* '(${FRENTE.join('|')})'`);

  const detalle = [];
  if (triggers.length) detalle.push(`triggers: ${triggers.map((t) => `${t.tabla}.${t.tgname}→${t.proname}`).join(', ')}`);
  if (funciones.length) detalle.push(`funciones que tocan ambos mundos: ${funciones.map((f) => f.proname).join(', ')}`);
  return { ok: !triggers.length && !funciones.length, detalle };
});

// ── ④ El rol vendedor sin acceso al expediente ──────────────────────────────
invariante(4, 'El rol vendedor sin ningún camino al expediente', () => {
  // El rol no es un rol de Postgres: es una fila en cuenta_roles. Se mide por
  // el predicado — ninguna policy del expediente puede resolver por vendedor.
  const policies = dbQuery(`
    SELECT tablename, policyname, cmd FROM pg_policies
    WHERE schemaname='public' AND tablename IN (${lista(EXPEDIENTE)})
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) ~* '(seller|vendedor|pedido|oferta|producto_id)'`);

  const helpers = dbQuery(`
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname ~* '(acceso|puede|gestiona|tiene)'
      AND pg_get_functiondef(p.oid) ~* 'seller_productos'`);

  const detalle = [];
  if (policies.length) detalle.push(`policies del expediente que nombran comercio: ${policies.map((p) => `${p.tablename}.${p.policyname}`).join(', ')}`);
  if (helpers.length) detalle.push(`helpers de acceso que resuelven por seller_productos: ${helpers.map((h) => h.proname).join(', ')}`);
  return { ok: !policies.length && !helpers.length, detalle };
});

// ── ⑤ La comisión es parámetro vigente, jamás constante ─────────────────────
invariante(5, 'La comisión vive en fee_configs con su base declarada · cero constantes en código', () => {
  const vigentes = dbQuery(`
    SELECT country_code, parametros, vigencia_desde, vigencia_hasta
    FROM fee_configs
    WHERE tipo_actor='seller_productos' AND activo=true AND country_code='EC'
      AND now() >= vigencia_desde AND (vigencia_hasta IS NULL OR now() < vigencia_hasta)`);

  const detalle = [];
  if (vigentes.length !== 1) {
    detalle.push(`fee_configs vigentes para seller_productos/EC: ${vigentes.length} (se espera exactamente 1)`);
  }
  const fila = vigentes[0];
  if (fila) {
    const pct = fila.parametros?.pct;
    const base = fila.parametros?.base;
    if (Number(pct) !== 10) detalle.push(`el pct vigente es ${pct}, la letra firma 10`);
    if (!base) detalle.push(`el parametro "base" no está declarado — nadie puede saber sobre qué calcula ese pct`);
  }

  // Cero constantes de comisión en el código del monorepo.
  let hits = '';
  try {
    hits = execSync(
      `grep -rn "take_rate\\|comision_pct" apps packages supabase/functions | grep -v database.types || true`,
      { encoding: 'utf8' },
    ).trim();
  } catch { hits = ''; }
  if (hits) detalle.push(`constantes de comisión en código: ${hits.split('\n').length} hits`);

  return { ok: detalle.length === 0, detalle };
});

// ── ⑥ producto_asignacion sigue siendo UNO ──────────────────────────────────
invariante(6, '`producto_asignacion` sigue siendo UNO — nadie lo duplicó', () => {
  const tipos = dbQuery(`
    SELECT codigo, tabla_tipada, activo FROM cat_tipos_evento
    WHERE codigo ~* 'producto' OR codigo ~* 'compra' OR codigo ~* 'pedido'`);
  const detalle = [];
  if (tipos.length !== 1) detalle.push(`tipos de evento de producto: ${tipos.map((t) => t.codigo).join(', ') || '(ninguno)'} — se espera exactamente 1`);
  const t = tipos.find((x) => x.codigo === 'producto_asignacion');
  if (!t) detalle.push('`producto_asignacion` no existe');
  else if (!t.tabla_tipada) detalle.push('`producto_asignacion.tabla_tipada` sigue en NULL — el detalle no tiene casa');
  return { ok: detalle.length === 0, detalle };
});

// ── ⑦ Append-only de verdad: sin permiso de UPDATE ──────────────────────────
invariante(7, 'Las tablas de estado y de movimiento no admiten UPDATE (append-only de verdad)', () => {
  const existen = tablasQueExisten(APPEND_ONLY);
  const faltan = APPEND_ONLY.filter((t) => !existen.includes(t));

  const policiesUpdate = dbQuery(`
    SELECT tablename, policyname, cmd FROM pg_policies
    WHERE schemaname='public' AND tablename IN (${lista(APPEND_ONLY)}) AND cmd IN ('UPDATE','ALL','DELETE')`)
    .map((r) => `${r.tablename}.${r.policyname} (${r.cmd})`);

  const grants = dbQuery(`
    SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
    WHERE table_schema='public' AND table_name IN (${lista(APPEND_ONLY)})
      AND grantee IN ('anon','authenticated') AND privilege_type IN ('UPDATE','DELETE','TRUNCATE')`)
    .map((r) => `${r.table_name}: ${r.grantee} tiene ${r.privilege_type}`);

  const detalle = [];
  if (faltan.length) detalle.push(`faltan: ${faltan.join(', ')}`);
  if (policiesUpdate.length) detalle.push(`policies que permiten mutar: ${policiesUpdate.join(', ')}`);
  if (grants.length) detalle.push(`grants de mutación: ${grants.join(' · ')}`);
  return { ok: !faltan.length && !policiesUpdate.length && !grants.length, detalle };
});

// ── ⑧ Todo monto con su moneda al lado ──────────────────────────────────────
invariante(8, 'Toda columna de monto lleva su moneda al lado — ningún monto huérfano', () => {
  const filas = dbQuery(`
    WITH montos AS (
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name IN (${lista(FRENTE)})
        AND (column_name ~* '(precio|monto|total|subtotal|costo|tarifa|descuento|reembolso)')
        AND data_type = 'numeric'
    ), conmoneda AS (
      SELECT DISTINCT table_name FROM information_schema.columns
      WHERE table_schema='public' AND column_name = 'moneda'
    )
    SELECT m.table_name, string_agg(m.column_name, ', ' ORDER BY m.column_name) columnas
    FROM montos m WHERE m.table_name NOT IN (SELECT table_name FROM conmoneda)
    GROUP BY m.table_name ORDER BY 1`);
  return {
    ok: filas.length === 0,
    detalle: filas.map((f) => `${f.table_name} sin columna \`moneda\`: ${f.columnas}`),
  };
});

// ── ⑨ La línea de descuento declara su financiador ──────────────────────────
invariante(9, 'La línea de descuento declara QUIÉN la financia', () => {
  const col = dbQuery(`
    SELECT is_nullable, data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pedido_descuentos' AND column_name='financiado_por'`);
  if (!col.length) return { ok: false, detalle: ['`pedido_descuentos.financiado_por` no existe'] };
  if (col[0].is_nullable === 'YES') return { ok: false, detalle: ['`financiado_por` es NULLABLE — un descuento sin financiador es una discusión en la primera liquidación'] };
  return { ok: true, detalle: [] };
});

// ── ⑩ Cero tablas nuevas que dupliquen una del censo ────────────────────────
invariante(10, 'Cero duplicados: las 17 tablas jubiladas ya no existen', () => {
  const vivas = tablasQueExisten(JUBILADAS);
  return {
    ok: vivas.length === 0,
    detalle: vivas.length ? [`siguen vivas ${vivas.length} de ${JUBILADAS.length}: ${vivas.join(', ')}`] : [],
  };
});

// ── ⑪ pedidos sin INSERT anónimo (D-757) ────────────────────────────────────
invariante(11, '🔴 `pedidos` sin INSERT anónimo (D-757)', () => {
  const policies = dbQuery(`
    SELECT policyname, cmd, roles::text, with_check FROM pg_policies
    WHERE schemaname='public' AND tablename='pedidos'
      AND cmd IN ('INSERT','ALL') AND roles::text ~ '(public|anon)'`);
  const grants = dbQuery(`
    SELECT privilege_type FROM information_schema.role_table_grants
    WHERE table_schema='public' AND table_name='pedidos' AND grantee='anon'
      AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE')`);
  const detalle = [];
  if (policies.length) detalle.push(`policies de escritura abiertas a public/anon: ${policies.map((p) => `${p.policyname} (${p.cmd})`).join(', ')}`);
  if (grants.length) detalle.push(`anon conserva grants de escritura: ${grants.map((g) => g.privilege_type).join(', ')}`);
  return { ok: !policies.length && !grants.length, detalle };
});

// ── Veredicto ───────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════════════════');
console.log('  EL JUEZ DE LA DESPENSA — S95-C');
console.log('════════════════════════════════════════════════════════════════════\n');

let rojos = 0;
for (const r of resultados) {
  const marca = r.veredicto === 'VERDE' ? '✅ VERDE' : '❌ ROJO ';
  console.log(`${marca}  ${String(r.n).padStart(2)} · ${r.titulo}`);
  for (const d of r.detalle) console.log(`            ↳ ${d}`);
  if (r.veredicto === 'ROJO') rojos++;
}

console.log('\n────────────────────────────────────────────────────────────────────');
console.log(`  ${resultados.length - rojos} en verde · ${rojos} en ROJO`);
if (rojos) {
  console.log('\n  🔴 UN JUEZ EN ROJO ES UN HALLAZGO, NO UN OBSTÁCULO.');
  console.log('     Se frena y se eleva. El test no se ablanda.');
}
console.log('────────────────────────────────────────────────────────────────────\n');
process.exit(rojos ? 1 : 0);
