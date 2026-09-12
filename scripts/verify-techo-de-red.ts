/**
 * verify:techo-de-red · el gate de `D-1070`
 *
 * 🔴 SU ROJO ES EL CASO QUE EXISTE PARA IMPEDIR: una consulta que NUNCA
 *    responde tiene que terminar en error antes del techo + margen, **no
 *    colgar**. Se prueba contra un servidor que de verdad no contesta —no
 *    contra un doble que finge—, porque *un doble sincrónico no puede ver un
 *    timeout roto: el arnés daría verde sobre el defecto que revienta en
 *    producción.*
 *
 * 🔴 Y SU CONTROL POSITIVO, sin el cual el verde no dice nada: una consulta
 *    normal NO se aborta de más. Un techo que aborta todo pasaría el rojo con
 *    honores y rompería la app entera.
 */
import { createServer, type Server } from 'node:http';
import { fetchConTecho, fijarTechosDeRed, claseDeLlamada, esSinRed, SIN_RED } from '../packages/api/src/red';

let fallos = 0;
const ok = (c: boolean, q: string, detalle = '') => {
  console.log(`  ${c ? '✓' : '✗'} ${q}${detalle ? ' · ' + detalle : ''}`);
  if (!c) fallos++;
};

async function main() {
  /* Un servidor que NO CONTESTA NUNCA para el rojo, y uno que contesta rápido
     para el control. El mismo proceso sirve los dos caminos por la ruta. */
  const srv: Server = createServer((req, res) => {
    if (req.url?.startsWith('/rest/v1/rapido')) { res.writeHead(200); res.end('[]'); return; }
    /* cuelga a propósito: ni respuesta ni cierre */
  });
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;

  /* Techos chicos para que el gate sea rápido; lo que se mide es el
     MECANISMO, no los números de producción (esos son dato en app_config). */
  fijarTechosDeRed({ lectura: 600, escritura: 900, auth: 900, subida: 1500 });
  const f = fetchConTecho();

  // ── ROJO · una lectura que no responde termina en error, no cuelga ────────
  {
    const t0 = Date.now();
    let lanzo = false, mensaje = '';
    try { await f(`${base}/rest/v1/cuelga`); }
    catch (e) { lanzo = true; mensaje = String((e as Error).message); }
    const ms = Date.now() - t0;
    ok(lanzo, 'ROJO · una consulta que no responde LANZA', `${ms} ms`);
    ok(esSinRed(mensaje), `ROJO · el error dice "${SIN_RED}"`, mensaje.slice(0, 60));
    /* techo + margen: si tarda mucho más, el reloj no está gobernando. */
    ok(ms < 600 + 400, 'ROJO · corta ANTES del techo + margen', `${ms} ms < 1000`);
  }

  // ── CONTROL POSITIVO · una consulta normal NO se aborta ───────────────────
  {
    let r: Response | null = null, err = '';
    try { r = await f(`${base}/rest/v1/rapido`); } catch (e) { err = String((e as Error).message); }
    ok(r !== null && r.status === 200, 'VERDE · una consulta normal NO se aborta', err || 'status 200');
  }

  // ── ROJO · el camino del PAGO no tiene techo (D-1069) ─────────────────────
  {
    ok(claseDeLlamada(`${base}/functions/v1/pagos-cobro`, 'POST') === 'sin_techo',
       'ROJO · /functions/v1/ queda SIN techo mientras D-1069 esté viva');
    const t0 = Date.now();
    const corrio = await Promise.race([
      f(`${base}/functions/v1/pagos-cobro`, { method: 'POST' }).then(() => 'volvio').catch((e) =>
        esSinRed(String((e as Error).message)) ? 'ABORTADA' : 'otro_error'),
      new Promise<string>((r) => setTimeout(() => r('sigue_esperando'), 1200)),
    ]);
    ok(corrio !== 'ABORTADA',
       'ROJO · el cobro NO se aborta por techo', `${Date.now() - t0} ms · ${corrio}`);
  }

  // ── La clasificación, que es de donde sale todo lo demás ──────────────────
  ok(claseDeLlamada('/rest/v1/mascotas', 'GET') === 'lectura', 'clase · GET a rest = lectura');
  ok(claseDeLlamada('/rest/v1/mascotas', 'POST') === 'escritura', 'clase · POST a rest = escritura');
  ok(claseDeLlamada('/rest/v1/rpc/lo_que_sea', 'POST') === 'escritura', 'clase · rpc = escritura');
  ok(claseDeLlamada('/auth/v1/token', 'POST') === 'auth', 'clase · auth');
  ok(claseDeLlamada('/storage/v1/object/x', 'POST') === 'subida', 'clase · storage = subida');

  srv.close();
  console.log(fallos === 0 ? '\nverify:techo-de-red VERDE' : `\nverify:techo-de-red — ${fallos} fallo(s)`);
  process.exit(fallos === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
