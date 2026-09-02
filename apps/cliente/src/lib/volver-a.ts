/**
 * A DÓNDE VOLVER DESPUÉS DEL ALTA — la intención que sobrevive a crear la cuenta.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL DEFECTO QUE ESTO CURA, MEDIDO Y NO SUPUESTO.**
 *
 * `registro.tsx:109` hace `router.replace('/onboarding')`, y `replace` **borra
 * la pila**. Alguien que estaba mirando a Luna, tocó «crear cuenta para
 * postular» y se registró **no tenía forma de volver a Luna**: caía en el alta
 * de mascota y de ahí al Hogar. *El camino entero de §4.1 —«si toco adoptar,
 * no me pidas nada más: vuelvo exactamente a donde estaba»— moría en un
 * `replace` que nadie escribió pensando en adopción.*
 *
 * ⚠️ **Y `router.back()` no lo arregla**: no hay pila a la que volver. La
 * intención tiene que VIAJAR como dato, porque el camino que la borra es
 * correcto (después de registrarte no se vuelve al registro).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ LISTA BLANCA Y NO «una ruta interna cualquiera» ──────────────
 * Es la misma decisión que `login.tsx` ya tomó y **la razón se hereda
 * entera**: validar la FORMA («empieza con `/` y no con `//`») cierra el
 * redirector abierto pero **acepta cualquier ruta inventada**, incluidas las
 * que no existen. Se compara contra los destinos que el producto ACEPTA.
 *
 * 🔴 **Y por qué esto vive acá y no reusa `destinoSeguro` de `login.tsx`:** ése
 * está atado a `/pagos/mensualidad`, que viaja **con un sujeto**
 * (`suscripcionId`) y por eso su firma devuelve pathname y params por separado.
 * Los destinos del alta **no tienen sujeto**: son rutas planas. *Forzar una
 * sola función para los dos casos la obligaría a devolver params opcionales que
 * uno de los dos llamadores tendría que ignorar* — y un parámetro que un
 * llamador ignora es por dónde se cuela el próximo destino sin sujeto.
 * **Se declara la gemela en vez de fabricar una abstracción que ninguno de los
 * dos casos pidió.** Si nace un tercer caso CON sujeto, ahí se unifican.
 *
 * ⚠️ **SU CONDICIÓN DE CRECIMIENTO:** cuando exista la ficha del adoptable
 * (`/adoptar/[publicacionId]`, bloqueada hoy por `obtener_adoptable`), entra
 * acá — y ahí sí trae sujeto, así que este archivo cambia de forma con ella.
 * *Se declara para que quien monte la ficha sepa que este es su lugar y no
 * invente un tercero.*
 */

/** Los destinos que el producto acepta como vuelta después del alta. */
export const DESTINOS_DE_VUELTA = ['/adoptar'] as const;

export type DestinoDeVuelta = (typeof DESTINOS_DE_VUELTA)[number];

/**
 * `null` = no vino, o vino algo que no está en la lista ⇒ el camino de siempre.
 *
 * `.some` en vez de `.includes` **para no necesitar un cast**: comparar cada
 * literal contra la cadena es lo mismo y deja el estrechamiento al predicado.
 */
export function destinoDeVuelta(crudo: unknown): DestinoDeVuelta | null {
  if (typeof crudo !== 'string') return null;
  return DESTINOS_DE_VUELTA.some((d) => d === crudo) ? (crudo as DestinoDeVuelta) : null;
}
