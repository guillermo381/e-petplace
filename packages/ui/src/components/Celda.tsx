/**
 * Celda — la fila de lista del sistema (S43-B3.4): citas de agenda,
 * mascotas, clientes, resultados.
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA DE PRESSED EN FILAS: una fila NO escala — resalta fondo
 * (bg.overlay, transición fast). Una fila que escala dentro de una
 * lista se ve rota; el scale es de botones y cards sueltas.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía en tres zonas: inicio? (slot) · contenido (titulo/subtitulo
 * como STRINGS — la celda protege su jerarquía tipográfica, no acepta
 * children libres) · fin? (slot) XOR metadataMono? (string con la regla
 * de voz CABLEADA: JetBrains Mono, minúsculas forzadas, tracking suave).
 *
 * Sin margin propio, sin divisor propio: el divisor es <Separador />
 * (pensado para ItemSeparatorComponent de FlatList).
 *
 * ENTRAR A UNA SECCIÓN no es este trabajo (Ley 19.1, S58): eso es
 * CeldaNavegacion — ícono b′ tipado + chevron + pressed 0.99.
 *
 * ── EL TÍTULO Y SU LÍNEA (S99-B) ────────────────────────────────────
 * El título nació a UNA línea y sin perilla, y estuvo bien mientras la
 * casa listaba cosas cuyo nombre era una ETIQUETA. **La vitrina cambió
 * eso:** ahí el nombre del producto ES el criterio de elección, y un
 * nombre cortado no es un detalle de layout — es la fila escondiendo
 * justo el dato por el que alguien elige.
 *
 * ⇒ `tituloEntero` (opt-in, ley completa en su prop). **Opt-in porque
 * el default sirve a 161 usos vivos:** ensanchar por default sería
 * cambiar 161 filas para curar cuatro. *La perilla no está para que
 * cada pantalla elija cómo se ve una fila: está para que diga qué es
 * su título.*
 */

import { useState, type ReactNode } from 'react'
import { Pressable, Text, View, type AccessibilityRole } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

export type CeldaDensidad = 'normal' | 'compacta'

const ALTURA_MIN: Record<CeldaDensidad, number> = {
  normal: 56,    // dos líneas cómodas
  compacta: 48,
}

// S44-B4.1 (enmienda de arquitecto): metadataMono y fin CONVIVEN —
// apilados en la zona fin (mono arriba, nodo abajo, alineados al borde).
// El caso real: hora de la cita + Insignia de estado en la agenda.
type ZonaFin = { fin?: ReactNode; metadataMono?: string }

type Comun = ZonaFin & {
  titulo: string
  subtitulo?: string
  inicio?: ReactNode
  densidad?: CeldaDensidad
  /** EL TÍTULO SE LEE ENTERO (S99-B · pedido de C con medición).
   *
   *  🔴 SU LEY, y es un criterio, no un gusto: **se enciende donde el
   *  título ES el criterio de elección** —el nombre de un producto en una
   *  vitrina— y **jamás por prolijidad**. En una fila de navegación
   *  («Preferencias») el título es una ETIQUETA y una línea es lo
   *  correcto: ahí no hay nada que decidir.
   *
   *  **Opt-in, y por eso el default no se toca:** 161 usos de `Celda`
   *  viven de una sola línea. *Ensanchar por default sería cambiar 161
   *  filas para curar cuatro.*
   *
   *  ⚠️ **NO tiene techo de líneas, a propósito.** La adjudicación dice
   *  *«no se trunca»*, y truncar en dos sería la misma falta con otro
   *  número. La fila CRECE — `ALTURA_MIN` siempre fue un mínimo. *Entre
   *  un defecto visible (una fila alta con un nombre absurdo) y uno
   *  silencioso (un nombre cortado que nadie sabe que estaba cortado),
   *  esta casa elige el visible: el silencioso no se descubre nunca.* */
  tituloEntero?: boolean
}

export type CeldaProps =
  | (Comun & { interactiva?: false; onPress?: never; accessibilityRole?: never })
  | (Comun & { interactiva: true; onPress: () => void; accessibilityRole: AccessibilityRole })

export function Celda(props: CeldaProps) {
  const { titulo, subtitulo, inicio, densidad = 'normal', tituloEntero = false } = props
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)

  const metadataMono = 'metadataMono' in props ? props.metadataMono : undefined
  const fin = 'fin' in props ? props.fin : undefined

  const cuerpo = (
    <>
      {inicio ? <View>{inicio}</View> : null}

      {/* 🔴 EL SUJETO NO CEDE — cura de S97+-B. Cuatro vueltas, y el
          comentario se reescribe entero porque quedó contradiciéndose a
          sí mismo: un comentario que discute con su propio código es el
          defecto que esta tanda vino a cazar.

          EL DEFECTO ORIGINAL (D, en dispositivo): el nombre de la mascota
          truncaba a **`Z…`** —UNA letra— en el HOY del prestador.

          EL REPARTO, medido: este bloque tenía `flex: 1` = `flexBasis: 0`
          —no reclama ancho propio, toma lo que sobra— y el bloque derecho
          no tenía `flexShrink`, así que su ancho era intrínseco y **no
          cedía jamás**. El sujeto pagaba toda la compresión.

          ⚠️ ATRIBUCIÓN: la escala de N1 (13→14, 15→16) lo **agravó**, no
          lo causó. Pasar de «Zeus» a «Z» es perder el 75%; un ~7% de
          crecimiento no produce eso. **El defecto vive acá desde S43.**

          LA ARITMÉTICA QUE ORDENA TODO, y que solo apareció al leer el
          árbol completo (orden de la mesa tras cuatro parches):
              avatar + gaps + padding ....  ~92 px
              este bloque (piso) .........   96 px
              la derecha (glifo + 2 chips)  ~160 px  ← NO comprimible
              ───────────────────────────────────────
              pedido ~348 · disponible ~340 (412 − hora 46 − gaps)

          **No caben, y ningún elemento es comprimible de verdad**: una
          `Insignia` con texto adentro tiene ancho intrínseco. Por eso
          cada ajuste movía el defecto de lugar en vez de cerrarlo —
          truncado → solapamiento → corte mudo → colisión.

          EL PISO SON 96 y se calibró TRES VECES, la última **bajándolo**:
          subió a 128 para que entrara «Vacunación» y eso empujó 32 px más
          contra una derecha que no puede ceder. *El piso de una columna
          lo fija el renglón más exigente — pero si el total no entra,
          subirlo solo cambia quién se rompe.* Con 96 el título entra
          holgado (~9-10 caracteres: Thor, Zeus, Aurora) y el subtítulo
          **elide con su elipsis**, que es su lugar en la ley.

          LAS TRES PIEZAS VIVAS, y por qué cada una:
          · `minWidth: 96` acá — el título tiene piso.
          · `minWidth: 0` en la derecha — sin eso su `flexShrink` es
            DECORATIVO (el default de un ítem flex es `min-width: auto`,
            que le prohíbe encoger por debajo de su contenido).
          · ☠️ el `overflow: 'hidden'` **ya no existe en ninguno de los
            dos bloques** (retirado el 14-ago, adjudicación de mesa). Su
            lápida y las dos declaraciones que viajan con el retiro están
            abajo, en el sitio donde vivía.

          🔴 LO QUE ESTO **NO** RESUELVE, elevado a la mesa: la fila lleva
          más contenido del que entra. Es decisión de ANATOMÍA —que los
          chips bajen a su propia línea— y no otro ajuste de flexbox. */}
      <View style={{ flex: 1, minWidth: 96, gap: spacing[0.5] }}>
        <Text
          // `undefined` = sin límite (ver `tituloEntero`). El
          // `ellipsizeMode` viaja con él: sin corte no hay puntos que
          // poner, y dejarlo sería una promesa de recorte que no ocurre.
          numberOfLines={tituloEntero ? undefined : 1}
          ellipsizeMode={tituloEntero ? undefined : 'tail'}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.base,
            color: theme.text.primary,
            // El interlineado SOLO cuando puede haber dos líneas: con una
            // sola, fijarlo movería el centrado de las 161 filas vivas.
            ...(tituloEntero
              ? { lineHeight: typography.size.base * typography.leading.snug }
              : null),
          }}
        >
          {titulo}
        </Text>
        {subtitulo ? (
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: typography.size.sm * typography.leading.snug,
              color: theme.text.secondary,
            }}
          >
            {subtitulo}
          </Text>
        ) : null}
      </View>

      {metadataMono || fin ? (
        // LA OTRA MITAD DEL REPARTO (el porqué completo, arriba): este
        // bloque CEDE.
        //
        // ⚠️ `minWidth: 0` NO ES ADORNO — es lo que hace que el
        // `flexShrink` de al lado EXISTA. El default de un ítem flex es
        // `min-width: auto`, que le prohíbe encoger por debajo de su
        // contenido: con eso puesto, `flexShrink: 1` es una declaración
        // que no encoge nada. Fue el defecto de la primera vuelta, y es
        // la clase de error que ningún gate ve — el atributo está
        // escrito, el typecheck lo acepta, y no mueve un píxel.
        //
        // ☠️ ACÁ VIVIÓ UN `overflow: 'hidden'` Y SE RETIRÓ — adjudicación
        // de mesa del 14-ago, con su condición de muerte CUMPLIDA y
        // medida por D: el guard de geometría pasó de mirar DOS filas a
        // **28/59 en el HOY · 23/50 en la otra cuenta · 5/10 en
        // `veterinaria/consulta`**, con las 3 anatomías del censo
        // cubiertas y discovery estructural (la fila ya no se descubre
        // por `role="button"`: es «el elemento más chico que contiene N
        // textos» — una fila cargada no es una fila tocable).
        //
        // LA DOCTRINA QUE LO ORDENA: *preferimos un defecto que el guard
        // NOMBRA a uno que un recorte ESCONDE.* Y no es teoría — este
        // mismo `overflow` tapó la colisión durante tres vueltas: se veía
        // un corte y nadie podía saber que dos columnas se superponían.
        //
        // ⚠️ LAS DOS DECLARACIONES QUE VIAJAN CON EL RETIRO:
        //  · **la evidencia es de RN-web, no de dispositivo** (L-153). El
        //    gate del founder decide si Android reparte igual.
        //  · el **peor caso de `veterinaria/consulta` sigue sin verificar
        //    CARGADO**: rindió 2 pisos, o sea que la variante de dos chips
        //    no se dibujó en el estado que se pudo montar. Es un dato
        //    sobre qué cubre el verde, no un pendiente de nadie.
        //
        // ↩️ SI ANDROID REPARTE DISTINTO, el `overflow` vuelve **como
        // vendaje explícito y fechado, jamás como default** — con su
        // ficha, no metido de nuevo al pasar.
        <View style={{ alignItems: 'flex-end', gap: spacing[1], flexShrink: 1, minWidth: 0 }}>
          {metadataMono ? (
            // Regla de voz cableada: mono, MINÚSCULAS forzadas, tracking suave
            <Text
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.sm,
                letterSpacing: typography.tracking.mono,
                color: theme.text.secondary,
              }}
            >
              {metadataMono.toLowerCase()}
            </Text>
          ) : null}
          {fin ? <View>{fin}</View> : null}
        </View>
      ) : null}
    </>
  )

  const layout = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
    minHeight: ALTURA_MIN[densidad],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  }

  if (!props.interactiva) {
    return <View style={layout}>{cuerpo}</View>
  }

  // label compuesto: titulo, subtitulo y metadata en orden natural de lectura
  const etiqueta = [titulo, subtitulo, metadataMono?.toLowerCase()].filter(Boolean).join(', ')

  return (
    <Pressable
      onPress={props.onPress}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole={props.accessibilityRole}
      accessibilityLabel={etiqueta}
    >
      <Animated.View
        style={[
          layout,
          {
            backgroundColor: presionada ? theme.bg.overlay : 'transparent',
            transitionProperty: 'backgroundColor',
            transitionDuration: motion.duration.fast,
            transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
          },
        ]}
      >
        {cuerpo}
      </Animated.View>
    </Pressable>
  )
}
