/**
 * FichaDeOferta — UNA COSA QUE SE OFRECE: se enciende, se expande, se cotiza.
 * (S107-B · nace como `FichaPaquete` y se GENERALIZA en la tanda 4.)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **UN SOLO GESTO DICE LAS DOS COSAS: el toggle ENCIENDE Y EXPANDE.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Diario · Mensual · los tres paquetes: **son la misma fila**. Pared blanca,
 * etiqueta a la izquierda, toggle a la derecha; al encender, la ficha se abre
 * y muestra su campo de precio. *Antes eran tres anatomías distintas para el
 * mismo trabajo —una tarjeta seleccionable, un `Interruptor` suelto con un
 * `Campo` debajo, y un slider suelto—, que es exactamente cómo empiezan a
 * divergir (19.9).*
 *
 * ── POR QUÉ EL TOGGLE HACE LAS DOS COSAS ─────────────────────────────────
 * Encender una oferta y abrir su precio **no son dos decisiones**: nadie
 * enciende «Mensual» para dejarlo sin precio. Separarlos pediría dos gestos
 * para un solo acto — y dejaría existir el estado «encendido sin precio», que
 * es una oferta que no se puede comprar.
 *
 * ── EL ESPEJO (opcional): un paquete se entiende por su EQUIVALENTE ──────
 * «10 estadías a $90 = $9,00 por día — 25 % menos que tu día suelto». Nadie
 * compara $90 contra $12 de cabeza mientras decide. **Diario y Mensual no lo
 * pasan y no se dibuja.**
 *
 * «10 estadías a $90 = $9,00 por día — 25 % menos que tu día suelto». Nadie
 * compara $90 contra $12 de cabeza mientras decide. **El espejo hace esa cuenta
 * a la vista**, y por eso vive pegado al precio y no en una nota al pie.
 *
 * ── 🔴 LA ARITMÉTICA ES DE LA PIEZA. LAS PALABRAS NO. Y ES LA DECISIÓN ────
 * La misma ficha se monta en la **config del prestador** (donde se enciende y
 * se pone el precio) y en el **perfil del lugar** (donde la familia lee, sin
 * toggle). **Si la cuenta viviera en cada pantalla, podrían dar distinto** —
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
 * ── 🔴 EL FONDO ENCENDIDO ES VERDE SUAVE, NO MAGENTA (firma de mesa, S107) ─
 * ⏪ **Defecto corregido, y era mío:** esta pieza pintaba el borde SEGÚN EL
 * REGISTRO (`accent.cta` en el prestador = tealDark) **y el fondo NO** —
 * `capaBg.comunidad`, que es `pinkAlpha08`. *Resultado medido: en el taller
 * del prestador la ficha encendida tenía borde teal con relleno magenta.*
 *
 * **El magenta es color de MARCA** (Ley 4: el hex puro vive en destello,
 * huella de tab y techo) y no tiene nada que hacer marcando una oferta
 * encendida. Pasa a **`capaBg.cuidado`** (`tealAlpha16`) **en las dos casas**.
 *
 * *Por qué `cuidado` y no `identidad`:* `capaBg.identidad` es
 * `verdeVitalAlpha15`, la capa de **VIDA** (salud). Usarla acá metería la capa
 * clínica en una pieza de comercio. `cuidado` es la capa del servicio y su
 * `capa.cuidado` es `tealDark` — **el mismo color que ya pinta el borde**, así
 * que borde y relleno por fin dicen lo mismo.
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
import { View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Interruptor } from './Interruptor'
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

export type FichaDeOfertaProps = {
  /* ☠️ `clave` SE RETIRÓ en la tanda 4: la pieza ya no la usaba. La identidad
     de una fila la resuelve el `key` de React, y quién cambió lo sabe el
     closure de la pantalla. Una prop que nadie lee es ruido en el contrato. */
  /**
   * Sólo lo usa el ESPEJO. `null` = esta oferta no se divide en unidades
   * (Diario, Mensual) y no hay equivalente que calcular.
   */
  tamano: number | null
  /**
   * La etiqueta de la oferta, a la izquierda: «Diario», «Mensual»,
   * «10 estadías». 🔴 Por prop: la pluralización es del riel.
   */
  rotulo: string
  /** Precio total del paquete. `null` = todavía sin precio (ver Ley 13). */
  precio: number | null
  /**
   * El precio del día suelto, para comparar. `null` o `0` = no hay
   * comparación posible y el espejo lo omite — jamás inventa un 0 %.
   */
  precioDiaSuelto?: number | null
  /**
   * Compone la frase del espejo con los números ya calculados.
   * Ausente = no se dibuja el espejo (la pantalla decidió no contarlo).
   */
  vozEquivalente?: (e: EquivalenciaPaquete) => string
  /**
   * Presente = la ficha tiene TOGGLE (config del prestador): enciende y
   * expande en el mismo acto.
   * Ausente = solo lectura (perfil del lugar, la familia) — sin control y
   * **sin nada tocable**: una ficha que se hunde sin hacer nada es una
   * promesa rota.
   */
  onCambio?: (encendido: boolean) => void
  /** Encendido ⇒ expandido. **No son dos estados** — ver la cabecera. */
  encendido?: boolean
  /**
   * Lo que se revela al encender — típicamente el campo de precio. **SLOT**:
   * la pantalla mete `SliderPrecio` o `Campo`. *La pieza no reimplementa la
   * edición de precio* (misma frontera que `ActaDeEntrega` con las fotos).
   *
   * 🔴 **Sólo se dibuja con `encendido`.** Un riel vivo bajo una oferta
   * apagada invita a mover algo que no se ofrece.
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
  precioDiaSuelto?: number | null,
): EquivalenciaPaquete {
  const porDia = precioPaquete / tamano

  /* 🔴 EL GUARD SE ESCRIBE EXPLÍCITO, y hay una razón medida.
     Al volverse OPCIONAL este parámetro (tanda 4), apareció una TERCERA forma
     de estar ausente: `undefined`. El guard viejo miraba sólo `null` y **seguía
     acertando** — porque `undefined > 0` da `false`—, o sea **acertaba por cómo
     JS coerciona, no por diseño**. Es `L-424` con otra ropa: *un guard que
     acierta por coerción es un guard que nadie puede leer y confirmar.*
     Y este caso **dejó de ser raro**: un lugar que todavía no puso precio de
     día suelto es lo normal mientras configura. */
  const hayComparacion =
    precioDiaSuelto !== null && precioDiaSuelto !== undefined && precioDiaSuelto > 0

  if (!hayComparacion) {
    return { tamano, precioPaquete, porDia, deltaPct: null, direccion: 'sin_comparacion' }
  }

  const suelto = precioDiaSuelto
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

export function FichaDeOferta({
  tamano,
  rotulo,
  precio,
  precioDiaSuelto = null,
  vozEquivalente,
  onCambio,
  encendido = false,
  campoPrecio,
  registro = 'control',
}: FichaDeOfertaProps) {
  const { theme } = useTheme()

  const acento = registro === 'oficio' ? theme.accent.cta : theme.accent.control

  /* El espejo sólo existe si la oferta se divide en unidades Y hay precio.
     `tamano <= 0` no se calcula: dividir daría Infinity y el espejo afirmaría
     cualquier cosa (Ley 13 — antes que un número falso, nada). */
  const equivalencia =
    tamano !== null && tamano > 0 && precio !== null
      ? equivalenciaDePaquete(tamano, precio, precioDiaSuelto)
      : null

  /* 🔴 EL FONDO ENCENDIDO — verde suave en LAS DOS CASAS (firma de mesa).
     Memorial no tiene `capaBg` y degrada a superficie sin tinte (Ley 8),
     mismo guard que `SelectorVentana` y `CalendarioCupo`. */
  const fondoEncendido = 'capaBg' in theme ? theme.capaBg.cuidado : theme.bg.overlay

  const cabecera = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing[3],
      }}
    >
      <View style={{ flex: 1, gap: spacing[0.5] }}>
        <Texto variante="cuerpo">{rotulo}</Texto>
      </View>

      {/* El precio acompaña a la etiqueta: es el dato que decide y se lee de
          un vistazo aunque la ficha esté cerrada. `null` lo resuelve él. */}
      <PrecioText valor={precio} registro="linea" />

      {/* EL TOGGLE — enciende Y expande. Sólo donde se configura. */}
      {onCambio === undefined ? null : (
        <Interruptor
          etiqueta={rotulo}
          encendido={encendido}
          onCambio={onCambio}
          registro={registro === 'oficio' ? 'oficio' : 'control'}
        />
      )}
    </View>
  )

  const cuerpo = (
    <View style={{ gap: spacing[2] }}>
      {cabecera}

      {/* LO QUE SE REVELA AL ENCENDER. En solo-lectura (sin toggle) el
          contenido se muestra si vino: la familia no enciende nada, pero sí
          ve lo que el lugar ofrece. */}
      {(onCambio === undefined || encendido) && campoPrecio !== undefined ? campoPrecio : null}

      {/* EL ESPEJO. 🔴 Mismo color SIEMPRE (`secondary`), caiga para donde
          caiga: informa, jamás alarma — firma de la mesa. */}
      {equivalencia === null || vozEquivalente === undefined ? null : (
        <Texto variante="apoyo" color="secondary">
          {vozEquivalente(equivalencia)}
        </Texto>
      )}
    </View>
  )

  const pared = {
    padding: spacing[4],
    borderRadius: radius.suave,
    borderWidth: theme.border.width,
    /* PARED BLANCA en reposo (firma de mesa): la superficie de la casa, no
       transparente — la ficha es un objeto sobre el fondo, no un hueco. */
    backgroundColor: encendido ? fondoEncendido : theme.bg.card,
    borderColor: encendido ? acento : theme.border.default,
  }

  /* SOLO LECTURA: sin toggle no hay nada que tocar, y no se dibuja un
     Pressable que se hunda sin consecuencia. */
  if (onCambio === undefined) {
    return (
      <View accessibilityRole="text" style={pared}>
        {cuerpo}
      </View>
    )
  }

  /* CON TOGGLE: la ficha NO es tocable entera. El control es el
     `Interruptor`, que ya tiene su rol y su target — envolver todo en un
     segundo responder pondría dos blancos táctiles para el mismo acto, que
     es cómo se falla un tap. */
  return <View style={pared}>{cuerpo}</View>
}
