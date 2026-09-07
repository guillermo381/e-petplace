/**
 * ⭐ **EL PERFIL COMO TABLERO** (S113-C · 2.2 · C1) — los tres rojos.
 *
 * 🔴 **Se mide el ORDEN por la caja, no el texto por la pantalla.** Otras
 * pantallas quedan montadas con caja real en RN-web, así que un `innerText`
 * sirve para saber qué hay y **jamás** para saber en qué orden está: la
 * posición vertical de cada rótulo es el único dato que lo dice.
 *
 * ⚠️ **El piso de chevrons.** Los gráficos se cuentan por `<svg>`, y la
 * pantalla tiene chevrons que también son svg. Por eso se mide **la misma
 * pantalla con y sin datos**: lo que importa es la DIFERENCIA, no el número.
 */
import { chromium } from 'playwright-core';

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const di = (s) => console.log(s);

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 150)));

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(18000);
di(`cuenta: ${CORREO}\n`);

/* Los rótulos de sección, con su Y. **Del DOM, no del innerText.** */
const ROTULOS = ['Su salud', 'Conociéndolo', 'Su historia', 'Identidad'];

async function verPerfil(nombre) {
  await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  const tarj = page.getByRole('button', { name: new RegExp(`^(Ver a )?${nombre}`) }).first();
  if ((await tarj.count()) === 0) return null;
  await tarj.click();
  await page.waitForTimeout(7000);
  return await page.evaluate((rots) => {
    const txt = document.body.innerText;
    const secciones = [];
    /* 🔴 **`children.length === 0` dejaba fuera la mitad de los rótulos.**
       `RotuloSeccion` y `Texto variante="seccion"` anidan un `<div>` adentro,
       así que el nodo cuyo texto coincide TIENE hijos. Se recorre TODO y se
       toma **el más profundo** que coincida: el que de verdad pinta la línea.
       *El instrumento medía una convención de markup, no el rótulo.* */
    for (const e of document.querySelectorAll('*')) {
      const t = (e.textContent ?? '').trim();
      if (!rots.includes(t)) continue;
      const r = e.getBoundingClientRect();
      if (r.height <= 0) continue;
      const y = Math.round(r.y + window.scrollY);
      /* 🔴 **«Conociéndolo» aparece DOS veces**: es la etiqueta de la cuarta
         acción (arriba, dentro de un botón) y el rótulo de su sección. Lo
         escribí en el censo de esta misma tanda y volví a caer: el arnés tomaba
         la primera aparición y reportaba la sección arriba del tablero.
         *Se descarta lo que vive dentro de un control: un rótulo de sección no
         es tocable.* */
      if (e.closest('[role="button"]') !== null) continue;
      const ya = secciones.find((s) => s.rotulo === t);
      if (ya === undefined) secciones.push({ rotulo: t, y });
    }
    return {
      secciones: secciones.sort((a, b) => a.y - b.y).map((s) => s.rotulo),
      sinRegistro: (txt.match(/Sin registro/g) ?? []).length,
      svg: document.querySelectorAll('svg').length,
      hoy: /Su próxima cita|Una vacuna que se acerca|Toca desparasitar|Algo para mirar|Para conocerlo mejor/.test(txt),
      conociendolo: /Sabemos \d+ de \d+/.test(txt),
      tablero: /Su salud/.test(txt),
      identidadPlegada: /Ver \d+ más/.test(txt),
      /* ⭐ **2.2.1** — lo que este pulido vino a cerrar. */
      seccionPapeles: /Identidad y papeles/.test(txt),
      /* Las invitaciones al «cuéntanos»: **tiene que haber UNA**. Se cuentan
         por su etiqueta exacta, y se mide sobre la pantalla entera. */
      /* 🔴 **Se cuenta la INVITACIÓN, no la palabra.** La primera versión
         buscaba «cuéntanos» y daba 0 en Thor: la invitación decía
         «Conociéndolo». *Un arnés que busca una palabra mide el diccionario,
         no la pantalla.* Ahora busca el acto: cualquier texto que invite a
         contar. */
      invitaciones: (txt.match(/Cuéntanos algo de|Tell us something about/g) ?? []).length,
      /* Dónde están, por su Y: para saber cuál sobra sin adivinar. */
      dondeInvita: (() => {
        const out = [];
        for (const e of document.querySelectorAll('div,span')) {
          const t = (e.textContent ?? '').trim();
          if (!/^Cuéntanos algo de/.test(t) || t.length > 60) continue;
          const r = e.getBoundingClientRect();
          if (r.height === 0) continue;
          const y = Math.round(r.y + window.scrollY);
          if (!out.some((o) => Math.abs(o.y - y) < 4)) {
            /* La cadena de ancestros con role, para saber DE QUIÉN cuelga. */
            const cadena = [];
            let n = e;
            for (let i = 0; i < 12 && n !== null; i += 1) {
              const rol = n.getAttribute?.('role') ?? '';
              const al = (n.getAttribute?.('aria-label') ?? '').slice(0, 24);
              if (rol !== '') cadena.push(`${rol}${al ? '(' + al + ')' : ''}`);
              n = n.parentElement;
            }
            out.push({ y, t: t.slice(0, 34), cadena: cadena.join(' < ') });
          }
        }
        return out.sort((a, b) => a.y - b.y);
      })(),
      preguntaRaza: /conocer más sobre el/.test(txt),
      /* 🔴 **Fuera de caja y truncado.** Un `…` en un texto NO es truncado del
         layout: RN lo pone a propósito. Lo que se mide es la CAJA: un nodo cuyo
         ancho de contenido supera el de su contenedor. */
      desbordes: (() => {
        const out = [];
        for (const e of document.querySelectorAll('div,span')) {
          const r = e.getBoundingClientRect();
          if (r.width === 0) continue;
          /* 🔴 **Sólo lo que TIENE TEXTO.** La primera versión contaba
             cualquier `div` y daba 7 rojos en las tres mascotas —incluida la
             memorial, que casi no tiene contenido—: eran capas de fondo y
             gradientes, que desbordan a propósito porque son pintura.
             *«Nada fuera de caja» es una pregunta sobre lo que se lee, no sobre
             la superficie que lo pinta.* */
          const txtN = (e.textContent ?? '').trim();
          if (txtN === '') continue;
          if (r.right > 421 || r.left < -1) {
            out.push({
              t: (e.textContent ?? '').trim().slice(0, 40),
              x: Math.round(r.left),
              der: Math.round(r.right),
              w: Math.round(r.width),
              /* ¿scrollea a propósito? Una tira horizontal DEBE desbordar. */
              scroll: getComputedStyle(e).overflowX,
              padre: getComputedStyle(e.parentElement ?? e).overflowX,
            });
          }
        }
        return out;
      })(),
      /* 🔴 **TRUNCADO REAL**: un nodo cuyo contenido no entra en su caja. El
         `…` del texto no sirve —RN lo pone a propósito—; lo que lo dice es
         `scrollWidth > clientWidth` sobre un nodo que además lo esconde. */
      truncados: (() => {
        const out = [];
        for (const e of document.querySelectorAll('div,span')) {
          const st = getComputedStyle(e);
          if (st.textOverflow !== 'ellipsis' && st.overflow !== 'hidden') continue;
          if (e.scrollWidth <= e.clientWidth + 1) continue;
          /* 🔴 **UN TEXTO TRUNCADO CON SU REVELADOR AL LADO NO ES UN DEFECTO.**
             La franja de seguridad de Thor daba rojo —«Alérgico a pollo ·
             Alérgico a pole…» 245→298— y **la captura lo desmintió**: al lado
             dice «Ver 13 ⌄». *La pieza trunca a propósito y ofrece abrir.*
             Y de paso: el «94062» que mi reporte leía en esa cadena **no está
             en la pantalla** — era `textContent` pegando nodos vecinos.
             ⇒ Se descarta el nodo cuyo hermano ofrece revelarlo. */
          {
            /* El revelador puede vivir dos o tres niveles arriba —la franja
               lo tiene fuera de la caja del texto—, así que se sube hasta
               encontrarlo o hasta salir de la tarjeta. */
            let n2 = e.parentElement;
            let tieneRevelador = false;
            for (let i = 0; i < 4 && n2 !== null; i += 1) {
              if (/Ver \d+|Ver todo|See \d+/.test(n2.textContent ?? '')) { tieneRevelador = true; break; }
              n2 = n2.parentElement;
            }
            if (tieneRevelador) continue;
          }
          const t = (e.textContent ?? '').trim();
          if (t === '') continue;
          /* 🔴 **Un contenedor cuyo desborde lo pone un nodo SIN TEXTO no es un
             truncado de contenido.** Daba rojo en Thor y Lolo con 420→490: el
             culpable era la capa del degradado del techo, que va **a sangre a
             propósito** y su `overflow:hidden` es justamente lo que la recorta.
             *Medir «algo desborda» sin mirar QUÉ desborda convierte una
             decisión de diseño en un defecto.* */
          {
            const cajaE = e.getBoundingClientRect();
            let hijoAncho = null;
            for (const h of e.children) {
              const rh = h.getBoundingClientRect();
              if (hijoAncho === null || rh.right > hijoAncho.right) hijoAncho = rh, (hijoAncho.txt = (h.textContent ?? '').trim());
            }
            if (hijoAncho !== null && hijoAncho.txt === '' && hijoAncho.right - cajaE.left > e.clientWidth) continue;
          }
          /* De quién cuelga, y si él o su padre scrollean: **un contenedor
             que scrollea a propósito no es un truncado**. */
          const st2 = getComputedStyle(e);
          const pa = e.parentElement;
          out.push({
            t: t.slice(0, 46),
            w: e.clientWidth,
            necesita: e.scrollWidth,
            ox: st2.overflowX,
            hijos: e.children.length,
            padreOx: pa === null ? '' : getComputedStyle(pa).overflowX,
            /* 🔴 **Qué hijo lo desborda.** Sin esto el reporte dice «algo mide
               490» y manda a buscar a ciegas; con esto nombra la pieza. */
            culpable: (() => {
              let peor = null;
              for (const h of e.children) {
                const rh = h.getBoundingClientRect();
                const anchoR = rh.right - e.getBoundingClientRect().left;
                if (peor === null || anchoR > peor.der) {
                  peor = { der: Math.round(anchoR), t: (h.textContent ?? '').trim().slice(0, 34) };
                }
              }
              return peor;
            })(),
          });
        }
        return out;
      })(),
      /* ⭐ **LOS DIEZ DEL OJO DEL FOUNDER** (2.2.2). */
      vacunasDice: (txt.match(/\d+ de \d+ al día/) ?? [''])[0],
      diceProximaPasada: /próxima el \d+ \w+ 202[0-4]/.test(txt),
      diceVencida: /vencida desde/.test(txt),
      /* Alérgenos repetidos: se cuentan los nombres, no las apariciones. */
      alergenos: (() => {
        const m = txt.match(/Alérgico a ([^·\n]+)/g) ?? [];
        const nombres = m.map((x) => x.replace(/^Alérgico a /, '').trim().toLowerCase());
        return { total: nombres.length, distintos: new Set(nombres).size };
      })(),
      /* La tarjeta Citas: qué servicio nombra. */
      citaServicio: (() => {
        for (const e of document.querySelectorAll('div,span')) {
          if ((e.textContent ?? '').trim() !== 'Citas') continue;
          const caja = e.closest('div')?.parentElement;
          const t2 = (caja?.textContent ?? '').replace('Citas', '').trim();
          if (t2 !== '') return t2.slice(0, 44);
        }
        return '(no la hallé)';
      })(),
      diceConociendolo: (txt.match(/Conociéndolo/g) ?? []).length,
      diceCuentanos: (txt.match(/^Cuéntanos$/m) ?? []).length,
      completoDice: /casi como tú|almost as well/.test(txt),
      pideCompletar: /Completa lo que falta|Fill in what/.test(txt),
      /* El bloque que murió y el CTA que bajó. */
      bloqueHechos: /\d+\s*Paseos/.test(txt) && /\d+\s*Vacunas/.test(txt),
      reservarEsBoton: (() => {
        for (const e of document.querySelectorAll('[role="button"]')) {
          const t2 = (e.getAttribute('aria-label') ?? e.textContent ?? '').trim();
          if (!/^Reservar un servicio/.test(t2)) continue;
          const r = e.getBoundingClientRect();
          return { alto: Math.round(r.height), ancho: Math.round(r.width) };
        }
        return null;
      })(),
      /* Voz de motor en la historia. */
      vozDeMotor: (txt.match(/Anotaste cómo estuvo|Momento de cuidado|Lo anotó quien lo cuidó/g) ?? []).length,
      vozDeMotorCuales: (txt.match(/Anotaste cómo estuvo|Momento de cuidado|Lo anotó quien lo cuidó/g) ?? []),
      /* Lo que queda al PIE, después del último rótulo de sección. */
      pie: txt.slice(-140).replace(/\n+/g, ' · ').trim(),
    };
  }, ROTULOS);
}

const filas = [];
for (const n of ['Thor', 'Lolo', 'Sombra']) {
  const r = await verPerfil(n);
  filas.push([n, r]);
  di(`── ${n} ─────────────────────────────────────────`);
  if (r === null) { di('  (no está en el Hogar)\n'); continue; }
  di(`  orden de secciones : ${r.secciones.join(' → ') || '(ninguna)'}`);
  di(`  tarjeta de HOY     : ${r.hoy ? 'sí' : 'no'}`);
  di(`  tablero «Su salud» : ${r.tablero ? 'sí' : 'no'}`);
  di(`  «Sin registro»     : ${r.sinRegistro}`);
  di(`  svg (gráficos+chevrons): ${r.svg}`);
  di(`  «Conociéndolo» con fracción: ${r.conociendolo ? 'sí' : 'no'}`);
  di(`  «Identidad y papeles»: ${r.seccionPapeles ? 'sí' : 'no'}`);
  di(`  invitaciones «cuéntanos»: ${r.invitaciones}  ${r.invitaciones <= 1 ? '✓' : '🔴 más de una'}`);
  di(`  pregunta de la raza: ${r.preguntaRaza ? 'sí' : 'no'}`);
  for (const d of r.dondeInvita) di(`      · invita en y=${d.y}: «${d.t}»  ← ${d.cadena}`);
  {
    /* 🔴 **Un desborde dentro de algo que scrollea a propósito NO es un
       desborde**: una tira horizontal tiene que ser más ancha que su ventana.
       Se descuentan por su `overflowX`, no por su aspecto. */
    const reales = r.desbordes.filter((d) => d.scroll !== 'scroll' && d.scroll !== 'auto' && d.padre !== 'scroll' && d.padre !== 'auto');
    di(`  fuera de caja      : ${reales.length} de ${r.desbordes.length} nodos anchos ${reales.length === 0 ? '✓ (el resto scrollea a propósito)' : '🔴'}`);
    for (const d of reales.slice(0, 4)) di(`      · x=${d.x} der=${d.der} w=${d.w}  «${d.t}»`);
    di(`  truncados          : ${r.truncados.length} ${r.truncados.length === 0 ? '✓' : '🔴'}`);
    for (const d of r.truncados.slice(0, 4))
      di(`      · «${d.t}» ${d.w}→${d.necesita}px · hijos=${d.hijos}${d.culpable ? ` · el ancho lo pone «${d.culpable.t}» (llega a ${d.culpable.der})` : ''}`);
  }
  di('  ── los diez ──');
  di(`  ① vacunas «${r.vacunasDice}» · próxima pasada=${r.diceProximaPasada ? '🔴 sí' : 'no ✓'} · dice vencida=${r.diceVencida ? 'sí ✓' : 'no'}`);
  di(`  ② alérgenos: ${r.alergenos.total} dichos, ${r.alergenos.distintos} distintos ${r.alergenos.total === r.alergenos.distintos ? '✓' : '🔴 repite'}`);
  di(`  ③ Citas dice: «${r.citaServicio}»`);
  di(`  ④ «Conociéndolo» aparece ${r.diceConociendolo}× · acción «Cuéntanos»=${r.diceCuentanos}`);
  di(`  ⑤ completo=${r.completoDice ? 'sí' : 'no'} · pide completar=${r.pideCompletar ? 'sí' : 'no'}`);
  di(`  ⑥ «Reservar» ${r.reservarEsBoton === null ? 'no está' : `${r.reservarEsBoton.ancho}×${r.reservarEsBoton.alto}`}`);
  di(`  ⑧ voz de motor en la historia: ${r.vozDeMotor} ${r.vozDeMotor === 0 ? '✓' : '🔴'}${r.vozDeMotor ? ' — ' + [...new Set(r.vozDeMotorCuales)].join(' · ') : ''}`);
  di(`  ⑩ bloque «paseos·vacunas»: ${r.bloqueHechos ? '🔴 sigue' : 'muerto ✓'}`);
  di(`  al pie             : …${r.pie.slice(-70)}\n`);
  await page.screenshot({ path: `docs/loop/capturas-s113-c-2.2.1/${n}.png`, fullPage: true });
}

di('── EL ORDEN FIRMADO ────────────────────────────');
const esperado = ['Su salud', 'Conociéndolo', 'Su historia', 'Identidad'];
const thor = filas.find(([n]) => n === 'Thor')?.[1];
di(`  esperado: ${esperado.join(' → ')}`);
di(`  medido  : ${thor?.secciones.join(' → ') ?? '(sin datos)'}`);
di(`  ⇒ ${JSON.stringify(thor?.secciones) === JSON.stringify(esperado) ? '✓ coincide' : '🔴 NO coincide'}`);

di('');
di('── EL ROJO DEL VACÍO (Lolo contra Thor) ────────');
const lolo = filas.find(([n]) => n === 'Lolo')?.[1];
if (thor && lolo) {
  di(`  «Sin registro»: Thor ${thor.sinRegistro} · Lolo ${lolo.sinRegistro} ⇒ ${lolo.sinRegistro > thor.sinRegistro ? '✓ el vacío lo dice' : '🔴'}`);
  di(`  svg           : Thor ${thor.svg} · Lolo ${lolo.svg} ⇒ ${lolo.svg < thor.svg ? '✓ Lolo dibuja menos' : '🔴 dibuja igual o más'}`);
  di(`  (la diferencia ${thor.svg - lolo.svg} son los gráficos que Lolo NO tiene; el resto es el piso de chevrons)`);
}
const sombra = filas.find(([n]) => n === 'Sombra')?.[1];
if (sombra) di(`\n  Sombra (memorial): tablero=${sombra.tablero ? '🔴 sí' : '✓ no'} · hoy=${sombra.hoy ? '🔴 sí' : '✓ no'} · conociéndolo=${sombra.conociendolo ? '🔴 sí' : '✓ no'}`);

di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await nav.close();
