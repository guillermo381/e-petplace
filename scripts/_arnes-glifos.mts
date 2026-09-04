/* Arnés de FORMA de los glifos nuevos (S113-B · §6b pasos 1 y 3).
   Mide lo que §6b pide en NÚMEROS y no en adjetivos: trazo, densidad, masa
   de tinta y legibilidad a 21 px. **La vara es `vacuna`**, por orden de la
   mesa: los tres atajos del Coach se calibran contra él.

   🔴 **Por qué existe un medidor y no una tabla escrita a mano:** «mismo peso
   visual» es un adjetivo hasta que alguien lo cuenta. El primer intento midió
   los bounding box con un regex de números y dio `x∈[-4.8,13]` para `vacuna`
   —comandos RELATIVOS leídos como absolutos—: *un instrumento que devuelve
   coordenadas negativas sobre una grilla de 0 a 24 está midiendo otra cosa.*
   Éste recorre el path de verdad. */
import { readFileSync } from 'node:fs';

/** Largo de trazo de un path. Rectas exactas; arcos por su cuerda circular y
 *  curvas por la cuerda con holgura — alcanza para comparar MASA entre
 *  glifos de la misma casa, que es todo lo que se le pide. */
export function largoPath(d: string): number {
  const tok = d.match(/[MmLlHhVvCcSsQqAaZz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, total = 0, cmd = '';
  const n = () => parseFloat(tok[i++]);
  const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'M') { const px = n(), py = n(); x = rel ? x + px : px; y = rel ? y + py : py; sx = x; sy = y; cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { const px = n(), py = n(); const nx = rel ? x + px : px, ny = rel ? y + py : py; total += dist(x, y, nx, ny); x = nx; y = ny; }
    else if (C === 'H') { const px = n(); const nx = rel ? x + px : px; total += Math.abs(nx - x); x = nx; }
    else if (C === 'V') { const py = n(); const ny = rel ? y + py : py; total += Math.abs(ny - y); y = ny; }
    else if (C === 'C' || C === 'S' || C === 'Q') {
      const k = C === 'C' ? 6 : 4; const p: number[] = []; for (let j = 0; j < k; j++) p.push(n());
      const ex = rel ? x + p[k - 2] : p[k - 2], ey = rel ? y + p[k - 1] : p[k - 1];
      total += dist(x, y, ex, ey) * 1.12; x = ex; y = ey;
    } else if (C === 'A') {
      const rx = n(), ry = n(); n(); n(); n(); const px = n(), py = n();
      const ex = rel ? x + px : px, ey = rel ? y + py : py;
      const c = dist(x, y, ex, ey), r = (rx + ry) / 2;
      total += r > 0 ? 2 * r * Math.asin(Math.min(1, c / (2 * r))) : c; x = ex; y = ey;
    } else if (C === 'Z') { total += dist(x, y, sx, sy); x = sx; y = sy; }
    else i++;
  }
  return total;
}

const SRC = readFileSync(new URL('../packages/ui/src/components/Icono.tsx', import.meta.url), 'utf8');
const TRAZO = 1.9, GRILLA = 24, GATE = 21;

function glifo(nombre: string) {
  const m = SRC.match(new RegExp('^  ' + nombre + ': \\(\\{[^\\n]*\\n([\\s\\S]*?)\\n  \\),', 'm'));
  if (!m) return null;
  const cuerpo = m[1];
  const paths = [...cuerpo.matchAll(/d="([^"]+)"/g)].map((x) => x[1]);
  const circulos = [...cuerpo.matchAll(/<Circle[^/]*r=\{([\d.]+)\}/g)].map((x) => +x[1]);
  const largo = paths.reduce((a, d) => a + largoPath(d), 0) + circulos.reduce((a, r) => a + 2 * Math.PI * r, 0);
  return {
    largo,
    /* 🔴 **SUBPATHS, NO NODOS JSX.** Contar `<Path>` medía el ARCHIVO, no el
       dibujo: dos trazos metidos en un mismo `d` bajaban el número sin
       quitar una línea de la pantalla ⇒ **el conteo se podía «arreglar»
       uniendo strings.** Un instrumento que se puede satisfacer sin tocar
       el dibujo no está midiendo el dibujo. Cada `M` abre un trazo. */
    trazos:
      [...cuerpo.matchAll(/d="([^"]+)"/g)].reduce((a, m) => a + (m[1].match(/[Mm]/g) ?? []).length, 0) +
      (cuerpo.match(/<Circle/g) ?? []).length,
    huella: /<Huella/.test(cuerpo),
    /** El aire que queda DENTRO del círculo más chico, a 21 px. Ley 9. */
    interiorMin: circulos.length ? Math.min(...circulos.map((r) => (2 * r - TRAZO) * (GATE / GRILLA))) : null,
  };
}

let ok = 0, mal = 0;
const t = (n: string, cond: boolean, detalle = '') => {
  if (cond) { ok++; console.log(`  ✓ ${n}${detalle}`); } else { mal++; console.log(`  ✗ ${n}${detalle}`); }
};

const VARA = glifo('vacuna')!;
const BANDA = 0.15;
console.log(`\n── LA VARA · \`vacuna\` = ${VARA.largo.toFixed(1)} de trazo · banda ±${BANDA * 100}% = ${(VARA.largo * (1 - BANDA)).toFixed(1)}–${(VARA.largo * (1 + BANDA)).toFixed(1)} ──`);

const NUEVOS = ['peso', 'antiparasitario', 'foto'] as const;
console.log('\n── ① EXISTEN Y ESTÁN DIBUJADOS ──');
for (const g of NUEVOS) t(`\`${g}\` tiene dibujante`, glifo(g) !== null);

console.log('\n── ② DENSIDAD (§6b: 2–4 trazos; `vacuna` llega a 5) ──');
for (const g of NUEVOS) { const r = glifo(g)!; t(`\`${g}\` ≤ ${VARA.trazos} trazos`, r.trazos <= VARA.trazos, ` · ${r.trazos}`); }

console.log('\n── ③ MASA DE TINTA contra la vara ──');
for (const g of NUEVOS) {
  const r = glifo(g)!;
  const d = ((r.largo / VARA.largo - 1) * 100);
  const dentro = Math.abs(r.largo / VARA.largo - 1) <= BANDA;
  t(`\`${g}\` en banda`, dentro, ` · ${r.largo.toFixed(1)} (${d >= 0 ? '+' : ''}${d.toFixed(0)} %)`);
}

console.log('\n── ④ LEY 9 · lo redondo sobrevive a 21 px (piso: 2,5 px de interior) ──');
for (const g of NUEVOS) {
  const r = glifo(g)!;
  if (r.interiorMin === null) { console.log(`  – \`${g}\` no tiene forma redonda que medir`); continue; }
  t(`\`${g}\` deja aire adentro`, r.interiorMin >= 2.5, ` · ${r.interiorMin.toFixed(2)} px`);
}

console.log('\n── ⑤ SON GLIFOS DE CONTROL ⇒ SIN HUELLA (N27 · §6b paso 6) ──');
for (const g of NUEVOS) t(`\`${g}\` no lleva huella`, glifo(g)!.huella === false);
/* CONTROL POSITIVO: si el medidor no viera las huellas, ⑤ pasaría siempre. */
t('CONTROL POSITIVO · el medidor SÍ ve la huella de `vacuna`', VARA.huella === true);

console.log('\n── ⑥ NO SE PISAN CON UNA METÁFORA OCUPADA (paso 2) ──');
/* `seguros` ya es un escudo: la separación es de TAMAÑO y se declara. */
const seg = glifo('seguros')!;
t('`antiparasitario` es visiblemente más liviano que `seguros`',
  glifo('antiparasitario')!.largo < seg.largo * 0.95,
  ` · ${glifo('antiparasitario')!.largo.toFixed(1)} vs ${seg.largo.toFixed(1)}`);
t('y por eso su colisión va DECLARADA en el dibujante', /seguros. YA ES UN ESCUDO/.test(SRC));
t('la gota declara su distinción con el pin (orientación)', /apunta hacia ABAJO/.test(SRC));


/* ═══ LA HUELLA DENTRO DE UN CONTROL (S113-B · orden de la mesa) ════════════
   *«En la huella los cuatro dedos son actos: `vacuna` adentro de un dedo se
   dibuja sin huella, sin tocar cómo se dibuja en el resto de la app.»*

   🔴 **Se mide la FUNCIÓN, no el render.** La decisión salió de `Icono` a
   `icono-huella.ts` justo para esto: sin extraerla habría que montar React
   para saber si una huella se pinta, y «lo miré y no estaba» no es una
   medición. */
const { resolverHuella } = await import('../packages/ui/src/components/icono-huella.ts');
const base = { colorHuella: '#MAGENTA', colorTinta: '#TINTA' };

console.log('\n── ⑦ NO-REGRESIÓN · la Ley 6 hace lo mismo que antes ──');
t('presente (fuera de una tab) ⇒ su color',
  resolverHuella({ ...base, esEstructura: false }) === '#MAGENTA');
t('tab de MARCA en reposo ⇒ no se pinta',
  resolverHuella({ ...base, esEstructura: false, activa: false }) === 'none');
t('tab de MARCA activa ⇒ su color',
  resolverHuella({ ...base, esEstructura: false, activa: true }) === '#MAGENTA');
t('tab de ESTRUCTURA en reposo ⇒ recolorea, jamás desaparece',
  resolverHuella({ ...base, esEstructura: true, activa: false }) === '#TINTA');
t('tab de ESTRUCTURA activa ⇒ su color',
  resolverHuella({ ...base, esEstructura: true, activa: true }) === '#MAGENTA');

console.log('\n── ⑧ EL MONTAJE EN UN CONTROL APAGA LA HUELLA ──');
t('🔴 dentro de un control ⇒ NO se pinta',
  resolverHuella({ ...base, esEstructura: false, montaje: 'control' }) === 'none');
t('CONTROL NEGATIVO · el MISMO glifo sin montaje ⇒ SÍ se pinta',
  resolverHuella({ ...base, esEstructura: false }) === '#MAGENTA');
t('y en una tab activa, fuera de un control, sigue pintando',
  resolverHuella({ ...base, esEstructura: false, activa: true }) === '#MAGENTA');

console.log('\n── ⑨ EL BORDE: la huella que ES el dibujo GANA sobre el montaje ──');
t('🔴 `esEstructura` dentro de un control ⇒ NO se apaga (dejaría un hueco)',
  resolverHuella({ ...base, esEstructura: true, montaje: 'control' }) !== 'none');
/* Y que ese borde alcance a los tres glifos reales, no a un booleano suelto. */
for (const g of ['negocio', 'datos', 'ia'])
  t(`\`${g}\` está declarado como estructura en el registry`,
    new RegExp("HUELLA_ES_ESTRUCTURA[\\s\\S]{0,200}'" + g + "'").test(SRC));

console.log('\n── ⑩ EL DEDO LO PASA SIEMPRE, Y NADIE MÁS PUEDE ELEGIRLO ──');
const PIEZA = readFileSync(new URL('../packages/ui/src/components/PresenciaCoach.tsx', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');
t('el dedo monta su glifo con `montaje="control"`', /montaje="control"/.test(PIEZA));
t('🔴 y NO lo expone como prop de la pieza', /montaje\??:/.test(PIEZA) === false);

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
