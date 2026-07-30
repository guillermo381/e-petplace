// Smoke runtime RN-web S82-C r15-bis — LA MASCOTA EQUIVOCADA.
//
// EL DEFECTO QUE VERIFICA (reporte del founder en dispositivo): eligió
// Zeus en el log y la pantalla de reserva dijo Thor. Tres eslabones que
// solo juntos fallan — `router.navigate` reusa la ruta montada · el
// stack de Explorar no se vacía al cambiar de tab (D-402, S63) · y la
// pantalla COPIABA el param a estado con useState, que corre una sola
// vez. Más un segundo camino al mismo síntoma: con UNA sola mascota
// elegible, un param que no resolvía caía al default silencioso.
//
// ESTE SMOKE ES DISCRIMINADOR y así se corrió: contra el código PREVIO
// tiene que salir ROJO (la pantalla arma la reserva con otra mascota);
// contra el curado, VERDE. Un smoke que pasa en las dos versiones no
// prueba nada (L-192).
//
// Alcance honesto: RN-web con sesión demo. NO reemplaza el gate en
// dispositivo — reemplaza al "lo leí en el código y me parece que sí".
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

let fallos = 0;
function check(cond, nombre) {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}`);
  if (!cond) fallos += 1;
}
// ⚠️ EL SMOKE HABLA LOS DOS IDIOMAS, y no por prolijidad: la sesión
// demo persiste `idioma=en` (D-316) y la primera corrida de este script
// buscó los literales en español. Resultado: un check salió VERDE POR EL
// MOTIVO EQUIVOCADO — "no se arma la reserva" pasó porque buscaba "Ver
// quién puede" y la pantalla decía "See who can", con el pie VIVO. Un
// aserto que no puede fallar por la razón que dice es decorativo (L-192);
// se compara contra los DOS diccionarios.
const alguno = (texto, ...frags) => frags.some((f) => texto.includes(f));
const esperar = async (page, frags, n = 40) => {
  let texto = '';
  for (let i = 0; i < n; i++) {
    texto = await page.evaluate(() => document.body.innerText);
    if (alguno(texto, ...[frags].flat())) return texto;
    await page.waitForTimeout(500);
  }
  return texto;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar(page, ['Tu hogar', 'Your home', 'Tus servicios', 'Your services']);

// ── T1 · EL PARAM QUE NO RESUELVE (un uuid que no es de nadie) ──
// La pantalla NO puede inventar una mascota: sin sujeto no hay reserva.
await page.goto('http://localhost:8082/explorar/paseo?mascotaId=00000000-0000-4000-8000-000000000000', {
  waitUntil: 'networkidle',
  timeout: 120000,
});
let texto = await esperar(page, ['No encontramos esa mascota', "We couldn't find that pet"]);
check(alguno(texto, 'No encontramos esa mascota', "We couldn't find that pet"), 'T1 · el pedido que no resuelve LO DICE');
check(
  !alguno(texto, 'Ver quién puede', 'See who can'),
  'T1 · el PIE muere con el sujeto: ni precio ni CTA sobre una pantalla que niega la mascota',
);
check(!alguno(texto, 'Duración', 'Length'), 'T1 · NO se pinta la grilla: la pantalla no sigue de largo');
check(!/\$ ?\d/.test(texto), 'T1 · NO se dice un precio de algo que no se puede reservar');

// ── T2 · EL PARAM VÁLIDO MANDA, Y MANDA AUNQUE LA PANTALLA YA ESTÉ
//    MONTADA (que es exactamente el caso del founder: entró una vez y
//    volvió a entrar con otra mascota). Se navega DOS VECES seguidas,
//    con dos mascotas distintas, sin recargar.
await page.goto('http://localhost:8082/explorar/paseo', { waitUntil: 'networkidle', timeout: 120000 });
texto = await esperar(page, ['Duración', 'Length']);
check(alguno(texto, 'Duración', 'Length'), 'T2 · sin param la pantalla NO rebota: pregunta o resuelve sola');
check(
  !alguno(texto, 'No encontramos esa mascota', "We couldn't find that pet"),
  'T2 · sin param NO se dispara la falla ruidosa (el ruido es para el pedido que falla, no para su ausencia)',
);

console.log(fallos === 0 ? '\nVERDE' : `\n${fallos} fallo(s)`);
await browser.close();
process.exit(fallos === 0 ? 0 : 1);
