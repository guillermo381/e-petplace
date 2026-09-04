/**
 * NEXO — LO QUE SE PUEDE DECIDIR SIN REACT (S113-C · lote 0).
 *
 * Sin un solo import de runtime (los que hay son `import type`), a propósito:
 * **un arnés de node puede llamar a ESTAS funciones — las mismas que corren en
 * pantalla — en vez de a una réplica que comparte sus supuestos** (`L-459`).
 *
 * ⏪ **ESTE ARCHIVO PERDIÓ LA MITAD DE SU TRABAJO Y ESO ES BUENO.** Nació con
 * su propio `ClaseNexo` y su propio `CuentasNexo` porque la pieza de B todavía
 * no existía. **Existe** (`PresenciaCoach`), y trae `ClaseCoach` y
 * `PendientesCoach` con la MISMA forma. *Dos vocabularios para la misma cosa
 * conviven hasta que alguien lee uno y edita el otro*, así que los míos
 * murieron y acá quedan sólo las dos decisiones que son del SHELL: **en qué
 * pantallas la presencia no existe** y **en qué estado está**.
 *
 * ── LAS TRES CLASES DE B, Y LO QUE CADA UNA ABRE ────────────────────────────
 * `chat` · `pedidos` · `avisos` son de la pieza. **Lo que abren es mío**, y §2.4
 * del encargo lo fija: *«las pastillas de pendientes abren lo mismo que abría
 * la burbuja»*. Medido: la burbuja del cliente tenía `mensajes` y `carrito`.
 * ⇒ **`chat` → las conversaciones · `pedidos` → el CARRITO.**
 *
 * 🔴 **Y `pedidos` NO se apuntó a la tab de Pedidos, aunque el nombre lo pida:**
 * la puerta global del carrito es **firma del founder** (N28 — *«mientras tenga
 * productos debe estar visible en TODA la app»*) y era **su única puerta**.
 * *Un renombre que retira una puerta firmada no es un renombre.* La voz lo dice
 * bien —«Carrito · 3»—, que es lo que la familia lee; el nombre de la prop es
 * un slot de la pieza.
 *
 * ── `avisos` NACE EN `null`, Y ESO NO ES UN HUECO ───────────────────────────
 * Medido: el servidor **no produce un número** de avisos sin leer — expone
 * `hayAvisosSinLeer`, un booleano, y la campana del Hogar lo pinta como
 * PRESENCIA. Es la letra de `MODELO_LOYALTY` §3: *no leídos por presencia,
 * jamás número*. La pieza de B ya distingue `null` de `0` en su propio tipo, y
 * las dos callan el arco **por razones opuestas**.
 */

import type { PendientesCoach } from '@epetplace/ui'

/** Nada contestó todavía. *No es «no hay»: es «no sé».* Hoy sólo `avisos`
 *  puede decirlo — `chat` y `pedidos` llegan en 0 y ese 0 es un hecho. */
export function avisosSinRespuesta(p: PendientesCoach): boolean {
  return p.avisos === null
}

/** Hay algo de alguna clase. Espejo del criterio de la pieza: `null` y `0` se
 *  van juntos, y por eso **no se colapsan en la puerta**. */
export function hayAlgo(p: PendientesCoach): boolean {
  return p.chat > 0 || p.pedidos > 0 || (p.avisos !== null && p.avisos > 0)
}

/**
 * Los cuatro estados del encargo (§2.2) — el orden de las guardas ES la regla:
 * la Hoja gana a la pata, y la pata gana a los pendientes.
 *
 * ⚠️ **`dormida` cubre dos hechos y no comparten guard**: «no hay nada» y
 * «todavía no sé». Se dibujan igual y se calculan aparte — `avisosSinRespuesta`
 * existe para que el día que la pieza quiera decir *«no pudimos leer tus
 * avisos»* el dato ya esté, en vez de haberse tirado en la puerta.
 */
export function estadoNexo(args: {
  pendientes: PendientesCoach
  /** La pata está abierta (los dedos a la vista). */
  huellaAbierta: boolean
  /** La Hoja de Nexo está abierta. */
  hojaAbierta: boolean
}): 'dormida' | 'atenta' | 'despierta' | 'hablando' {
  if (args.hojaAbierta) return 'hablando'
  if (args.huellaAbierta) return 'despierta'
  return hayAlgo(args.pendientes) ? 'atenta' : 'dormida'
}

/* ═══ DÓNDE NEXO NO EXISTE ═══════════════════════════════════════════════════
 *
 * §1.6 del encargo: cámara/captura del carnet · videollamada · checkout y pago.
 *
 * 🔴 **SE COMPARA POR PREFIJO, Y ESO ES UNA CURA MEDIDA, NO UN ADORNO.** El
 * guard vivo del carrito compara `s === 'checkout'` y **no alcanza a
 * `checkout-plan` ni a `checkout-paquete`** —dos checkouts reales del paseo—:
 * `useSegments()` devuelve esos nombres enteros y la igualdad falla en
 * silencio. *Un guard que pasa siempre no se descubre: se descubre el disco
 * encima del botón de pagar.*
 *
 * ⚠️ La lista es POR SUPERFICIE y con su razón, jamás un olvido (N28).
 */
const PREFIJOS_SIN_NEXO: readonly string[] = [
  /* La captura del carnet: la cámara toma la pantalla entera y el orbe caería
     sobre el obturador. */
  'carnet',
  /* Las dos llamadas: el video ES la pantalla. */
  'videollamada',
  'videoconsulta',
  /* Los checkouts —despensa y los cuatro oficios—, con sus variantes
     `checkout-plan` y `checkout-paquete`. Acá no se ofrece otra puerta: se
     está pagando. */
  'checkout',
  /* La caja propia del carrito: una puerta al cuarto donde ya estás. */
  'carrito',
  /* Alta de tarjeta, mensualidad, ensayo: es plata en curso. */
  'pagos',
  /* El hilo de adopción — el orbe cae sobre la barra de escribir. Es el rojo
     que el founder nombró y ya vivía en `silenciaTodo`. */
  'solicitud',
]

/** ¿Nexo puede existir en esta pantalla? Recibe `useSegments()`. */
export function nexoVisibleEn(segmentos: readonly string[]): boolean {
  return !segmentos.some((s) => PREFIJOS_SIN_NEXO.some((p) => s === p || s.startsWith(`${p}-`)))
}
