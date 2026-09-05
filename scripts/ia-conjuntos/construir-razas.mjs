#!/usr/bin/env node
/**
 * construir-razas — S113-E, lote 1.2 · el conjunto de `sugerir-raza`.
 *
 * ── 🔴 EL CONJUNTO NO ES «LAS FOTOS DEL FOUNDER» ───────────────────────────
 * `~/Downloads/fotos_mascotas_muestra/` son **datasets públicos**: dog.ceo /
 * Stanford Dogs, TheCatAPI, Oxford-IIIT Pet y Petfinder. Su propio `FUENTES.md`
 * avisa que *«la mayoría permite investigación pero no uso comercial»* ⇒ sirven
 * para EVALUAR, que es lo que se hace acá, y **nada más**.
 *
 * ── LA RAZA YA ESTÁ ETIQUETADA: 1759 de 1759 ───────────────────────────────
 * No hace falta ninguna tabla para el founder. `manifiesto.csv` trae `raza` en
 * las 1759 filas, y además está en la ruta del archivo.
 *
 * ── 🔴 PERO SÓLO UN TERCIO ES MEDIBLE, Y ESA ES LA DECISIÓN DEL ARCHIVO ────
 * El conjunto tiene **174 razas de perro y 12 de gato, en inglés**; nuestro
 * catálogo tiene **44 y 20, en español** y curado para la región (Criollo,
 * Pastor alemán). Puntuar «acierto en top-1» contra las etiquetas del dataset
 * mediría al modelo sobre razas que **el producto no puede representar**: un
 * modelo que contesta «Appenzeller» está dando una respuesta que nuestro
 * catálogo no sabe guardar. **Se mide la intersección.**
 *
 * ── EL MAPA ES MI JUICIO Y SE DECLARA COMO TAL ─────────────────────────────
 * Emparejar por texto no alcanza en las dos direcciones:
 *  · por igualdad EXACTA se pierden pares obvios (`akita` ≠ `akita inu`);
 *  · por CONTENENCIA se ganan pares FALSOS — `affenpinscher → pinscher` son
 *    razas distintas, y `puggle → pug` es un cruce, no un Pug.
 * Por eso el mapa se revisó a mano, raza por raza, y lo dudoso se EXCLUYE en
 * vez de resolverse: un conjunto con etiquetas equivocadas mide peor que uno
 * chico, porque su error no se ve.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
const ORIGEN = process.env.FOTOS_DIR ?? join(process.env.HOME, 'Downloads', 'fotos_mascotas_muestra');
const di = (s) => console.log(s);
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** RECHAZADAS a mano: la contención las emparejaba y son OTRA raza. */
const RECHAZADAS = {
  affenpinscher: 'es otra raza, no un Pinscher',
  puggle: 'es un cruce Pug × Beagle, no un Pug',
  husky: 'dog.ceo no distingue Siberiano de Alaskan; nuestro catálogo dice Siberiano',
  'boston bulldog': 'el conjunto ya trae «boston terrier» aparte; cuál es cuál no se puede decidir desde acá',
};

/** ACEPTADAS a mano: variantes de tamaño, sinónimos ES↔EN y nombres cortos. */
const MAPA = {
  perro: {
    akita: 'akita-inu', beagle: 'beagle', 'bernese mountain': 'bernese', 'bichon frise': 'bichon-frise',
    'border collie': 'border-collie', 'boston terrier': 'boston-terrier', boxer: 'boxer', chihuahua: 'chihuahua',
    chow: 'chow-chow', 'cocker spaniel': 'cocker-spaniel', 'english cocker spaniel': 'cocker-spaniel',
    'collie rough': 'collie', dalmatian: 'dalmata', doberman: 'doberman', 'english bulldog': 'bulldog-ingles',
    'french bulldog': 'bulldog-frances', 'german shepherd': 'pastor-aleman', 'golden retriever': 'golden-retriever',
    'great dane': 'gran-danes', labrador: 'labrador-retriever', malinois: 'pastor-belga', maltese: 'maltes',
    'miniature pinscher': 'pinscher', pekinese: 'pekines', pomeranian: 'pomerania', pug: 'pug',
    'medium poodle': 'poodle', 'miniature poodle': 'poodle', 'standard poodle': 'poodle', 'toy poodle': 'poodle',
    rottweiler: 'rottweiler', samoyed: 'samoyedo', shiba: 'shiba-inu', 'shiba inu': 'shiba-inu',
    'siberian husky': 'husky-siberiano', stbernard: 'san-bernardo', weimaraner: 'weimaraner',
    'yorkshire terrier': 'yorkshire-terrier',
    /* 🔴 ESTAS SEIS SALIERON DE UNA CORRECCIÓN A MÍ MISMO. Las había RECHAZADO
       por no encontrarles equivalente — y el error fue del método: compare
       contra la lista de NOMBRES, que venía truncada, en vez de contra los
       SLUGS. El catálogo sí las tiene, y con cuatro erratas: `shnauzer` sin la
       c, `jack-rusell` con una l, `pitbul-terrier` con una l,
       `stanffordshire-bull-terrier` con una n de más. *Un censo contra la
       fuente equivocada da un cero perfectamente creíble.* */
    'miniature schnauzer': 'shnauzer', 'giant schnauzer': 'shnauzer',
    'american pit bull terrier': 'pitbul-terrier', pitbull: 'pitbul-terrier',
    'staffordshire bull terrier': 'stanffordshire-bull-terrier',
    'staffordshire bullterrier': 'stanffordshire-bull-terrier',
    dachshund: 'salchicha', shihtzu: 'shih-tzu', 'english springer': 'springer-spaniel',
    'russell terrier': 'jack-rusell',
  },
  gato: {
    abyssinian: 'abisinio', bengal: 'bengali', birman: 'birmano', 'british shorthair': 'british-shorthair',
    'maine coon': 'maine-coon', persian: 'persa', ragdoll: 'ragdoll', 'russian blue': 'azul-ruso',
    siamese: 'siames', sphynx: 'sphynx',
  },
};

const cat = JSON.parse(readFileSync(join(DIR, 'cat_razas_slugs.json'), 'utf8'));
const slugs = new Set(cat.map((r) => r.slug));
const nombre = Object.fromEntries(cat.map((r) => [r.slug, r.nombre]));

const filas = readFileSync(join(ORIGEN, 'manifiesto.csv'), 'utf8').trim().split('\n').slice(1)
  .map((l) => { const c = l.split(','); return { archivo: c[0], especie: c[1], raza: c[2], fuente: c[3] }; });

const porRaza = new Map();
const noMapean = new Set(), rechazadas = new Set(), sinSlug = new Set();
for (const f of filas) {
  const m = MAPA[f.especie]?.[norm(f.raza)];
  if (RECHAZADAS[norm(f.raza)]) { rechazadas.add(f.raza); continue; }
  if (!m) { noMapean.add(`${f.especie}:${f.raza}`); continue; }
  if (!slugs.has(m)) { sinSlug.add(`${f.raza} → ${m}`); continue; }
  const k = `${f.especie}|${m}`;
  if (!porRaza.has(k)) porRaza.set(k, []);
  porRaza.get(k).push(f);
}

const POR_RAZA = Number(process.argv.find((a) => a.startsWith('--por-raza='))?.slice(11) ?? 3);
const destino = join(DIR, 'imagenes-razas');
mkdirSync(destino, { recursive: true });
const casos = [];
for (const [k, fs] of [...porRaza].sort()) {
  const [especie, slug] = k.split('|');
  for (const f of fs.slice(0, POR_RAZA)) {
    const src = join(ORIGEN, f.archivo);
    if (!existsSync(src)) continue;
    const nom = f.archivo.replace(/\//g, '_');
    copyFileSync(src, join(destino, nom));
    casos.push({ caso: nom, ruta: join(destino, nom), especie, raza_slug: slug, raza_nombre: nombre[slug], raza_dataset: f.raza, fuente: f.fuente });
  }
}

const conjunto = {
  nombre: 'razas', pieza: 'raza', generado_el: new Date().toISOString(),
  fuente: `datasets públicos vía ${ORIGEN} (dog.ceo/Stanford, TheCatAPI, Oxford-IIIT Pet, Petfinder)`,
  licencia: 'uso académico / no comercial en la mayoría — sirven para EVALUAR, no para publicar ni entrenar',
  procedencia_verdad: 'ETIQUETA DEL DATASET (1759 de 1759 filas la traen). Es verdad de dataset, no de veterinario: dice qué dijo quien armó el corpus.',
  mapeo: 'MI JUICIO, revisado raza por raza. Lo dudoso se excluye, no se resuelve.',
  n_razas_conjunto: { perro: 174, gato: 12 },
  n_razas_catalogo: { perro: cat.filter((r) => r.especie === 'perro').length, gato: cat.filter((r) => r.especie === 'gato').length },
  n_razas_medibles: porRaza.size,
  razas_rechazadas_a_mano: Object.fromEntries(Object.entries(RECHAZADAS)),
  n_razas_sin_equivalente: noMapean.size,
  n_casos: casos.length, casos,
};
writeFileSync(join(DIR, 'razas.json'), JSON.stringify(conjunto, null, 2));

di(`conjunto: ${join(DIR, 'razas.json')}`);
di(`  ${porRaza.size} razas medibles · ${casos.length} fotos (${POR_RAZA} por raza)`);
di(`  catálogo: ${conjunto.n_razas_catalogo.perro} perro + ${conjunto.n_razas_catalogo.gato} gato · conjunto: 174 + 12`);
di(`  🔴 ${noMapean.size} razas del conjunto NO tienen equivalente en el catálogo`);
di(`  ⚠️ ${rechazadas.size} rechazadas a mano: ${[...rechazadas].join(', ')}`);
if (sinSlug.size) di(`  🔴 mapeadas a un slug que no existe: ${[...sinSlug].join(', ')}`);
