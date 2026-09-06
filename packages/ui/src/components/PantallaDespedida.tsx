/**
 * LA DESPEDIDA — la pantalla más delicada del producto (S113-B · 1.2).
 *
 * **En tinta. Sin color de marca, sin ilustración, sin gradiente.** *El día
 * que alguien usa esta pantalla, cualquier alegría de la marca es una falta de
 * respeto* — y el gradiente firma es literalmente la cara alegre del producto.
 *
 * ── 🔴 EL SEGUNDO TOQUE ES LA SEGURIDAD ────────────────────────────────
 * **Ningún «¿estás seguro?» con signos de admiración.** El botón dice
 * *«Despedirse»*, y al tocarlo pide un segundo toque **que nombra a la
 * mascota**. *Un cartel de alarma le grita a alguien que está de duelo; un
 * segundo toque con su nombre lo hace parar, que es lo único que hacía falta.*
 *
 * ── LA FECHA NUNCA ES FUTURA ───────────────────────────────────────────
 * Hoy por defecto, y **el guard vive acá**: una despedida con fecha futura no
 * es un dato raro, es un registro imposible que después nadie sabe corregir.
 *
 * ⚠️ **Lo que sigue es la pantalla de la mascota en modo memorial, que ya
 * existe.** Esta pieza no la monta: **termina y devuelve el control.**
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { fechaDespedidaValida } from './despedida-fecha'

export interface PantallaDespedidaProps {
  /** *«Despedirse de Thor»* — ya compuesta (Ley 3). */
  titulo: string
  /** ⚰️ **SIN CONSUMIDOR desde que el nombre se mudó ADENTRO del botón.**
   *  Su único uso era el texto suelto debajo, que el founder mandó meter en
   *  la etiqueta del segundo toque —hoy la pantalla compone `vozConfirmar`
   *  con el nombre adentro (Ley 3)—.
   *
   *  **Se conserva porque `despedida.tsx` en `main` ya la pasa**, y sacarla
   *  rompería a su pista. *La prolijidad de un contrato no vale un revert.*
   *  Muere cuando esa pantalla se toque por otra razón. */
  nombre: string
  /** `YYYY-MM-DD`. Hoy por defecto; **el guard rechaza el futuro**. */
  fecha: string
  hoy: string
  fechaTexto: string
  onCambiarFecha: () => void
  /** *«Unas palabras»* — opcional, y se dice que lo es. */
  palabras: string
  onPalabras: (t: string) => void
  campoPalabras: React.ReactNode
  /** *«Despedirse»* · *«Tocá de nuevo para despedir a Thor»*. */
  vozBoton: string
  vozConfirmar: string
  /** *«La fecha no puede ser futura»* — sólo se dibuja si pasa. */
  vozFechaFutura: string
  onDespedir: () => void
}

export function PantallaDespedida({
  titulo,
  fecha,
  hoy,
  fechaTexto,
  onCambiarFecha,
  campoPalabras,
  vozBoton,
  vozConfirmar,
  vozFechaFutura,
  onDespedir,
}: PantallaDespedidaProps) {
  const { theme } = useTheme()
  /* El segundo toque. **Estado local a propósito**: si viviera afuera, una
     pantalla que se re-monta podría llegar con la confirmación ya puesta. */
  const [confirmando, setConfirmando] = useState(false)
  const insets = useSafeAreaInsets()
  const valida = fechaDespedidaValida(fecha, hoy)

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        padding: spacing[6],
        /* 🔴 **LA ZONA SEGURA, y acá no es un detalle:** la pieza ocupa la
           pantalla entera, así que sin el inset **el título se le mete debajo
           del reloj**. *En la pantalla del peor día, lo primero que se lee no
           puede estar peleando con la barra de estado.* */
        paddingTop: spacing[6] + insets.top,
        gap: spacing[6],
      }}
    >
      {/* Sin ilustración y sin marca: ver la cabecera. */}
      <Texto variante="titulo">{titulo}</Texto>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fechaTexto}
        onPress={onCambiarFecha}
        style={{
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: spacing[4],
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.bg.border,
        }}
      >
        <Texto variante="cuerpo">{fechaTexto}</Texto>
      </Pressable>
      {valida ? null : <Texto variante="apoyo" color="danger">{vozFechaFutura}</Texto>}

      {campoPalabras}

      <View style={{ flex: 1 }} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={confirmando ? vozConfirmar : vozBoton}
        accessibilityState={{ disabled: !valida }}
        disabled={!valida}
        onPress={() => {
          /* 🔴 El segundo toque ES la seguridad — ningún cartel de alarma. */
          if (!confirmando) {
            setConfirmando(true)
            return
          }
          onDespedir()
        }}
        style={{
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          /* Tinta, jamás el acento de marca. */
          backgroundColor: valida ? theme.text.primary : theme.bg.hundido,
        }}
      >
        {/* 🔴 **BLANCO SOBRE LA TINTA, no el color por defecto.**
            ⏪ El botón se pinta con `text.primary` de fondo y la letra usaba el
            default de `Texto`, que **es ese mismo token**: tinta sobre tinta.
            *Nadie lo pidió y no salió en ninguna captura porque el botón vive
            al fondo, después del espaciador* — apareció leyendo el archivo
            para mover el nombre adentro. */}
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.base,
            color: valida ? theme.text.inverse : theme.text.tertiary,
          }}
        >
          {confirmando ? vozConfirmar : vozBoton}
        </Text>
      </Pressable>
    </View>
  )
}
