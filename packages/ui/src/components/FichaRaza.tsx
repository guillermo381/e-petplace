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

import { Chevron } from './chevron'
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
  /** 🔴 **El cierre de la ficha, que lo monta la pantalla.** Nace para la
   *  invitación *«¿Querés contarnos qué lo hace único?»*, y es un SLOT y no
   *  una prop de texto por una razón: *lo que va ahí es una invitación con su
   *  acción, y componerla acá obligaría a la pieza a saber a dónde lleva.*
   *
   *  ⚠️ **Sin slot no se dibuja NADA** — ni un separador ni un hueco. Una
   *  ficha de raza sin invitación es una ficha de raza completa, no una a la
   *  que le falta algo. */
  /**
   * 🔴 **VIVE DENTRO DE LO ABIERTO, y hay que saberlo antes de montarlo.**
   * Con la ficha cerrada —que es su estado por defecto— **el cierre no se
   * dibuja**. Medido en el emulador: la tarjeta cerrada muestra el nombre, la
   * pregunta y el chevron, y nada más.
   *
   * *Es correcto como anatomía —el pie pertenece al contenido— pero tiene una
   * consecuencia de producto: si el «Contanos» viviera SÓLO acá, la pieza más
   * invitante del perfil quedaría detrás de un toque.* Por eso el perfil monta
   * además su propio acceso (`BotonContanos` o la pastilla), y **sin ficha
   * publicada monta el botón solo**: son cuatro puertas a la misma Hoja, no
   * una escondida.
   */
  cierre?: React.ReactNode
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
  cierre,
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
        {/* 🔴 **CON AFORDANCE: label + chevron** (19.7). ⏪ Era texto suelto, y
            *un texto que no se distingue de una descripción no se toca: la
            ficha quedaba cerrada porque nadie sabía que abría.* El chevron
            gira, que es lo que dice si va a abrir o a cerrar. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
          <Texto variante="apoyo">{abierta ? vozCerrar : vozAbrir}</Texto>
          {/* 🔴 **LA PRIMITIVA, NO EL CARÁCTER — y lo encontró censar la
              CLASE.** Curé este mismo defecto en `CeldasHoy` dos lotes atrás
              y **acá seguía**, en una pieza mía, con el chevron dibujado como
              texto: *una regla duplicada por copia se cura dos veces o no se
              cura.* El censo por la clase encontró además la gemela en
              `FilaConfirmacionVacuna`. */}
          <Chevron color={theme.text.secondary} direccion={abierta ? 'arriba' : 'derecha'} />
        </View>
      </Pressable>

      {abierta ? (
        <View style={{ gap: spacing[4] }}>
          <Texto variante="cuerpo">{historia}</Texto>

          {/* 🔴 **UNA COLUMNA: la primera a todo el ancho, el resto en fila.**
              ⏪ Eran dos columnas al 50 %, y con tres datos —uno largo y dos
              cortos— *el largo se partía en dos renglones angostos y al lado
              quedaba un hueco*. El criterio no es el nombre del campo sino su
              papel: **la primera DESCRIBE —temperamento— y las demás son
              DATOS** (talla, esperanza de vida). La pantalla las ordena; la
              pieza respeta ese orden. */}
          {visibles.length > 0 ? (
            <View style={{ gap: spacing[3] }}>
              <View>
                <Texto variante="apoyo">{visibles[0].etiqueta}</Texto>
                <Texto variante="cuerpo">{visibles[0].valor as string}</Texto>
              </View>
              {visibles.length > 1 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[5] }}>
                  {visibles.slice(1).map((c) => (
                    <View key={c.etiqueta}>
                      <Texto variante="apoyo">{c.etiqueta}</Texto>
                      <Texto variante="cuerpo">{c.valor as string}</Texto>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

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

          {/* 🔴 El cierre: **sin slot no se dibuja NADA**, ni un separador ni
              un hueco. Una ficha sin invitación está completa, no le falta
              algo. */}
          {cierre}
        </View>
      ) : null}
    </View>
  )
}
