#!/usr/bin/env node
/**
 * S112-A · EL NÚMERO DE FICHA Y DE LECCIÓN SE PIDE, NO SE ELIGE. (`D-1002`)
 *
 * Gemelo de `proximo-numero-migracion.mjs`, y nace de la misma clase de daño:
 * **dos pistas tomando el mismo número**. `D-998` se tomó DOS VECES el 1-sep.
 *
 * ═══ EL ROJO QUE LO PARIÓ, reproducido antes de escribir esto ══════════════
 * El canon declaraba —bien— el COMANDO en vez del número:
 *
 *     grep -o "D-[0-9]\{3\}" docs/DEUDAS_CANONICAS.md | sort -u | tail -1
 *
 * y **falla para los dos lados**:
 *
 *  · **SUBCUENTA** → devuelve `D-999` con `D-1002` depositada, porque el regex
 *    de TRES dígitos trunca `D-1002` a `D-100`. ⇒ la próxima pista toma
 *    `D-1000`, **que ya está tomado** (6 ocurrencias medidas). *Choca.*
 *  · **SOBRECUENTA** → la corrección obvia (número entero + orden numérico)
 *    devuelve `D-2026`, que **no es una ficha**: sale de una cita legal
 *    (`SPDP-SPD-2026-0009-R`) **y de la ficha que documenta este mismo bug**,
 *    que escribe `D-2026` entre backticks como ejemplo. ⇒ **salta 1024
 *    números.** *Y saltar no tiene síntoma: nadie lo nota nunca.*
 *
 * ⇒ *La ficha que documenta el bug contiene el string que causa el bug.*
 * **Ninguna variante de regex sobre el CUERPO del archivo se salva de eso.**
 *
 * ═══ LO QUE MIDE ══════════════════════════════════════════════════════════
 * **Una ficha es un ENCABEZADO que empieza con su número, no una mención.**
 * Se anclan los encabezados cuyo primer token es el número entre backticks
 * (`## 🔴 \`D-1002\` — …`), se ordena NUMÉRICAMENTE —la otra mitad del
 * arreglo no está en el patrón, está en el orden: `sort` alfabético pone
 * `D-999` después de `D-1000`— y se suma uno.
 *
 * ═══ 🔴 SU GUARD, Y ES LA MITAD QUE UN ONE-LINER NO PUEDE TENER ═══════════
 * El ancla por encabezado **depende de la convención de formato**, y `L-459`
 * ya cobró eso: *un gate atado a un NOMBRE mide la CONVENCIÓN, no el hecho.*
 * Si una ficha alta se depositara con otro formato, el ancla NO la vería y
 * devolvería un número TOMADO — el defecto que vino a curar, con mejor cara.
 *
 * Por eso no alcanza con calcular: **antes de entregarlo, este comando exige
 * que el número propuesto no aparezca NI UNA VEZ en todo el archivo.** Si
 * aparece, sale ROJO y nombra las líneas. *El instrumento que sólo sabe decir
 * un número no puede dar su propio rojo* (`L-459`).
 *
 * USO:  node scripts/proximo-numero-ficha.mjs [--control]
 *       --control corre los positivos y los TRES negativos conocidos.
 * L-197: si no puede leer el archivo, sale ROJO — jamás un número a medias.
 */
import { readFileSync } from 'node:fs';

const ARCHIVO = 'docs/DEUDAS_CANONICAS.md';
const di = (s) => process.stdout.write(s + '\n');

let texto;
try {
  texto = readFileSync(ARCHIVO, 'utf8');
} catch (e) {
  di(`ROJO · no se pudo leer ${ARCHIVO}: ${e.message}`);
  process.exit(1);
}
const lineas = texto.split('\n');

/** Encabezados cuyo PRIMER token es el número entre backticks. */
const ANCLA = (p) => new RegExp('^#+ [^A-Za-z]*`' + p + '-(\\d{3,4})`');

function topeDe(prefijo) {
  let max = 0;
  for (const l of lineas) {
    const m = ANCLA(prefijo).exec(l);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

/** El guard: el número propuesto no puede existir en NINGUNA parte del archivo. */
function ocurrencias(etiqueta) {
  const re = new RegExp('\\b' + etiqueta + '\\b');
  return lineas.flatMap((l, i) => (re.test(l) ? [i + 1] : []));
}

const CONTROL = process.argv.includes('--control');
let salida = 0;

for (const prefijo of ['D', 'L']) {
  const tope = topeDe(prefijo);
  if (tope === 0) {
    di(`ROJO · ${prefijo}-: cero encabezados anclados. El formato de depósito cambió.`);
    salida = 2;
    continue;
  }
  const propuesto = `${prefijo}-${tope + 1}`;
  const choque = ocurrencias(propuesto);
  if (choque.length > 0) {
    di(`🔴 ROJO · ${prefijo}- · tope anclado ${prefijo}-${tope}, pero ${propuesto} YA APARECE`);
    di(`   lineas: ${choque.join(', ')}`);
    di(`   ⇒ o hay una ficha depositada con otro formato de encabezado, o el`);
    di(`     numero esta mencionado como "proximo libre". NO tomes ${propuesto}.`);
    salida = 2;
  } else {
    di(`${prefijo}-: tope ${prefijo}-${tope}  ·  PROXIMO LIBRE ${propuesto}`);
  }
}

if (CONTROL) {
  di('');
  di('-- controles (sinteticos: se inyecta una linea y se mide si el tope se mueve) --');
  const topeEn = (txt, p) => {
    let max = 0;
    for (const l of txt.split('\n')) {
      const m = ANCLA(p).exec(l);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return max;
  };
  const base = topeEn(texto, 'D');
  const chk = (nombre, cond) => {
    di(`  ${cond ? 'ok  ' : 'ROJO'} ${nombre}`);
    if (!cond) salida = 2;
  };

  /* POSITIVO — el instrumento tiene que PODER moverse: si una ficha nueva no
     mueve el tope, el verde de arriba no prueba nada (L-459). */
  chk(
    'positivo · una ficha nueva con encabezado anclado MUEVE el tope',
    topeEn(texto + '\n## 🔴 `D-9999` — ficha sintetica\n', 'D') === 9999,
  );
  chk('positivo · hay encabezados L- anclados', topeEn(texto, 'L') > 0);

  /* NEGATIVOS — las tres formas medidas de contaminacion. */
  chk(
    'negativo · una MENCION en el cuerpo no mueve el tope',
    topeEn(texto + '\n el proximo numero libre es `D-9999`.\n', 'D') === base,
  );
  chk(
    'negativo · un encabezado que NARRA el numero no mueve el tope',
    topeEn(texto + '\n# Deudas S999 (D-9998 → D-9999) · tope real `D-9997`\n', 'D') === base,
  );
  chk('negativo · D-2026 (cita legal + autorreferencia) no esta en el conjunto', base !== 2026);
  chk('negativo · L-714 (typo declarado, vive en dos encabezados) no es el tope', topeEn(texto, 'L') !== 714);
}

process.exit(salida);
