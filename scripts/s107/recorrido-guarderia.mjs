/**
 * S107-C · RECORRIDO DEL FLUJO DE GUARDERÍA — el gate que le ahorro al founder.
 *
 * 🔴 QUÉ MIDE Y QUÉ NO, declarado antes de leer un número:
 * · SÍ: que la ruta EXISTA, que MONTE sin reventar, que la redirección de N=1
 *   ocurra, y qué texto pinta.
 * · NO: los datos de Aurora — **este recorrido corre SIN SESIÓN**. Una pantalla
 *   que acá pinta su vacío honesto podría pintar otra cosa con datos.
 *   *Decirlo importa: un verde de este script NO es un gate del founder.*
 *
 * 🔴 EXIGE LA API VIVA. Levantá el servidor con `scripts/s107/levantar-cliente-web.sh`
 * — **sin las env vars de Supabase la app no llama a `initApi()`**, toda pantalla
 * queda en esqueleto y este recorrido reporta seis rutas «rotas» que son el
 * arnés. *Pasó el 29-ago.* Ese script trae además el aviso de por qué **no** se
 * corre `supabase projects api-keys` a secas.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8091';
const RUTAS = [
  ['/explorar', 'la baldosa de guardería'],
  ['/hogar/guarderia', 'EL LOG'],
  ['/explorar/guarderia', 'ETAPA 1 · modalidad (debe REDIRIGIR: N=1)'],
  ['/explorar/guarderia/disponibles', 'ETAPA 2 · día y quién puede'],
  ['/explorar/guarderia/disponibles?modalidad=paquete', 'ETAPA 2 · rama paquete'],
  ['/explorar/guarderia/disponibles?modalidad=mensual', 'ETAPA 2 · rama mensual'],
  ['/guarderia/abc-123', 'EL DURANTE (sin entrada cableada, a propósito)'],
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

let fallos = 0;
for (const [ruta, nombre] of RUTAS) {
  const errores = [];
  const onErr = (e) => errores.push(String(e).slice(0, 200));
  page.on('pageerror', onErr);
  page.on('console', (m) => { if (m.type() === 'error') onErr(m.text()); });

  await page.goto(BASE + ruta, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errores.push('NAV: ' + e.message));
  await page.waitForTimeout(1500);

  const url = new URL(page.url()).pathname + new URL(page.url()).search;
  const texto = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').trim();
  const vacio = texto.length === 0;
  const duros = errores.filter((e) => !/Require cycle|useNativeDriver|deprecated|shadow\*|pointerEvents|props\.pointerEvents/i.test(e));

  const marca = duros.length > 0 || vacio ? '✗' : '✓';
  if (marca === '✗') fallos++;
  console.log(`\n${marca} ${nombre}`);
  console.log(`   pedida:  ${ruta}`);
  console.log(`   aterriza:${url}${url !== ruta.split('?')[0] && !url.startsWith(ruta.split('?')[0]) ? '   ⬅ REDIRIGIÓ' : ''}`);
  console.log(`   pinta:   ${vacio ? '🔴 NADA (pantalla en blanco)' : texto.slice(0, 260)}`);
  if (duros.length > 0) console.log(`   🔴 errores: ${duros.slice(0, 3).join(' | ')}`);

  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
}

await browser.close();
console.log(`\n${fallos === 0 ? '✓ recorrido sin pantallas rotas' : `✗ ${fallos} ruta(s) con problema`}`);
console.log('⚠️ SIN SESIÓN: esto no reemplaza el gate del founder con datos de Aurora.');
process.exit(fallos === 0 ? 0 : 1);
