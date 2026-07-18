// Smoke web S68-B — el mundo VETERINARIA del prestador:
// B1 tarjeta en Negocio + portada + taller con el menú de toggles en el
// orden firmado (voz honesta de telemedicina, neto en vivo, especialidades)
// · B2 horarios (default sereno + elección de modo D-386; la sección
// compartida TAMBIÉN en el taller del adiestramiento — D-426 muerta)
// · B3 procedimientos + verificación profesional · B4 resumen.
// SOLO LECTURA + interacción local (los toggles no guardan nada).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PUERTO = process.env.PORT_PRESTADOR ?? '8085';
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
let fallos = 0;
const check = (cond, nombre) => {
  console.log(`${cond ? '✓' : '✗ FALTA'} ${nombre}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 1600 } });
const page = await ctx.newPage();
const texto = async () => await page.evaluate(() => document.body.innerText);
const esperar = async (frase, veces) => {
  let t = await texto();
  for (let i = 0; i < veces && !t.includes(frase); i++) {
    await page.waitForTimeout(1000);
    t = await texto();
  }
  return t;
};

// login demo (patrón S60)
await page.goto(`http://localhost:${PUERTO}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await esperar('Contraseña', 60);
await page.getByRole('textbox', { name: 'Email' }).fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await esperar('Tu jornada de hoy', 60);

// ── B1 — LA TARJETA EN NEGOCIO ──
await page.goto(`http://localhost:${PUERTO}/negocio`, { waitUntil: 'networkidle' });
let t = await esperar('Tu negocio', 30);
check(t.includes('Veterinaria'), 'T1 la tarjeta Veterinaria vive en Negocio');

// ── B4 — LA PORTADA/RESUMEN ──
await page.goto(`http://localhost:${PUERTO}/veterinaria`, { waitUntil: 'networkidle' });
t = await esperar('Veterinaria', 30);
const peldano0 = t.includes('Abre tu consultorio');
check(
  peldano0 || t.includes('Tus servicios'),
  'T2 la portada: peldaño 0 (invitación) o el resumen por servicio',
);
check(t.includes('Verificación profesional') || t.includes('Perfil verificado'), 'T3 la verificación como estado/celda en la portada');

// ── B1 — EL TALLER: menú en el orden firmado ──
await page.goto(`http://localhost:${PUERTO}/veterinaria/taller`, { waitUntil: 'networkidle' });
t = await esperar('Servicios y precios', 30);
const orden = [
  'Cita regular',
  'Vacunación',
  'Cita especializada',
  'Urgencia en local',
  'Urgencia a domicilio',
  'Telemedicina',
];
const posiciones = orden.map((s) => t.indexOf(s));
check(posiciones.every((p) => p >= 0), 'T4 los 6 ítems del menú presentes');
check(
  posiciones.every((p, i) => i === 0 || p > posiciones[i - 1]),
  'T5 el orden del menú es el FIRMADO',
);
check(
  t.includes('Configúrala ahora — las familias la verán cuando la videollamada esté lista'),
  'T6 la voz honesta de telemedicina (obligatoria, con tilde S68-B5)',
);

// T7: prender Cita regular despliega inline precio + duración + horario
const switchRegular = page.locator('[role="switch"][aria-label="Ofrecer · Cita regular"]');
const encendido = (await switchRegular.getAttribute('aria-checked')) === 'true';
if (!encendido) {
  await switchRegular.click();
  await page.waitForTimeout(500);
}
t = await texto();
check(t.includes('Precio'), 'T7a el precio inline del toggle prendido');
check(t.includes('Duración') && t.includes('min'), 'T7b la duración inline (defaults de DB; menú curado B9)');
check(
  t.includes('e-PetPlace retiene') || t.includes('No pudimos leer la comisión vigente'),
  'T7c el neto en vivo (VozComision compartida, 7.15)',
);
check(t.includes('Horario'), 'T8a la fila Horario del toggle');
check(t.includes('Usa tu horario general'), 'T8b el default sereno "usa tu horario general"');

// T9: la especializada suma chips (6 del catálogo + Otra)
const switchEsp = page.locator('[role="switch"][aria-label="Ofrecer · Cita especializada"]');
if ((await switchEsp.getAttribute('aria-checked')) !== 'true') {
  await switchEsp.click();
  await page.waitForTimeout(500);
}
t = await texto();
const chips = ['Dermatología', 'Traumatología y ortopedia', 'Cardiología', 'Oftalmología', 'Odontología', 'Medicina interna'];
check(chips.every((c) => t.includes(c)), 'T9a los 6 chips del catálogo VIVO de especialidades');
check(t.includes('Otra'), 'T9b el chip "Otra" presente');
// S68-B6: la especializada COBRA — la voz de espera murió (Ley 37) y el
// bloque precio/duración persiste como cualquier toggle
check(
  !t.includes('Tus especialidades se guardan ya'),
  'T9c la voz de espera de la especializada MURIÓ (B6: el comprable existe)',
);

// ── B5 — urgencias VIVAS (el gate por catálogo se encendió solo) ──
const switchUrg = page.locator('[role="switch"][aria-label="Ofrecer · Urgencia en local"]');
if ((await switchUrg.getAttribute('aria-checked')) !== 'true') {
  await switchUrg.click();
  await page.waitForTimeout(500);
}
t = await texto();
check(
  !t.includes('se activa cuando el catálogo del oficio quede listo'),
  'T18a urgencias vivas: la voz de catálogo-pendiente MURIÓ del taller',
);
check(t.includes('Se ofrece cuando guardes.'), 'T18b la urgencia prendida se ofrece al guardar (persistencia viva)');

// ── B2 — HORARIOS: la sección compartida con la elección D-386 ──
await page.goto(`http://localhost:${PUERTO}/veterinaria/taller?seccion=horarios`, { waitUntil: 'networkidle' });
t = await esperar('Cómo organizas tu agenda', 30);
check(t.includes('Cómo organizas tu agenda'), 'T10 la elección de modo D-386 vive en el taller vet');
check(t.includes('Una agenda para todo') && t.includes('Por servicio'), 'T11 las dos opciones del modo presentes');

// ── B8 — LA CONVERSIÓN CON VOZ (interacción local; sin escribir) ──
const enUniversal = t.includes('Tus franjas valen para todos tus servicios');
if (enUniversal) {
  // T21: la IDA abre la Hoja de CONVERSIÓN (solo si hay franjas — sin
  // franjas el modo cambiaría de verdad y el smoke no escribe)
  if (!t.includes('Sin franjas todavía')) {
    await page.getByText('Por servicio', { exact: true }).click();
    t = await esperar('Convertir tu agenda', 15);
    check(
      t.includes('no se borra nada') && t.includes('Convertir'),
      'T21 la Hoja de conversión con la voz firmada (nada se borra)',
    );
    await page.getByText('Cancelar', { exact: true }).click();
    await page.waitForTimeout(500);
  } else {
    console.log('· T21 saltado: el demo no tiene franjas generales (el click cambiaría el modo de verdad)');
  }
  // T20: el gesto — el selector de servicios vive TAMBIÉN en universal.
  // Se prueba en el taller del PASEO (el demo tiene ofertas guardadas
  // ahí; en vet sin ofertas guardadas el selector no se monta — correcto)
  await page.goto(`http://localhost:${PUERTO}/paseo/taller?seccion=horarios`, { waitUntil: 'networkidle' });
  t = await esperar('Cómo organizas tu agenda', 30);
  await page.getByText('Toda la semana', { exact: true }).click();
  await page.getByText('Agregar franja', { exact: true }).click();
  t = await esperar('Nueva franja', 15);
  check(t.includes('Para qué servicios'), 'T20 el selector de servicios en la Hoja de franja EN UNIVERSAL (el gesto B8)');
} else {
  console.log('· T20/T21 saltados: el demo no está en modo universal');
}

// ── B3 — PROCEDIMIENTOS ──
await page.goto(`http://localhost:${PUERTO}/veterinaria/procedimientos`, { waitUntil: 'networkidle' });
t = await esperar('Tus procedimientos', 30);
check(
  t.includes('Se cotizan por presupuesto — no se reservan.'),
  'T12 la voz firmada de los procedimientos',
);
check(t.includes('Agregar procedimiento'), 'T13 el alta de procedimiento presente');

// ── B7 punto 1 — el espejo del smoke manual del founder: alta →
// APARECE SOLA → baja → desaparece (escritura NETA CERO en demo) ──
await page.getByText('Agregar procedimiento', { exact: true }).click();
await esperar('Nuevo procedimiento', 15);
await page.getByRole('textbox', { name: 'Nombre' }).fill('Smoke S68-B7');
await page.getByText('Guardar', { exact: true }).click();
t = await esperar('Smoke S68-B7', 15);
check(t.includes('Smoke S68-B7'), 'T22a el procedimiento creado aparece SOLO (sin refrescar a mano)');
await page.getByText('Smoke S68-B7', { exact: true }).click();
await esperar('Editar procedimiento', 15);
await page.getByText('Quitar procedimiento', { exact: true }).click();
await page.getByText('Quitar definitivamente', { exact: true }).click();
await page.waitForTimeout(1500);
t = await texto();
check(!t.includes('Smoke S68-B7'), 'T22b la baja lo quita de la lista al instante (residuo cero)');

// ── B3 — VERIFICACIÓN PROFESIONAL ──
await page.goto(`http://localhost:${PUERTO}/veterinaria/verificacion`, { waitUntil: 'networkidle' });
t = await esperar('Verificación profesional', 30);
check(t.includes('Título profesional'), 'T14a el slot del título profesional');
check(t.includes('Registro SENESCYT'), 'T14b el slot del registro');
check(
  t.includes('la verificación se necesita para abrir, no para construir'),
  'T15 la voz "bloquea abrir, jamás construir"',
);

// ── B7 puntos 3+5 — ?item= ancla/pliega + riel de vacunación desde $2 ──
await page.goto(`http://localhost:${PUERTO}/veterinaria/taller?item=vacunacion`, { waitUntil: 'networkidle' });
t = await esperar('Servicios y precios', 30);
const switchVac = page.locator('[role="switch"][aria-label="Ofrecer · Vacunación"]');
if ((await switchVac.getAttribute('aria-checked')) !== 'true') {
  await switchVac.click();
  await page.waitForTimeout(500);
}
t = await texto();
check(t.includes('$2.00'), 'T23 el riel de vacunación arranca en $2 (decisión founder del gate)');

// ── B9 — duración vet: menú curado + "Otra duración" clampeando ──
check(t.includes('Toca el valor para escribirlo'), 'T25 la affordance VISIBLE del precio editable (hint + punteado)');
await page.getByText('Duración', { exact: true }).first().click();
t = await esperar('Otra duración', 15);
check((await page.getByText('20 min', { exact: true }).count()) > 0, 'T24a el 20 min (default de DB) es ELEGIBLE en el menú curado');
check((await page.getByText('90 min', { exact: true }).count()) > 0, 'T24b el menú curado llega a 90/120');
check(t.includes('Otra duración'), 'T24c el campo "Otra duración" VISIBLE en la Hoja');
await page.getByRole('textbox', { name: 'Otra duración' }).fill('23');
await page.getByText('Usar esta duración', { exact: true }).click();
await page.waitForTimeout(500);
check(
  (await page.getByText('25 min', { exact: true }).count()) > 0,
  'T24d el ilegal 23 se clampea a 25 (paso de 5, jamás valor ilegal)',
);

// ── B2 — EL ADIESTRAMIENTO GANA LA SECCIÓN (D-426 muere) + D-412 ──
await page.goto(`http://localhost:${PUERTO}/adiestramiento/taller`, { waitUntil: 'networkidle' });
t = await esperar('Con quién trabajas', 30);
t = await esperar('Cómo organizas tu agenda', 30);
check(t.includes('Cómo organizas tu agenda'), 'T16 SeccionHorarios en el taller del adiestramiento (D-426 muerta)');
check(
  t.includes('e-PetPlace retiene') || t.includes('No pudimos leer la comisión vigente'),
  'T17 el neto visible en el taller del adiestrador (D-412 pagada)',
);

await browser.close();
console.log(fallos === 0 ? 'SMOKE VETERINARIA S68-B: 0 fallos' : `SMOKE S68-B: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
