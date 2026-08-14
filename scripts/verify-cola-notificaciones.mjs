#!/usr/bin/env node
// GUARD DE LA COLA DE NOTIFICACIONES (S97-A · D-817, nace de D-816)
//
// ── QUÉ MIDE, Y POR QUÉ ESO Y NO OTRA COSA ──────────────────────────────────
// **La EDAD de la intención `nacida` más vieja.**
//
// D-816 fue un defecto de SILENCIO PERFECTO: durante días, el producto encoló
// avisos con normalidad, el cron dijo `succeeded` cada minuto, el transporte
// de push devolvió `200`, ninguna pantalla se rompió — y nadie recibió nada.
// **No había ningún rojo que mirar, porque el defecto no producía errores:
// producía ausencia.**
//
// 🔴 Lo que sí cambiaba, y era medible desde el primer minuto: **la cola
//    empezaba a envejecer.** Un pipeline sano vacía `nacida` en el tick
//    siguiente; uno roto la deja crecer.
//
// **Por eso se mide EDAD y no CANTIDAD:** un pico de volumen es normal —mil
// avisos legítimos a la vez dan una cola grande y sana—, pero **una intención
// de hace media hora es anómala con la cola en 1 o en mil.** *El tamaño mide
// el tráfico; la edad mide si el caño está tapado.*
//
// ── CÓMO SE LEE EL RESULTADO ────────────────────────────────────────────────
//   exit 0 → la cola drena
//   exit 1 → 🔴 hay una intención vieja: **algo entre encolar y entregar está
//            cortado.** El nombre del defecto va en la salida, no un número.
//
// Uso:  node scripts/verify-cola-notificaciones.mjs [minutos]
//       (umbral por defecto: 15 min — el cron corre cada minuto, así que
//        quince ticks perdidos ya no son un hipo)
//
// Solo SELECT. Este guard JAMÁS despacha ni escribe: si midiera y curara,
// taparía el defecto que vino a mostrar.

import { dbQuery } from './lib-db.mjs';

const UMBRAL_MIN = Number(process.argv[2] ?? 15);

const [fila] = dbQuery(`
  select
    count(*) filter (where estado = 'nacida')                              as nacidas,
    coalesce(
      extract(epoch from (now() - min(created_at) filter (where estado = 'nacida'))) / 60,
      0
    )::int                                                                 as edad_min,
    (select max(created_at)::text from notificacion_intencion
      where estado in ('entregada','encolada','descartada'))               as ultimo_movimiento
  from notificacion_intencion;
`);

const nacidas = Number(fila.nacidas ?? 0);
const edad = Number(fila.edad_min ?? 0);

console.log(`cola: ${nacidas} nacida(s) · la más vieja: ${edad} min · último movimiento: ${fila.ultimo_movimiento ?? '(nunca)'}`);

if (nacidas === 0) {
  console.log('✅ VERDE — la cola está vacía: el pipeline drena.');
  process.exit(0);
}

if (edad <= UMBRAL_MIN) {
  console.log(`✅ VERDE — hay cola pero es FRESCA (≤ ${UMBRAL_MIN} min). Eso es tráfico, no atasco.`);
  process.exit(0);
}

// 🔴 El rojo dice QUÉ está roto, no cuánto. Un número sin nombre manda a
//    buscar; un nombre manda a arreglar.
console.error('');
console.error(`🔴 ROJO — LA COLA DE NOTIFICACIONES ESTÁ ENVEJECIENDO (${edad} min > ${UMBRAL_MIN}).`);
console.error('');
console.error('   Nadie está recibiendo avisos. El producto encola bien y el corte');
console.error('   está DESPUÉS: entre `nacida` y la entrega.');
console.error('');
console.error('   Dónde mirar, en el orden en que D-816 se resolvió:');
console.error('   ① net._http_response — el status REAL de los ticks.');
console.error('      ⚠️ NO alcanza con cron.job_run_details: net.http_post es');
console.error('         asíncrono y su `succeeded` solo dice que el pedido salió.');
console.error('   ② el cron de `despachar-correo` — es EL ORQUESTADOR (llama a');
console.error('      `despachar_notificaciones`); si rebota, nada se mueve y el');
console.error('      push queda devolviendo 200 con `entregadas: 0`.');
console.error('   ③ los headers del cron: `Authorization` **y** `x-despacho-secret`.');
console.error('      El de push los manda los dos; el 401 de D-816 fue no mandar el primero.');
console.error('');
process.exit(1);
