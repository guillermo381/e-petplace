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
  /* Cualquiera de los dos idiomas sirve: el que esté montado va a existir. */
  return { localizador: page.getByText(cs[0], { exact: false }).or(page.getByText(cs[cs.length - 1], { exact: false })).last(), copias: cs };
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
