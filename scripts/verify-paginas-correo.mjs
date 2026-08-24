#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// verify-paginas-correo — LAS DOS PÁGINAS DE LAS QUE DEPENDE EL CORREO DE
// INVITACIÓN. Es la condición de encendido firmada por el founder (S104, voto
// (c)): `INVITACION_CORREO_VIVO` queda apagada **hasta que las dos midan 200**.
//
// POR QUÉ EXISTE Y NO ES UN CURL A MANO: el fail-closed del despachador verifica
// que `URL_APP_BASE` ESTÉ, no que las páginas EXISTAN — un edge function no
// puede sondear rutas de forma confiable. **El freno es de mesa, y una condición
// de mesa sin instrumento se cumple declarándola.** Esto la vuelve medible.
//
// ⚠️ LOS DOS CONTROLES NO SON ADORNO, y cada uno tapa una forma de mentir:
//   · CONTROL POSITIVO — una ruta que SÍ existe. Si ella no da 200, el
//     instrumento no está midiendo (sitio caído, red, DNS): NO CONCLUYENTE.
//   · CONTROL NEGATIVO — una ruta inventada. Si ella NO da 404, este sitio no
//     usa 404 para «no existe» y un 404 en las nuestras no probaría nada.
//   Sin el positivo, un 404 general se lee como «C no las construyó».
//   Sin el negativo, un sitio que contesta 200 a todo se lee como «ya están».
//
// Y HAY UNA TERCERA MENTIRA, la que casi me come a mí: **sin `-L` el apex
// contesta 308 a TODO** —incluidas las rutas que existen— y «todo igual» se lee
// como «nada roto». Acá se siguen los redirects SIEMPRE, y se reporta el destino
// final y cuántos saltos hizo.
//
// USO   node scripts/verify-paginas-correo.mjs [base]
// SALIDAS  0 = las dos en 200 (se puede encender) · 1 = falta alguna
//          2 = NO CONCLUYENTE (el control positivo no dio 200)
//          3 = el sitio no discrimina (el control negativo no dio 404)
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';

const BASE = process.argv[2] ?? 'https://epetplace.com';

// Las rutas se leen del código que las compone, no de un mensaje:
//   `/invitacion?token=` → apps/cliente/src/app/(tabs)/cuenta/familia.tsx
//   `/baja?t=`           → apps/cliente/src/app/baja.tsx
const REQUERIDAS = [
  { id: 'la llegada de la invitación', ruta: '/invitacion?token=verificacion' },
  { id: 'la baja de un clic', ruta: '/baja?t=verificacion' },
];
const CONTROL_POSITIVO = { id: 'control + (existe)', ruta: '/' };
const CONTROL_NEGATIVO = { id: 'control − (inventada)', ruta: '/ruta-que-no-existe-s104d' };

/** ⚠️ EL try/catch NO ES DEFENSIVO POR COSTUMBRE, y su ausencia era un defecto
 *  medido: `curl` sale con código ≠ 0 cuando el DNS no resuelve o no hay red, y
 *  `execFileSync` LANZA. La primera versión de este archivo **se caía con un
 *  stack de Node** en vez de llegar a su propio `exit 2` — o sea que el estado
 *  «no pude medir», que es la razón de ser del control positivo, era
 *  inalcanzable justo cuando hacía falta. Un instrumento que se rompe en lugar
 *  de decir que no midió obliga a quien lo corre a interpretar un stack, y ahí
 *  cada uno interpreta lo que quiere. */
function medir(ruta) {
  try {
    const salida = execFileSync(
      'curl',
      ['-s', '-o', '/dev/null', '-L', '--max-time', '15', '-w', '%{http_code} %{num_redirects} %{url_effective}', BASE + ruta],
      { encoding: 'utf8' },
    ).trim().split(' ');
    return { code: Number(salida[0]), saltos: Number(salida[1]), final: salida.slice(2).join(' ') };
  } catch {
    // 0 no es un código HTTP: es «no hubo respuesta». Los controles lo tratan
    // como no-concluyente, jamás como 404.
    return { code: 0, saltos: 0, final: '(sin respuesta)' };
  }
}

console.log(`── verify-paginas-correo · ${BASE}\n`);

const pos = medir(CONTROL_POSITIVO.ruta);
console.log(`  ${pos.code === 200 ? '✓' : '✗'} ${CONTROL_POSITIVO.id} → ${pos.code}`);
if (pos.code !== 200) {
  console.log('\n⚠️  NO CONCLUYENTE — el control positivo no da 200: no se está midiendo el sitio.');
  console.log('   Esto NO es «faltan las páginas»: es que la medición no llegó.');
  process.exit(2);
}

const neg = medir(CONTROL_NEGATIVO.ruta);
console.log(`  ${neg.code === 404 ? '✓' : '✗'} ${CONTROL_NEGATIVO.id} → ${neg.code}`);
if (neg.code !== 404) {
  console.log(`\n⚠️  SIN VEREDICTO — una ruta inventada contesta ${neg.code}, no 404.`);
  console.log('   Este sitio no usa 404 para «no existe», así que un 404 en las nuestras');
  console.log('   no probaría nada y un 200 tampoco. Hay que elegir otro discriminador.');
  process.exit(3);
}

console.log('');
let faltan = 0;
for (const r of REQUERIDAS) {
  const m = medir(r.ruta);
  const ok = m.code === 200;
  if (!ok) faltan++;
  console.log(`  ${ok ? '✓' : '✗'} ${r.id} — ${m.code}${m.saltos ? `  (${m.saltos} salto/s → ${m.final})` : ''}`);
  console.log(`      ${BASE}${r.ruta}`);
}

console.log('');
if (faltan === 0) {
  console.log('✓ VERDE — las dos páginas responden. La condición de encendido firmada');
  console.log('  por el founder (voto (c), S104) queda CUMPLIDA y medida.');
  console.log('  Falta solo la llave: INVITACION_CORREO_VIVO=true.');
  process.exit(0);
}
console.log(`✗ ROJO — ${faltan} de ${REQUERIDAS.length} no responden. NO se enciende el correo.`);
console.log('  Los dos controles pasaron, así que este 404 significa «no existe»,');
console.log('  no «no pude medir». Las construye C en epetplace-web.');
console.log('');
console.log('  Recordatorio de por qué la baja pesa tanto: es UNA DE LAS CUATRO');
console.log('  condiciones del founder. Un correo frío cuyo «darse de baja» es un');
console.log('  404 es peor que no mandarlo.');
process.exit(1);
