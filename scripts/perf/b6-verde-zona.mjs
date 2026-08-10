/**
 * S94-PERF · EL DESPUÉS de la cura de la zona (R1: mismo instrumento).
 *
 * El «antes» está en `b5-camino-real.mjs` y quedó en disco:
 *   dos viajes encadenados p50 **316.1 ms** · un solo viaje p50 **155.6 ms**.
 *
 * Acá se vuelve a medir **con la función ya curada**, que ahora hace un JOIN
 * más adentro. La pregunta no es «¿mejoró?» —eso ya se sabía— sino la que
 * podría haber arruinado la cura: **¿el JOIN contra la vista hizo que el único
 * viaje que queda cueste más de lo que costaban los dos?** La vista arma dos
 * agregados jsonb por fila; si el planificador no los podara, el ahorro se
 * evaporaría. Se mide en vez de confiar en el planificador.
 *
 * Y se verifica lo que R3 exige: que la zona que llega por la puerta nueva sea
 * la misma que llegaba por la vieja, con un token real.
 */

import { readFileSync } from 'node:fs';
import { rest, tokenDe, linea, guardarPerf, cronometrar, RAIZ, r1, URL as SUPA, ANON } from './lib-perf.mjs';

const env = readFileSync(`${RAIZ}/apps/prestador/.env.local`, 'utf8');
const MAIL = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const PW = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const token = await tokenDe(MAIL, PW);
const g = (ruta, o = {}) => rest(ruta, { token, ...o });
const rpc = (n, args = {}) => g(`/rest/v1/rpc/${n}`, { metodo: 'POST', cuerpo: args });
/* ⚠️ `rest()` trunca el cuerpo a 400 caracteres — heredado de las sesiones de
   seguridad, donde volcar respuestas enteras ERA el riesgo. Las tres columnas
   de zona son las últimas de 27, así que caen fuera del corte y los dos
   primeros asserts salieron 🔴 **midiendo mi instrumento, no la cura**. Para
   verificar un valor hace falta leerlo entero; para cronometrar, no. Por eso
   esta puerta existe solo acá y solo para los asserts de valor. */
async function leerEntero(ruta, opciones = {}) {
  const res = await fetch(`${SUPA}${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  });
  return { status: res.status, cuerpo: await res.text() };
}
const num = (cuerpo, campo) => {
  const m = cuerpo.match(new RegExp(`"${campo}"\\s*:\\s*(-?[0-9.eE+]+|null)`));
  return m ? (m[1] === 'null' ? null : Number(m[1])) : undefined;
};

const ANTES = { dosViajes: 316.1, unViaje: 155.6 }; // b5-camino-real.json

linea('\n══════════════════════════════════════════════════════════════');
linea('  VERDE · la zona viaja en la misma RPC');
linea('══════════════════════════════════════════════════════════════\n');

const pasos = [];
const paso = (n, ok, txt) => {
  pasos.push({ n, ok, txt });
  linea(`  ${ok ? '✅' : '🔴'} ${n}. ${txt}`);
};

// ── ① MISMO DATO POR LAS DOS PUERTAS ───────────────────────────────────────
const r = await leerEntero('/rest/v1/rpc/obtener_mi_prestador', { metodo: 'POST', cuerpo: {} });
const id = r.cuerpo.match(/"id"\s*:\s*"([0-9a-f-]{36})"/)?.[1] ?? null;
const zLat = num(r.cuerpo, 'zona_lat');
const zLon = num(r.cuerpo, 'zona_lon');
const zRad = num(r.cuerpo, 'zona_radio_m');

const v = await leerEntero(`/rest/v1/v_prestadores_publicos?select=zona_lat,zona_lon,zona_radio_m&id=eq.${id}`);
const vLat = num(v.cuerpo, 'zona_lat');
const vLon = num(v.cuerpo, 'zona_lon');
const vRad = num(v.cuerpo, 'zona_radio_m');

paso(1, zLat !== undefined && zLon !== undefined && zRad !== undefined, 'la RPC ya devuelve las tres columnas de zona');
paso(2, zLat === vLat && zLon === vLon && zRad === vRad, 'y su VALOR es idéntico al de la vista — la cura no cambió el resultado (R3)');

// ── ② LA AUDIENCIA NO SE MOVIÓ, POR CAMINO REAL ────────────────────────────
const anon = await rest('/rest/v1/rpc/obtener_mi_prestador', { metodo: 'POST', cuerpo: {} });
paso(3, anon.status >= 400, `sin sesión la RPC sigue rebotando (status ${anon.status}) — la puerta no se abrió al mover el dato`);

// ── ③ EL DESPUÉS, CRONOMETRADO ─────────────────────────────────────────────
const despues = await cronometrar(() => rpc('obtener_mi_prestador'), {
  veces: 15,
  calentar: 3,
  rotulo: 'obtenerMiPrestador · UN viaje, con la zona adentro',
});
const dosViajes = await cronometrar(
  async () => {
    const x = await rpc('obtener_mi_prestador');
    const i = x.cuerpo.match(/"id"\s*:\s*"([0-9a-f-]{36})"/)?.[1];
    await g(`/rest/v1/v_prestadores_publicos?select=zona_lat,zona_lon,zona_radio_m&id=eq.${i}`);
  },
  { veces: 15, calentar: 3, rotulo: 'el camino viejo, re-medido hoy para que la comparación sea del mismo momento' },
);

linea('');
linea(`   ANTES (b5, dos viajes)          p50 ${ANTES.dosViajes} ms`);
linea(`   camino viejo re-medido ahora    p50 ${dosViajes.p50} ms`);
linea(`   DESPUÉS (un viaje con la zona)  p50 ${despues.p50} ms · p95 ${despues.p95} ms`);
linea('');
paso(
  4,
  despues.p50 < dosViajes.p50 * 0.75,
  `el viaje único cuesta ${r1((despues.p50 / dosViajes.p50) * 100)} % de lo que costaban los dos — el JOIN no se comió el ahorro`,
);
linea(`   ── ahorro real por llamada: **${r1(dosViajes.p50 - despues.p50)} ms**`);
linea(`   ── × 28 efectos de foco que lo invocan: hasta **${r1(((dosViajes.p50 - despues.p50) * 28) / 1000)} s** de red por recorrido completo de la app`);

const verdes = pasos.filter((p) => p.ok).length;
linea(`\n  ─ ${verdes}/${pasos.length} ${verdes === pasos.length ? '✅ VERDE' : '🔴'}\n`);
guardarPerf('b6-verde-zona.json', { pasos, antes: ANTES, dosViajes, despues });
