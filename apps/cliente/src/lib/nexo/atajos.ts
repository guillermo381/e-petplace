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
 * ── POR QUÉ LAS PASTILLAS NO LLEVAN GLIFO ───────────────────────────────────
 * **Medido contra el registry (`IconoNombre`, 55 nombres): existe `vacuna`; no
 * existen peso, antiparasitario ni foto.** Un glifo se firma con su estudio
 * §6b y su gate por ícono — **inventar tres acá sería saltarse el gate**, y
 * poner glifo sólo en uno de los cuatro es peor que en ninguno. ⇒ los cuatro
 * dedos llevan **su palabra**, que es la información que hace falta, y los
 * tres glifos quedan **pedidos por nombre a B**.
 *
 * ── UN BOTÓN APAGADO SIN RAZÓN A LA VISTA ES EL DEFECTO ─────────────────────
 * Por eso `razonDeApagado` devuelve un CÓDIGO y nunca un booleano: la pastilla
 * apagada **muestra su razón en una línea**, en voz de la casa. Los dos casos
 * medidos hoy:
 *
 * ① **acuario** — `mascotas.sujeto = 'acuario'` (la cláusula del pez, S91: la
 *    fila registra el SISTEMA, no un individuo). Vacuna y antiparasitario no
 *    tienen sujeto al que aplicarse. **Se mira `sujeto`, jamás la especie** —
 *    que es el dato que la casa creó exactamente para esto.
 *
 * ② **foto sin puerta** — 🔴 medido: `evento_hito_narrativo` **existe en la
 *    base con sus dos claves y CERO filas**, y **`packages/api` no tiene un
 *    solo escritor** (el alta lo dejó anotado y sin encender: *«la voz se
 *    firma en el gate de pantalla»*). *Un atajo que navega a ninguna parte es
 *    peor que uno apagado*, así que se dibuja apagado y lo dice. La puerta
 *    queda **pedida por nombre a A**.
 */

import type { MascotaResumen } from '@epetplace/api'

export type AtajoNexo = 'peso' | 'vacuna' | 'antiparasitario' | 'foto'

/** El orden de la pata, de izquierda a derecha. UNA lista. */
export const ORDEN_DE_PATA: readonly AtajoNexo[] = ['peso', 'vacuna', 'antiparasitario', 'foto'] as const

export type RazonApagado = 'acuario' | 'sin_puerta'

/** `null` = el atajo está vivo. Un código = está apagado **y por qué**. */
export function razonDeApagado(
  atajo: AtajoNexo,
  sujeto: MascotaResumen['sujeto'],
): RazonApagado | null {
  if (atajo === 'foto') return 'sin_puerta'
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
  const activas = args.mascotas.filter((m) => !esMemorial(m))
  if (activas.length === 0) return { modo: 'ninguna' }
  if (args.mascotaIdEnRuta !== undefined) {
    const enRuta = activas.find((m) => m.id === args.mascotaIdEnRuta)
    /* ⚠️ Si la ruta nombra una mascota que NO está activa (un memorial
       abierto), **no se cae a «la primera»**: eso actuaría sobre otra mascota
       sin decirlo. Se sigue de largo y decide la regla general. */
    if (enRuta !== undefined) return { modo: 'directa', mascota: enRuta }
  }
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
 * `null` = vivo. `'sin_puerta'` = el destino no existe. `'acuario'` = ninguna
 * de las mascotas elegibles admite este atajo.
 */
export function razonDelDedo<T extends Pick<MascotaResumen, 'sujeto'>>(
  atajo: AtajoNexo,
  candidatas: readonly T[],
): RazonApagado | null {
  if (atajo === 'foto') return 'sin_puerta'
  /* Sin candidatas todavía no se sabe: el dedo no se apaga por no saber
     —*vacío por carga y vacío por estado no comparten guard*— y el shell no lo
     monta hasta tener el hogar. */
  if (candidatas.length === 0) return null
  return mascotasParaAtajo(atajo, candidatas).length === 0 ? 'acuario' : null
}
