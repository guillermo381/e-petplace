/**
 * verify:postventa-plantillas — «LAS ETIQUETAS DEL TRÁMITE SON PLANTILLAS
 * FIJAS: no las escribe el modelo» (§11, fila «redacción»). S114-D, lote 3.
 *
 * Cinco cosas, y las dos primeras son la ley:
 *   ① `plantillas.ts` no importa la puerta de la IA. Estructural: si no puede
 *      llamar al modelo, no hay forma de que una etiqueta salga de uno.
 *   ② `etiqueta()` es determinística — mismo estado, mismo texto, siempre.
 *   ③ ninguna variable queda cruda en pantalla (`{{prestador}}` a la vista es
 *      el modo de falla que esta casa ya midió con las llaves de i18n).
 *   ④ ningún andamio trae la frase hecha: un borrador que ya dice el texto es
 *      una etiqueta con un modelo al lado gastando plata.
 *   ⑤ los textos de la familia no nombran los plazos que §2 le prohíbe ver.
 */
import { readFileSync } from 'node:fs'
import {
  andamio, BORRADORES, ESTADOS_CASO, ESTADOS_PLATA, etiqueta, etiquetaPlata,
} from '../supabase/functions/_shared/postventa/plantillas.ts'

const FUENTE = readFileSync(
  new URL('../supabase/functions/_shared/postventa/plantillas.ts', import.meta.url), 'utf8')

const fallas: string[] = []
let verdes = 0

// ── ① SIN PUERTA A LA IA ────────────────────────────────────────────────────
{
  const imports = [...FUENTE.matchAll(/^import .*?from '([^']+)'/gm)].map((m) => m[1])
  const aIa = imports.filter((i) => /\/ia\/|llamarModelo|anthropic/i.test(i))
  if (aIa.length > 0) fallas.push(`✗ \`plantillas.ts\` importa la IA: ${aIa.join(', ')}`)
  else if (/llamarModelo|api\.anthropic\.com/.test(FUENTE)) {
    fallas.push('✗ `plantillas.ts` menciona una llamada al modelo')
  } else verdes++
}

// ── ② DETERMINISMO — el trámite dice lo mismo siempre ───────────────────────
{
  let estable = true
  for (const e of ESTADOS_CASO) {
    const primero = etiqueta(e, { prestador: 'Clínica Aurora', mascota: 'Thor' })
    for (let i = 0; i < 50; i++) {
      if (etiqueta(e, { prestador: 'Clínica Aurora', mascota: 'Thor' }) !== primero) {
        fallas.push(`✗ \`${e}\` cambió de texto entre corridas`); estable = false; break
      }
    }
  }
  for (const e of ESTADOS_PLATA) {
    const primero = etiquetaPlata(e, { prestador: 'Clínica Aurora' })
    if (etiquetaPlata(e, { prestador: 'Clínica Aurora' }) !== primero) {
      fallas.push(`✗ \`${e}\` (plata) cambió de texto entre corridas`); estable = false
    }
  }
  if (estable) verdes++
}

// ── ③ NINGUNA VARIABLE CRUDA, NI SIQUIERA SIN DATOS ─────────────────────────
{
  let limpio = true
  const casos: Array<Record<string, string>> = [
    {}, { prestador: 'Clínica Aurora' }, { mascota: 'Thor' },
    { prestador: '   ' }, { prestador: 'Clínica Aurora', mascota: 'Thor' },
  ]
  for (const e of ESTADOS_CASO) {
    for (const v of casos) {
      const t = etiqueta(e, v)
      if (/\{\{|\}\}/.test(t)) { fallas.push(`✗ \`${e}\` deja una variable cruda: ${t}`); limpio = false }
      if (t.trim() === '') { fallas.push(`✗ \`${e}\` quedó vacía`); limpio = false }
    }
  }
  for (const e of ESTADOS_PLATA) {
    for (const v of casos) {
      const t = etiquetaPlata(e, v)
      if (/\{\{|\}\}/.test(t)) { fallas.push(`✗ \`${e}\` (plata) deja una variable cruda: ${t}`); limpio = false }
    }
  }
  if (limpio) verdes++
}

// ── ④ EL ANDAMIO PIDE, NO DICTA ─────────────────────────────────────────────
// 🔴 ESTE BLOQUE SE REESCRIBIÓ PORQUE MI PRIMER DETECTOR ERA ROMO Y DIO CUATRO
// ROJOS FALSOS. Buscaba «texto entre comillas de más de 25 caracteres» como
// señal de frase dictada, y lo que capturaba era **lo que hay ENTRE dos
// ejemplos de voz**: los andamios dicen `"tu mascota", "te cobraron"`, y el
// regex emparejaba la comilla de cierre del primero con la de apertura del
// segundo. *El rojo era del instrumento, no del sujeto* — y un detector más
// romo que la regla que vigila produce rojos sobre lo correcto, que es
// exactamente lo que el banco del muro clínico ya pagó una vez.
//
// Lo reemplazan dos medidas EXACTAS, y su límite va declarado:
{
  let bien = true
  const tramite = [...FUENTE.matchAll(/^\s{2}\w+: '([^']{15,})',$/gm)].map((m) => m[1])
  for (const b of BORRADORES) {
    const a = andamio(b, { prestador: 'Clínica Aurora', mascota: 'Thor', resumen: 'x', detalle: 'y' })
    // (a) Ningún andamio contiene un texto del trámite. Exacto: si la frase que
    //     el modelo tiene que "escribir" ya existe como etiqueta, es una
    //     etiqueta pagando tokens.
    const repetido = tramite.find((t) => a.includes(t))
    if (repetido !== undefined) {
      fallas.push(`✗ el andamio \`${b}\` contiene un texto del trámite: "${repetido.slice(0, 45)}…"`); bien = false
    }
    // (b) Empieza pidiendo, no diciendo. Un andamio es una instrucción para
    //     quien redacta; si arranca con el mensaje, ya lo escribió él.
    /* 🔴 `\b` NO DELIMITA PALABRAS EN ESPAÑOL, y esta línea lo cobró en vivo:
       `Escribí` termina en `í`, que no es carácter de palabra ASCII, así que
       `/^Escrib[íi]\b/` no cerraba nunca y los cuatro andamios salieron en
       rojo estando bien. Es la ley que la casa ya tiene escrita —la misma que
       dejaba pasar el imperativo voseante entero en el cinturón de voz— y la
       forma correcta es la clase unicode con flag `u`. */
    if (!/^Escrib[íi](?![\p{L}\p{N}])/u.test(a.trim())) {
      fallas.push(`✗ el andamio \`${b}\` no arranca con una instrucción: "${a.trim().slice(0, 40)}…"`); bien = false
    }
    if (!/tuteo/i.test(a)) { fallas.push(`✗ el andamio \`${b}\` no pide tuteo`); bien = false }
  }
  if (bien) verdes++
}
// ⚠️ LO QUE ④ NO PUEDE VER: un andamio que dicte una frase NUEVA, que no esté
// en el trámite. No hay forma exacta de separar «pedile la hora» de «escribile:
// necesitamos la hora», y un detector que lo intente vuelve al problema de
// arriba. Eso lo sostiene la revisión humana del andamio, no este gate.

// ── ⑤ LOS PLAZOS QUE LA FAMILIA NO VE (§2) ──────────────────────────────────
// «La familia no ve el reloj de 48 h… un countdown sobre el incumplimiento
// ajeno convierte la espera en espectáculo.» Y §6: la devolución manual **no
// promete fecha**.
{
  let bien = true
  for (const e of ESTADOS_CASO) {
    const t = etiqueta(e, { prestador: 'Clínica Aurora' })
    if (/\b(24|48)\s*(h|horas)\b/i.test(t)) {
      fallas.push(`✗ \`${e}\` le muestra un plazo a la familia: ${t}`); bien = false
    }
  }
  const manual = etiquetaPlata('en_camino_manual')
  if (/\b(\d+\s*(d[ií]as?|horas?|h)|ma[ñn]ana|hoy mismo|en\s+\d+)\b/i.test(manual)) {
    fallas.push(`✗ \`en_camino_manual\` promete una fecha: ${manual}`); bien = false
  }
  if (bien) verdes++
}

console.log(`\n  controles en verde: ${verdes}/5`)
if (fallas.length > 0) {
  console.error(`\n  🔴 ROJO — ${fallas.length}:\n${fallas.map((f) => '   ' + f).join('\n')}\n`)
  process.exit(1)
}
console.log(`\n  ✅ VERDE · el trámite es fijo y determinístico; el borrador pide y no dicta.\n`)
