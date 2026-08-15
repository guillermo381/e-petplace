/** ⚠️ INSTRUMENTO CON SU ALCANCE DECLARADO — NO probó lo que fue a probar.
 *
 *  Iba a confirmar el CABLEADO de la segunda cura del teléfono en el PASO
 *  EQUIPO del alta. **El asistente abre en el paso 1 y llegar al 4 exige
 *  caminarlo entero, mutando el estado del alta de una cuenta real.** No se
 *  fabricó ese camino para sacar una foto.
 *
 *  LO QUE SÍ MIDIÓ, y vale poco pero no es cero: la ruta monta con **0
 *  errores JS** después de la edición — o sea que el módulo compila y carga.
 *  **LO QUE NO MIDIÓ: que el control con indicativo se DIBUJE en el paso 4**
 *  (`montajes de +593` dio 0 porque esa pantalla no llegó a montarse, no
 *  porque falte el control — y esa distinción es justo la que un verde
 *  perezoso borraría).
 *
 *  El respaldo de esa cura es: typecheck · `verify:diseno` · y que su lógica
 *  es la MISMA ya verificada por camino real en `ventas/configuracion`
 *  (`verify-s98c-telefono-repartidor.mjs`). **Su propio E2E queda debiendo.** */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
const DIR = new URL('./capturas/s98-c-corte/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const PASS = execSync('security find-generic-password -a siembra -s epetplace-siembra-s97 -w',{encoding:'utf8'}).trim();
const b = await chromium.launch({ channel:'chrome', headless:true });
const p = await (await b.newContext({locale:'es-EC',viewport:{width:420,height:900}})).newPage();
const errores=[]; p.on('pageerror', e=>errores.push(String(e)));
await p.goto('http://localhost:8081/login',{waitUntil:'networkidle',timeout:180000});
await p.getByPlaceholder('ej: ana@correo.com').fill('guillo381+duenotodo@gmail.com');
await p.locator('input[type="password"]').fill(PASS);
await p.getByText('Entrar',{exact:true}).click(); await p.waitForTimeout(9000);
await p.goto('http://localhost:8081/verificacion/alta',{waitUntil:'networkidle',timeout:180000});
await p.waitForTimeout(7000);
await p.screenshot({ path: DIR+'08-alta-inicio.png' });
// El selector de indicativo es el discriminador: si montó, la cura está cableada.
const hayPrefijo = await p.getByText('+593',{exact:false}).count();
console.log('montajes de +593 en la pantalla:', hayPrefijo);
console.log('errores JS:', errores.length); errores.forEach(e=>console.log('  '+e));
await b.close();
