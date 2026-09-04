/**
 * NEXO — LO QUE SE PUEDE DECIDIR SIN REACT (S113-C · lote 0).
 *
 * Todo lo que esta pieza decide sin pintar vive acá: **qué clases están
 * vivas, en qué estado está la presencia, en qué pantallas no existe y sobre
 * qué mascota actúa un atajo.** Es a propósito: sin un solo import de runtime
 * (los dos que hay son `import type`), **un arnés de node puede llamar a
 * ESTAS funciones — las mismas que corren en pantalla — en vez de a una
 * réplica que comparte sus supuestos** (`L-459`, y el precedente de
 * `texto-jornada.ts` en el prestador).
 *
 * ── LAS TRES CLASES, Y POR QUÉ LA SEGUNDA SE LLAMA `carrito` ────────────────
 * El encargo las nombró `chat · pedidos · avisos`. **Medido:** la burbuja del
 * cliente tiene HOY dos clases —`carrito` y `mensajes`— y el encargo manda
 * (§2.4) que *«las pastillas de pendientes abren lo mismo que abría la
 * burbuja»*.
 *
 * ⇒ `chat` = las conversaciones (era `mensajes`) · `carrito` = lo que llevás
 * sin comprar (era `carrito`). **La segunda NO pasó a ser «pedidos en curso»,
 * y la razón no es comodidad:** el carrito tiene puerta global **por firma del
 * founder** (N28 · *«mientras tenga productos debe estar visible en TODA la
 * app»*) y apuntarla a Pedidos **le habría quitado su única puerta**. *Un
 * renombre que retira una puerta firmada no es un renombre.*
 *
 * ── `avisos` NACE EN `null`, Y ESO NO ES UN HUECO ───────────────────────────
 * Medido: el servidor **no produce un número** de avisos sin leer — expone
 * `hayAvisosSinLeer`, un booleano, y la campana del Hogar lo pinta como
 * PRESENCIA. Es la letra de `MODELO_LOYALTY` §3: *no leídos por presencia,
 * jamás número*. Una pastilla lleva número ⇒ **la clase existe en el tipo y
 * su cuenta es `null`**, que es exactamente «no hay número que mostrar», no
 * «no hay nada».
 *
 * 🔴 **Y `null` NO ES CERO — es la ley del guard doble de este lote.** `0`
 * es un hecho («no tenés nada»); `null` es «todavía no sé» o «no hay número».
 * Los dos se dibujan igual —sin arco y sin pastilla— **y por eso tienen que
 * decidirse por separado**: el día que `avisos` gane su número, `null` va a
 * seguir significando «cargando» y `0` «al día».
 */

/** Las clases que Nexo puede tener pendientes. Crece acá y rompe en el mapa
 *  de destinos del shell, que es `Record` completo a propósito. */
export type ClaseNexo = 'chat' | 'carrito' | 'avisos'

/** El orden en que se leen — el mismo en los arcos y en las pastillas.
 *  *Dos listas del mismo orden divergen; una sola no puede.* */
export const CLASES_NEXO: readonly ClaseNexo[] = ['chat', 'carrito', 'avisos'] as const

/** `null` = no hay número que mostrar (cargando, o la clase no cuenta —
 *  ver `avisos` arriba). `0` = lo hay y es cero. */
export type CuentasNexo = Readonly<Record<ClaseNexo, number | null>>

export const CUENTAS_DESCONOCIDAS: CuentasNexo = { chat: null, carrito: null, avisos: null }

/**
 * Los cuatro estados del encargo (§2.2).
 *
 * ⚠️ **`dormida` cubre DOS hechos distintos y por eso NO comparten guard
 * adentro**: «todavía no sé» (todas las cuentas en `null`) y «no hay nada»
 * (todas en 0). *Se dibujan igual — dormida — pero se calculan aparte*, y
 * `estaCargando()` existe para que la superficie pueda distinguirlos el día
 * que quiera decir algo mientras carga.
 */
export type EstadoNexo = 'dormida' | 'atenta' | 'despierta' | 'hablando'

/** Las clases con número mayor a cero. `null` **no cuenta**: no es un cero. */
export function clasesVivasNexo(c: CuentasNexo): ClaseNexo[] {
  return CLASES_NEXO.filter((k) => {
    const n = c[k]
    return typeof n === 'number' && n > 0
  })
}

/** Ninguna clase contestó todavía. *No es «no hay»: es «no sé».* */
export function estaCargando(c: CuentasNexo): boolean {
  return CLASES_NEXO.every((k) => c[k] === null)
}

export function estadoNexo(args: {
  cuentas: CuentasNexo
  /** La pata está abierta (los dedos a la vista). */
  huellaAbierta: boolean
  /** La Hoja de Nexo está abierta. */
  hojaAbierta: boolean
}): EstadoNexo {
  if (args.hojaAbierta) return 'hablando'
  if (args.huellaAbierta) return 'despierta'
  return clasesVivasNexo(args.cuentas).length > 0 ? 'atenta' : 'dormida'
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
  /* La captura del carnet: la cámara toma la pantalla entera y el disco
     caería sobre el obturador. */
  'carnet',
  /* Las dos llamadas: el video ES la pantalla. */
  'videollamada',
  'videoconsulta',
  /* Los checkouts —despensa y los cuatro oficios—, con sus variantes
     `checkout-plan` y `checkout-paquete`. Acá no se ofrece otra puerta:
     se está pagando. */
  'checkout',
  /* La caja propia del carrito: una puerta al cuarto donde ya estás. */
  'carrito',
  /* Alta de tarjeta, mensualidad, ensayo: es plata en curso. */
  'pagos',
  /* El hilo de adopción — el disco cae sobre la barra de escribir. Es el
     rojo que el founder nombró y ya vivía en `silenciaTodo`. */
  'solicitud',
]

/** ¿Nexo puede existir en esta pantalla? Recibe `useSegments()`. */
export function nexoVisibleEn(segmentos: readonly string[]): boolean {
  return !segmentos.some((s) => PREFIJOS_SIN_NEXO.some((p) => s === p || s.startsWith(`${p}-`)))
}
