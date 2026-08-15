/**
 * verify-s98c-repartidor-completo.mjs — EL ALTA COMPLETA, POR CAMINO REAL.
 *
 * Lo ya probado NO se re-prueba acá: el teléfono tiene su propio instrumento.
 * **Esto mide lo que nació hoy y nadie vio persistir:** tipo de documento,
 * WhatsApp compuesto en E.164, y **el vehículo, que vive en OTRA TABLA** —el
 * caso donde un alta puede «funcionar» a medias: la persona entra y su moto
 * no, sin que nadie lo note.
 *
 * ⚠️ LO QUE NO MIDE, dicho para que el verde no se lea de más: **las fotos.**
 * Subirlas exige la cámara o el selector de archivos del sistema, que este
 * arnés no maneja. Su camino queda verificado solo hasta el borde: el control
 * monta (captura 09) y el código de subida es el mismo `cuenta-documentos`
 * que ya usa el alta de documentos de la cuenta. **Su E2E queda debiendo y no
 * se disfraza.**
 *
 * ESCRIBE. Limpia por documento y verifica residuo 0 en LAS DOS tablas — un
 * vehículo huérfano sería residuo igual (aunque el CASCADE lo cubre, se
 * comprueba en vez de confiar).
 */
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

/* 🔴 DIEZ DÍGITOS, y no es cosmético: declarar `tipo_documento: CEDULA`
   ACTIVA en el motor la validación del número contra la máscara del catálogo.
   La primera versión de este archivo usaba `S98C-VERIFY-COMPLETO` y el alta
   rebotaba `documento_no_coincide_con_tipo` — **el motor tenía razón y el
   test estaba mal**. Se deja escrito porque el rojo fue útil: destapó que la
   pantalla no tenía voz para ese rebote.
   El prefijo `9999` lo hace reconocible como sonda sin romper la máscara. */
const DOC = '9999000001';
const PLACA = 'S98C-XYZ';
const EMAIL = process.env.CUENTA || 'guillo381+duenotodo@gmail.com';
const PASS =
  process.env.CLAVE ||
  execSync('security find-generic-password -a siembra -s epetplace-siembra-s97 -w', {
    encoding: 'utf8',
  }).trim();

const sql = (texto) => {
  const f = `/tmp/s98c-comp-${Date.now()}.sql`;
  writeFileSync(f, texto);
  const out = execSync(`npx supabase --experimental db query --linked --file ${f} 2>/dev/null`, {
    encoding: 'utf8',
    cwd: new URL('..', import.meta.url).pathname,
  });
  return JSON.parse(out.match(/(\[[\s\S]*\])/)[1]);
};
const limpiar = () => sql(`DELETE FROM repartidores WHERE documento = '${DOC}';`);

limpiar();

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);
await page.goto('http://localhost:8081/ventas/configuracion', {
  waitUntil: 'networkidle',
  timeout: 180000,
});
await page.waitForTimeout(6000);

async function abortar(porque) {
  console.error(`✗ ABORTA SIN VEREDICTO: ${porque}`);
  limpiar();
  await browser.close();
  process.exit(2);
}

if ((await page.getByText('Repartidores', { exact: false }).count()) === 0) {
  await abortar('no llegué a /ventas/configuracion');
}
await page.getByText('Registrar repartidor', { exact: false }).first().click();
await page.waitForTimeout(2500);
if ((await page.getByText('Foto del documento', { exact: false }).count()) === 0) {
  await abortar('el formulario COMPLETO no montó (falta la foto del documento)');
}

await page.getByLabel('Nombre', { exact: false }).first().fill('VERIFY COMPLETO');
await page.getByLabel('Documento', { exact: false }).first().fill(DOC);
// Teléfono y WhatsApp comparten el país: se tipean SIN el 0 de tránsito.
const tels = page.getByPlaceholder('99 123 4567');
await tels.nth(0).fill('988777111');
await tels.nth(1).fill('988777222');
await page.getByText('Cédula', { exact: true }).click();
await page.waitForTimeout(300);
await page.getByText('Agregar vehículo', { exact: false }).click();
await page.waitForTimeout(800);
await page.getByText('Carro', { exact: true }).click();
await page.getByLabel('Placa', { exact: false }).first().fill(PLACA);
await page.waitForTimeout(400);
/* ⚠️ POR ROL, no por texto: en RN-web el \`getByText\` clickea el NODO DE
   TEXTO, y con el formulario más alto ese click puede no llegar al Pressable
   padre — el botón recibe FOCO y no PRESS, que desde afuera se ve idéntico a
   «no pasó nada». El rol apunta al tocable de verdad. */
const cta = page.getByRole('button', { name: 'Guardar', exact: true }).last();
/* El CTA se comprueba APAGADO/ENCENDIDO antes de tocarlo: si estuviera
   deshabilitado, el click no haría nada y el rojo de abajo culparía al
   guardado en vez de a la validación. */
if ((await cta.isDisabled().catch(() => false)) === true) {
  await abortar('el CTA quedó deshabilitado con datos válidos');
}
await cta.click();
await page.waitForTimeout(8000);

const fila =
  sql(
    `SELECT r.tipo_documento AS tipodoc, r.telefono AS tel, r.whatsapp AS wa,
            (SELECT count(*)::int FROM repartidor_vehiculos v WHERE v.repartidor_id = r.id) AS nveh,
            (SELECT v.tipo || ':' || v.placa FROM repartidor_vehiculos v WHERE v.repartidor_id = r.id LIMIT 1) AS veh
       FROM repartidores r WHERE r.documento = '${DOC}';`,
  )[0] ?? null;

limpiar();
const residuoRep = sql(
  `SELECT count(*)::int AS n FROM repartidores WHERE documento = '${DOC}';`,
)[0].n;
const residuoVeh = sql(
  `SELECT count(*)::int AS n FROM repartidor_vehiculos WHERE placa = '${PLACA}';`,
)[0].n;
await browser.close();

const okDoc = fila?.tipodoc === 'CEDULA';
const okTel = fila?.tel === '+593988777111';
const okWa = fila?.wa === '+593988777222';
const okVeh = fila?.nveh === 1 && fila?.veh === `carro:${PLACA}`;

console.log('── verify-s98c-repartidor-completo ──');
console.log(`tipo de documento ...: ${okDoc ? 'VERDE' : 'ROJO'} (${fila?.tipodoc})`);
console.log(`teléfono E.164 ......: ${okTel ? 'VERDE' : 'ROJO'} (${fila?.tel})`);
console.log(`whatsapp E.164 ......: ${okWa ? 'VERDE' : 'ROJO'} (${fila?.wa})`);
console.log(`vehículo (otra tabla): ${okVeh ? 'VERDE' : 'ROJO'} (${fila?.nveh} · ${fila?.veh})`);
console.log(`residuo repartidores=${residuoRep} vehiculos=${residuoVeh} (ambos 0)`);
console.log(`errores JS: ${errores.length}`);
for (const e of errores) console.log('  ' + e);

if (!okDoc || !okTel || !okWa || !okVeh || residuoRep !== 0 || residuoVeh !== 0) {
  console.error('ROJO');
  process.exit(1);
}
console.log('VERDE — identidad, los dos números en E.164 y el vehículo en su tabla.');
