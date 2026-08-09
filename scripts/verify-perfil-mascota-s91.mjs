// ============================================================================
// VERIFY — LA LÁMINA DEL PERFIL, POR CAMINO REAL (S91-D)
//
// Tres sujetos, que es el gate que la mesa pidió: un PERRO con raza y origen ·
// un GATO · un ACUARIO. El acuario es el discriminador de P7: si sus ausencias
// estuvieran resueltas por `if` sueltos abajo en vez de por composición
// arriba, alguna de las cuatro secciones se le colaría — y este verify lo
// diría por sección, no en general.
//
// Limpia sus datos al final. Uso: con el dev server en :8082.
// ============================================================================
import { chromium } from 'playwright-core';
const P = `http://localhost:${process.env.PORT_CLIENTE ?? '8082'}`;
const CLAVE = 'Perfil-S91d-2026';
let fallos = 0;
const check = (c, n) => { console.log(`${c ? '  ok  ' : '  EN ROJO  '}${n}`); if (!c) fallos++; };

const CASOS = [
  { id: 'perro', especie: 'perro', nombre: 'PerfilThor', raza: 'Labrador retriever', origen: 'adoptado',
    presentes: ['Cómo está hoy', 'Peso', 'Vacunas', 'Registrar el de hoy', 'Cuéntanos algo de'],
    // La composición corta en LOS DOS sentidos: el acuario pierde lo del
    // individuo Y el individuo no gana lo del sistema. Un assert que solo
    // mirara las ausencias del acuario no vería una sección que se cuela.
    ausentes: ['Quiénes viven acá'] },
  { id: 'gato', especie: 'gato', nombre: 'PerfilMishi', raza: 'Gato Común', origen: 'encontrado',
    presentes: ['Cómo está hoy', 'Cuéntanos algo de'], ausentes: ['Quiénes viven acá'] },
  { id: 'acuario', especie: 'pez', nombre: 'PerfilAcuario', agua: 'dulce',
    presentes: ['Agua', 'Cuéntanos algo de', 'Quiénes viven acá'],
    // P7 · lo que un acuario NO tiene. Ausentes, no apagados.
    // 'Documentos' entra al re-gate del founder: el acuario OFRECÍA carnet de
    // vacunas. Los cuatro papeles de hoy son de un individuo, así que la
    // sección entera no se monta — y esto lo prueba POR SECCIÓN, que es lo
    // único que caza una composición declarada y no cableada.
    ausentes: ['¿Es macho o hembra?', 'Peso', 'Vacunas', 'Raza', 'Documentos'] },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const correos = [];

for (const caso of CASOS) {
  const correo = `s91d-perfil-${caso.id}-${Date.now()}@epetplace.dev`;
  correos.push(correo);
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1600 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const cuerpo = () => page.evaluate(() => document.body.innerText);
  const esperar = async (a, n = 40) => { for (let i = 0; i < n; i++) { const t = await cuerpo(); if (t.includes(a)) return t; await page.waitForTimeout(500); } return cuerpo(); };
  const tocar = async (txt) => {
    const ok = await page.evaluate((x) => {
      const c = [...document.querySelectorAll('div')].filter((d) => d.textContent === x && d.offsetParent !== null);
      for (const el of c.reverse()) {
        const r = el.getBoundingClientRect(); if (!r.width) continue;
        const px = r.left + r.width / 2, py = r.top + r.height / 2;
        const a = document.elementFromPoint(px, py); if (!a || !(el.contains(a) || a.contains(el))) continue;
        const d = el.closest('[role="button"]') ?? el;
        for (const k of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
          d.dispatchEvent(new MouseEvent(k, { bubbles: true, cancelable: true, clientX: px, clientY: py }));
        return true;
      } return false;
    }, txt);
    if (!ok) throw new Error(`no se pudo tocar «${txt}»`);
    await page.waitForTimeout(700);
  };

  await page.goto(`${P}/registro`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2200);
  await page.locator('input').nth(0).fill('Perfil D');
  await page.locator('input').nth(1).fill(correo);
  await page.locator('input[type="password"]').first().fill(CLAVE);
  await tocar('Crear mi cuenta');
  await esperar('¿Quién se suma a tu casa?');

  // El alta por URL: la propiedad «URL-reconstruible» es declarada y así se
  // EJERCE — y además esquiva el stack de RN-web (problema del arnés).
  const p = new URLSearchParams({ nombre: caso.nombre, especie: caso.especie });
  if (caso.raza !== undefined) p.set('raza', caso.raza);
  if (caso.agua !== undefined) p.set('raza', caso.agua);
  if (caso.origen !== undefined) p.set('origen', caso.origen);
  p.set('fecha', '2021-03-14');
  p.set('precision', 'estimada'); // ← P1: la edad honesta se prueba con esto
  await page.goto(`${P}/onboarding/cierre?${p.toString()}`, { waitUntil: 'networkidle', timeout: 120000 });
  await esperar('completar el perfil');
  await tocar('Completar ahora');
  await esperar(caso.nombre, 40);
  await page.waitForTimeout(7000); // el catálogo de razas resuelve la cara

  const t = await cuerpo();
  console.log(`\n== ${caso.id} ==`);
  for (const s of caso.presentes) check(t.includes(s), `${caso.id} · PRESENTE «${s}»`);
  for (const s of caso.ausentes) check(!t.includes(s), `${caso.id} · AUSENTE «${s}» (P7: ausente, no apagado)`);
  if (caso.id === 'perro') {
    check(t.includes('Lo adoptaron'), 'P1 · el origen en humano bajo el nombre');
    check(t.includes('hacia 2021'), 'P1 · la edad HONESTA: fecha estimada dice «hacia 2021», no un cumpleaños');
    check(t.includes('Labrador retriever'), 'P3 · la raza, en Identidad');
  }
  if (caso.id === 'acuario') check(t.includes('Dulce'), 'P7 · el tipo de agua en Identidad');

  const superficieDe = async (texto) =>
    page.evaluate((tx) => {
      const todos = Array.from(document.querySelectorAll('*'));
      const nodo = todos.reverse().find((e) => (e.textContent ?? '').trim().startsWith(tx));
      if (!nodo) return '(puerta no encontrada)';
      let n = nodo;
      for (let i = 0; i < 8 && n; i += 1) {
        const bg = getComputedStyle(n).backgroundColor;
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
        n = n.parentElement;
      }
      return '(sin superficie)';
    }, texto);

  {
    // ⚠️ SOLO PUERTAS. «Quiénes viven acá» estuvo en esta lista y el assert la
    // marcó en rojo — con razón: es el TÍTULO DE SECCIÓN, y va sobre el fondo
    // como «Identidad» o «Su historia». El instrumento cazó un error de MI
    // censo, que es para lo que sirve: si hubiera puesto solo lo que ya sabía
    // que estaba bien, no habría medido nada.
    const puertas = caso.id === 'acuario'
      ? ['Cuéntanos algo de', 'Declarar quiénes viven acá']
      : ['Cuéntanos algo de', 'Documentos'];
    for (const puerta of puertas) {
      const bg = await superficieDe(puerta);
      // ⚠️ «no encontrada» es ROJO, no verde. La primera versión de este
      // assert solo rechazaba «sin superficie» y el rosa del fondo — así que
      // una puerta AUSENTE pasaba. Es el verde falso que vengo cazando toda la
      // sesión, escrito por mí: **un assert sobre una propiedad de algo que no
      // está no es un assert que pasa, es un assert que no corrió.**
      const bien = bg !== '(sin superficie)' && bg !== '(puerta no encontrada)' && bg !== 'rgb(250, 242, 245)';
      check(bien, `PARED · «${puerta}» tiene su superficie (${bg})`);
    }
  }


  /**
   * A8 × P7 — LA CUENTA TAMBIÉN SE COMPONE.
   *
   * El acuario del fixture no tiene solicitudes, ni presupuestos, ni citas por
   * coordinar: sus ÚNICOS pendientes posibles eran los dos de vacuna, que P7
   * apaga. Así que su pastilla NO debe llevar cuenta. Antes del barrido decía
   * «1 por resolver» — y ese 1 era el carnet, una categoría que no le aplica:
   * un pendiente que el dueño no puede resolver ni encontrar.
   *
   * El PERRO es el contraste: mismas cero vacunas, y a él la cuenta SÍ le
   * corresponde. Sin el par, «el acuario no cuenta» pasaría también si la
   * cuenta estuviera rota para todos.
   */
  if (caso.id === 'acuario') check(!t.includes('por resolver'), 'A8×P7 · el acuario no cuenta pendientes que no le aplican');
  if (caso.id === 'perro') check(t.includes('por resolver'), 'A8×P7 · contraste: al perro la cuenta SÍ le corresponde');

  /**
   * ⚠️ P7 EN EL HOGAR — LA SUPERFICIE QUE ESTE VERIFICADOR NO MIRABA.
   *
   * Mi assert decía «el acuario no monta Documentos» y era CIERTO — pero solo
   * del PERFIL, que es la única pantalla que este script abría. El founder vio
   * el pedido de carnet en «Ponte al día», que vive en el HOGAR, y ahí la
   * composición no llegaba. **Un verificador que solo abre una pantalla no
   * puede afirmar nada sobre una ley que rige en varias** — daba verde y
   * miraba al lado, y eso no es un assert flojo: es un assert de otra cosa.
   *
   * Por eso el recorrido sigue hasta el Hogar. Lo que se afirma acá es lo que
   * la composición promete: a un SISTEMA no se le pide carnet ni se le avisa
   * de vacunas.
   */
  /**
   * 🔴 EL CANTO, MEDIDO EN LAS DOS SUPERFICIES.
   *
   * El canto es VISUAL: no se puede afirmar leyendo texto, y por eso vivió sin
   * verificar mientras el founder lo veía faltar. `CantoCurva` lo pinta como el
   * FONDO del contenedor exterior, que asoma 6px porque el interior lleva
   * `marginLeft: 6`; sin color, el exterior cae a `bg.card` y el margen a 0 —
   * o sea que **la ausencia de canto es medible: el exterior es del color de la
   * tarjeta y el interior no está corrido.**
   *
   * Se mide en el perfil Y en el Hogar porque la ley rige en las dos, y ya me
   * pasó una vez afirmar sobre una y creer que hablaba de ambas.
   */
  const cantoDe = async (texto) =>
    page.evaluate((tx) => {
      const todos = Array.from(document.querySelectorAll('*'));
      const nodo = todos.reverse().find((e) => (e.textContent ?? '').trim().startsWith(tx));
      if (!nodo) return '(fila no encontrada)';
      let n = nodo;
      for (let i = 0; i < 8 && n; i += 1) {
        const hijo = n.firstElementChild;
        if (hijo) {
          const ml = parseFloat(getComputedStyle(hijo).marginLeft || '0');
          if (ml >= 4) return getComputedStyle(n).backgroundColor;
        }
        n = n.parentElement;
      }
      return '(sin canto)';
    }, texto);

  if (caso.id === 'acuario') {
    const cantoPerfil = await cantoDe('Un mundo nuevo empieza');
    console.log(`    canto en el PERFIL: ${cantoPerfil}`);
    check(cantoPerfil !== '(sin canto)' && cantoPerfil !== '(fila no encontrada)', 'CANTO · el hito lleva su canto EN EL PERFIL');

    await page.goto(`${P}/hogar`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForTimeout(6000);
    const cantoHogar = await cantoDe('Un mundo nuevo empieza');
    console.log(`    canto en el HOGAR:  ${cantoHogar}`);
    check(cantoHogar !== '(sin canto)' && cantoHogar !== '(fila no encontrada)', 'CANTO · el MISMO hecho lleva su canto EN EL HOGAR');
    check(cantoHogar === cantoPerfil, 'CANTO · y es EL MISMO color en las dos (una sola verdad, no dos parecidas)');
  }

  if (caso.id === 'acuario') {
    await page.goto(`${P}/hogar`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForTimeout(6000); // Ponte al día compone tras varios lectores
    const h = await cuerpo();
    check(!h.includes('Cargar el carnet'), 'P7 · el HOGAR no le pide carnet a un acuario');
    check(!h.includes('le vence'), 'P7 · el HOGAR no le avisa vencimientos de vacuna a un acuario');
    check(h.includes(caso.nombre), 'P7 · y sin embargo el acuario SÍ está en el Hogar (no se cayó de la casa)');
  }

  /**
   * LA SONDA, AHORA POR PUERTA — mide en LAS DOS DIRECCIONES.
   *
   * Nació para probar que la puerta de la bitácora NO tenía caja; la letra
   * resultó ser la contraria y hoy prueba que SÍ la tiene. **Un instrumento
   * que sirve para las dos direcciones es un guard; uno que solo confirma lo
   * que uno cree es un espejo** — por eso se conserva y se ensancha en vez de
   * morir con su primer hallazgo.
   *
   * Se corre POR PUERTA y no por pantalla: el perfil tiene TRES (bitácora ·
   * Documentos · quiénes viven acá) y una sola estaba pelada. Afirmar «las
   * puertas tienen superficie» mirando UNA es el mismo error que ya cometí
   * afirmando P7 mirando una sola pantalla.
   */

  /**
   * SONDA DE LA CAJA DE LA PUERTA (re-gate del founder, ley A6 «sin caja»).
   *
   * Tres lecturas del ÁRBOL dijeron que la puerta no tiene fondo
   * (`CeldaNavegacion` es un Pressable transparente y el perfil la envuelve en
   * un View con solo padding). El founder ve una caja blanca. **Cuando el
   * código y el ojo no coinciden, gana el ojo y se mide el DOM VIVO** — leer
   * el árbol otra vez sería la cuarta vez de lo mismo.
   *
   * Sube desde el texto de la puerta anotando quién pinta fondo. El primero
   * que no sea transparente ES la caja, con su tamaño para reconocerlo.
   */
  if (caso.id === 'perro') {
    const cadena = await page.evaluate(() => {
      const todos = Array.from(document.querySelectorAll('*'));
      const nodo = todos.reverse().find((e) => (e.textContent ?? '').startsWith('Cuéntanos algo de'));
      if (!nodo) return ['(no encontré la puerta)'];
      const salida = [];
      let n = nodo;
      for (let i = 0; i < 10 && n; i += 1) {
        const cs = getComputedStyle(n);
        const r = n.getBoundingClientRect();
        salida.push(
          `${i}: <${n.tagName.toLowerCase()}> bg=${cs.backgroundColor} radio=${cs.borderRadius} sombra=${cs.boxShadow.slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
        n = n.parentElement;
      }
      return salida;
    });
    /**
     * LA CAPTURA DEL CHIP CON CARA (re-gate ①) — y por qué se toma ACÁ.
     *
     * El verificador del alta NO puede mostrarla: `cat_razas` concede SELECT
     * solo a `authenticated` (`grant_anon=0`, medido) y ese arnés corre sin
     * sesión, así que la grilla le sale vacía. Este arnés SÍ tiene sesión —
     * crea sus cuentas—, y el perfil monta EL MISMO `SelectorDeRaza` en su
     * Hoja de edición. La misma foto prueba dos cosas: la cara en el chip y
     * que la Hoja de A5 ya scrollea sin tapar el campo.
     */
    /**
     * ⚠️ EL OVERLAY SE RETIRA ANTES DE TOCAR, no antes de disparar.
     * `#error-overlay` de expo-web (dev) **intercepta los pointer events**:
     * dejó tres capturas negras y, cuando quise capturar el chip, se comió el
     * click entero (60 reintentos de Playwright contra él). Es la trampa que
     * S53 ya había registrado — *el overlay no tapa la foto: tapa el dedo*.
     * Es andamio del entorno, jamás producto.
     */
    const sinOverlay = () =>
      page.evaluate(() => {
        document
          .querySelectorAll('#error-overlay, #error-toast, [class*="LogBox"]')
          .forEach((n) => n.remove());
      });
    await sinOverlay();
    await page.getByText('Raza', { exact: false }).first().click();
    await new Promise((r) => setTimeout(r, 2800));
    await sinOverlay();
    await page.screenshot({ path: 'scripts/capturas/s91d-chip-con-cara.png', fullPage: true });

    console.log('\n  -- sonda de la caja de la puerta --');
    cadena.forEach((l) => console.log('   ', l));
    console.log('');
  }
  // ⚠️ ANTES DE TODA CAPTURA, no solo en una rama: el `#error-overlay` de
  // expo-web (dev) se dibuja encima y deja la foto NEGRA. Ya se colaron dos
  // tandas de capturas basura a commits — y el verificador seguía VERDE,
  // porque afirma sobre `innerText` y el overlay no lo toca. **Una suite verde
  // no garantiza que sus capturas muestren algo.**
  await page.evaluate(() => {
    document
      .querySelectorAll('#error-overlay, #error-toast, [class*="LogBox"]')
      .forEach((n) => n.remove());
  });
  await page.screenshot({ path: `scripts/capturas/s91d-perfil-${caso.id}.png`, fullPage: true });

  /**
   * EL CONTRASTE QUE VUELVE DISCRIMINANTE AL ASSERT DE ARRIBA.
   *
   * El perro de este fixture también tiene CERO vacunas, así que a él el Hogar
   * SÍ tiene que pedirle el carnet. Sin este par, «el acuario no ve el carnet»
   * pasaría también si la fila no existiera para NADIE —por un lector caído,
   * por un rename, por un filtro de más— y el verde no probaría la
   * composición: probaría una ausencia cualquiera.
   */
  if (caso.id === 'perro') {
    await page.goto(`${P}/hogar`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForTimeout(6000);
    const h = await cuerpo();
    check(h.includes('Cargar el carnet'), 'P7 · contraste: al PERRO el Hogar SÍ le pide el carnet');
  }

  await ctx.close();
}

await browser.close();
console.log('\ncuentas a limpiar:\n' + correos.join('\n'));
console.log(fallos === 0 ? '\nVERDE — la lámina del perfil, en los tres sujetos.' : `\nEN ROJO — ${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
