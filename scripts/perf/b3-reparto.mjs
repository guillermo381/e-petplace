/**
 * S94-PERF · EL REPARTO — ¿el costo es por FILA o por PETICIÓN?
 *
 * ── POR QUÉ ESTE SCRIPT EXISTE (un error propio, declarado) ─────────────────
 * La primera versión de esta medición restaba el tiempo de un `HEAD` al de una
 * consulta y llamaba «trabajo» a la diferencia. Salió un número imposible:
 * **una lectura de 1 fila costaba 128 ms de «trabajo» y una de 200 filas
 * costaba 114** — o sea, traer 200 veces más datos costaba menos. Un resultado
 * imposible no es ruido: es la prueba de que las dos cosas comparadas no eran
 * comparables (el `HEAD` a la raíz ni siquiera toca la base).
 *
 * *La resta estaba bien hecha; los dos números medían cosas distintas.* Se tira
 * la resta, no se ajusta.
 *
 * ── EL DISEÑO QUE SÍ CONTESTA ──────────────────────────────────────────────
 * Se comparan formas de consulta ENTRE SÍ, todas por la misma puerta y con las
 * mismas cabeceras. Si 1 fila y 200 filas cuestan lo mismo, el costo no está en
 * las filas: está en la petición. Y si está en la petición, **la única cura
 * posible es hacer menos peticiones** — ninguna optimización de SQL toca eso.
 */

import { rest, linea, guardarPerf, cronometrar, percentil } from './lib-perf.mjs';

const VECES = 25;

const casos = [
  ['1 fila · 1 columna (catálogo)', '/rest/v1/cat_especies?select=id&limit=1'],
  ['10 filas · 1 columna', '/rest/v1/cat_razas?select=id&limit=10'],
  ['105 filas · 3 columnas', '/rest/v1/cat_razas?select=id,nombre,especie_id&limit=200'],
  ['tabla con RLS (anon ⇒ 0 filas, pero la policy SE EVALÚA)', '/rest/v1/mascotas?select=id&limit=1'],
  ['función (RPC sin argumentos)', '/rest/v1/rpc/obtener_paises_del_mundo'],
];

linea('\n══════════════════════════════════════════════════════════════');
linea('  EL REPARTO · ¿por fila o por petición?');
linea(`  ${VECES} tiros por caso, 3 de calentamiento descartados, misma puerta`);
linea('══════════════════════════════════════════════════════════════\n');

const res = [];
for (const [rotulo, ruta] of casos) {
  const esRpc = ruta.includes('/rpc/');
  const m = await cronometrar(() => rest(ruta, esRpc ? { metodo: 'POST', cuerpo: {} } : {}), {
    veces: VECES,
    calentar: 3,
    rotulo,
  });
  res.push(m);
  linea(`   p50 ${String(m.p50).padStart(6)} ms · p95 ${String(m.p95).padStart(6)} ms · min ${String(m.min).padStart(6)} ms   ${rotulo}`);
}

const p50s = res.map((m) => m.p50);
const spread = Math.max(...p50s) - Math.min(...p50s);
const mins = res.map((m) => m.min);

linea('\n── LO QUE DICEN ESTOS NÚMEROS ────────────────────────────────');
linea(`   Diferencia entre el caso más barato y el más caro: **${Math.round(spread)} ms**`);
linea(`   Mínimo absoluto observado en cualquier caso:        **${Math.min(...mins)} ms**`);
linea('');
if (spread < Math.min(...p50s) * 0.35) {
  linea('   ⇒ Traer 1 fila y traer 105 cuesta prácticamente lo MISMO. El costo');
  linea('     no está en los datos ni en el trabajo de la base: **está en la');
  linea('     petición**. Cada ida y vuelta tiene un peaje fijo, y todo lo que');
  linea('     la app hace se paga en múltiplos de ese peaje.');
  linea('');
  linea('   ⇒ CONSECUENCIA, y es la tesis de la sesión: no hay consultas que');
  linea('     optimizar. **Hay viajes que eliminar.** Una pantalla con 6 esperas');
  linea(`     encadenadas paga ~${Math.round(6 * percentil(p50s, 50))} ms antes de pintar nada, aunque cada`);
  linea('     consulta fuera instantánea.');
} else {
  linea('   ⇒ Hay diferencia sensible entre formas de consulta: mirar la más cara.');
}

guardarPerf('b3-reparto.json', res);
linea('\n   ── guardado en scripts/perf/salida/b3-reparto.json\n');
