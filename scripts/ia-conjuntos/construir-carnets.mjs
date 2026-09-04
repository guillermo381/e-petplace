#!/usr/bin/env node
/**
 * S113-E · CONJUNTO DE PRUEBA — CARNETS DE VACUNACIÓN.
 *
 * ═══ QUÉ MIDE ══════════════════════════════════════════════════════════════
 * La pieza `carnet`: una foto de un carnet de vacunación entra, y salen N
 * vacunas con sus campos. La verdad son las filas que un humano YA revisó y
 * confirmó en `evento_vacuna_aplicada` — no una verdad fabricada para el test.
 *
 * ═══ 🔴 LA UNIDAD ES EL CARNET, NO LA FILA — y esto se midió, no se supuso ══
 * Las 32 filas de `evento_vacuna_aplicada` **son 5 carnets**, no 32 casos:
 *   8 + 8 + 8 + 7 + 1 = 32 filas sobre 5 `archivo_url` distintos.
 * Una llamada a `extract-vacuna` procesa UNA imagen y devuelve N vacunas, así
 * que el conjunto agrupa por imagen. *Tratar cada fila como un caso habría
 * inflado la muestra 6× y medido el mismo carnet ocho veces.*
 *
 * ═══ 🔴 LO QUE ESTE CONJUNTO NO PUEDE MEDIR, declarado ═════════════════════
 * `fecha_proxima` tiene **1 valor en 32 filas** (y en el carnet de una sola
 * fila). Cuatro de los cinco carnets tienen cero. *Un campo con una
 * observación no se mide: se declara sin muestra.* El arnés lo reporta como
 * `sin_muestra`, jamás como 100 % ni como 0 %.
 *
 * ═══ 🔒 PRIVACIDAD ═════════════════════════════════════════════════════════
 * El conjunto **NO se commitea**: sale a `.ia-conjuntos/` (gitignored). Lleva
 * rutas de fotos de carnets reales y `veterinario_nombre_externo`, que es el
 * nombre de una persona. Al repo entra el GENERADOR, jamás el conjunto.
 * Las imágenes tampoco se copian: el conjunto guarda `bucket` + `path`, y el
 * arnés las lee de Storage con `service_role` en cada corrida.
 *
 * Uso:  node scripts/ia-conjuntos/construir-carnets.mjs [--verificar-legibles]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { consultar, claveServicio, bajarObjeto, DIR_CONJUNTOS } from './lib-conjuntos.mjs';

const di = (s) => process.stdout.write(s + '\n');
const BUCKET = 'mascotas'; // medido: apps/cliente/src/lib/subir-avatar.ts:34

const filas = consultar(`
  select id::text, archivo_url, nombre_vacuna, fecha_aplicada::text,
         fecha_proxima::text, lote, veterinario_nombre_externo, tipo_vacuna
  from public.evento_vacuna_aplicada
  where archivo_url is not null
  order by archivo_url, fecha_aplicada, nombre_vacuna
`);

if (filas.length === 0) {
  di('🔴 NO CONCLUYENTE: 0 filas con archivo_url. No hay conjunto que construir.');
  process.exit(2);
}

const porImagen = new Map();
for (const f of filas) {
  if (!porImagen.has(f.archivo_url)) porImagen.set(f.archivo_url, []);
  porImagen.get(f.archivo_url).push({
    id: f.id,
    nombre_vacuna: f.nombre_vacuna,
    fecha_aplicada: f.fecha_aplicada,
    fecha_proxima: f.fecha_proxima,
    lote: f.lote,
    veterinario_nombre_externo: f.veterinario_nombre_externo,
    tipo_vacuna: f.tipo_vacuna,
  });
}

const casos = [...porImagen].map(([path, vacunas]) => ({
  caso: path.split('/').pop(),
  bucket: BUCKET,
  path,
  n_vacunas: vacunas.length,
  verdad: vacunas,
}));

const conjunto = {
  nombre: 'carnets',
  pieza: 'carnet',
  generado_el: new Date().toISOString(),
  fuente: 'public.evento_vacuna_aplicada (verdad confirmada por humanos al revisar la extracción)',
  unidad: 'un carnet = una llamada al modelo; la verdad es la lista de vacunas de esa imagen',
  campos_verdad: ['nombre_vacuna', 'fecha_aplicada', 'fecha_proxima', 'lote', 'veterinario_nombre_externo'],
  n_casos: casos.length,
  n_filas_verdad: filas.length,
  cobertura_por_campo: {},
  casos,
};

for (const c of conjunto.campos_verdad) {
  const con = filas.filter((f) => f[c] !== null && f[c] !== '').length;
  conjunto.cobertura_por_campo[c] = { con_valor: con, de: filas.length };
}

mkdirSync(DIR_CONJUNTOS, { recursive: true });
const salida = join(DIR_CONJUNTOS, 'carnets.json');
writeFileSync(salida, JSON.stringify(conjunto, null, 2));

di(`conjunto CARNETS → ${salida}`);
di(`  ${conjunto.n_casos} carnets · ${conjunto.n_filas_verdad} filas de verdad`);
for (const [c, v] of Object.entries(conjunto.cobertura_por_campo)) {
  const pct = Math.round((v.con_valor / v.de) * 100);
  const marca = v.con_valor <= 1 ? '  🔴 SIN MUESTRA — no se puede medir' : '';
  di(`  ${c.padEnd(28)} ${String(v.con_valor).padStart(3)}/${v.de}  (${pct} %)${marca}`);
}
di(`  por carnet: ${casos.map((c) => c.n_vacunas).join(' · ')} vacunas`);

// ── CONTROL: abrir tres imágenes de verdad ────────────────────────────────
// «Legible» no es «la fila tiene una ruta»: es que el byte llegue. Sin este
// control, un conjunto de 5 rutas muertas se ve idéntico a uno sano.
if (process.argv.includes('--verificar-legibles')) {
  const clave = claveServicio();
  di('\ncontrol de legibilidad (bajando de Storage con service_role):');
  let ok = 0;
  for (const c of casos) {
    const buf = await bajarObjeto(c.bucket, c.path, clave);
    const bien = buf !== null && buf.length > 1024;
    if (bien) ok += 1;
    di(`  ${bien ? '✅' : '🔴'} ${c.caso.padEnd(28)} ${buf ? `${(buf.length / 1024).toFixed(0)} kB` : 'NO SE PUDO BAJAR'}`);
  }
  di(`\n  ${ok} de ${casos.length} carnets legibles.`);
  if (ok === 0) { di('🔴 NINGUNO legible — el conjunto no sirve.'); process.exit(1); }
}
