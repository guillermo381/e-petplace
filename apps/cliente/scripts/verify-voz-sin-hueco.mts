/**
 * ⭐ **NINGUNA VOZ CON `{{…}}` SE DIBUJA VACÍA** (S113-C, sobre el hallazgo de A
 * en aparato).
 *
 * ── LO QUE PASÓ ────────────────────────────────────────────────────────────
 * En el teléfono se leía **«Pregúntame algo de ,»** y **«Lo que sé de»**. El
 * `mascotaId` llegaba —Nexo hablaba de Thor— y el `nombre` no, porque viaja
 * aparte en la URL y hay caminos que no lo ponen.
 *
 * **Y la causa no era el que no lo pasó: era el `?? ''` que rellenaba el hueco
 * con vacío.** *Un `?? ''` sobre una interpolación no es un default: es una
 * frase rota que compila, pasa el typecheck y sólo se ve en pantalla.*
 *
 * ── LO QUE MIDE ────────────────────────────────────────────────────────────
 * Todo argumento de interpolación que pueda ser **cadena vacía por
 * construcción** — `?? ''`, `|| ''`, `: ''`. No mide si en tiempo de ejecución
 * llega vacío: *eso no lo sabe un lector estático, y prometerlo sería peor que
 * no medirlo.*
 *
 * ⚠️ **Un hueco puede ser correcto** —una voz que se lee igual sin ese trozo—.
 * Por eso la salida pide declararlo con `HUECO_ACEPTADO` en la misma línea o en
 * las tres de arriba: *pegado al sitio, no en una lista de excepciones que
 * nadie relee.*
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const di = (s: string) => console.log(s);

const archivos = execSync(
  `grep -rlE "t\\('[a-zA-Z.]+', *\\{" apps/cliente/src --include='*.tsx' --include='*.ts' || true`,
  { encoding: 'utf8' },
).trim().split('\n').filter(Boolean);

/** `nombre: algo ?? ''` · `x: y || ""` · `x: c ? d : ''` — dentro de un objeto
 *  de interpolación, que es lo que va como segundo argumento de `t(...)`. */
const HUECO = /([a-zA-Z_]\w*)\s*:\s*[^,}]*?(\?\?|\|\||:)\s*(''|"")\s*(?=[,}])/g;

let malos = 0;
let vistos = 0;
di('⭐ verify:voz-sin-hueco · ninguna interpolación rellenada con vacío\n');

for (const f of archivos) {
  const lineas = readFileSync(f, 'utf8').split('\n');
  for (const [i, linea] of lineas.entries()) {
    /* Sólo líneas que interpolan: un `?? ''` en otro lado es asunto de otro. */
    if (!/t\(\s*['"][a-zA-Z.]+['"]\s*,/.test(linea)) continue;
    HUECO.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = HUECO.exec(linea)) !== null) {
      vistos += 1;
      const cerca = lineas.slice(Math.max(0, i - 3), i + 1).join('\n');
      if (cerca.includes('HUECO_ACEPTADO')) {
        di(`  ok  ${f}:${i + 1} · «${m[1]}» — hueco declarado`);
        continue;
      }
      malos += 1;
      di(`  🔴  ${f}:${i + 1} · «${m[1]}» puede quedar vacío`);
      di('      La frase sale rota: «… algo de ,». Leelo de donde el dato vive,');
      di('      no dibujes la voz sin él, o declaralo con HUECO_ACEPTADO.');
    }
  }
}

/* 🔴 **EL CONTROL.** Si el patrón dejara de casar —otro estilo de llamada, un
   formateador que parte la línea— este gate saldría VERDE sobre el mismo
   defecto que vino a cazar, y ese verde se leería como salud. */
const control = `      <Texto>{t('nexo.invitacion', { nombre: nombre ?? '' })}</Texto>`;
HUECO.lastIndex = 0;
if (!/t\(\s*['"][a-zA-Z.]+['"]\s*,/.test(control) || HUECO.exec(control) === null) {
  di('\n🔴 NO CONCLUYENTE · el patrón no reconoce ni el defecto original.');
  process.exit(2);
}

/* 🔴 **BASELINE SOLO-BAJA, y el número tiene su historia.** Al nacer este gate
   había **12**: los **2 de esta sesión** (la despedida y el momento de la raza)
   y **10 heredados** —el Hogar, la autorización, las citas—.
   Los míos se curaron; los diez **no se tocan a ciegas**: cada uno es una
   pantalla que habría que medir, y *curar diez voces sin ver ninguna es cambiar
   diez cosas para que un número baje*.
   ⚠️ **El baseline sube A MANO y con su razón, jamás en el commit que lo
   introduce** — si no, deja de ser un techo y pasa a ser un registro de lo que
   fuimos rompiendo. */
const BASELINE = 10;

di(`\n  interpolaciones con relleno vacío halladas: ${vistos}`);
di(`  sin declarar: ${malos} · baseline ${BASELINE} (SOLO-BAJA)`);
if (malos > BASELINE) {
  di(`🔴 ROJO · ${malos - BASELINE} voz(ces) NUEVAS que pueden salir rotas.`);
  di('   Una frase con un hueco vacío sale rota en pantalla y compila perfecto.');
  process.exit(1);
}
if (malos < BASELINE) {
  di(`✓ VERDE · y bajó ${BASELINE - malos}: actualizá BASELINE a ${malos}.`);
} else {
  di('✓ VERDE · ninguna nueva.');
}
process.exit(0);
