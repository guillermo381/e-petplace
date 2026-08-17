/**
 * verify-s100d-ceremonia-entrega.mjs — LA CEREMONIA SE ALARGA ABRIENDO
 * PAUSAS, JAMÁS ESTIRANDO GESTOS.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * QUÉ VIGILA, Y POR QUÉ NINGÚN OTRO INSTRUMENTO LO VE
 * ═══════════════════════════════════════════════════════════════════════
 * La enmienda firmada de N10 (`DIRECCION_ARTE` §13, 14-ago-2026) dice que
 * la ESCALA DE LA CEREMONIA se construye **abriendo los `at:`**, y que los
 * `dur:` siguen dentro del vocabulario cerrado del GESTO —150 micro · 300
 * estandar · 520 grande—. Su razón está medida: *escalar las duraciones
 * habría dado 555 y 962 ms, números fuera del vocabulario, y un fade de
 * casi un segundo no se lee como ceremonia: se lee como lentitud.*
 *
 * 🔴 **Una ceremonia con los gestos estirados COMPILA, corre y se ve
 * "lenta pero linda".** Ni `tsc` ni `verify:diseno` miran el VALOR de una
 * duración — miden forma y presencia del hook, no magnitudes. Por eso esta
 * vigilancia es de NÚMEROS y vive acá.
 *
 * ── CÓMO MIDE: DEL ARCHIVO REAL, JAMÁS DE UNA COPIA ────────────────────
 * Extrae la tabla `ACTOS` y los tokens **leyendo las fuentes vivas**
 * (`celebracion-entrega.tsx` y `motion.ts`), en vez de reimplementar los
 * valores acá. *Un guard que re-declara los números que vigila mide su
 * propio eco* — el precedente es el instrumento de la barra de S99, que
 * extrae `pathBarra` del archivo real por esta misma razón.
 *
 * ── EL DISCRIMINADOR ───────────────────────────────────────────────────
 * Re-corre los asserts contra una ceremonia FALSA con los gestos escalados
 * ×1,85 (los 555/962 que la enmienda nombra) y exige que los rechace.
 */

import { readFileSync } from 'node:fs';

const raizPieza = 'apps/cliente/src/components/celebracion-entrega.tsx';
const raizTokens = 'packages/ui/src/tokens/motion.ts';

const pieza = readFileSync(raizPieza, 'utf8');
const tokens = readFileSync(raizTokens, 'utf8');

let fallos = 0;
const ok = (cond, etiqueta, detalle = '') => {
  console.log(`${cond ? '  ✅' : '  ❌'} ${etiqueta}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos++;
};

// ── Los tres números del vocabulario, LEÍDOS de la fuente de tokens ─────
const leerDur = (nombre) => {
  const m = tokens.match(new RegExp(`${nombre}:\\s*(\\d+)`));
  return m === null ? null : Number(m[1]);
};
const VOCABULARIO = {
  micro: leerDur('micro'),
  estandar: leerDur('estandar'),
  grande: leerDur('grande'),
};
const NORMAL_LEGADO = leerDur('normal');

console.log('\n① EL VOCABULARIO DEL GESTO, leído de `motion.ts`');
ok(
  VOCABULARIO.micro === 150 && VOCABULARIO.estandar === 300 && VOCABULARIO.grande === 520,
  'micro 150 · estandar 300 · grande 520',
  JSON.stringify(VOCABULARIO),
);
ok(
  NORMAL_LEGADO !== null && NORMAL_LEGADO !== VOCABULARIO.estandar,
  '`normal` es un token LEGADO distinto de `estandar` (por eso no se usa)',
  `normal=${NORMAL_LEGADO}`,
);

// ── La tabla ACTOS, extraída de la pieza viva ───────────────────────────
const bloque = pieza.match(/const ACTOS = \[([\s\S]*?)\] as const;/);
const filas = bloque === null
  ? []
  : [...bloque[1].matchAll(/\{\s*at:\s*(\d+),\s*dur:\s*motion\.duration\.(\w+)\s*\}/g)].map((m) => ({
      at: Number(m[1]),
      durNombre: m[2],
      dur: VOCABULARIO[m[2]] ?? null,
    }));

console.log('\n② LOS GESTOS ESTÁN EN EL VOCABULARIO CERRADO');
ok(filas.length >= 2, 'la tabla ACTOS se pudo extraer de la pieza real', `actos: ${filas.length}`);
const fuera = filas.filter((f) => f.dur === null);
ok(fuera.length === 0, 'ningún `dur` sale del vocabulario', fuera.map((f) => f.durNombre).join(', '));
const usaLegado = filas.filter((f) => f.durNombre === 'normal');
ok(
  usaLegado.length === 0,
  'ninguno usa el token LEGADO `normal` (250) — el nombre parece correcto y no lo es',
);

console.log('\n③ LO QUE CRECE SON LAS PAUSAS, NO LOS GESTOS');
const ats = filas.map((f) => f.at);
const crecen = ats.every((v, i) => i === 0 || v > ats[i - 1]);
ok(crecen, 'los `at` crecen acto a acto', ats.join(' · '));
ok(ats[0] === 0, 'el primer acto arranca en 0');
const sumaGestos = filas.reduce((s, f) => s + f.dur, 0);
const total = filas[filas.length - 1].at + filas[filas.length - 1].dur;
ok(
  total > sumaGestos,
  'la ceremonia dura MÁS que la suma de sus gestos ⇒ hay beats entre actos',
  `total ${total} ms · gestos ${sumaGestos} ms`,
);

console.log('\n④ LA DEGRADACIÓN ESTÁ DECLARADA AL NACER');
ok(/useReducedMotion/.test(pieza), 'la pieza mira `useReducedMotion`');
ok(
  /theme\.mode === 'memorial'/.test(pieza),
  'memorial comparte brazo con reduce-motion',
);
ok(
  /const CROSSFADE = motion\.duration\.estandar/.test(pieza),
  'degrada a UN crossfade del vocabulario (~300 ms)',
);
ok(
  /quieto \? 0 : ACTOS\[indice\]\.at/.test(pieza),
  'con `quieto` las pausas se ANULAN (los actos aparecen juntos, sin secuencia)',
);

console.log('\n⑤ UNA SOLA VEZ — sin esto la ceremonia es ruido');
ok(/AsyncStorage/.test(pieza), 'la vista se persiste por pedido');
ok(
  /claveVista = \(pedidoId: string\)/.test(pieza),
  'la clave es POR PEDIDO (no una global que apagaría todas)',
);

// ── EL DISCRIMINADOR ────────────────────────────────────────────────────
console.log('\n🔴 DISCRIMINADOR — la ceremonia de gestos estirados debe ser rechazada');
// La alternativa que la enmienda nombra y descarta: escalar ×1,85.
const FALSA = [
  { at: 0, dur: Math.round(VOCABULARIO.grande * 1.85) }, // 962
  { at: 0, dur: Math.round(VOCABULARIO.estandar * 1.85) }, // 555
];
const falsaEnVocabulario = FALSA.every((f) => Object.values(VOCABULARIO).includes(f.dur));
const falsaTieneBeats = FALSA[FALSA.length - 1].at > FALSA[0].at;
ok(!falsaEnVocabulario, '② rechaza los 962/555 (fuera del vocabulario del gesto)');
ok(!falsaTieneBeats, '③ rechaza una ceremonia sin pausas abiertas (todos los `at` iguales)');

console.log(
  fallos === 0
    ? `\n✅ verify-s100d-ceremonia-entrega — VERDE (ceremonia de ${total} ms con ${filas.length} actos + discriminador en rojo)\n`
    : `\n❌ verify-s100d-ceremonia-entrega — ${fallos} FALLO(S)\n`,
);
process.exit(fallos === 0 ? 0 : 1);
