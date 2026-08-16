/**
 * verify-s99d-orden-fifo.mjs — EL ORDEN DE LA COLA (L3, firma del Gate 1).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * **FIFO por hora de CONFIRMACIÓN DEL PAGO**, con el vendedor pudiendo
 * reordenar y la promesa como techo. Las cuatro bandas: sin compromiso
 * preside · «se rompió» segunda · urgente · los días.
 *
 * 🔴 **ESTE GUARD NO RE-DERIVA EL ORDEN: VERIFICA LA PROPIEDAD.** Si
 * calculara el orden esperado en JS estaría **escribiendo la regla dos
 * veces** — y el día que la pieza cambie, el guard cambiaría con ella y
 * seguiría diciendo verde sobre lo que sea que haga. *Un test que
 * re-implementa lo que prueba no prueba nada: se pone de acuerdo consigo
 * mismo.*
 *
 * Lo que hace: la BASE da los HECHOS (qué hora de pago tiene cada pedido),
 * la PANTALLA da el ORDEN, y se comprueba el invariante:
 *
 *   > dentro de la misma banda, `pago_confirmado_en` **no decrece**, y los
 *   > que no tienen pago confirmado van **después** de todos los que sí.
 *
 * *La base no sabe el orden y la pantalla no sabe las horas: por eso el
 * cruce vale.*
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── LA POBLACIÓN: el vendedor puro, y por qué él ───────────────────────
 * Su HOY monta la ventana **sin día** (todos sus pedidos vivos), que es la
 * lista más larga y por lo tanto la que puede desordenarse de verdad. Una
 * ventana de un solo día suele traer uno o dos pedidos: *un orden de un
 * elemento siempre está bien ordenado, y eso no es un verde — es un vacío.*
 * Por eso el guard **exige al menos DOS con pago** y falla si no los hay.
 *
 * ⚠️ Los `movido_al_frente_en` quedan FUERA del invariante del FIFO a
 * propósito: son la excepción firmada (el vendedor reordena) y su ley es
 * otra. Se cuentan y se declaran; si hubiera alguno, el guard lo dice para
 * que nadie lea su posición como un fallo del FIFO.
 *
 * ⚠️ RN-web (L-153).
 *
 * Uso:  node scripts/verify-s99d-orden-fifo.mjs [--puerto 8082]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8082')}`;
/** La población se elige por argumento: la lista larga es la que puede
 *  desordenarse de verdad. Default: el vendedor puro con más pedidos vivos. */
const CUENTA = arg('cuenta', 'vendedorpuro');
const CLAVE = execFileSync('security', [
  'find-generic-password',
  '-a',
  'siembra',
  '-s',
  'epetplace-siembra-s97',
  '-w',
])
  .toString()
  .trim();

/** LOS HECHOS, de la base — jamás el orden: solo qué hora tiene cada uno. */
function hechos() {
  /* 🔴 SIN FILTRO DE CUENTA, y es una cura de mi propio supuesto: la
     primera versión filtraba por el nombre del negocio que YO creía de esta
     cuenta, y era otro — el guard leyó 0 pedidos y casi lo reporto como
     defecto del orden. El `numero_orden` es único: **se traen todos y el
     cruce lo hace la clave**, sin que el guard tenga que saber de quién es
     qué. *Un instrumento que necesita adivinar el sujeto puede equivocarse
     de sujeto* (L-235, y van varias en esta tanda). */
  const sql = `select v.numero_orden, v.pago_confirmado_en, v.movido_al_frente_en, v.es_terminal
from v_pedidos_narrativa v;`;
  execFileSync('bash', ['-c', `cat > /tmp/_fifo.sql <<'EOF'\n${sql}\nEOF`]);
  const out = execFileSync('bash', [
    '-c',
    'cd /Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace && npx supabase --experimental db query --linked --file /tmp/_fifo.sql 2>/dev/null',
  ]).toString();
  const j = JSON.parse(out.slice(out.indexOf('{')));
  const m = new Map();
  for (const r of j.rows) {
    m.set(r.numero_orden, {
      pago: r.pago_confirmado_en ?? null,
      movido: r.movido_al_frente_en ?? null,
      terminal: r.es_terminal === true,
    });
  }
  return m;
}

const datos = hechos();
console.log(`hechos de la base: ${datos.size} pedido(s) de la cuenta`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const fallos = [];

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${CUENTA}@gmail.com`);
  await page.locator('input[type="password"]').fill(CLAVE);
  await page.getByText('Entrar', { exact: true }).click();
  await page.waitForTimeout(15000);

  /* 🔴 ¿ENTRÓ? — y este chequeo nació de que el guard casi me miente.
     Con una cuenta cuya clave no tengo, el login rebota y la pantalla queda
     en `/login`… y el conteo de tarjetas da CERO. El guard entonces reportaba
     *«solo 0 pedidos con pago — no probó nada»*, que **es verdad y esconde la
     causa**: no es que falten datos, es que no entré. *Un instrumento que
     confunde “no hay” con “no pude ver” manda a buscar el defecto al lado
     equivocado* — y esta casa ya tiene ese error con nombre. */
  if (page.url().includes('/login')) {
    console.error(
      `\n🔴 NO SE PUDO ENTRAR con guillo381+${CUENTA}: la clave de siembra no es de esta cuenta.\n` +
        `   FRENO de la casa: ninguna pista cambia la clave de una cuenta que no creó.\n` +
        `   El guard NO mide nada acá — no lo lea como «no hay datos».\n`,
    );
    process.exit(2);
  }

  /* EL ORDEN, de la pantalla: el CTA de cada tarjeta lleva su número. Se lee
     de los `accessibilityLabel`, que es donde vive completo y sin truncar. */
  const etiquetas = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label') ?? ''),
  );
  const orden = etiquetas
    .map((l) => l.match(/Ver el pedido (\S+)/)?.[1])
    .filter((x) => typeof x === 'string');

  console.log(`orden en pantalla: ${orden.length} tarjeta(s)`);
  orden.forEach((n, i) => {
    const d = datos.get(n);
    console.log(`  ${String(i + 1).padStart(2)}. ${n}  pago=${d?.pago ?? '—'}${d?.movido ? '  ⇱ movido' : ''}`);
  });

  /* Los TERMINALES se pintan aparte y al final por diseño (§2.1: lo entregado
     se apaga y baja): quedan fuera del invariante, que es del trabajo vivo. */
  const vivos = orden.filter((n) => datos.get(n) && !datos.get(n).terminal);
  const movidos = vivos.filter((n) => datos.get(n).movido !== null);
  if (movidos.length > 0) {
    console.log(`\n⇱ ${movidos.length} movido(s) a mano — fuera del invariante FIFO (excepción firmada).`);
  }
  const fifo = vivos.filter((n) => datos.get(n).movido === null);
  const conPago = fifo.filter((n) => datos.get(n).pago !== null);

  if (conPago.length < 2) {
    fallos.push(
      `solo ${conPago.length} pedido(s) vivos con pago confirmado — un orden de un elemento SIEMPRE está bien ordenado: el guard no probó nada`,
    );
  }

  // ① el FIFO no decrece
  for (let i = 1; i < conPago.length; i++) {
    const a = datos.get(conPago[i - 1]).pago;
    const b = datos.get(conPago[i]).pago;
    if (a > b) {
      fallos.push(`FIFO roto: ${conPago[i - 1]} (${a}) va antes de ${conPago[i]} (${b})`);
    }
  }
  // ② el que no tiene pago va DESPUÉS de todos los que sí
  const idxUltimoConPago = fifo.map((n) => datos.get(n).pago !== null).lastIndexOf(true);
  const idxPrimeroSinPago = fifo.map((n) => datos.get(n).pago === null).indexOf(true);
  if (idxPrimeroSinPago !== -1 && idxPrimeroSinPago < idxUltimoConPago) {
    fallos.push(
      `un pedido SIN pago confirmado quedó antes de uno con pago — la firma dice que sin pago NO entra a la cola`,
    );
  }
} catch (e) {
  fallos.push(`EXCEPCIÓN — ${String(e).split('\n')[0].slice(0, 130)}`);
} finally {
  await ctx.close();
  await browser.close();
}

if (fallos.length > 0) {
  console.error(`\n🔴 ROJO — ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`   · ${f}`);
  process.exit(1);
}
console.log(`\n✅ VERDE — el orden de la pantalla respeta el FIFO por hora de pago,\n   y lo que no tiene pago confirmado no se cuela en la cola.\n`);
