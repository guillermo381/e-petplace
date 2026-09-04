/**
 * verify:linea-jornada — LA LÍNEA DEL TECHO DEL HOY, en todos sus estados.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 EL ROJO QUE LO PARIÓ (S113-C, medido antes de curar)
 * ═══════════════════════════════════════════════════════════════════════════
 * El founder leyó en el header **«Hoy libre · {{n}} esta semana»** — la llave
 * CRUDA en pantalla. Causa: los `t()` pasaban `{ count }` y las keys dicen
 * `{{n}}`; i18next 25 trae `skipOnVariables: true` por default, así que una
 * variable que no llega **no falla ni se vacía: deja la llave literal**.
 * Eran SEIS brazos de la MISMA línea, en es y en en.
 *
 * ⚠️ Por qué ningún gate lo veía: no hay error, no hay warning que rompa, el
 * typecheck está verde (`{ count: number }` es un objeto válido) y la línea
 * ni siquiera se ve del todo rota — `datoQuedan` interpola DOS variables y
 * **una sí y la otra no**: «Te quedan {{n}} · terminas 16:30».
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ MIDE, Y POR QUÉ SIRVE
 * ═══════════════════════════════════════════════════════════════════════════
 * Llama a **`textoDeLaForma`, la misma función que corre en pantalla**, con
 * el `t` de una instancia i18next real inicializada igual que
 * `packages/i18n/src/instancia.ts` y con los diccionarios reales.
 * *No reimplementa la tabla: un arnés que reescribe la fórmula mide su eco.*
 *
 * `--control` corre el CONTROL de la premisa: la llamada vieja (`{ count }`)
 * DEBE seguir dejando la llave cruda. Si algún día no la deja, la premisa de
 * este gate cambió y hay que releerlo — un gate que no puede producir su rojo
 * no está midiendo (L-459).
 *
 * Correr:  node_modules/.bin/tsx apps/prestador/scripts/verify-linea-jornada.mts [--control]
 */

import i18next from '../../../node_modules/i18next/dist/esm/i18next.js';

import { prestadorEn } from '../src/i18n/en';
import { prestadorEs } from '../src/i18n/es';
import { textoDeLaForma, type FormaDelDia } from '../src/lib/texto-jornada';

const inst = (i18next as any).createInstance();
await inst.init({
  lng: 'es',
  fallbackLng: 'es',
  resources: { es: { prestador: prestadorEs }, en: { prestador: prestadorEn } },
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
});
const t = ((clave: string, valores?: Record<string, string | number>) =>
  inst.t(`prestador:${clave}`, valores)) as never;

type Caso = [nombre: string, forma: FormaDelDia, esperado: string | undefined];

/** Los CUATRO estados del día libre + los cinco brazos que compartían el
 *  defecto + los que ya estaban sanos (regresión: no se tocaron). */
const ES: Caso[] = [
  ['libre · el conteo NO llegó', { clave: 'libre', semana: null }, 'Hoy libre'],
  ['libre · 0', { clave: 'libre', semana: 0 }, 'Hoy libre · nada esta semana'],
  ['libre · 1', { clave: 'libre', semana: 1 }, 'Hoy libre · 1 esta semana'],
  ['libre · 3', { clave: 'libre', semana: 3 }, 'Hoy libre · 3 esta semana'],
  ['quedan', { clave: 'quedan', n: 3, hora: '16:30' }, 'Te quedan 3 · terminas 16:30'],
  ['quedanSinHora', { clave: 'quedanSinHora', n: 3 }, 'Te quedan 3'],
  ['porCoordinar', { clave: 'porCoordinar', n: 2 }, 'Día atendido · 2 por coordinar'],
  ['pasadoPendientes', { clave: 'pasadoPendientes', n: 2 }, 'Quedaron 2 sin cerrar'],
  ['pasadoCerrado · N', { clave: 'pasadoCerrado', n: 5 }, 'Día cerrado · 5 atenciones'],
  ['queda1', { clave: 'queda1', hora: '16:30' }, 'Te queda 1 · terminas 16:30'],
  ['queda1SinHora', { clave: 'queda1SinHora' }, 'Te queda 1'],
  ['completa', { clave: 'completa' }, 'Jornada completa.'],
  ['pasadoPendientes · 1', { clave: 'pasadoPendientes', n: 1 }, 'Quedó 1 sin cerrar'],
  ['pasadoCerrado · 1', { clave: 'pasadoCerrado', n: 1 }, 'Día cerrado · 1 atención'],
  ['sinCitas', { clave: 'sinCitas' }, 'Sin citas registradas'],
  ['omitida · la línea NO se dibuja', { clave: 'omitida' }, undefined],
];

const EN: Caso[] = [
  ['libre · el conteo NO llegó', { clave: 'libre', semana: null }, 'Free today'],
  ['libre · 0', { clave: 'libre', semana: 0 }, 'Free today · nothing this week'],
  ['libre · 1', { clave: 'libre', semana: 1 }, 'Free today · 1 this week'],
  ['libre · 3', { clave: 'libre', semana: 3 }, 'Free today · 3 this week'],
  ['quedan', { clave: 'quedan', n: 3, hora: '16:30' }, '3 to go · you finish at 16:30'],
  ['porCoordinar', { clave: 'porCoordinar', n: 2 }, 'Day done · 2 to schedule'],
];

let fallos = 0;
function correr(titulo: string, casos: Caso[]) {
  console.log(`\n── ${titulo} ──`);
  for (const [nombre, forma, esperado] of casos) {
    const got = textoDeLaForma(forma, t);
    const llaveCruda = typeof got === 'string' && got.includes('{{');
    const ok = got === esperado && !llaveCruda;
    if (!ok) fallos++;
    const visto = got === undefined ? '(sin línea)' : `«${got}»`;
    const esp = esperado === undefined ? '(sin línea)' : `«${esperado}»`;
    console.log(`  ${ok ? '✓' : '🔴'} ${nombre.padEnd(32)} → ${visto}${ok ? '' : `   ESPERABA ${esp}`}`);
  }
}

correr('ES · la línea entera', ES);
await inst.changeLanguage('en');
correr('EN · espejo', EN);
await inst.changeLanguage('es');

if (process.argv.includes('--control')) {
  console.log('\n── CONTROL DE LA PREMISA (la llamada VIEJA debe dejar la llave) ──');
  const viejo = inst.t('prestador:agenda.datoLibreConSemana', { count: 3 });
  const dejaLlave = String(viejo).includes('{{');
  console.log(`  ${dejaLlave ? '✓' : '🔴'} t(datoLibreConSemana, { count: 3 }) → «${viejo}»`);
  if (!dejaLlave) {
    console.log('  🔴 La premisa cambió: i18next ya no deja la llave cruda. Releer este gate.');
    fallos++;
  }
  const control = inst.t('prestador:agenda.saludoNombre', { nombre: 'Guillermo' });
  const interpola = control === 'Hola, Guillermo';
  console.log(`  ${interpola ? '✓' : '🔴'} CONTROL POSITIVO saludoNombre → «${control}»`);
  if (!interpola) fallos++;
}

console.log(`\nFALLOS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
