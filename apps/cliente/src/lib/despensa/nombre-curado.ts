/**
 * EL NOMBRE CURADO AL IDIOMA DE LA FAMILIA (S100-C · N20 · adjudicación de
 * mesa ④).
 *
 * 🔴 EL HALLAZGO QUE LO PARIÓ, medido sobre las 563 filas comprables:
 * **235 nombres (42 %) vienen EN MAYÚSCULAS** — `CANADA LITTER`, `CALM
 * CANINE`, `ACTIVE MIND 7+`. No es una excepción del importador: es casi la
 * mitad del catálogo. Y la adjudicación de mesa fue clara: *los nombres largos
 * no dicen que la tarjeta sea chica, dicen que **NO ESTÁN CURADOS**.*
 * **`CANADA LITTER` es nombre de catálogo, no de vitrina.**
 *
 * 🔴 LO QUE ESTA FUNCIÓN **NO** HACE, Y ES LO QUE LA VUELVE SEGURA:
 * **no inventa una sola palabra.** No agrega descriptores («Arena
 * aglomerante…»), no traduce, no acorta, no adivina categoría. *Un descriptor
 * inventado desde el nombre sería exactamente el modo de falla que esta casa
 * viene midiendo: verosímil y falso.* Si el catálogo necesita decir «Arena
 * aglomerante», **eso es DATO y lo carga quien tiene el producto en la mano** —
 * el nombre curado se limita a **cambiar la CAJA de lo que ya está escrito**,
 * que es una transformación reversible y verificable a ojo.
 *
 * REGLAS, todas mecánicas:
 *  ① **Solo se toca lo que viene TODO EN MAYÚSCULAS.** Un nombre que ya trae
 *     caja propia (`Aceite de Salmon Brilliant Piel y Pelaje`) se respeta
 *     entero: quien lo escribió así decidió algo, y pisarlo sería suponer que
 *     nos corresponde.
 *  ② Los tokens **con dígitos no se tocan** (`7+`, `15KG`, `3D`, `A/D`): ahí
 *     la mayúscula suele ser parte del código, no grito.
 *  ③ Las **palabras de enlace bajan** (`de`, `con`, `para`, `y`…) salvo en
 *     primera posición — es Title Case en español, no en inglés.
 *  ④ Las **siglas de 2 letras o menos se conservan** (`ID`, `KD`, `NF` de las
 *     dietas veterinarias): bajarlas a `Id` las convertiría en otra cosa.
 */

/** Enlaces que en español van en minúscula dentro de un título. Cerrada a
 *  propósito: una lista larga empieza a bajar palabras que sí son del nombre. */
const ENLACES = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u',
  'con', 'sin', 'para', 'por', 'en', 'a', 'al',
]);

function curarToken(token: string, esPrimero: boolean): string {
  // ② un token con dígitos es código, no grito: intacto.
  if (/\d/.test(token)) return token;
  const bajo = token.toLocaleLowerCase('es');
  // 🔴 ③ ANTES QUE ④, Y EL ORDEN LO FIJÓ UNA MEDICIÓN, NO UN ARGUMENTO.
  // Con ④ primero, `DE`, `EN` e `Y` caían en «sigla corta» y salían gritando
  // en mitad del nombre: «Control DE Peso», «Ternera Humeda EN Estofado»,
  // «Medianas Y Grandes» — **peor que no curar**, porque parece un descuido
  // en vez de un catálogo crudo. La regla ④ se escribió para salvar `ID`/`KD`
  // de las dietas veterinarias y se llevó puestas las tres palabras más
  // frecuentes del catálogo. *Lo encontró correr la pieza contra nombres
  // reales; leyéndola, las dos reglas parecían independientes.*
  if (!esPrimero && ENLACES.has(bajo)) return bajo;
  // ④ sigla corta que NO es enlace (`ID`, `KD`, `NF`): intacta.
  if (token.length <= 2) return token;
  return bajo.charAt(0).toLocaleUpperCase('es') + bajo.slice(1);
}

/**
 * Devuelve el nombre como lo tiene que leer la familia.
 *
 * Idempotente: aplicarla dos veces da lo mismo que aplicarla una (el resultado
 * ya no es TODO MAYÚSCULAS, así que la segunda pasada lo respeta por ①).
 */
export function nombreCurado(nombre: string): string {
  const limpio = nombre.trim().replace(/\s+/g, ' ');
  if (limpio.length === 0) return limpio;

  // ① El discriminador: solo grita el que no tiene ni una minúscula. Se
  //    compara contra la versión en mayúsculas para no tocar `Pro Plan`.
  const gritaEntero =
    limpio === limpio.toLocaleUpperCase('es') && /[A-ZÁÉÍÓÚÑ]/.test(limpio);
  if (!gritaEntero) return limpio;

  // Los separadores se conservan: partir por espacios perdería `A/D` y
  // `Piel-Pelaje`, que son parte del nombre.
  let primeroVisto = false;
  return limpio.replace(/[^\s/\-–—]+/g, (token) => {
    const esPrimero = !primeroVisto;
    primeroVisto = true;
    return curarToken(token, esPrimero);
  });
}
