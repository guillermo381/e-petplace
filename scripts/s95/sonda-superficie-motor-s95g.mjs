// ═══════════════════════════════════════════════════════════════════════════
// S95-G · LA SEGUNDA SONDA — TODA la superficie del motor, no solo la puerta
// que el brief señaló.
//
// POR QUÉ EXISTE: al diseñar la cura de `mover_estado_pedido` apareció que el
// actor `sistema` no es la única forma de llegar. **Las diez funciones del
// motor están concedidas a `authenticated`**, y varias mueven estados por
// dentro. Si alguna de ellas no verifica quién llama, cerrar el actor
// `sistema` sería poner un candado en una puerta y dejar la ventana abierta.
//
// 🔴 EL ESCENARIO ES SIEMPRE EL MISMO: el pedido es de OTRA persona, y el que
// llama es un usuario común y logueado, con la anon key que viaja en el
// bundle. Nada de esto exige una vulnerabilidad: alcanza con la app publicada.
//
// SOLO MIDE. Se corre antes y después de la cura.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { dbQuery } from '../lib-db.mjs';
import { initApi, iniciarSesion } from '../../packages/api/src/index.ts';
import { getClient } from '../../packages/api/src/client.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const P = '__sonda_sup_s95g';

const ctx = dbQuery(`
  SELECT (SELECT id FROM profiles WHERE email='${env.EXPO_PUBLIC_DEMO_EMAIL}') atacante,
         (SELECT p.id FROM profiles p WHERE p.email <> '${env.EXPO_PUBLIC_DEMO_EMAIL}'
            AND p.email IS NOT NULL ORDER BY p.created_at LIMIT 1) victima,
         (SELECT cc.id FROM cuentas_comerciales cc WHERE cc.estado='activa'
            AND cc.owner_profile_id <> (SELECT id FROM profiles WHERE email='${env.EXPO_PUBLIC_DEMO_EMAIL}')
          LIMIT 1) cuenta`)[0];

const abiertos = [];
let pedidoId = null;

// La clave de idempotencia es ÚNICA en `pedidos`: dos fixtures en el mismo
// estado colisionaban y cortaban la sonda a mitad. Se numera.
let n = 0;
const nuevoPedido = (estadoFinal) => {
  const marca = `${P}-${++n}-${estadoFinal}`;
  const id = dbQuery(`
    INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                         costo_envio, descuento_monto, total, clave_idempotencia, numero_orden)
    VALUES ('${ctx.victima}','${ctx.cuenta}',100,15,0,0,115,'${marca}','${marca}')
    RETURNING id`)[0].id;
  dbQuery(`INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
           VALUES ('${id}','creado','${ctx.victima}','cliente')`);
  if (estadoFinal !== 'creado') {
    dbQuery(`INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
             VALUES ('${id}','${estadoFinal}','${ctx.victima}','cliente')`);
  }
  return id;
};

const probar = async (rotulo, fn, pedido) => {
  const antes = dbQuery(`SELECT estado FROM pedidos WHERE id='${pedido}'`)[0].estado;
  const { error } = await fn(pedido);
  const despues = dbQuery(`SELECT estado FROM pedidos WHERE id='${pedido}'`)[0].estado;
  const paso = error === null;
  const movio = antes !== despues;
  if (paso || movio) abiertos.push(rotulo);
  console.log(
    `${paso || movio ? '🔴 ABIERTA' : '✅ cerrada '}  ${rotulo.padEnd(30)} ${
      paso || movio ? `${antes} → ${despues}` : `rebota: ${String(error.message).slice(0, 55)}`
    }`,
  );
};

console.log(`\n═══ LA SUPERFICIE DEL MOTOR CONTRA UN PEDIDO AJENO ═══`);
console.log(`   víctima ${ctx.victima} · atacante ${ctx.atacante}\n`);

try {
  const login = await iniciarSesion({
    email: env.EXPO_PUBLIC_DEMO_EMAIL,
    password: env.EXPO_PUBLIC_DEMO_PASSWORD,
  });
  if (!login.ok) throw new Error(`sin sesión: ${login.mensaje}`);
  const c = getClient();

  await probar('confirmar_pago_pedido', (p) =>
    c.rpc('confirmar_pago_pedido', {
      p_pedido_id: p, p_proveedor: '__sonda', p_referencia: 'x',
      p_clave_idempotencia: `${P}-pago`, p_payload: {},
    }), nuevoPedido('esperando_pago'));

  await probar('reservar_stock_pedido', (p) =>
    c.rpc('reservar_stock_pedido', { p_pedido_id: p, p_minutos_vigencia: 5 }),
    nuevoPedido('esperando_pago'));

  await probar('empacar_pedido', (p) =>
    c.rpc('empacar_pedido', { p_pedido_id: p, p_lotes: [], p_peso_real_kg: null }),
    nuevoPedido('picking'));

  await probar('entregar_pedido', (p) =>
    c.rpc('entregar_pedido', { p_pedido_id: p, p_mascota_id: null }),
    nuevoPedido('en_reparto'));

  await probar('cancelar (actor sistema)', (p) =>
    c.rpc('cancelar_pedido_despensa', { p_pedido_id: p, p_actor: 'sistema', p_motivo: 'sonda' }),
    nuevoPedido('esperando_pago'));

  await probar('mover_estado (actor sistema)', (p) =>
    c.rpc('mover_estado_pedido', {
      p_pedido_id: p, p_hasta: 'pago_capturado', p_actor: 'sistema', p_motivo: undefined,
    }), nuevoPedido('esperando_pago'));

  console.log(
    `\n${abiertos.length === 0
      ? '✅ TODA la superficie verifica a quien llama.'
      : `🔴 ${abiertos.length} PUERTA(S) ABIERTA(S): ${abiertos.join(' · ')}`}\n`,
  );
} catch (e) {
  console.log(`\n✗ LA SONDA SE CORTÓ: ${e.message ?? e}\n`);
  abiertos.push('(sonda incompleta)');
} finally {
  dbQuery(`
    DELETE FROM evento_producto_asignacion WHERE pedido_item_id IN
      (SELECT id FROM pedido_items WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia LIKE '${P}%'));
    DELETE FROM pagos_eventos WHERE clave_idempotencia LIKE '${P}%';
    DELETE FROM pagos_intentos WHERE clave_idempotencia LIKE '${P}%';
    DELETE FROM inventario_reservas WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia LIKE '${P}%');
    DELETE FROM pedido_estados WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia LIKE '${P}%');
    DELETE FROM pedido_items WHERE pedido_id IN (SELECT id FROM pedidos WHERE clave_idempotencia LIKE '${P}%');
    DELETE FROM pedidos WHERE clave_idempotencia LIKE '${P}%';`);
  const resto = dbQuery(`SELECT count(*) n FROM pedidos WHERE clave_idempotencia LIKE '${P}%'`)[0].n;
  console.log(`Desmontaje · residuo: ${resto}`);
  process.exit(abiertos.length === 0 ? 0 : 1);
}
