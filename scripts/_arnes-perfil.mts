/* Arnés del PERFIL (S113-B · lote 1.1). La regla que ordena las cuatro piezas:
   **lo que el dato no sabe, no se dibuja.** */
import { hayCobertura, haySeguridad, ordenarSeguridad, tendenciaPeso } from '../packages/ui/src/components/perfil-seguridad.ts';
import { readFileSync } from 'node:fs';
let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
const sin = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const src = (f: string) => sin(readFileSync(new URL(`../packages/ui/src/components/${f}`, import.meta.url), 'utf8'));
const FRANJA = src('FranjaSeguridad.tsx'), CELDAS = src('CeldasHoy.tsx');
const MED = src('PiezaMedicacionActiva.tsx'), FIL = src('FiltrosLineaDeVida.tsx');
const it = (id: string, clase: any) => ({ id, clase, texto: 'x', procedencia: 'familia' as const, vozProcedencia: 'v' });

console.log('\n── ① ROJO · SIN NADA, LA FRANJA NO EXISTE ──');
t('🔴 lista vacía ⇒ no se dibuja', haySeguridad([]), false);
t('CONTROL POSITIVO · con uno, sí', haySeguridad([it('a', 'alergia')]), true);
t('la pieza sale por null', /if \(!haySeguridad\(items\)\) return null/.test(FRANJA), true);
t('🔴 y ese guard va DESPUÉS de los hooks',
  (() => { const c = FRANJA.slice(FRANJA.indexOf('export function FranjaSeguridad'));
    return c.indexOf('useState') < c.indexOf('!haySeguridad'); })(), true);

console.log('\n── ② EL ORDEN: lo que puede hacer daño primero ──');
t('la alergia manda sobre todo',
  ordenarSeguridad([it('r', 'restriccion'), it('a', 'alergia')]).map((i) => i.clase), ['alergia', 'restriccion']);
t('y la medicación sobre la condición',
  ordenarSeguridad([it('c', 'condicion'), it('m', 'medicacion')]).map((i) => i.clase), ['medicacion', 'condicion']);
t('🔴 no muta el arreglo que recibe',
  (() => { const o = [it('r', 'restriccion'), it('a', 'alergia')]; ordenarSeguridad(o); return o[0].clase; })(), 'restriccion');
t('la franja dice el nombre, no la categoría',
  /tiene alergias|Tiene alergias/.test(FRANJA), false);
t('y la procedencia se ve al abrir', /vozProcedencia/.test(FRANJA), true);

console.log('\n── ③ ROJO · LA TENDENCIA NO PARPADEA ──');
t('sube', tendenciaPeso(12.5, 12.0), 'sube');
t('baja', tendenciaPeso(11.5, 12.0), 'baja');
t('🔴 40 g de diferencia ⇒ IGUAL (una balanza doméstica varía)', tendenciaPeso(12.04, 12.0), 'igual');
t('🔴 sin anterior ⇒ null, que NO es «igual»', tendenciaPeso(12.0, null), null);
t('CONTROL POSITIVO · 60 g sí se nota', tendenciaPeso(12.06, 12.0), 'sube');
t('las flechas son signos, no adjetivos', /subió|bajó|Subió|Bajó/.test(CELDAS), false);

console.log('\n── ④ ROJO · UNA CELDA SIN DATO DICE QUE NO HAY ──');
t('sin ninguna cobertura ⇒ la celda lo dice',
  hayCobertura([{ plaga: 'pulgas', alDia: null }, { plaga: 'internos', alDia: null }]), false);
t('CONTROL POSITIVO · con una sola, ya hay chips',
  hayCobertura([{ plaga: 'pulgas', alDia: false }, { plaga: 'internos', alDia: null }]), true);
t('🔴 una plaga sin registro NO dibuja chip', /c\.alDia === null \? null :/.test(CELDAS), true);
t('las cuatro celdas caen a `vozSinDato`', (CELDAS.match(/vozSinDato/g) ?? []).length >= 4, true);
t('🔴 y sin dato NO se dibuja el contexto (sería de un dato que no está)',
  (CELDAS.match(/=== null \? undefined :/g) ?? []).length >= 3, true);
t('la celda no trae acción: la pone la pantalla', /onPress|Pressable/.test(CELDAS), false);

console.log('\n── ⑤ MEDICACIÓN Y FILTROS ──');
t('lo que la receta no decía, no se dibuja', /f\.dosis != null \?/.test(MED), true);
t('sin filas, no hay pieza', /filas\.length === 0\) return null/.test(MED), true);
t('«activa» lo decide la pantalla: la pieza no mira el reloj', /new Date\(\)/.test(MED), false);
t('🔴 los filtros NO tienen scroll horizontal', /horizontal/.test(FIL), false);
t('…van con `flexWrap`: todo lo que existe está a la vista', /flexWrap/.test(FIL), true);
t('multi-selección: alterna, no reemplaza', /onAlternar/.test(FIL), true);
t('el blanco del chip sale de `text.inverse`, no de `sobreVideo`',
  /theme\.text\.inverse/.test(FIL) && /sobreVideo/.test(FIL) === false, true);

console.log('\n── ⑥ NINGUNA COMPONE VOZ (Ley 3) ──');
for (const [n, s] of [['franja', FRANJA], ['celdas', CELDAS], ['medicación', MED], ['filtros', FIL]] as const)
  t(`\`${n}\` no arma frases`, /`\$\{[a-z]+\} (de|en|para|hasta|hace)/i.test(s), false);

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
