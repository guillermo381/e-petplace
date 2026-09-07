/**
 * FRANJA DE SEGURIDAD — lo que hay que saber antes de tocar al animal.
 *
 * Preside el perfil, arriba del HOY. **Sólo se dibuja si hay algo**, y cuando
 * dice algo **lo dice con nombre**: *«Alérgico al pollo · Toma omeprazol hasta
 * el 20 · Sin baños con agua fría (dermatitis)»*.
 *
 * 🔴 **JAMÁS «tiene alergias».** *No le sirve a nadie: el que va a bañarlo
 * necesita saber a QUÉ.* Un rótulo de categoría obliga a abrir para enterarse,
 * y el que abre es el que ya se tomó el trabajo — el peligro es para el que no.
 *
 * ── FRANJA FINA, NO CARTEL ROJO ────────────────────────────────────────
 * El ocre de atención de la casa, en una línea. *Un cartel rojo permanente
 * sobre el perfil de un animal que simplemente es alérgico al pollo convierte
 * su ficha en una alarma, y una alarma que está siempre deja de leerse.*
 *
 * ── LA PROCEDENCIA SE VE AL ABRIR ──────────────────────────────────────
 * Cada línea dice de dónde salió: *lo dijo la familia* / *lo registró la
 * clínica X*. **No es un detalle legal: es lo que le permite al vet decidir
 * cuánto pesa el dato.**
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Icono, type IconoNombre } from './Icono'
import { Chevron } from './chevron'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { haySeguridad, ordenarSeguridad, type ClaseSeguridad, type ItemSeguridad } from './perfil-seguridad'

/** Un glifo por clase. `Record` completo: **una clase nueva no entra sin que
 *  alguien decida su dibujo.** */
const GLIFO: Record<ClaseSeguridad, IconoNombre> = {
  alergia: 'info',
  medicacion: 'receta',
  condicion: 'caso',
  restriccion: 'grooming',
}

export interface FranjaSeguridadProps {
  items: readonly ItemSeguridad[]
  /** El resumen de una o dos líneas, ya compuesto por la pantalla (Ley 3):
   *  *«Alérgico al pollo · Toma omeprazol hasta el 20»*. */
  resumen: string
  /** *«Ver los 3»* / *«Ocultar»* — la pantalla pone su i18n. */
  vozAbrir: string
  vozCerrar: string
}

export function FranjaSeguridad({ items, resumen, vozAbrir, vozCerrar }: FranjaSeguridadProps) {
  const { theme } = useTheme()
  const [abierta, setAbierta] = useState(false)

  /* 🔴 Sin nada que decir, la franja NO EXISTE (ver `haySeguridad`). */
  if (!haySeguridad(items)) return null

  const orden = ordenarSeguridad(items)

  return (
    <View
      style={{
        borderRadius: radius.md,
        /* Franja FINA: la marca es el filete de la izquierda, no un relleno. */
        borderLeftWidth: 3,
        borderLeftColor: theme.status.warningText,
        /* 🔴 `bg.warm` viene EN PAR con `text.warm`, y la pieza usa el par
           ENTERO. ⏪ Pintaba este fondo y escribía con la tinta default: en
           memorial el papel es cálido CLARO y la tinta del tema es CLARA, y el
           resumen quedaba en **1.25:1** —medido en el emulador, no estimado—
           mientras en claro daba 15.66:1. *Ningún typecheck ve medio par, y en
           dos de los tres temas se ve perfecto.* (S113-B · 2.2 · B6.) */
        backgroundColor: theme.bg.warm,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        gap: spacing[2],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={resumen}
        onPress={() => setAbierta((v) => !v)}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        {/* 🔴 **UNA SOLA FILA, y el «ver N» a la derecha con su chevron.**
            ⏪ Antes eran DOS líneas de resumen y el «ver N» en un renglón
            aparte: la franja ocupaba cuatro líneas para decir una cosa, y en
            el perfil real quedaba entre la identidad y el pasaporte pesando
            como una sección.

            ⚠️ **Acá el truncado a UNA línea SÍ va, y es lo contrario de lo que
            rige en el «Contanos».** La diferencia no es de gusto: *este texto
            es un RESUMEN y su contenido completo está a un toque, en el mismo
            lugar; aquél era una invitación cuyo verbo se comía el corte y no
            había otra forma de leerlo.* Un resumen cortado sigue resumiendo. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Icono nombre={GLIFO[orden[0].clase]} tamano={18} tinta={theme.text.warm} montaje="control" />
          <View style={{ flex: 1 }}>
            <Texto variante="cuerpo" color="warm" numberOfLines={abierta ? undefined : 1}>
              {resumen}
            </Texto>
          </View>
          <Texto variante="apoyo" color="warm">{abierta ? vozCerrar : vozAbrir}</Texto>
          <Chevron color={theme.text.warm} direccion={abierta ? 'arriba' : 'abajo'} />
        </View>
      </Pressable>

      {abierta ? (
        <View style={{ gap: spacing[3] }}>
          {orden.map((i) => (
            <View key={i.id} style={{ flexDirection: 'row', gap: spacing[2] }}>
              <Icono nombre={GLIFO[i.clase]} tamano={18} tinta={theme.text.warm} montaje="control" />
              <View style={{ flex: 1, gap: spacing[0.5] }}>
                <Texto variante="cuerpo" color="warm">{i.texto}</Texto>
                {/* La procedencia: **lo que le permite al vet decidir cuánto
                    pesa el dato.** */}
                <Texto variante="apoyo" color="warm">{i.vozProcedencia}</Texto>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
