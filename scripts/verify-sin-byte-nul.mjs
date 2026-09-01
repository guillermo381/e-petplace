#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// S110-A · NINGÚN ARCHIVO DE CÓDIGO TRACKEADO LLEVA UN BYTE NUL CRUDO
//
// 🔴 POR QUÉ ES UN GATE Y NO UNA LÍNEA EN UN DOC (`L-461`): un byte NUL vuelve
// BINARIO al archivo para casi todo buscador — `grep -I`, `ugrep -I`, `git
// grep` y los buscadores de los editores lo saltean **y devuelven CERO SIN
// DECIR NADA**. No dice «binary file matches», no falla, no avisa: contesta
// cero.
// > ### Un censo que toca ese archivo sale verde y está ciego, y su ceguera se lee como resultado.
// Ya cobró un cero falso medido: una pista afirmó que una función no tenía
// llamadores, y tenía tres — en el archivo con NUL.
//
// 🔴 LA CURA NO ES BORRAR EL NUL. Los tres casos vivos eran SEPARADORES
// DELIBERADOS de `join` y de plantilla: quitarlos habría cambiado una clave
// única por una concatenación sin separador, **en silencio**. La cura es
// escribirlo como ESCAPE de dos caracteres — mismo valor en runtime, cero
// bytes NUL en el archivo. *Por eso este gate no prohíbe el CARÁCTER: prohíbe
// el BYTE.*
//
// Corre en el pre-commit: es un read por archivo trackeado.
// ═══════════════════════════════════════════════════════════════════════════

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|sql|json|md)$/;
const NUL = 0;

/* 🔴 CONTROL POSITIVO, ANTES DE MEDIR NADA — el gate se prueba sobre un caso
   cuyo resultado ya conocemos. *Un instrumento que no puede producir su rojo
   no está midiendo* (`L-459`), y en un gate de baseline 0 esa trampa es la
   regla y no la excepción: sin control, «cero sucios» y «no miré nada» tienen
   exactamente la misma cara. */
const sonda = Buffer.concat([Buffer.from('const a = "x'), Buffer.from([NUL]), Buffer.from('y";')]);
if (sonda.indexOf(NUL) === -1) {
  console.error('🔴 EL INSTRUMENTO NO PUEDE VER UN BYTE NUL — su cero no significa nada.');
  process.exit(2);
}
/* Y el control NEGATIVO: sobre texto sano tiene que dar -1. Sin este brazo, un
   `indexOf` que devolviera 0 siempre pasaría el control de arriba. */
if (Buffer.from('const a = "xy";').indexOf(NUL) !== -1) {
  console.error('🔴 EL INSTRUMENTO VE UN NUL DONDE NO LO HAY — su rojo no significa nada.');
  process.exit(2);
}

const trackeados = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n').filter((f) => f && EXT.test(f) && existsSync(f));

const sucios = [];
for (const f of trackeados) {
  const buf = readFileSync(f);
  const i = buf.indexOf(NUL);
  if (i !== -1) {
    const linea = buf.subarray(0, i).toString('utf8').split('\n').length;
    let n = 0;
    for (const b of buf) if (b === NUL) n += 1;
    sucios.push({ f, linea, n });
  }
}

if (sucios.length > 0) {
  console.error(`\n🔴 ${sucios.length} archivo(s) trackeado(s) con BYTE NUL CRUDO:\n`);
  for (const s of sucios) console.error(`   ${s.f}:${s.linea}  (${s.n} byte(s))`);
  console.error([
    '',
    '   Todo buscador devuelve CERO EN SILENCIO sobre estos archivos, y ningún',
    '   censo que los toque es confiable.',
    '',
    '   🔴 NO LO BORRES si es un separador deliberado — quitarlo cambia la clave',
    '   y no falla. Escribilo como ESCAPE de dos caracteres (barra + cero) en',
    '   vez del byte crudo: mismo valor en runtime, y el archivo deja de ser',
    '   binario para el buscador.',
    '',
  ].join('\n'));
  process.exit(1);
}

console.log(`✓ sin byte NUL · ${trackeados.length} archivos trackeados medidos · sonda del instrumento VERDE`);
