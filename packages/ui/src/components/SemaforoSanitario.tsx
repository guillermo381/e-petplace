/**
 * SemaforoSanitario — QUÉ FALTA PARA ENTRAR, y cómo resolverlo (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **UN PENDIENTE QUE EL DUEÑO NO PUEDE RESOLVER ES PEOR QUE NO MOSTRARLO.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ésa es la regla que ordena la pieza entera, y **está cobrada**: la lección
 * de S91 sobre el loyalty ya la pagó una vez —una pantalla que enumera lo que
 * falta sin dar el camino convierte información en reproche—. Acá el requisito
 * sanitario decide si el animal entra o no, así que el costo de repetirla
 * sería que una familia lea «falta la vacuna» un domingo y no tenga qué tocar.
 *
 * ── 🔴 EL ESTADO MALO ES INEXPRESABLE, NO «PROHIBIDO» (L-222) ─────────────
 * La regla de arriba **no vive en la disciplina de quien consume la pieza:
 * vive en el TIPO.** `RequisitoSanitario` es una unión discriminada:
 *
 * · `{ estado: 'al_dia' }` — no lleva acción, porque no hay nada que resolver.
 * · `{ estado: 'falta', onResolver, etiquetaResolver }` — **los dos campos son
 *   OBLIGATORIOS.**
 *
 * ⇒ **«falta sin camino» no compila.** No alcanza con que nadie lo pase: hace
 * falta que no se pueda — el mismo movimiento con el que `FilaEntrega` no
 * tiene prop de mascota. *Un `onResolver?: () => void` opcional habría dejado
 * la regla escrita en un comentario, y un comentario no frena a un compilador
 * (L-396).*
 *
 * ── LO QUE NO HACE, y es una decisión ─────────────────────────────────────
 * **No cuenta cuántos faltan ni dibuja un progreso «3 de 5».** Un requisito
 * sanitario no es una barra que se llena: **o el animal puede entrar o no**, y
 * un 60 % no significa nada operativamente. *Convertirlo en score sería la
 * gamificación que `MODELO_LOYALTY` §7.5 corta.* La pantalla que quiera decir
 * «listo / falta algo» lo dice con su propia voz, con el dato que ya tiene.
 *
 * **Tampoco decide qué es un requisito.** La lista llega por prop: los
 * requisitos son **datos** (los declara el lugar), no un catálogo cableado
 * acá. *El día que un lugar pida antipulgas, es una fila más en una tabla —
 * no una migración de esta pieza.*
 *
 * ── LEY 11: POR QUÉ NACE (protocolo 1c, pregunta 2) ───────────────────────
 * · `EscaleraEstados` informa el progreso de UNA secuencia con orden. Los
 *   requisitos **no tienen orden**: la vacuna no va «antes» de la
 *   desparasitación, y pintarlos como escalera afirmaría una secuencia falsa.
 * · `Insignia` dice UN estado suelto, sin camino de resolución.
 * · `CeldaNavegacion` es la fila que navega — **y de ella se toma la anatomía**
 *   (19.7: texto + chevron, target 44, la fila entera tapea) en vez de
 *   inventar otra. Lo que no da es el par estado↔requisito.
 * El trabajo «informar requisitos de admisión, cada faltante con su camino» no
 * estaba en el diccionario (Ley 19). Entra con esta pieza.
 *
 * ── LEY 22 — EL FALTANTE NO ES UN ERROR ───────────────────────────────────
 * El faltante se pinta en **`warning`** (ochre), jamás en `danger`. *Un carnet
 * vencido no es una falla de nadie: es una tarea.* El rojo es alarma, y un
 * color de alarma que se enciende cuando no pasó nada enseña a ignorar el rojo
 * (el mismo precedente que le prohíbe el rojo al temporizador de la
 * videoconsulta, §1.5).
 *
 * ── ESCALERA (§4b) ────────────────────────────────────────────────────────
 * **Peldaño 0** — sin requisitos declarados la pieza NO se monta (regla de
 * existencia; un lugar sin requisitos no tiene semáforo que mostrar).
 * **Peldaño 1** — los requisitos con su estado.
 * **Peldaño 2** — el estado sale del expediente vivo (el carnet ya cargado lo
 * resuelve solo). El dato que dispara la subida es la vacuna con su fecha:
 * hoy la pantalla la resuelve, y `evento_vacuna_aplicada.fecha_proxima` es lo
 * que un día la va a resolver sin preguntar.
 *
 * ── DOSIS Y TEMAS ─────────────────────────────────────────────────────────
 * Tokens de `status`, que ya viven en los tres temas: sirve a las dos apps sin
 * variante. Memorial degrada solo. Sin animación (Ley 6): un estado se
 * informa, no se celebra.
 */

import { Pressable, Text, View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { Separador } from './Separador'
import { Texto } from './Texto'
import { Chevron } from './chevron'

/**
 * 🔴 UNIÓN DISCRIMINADA — ver el encabezado. `falta` SIN camino no compila.
 */
export type RequisitoSanitario =
  | {
      /** Identidad estable. Jamás se muestra. */
      clave: string
      /** El requisito en voz de la app: «Vacuna antirrábica». */
      etiqueta: string
      estado: 'al_dia'
      /**
       * El respaldo, si la app lo quiere mostrar: «vence 12 mar 2027», ya
       * formateado por el riel. Opcional — un «al día» se sostiene solo.
       */
      detalle?: string
    }
  | {
      clave: string
      etiqueta: string
      estado: 'falta'
      detalle?: string
      /**
       * 🔴 **OBLIGATORIO.** El camino a resolver, a UN toque: abre la carga
       * del carnet. Sin esto la pieza no compila, y ése es el punto.
       */
      onResolver: () => void
      /**
       * 🔴 **OBLIGATORIO.** Qué va a pasar al tocar, en voz de la app
       * («Cargar el carnet»). Viaja al `accessibilityLabel`: quien no ve la
       * pantalla necesita saber que la fila **hace algo**, no solo que falta.
       *
       * Por prop como todo texto de esta pieza — ver `FichaFranja`.
       */
      etiquetaResolver: string
    }

export type SemaforoSanitarioProps = {
  requisitos: RequisitoSanitario[]
  /** Rótulo del grupo, en voz de la app. */
  rotulo?: string
}

function Fila({ requisito }: { requisito: RequisitoSanitario }) {
  const { theme } = useTheme()
  const falta = requisito.estado === 'falta'

  /* La MARCA de estado. Un glifo de texto y no un `Icono`: acá no hay objeto
     de oficio que dibujar (Ley 12 pide objeto + huella, y un check no es ni
     una cosa ni una mascota). Es el mismo criterio con el que el chevron vive
     en `chevron.tsx` y no en el registry. */
  const marca = falta ? '—' : '✓'
  const colorMarca = falta ? theme.status.warningText : theme.status.successText

  const cuerpo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      {/* Ancho fijo para que las etiquetas queden alineadas en columna: el ojo
          barre los estados sin leer los nombres.

          🔴 SE DIBUJA CON `Text` Y NO CON `Texto`, y es a propósito: el color
          del estado vive en `theme.status.*`, que **no es miembro de
          `TextoColor`** — y `R58` prohíbe expresamente darle a `Texto` un
          color de acento. La alternativa correcta no es ensanchar `Texto`
          (ese slot es semántico y su pobreza es deliberada) sino usar el
          primitivo con los tokens tipográficos de la casa, que es lo que
          hacen las piezas que necesitan un color de `status`. Cero valor
          crudo: familia, tamaño y color salen de tokens. */}
      <View style={{ width: spacing[5], alignItems: 'center' }}>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            color: colorMarca,
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.base,
            lineHeight: 24,
          }}
        >
          {marca}
        </Text>
      </View>

      <View style={{ flex: 1, gap: spacing[0.5] }}>
        <Texto variante="cuerpo">{requisito.etiqueta}</Texto>
        {requisito.detalle === undefined ? null : (
          <Texto variante="apoyo" color="tertiary">
            {requisito.detalle}
          </Texto>
        )}
      </View>

      {/* El chevron SOLO donde hay camino (Ley 18: la estructura informa). En
          una fila al día sería una promesa de navegación que nadie cumple. */}
      {/* ⏪ MISMO DEFECTO QUE `SeccionPlegable`, y del mismo autor: el `d` del
          path salía impreso como texto. **Se usa la pieza.** */}
      {falta ? <Chevron direccion="derecha" /> : null}
    </View>
  )

  if (!falta) {
    /* Al día: NO es tocable. No hay nada que resolver, y una fila que se
       hunde sin hacer nada es una promesa rota. */
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={[requisito.etiqueta, requisito.detalle].filter(Boolean).join('. ')}
        style={{ paddingVertical: spacing[3] }}
      >
        {cuerpo}
      </View>
    )
  }

  return (
    <Pressable
      onPress={requisito.onResolver}
      accessibilityRole="button"
      /* El camino entra al label: sin esto, quien usa lector sabe que falta
         algo y no que puede resolverlo acá mismo — que es justo el daño que
         esta pieza existe para evitar. */
      accessibilityLabel={[requisito.etiqueta, requisito.detalle, requisito.etiquetaResolver]
        .filter(Boolean)
        .join('. ')}
      style={({ pressed }) => ({
        /* Target 44 (19.7): 12 + 12 de padding sobre una fila de ~20 llega al
           mínimo sin inflar el ritmo de la lista. */
        paddingVertical: spacing[3],
        minHeight: 44,
        justifyContent: 'center',
        borderRadius: radius.suave,
        backgroundColor: pressed ? theme.bg.overlay : 'transparent',
      })}
    >
      {cuerpo}
    </Pressable>
  )
}

export function SemaforoSanitario({ requisitos, rotulo }: SemaforoSanitarioProps) {
  /* REGLA DE EXISTENCIA: sin requisitos no hay semáforo. No se dibuja un
     estado vacío decorativo (Ley 13: el vacío se confirma, y acá el vacío
     significa «este lugar no pide nada», que no es una pantalla). */
  if (requisitos.length === 0) return null

  return (
    <View style={{ gap: spacing[2] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      <View>
        {requisitos.map((r, i) => (
          <View key={r.clave}>
            {i === 0 ? null : <Separador />}
            <Fila requisito={r} />
          </View>
        ))}
      </View>
    </View>
  )
}
