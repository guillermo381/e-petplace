// ============================================================================
// EL CINTURÓN DEL TUTEO — UNA implementación, N edges (S113-D · fase 3)
//
// 🔴 **POR QUÉ SALE DE `coach/index.ts` Y VIENE ACÁ.** Vivía adentro de una
// edge, así que `coach-parte` —que también le escribe a la familia— **no lo
// tenía**: su `system` en main está escrito en voseo y su salida no pasa por
// ningún filtro. *Es exactamente la clase que ya se cobró:* `dejá` llegó a una
// familia con el cinturón puesto porque el cinturón cubría la mitad, y el
// remedio para «la misma regla en dos lugares» no es copiarla en el segundo
// **es que haya un solo lugar**.
//
// La lista de pares vive en `voseo.json`, que ya era única. Lo que faltaba era
// que el CÓDIGO que la aplica también lo fuera.
//
// ⚠️ Su verde dice «las formas de la lista se corrigen», jamás «la salida está
// en tuteo»: lo que no está en la lista pasa, y eso lo mide el gate de voz.
// ============================================================================
import PARES_VOSEO from './voseo.json' with { type: 'json' }

/** 🔴 EL CINTURÓN DEL TUTEO, y existe porque el prompt NO alcanzó.
 *
 *  Medido: con el `system` escrito entero en voseo se escapaba seguido; pasado
 *  a tuteo bajó a **~1 de cada 10**; y al nombrarle la forma que se escapaba
 *  («dale») **apareció otra** («querés»). *Enumerar formas prohibidas es
 *  jugar al topo: el registro se escapa por la que no nombraste.*
 *
 *  Así que la última milla NO es del prompt. Esto corrige las formas verbales
 *  más comunes **sobre el texto que sale**, que es lo único determinístico.
 *  ⚠️ **No es un traductor** y no pretende serlo: cubre las que se midieron.
 *  Lo que arregla, lo arregla siempre; lo que no cubre, lo dice el gate de voz.
 */
// 🔴 UNA SOLA LISTA, EN DATOS, QUE LEEMOS LOS DOS. Antes eran TRES enumeradas
// —mi cinturón, el gate de voz de E y la de `lib-voz`— y **ninguna cubría a las
// otras**: había formas que yo curaba y su gate no veía, formas que su gate veía
// y yo no curaba, y formas que ni se curaban ni se veían. *Con tres copias, un
// verde puede ser falso por coincidencia de huecos, y un rojo también al revés.*
// Quien agregue una forma la agrega en `_shared/voz/voseo.json`.
/** 🔴 `\b` NO SIRVE PARA EL ESPAÑOL, y esto costó que `dejá` llegara a una
 *  familia con el cinturón puesto.
 *
 *  `\b` es el límite entre `\w` y no-`\w`, y **`á` no está en `\w`**. En
 *  «entonces dejá eso», después de la `á` viene un espacio: los dos son
 *  no-`\w`, **no hay límite ahí, y `\bdejá\b` nunca matchea**.
 *
 *  Medido: **49 de las 132 formas nunca se aplicaron** — TODO el imperativo
 *  terminado en vocal acentuada (`dejá · mirá · guardá · probá · escribí ·
 *  hacé · abrí · pedí · contá · decí` …). *El cinturón no fallaba: cubría la
 *  mitad, y su log decía «corregido» cada vez que corregía la otra.*
 *
 *  La cura es mirar los caracteres de al lado por lo que SON —letra o número,
 *  con `\p{L}`/`\p{N}` y el flag `u`— en vez de por si el motor los considera
 *  «de palabra». */
const limite = (forma: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${forma}(?![\\p{L}\\p{N}])`, 'gu')

const VOSEO_A_TUTEO: readonly (readonly [RegExp, string])[] = PARES_VOSEO.pares
  // Largas primero: si una forma es prefijo de otra, la corta la mutilaría.
  .slice().sort((a, b) => b[0].length - a[0].length)
  .flatMap(([vos, tu]) => [
    [limite(vos), tu] as const,
    [limite(`${vos[0].toUpperCase()}${vos.slice(1)}`), tu[0].toUpperCase() + tu.slice(1)] as const,
  ])

export function aTuteo(texto: string): string {
  let t = texto
  for (const [re, a] of VOSEO_A_TUTEO) t = t.replace(re, a)
  if (t !== texto) console.error('[voz] el modelo devolvió voseo; corregido por el cinturón')
  return t
}
