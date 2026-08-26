#!/usr/bin/env node
/**
 * ARNÉS DE `video-token` — S106-D, acto 4.
 *
 * ── LA LEY QUE ESTE ARNÉS OBEDECE (`L-402`) ─────────────────────────────────
 * Un arnés que no corrió no probó nada, y **«¿está alcanzable desde afuera?»
 * no alcanza: hace falta «¿CORRIÓ ALGUNA VEZ?»**. Por eso este archivo:
 *   · **golpea la function desplegada de verdad** (no simula),
 *   · **ejerce los rojos A PROPÓSITO** — no sólo el camino feliz,
 *   · e **imprime lo que midió**, porque un instrumento que no imprime no
 *     midió nada (`L-321`).
 *
 * ── EL DISCRIMINADOR, QUE ES LO QUE LO VUELVE ÚTIL ──────────────────────────
 * 🔴 Un arnés que sólo prueba el camino feliz da verde con la puerta abierta
 * de par en par. Acá **el verde exige que los rojos rebocen**: si un tercero
 * ajeno consigue token, este arnés **falla**, aunque el dueño legítimo haya
 * entrado perfecto.
 *
 * ── LO QUE ESTE ARNÉS **NO** HACE ───────────────────────────────────────────
 * No crea citas, no borra nada, no toca `pagos-*`. Sólo lee y pide tokens.
 *
 * ── USO ─────────────────────────────────────────────────────────────────────
 *   SUPABASE_URL=... \
 *   JWT_DUENO=...        # sesión del dueño de la mascota de la cita
 *   JWT_AJENO=...        # sesión de cualquier otra persona
 *   CITA_TELE=<uuid>     # teleconsulta pagada, EN ventana
 *   CITA_FUERA=<uuid>    # teleconsulta pagada, FUERA de ventana
 *   CITA_CANCELADA=<uuid>
 *     node arnes.mjs
 *
 * Las que falten se saltean **declarándolo** — un caso omitido en silencio es
 * un verde flojo.
 */

const BASE = process.env.SUPABASE_URL;
const JWT_DUENO = process.env.JWT_DUENO;
const JWT_AJENO = process.env.JWT_AJENO;
const CITA_TELE = process.env.CITA_TELE;
const CITA_FUERA = process.env.CITA_FUERA;
const CITA_CANCELADA = process.env.CITA_CANCELADA;

if (!BASE) {
  console.error('Falta SUPABASE_URL.');
  process.exit(2);
}

const URL_FN = `${BASE.replace(/\/$/, '')}/functions/v1/video-token`;

let ok = 0, fail = 0, saltados = 0;

async function pedir(jwt, citaId) {
  const r = await fetch(URL_FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ cita_id: citaId }),
  });
  let cuerpo = null;
  try { cuerpo = await r.json(); } catch { /* respuesta no-JSON: se reporta cruda */ }
  return { status: r.status, cuerpo };
}

/**
 * @param espera  'token'  → tiene que devolver un token
 *                'sin_token' → tiene que NEGARSE, con este código
 */
async function caso(nombre, { jwt, cita, espera, codigo }) {
  if (!jwt || !cita) {
    console.log(`  ⏭️  SALTADO  ${nombre}  — falta ${!jwt ? 'el JWT' : 'el id de cita'}`);
    saltados++;
    return;
  }
  const { status, cuerpo } = await pedir(jwt, cita);

  if (espera === 'token') {
    /* No alcanza `ok:true`: se exige el token de verdad. Un `ok` sin token es
       la clase de verde que este arnés existe para no dar. */
    if (cuerpo?.ok === true && typeof cuerpo.token === 'string' && cuerpo.token.length > 0) {
      console.log(`  ✅ ${nombre}  → ${status}  token(${cuerpo.token.length} ch) rol=${cuerpo.rol} sala=${cuerpo.sala}`);
      ok++;
    } else {
      console.log(`  ❌ ${nombre}  → ${status}  ESPERABA token · RECIBIÓ ${JSON.stringify(cuerpo)}`);
      fail++;
    }
    return;
  }

  // espera === 'sin_token'
  /* 🔴 TRES estados, no dos — y el tercero lo destapó correr esto de verdad.
     La plataforma responde `{"code":"NOT_FOUND"}` (sin `ok`) cuando la
     function no está desplegada. La primera versión de este arnés lo leía
     como "no rebotó" e imprimía «¡ENTREGÓ TOKEN A QUIEN NO DEBÍA!» sobre una
     function que **ni existe**.
     *Un rojo que miente sobre su causa manda a auditar una puerta abierta que
     nunca se abrió* — y es la falla que este mismo arnés vino a cazar. */
  if (cuerpo == null || typeof cuerpo.ok !== 'boolean') {
    console.log(`  ⚠️  ${nombre}  → ${status}  NO CONCLUYENTE · la function no respondió como function: ${JSON.stringify(cuerpo)}`);
    fail++;
    return;
  }
  if (cuerpo.ok === false && !cuerpo.token) {
    const coincide = !codigo || cuerpo.codigo === codigo;
    if (coincide) {
      console.log(`  ✅ ${nombre}  → ${status}  rebotó: ${cuerpo.codigo}`);
      ok++;
    } else {
      /* Rebotó, pero por otra razón. Se cuenta como fallo del arnés a
         propósito: un rojo por la razón equivocada está tan roto como un
         verde por la razón equivocada. */
      console.log(`  ❌ ${nombre}  → ${status}  rebotó por '${cuerpo.codigo}', ESPERABA '${codigo}'`);
      fail++;
    }
  } else {
    console.log(`  🔴 ${nombre}  → ${status}  ¡ENTREGÓ TOKEN A QUIEN NO DEBÍA! ${JSON.stringify(cuerpo)}`);
    fail++;
  }
}

console.log('\n  ARNÉS video-token — S106-D');
console.log('  ' + URL_FN);
console.log('  ─────────────────────────────────────────────────────────────');

console.log('\n  ── VERDE: el camino feliz ──');
await caso('dueño en ventana, cita pagada', { jwt: JWT_DUENO, cita: CITA_TELE, espera: 'token' });

console.log('\n  ── ROJOS A PROPÓSITO: la puerta tiene que cerrarse ──');
await caso('sin sesión', {
  jwt: 'no-es-un-jwt', cita: CITA_TELE, espera: 'sin_token',
});
await caso('ajeno a la cita', {
  jwt: JWT_AJENO, cita: CITA_TELE, espera: 'sin_token', codigo: 'ajeno_a_la_cita',
});
await caso('fuera de ventana', {
  jwt: JWT_DUENO, cita: CITA_FUERA, espera: 'sin_token', codigo: 'fuera_de_ventana',
});
await caso('cita cancelada', {
  jwt: JWT_DUENO, cita: CITA_CANCELADA, espera: 'sin_token', codigo: 'cita_cancelada',
});
await caso('cita inexistente', {
  jwt: JWT_DUENO, cita: '00000000-0000-0000-0000-000000000000',
  espera: 'sin_token', codigo: 'cita_inexistente',
});

console.log('\n  ─────────────────────────────────────────────────────────────');
console.log(`  verdes: ${ok}   fallos: ${fail}   saltados: ${saltados}`);
if (saltados > 0) {
  console.log(`  ⚠️  ${saltados} caso(s) NO se ejercieron. Este arnés NO es concluyente.`);
}
console.log('');
process.exit(fail > 0 || saltados > 0 ? 1 : 0);
