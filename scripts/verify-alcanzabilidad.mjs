#!/usr/bin/env node
/**
 * verify-alcanzabilidad — EL GUARD DE L-161 (S82-A r12).
 *
 * LA LEY QUE MECANIZA (L-161, firmada S73): *toda superficie se verifica
 * ALCANZABLE antes de publicarse, con el camino literal declarado.*
 * Hasta hoy eso dependía de que alguien se acordara — y **falló CUATRO
 * veces en una sola sesión**: la pantalla de vacunas (nació sin celda
 * que la enlazara), `/gallery` (D-580), el log de paseos, y el log de
 * veterinaria (el founder tocó Veterinaria y cayó en la reserva).
 *
 * **UNA PANTALLA SIN ENTRADA VERIFICADA NO ESTÁ CONSTRUIDA.**
 *
 * QUÉ MIDE: para cada ruta de `expo-router` bajo `src/app`, que exista
 * al menos UNA referencia de navegación hacia ella en otro archivo
 * (`router.push/navigate/replace`, `<Link href>`, `pathname:`). Es
 * estructural, no semántico: no prueba que el camino se pueda RECORRER
 * en el teléfono — prueba que existe. **El gate en dispositivo sigue
 * siendo la única firma** (L-153); esto caza el caso barato y frecuente:
 * la pantalla que nadie enlazó.
 *
 * CÓMO SE DECLARA UNA EXCEPCIÓN (y por qué hay que declararla): una
 * pantalla alcanzable por otra vía —deep link, URL directa, montada por
 * el navegador— lleva en su cabecera el marcador
 *   `// alcanzable-por: <cómo>`
 * El marcador no es un permiso: es la declaración que L-161 pide ("con
 * el camino literal declarado"). Si no se puede escribir el cómo, la
 * pantalla no está alcanzable.
 *
 * Exit != 0 = hay pantallas huérfanas y LA TANDA NO SE PUBLICA.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const APPS = ['apps/cliente/src/app', 'apps/prestador/src/app'];

/** Rutas que el NAVEGADOR monta por sí mismo — no necesitan que nadie
 *  las empuje: los layouts y los índices. */
const MONTADAS_POR_EL_NAVEGADOR = /(^|\/)(_layout|index)\.tsx$/;

/** Y las TABS: una tab se monta porque su `_layout` la declara
 *  (`<Tabs.Screen name="negocio" />`), no porque alguien le haga push —
 *  buscarle un `router.push('/negocio')` sería pedirle que se alcance
 *  como lo que no es. **Este caso lo destapó el propio guard en su
 *  primera corrida**: marcó `mascotas`, `negocio` y `gallery` del
 *  prestador, que son tabs declaradas en su layout. El defecto era del
 *  instrumento, no de las pantallas — y curarlas a ellas habría sido
 *  fabricar entradas falsas para callar un guard. */
function esTabDeclarada(archivo) {
  const dir = archivo.slice(0, archivo.lastIndexOf('/'));
  const nombre = archivo.slice(dir.length + 1).replace(/\.tsx$/, '');
  try {
    const layout = readFileSync(join(dir, '_layout.tsx'), 'utf8');
    return new RegExp(`name=["']${nombre}["']`).test(layout);
  } catch {
    return false;
  }
}

function archivos(dir, out = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) archivos(ruta, out);
    else if (ruta.endsWith('.tsx')) out.push(ruta);
  }
  return out;
}

/** `apps/cliente/src/app/(tabs)/hogar/veterinaria.tsx` → `/hogar/veterinaria`
 *  (los grupos `(tabs)` no viajan en la URL; `[param]` se conserva). */
function rutaDe(appDir, archivo) {
  const rel = relative(appDir, archivo).replace(/\.tsx$/, '');
  const partes = rel.split('/').filter((p) => !/^\(.*\)$/.test(p));
  return '/' + partes.join('/');
}

const fallas = [];
const info = [];

for (const appDir of APPS) {
  const todos = archivos(appDir);
  // el corpus donde se buscan los enlaces: TODO el app (una pantalla
  // puede enlazarse desde un componente, no solo desde otra pantalla)
  const raizApp = appDir.replace(/\/app$/, '');
  const corpus = archivos(raizApp).concat(
    readdirSync(raizApp, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'app')
      .flatMap((d) => {
        try {
          return archivos(join(raizApp, d.name)).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
        } catch {
          return [];
        }
      }),
  );

  for (const archivo of todos) {
    if (MONTADAS_POR_EL_NAVEGADOR.test(archivo)) continue;
    if (esTabDeclarada(archivo)) continue;
    const src = readFileSync(archivo, 'utf8');
    if (/\/\/\s*alcanzable-por:/.test(src)) {
      info.push(`${archivo} — excepción DECLARADA`);
      continue;
    }
    const ruta = rutaDe(appDir, archivo);
    // el literal que buscamos: la ruta entre comillas en cualquier
    // forma de navegación (push/navigate/replace/href/pathname)
    const aguja = new RegExp(`['"\`]${ruta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`);
    const enlazada = corpus.some((otro) => otro !== archivo && aguja.test(readFileSync(otro, 'utf8')));
    if (!enlazada) {
      fallas.push(`${archivo}\n      ruta \`${ruta}\` — NADIE la enlaza (ni push/navigate/replace, ni href, ni pathname)`);
    }
  }
}

if (fallas.length > 0) {
  console.error('✗ PANTALLAS SIN ENTRADA (L-161: una pantalla sin entrada verificada NO está construida):');
  for (const f of fallas) console.error(`   ${f}`);
  console.error('\n  Curá la entrada, o declará el camino con `// alcanzable-por: <cómo>` en la cabecera.');
  process.exit(1);
}
console.log(`✓ alcanzabilidad: toda pantalla tiene entrada (${info.length} excepción(es) declarada(s))`);
