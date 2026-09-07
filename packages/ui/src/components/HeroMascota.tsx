/**
 * EL HERO DEL PERFIL, COMPACTO — quién es, en cuatro datos (S113-B · 2.2 · B6).
 *
 * ⏪ **Hoy esto vive suelto en la pantalla**, y por eso el tablero empieza casi
 * a media altura: retrato grande centrado, pastilla de estado colgando, nombre
 * en display y una línea de metadatos, todo apilado. *Lo que preside está
 * bien; lo que sobra es el aire con el que preside.*
 *
 * ── QUÉ COMPACTA, Y POR QUÉ ESO Y NO OTRA COSA ──────────────────────────
 * El retrato **baja a `lg`** y se corre a la izquierda; el nombre y sus datos
 * ocupan la columna de al lado. *La mascota sigue presidiendo —es lo primero
 * y lo más grande— pero deja de comerse una pantalla entera para decir cuatro
 * cosas.* La altura pasa de ~340 a ~120.
 *
 * ── 🔴 LO QUE **NO** ENTRA A ESTA PIEZA, Y ES DELIBERADO ────────────────
 * **La navegación** —volver, editar, compartir— **se queda en la pantalla.**
 * *No es identidad: es cromo de una ruta, y meterla acá ataría el hero a tener
 * una flecha atrás — o sea, a no poder usarse en ningún otro lado.*
 * Y **el retrato entra como slot**: la casa ya tiene `AvatarMascota` con su
 * escalera de fallbacks, y duplicar esa decisión acá sería tener dos.
 *
 * ── EL ESTADO ES UNA PASTILLA, Y VA EN SANS ─────────────────────────────
 * *«Cuidado al día» es un estado, no un código*, y el mono de la casa está
 * reservado a lo que se copia o se verifica: fechas, ids, folios. Sale de la
 * pasada sobre el perfil real (⑪).
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3)**: `meta` llega hecha —*«Bulldog inglés · 6 años ·
 * 24 kg»*— porque unir esos tres con puntos medios es una decisión de idioma.
 * **No decide el fondo**: el gradiente lo pone la pantalla, que es la que sabe
 * si hay techo.
 *
 * ── ⛔ MEMORIAL ─────────────────────────────────────────────────────────
 * **El hero SÍ se dibuja** —*es quién fue, y eso no se apaga*— y lo que
 * desaparece es la **pastilla de estado**: no hay un cuidado al día que
 * reportar, y decirlo sería hablar de una rutina que terminó.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El perfil (C). **Entregada y no montada** — medido.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export interface HeroMascotaProps {
  /**
   * El retrato. **La pieza no lo dibuja ni le nombra un tamaño**: recibe el
   * `AvatarMascota` de la casa, normalmente en `lg`.
   *
   * ⏪ Acá hubo un `RETRATO = 88` exportado, y era un número inventado:
   * `AvatarMascota` tiene su escala por nombres (`md` 64, `lg` 96) y 88 no
   * existe en ella. *Una pieza que nombra un tamaño propio crea una segunda
   * escala que compite con la de la casa, y el día que la escala se mueva ésta
   * se queda quieta.* El slot no necesitaba saberlo.
   */
  retrato: ReactNode
  /** El nombre, tal cual. **Se dibuja, no se concatena.** */
  nombre: string
  /** *«Bulldog inglés · 6 años · 24 kg»* — ya compuesta (Ley 3). */
  meta: string
  /** *«Cuidado al día»* — la pastilla. **Ausente = no hay nada que decir**, y
   *  entonces no se dibuja: *una pastilla vacía ocupa lugar para no informar.*
   *  ⛔ En memorial no se dibuja aunque venga. */
  estado?: string
  /** `true` cuando el estado es de atención (algo vence, algo falta). Decide
   *  el TINTE de la pastilla, nunca un relleno de alarma (`R20`). */
  atencion?: boolean
}

export function HeroMascota({ retrato, nombre, meta, estado, atencion = false }: HeroMascotaProps) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
      {retrato}
      <View style={{ flex: 1, gap: spacing[1] }}>
        <Texto variante="titulo">{nombre}</Texto>
        {/* 🔴 En SANS, no en mono: son datos de identidad que se leen como
            prosa. El mono es de lo que se copia o se verifica. */}
        <Texto variante="apoyo">{meta}</Texto>
        {estado !== undefined && !esMemorial ? (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
              borderRadius: radius.full,
              /* Tinte, jamás relleno: *un estado que grita compite con el CTA
                 y le enseña a la familia a ignorar el color* (`R20`). */
              backgroundColor: theme.bg.card,
              borderWidth: theme.border.width,
              borderColor: atencion ? theme.status.warningText : theme.border.subtle,
            }}
          >
            <Texto variante="apoyo" color={atencion ? 'warning' : 'success'}>
              {estado}
            </Texto>
          </View>
        ) : null}
      </View>
    </View>
  )
}
