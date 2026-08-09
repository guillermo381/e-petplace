/**
 * 🔴 P0 · ¿EN CUÁNTAS PANTALLAS VIVE EL MISMO DEFECTO?
 *
 * El founder pidió (2): «recorré el MISMO camino en los otros servicios con
 * filtro por especie o por raza, porque si la causa es un catálogo, el paseo es
 * el primero que apareció, no el único roto».
 *
 * La causa NO resultó ser un catálogo —el backend está sano— pero la orden vale
 * igual, y más: el defecto es un PATRÓN DE PANTALLA, y los patrones se copian.
 *
 * Lo que se busca: pantallas que decidan «no hay elegibles» mirando el LARGO de
 * la lista en vez de la FASE. `ofrecibles()` devuelve `[]` en `cargando` **y**
 * en `error`, así que `length === 0` significa tres cosas distintas y una sola
 * de ellas justifica decirle al usuario que no tiene perros.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { guardarSeg2, RAIZ, linea } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);

const { stdout } = await ejecutar('git', ['grep', '-l', '--', 'ofrecibles', 'apps/cliente/src'], {
  cwd: RAIZ,
  maxBuffer: 16 * 1024 * 1024,
});
const archivos = stdout.split('\n').filter(Boolean);

linea('\n══ P0 · CENSO DEL PATRÓN — ¿quién mira el LARGO en vez de la FASE? ══\n');
const informe = [];
for (const rel of archivos) {
  const txt = readFileSync(`${RAIZ}/${rel}`, 'utf8');
  const lineas = txt.split('\n');

  // ¿usa la fase para decidir, o solo el largo?
  const usaFase = /faseEspecies\.fase\s*===|estado\.fase\s*===|\.fase !== 'listo'|fase === 'error'|fase === 'cargando'/.test(txt);
  const decisiones = [];
  lineas.forEach((l, i) => {
    if (/(elegibles|ofrecib\w*)\.length\s*===\s*0/.test(l)) decisiones.push({ n: i + 1, l: l.trim().slice(0, 110) });
  });

  informe.push({ archivo: rel, usaFase, decisiones });
  const marca = decisiones.length > 0 && !usaFase ? '🔴' : decisiones.length > 0 ? '🟡' : '  ';
  linea(`  ${marca} ${rel.replace('apps/cliente/src/app/(tabs)/explorar/', '')}`);
  linea(`       ¿consulta la FASE en algún lado? ${usaFase ? 'sí' : 'NO'}`);
  for (const d of decisiones) linea(`       decide por LARGO en :${d.n}  → ${d.l}`);
  if (decisiones.length === 0) linea('       (no decide «sin elegibles» por largo)');
}

const rotas = informe.filter((i) => i.decisiones.length > 0 && !i.usaFase);
const mixtas = informe.filter((i) => i.decisiones.length > 0 && i.usaFase);
linea(`\n  🔴 deciden SOLO por largo (sin mirar fase): ${rotas.length}`);
for (const r of rotas) linea(`     · ${r.archivo}`);
linea(`  🟡 consultan la fase en algún lado Y ADEMÁS deciden por largo: ${mixtas.length}`);
for (const m of mixtas) linea(`     · ${m.archivo}`);

guardarSeg2('p0-censo-patron.json', informe);
linea('\n  ⚠️ «consulta la fase» no garantiza que la consulte EN ESE `if`:\n     los 🟡 hay que mirarlos a mano, uno por uno.\n');
