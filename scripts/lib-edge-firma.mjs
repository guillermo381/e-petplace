/**
 * LA FIRMA DE UNA EDGE — su `index.ts` más los `_shared` que importa,
 * transitivamente, en orden estable.
 *
 * 🔴 EL CIERRE TRANSITIVO NO ES UN LUJO: `fiscal-emitir` no cambió una línea
 *    cuando cambió `_shared/facturacion/canonico.ts`, y la que corría igual
 *    dejó de ser la del repo. Una firma que mira sólo el `index.ts` da verde
 *    por no mirar.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';

export function depsDirectas(archivo) {
  let txt;
  try { txt = readFileSync(archivo, 'utf8'); } catch { return []; }
  const out = [];
  for (const m of txt.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    const p = resolve(dirname(archivo), m[1]);
    if (existsSync(p)) out.push(p);
  }
  return out;
}

export function cierreDeDeps(entrada) {
  const vistos = new Set(); const cola = [entrada];
  while (cola.length) {
    const f = cola.pop();
    if (vistos.has(f)) continue;
    vistos.add(f);
    for (const d of depsDirectas(f)) if (!vistos.has(d)) cola.push(d);
  }
  return [...vistos].sort();
}

/** sha256 sobre «ruta relativa + contenido» de cada archivo, en orden. */
export function firmaDeEdge(raiz, slug) {
  const entrada = join(raiz, 'supabase', 'functions', slug, 'index.ts');
  if (!existsSync(entrada)) return null;
  const archivos = cierreDeDeps(entrada);
  const h = createHash('sha256');
  for (const a of archivos) {
    h.update(relative(raiz, a));
    h.update('\0');
    h.update(readFileSync(a));
    h.update('\0');
  }
  return { firma: h.digest('hex'), archivos: archivos.length, rutas: archivos.map((a) => relative(raiz, a)) };
}
