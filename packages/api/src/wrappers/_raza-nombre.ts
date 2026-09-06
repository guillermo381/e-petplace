/**
 * S113-A · LA MISMA DEFINICIÓN DE «IGUAL» QUE LA BASE.
 *
 * `mascotas.raza` es TEXTO LIBRE por diseño (D-379: el catálogo **sugiere y
 * jamás impone**). Los lectores lo casan contra `cat_razas` para encontrarle la
 * cara a la mascota, y hasta hoy lo hacían con igualdad EXACTA: una mascota real
 * declaraba «Schnauzer miniatura», el catálogo decía «Schnauzer Miniatura», y
 * **una mayúscula la dejaba sin su cara**.
 *
 * 🔴 ESTO TIENE QUE SER BYTE POR BYTE LA MISMA TABLA que la columna generada
 * `cat_razas.nombre_norm`. No es duplicación por descuido: la base necesita una
 * expresión IMMUTABLE para poder generar e indexar, y el cliente necesita
 * normalizar lo que la familia tecleó **antes** de mandarlo. Son dos lugares
 * porque el trabajo ocurre en dos lados.
 *
 * ⚠️ Por eso NO se usa `normalize('NFD')`, que sería lo idiomático en JS: saca
 * TODA marca diacrítica del Unicode y la base sólo saca las de esta tabla ⇒ un
 * nombre con un acento fuera de la lista se normalizaría distinto en cada lado y
 * **la mascota volvería a perder su cara, ahora sin que nadie sepa por qué**.
 * *Entre lo idiomático y lo idéntico, gana lo idéntico.* Lo vigila
 * `verify:raza-norm`.
 */
const DE = 'ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòùÂÊÎÔÛâêîôûÄËÏÖäëïö';
const A  = 'AEIOUUNaeiouunAEIOUaeiouAEIOUaeiouAEIOaeio';

/** Espejo exacto de `cat_razas.nombre_norm`. */
export function normalizarNombreDeRaza(nombre: string): string {
  let salida = '';
  for (const c of nombre) {
    const i = DE.indexOf(c);
    salida += i === -1 ? c : A[i];
  }
  return salida.toLowerCase();
}
