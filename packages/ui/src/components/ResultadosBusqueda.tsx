/**
 * RESULTADOS DE BÚSQUEDA — lo que la familia tiene, agrupado por dónde vive
 * (S113-B · 2.0 · B2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NUNCA INVENTA UN RESULTADO, Y NO LO PUEDE HACER: no compone nada.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Dibuja lo que le pasan y **cada fila exige su `onPress`**. *Un resultado que
 * no lleva a ningún lado no es un resultado: es un texto con forma de fila, y
 * la familia lo va a tocar igual.*
 *
 * ── EL TÉRMINO SE RESALTA, Y NO SE PIERDE UNA LETRA ─────────────────────
 * El corte lo hace `tramosResaltados`, con mapa de índices y su gate midiendo
 * que la concatenación de los tramos sea **byte a byte** el título original.
 * *Un resaltado que se come un carácter cambia el dato justo en el lugar donde
 * alguien fue a verificar algo.*
 *
 * ── 🔴 SIN RESULTADOS SE DICE, Y SE OFRECE SALIDA ───────────────────────
 * *«No encontré nada con "pipeta"»* y el chip **«Preguntale a Nexo»**. Las dos
 * cosas: la primera sola deja a la persona en un callejón, y *un buscador que
 * dice que no y no ofrece nada enseña a no volver a buscar.* Por eso `vacio`
 * exige su voz **y** su acto.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No ordena ni recorta.** El orden y el tope los trae quien busca — un
 * criterio escondido en una pieza es un criterio que nadie puede auditar.
 * **No compone rótulos** (Ley 3): «Citas», «Pedidos» llegan redactados.
 * **No dibuja grupos vacíos**: un rótulo con nada debajo se lee como algo que
 * falló al cargar, no como «acá no hay».
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La Hoja de Nexo (C, lote 2.0). **Entregada y no montada.**
 */

import { Pressable, Text, View } from 'react-native'

import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { Chevron } from './chevron'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import {
  gruposConAlgo,
  sinResultados,
  tramosResaltados,
  type GrupoResultados,
  type Resultado,
  type TipoResultado,
} from './nexo-busqueda'

export type { GrupoResultados, Resultado, TipoResultado } from './nexo-busqueda'

/** 🔴 **El glifo por tipo lo decide la PIEZA, no la pantalla.** Si entrara por
 *  prop, dos pantallas podrían darle a «Citas» dos íconos distintos y el mismo
 *  resultado se leería como dos cosas. La tabla es exhaustiva por tipo: **un
 *  tipo nuevo sin glifo no compila.** */
const GLIFO = {
  citas: 'veterinaria',
  pedidos: 'pedido',
  recuerdos: 'hogar',
  despensa: 'despensa',
  prestadores: 'equipo',
} satisfies Record<TipoResultado, IconoNombre>

export interface ResultadosBusquedaProps {
  /** Lo que se buscó, tal cual lo escribió la persona. Es lo que se resalta. */
  termino: string
  grupos: readonly GrupoResultados[]
  /** 🔴 **La voz Y la salida.** Ver la cabecera: sin las dos no compila. */
  vacio: {
    /** *«No encontré nada con "pipeta"»* — ya compuesta, con el término
     *  adentro (Ley 3). */
    voz: string
    /** *«Preguntale a Nexo»* */
    vozChip: string
    onPreguntar: () => void
  }
}

function Fila({ r, termino }: { r: Resultado; termino: string }) {
  const { theme } = useTheme()
  const tramos = tramosResaltados(r.titulo, termino)

  return (
    <Pressable
      accessibilityRole="button"
      /* 🔴 El label lleva el título ENTERO y sin resaltar: *quien no ve la
         pantalla necesita el dato, no dónde estaba la coincidencia.* */
      accessibilityLabel={r.subtitulo === undefined ? r.titulo : `${r.titulo} · ${r.subtitulo}`}
      onPress={r.onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingVertical: spacing[3],
      }}
    >
      <Icono nombre={GLIFO[r.tipo]} tamano={24} registro="capa" />
      <View style={{ flex: 1, gap: spacing[0.5] }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            color: theme.text.primary,
          }}
        >
          {tramos.map((t, i) => (
            <Text
              key={i}
              style={
                t.marcado
                  ? {
                      /* El resaltado es de PESO y no de fondo: *un
                         subrayado amarillo dentro de una fila compite con
                         el estado, y acá nada está mal.* */
                      fontFamily: typography.family.sans.medium,
                      color: theme.accent.control,
                    }
                  : undefined
              }
            >
              {t.texto}
            </Text>
          ))}
        </Text>
        {r.subtitulo !== undefined ? (
          <Texto variante="apoyo" numberOfLines={1}>
            {r.subtitulo}
          </Texto>
        ) : null}
      </View>
      {/* La fecha en mono, como toda metadata de la casa. */}
      {r.fecha !== undefined ? (
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.sm,
            color: theme.text.secondary,
          }}
        >
          {r.fecha}
        </Text>
      ) : null}
      <Chevron color={theme.text.tertiary} direccion="derecha" />
    </Pressable>
  )
}

export function ResultadosBusqueda({ termino, grupos, vacio }: ResultadosBusquedaProps) {
  const { theme } = useTheme()
  const conAlgo = gruposConAlgo(grupos)

  if (sinResultados(grupos)) {
    return (
      <View style={{ gap: spacing[3], paddingVertical: spacing[4] }}>
        <Texto variante="apoyo">{vacio.voz}</Texto>
        {/* 🔴 La salida. Ver la cabecera. */}
        <View style={{ alignItems: 'flex-start' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={vacio.vozChip}
            onPress={vacio.onPreguntar}
            style={{
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[2],
              borderRadius: radius.full,
              backgroundColor: theme.bg.card,
              /* 🔴 **EL MISMO BORDE QUE `ChipsSugerencia`, y lo pidió la
                 captura.** Sin él, sobre papel claro `bg.card` es blanco
                 contra #F6F6F6: el chip se leía como una tarjeta y no como
                 algo tocable. *Dos anatomías de chip en la misma casa son dos
                 afordancias, y la persona aprende la más débil.* */
              borderWidth: theme.border.width,
              borderColor: theme.border.subtle,
            }}
          >
            <Texto variante="apoyo" color="primary">
              {vacio.vozChip}
            </Texto>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={{ gap: spacing[5] }}>
      {conAlgo.map((g) => (
        <View key={g.tipo} style={{ gap: spacing[1] }}>
          <Texto variante="seccion">{g.rotulo}</Texto>
          {g.resultados.map((r) => (
            <Fila key={r.id} r={r} termino={termino} />
          ))}
        </View>
      ))}
    </View>
  )
}
