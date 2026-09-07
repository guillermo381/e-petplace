/**
 * CabeceraCaso — DE QUÉ SERVICIO HABLAMOS Y CON QUIÉN (S114-B, B2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Arriba veo en qué paso estoy y de qué servicio hablamos.»*
 * — `DIRECCION_POSTVENTA` §3, y su §3.2 dice la anatomía: **el objeto** con su
 * foto chica, su nombre y su fecha, y **la contraparte** con su cara y su
 * nombre. Toco el objeto y voy a su detalle; toco al prestador y voy a su
 * vitrina.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 EL MONTO ES INEXPRESABLE, Y ÉSA ES LA PIEZA ───────────────────────
 * §3.2, literal: ***«la cabecera nunca dice el monto: la plata se habla en su
 * carta, no en el título»*.** Acá eso **no es una recomendación que alguien
 * tenga que recordar: no hay por dónde.** No existe prop de monto, **y no
 * existe ningún slot `ReactNode`** — que es la puerta por la que el monto
 * habría entrado igual.
 *
 * ⚠️ **Por eso esta cabecera NO copió el `acciones` de `CabeceraHilo`**, que
 * sí lo tiene. La letra de la postventa no le pide acciones a la cabecera —
 * *«¿preferís que te atienda una persona?»* (§3.4) vive **al pie** y en todas
 * las pantallas del caso, no acá— y un slot abierto habría dejado la promesa
 * de §3.2 dependiendo de que nadie lo llenara mal. *Un slot es una escotilla:
 * la ley que se puede saltear por un slot no está puesta.* Su guard es `R73`,
 * probado en rojo antes de cablearse.
 *
 * ── LA FILA ES LA MISMA QUE LA DE ADOPCIÓN, Y NO ES CASUALIDAD ───────────
 * `FilaDeCabecera` sale de `CabeceraHilo` en esta misma tanda: cara + nombre
 * + chevron-si-lleva, con la presión y el chevron existiendo **sólo si la
 * fila lleva a algún lado**. *El caso no aprende una gramática nueva; usa la
 * que el hilo de adopción ya enseñó.*
 *
 * ── LOS DOS TOQUES SON OPCIONALES Y POR SEPARADO ─────────────────────────
 * El objeto lleva a su detalle; la contraparte, a su vitrina. **Cada uno con
 * su `onPress` propio**, porque no siempre existen los dos: desde el asiento
 * del prestador la contraparte es una FAMILIA, y una familia no tiene
 * vitrina. *La pieza no inventa un destino para que la fila se vea igual.*
 *
 * ── LA FOTO ES CHICA A PROPÓSITO ─────────────────────────────────────────
 * §3.2 dice «foto chica». Acá no se presenta a la mascota —eso es su ficha—
 * se la NOMBRA, igual que en `CabeceraHilo`. Por eso `tamano="sm"` y no un
 * hero: una cara grande en la cabecera de un reclamo convierte el sujeto de
 * la pantalla en el animal, y el sujeto es el servicio.
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15) ─────────────────────────────────
 * Cero movimiento: no hay nada que reducir. Superficie y bordes salen del
 * tema, así que memorial degrada solo.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La pantalla del caso, en las dos apps. **Entregada y no montada.**
 */
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota } from './AvatarMascota'
import { FilaDeCabecera } from './fila-de-cabecera'
import { LogoNegocio } from './LogoNegocio'

export type CabeceraCasoProps = {
  /** EL OBJETO del caso: la cita, la estadía o el pedido (§1). */
  objeto: {
    /** «Paseo de Thor». Voz de la casa que lo monta (Ley 3). */
    nombre: string
    /**
     * «martes 9, 16:00» — ya redactada por el riel de fechas, en voz de
     * máquina. La pieza NO formatea horas.
     */
    fecha: string
    /** La foto chica. Es la de la mascota; sin ella, su huella digna. */
    fotoUrl?: string | null
    /** El avatar de la casa por raza o especie, ya resuelto. */
    fotoDeEspecie?: string | null
    /** Lleva a su detalle. Ausente = no se hunde ni dibuja chevron. */
    onPress?: () => void
  }
  /**
   * LA CONTRAPARTE — el prestador, o la familia si soy el prestador.
   * `LogoNegocio` y no `AvatarMascota`: del otro lado hay una organización o
   * una persona, nunca un animal, y su fallback honesto es el monograma.
   */
  contraparte: {
    nombre: string
    fotoUrl?: string | null
    /** Lleva a su vitrina. **Ausente cuando no la tiene** (una familia). */
    onPress?: () => void
  }
}

const CARA_CONTRAPARTE = 28

export function CabeceraCaso({ objeto, contraparte }: CabeceraCasoProps) {
  const { theme } = useTheme()

  return (
    <View
      style={{
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        gap: spacing[2],
        backgroundColor: theme.bg.card,
        borderBottomWidth: theme.border.width,
        borderBottomColor: theme.border.subtle,
      }}
    >
      {/* EL OBJETO PRESIDE: es de lo que hablamos. Su fecha va en la segunda
          línea y en voz de máquina — no pegada al nombre con un separador,
          que obligaría a la pantalla a elegir el punto medio y borraría el
          registro tipográfico que la Ley 3 pide. */}
      <FilaDeCabecera
        cara={
          <AvatarMascota
            nombre={objeto.nombre}
            fotoUrl={objeto.fotoUrl ?? undefined}
            fotoDeEspecie={objeto.fotoDeEspecie ?? undefined}
            tamano="sm"
          />
        }
        nombre={objeto.nombre}
        detalle={objeto.fecha}
        onPress={objeto.onPress}
        jerarquia="preside"
      />

      <FilaDeCabecera
        cara={
          <LogoNegocio
            nombre={contraparte.nombre}
            logoUrl={contraparte.fotoUrl}
            tamano={CARA_CONTRAPARTE}
          />
        }
        nombre={contraparte.nombre}
        onPress={contraparte.onPress}
        jerarquia="apoyo"
      />
    </View>
  )
}
