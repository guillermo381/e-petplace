/**
 * FICHA DE RAZA — la historia y las características, plegadas (S113-B · 1.2).
 *
 * 🔴 **SIN CONTENIDO REVISADO, LA TARJETA NO EXISTE.** No hay versión
 * degradada, ni «pronto», ni un párrafo genérico de la especie. *Una ficha de
 * raza sin revisar es contenido de salud sin revisar, y el dueño no tiene cómo
 * distinguirlo del que sí lo está.*
 *
 * ── LA LÍNEA DEL PIE NO ES LEGALESA, ES LA CONDICIÓN ────────────────────
 * *«Contenido revisado por e-PetPlace · consultá a tu vet»*. **Lo primero dice
 * de dónde sale; lo segundo, dónde termina.** Una predisposición leída acá
 * puede asustar a alguien cuyo animal está perfecto — la línea es lo que
 * convierte la ficha en información y no en diagnóstico.
 *
 * ── LA ETAPA ACTUAL SE RESALTA, LAS DEMÁS SE VEN ───────────────────────
 * Esconder las otras etapas obligaría a volver acá en cada cumpleaños. *El
 * dueño de un cachorro también quiere saber qué le espera.*
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export interface CuidadoPorEtapa {
  id: string
  /** *«Cachorro»*, *«Adulto»*… en la voz de la pantalla. */
  etapa: string
  texto: string
  /** La etapa en la que está HOY esta mascota. */
  actual: boolean
}

export interface FichaRazaProps {
  nombre: string
  /** 🔴 **`false` ⇒ la tarjeta NO se dibuja.** Ver la cabecera. */
  revisado: boolean
  /** La historia, en voz de la casa. */
  historia: string
  /** Las características. **Lo que sea `null` no aparece** — misma ley que el
   *  carnet: un guion es una respuesta y acá no hay respuesta. */
  caracteristicas: ReadonlyArray<{ etiqueta: string; valor?: string | null }>
  cuidados: readonly CuidadoPorEtapa[]
  /** *«Contenido revisado por e-PetPlace · consultá a tu vet»*. */
  vozRevision: string
  vozAbrir: string
  vozCerrar: string
}

export function FichaRaza({
  nombre,
  revisado,
  historia,
  caracteristicas,
  cuidados,
  vozRevision,
  vozAbrir,
  vozCerrar,
}: FichaRazaProps) {
  const { theme } = useTheme()
  const [abierta, setAbierta] = useState(false)

  /* 🔴 Sin revisar, no hay ficha. Ver la cabecera: no hay versión degradada. */
  if (!revisado) return null

  const visibles = caracteristicas.filter((c) => c.valor != null && c.valor.trim() !== '')

  return (
    <View style={{ borderRadius: radius.md, backgroundColor: theme.bg.card, padding: spacing[4], gap: spacing[3] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={nombre}
        onPress={() => setAbierta((v) => !v)}
        style={{ minHeight: 44, justifyContent: 'center', gap: spacing[1] }}
      >
        <Texto variante="seccion">{nombre}</Texto>
        <Texto variante="apoyo">{abierta ? vozCerrar : vozAbrir}</Texto>
      </Pressable>

      {abierta ? (
        <View style={{ gap: spacing[4] }}>
          <Texto variante="cuerpo">{historia}</Texto>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {visibles.map((c) => (
              <View key={c.etiqueta} style={{ width: '50%', paddingRight: spacing[3], paddingBottom: spacing[3] }}>
                <Texto variante="apoyo">{c.etiqueta}</Texto>
                <Texto variante="cuerpo">{c.valor as string}</Texto>
              </View>
            ))}
          </View>

          <View style={{ gap: spacing[2] }}>
            {cuidados.map((c) => (
              <View
                key={c.id}
                style={{
                  padding: spacing[3],
                  borderRadius: radius.sm,
                  /* La actual se resalta; **las otras se ven igual**: el dueño
                     de un cachorro también quiere saber qué le espera. */
                  backgroundColor: c.actual ? theme.bg.hundido : 'transparent',
                }}
              >
                <Texto variante={c.actual ? 'enfasis' : 'apoyo'}>{c.etapa}</Texto>
                <Texto variante="cuerpo">{c.texto}</Texto>
              </View>
            ))}
          </View>

          {/* De dónde sale y dónde termina. Ver la cabecera. */}
          <Texto variante="apoyo">{vozRevision}</Texto>
        </View>
      ) : null}
    </View>
  )
}
