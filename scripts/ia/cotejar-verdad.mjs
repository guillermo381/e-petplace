/**
 * S113-D · COTEJO DE LAS DOS TRANSCRIPCIONES — el paso 2 de las tres firmas.
 *
 * Compara `documento-X--D.json` con `documento-X--E.json` y saca **sólo los
 * desacuerdos**, para que el founder mire la foto y firme.
 *
 * 🔴 EL HUECO DE ESQUEMA NO ES UN ACUERDO — y es la cura de un defecto REAL
 * de este mismo archivo. Mi transcripción del documento A llamaba `lote_visible`
 * a lo que el cotejo compara como `lote`. Resultado: el campo estaba AUSENTE en
 * las dos puntas de la comparación, `norm(undefined) === norm(undefined)`, y el
 * cotejo lo contaba como **coincidencia**. *La mitad de la salida era nula por
 * esquema y se leía como acuerdo.*
 *
 * Ahora se distingue: **`null` es una LECTURA** («el carnet no lo dice»);
 * **ausente es un HUECO DE ESQUEMA**, y sale en rojo aparte. Un instrumento que
 * confunde «los dos leímos que no hay dato» con «ninguno de los dos tiene ese
 * campo» no está comparando: está midiendo su propio formulario.
 *
 * 🔴 LO QUE ESTE COTEJO NO DICE: que lo coincidente sea VERDAD. Dice que dos
 * lectores leyeron igual, que no es lo mismo — dos lectores pueden equivocarse
 * de la misma manera, sobre todo si el error es verosímil (que es exactamente
 * como se contaminó el conjunto original: `11536014` parecía un lote).
 *
 *   node scripts/ia/cotejar-verdad.mjs --control     (sin archivos, cero deps)
 *   node scripts/ia/cotejar-verdad.mjs --doc B
 */
import { readFileSync, existsSync } from 'node:fs';

const DIR = 'docs/loop/verdad-vista';
const CAMPOS = ['fecha_aplicada', 'lote', 'vencimiento_biologico', 'veterinario', 'evidencia', 'confianza'];

/** Normaliza para emparejar: minúsculas, sin acentos, sin puntuación. */
const norm = (s) => String(s ?? '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]/g, '');

/** Empareja por NOMBRE de vacuna, no por posición: los dos lectores pueden
 *  contar las filas distinto (dos stickers, ¿una dosis o dos?) y eso es en sí
 *  mismo un desacuerdo que hay que ver, no un desfase que haya que absorber. */
export function cotejar(d, e) {
  const clave = (f) => norm(f.vacuna).slice(0, 14);
  const mapa = (filas) => new Map(filas.map((f) => [clave(f), f]));
  const md = mapa(d.filas), me = mapa(e.filas);
  const todas = [...new Set([...md.keys(), ...me.keys()])].sort();

  const soloD = [], soloE = [], difieren = [], coinciden = [], huecos = [];
  for (const k of todas) {
    const a = md.get(k), b = me.get(k);
    if (a && !b) { soloD.push(a.vacuna); continue; }
    if (b && !a) { soloE.push(b.vacuna); continue; }

    // Ausente ≠ null. Un campo que ninguna de las dos manos escribió NO es un
    // acuerdo: es un formulario incompleto, y se saca aparte.
    const faltan = CAMPOS.filter((c) => !(c in a) || !(c in b))
      .map((c) => ({ campo: c, enD: c in a, enE: c in b }));
    if (faltan.length) huecos.push({ vacuna: a.vacuna, faltan });

    const comparables = CAMPOS.filter((c) => c in a && c in b);
    const campos = comparables.filter((c) => norm(a[c]) !== norm(b[c]))
      .map((c) => ({ campo: c, D: a[c] ?? null, E: b[c] ?? null }));
    if (campos.length) difieren.push({ vacuna: a.vacuna, campos });
    else if (!faltan.length) coinciden.push(a.vacuna);
  }
  return { soloD, soloE, difieren, coinciden, huecos };
}

const args = process.argv.slice(2);

if (args.includes('--control')) {
  console.log('\ncontrol de cotejar-verdad — cero archivos, cero red\n');
  const D = { filas: [
    { vacuna: 'Nobivac Lepto', fecha_aplicada: null, lote: 'A468A01', vencimiento_biologico: null, veterinario: null, evidencia: 'sticker_con_fecha', confianza: 'baja' },
    { vacuna: 'Nobivac KC',    fecha_aplicada: '2023-08-03', lote: 'A127G01', vencimiento_biologico: null, veterinario: null, evidencia: 'sticker_con_fecha', confianza: 'alta' },
    { vacuna: 'Canigen LR',    fecha_aplicada: '2024-07-06', lote: '9B2F', vencimiento_biologico: null, veterinario: null, evidencia: 'sello', confianza: 'alta' },
  ] };
  const E = { filas: [
    { vacuna: 'Nobivac Lepto', fecha_aplicada: '2023-06-05', lote: 'A468A01', vencimiento_biologico: null, veterinario: null, evidencia: 'sticker_con_fecha', confianza: 'media' },
    { vacuna: 'Nobivac KC',    fecha_aplicada: '2023-08-03', lote: 'A127G01', vencimiento_biologico: null, veterinario: null, evidencia: 'sticker_con_fecha', confianza: 'alta' },
    { vacuna: 'Canigen MHA2PPi', fecha_aplicada: '2024-07-06', lote: '9B2F', vencimiento_biologico: null, veterinario: null, evidencia: 'sello', confianza: 'alta' },
  ] };
  const r = cotejar(D, E);
  let v = 0, ro = 0;
  const ex = (n, c, visto) => c ? (v++, console.log(`  OK   ${n}`)) : (ro++, console.log(`  ROJO ${n} — ${JSON.stringify(visto)}`));
  ex('ve el desacuerdo de fecha (null vs 2023-06-05)', r.difieren.some((x) => x.vacuna === 'Nobivac Lepto' && x.campos.some((c) => c.campo === 'fecha_aplicada')), r.difieren);
  ex('ve el desacuerdo de confianza en la misma fila', r.difieren.some((x) => x.vacuna === 'Nobivac Lepto' && x.campos.some((c) => c.campo === 'confianza')));
  ex('la fila idéntica NO va a arbitraje', r.coinciden.includes('Nobivac KC') && !r.difieren.some((x) => x.vacuna === 'Nobivac KC'));
  ex('ve la fila que sólo tiene D', r.soloD.includes('Canigen LR'), r.soloD);
  ex('ve la fila que sólo tiene E', r.soloE.includes('Canigen MHA2PPi'), r.soloE);
  // Este caso mide el EMPAREJAMIENTO por nombre, no el acuerdo: sus filas
  // traen dos campos de seis, así que ahora —bien— salen como hueco de
  // esquema. Se comprueba que emparejaron: una sola entrada, ni soloD ni soloE.
  const acentos = cotejar({ filas: [{ vacuna: 'Rabimune®', evidencia: 'sello' }] }, { filas: [{ vacuna: 'rabimune', evidencia: 'sello' }] });
  ex('empareja aunque el nombre venga con acentos/puntuación distinta',
    acentos.soloD.length === 0 && acentos.soloE.length === 0 && acentos.huecos.length === 1,
    { soloD: acentos.soloD, soloE: acentos.soloE, huecos: acentos.huecos.length });
  // Control positivo del propio control: si NADA difiere, no debe inventar.
  ex('dos transcripciones idénticas no producen arbitraje', cotejar(D, D).difieren.length === 0 && cotejar(D, D).soloD.length === 0);

  // 🔴 EL CONTROL DEL DEFECTO REAL: el campo con OTRO NOMBRE en una punta.
  const conOtroNombre = { filas: [{ vacuna: 'Nobivac KC', fecha_aplicada: '2023-08-03', lote_visible: 'A127G01', vencimiento_biologico: null, veterinario: null, evidencia: 'sticker_con_fecha', confianza: 'alta' }] };
  const conElNombre   = { filas: [{ vacuna: 'Nobivac KC', fecha_aplicada: '2023-08-03', lote: 'A127G01',         vencimiento_biologico: null, veterinario: null, evidencia: 'sticker_con_fecha', confianza: 'alta' }] };
  const h = cotejar(conOtroNombre, conElNombre);
  ex('un campo AUSENTE en una punta sale como HUECO DE ESQUEMA', h.huecos.length === 1 && h.huecos[0].faltan[0].campo === 'lote', h.huecos);
  ex('y NO se cuenta como coincidencia (era el defecto real)', h.coinciden.length === 0, h.coinciden);
  const h2 = cotejar(conOtroNombre, conOtroNombre);
  ex('ausente en LAS DOS tampoco es acuerdo', h2.huecos.length === 1 && h2.coinciden.length === 0, { huecos: h2.huecos.length, coinciden: h2.coinciden });
  console.log(`\n${ro === 0 ? 'OK' : 'ROJO'} control cotejar-verdad — ${v} verdes · ${ro} rojos\n`);
  process.exit(ro === 0 ? 0 : 1);
}

const i = args.indexOf('--doc');
const doc = i !== -1 ? args[i + 1] : null;
if (!doc) { console.log('\nuso: --control  |  --doc <A|B>\n'); process.exit(2); }

const rutaD = `${DIR}/documento-${doc}--D.json`;
const rutaE = `${DIR}/documento-${doc}--E.json`;
if (!existsSync(rutaD)) { console.error(`\nPARA: falta ${rutaD}\n`); process.exit(2); }
if (!existsSync(rutaE)) {
  console.error(`\nPARA: falta ${rutaE}.`);
  console.error('  E todavía no transcribió este documento. **No lo escribas vos**:');
  console.error('  la segunda mano tiene que ser de otra cabeza, o el protocolo no mide nada.\n');
  process.exit(2);
}
const D = JSON.parse(readFileSync(rutaD, 'utf8'));
const E = JSON.parse(readFileSync(rutaE, 'utf8'));
const r = cotejar(D, E);

console.log(`\n=== documento ${doc} · D (${D.filas.length} filas) vs E (${E.filas.length} filas) ===\n`);
console.log(`coinciden en ${r.coinciden.length} fila(s). ⚠️ Coincidir NO es ser verdad.`);
if (r.huecos.length) {
  console.log(`\n🔴 ${r.huecos.length} fila(s) con HUECO DE ESQUEMA — NO son acuerdo ni desacuerdo:`);
  for (const h of r.huecos) {
    console.log(`  ${h.vacuna}: ` + h.faltan.map((f) => `${f.campo} (D:${f.enD ? 'sí' : 'FALTA'} E:${f.enE ? 'sí' : 'FALTA'})`).join(' · '));
  }
  console.log('  ⇒ los dos lados escriben el MISMO nombre de campo, o esto no compara nada.');
}
if (r.soloD.length) console.log(`\nSÓLO D las vio: ${r.soloD.join(' · ')}`);
if (r.soloE.length) console.log(`SÓLO E las vio: ${r.soloE.join(' · ')}`);
if (r.difieren.length) {
  console.log(`\n--- AL FOUNDER, ${r.difieren.length} fila(s) con desacuerdo ---`);
  for (const f of r.difieren) {
    console.log(`\n  ${f.vacuna}`);
    for (const c of f.campos) console.log(`    ${c.campo.padEnd(22)} D: ${JSON.stringify(c.D).padEnd(16)} E: ${JSON.stringify(c.E)}`);
  }
}
const total = r.difieren.length + r.soloD.length + r.soloE.length;
if (r.huecos.length) process.exitCode = 1;
console.log(`\n${total === 0 ? 'sin desacuerdos' : total + ' punto(s) a arbitrar'} · fotos en las notas del JSON\n`);
