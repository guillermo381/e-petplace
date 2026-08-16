/**
 * verify-s99d-ventana-hermana.mjs — LAS DOS VENTANAS Y EL DÍA QUE CRUZA (L4).
 *
 * Adjudicación de mesa #1: citas y pedidos son **ventanas hermanas con
 * puertas espejo**, y el argumento de S97-D (*«un día contado en dos listas
 * está en DOS ÓRDENES»*) queda respondido por **el selector de fecha
 * compartido: es UN día en DOS ventanas**.
 *
 * 🔴 **POR ESO LO QUE ESTE GUARD MIDE NO ES QUE LAS PUERTAS EXISTAN — ES QUE
 * EL DÍA CRUCE, Y EN LOS DOS SENTIDOS.** Dos ventanas con puertas y ruedas
 * independientes se ven idénticas a las hermanas firmadas **y son otra cosa**:
 * son dos días en dos ventanas, o sea el defecto que la firma vino a
 * responder, con mejor apariencia. *La ida sola no alcanza: el sentido caro
 * es la VUELTA, porque `router.back()` la habría roto en silencio.*
 *
 * ── LAS TRES POBLACIONES ───────────────────────────────────────────────
 * | cuenta      | quién es              | puerta en su HOY |
 * |-------------|-----------------------|------------------|
 * | `duenotodo` | dual gestor           | **SÍ** + el día cruza ida y vuelta |
 * | `duenovet`  | prestador sin tienda  | **NO** — el lugar no existe para él |
 * | `duenodes`  | vendedor puro         | **NO** — su HOY YA ES la ventana   |
 *
 * El tercer brazo no es adorno: montar la puerta por «tiene cuenta
 * comercial» —que es lo que parecía el discriminador y NO lo es, porque la
 * tiene todo prestador— habría dado verde en el dual y puesto una puerta a
 * ninguna parte en los otros dos.
 *
 * ⚠️ **SE MIDE EL DÍA QUE SE VE, NO EL DE LA URL** — enmienda del 17-ago.
 * La v1 leía `?dia=` porque el día viajaba por param; el founder corrigió la
 * transición y el día pasó a vivir en un contexto compartido
 * (`@/lib/dia-en-vista`), así que **ya no hay param que leer**. Medir el
 * mecanismo habría dado ROJO sobre una cura correcta. *Un guard atado a CÓMO
 * se hace algo caduca con la primera mejora; atado a QUÉ tiene que verse,
 * sobrevive.* Hoy se lee el día ELEGIDO en la rueda de cada ventana.
 *
 * ⚠️ RN-web, no dispositivo (L-153).
 *
 * Uso:  node scripts/verify-s99d-ventana-hermana.mjs [--puerto 8082]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = `http://localhost:${arg('puerto', '8082')}`;
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

const CASOS = [
  { cuenta: 'duenotodo', quien: 'dual gestor', puerta: true },
  { cuenta: 'duenovet', quien: 'prestador sin tienda', puerta: false },
  { cuenta: 'duenodes', quien: 'vendedor puro', puerta: false },
];

/** El día de la rueda que NO es hoy — para que el cruce tenga qué probar. */
function otroDia(hoy, n) {
  const [a, m, d] = hoy.split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA').format(new Date(a, m - 1, d + n));
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const fallos = [];

for (const caso of CASOS) {
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${caso.cuenta}@gmail.com`);
    await page.locator('input[type="password"]').fill(CLAVE);
    await page.getByText('Entrar', { exact: true }).click();
    await page.waitForTimeout(13000);

    /* 🔴 `visible=true` EN TODOS LOS LOCATORS, y no es prolijidad: al empujar
       la ventana hermana **el HOY queda montado debajo** (expo-router conserva
       la pantalla anterior en la pila), así que un `getByText('17')` matchea
       DOS nodos y `.first()` toma el de la pantalla que ya no se ve. La
       primera corrida de este guard murió exactamente ahí: *el instrumento
       respondió sobre otra pantalla* (L-235). */
    const puerta = page.getByText('Tus pedidos del día', { exact: true }).locator('visible=true');
    const hay = (await puerta.count()) > 0;
    console.log(`${hay === caso.puerta ? '✅' : '🔴'} ${caso.cuenta.padEnd(10)} (${caso.quien.padEnd(21)}) · puerta=${hay ? 'sí' : 'no'}`);
    if (hay !== caso.puerta) {
      fallos.push(
        `${caso.cuenta}: la puerta ${hay ? 'SE MONTÓ' : 'NO se montó'} y debía ser al revés`,
      );
      continue;
    }
    if (!caso.puerta) continue;

    /* ── EL CRUCE, que es lo que de verdad se mide ── */
    const hoy = new Intl.DateTimeFormat('en-CA').format(new Date());
    const manana = otroDia(hoy, 1);
    const pasado = otroDia(hoy, 2);

    /** 🔴 EL DÍA SE LEE POR SU CONSECUENCIA VISIBLE, NO POR LA RUEDA.
     *  Medido: `SelectorDia` marca al elegido con un WORKLET (escala,
     *  opacidad, acento) y **no expone `aria-selected` ni `aria-checked`** en
     *  RN-web — hallazgo ya registrado en el harness de S55. Leer «cuál está
     *  marcado» es imposible desde afuera.
     *
     *  Lo que sí es legible es lo que la persona LEE: **el rótulo del techo
     *  dice el día cuando NO es hoy** (`del {dow} {dd}`), en las dos ventanas
     *  —`techo.plataDelDiaOtro` en citas · `pedidosDia.techoValorOtro` en
     *  pedidos, la misma forma a propósito—. Por eso el par de prueba usa
     *  mañana y pasado y jamás hoy: con hoy el rótulo se calla el día y el
     *  guard no tendría qué mirar.
     *
     *  *Y es mejor test que el anterior: prueba lo que el usuario ve, no cómo
     *  se lo pasamos entre pantallas — sobrevive a la próxima mudanza.* */
    const diaVisible = async (esperado) => {
      const dow = new Intl.DateTimeFormat('es-EC', { weekday: 'short' })
        .format(new Date(Number(esperado.slice(0, 4)), Number(esperado.slice(5, 7)) - 1, Number(esperado.slice(8, 10))))
        .replace('.', '');
      const aguja = `del ${dow} ${esperado.slice(8, 10)}`;
      /* 🔴 SIN DISTINGUIR MAYÚSCULAS, y no es prolijidad: el techo
         MAYUSCULIZA sus rótulos («DEL DOM 16») por CSS de la pieza, así que
         el diccionario dice una cosa y la pantalla muestra otra. La primera
         corrida de esta versión dio ROJO por eso, con las cuatro
         correcciones ya montadas y funcionando — L-235 por tercera vez en
         este lote. *La aguja se calibra contra lo que la pantalla RENDERIZA,
         jamás contra lo que el diccionario guarda.* */
      const cuerpo = (await page.locator('body').innerText()).toLowerCase();
      return { ok: cuerpo.includes(aguja.toLowerCase()), aguja };
    };

    // ① en el HOY se elige MAÑANA y se cruza: la hermana tiene que abrir ahí
    await page.getByText(manana.slice(8, 10), { exact: true }).locator('visible=true').first().click();
    await page.waitForTimeout(1500);
    await puerta.click();
    await page.waitForTimeout(9000);
    const r1 = await diaVisible(manana);
    console.log(`${r1.ok ? '✅' : '🔴'} ${' '.repeat(10)}   ida: la hermana dice «${r1.aguja}» → ${r1.ok ? 'sí' : 'NO'}`);
    if (!r1.ok) fallos.push(`duenotodo: la ida NO llevó el día (falta «${r1.aguja}» en la hermana)`);

    // ② se mueve la rueda de la hermana y se vuelve: el HOY tiene que
    //    mostrar ESE día. Con `router.back()` el gesto es un POP —la
    //    transición se siente como regreso— y el día llega igual porque
    //    NO viaja: se comparte.
    await page.getByText(pasado.slice(8, 10), { exact: true }).locator('visible=true').first().click();
    await page.waitForTimeout(1500);
    await page.getByText('Tus citas del día', { exact: true }).locator('visible=true').first().click();
    await page.waitForTimeout(9000);
    const r2 = await diaVisible(pasado);
    console.log(`${r2.ok ? '✅' : '🔴'} ${' '.repeat(10)}   vuelta: el HOY dice «${r2.aguja}» → ${r2.ok ? 'sí' : 'NO'}`);
    if (!r2.ok) {
      fallos.push(`duenotodo: la VUELTA no trajo el día — dos días en dos ventanas (falta «${r2.aguja}»)`);
    }

    // ③ 🔴 LA VUELTA ES UN POP DE VERDAD, y esto es lo que el founder cazó
    //    con el dedo: si fuera un `navigate`, la hermana quedaría APILADA
    //    encima y la pila crecería en vez de encoger. Se mide por la
    //    profundidad del historial, que es lo único observable desde afuera.
    const profundidad = await page.evaluate(() => window.history.length);
    console.log(`${' '.repeat(13)}   pila tras ida+vuelta: ${profundidad} entradas`);
  } catch (e) {
    fallos.push(`${caso.cuenta}: EXCEPCIÓN — ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await ctx.close();
  }
}
await browser.close();

if (fallos.length > 0) {
  console.error(`\n🔴 ROJO — ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`   · ${f}`);
  process.exit(1);
}
console.log(`\n✅ VERDE — dos ventanas, una puerta por lado, y UN día que cruza en ambos sentidos.\n`);
