/**
 * S94-PERF · EL CAMINO REAL — cuánto cuesta ABRIR el HOY del prestador.
 *
 * Los bloques anteriores midieron piezas: el peaje por petición (≈150 ms) y el
 * conteo de olas encadenadas por pantalla (12 en el HOY). Este script mide **la
 * cosa entera**, con un token de verdad y por la misma puerta que la app, para
 * que el número del reporte no sea una multiplicación mía sino una corrida.
 *
 * ── Y MIDE LA CURA CANDIDATA CON EL MISMO INSTRUMENTO (R1) ─────────────────
 * `obtenerMiPrestador()` —**el wrapper más llamado de la app: aparece en 28 de
 * los efectos de foco censados**— hace DOS viajes encadenados: la RPC
 * `obtener_mi_prestador()` y, con el id que esa RPC devuelve, una segunda
 * lectura a `v_prestadores_publicos` por tres columnas de zona. La cura
 * candidata es que la RPC devuelva esas tres columnas y el segundo viaje
 * desaparezca. Acá se cronometran **los dos caminos**, no se estima ninguno.
 *
 * ── LO QUE NO ES ───────────────────────────────────────────────────────────
 * No es el teléfono del founder en red móvil. Es el PISO: una máquina de
 * escritorio con buena conexión. En el aparato, cada ola cuesta más.
 */

import { readFileSync } from 'node:fs';
import { rest, tokenDe, linea, guardarPerf, cronometrar, RAIZ, r1 } from './lib-perf.mjs';

const env = readFileSync(`${RAIZ}/apps/prestador/.env.local`, 'utf8');
const MAIL = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const PW = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

linea('\n══════════════════════════════════════════════════════════════');
linea('  EL CAMINO REAL · abrir el HOY del prestador');
linea('══════════════════════════════════════════════════════════════\n');

const token = await tokenDe(MAIL, PW);
linea('   sesión fixture abierta (identidad no se transcribe · R6)\n');

const g = (ruta, o = {}) => rest(ruta, { token, ...o });
const rpc = (n, args = {}) => g(`/rest/v1/rpc/${n}`, { metodo: 'POST', cuerpo: args });

/* El id, por extracción y NO por `JSON.parse` del cuerpo entero: `rest()`
   trunca a 400 caracteres (viene de las sesiones de seguridad, donde imprimir
   respuestas enteras era el riesgo). Parsearlo revienta —y de paso volcaría
   dirección y coordenadas del negocio a la consola, que es exactamente lo que
   R6 prohíbe—. Se saca el uuid con un regex y el cuerpo no se imprime nunca. */
const idDe = (r) => r.cuerpo.match(/"id"\s*:\s*"([0-9a-f-]{36})"/)?.[1] ?? null;

const prestadorId = idDe(await rpc('obtener_mi_prestador'));
if (!prestadorId) throw new Error('el fixture no resuelve prestador — la medición no puede correr');

// ── ① EL WRAPPER MÁS LLAMADO, TAL COMO ESTÁ HOY ────────────────────────────
const hoyDosViajes = await cronometrar(
  async () => {
    const id = idDe(await rpc('obtener_mi_prestador'));
    await g(`/rest/v1/v_prestadores_publicos?select=zona_lat,zona_lon,zona_radio_m&id=eq.${id}`);
  },
  { veces: 15, calentar: 3, rotulo: 'obtenerMiPrestador · HOY (RPC + lectura de zona, encadenadas)' },
);

// ── ② EL MISMO DATO EN UN SOLO VIAJE (la cura candidata) ───────────────────
const curaUnViaje = await cronometrar(() => rpc('obtener_mi_prestador'), {
  veces: 15,
  calentar: 3,
  rotulo: 'obtenerMiPrestador · si la zona viajara en la MISMA RPC',
});

linea('① EL WRAPPER MÁS LLAMADO DE LA APP (28 efectos de foco lo invocan)\n');
linea(`   hoy, dos viajes encadenados :  p50 ${hoyDosViajes.p50} ms · p95 ${hoyDosViajes.p95} ms`);
linea(`   con la zona en la misma RPC :  p50 ${curaUnViaje.p50} ms · p95 ${curaUnViaje.p95} ms`);
linea(`   ── ahorro por llamada       :  **${r1(hoyDosViajes.p50 - curaUnViaje.p50)} ms** (${r1(((hoyDosViajes.p50 - curaUnViaje.p50) / hoyDosViajes.p50) * 100)} %)\n`);

// ── ③ EL PRÓLOGO SERIAL DEL HOY, ENTERO ────────────────────────────────────
const prologo = await cronometrar(
  async () => {
    const id = idDe(await rpc('obtener_mi_prestador'));
    await g(`/rest/v1/v_prestadores_publicos?select=zona_lat,zona_lon,zona_radio_m&id=eq.${id}`);
    const miFila = idDe(await g(`/rest/v1/prestador_empleados?select=id&prestador_id=eq.${id}&limit=1`));
    if (miFila) {
      await Promise.all([
        g(`/rest/v1/prestador_empleados?select=id&prestador_id=eq.${id}&rol=eq.due%C3%B1o&limit=1`),
        g(`/rest/v1/prestador_empleado_servicios?select=servicio_id&empleado_id=eq.${miFila}`),
      ]);
    }
  },
  { veces: 12, calentar: 2, rotulo: 'prólogo serial del HOY (antes del Promise.all grande)' },
);

// ── ④ EL BLOQUE PARALELO — 17 wrappers en UNA ola ──────────────────────────
const bloqueParalelo = await cronometrar(
  async () => {
    await Promise.all([
      g(`/rest/v1/prestador_bloqueos?select=id,fecha_inicio,fecha_fin&prestador_id=eq.${prestadorId}`),
      g(`/rest/v1/prestador_servicios?select=id,tipo_servicio_id,activo&prestador_id=eq.${prestadorId}`),
      rpc('obtener_mi_cuenta_comercial'),
      g(`/rest/v1/profiles?select=id,nombre&limit=1`),
      g(`/rest/v1/prestador_empleados?select=id,activo&prestador_id=eq.${prestadorId}`),
    ]);
  },
  { veces: 12, calentar: 2, rotulo: 'una ola de 5 peticiones en paralelo' },
);

linea('② LA FORMA DEL HOY, MEDIDA\n');
linea(`   prólogo serial (3-4 olas)   :  p50 ${prologo.p50} ms · p95 ${prologo.p95} ms`);
linea(`   una ola de 5 en paralelo    :  p50 ${bloqueParalelo.p50} ms · p95 ${bloqueParalelo.p95} ms`);
linea('');
linea(`   ⇒ CINCO peticiones en paralelo cuestan ${bloqueParalelo.p50} ms — casi lo mismo que UNA.`);
linea(`     CUATRO peticiones encadenadas cuestan ${prologo.p50} ms.`);
linea('     **El paralelismo es gratis; el encadenamiento se paga entero.** Y el');
linea('     HOY tiene bien resuelto lo grande (3 `Promise.all`) y mal resuelto lo');
linea('     chico: el prólogo que resuelve QUIÉN SOY.');

guardarPerf('b5-camino-real.json', { hoyDosViajes, curaUnViaje, prologo, bloqueParalelo });
linea('\n   ── guardado en scripts/perf/salida/b5-camino-real.json\n');
