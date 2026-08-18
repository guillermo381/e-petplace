/**
 * QUÉ MASCOTAS PUEDEN SER DESTINO DE UN PRODUCTO — la regla de G-03, PURA.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ NACE: el gate del founder vio **alimento para perro ofreciendo
 * loro, hámster y pez**. El producto ya declaraba `especies_aplicables`; el
 * selector no lo miraba.
 *
 * POR QUÉ ES UN ARCHIVO Y NO DIEZ LÍNEAS ADENTRO DE LA PANTALLA: para que la
 * regla se pueda **probar sin montar la pantalla**. Un instrumento que
 * re-escribe el filtro adentro del test mide su propio eco — probaría que yo
 * sé escribir dos veces lo mismo, no que la pantalla filtra. Acá el test
 * importa **esta** función, que es la que la pantalla usa: hay una sola
 * fórmula y el test la toca de verdad.
 * ═══════════════════════════════════════════════════════════════════════
 */

/** Lo mínimo que la regla necesita saber de una mascota. */
export interface DestinoPosible {
  id: string;
  especie: string;
}

/**
 * Filtra los destinos que ese producto admite.
 *
 * 🔴 `especies_aplicables` VACÍO = **SIN RESTRICCIÓN DECLARADA**, jamás
 * «ninguna especie». Es la distinción que decide el caso: una cama, un
 * juguete o un comedero no declaran especie y sirven para toda la casa.
 * *Leerlo como «no aplica a nadie» habría vaciado el selector de media
 * vitrina — y el modo de falla sería silencioso: la familia vería «¿para
 * quién es?» sin una sola cara y no habría error en ningún lado.*
 */
export function destinosAdmitidos<T extends DestinoPosible>(
  destinos: readonly T[],
  especiesAplicables: readonly string[],
): T[] {
  if (especiesAplicables.length === 0) return [...destinos];
  return destinos.filter((d) => especiesAplicables.includes(d.especie));
}

/**
 * ¿Todos los productos del carrito admiten EXACTAMENTE las mismas mascotas?
 *
 * Es lo que decide G-10: si la respuesta es sí, **la pregunta se hace una
 * sola vez**; si es no, una pregunta única mentiría —ninguna respuesta
 * serviría para los dos productos— y la compra se reparte sola.
 *
 * *No es una preferencia de diseño: es que con comida de perro y comida de
 * ave en el mismo carrito no existe una respuesta común que sea verdad.*
 */
export function destinoComunDelCarrito<T extends DestinoPosible>(
  destinos: readonly T[],
  itemsEspecies: readonly (readonly string[])[],
): T[] | null {
  if (itemsEspecies.length === 0) return null;
  const huella = (ds: T[]) =>
    ds
      .map((d) => d.id)
      .sort()
      .join('|');
  const primero = destinosAdmitidos(destinos, itemsEspecies[0]);
  if (primero.length === 0) return null;
  const clave = huella(primero);
  for (const especies of itemsEspecies) {
    if (huella(destinosAdmitidos(destinos, especies)) !== clave) return null;
  }
  return primero;
}
