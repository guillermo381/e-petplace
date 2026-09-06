/* Arnés de REGISTRAR Y DESPEDIRSE (S113-B · lote 1.2). La regla común:
   **nada se guarda sin que la persona toque**, y lo que la casa no revisó no
   se muestra. */
import { fechaDespedidaValida } from '../packages/ui/src/components/despedida-fecha.ts';
import { readFileSync } from 'node:fs';
let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
const sin = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
/* 🔴 **UN GATE QUE NO PUEDE MEDIR NO SE MUERE: LO DICE.** Tercero de la misma
   clase —carnet, perfil y éste—: con un `readFileSync` pelado, un árbol sin
   alguna de estas piezas reventaba con `ENOENT`. *Un stack trace no distingue
   «no hay defecto» de «no corrí»*, y por un pipe se lleva el exit del pipe
   (`L-191`). Sale **2 con NO CONCLUYENTE**. */
const NO_CONCLUYENTE: string[] = [];
const src = (f: string) => {
  try {
    return sin(readFileSync(new URL(`../packages/ui/src/components/${f}`, import.meta.url), 'utf8'));
  } catch {
    NO_CONCLUYENTE.push(f);
    return '';
  }
};
const RAZA = src('SugerenciaRaza.tsx'), FICHA = src('FichaRaza.tsx'), DESP = src('PantallaDespedida.tsx');

console.log('\n── ① ROJO · NADA SE GUARDA SIN TOQUE ──');
t('🔴 `elegida` puede ser null: nada viene preelegido', /elegida: string \| null/.test(RAZA), true);
t('…y la pieza NO elige sola', /elegida \?\? |elegida = candidatas/.test(RAZA), false);
t('el tope de tres vive en la PIEZA, no en quien la monta', /slice\(0, 3\)/.test(RAZA), true);
t('🔴 la confianza se dice en PALABRAS, no en porcentaje',
  /%|porcentaje|confianza \* 100/.test(RAZA), false);
t('sin animal, lo DICE y no inventa un mestizo',
  /if \(!vioAnimal\) return/.test(RAZA) && /elegir\('mestizo'\)/.test(RAZA) === false, true);

console.log('\n── ② ROJO · SIN CONTENIDO REVISADO NO HAY FICHA ──');
t('🔴 `revisado: false` ⇒ la tarjeta no existe', /if \(!revisado\) return null/.test(FICHA), true);
t('…y no hay versión degradada ni «pronto»', /pronto|Pr[óo]ximamente/i.test(FICHA), false);
t('la línea de revisión se dibuja siempre que la ficha exista', /vozRevision/.test(FICHA), true);
t('lo que es null no aparece', /c\.valor != null && c\.valor\.trim\(\) !== ''/.test(FICHA), true);
t('la etapa actual se resalta y las otras se VEN',
  /c\.actual \? theme\.bg\.hundido : 'transparent'/.test(FICHA), true);

console.log('\n── ③ ROJO · LA FECHA DE DESPEDIDA NUNCA ES FUTURA ──');
t('hoy vale', fechaDespedidaValida('2026-09-04', '2026-09-04'), true);
t('ayer vale', fechaDespedidaValida('2026-09-03', '2026-09-04'), true);
t('🔴 mañana NO', fechaDespedidaValida('2026-09-05', '2026-09-04'), false);
t('el año que viene tampoco', fechaDespedidaValida('2027-01-01', '2026-09-04'), false);
t('el guard apaga el botón', /disabled=\{!valida\}/.test(DESP), true);
t('🔴 y dice POR QUÉ (un apagado mudo es el defecto)', /vozFechaFutura/.test(DESP), true);

console.log('\n── ④ LA DESPEDIDA ES EN TINTA, SIN MARCA ──');
t('🔴 el botón es tinta, no el acento', /backgroundColor: valida \? theme\.text\.primary/.test(DESP), true);
t('🔴 ni una gota de marca', /accent\.|gradient|Gradient|HeroMarca|Isotipo/.test(DESP), false);
t('sin ilustración', /Huella|Guijarro|Image|Svg/.test(DESP), false);
t('el segundo toque ES la seguridad', /if \(!confirmando\)/.test(DESP), true);
t('…y nombra a la mascota', /confirmando \? <Texto[^>]*>\{nombre\}|\{nombre\}<\/Texto>/.test(DESP), true);
t('🔴 ningún «¿estás seguro?» con signos', /¿est[áa]s seguro|!!|¡/.test(DESP), false);
t('el estado del segundo toque es LOCAL (una pantalla que se re-monta no llega confirmada)',
  /useState\(false\)/.test(DESP), true);

console.log('\n── ⑤ NINGUNA COMPONE VOZ (Ley 3) ──');
for (const [n, s] of [['raza', RAZA], ['ficha', FICHA], ['despedida', DESP]] as const)
  t(`\`${n}\` no arma frases`, /`\$\{[a-z]+\} (de|en|para|hasta)/i.test(s), false);

if (NO_CONCLUYENTE.length > 0) {
  console.log(`\n⚠️ NO CONCLUYENTE · no se pudieron abrir: ${NO_CONCLUYENTE.join(' · ')}`);
  console.log('   Este árbol no tiene todas las piezas que el gate mide. **No es verde ni rojo:');
  console.log('   es que no se pudo medir**, y sale 2 para que ningún tablero lo lea como salud.');
  process.exit(2);
}
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
