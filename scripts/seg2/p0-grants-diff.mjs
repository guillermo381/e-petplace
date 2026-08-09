/**
 * 🔴 P0 · ¿S92 LE QUITÓ UN GRANT A `tipos_servicio`?
 *
 * El motor está sano: `_mascota_elegible_servicio` devuelve **true** para Thor y
 * Zeus × paseo. Así que el «no tenés perros» no sale de la DB decidiendo mal:
 * sale de que **alguien no pudo leer el dato**.
 *
 * Y el candidato tiene nombre: `packages/api/src/wrappers/catalogos.ts:166` hace
 * `.select('especies_elegibles')` **directo sobre la tabla** `tipos_servicio`.
 * Si esa lectura rebota, el filtro del cliente se queda sin saber qué especies
 * acepta el paseo.
 *
 * S92 guardó el snapshot de grants del ARRANQUE en
 * `scripts/s92/salida/b0-grants-tabla.json`. Se compara contra el estado de hoy:
 * **esto es la comparación que S92 no hizo y que L-215 pedía.**
 */
import { readFileSync } from 'node:fs';
import { sql, rest, tokenDe, guardarSeg2, linea } from './lib-seg2.mjs';

const TABLAS = ['tipos_servicio', 'cat_especies', 'prestador_servicios', 'mascotas'];

// el antes, del snapshot de S92
const antes = JSON.parse(
  readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/scripts/s92/salida/b0-grants-tabla.json', 'utf8'),
);
const ahora = await sql(
  `SELECT grantee, table_name, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_schema='public' AND grantee IN ('anon','PUBLIC','authenticated')
   ORDER BY table_name, grantee, privilege_type`,
  'p0-grants',
);

linea('\n══ P0 · GRANTS DE LOS CATÁLOGOS — ANTES (arranque S92) vs AHORA ══\n');
for (const t of TABLAS) {
  const a = antes.filter((g) => g.table_name === t).map((g) => `${g.grantee}:${g.privilege_type}`);
  const b = ahora.filter((g) => g.table_name === t).map((g) => `${g.grantee}:${g.privilege_type}`);
  const perdidos = a.filter((x) => !b.includes(x));
  const nuevos = b.filter((x) => !a.includes(x));
  linea(`  ${t}`);
  linea(`     antes (solo anon/PUBLIC, que es lo que S92 censó): ${a.join(', ') || '(ninguno)'}`);
  linea(`     ahora  : ${b.join(', ') || '(ninguno)'}`);
  linea(`     ${perdidos.length ? '🔴 PERDIDOS: ' + perdidos.join(', ') : '✅ no perdió ninguno de los censados'}`);
  if (nuevos.length) linea(`     (+ ${nuevos.join(', ')})`);
  linea('');
}

// ── LO QUE DE VERDAD IMPORTA: ¿el cliente puede leer el dato? ──────────────
linea('══ EL CAMINO REAL — ¿el wrapper puede leer `especies_elegibles`? ══\n');
const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const t = await tokenDe(
  env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim(),
  env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim(),
);

// el select LITERAL del wrapper (catalogos.ts:166)
const w = await rest(`/rest/v1/tipos_servicio?select=especies_elegibles&codigo=eq.paseo`, { token: t });
linea(`  autenticado · select=especies_elegibles&codigo=eq.paseo`);
linea(`     HTTP ${w.status} · ${w.cuerpo.slice(0, 120)}`);

const wAnon = await rest(`/rest/v1/tipos_servicio?select=especies_elegibles&codigo=eq.paseo`);
linea(`\n  anónimo (por si el filtro corre antes del login)`);
linea(`     HTTP ${wAnon.status} · ${wAnon.cuerpo.slice(0, 120)}`);

// y la lectura de mascotas con su especie, que es la otra mitad del filtro
const m = await rest('/rest/v1/mascotas?select=id,nombre,especie,estado_vida&limit=5', { token: t });
linea(`\n  autenticado · mascotas con especie y estado_vida`);
linea(`     HTTP ${m.status} · ${m.cuerpo.slice(0, 160)}`);

guardarSeg2('p0-grants-diff.json', { antes: antes.filter((g) => TABLAS.includes(g.table_name)), ahora: ahora.filter((g) => TABLAS.includes(g.table_name)) });
linea('');
