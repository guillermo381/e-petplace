/**
 * S107-C · **EL TOQUE QUE NO PUEDE MENTIR** — y el localizador que no puede
 * hablar en un solo idioma.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DOS FIRMAS DE LA CASA VIVEN ACÁ (founder, 29-ago-2026):
 *
 * > ### ① Un instrumento que no puede distinguir «no pasó nada» de «no hice
 * > ### nada» **no mide: adivina.**
 *
 * > ### ② Una sonda **no busca un nodo por su copy** — el idioma lo decide el
 * > ### dispositivo. **Buscar por copy es nombrar de memoria con otra ropa.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ ESTE ARCHIVO CAMBIÓ Y NO SE PARCHEÓ ─────────────────────────
 * Buscar por copy falló **dos veces por el mismo caso**: `«mon 31»` (que no
 * existe como nodo) y `«Reservar»` **sobre una app que corre en inglés** —
 * dijo *«el CTA no existe»* sobre un botón que decía *«Book this day»*.
 * **Por la señal de `L-437`, dos parches sobre el mismo caso dicen que el
 * problema no es el parche: es el instrumento.** ⇒ **se cambió.**
 *
 * ── LA FORMA NUEVA: SE NOMBRA LA CLAVE, JAMÁS LA CADENA ─────────────────
 * `porClave(page, 'lugarGuarderia.reservar')` **lee los diccionarios de la app**
 * y prueba **es y en**. *La clave es la identidad estable; la copia es su
 * rendering* — exactamente el principio del riel tipado, aplicado al
 * instrumento que lo mira desde afuera.
 *
 * 🔴 **Y si la clave no existe, LANZA** — no cae a buscar la cadena literal.
 * *Un localizador que se degrada en silencio reintroduce el defecto con más
 * pasos.*
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Lee un diccionario del cliente sin compilarlo: alcanza con las cadenas. */
function copias(clave) {
  const [ns, k] = clave.split('.');
  const salida = [];
  for (const idioma of ['es', 'en']) {
    const txt = readFileSync(`${RAIZ}/apps/cliente/src/i18n/${idioma}.ts`, 'utf8');
    const ini = txt.indexOf(`  ${ns}: {`);
    if (ini < 0) continue;
    const fin = txt.indexOf('\n  },', ini);
    const m = txt.slice(ini, fin).match(new RegExp(`\\n\\s+${k}:\\s+'((?:[^'\\\\]|\\\\.)*)'`));
    if (m) salida.push(m[1].replace(/\\'/g, "'"));
  }
  return salida;
}

/**
 * Localiza por CLAVE de i18n, probando los dos idiomas.
 * **No acepta cadenas literales a propósito.**
 */
export function porClave(page, clave) {
  const cs = copias(clave);
  if (cs.length === 0) {
    throw new Error(
      `[sonda] la clave «${clave}» no existe en ningún diccionario del cliente.\n` +
        `   🔴 No se cae a buscar la cadena literal: eso sería el defecto que este archivo cerró.`,
    );
  }
  /* 🔴 **LAS INTERPOLACIONES SE PARTEN**, y lo destapó el camino del dedo: la
     clave `logGuarderia.reservarDe` es `'Reservar para {{nombre}}'`, y buscar
     esa cadena literal **no encuentra «Reservar para Thor»**. *Mi sonda dijo
     «el control NO EXISTE» sobre un botón que estaba ahí — el mismo error de
     buscar por copy, un nivel más adentro.*
     ⇒ se busca **el fragmento literal más largo** entre `{{…}}`, que es estable
     y sigue sin depender del idioma. */
  const fragmento = (c) =>
    c.split(/\{\{[^}]*\}\}/).map((x) => x.trim()).sort((a, z) => z.length - a.length)[0];
  const frags = [...new Set(cs.map(fragmento))].filter((x) => x.length > 0);
  if (frags.length === 0) throw new Error(`[sonda] la clave «${clave}» es sólo interpolación: no hay texto por el cual buscar.`);
  let loc = page.getByText(frags[0], { exact: false });
  for (const f of frags.slice(1)) loc = loc.or(page.getByText(f, { exact: false }));
  return { localizador: loc.last(), copias: cs };
}

/**
 * Toca, y **no deja tocar sin verificar que hay qué tocar**.
 *
 * `comoSeLlama` es para el mensaje de error: **poné la CLAVE, no la copia** —
 * quien lea el fallo tiene que poder ir al diccionario.
 *
 * Devuelve `{ cambio }`: el segundo discriminador. *El toque llegó, ¿y movió
 * algo? Ése SÍ es un hecho de la pantalla, distinto del de arriba, que es un
 * hecho de la sonda.*
 */
export async function tocar(page, localizador, comoSeLlama) {
  const cuantos = await localizador.count().catch(() => 0);
  if (cuantos === 0) {
    throw new Error(
      `[sonda] el nodo «${comoSeLlama}» NO EXISTE — el toque no se emitió.\n` +
        `   🔴 Lo que sigue NO es una medición de la pantalla: es una medición de nada.`,
    );
  }
  const antes = await page.evaluate(() => document.body.innerText);
  await localizador.click({ force: true });
  await page.waitForTimeout(3500);
  const despues = await page.evaluate(() => document.body.innerText);
  return { cambio: antes !== despues, antes, despues };
}

/**
 * Para lo que **NO es copy**: un número de día, un monto. *Acá el literal es
 * DATO y no cambia con el idioma* — se separa para que nadie lea `tocarDato`
 * como permiso para volver a buscar textos de UI.
 */
export function porDato(page, literal) {
  /* 🔴 ACEPTA RegExp, y la razón la destapó una corrida: el chip de tamaño dice
     **«5 stays»** o **«5 · from $40»** según si el precio ya llegó ⇒ el literal
     exacto no lo encuentra nunca.
     *La tentación era volver a buscar por la copy («5 stays»). No: **el número
     es el dato y el resto es rendering**, así que se ancla al número con un
     patrón —`/^5\b/`— y se sigue sin depender del idioma.* */
  return typeof literal === 'string'
    ? page.getByText(literal, { exact: true }).first()
    : page.getByText(literal).first();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * `claveAnon()` — LA CLAVE PÚBLICA, ELEGIDA POR LO QUE ES Y NO POR DÓNDE SALE.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── EL DEFECTO QUE CURA, medido el 29-ago ────────────────────────────────
 * Seis scripts de esta pista tomaban la clave con
 * `.match(/"api_key":"(eyJ[^"]*)"/)` — **la PRIMERA del texto**. Y uno de
 * ellos lo dejaba escrito como si fuera una garantía: *«la primera `api_key`,
 * que es la `anon`»*.
 *
 * **Medido: hoy el comando devuelve `anon` primero, después `service_role`.**
 * O sea que los seis estaban **correctos por ORDEN, no por diseño**.
 *
 * 🔴 **Y su modo de falla no es un error: es un verde.** Si ese orden cambiara,
 * la sonda correría con la `service_role` y **todo gate de RLS pasaría** — una
 * sonda que dice *«la familia puede reservar»* midiendo a alguien que puede
 * todo. *No hay excepción que salte, no hay línea roja: hay una medición
 * creíble y falsa, que es la clase que esta pista pasó la sesión cazando.*
 *
 * ── POR QUÉ SE ELIGE POR EL CLAIM Y NO POR EL NOMBRE ─────────────────────
 * Se decodifica el payload del JWT y **se exige `role === 'anon'`**. Elegir
 * por `"name":"anon"` seguiría dependiendo de cómo el CLI rotule sus campos;
 * el claim es lo que el servidor de verdad va a leer. *Es el mismo criterio
 * con el que S92 buscó `service_role` en el árbol: **por FORMA, decodificando
 * el claim, jamás por nombre**.*
 *
 * ⚠️ **Y si no la encuentra, LANZA.** Nunca devuelve «alguna»: una sonda sin
 * clave pública tiene que parar, no degradar a la que sí tenga permisos.
 *
 * 🔒 El valor **no se imprime nunca** — ni acá, ni en un error, ni en un log.
 */
export function claveAnon(ref) {
  const salida = execFileSync(
    'npx', ['supabase', 'projects', 'api-keys', '--project-ref', ref],
    { encoding: 'utf8' },
  );
  for (const m of salida.matchAll(/"(eyJ[A-Za-z0-9._-]+)"/g)) {
    const jwt = m[1];
    const partes = jwt.split('.');
    if (partes.length !== 3) continue;
    try {
      const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
      if (payload.role === 'anon') return jwt;
    } catch { /* no era un JWT legible: seguimos */ }
  }
  /* El mensaje no lleva ningún fragmento de ninguna clave. */
  throw new Error(
    'No hay ninguna clave con el claim role="anon" en la salida del CLI. ' +
    'La sonda PARA: correr con otra sería medir permisos que la familia no tiene.',
  );
}
