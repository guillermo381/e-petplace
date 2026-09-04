#!/usr/bin/env node
/**
 * S113-E · CONJUNTO DE PRUEBA — RAZA POR FOTO.
 *
 * ═══ QUÉ MIDE ══════════════════════════════════════════════════════════════
 * La pieza `raza`: entra la foto de una mascota, sale la raza. La verdad es la
 * raza que la familia declaró al dar de alta al animal.
 *
 * ═══ 🔴 EL CONJUNTO ES CHICO, Y EL NÚMERO REAL ES MÁS CHICO QUE EL APARENTE ═
 * Medido (3-sep-2026), y corrige de entrada la cuenta fácil:
 *   89 mascotas · 49 con raza · 9 con foto · **5 con las dos**
 * Los «22 objetos» del bucket `mascotas` NO son 22 casos: ese bucket guarda
 * avatares **y carnets**, de todas las mascotas, tengan raza o no.
 *
 * Y de esos 5, **dos no sirven para medir** — cada uno por su razón, y el
 * conjunto los marca en vez de descartarlos en silencio:
 *   · **«Mestizo»** no es una raza reconocible visualmente. Contarlo como
 *     fallo castiga al modelo por acertar; contarlo como acierto es regalarle
 *     un punto. Es `apto_para_medir: false`.
 *   · **un avatar de siembra** (`avatar-demo-*.png`, 2,9 kB) no es la foto de
 *     un perro: es un placeholder de una cuenta de prueba.
 *
 * ⇒ **quedan 3 casos aptos, los tres perro, cero gato.**
 *
 * 🔴 **Con n=3 se puede CORRER el arnés y no se puede DECIDIR un modelo.** Un
 * acierto de más mueve el resultado 33 puntos. El conjunto se entrega igual —
 * sirve para probar que la pieza funciona de punta a punta — pero quien lo use
 * para elegir modelo tiene que leer esta línea primero.
 *
 * 🔒 Sale a `.ia-conjuntos/` (gitignored): lleva rutas de fotos de mascotas
 * reales. Sin nombre de la mascota — no hace falta para medir una raza.
 *
 * Uso:  node scripts/ia-conjuntos/construir-razas.mjs [--verificar-legibles]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { consultar, claveServicio, bajarObjeto, DIR_CONJUNTOS } from './lib-conjuntos.mjs';

const di = (s) => process.stdout.write(s + '\n');
const BUCKET = 'mascotas';

const filas = consultar(`
  select m.id::text, m.especie, m.raza, m.foto_url,
         (o.name is not null) as en_storage,
         coalesce((o.metadata->>'size')::int, 0) as bytes
  from public.mascotas m
  left join storage.objects o
         on o.bucket_id = 'mascotas' and o.name = m.foto_url
  where m.raza is not null and btrim(m.raza) <> '' and m.foto_url is not null
  order by m.especie, m.raza
`);

if (filas.length === 0) {
  di('🔴 NO CONCLUYENTE: 0 mascotas con raza declarada y foto.');
  process.exit(2);
}

/** Razas que no son una respuesta verificable contra una foto. */
const NO_VERIFICABLE = new Set(['mestizo', 'mestiza', 'criollo', 'criolla', 'sin raza', 'desconocida']);

const casos = filas.map((f) => {
  const razones = [];
  if (!f.en_storage) razones.push('la foto no está en el bucket');
  if (f.bytes > 0 && f.bytes < 10_000) razones.push(`foto de ${f.bytes} B — demasiado chica para ser una foto real`);
  if (/avatar-demo/i.test(f.foto_url)) razones.push('avatar de siembra, no una foto de la mascota');
  if (NO_VERIFICABLE.has(String(f.raza).trim().toLowerCase())) {
    razones.push(`«${f.raza}» no es identificable visualmente`);
  }
  return {
    caso: f.id.slice(0, 8),
    bucket: BUCKET,
    path: f.foto_url,
    bytes: f.bytes,
    verdad: { especie: f.especie, raza: f.raza },
    apto_para_medir: razones.length === 0,
    // El motivo se guarda SIEMPRE, también cuando es apto (array vacío): un
    // campo que sólo aparece cuando algo falla se lee como «no hubo problema»
    // en las filas donde falta, y eso no es lo mismo que «se revisó y no hubo».
    motivos_no_apto: razones,
  };
});

const aptos = casos.filter((c) => c.apto_para_medir);
const conjunto = {
  nombre: 'razas',
  pieza: 'raza',
  generado_el: new Date().toISOString(),
  fuente: 'public.mascotas.raza (declarada por la familia al dar de alta) + foto del bucket mascotas',
  campos_verdad: ['raza', 'especie'],
  n_casos: casos.length,
  n_aptos: aptos.length,
  advertencia:
    aptos.length < 10
      ? `SÓLO ${aptos.length} CASOS APTOS. Alcanza para probar que la pieza corre; NO alcanza para elegir un modelo con número.`
      : null,
  especies: [...new Set(aptos.map((c) => c.verdad.especie))],
  casos,
};

mkdirSync(DIR_CONJUNTOS, { recursive: true });
const salida = join(DIR_CONJUNTOS, 'razas.json');
writeFileSync(salida, JSON.stringify(conjunto, null, 2));

di(`conjunto RAZAS → ${salida}`);
di(`  ${conjunto.n_casos} candidatos · ${conjunto.n_aptos} aptos · especies: ${conjunto.especies.join(', ') || '(ninguna)'}`);
for (const c of casos) {
  di(`  ${c.apto_para_medir ? '✅' : '⛔'} ${c.caso}  ${String(c.verdad.raza).padEnd(18)} ${(c.bytes / 1024).toFixed(0).padStart(4)} kB` +
     (c.motivos_no_apto.length ? `  — ${c.motivos_no_apto.join(' · ')}` : ''));
}
if (conjunto.advertencia) di(`\n🔴 ${conjunto.advertencia}`);

if (process.argv.includes('--verificar-legibles')) {
  const clave = claveServicio();
  di('\ncontrol de legibilidad:');
  let ok = 0;
  for (const c of casos) {
    const buf = await bajarObjeto(c.bucket, c.path, clave);
    const bien = buf !== null && buf.length > 512;
    if (bien) ok += 1;
    di(`  ${bien ? '✅' : '🔴'} ${c.caso}  ${buf ? `${(buf.length / 1024).toFixed(0)} kB` : 'NO SE PUDO BAJAR'}`);
  }
  di(`\n  ${ok} de ${casos.length} fotos legibles.`);
}
