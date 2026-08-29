/**
 * S107-C · **`tocar()` — EL TOQUE QUE NO PUEDE MENTIR.**
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA CLASE QUE ESTE ARCHIVO EXISTE PARA CERRAR (firma de la mesa, 29-ago):
 *
 * > ### Un instrumento que no puede distinguir «no pasó nada» de «no hice
 * > nada» **no mide: adivina.**
 *
 * Cobrada **dos veces en esta pista**:
 * · el arnés sin las env vars: seis rutas «rotas» que eran el arnés;
 * · la sonda que tocaba un nodo `«mon 31»` inexistente —`SelectorDia` pinta el
 *   día y el número por separado—: **el toque no pasaba, la pantalla no
 *   cambiaba, y eso se leía exactamente igual que un defecto de la pantalla.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **POR QUÉ ES UN MECANISMO Y NO UNA NOTA EN UN PARTE.** *La cura de la
 * segunda vez fue agregarle el discriminador a mano, después del susto. Un
 * recordatorio escrito no sobrevive a la tercera sonda apurada — una función
 * que **no te deja tocar sin verificar** sí.*
 *
 * Uso:
 *   import { tocar } from './sonda-tocar.mjs';
 *   await tocar(page, page.getByText('31', { exact: true }).first(), '31');
 *
 * **Lanza si el nodo no existe.** *Fallar ruidoso es la mitad del punto: una
 * sonda que sigue después de no tocar nada produce un informe con forma de
 * hallazgo.*
 */

export async function tocar(page, localizador, comoSeLlama) {
  const cuantos = await localizador.count().catch(() => 0);
  if (cuantos === 0) {
    throw new Error(
      `[sonda] el nodo «${comoSeLlama}» NO EXISTE — el toque no se emitió.\n` +
        `   🔴 Lo que sigue NO es una medición de la pantalla: es una medición de nada.\n` +
        `   Revisá el localizador antes de leer cualquier resultado.`,
    );
  }
  const antes = await page.evaluate(() => document.body.innerText);
  await localizador.click({ force: true });
  await page.waitForTimeout(3500);
  const despues = await page.evaluate(() => document.body.innerText);
  /* El segundo discriminador: el toque llegó, ¿y cambió algo? Si no cambió, es
     un HECHO de la pantalla y hay que poder afirmarlo — no confundirlo con el
     caso de arriba, que es un hecho de la sonda. */
  return { cambio: antes !== despues, antes, despues };
}
