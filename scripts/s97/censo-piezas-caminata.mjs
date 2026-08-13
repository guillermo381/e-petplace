#!/usr/bin/env node
/**
 * CENSO §11 (S97-B) — qué primitivas de `packages/ui` monta cada una de las
 * CUATRO pantallas del prestador que entran a la caminata del founder.
 *
 * PARA QUÉ: cuando el founder diga «esto se ve mal», la tabla contesta si la
 * cura es de la PIEZA (B) o del USO de la pieza (C/D). Sin ella, cada hallazgo
 * abre una discusión de territorio.
 *
 * CÓMO MIDE, declarado — porque un censo que no dice su método es una lista:
 *  · Arranca en el archivo de la RUTA y sigue los imports `@/components/*` de
 *    forma TRANSITIVA. Una pieza montada adentro de un componente local se ve
 *    en la pantalla igual que una montada en la ruta — el founder no sabe en
 *    qué archivo vive.
 *  · Cuenta MONTAJES JSX (`<Pieza`), no imports. Un import sin montar no se ve.
 *  · Distingue MONTAJE DIRECTO (en el archivo de la ruta) de INDIRECTO (en un
 *    componente local), porque eso es justamente lo que decide el dueño del uso.
 *  · Los hooks (`useX`) y los tokens NO son montaje y van aparte.
 *
 * LÍMITES, declarados (L-192: un censo que no dice lo que NO ve, miente):
 *  · Es ESTÁTICO. Una pieza detrás de un `if` cuenta igual — el censo contesta
 *    QUIÉN LA MONTA, jamás si está en pantalla en un instante dado.
 *  · NO abre las piezas de `packages/ui`: si `Hoja` monta un `Boton` adentro,
 *    ese `Boton` es de B y no aparece acá. Es correcto: nadie lo eligió.
 *  · Sigue `@/components/*`. Un componente que viva en otra carpeta del app
 *    no se recorre — se reporta al pie como no visitado.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const APP = `${RAIZ}/apps/prestador/src`;

const PANTALLAS = [
  ['Cuenta › Tu perfil', `${APP}/app/(tabs)/cuenta/perfil.tsx`],
  ['Cuenta comercial', `${APP}/app/cuenta-comercial/index.tsx`],
  ['Veterinaria › cita', `${APP}/app/veterinaria/cita/[citaId].tsx`],
  ['Veterinaria › consulta', `${APP}/app/veterinaria/consulta/[citaId].tsx`],
];

// ── El vocabulario de `packages/ui`, leído del objeto y no de una lista a mano.
const indice = readFileSync(`${RAIZ}/packages/ui/src/index.ts`, 'utf8');
const EXPORTS_UI = new Set();
for (const m of indice.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)) EXPORTS_UI.add(m[1]);

const esComponente = (n) => /^[A-Z]/.test(n);
const esHook = (n) => /^use[A-Z]/.test(n);

/** Comentarios fuera (L-170: un censo lee los comentarios como código). */
const sinComentarios = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, (b) => b.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, '');

function importados(src, modulo) {
  const re = new RegExp(`import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*'${modulo}'`, 'g');
  const out = [];
  for (const m of src.matchAll(re)) {
    for (const parte of m[1].split(',')) {
      // ⚠️ `import { type X }` es un TIPO, no una pieza. Sin este filtro el
      // censo avisaba «importado y no montado» sobre `AvatarMascotaEspecie` e
      // `InsigniaEstado`, que son uniones de tipo y no se montan nunca: un
      // aviso falso manda a alguien a borrar un import que el tsc necesita.
      if (/\btype\s+[A-Za-z_]/.test(parte)) continue;
      const nombre = parte.split(/\s+as\s+/)[0].trim();
      if (nombre) out.push(nombre);
    }
  }
  return out;
}

function importsLocales(src, archivo) {
  const out = [];
  for (const m of src.matchAll(/from\s*'@\/components\/([A-Za-z0-9_\-/]+)'/g)) {
    for (const ext of ['.tsx', '.ts', '/index.tsx']) {
      const p = `${APP}/components/${m[1]}${ext}`;
      if (existsSync(p)) { out.push(p); break; }
    }
  }
  for (const m of src.matchAll(/from\s*'(\.\.?\/[A-Za-z0-9_\-/.]+)'/g)) {
    for (const ext of ['.tsx', '.ts']) {
      const p = resolve(dirname(archivo), m[1] + ext);
      if (existsSync(p) && p.startsWith(APP)) { out.push(p); break; }
    }
  }
  return out;
}

/** Montajes JSX de los nombres de ui importados EN ESE archivo. */
function montajes(archivo) {
  const crudo = readFileSync(archivo, 'utf8');
  const limpio = sinComentarios(crudo);
  const deUi = new Set(importados(limpio, '@epetplace/ui').filter((n) => EXPORTS_UI.has(n)));
  const encontrados = new Map(); // pieza -> [líneas]
  const lineas = limpio.split('\n');
  lineas.forEach((l, i) => {
    // ⚠️ EL TERMINADOR VA COMO LOOKAHEAD Y ADMITE FIN DE LÍNEA. La v1 exigía
    // `[\s/>]` consumido y se comía en silencio la forma MÁS común de la casa
    // —`<Pieza` con las props en las líneas de abajo—: reportó `Campo` como
    // «importado y no montado» en una ruta que lo monta nueve veces. Un censo
    // que subcuenta sin avisar es peor que no tenerlo (L-192).
    for (const m of l.matchAll(/<([A-Z][A-Za-z0-9_]*)(\.[A-Z][A-Za-z0-9_]*)?(?=[\s/>]|$)/g)) {
      const base = m[1];
      if (!deUi.has(base)) continue;
      const nombre = base + (m[2] ?? '');
      if (!encontrados.has(nombre)) encontrados.set(nombre, []);
      encontrados.get(nombre).push(i + 1);
    }
  });
  const hooks = [...deUi].filter(esHook);
  const tokens = [...deUi].filter((n) => !esComponente(n) && !esHook(n));
  return { montajes: encontrados, hooks, tokens, importadosSinMontar: [...deUi].filter((n) => esComponente(n) && !encontrados.has(n)) };
}

const rel = (p) => p.replace(`${RAIZ}/`, '');
const porPantalla = new Map(); // titulo -> Set(piezas)
const compartidos = new Map(); // archivo local -> Set(titulos)

for (const [titulo, entrada] of PANTALLAS) {
  // Alcance transitivo por `@/components/*`.
  const vistos = new Set();
  const cola = [entrada];
  while (cola.length) {
    const f = cola.shift();
    if (vistos.has(f)) continue;
    vistos.add(f);
    const src = sinComentarios(readFileSync(f, 'utf8'));
    for (const h of importsLocales(src, f)) if (!vistos.has(h)) cola.push(h);
  }

  // pieza -> { directo: [líneas], indirecto: [{archivo, líneas}] }
  const tabla = new Map();
  const hooks = new Set(); const tokens = new Set(); const sinMontar = new Set();
  for (const f of vistos) {
    const r = montajes(f);
    r.hooks.forEach((h) => hooks.add(h));
    r.tokens.forEach((t) => tokens.add(t));
    if (f === entrada) r.importadosSinMontar.forEach((n) => sinMontar.add(n));
    for (const [pieza, ls] of r.montajes) {
      if (!tabla.has(pieza)) tabla.set(pieza, { directo: [], indirecto: [] });
      if (f === entrada) tabla.get(pieza).directo.push(...ls);
      else tabla.get(pieza).indirecto.push({ archivo: rel(f), lineas: ls });
    }
  }

  console.log(`\n${'═'.repeat(78)}\n${titulo}\n  ruta: ${rel(entrada)}\n  alcance: ${vistos.size} archivo(s) (la ruta + ${vistos.size - 1} componente(s) local(es))\n${'═'.repeat(78)}`);
  const piezas = [...tabla.keys()].sort();
  console.log(`  PIEZAS DE packages/ui MONTADAS: ${piezas.length}\n`);
  for (const p of piezas) {
    const { directo, indirecto } = tabla.get(p);
    const partes = [];
    if (directo.length) partes.push(`ruta:${directo.join(',')}`);
    for (const i of indirecto) partes.push(`${i.archivo.replace('apps/prestador/src/components/', '')}:${i.lineas.join(',')}`);
    const dueno = directo.length && indirecto.length ? 'DIRECTO+INDIRECTO' : directo.length ? 'DIRECTO' : 'INDIRECTO';
    console.log(`  · ${p.padEnd(22)} ${String(directo.length + indirecto.reduce((a, i) => a + i.lineas.length, 0)).padStart(2)}×  [${dueno}]  ${partes.join(' · ')}`);
  }
  if (sinMontar.size) console.log(`\n  ⚠️ importados por la ruta y NO montados en ella: ${[...sinMontar].join(', ')}`);
  console.log(`\n  hooks de ui (no son montaje): ${[...hooks].sort().join(', ') || '—'}`);
  console.log(`  tokens/infra de ui:           ${[...tokens].sort().join(', ') || '—'}`);

  porPantalla.set(titulo, new Set(piezas));
  for (const f of vistos) if (f !== entrada) {
    if (!compartidos.has(rel(f))) compartidos.set(rel(f), new Set());
    compartidos.get(rel(f)).add(titulo);
  }
}

// ── EL CRUCE: lo que de verdad contesta «¿de quién es la cura?» ──────────────
const N = PANTALLAS.length;
const cuenta = new Map();
for (const set of porPantalla.values()) for (const p of set) cuenta.set(p, (cuenta.get(p) ?? 0) + 1);

console.log(`\n${'═'.repeat(78)}\nEL CRUCE — cuántas de las cuatro toca cada pieza\n${'═'.repeat(78)}`);
console.log(`\n  EN LAS CUATRO (una cura de pieza pega en toda la caminata):`);
for (const [p, n] of [...cuenta].sort()) if (n === N) console.log(`    · ${p}`);
console.log(`\n  EN DOS O TRES:`);
for (const [p, n] of [...cuenta].sort()) if (n > 1 && n < N)
  console.log(`    · ${p.padEnd(20)} ${n}/4 — ${[...porPantalla].filter(([, s]) => s.has(p)).map(([t]) => t).join(' · ')}`);
console.log(`\n  EN UNA SOLA (un hallazgo acá es de esa pantalla, no del sistema):`);
for (const [p, n] of [...cuenta].sort()) if (n === 1)
  console.log(`    · ${p.padEnd(20)} — ${[...porPantalla].find(([, s]) => s.has(p))[0]}`);

console.log(`\n  COMPONENTES LOCALES COMPARTIDOS (territorio C/D, pero un hallazgo acá se ve en más de una pantalla):`);
for (const [f, ts] of [...compartidos].sort()) if (ts.size > 1)
  console.log(`    · ${f.replace('apps/prestador/src/components/', '')} — ${[...ts].join(' · ')}`);

console.log(`\n  TOTAL de piezas distintas de packages/ui en la caminata: ${cuenta.size}`);
