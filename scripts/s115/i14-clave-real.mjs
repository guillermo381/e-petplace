/**
 * S115-E · INSTRUMENTO 14 — LA CLAVE DE ACCESO CONTRA UNA CLAVE REAL.
 *
 * 🔴 POR QUÉ EXISTE, SI YA HAY UN i11: `i11` genera 100 claves con NUESTRA pieza y las
 * valida con MI verificador. Los dos salieron de la misma lectura de la misma
 * especificación — **si esa lectura está mal, los dos se equivocan igual y en la misma
 * dirección**. Un corpus propio mide el corpus.
 *
 * Este instrumento mide contra el MUNDO: una clave de acceso de una factura ecuatoriana
 * REAL, emitida por un tercero que no nos conoce.
 *
 * LA PRUEBA QUE DE VERDAD CIERRA — y no es el módulo 11, es la (d):
 *   (a) longitud 49 y todo dígitos
 *   (b) módulo 11 con mi verificador propio
 *   (c) la estructura se descompone en partes con sentido (fecha real, tipo conocido,
 *       RUC de 13 con los dos dígitos de provincia plausibles, ambiente 1|2, emisión 1)
 *   (d) 🔴 **NUESTRA pieza, alimentada con las partes extraídas de la clave real,
 *       reconstruye esa misma clave BYTE A BYTE.** Si reconstruye, nuestra lectura del
 *       layout coincide con la del SRI. Si no, dice EXACTAMENTE en qué posición difiere.
 *
 * *La (b) prueba que sé calcular un dígito. La (d) prueba que entendimos el formato.*
 *
 * Uso:  node scripts/s115/i14-clave-real.mjs --clave <49 dígitos>
 *       node scripts/s115/i14-clave-real.mjs --clave <49> --clave <49>   (varias)
 *
 * ⚠️ LA CLAVE NO SE COMMITEA. Es el identificador de una factura real de una persona
 * real: dice su RUC, su fecha y su secuencial. Se pasa por argumento y vive en el
 * transcript de la corrida, no en el repo. El instrumento **no la escribe en ningún
 * archivo** y en el reporte la muestra parcialmente enmascarada.
 */
import { correr, rojo, noConcluyente } from './_lib-e.mjs';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const RUTA = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/supabase/functions/_shared/facturacion/clave_acceso.ts';
const SP = '/private/tmp/claude-501/-Users-guillo381gmail-com-proyectos-ePetPlace-e-petplace/e31c9cf9-5517-4887-9e34-60a4227ba727/scratchpad';

/** Módulo 11 del SRI, escrito acá — pesos 2..7 cíclicos de derecha a izquierda. */
function digitoModulo11(cuerpo48) {
  let suma = 0, peso = 2;
  for (let i = cuerpo48.length - 1; i >= 0; i--) {
    suma += Number(cuerpo48[i]) * peso;
    peso = peso === 7 ? 2 : peso + 1;
  }
  const resto = suma % 11, d = 11 - resto;
  return d === 11 ? 0 : d === 10 ? 1 : d;
}

/** El layout del SRI, contado sobre la propia pieza (8+2+13+1+3+3+9+8+1 = 48 + DV). */
function descomponer(c) {
  return {
    fecha:            c.slice(0, 8),    // ddmmaaaa
    tipoComprobante:  c.slice(8, 10),
    ruc:              c.slice(10, 23),
    ambiente:         c.slice(23, 24),
    establecimiento:  c.slice(24, 27),
    puntoEmision:     c.slice(27, 30),
    secuencial:       c.slice(30, 39),
    codigoNumerico:   c.slice(39, 47),
    tipoEmision:      c.slice(47, 48),
    dv:               c.slice(48, 49),
  };
}

const TIPOS = { '01': 'factura', '04': 'nota de crédito', '05': 'nota de débito',
                '06': 'guía de remisión', '07': 'comprobante de retención' };

const enmascarar = (c) => `${c.slice(0, 10)}${'·'.repeat(23)}${c.slice(33)}`;

// ── Las claves llegan por argumento, jamás de un archivo del repo ────────────
const claves = [];
const impresos = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--clave') claves.push((argv[++i] ?? '').trim());
  /* El número que el RIDE imprime —`015-118-000017078`— es la MISMA numeración que
     la clave lleva adentro. Que coincidan es lo que ata el papel al identificador
     electrónico: si difieren, el comprobante impreso y el que el SRI autorizó no son
     el mismo documento. */
  if (argv[i] === '--impreso') impresos.push((argv[++i] ?? '').trim());
}

await correr('i14 · la clave de acceso contra una clave REAL', async (r) => {
  if (!claves.length)
    noConcluyente(
      'no se pasó ninguna clave real.\n' +
      '   Se corre así:  node scripts/s115/i14-clave-real.mjs --clave <49 dígitos>\n' +
      '   La clave sale de cualquier factura electrónica ecuatoriana (el RIDE la imprime\n' +
      '   como «CLAVE DE ACCESO», 49 dígitos). NO se commitea ni se guarda en archivo.');

  let deno = null;
  for (const [n, clave] of claves.entries()) {
    r.di(`\n   ── clave ${n + 1} de ${claves.length}: ${enmascarar(clave)}`);

    // ── (a) FORMA ──────────────────────────────────────────────────────────
    /* 🔴 LOS BRAZOS ACUMULAN, NO CORTAN. Con `rojo()` en cada uno, el primero que
       falla TAPA a los demás: medido acá mismo, una clave con el layout permutado
       moría en el módulo 11 y los brazos (c) y (d) no llegaban a correr nunca.
       Sobre una clave real que falle, lo que hace falta es el CUADRO COMPLETO —
       si falla el DV *y* la estructura *y* la reconstrucción, eso dice algo muy
       distinto de que falle sólo uno. */
    const hallazgos = [];
    if (!/^\d+$/.test(clave)) hallazgos.push(`tiene caracteres que no son dígitos`);
    r.dato('longitud', `${clave.length}${clave.length === 49 ? ' ✓' : ' 🔴 se esperaban 49'}`);
    if (clave.length !== 49)
      hallazgos.push(`mide ${clave.length} dígitos, no 49 — si viene de un RIDE real, el layout equivocado es el NUESTRO`);

    // ── (b) MÓDULO 11, con verificador propio ──────────────────────────────
    const esperado = digitoModulo11(clave.slice(0, 48));
    const trae = Number(clave[48]);
    r.dato('módulo 11', `dígito ${trae} · calculado ${esperado}${esperado === trae ? ' ✓' : ' 🔴'}`);
    if (esperado !== trae)
      hallazgos.push(`el dígito verificador NO coincide (trae ${trae}, calculo ${esperado}) — sobre una clave que el SRI ya autorizó, el módulo 11 equivocado es el NUESTRO`);

    // ── (c) ESTRUCTURA con sentido ─────────────────────────────────────────
    const p = descomponer(clave);
    const dd = +p.fecha.slice(0, 2), mm = +p.fecha.slice(2, 4), aaaa = +p.fecha.slice(4, 8);
    const fechaOk = dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && aaaa >= 2012 && aaaa <= 2030;
    r.di('');
    r.dato('fecha de emisión', `${p.fecha} → ${dd}/${mm}/${aaaa}${fechaOk ? ' ✓' : ' 🔴 no es una fecha plausible'}`);
    r.dato('tipo de comprobante', `${p.tipoComprobante}${TIPOS[p.tipoComprobante] ? ` = ${TIPOS[p.tipoComprobante]} ✓` : ' 🔴 desconocido'}`);
    r.dato('RUC del emisor', `${p.ruc.slice(0, 2)}··········${p.ruc.slice(-3)} (${p.ruc.length} dígitos, provincia ${p.ruc.slice(0, 2)})`);
    r.dato('ambiente', `${p.ambiente}${p.ambiente === '1' ? ' = pruebas ✓' : p.ambiente === '2' ? ' = producción ✓' : ' 🔴 fuera de {1,2}'}`);
    r.dato('establecimiento · punto', `${p.establecimiento} · ${p.puntoEmision}`);
    r.dato('secuencial', `${p.secuencial} (9 dígitos)`);
    r.dato('código numérico', `${p.codigoNumerico} (8 dígitos)`);
    r.dato('tipo de emisión', `${p.tipoEmision}${p.tipoEmision === '1' ? ' = normal ✓' : ' 🔴 se esperaba 1'}`);

    const provincia = +p.ruc.slice(0, 2);
    const problemas = [];
    if (!fechaOk) problemas.push('la fecha no es plausible');
    if (!TIPOS[p.tipoComprobante]) problemas.push(`tipo de comprobante desconocido (${p.tipoComprobante})`);
    if (p.ruc.length !== 13) problemas.push('el RUC no mide 13');
    if (!(provincia >= 1 && provincia <= 24) && provincia !== 88 && provincia !== 90)
      problemas.push(`código de provincia fuera de rango (${p.ruc.slice(0, 2)})`);
    if (!['1', '2'].includes(p.ambiente)) problemas.push(`ambiente ${p.ambiente}`);
    if (p.tipoEmision !== '1') problemas.push(`tipo de emisión ${p.tipoEmision}`);
    if (problemas.length)
      hallazgos.push(`la estructura no se descompone en partes con sentido (${problemas.join(' · ')}) — sobre una clave REAL eso significa que nuestro LAYOUT está corrido`);

    // ── (c bis) EL NÚMERO IMPRESO EN EL RIDE, si se pasó ────────────────────
    const impreso = impresos[n];
    if (impreso) {
      const dellaClave = `${p.establecimiento}-${p.puntoEmision}-${p.secuencial}`;
      r.dato('número impreso', `${impreso} · de la clave ${dellaClave}${impreso === dellaClave ? ' ✓' : ' 🔴'}`);
      if (impreso !== dellaClave)
        hallazgos.push(`el número impreso (${impreso}) no coincide con la numeración que la clave lleva adentro (${dellaClave}) — el papel y el documento electrónico no son el mismo`);
    }

    // ── (d) 🔴 LA PRUEBA QUE CIERRA: nuestra pieza la RECONSTRUYE ──────────
    if (deno === null) {
      const arnes = `${SP}/arnes-clave-real.ts`;
      writeFileSync(arnes, `
import { construirClaveAcceso } from '${RUTA}';
const p = JSON.parse(Deno.args[0]);
const TIPO_INV: Record<string,string> = { '01':'factura', '04':'nota_credito' };
try {
  console.log(JSON.stringify({ ok: true, clave: construirClaveAcceso({
    fecha: new Date(Date.UTC(+p.fecha.slice(4,8), +p.fecha.slice(2,4)-1, +p.fecha.slice(0,2))),
    tipoComprobante: TIPO_INV[p.tipoComprobante] ?? p.tipoComprobante,
    ruc: p.ruc, ambiente: Number(p.ambiente),
    establecimiento: p.establecimiento, puntoEmision: p.puntoEmision,
    secuencial: p.secuencial, codigoNumerico: p.codigoNumerico,
  })}));
} catch (e) { console.log(JSON.stringify({ ok: false, error: String(e) })); }
`);
      deno = arnes;
    }
    const res = spawnSync('deno', ['run', '--allow-read', deno, JSON.stringify(p)],
      { encoding: 'utf8', timeout: 60000 });
    if (res.error || res.status !== 0)
      noConcluyente(`deno no pudo correr el arnés: ${String(res.stderr ?? res.error).slice(0, 300)}`);

    let out;
    try { out = JSON.parse(res.stdout.trim().split('\n').pop()); }
    catch { noConcluyente(`la salida del arnés no es JSON:\n   ${res.stdout.slice(0, 300)}`); }

    r.di('');
    if (!out.ok) {
      if (/tipoComprobante|TIPO_COMPROBANTE|undefined/.test(out.error) && !TIPOS[p.tipoComprobante])
        noConcluyente(`nuestra pieza no conoce el tipo ${p.tipoComprobante} (sólo factura y nota de crédito). No es un defecto del layout: es ALCANCE, y se declara como tal.`);
      hallazgos.push(`nuestra pieza no pudo construir la clave con las partes de una real: ${out.error}`);
    }

    const igual = out.ok && out.clave === clave;
    r.dato('reconstrucción con NUESTRA pieza', !out.ok ? '⚠️ no se pudo construir' : igual ? 'IDÉNTICA ✓' : '🔴 DIFIERE');
    if (out.ok && !igual) {
      const i = [...clave].findIndex((ch, k) => ch !== out.clave[k]);
      const campo = Object.entries({ fecha: [0, 8], tipoComprobante: [8, 10], ruc: [10, 23],
        ambiente: [23, 24], establecimiento: [24, 27], puntoEmision: [27, 30],
        secuencial: [30, 39], codigoNumerico: [39, 47], tipoEmision: [47, 48], dv: [48, 49] })
        .find(([, [a, b]]) => i >= a && i < b)?.[0] ?? '(fuera de rango)';
      hallazgos.push(`nuestra pieza reconstruye una clave DISTINTA de la real — primera diferencia en la posición ${i}, dentro de «${campo}»: real «${clave.slice(Math.max(0, i - 4), i + 6)}» vs nuestra «${out.clave.slice(Math.max(0, i - 4), i + 6)}». Sobre una clave que el SRI autorizó, el layout equivocado es el NUESTRO`);
    }

    // ── El veredicto de ESTA clave, con TODO lo que se encontró ─────────────
    if (hallazgos.length)
      rojo(`la clave ${n + 1} (${enmascarar(clave)}) falló ${hallazgos.length} brazo(s):\n` +
           hallazgos.map((h, k) => `   ${k + 1}. ${h}`).join('\n'));
  }

  // ── (e) 🔴 EL BORDE DEL ESTÁNDAR: los restos 1 y 10 ──────────────────────
  /* El módulo 11 tiene dos casos donde la especificación es ambigua y cada
     implementación elige: resto 1 (11−1 = 10, que no es un dígito) y resto 10
     (11−10 = 1). La convención del SRI manda 1 en los dos ⇒ **dos cuerpos distintos
     comparten dígito verificador**, y eso NO es un defecto: es el estándar.
     Lo que sí sería un defecto es que nuestra pieza y este verificador eligieran
     distinto — ahí el SRI rechazaría nuestras claves y el instrumento diría que
     están bien. *Dos implementaciones independientes coincidiendo en el caso
     ambiguo vale más que cien coincidiendo en los fáciles.* */
  const P = claves[0].slice(0, 39);
  const suma = (c) => { let s = 0, p = 2; for (let i = c.length - 1; i >= 0; i--) { s += Number(c[i]) * p; p = p === 7 ? 2 : p + 1; } return s; };
  const bordes = [];
  for (let cn = 0; cn < 100000 && bordes.length < 2; cn++) {
    const cuerpo = P + String(cn).padStart(8, '0') + '1';
    const resto = suma(cuerpo) % 11;
    if ((resto === 1 || resto === 10) && !bordes.some((b) => b.resto === resto))
      bordes.push({ resto, cn: String(cn).padStart(8, '0'), cuerpo });
  }
  r.di('');
  if (bordes.length < 2) {
    r.di('   ⚠️ no se pudieron construir los dos restos ambiguos con este prefijo — el borde queda SIN medir.');
  } else {
    const arnesBorde = `${SP}/arnes-borde.ts`;
    writeFileSync(arnesBorde, `
import { digitoVerificador } from '${RUTA}';
const cuerpos = JSON.parse(Deno.args[0]);
console.log(JSON.stringify(cuerpos.map((c: string) => digitoVerificador(c))));
`);
    const res = spawnSync('deno', ['run', '--allow-read', arnesBorde, JSON.stringify(bordes.map((b) => b.cuerpo))], { encoding: 'utf8', timeout: 60000 });
    if (res.status !== 0) noConcluyente(`el arnés del borde no corrió: ${String(res.stderr).slice(0, 200)}`);
    const dvPieza = JSON.parse(res.stdout.trim().split('\n').pop());
    for (const [i, b] of bordes.entries()) {
      const mio = digitoModulo11(b.cuerpo);
      r.dato(`  resto ${b.resto}`, `código ${b.cn} · mi verificador ${mio} · nuestra pieza ${dvPieza[i]}${mio === dvPieza[i] ? ' ✓' : ' 🔴 DIFIEREN'}`);
      if (mio !== dvPieza[i])
        rojo(`en el caso ambiguo del estándar (resto ${b.resto}) mi verificador dice ${mio} y nuestra pieza ${dvPieza[i]}.\n   Una de las dos produce claves que el SRI rechaza — y la que las genera es la pieza.`);
    }
    r.di(`      ⇒ los restos 1 y 10 comparten dv = ${dvPieza[0]}: es la colisión del estándar, no un defecto.`);
  }

  r.di(`\n   → ${claves.length} clave(s) real(es): módulo 11, estructura y RECONSTRUCCIÓN byte a byte.`);
  r.di('     La (d) es la que cierra: nuestra lectura del layout coincide con la del SRI.');
});
