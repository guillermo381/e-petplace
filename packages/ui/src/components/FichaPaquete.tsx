/**
 * FichaPaquete — QUÉ SALE CADA DÍA SI COMPRÁS EL PAQUETE (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **Un paquete no se entiende por su precio: se entiende por su EQUIVALENTE.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * «10 estadías a $90 = $9,00 por día — 25 % menos que tu día suelto». Nadie
 * compara $90 contra $12 de cabeza mientras decide. **El espejo hace esa cuenta
 * a la vista**, y por eso vive pegado al precio y no en una nota al pie.
 *
 * ── 🔴 LA ARITMÉTICA ES DE LA PIEZA. LAS PALABRAS NO. Y ES LA DECISIÓN ────
 * La misma ficha se monta en la **config del prestador** (donde se elige y se
 * pone el precio) y en el **perfil del lugar** (donde la familia lee). **Si la
 * cuenta viviera en cada pantalla, las dos podrían dar números distintos** —
 * y el día que difieran, el prestador estaría vendiendo un descuento que la
 * familia no ve. *Es la lección 19.9 en su forma más cara: lo que se copia,
 * diverge.* ⇒ **la división y el porcentaje se calculan ACÁ, una vez.**
 *
 * **Pero el texto NO se arma acá**, por dos razones medidas:
 * ① **el orden de las palabras cambia por idioma** — componer la frase de
 *   fragmentos («10» + «estadías a» + «$90» …) es el anti-patrón clásico de
 *   i18n, y la casa ya tiene interpolación tipada con espejo es↔en;
 * ② 🔴 **el formato de plata es del RIEL, y meterlo acá agregaría el
 *   `$${x.toFixed(2)}` número 54.** `PrecioText` nació justo para matar ese
 *   patrón —su cabecera cuenta los 53 sitios— y **`VozComision` lo
 *   reintrodujo**: acá no se repite. *(Se declara el hallazgo sin curarlo:
 *   `VozComision` tiene consumidores vivos y no es territorio de esta tanda.)*
 *
 * ⇒ **`vozEquivalente` es una FUNCIÓN**: recibe los números ya calculados y
 * devuelve la frase. La pieza garantiza que el número sea uno solo; el riel
 * garantiza que la frase esté bien dicha. *Ninguna de las dos hace el trabajo
 * de la otra.*
 *
 * ── 🔴 SI EL PAQUETE SALE MÁS CARO, EL ESPEJO LO DICE — EN NEUTRO ────────
 * **Firma de la mesa: informa, jamás prohíbe ni alarma.** El más caro se pinta
 * con **exactamente el mismo color que el más barato** (`secondary`): ni
 * `warning`, ni `danger`, ni un ícono de advertencia.
 *
 * *Y las dos mitades importan por separado:*
 * · **Decirlo** — esconder la comparación cuando no favorece convierte al
 *   espejo en publicidad. Un espejo que sólo habla cuando conviene deja de ser
 *   un espejo.
 * · **En neutro** — un paquete más caro **no es un error de nadie**: puede ser
 *   deliberado (incluye algo que el día suelto no). Pintarlo de alarma sería
 *   la app opinando sobre el precio de un negocio ajeno, y de paso enseñaría a
 *   ignorar el color de alarma (mismo precedente que le prohíbe el rojo al
 *   temporizador de la videoconsulta, §1.5).
 *
 * ── SIN CONTADORES, SIN URGENCIA (`MODELO_LOYALTY` §7.5) ─────────────────
 * No hay «quedan N», no hay «ahorrás hasta», no hay cuenta regresiva. **El
 * porcentaje NO es un gancho: es la unidad que vuelve comparables dos precios
 * de distinta forma.** *La diferencia está en para qué sirve el número — «$9,00
 * por día» ayuda a comparar; «¡últimos 3!» ayuda a no pensar.*
 *
 * ── LEY 11: EL CENSO, Y POR QUÉ NO ES `SelectorOpcion` ───────────────────
 * Relevado antes de crear (protocolo 1c, pregunta 2):
 * · **`SelectorOpcion`** es un GRUPO de chips con una etiqueta por chip. Acá
 *   **cada opción carga su propio campo de precio y su propia línea
 *   calculada** — eso ya no es un chip en una fila: es una ficha por opción.
 *   Meterle dos slots por ítem a una pieza congelada que montan ~20 pantallas
 *   es el precedente que S71 ya rechazó con `FilaDato`.
 * · **`VozComision`** es la línea viva bajo un precio y **de ella se toma la
 *   forma** (presentacional, nulos honestos, `text.secondary`) — lo que no da
 *   es el chip ni la comparación entre dos precios.
 * · **`FichaMensualidad`** (hermana, S107-B) informa UNA oferta cerrada; no
 *   compara ni se elige.
 * · **`SliderPrecio`** es el campo de precio **y se MONTA por slot**, no se
 *   reimplementa (ver `campoPrecio`).
 * El trabajo «elegir entre tamaños de paquete viendo su equivalente por día»
 * no estaba en el diccionario (Ley 19).
 *
 * ── LEY 13 — LOS DOS HUECOS HONESTOS ─────────────────────────────────────
 * · **Sin `precioDiaSuelto`** (o en 0) **no hay contra qué comparar**: el
 *   espejo dice el equivalente por día y **omite la comparación**
 *   (`direccion: 'sin_comparacion'`). *Inventar un 0 % sería afirmar que sale
 *   igual, que es una afirmación y no un hueco.*
 * · **Sin `precioPaquete`** todavía no hay qué reflejar (el prestador está
 *   escribiéndolo): **no se dibuja el espejo**, y no se dibuja un `$0,00` que
 *   se lee como dato.
 *
 * ── ESCALERA (§4b) · DOSIS · MOVIMIENTO ──────────────────────────────────
 * **Peldaño 0** — el tamaño (existe apenas el lugar declara el paquete).
 * **Peldaño 1** — con precio, el equivalente por día. **Peldaño 2** — con el
 * día suelto, la comparación. No muestra datos del expediente.
 * `registro` modula el acento por casa ('control' cliente · 'oficio'
 * prestador). Sin animación (Ley 6): un precio se lee, no se celebra.
 */

import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { PrecioText } from './PrecioText'
import { Texto } from './Texto'

/** Hacia dónde cae el paquete contra el día suelto. */
export type DireccionEquivalencia = 'menos' | 'mas' | 'igual' | 'sin_comparacion'

/**
 * Lo que la pieza CALCULA y le entrega al riel para que lo diga.
 * Números crudos: **el formato de plata y el de porcentaje son del riel.**
 */
export type EquivalenciaPaquete = {
  /** Tamaño del paquete, tal como llegó. */
  tamano: number
  /** Precio total del paquete. */
  precioPaquete: number
  /** `precioPaquete / tamano`. Sin redondear — redondea quien formatea. */
  porDia: number
  /**
   * Cuánto se aparta del día suelto, en PUNTOS PORCENTUALES POSITIVOS
   * (`25` = un 25 %). El signo NO viaja acá: lo dice `direccion`.
   * `null` cuando no hay con qué comparar.
   */
  deltaPct: number | null
  direccion: DireccionEquivalencia
}

export type FichaPaqueteProps = {
  /** Identidad estable. Jamás se muestra. */
  clave: string
  /** 5 · 10 · 15. Lo declara el lugar: es DATO, no un catálogo cableado acá. */
  tamano: number
  /**
   * El rótulo del tamaño en voz de la app («10 estadías»).
   * 🔴 Por prop: la pluralización es del riel, no de una pieza.
   */
  rotuloTamano: string
  /** Precio total del paquete. `null` = todavía sin precio (ver Ley 13). */
  precioPaquete: number | null
  /**
   * El precio del día suelto, para comparar. `null` o `0` = no hay
   * comparación posible y el espejo lo omite — jamás inventa un 0 %.
   */
  precioDiaSuelto: number | null
  /**
   * Compone la frase del espejo con los números ya calculados.
   * Ausente = no se dibuja el espejo (la pantalla decidió no contarlo).
   */
  vozEquivalente?: (e: EquivalenciaPaquete) => string
  /**
   * Presente = la ficha es SELECCIONABLE (config del prestador).
   * Ausente = solo lectura (perfil del lugar, la familia) — y entonces **no
   * es tocable**: una ficha que se hunde sin hacer nada es una promesa rota.
   */
  onElegir?: (clave: string) => void
  elegido?: boolean
  /**
   * El campo de precio, como SLOT — la pantalla mete `SliderPrecio`.
   * **La pieza no reimplementa la edición de precio** (misma frontera que
   * `ActaDeEntrega` con la captura de fotos: la mecánica es de quien la tiene).
   */
  campoPrecio?: ReactNode
  /** Ley 22 por registro: 'control' (cliente, default) · 'oficio' (prestador). */
  registro?: 'control' | 'oficio'
}

/**
 * 🔴 LA ARITMÉTICA, EXPORTADA — para que una pantalla que necesite el mismo
 * número (un resumen, un checkout) **no la vuelva a escribir**. Es la razón de
 * ser de la pieza puesta a disposición: *el número es uno solo o no sirve.*
 */
export function equivalenciaDePaquete(
  tamano: number,
  precioPaquete: number,
  precioDiaSuelto: number | null,
): EquivalenciaPaquete {
  const porDia = precioPaquete / tamano
  const hayComparacion = precioDiaSuelto !== null && precioDiaSuelto > 0

  if (!hayComparacion) {
    return { tamano, precioPaquete, porDia, deltaPct: null, direccion: 'sin_comparacion' }
  }

  const suelto = precioDiaSuelto as number
  const razon = (porDia - suelto) / suelto
  /* Se compara el REDONDEO A CENTAVO y no el flotante crudo: dos precios que
     rinden el mismo centavo por día son iguales para quien paga, y un
     `0.0000001 %` pintado como «más caro» sería cierto y useless. */
  const igual = Math.round(porDia * 100) === Math.round(suelto * 100)

  return {
    tamano,
    precioPaquete,
    porDia,
    // Siempre POSITIVO: el sentido lo lleva `direccion`, no el signo. Así el
    // riel escribe «25 % menos» / «25 % más» sin tener que quitarle el menos.
    deltaPct: igual ? 0 : Math.abs(razon) * 100,
    direccion: igual ? 'igual' : razon < 0 ? 'menos' : 'mas',
  }
}

export function FichaPaquete({
  clave,
  tamano,
  rotuloTamano,
  precioPaquete,
  precioDiaSuelto,
  vozEquivalente,
  onElegir,
  elegido = false,
  campoPrecio,
  registro = 'control',
}: FichaPaqueteProps) {
  const { theme } = useTheme()

  /* Un tamaño no positivo no se dibuja: dividir por él daría Infinity y el
     espejo afirmaría cualquier cosa (Ley 13 — antes que un número falso, nada). */
  if (tamano <= 0) return null

  const acento = registro === 'oficio' ? theme.accent.cta : theme.accent.control

  const equivalencia =
    precioPaquete === null ? null : equivalenciaDePaquete(tamano, precioPaquete, precioDiaSuelto)

  const cuerpo = (
    <View style={{ gap: spacing[2] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: spacing[3],
        }}
      >
        {/* El tamaño lo escribió el riel en voz humana (Ley 3). */}
        <Texto variante="cuerpo">{rotuloTamano}</Texto>

        {/* El precio es el dato que decide: lo viste `PrecioText`, que existe
            para no volver a escribirlo a mano. `null` lo resuelve él. */}
        <PrecioText valor={precioPaquete} registro="ficha" />
      </View>

      {/* EL CAMPO DE PRECIO — slot; sólo donde se configura. */}
      {campoPrecio}

      {/* EL ESPEJO. 🔴 Mismo color SIEMPRE (`secondary`), caiga para donde
          caiga: informa, jamás alarma — firma de la mesa. */}
      {equivalencia === null || vozEquivalente === undefined ? null : (
        <Texto variante="apoyo" color="secondary">
          {vozEquivalente(equivalencia)}
        </Texto>
      )}
    </View>
  )

  if (onElegir === undefined) {
    /* SOLO LECTURA: no es tocable y se anuncia como texto. */
    return (
      <View
        accessibilityRole="text"
        style={{
          padding: spacing[4],
          borderRadius: radius.suave,
          borderWidth: theme.border.width,
          borderColor: theme.border.default,
        }}
      >
        {cuerpo}
      </View>
    )
  }

  return (
    <Pressable
      onPress={() => onElegir(clave)}
      accessibilityRole="radio"
      accessibilityState={{ checked: elegido }}
      accessibilityLabel={rotuloTamano}
      style={({ pressed }) => ({
        padding: spacing[4],
        minHeight: 44,
        borderRadius: radius.suave,
        borderWidth: theme.border.width,
        /* TONAL para el elegido (Ley 22), con el MISMO guard de memorial que
           `SelectorVentana` y `CalendarioCupo`: memorial no tiene `capaBg` y
           degrada a superficie sin tinte (Ley 8). */
        borderColor: elegido ? acento : theme.border.default,
        backgroundColor: elegido
          ? 'capaBg' in theme
            ? theme.capaBg.comunidad
            : theme.bg.overlay
          : pressed
            ? theme.bg.overlay
            : 'transparent',
      })}
    >
      {cuerpo}
    </Pressable>
  )
}
