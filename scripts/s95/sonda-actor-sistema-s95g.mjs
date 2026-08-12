// ═══════════════════════════════════════════════════════════════════════════
// S95-G · LA SONDA — ¿el agujero del actor `sistema` existe DE VERDAD?
//
// 🔴 NO SE DEDUCE LEYENDO EL CUERPO. Leer `mover_estado_pedido` dice que la
// cadena `IF/ELSIF` no tiene rama para `sistema`; eso es una hipótesis, no un
// hallazgo. Entre el cuerpo y el ataque hay tres cosas que podrían frenarlo y
// que la lectura no ve: el GRANT de la función, la RLS de `pedido_estados` y
// la tabla de transiciones. Esta sonda las atraviesa todas por el CAMINO REAL
// —PostgREST, sesión de verdad, anon key del bundle— y mide qué pasa.
//
// LA FORMA DEL ATAQUE, y es la que importa: el pedido es de OTRA PERSONA. El
// atacante es un usuario común, logueado, sin ninguna relación con ese pedido
// ni con la cuenta comercial que lo vende.
//
// SOLO MIDE. No cura nada. Se corre ANTES de la migración (para probar que el
// agujero está abierto) y DESPUÉS (para probar que se cerró) — el par
// discriminador que la casa exige.
//
// Uso: npx tsx scripts/s95/sonda-actor-sistema-s95g.mjs
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { dbQuery } from '../lib-db.mjs';
import { initApi, iniciarSesion } from '../../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const P = '__sonda_s95g';

const linea = (s) => console.log(s);

// ── ① El grant: ¿la función está al alcance de un autenticado? ──────────────
const grant = dbQuery(`
  SELECT has_function_privilege('authenticated',
    'public.mover_estado_pedido(uuid, text, text, text)', 'EXECUTE') puede`)[0];
linea(`\n① GRANT · authenticated puede EJECUTAR mover_estado_pedido: ${grant.puede}`);

// ── ② El contexto: un pedido de OTRA persona ────────────────────────────────
const ctx = dbQuery(`
  SELECT (SELECT id FROM profiles WHERE email = '${env.EXPO_PUBLIC_DEMO_EMAIL}') atacante,
         (SELECT p.id FROM profiles p
           WHERE p.email <> '${env.EXPO_PUBLIC_DEMO_EMAIL}' AND p.email IS NOT NULL
           ORDER BY p.created_at LIMIT 1) victima,
         (SELECT cc.id FROM cuentas_comerciales cc
           WHERE cc.estado='activa'
             AND cc.owner_profile_id <> (SELECT id FROM profiles WHERE email='${env.EXPO_PUBLIC_DEMO_EMAIL}')
           LIMIT 1) cuenta`)[0];

if (!ctx.atacante || !ctx.victima || !ctx.cuenta) {
  linea('✗ ABORTA: no se pudo armar el escenario (falta atacante, víctima o cuenta ajena).');
  process.exit(1);
}
linea(`② ESCENARIO · el pedido es de ${ctx.victima}; el atacante es ${ctx.atacante}`);
linea(`   La cuenta vendedora (${ctx.cuenta}) tampoco es del atacante.\n`);

let pedidoId = null;
let abierto = null;
try {
  // Dos sentencias y no un CTE: el trigger que materializa `pedidos.estado`
  // no puede actualizar una fila insertada por otro CTE de la MISMA sentencia.
  // Y los montos cierran porque `chk_pedido_total_cierra` lo exige — un total
  // que no cuadra con sus partes no puede existir, que es como tiene que ser.
  pedidoId = dbQuery(`
    INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                         costo_envio, descuento_monto, total, clave_idempotencia, numero_orden)
    VALUES ('${ctx.victima}', '${ctx.cuenta}', 100.00, 15.00, 0, 0, 115.00, '${P}', '${P}')
    RETURNING id`)[0].id;
  dbQuery(`
    INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES ('${pedidoId}', 'creado', '${ctx.victima}', 'cliente')`);

  // 🔴 EL PEDIDO ARRANCA EN `esperando_pago`, Y ESTO ES LA CORRECCIÓN QUE
  //    HIZO ÚTIL A LA SONDA. La primera versión atacaba desde `creado` y dio
  //    VERDE — pero no por un gate: desde `creado` la tabla de transiciones no
  //    tiene fila `[sistema]`, así que rebotaba `transicion_no_permitida`. Era
  //    un verde por la razón equivocada, que es tan inútil como un rojo por la
  //    razón equivocada.
  //
  //    La transición peligrosa es `esperando_pago → pago_capturado [sistema]`,
  //    y existe. O sea: el escenario real no es un carrito, es **un pedido
  //    legítimo esperando que le cobren** — que es exactamente el estado en el
  //    que vive un pedido mientras la persona tipea su tarjeta.
  dbQuery(`
    INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES ('${pedidoId}', 'esperando_pago', '${ctx.victima}', 'cliente')`);

  const login = await iniciarSesion({
    email: env.EXPO_PUBLIC_DEMO_EMAIL,
    password: env.EXPO_PUBLIC_DEMO_PASSWORD,
  });
  if (!login.ok) throw new Error(`sin sesión: ${login.mensaje}`);

  const { getClient } = await import('../../packages/api/src/client.ts');
  const mover = async (actor, hasta) => {
    const { data, error } = await getClient().rpc('mover_estado_pedido', {
      p_pedido_id: pedidoId, p_hasta: hasta, p_actor: actor, p_motivo: undefined,
    });
    return { ok: error === null, detalle: error ? error.message : JSON.stringify(data) };
  };

  // ── ③ EL CONTROL · con un actor que SÍ tiene gate, el ataque rebota ───────
  // Sin esto la sonda no discrimina: si `sistema` pasara y `cliente` también,
  // el problema sería otro (RLS abierta, grant de más) y no el actor.
  const comoCliente = await mover('cliente', 'pago_capturado');
  linea(`③ CONTROL · como 'cliente' sobre un pedido ajeno → ${
    comoCliente.ok ? '🔴 PASÓ' : `rebota: ${comoCliente.detalle.slice(0, 60)}`}`);

  // ── ④ EL ATAQUE · el mismo movimiento, declarándose `sistema` ─────────────
  const comoSistema = await mover('sistema', 'pago_capturado');
  linea(`④ ATAQUE  · como 'sistema' sobre el MISMO pedido ajeno → ${
    comoSistema.ok ? '🔴 PASÓ' : `rebota: ${comoSistema.detalle.slice(0, 80)}`}`);

  // ── ⑤ LO QUE DE VERDAD IMPORTA · llegar a «pagado» sin pagar ──────────────
  const aPagado = await mover('sistema', 'stock_reservado');
  const estado = dbQuery(`SELECT estado FROM pedidos WHERE id='${pedidoId}'`)[0].estado;
  linea(`⑤ SIGUE   · como 'sistema' → 'stock_reservado' → ${
    aPagado.ok ? '🔴 PASÓ' : `rebota: ${aPagado.detalle.slice(0, 80)}`}`);
  linea(`   Estado real del pedido en la base: ${estado}`);

  abierto = comoSistema.ok || aPagado.ok;
  linea(
    `\n${abierto
      ? '🔴 EL AGUJERO ESTÁ ABIERTO: un usuario cualquiera movió un pedido ajeno declarándose «sistema».'
      : '✅ CERRADO: el actor «sistema» no es alcanzable desde una llamada de cliente.'}\n`,
  );
} catch (e) {
  // 🔴 SIN ESTE CATCH LA SONDA MIENTE POR OMISIÓN: el `process.exit` del
  //    `finally` corta la propagación y el error nunca se imprime — la primera
  //    corrida murió antes del control ③ y solo se vio el desmontaje. Es el
  //    mismo defecto que S95-E cazó en su arnés E2E, repetido acá.
  linea(`\n✗ LA SONDA SE CORTÓ: ${e.message ?? e}\n`);
} finally {
  dbQuery(`
    DELETE FROM pedido_estados WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia='${P}');
    DELETE FROM pedidos WHERE clave_idempotencia='${P}';`);
  const resto = dbQuery(`SELECT count(*) n FROM pedidos WHERE clave_idempotencia='${P}'`)[0].n;
  linea(`Desmontaje · pedidos de sonda restantes: ${resto}`);
  process.exit(abierto === null ? 2 : abierto ? 1 : 0);
}
