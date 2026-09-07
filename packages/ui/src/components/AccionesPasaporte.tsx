/**
 * ACCIONES DEL PASAPORTE — lo que se puede hacer con él (S113-B · 1.3 · B2).
 *
 * ── 🔴 «GRABAR TAG NFC» NO SE DIBUJA SI LA CAPACIDAD NO EXISTE ─────────
 * No apagado: **ausente**. *Un botón apagado sin razón a la vista es el
 * defecto, y acá la razón —«tu teléfono no tiene NFC»— no le sirve a nadie:
 * no es algo que la persona pueda resolver.* Ofrecerlo y negarlo es peor que
 * no ofrecerlo. La capacidad la mide la pantalla y llega como `puedeNfc`.
 *
 * ── 🔴 «SE PERDIÓ» ES UN INTERRUPTOR CON DOS TOQUES ────────────────────
 * Marcar a una mascota como perdida **publica su cara y su teléfono en una
 * página abierta**. El segundo toque no es fricción: es el único momento en
 * que alguien puede darse cuenta de que tocó por error. Y **el segundo toque
 * nombra a la mascota** — es lo que hace parar.
 *
 * ⚠️ Desmarcarla NO pide confirmación: *volver a privado no expone nada, y
 * pedir permiso para dejar de exponer es cobrarle a la persona por corregir.*
 */

import { useState } from 'react'
import { View } from 'react-native'

import { Boton } from './Boton'
import { spacing } from '../tokens/spacing'

export interface AccionesPasaporteProps {
  vozCompartir: string
  onCompartir: () => void
  vozDescargarQr: string
  onDescargarQr: () => void
  /** 🔴 **La capacidad la mide la pantalla.** Sin ella el botón NO EXISTE —
   *  ver la cabecera. */
  puedeNfc?: boolean
  vozGrabarNfc?: string
  onGrabarNfc?: () => void
  /** ¿Está marcada como perdida hoy? */
  perdida: boolean
  /** *«Se perdió»* / *«Volvió a casa»* — la pantalla elige según el estado. */
  vozPerdida: string
  /** 🔴 *«Sí, publicar el pasaporte de Thor»* — **con el nombre adentro**: es
   *  lo que hace parar a alguien que tocó de más. */
  vozConfirmarPerdida: string
  onCambiarPerdida: (perdida: boolean) => void
}

export function AccionesPasaporte({
  vozCompartir,
  onCompartir,
  vozDescargarQr,
  onDescargarQr,
  puedeNfc = false,
  vozGrabarNfc,
  onGrabarNfc,
  perdida,
  vozPerdida,
  vozConfirmarPerdida,
  onCambiarPerdida,
}: AccionesPasaporteProps) {
  const [confirmando, setConfirmando] = useState(false)

  return (
    <View style={{ gap: spacing[3] }}>
      <Boton etiqueta={vozCompartir} onPress={onCompartir} />
      <Boton etiqueta={vozDescargarQr} variante="secundario" onPress={onDescargarQr} />

      {/* 🔴 Ausente, no apagado: ver la cabecera. */}
      {puedeNfc && vozGrabarNfc !== undefined && onGrabarNfc !== undefined ? (
        <Boton etiqueta={vozGrabarNfc} variante="secundario" onPress={onGrabarNfc} />
      ) : null}

      {/* 🔴 Publicar expone; despublicar no. Por eso sólo un sentido confirma. */}
      <Boton
        etiqueta={confirmando ? vozConfirmarPerdida : vozPerdida}
        variante={perdida ? 'secundario' : 'destructivo'}
        onPress={() => {
          if (perdida) {
            onCambiarPerdida(false)
            return
          }
          if (!confirmando) {
            setConfirmando(true)
            return
          }
          setConfirmando(false)
          onCambiarPerdida(true)
        }}
      />
      {/* ⏪ Acá iba el texto de confirmar SUELTO debajo del botón, y sobra por
          dos razones: **ya está adentro del botón** —el founder corrigió eso
          mismo en `PantallaDespedida` este turno— y un cartel al lado del
          segundo toque le agrega alarma a un gesto que ya se explica solo. */}
    </View>
  )
}
