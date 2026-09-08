/**
 * PANEL DE MEMORIA — «Lo que sé de {{mascota}}», y se puede corregir
 * (S113-B · 2.0 · B3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ACÁ NO HAY HECHOS SIN CONFIRMAR, Y ES POR DISEÑO DEL TIPO.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Lo que Nexo cree haber entendido se pregunta **en el hilo** —*«¿Guardo que
 * le tiene miedo a los truenos?»*— y sólo con el sí de la familia llega hasta
 * este panel. `HechoDeMemoria` no tiene estado «propuesto»: *un tipo que
 * puede expresar lo que no debería existir hay que vigilarlo; uno que no, no.*
 *
 * ── LA PROMESA ES «EDITABLE», Y ES OBLIGATORIA ──────────────────────────
 * Cada hecho trae `onEditar` **y** `onBorrar`, los dos requeridos. *Una
 * memoria que la familia no puede corregir ni borrar dejó de ser suya y pasó
 * a ser un archivo sobre ella.* Y se edita **en línea**: el hecho no se va a
 * otra pantalla para cambiarle una palabra.
 *
 * ── LO QUE ESTA PIEZA **NO** HACE ───────────────────────────────────────
 * **No compone voz (Ley 3).** El texto del hecho, su procedencia y las
 * palabras de los actos llegan redactados. **No sabe el nombre de la
 * mascota** — el título entra por prop y se dibuja tal cual.
 * **No ordena.** El orden lo trae quien tiene la fecha; inventar uno acá
 * sería un criterio escondido dentro de una pieza.
 * **No borra ni guarda nada.** Llama y quien manda decide.
 *
 * ── 🔴 VACÍA SE DIBUJA IGUAL, y es la excepción declarada ───────────────
 * Este panel **lo abre la familia**: no encontrar nada es la respuesta a lo
 * que fue a preguntar. Devolver `null` la dejaría mirando una Hoja que se
 * quedó corta. Por eso `vozVacia` es **obligatoria** — *se dice dónde no
 * sabemos.* (`haySeguridad` hace lo contrario, y también tiene razón: esa
 * franja aparece sola, y una vacía enseña a ignorarla.)
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * Igual que `PresenciaCoach` y `CabeceraCoach`, y por la misma razón
 * (`MODELO_LOYALTY` §7.1 apaga el motor entero en M6). **El guard vive acá y
 * no en la pantalla**: si cada consumidor tuviera que acordarse, alcanzaría
 * con uno que se olvide para que una familia en duelo lea *«lo que sé de
 * Thor»*.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La Hoja de Nexo (C, lote 2.0). **Entregada y no montada.**
 */

import { useState } from 'react'
import { View } from 'react-native'

import { Boton } from './Boton'
import { Campo } from './Campo'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { memoriaVacia, saneadoParaGuardar, type HechoDeMemoria } from './nexo-memoria'

export type { HechoDeMemoria, OrigenMemoria } from './nexo-memoria'

export interface PanelMemoriaProps {
  /**
   * 🔴 LA SEÑAL REAL, OBLIGATORIA SIN DEFAULT: `estado_vida === 'fallecida'`,
   * resuelta por la pantalla contra el perfil que ya tiene cargado.
   *
   * ⏪ **El piso de esta pieza colgaba SÓLO de `theme.mode === 'memorial'`, y
   * ése es un interruptor que nadie aprieta.** Medido en `D-1021`: **nadie
   * monta `<ThemeProvider memorial>` en ninguna de las dos apps** — el único
   * provider vivo es el raíz, con `mode={light|dark}`. *La protección estaba
   * escrita, se leía como protección, y la app igual le pedía algo a quien
   * perdió a su animal.*
   *
   * **`perdida` NO es memorial** (firma del founder, 7-sep): la familia que
   * busca a su mascota conserva la app entera. Por eso la prop se llama por
   * lo que la letra nombra y no por el estado.
   *
   * *No es un default que se pueda omitir: un `false` por omisión sería
   * exactamente el guard apagado que esta prop viene a curar.*
   */
  enMemorial: boolean

  /** *«Lo que sé de Thor»* — con el nombre adentro, ya compuesto. */
  titulo: string
  hechos: readonly HechoDeMemoria[]
  /** *«Todavía no me contaste nada; lo que me cuentes lo uso para acompañarlo
   *  mejor»* — **obligatoria**: un panel vacío y mudo es peor que no tenerlo. */
  vozVacia: string
  /** Agregar un hecho a mano. **Sin él no se dibuja el acto** — mismo
   *  criterio que una celda sin destino: *ofrecer una puerta que no lleva a
   *  ningún lado enseña a desconfiar de todas.* */
  onAgregar?: () => void
  /** Todas las palabras, ya redactadas (Ley 3). */
  voz: {
    /** *«Contame algo de él»* — el acto de agregar. */
    agregar?: string
    /** *«Corregir»* */
    editar: string
    /** *«Borrar»* */
    borrar: string
    /** *«Guardar»* — al terminar de editar en línea. */
    guardar: string
    /** *«Cancelar»* */
    cancelar: string
    /** Label del campo mientras se edita en línea. */
    campo: string
  }
}

export function PanelMemoria({ enMemorial, titulo, hechos, vozVacia, onAgregar, voz }: PanelMemoriaProps) {
  const { theme } = useTheme()
  /* Cuál se está editando y con qué texto. **Uno por vez**: dos filas
     abiertas a la vez dejan dos borradores compitiendo por la misma memoria. */
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null)

  /* ⛔ El Coach no existe en memorial. Ver la cabecera del archivo.
     ⚠️ Va DESPUÉS del hook: salir antes cambiaría el orden entre renders. */
    /* 🔴 **EL DATO MANDA, Y `theme.mode` SE CONSERVA EN EL `OR`** — misma cura
     que `LineaAlgoSalioDistinto`: la galería SÍ monta el sub-tema y ahí el
     guard tiene que seguir valiendo. *Lo que estaba mal no era mirar el tema:
     era mirar SÓLO el tema.* */
  if (enMemorial || theme.mode === 'memorial') return null

  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="seccion">{titulo}</Texto>

      {memoriaVacia(hechos) ? (
        <Texto variante="apoyo">{vozVacia}</Texto>
      ) : (
        <View style={{ gap: spacing[2] }}>
          {hechos.map((h) => {
            const abierto = editando?.id === h.id
            return (
              <View
                key={h.id}
                style={{
                  gap: spacing[2],
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  backgroundColor: theme.bg.card,
                }}
              >
                {abierto ? (
                  <>
                    <Campo
                      label={voz.campo}
                      value={editando.texto}
                      onChangeText={(t) => setEditando({ id: h.id, texto: t })}
                      multilinea={3}
                    />
                    <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                      {/* 🔴 GUARDAR VACÍO NO BORRA: `saneadoParaGuardar`
                          devuelve `null` y el acto no llama a nadie.
                          *Borrar tiene su propio botón, y una memoria que
                          desaparece porque alguien vació un campo se pierde
                          sin que nadie haya decidido perderla.* */}
                      <Boton
                        tamaño="sm"
                        etiqueta={voz.guardar}
                        onPress={() => {
                          const limpio = saneadoParaGuardar(editando.texto)
                          if (limpio === null) return
                          h.onEditar(limpio)
                          setEditando(null)
                        }}
                      />
                      <Boton
                        variante="secundario"
                        tamaño="sm"
                        etiqueta={voz.cancelar}
                        onPress={() => setEditando(null)}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Texto>{h.texto}</Texto>
                    {/* La procedencia va SIEMPRE, y debajo: *quién lo dijo
                        cambia cuánto vale, y leerlo después del hecho es el
                        orden en que se piensa.* */}
                    <Texto variante="apoyo">{h.vozOrigen}</Texto>
                    <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                      <Boton
                        variante="secundario"
                        tamaño="sm"
                        etiqueta={voz.editar}
                        onPress={() => setEditando({ id: h.id, texto: h.texto })}
                      />
                      {/* Borrar es destructivo y lo dice. **No pide
                          confirmación acá**: la confirmación, si hace falta,
                          es de la pantalla — *una pieza que abre su propio
                          diálogo decide por el flujo que la monta.* */}
                      <Boton variante="destructivo" tamaño="sm" onPress={h.onBorrar} etiqueta={voz.borrar} />
                    </View>
                  </>
                )}
              </View>
            )
          })}
        </View>
      )}

      {/* Agregar va al final: *primero lo que ya sé, después la invitación a
          contarme más.* Y sólo si hay a dónde. */}
      {onAgregar !== undefined && voz.agregar !== undefined ? (
        <View style={{ alignItems: 'flex-start' }}>
          <Boton variante="secundario" tamaño="sm" onPress={onAgregar} etiqueta={voz.agregar} />
        </View>
      ) : null}
    </View>
  )
}
