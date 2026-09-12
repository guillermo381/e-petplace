#!/usr/bin/env node
/**
 * `D-1074` · EL PRESUPUESTO DE REINTENTOS DEL REFRESCO.
 *
 * 🔴 LO QUE MIDE, Y ES CONTRAINTUITIVO: que el techo del refresco sea CORTO
 *    hace que entren MÁS intentos, no menos. `auth-js` reintenta con espera
 *    creciente pero corta cuando el total pasa de 30 s
 *    (`AUTO_REFRESH_TICK_DURATION_MS`) — o sea que **un techo largo se come el
 *    presupuesto en el primer intento**.
 *
 *    *El próximo que lea «20 s» lo va a leer como generoso, y por eso este
 *    gate existe: para que el número tenga su medición al lado.*
 *
 * 🔴 NO SIMULA EL REINTENTO: corre el REAL. Levanta un servidor que **acepta la
 *    conexión y nunca contesta** —que es el caso que importa, distinto de uno
 *    que rechaza— y cuenta cuántas veces `auth-js` llama a nuestro fetch.
 *    *Un doble sincrónico no puede ver un timeout roto.*
 *
 * Exit: 0 sano · 1 rojo · 2 no concluyente (L-533).
 */
import { createServer } from 'node:net';

const sal = (c, m) => { console.log(m); process.exit(c); };

const servidor = createServer((sock) => { sock.on('error', () => {}); /* acepta y calla */ });
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const puerto = servidor.address().port;
const URL_FALSA = `http://127.0.0.1:${puerto}`;

const { fetchConTecho, fijarTechosDeRed, claseDeLlamada } =
  await import('../../packages/api/src/red.ts');
const { GoTrueClient } = await import('@supabase/auth-js');

/* Control de la clase ANTES de medir nada: si la URL del refresco no cae en
   `refresco`, el gate estaría midiendo el techo de otra cosa. */
const clase = claseDeLlamada(`${URL_FALSA}/auth/v1/token?grant_type=refresh_token`, 'POST');
if (clase !== 'refresco') {
  servidor.close();
  sal(2, `\n  ⚠️  NO CONCLUYENTE — la URL del refresco cae en la clase «${clase}», no «refresco».\n`);
}
const claseLogin = claseDeLlamada(`${URL_FALSA}/auth/v1/token?grant_type=password`, 'POST');

async function intentosCon(techoMs) {
  fijarTechosDeRed({ refresco: techoMs });
  let n = 0;
  const conTecho = fetchConTecho();
  const espia = (u, i) => { n++; return conTecho(u, i); };
  const auth = new GoTrueClient({
    url: `${URL_FALSA}/auth/v1`, fetch: espia,
    autoRefreshToken: false, persistSession: false, detectSessionInUrl: false,
  });
  const t0 = Date.now();
  try { await auth.refreshSession({ refresh_token: 'sonda-que-no-existe' }); } catch { /* se espera */ }
  return { n, seg: (Date.now() - t0) / 1000 };
}

try {
  console.log('\n═══ verify:presupuesto-refresco ═══\n');
  console.log(`  clase del refresco : ${clase}`);
  console.log(`  clase del login    : ${claseLogin}  ← se queda largo a propósito\n`);

  /* CONTROL: el techo viejo. Sin esto, un «4 intentos» no dice nada — podría
     ser que siempre entren 4. */
  const viejo = await intentosCon(20_000);
  console.log(`  control · techo 20 s (el de antes) → ${viejo.n} intento(s) en ${viejo.seg.toFixed(1)} s`);

  const nuevo = await intentosCon(8_000);
  console.log(`  techo 8 s (el de ahora)            → ${nuevo.n} intento(s) en ${nuevo.seg.toFixed(1)} s\n`);

  if (viejo.n >= nuevo.n) {
    sal(1, `  🔴 ROJO — el techo corto NO aumentó los intentos (${viejo.n} → ${nuevo.n}).\n`
      + '     La tesis no se sostiene: revisar antes de dejar el número.\n');
  }
  if (nuevo.n < 4) {
    sal(1, `  🔴 ROJO — con 8 s entran ${nuevo.n} intento(s) y se esperaban 4 o 5.\n`);
  }
  sal(0, `  ✅ VERDE — el techo corto multiplica los intentos: ${viejo.n} → ${nuevo.n}.\n`
    + '     Su verde dice «el presupuesto de 30 s alcanza para 4 intentos con 8 s».\n'
    + '     JAMÁS dice «la sesión no se cae»: dice que pelea el doble antes de rendirse.\n');
} catch (e) {
  sal(2, `\n  ⚠️  NO CONCLUYENTE — ${String(e?.message ?? e).slice(0, 180)}\n`);
} finally {
  servidor.close();
}
