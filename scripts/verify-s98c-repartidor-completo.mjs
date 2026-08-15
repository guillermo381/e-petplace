/**
 * verify-s98c-repartidor-completo.mjs — EL GUARD DE OBLIGATORIEDAD.
 *
 * ⏪ ESTE INSTRUMENTO CAMBIÓ DE PREGUNTA, y se dice en vez de dejar el título
 * viejo sobre un cuerpo nuevo. Verificaba el ALTA COMPLETA de punta a punta
 * —y lo hizo: CEDULA · +593988777111 · +593988777222 · carro en su tabla—
 * hasta que la foto de la persona pasó a ser OBLIGATORIA (firma del founder,
 * guard coordinado con A).
 *
 * 🔴 **Con la foto obligatoria, el camino feliz DEJA DE SER ALCANZABLE desde
 * acá:** subirla exige la cámara o el selector del sistema, que este arnés no
 * maneja. *No se afloja el guard para que el test pase* —eso sería mover la
 * vara para que la medición cierre— y **tampoco se deja el verde viejo, que
 * ahora mediría un camino que ya no existe.**
 *
 * ⇒ Lo que mide HOY: **que el guard FRENE.** Con todo lo demás completo y sin
 * foto, el CTA tiene que quedar apagado, la pantalla tiene que DECIR qué
 * falta, y **no puede nacer ninguna fila**.
 *
 * ⇒ Lo que queda debiendo y tiene dueño: **el camino feliz con foto real lo
 * camina A en el aparato** — declarado, no omitido.
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
await page.waitForTimeout(600);

// ── LA VOZ: el CTA apagado tiene que decir QUÉ falta, no callarse.
const dice = (await page.getByText('Falta la foto de la persona', { exact: false }).count()) > 0;
/* ⚠️ POR ROL, no por texto: en RN-web el \`getByText\` clickea el NODO DE
   TEXTO, y con el formulario más alto ese click puede no llegar al Pressable
   padre — el botón recibe FOCO y no PRESS, que desde afuera se ve idéntico a
   «no pasó nada». El rol apunta al tocable de verdad. */
const cta = page.getByRole('button', { name: 'Guardar', exact: true }).last();
/* El CTA se comprueba APAGADO/ENCENDIDO antes de tocarlo: si estuviera
   deshabilitado, el click no haría nada y el rojo de abajo culparía al
   guardado en vez de a la validación. */
// EL GUARD: sin foto, apagado. Se COMPRUEBA en vez de clickear —clickear un
// botón que debe estar apagado mide el click, no el guard.
const apagado = await cta.isDisabled().catch(() => false);

// Y el discriminador que cierra: NINGUNA fila pudo nacer.
const nacidas = sql(
  `SELECT count(*)::int AS n FROM repartidores WHERE documento = '${DOC}';`,
)[0].n;

limpiar();
const residuoRep = sql(
  `SELECT count(*)::int AS n FROM repartidores WHERE documento = '${DOC}';`,
)[0].n;
const residuoVeh = sql(
  `SELECT count(*)::int AS n FROM repartidor_vehiculos WHERE placa = '${PLACA}';`,
)[0].n;
await browser.close();

console.log('── verify-s98c-repartidor-completo · EL GUARD ──');
console.log(`el CTA queda APAGADO sin foto ..: ${apagado ? 'VERDE' : 'ROJO'}`);
console.log(`la pantalla DICE qué falta .....: ${dice ? 'VERDE' : 'ROJO'}`);
console.log(`filas nacidas ..................: ${nacidas} (debe ser 0)`);
console.log(`residuo repartidores=${residuoRep} vehiculos=${residuoVeh} (ambos 0)`);
console.log(`errores JS: ${errores.length}`);
for (const e of errores) console.log('  ' + e);
console.log('⚠️ el camino feliz con foto real NO se mide acá: lo camina A en el aparato.');

if (!apagado || !dice || nacidas !== 0 || residuoRep !== 0 || residuoVeh !== 0) {
  console.error('ROJO');
  process.exit(1);
}
console.log('VERDE — el guard frena, lo dice, y nada nace.');
