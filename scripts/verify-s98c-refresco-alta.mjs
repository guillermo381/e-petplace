/**
 * verify-s98c-refresco-alta.mjs — EL REFRESCO TRAS UN ALTA, CONTRA UNA CARRERA.
 *
 * 🔴 POR QUÉ TRES VUELTAS Y NO UNA: el defecto original NO era «no refresca»,
 * era **INTERMITENTE**. Medido con sonda: en dos corridas idénticas el mismo
 * alta refrescó una vez y la otra no (`recargar()` disparó a +257 ms y el
 * efecto no volvió a correr en 12 s). La causa: la carga vivía dentro de un
 * `useFocusEffect` y los altas la disparaban bumpeando una dep — pero al
 * guardar se cierra la Hoja, que es un `Modal` nativo, y ese desmontaje mueve
 * el foco; el efecto acoplado al foco a veces observaba el cambio y a veces
 * se lo tragaba.
 *
 * ⇒ **Una sola vuelta verde no prueba nada acá.** Un instrumento de una
 * corrida contra un defecto intermitente es una moneda al aire con forma de
 * test: acierta la mitad de las veces y las dos respuestas se leen igual.
 *
 * Se prueba con el RECURSO y no con el repartidor a propósito: el repartidor
 * exige foto y este arnés no maneja la cámara. La carga es LA MISMA para los
 * tres altas, así que el recurso mide la cura sin necesitar el que no puedo
 * tocar.
 *
 * ESCRIBE. Limpia por nombre y verifica residuo 0.
 */
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const RAIZ = new URL('..', import.meta.url).pathname;
const PASS =
  process.env.CLAVE ||
  execSync('security find-generic-password -a siembra -s epetplace-siembra-s97 -w', {
    encoding: 'utf8',
  }).trim();
const sql = (t) => {
  const f = `/tmp/s98c-refr-${Date.now()}.sql`;
  writeFileSync(f, t);
  const o = execSync(`npx supabase --experimental db query --linked --file ${f} 2>/dev/null`, {
    encoding: 'utf8',
    cwd: RAIZ,
  });
  return JSON.parse(o.match(/(\[[\s\S]*\])/)[1]);
};

sql(`DELETE FROM recursos_reparto WHERE nombre LIKE 'S98C REFRESCO%';`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill('guillo381+duenotodo@gmail.com');
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);
await page.goto('http://localhost:8081/ventas/configuracion', {
  waitUntil: 'networkidle',
  timeout: 180000,
});
await page.waitForTimeout(6000);

if ((await page.getByText('Cortes horarios', { exact: false }).count()) === 0) {
  console.error('✗ ABORTA SIN VEREDICTO: no llegué a /ventas/configuracion');
  sql(`DELETE FROM recursos_reparto WHERE nombre LIKE 'S98C REFRESCO%';`);
  await browser.close();
  process.exit(2);
}

const vueltas = [];
for (let i = 1; i <= 3; i++) {
  const nombre = `S98C REFRESCO ${i}`;
  await page.getByText('Agregar recurso', { exact: false }).first().click();
  await page.waitForTimeout(2000);
  await page.getByLabel('Nombre (ej. Moto)', { exact: false }).first().fill(nombre);
  await page.getByLabel('Entregas por día', { exact: false }).first().fill('3');
  await page.getByRole('button', { name: 'Guardar', exact: true }).last().click();
  // 5 s: la cura llama la carga DIRECTO, sin esperar al foco. Si hiciera
  // falta más, sería otro defecto (lentitud) y este número lo diría.
  await page.waitForTimeout(5000);
  const visible = (await page.getByText(nombre, { exact: false }).count()) > 0;
  vueltas.push({ i, visible });
  console.log(`vuelta ${i}: ${visible ? 'VERDE — apareció sin salir' : 'ROJO — no apareció'}`);
}

sql(`DELETE FROM recursos_reparto WHERE nombre LIKE 'S98C REFRESCO%';`);
const residuo = sql(
  `SELECT count(*)::int AS n FROM recursos_reparto WHERE nombre LIKE 'S98C REFRESCO%';`,
)[0].n;
await browser.close();

const todas = vueltas.every((v) => v.visible);
console.log('── verify-s98c-refresco-alta ──');
console.log(`vueltas verdes: ${vueltas.filter((v) => v.visible).length}/3 (las TRES, o es carrera)`);
console.log(`residuo: ${residuo} (debe ser 0)`);
console.log(`errores JS: ${errores.length}`);
for (const e of errores) console.log('  ' + e);

if (!todas || residuo !== 0) {
  console.error('ROJO');
  process.exit(1);
}
console.log('VERDE — tres de tres: el alta refresca sin depender del foco.');
