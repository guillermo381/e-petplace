/**
 * CabeceraHilo — CON QUIÉN HABLO Y POR QUÉ (S112-B, B2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Arriba veo con quién hablo y por qué»* — la letra, §2.1. **Son dos datos
 * y ninguno reemplaza al otro:** la contraparte (con quién) y el animal (por
 * qué). Un chat que sólo dice con quién hablás pierde el sujeto de la
 * conversación, que acá es el motivo entero de que exista.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LOS DOS TOQUES VAN A DOS LADOS DISTINTOS ─────────────────────────────
 * El animal lleva a **su ficha**; la contraparte, a **su vitrina**. Los dos
 * son opcionales y por separado: *como refugio, el solicitante no tiene
 * vitrina* — y una fila que se hunde sin llevar a ningún lado es una promesa
 * rota. Sin `onPress` no hay chevron ni presión: la estructura informa
 * (Ley 18).
 *
 * ── EL SLOT DE ACCIONES, y lo que la letra prohíbe explícitamente ────────
 * «Ver postulación» y el menú Aceptar / Declinar del refugio entran por
 * `acciones`. **La letra dice dónde NO van:** *«nada de eso vive en la barra
 * de escribir»* (§2.1). Acá esa regla se cumple por construcción — **la
 * barra no tiene slot de acciones**, así que no hay dónde ponerlas mal.
 *
 * Entra por slot y no por props tipadas porque la doble confirmación (P1) es
 * una decisión de la pantalla, no de la cabecera: *una cabecera que dibuja
 * «Declinar» también tendría que saber cómo se confirma, y ahí deja de ser
 * una cabecera.*
 *
 * ── LA MISMA PIEZA EN LAS DOS APPS ───────────────────────────────────────
 * Lo único que cambia entre asientos es **quién es la contraparte** y **qué
 * acciones tiene**, y las dos son props. No hay variante por app: los
 * acentos y superficies se resuelven en el tema (`accent.*` es slot por
 * casa), así que la misma pieza habla el color de cada una.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo en las dos apps (C3 · C6). **Entregada y no montada.**
 */
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota } from './AvatarMascota'
import { Chevron } from './chevron'
import { LogoNegocio } from './LogoNegocio'
import { Texto } from './Texto'

export type CabeceraHiloProps = {
  /** EL ANIMAL — el porqué de la conversación. */
  animal: {
    nombre: string
    fotoUrl?: string | null
    /** El avatar de la casa por raza o especie, ya resuelto (S112-B). */
    fotoDeEspecie?: string | null
    /** Lleva a su ficha. Ausente = no se hunde ni dibuja chevron. */
    onPress?: () => void
  }
  /** LA CONTRAPARTE — el refugio, o el solicitante si soy el refugio. */
  contraparte: {
    nombre: string
    fotoUrl?: string | null
    /** Lleva a su vitrina. **Ausente cuando no la tiene** (un solicitante). */
    onPress?: () => void
  }
  /** «Ver postulación» y el menú del refugio. Ver la nota de la cabecera. */
  acciones?: ReactNode
}

/** Fila tocable-o-no: el chevron y la presión existen sólo si lleva. */
function Fila({
  cara,
  nombre,
  onPress,
  variante,
}: {
  cara: ReactNode
  nombre: string
  onPress?: () => void
  variante: 'titulo' | 'apoyo'
}) {
  const contenido = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      {cara}
      <View style={{ flex: 1 }}>
        <Texto variante={variante === 'titulo' ? 'enfasis' : 'apoyo'} numberOfLines={1}>
          {nombre}
        </Texto>
      </View>
      {onPress === undefined ? null : <Chevron direccion="derecha" />}
    </View>
  )
  if (onPress === undefined) return contenido
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={nombre}>
      {contenido}
    </Pressable>
  )
}

export function CabeceraHilo({ animal, contraparte, acciones }: CabeceraHiloProps) {
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
      {/* EL ANIMAL PRESIDE: es el sujeto de la conversación, y su foto es
          chica porque acá no se lo presenta —eso es la ficha— se lo nombra. */}
      <Fila
        cara={
          <AvatarMascota
            nombre={animal.nombre}
            fotoUrl={animal.fotoUrl ?? undefined}
            fotoDeEspecie={animal.fotoDeEspecie ?? undefined}
            tamano="sm"
          />
        }
        nombre={animal.nombre}
        onPress={animal.onPress}
        variante="titulo"
      />

      {/* LA CONTRAPARTE — `LogoNegocio` y no `AvatarMascota`: del otro lado
          hay una organización o una persona, nunca un animal, y su fallback
          honesto es el monograma de su nombre. */}
      <Fila
        cara={<LogoNegocio nombre={contraparte.nombre} logoUrl={contraparte.fotoUrl} tamano={28} />}
        nombre={contraparte.nombre}
        onPress={contraparte.onPress}
        variante="apoyo"
      />

      {acciones}
    </View>
  )
}
