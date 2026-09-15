#!/usr/bin/env node
/**
 * `verify:numero-nombra-comando` — S115-CIERRE (12-sep-2026).
 *
 * 🔴 QUÉ EXIGE: **una sección que se declara MEDIDA y publica una tabla de
 *    números tiene que decir CON QUÉ se midió** — un comando, o una fecha.
 *    *Un número sin su comando no es una medición: es una afirmación con
 *    aspecto de medición, y se lee con la autoridad de la segunda.*
 *
 * 🔴 POR QUÉ **NO** MIDE «TODO NÚMERO EN UN DOCUMENTO VIVO», que era el pedido
 *    original, y se declara en vez de fingir que sí:
 *
 *    Un gate no puede distinguir **un número que es una medición** de **un
 *    número que es una decisión** («la comisión es 18 %») o de uno que es parte
 *    de una frase («las tres formas»). Intentarlo produce ruido sobre prosa
 *    correcta — y **un gate ruidoso se apaga**, que es peor que no tenerlo
 *    (`L-550`). ⇒ se acota a lo que SÍ es decidible por texto: *si una sección
 *    dice «medido», tiene que decir con qué.*
 *
 * ⚠️ SU PUNTO CIEGO, DECLARADO: **una sección que publica números medidos y NO
 *    usa la palabra «medido» es invisible para este gate.** No hay forma barata
 *    de cazarla, y decirlo acá es más honesto que dejar creer que el verde
 *    cubre el documento entero.
 *
 * CORPUS: la lista de abajo. Un documento que no está en la lista NO se mide —
 * y eso también es un punto ciego, por eso la lista se declara y no se deriva.
 */
import { readFileSync, existsSync } from 'node:fs';

const DOCS = [
  'docs/MODELO_FINANCIERO.md',
  'docs/MODELO_FISCAL.md',
  'docs/MODELO_ECONOMICO.md',
  'docs/PROVEEDOR_FISCAL.md',
  // S116-B lote 16 · entra al corpus el mismo día que nace, y no después:
  // el punto ciego declarado de este gate es «un documento fuera del corpus
  // no se mide», y una guía llena de censos es exactamente lo que no puede
  // quedar afuera. *Escribir el documento y no agregarlo acá es publicar
  // números con la vigilancia apagada.*
  'docs/GUIA_REDISENO_PRESTADOR.md',
];

/** Una sección "se declara medida" si dice alguna de éstas. */
const SE_DECLARA_MEDIDA = /\bmedid[oa]s?\b/i;
/** Y queda satisfecha con cualquiera de éstas. */
const NOMBRA_SU_FUENTE = [
  /```/,                         // un bloque de comando
  /`select\s/i,                  // un select inline
  /\bcomando\b/i,                // lo nombra en prosa
  /\bpg_get_functiondef\b/i,
  /\binformation_schema\b/i,
  /\bsupabase functions list\b/i,
  /\bgit\s+(ls-remote|log|grep|diff)\b/,
  /\b\d{1,2}-(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)-20\d\d\b/i, // su fecha
  /\bNO MEDIBLE\b/,
];
/** Una tabla markdown con al menos un número: lo que vuelve exigible la sección. */
const TIENE_TABLA_CON_NUMERO = (t) =>
  t.split('\n').some((l) => l.trim().startsWith('|') && /\d/.test(l));

let fallos = 0;
let revisadas = 0;
let exigidas = 0;

for (const doc of DOCS) {
  if (!existsSync(doc)) {
    console.log(`✗ ${doc} — NO EXISTE. El corpus nombra un archivo que no está.`);
    fallos++;
    continue;
  }
  const txt = readFileSync(doc, 'utf8');
  /* Se corta por encabezado de cualquier nivel: la sección es su unidad. */
  const partes = txt.split(/^(#{2,4} .*)$/m);
  for (let i = 1; i < partes.length; i += 2) {
    const titulo = partes[i];
    const cuerpo = partes[i + 1] ?? '';
    const seccion = titulo + '\n' + cuerpo;
    revisadas++;
    if (!SE_DECLARA_MEDIDA.test(seccion)) continue;
    if (!TIENE_TABLA_CON_NUMERO(seccion)) continue;
    exigidas++;
    if (NOMBRA_SU_FUENTE.some((re) => re.test(seccion))) continue;
    fallos++;
    console.log(
      `✗ ${doc}\n  ${titulo.trim().slice(0, 90)}\n` +
      `  Se declara MEDIDA y publica una tabla con números, pero no nombra su comando ni su fecha.\n` +
      `  Curalo: agregá el \`select\`/comando que la produce, o su fecha de medición, o «NO MEDIBLE».`,
    );
  }
}

console.log(
  `\n${fallos === 0 ? '✓' : '✗'} numero-nombra-comando · ${DOCS.length} documentos · ` +
  `${revisadas} secciones leídas · ${exigidas} exigidas · ${fallos} fallo(s)`,
);
if (exigidas === 0) {
  console.log(
    '⚠️  NO CONCLUYENTE: ninguna sección resultó exigible. Un gate que no exige nada\n' +
    '   da verde por vacío, y eso no es una medición.',
  );
  process.exit(2);
}
process.exit(fallos === 0 ? 0 : 1);
