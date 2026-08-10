/**
 * S94-PERF · EL REBOTE DE D-730 — EL RELOJ.
 *
 * **Solo medir. La cura es de la sesión propia de D-730.**
 *
 * `b9-rebote.mjs` estableció QUÉ trabajo se repite leyendo el objeto. Acá se
 * cronometra CUÁNTO cuesta ese trabajo por el camino real, con token de
 * cliente, para que D-730 se coste con milisegundos y no con «se ve feo».
 *
 * Lo que se cronometra es lo que se puede cronometrar sin inventar contexto:
 * la consulta que la ficha REPITE (`obtenerPerfilesPublicos`, que la lista ya
 * había hecho para dibujar su propia tarjeta) en sus dos formas — la de la
 * lista, con todos los ids visibles, y la de la ficha, con uno solo.
 *
 * Para el resto de las peticiones del rebote NO se inventa un número: B1 ya
 * probó que **el costo es por petición y no por payload** (1 fila y 105 filas
 * cuestan lo mismo), así que se cuentan VIAJES y se multiplican por el peaje
 * medido. Se dice cuál número es medición y cuál es multiplicación.
 */

import { readFileSync } from 'node:fs';
import { rest, tokenDe, linea, guardarPerf, cronometrar, RAIZ, r1 } from './lib-perf.mjs';

const env = readFileSync(`${RAIZ}/apps/cliente/.env.local`, 'utf8');
const MAIL = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const PW = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const COLUMNAS =
  'id,nombre_comercial,foto_url,ciudad,sector,descripcion,cohorte,cohorte_anio,zona_lat,zona_lon,zona_radio_m,calificacion_promedio,total_resenas,total_citas,servicios,portadas,clip_url';

linea('\n══════════════════════════════════════════════════════════════');
linea('  D-730 · EL RELOJ DEL REBOTE — medición, cero cura');
linea('══════════════════════════════════════════════════════════════\n');

const token = await tokenDe(MAIL, PW);
const g = (ruta) => rest(ruta, { token });

// Los prestadores que una lista mostraría (los públicos, o sea los 'activo').
const r = await g(`/rest/v1/v_prestadores_publicos?select=id&limit=20`);
const ids = [...r.cuerpo.matchAll(/"id"\s*:\s*"([0-9a-f-]{36})"/g)].map((m) => m[1]);
if (ids.length === 0) throw new Error('la vitrina no devuelve prestadores — la medición no puede correr');
linea(`   la vitrina devuelve ${ids.length} negocio(s) — la lista los pide TODOS de una\n`);

const lista = await cronometrar(
  () => g(`/rest/v1/v_prestadores_publicos?select=${COLUMNAS}&id=in.(${ids.join(',')})`),
  { veces: 12, calentar: 3, rotulo: 'la LISTA: perfiles públicos de todos los visibles, en UN viaje' },
);
const ficha = await cronometrar(
  () => g(`/rest/v1/v_prestadores_publicos?select=${COLUMNAS}&id=in.(${ids[0]})`),
  { veces: 12, calentar: 3, rotulo: 'la FICHA: el MISMO perfil, otra vez, para UNO solo' },
);

linea('① LA CONSULTA QUE LA FICHA REPITE\n');
linea(`   la lista, todos los ids : p50 ${lista.p50} ms · p95 ${lista.p95} ms`);
linea(`   la ficha, un id         : p50 ${ficha.p50} ms · p95 ${ficha.p95} ms`);
linea('');
linea('   ⇒ La lista ya tiene ese perfil en memoria: lo pidió para dibujar la');
linea('     tarjeta que el usuario tocó. La ficha lo vuelve a pedir entero —');
linea(`     **${ficha.p50} ms para traer un dato que estaba a un prop de distancia**.`);
linea('     Y cuesta casi lo mismo pedir UNO que los ' + ids.length + ': el peaje es del viaje.');

// ── ② EL CONTEO DE VIAJES DEL REBOTE, por oficio (de b9-rebote) ────────────
const PEAJE = 153.2; // p50 medido en B0
const OFICIOS = [
  ['paseo', 1, ['obtenerPaseadoresDisponibles'], 'el hogar NO se re-pide: lo guarda `hogarCargadoRef` (cura de S92-BIS, solo acá)'],
  ['grooming', 2, ['obtenerPerfilMascota', 'obtenerGroomersDisponibles'], 'sin guard: re-pide todo'],
  ['adiestramiento', 1, ['obtenerAdiestradoresDisponibles'], 'sin guard'],
  ['veterinaria', 3, ['obtenerPerfilMascota', 'obtenerVeterinariosDisponibles', 'obtenerVitrinaNegocios'], 'sin guard: el más caro de los cuatro'],
];

linea('\n② LOS VIAJES DEL REBOTE, POR OFICIO\n');
linea('   oficio          entrar a  volver a   total   ≈ tiempo   qué pasa con el resultado');
linea('                   la ficha  la lista   viajes  de red');
const filas = [];
for (const [oficio, n, quienes, nota] of OFICIOS) {
  const total = 1 + n; // 1 = la repetición de la ficha
  filas.push({ oficio, ficha: 1, recarga: n, total, ms: r1(total * PEAJE), quienes, nota });
  linea(
    `   ${oficio.padEnd(15)} ${String(1).padStart(7)} ${String(n).padStart(9)} ${String(total).padStart(8)} ${String(r1(total * PEAJE)).padStart(8)} ms   se DESCARTA`,
  );
}

linea('\n   ⚠️ QUÉ ES MEDICIÓN Y QUÉ ES MULTIPLICACIÓN, para que nadie lo confunda:');
linea(`     · los ${ficha.p50} ms de la consulta repetida de la ficha son MEDIDOS acá;`);
linea(`     · la columna «≈ tiempo de red» es el conteo de viajes × el peaje de`);
linea(`       ${PEAJE} ms medido en B0. **Es una multiplicación**, y se sostiene solo`);
linea('       porque B1 probó que el costo es por petición y no por payload.');

linea('\n③ LO QUE HACE QUE ESTO SEA DESPERDICIO Y NO SOLO COSTO\n');
linea('   `router.back()` NO re-monta la lista —la conserva con su fecha, su hora');
linea('   y su scroll, que es justamente por lo que se eligió `back` y no');
linea('   `replace`—. **O sea que los datos que re-pide YA ESTÁN en su estado.**');
linea('   Y la cadena de reserva navega al checkout en el mismo foco, así que');
linea('   cuando esas respuestas llegan **la pantalla que las pidió ya no está a');
linea('   la vista**. No es trabajo de más: es trabajo para nadie.');

linea('\n④ Y EL QUE NO SE PUEDE CONTAR DESDE ACÁ (R5)\n');
linea('   Montajes y re-renders del rebote **no se miden leyendo el repo**: son');
linea('   del árbol de React en el aparato. Lo medible sin teléfono son los');
linea('   VIAJES, y son los que están arriba. *Un número de re-renders inventado');
linea('   acá sería exactamente el «se ve feo» con decimales.*');

guardarPerf('c1-rebote-cronometro.json', { ids: ids.length, lista, ficha, filas, peaje: PEAJE });
linea('\n   ── guardado en scripts/perf/salida/c1-rebote-cronometro.json\n');
