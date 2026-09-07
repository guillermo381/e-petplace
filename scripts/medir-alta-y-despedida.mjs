/**
 * ⭐ **EL ALTA CON SUGERENCIA Y LA DESPEDIDA** (S113-C · 1.2 · C9 y C11).
 *
 * Un solo recorrido, porque **la mascota que crea el alta es la que se
 * despide**: hacerlo en dos arneses obligaría a sembrar una mascota a mano y
 * *un fixture que se siembra por la puerta de atrás no prueba la puerta*.
 *
 * ── LO QUE MIDE ────────────────────────────────────────────────────────────
 *  C9  foto → sugerencia → **toque** → raza guardada · y **sin toque, vacía**
 *      (el control negativo: la sugerencia PROPONE, jamás decide).
 *  C10 la ficha de raza **no se dibuja** (control negativo: `razas_contenido`
 *      tiene 0 filas).
 *  C11 el menú de edición existe, ofrece despedirse, y tras despedir la ficha
 *      queda en memorial **sin pedir nada**.
 */
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const NOMBRE = `PruebaC${Date.now().toString().slice(-5)}`;
const di = (s) => console.log(s);

const dirFoto = join(homedir(), 'Downloads', 'carnets_muestra', 'Carnet_reales');
const foto = join(dirFoto, readdirSync(dirFoto)[0]);

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 140)));
page.on('console', (m) => { if (/despedida|registrar_fin/.test(m.text())) errores.push('CONSOLA · ' + m.text().slice(0, 200)); });
/* 🔴 **LA RESPUESTA CRUDA DE LA RPC.** El wrapper devuelve `desconocido`, que
   es su cajón para «no reconozco esta forma» — y desde la pantalla no se
   distingue un error tipado que no mapea de un objeto con otras claves. *Se le
   pregunta al servidor, no al wrapper.* */
page.on('response', async (r) => {
  if (!/rpc\/registrar_fin_de_vida/.test(r.url())) return;
  const cuerpo = await r.text().catch(() => '(no pude leerlo)');
  errores.push(`RPC ${r.status()} · ${cuerpo.slice(0, 300)}`);
});
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(16000);
di(`cuenta: ${CORREO} · mascota de prueba: ${NOMBRE} · foto: ${foto.split('/').pop()}`);

/* ═══ C9 · EL ALTA ═════════════════════════════════════════════════════════ */
di('');
di('── C9 · EL ALTA: foto → sugerencia → toque ────────────────');
await page.goto('http://localhost:8082/hogar/agregar', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(6000);

/* especie — se toca POR TEXTO: los chips no exponen role=button en web. */
const perro = page.getByText('Perro', { exact: true }).first();
di(`  ¿está el chip «Perro»?: ${(await perro.count()) > 0 ? 'sí' : '🔴 no'}`);
await perro.click({ force: true }).catch((e) => di(`  🔴 no pude tocarlo: ${String(e).slice(0, 60)}`));
await page.waitForTimeout(1500);
const inputs = page.locator('input');
di(`  campos de texto en el paso: ${await inputs.count()}`);
if ((await inputs.count()) > 0) { await inputs.first().fill(NOMBRE); await page.waitForTimeout(800); }
/* El botón dice «Presentar a {nombre}», no «Continuar»: medido, no supuesto. */
const cont = page.getByText(new RegExp(`^(Presentar a ${NOMBRE}|Continuar)$`)).first();
di(`  botón del paso: ${(await cont.count()) > 0 ? await cont.innerText() : '🔴 no lo hallé'}`);
await cont.click({ force: true }).catch(() => {});
await page.waitForTimeout(5000);
di(`  paso tras especie+nombre: ${(await T()).slice(0, 90).replace(/\n/g, ' · ')}`);

/* la foto */
/* 🔴 **EL INPUT NO EXISTE HASTA QUE SE TOCA.** Medido: el picker de Expo en
   web crea el `<input type=file>` recién al abrirse, así que buscarlo antes da
   0 y parece «no llegué al paso» — que fue justo lo que este arnés reportó dos
   corridas seguidas. Se escucha el `filechooser`, que es el evento real. */
const botones = await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => ((e.getAttribute('aria-label') ?? e.innerText) ?? '').trim().slice(0, 34)).filter((t) => t.length > 0));
di(`  botones del paso: ${botones.join(' | ')}`);
const botonFoto = page.getByRole('button', { name: /foto|galer|c\u00e1mara|imagen|photo/i }).first();
di(`  botón de foto: ${(await botonFoto.count()) > 0 ? await botonFoto.getAttribute('aria-label') : '🔴 no lo hallé'}`);
let subio = false;
if ((await botonFoto.count()) > 0) {
  /* 🔴 **SON DOS TOQUES, NO UNO.** «Elegir una foto» abre la *Hoja de captura*
     con cámara y galería; el picker recién sale del segundo. Tres corridas
     reportaron «no subió» por buscar el input después del primero. */
  await botonFoto.click().catch(() => {});
  await page.waitForTimeout(2000);
  const enHoja = await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => ((e.getAttribute('aria-label') ?? e.innerText) ?? '').trim().slice(0, 30)).filter((t) => t.length > 0));
  di(`  la Hoja de captura ofrece: ${enHoja.slice(-5).join(' | ')}`);
  const galeria = page.getByRole('button', { name: /galer|elegir de|library|gallery/i }).first();
  const esperaPicker = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
  if ((await galeria.count()) > 0) await galeria.click().catch(() => {});
  const picker = await esperaPicker;
  if (picker !== null) { await picker.setFiles(foto); subio = true; }
  else {
    /* Segundo intento: `expo-image-picker` en web inyecta el input al abrirse,
       así que puede existir en el DOM sin haber emitido el evento. */
    for (let i = 0; i < 10 && !subio; i += 1) {
      const f = page.locator('input[type="file"]');
      if ((await f.count()) > 0) { await f.first().setInputFiles(foto); subio = true; break; }
      await page.waitForTimeout(1000);
    }
  }
  await page.waitForTimeout(subio ? 26000 : 2000);
}
di(`  ¿subió la foto?: ${subio ? 'sí ✓' : '🔴 no'}`);
di(`  tras la foto: ${(await T()).slice(0, 130).replace(/\n/g, ' · ')}`);

/* Se pasa al paso de la raza para ver si llegó la sugerencia. */
for (let i = 0; i < 3; i += 1) {
  const b = page.getByText(/^(Continuar|Siguiente|Listo|Guardar|Omitir|Más tarde)$/).first();
  if ((await b.count()) === 0) break;
  await b.click({ force: true }).catch(() => {});
  await page.waitForTimeout(6000);
}
const tSug = await T();
di(`  paso de la raza: ${tSug.slice(0, 160).replace(/\n/g, ' · ')}`);
/* 🔴 EL CONTROL NEGATIVO DE C9: la sugerencia PROPONE. Se lee el campo de raza
   ANTES de tocarla — si ya trae valor, la sugerencia decidió sola. */
/* Sólo el campo de RAZA: leer todos los inputs traía el nombre y dio un falso
   «vino lleno» en la corrida anterior. */
const razaAntes = await page.evaluate(() => {
  for (const e of document.querySelectorAll('input')) {
    const lbl = (e.getAttribute('aria-label') ?? '') + ' ' + (e.getAttribute('placeholder') ?? '');
    if (/raza|breed/i.test(lbl)) return e.value.trim();
  }
  return '(no hallé el campo de raza)';
});
di(`  · SIN TOCAR: los campos traen «${razaAntes === '' ? '(vacío)' : razaAntes}» ⇒ ${razaAntes === '' ? 'la sugerencia PROPONE ✓' : 'ojo: algo vino lleno'}`);

/* El toque: se elige una raza del selector y se termina el alta. **El positivo
   de la SUGERENCIA no se pudo ejercer** —la única foto a mano es un carnet, y
   el modelo lo dijo en vez de inventar—; lo que sí se prueba es que **el campo
   sólo se llena con el toque**. */
const raza = page.getByText('Beagle', { exact: true }).first();
di(`  tocando «Beagle»: ${(await raza.count()) > 0 ? 'sí' : '🔴 no está'}`);
await raza.click({ force: true }).catch(() => {}); /* Beagle: una de las 10 fichas PUBLICADAS ⇒ control POSITIVO de C10. */
await page.waitForTimeout(2500);
const razaDespues = await page.evaluate(() => {
  for (const e of document.querySelectorAll('input')) {
    const lbl = (e.getAttribute('aria-label') ?? '') + ' ' + (e.getAttribute('placeholder') ?? '');
    if (/raza|breed/i.test(lbl)) return e.value.trim();
  }
  return '(no hallé el campo)';
});
/* ① el momento de la raza: aparece tras el toque, no antes. */
await page.waitForTimeout(6000);
const tMom = await T();
di(`  ① ¿aparece «Conoce al …»?: ${/Conoce al /.test(tMom) ? 'sí ✓' : '🔴 no'}`);
di(`  ① ¿trae el «ver más» plegable?: ${/Ver más sobre la raza/.test(tMom) ? 'sí ✓' : '🔴 no'}`);
di(`  ① ¿el alta sigue (botón de avanzar presente)?: ${(await page.getByText(/^Continuar$/).count()) > 0 ? 'sí ✓' : '🔴 no'}`);
di(`  · TRAS EL TOQUE: «${razaDespues}» ⇒ ${razaDespues.length > 0 && !razaDespues.startsWith('(no') ? 'la eligió el toque ✓' : 'ojo'}`);
/* Se avanza tocando **el último botón de la pantalla que no sea «Volver» ni el
   Nexo**: los nombres cambian paso a paso («Presentar a X», «Continuar», …) y
   tres corridas se perdieron adivinándolos. */
for (let i = 0; i < 5; i += 1) {
  const cands = await page.evaluate(() => [...document.querySelectorAll('[role="button"]')]
    .map((e) => ((e.getAttribute('aria-label') ?? e.innerText) ?? '').trim())
    .filter((t) => t.length > 0 && !/^(Volver|Cerrar|Abrir a |Ahora no|Avisos)/.test(t)));
  di(`    paso ${i + 1} · botones: ${cands.slice(-4).join(' | ')}`);
  const cual = cands.filter((t) => /^(Continuar|Siguiente|Listo|Guardar|Terminar|Empezar|Presentar|Sumar|Crear|Agregar|Omitir)/i.test(t)).pop();
  if (cual === undefined) break;
  await page.getByRole('button', { name: cual, exact: true }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(6000);
}
di(`  fin del alta: ${(await T()).slice(0, 90).replace(/\n/g, ' · ')}`);

/* ═══ C11 · LA DESPEDIDA ═══════════════════════════════════════════════════ */
di('');
di('── C11 · LA DESPEDIDA ─────────────────────────────────────');
await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(9000);
await page.waitForTimeout(6000);
const etiquetas = await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => (e.getAttribute('aria-label') ?? '').trim()).filter((s) => s.length > 0).slice(0, 24));
di(`  botones del Hogar: ${etiquetas.slice(0, 10).join(' | ')}`);
di(`  ¿nació ${NOMBRE}?: ${etiquetas.includes(NOMBRE) ? 'sí ✓' : '🔴 no la veo en el Hogar'}`);
const ficha = page.getByRole('button', { name: new RegExp(`^${NOMBRE}$`) }).first();
if ((await ficha.count()) === 0) { di('  🔴 no hallé ninguna ficha para abrir'); }
else {
  const cual = await ficha.getAttribute('aria-label');
  await ficha.click(); await page.waitForTimeout(9000);
  di(`  abierta: ${cual}`);
  const lapiz = page.getByRole('button', { name: /^Editar|Cambiar la foto de/ }).first();
  di(`  ¿el lápiz está?: ${(await lapiz.count()) > 0 ? 'sí' : '🔴 no'}`);
  if ((await lapiz.count()) > 0) {
    await lapiz.click(); await page.waitForTimeout(2500);
    const t = await T();
    for (const v of ['Cambiar la foto', 'Cambiar la raza', 'Despedirme de']) {
      di(`    menú ofrece «${v}»: ${t.includes(v) ? 'sí ✓' : '🔴 no'}`);
    }
  }
  /* ── EL ROJO/VERDE DE C11: se despide de verdad ── */
  const antes = await T();
  di(`  ANTES · ¿le pide algo? (carnet/registrar/reservar): ${/Cargar carnet|Registrar|Reservar|Agendar/.test(antes) ? 'sí — está viva ✓' : 'no'}`);
  /* 🔴 **C10 SE MIDE ACÁ, CON LA MASCOTA VIVA.** La corrida anterior lo medía
     al final y daba rojo — pero la ficha de raza cuelga de `!esMemorial` a
     propósito, así que después de despedir **no dibujar es lo correcto**. *Un
     control positivo medido en el estado equivocado no falla: miente.* */
  di(`  C10 · con Beagle VIVA, ¿dibuja la ficha de raza?: ${/Ver más sobre la raza|Cómo suelen ser/.test(antes) ? 'sí ✓ (positivo)' : '🔴 no'}`);
  di(`  ② ¿cierra con la invitación?: ${/¿Quieres contarnos qué lo hace único\?/.test(antes) ? 'sí ✓' : '🔴 no'}`);
  const mPeso = /(\d+(?:[.,]\d+)?) kg · (\d{2} \w+)/.exec(antes);
  di(`  ④ identidad muestra el peso con su fecha: ${mPeso !== null ? `«${mPeso[0]}» ✓` : (/\d+(?:[.,]\d+)? kg/.test(antes) ? '🔴 sin fecha' : 'sin peso (no lo declaró)')}`);
  /* 🔴 **GUARDA: no se despide a una mascota ajena.** Este arnés ejecuta un
     acto IRREVERSIBLE sobre datos reales del founder. Si la ficha abierta no es
     la mascota que este mismo arnés creó, se corta. *Un fixture que puede
     confundirse de sujeto no es un fixture: es un accidente esperando.* */
  if (cual !== NOMBRE) {
    di(`  🔴 CORTO: la ficha abierta es «${cual}», no «${NOMBRE}». No despido nada.`);
    di('');
    di(`errores de página: ${errores.length}`);
    await nav.close();
    process.exit(2);
  }
  const irDespedida = page.getByRole('button', { name: /^Despedirme de/ }).first();
  if ((await irDespedida.count()) > 0) {
    await irDespedida.click(); await page.waitForTimeout(6000);
    di(`  pantalla de despedida: ${(await T()).slice(0, 90).replace(/\n/g, ' · ')}`);
    /* El botón se captura UNA vez: la pieza le cambia el texto tras el primer
       toque (`vozConfirmar`), así que buscarlo de nuevo por su nombre viejo
       falla — y eso fue lo que hizo caer la corrida anterior. */
    /* 🔴 **DOS TOQUES, Y EL SEGUNDO SE BUSCA POR EL TEXTO NUEVO.** La pieza
       cambia el rótulo a `vozConfirmar` tras el primero, así que el mismo
       selector deja de encontrarlo — la corrida anterior murió ahí. *El botón
       de un acto grave está hecho para no poder tocarse dos veces de corrido:
       el arnés se adapta a eso, no al revés.* */
    const uno = page.getByText('Despedirme', { exact: true }).first();
    if ((await uno.count()) > 0) {
      await uno.click({ force: true }); await page.waitForTimeout(2500);
      const t2 = await T();
      const confirma = /Toca otra vez para despedirte/.test(t2);
      di(`  primer toque ⇒ ${confirma ? 'pide confirmar ✓ («Toca otra vez…»)' : '🔴 no pidió confirmación'}`);
      /* Por el `aria-label`, no por el texto: el rótulo vive en un hijo y
         tocar «el texto» cayó al lado — la corrida anterior volvió al Hogar
         sin haber ejecutado nada, y el arnés lo leyó como memorial. */
      const dos = page.getByRole('button', { name: /^Toca otra vez para despedirte/ }).first();
      di(`  botón de confirmación: ${(await dos.count()) > 0 ? 'hallado ✓' : '🔴 no'}`);
      if ((await dos.count()) > 0) {
        await dos.click();
        await page.waitForTimeout(3500);
        di(`  tras confirmar, la pantalla dice: ${(await T()).slice(0, 160).replace(/\n/g, ' · ')}`);
        await page.waitForTimeout(8000);
      }
    } else di('  🔴 no hallé el botón «Despedirme»');
  } else di('  🔴 no hallé la entrada a la despedida');

  /* 🔴 **SE VUELVE A LA FICHA A PROPÓSITO.** La corrida anterior midió tras el
     `back()` — o sea **el Hogar**, que no tiene carnet ni lápiz — y cantó
     memorial con la mascota todavía viva en la base. *Un discriminador que se
     cumple en la pantalla equivocada no discrimina nada.* */
  await page.goto('http://localhost:8082/hogar', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(8000);
  const f2 = page.getByRole('button', { name: new RegExp(`^${NOMBRE}$`) }).first();
  if ((await f2.count()) === 0) { di('  🔴 la ficha ya no está en el Hogar'); }
  else { await f2.click(); await page.waitForTimeout(9000); }
  const tf = await T();
  di('');
  di(`  DESPUÉS · en SU ficha, ¿sigue pidiendo?: ${/Cargar carnet|Registrar el de hoy|Reservar|Agendar/.test(tf) ? '🔴 SÍ — el memorial no apagó' : 'no ✓ — memorial'}`);
  di(`  ¿el lápiz sigue?: ${(await page.getByRole('button', { name: /^Editar$/ }).count()) > 0 ? '🔴 sí' : 'no ✓'}`);
  /* 🔴 **C10 · CONTROL POSITIVO**: Beagle es una de las **10 fichas publicadas**
     (medido: `razas_contenido` tiene 210 filas y 10 con `activo`). Si la ficha
     NO aparece con una raza publicada, el montaje está mal — y con una no
     publicada no debe aparecer, que es el negativo. */
  di(`  C10 · en MEMORIAL la ficha de raza se apaga: ${/Ver más sobre la raza|Cómo suelen ser/.test(tf) ? '🔴 sigue dibujando' : 'sí ✓ (cuelga de !esMemorial)'}`);
}

di('');
di(`errores de página: ${errores.length}`);
for (const e of errores) di(`   · ${e}`);
await page.screenshot({ path: 'docs/loop/S113-C-1.2-alta-despedida.png', fullPage: false });
await nav.close();
