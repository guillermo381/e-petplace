/**
 * QUÉ GLIFO LE TOCA A CADA OFICIO — **un solo lugar, y por eso existe.**
 *
 * 🔴 **NACE DE UN CENSO: hoy cada superficie escribe el nombre a mano.**
 * Medido en `apps/cliente` — `explorar/index.tsx` monta `<Icono
 * nombre="paseo">`, `nombre="grooming">`, `nombre="veterinaria">`… una por
 * una, y las pantallas de cada oficio repiten el suyo (`paseo/index.tsx`
 * lo escribe **cuatro veces**). *Veinte lugares que tienen que acordarse
 * del mismo nombre.*
 *
 * ⚠️ **Y hay uno que es peor que repetido: `reserva-piezas.tsx:171` monta
 * `<Icono nombre={oficio}>`** — usa el nombre del OFICIO como nombre de
 * GLIFO. Funciona hoy porque coinciden, y **el día que un oficio se llame
 * distinto de su glifo deja de compilar o, peor, pinta otro**. *Dos
 * vocabularios que coinciden por accidente no son un vocabulario: son dos
 * listas que nadie prometió mantener iguales.*
 *
 * ── LO QUE ESTE MAPA SÍ Y NO ES ────────────────────────────────────────
 * **Es la traducción oficio → glifo, y nada más.** No decide tamaño, ni
 * registro, ni color: eso lo sabe la pantalla. *Un helper que además
 * dibuja se vuelve un componente y deja de poder usarse donde hace falta
 * sólo el nombre.*
 *
 * ⚠️ **LA JERINGA ES SÓLO DE VACUNAS, y está escrito acá para que se vea:**
 * `vacuna` **no aparece en este mapa** porque no es un oficio — es un acto
 * clínico. Firma de la mesa: *«vacuna = jeringa SOLO para vacunas»*.
 * 📏 **Medido antes de escribirlo, y la premisa del encargo NO se cumplía
 * en el cliente:** cero montajes de `nombre="vacuna"` en `apps/cliente`.
 * *El riesgo era real y el caso no; se deja el mapa igual, porque lo que
 * lo impide es que la jeringa no esté acá.*
 */

import type { IconoNombre } from './Icono'
import type { FilaCitaOficio } from './FilaCita'

/* ══════════════════════════════════════════════════════════════════════
 *  🔴 SE EXTIENDE `FilaCitaOficio`, NO SE DUPLICA — y me lo corrigió un
 *  censo que hice DESPUÉS de escribir la primera versión.
 *
 * Al medir aparecieron **CINCO tipos de oficio ya conviviendo**:
 * `OficioChip` (`packages/api`, 5 valores) · `FilaCitaOficio`
 * (`packages/ui`) · `OficioTaller` (prestador, 4) · `OficioAtender` (= el
 * primero) · y `OficiosActivos`. **El mío iba a ser el sexto.**
 *
 * `FilaCitaOficio` son los cinco que producen una CITA. Este tipo es más
 * ancho a propósito —Explorar muestra servicios que no se agendan— así que
 * **no es el mismo conjunto y no puede reemplazarlo**. Pero sí puede
 * NACER DE ÉL: así el compilador garantiza que los cinco coincidan, y el
 * día que la casa agende un oficio nuevo, **el `Record` de abajo deja de
 * compilar hasta que alguien le dé su glifo**.
 *
 * *Dos listas que empiezan iguales y se mantienen a mano divergen; una que
 * se deriva, no puede.* Es la misma disciplina con la que `caraDePersonaje`
 * dejó de estar en dos lugares.
 * ══════════════════════════════════════════════════════════════════════ */
export type Oficio =
  | FilaCitaOficio
  /* Los que Explorar muestra y NO producen una cita. */
  | 'hotel'
  | 'despensa'
  | 'telemedicina'
  | 'seguros'

/** El glifo de cada oficio. **Completo por tipo**: agregar un oficio sin
 *  su glifo no compila, que es lo que impide que el próximo caiga en un
 *  genérico. */
const GLIFO: Record<Oficio, IconoNombre> = {
  /** La correa que cae hasta la huella. */
  paseo: 'paseo',
  /** La tijera. */
  grooming: 'grooming',
  /** El estetoscopio. **No una cruz**: la cruz vive en `urgencias`. */
  veterinaria: 'veterinaria',
  /** El silbato. ⚠️ El oficio se llama `adiestramiento` y el glifo
   *  `training` — **este mapa es justamente el lugar donde esa diferencia
   *  deja de importar.** Sin él, cada pantalla tiene que saberla. */
  adiestramiento: 'training',
  /** La casa CON LUNA. La luna entró en S116-B porque sin la huella este
   *  glifo era idéntico a `hogar` — ver su entrada en el registry. */
  guarderia: 'guarderia',
  /** La cama. */
  hotel: 'hotel',
  /** La bolsa. ⚠️ Distinta de `carrito` (lo que llevás sin comprar) y de
   *  `pedido` (lo que ya compraste): las tres conviven. */
  despensa: 'despensa',
  /** La pantalla con la cruz. */
  telemedicina: 'telemedicina',
  /** El escudo con check. */
  seguros: 'seguros',
}

/** El glifo de un oficio. **No tiene fallback y es deliberado**: si el
 *  argumento está tipado, el caso imposible no existe; y si alguien llega
 *  con un string del motor, `esOficio` lo filtra ANTES — *un fallback
 *  silencioso convertiría un oficio nuevo sin glifo en uno genérico, que
 *  es exactamente el defecto que este mapa viene a impedir.* */
export function glifoDeOficio(oficio: Oficio): IconoNombre {
  return GLIFO[oficio]
}

/** ¿Este string del motor es un oficio que sabemos dibujar? Para los
 *  bordes donde el dato llega sin tipar. **Devuelve el tipo estrechado**,
 *  así el `else` de la pantalla queda visible en vez de escondido. */
export function esOficio(valor: string): valor is Oficio {
  return valor in GLIFO
}
