// ─────────────────────────────────────────────────────────────────────────────
// EL JUEZ DE LA DESPENSA · S96 — hereda los 28 de S95 y suma los de las DOS
// LETRAS (`LETRA_PANEL_VENDEDOR_S96` + `LETRA_RECORRIDO_DESPENSA_S96`).
//
// HERENCIA CON TRES ENMIENDAS, cada una con su letra fuente — el test no se
// ablanda: cambia porque la LEY cambió, y el cambio queda escrito acá:
//   · inv. 13 — el depósito al expediente ganó DOS puertas legítimas más:
//     el reclamo de mostrador (§4 de la letra: el cliente reclama con el
//     código) y atar-después (la regla general: la app ofrece atar, el dueño
//     decide). La lista de depositores autorizados es CERRADA y se mide.
//   · inv. 15 — el actor `repartidor` existe por letra (§9: el cuarto escalón
//     lo marca quien está en la puerta).
//   · inv. 17 — la lista de funciones del motor crece con las de S96.
// El juez de S95 (`scripts/s95/juez-despensa.mjs`) queda INTACTO como
// registro: sus verdes eran contra la ley de su día.
//
// 🔴 UN JUEZ EN ROJO ES UN HALLAZGO, NO UN OBSTÁCULO.
//    Si un invariante no pasa se FRENA y se ELEVA al founder. Jamás se ablanda
//    el test, jamás se comenta, jamás se marca como excepción. Es L-192: todo
//    chequeo tiene que poder salir rojo. Un loop que puede modificar a su propio
//    juez no es un loop — es un agente convenciéndose a sí mismo.
//
// SOLO LECTURA. Uso: node scripts/s96/juez-s96.mjs
// Exit 0 = todo verde. Exit 1 = hay rojo.
// ─────────────────────────────────────────────────────────────────────────────
import { dbQuery } from '../lib-db.mjs';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

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
  // ── S96: el repartidor, el destino, el mostrador, el cupo, la recurrencia ─
  'repartidores', 'pedido_item_destinos', 'ventas_mostrador',
  'venta_mostrador_items', 'recursos_reparto', 'recurso_reparto_excepciones',
  'entrega_turnos', 'pedidos_recurrencias', 'cat_tipos_servicio_envio',
];

// Tablas del dominio de SERVICIOS. Ninguna FK puede cruzar contra FRENTE.
//
// ⚠️ HISTORIA DE ESTA LISTA — se deja escrita porque LA LISTA ES EL TEST, y un
// test cuya lista cambia sin razón registrada deja de ser auditable.
//
//   · Primera corrida: VERDE FLOJO. La lista era corta y no miraba las tablas
//     que cruzaban de verdad. Un invariante verde porque su lista es corta es
//     peor que uno rojo: dice un número más chico, y eso se lee como progreso.
//
//   · Corregida POR MEDICIÓN DE COLUMNAS, no por nombre, aparecieron dos:
//       – `servicios_exequiales`: prestador_id, fecha_servicio,
//         direccion_recogida, certificado_url → SERVICIO cobrado por la tabla
//         de pedidos de producto. Violación real. **Jubilada en la M1.**
//       – `tickets_soporte`: ver abajo.
//
//   · 🔴 `tickets_soporte` SALE DE ESTA LISTA — firma del founder, 11-ago-2026,
//     sobre la razón MEDIDA: **sin `prestador_id`; referencia ambos dominios
//     porque es soporte, no ejecución de servicio.** Un ticket no produce un
//     SKU ni comparte tabla con una cita: no es lo que §3.4 prohíbe.
//     *No se sacó para que el juez se pusiera verde — se elevó primero y se
//     sacó después de la firma.*
const SERVICIOS = [
  'evento_cita_servicio', 'evento_atencion', 'prestadores', 'prestador_empleados',
  'prestador_servicios', 'prestador_horarios', 'tipos_servicio', 'bonos',
  'suscripciones_servicio', 'estadias', 'eventos_mascota_grooming',
  'eventos_mascota_paseo', 'eventos_mascota_adiestramiento',
  'evento_grooming_servicios_aplicados', 'evento_paseo_novedades',
  'prestador_programas', 'programas_contratados', 'prestador_especialidades',
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
//
// 🔴 `cupones` y `cupon_usos` SALIERON DE ESTA LISTA — firma del founder,
//    11-ago-2026, sobre el hallazgo de la medición: hay una campaña
//    **«Lanzamiento de nuestra App»**, por WhatsApp, en estado **programada**,
//    con el cupón **AMIGOS05 ACTIVO** al 5 % y cero usos. `MODELO_LOYALTY` §9
//    declara que el motor de campañas YA OPERA y es el canal de entrega de los
//    beneficios del programa. **No son de la despensa: apagarlas apagaba una
//    campaña de lanzamiento que todavía no salió.**
//
// ⚠️ `seller_perfil` y `resenas_productos` SIGUEN EN LA LISTA y por eso el
//    invariante 10 sigue rojo. Es correcto: hay que apagarlas, pero la M1 las
//    frenó porque una vista que sirve a OTRO frente depende de ellas
//    (`v_pitch_metrics` cuenta prestadores, mascotas y citas; `v_resenas_todas`
//    une opiniones de productos con las de PRESTADORES). El rojo es el
//    pendiente, no un defecto del test.
const JUBILADAS = [
  'seller_inventario', 'seller_comisiones', 'seller_perfil', 'seller_documentos',
  'seller_reglas_asignacion', 'mensajes_admin_seller', 'pedidos_recurrentes',
  'resenas_productos', 'wishlist', 'lista_espera', 'planes_nutricion',
  'checkout_sesiones', 'vtex_sync_log',
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

// ═══════════════════════════════════════════════════════════════════════════
// LOS SIETE DE S95-D — el motor. Los 11 de arriba vigilan el ESQUELETO; estos
// vigilan que el MOTOR no rompa lo que el esqueleto garantizaba.
// ═══════════════════════════════════════════════════════════════════════════

// ENMIENDA S96: `calcular_promesa_entrega` (bodega) MURIÓ — la promesa es por
// turno y cupo. Entran las funciones nuevas de las dos letras.
const FUNCIONES_MOTOR = [
  'cotizar_envio_despensa', 'calcular_promesa_despensa', 'mover_estado_pedido',
  'crear_pedido_despensa', 'reservar_stock_pedido', 'confirmar_pago_pedido',
  'empacar_pedido', 'entregar_pedido', 'cancelar_pedido_despensa',
  'registrar_senal_comercial', 'es_vendedor_de', 'resolver_comision_despensa',
  'expirar_reservas_vencidas',
  'despachar_pedido', 'marcar_en_camino_a_destino', 'marcar_entrega_fallida',
  'registrar_repartidor', 'actualizar_repartidor',
  'registrar_venta_mostrador', 'reclamar_compra_mostrador', 'atar_item_a_mascota',
  'cupo_reparto_del_dia', 'definir_recurso_reparto', 'declarar_excepcion_recurso',
  'definir_turno_entrega', 'configurar_recurrencia', 'alternar_recurrencia',
  'adjuntar_fotos_producto',
];

// ── ⑫ Ninguna transición ocurre fuera de la función ─────────────────────────
invariante(12, 'Ninguna transición de estado ocurre fuera de `mover_estado_pedido`', () => {
  // La app no puede escribir `pedidos.estado` a mano: sin UPDATE sobre pedidos
  // para el cliente y el vendedor, la única vía es la función DEFINER.
  const policies = dbQuery(`
    SELECT policyname, roles::text, qual FROM pg_policies
    WHERE schemaname='public' AND tablename='pedidos' AND cmd IN ('UPDATE','ALL')
      AND COALESCE(qual,'') !~ 'is_admin'`);
  const grantsEstados = dbQuery(`
    SELECT grantee, privilege_type FROM information_schema.role_table_grants
    WHERE table_schema='public' AND table_name='pedido_estados'
      AND grantee IN ('anon','authenticated') AND privilege_type IN ('UPDATE','DELETE')`);
  const detalle = [];
  if (policies.length) detalle.push(`policies de UPDATE sobre pedidos sin gate de admin: ${policies.map((p) => p.policyname).join(', ')}`);
  if (grantsEstados.length) detalle.push(`la historia de estados se puede mutar: ${grantsEstados.map((g) => `${g.grantee} ${g.privilege_type}`).join(', ')}`);
  return { ok: !policies.length && !grantsEstados.length, detalle };
});

// ── ⑬ El evento al expediente solo nace de sus TRES puertas legítimas ───────
//    ENMIENDA S96 (con letra): a «entregar» se suman el RECLAMO de mostrador
//    (LETRA_RECORRIDO §4: el cliente mete el código y elige la mascota) y
//    ATAR-DESPUÉS (la regla general: la app ofrece atarla, el dueño decide).
//    La escritura física vive en DOS funciones —el helper interno y el
//    reclamo— y el helper solo lo llaman entregar y atar. Todo lo demás es
//    puerta ilegítima. Y la ENTREGA FALLIDA jamás toca el expediente (§9.3).
invariante(13, '🔴 El evento al expediente nace SOLO de entregar, reclamar o atar — jamás de una fallida', () => {
  const escriben = dbQuery(`
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND pg_get_functiondef(p.oid) ~ 'INSERT INTO evento_producto_asignacion'
    ORDER BY 1`).map((r) => r.proname);
  const ESCRITORES = ['_depositar_item_en_expediente', 'reclamar_compra_mostrador'];
  const CALLERS = ['entregar_pedido', 'atar_item_a_mascota'];

  const detalle = [];
  if (!escriben.length) detalle.push('nadie deposita el evento de compra: el puente al expediente no tiene productor');
  const ajenas = escriben.filter((f) => !ESCRITORES.includes(f));
  if (ajenas.length) {
    detalle.push(`🔴 depositan fuera de las puertas autorizadas: ${ajenas.join(', ')}`);
  }
  // El helper interno no es alcanzable y solo lo llaman las dos puertas.
  const llaman = dbQuery(`
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname <> '_depositar_item_en_expediente'
      AND pg_get_functiondef(p.oid) ~ '_depositar_item_en_expediente'
    ORDER BY 1`).map((r) => r.proname);
  const callersAjenos = llaman.filter((f) => !CALLERS.includes(f));
  if (callersAjenos.length) {
    detalle.push(`🔴 llaman al depósito interno sin ser puerta: ${callersAjenos.join(', ')}`);
  }
  const alcanzable = dbQuery(`
    SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE') si
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='_depositar_item_en_expediente'`)[0];
  if (alcanzable?.si) detalle.push('🔴 el depósito interno es alcanzable por una sesión común');
  // La fallida jamás deposita. 🔴 SE MIDE LA ESCRITURA (`INSERT INTO`), no la
  // mención: la primera corrida salió ROJA porque el COMENTARIO de la función
  // nombra la tabla para decir que NO la toca — L-170, el censo que lee
  // comentarios como código. Un rojo por la razón equivocada está tan roto
  // como un verde por la razón equivocada.
  const fallida = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ 'INSERT INTO (eventos_mascota|evento_producto_asignacion)') escribe
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='marcar_entrega_fallida'`)[0];
  if (!fallida) detalle.push('marcar_entrega_fallida no existe');
  else if (fallida.escribe) detalle.push('🔴 marcar_entrega_fallida ESCRIBE en el expediente — esto no se entregó (§9.3)');
  return { ok: detalle.length === 0, detalle };
});

// ── ⑭ El ledger comercial sin identidad de mascota ──────────────────────────
invariante(14, 'El ledger comercial no tiene FK ni columna de identidad de mascota', () => {
  const fks = dbQuery(`
    SELECT tgt.relname FROM pg_constraint con
    JOIN pg_class src ON src.oid=con.conrelid
    JOIN pg_class tgt ON tgt.oid=con.confrelid
    WHERE con.contype='f' AND src.relname='senales_comerciales'
      AND tgt.relname IN ('mascotas','eventos_mascota','mascota_perfil_vigente',
                          'evento_producto_asignacion','familia','familia_miembro')`).map((r) => r.relname);
  const cols = dbQuery(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='senales_comerciales'
      AND column_name IN ('mascota_id','pet_hash','familia_id')`).map((r) => r.column_name);
  const detalle = [];
  if (fks.length)  detalle.push(`FK al expediente: ${fks.join(', ')}`);
  if (cols.length) detalle.push(`columnas de identidad: ${cols.join(', ')}`);
  if (!dbQuery(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='senales_comerciales'`).length) {
    detalle.push('la tabla no existe');
  }
  return { ok: !fks.length && !cols.length && detalle.length === 0, detalle };
});

// ── ⑮ Toda transición declara su actor autorizado ──────────────────────────
invariante(15, 'Toda transición del catálogo declara su actor autorizado', () => {
  // ENMIENDA S96 (con letra): el actor `repartidor` existe — el cuarto
  // escalón lo marca quien está en la puerta (LETRA_RECORRIDO §9).
  const sinActor = dbQuery(`
    SELECT count(*) n FROM cat_transiciones_pedido
    WHERE actor IS NULL OR actor NOT IN ('cliente','vendedor','sistema','admin','repartidor')`)[0];
  // Y el discriminador de fondo: el cliente NO puede mover un pedido que ya se
  // está preparando. Si pudiera, cancelaría algo que ya está en una caja.
  const clienteTarde = dbQuery(`
    SELECT desde, hasta FROM cat_transiciones_pedido
    WHERE actor='cliente' AND desde IN ('liberado_preparacion','picking','empacado',
      'documentado','esperando_courier','entregado_courier','en_transito','en_reparto','entregado')`);
  const detalle = [];
  if (Number(sinActor?.n) > 0) detalle.push(`${sinActor.n} transición(es) sin actor válido`);
  if (clienteTarde.length) detalle.push(`el cliente puede mover un pedido ya en preparación: ${clienteTarde.map((t) => `${t.desde}→${t.hasta}`).join(', ')}`);
  return { ok: Number(sinActor?.n) === 0 && !clienteTarde.length, detalle };
});

// ── ⑯ Cero estados internos expuestos ──────────────────────────────────────
invariante(16, '🔴 Cero estados internos expuestos: la superficie emite las SIETE narrativas', () => {
  const narrativas = dbQuery(`SELECT count(*) n FROM cat_narrativas_pedido`)[0];
  const sinNarrativa = dbQuery(`
    SELECT string_agg(codigo, ', ') c FROM cat_estados_pedido WHERE narrativa IS NULL`)[0];
  // 🔴 SE MIDE POR LAS COLUMNAS QUE LA VISTA EXPONE, NO POR EL TEXTO DE SU
  //    DEFINICIÓN. La primera versión buscaba `p.estado` en el `viewdef` y
  //    salía ROJA por el JOIN —`ON e.codigo = p.estado`—, que no expone nada.
  //    **Un rojo por la razón equivocada está tan roto como un verde por la
  //    razón equivocada**: es el mismo error que el verde flojo del cinturón
  //    en S95-C, medir por nombre en vez de por estructura, esta vez en
  //    espejo. Lo que importa es qué SALE de la vista.
  const vistaExpone = dbQuery(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='v_pedidos_narrativa'
      AND column_name IN ('estado','estado_codigo','estado_interno')`)
    .map((r) => r.column_name);
  const columnaDoble = dbQuery(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pedidos'
      AND column_name IN ('narrativa','estado_narrativa')`).map((r) => r.column_name);

  const detalle = [];
  if (Number(narrativas?.n) !== 7) detalle.push(`hay ${narrativas?.n} narrativas y la letra firma 7`);
  if (sinNarrativa?.c) detalle.push(`estados sin narrativa: ${sinNarrativa.c}`);
  if (vistaExpone.length) detalle.push(`la vista de la familia EXPONE el estado crudo como columna: ${vistaExpone.join(', ')}`);
  if (columnaDoble.length) detalle.push(`la narrativa está duplicada en columna: ${columnaDoble.join(', ')} — segunda fuente de verdad`);
  return { ok: detalle.length === 0, detalle };
});

// ── ⑰ Toda función del motor es DEFINER con search_path y sin anon ─────────
invariante(17, 'Toda función del motor es DEFINER, con `search_path` fijo y sin `anon`', () => {
  const fs = dbQuery(`
    SELECT p.proname, p.prosecdef definer, (p.proconfig IS NOT NULL) tiene_path,
           has_function_privilege('anon', p.oid, 'EXECUTE') anon
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN (${FUNCIONES_MOTOR.map((f) => `'${f}'`).join(',')})
    ORDER BY 1`);
  const detalle = [];
  const faltan = FUNCIONES_MOTOR.filter((f) => !fs.some((x) => x.proname === f));
  if (faltan.length) detalle.push(`faltan: ${faltan.join(', ')}`);
  for (const f of fs) {
    if (!f.definer)     detalle.push(`${f.proname}: NO es SECURITY DEFINER`);
    if (!f.tiene_path)  detalle.push(`${f.proname}: sin \`search_path\` fijo`);
    if (f.anon)         detalle.push(`${f.proname}: 🔴 ejecutable por anon (L-140)`);
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ⑱ Ningún estado inactivo es alcanzable ─────────────────────────────────
invariante(18, 'Ningún estado inactivo es alcanzable por el motor', () => {
  const detalle = [];
  // El motor tiene que MIRAR la bandera. Si `mover_estado_pedido` no lee
  // `activo`, un estado apagado se alcanza igual y el catálogo es decorativo.
  const lee = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ 'activo') mira
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='_mover_estado_pedido'`)[0];
  // 🔴 SE MIRA EL ANILLO INTERNO, y este cambio es del INSTRUMENTO, no del
  //    test: desde S95-G la puerta pública `mover_estado_pedido` solo rechaza
  //    el actor `sistema` y delega; la bandera `activo` la lee
  //    `_mover_estado_pedido`. Apuntar a la pública daba ROJO contra código
  //    correcto — un rojo por la razón equivocada.
  if (!lee) detalle.push('`_mover_estado_pedido` no existe');
  else if (!lee.mira) detalle.push('🔴 `_mover_estado_pedido` no mira la bandera `activo`: los estados apagados son alcanzables y el catálogo es decorativo');

  // Y todo estado apagado dice POR QUÉ.
  const sinMotivo = dbQuery(`
    SELECT string_agg(codigo, ', ') c FROM cat_estados_pedido
    WHERE NOT activo AND motivo_inactivo IS NULL`)[0];
  if (sinMotivo?.c) detalle.push(`estados apagados sin motivo: ${sinMotivo.c}`);

  const tiposSinMotivo = dbQuery(`
    SELECT string_agg(codigo, ', ') c FROM cat_tipos_regla_envio
    WHERE NOT activo AND motivo_inactivo IS NULL`)[0];
  if (tiposSinMotivo?.c) detalle.push(`tipos de regla apagados sin motivo: ${tiposSinMotivo.c}`);

  return { ok: detalle.length === 0, detalle };
});


// ═══════════════════════════════════════════════════════════════════════════
// S95-E · LOS CUATRO DE LA CAPA DE WRAPPERS (19 → 22)
//
// Los dieciocho de arriba miden la BASE. Estos miden el CÓDIGO de
// `packages/api`, porque los defectos que esta capa puede introducir no se ven
// desde Postgres: una escritura directa, un estado interno que se escapa, una
// suma de plata, el nombre de una pasarela.
//
// 🔴 SE MIDE POR ESTRUCTURA, NO POR NOMBRE. En S95-C un verde salió flojo por
//    clasificar por nombre de tabla, y en S95-D un rojo salió por la razón
//    equivocada al buscar en el TEXTO de una vista en vez de sus columnas. Un
//    rojo por el motivo equivocado está tan roto como un verde por el motivo
//    equivocado.
// ═══════════════════════════════════════════════════════════════════════════

const DIR_WRAPPERS = 'packages/api/src/wrappers';
const archivosDespensa = readdirSync(DIR_WRAPPERS)
  .filter((f) => /^_?despensa-.*\.ts$/.test(f));
const fuenteDespensa = archivosDespensa.map((f) => ({
  archivo: f,
  texto: readFileSync(`${DIR_WRAPPERS}/${f}`, 'utf8'),
}));

/** Las líneas de código de un archivo, SIN comentarios. Sin esto el juez
 *  mide la prosa: este repo documenta el porqué adentro del código, así que
 *  medir el texto crudo daría rojos por explicaciones. */
const lineasDeCodigo = (texto) =>
  texto
    .split('\n')
    .map((l, i) => ({ n: i + 1, s: l }))
    .filter(({ s }) => {
      const t = s.trim();
      return t.length > 0 && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
    });

// ── ⑲ Cero escrituras directas: toda escritura pasa por RPC ─────────────────
invariante(19, 'Cero escrituras directas a tablas desde los wrappers de la despensa', () => {
  const detalle = [];
  for (const { archivo, texto } of fuenteDespensa) {
    for (const { n, s } of lineasDeCodigo(texto)) {
      const m = s.match(/\.(insert|update|delete|upsert)\s*\(/);
      if (m) detalle.push(`${archivo}:${n} escribe directo con .${m[1]}()`);
    }
  }
  // ALCANCE DECLARADO, y el número del resto va como DATO, no como veredicto:
  // los otros frentes (paseo, grooming, veterinaria, equipo…) tienen 46
  // escrituras directas en 16 archivos. **No entran al veredicto porque no son
  // territorio de esta tanda y esta tanda no puede curarlos**, pero se cuentan
  // para que el número exista y nadie lo redescubra dentro de tres sesiones.
  const otros = readdirSync(DIR_WRAPPERS)
    .filter((f) => f.endsWith('.ts') && !/despensa/.test(f))
    .reduce((acc, f) => {
      const t = readFileSync(`${DIR_WRAPPERS}/${f}`, 'utf8');
      return acc + lineasDeCodigo(t).filter(({ s }) => /\.(insert|update|delete|upsert)\s*\(/.test(s)).length;
    }, 0);
  console.error(`   (dato, fuera de veredicto) escrituras directas en el resto de packages/api: ${otros}`);
  return { ok: detalle.length === 0, detalle };
});

// ── ⑳ Ningún estado interno sale de la capa ─────────────────────────────────
invariante(20, 'Ningún estado interno sale de packages/api: solo las SIETE narrativas', () => {
  const detalle = [];
  const internos = dbQuery(`SELECT codigo FROM cat_estados_pedido`).map((r) => r.codigo);
  const narrativas = dbQuery(`SELECT codigo FROM cat_narrativas_pedido`).map((r) => r.codigo);
  // Un código que además es narrativa (`entregado`, `cancelado`) no cuenta:
  // ahí la palabra es la voz de la familia, no la fontanería.
  const soloInternos = internos.filter((c) => !narrativas.includes(c));

  // 🔴 LA DISTINCIÓN QUE HACE ÚTIL A ESTE TEST — Y QUE LA PRIMERA VERSIÓN NO
  //    HACÍA: el invariante dice que ningún estado interno **SALE**. Un
  //    literal como `'picking'` que viaja como ARGUMENTO hacia
  //    `mover_estado_pedido` no sale: **entra**, y es exactamente cómo el
  //    vendedor pide un movimiento. La primera versión medía «lo menciona» en
  //    vez de «en qué dirección va», y salió roja contra dos líneas
  //    perfectamente correctas. Es el mismo error del invariante 16 en S95-D:
  //    un rojo por la razón equivocada está tan roto como un verde por la
  //    razón equivocada.
  //
  //    LA SALIDA de esta capa son DOS posiciones, y son las que se miden:
  //      ① lo que se devuelve  → cualquier línea con `return`
  //      ② lo que se declara   → los bloques `export interface` / `export type`
  // 🔴 LA REGLA, EN UNA LÍNEA: un literal de estado interno **adentro de los
  //    paréntesis de una llamada ENTRA al motor; fuera de ellos, SALE.**
  //
  //    `return moverComoVendedor(pedidoId, 'picking')` → profundidad 1 → entra.
  //    `return { estado: 'picking' }`                  → profundidad 0 → sale.
  //    `interface X { estado: 'picking' }`             → profundidad 0 → sale.
  //
  //    La profundidad se acumula sobre TODO el archivo, no por línea: las
  //    llamadas de este repo abarcan varias líneas y medir línea por línea
  //    daría falsos rojos en cada `.rpc(` multilínea.
  for (const { archivo, texto } of fuenteDespensa) {
    let profundidad = 0;
    for (const { n, s } of lineasDeCodigo(texto)) {
      let col = 0;
      for (const ch of s) {
        if (ch === '(') profundidad++;
        else if (ch === ')') profundidad = Math.max(0, profundidad - 1);
        col++;
        if (profundidad !== 0) continue;
        for (const cod of soloInternos) {
          const lit = `'${cod}'`;
          if (s.startsWith(lit, col - 1) && s[col - 1] === "'") {
            detalle.push(`${archivo}:${n} expone el estado interno '${cod}' fuera de una llamada`);
          }
        }
      }
    }
  }
  // Y la contraparte positiva: los tipos que viajan a la superficie tienen que
  // estar tipados con `NarrativaPedido`, no con `string`.
  const seguimiento = fuenteDespensa.find((f) => f.archivo === 'despensa-seguimiento.ts');
  if (seguimiento && !/narrativa:\s*NarrativaPedido/.test(seguimiento.texto)) {
    detalle.push('despensa-seguimiento.ts no tipa `narrativa` como NarrativaPedido');
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㉑ Ningún wrapper calcula plata ──────────────────────────────────────────
invariante(21, 'Ningún wrapper calcula plata: ni total, ni impuesto, ni flete', () => {
  const detalle = [];
  // Se busca aritmética SOBRE identificadores de dinero. `limite ?? 100` o un
  // `slice(0,5)` no son plata; `precio * cantidad` sí.
  const PLATA = /(precio|total|subtotal|impuesto|costo|monto|envio|descuento|iva|comision|tarifa)/i;
  const ARIT = /[a-z_\].)]\s*[*/+-]\s*[a-z0-9_(]/i;
  for (const { archivo, texto } of fuenteDespensa) {
    for (const { n, s } of lineasDeCodigo(texto)) {
      if (!PLATA.test(s) || !ARIT.test(s)) continue;
      detalle.push(`${archivo}:${n} hace aritmética sobre plata → ${s.trim().slice(0, 90)}`);
    }
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㉒ Ninguna credencial ni nombre de proveedor de pago ─────────────────────
invariante(22, 'Cero credenciales de pasarela y cero nombres de proveedor en los wrappers', () => {
  const detalle = [];
  // Los proveedores que la casa nombró alguna vez + los de la plaza. Si mañana
  // se elige uno, su nombre tiene que vivir en el BACKEND, no acá.
  const PROVEEDORES =
    /(kushki|nuvei|stripe|paypal|payphone|datafast|placetopay|mercadopago|culqi|dlocal|epayco|paymentez)/i;
  const SECRETOS = /(secret|api[_-]?key|private[_-]?key|client[_-]?secret|sk_live|sk_test|pk_live|bearer\s+[A-Za-z0-9])/i;
  for (const { archivo, texto } of fuenteDespensa) {
    for (const { n, s } of lineasDeCodigo(texto)) {
      if (PROVEEDORES.test(s)) detalle.push(`${archivo}:${n} nombra un proveedor de pago`);
      if (SECRETOS.test(s)) detalle.push(`${archivo}:${n} parece traer una credencial`);
    }
  }
  // Y la puerta que NO puede existir en esta capa: confirmar el pago es del
  // backend. Si `confirmar_pago_pedido` se exportara desde acá, cualquiera con
  // la anon key —que viaja en el bundle— declararía un pedido pagado.
  const indice = readFileSync('packages/api/src/index.ts', 'utf8');
  if (/confirmarPagoPedido|confirmar_pago_pedido/.test(indice)) {
    detalle.push('🔴 packages/api exporta la confirmación de pago: la anon key podría marcar pagado sin pagar');
  }
  return { ok: detalle.length === 0, detalle };
});


// ═══════════════════════════════════════════════════════════════════════════
// S95-G · LOS CUATRO DE LA AUTORIZACIÓN (23 → 26)
//
// Nacen de un agujero MEDIDO: cinco funciones del motor eran alcanzables desde
// una sesión común y movían el pedido de otra persona. La lección no es
// «faltaba un IF»: es que **la autorización se puso donde el actor viajaba
// como parámetro y no donde estaba implícito**. Estos invariantes vigilan
// justamente eso, y por estructura — no por nombre.
// ═══════════════════════════════════════════════════════════════════════════

// Las funciones del motor de la despensa, con su firma. Se listan porque el
// juez tiene que saber QUÉ vigila; su comportamiento se mide, no se supone.
const MOTOR = [
  'cotizar_envio_despensa', 'calcular_promesa_despensa', 'mover_estado_pedido',
  '_mover_estado_pedido', 'crear_pedido_despensa', 'reservar_stock_pedido',
  'confirmar_pago_pedido', 'empacar_pedido', 'entregar_pedido',
  'cancelar_pedido_despensa', 'registrar_senal_comercial',
  'registrar_factura_pedido', 'ajustar_stock_vendedor',
  // S96
  'despachar_pedido', 'marcar_en_camino_a_destino', 'marcar_entrega_fallida',
  'registrar_repartidor', 'actualizar_repartidor', 'registrar_venta_mostrador',
  'reclamar_compra_mostrador', 'atar_item_a_mascota', 'configurar_recurrencia',
  'alternar_recurrencia', 'adjuntar_fotos_producto',
];

const cuerposMotor = () =>
  dbQuery(`
    SELECT p.proname,
           pg_get_function_identity_arguments(p.oid) args,
           pg_get_functiondef(p.oid) def,
           p.provolatile,
           has_function_privilege('authenticated', p.oid, 'EXECUTE') concedida
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname IN (${lista(MOTOR)})
    ORDER BY p.proname`);

// ── ㉓ Toda función que ESCRIBE y es alcanzable, verifica a quien llama ──────
invariante(23, 'Toda función del motor concedida a `authenticated` verifica al actor en su cuerpo', () => {
  const detalle = [];
  // 🔴 QUIÉN ENTRA AL EXAMEN, por ESTRUCTURA y no por una lista de excepciones:
  //    ① tiene que ser alcanzable (`concedida`), y
  //    ② tiene que poder ESCRIBIR — `provolatile = 'v'`. Una función STABLE no
  //       muta nada, así que no hay nada que autorizar; el catálogo de precios
  //       lo puede leer cualquiera con sesión.
  //    ③ y tiene que tocar datos que pueden ser DE OTRO: `pedidos`,
  //       `vendedor_skus`, `inventario_*` o `facturas`. Un log propio como
  //       `senales_comerciales` no tiene dueño ajeno al que proteger.
  const GATES = /(_puede_operar_pedido|es_vendedor_de|is_admin|user_tiene_acceso_a_mascota|42501)/;
  const DATOS_AJENOS = /(pedidos|pedido_items|pedido_estados|vendedor_skus|inventario_|facturas)/;
  for (const f of cuerposMotor()) {
    if (!f.concedida) continue;
    if (f.provolatile !== 'v') continue;
    if (!DATOS_AJENOS.test(f.def)) continue;
    if (!GATES.test(f.def)) {
      detalle.push(`${f.proname}(${f.args}) escribe datos que pueden ser de otro y NO verifica a quien llama`);
    }
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㉔ Todo actor de la tabla de transiciones tiene su verificación ──────────
invariante(24, 'Todo actor declarado en las transiciones tiene gate — un actor sin gate es una puerta', () => {
  const detalle = [];
  const actores = dbQuery(`SELECT DISTINCT actor FROM cat_transiciones_pedido WHERE activo`)
    .map((r) => r.actor);
  const fns = Object.fromEntries(cuerposMotor().map((f) => [f.proname, f]));
  const interno = fns['_mover_estado_pedido'];
  const publica = fns['mover_estado_pedido'];
  if (!interno || !publica) return { ok: false, detalle: ['falta el anillo interno o la puerta pública'] };

  for (const a of actores) {
    // Un actor está cubierto de UNA de dos formas, y las dos son legítimas:
    //   · el anillo interno lo VERIFICA (`p_actor = 'cliente' AND …`), o
    //   · la puerta pública lo RECHAZA de plano (el caso de `sistema`).
    const verificado = new RegExp(`p_actor = '${a}'`).test(interno.def);
    const rechazado = new RegExp(`p_actor = '${a}'[\\s\\S]{0,200}RAISE EXCEPTION`).test(publica.def);
    if (!verificado && !rechazado) {
      detalle.push(`el actor '${a}' no tiene ni verificación ni rechazo: es una puerta`);
    }
  }
  // Y el candado que sostiene todo: el anillo interno NO puede ser alcanzable.
  if (interno.concedida) {
    detalle.push('🔴 `_mover_estado_pedido` está concedida a authenticated: el anillo interno es alcanzable y el rechazo de `sistema` se puede saltear');
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㉕ Ningún estado activo es inalcanzable ─────────────────────────────────
invariante(25, 'Ningún estado activo del catálogo es inalcanzable — todo paso tiene quien lo emita', () => {
  const detalle = [];
  // Un estado puede quedar inalcanzable de dos formas distintas, y G.2 era la
  // segunda —la que no se ve mirando la tabla—:
  //   ① no tiene NINGUNA transición activa que entre en él, o
  //   ② solo entra por el actor `sistema`… y NINGUNA función del motor lo
  //      emite. `documentado` estaba así: la transición existía, el productor
  //      no, y el botón «despachado» del vendedor nunca llegaba.
  const estados = dbQuery(`
    SELECT e.codigo,
           (SELECT count(*) FROM cat_transiciones_pedido t
             WHERE t.hasta = e.codigo AND t.activo) entradas,
           (SELECT count(*) FROM cat_transiciones_pedido t
             WHERE t.hasta = e.codigo AND t.activo AND t.actor <> 'sistema') entradas_humanas
    FROM cat_estados_pedido e
    WHERE e.activo AND e.codigo <> 'creado'
    ORDER BY e.orden`);
  const defs = cuerposMotor().map((f) => f.def).join('\n');

  for (const e of estados) {
    if (Number(e.entradas) === 0) {
      detalle.push(`'${e.codigo}' está activo y ninguna transición activa entra en él`);
      continue;
    }
    if (Number(e.entradas_humanas) > 0) continue;   // lo emite una persona
    // Solo entra por `sistema`: alguna función del motor tiene que emitirlo.
    if (!new RegExp(`'${e.codigo}'`).test(defs)) {
      detalle.push(`'${e.codigo}' solo entra por el actor 'sistema' y NINGUNA función del motor lo emite: el flujo se corta ahí`);
    }
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㉖ Los tipos generados están al día ─────────────────────────────────────
invariante(26, 'Los tipos generados están al día con la última migración', () => {
  const detalle = [];
  // 🔴 POR QUÉ ES UN INVARIANTE Y NO UNA TAREA: S95-E encontró que TRECE
  //    migraciones se habían aplicado sin regenerar `database.types.ts`, y la
  //    capa de wrappers estaba bloqueada sin que nadie lo supiera — el
  //    typecheck fallaba por tablas que «no existían». Un desfase de tipos no
  //    avisa: espera a la próxima persona que escriba una consulta.
  const tipos = readFileSync('packages/api/src/database.types.ts', 'utf8');
  const tablas = dbQuery(`
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'`).map((r) => r.relname);
  const faltan = tablas.filter((t) => !tipos.includes(`${t}: {`));
  if (faltan.length > 0) {
    detalle.push(`${faltan.length} tabla(s) sin tipos: ${faltan.slice(0, 8).join(', ')}${faltan.length > 8 ? '…' : ''}`);
  }
  // Las funciones del motor también viajan a los tipos: sin ellas, `.rpc()`
  // no compila y el wrapper no se puede escribir.
  const fnsPublicas = cuerposMotor().filter((f) => f.concedida && !f.proname.startsWith('_'));
  const fnFaltan = fnsPublicas.filter((f) => !tipos.includes(f.proname)).map((f) => f.proname);
  if (fnFaltan.length > 0) detalle.push(`funciones del motor sin tipos: ${fnFaltan.join(', ')}`);
  return { ok: detalle.length === 0, detalle };
});


// ═══════════════════════════════════════════════════════════════════════════
// S95-G2 · LOS DOS DEL ALTA DEL VENDEDOR (27 → 28)
// ═══════════════════════════════════════════════════════════════════════════

// ── ㉗ Cero escrituras directas al alta del vendedor ─────────────────────────
invariante(27, 'Cero escrituras directas a `cuenta_roles`, `reglas_envio` y `vendedor_bodegas`', () => {
  const detalle = [];
  // 🔴 SE MIDE POR ESTRUCTURA: la escritura directa no se prohíbe con una
  //    convención, se vuelve IMPOSIBLE quitando la policy. Sin policy de
  //    escritura, PostgREST no tiene por dónde entrar y la única vía queda
  //    siendo la función DEFINER — que sí valida.
  const abiertas = dbQuery(`
    SELECT tablename, policyname, cmd FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('reglas_envio','vendedor_bodegas')
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')`);
  for (const p of abiertas) {
    detalle.push(`${p.tablename} tiene policy de ${p.cmd} (${p.policyname}): la función de alta es opcional`);
  }
  // `cuenta_roles` es distinta: su única policy de escritura es de ADMIN, que
  // es exactamente quien otorga el rol. No se pide que no tenga ninguna —se
  // pide que ninguna sea del vendedor.
  const rolesNoAdmin = dbQuery(`
    SELECT policyname, cmd, qual FROM pg_policies
    WHERE schemaname='public' AND tablename='cuenta_roles'
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
      AND coalesce(qual,'') !~ 'is_admin'
      AND coalesce(with_check,'') !~ 'is_admin'`);
  for (const p of rolesNoAdmin) {
    detalle.push(`cuenta_roles tiene una policy de ${p.cmd} (${p.policyname}) que no gatea por admin`);
  }
  // Y la contraparte: las tres funciones tienen que EXISTIR. Si no, cerrar las
  // policies habría dejado el alta sin ningún camino.
  const fns = dbQuery(`
    SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN
      ('otorgar_rol_vendedor','definir_regla_envio_vendedor','crear_bodega_vendedor')`)
    .map((r) => r.proname);
  for (const f of ['otorgar_rol_vendedor', 'definir_regla_envio_vendedor', 'crear_bodega_vendedor']) {
    if (!fns.includes(f)) detalle.push(`falta la función de alta \`${f}\`: se cerró la puerta sin abrir la otra`);
  }
  // La lectura NO se puede haber roto: sin ella el panel del vendedor queda ciego.
  const lecturas = dbQuery(`
    SELECT count(*) n FROM pg_policies WHERE schemaname='public'
      AND tablename IN ('reglas_envio','vendedor_bodegas') AND cmd='SELECT'`)[0];
  if (Number(lecturas.n) < 2) detalle.push('se cerró también la LECTURA: el vendedor no puede ver su regla ni su bodega');
  return { ok: detalle.length === 0, detalle };
});

// ── ㉘ El cotizador rechaza fuera de cobertura ───────────────────────────────
invariante(28, 'El cotizador rechaza un destino fuera de cobertura, jamás con un costo inventado', () => {
  const detalle = [];
  // El cuerpo NO se trae entero: tiene `$$`, comillas y acentos, y pasarlo por
  // el JSON del CLI rompía la consulta — el invariante salía «no se pudo medir»,
  // que es un rojo que no dice nada. Se miden EXPRESIONES en el servidor.
  const f = dbQuery(`
    SELECT pg_get_function_identity_arguments(p.oid) args,
           (pg_get_functiondef(p.oid) ~ 'p_ciudad_destino') recibe_destino,
           (pg_get_functiondef(p.oid) ~ 'fuera_de_cobertura') rebota,
           (position('fuera_de_cobertura' in pg_get_functiondef(p.oid))
            < position('v_costo :=' in pg_get_functiondef(p.oid))) frontera_antes
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='cotizar_envio_despensa'`);

  // 🔴 UNA SOLA VERDAD SOBRE EL FLETE: dos sobrecargas del cotizador serían
  //    dos respuestas distintas al mismo precio según por cuál entre (L-119).
  if (f.length !== 1) {
    detalle.push(`hay ${f.length} versiones de \`cotizar_envio_despensa\`: dos verdades sobre el precio del flete`);
    return { ok: false, detalle };
  }
  const c = f[0];
  if (!/p_ciudad_destino/.test(c.args)) {
    detalle.push('el cotizador no recibe el destino: no puede saber si entrega ahí');
  }
  if (!c.rebota) detalle.push('el cotizador no tiene el rebote `fuera_de_cobertura`');
  // Y que la frontera se evalúe ANTES del precio: si el costo se calculara
  // primero, un destino no cubierto llegaría con un número puesto.
  if (c.rebota && !c.frontera_antes) {
    detalle.push('la frontera se evalúa DESPUÉS de calcular el costo: un destino no cubierto llegaría con precio');
  }
  // El tipo que v1 usa tiene que estar encendido, o no hay flete que cotizar.
  const flota = dbQuery(`SELECT activo FROM cat_tipos_regla_envio WHERE codigo='flota_propia'`)[0];
  if (!flota) detalle.push('no existe el tipo `flota_propia`');
  else if (!flota.activo) detalle.push('`flota_propia` está apagado y es el tipo que v1 usa (moto propia)');
  return { ok: detalle.length === 0, detalle };
});

// ═══════════════════════════════════════════════════════════════════════════
// S96 · LOS DOCE DE LAS DOS LETRAS (29 → 40)
// Un caso por regla dura, por ESTRUCTURA — jamás por nombre.
// ═══════════════════════════════════════════════════════════════════════════

// ── ㉙ El actor repartidor: verificado adentro, rechazado en la puerta ───────
invariante(29, 'S96 · El actor repartidor: gate en el anillo interno, rechazo en la puerta pública', () => {
  const detalle = [];
  const interno = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ 'no_sos_el_repartidor_asignado') gate
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='_mover_estado_pedido'`)[0];
  if (!interno?.gate) detalle.push('el anillo interno no verifica al repartidor');
  const publica = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ 'actor_repartidor_no_invocable') rechaza
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='mover_estado_pedido'`)[0];
  if (!publica?.rechaza) {
    detalle.push('🔴 la puerta pública NO rechaza al repartidor: entregar exige foto y código, y un RPC genérico no puede exigirlos');
  }
  const trans = dbQuery(`
    SELECT count(*) n FROM cat_transiciones_pedido WHERE actor='repartidor' AND activo`)[0];
  if (Number(trans?.n) < 4) detalle.push(`el repartidor tiene ${trans?.n} transiciones activas (se esperan ≥4)`);
  return { ok: detalle.length === 0, detalle };
});

// ── ㉚ «Vamos hacia vos» existe; el tramo courier quedó apagado ──────────────
invariante(30, 'S96 · hacia_destino activo con narrativa en_camino · el courier apagado con motivo', () => {
  const detalle = [];
  if (!dbQuery(`SELECT 1 FROM cat_estados_pedido
                WHERE codigo='hacia_destino' AND activo AND narrativa='en_camino'`).length) {
    detalle.push('hacia_destino no está activo con narrativa en_camino');
  }
  const courier = dbQuery(`
    SELECT string_agg(codigo, ', ') c FROM cat_estados_pedido
    WHERE codigo IN ('esperando_courier','entregado_courier','en_transito')
      AND (activo OR motivo_inactivo IS NULL)`)[0];
  if (courier?.c) detalle.push(`estados de courier vivos o sin motivo: ${courier.c}`);
  return { ok: detalle.length === 0, detalle };
});

// ── ㉛ El repartidor ve SU envío y nada más ──────────────────────────────────
invariante(31, '🔴 S96 · El repartidor ve su envío y NADA más — cerrado en policies, no en pantalla', () => {
  const detalle = [];
  // El brazo existe en envios…
  const brazo = dbQuery(`
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='envios'
      AND cmd='SELECT' AND qual ~ 'repartidores'`);
  if (!brazo.length) detalle.push('envios.SELECT no tiene el brazo del repartidor asignado');
  // …y en NINGUNA otra tabla: el rol no abre catálogo, pedidos ni expediente.
  const fugas = dbQuery(`
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename <> 'envios' AND tablename <> 'repartidores'
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) ~ 'repartidores'`);
  if (fugas.length) {
    detalle.push(`policies fuera de envios que resuelven por repartidor: ${fugas.map((f) => `${f.tablename}.${f.policyname}`).join(', ')}`);
  }
  // La tabla del rol no admite escritura directa.
  const escritura = dbQuery(`
    SELECT policyname, cmd FROM pg_policies
    WHERE schemaname='public' AND tablename='repartidores'
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')`);
  if (escritura.length) detalle.push(`repartidores tiene policies de escritura: ${escritura.map((p) => p.policyname).join(', ')}`);
  // Y el snapshot del envío no lleva identidad de mascota.
  const cols = dbQuery(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='envios' AND column_name ~ 'mascota'`);
  if (cols.length) detalle.push(`🔴 envios lleva columnas de mascota: ${cols.map((c) => c.column_name).join(', ')}`);
  return { ok: detalle.length === 0, detalle };
});

// ── ㉜ La entrega exige código y (en puerta) foto ────────────────────────────
invariante(32, 'S96 · Entregar exige el código de la familia y la foto en el despacho', () => {
  const detalle = [];
  const f = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ 'codigo_incorrecto') codigo,
           (pg_get_functiondef(p.oid) ~ 'foto_requerida') foto,
           pg_get_function_identity_arguments(p.oid) args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='entregar_pedido'`);
  if (f.length !== 1) return { ok: false, detalle: [`entregar_pedido tiene ${f.length} firmas`] };
  if (!f[0].codigo) detalle.push('entregar_pedido no verifica el código');
  if (!f[0].foto) detalle.push('entregar_pedido no exige la foto del despacho');
  if (!/p_codigo/.test(f[0].args)) detalle.push('entregar_pedido no recibe el código en su firma');
  return { ok: detalle.length === 0, detalle };
});

// ── ㉝ El destino del ítem es del DUEÑO — el vendedor no tiene brazo ─────────
invariante(33, '🔴 S96 · pedido_item_destinos: sin brazo de vendedor, sin escritura directa', () => {
  const detalle = [];
  const policies = dbQuery(`
    SELECT policyname, cmd, COALESCE(qual,'') q, COALESCE(with_check,'') w
    FROM pg_policies WHERE schemaname='public' AND tablename='pedido_item_destinos'`);
  if (!policies.length) detalle.push('la tabla no tiene policies (¿existe?)');
  for (const p of policies) {
    if (p.cmd !== 'SELECT') detalle.push(`policy de escritura directa: ${p.policyname} (${p.cmd})`);
    if ((p.q + p.w).includes('es_vendedor_de')) {
      detalle.push(`🔴 ${p.policyname} resuelve por vendedor — el hilo compra↔mascota quedó abierto (§7.4)`);
    }
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㉞ El mostrador: contra nadie, y sin búsqueda de personas ────────────────
invariante(34, '🔴 S96 · La venta de mostrador nace contra NADIE y el vendedor no busca personas', () => {
  const detalle = [];
  // La venta puede existir sin reclamante (contra nadie) y el reclamo es todo-o-nada.
  const col = dbQuery(`
    SELECT is_nullable FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ventas_mostrador' AND column_name='reclamada_por'`);
  if (!col.length || col[0].is_nullable !== 'YES') {
    detalle.push('ventas_mostrador.reclamada_por tendría que ser NULLABLE: la venta nace contra nadie');
  }
  if (!dbQuery(`SELECT 1 FROM pg_constraint WHERE conname='chk_reclamo_completo'`).length) {
    detalle.push('falta el CHECK del reclamo todo-o-nada');
  }
  // La función del vendedor no toca tablas de identidad: no hay nada que
  // limitar — la pantalla de buscar personas NO EXISTE (§4).
  const f = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ '(FROM profiles|FROM familia|FROM mascotas|auth.users)') busca
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='registrar_venta_mostrador'`)[0];
  if (!f) detalle.push('registrar_venta_mostrador no existe');
  else if (f.busca) detalle.push('🔴 registrar_venta_mostrador toca tablas de identidad');
  // El reclamo valida FAMILIA (no el acceso de prestador).
  const r = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ '_user_es_familia_de_mascota') familia
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='reclamar_compra_mostrador'`)[0];
  if (!r?.familia) detalle.push('reclamar_compra_mostrador no valida por familia');
  return { ok: detalle.length === 0, detalle };
});

// ── ㉟ El cupo es del recurso confirmado, jamás número en el código ──────────
invariante(35, '🔴 S96 · El cupo del día = recursos CONFIRMADOS · sin recursos no hay promesa', () => {
  const detalle = [];
  const f = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ 'capacidad_por_dia') del_recurso,
           (pg_get_functiondef(p.oid) ~ 'recurso_reparto_excepciones') con_excepcion
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='cupo_reparto_del_dia'`)[0];
  if (!f) detalle.push('cupo_reparto_del_dia no existe');
  else {
    if (!f.del_recurso) detalle.push('el cupo no sale de la capacidad del recurso');
    if (!f.con_excepcion) detalle.push('el cupo no mira las excepciones: cuenta lo REGISTRADO, no lo CONFIRMADO');
  }
  const p = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ 'sin_capacidad_de_reparto') frena,
           (pg_get_functiondef(p.oid) ~ 'sin_cupo_ese_dia') programada
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='calcular_promesa_despensa'`)[0];
  if (!p) detalle.push('calcular_promesa_despensa no existe');
  else {
    if (!p.frena) detalle.push('la promesa no frena sin capacidad confirmada (L-139)');
    if (!p.programada) detalle.push('la fecha programada no valida el cupo de su día (§6.2)');
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㊱ El urgente: modelado y APAGADO ────────────────────────────────────────
invariante(36, 'S96 · El servicio urgente está modelado y apagado con su porqué', () => {
  const detalle = [];
  const filas = dbQuery(`SELECT codigo, activo, motivo_inactivo FROM cat_tipos_servicio_envio`);
  const est = filas.find((f) => f.codigo === 'estandar');
  const urg = filas.find((f) => f.codigo === 'urgente');
  if (!est?.activo) detalle.push('estandar no está activo');
  if (!urg) detalle.push('urgente no existe (tenía que estar MODELADO)');
  else if (urg.activo) detalle.push('🔴 urgente está ENCENDIDO y su cobro adicional no existe');
  else if (!urg.motivo_inactivo) detalle.push('urgente está apagado sin motivo');
  return { ok: detalle.length === 0, detalle };
});

// ── ㊲ La foto: bucket privado, la familia sin brazo, 90 días con mecanismo ──
invariante(37, '🔴 S96 · La foto de entrega: privada, sin brazo de familia, y con su borrado mecánico', () => {
  const detalle = [];
  const b = dbQuery(`SELECT public, file_size_limit, allowed_mime_types
                     FROM storage.buckets WHERE id='entregas'`)[0];
  if (!b) detalle.push('el bucket entregas no existe');
  else {
    if (b.public) detalle.push('🔴 el bucket entregas es PÚBLICO');
    if (!b.file_size_limit || !b.allowed_mime_types) detalle.push('el bucket no tiene techo o mimes');
  }
  // §9.4: la ven el vendedor y el equipo — la política de lectura NO puede
  // resolver por el dueño del pedido (sería el brazo de la familia).
  const pol = dbQuery(`
    SELECT policyname, COALESCE(qual,'') q FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND COALESCE(qual,'') ~ 'entregas' AND cmd='SELECT'`);
  if (!pol.length) detalle.push('no hay policy de lectura del bucket entregas');
  for (const p of pol) {
    if (/user_id = auth\.uid\(\)[\s\S]*pedidos|pedidos[\s\S]*user_id = auth\.uid\(\)/.test(p.q) && /FROM pedidos/.test(p.q)) {
      detalle.push(`🔴 ${p.policyname} le abre la foto al dueño del pedido — §9.4 lista vendedor y equipo, y punto`);
    }
  }
  if (!dbQuery(`SELECT 1 FROM cron.job WHERE jobname='purgar-fotos-entrega'`).length) {
    detalle.push('el cron del borrado a 90 días no está programado — el borrado sería una promesa (D-776)');
  }
  if (!dbQuery(`SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='envios'
                  AND column_name='foto_entrega_borrada_en'`).length) {
    detalle.push('el envío no puede declarar su purga (P23)');
  }
  // El expediente jamás la toca.
  const epa = dbQuery(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='evento_producto_asignacion'
      AND column_name ~ 'foto'`);
  if (epa.length) detalle.push(`🔴 la tipada del expediente lleva foto: ${epa.map((c) => c.column_name).join(', ')}`);
  return { ok: detalle.length === 0, detalle };
});

// ── ㊳ Los cinco avisos — y el silencio de preparado/empacado ────────────────
invariante(38, 'S96 · Los cinco avisos viven; preparado y empacado CALLAN; la carga sin código ni mascota', () => {
  const detalle = [];
  const TIPOS = ['pedido_confirmado','pedido_en_camino','pedido_hacia_destino',
                 'pedido_entregado','pedido_entrega_fallida'];
  const vivos = dbQuery(`
    SELECT codigo FROM cat_notificacion_tipos
    WHERE codigo IN (${TIPOS.map((t) => `'${t}'`).join(',')}) AND activo`).map((r) => r.codigo);
  const faltan = TIPOS.filter((t) => !vivos.includes(t));
  if (faltan.length) detalle.push(`tipos que faltan en el catálogo: ${faltan.join(', ')}`);
  const trg = dbQuery(`
    SELECT pg_get_functiondef(p.oid) d
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_proc p ON p.oid=t.tgfoid
    WHERE NOT t.tgisinternal AND c.relname='pedido_estados'
      AND p.proname='_trg_pedido_avisa_familia'`)[0];
  if (!trg) detalle.push('el trigger de avisos no está en pedido_estados');
  else {
    for (const mudo of ['picking','empacado','documentado']) {
      if (new RegExp(`WHEN '${mudo}'`).test(trg.d)) {
        detalle.push(`🔴 «${mudo}» notifica a la familia — avisar todo enseña a ignorar los avisos (§8.2)`);
      }
    }
    if (/codigo_verificacion/.test(trg.d)) detalle.push('🔴 el aviso lleva el código de la puerta (ley de la pantalla bloqueada)');
    if (/mascota_id/.test(trg.d)) detalle.push('🔴 el aviso lleva la mascota (ley de la pantalla bloqueada)');
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㊴ La recurrencia: interruptor sí, cobro NO (D-778) ──────────────────────
invariante(39, '🔴 S96 · La recurrencia: aviso antes del cobro, apagado en un toque, CERO cobro sin pasarela', () => {
  const detalle = [];
  // 🔴 La LLAMADA se mide con su paréntesis: el comentario del ejecutor
  //    nombra la función para explicar qué hará el día de la pasarela, y la
  //    primera corrida leyó esa prosa como código (L-170, igual que el inv. 13).
  const ej = dbQuery(`
    SELECT (pg_get_functiondef(p.oid) ~ 'pasarela_no_afiliada') rebota,
           (pg_get_functiondef(p.oid) ~ 'crear_pedido_despensa\\(') crea
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='ejecutar_recurrencias_vencidas'`)[0];
  if (!ej) detalle.push('ejecutar_recurrencias_vencidas no existe');
  else {
    if (!ej.rebota) detalle.push('el ejecutor no declara la pasarela ausente');
    if (ej.crea) detalle.push('🔴 el ejecutor CREA pedidos sin pasarela — el cobro simulado que §6.5 prohíbe');
  }
  if (!dbQuery(`SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                WHERE n.nspname='public' AND p.proname='alternar_recurrencia'`).length) {
    detalle.push('no existe el interruptor de un toque');
  }
  const chk = dbQuery(`
    SELECT pg_get_constraintdef(oid) d FROM pg_constraint
    WHERE conrelid='pedidos_recurrencias'::regclass AND contype='c'
      AND pg_get_constraintdef(oid) ~ 'aviso_dias'`);
  if (!chk.length) detalle.push('aviso_dias no tiene CHECK (la letra dice 2-3 días ANTES del cobro)');
  if (!dbQuery(`SELECT 1 FROM cron.job WHERE jobname='avisar-recurrencias'`).length) {
    detalle.push('el aviso previo no tiene cron: sería una promesa');
  }
  return { ok: detalle.length === 0, detalle };
});

// ── ㊵ Las direcciones: Places ID, instrucciones y el punto obligatorio ──────
invariante(40, 'S96 · Direcciones: places_id + instrucciones + punto obligatorio + una sola principal', () => {
  const detalle = [];
  for (const c of ['places_id', 'instrucciones_entrega']) {
    if (!dbQuery(`SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='direcciones_guardadas'
                    AND column_name='${c}'`).length) {
      detalle.push(`falta la columna ${c}`);
    }
  }
  if (!dbQuery(`SELECT 1 FROM pg_constraint WHERE conname='chk_direccion_con_punto'`).length) {
    detalle.push('el punto del mapa no es obligatorio (Places falla en Quito más de lo que uno espera)');
  }
  if (!dbQuery(`SELECT 1 FROM pg_indexes WHERE indexname='uq_direccion_principal'`).length) {
    detalle.push('dos direcciones pueden ser principales a la vez');
  }
  return { ok: detalle.length === 0, detalle };
});

// ── S96 · SEGUNDA Y TERCERA TANDA (firmas founder 12-ago): la composición
//    con tres estados y mercado, el vendedor de la oferta, el entendimiento
//    y el vocabulario de alérgenos ────────────────────────────────────────────

invariante(41, '🔴 S96 · Composición: CUATRO estados, callan solo verificada y no_aplica, verificada exige mercado real', () => {
  const detalle = [];
  const chk = dbQuery(`SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname='chk_composicion_estado'`);
  if (!chk.length) detalle.push('falta el CHECK del vocabulario de estados');
  else for (const v of ['verificada', 'declarada_sin_verificar', 'ausente', 'no_aplica']) {
    if (!chk[0].def.includes(`'${v}'`)) detalle.push(`el CHECK no contempla '${v}'`);
  }
  if (!dbQuery(`SELECT 1 FROM pg_constraint WHERE conname='chk_verificada_exige_mercado'`).length) {
    detalle.push('verificada sin mercado es expresable — el caso Royal Canin Hepatic sigue abierto');
  }
  if (!dbQuery(`SELECT 1 FROM pg_constraint WHERE conname='chk_no_aplica_sin_composicion'`).length) {
    detalle.push('no_aplica con ingredientes es expresable — negar una composición que está');
  }
  // El DATO, no solo la forma: nada con composición niega tenerla, nada
  // verificada quedó sin ficha de país (la global no sostiene).
  const incoherentes = dbQuery(`SELECT count(*) AS n FROM productos
    WHERE (ingredientes_activos <> '{}' AND composicion_estado IN ('ausente','no_aplica'))
       OR (composicion_estado = 'verificada'
           AND (composicion_mercado IS NULL OR composicion_mercado = 'global'))`);
  if (Number(incoherentes[0]?.n) !== 0) detalle.push(`${incoherentes[0].n} productos con estado incoherente`);
  return { ok: detalle.length === 0, detalle };
});

invariante(47, '🔴 S96 · Las RELACIONES de alérgenos son DATO: ave advierte imprecisa, la dieta de eliminación vive', () => {
  const detalle = [];
  if (!tablasQueExisten(['cat_alergeno_relaciones']).length) {
    detalle.push('cat_alergeno_relaciones no existe — la relación vive en código o no vive');
    return { ok: false, detalle };
  }
  // El caso de la firma, medido EJECUTANDO la expansión (no leyendo seeds):
  const ave = dbQuery(`SELECT exacta FROM expandir_alergenos_a_vigilar(ARRAY['pollo'])
    WHERE declarado='ave_no_especificada'`);
  if (!ave.length) detalle.push('ave_no_especificada NO advierte al alérgico a pollo — el motor calla');
  else if (ave[0].exacta === true || ave[0].exacta === 't') {
    detalle.push('la advertencia de ave salió EXACTA — «contiene pollo» sería mentir');
  }
  const eliminacion = dbQuery(`SELECT count(*) AS n FROM expandir_alergenos_a_vigilar(ARRAY['pollo'])
    WHERE declarado IN ('pavo','pato')`);
  if (Number(eliminacion[0]?.n) !== 0) detalle.push('pavo/pato advierten al alérgico a pollo — la dieta de eliminación murió');
  if (!dbQuery(`SELECT 1 FROM pg_trigger WHERE tgname='trg_alergeno_relacion_prohibida' AND NOT tgisinternal`).length) {
    detalle.push('nada protege lo que jamás se agrupa (pollo/pavo/pato · insectos/moluscos)');
  }
  return { ok: detalle.length === 0, detalle };
});

invariante(42, 'S96 · La verificación CADUCA si cambia la composición o el mercado (trigger, no disciplina)', () => {
  const detalle = [];
  if (!dbQuery(`SELECT 1 FROM pg_trigger WHERE tgname='trg_producto_composicion_estado' AND NOT tgisinternal`).length) {
    detalle.push('el trigger de coherencia no existe');
  }
  const def = dbQuery(`SELECT pg_get_functiondef(p.oid) AS d FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='_trg_producto_composicion_estado'`);
  const cuerpo = def[0]?.d ?? '';
  // Se mide CÓDIGO (asignación y condición), no comentarios (L-170).
  if (!/NEW\.composicion_estado := 'declarada_sin_verificar'/.test(cuerpo)) {
    detalle.push('el trigger no baja la verificación caducada');
  }
  if (!/composicion_mercado IS DISTINCT FROM/.test(cuerpo)) {
    detalle.push('la caducidad no mira el MERCADO — una verificación de otra ficha sobrevive');
  }
  return { ok: detalle.length === 0, detalle };
});

invariante(43, 'S96 · La puerta del estado: UNA firma, verificar es de e-PetPlace, la global rebota hablando', () => {
  const detalle = [];
  const firmas = dbQuery(`SELECT count(*) AS n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
    WHERE ns.nspname='public' AND p.proname='declarar_composicion_estado'`);
  if (Number(firmas[0]?.n) !== 1) detalle.push(`${firmas[0]?.n} firmas de declarar_composicion_estado (L-119: tiene que haber UNA)`);
  const def = dbQuery(`SELECT pg_get_functiondef(p.oid) AS d FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='declarar_composicion_estado' LIMIT 1`);
  const cuerpo = def[0]?.d ?? '';
  if (!/RAISE EXCEPTION 'solo_epetplace_verifica/.test(cuerpo)) detalle.push('cualquiera puede verificar');
  if (!/RAISE EXCEPTION 'verificada_exige_mercado/.test(cuerpo)) detalle.push('verificada sin mercado no rebota hablando');
  const anon = dbQuery(`SELECT has_function_privilege('anon',
    'public.declarar_composicion_estado(uuid,text,text)'::regprocedure, 'EXECUTE') AS p`);
  if (anon[0]?.p === true || anon[0]?.p === 't') detalle.push('anon puede ejecutar la puerta (L-140)');
  return { ok: detalle.length === 0, detalle };
});

invariante(44, '🔴 S96 · La oferta DICE su vendedor: derivado por trigger, NOT NULL, legible por el cliente', () => {
  const detalle = [];
  const col = dbQuery(`SELECT is_nullable FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ofertas' AND column_name='cuenta_comercial_id'`);
  if (!col.length) detalle.push('la columna no existe — el checkout del cliente es inconstructible');
  else if (col[0].is_nullable !== 'NO') detalle.push('la columna admite NULL');
  if (!dbQuery(`SELECT 1 FROM pg_trigger WHERE tgname='trg_oferta_estampa_vendedor' AND NOT tgisinternal`).length) {
    detalle.push('nadie deriva la cuenta del sku — un escritor la puede errar');
  }
  const div = dbQuery(`SELECT count(*) AS n FROM ofertas o JOIN vendedor_skus vs ON vs.id=o.sku_id
    WHERE o.cuenta_comercial_id <> vs.cuenta_comercial_id`);
  if (Number(div[0]?.n) !== 0) detalle.push(`${div[0].n} ofertas divergen de su sku`);
  const sel = dbQuery(`SELECT pg_get_expr(polqual, polrelid) AS q FROM pg_policy
    WHERE polrelid='public.ofertas'::regclass AND polname='ofertas_select'`);
  if ((sel[0]?.q ?? '') !== 'true') detalle.push('ofertas_select dejó de ser pública — el cliente no puede leer a quién compra');
  return { ok: detalle.length === 0, detalle };
});

invariante(45, 'S96 · El entendimiento de alergia QUEDA registrado: append-only por estructura, del dueño', () => {
  const detalle = [];
  if (!tablasQueExisten(['alergia_entendimientos']).length) {
    detalle.push('la tabla no existe — el paso de §5.4 sigue sin productor');
    return { ok: false, detalle };
  }
  const rls = dbQuery(`SELECT relrowsecurity FROM pg_class WHERE oid='public.alergia_entendimientos'::regclass`);
  if (rls[0]?.relrowsecurity !== true && rls[0]?.relrowsecurity !== 't') detalle.push('sin RLS');
  const mal = dbQuery(`SELECT polcmd, count(*) AS n FROM pg_policy
    WHERE polrelid='public.alergia_entendimientos'::regclass AND polcmd IN ('w','d')
    GROUP BY polcmd`);
  if (mal.length) detalle.push('existen policies de UPDATE/DELETE — el registro dejó de ser evidencia');
  for (const priv of ['UPDATE', 'DELETE', 'INSERT']) {
    const g = dbQuery(`SELECT has_table_privilege('authenticated', 'public.alergia_entendimientos', '${priv}') AS p`);
    if (g[0]?.p === true || g[0]?.p === 't') detalle.push(`authenticated tiene ${priv} por grant — la puerta es la función`);
  }
  if (!dbQuery(`SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='registrar_entendimiento_alergia'`).length) {
    detalle.push('la puerta registrar_entendimiento_alergia no existe');
  }
  return { ok: detalle.length === 0, detalle };
});

invariante(46, '🔴 S96 · El vocabulario de alérgenos es DATO: cat_alergenos vivo, moluscos_crustaceos adentro, productos adentro del vocabulario', () => {
  const detalle = [];
  if (!tablasQueExisten(['cat_alergenos']).length) {
    detalle.push('cat_alergenos no existe — ampliar el vocabulario vuelve a ser una migración');
    return { ok: false, detalle };
  }
  const mc = dbQuery(`SELECT activo FROM cat_alergenos WHERE codigo='moluscos_crustaceos'`);
  if (!mc.length || (mc[0].activo !== true && mc[0].activo !== 't')) {
    detalle.push('moluscos_crustaceos no está (o no activo) — el húmedo de gato calla sobre lo que su etiqueta declara');
  }
  if (!dbQuery(`SELECT 1 FROM pg_trigger WHERE tgname='trg_producto_alergenos_vocabulario' AND NOT tgisinternal`).length) {
    detalle.push('nada valida los alérgenos del producto contra el vocabulario');
  }
  const fuera = dbQuery(`SELECT count(*) AS n FROM (SELECT unnest(alergenos) AS a FROM productos) t
    WHERE NOT EXISTS (SELECT 1 FROM cat_alergenos c WHERE c.codigo=t.a AND c.activo)`);
  if (Number(fuera[0]?.n) !== 0) detalle.push(`${fuera[0].n} alérgenos vivos fuera del vocabulario`);
  return { ok: detalle.length === 0, detalle };
});

// ── Veredicto ───────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════════════════');
console.log('  EL JUEZ DE LA DESPENSA — S96');
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
