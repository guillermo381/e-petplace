// ============================================================================
// SMOKE RUNTIME RN-web — EL ALTA UNIFICADA (S91-D)
//
// REEMPLAZA a `verify-alta-mascota-web-s55.mjs`, que quedó apuntando a rutas y
// títulos que ya no existen. **Un guard que sobrevive a su propia razón no es
// un guard**: el viejo habría dado rojo por el rediseño y nadie habría sabido
// si el rojo era el bug o el rename.
//
// ── QUÉ MIDE, Y POR QUÉ ESTAS AFIRMACIONES Y NO OTRAS ───────────────────────
// El typecheck ya prueba que las keys existen y que el mapa de especies es
// total. Lo que NINGÚN typecheck ve es si la pantalla MONTA y si la modulación
// por especie efectivamente cambia lo que la persona lee. Por eso el corazón
// de este archivo es UN CONTRASTE:
//
//   · elegir «Pez»  → el nombre que se pide es EL DEL ACUARIO, y el paso 2
//                     pregunta por el AGUA (dulce/marino)
//   · elegir «Perro»→ el nombre es el del animal, y el paso 2 pregunta la RAZA
//                     con «Mestizo» y «No sé» a la vista
//
// Si la cláusula del pez (firma de mesa, 7-ago-2026 · opción A) no estuviera
// cableada, los dos caminos dirían lo MISMO y este smoke lo diría. Un assert
// que solo verifica el camino del perro habría pasado igual con la cláusula
// sin construir — sería verde sobre nada.
//
// El alta NO se completa a propósito: crear una mascota de prueba en la DB de
// producción para probar un render es exactamente lo que la casa limpia después
// con un DELETE por id. El gate REAL es del founder en dispositivo.
//
// ── POR QUÉ NO SE LOGUEA, y es un HALLAZGO, no una comodidad ────────────────
// El smoke de S55 entraba por `/login` con las credenciales demo de
// `apps/cliente/.env.local`. **Medido en esta sesión: ese login REBOTA** —
// «El email o la contraseña no coinciden.», HTTP 400 de auth. El archivo es
// byte-idéntico en `main` y en los otros worktrees (md5 comparado), así que
// NO es un problema de esta rama: la credencial demo del cliente está vencida
// o rotada. Queda declarado como hallazgo; curarlo no es de esta pista.
//
// El camino que SÍ funciona y además mide mejor: entrar por las rutas del
// onboarding con el borrador en los params. Es exactamente el contrato que la
// pieza declara —«URL-reconstruible: avanza por params»— así que probarlo por
// ahí no es un atajo: **es probar la propiedad**.
//
// Uso: con `npx expo start --web --port 8082` corriendo en apps/cliente.
// ============================================================================

import { chromium } from 'playwright-core';

const PUERTO = process.env.PORT_CLIENTE ?? '8082';

let fallos = 0;
function check(cond, nombre) {
  console.log(`${cond ? '  ok  ' : '  EN ROJO  '}${nombre}`);
  if (!cond) fallos += 1;
}

/** Espera a que un texto aparezca; devuelve el body entero para poder afirmar
 *  varias cosas sobre la MISMA foto de la pantalla. */
async function esperar(page, aguja, vueltas = 24) {
  let texto = '';
  for (let i = 0; i < vueltas; i++) {
    texto = await page.evaluate(() => document.body.innerText);
    if (texto.includes(aguja)) return texto;
    await page.waitForTimeout(500);
  }
  return texto;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

// ── EL LECTOR DE D-379 SE MIDE POR LA RED, y acá está el porqué ─────────────
// `cat_razas` concede SELECT **solo a `authenticated`** (medido:
// `role_table_grants` → authenticated:SELECT, sin anon — que es lo correcto,
// L-140). Sin sesión la lista vuelve vacía, así que afirmar sobre su CONTENIDO
// desde acá daría un rojo que no es del código.
//
// Lo que SÍ es medible y es lo que importa de este lado: **que la pantalla
// PREGUNTE**. Si mañana alguien borra el `useEffect` del catálogo, la petición
// desaparece y esto lo dice. El contenido con sus caras es del gate en
// dispositivo, con sesión real.
const pedidosCatalogo = [];
page.on('request', (r) => {
  if (r.url().includes('/rest/v1/cat_razas')) pedidosCatalogo.push(r.url());
});

/** Va a una ruta del alta con su borrador en los params y devuelve el body. */
async function ir(ruta, aguja) {
  await page.goto(`http://localhost:${PUERTO}${ruta}`, { waitUntil: 'networkidle', timeout: 180000 });
  return esperar(page, aguja, 40);
}

// ── PASO 1 ──────────────────────────────────────────────────────────────────
let texto = await ir('/onboarding', '¿Quién se suma a tu casa?');
check(texto.includes('¿Quién se suma a tu casa?'), 'Paso 1 · el título de la lámina firmada');
check(texto.includes('¿Qué especie es?'), 'Paso 1 · el catálogo REAL de especies cargó');
check(
  ['Perro', 'Gato', 'Conejo', 'Ave', 'Roedor', 'Pez'].every((e) => texto.includes(e)),
  'Paso 1 · las SEIS especies de la grilla',
);
check(!texto.includes('Reptil'), 'Paso 1 · reptil NO se ofrece (firma founder)');
check(texto.includes('¿Cómo se llama?'), 'Paso 1 · sin especie elegida, el nombre es el genérico');

// ── EL CONTRASTE ①: PEZ → el sujeto es el ACUARIO ───────────────────────────
await page.getByText('Pez', { exact: true }).first().click();
texto = await esperar(page, '¿Cómo se llama el acuario?');
check(
  texto.includes('¿Cómo se llama el acuario?'),
  'CLÁUSULA DEL PEZ · elegir «Pez» cambia QUÉ nombre se pide',
);
check(
  texto.includes('registramos el acuario'),
  'CLÁUSULA DEL PEZ · la pantalla dice POR QUÉ pide el acuario (propuesta al gate)',
);
// El CTA solo cobra su verbo con nombre Y especie (deshabilitado conserva el
// verbo neutro, decisión S82). Se llena el nombre para medir el verbo real.
await page.getByPlaceholder('ej: El de la sala').fill('El de la sala');
texto = await esperar(page, 'Registrar el acuario');
check(
  texto.includes('Registrar el acuario') && !texto.includes('Presentar a'),
  'CLÁUSULA DEL PEZ · hasta el verbo del CTA cambia — no se «presenta» un acuario',
);

texto = await ir('/onboarding/raza?nombre=El%20de%20la%20sala&especie=pez', 'El agua del acuario');
check(
  !pedidosCatalogo.some((u) => u.includes('especie=eq.pez')),
  'CLÁUSULA DEL PEZ · el acuario NO pide catálogo de razas — su campo dos es cerrado',
);
check(texto.includes('El agua del acuario'), 'CLÁUSULA DEL PEZ · el paso 2 pregunta por el AGUA');
check(
  texto.includes('Dulce') && texto.includes('Marino'),
  'CLÁUSULA DEL PEZ · los dos tipos de agua, elección cerrada',
);
check(
  !texto.includes('Mestizo'),
  'CLÁUSULA DEL PEZ · no hay «mestizo» de agua — el paso 2 del pez NO es el de la raza',
);

// ── EL CONTRASTE ②: PERRO → raza, con sus dos respuestas de primera clase ───
texto = await ir('/onboarding/raza?nombre=Zeus&especie=perro', '¿De qué raza es Zeus?');
check(texto.includes('¿De qué raza es Zeus?'), 'Paso 2 · el título lleva el nombre');
check(
  texto.includes('Mestizo') && texto.includes('No sé'),
  'Paso 2 · «Mestizo» y «No sé» SON BOTONES A LA VISTA (lámina, literal)',
);
// D-379 vivo: el catálogo de A sembrado (44 razas de perro medidas en DB).
// Se prueba con una raza SANA a propósito: siete nombres del catálogo vienen
// con guion bajo desde el insumo y esperan gate de strings (ver reporte).
check(
  pedidosCatalogo.some((u) => u.includes('especie=eq.perro')),
  'Paso 2 · D-379 · la pantalla PREGUNTA por el catálogo de SU especie',
);

// ── EL TÍTULO POR ESPECIE, que es la firma founder del paso 2 ───────────────
texto = await ir('/onboarding/raza?nombre=Piolín&especie=ave', 'Piolín');
check(
  texto.includes('¿Qué tipo de ave es Piolín?'),
  'Paso 2 · a alguien con un canario NO se le pregunta la raza (firma founder)',
);

// ── PASO 3 · la historia, con el campo que hasta hoy no existía ─────────────
texto = await ir('/onboarding/historia?nombre=Zeus&especie=perro', 'Cuéntanos de su historia');
check(texto.includes('Cuéntanos de su historia'), 'Paso 3 · el título (tuteo de la casa, L-148)');
check(texto.includes('¿Cuándo nació?'), 'Paso 3 · la fecha');
check(texto.includes('¿Es macho o hembra?'), 'Paso 3 · el sexo');
check(texto.includes('¿Cómo llegó a tu casa?'), 'Paso 3 · EL ORIGEN — el campo nuevo de la lámina');
check(
  ['Lo adopté', 'Vino de un refugio', 'Nació en casa', 'Lo encontré', 'Vino de un criadero'].every(
    (o) => texto.includes(o),
  ),
  'Paso 3 · los CINCO orígenes que el alta ofrece, de los nueve del CHECK',
);
check(
  !texto.includes('¿Es macho o hembra?\n¿Es macho o hembra?'),
  'Paso 3 · el acuario no ve sexo ni origen (se prueba abajo)',
);

// El acuario no tiene sexo ni origen: la pregunta no se le hace.
texto = await ir('/onboarding/historia?nombre=El%20de%20la%20sala&especie=pez', '¿Cuándo lo montaste?');
check(texto.includes('¿Cuándo lo montaste?'), 'Paso 3 · al acuario se le pregunta cuándo se MONTÓ');
check(
  !texto.includes('¿Es macho o hembra?') && !texto.includes('¿Cómo llegó a tu casa?'),
  'CLÁUSULA DEL PEZ · un acuario no tiene sexo ni «llegó a casa» — no se muestran deshabilitados: NO ESTÁN',
);

// ── PASO 4 · la foto, con «Ahora no» como texto ─────────────────────────────
texto = await ir('/onboarding/foto?nombre=Zeus&especie=perro', 'Una foto de Zeus');
check(texto.includes('Una foto de Zeus'), 'Paso 4 · el título de la lámina');
check(texto.includes('Ahora no'), 'Paso 4 · la salida existe y es texto, no botón en competencia');

await browser.close();
console.log(
  fallos === 0
    ? `\nVERDE — todos los asserts pasaron.`
    : `\nEN ROJO — ${fallos} assert(s) fallaron.`,
);
process.exit(fallos === 0 ? 0 : 1);
