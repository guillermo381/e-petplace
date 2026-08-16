/**
 * verify-s99d-vitrina-sin-stock.mjs — §8.6ter · SE MUESTRA Y SE DICE.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 **ESTE GUARD NUNCA CORRIÓ, Y SE DICE ACÁ ARRIBA PARA QUE NADIE LO
 * CUENTE COMO VERDE.** No es que no se intentó: **`apps/cliente/node_modules`
 * no existe en este worktree** (medido), así que no se puede levantar su dev
 * server. La salida sería `pnpm install`, y **pnpm exige purgar el directorio
 * de módulos** — eso se lleva puesta la instalación de `apps/prestador`, de la
 * que dependen los otros once guards de esta pista. *Romper once instrumentos
 * para correr uno es una mala compra.*
 *
 * **Desbloqueo (de quien tenga el árbol sano):**
 *   `pnpm install && cd apps/cliente && npx expo start --web --port 8081`
 *   `node scripts/verify-s99d-vitrina-sin-stock.mjs --puerto 8081`
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── LA LEY QUE MIDE ────────────────────────────────────────────────────
 * `MODELO_DESPENSA` §8.6ter resuelve **POR SUJETO** un choque que parecía
 * contradicción: lo que **no aparece** en navegación es el producto que
 * **NADIE** vende (§4.4); el **vendedor que no lo tiene** es otro sujeto, y
 * ahí el producto **se muestra y se dice** — *«esconderlo deja al dueño sin
 * entender y puede haber otro vendedor que sí lo tenga.»*
 *
 * ── EL DISCRIMINADOR, Y POR QUÉ ESTE SUJETO ────────────────────────────
 * **«ACTIVE MIND 7+» tiene las DOS caras a la vez** (medido en la base el
 * 16-ago): 4 ofertas publicadas — **7.5 kg SIN stock** · 15 kg ×2 y 3 kg CON.
 * ⇒ una sola búsqueda renderiza el positivo y el negativo **en la misma
 * pantalla**, que es más fuerte que dos búsquedas separadas: prueba que la
 * línea sale **por oferta** y no por estado de la pantalla. *Un guard que
 * solo ve la cara que espera no distingue «funciona» de «siempre dice que
 * sí».*
 *
 * Se exige **exactamente 1** línea, no «al menos 1»: si apareciera en las
 * cuatro, el `!p.hay_stock` estaría invertido o leyendo `undefined`, y un
 * «al menos 1» daría verde sobre eso.
 *
 * ⚠️ **EL SUJETO PUEDE MOVERSE Y NO ES UN FALLO DEL GUARD:** el stock lo
 * derivan dos triggers sobre dato real; si el vendedor repone la 7.5 kg, el
 * conteo esperado cambia. Por eso el guard **lee la base primero** y deriva
 * de ahí lo que espera — jamás lleva el número escrito adentro (L-166).
 *
 * ⚠️ RN-web (L-153).
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8081')}`;
const TERMINO = arg('termino', 'ACTIVE MIND');
/** La voz exacta de `despensa.filaSinStock` (es). Si cambia el diccionario,
 *  este guard tiene que cambiar con él — a propósito: la voz ES el entregable. */
const VOZ = 'Ahora no está disponible.';

/** LO QUE LA BASE DICE — el esperado se DERIVA, jamás se escribe a mano. */
function esperado() {
  const sql = `select count(*) filter (where not o.hay_stock) as sin_stock,
       count(*) filter (where o.hay_stock)     as con_stock
from ofertas o
join producto_variantes pv on pv.id = o.variante_id
join productos p on p.id = pv.producto_id
where o.estado = 'publicada' and pv.activo and p.estado = 'activo'
  and p.nombre ilike '%${TERMINO}%';`;
  execFileSync('bash', ['-c', `cat > /tmp/_vitrina.sql <<'EOF'\n${sql}\nEOF`]);
  const out = execFileSync('bash', [
    '-c',
    'cd /Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace && npx supabase --experimental db query --linked --file /tmp/_vitrina.sql 2>/dev/null',
  ]).toString();
  const j = JSON.parse(out.slice(out.indexOf('{')));
  const r = j.rows[0];
  return { sin: Number(r.sin_stock), con: Number(r.con_stock) };
}

const exp = esperado();
console.log(`la base dice: «${TERMINO}» tiene ${exp.sin} sin stock y ${exp.con} con stock`);
if (exp.sin === 0 || exp.con === 0) {
  console.error(
    `\n🔴 EL SUJETO YA NO DISCRIMINA: hacen falta las DOS caras en la misma búsqueda.\n` +
      `   No es un fallo de la pantalla — es que el stock se movió. Elegí otro\n` +
      `   producto con --termino y volvé a correr.\n`,
  );
  process.exit(2);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const fallos = [];

try {
  await page.goto(`${BASE}/despensa`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(8000);

  /* 🔴 ¿ES LA APP QUE CREO? — LA TRAMPA DEL PUERTO (D-769), medida en vivo el
     16-ago: **8081 y 8082 respondían los dos**, con un shell de Expo
     BYTE-IDÉNTICO, y el de 8081 no era mío (este worktree no puede levantar el
     cliente). Un guard que fija puerto puede estar midiendo la app de otra
     pista y **reportar sobre el objeto equivocado** (L-235).
     ⚠️ Y LA PRIMERA VERSIÓN DE ESTE BLINDAJE NO ALCANZABA, con su medición:
     buscaba HOY y NEGOCIO en la barra… pero **en una ruta inexistente la app
     dibuja su 404 y NO dibuja la barra**, así que el discriminador no tenía
     qué mirar y dejaba pasar. La señal robusta es la ruta: si esta app no
     conoce `/despensa`, no es el cliente. *Un blindaje que solo funciona
     cuando la pantalla salió bien no blinda el caso que importa.* */
  const shell = await page.locator('body').innerText();
  if (/Unmatched Route|Page could not be found|no se encontró la página/i.test(shell)) {
    console.error(
      `\n🔴 PUERTO EQUIVOCADO: en ${BASE} corre una app SIN la ruta /despensa\n` +
        `   (el prestador, de este worktree o de otro — los puertos se comparten).\n` +
        `   El guard NO mide nada acá — no lo lea como «la vitrina está rota».\n`,
    );
    process.exit(2);
  }
  if (/\bHoy\b/.test(shell) && /\bNegocio\b/.test(shell)) {
    console.error(`\n🔴 PUERTO EQUIVOCADO: en ${BASE} corre el prestador, no el cliente.\n`);
    process.exit(2);
  }

  /* La búsqueda, que además esquiva el otro problema de esta pantalla: el
     lector NO tiene `.order()`, así que CUÁL página de 50 se ve es arbitraria
     (servido a A). Buscando, el conjunto es determinista. */
  const caja = page.getByPlaceholder(/busc/i).first();
  if ((await caja.count()) === 0) {
    fallos.push('no se encontró la caja de búsqueda de la vitrina');
  } else {
    await caja.fill(TERMINO);
    await page.waitForTimeout(6000);

    const cuerpo = await page.locator('body').innerText();
    const vistas = cuerpo.split(VOZ).length - 1;
    console.log(`en pantalla: ${vistas} línea(s) «${VOZ}»`);

    if (vistas !== exp.sin) {
      fallos.push(
        vistas === 0
          ? `la línea NO aparece y la base dice que ${exp.sin} oferta no tiene stock — la pantalla está callando`
          : `aparece ${vistas} vez/veces y debería aparecer ${exp.sin}: ${
              vistas > exp.sin ? 'se está diciendo sobre ofertas QUE SÍ tienen stock' : 'falta en alguna'
            }`,
      );
    }
    /* ⚠️ EL BRAZO QUE IMPIDE EL FALSO VERDE: que la fila sin stock siga
       TOCABLE. Apagarla sería un callejón (Ley 13) y ningún conteo de texto
       lo notaría. */
    const tocables = await page.getByRole('button').count();
    if (tocables < exp.sin + exp.con) {
      fallos.push(
        `solo ${tocables} fila(s) tocable(s) para ${exp.sin + exp.con} ofertas — la sin stock quedó apagada, y eso es un callejón`,
      );
    }
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
  `\n✅ VERDE — la oferta sin stock lo DICE, las que sí tienen callan, y la fila\n` +
    `   sigue tocable: se muestra y se dice, sin convertirse en callejón.\n`,
);
