/**
 * NEXO · LOS CUATRO DEDOS Y SOBRE QUIÉN ACTÚAN (S113-C · lote 0).
 *
 * Puro como su hermano `estado.ts` (sólo `import type`): el arnés llama a
 * **estas** funciones, no a una copia.
 *
 * ── EL ORDEN ES EL DE LA PATA, y no es decoración ───────────────────────────
 * `Peso → Vacuna → Antiparasitario → Foto`, de izquierda a derecha. La huella
 * de la casa tiene TRES dedos (`brand/Huella`: almohadilla + tres elipses) y
 * acá se abanican CUATRO atajos + la almohadilla. **No se redibuja la huella**
 * —§2.2 de `DIRECCION_ARTE` lo prohíbe con todas las letras— : lo que se
 * abanica son cuatro pastillas, y el dibujo de marca queda intacto.
 *
 * ── LOS GLIFOS: LOS CUATRO SON PROPIOS ──────────────────────────────────────
 * `AtajoCoach` exige `icono`, y los cuatro tienen el suyo: `peso` · `vacuna` ·
 * `antiparasitario` · `foto`. ⏪ **Acá vivió la declaración de tres préstamos**
 * —`datos`, `receta`, `ojo`— con su costo escrito, porque el registry no tenía
 * los tres primeros. **B los dibujó (S113-B `5dbcc5e2`) y los préstamos
 * murieron en el mismo acto**, que era el trato. *Un préstamo que sobrevive a
 * su reemplazo deja de ser un puente y pasa a ser el camino.*
 *
 * ⚠️ **LO QUE SÍ QUEDA A OJO DEL FOUNDER, y lo produce ESTE montaje, no la
 * pieza:** medido en los dibujantes, **`vacuna` lleva huella y los otros tres
 * no** (`({ tinta, huella })` contra `({ tinta })`). B lo declaró al entregar:
 * los suyos son **glifos de control** y un atajo que NOMBRA algo —una vacuna—
 * la lleva. ⇒ **dentro de la misma pata conviven dos tratamientos.** No es un
 * defecto: es `N27` con tres actos y un sustantivo. *Y si al founder le salta,
 * la salida que B deja escrita es que el cuarto también sea un acto — jamás
 * apagarle la huella a un glifo de capa.*
 *
 * ── UN BOTÓN APAGADO SIN RAZÓN A LA VISTA ES EL DEFECTO ─────────────────────
 * Por eso `razonDeApagado` devuelve un CÓDIGO y nunca un booleano: la pastilla
 * apagada **muestra su razón en una línea**, en voz de la casa.
 *
 * ☠️ **`'sin_puerta'` MURIÓ (lote 0.1).** Era la razón del dedo «Foto»:
 * `evento_hito_narrativo` existía con cero filas y `packages/api` no tenía un
 * solo escritor. **A construyó la puerta** (`registrarRecuerdoFamilia`) y el
 * dedo se encendió, así que su razón se retira **en el mismo acto** — con ella
 * se va `nexo.razonSinPuerta`, que se quedaba sin consumidor. *Una razón que
 * sobrevive a su motivo es una frase esperando que alguien la vuelva a montar
 * creyendo que rige* (Ley 37).
 *
 * Queda **una sola**, y es de dominio, no de construcción:
 *
 * · **acuario** — `mascotas.sujeto = 'acuario'` (la cláusula del pez, S91: la
 *   fila registra el SISTEMA, no un individuo). Vacuna y antiparasitario no
 *   tienen sujeto al que aplicarse. **Se mira `sujeto`, jamás la especie** —
 *   que es el dato que la casa creó exactamente para esto.
 */

import type { MascotaResumen } from '@epetplace/api'

export type AtajoNexo = 'peso' | 'vacuna' | 'antiparasitario' | 'foto'

/** El orden de la pata, de izquierda a derecha. UNA lista. */
export const ORDEN_DE_PATA: readonly AtajoNexo[] = ['peso', 'vacuna', 'antiparasitario', 'foto'] as const

/** ☠️ Fue `'acuario' | 'sin_puerta'`. Queda una sola: la unión de un miembro
 *  se conserva a propósito —el día que nazca otra razón entra sin cambiar la
 *  forma de nadie— pero **no se conserva la muerta**: un código sin productor
 *  se lee como un caso que puede ocurrir. */
export type RazonApagado = 'acuario'

/** `null` = el atajo está vivo. Un código = está apagado **y por qué**. */
export function razonDeApagado(
  atajo: AtajoNexo,
  sujeto: MascotaResumen['sujeto'],
): RazonApagado | null {
  if (sujeto === 'acuario' && (atajo === 'vacuna' || atajo === 'antiparasitario')) return 'acuario'
  return null
}

/* ═══ SOBRE QUÉ MASCOTA ACTÚA UN DEDO (§2.5) ═════════════════════════════════
 *
 * Tres casos, en este orden: la pantalla abierta manda · una sola mascota no
 * se pregunta · varias abren una hoja corta.
 *
 * ⚠️ **`'cargando'` NO ES `'ninguna'`.** Mientras el hogar no contestó no se
 * sabe si hay mascotas; decidir «ninguna» ahí apagaría la pata sobre una
 * familia que tiene tres. *Vacío por carga y vacío por estado son dos hechos y
 * no comparten guard* — por eso son dos valores del retorno y no un `[]`.
 */

/** Memorial en el sentido de la casa: `null` cuenta como activa (angostado
 *  honesto — el CHECK admite null y la elegibilidad falla cerrada). Espejo
 *  literal del criterio que ya usa `CoachHoja`. */
export function esMemorial(m: Pick<MascotaResumen, 'estado_vida'>): boolean {
  return m.estado_vida !== null && m.estado_vida !== 'activa'
}

export type FocoNexo =
  | { modo: 'cargando' }
  /** Hay una mascota decidida: la de la pantalla abierta, o la única. */
  | { modo: 'directa'; mascota: MascotaResumen }
  /** Varias y ninguna en pantalla: el dedo abre la hoja corta. */
  | { modo: 'elegir'; entre: MascotaResumen[] }
  /** 🔴 **La pantalla abierta es la de una mascota que ya no está** (D-1021).
   *  No es `'ninguna'` —la familia puede tener otras vivas— y no es
   *  `'directa'` —no se le pide nada a quien ya no está—: es su propio modo,
   *  y por eso existe. *Colapsarlo en cualquiera de los dos haría que los
   *  atajos actuaran sobre OTRA mascota sin decirlo.* */
  | { modo: 'memorial'; mascota: MascotaResumen }
  /** La familia no tiene ninguna mascota activa. */
  | { modo: 'ninguna' }

/**
 * @param mascotaIdEnRuta El `mascotaId` de la ruta abierta (`useGlobalSearchParams`).
 *        **Es el dato que ya viaja**: `/hogar/mascota/[mascotaId]`,
 *        `/hogar/vacunas/[mascotaId]`, `/citas/[mascotaId]` y `/carnet` lo
 *        llevan. *No hace falta inventar un estado de «mascota en foco»
 *        cuando la ruta ya lo dice.*
 * @param mascotas `null` = el hogar todavía no contestó.
 */
export function focoNexo(args: {
  mascotaIdEnRuta: string | undefined
  mascotas: MascotaResumen[] | null
}): FocoNexo {
  if (args.mascotas === null) return { modo: 'cargando' }

  /* 🔴 **LA MASCOTA EN FOCO MANDA, Y MANDA PRIMERO** (D-1021). ⏪ Antes esta
     rama sólo miraba entre las ACTIVAS: si la ruta nombraba a una mascota en
     memoria, `find` no la encontraba y el foco caía a `'elegir'` entre las
     vivas ⇒ **la presencia salía con Coach y sus cuatro atajos, parados en la
     pantalla de quien ya no está, actuando sobre otra mascota.** *El silencio
     no era una decisión: era un `find` que no la veía.*
     ⇒ se busca entre TODAS y se mira su estado. */
  if (args.mascotaIdEnRuta !== undefined) {
    const enRuta = args.mascotas.find((m) => m.id === args.mascotaIdEnRuta)
    if (enRuta !== undefined) {
      return esMemorial(enRuta) ? { modo: 'memorial', mascota: enRuta } : { modo: 'directa', mascota: enRuta }
    }
  }

  const activas = args.mascotas.filter((m) => !esMemorial(m))
  if (activas.length === 0) return { modo: 'ninguna' }
  if (activas.length === 1) return { modo: 'directa', mascota: activas[0] }
  return { modo: 'elegir', entre: activas }
}

/**
 * ¿Se monta la PRESENCIA, o la burbuja de siempre? (§2.3.)
 *
 * Nexo **no aparece en memorial** —ni con la mascota en foco en memorial, ni
 * con un hogar sin ninguna activa—: ahí la casa baja la voz y queda la burbuja
 * con sus dos clases.
 *
 * 🔴 **Y mientras el hogar carga se queda la BURBUJA, no la pata.** Es la
 * decisión conservadora y tiene razón medida: la puerta del carrito es **firma
 * del founder** (N28, *visible en TODA la app*) y **no puede parpadear**;
 * empezar por la burbuja y pasar a Nexo cuando el dato llega no la pierde
 * nunca. *Al revés —presencia primero, burbuja después— habría un instante de
 * pata sobre un hogar que resulta ser memorial.*
 */
export function montaPresencia(foco: FocoNexo): boolean {
  return foco.modo === 'directa' || foco.modo === 'elegir'
}

/**
 * 🔴 **¿VA CON COACH?** (D-1021.) La presencia se monta igual —la puerta a lo
 * que te espera no se le quita a nadie— pero **en la pantalla de una mascota
 * que ya no está, el Coach se apaga**: *ahí se lee, no se pide nada* (`A3.9`).
 *
 * ⚠️ **Se decide por la mascota EN FOCO, jamás por el conteo de activas.** Un
 * hogar con dos vivas y una en memoria tiene `activas.length === 2`, así que
 * contar habría dejado el Coach encendido justo en la pantalla donde no va.
 */
export function vaConCoach(foco: FocoNexo): boolean {
  return foco.modo === 'directa' || foco.modo === 'elegir'
}

/* ═══ EL HUECO QUE APARECIÓ AL PROBAR EL SELECTOR ════════════════════════════
 *
 * 🔴 **CON VARIAS MASCOTAS, EL DEDO NO SABE SOBRE QUIÉN VA A ACTUAR — y por eso
 * `razonDeApagado` SOLO NO ALCANZA.** Una familia con un perro y un acuario
 * veía «Vacuna» encendido (correcto: el perro se vacuna), elegía el acuario en
 * la hoja corta y **aterrizaba en el carnet de un acuario**. *El botón no
 * mentía sobre sí mismo: mentía sobre el camino que abría.*
 *
 * La cura no es un chequeo más al final —eso sería rebotar después de haber
 * prometido—: **es angostar la elección**. El dedo ofrece SÓLO las mascotas a
 * las que se les aplica; si no queda ninguna, se apaga con su razón; y si queda
 * UNA, **no pregunta**, que es la misma regla del hogar de una sola mascota.
 */

/** Las candidatas a las que este atajo SÍ se les aplica. */
export function mascotasParaAtajo<T extends Pick<MascotaResumen, 'sujeto'>>(
  atajo: AtajoNexo,
  candidatas: readonly T[],
): T[] {
  return candidatas.filter((m) => razonDeApagado(atajo, m.sujeto) === null)
}

/**
 * La razón del dedo mirando **a todo el hogar**, no a una mascota.
 * `null` = vivo. `'acuario'` = ninguna de las mascotas elegibles admite este
 * atajo.
 */
export function razonDelDedo<T extends Pick<MascotaResumen, 'sujeto'>>(
  atajo: AtajoNexo,
  candidatas: readonly T[],
): RazonApagado | null {
  /* Sin candidatas todavía no se sabe: el dedo no se apaga por no saber
     —*vacío por carga y vacío por estado no comparten guard*— y el shell no lo
     monta hasta tener el hogar. */
  if (candidatas.length === 0) return null
  return mascotasParaAtajo(atajo, candidatas).length === 0 ? 'acuario' : null
}
