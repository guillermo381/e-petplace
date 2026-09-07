/* INVENTARIO DEL DESIGN SYSTEM (S113-B) — un INSTRUMENTO, no una foto.
   Vive acá y no en un doc para que el mapa se pueda VOLVER A CORRER: *un
   inventario escrito a mano envejece el día que alguien agrega una pieza, y
   nadie se entera.* Sólo lee: no toca una línea de producto. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const raiz = new URL('..', import.meta.url).pathname;
const arch = (d: string, ext = '.tsx'): string[] => {
  const out: string[] = [];
  const rec = (x: string) => {
    let e: string[] = [];
    try { e = readdirSync(x); } catch { return }
    for (const n of e) {
      const f = join(x, n);
      if (statSync(f).isDirectory()) rec(f);
      else if (f.endsWith(ext)) out.push(f);
    }
  };
  rec(join(raiz, d));
  return out;
};
const leer = (f: string) => { try { return readFileSync(f, 'utf8') } catch { return '' } };

/* ── ① LAS PIEZAS ──────────────────────────────────────────────────────── */
const COMP = join(raiz, 'packages/ui/src/components');
const piezas = readdirSync(COMP)
  .filter((f) => f.endsWith('.tsx') && !f.endsWith('.web.tsx'))
  .map((f) => f.replace('.tsx', ''))
  /* `capturaFoto` es infra (un método), no una pieza que se dibuje. */
  .filter((n) => n !== 'capturaFoto');

const consumidores = ['apps/cliente/src', 'apps/prestador/src'].flatMap((d) => arch(d));
const enUi = arch('packages/ui/src').filter((f) => !f.includes('/gallery/'));
const galeria = leer(join(raiz, 'packages/ui/src/gallery/TokenGallery.tsx'));

const uso = piezas.map((p) => {
  const re = new RegExp(`\\b${p}\\b`);
  const apps = consumidores.filter((f) => re.test(leer(f)));
  const ui = enUi.filter((f) => !f.endsWith(`${p}.tsx`) && re.test(leer(f))).length;
  return { pieza: p, apps: apps.length, ui, gal: re.test(galeria), donde: apps.map((f) => f.split('/src/')[1] ?? f) };
});

const sinConsumidor = uso.filter((u) => u.apps === 0 && u.ui === 0);
const soloGaleria = sinConsumidor.filter((u) => u.gal);

console.log('══ ① EL DESIGN SYSTEM ══');
console.log(`piezas dibujables: ${piezas.length}`);
console.log(`  con consumidor en apps:      ${uso.filter((u) => u.apps > 0).length}`);
console.log(`  sólo consumidas dentro de ui: ${uso.filter((u) => u.apps === 0 && u.ui > 0).length}`);
/* 🔴 **«SIN CONSUMIDOR» NO ES «MUERTA», y mezclarlas arruina el número.** Una
   pieza recién entregada espera a que su pantalla la monte; una de hace seis
   sesiones que nadie montó es otra cosa. *El corte es la EDAD, y se mide con
   git, no con la impresión de quién la escribió.* */
const edad = new Map<string, number>();
for (const u of sinConsumidor) {
  try {
    const iso = execSync(`git log --diff-filter=A --format=%at -1 -- packages/ui/src/components/${u.pieza}.tsx`, { cwd: raiz }).toString().trim();
    edad.set(u.pieza, iso ? Math.floor((Date.now() / 1000 - Number(iso)) / 86400) : -1);
  } catch { edad.set(u.pieza, -1) }
}
const recientes = sinConsumidor.filter((u) => (edad.get(u.pieza) ?? 999) <= 2);
const viejas = sinConsumidor.filter((u) => (edad.get(u.pieza) ?? 999) > 2);
console.log(`  sin consumidor, ENTREGADAS HOY (esperan pantalla): ${recientes.length}`);
for (const u of recientes) console.log(`     · ${u.pieza}`);
console.log(`  🔴 sin consumidor y con EDAD (nadie las montó):     ${viejas.length}`);
for (const u of viejas) console.log(`     · ${u.pieza.padEnd(24)} ${edad.get(u.pieza)} días${u.gal ? '' : '  ⚠️ tampoco en galería'}`);

console.log('\nlas 10 más montadas (archivos de apps que la nombran):');
for (const u of [...uso].sort((a, b) => b.apps - a.apps).slice(0, 10)) {
  console.log(`  ${String(u.apps).padStart(3)}  ${u.pieza}`);
}

/* ── LOS TRES LENGUAJES, por marcador medible ───────────────────────────── */
/* 🔴 **EL MARCADOR MIDE LA PIEZA, NO UNA PROP.** Mi primera versión usaba
   `variante="apoyo"` para el tablero y dio **119 de 195 pantallas** — que no
   significa nada: `apoyo` es la voz secundaria de toda la casa. *Un marcador
   que casi todo cumple no separa lenguajes: cuenta archivos.* Hoy cada uno se
   ancla a las piezas que SÓLO existen en ese lenguaje. */
const MARCA = {
  'tablero (2.2+)': /TarjetaMetrica|TarjetaHoy|HuellaDelVinculo|FilaAcciones|HeroMascota/,
  'capas (S45–S60)': /capaBg|theme\.capa\[/,
  'marca/gradiente': /HeroMarca\b|techoVivo/,
} as const;
console.log('\n── los tres lenguajes: en cuántas PANTALLAS aparece cada marcador ──');
const pantallas = consumidores.filter((f) => f.includes('/app/'));
for (const [n, re] of Object.entries(MARCA)) {
  const hits = pantallas.filter((f) => re.test(leer(f)));
  console.log(`  ${n.padEnd(18)} ${String(hits.length).padStart(3)} de ${pantallas.length} pantallas`);
}
const mezcla = pantallas.filter((f) => Object.values(MARCA).filter((re) => re.test(leer(f))).length >= 2);
console.log(`  🔴 pantallas con DOS O MÁS lenguajes a la vez: ${mezcla.length}`);
for (const f of mezcla.slice(0, 8)) console.log(`     · ${f.split('/app/')[1]}`);

/* ── ② LOS TOKENS ──────────────────────────────────────────────────────── */
console.log('\n══ ② LOS TOKENS ══');
const HOGAR_TOKENS = /packages\/ui\/src\/(tokens|themes)\//;
const todos = [...arch('packages/ui/src'), ...arch('packages/ui/src', '.ts'), ...consumidores];
let hexFuera = 0; const dondeHex = new Map<string, number>();
let fsCrudo = 0; const dondeFs = new Map<string, number>();
let radioCrudo = 0;
for (const f of todos) {
  if (HOGAR_TOKENS.test(f) || f.includes('/gallery/')) continue;
  const s = leer(f);
  const hex = (s.match(/#[0-9a-fA-F]{6}\b/g) ?? []).length;
  if (hex) { hexFuera += hex; dondeHex.set(f.split('/src/')[1] ?? f, hex) }
  const fsn = (s.match(/fontSize:\s*\d+/g) ?? []).length;
  if (fsn) { fsCrudo += fsn; dondeFs.set(f.split('/src/')[1] ?? f, fsn) }
  radioCrudo += (s.match(/borderRadius:\s*\d+/g) ?? []).length;
}
console.log(`hex a mano FUERA de tokens/themes: ${hexFuera}  (en ${dondeHex.size} archivos)`);
for (const [f, n] of [...dondeHex].sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`  ${String(n).padStart(3)}  ${f}`);
console.log(`fontSize con número crudo:         ${fsCrudo}  (en ${dondeFs.size} archivos)`);
for (const [f, n] of [...dondeFs].sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`  ${String(n).padStart(3)}  ${f}`);
console.log(`borderRadius con número crudo:     ${radioCrudo}`);

/* Los tamaños con nombre propio y sus consumidores. */
console.log('\n── los tamaños que nacieron SUELTOS ──');
for (const t of ['control', 'metrica']) {
  const n = todos.filter((f) => !HOGAR_TOKENS.test(f) && new RegExp(`size\\.${t}\\b`).test(leer(f))).length;
  console.log(`  size.${t.padEnd(8)} ${n} consumidor(es)`);
}
/* Y la escala de prosa, para comparar. */
for (const t of ['xs', 'sm', 'base', 'md', 'lg']) {
  const n = todos.filter((f) => !HOGAR_TOKENS.test(f) && new RegExp(`size\\.${t}\\b`).test(leer(f))).length;
  console.log(`  size.${t.padEnd(8)} ${n} consumidor(es)`);
}

console.log('\n── las excepciones firmadas ──');
for (const t of ['motion.marca', 'motion.coach', 'sobreVideo', 'accent.control', 'accent.cta']) {
  const n = todos.filter((f) => new RegExp(t.replace('.', '\\.')).test(leer(f))).length;
  console.log(`  ${t.padEnd(16)} ${n} consumidor(es)`);
}
