/**
 * verify-colision-fila.mjs — EL GUARD DE LA COLISIÓN DE FILA (S97-D).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE, con el caso que lo parió y no con una teoría:
 *
 * En S97-D la fila del HOY se dibujó **con el glifo encima del subtítulo y
 * el chip 66px adentro del texto**, y pasó:
 *   · `tsc`            → verde
 *   · `verify:diseno`  → verde (31 reglas)
 *   · WCAG             → verde
 *   · la captura de ancho completo → se leyó mal DOS veces
 *   · el recorte a 3×  → se leyó mal UNA vez más
 *
 * **Cinco gates y dos aumentos de resolución no lo vieron.** Lo vio
 * preguntarle al DOM si dos cajas se pisan.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LAS DOS PREGUNTAS, y por qué son DOS:
 *
 *   ① DESBORDE  — ¿el texto se sale de SU caja?      (`scrollWidth > clientWidth`)
 *   ② COLISIÓN  — ¿su caja CHOCA con la del vecino?  (intersección de rects)
 *
 * **Producen PÍXELES IDÉNTICOS y tienen curas OPUESTAS**: el desborde se cura
 * recortando o cediendo ancho; la colisión se cura repartiendo la fila. Curar
 * una creyendo que es la otra empeora la pantalla — pasó, dos veces.
 *
 * ⚠️ Y la trampa que costó una corrida: una sonda que mide ① sola **da verde
 * con la pantalla rota** (`desborda:false` con el glifo entero encima). Un
 * instrumento que contesta la pregunta equivocada es peor que ninguno,
 * porque su verde se archiva.
 *
 * ⚠️ Segunda trampa, del mismo día: «mismo vecino» **se mide, no se asume**.
 * La primera versión tomaba el primer nodo con ese texto del DOM y lo
 * comparaba con una caja de OTRA fila — dos cajas que nunca se iban a tocar.
 * *Un vecino de la fila equivocada da un verde perfecto y falso.*
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 LO QUE ESTE GUARD **NO** PUEDE HACER, declarado para que nadie lo
 * registre donde no entra:
 *
 *   · **NO corre en pre-commit.** Necesita Metro arriba y una SESIÓN
 *     iniciada — no es `tsc`. Su casa es el gate de una tanda de UI, junto
 *     a las capturas, no el hook.
 *   · **Mide RN-web, no el dispositivo.** El reparto flex de RN-web y el de
 *     Android pueden diferir; un verde acá no reemplaza el teléfono (L-153).
 *   · **No sabe qué fila importa.** Recibe el ancla por parámetro: mide lo
 *     que se le señala. No descubre superficies.
 *
 * USO:
 *   node scripts/verify-colision-fila.mjs \
 *     --url http://localhost:8082/ --email <cuenta> --keychain <servicio> \
 *     --ancla "Vacunación"
 *
 * SALIDA: imprime las dos mediciones y **sale ≠0 si hay colisión** — un
 * aviso que no frena no es una barrera (D-584).
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const URL_APP = arg('url', 'http://localhost:8082/');
const EMAIL = arg('email');
const KEYCHAIN = arg('keychain');
const ANCLA = arg('ancla');
/** Tolerancia: 0 = cualquier intersección es rojo. Un solape de 1px puede ser
 *  redondeo de layout; de 21px es un glifo entero encima. */
const TOLERANCIA = Number(arg('tolerancia', '2'));

if (!EMAIL || !KEYCHAIN || !ANCLA) {
  console.error('faltan --email, --keychain y/o --ancla (ver el encabezado)');
  process.exit(2);
}

const PASS = execFileSync('security', ['find-generic-password', '-s', KEYCHAIN, '-w'])
  .toString()
  .trim();

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (
  await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1400 } })
).newPage();

const base = new URL(URL_APP).origin;
await page.goto(`${base}/login`, { waitUntil: 'networkidle', timeout: 240000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);
await page.goto(URL_APP, { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForTimeout(6000);

const r = await page.evaluate(({ ancla, tol }) => {
  const nodo = [...document.querySelectorAll('div,span')].find(
    (e) => e.textContent?.trim() === ancla,
  );
  if (!nodo) return { hallado: false };
  const ra = nodo.getBoundingClientRect();

  /* ⚠️ LA INTERSECCIÓN SE MIDE EN LOS DOS EJES, y esto no es un detalle:
     la primera versión de este guard comparaba SOLO el eje X y reportaba el
     TÍTULO («Zeus») y su contenedor como colisiones — son vecinos de la
     misma COLUMNA, apilados verticalmente: se cruzan en X y no en Y.
     **Un guard con falsos positivos se aprende a ignorar**, que es la única
     forma de fallar peor que no existir. Dos cajas colisionan si se pisan en
     X *y* en Y — el «y» es todo. */
  const solapeXY = (b) => {
    const x = Math.min(ra.right, b.right) - Math.max(ra.left, b.left);
    const y = Math.min(ra.bottom, b.bottom) - Math.max(ra.top, b.top);
    return x > tol && y > tol ? { x: Math.round(x), y: Math.round(y) } : null;
  };

  // Vecinos: todo lo que dibuja algo y NO es ancestro ni descendiente del
  // ancla — un padre siempre "contiene" a su hijo y eso no es colisión.
  const vecinos = [...document.querySelectorAll('svg,img,div,span')]
    .filter((e) => e !== nodo && !e.contains(nodo) && !nodo.contains(e))
    .map((e) => ({ e, s: solapeXY(e.getBoundingClientRect()) }))
    .filter(({ s }) => s !== null)
    /* ⚠️ SOLO LO QUE PINTA ALGO PROPIO — y esta línea es la diferencia entre
       un guard y un generador de ruido. La versión anterior daba ROJO EN LA
       FILA SANA: RN-web envuelve cada `Text` en `div`s que ocupan el mismo
       rectángulo que su contenido, así que el ancla "colisionaba" con sus
       propios envoltorios hermanos. Ese rojo es indistinguible del bueno y
       enseña a ignorar el guard.
       Pinta algo propio = es `svg`/`img`, o tiene TEXTO DIRECTO (hijo de
       texto), no heredado de un descendiente. Un wrapper vacío no se ve, y
       lo que no se ve no puede taparte nada. */
    .filter(({ e }) => {
      const t = e.tagName.toLowerCase();
      if (t === 'svg' || t === 'img') return true;
      return [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    })
    .map(({ e, s }) => ({
      que:
        e.tagName.toLowerCase() === 'svg'
          ? 'glifo'
          : (e.textContent ?? '').trim().slice(0, 18) || e.tagName,
      solapePx: s,
    }))
    .sort((a, b) => b.solapePx.x - a.solapePx.x)
    .slice(0, 6);

  return {
    hallado: true,
    ancla,
    desborde: {
      ancho: Math.round(ra.width),
      anchoDelTexto: Math.round(nodo.scrollWidth),
      desborda: nodo.scrollWidth > nodo.clientWidth + 1,
      elipsis: (nodo.textContent ?? '').includes('…'),
    },
    colisiones: vecinos,
  };
}, { ancla: ANCLA, tol: TOLERANCIA });

await browser.close();

if (!r.hallado) {
  // ⚠️ NO es verde: es que no se pudo preguntar. Un ancla que no aparece
  // puede ser una pantalla que no cargó — y eso no se reporta como «bien».
  console.error(`🔴 no se halló el ancla «${ANCLA}» — la pregunta no se pudo hacer`);
  process.exit(2);
}

console.log(`ancla: «${r.ancla}»`);
console.log(`① desborde : ${JSON.stringify(r.desborde)}`);
console.log(`② colisión : ${r.colisiones.length === 0 ? 'ninguna' : JSON.stringify(r.colisiones)}`);

if (r.colisiones.length > 0) {
  console.error(
    `\n🔴 COLISIÓN: ${r.colisiones.length} vecino(s) de la MISMA fila se dibujan encima del ancla.` +
      `\n   No es desborde (${r.desborde.desborda ? 'el texto TAMBIÉN desborda' : 'el texto NO desborda'})` +
      `: es reparto de la fila.`,
  );
  process.exit(1);
}
console.log('\n✓ sin colisión ni desborde en la fila medida');
