#!/usr/bin/env node
/**
 * `D-1074` · EL TECHO NO PUEDE DEJAR CONEXIONES ABIERTAS.
 *
 * 🔴 EL DEFECTO QUE MIDE, con su literal del aparato (founder, 12-sep):
 *      `okhttp: A connection to …supabase.co was leaked.
 *       Did you forget to close a response body?`  ← nueve veces, mismo instante
 *    con DNS resolviendo en 1 ms y **cero** `lowmemorykiller`, `ANR` o `FATAL`.
 *    *La app estaba viva: lo que se agotaba era el pool de conexiones.* Cada
 *    consulta que el techo abortaba dejaba su cuerpo sin cerrar; cuando el pool
 *    se llenó, las consultas nuevas quedaron esperando una conexión libre que
 *    nunca llegó — y el reintento tampoco rescata, porque espera el mismo pool.
 *
 * ⚠️ LO QUE ESTE GATE **NO** ES: no es el de OkHttp. Corre en Node contra
 *    `undici`, así que **mide la CLASE —«el techo deja sockets abiertos»— y no
 *    el pool de Android.** *La confirmación que cierra la ficha es del founder
 *    con `adb logcat`, y este gate no la reemplaza: la hace barata de anticipar.*
 *    Declarado acá y no en una nota al pie, porque un verde de este archivo
 *    podría leerse como «el aparato está sano» y no lo dice.
 *
 * EL CONTROL, que es lo que lo vuelve una medición (L-459): la misma tanda se
 * corre con un fetch SIN el cierre —el de antes— y tiene que dejar MÁS sockets.
 * Sin ese contraste, «0 abiertos» podría ser que el servidor los cerró solo.
 *
 * Exit: 0 sano · 1 rojo · 2 no concluyente (L-533).
 */
import { createServer } from 'node:http';

const TANDA = 9;            // las nueve del logcat del founder
const TECHO = 300;          // corto: el gate no puede tardar
const DEMORA_CUERPO = 3000; // el cuerpo llega DESPUÉS del techo: ésa es la carrera

const sal = (c, m) => { console.log(m); process.exit(c); };

/* Un servidor que manda los ENCABEZADOS rápido y el CUERPO tarde. Es la forma
   exacta del defecto: la respuesta existe —hay algo que cerrar— y el techo
   gana la carrera antes de que nadie la lea. Un servidor que no contesta nada
   NO reproduce el caso: ahí no hay cuerpo que fugar. */
let vivos = 0, maximo = 0;
const servidor = createServer((req, res) => {
  vivos++; maximo = Math.max(maximo, vivos);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  const t = setTimeout(() => { try { res.end('{"ok":true}'); } catch { /* */ } }, DEMORA_CUERPO);
  res.on('close', () => { clearTimeout(t); vivos--; });
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${servidor.address().port}/rest/v1/x`;

/** El techo VIEJO: aborta y se va. */
function techoQueAbandona(ms) {
  return async (u) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(new Error('techo')), ms);
    try { return await fetch(u, { signal: c.signal }); }
    finally { clearTimeout(t); }
  };
}

async function tanda(hacer) {
  const antes = maximo;
  maximo = vivos;
  await Promise.allSettled(Array.from({ length: TANDA }, () => hacer(base).catch(() => {})));
  /* Se le da aire al servidor para que note los cierres que SÍ ocurrieron. */
  await new Promise((r) => setTimeout(r, 600));
  return { pico: maximo, quedanAbiertos: vivos, antes };
}

try {
  const { fetchConTecho, fijarTechosDeRed } = await import('../../packages/api/src/red.ts');
  fijarTechosDeRed({ lectura: TECHO });

  console.log('\n═══ verify:techo-no-fuga ═══\n');
  console.log(`  ${TANDA} consultas · techo ${TECHO} ms · el cuerpo llega a los ${DEMORA_CUERPO} ms\n`);

  const viejo = await tanda(techoQueAbandona(TECHO));
  console.log(`  control · techo que ABANDONA → ${viejo.quedanAbiertos} conexión(es) abiertas tras el abort`);

  const nuevo = await tanda(fetchConTecho());
  console.log(`  techo que CIERRA             → ${nuevo.quedanAbiertos} conexión(es) abiertas tras el abort\n`);

  if (viejo.quedanAbiertos === 0 && nuevo.quedanAbiertos === 0) {
    sal(2, '  ⚠️  NO CONCLUYENTE — ninguna de las dos dejó nada abierto: el arnés no\n'
      + '     pudo reproducir el defecto, así que su verde no dice nada (L-437).\n'
      + '     Probable: undici cierra por su cuenta lo que OkHttp no. El caso del\n'
      + '     aparato sigue siendo el del founder con logcat.\n');
  }
  if (nuevo.quedanAbiertos >= viejo.quedanAbiertos) {
    sal(1, `  🔴 ROJO — el techo que cierra dejó ${nuevo.quedanAbiertos} y el que abandona ${viejo.quedanAbiertos}.\n`
      + '     La cura no cierra nada.\n');
  }
  sal(0, `  ✅ VERDE — abandonar deja ${viejo.quedanAbiertos} y cerrar deja ${nuevo.quedanAbiertos}.\n`
    + '     Su verde dice «el techo cierra lo que aborta, medido sobre undici».\n'
    + '     JAMÁS dice «no fuga en el aparato»: eso lo cierra el logcat del founder.\n');
} catch (e) {
  sal(2, `\n  ⚠️  NO CONCLUYENTE — ${String(e?.message ?? e).slice(0, 180)}\n`);
} finally {
  servidor.close();
}
