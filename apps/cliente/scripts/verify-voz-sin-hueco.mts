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
/* ⭐ **S116-C lote 3 · 10 → 8 (`D-1087`).** Se curaron **5 ocurrencias** y el
   número bajó 2 respecto del techo: `citas/[mascotaId].tsx:434` (1) y
   `autorizacion/[solicitudId].tsx:105-106` (4).
   **Las dos curas son distintas y ésa es la parte que importa:**
   · en `citas` el hueco era **INALCANZABLE** —el ternario ya garantizaba el
     dato y el `?? ''` existía sólo para que TypeScript compilara, porque no
     estrecha una expresión `a ?? b`—. Se hizo **inexpresable** con una const,
     no se declaró con `HUECO_ACEPTADO`: *el escape deja el `?? ''` vivo para
     el próximo que lo copie.*
   · en `autorizacion` el hueco era **REAL** —el nombre del negocio no es
     legible por el dueño (RLS solo-owner)— y la frase salía «  quiere atender
     a Thor». Ganó voz propia para el caso sin nombre.
   ⚠️ **Quedan 8 y NO se tocaron a ciegas**: los 3 de
   `(tabs)/despensa/checkout.tsx` (el saldo) son de la Despensa, **lote 6**, y
   curarlos desde acá sería tocar una pantalla sin verla — que es justo lo que
   la nota de arriba prohíbe. */
const BASELINE = 8;

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
