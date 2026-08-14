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
/** ⭐ S98-D — EL DÍA DE LA RUEDA. El guard medía SIEMPRE donde aterrizaba, y
 *  eso alcanzaba mientras todo lo medible viviera hoy. La fila de DESPACHO
 *  rompió el supuesto: su pedido vive por PROMESA DE ENTREGA, que puede caer
 *  mañana — y la línea filtra por día, así que el ancla sencillamente no
 *  existe en el DOM de hoy. Sin esto el guard sale con «no se halló el
 *  ancla», que es su código de *no se pudo preguntar* — correcto, y aun así
 *  indistinguible de una pantalla caída si uno no sabe por qué.
 *  Se extiende el guard EXISTENTE en vez de escribir un segundo instrumento:
 *  dos que contestan la misma pregunta con distinta geometría divergen. */
const DIA = arg('dia');
/** ⭐ S98-D — MODO BARRIDO: sin `--ancla`, mide TODAS las filas cargadas de
 *  la pantalla. Es lo que convierte al guard de un metro en un sistema que
 *  avisa (condición de muerte de la deuda del overflow de B). */
const BARRER = process.argv.includes('--barrer');
/** Pisos mínimos para considerar una fila «cargada». 2 = título + banda. */
const MIN_PISOS = Number(arg('min-pisos', '2'));
/** Tolerancia: 0 = cualquier intersección es rojo. Un solape de 1px puede ser
 *  redondeo de layout; de 21px es un glifo entero encima. */
const TOLERANCIA = Number(arg('tolerancia', '2'));

if (!EMAIL || !KEYCHAIN || (!ANCLA && !BARRER)) {
  console.error('faltan --email, --keychain y (--ancla <texto> | --barrer) — ver el encabezado');
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

if (DIA) {
  // La rueda rotula por número de día. Si el chip no está, se DICE y se
  // sigue midiendo donde se aterrizó: callarlo dejaría un verde tomado en
  // el día equivocado, que es la peor clase de verde.
  const chip = page.getByText(String(DIA), { exact: true }).first();
  if (await chip.count()) {
    await chip.click();
    await page.waitForTimeout(3500);
    console.log(`· rueda movida al día ${DIA}`);
  } else {
    console.error(`⚠️  el día ${DIA} NO está en la rueda — se mide el día por defecto`);
  }
}

const r = await page.evaluate(({ ancla, tol, barrer, minPisos }) => {
  /* ⭐ S98-D — LA MEDICIÓN SE EXTRAJO A UNA FUNCIÓN, y ése es todo el punto
     de la generalización: el modo ANCLA y el modo BARRIDO llaman a LA MISMA.
     *Dos instrumentos que contestan la misma pregunta con distinta geometría
     van a divergir* — y un barrido que midiera «parecido» al ancla sería
     exactamente eso, con el agravante de que su verde se archiva igual. */
  /* 🔴 EL VECINDARIO ES EL DOCUMENTO ENTERO, y esto se aprendió PRODUCIENDO
     EL ROJO en S98-D. La primera versión del barrido acotaba la búsqueda de
     vecinos a la fila —argumentando que así la «segunda trampa» del
     encabezado (comparar contra un vecino de OTRA fila) no podía ocurrir—.
     **Dio VERDE con un bloque de texto dibujado ENCIMA de la fila entera**:
     el overlay era HERMANO de `[role="button"]`, no descendiente, y quedaba
     fuera de la raíz acotada.
     *Lo que tapa una fila casi nunca es de la fila* — el defecto que parió
     este guard era un glifo que se dibujaba encima, y una capa absoluta
     puede venir de cualquier ancestro. Acotar el vecindario cerraba
     exactamente el caso que hay que cazar.
     ⇒ La trampa vieja NO se resuelve achicando el vecindario: se resuelve
     eligiendo bien el NODO ANCLA (que es lo que el barrido hace por
     construcción, piso por piso). */
  const medir = (nodo, raiz, tol) => {
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
  const vecinos = [...raiz.querySelectorAll('svg,img,div,span')]
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
    /* 🔴 EL TELÓN DE FONDO NO ES UN VECINO — tercera trampa, medida al abrir
       el vecindario al documento en S98-D. `MarcaDeAgua` es un SVG de
       328×225 que envuelve filas enteras: con intersección de rects daba
       COLISIÓN en tres filas sanas de «Prepará tu espacio» con solape de
       294px. *Un guard con falsos positivos se aprende a ignorar*, y éste
       habría gritado en cada corrida sobre una pantalla correcta.

       LAS DOS SEÑALES, y se exigen LAS DOS porque cada una sola miente:
        · ES UN TELÓN (≥4× el área del ancla) — una capa, no un hermano.
          Un glifo de 24px encima de un texto de 240 no llega ni cerca:
          sigue siendo rojo, así que **el defecto que parió este guard no
          se pierde**. Un overlay del tamaño del texto tampoco.
        · ESTÁ DETRÁS, y eso lo contesta el navegador y no yo:
          `elementFromPoint` en el centro del ancla devuelve el ancla, no
          al candidato.
       Si alguna falla, se REPORTA: ante la duda, un guard grita.

       ⚠️ HUBO UNA TERCERA CONDICIÓN —«que contenga al ancla entera»— y se
       CAYÓ MIDIENDO: la marca de agua recorta el ancla por DOS PÍXELES
       arriba, así que «contiene» daba falso y dos filas sanas seguían en
       rojo. *Una condición que se rompe por 2px no describe la diferencia
       entre un fondo y algo encima* — la describen el tamaño y el orden. */
    .filter(({ e }) => {
      const b = e.getBoundingClientRect();
      const telon = b.width * b.height >= 4 * Math.max(1, ra.width * ra.height);
      const enCentro = document.elementFromPoint(ra.left + ra.width / 2, ra.top + ra.height / 2);
      const detras = enCentro !== e && !e.contains(enCentro);
      return !(telon && detras);
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
      texto: (nodo.textContent ?? '').trim().slice(0, 34),
      desborde: {
        ancho: Math.round(ra.width),
        anchoDelTexto: Math.round(nodo.scrollWidth),
        desborda: nodo.scrollWidth > nodo.clientWidth + 1,
        elipsis: (nodo.textContent ?? '').includes('…'),
      },
      colisiones: vecinos,
    };
  };

  /** Los pisos de una fila = sus nodos con TEXTO DIRECTO. Mismo criterio que
   *  el filtro de vecinos usa para decidir qué «pinta algo propio»: un
   *  wrapper vacío no es un piso. */
  const pisosDe = (fila) =>
    [...fila.querySelectorAll('div,span')].filter((e) =>
      [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0),
    );

  if (!barrer) {
    const nodo = [...document.querySelectorAll('div,span')].find(
      (e) => e.textContent?.trim() === ancla,
    );
    if (!nodo) return { modo: 'ancla', hallado: false };
    return { modo: 'ancla', hallado: true, ancla, ...medir(nodo, document, tol) };
  }

  /* ⭐ EL BARRIDO — la condición de muerte de la deuda del overflow: 157
     montajes protegidos por un recorte que PUEDE esconder. Un recorte que
     esconde no falla: deja de mostrar, y eso no tiene stack trace. Barrer
     convierte al guard de «medí esta fila» en «avisá si alguna se rompió».

     ⚠️ QUÉ ES UNA FILA CARGADA, y por qué el umbral es 2: una fila de UN
     solo piso no puede tener el defecto que este guard existe para cazar
     (un piso encima de otro). El barrido las salta A PROPÓSITO — medirlas
     agregaría volumen sin agregar cobertura, y un guard ruidoso se aprende
     a ignorar.

     ⚠️ Y EL VECINDARIO SE ACOTA A LA FILA: acá la «segunda trampa» del
     encabezado (comparar contra un vecino de OTRA fila) deja de poder
     ocurrir por construcción — la raíz de la búsqueda es la fila misma. */
  const filas = [...document.querySelectorAll('[role="button"]')].filter((f) => {
    const c = f.getBoundingClientRect();
    return c.height > 0 && c.width > 0 && pisosDe(f).length >= minPisos;
  });
  return {
    modo: 'barrido',
    hallado: filas.length > 0,
    filas: filas.map((f) => ({
      fila: (f.textContent ?? '').trim().slice(0, 40),
      pisos: pisosDe(f).map((p) => medir(p, document, tol)),
    })),
  };
}, { ancla: ANCLA, tol: TOLERANCIA, barrer: BARRER, minPisos: MIN_PISOS });

await browser.close();

if (!r.hallado) {
  // ⚠️ NO es verde: es que no se pudo preguntar. Un ancla que no aparece
  // puede ser una pantalla que no cargó — y eso no se reporta como «bien».
  console.error(
    r.modo === 'barrido'
      ? '🔴 el barrido no halló NINGUNA fila cargada — la pregunta no se pudo hacer'
      : `🔴 no se halló el ancla «${ANCLA}» — la pregunta no se pudo hacer`,
  );
  process.exit(2);
}

if (r.modo === 'ancla') {
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
} else {
  let rojos = 0;
  let pisos = 0;
  for (const f of r.filas) {
    const malos = f.pisos.filter((p) => p.colisiones.length > 0 || p.desborde.desborda);
    pisos += f.pisos.length;
    const marca = malos.length === 0 ? '✓' : '🔴';
    console.log(`${marca} «${f.fila}» — ${f.pisos.length} piso(s)`);
    for (const p of malos) {
      rojos++;
      console.log(
        `    · «${p.texto}» desborda=${p.desborde.desborda}` +
          ` colisión=${p.colisiones.length === 0 ? 'ninguna' : JSON.stringify(p.colisiones)}`,
      );
    }
  }
  console.log(`\nbarrido: ${r.filas.length} fila(s) cargada(s) · ${pisos} piso(s) medido(s)`);
  if (rojos > 0) {
    console.error(`\n🔴 ${rojos} piso(s) con desborde o colisión — ver arriba.`);
    process.exit(1);
  }
  console.log('✓ ninguna fila cargada se pisa ni se desborda');
}
