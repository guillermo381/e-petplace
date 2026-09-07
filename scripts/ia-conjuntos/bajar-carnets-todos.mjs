#!/usr/bin/env node
/**
 * bajar-carnets-todos — S113-E · TODOS los objetos `carnet-*` del bucket.
 *
 * Los conjuntos anteriores salieron de dos listas parciales: los 5 del lote 0
 * (los que tenían filas aceptadas en `evento_vacuna_aplicada`) y los 17 de la
 * carpeta demo. **Medido contra Storage: hay 42.** Este script no parte de
 * ninguna lista — le pregunta al bucket.
 *
 * ── DEDUPLICA POR CONTENIDO, Y CLASIFICA POR LO QUE SE VE ─────────────────
 * `carnet-*` es el prefijo con que la app nombra lo que sube desde esa pantalla,
 * **no una promesa de que sea un carnet**. Medido en el lote 1.0: entre esos
 * objetos hay **capturas de pantalla de la app** y **carnets fabricados de
 * prueba**. Un conjunto armado por el prefijo del nombre le daría capturas al
 * extractor y puntuaría al modelo sobre documentos que no son carnets.
 * Acá se baja todo, se deduplica por sha256 y **la clasificación queda
 * pendiente de mirar cada imagen** — el script no la adivina.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { claveServicio, URL_BASE } from './lib-conjuntos.mjs';

const DESTINO = process.env.CARNETS_DIR ?? join(process.env.HOME, '.epetplace', 'ia-conjuntos', 'imagenes', 'carnets-todos');
const di = (s) => console.log(s);

const sql = `select name from storage.objects where bucket_id='mascotas' and name like '%/carnet-%' order by name`;
const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], { encoding: 'utf8', maxBuffer: 1 << 24 });
const i = r.stdout.indexOf('{');
if (i === -1) { di('🔴 no pude listar el bucket. PARA.'); process.exit(2); }
const objetos = JSON.parse(r.stdout.slice(i)).rows.map((x) => x.name);
di(`Storage: ${objetos.length} objetos \`carnet-*\``);

const clave = claveServicio();
mkdirSync(DESTINO, { recursive: true });
const porHash = new Map();
let fallos = 0;
for (const path of objetos) {
  const o = await fetch(`${URL_BASE}/storage/v1/object/mascotas/${path}`, {
    headers: { Authorization: `Bearer ${clave}`, apikey: clave },
  });
  if (!o.ok) { di(`  🔴 ${path}: HTTP ${o.status}`); fallos += 1; continue; }
  const b = Buffer.from(await o.arrayBuffer());
  const h = createHash('sha256').update(b).digest('hex').slice(0, 12);
  const nombre = path.split('/').pop();
  if (porHash.has(h)) { porHash.get(h).copias.push(nombre); continue; }
  porHash.set(h, { nombre, bytes: b.length, copias: [] });
  writeFileSync(join(DESTINO, nombre), b);
}
di(`\n${objetos.length} objetos → ${porHash.size} imágenes DISTINTAS (por sha256)${fallos ? ` · ${fallos} fallo(s)` : ''}`);
di(`destino: ${DESTINO}\n`);
for (const [h, v] of porHash) {
  di(`  ${h}  ${v.nombre.padEnd(30)} ${String(Math.round(v.bytes / 1024)).padStart(5)} kB${v.copias.length ? `   (+${v.copias.length} copia(s) idéntica(s))` : ''}`);
}
writeFileSync(join(DESTINO, '_inventario.json'), JSON.stringify(
  { generado_el: new Date().toISOString(), n_objetos: objetos.length, n_distintas: porHash.size,
    advertencia: 'El prefijo `carnet-` es cómo la app nombra lo que se sube desde esa pantalla, NO una promesa de que sea un carnet. Clasificar mirando, no por el nombre.',
    imagenes: [...porHash].map(([h, v]) => ({ sha256_12: h, ...v })) }, null, 2));
