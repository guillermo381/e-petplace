/**
 * captura-s98c-atender.mjs — LOTE 2 de S98-C: la tab ATENDER.
 *
 * Server: expo web del prestador en :8081. Salida:
 * `scripts/capturas/s98-c-atender/`.
 *
 * QUÉ FOTOGRAFÍA, y por qué esas y no otras:
 *  · la BARRA con la quinta tab montada y destacada (el montaje por
 *    capacidad — lo que no se puede ver leyendo el código).
 *  · la PORTADA con sus baldosas: una por oficio con local + la tienda.
 *  · la portada en OSCURO — el canto y el plato del glifo cambian de
 *    registro por tema, y ése es justo el par que un typecheck no ve.
 *
 * La credencial sale de `apps/prestador/.env.local` (gitignored) — JAMÁS
 * hardcodeada en un script commiteado (R6).
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('./capturas/s98-c-atender/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
// La cuenta se puede cambiar por variable de entorno SIN tocar el script:
// la portada de ATENDER cambia con QUIÉN entra, así que fotografiarla con
// una sola cuenta es fotografiar una de sus cinco formas. `CUENTA` y
// `CLAVE` viajan por el entorno del comando — jamás commiteadas (R6).
const EMAIL = process.env.CUENTA ?? leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE ?? leer('EXPO_PUBLIC_DEMO_PASSWORD');
const SUFIJO = process.env.SUFIJO ?? '';
if (!EMAIL || !PASS) {
  console.error('✗ faltan credenciales demo en apps/prestador/.env.local');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errores = [];

async function sesion(tema) {
  const ctx = await browser.newContext({
    locale: 'es-EC',
    viewport: { width: 420, height: 900 },
    colorScheme: tema,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errores.push(`[${tema}] ${String(e)}`));
  await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
  await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByText('Entrar', { exact: true }).click();
  await page.waitForTimeout(9000);
  // 🔴 EL GUARD QUE ESTE SCRIPT NO TENÍA, Y SU HISTORIA (S98-C, cazado en
  // vivo): la primera corrida con una cuenta ajena imprimió «✓ sin errores
  // JS» y las tres fotos… de la pantalla de BIENVENIDA. El login había
  // fallado y el script no tenía cómo saberlo, porque solo miraba
  // excepciones — y una sesión que no abre no lanza ninguna.
  // *Un instrumento cuyo modo de falla es sacar la foto equivocada no es
  // un instrumento: es una fuente de evidencia falsa* (L-192). Ahora
  // ABORTA, y su rojo se produjo antes de confiarle una sola captura.
  //
  // ⚠️ Y EL GUARD VIVE EN `foto()`, NO ACÁ — segunda corrección, del mismo
  // error: puesto justo después del click NO disparaba, porque con la
  // clave mala la app se queda en /login y recién REDIRIGE a la
  // bienvenida cuando alguien navega a una ruta protegida. *El guard
  // tiene que mirar lo que se va a fotografiar, no lo que pasó antes.*
  //
  // Y la mitad POSITIVA del guard: con la clave mala la app se queda en
  // /login, que no es la bienvenida y por eso pasaba la mitad negativa.
  // Entrar por la ruta protegida ANTES de fotografiar nada resuelve las
  // dos: o abre la portada, o cae en bienvenida y el guard la caza.
  await page.goto('http://localhost:8081/atender', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(3000);
  return { ctx, page };
}

async function foto(page, nombre) {
  await page.waitForTimeout(1500);
  if ((await page.getByText('para prestadores').count()) > 0) {
    console.error(`✗ ${nombre}: la sesión NO abrió para ${EMAIL} — esto es la BIENVENIDA, no la app.`);
    await browser.close();
    process.exit(1);
  }
  await page.screenshot({ path: `${DIR}${nombre}${SUFIJO}.png`, fullPage: false });
  console.log(`✓ ${nombre}${SUFIJO}.png`);
}

// ── CLARO ──────────────────────────────────────────────────────────────
{
  const { page } = await sesion('light');
  await foto(page, '02-portada-claro');
  // ⭐ S98-C · LA PIZARRA COMO HOJA: se abre SOBRE la portada. El
  // discriminador es que la portada siga viéndose debajo — si fuera
  // navegación, no estaría.
  await page.getByText('La pizarra', { exact: false }).first().click();
  await foto(page, '05-pizarra-hoja');

  // La barra en su casa: HOY con la quinta tab montada y destacada. Y de
  // paso, la frontera de §3.1: el HOY sin «Registrar atención» y sin la
  // entrada a la pizarra — las dos se mudaron a ATENDER.
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 180000 });
  await foto(page, '01-barra-con-atender');
  const restos = [];
  if ((await page.getByText('Registrar atención', { exact: false }).count()) > 0) restos.push('Registrar atención');
  if ((await page.getByText('La pizarra', { exact: false }).count()) > 0) restos.push('pizarra');
  console.log(
    restos.length === 0
      ? '✓ §3.1: el HOY ya no tiene ni la ventanilla ni la pizarra'
      : `✗ §3.1: quedaron restos en el HOY — ${restos.join(' · ')}`,
  );
}

// ── OSCURO ─────────────────────────────────────────────────────────────
{
  const { page } = await sesion('dark');
  await foto(page, '03-portada-oscuro');
}

await browser.close();
if (errores.length > 0) {
  console.error(`✗ ${errores.length} error(es) JS:`);
  for (const e of errores) console.error(`  · ${e}`);
  process.exit(1);
}
console.log('✓ sin errores JS');
