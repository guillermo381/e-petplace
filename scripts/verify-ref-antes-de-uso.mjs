#!/usr/bin/env node
/**
 * 🔴 UN `useRef` LEÍDO ANTES DE DECLARARSE — el gate del crash del hilo (S112-C).
 *
 * ── EL CASO REAL QUE LO PARIÓ ───────────────────────────────────────────────
 * Las dos pantallas del hilo de adopción tenían `const filas = useMemo(…)` que
 * leía `mensajesRef.current`, y `const mensajesRef = useRef([])` **40 líneas más
 * abajo**. Un `useMemo` **corre durante el render**, o sea ANTES de que esa
 * línea se ejecute ⇒ el `const` transpilado queda hoisteado como `undefined` y
 * el cuerpo hace `undefined.current`. Literal del aparato:
 *
 *     TypeError: Cannot read property 'current' of undefined
 *       at HiloSolicitud (cliente) · at HiloDelPublicador (prestador)
 *
 * ⚠️ **Salió con los 4 typechecks en 0, `verify:diseno` verde con 61 reglas y
 * todos los trinquetes en su número.** TypeScript **no** marca «usado antes de
 * declarar» cuando el uso está adentro del cuerpo de una función: no puede
 * saber que ese cuerpo corre inmediatamente. *Ningún instrumento de la casa
 * miraba esto, y la pantalla moría en el primer render.*
 *
 * ── QUÉ MIDE, y por qué así ─────────────────────────────────────────────────
 * Por archivo: para cada `const X = useRef(`, si existe un `X.current` en una
 * línea ANTERIOR, es rojo. **No intenta decidir si ese lector corre durante el
 * render** —eso exigiría entender el flujo— y no hace falta: *declarar el ref
 * antes de su lector no cuesta nada, y no declararlo así es, en el mejor caso,
 * una trampa esperando a que alguien mueva el lector adentro de un `useMemo`.*
 *
 * ⚠️ LO QUE NO VE, declarado: un ref que llega **por prop o por contexto** y es
 * `undefined` en tiempo de ejecución. Eso no es orden de declaración y este
 * gate no lo alcanza.
 *
 * 🔴 **Y SU PRIMERA CORRIDA DIO CINCO ROJOS DE LOS CUALES TRES ERAN PROSA** —
 * `zonaRef.current` mencionado en un comentario que yo mismo había escrito
 * horas antes. Es `L-170` en otro sustrato: *un censo por texto lee los
 * comentarios como código.* Por eso los comentarios se **borran antes de
 * medir**, y no se filtran después: filtrar después obliga a acertar qué línea
 * era prosa, y borrar antes hace la pregunta inexpresable.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const archivos = execSync("grep -rl 'useRef' apps/*/src --include='*.tsx' --include='*.ts'")
  .toString().trim().split('\n').filter(Boolean);

const malos = [];
for (const f of archivos) {
  /* Los comentarios se van ANTES de medir (ver la cabecera). Se reemplazan por
     líneas vacías y no se eliminan, para que los números de línea del reporte
     sigan siendo los del archivo real. */
  const crudo = readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  const L = crudo.split('\n');
  const decl = new Map();            // nombre → línea de su `const X = useRef(`
  for (let i = 0; i < L.length; i++) {
    const m = L[i].match(/\bconst\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*useRef\b/);
    if (m && !decl.has(m[1])) decl.set(m[1], i + 1);
  }
  for (const [nombre, linea] of decl) {
    const re = new RegExp(`\\b${nombre}\\.current\\b`);
    for (let i = 0; i < linea - 1; i++) {
      if (re.test(L[i])) { malos.push(`${f}:${i + 1}  lee \`${nombre}.current\` · declarado en :${linea}`); break; }
    }
  }
}

console.log(`archivos con useRef: ${archivos.length}`);
if (malos.length === 0) {
  console.log('\n✓ verify:ref-antes-de-uso VERDE — ningún ref se lee antes de declararse.');
  process.exit(0);
}
console.log(`\n🔴 ${malos.length} lector(es) ANTES de su declaración:\n`);
for (const m of malos) console.log('   ' + m);
console.log('\n☠️ Si ese lector corre durante el render (useMemo), la pantalla MUERE en el primer render.');
process.exit(1);
