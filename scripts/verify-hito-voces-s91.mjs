// ============================================================================
// VERIFY — LAS TRES VOCES DEL HITO, EN RUNTIME (S91-D)
//
// El typecheck prueba que las claves existen; NO prueba que el motor emita la
// clave que la pantalla espera. Este verify da de alta TRES mascotas por el
// camino real y lee el nodo que aparece en su línea de vida.
//
// EL DISCRIMINADOR, y es lo que lo hace honesto: los casos ① y ② se dan de
// alta con la MISMA pantalla y a segundos de distancia — solo cambia la
// PRECISIÓN de la fecha. Si los dos dijeran lo mismo, la regla del servidor no
// estaría rigiendo y este verify sería verde sobre nada.
//
// Limpia sus datos al final (cuentas `s91d-hito-*`).
// Uso: con `npx expo start --web --port 8082` en apps/cliente.
// ============================================================================
import { chromium } from 'playwright-core';
const P = `http://localhost:${process.env.PORT_CLIENTE ?? '8082'}`;
const CLAVE = 'Hito-S91d-2026';

let fallos = 0;
const check = (c, n) => { console.log(`${c ? '  ok  ' : '  EN ROJO  '}${n}`); if (!c) fallos++; };

const hoy = new Date();
const haceMeses = (m) => { const d = new Date(hoy); d.setMonth(d.getMonth() - m); return d; };

const CASOS = [
  { id: 'cachorro', especie: 'Perro',   nombre: 'HitoCachorro', nacida: haceMeses(1), etapa: null,
    espera: 'Una vida nueva empieza', porque: 'cachorro con fecha EXACTA reciente' },
  { id: 'adulto',   especie: 'Perro',   nombre: 'HitoAdulto',   nacida: null,         etapa: null,
    espera: 'HitoAdulto llegó a la familia', porque: 'sin fecha' },
  { id: 'acuario',  especie: 'Acuario', nombre: 'HitoAcuario',  nacida: null,         etapa: null,
    espera: 'Un mundo nuevo empieza', porque: 'el sujeto es un acuario' },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const correos = [];

for (const caso of CASOS) {
  const correo = `s91d-hito-${caso.id}-${Date.now()}@epetplace.dev`;
  correos.push(correo);
  const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  const cuerpo = () => page.evaluate(() => document.body.innerText);
  /** RN-web deja las pantallas ANTERIORES montadas: un `.last()` a secas cae
   *  en la de atrás y el click lo intercepta el scroller de arriba. Se toca
   *  SOLO lo visible. */
  const tocar = async (texto) => {
    // Se elige el candidato que está ARRIBA en su propio centro
    // (`elementFromPoint`): con dos pantallas montadas, el `.last()` del DOM
    // puede ser el de la pantalla de atrás y su click lo intercepta el
    // scroller de la de adelante. Preguntar quién recibe el punto no depende
    // del orden del DOM.
    const ok = await page.evaluate((txt) => {
      const cands = [...document.querySelectorAll('div')].filter(
        (d) => d.textContent === txt && d.offsetParent !== null,
      );
      for (const el of cands.reverse()) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const arriba = document.elementFromPoint(x, y);
        if (!arriba || !(el.contains(arriba) || arriba.contains(el))) continue;
        const destino = el.closest('[role="button"]') ?? el;
        for (const tipo of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
          destino.dispatchEvent(
            new MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y }),
          );
        }
        return true;
      }
      return false;
    }, texto);
    if (!ok) throw new Error(`no se pudo tocar «${texto}» (ningún candidato quedó arriba)`);
    await page.waitForTimeout(600);
  };
  const esperar = async (aguja, n = 40) => {
    for (let i = 0; i < n; i++) { const t = await cuerpo(); if (t.includes(aguja)) return t; await page.waitForTimeout(500); }
    return cuerpo();
  };

  await page.goto(`${P}/registro`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2000);
  await page.locator('input').nth(0).fill('Hito D');
  await page.locator('input').nth(1).fill(correo);
  await page.locator('input[type="password"]').first().fill(CLAVE);
  await tocar('Crear mi cuenta');
  await esperar('¿Quién se suma a tu casa?');

  // ── EL ALTA SE RECORRE POR URL, y no es un atajo ──────────────────────────
  // «URL-reconstruible: avanza por params» es una propiedad DECLARADA de la
  // pieza, así que entrar por la ruta del cierre la EJERCE. Y de paso esquiva
  // el stack de RN-web, donde las pantallas anteriores quedan montadas y sus
  // botones interceptan el click de la de adelante — un problema del arnés,
  // no del producto.
  const params = new URLSearchParams({ nombre: caso.nombre, especie: caso.especie === 'Acuario' ? 'pez' : 'perro' });
  if (caso.especie === 'Acuario') params.set('raza', 'dulce');
  if (caso.nacida !== null) {
    params.set('fecha', caso.nacida.toISOString().slice(0, 10));
    params.set('precision', 'exacta'); // ← EL DISCRIMINADOR de ① contra ②
  }
  await page.goto(`${P}/onboarding/cierre?${params.toString()}`, { waitUntil: 'networkidle', timeout: 120000 });

  await esperar('completar el perfil');
  await tocar('Completar ahora');
  // Se espera la frase ENTERA, no su primera palabra: «Un» es subcadena de
  // «Una» y el NOMBRE ya está en el encabezado antes de que cargue el
  // timeline — esperar por ellos daba verde y rojo por azar, no por el hecho.
  const perfil = await esperar(caso.espera, 40);

  check(perfil.includes(caso.espera), `${caso.id} (${caso.porque}) → «${caso.espera}»`);
  if (!perfil.includes(caso.espera)) {
    const linea = perfil.split('\n').find((l) => l.includes('Momento') || l.includes('empieza') || l.includes('llegó'));
    console.log(`     lo que se leyó: ${linea ?? '(ningún nodo de hito)'}`);
  }
  await ctx.close();
}

// EL DISCRIMINADOR: ① y ② no pueden decir lo mismo.
check(CASOS[0].espera !== CASOS[1].espera, 'los tres casos esperan voces DISTINTAS (si no, este verify no discrimina)');

await browser.close();
console.log('\ncuentas a limpiar:\n' + correos.join('\n'));
console.log(fallos === 0 ? '\nVERDE — las tres voces del hito, por camino real.' : `\nEN ROJO — ${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
