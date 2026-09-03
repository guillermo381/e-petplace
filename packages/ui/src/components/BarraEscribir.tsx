/**
 * BarraEscribir — EL CAMPO Y EL GLIFO, Y LA LÍNEA CUANDO YA NO SE ESCRIBE
 * (S112-B, B5).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL ENVIAR NO ES UN `Boton`, Y ESO ES UNA DECISIÓN, NO UN ATAJO.**
 * ═══════════════════════════════════════════════════════════════════════════
 * La letra es literal: *«no es un botón con razón: es un glifo que se
 * enciende con el texto, y tocarlo vacío no hace nada»* (§2.5).
 *
 * **Y es coherente con `D-999`, no una excepción a él.** Esa doctrina existe
 * porque *un botón apagado sin razón a la vista es el defecto*; acá **no hay
 * razón que dar**: el campo está vacío y la persona lo está mirando. Escribir
 * «Escribí algo para enviar» debajo de un campo vacío es explicarle a alguien
 * lo que acaba de hacer. *La razón se dibuja cuando el motivo NO está a la
 * vista; acá es lo único que está a la vista.*
 *
 * ── 🔴 N24 · EL CONTENEDOR NO CAMBIA DE ALTO AL ENFOCAR ─────────────────
 * El campo arranca con el alto de **una línea** y crece **por CONTENIDO**,
 * nunca por foco. *Un campo que se agranda al tocarlo mueve la conversación
 * entera hacia arriba justo cuando alguien va a leer la última respuesta*, y
 * lo hace en el momento exacto en que el teclado ya está moviendo todo.
 * Después de cinco líneas **scrollea adentro** en vez de seguir creciendo:
 * más allá de eso la barra se come el hilo.
 *
 * ── EL GLIFO DE ENVIAR ENTRA POR PROP, y es una deuda declarada ─────────
 * ⚠️ **El registry de la casa NO tiene un glifo de enviar** — medido: sus 40
 * nombres son oficios, superficies y controles, y ninguno lo dice. Y prestar
 * uno cercano es lo que esta casa prohíbe expresamente (*«un glifo con dos
 * significados es informar sin informar»*).
 *
 * ⇒ **entra por `glifoEnviar` hasta que exista**, con su condición de muerte
 * escrita: *el día que el registry gane `enviar`, esta prop se retira y la
 * pieza lo monta sola.* Autorarlo es §6b —hoja de contacto, 2-3 variantes,
 * gate POR ÍCONO— y **se declara como control** (§6b paso 6: *en un glifo de
 * control no hay mascota, hay interfaz*), no se descubre en el gate.
 *
 * ── LA VARIANTE EN LECTURA ───────────────────────────────────────────────
 * *«Si la solicitud fue declinada, desistida o terminó, la barra se reemplaza
 * por una línea EN EL MISMO LUGAR»* (§2.6). No desaparece: el lugar sigue
 * ocupado, para que la ausencia se lea como un estado y no como algo que
 * falló al cargar.
 *
 * 🔴 **Y con el animal en MEMORIAL no hay línea** — decisión ya tomada, y su
 * razón es la misma que hizo que el fallecimiento no dibuje escalera: *no se
 * le dice dos veces la misma noticia.* Acá se cumple sin una rama de tema:
 * la pantalla simplemente **no monta la pieza**, y por eso `enLectura` no
 * tiene un modo «memorial». *Un modo para «no dibujar nada» es una pieza
 * pidiendo permiso para no existir.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo en las dos apps (C5). **Entregada y no montada.**
 */
import type { ReactNode } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { opacity } from '../tokens/opacity'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'

/** §2.5, los dos números de la letra. */
const TOPE = 1000
const DESDE_QUE_SE_CUENTA = 900
/** Cinco líneas y después scrollea adentro (§2.5). */
const LINEAS_MAX = 5

type EnLectura = {
  /** «Esta conversación quedó en lectura · Declinada». Ya redactada. */
  enLectura: string
  valor?: never
  onCambio?: never
  onEnviar?: never
  placeholder?: never
  glifoEnviar?: never
  etiquetaEnviar?: never
}

type Escribiendo = {
  enLectura?: never
  valor: string
  /** Recibe el texto crudo. El corte a 1 000 lo hace la pieza. */
  onCambio: (valor: string) => void
  /**
   * Se llama con el texto **saneado**. No se llama nunca con vacío ni con
   * sólo espacios: *«un mensaje sólo de espacios no se envía»* (§2.5), y eso
   * se cumple acá y no en cada pantalla.
   */
  onEnviar: (texto: string) => void
  /** «Escribile a Refugio Aurora» — con el nombre, ya redactado. */
  placeholder: string
  /** Ver la nota de la cabecera: entra por prop hasta que el registry lo tenga. */
  glifoEnviar: ReactNode
  /** accessibilityLabel del glifo. */
  etiquetaEnviar: string
}

export type BarraEscribirProps = EnLectura | Escribiendo

export function BarraEscribir(props: BarraEscribirProps) {
  const { theme } = useTheme()

  if (props.enLectura !== undefined) {
    return (
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          backgroundColor: theme.bg.card,
          borderTopWidth: theme.border.width,
          borderTopColor: theme.border.subtle,
        }}
      >
        {/* Centrada: no es un control apagado, es un enunciado sobre el hilo. */}
        <View style={{ alignItems: 'center' }}>
          <Texto variante="apoyo" color="secondary">
            {props.enLectura}
          </Texto>
        </View>
      </View>
    )
  }

  const { valor, onCambio, onEnviar, placeholder, glifoEnviar, etiquetaEnviar } = props
  /* Lo que se envía es lo saneado. Y el guard vive acá, no en la pantalla:
     si cada consumidor decidiera qué es «vacío», bastaría uno que no recorte
     para mandar un mensaje de espacios. */
  const saneado = valor.trim()
  const hayTexto = saneado.length > 0
  const restantes = TOPE - valor.length

  const linea = Math.round(typography.size.base * typography.leading.normal)

  return (
    <View
      style={{
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: spacing[2],
        gap: spacing[1],
        backgroundColor: theme.bg.card,
        borderTopWidth: theme.border.width,
        borderTopColor: theme.border.subtle,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] }}>
        <TextInput
          value={valor}
          onChangeText={(t) => onCambio(t.slice(0, TOPE))}
          placeholder={placeholder}
          placeholderTextColor={theme.text.tertiary}
          accessibilityLabel={placeholder}
          multiline
          /* 🔴 «salto de línea», JAMÁS «enviar» (§2.5): con `enviar` en el
             teclado, un mensaje de dos párrafos se manda a la mitad. */
          returnKeyType="default"
          blurOnSubmit={false}
          maxLength={TOPE}
          style={{
            flex: 1,
            // N24: el MÍNIMO es una línea y no cambia al enfocar; el máximo
            // corta el crecimiento y a partir de ahí scrollea adentro.
            minHeight: linea + spacing[4],
            maxHeight: linea * LINEAS_MAX + spacing[4],
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: radius.lg,
            borderWidth: theme.border.width,
            borderColor: theme.border.campo,
            backgroundColor: theme.bg.base,
            color: theme.text.primary,
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            lineHeight: linea,
          }}
        />

        {/* EL GLIFO. Apagado no es «deshabilitado con razón»: es un glifo
            atenuado que no hace nada al tocarse. Sigue siendo alcanzable por
            el lector de pantalla, que anuncia su estado. */}
        <Pressable
          onPress={hayTexto ? () => onEnviar(saneado) : undefined}
          disabled={!hayTexto}
          accessibilityRole="button"
          accessibilityLabel={etiquetaEnviar}
          accessibilityState={{ disabled: !hayTexto }}
          hitSlop={8}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: hayTexto ? 1 : opacity.disabled,
          }}
        >
          {glifoEnviar}
        </Pressable>
      </View>

      {/* EL CONTADOR — recién desde 900 (§2.5). Antes de eso no existe: un
          contador permanente le pone un techo a la vista a alguien que
          todavía está lejos de él. */}
      {valor.length >= DESDE_QUE_SE_CUENTA ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Texto variante="apoyo" color="tertiary">
            {String(restantes)}
          </Texto>
        </View>
      ) : null}
    </View>
  )
}
