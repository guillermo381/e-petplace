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
 *   JWT_VET=...          # sesión del veterinario de la cita (borde §4)
 *   JWT_AJENO=...        # sesión de cualquier otra persona
 *   ANON_KEY=...         # la anon key PÚBLICA del proyecto (no es secreto:
 *                        # viaja en el bundle). Prueba el guard de D-714.
 *   CITA_TELE=<uuid>     # teleconsulta pagada, EN ventana, del DUEÑO de JWT_DUENO
 *   CITA_AJENA=<uuid>    # teleconsulta de OTRA familia (ajeno es relación,
 *                        # no identidad) — idealmente EN ventana
 *   CITA_FUERA=<uuid>    # teleconsulta pagada, FUERA de ventana
 *   CITA_CANCELADA=<uuid>
 *   CITA_TIPO_SIN_MODALIDAD=<uuid>   # tipo_servicio='telemedicina' PERO
 *                                    # modalidad='local' — el discriminador
 *                                    # del eje (ver el caso al final)
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

/* 🔴 EL BORDE DE §4 — y es un VERDE que parece un rojo.
   `LETRA_TELEMEDICINA` §4 firma que la consulta se cobra aunque el dueño no
   asista: «si el veterinario entra y determina que el caso necesita atención
   presencial, eso ES el servicio prestado». ⇒ el token del profesional se
   emite AUNQUE EL DUEÑO NUNCA ENTRE, y la ventana jamás exige que haya dos.
   Si esto rebota, alguien "arregló" la sala para que se abra con ambos y le
   sacó al veterinario el derecho a cobrar que la letra le dio. */
await caso('🔴 vet solo, el dueño nunca entró (borde §4)', {
  jwt: process.env.JWT_VET, cita: CITA_TELE, espera: 'token',
});

console.log('\n  ── ROJOS A PROPÓSITO: la puerta tiene que cerrarse ──');
/* 🔴 LA ANON KEY, no un string basura — y el cambio lo ordenó CORRER esto.
   Con `Authorization: Bearer no-es-un-jwt` el gateway de Supabase rebota
   `UNAUTHORIZED_INVALID_JWT_FORMAT` **antes de que esta function ejecute una
   sola línea** ⇒ ese caso probaba la plataforma, no mi guard.

   La prueba que SÍ llega al cuerpo es **la anon key**: es un JWT válido, pasa
   `verify_jwt`, y **viaja en el bundle de las apps** — o sea que la tiene
   cualquiera con el teléfono. Es exactamente el agujero que `D-714` midió en
   S92-BIS. Acá tiene que morir contra `getUser()`, que no devuelve persona.

   *Un caso que rebota una capa más afuera de la que querés probar da verde
   sin haber tocado tu código.* */
await caso('anon key (JWT válido, sin persona) — D-714', {
  jwt: process.env.ANON_KEY, cita: CITA_TELE,
  espera: 'sin_token', codigo: 'sin_sesion',
});
/* 🔴 CITA **AJENA**, no la propia — y el error lo destapó correr esto.
   La versión anterior apuntaba este caso a `CITA_TELE`, la cita del camino
   feliz, y sólo funcionaba si `JWT_AJENO` era de otra persona.
   **Ajeno es una RELACIÓN, no una identidad:** la misma sesión es dueña de
   una cita y ajena a otra. Con la cuenta demo apuntando a su propia cita el
   caso devolvía `fuera_de_ventana` — *rebotaba, pero por la razón
   equivocada, que está tan roto como un verde por la razón equivocada.*
   ⇒ `CITA_AJENA` es una cita **de otra familia** y, si es posible, **EN
   ventana**: así el rechazo sólo puede venir de la identidad, y de paso
   prueba el orden de A (identidad ANTES que estado). */
await caso('ajeno a la cita (cita de OTRA familia)', {
  jwt: JWT_AJENO, cita: process.env.CITA_AJENA,
  espera: 'sin_token', codigo: 'ajeno_a_la_cita',
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
/* 🔴 EL DISCRIMINADOR DEL EJE — y cambió de sentido, no de valor.
   `LETRA_TELEMEDICINA` v1.1 §7 ② firma que la marca de teleconsulta es
   `modalidad='telemedicina'` (BIO_EXPEDIENTE D13.6), NO `tipo_servicio`.

   ⚠️ ACTUALIZADO 26-ago: cuando escribí este caso, el hold rechazaba la
   modalidad y caía a `'local'` por default ⇒ una teleconsulta nacía
   pareciendo presencial. **S106-A lo curó, y mejor:** ahora la modalidad
   **se DERIVA de la categoría del servicio y el cliente no la manda**
   (`v_es_tele := (v_categoria = 'telemedicina')`), así que para citas nuevas
   este estado es **inexpresable**, no sólo ilegal.

   ⇒ El caso QUEDA, con otro sentido: ya no cubre el camino normal sino
   **citas viejas o creadas por otra vía**. Es red, no bloqueante.
   Si ENTREGA token, el gate está leyendo el eje equivocado, y la
   consecuencia no es un token de más: es una teleconsulta marcada como
   presencial en el expediente de la mascota. */
await caso('tipo_servicio=telemedicina pero modalidad=local', {
  jwt: JWT_DUENO, cita: process.env.CITA_TIPO_SIN_MODALIDAD,
  espera: 'sin_token', codigo: 'no_es_teleconsulta',
});

console.log('\n  ─────────────────────────────────────────────────────────────');
console.log(`  verdes: ${ok}   fallos: ${fail}   saltados: ${saltados}`);
if (saltados > 0) {
  console.log(`  ⚠️  ${saltados} caso(s) NO se ejercieron. Este arnés NO es concluyente.`);
}
console.log('');
process.exit(fail > 0 || saltados > 0 ? 1 : 0);
