/**
 * medir-s100d-carrito.mjs — ⑧ ⑨ ⑫ · ¿HAY **UNA** PUERTA AL CARRITO, Y
 * APARECE CUANDO TIENE QUE APARECER?
 *
 * ── QUÉ CONTESTA ────────────────────────────────────────────────────────
 * El montaje del `CarritoFlotante` de B en las dos pantallas de C. **No
 * mide la pieza —eso es de B— sino la COMPOSICIÓN**, que es lo mío:
 *  · con el carrito **vacío**, ¿cuántas puertas al carrito hay? (tiene que
 *    ser **cero**: la del techo murió y el flotante no se dibuja en 0);
 *  · tras el primer `+`, ¿aparece **una** y dónde cae? (56×56, abajo a la
 *    derecha — el literal del founder);
 *  · en la **ficha**, ¿está la misma puerta, ahora que el CTA de «ver
 *    carrito» murió?
 *
 * 🔴 **LA TRAMPA QUE ESTE APARATO SE COMIÓ EN SU PRIMERA CORRIDA, y por eso
 * queda escrita:** la ficha se abría con `page.goto(<url del producto>)` y
 * devolvió **cero puertas**. *Se leía exactamente como «la cura no
 * funciona».* La causa no era la pantalla: **`goto` RECARGA la app y el
 * carrito vive EN MEMORIA** (`useCarrito`) ⇒ la ficha se estaba midiendo
 * con 0 unidades, que es justo el caso en que la pieza NO debe dibujarse.
 * ⇒ **la ficha se abre TOCANDO una tarjeta**, que además es el camino de
 * la familia. *Un aparato que reinicia el estado que va a medir siempre
 * mide el estado inicial.*
 *
 * ⚠️ Y la trampa heredada sigue viva: `expo-router` deja la pantalla
 * anterior en el DOM, así que los nodos de **0×0** del reporte son la
 * vitrina detrás de la ficha, no puertas de más.
 *
 * 🔴 CREDENCIALES (R6): la clave sale del keychain AL MOMENTO.
 *
 * Uso: node scripts/medir-s100d-carrito.mjs
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
const PASS = execFileSync('security',['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'],{encoding:'utf8'}).trim();
const b = await chromium.launch({channel:'chrome',headless:true});
const ctx = await b.newContext({locale:'es-EC',viewport:{width:384,height:832}});
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8095/login',{waitUntil:'domcontentloaded',timeout:300000});
await p.waitForTimeout(8000);
await p.getByPlaceholder('ej: ana@correo.com').fill('guillo381+8@gmail.com');
await p.locator('input[type="password"]').fill(PASS);
await p.getByText('Entrar',{exact:true}).click();
await p.waitForTimeout(9000);
await p.goto('http://localhost:8095/despensa',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(10000);
/** Las PUERTAS al carrito — **no los `+` de las tarjetas**. La primera
 *  versión filtraba por «carrito» en el `aria-label` y devolvía los 40
 *  *«Agregar X al carrito»* de la grilla: *el selector contaba agregadores
 *  como puertas, y con ese número la pantalla parecía tener cuarenta.*
 *  Una puerta LLEVA al carrito («Ir al carrito»); un `+` mete algo adentro. */
const puertas = async () => p.evaluate(() => {
  const b=[...document.querySelectorAll('[role="button"]')]
    .filter(e=>/^ir al carrito/i.test(e.getAttribute('aria-label')??''))
    .filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;});
  return b.map(e=>{const r=e.getBoundingClientRect();return {y:Math.round(r.top),x:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height),l:(e.getAttribute('aria-label')??'').slice(0,40)};});
});
console.log('VITRINA · carrito VACÍO → puertas al carrito:', JSON.stringify(await puertas()));
// agregar el primer producto
const mas = p.locator('[role="button"]').filter({hasText:''}).first();
const plus = p.getByRole('button', { name: /Agregar/i }).first();
console.log('¿hay control «Agregar» en la grilla?', await plus.count());
if (await plus.count()>0){ await plus.click(); await p.waitForTimeout(3000); }
console.log('VITRINA · tras agregar 1 → puertas:', JSON.stringify(await puertas()));
// la ficha — POR EL CAMINO REAL (tocando una tarjeta). `page.goto` recarga
// la app y el carrito vive EN MEMORIA: navegar por URL lo vacía y la ficha
// se mediría con 0 unidades. *La primera corrida dio «puertas: []» y el
// defecto era del aparato, no de la pantalla.*
const tarjeta = p.locator('[role="button"][aria-label]').filter({hasText:/\$/}).first();
await tarjeta.click();
await p.waitForTimeout(9000);
console.log('FICHA (camino real) · con 1 en el carrito → puertas:', JSON.stringify(await puertas()));
console.log('errores:', errs.length, errs.slice(0,2));
await b.close();
