#!/usr/bin/env node
/**
 * CENSO TOKEN-vs-MANO (S97-B) — de las DIEZ piezas que montan en las CUATRO
 * pantallas de la caminata: ¿qué propiedad visual sale de token y cuál está
 * escrita a mano adentro de la pieza?
 *
 * PARA QUÉ, y es de plata: cuando el founder diga «el texto secundario no se
 * lee», la respuesta cambia el costo por diez.
 *   · sale de TOKEN  → una línea en el tema, pega en todo el ecosistema.
 *   · está A MANO    → enmienda de primitiva firmada, con gate propio.
 * Se quiere saber ANTES de que lo diga, no después.
 *
 * CÓMO CLASIFICA (SIETE cubetas, no dos — la respuesta binaria mentiría, y
 * mintió: la v2 puso los siete `color: 'primary'` de `Texto` en A MANO):
 *   TOKEN       el valor cita `theme` / `palette` / `spacing` / `radius` /
 *               `typography` / `motion` / `shadows` / `elevacion`.
 *   SEMÁNTICO   la pieza ELIGE un slot del sistema (`color: 'secondary'`) y el
 *               TEMA le pone el valor. Curar el valor = una línea de tema.
 *               Curar qué slot elige la variante = enmienda de pieza.
 *   DERIVADO    cita un token Y además tiene aritmética (`size.sm * leading`).
 *   CONSUMIDOR  viene de una prop: no lo decide el tema ni la pieza — lo
 *               decide QUIEN LA MONTA (o sea C/D).
 *   PLATAFORMA  `StyleSheet.hairlineWidth`, `Platform.*`: constante del SO.
 *   ESTRUCTURAL `top/bottom/left/right: 0` de posición absoluta: es «cubrí al
 *               padre», no una medida de diseño. Tokenizarlo no significa nada.
 *   A MANO      literal crudo. ES LO ÚNICO QUE OBLIGA A ABRIR LA PIEZA.
 *
 * LÍMITES declarados (un censo que no dice lo que no ve, miente):
 *   · Lee UNA LÍNEA por propiedad. Un valor partido en varias líneas se
 *     clasifica por su primera — se reporta al pie cuántos quedaron truncados.
 *   · Mira SOLO propiedades tokenizables (color, geometría, métrica de texto,
 *     opacidad, sombra). `flexDirection` o `textAlign` no son de token.
 *   · NO juzga. Un `borderWidth: 1` a mano puede estar perfecto. Dice dónde
 *     hay que ir a tocar, jamás si hay que tocar.
 *   · Es ESTÁTICO: no resuelve qué valor gana en runtime cuando hay ternarios.
 *   · 🔴 NO VE LOS MAPAS SEMÁNTICOS, y hay que saberlo para leer a `Icono`:
 *     cuando una pieza resuelve el color por una tabla cuyas llaves NO son
 *     props de estilo (`porConcepto: { paseo: { pura: theme.capa.cuidado } }`),
 *     el censo de props no la alcanza. Por eso cada pieza reporta además sus
 *     REFERENCIAS A TOKEN del archivo entero: una pieza con 3 props visuales y
 *     80 referencias no es una pieza sin diseño — es una que lo resuelve por
 *     mapa. `hitSlop` queda afuera a propósito: es blanco de TOQUE, no visual.
 */
import { readFileSync } from 'node:fs';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const UI = `${RAIZ}/packages/ui/src`;

// Las diez que montan en las CUATRO pantallas (censo-piezas-caminata.mjs).
const PIEZAS = [
  ['Celda', `${UI}/components/Celda.tsx`],
  ['CeldaNavegacion', `${UI}/components/CeldaNavegacion.tsx`],
  ['Esqueleto', `${UI}/components/Esqueleto.tsx`],
  ['EstadoVacio', `${UI}/components/EstadoVacio.tsx`],
  ['Icono', `${UI}/components/Icono.tsx`],
  ['Insignia', `${UI}/components/Insignia.tsx`],
  ['MarcaDeAgua', `${UI}/brand/MarcaDeAgua.tsx`],
  ['Separador', `${UI}/components/Separador.tsx`],
  ['Tarjeta', `${UI}/components/Tarjeta.tsx`],
  ['Texto', `${UI}/components/Texto.tsx`],
];

const FAMILIAS = {
  color: ['backgroundColor', 'color', 'borderColor', 'borderTopColor', 'borderBottomColor',
    'borderLeftColor', 'borderRightColor', 'shadowColor', 'tintColor', 'fill', 'stroke', 'stopColor'],
  texto: ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'fontFamily'],
  geometria: ['width', 'height', 'minHeight', 'maxHeight', 'minWidth', 'maxWidth', 'borderRadius',
    'borderWidth', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth',
    'padding', 'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom', 'paddingLeft',
    'paddingRight', 'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom',
    'marginLeft', 'marginRight', 'gap', 'rowGap', 'columnGap', 'top', 'bottom', 'left', 'right',
    'strokeWidth'],
  profundidad: ['opacity', 'shadowOpacity', 'shadowRadius', 'elevation'],
};
const FAMILIA_DE = new Map();
for (const [f, props] of Object.entries(FAMILIAS)) for (const p of props) FAMILIA_DE.set(p, f);

const TOKEN = /\b(theme|palette|spacing|radius|typography|motion|shadows|elevacion|opacity)\b/;
const PLATAFORMA = /\b(StyleSheet\.hairlineWidth|Platform\.|PixelRatio)/;
const LITERAL_SOLO = /^-?[\d.]+$/;
const LITERAL_STR = /^'[^']*'$/;

const sinComentarios = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, (b) => b.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, '');

/** Llaves SEMÁNTICAS del sistema. `color: 'primary'` NO es un color a mano:
 *  es la pieza ELIGIENDO un slot que el tema define (`theme.text[c]`,
 *  `theme.status.*Text` — Texto.tsx:175-180). La diferencia es exactamente la
 *  que la mesa pidió: cambiar el VALOR de `text.secondary` es una línea de
 *  tema y pega en todo; cambiar QUÉ slot usa `apoyo` es enmienda de pieza. */
const SLOTS = new Set(['primary', 'secondary', 'tertiary', 'inverse', 'onGradient',
  'warm', 'danger', 'success', 'warning']);

function clasificar(prop, expr) {
  const v = expr.trim().replace(/,$/, '').trim();
  if (LITERAL_STR.test(v) && SLOTS.has(v.slice(1, -1))) return 'SEMÁNTICO';
  // Un 0 de offset en posición absoluta es «cubrí al padre», no una medida de
  // diseño. Tokenizarlo no significaría nada.
  if (['top', 'bottom', 'left', 'right'].includes(prop) && v === '0') return 'ESTRUCTURAL';
  if (PLATAFORMA.test(v)) return 'PLATAFORMA';
  const tieneToken = TOKEN.test(v);
  const soloLiteral = LITERAL_SOLO.test(v) || LITERAL_STR.test(v);
  if (soloLiteral) return 'A MANO';
  if (tieneToken) {
    // token + aritmética o token + literal suelto ⇒ derivado
    return /[+\-*/]|\d/.test(v.replace(/\[\d+(\.\d+)?\]/g, '').replace(/spacing|radius|typography|theme|palette|motion|shadows|elevacion|opacity/g, ''))
      ? 'DERIVADO' : 'TOKEN';
  }
  // Ni token ni literal: sale de una prop o variable de la pieza.
  if (/^[A-Za-z_$][\w$.?[\]'"() ]*$/.test(v) || /\?/.test(v)) return 'CONSUMIDOR';
  return 'CONSUMIDOR';
}

/** Extractor de `prop: valor` — TODAS las de la línea, no la primera.
 *
 *  ⚠️ LA v1 ANCLABA EL VALOR A FIN DE LÍNEA y por eso se comía las tablas:
 *  en `titulo: { fontFamily: …, fontSize: …, color: … }` consumía la línea
 *  entera en `titulo` (que no es prop visual) y perdía las tres de adentro.
 *  Consecuencia medida: reportaba `Texto` con TOKEN 0 / CONSUMIDOR 7 — o sea
 *  «lo decide quien la monta» — cuando `Texto` tiene su RECETA de siete
 *  variantes cableada a `typography.*` adentro. La respuesta salía INVERTIDA
 *  justo en la pieza por la que el founder va a preguntar primero.
 *
 *  Ahora camina el valor contando profundidad de (), [] y {} y corta en la
 *  primera coma de nivel 0. */
function propiedades(linea) {
  const out = [];
  const re = /\b([a-zA-Z][a-zA-Z0-9]*)\s*:/g;
  let m;
  while ((m = re.exec(linea))) {
    const prop = m[1];
    if (!FAMILIA_DE.has(prop)) continue;
    let i = m.index + m[0].length, prof = 0, comilla = null, valor = '';
    for (; i < linea.length; i++) {
      const c = linea[i];
      if (comilla) { valor += c; if (c === comilla) comilla = null; continue; }
      if (c === "'" || c === '"' || c === '`') { comilla = c; valor += c; continue; }
      if ('([{'.includes(c)) prof++;
      if (')]}'.includes(c)) { if (prof === 0) break; prof--; }
      if (c === ',' && prof === 0) break;
      valor += c;
    }
    if (valor.trim()) out.push({ prop, valor: valor.trim() });
  }
  return out;
}

/** Anotaciones de TIPO, no valores. `fontSize: number` en un Record<> no es
 *  una decisión visual — contarla ensuciaría el censo en ambas direcciones. */
const ES_TIPO = (v) => /^(string|number|boolean|any|never|unknown)(\s*\|\s*[^|]+)*$/.test(v.trim());

const CUBETAS = ['TOKEN', 'SEMÁNTICO', 'DERIVADO', 'CONSUMIDOR', 'PLATAFORMA', 'ESTRUCTURAL', 'A MANO'];
const totalGlobal = Object.fromEntries(CUBETAS.map((c) => [c, 0]));
const aManoPorFamilia = {};

for (const [nombre, archivo] of PIEZAS) {
  const limpio = sinComentarios(readFileSync(archivo, 'utf8'));
  const lineas = limpio.split('\n');
  const cuenta = Object.fromEntries(CUBETAS.map((c) => [c, 0]));
  const porFamilia = {};
  const aMano = [];

  let tipos = 0;
  lineas.forEach((l, i) => {
    if (/hitSlop/.test(l)) return; // blanco de TOQUE, no propiedad visual
    for (const m of propiedades(l)) {
      const prop = m.prop;
      if (ES_TIPO(m.valor)) { tipos++; continue; }
      const fam = FAMILIA_DE.get(prop);
      const cub = clasificar(prop, m.valor);
      cuenta[cub]++; totalGlobal[cub]++;
      porFamilia[fam] ??= Object.fromEntries(CUBETAS.map((c) => [c, 0]));
      porFamilia[fam][cub]++;
      if (cub === 'A MANO') {
        aMano.push({ linea: i + 1, prop, valor: m.valor, fam });
        (aManoPorFamilia[fam] ??= []).push(`${nombre}:${i + 1} ${prop}`);
      }
    }
  });

  const tot = CUBETAS.reduce((a, c) => a + cuenta[c], 0);
  console.log(`\n${'─'.repeat(76)}\n${nombre}  (${archivo.replace(RAIZ + '/', '')})  ·  ${tot} propiedades visuales`);
  console.log(`  ${CUBETAS.filter((c) => cuenta[c]).map((c) => `${c} ${cuenta[c]}`).join(' · ') || '—'}`);
  const refs = (limpio.match(/\b(theme|palette|spacing|radius|typography|motion|shadows|elevacion)\./g) ?? []).length;
  console.log(`  referencias a token en el archivo: ${refs}${tipos ? ` · anotaciones de tipo salteadas: ${tipos}` : ''}`);
  for (const [fam, c] of Object.entries(porFamilia)) {
    const detalle = CUBETAS.filter((k) => c[k]).map((k) => `${k} ${c[k]}`).join(' · ');
    console.log(`    ${fam.padEnd(12)} ${detalle}`);
  }
  if (aMano.length) {
    console.log(`  ⬛ A MANO — hay que abrir la pieza (${aMano.length}):`);
    for (const a of aMano) console.log(`     · L${String(a.linea).padStart(4)}  ${a.prop} = ${a.valor}   [${a.fam}]`);
  } else {
    console.log(`  ✅ CERO a mano — todo lo visual de esta pieza se cura desde el tema o desde quien la monta.`);
  }
}

console.log(`\n${'═'.repeat(76)}\nEL TOTAL DE LAS DIEZ\n${'═'.repeat(76)}`);
const tot = CUBETAS.reduce((a, c) => a + totalGlobal[c], 0);
for (const c of CUBETAS) console.log(`  ${c.padEnd(11)} ${String(totalGlobal[c]).padStart(4)}  (${((totalGlobal[c] / tot) * 100).toFixed(1)}%)`);
console.log(`\n  A MANO, por familia — dónde duele abrir la pieza:`);
for (const [fam, l] of Object.entries(aManoPorFamilia)) console.log(`    ${fam.padEnd(12)} ${l.length}× — ${l.join(' · ')}`);
