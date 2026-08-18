/**
 * SelectorVentana — CUÁNDO LLEGA, y por qué un día no se puede elegir.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §6.2 (*"programar la fecha de entrega
 * entra"*) y §7.1 de la letra del panel (*"la promesa es una VENTANA, no
 * una fecha"*). Contrato confirmado por D.
 *
 * ── LA REGLA QUE ORDENA LA PIEZA ───────────────────────────────────────
 * §6.2 pone la condición que la vuelve honesta: *"el cupo existe por cada
 * día futuro y la promesa lo consume. **Un día sin capacidad confirmada
 * no se puede prometer.**"* Y §7.3: *"prometer sobre un recurso que no va
 * a estar es exactamente lo que L-139 prohíbe."*
 *
 * ── 🔴 EL DÍA SIN CUPO SE DIBUJA, NO SE ESCONDE — y es la decisión ─────
 * La Ley 23 dice que *la puerta no ofrece lo que va a rechazar*, y la
 * lectura fácil es esconder el día lleno. **Es la lectura equivocada
 * acá**, por una razón concreta: el cliente **está buscando el jueves**.
 * Un jueves que desaparece de la lista se lee como *"el jueves no
 * existe"*, y deja a alguien sin entender por qué su día no está — que es
 * el mismo daño que la Ley 13 nombra cuando un error se disfraza de
 * vacío.
 *
 * > **La puerta no OFRECE lo que va a rechazar, pero tampoco puede hacer
 * > DESAPARECER lo que el usuario vino a buscar.** El día lleno se
 * > muestra, no se puede tocar, **y dice por qué** — que es lo único que
 * > convierte un "no" en información.
 *
 * Por eso `motivo` viaja al lado de `estado`, **visible sin tocar nada**:
 * un motivo detrás de un tap es un motivo que nadie lee. *La Ley 23 sigue
 * intacta: la opción llena no es tocable — el servidor jamás la va a
 * recibir. Lo que se agrega es que la negación habla.*
 *
 * ── APAGADO NO DICE ERROR (Ley 22) ─────────────────────────────────────
 * `sin_cupo` **no** usa el registro de peligro ni el de alerta: es un
 * apagado sereno. Que un día esté lleno no es una falla del cliente ni
 * del sistema — es una capacidad que se agotó, y pintarla en rojo
 * convierte una agenda en un reproche.
 *
 * ── POR QUÉ NO ES `SelectorOpcion` ENSANCHADO ──────────────────────────
 * Relevado (protocolo 1c, pregunta 2). `SelectorOpcion` es el chip de
 * VALOR y no tiene "no elegible con su razón" — y la diferencia no es
 * cosmética: **una opción que no se puede elegir y dice POR QUÉ necesita
 * espacio para la razón**, o sea otra anatomía. Meterla ahí obligaría a
 * los chips de toda la casa a cargar un `motivo` que ninguno usa, que es
 * la prop-al-pasar que la casa ya rechazó en `FilaDato`.
 *
 * La elección viste TONAL (Ley 22: selección entre pares) sobre
 * rectángulo suave (Ley 21: lo que se elige no es píldora).
 *
 * Presentacional puro: no calcula cupo, no llama a nadie. La pantalla
 * arma las opciones con `calcularPromesaDespensa` y `cupoRepartoDelDia`.
 */

import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type EstadoVentana = 'elegible' | 'sin_cupo'

export type OpcionVentana = {
  /** Identidad estable. Jamás se muestra. */
  clave: string
  /** La ventana en voz de la casa: "hoy, 14:00 a 18:00". */
  etiqueta: string
  /** "llega hoy" · "mañana por la mañana". */
  detalle?: string
  estado: EstadoVentana
  /**
   * POR QUÉ no se puede elegir. **Visible sin tocar** — ver la decisión
   * del encabezado. Solo tiene sentido con `estado: 'sin_cupo'`.
   */
  motivo?: string
}

/**
 * 🔴 CÓMO SE REPARTEN LAS OPCIONES — S100c-B, pedido de la pista A sobre una
 * observación del founder: *«cuándo se entrega» es invisible sin deslizar*.
 *
 * **El número que lo obliga, medido en aparato:** en el checkout el rótulo
 * `Cuándo te llega` arranca en **y = 595,9 dp** y el pie fijo empieza en
 * **~593 dp** ⇒ ***no es que haya que deslizar: NACE DEBAJO DEL PIE.***
 * Cuatro opciones de hasta tres líneas, apiladas, debajo de dirección,
 * quién recibe e instrucciones.
 *
 * · `apilada` (default) — la de siempre. **Ningún consumidor cambia.**
 * · `tira` — los días en una fila horizontal. Cabe en un renglón.
 *
 * ── 🔴 LA TENSIÓN, Y CÓMO SE RESUELVE SIN CAMBIAR UN DEFECTO POR OTRO ──
 * A la planteó bien: hoy **la opción llena HABLA** —su `motivo` se dibuja y
 * entra al `accessibilityLabel`— y **en una tira angosta ese motivo no
 * entra**. *Ganar visibilidad perdiendo el porqué sería cambiar un defecto
 * por otro.*
 *
 * **La salida: el motivo no se achica ni se pliega — se MUDA.** Sale del
 * chip y vive en **una línea debajo de la tira**, a ancho completo y **sin
 * truncar**. ***La Ley 23 pide que la negación DIGA POR QUÉ, no que quepa
 * adentro del chip*** — y a ancho completo dice más que hoy, donde tres
 * líneas apiladas compiten con el resto de la opción.
 *
 * **Y la línea NO depende de un toque.** Arranca mostrando el motivo del
 * PRIMER día lleno, así que **el porqué es visible sin tocar nada** —que es
 * la condición que el encabezado de esta pieza ya exigía: *un motivo detrás
 * de un tap es un motivo que nadie lee.*
 *
 * ⚠️ **Ley 23 INTACTA, y acá está el detalle fino:** en `tira` el chip lleno
 * **sí recibe el toque** (para poder contar SU motivo cuando hay más de un
 * día lleno) **pero JAMÁS llama a `onElegir`**. *El servidor sigue sin poder
 * recibir un día sin cupo — lo que cambia es que ahora se puede preguntar
 * por qué.* Si alguien cablea `onElegir` en esa rama, rompe la ley.
 *
 * ── LO QUE ESTA PIEZA SIGUE SIN HACER ──
 * **No parte el día de la ventana horaria.** La referencia medida
 * (`referencia-laika-dia-y-hora.jpeg`) usa DOS ejes —tira de días arriba,
 * rango horario como tarjeta seleccionable debajo—, y ése es el destino
 * natural. **Hoy `OpcionVentana` trae día y ventana en un solo `etiqueta`**,
 * así que partirlos exige cambiar el contrato de datos y es decisión de la
 * pantalla, no de la pieza. *Se declara en vez de inventarle al modelo una
 * separación que no tiene.*
 *
 * ⚠️ **Y la superficie es de la pantalla (N21):** este bloque tiene rótulo,
 * o sea que es un grupo, o sea que va en carta. **La pieza no dibuja su
 * carta** — igual que no dibuja su fondo en `apilada`.
 */
export type DisposicionVentana = 'apilada' | 'tira'

export type SelectorVentanaProps = {
  opciones: OpcionVentana[]
  /** `null` = todavía sin elegir. La pieza no preselecciona. */
  elegida: string | null
  onElegir: (clave: string) => void
  /** "Programar otra fecha" — abre el calendario de la pantalla. */
  onProgramarOtra?: () => void
  etiquetaProgramarOtra?: string
  /** Voz de la casa para el rótulo del grupo. */
  rotulo?: string
  /** Default `'apilada'` — ningún consumidor existente cambia. */
  disposicion?: DisposicionVentana
}

export function SelectorVentana({
  opciones,
  elegida,
  onElegir,
  onProgramarOtra,
  etiquetaProgramarOtra,
  rotulo,
  disposicion = 'apilada',
}: SelectorVentanaProps) {
  const { theme } = useTheme()
  const enTira = disposicion === 'tira'

  /** EL MOTIVO QUE SE ESTÁ CONTANDO, en `tira`. Arranca en el PRIMER día
   *  lleno para que el porqué esté a la vista **sin tocar nada**, y cambia
   *  si la persona pregunta por otro. En `apilada` no se usa: ahí cada
   *  opción lleva su motivo adentro, como siempre. */
  const primeroLleno = opciones.find((o) => o.estado === 'sin_cupo' && o.motivo !== undefined)
  const [claveMotivo, setClaveMotivo] = useState<string | null>(null)
  const motivoALaVista = enTira
    ? (opciones.find((o) => o.clave === claveMotivo) ?? primeroLleno)?.motivo
    : undefined

  const lista = opciones.map((o) => {
    const lleno = o.estado === 'sin_cupo'
    const activa = !lleno && o.clave === elegida

    return (
      <Pressable
        key={o.clave}
        /* LA LEY 23 VIVE ACÁ, y en `tira` con un matiz que hay que leer:
           · `apilada` — la opción llena NO es tocable. Como siempre.
           · `tira` — SÍ recibe el toque, **pero jamás llama a `onElegir`**:
             solo cuenta su motivo abajo. *El servidor sigue sin poder
             recibir un día sin cupo.* Sin esto, con dos días llenos no hay
             forma de preguntar por el segundo. */
        disabled={lleno && !enTira}
        onPress={() => {
          if (lleno) {
            if (enTira) setClaveMotivo(o.clave)
            return
          }
          onElegir(o.clave)
        }}
        accessibilityRole="radio"
        accessibilityState={{ checked: activa, disabled: lleno }}
        // El motivo entra al label SIEMPRE, en las dos disposiciones: quien
        // no ve la pantalla tiene que saber POR QUÉ no puede elegir ese día
        // — y en `tira` el motivo visual vive abajo, así que sin esto el
        // lector de pantalla se quedaría sin él.
        accessibilityLabel={[o.etiqueta, o.detalle, o.motivo].filter(Boolean).join('. ')}
        style={{
          gap: spacing[0.5],
          padding: spacing[3],
          borderRadius: radius.suave,
          borderWidth: theme.border.width,
          // En tira el chip no se reparte el ancho: se lo da su contenido y
          // la fila desliza. Sin el mínimo, cuatro chips se comprimen y el
          // día largo trunca — que es resolver la visibilidad rompiendo la
          // lectura.
          ...(enTira ? { minWidth: 96 } : null),
          // TONAL para la elegida (Ley 22) · contorno neutro para la
          // elegible en reposo · el lleno pierde el borde: no compite
          // por atención, pero sigue estando.
          borderColor: activa
            ? theme.accent.control
            : lleno
              ? 'transparent'
              : theme.border.default,
          // EL TINTE DE LA ELEGIDA: la receta EXACTA de `SelectorOpcion`
          // para `acento='control'` (`capaBg.comunidad`), con su MISMO guard
          // de memorial — memorial no tiene `capaBg` y degrada a superficie
          // sin tinte (Ley 8).
          backgroundColor: activa
            ? 'capaBg' in theme
              ? theme.capaBg.comunidad
              : theme.bg.overlay
            : lleno
              ? theme.bg.overlay
              : 'transparent',
        }}
      >
        <Texto variante="cuerpo" color={lleno ? 'tertiary' : undefined}>
          {o.etiqueta}
        </Texto>
        {o.detalle === undefined ? null : (
          <Texto variante="apoyo" color={lleno ? 'tertiary' : undefined}>
            {o.detalle}
          </Texto>
        )}
        {/* El porqué, a la vista. Apagado sereno, JAMÁS registro de error
            (Ley 22): un día lleno no es una falla de nadie.
            ⚠️ En `tira` NO va acá: se muda a la línea de abajo, a ancho
            completo y sin truncar (ver la nota de `DisposicionVentana`). */}
        {!enTira && lleno && o.motivo !== undefined ? (
          <Texto variante="apoyo" color="tertiary">
            {o.motivo}
          </Texto>
        ) : null}
      </Pressable>
    )
  })

  return (
    <View style={{ gap: spacing[3] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      {enTira ? (
        <View style={{ gap: spacing[2] }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityRole="radiogroup"
            contentContainerStyle={{ gap: spacing[2], paddingRight: spacing[5] }}
          >
            {lista}
          </ScrollView>
          {/* EL PORQUÉ, A ANCHO COMPLETO Y SIN TRUNCAR. Es la mitad que hace
              que la tira no pierda lo que la pila tenía: la Ley 23 pide que
              la negación DIGA, no que quepa adentro del chip. */}
          {motivoALaVista === undefined ? null : (
            <Texto variante="apoyo" color="tertiary">
              {motivoALaVista}
            </Texto>
          )}
        </View>
      ) : (
        <View accessibilityRole="radiogroup" style={{ gap: spacing[2] }}>
          {lista}
        </View>
      )}

      {onProgramarOtra === undefined || etiquetaProgramarOtra === undefined ? null : (
        <View style={{ alignSelf: 'flex-start' }}>
          {/* Comando con consecuencias → viste de botón (Ley 22c). */}
          <Boton variante="compacto" onPress={onProgramarOtra} etiqueta={etiquetaProgramarOtra} />
        </View>
      )}
    </View>
  )
}
