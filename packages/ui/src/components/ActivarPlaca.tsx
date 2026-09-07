/**
 * ACTIVAR LA PLACA — apuntar el QR y que quede de alguien (S113-B · fase 3 · B5).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **TRES ESTADOS, Y SÓLO EL ÚLTIMO ES UN ERROR.**
 * ═══════════════════════════════════════════════════════════════════════════
 * · **activada para {{mascota}}** — salió bien.
 * · **ya estaba activada** — *NO es un error, y tratarlo como tal es el
 *   defecto*: la placa funciona, está puesta, y lo único que pasa es que la
 *   persona ya hizo esto. Una pantalla roja acá le dice que rompió algo.
 * · **no es una placa de e-PetPlace** — el único error de verdad, y es de
 *   objeto: *ese código no es nuestro y no hay nada que activar.*
 *
 * ── 🔴 «YA ESTABA ACTIVADA» SE AVISA **ANTES** DE INTENTAR ──────────────
 * `estado_de_placa` existe (A), así que la pantalla lo consulta al leer el
 * código y **avisa antes de escribir**. *Avisar después de intentar convierte
 * un dato que ya teníamos en un rebote — y un rebote se lee como un fallo
 * nuestro aunque diga lo contrario.* La pieza lo hace exigible: el estado
 * `yaEstaba` **no tiene un acto** que reintente.
 *
 * ── 🔴 UN CÓDIGO SIN ACTIVAR NO DICE NADA DE NADIE ─────────────────────
 * Ley de la fase. Por eso acá **no entra ningún dato de mascota** salvo en el
 * estado `activada`, que es el único momento en que la placa YA es de alguien.
 * *Mostrar «esta placa sería de Thor» antes de activarla sería contarle a
 * quien tiene el código algo que todavía no le corresponde.*
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No abre la cámara**: recibe el visor como slot —*la casa ya tiene su
 * cámara y duplicarla acá sería tener dos permisos y dos bugs*— · **no llama
 * a `activar_placa`** · **no compone voz (Ley 3)**.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El pasaporte de la mascota y el deep link de una placa sin activar (C).
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Boton } from './Boton'
import { Icono } from './Icono'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * 🔴 **UNA UNIÓN, no un objeto con banderas.** Con `exito?`, `yaEstaba?` y
 * `error?` se puede escribir «salió bien y además ya estaba», y ahí alguien
 * decide cuál gana — decisión que nadie firmó.
 */
export type EstadoPlaca =
  /** El visor, esperando. */
  | { fase: 'apuntando' }
  /**
   * ✅ Quedó de {{mascota}}. **Es el único estado con un nombre adentro** — ver
   * la cabecera: antes de activar, un código no dice nada de nadie.
   */
  | { fase: 'activada'; voz: string; onSeguir: () => void; vozSeguir: string }
  /**
   * 🟡 **No es un error.** La placa funciona; la persona ya hizo esto.
   * **No lleva un acto de reintento**, a propósito: no hay nada que reintentar.
   */
  | { fase: 'yaEstaba'; voz: string; onVerPlaca?: () => void; vozVerPlaca?: string }
  /** 🔴 El único error, y es de objeto: ese código no es nuestro. */
  | { fase: 'ajena'; voz: string; onReintentar: () => void; vozReintentar: string }

export interface ActivarPlacaProps {
  /** El visor de la cámara. **Slot**: la pieza no abre la cámara. */
  visor: ReactNode
  /** *«Apuntá al código de la placa»* — ya redactada. */
  vozApuntando: string
  estado: EstadoPlaca
}

export function ActivarPlaca({ visor, vozApuntando, estado }: ActivarPlacaProps) {
  const { theme } = useTheme()

  return (
    <View style={{ flex: 1, gap: spacing[4] }}>
      {/* El visor sigue vivo mientras se apunta; con un resultado ya no hace
          falta y estorbaría — *una cámara encendida detrás de un mensaje
          invita a volver a apuntar cuando ya no hay nada que apuntar.* */}
      {estado.fase === 'apuntando' ? (
        <>
          <View style={{ flex: 1, borderRadius: radius.lg, overflow: 'hidden' }}>{visor}</View>
          <Texto variante="apoyo" centrado>{vozApuntando}</Texto>
        </>
      ) : (
        <View
          style={{
            gap: spacing[4],
            padding: spacing[5],
            borderRadius: radius.lg,
            backgroundColor: theme.bg.card,
            alignItems: 'center',
          }}
        >
          {/* 🔴 **EL GLIFO DICE DE QUÉ CLASE ES, y «ya estaba» LLEVA EL CHECK.**
              No es un consuelo: *la placa está activa, que es exactamente lo que
              el check significa* — y el error se reserva al único caso que lo es.

              ⏪ Acá había `pasaporte`, y el emulador lo rechazó: **a 44 px, solo
              y sin etiqueta, son dos cuadraditos que no dicen nada.** Es
              literalmente la condición de uso que su propia firma dejó escrita
              —*no se puede montar solo*— y **la atravesé yo mismo sin querer**,
              con un ternario que mi guard no veía. */}
          <Icono
            nombre={estado.fase === 'ajena' ? 'info' : 'checkEnCirculo'}
            tamano={44}
            registro="tinta"
            montaje="control"
          />
          <Texto centrado>{estado.voz}</Texto>
          {estado.fase === 'activada' ? (
            <Boton variante="primario" etiqueta={estado.vozSeguir} onPress={estado.onSeguir} />
          ) : estado.fase === 'ajena' ? (
            <Boton variante="secundario" etiqueta={estado.vozReintentar} onPress={estado.onReintentar} />
          ) : estado.onVerPlaca !== undefined && estado.vozVerPlaca !== undefined ? (
            /* 🟡 Una salida OPCIONAL y jamás un reintento: no hay nada que
               reintentar. Si no hay a dónde ir, no se dibuja un botón. */
            <Boton variante="secundario" etiqueta={estado.vozVerPlaca} onPress={estado.onVerPlaca} />
          ) : null}
        </View>
      )}
    </View>
  )
}
