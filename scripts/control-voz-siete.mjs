/**
 * ⭐ **CONTROL DE LAS SIETE FORMAS QUE E MIDIÓ COMO PASADAS** (S113-C).
 *
 * 🔴 **Una por una plantada ⇒ ROJO.** Un vocabulario que crece sin control
 * crece con erratas: un término mal escrito en la lista no falla —simplemente
 * deja de cazar—, y su silencio se lee igual que «no hay voseo».
 *
 * Y **cada una con su par en tuteo, que NO debe caer**: si `contame` cazara
 * también `cuéntame`, el guard obligaría a reescribir voz correcta.
 */
import { hitsDeVoseo } from './lib-voz.mjs';

const PARES = [
  ['contame', 'cuéntame'],
  ['bañalo', 'báñalo'],
  ['mostrame', 'muéstrame'],
  ['decime', 'dime'],
  ['avisame', 'avísame'],
  ['fijate', 'fíjate'],
];

let malos = 0;
console.log('⭐ control · las siete formas, y sus pares en tuteo\n');
for (const [voseo, tuteo] of PARES) {
  const rojo = hitsDeVoseo(`  const v = '${voseo} cuando puedas';`).length;
  const verde = hitsDeVoseo(`  const v = '${tuteo} cuando puedas';`).length;
  const ok = rojo === 1 && verde === 0;
  if (!ok) malos += 1;
  console.log(`  ${ok ? 'ok ' : '🔴 '} «${voseo}» → ${rojo} · «${tuteo}» → ${verde}`);
}

/* `dale` aparte: **no tiene par**, porque su par ES él mismo. */
const dale = hitsDeVoseo(`  const v = 'dale la pastilla con comida';`).length;
console.log(`  ${dale === 1 ? 'ok ' : '🔴 '} «dale» → ${dale}  ⚠️ ambiguo: en tuteo también se dice`);
if (dale !== 1) malos += 1;

console.log(malos === 0 ? '\n✓ VERDE · las siete cazan y ningún tuteo cae.' : `\n🔴 ${malos} caso(s)`);
process.exit(malos === 0 ? 0 : 1);
