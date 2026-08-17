/**
 * verify-s99d-nodos-escalera.mjs — LOS CUATRO GLIFOS DE NODO, EN PANTALLA.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * B entregó cuatro glifos **en masa y no en trazo** —*a 12 px un contorno no
 * dibuja, susurra*— y dejó el slot `icono` OPCIONAL en `PasoEscalera`. D los
 * monta en la ventana de pedidos.
 *
 * 🔴 **MAPEADOS POR LO QUE DIBUJAN, JAMÁS POR SU NOMBRE:** los nombres de B
 * describen la narrativa de la FAMILIA (confirmado · preparando · en camino ·
 * entregado); mis escalones son los del VENDEDOR. Lo que dibujan —medido en
 * la fuente— es **bolsa · caja abierta · flecha · visto**, y eso cae exacto
 * sobre el trabajo del local: *junté → empaqué → salió → llegó.*
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── QUÉ MIDE, Y POR QUÉ POR EL DIBUJO Y NO POR UN `data-testid` ────────
 * Cuenta los `d` de los SVG en el DOM. Un testid probaría que **algo** se
 * montó; el `d` prueba **qué se dibujó** — que es la pregunta, porque el modo
 * de falla que esto vino a cazar es *el glifo equivocado en el nodo
 * equivocado*, y eso se ve idéntico a un testid correcto.
 *
 * El esperado **se deriva de la base**, jamás se escribe a mano (L-166): cada
 * pedido VIVO con escalera dibuja sus cuatro nodos, y los terminales van
 * atenuados **sin escalera** (`pasos: []`), así que no cuentan.
 *
 * ⚠️ **EL BRAZO DE `retiro` NO TIENE SUJETO HOY** y se declara: en el camino
 * de retiro el tercer escalón es `facturado`, que **va SIN glifo a propósito**
 * (la flecha ahí diría «va en camino» sobre un pedido que espera en el
 * mostrador). Con 0 pedidos de retiro vivos, el guard lo dice en vez de
 * callarlo. *Un brazo sin sujeto que no se declara se lee como probado.*
 *
 * ⚠️ RN-web (L-153). Y la trampa del puerto (D-769) blindada abajo.
 *
 * Uso:  node scripts/verify-s99d-nodos-escalera.mjs [--puerto 8082]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8082')}`;
const CUENTA = arg('cuenta', 'duenodes');
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

/** La firma de cada glifo: su primer `d`, copiado de la fuente de B. */
const FIRMA = {
  nodoConfirmado: 'M6.2 8.6h11.6', // la bolsa
  nodoPreparando: 'M5.1 11.2h13.8', // la caja abierta
  nodoEnCamino: 'M13.1 5.2 20.4 12', // la flecha
  nodoEntregado: 'M9.7 18.6 3.9 12.8', // el visto
};

/** LO QUE LA BASE DICE — el esperado se DERIVA. */
function esperado() {
  const sql = `select count(*) filter (where not v.es_terminal and p.metodo_entrega = 'despacho') as vivos_despacho,
       count(*) filter (where not v.es_terminal and p.metodo_entrega = 'retiro')   as vivos_retiro
from v_pedidos_narrativa v
join pedidos p on p.id = v.pedido_id
join cuentas_comerciales cc on cc.id = v.cuenta_comercial_id
join auth.users u on u.id = cc.owner_profile_id
where u.email = 'guillo381+${CUENTA}@gmail.com';`;
  execFileSync('bash', ['-c', `cat > /tmp/_nodos.sql <<'EOF'\n${sql}\nEOF`]);
  const out = execFileSync('bash', [
    '-c',
    'cd /Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace && npx supabase --experimental db query --linked --file /tmp/_nodos.sql 2>/dev/null',
  ]).toString();
  const r = JSON.parse(out.slice(out.indexOf('{'))).rows[0];
  return { despacho: Number(r.vivos_despacho), retiro: Number(r.vivos_retiro) };
}

const exp = esperado();
console.log(`la base dice: ${exp.despacho} vivo(s) de despacho · ${exp.retiro} de retiro`);
if (exp.despacho === 0) {
  console.error(`\n🔴 SIN SUJETO: 0 pedidos vivos de despacho — el guard no mide nada.\n`);
  process.exit(2);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const fallos = [];

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 400000 });
  /* 🔴 LA TRAMPA DEL PUERTO (D-769), medida en vivo: 8081 y 8082 respondían
     los dos con un shell de Expo byte-idéntico, y el de 8081 era el prestador
     de OTRA pista. Un guard que fija puerto puede medir la app de otro. */
  if (/Unmatched Route|Page could not be found/i.test(await page.locator('body').innerText())) {
    console.error(`\n🔴 PUERTO EQUIVOCADO: ${BASE} no sirve esta app.\n`);
    process.exit(2);
  }
  await page.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${CUENTA}@gmail.com`);
  await page.locator('input[type="password"]').fill(CLAVE);
  await page.getByText('Entrar', { exact: true }).click();
  await page.waitForTimeout(20000);

  if (page.url().includes('/login')) {
    console.error(`\n🔴 NO SE PUDO ENTRAR — el guard NO mide nada; no lo lea como «no hay glifos».\n`);
    process.exit(2);
  }

  const tarjetas = await page.locator('[aria-label^="Ver el pedido"]').count();
  console.log(`tarjetas en pantalla: ${tarjetas}`);

  const ds = await page.evaluate(() =>
    [...document.querySelectorAll('path[d]')].map((p) => p.getAttribute('d') ?? ''),
  );

  for (const [nombre, firma] of Object.entries(FIRMA)) {
    const n = ds.filter((d) => d.startsWith(firma)).length;
    const ok = n === exp.despacho;
    console.log(`${ok ? '✅' : '🔴'} ${nombre.padEnd(16)} ${n} de ${exp.despacho} esperado(s)`);
    if (!ok) {
      fallos.push(
        n === 0
          ? `${nombre}: NO se dibuja — el slot quedó sin montar (o el nombre no existe en el registry)`
          : `${nombre}: se dibuja ${n} vez/veces y se esperaban ${exp.despacho} — el glifo está en el nodo equivocado o se repite`,
      );
    }
  }

  if (exp.retiro === 0) {
    console.log(
      `\n⚠️  BRAZO SIN SUJETO: 0 pedidos de RETIRO vivos ⇒ no se pudo verificar que\n` +
        `   \`facturado\` va SIN glifo (decisión: la flecha ahí mentiría). Se declara.`,
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
console.log(
  `\n✅ VERDE — los cuatro nodos dibujan su glifo, uno por pedido vivo de despacho:\n` +
    `   bolsa → caja → flecha → visto. La escalera dejó de ser cuatro puntos iguales.\n`,
);
