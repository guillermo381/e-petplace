/**
 * TRAER PAPELES DE OTRA CLÍNICA (S113-B · fase 3 · B2).
 *
 * El arma de conquista: la familia que ya tiene expediente en otro lado lo
 * trae, y **la casa lo lee por ella**. Foto o PDF → espera → **confirmación
 * fila por fila** → recién ahí se guarda.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NADA SE GUARDA SIN UN TOQUE, Y ESO ES DEL TIPO.**
 * ═══════════════════════════════════════════════════════════════════════════
 * La confirmación es la mecánica del carnet, que ya está probada: **lo dudoso
 * se marca · lo que falta se pide · el pie no deja guardar hasta que no falte
 * nada.** *Un extractor que guarda solo convierte «la casa lee tus papeles» en
 * «la casa escribe en el expediente de tu mascota lo que le pareció».*
 *
 * ── 🔴 Y LA LEY DE LA BÓVEDA RIGE ACÁ TAMBIÉN ──────────────────────────
 * Un examen se confirma **como tabla transcrita**: analito · valor con su
 * unidad · referencia **si estaba impresa**. **Sin semáforos y sin flechas** —
 * y no apagados: `ValorDePapel` no tiene dónde ponerlos. Si el laboratorio
 * marcó algo, **esa marca viaja como texto**. (Ver `papeles-boveda.ts`.)
 *
 * ── LA ESPERA TIENE DOS VOCES, Y LA SEGUNDA NO ES DECORACIÓN ────────────
 * A los **8 s** cambia sola. *Una espera que dice lo mismo a los dos segundos
 * que a los quince deja a la persona sin saber si el proceso avanza o se
 * colgó — y a los quince, quien no sabe, cierra.* La segunda voz la escribe la
 * pantalla; la pieza sólo garantiza que exista y cuándo.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No elige el archivo** (recibe los dos actos) · **no llama al extractor** ·
 * **no compone voz (Ley 3)** · **no decide si un valor está bien**: eso no lo
 * decide nadie de este lado.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La pantalla Documentos y el alta de la mascota (C).
 */

import { useEffect, useState } from 'react'
import { View } from 'react-native'

import { Boton } from './Boton'
import { Hoja } from './Hoja'
import { OrbeCoach } from './OrbeCoach'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { pideRevision } from './vacunas-estado'
import {
  hayQueCompletar,
  SEGUNDA_VOZ_MS,
  type ContenidoLeido,
  type FilaLeida,
} from './papeles-boveda'

export { hayQueCompletar, SEGUNDA_VOZ_MS } from './papeles-boveda'
export type { ContenidoLeido, FilaLeida } from './papeles-boveda'

/**
 * 🔴 **LOS TRES ESTADOS SON UNA UNIÓN, no tres booleanos.** *Con banderas se
 * puede escribir «leyendo y además listo», y alguien tiene que decidir cuál
 * gana — una decisión que nadie firmó.*
 */
export type EstadoTraer =
  | { fase: 'elegir'; onFoto: () => void; onArchivo: () => void }
  | { fase: 'leyendo' }
  | {
      fase: 'confirmar'
      contenido: ContenidoLeido
      /** 🔴 Guardar, y **sólo cuando no falte nada** — ver `hayQueCompletar`. */
      onGuardar: () => void
      /** *«Revisá lo que falta»* — la razón por la que no se puede guardar. */
      vozIncompleto: string
    }


const ORBE = 44

export interface HojaTraerPapelesProps {
  visible: boolean
  onCerrar: () => void
  titulo: string
  estado: EstadoTraer
  /** Las dos voces de `elegir`. */
  vozFoto: string
  vozArchivo: string
  /** *«Leyendo el papel…»* y, a los 8 s, la segunda. **Las dos obligatorias.** */
  vozLeyendo: string
  vozLeyendoLarga: string
  vozGuardar: string
}

export function HojaTraerPapeles(props: HojaTraerPapelesProps) {
  const { visible, onCerrar, titulo, estado } = props

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={titulo}>
      {estado.fase === 'elegir' ? (
        <View style={{ gap: spacing[3] }}>
          <Boton variante="primario" etiqueta={props.vozFoto} onPress={estado.onFoto} />
          <Boton variante="secundario" etiqueta={props.vozArchivo} onPress={estado.onArchivo} />
        </View>
      ) : estado.fase === 'leyendo' ? (
        <Espera corta={props.vozLeyendo} larga={props.vozLeyendoLarga} />
      ) : (
        <Confirmar estado={estado} vozGuardar={props.vozGuardar} />
      )}
    </Hoja>
  )
}

/** La espera, con su segunda voz a los 8 s. Ver la cabecera. */
function Espera({ corta, larga }: { corta: string; larga: string }) {
  const [pasoRato, setPasoRato] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setPasoRato(true), SEGUNDA_VOZ_MS)
    return () => clearTimeout(t)
  }, [])

  return (
    <View style={{ alignItems: 'center', gap: spacing[4], paddingVertical: spacing[6] }}>
      {/* El orbe va en caja fija: sin ella colapsa a 0 y se dibuja encima de lo
          que sigue — lo midió el emulador en el 2.2. */}
      <View style={{ width: ORBE, height: ORBE }}>
        <OrbeCoach tamano={ORBE} encendido={1} />
      </View>
      <Texto variante="apoyo" centrado>{pasoRato ? larga : corta}</Texto>
    </View>
  )
}

function Confirmar({
  estado,
  vozGuardar,
}: {
  estado: Extract<EstadoTraer, { fase: 'confirmar' }>
  vozGuardar: string
}) {
  const { theme } = useTheme()
  const falta = hayQueCompletar(estado.contenido)

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ borderRadius: radius.md, backgroundColor: theme.bg.card, padding: spacing[4], gap: spacing[3] }}>
        {estado.contenido.tipo === 'examen'
          ? estado.contenido.valores.map((v) => (
              <FilaLeidaVista key={v.id} fila={v}>
                <View style={{ flex: 1 }}>
                  <Texto>{v.analito}</Texto>
                  {v.referencia !== undefined ? <Texto variante="dato">{v.referencia}</Texto> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {/* 🔴 Sin color. Teñirlo sería decir si está bien o mal. */}
                  <Texto variante="dato">{v.unidad === undefined ? v.valor : `${v.valor} ${v.unidad}`}</Texto>
                  {v.marcaImpresa !== undefined ? <Texto variante="apoyo">{v.marcaImpresa}</Texto> : null}
                </View>
              </FilaLeidaVista>
            ))
          : estado.contenido.medicacion.map((m) => (
              <FilaLeidaVista key={m.id} fila={m}>
                <View style={{ flex: 1, gap: spacing[0.5] }}>
                  <Texto>{m.nombre}</Texto>
                  {m.dosis !== undefined ? <Texto variante="apoyo">{m.dosis}</Texto> : null}
                  {m.duracion !== undefined ? <Texto variante="dato">{m.duracion}</Texto> : null}
                </View>
              </FilaLeidaVista>
            ))}
      </View>

      {/* 🔴 Con algo por completar NO se guarda, y se DICE por qué. *Un botón
          apagado y mudo hace que la persona toque hasta rendirse.* */}
      {falta ? (
        <Texto variante="apoyo">{estado.vozIncompleto}</Texto>
      ) : (
        <Boton variante="primario" etiqueta={vozGuardar} onPress={estado.onGuardar} />
      )}
    </View>
  )
}

function FilaLeidaVista({ fila, children }: { fila: FilaLeida; children: React.ReactNode }) {
  const { theme } = useTheme()
  /* Algo que falta no deja confianza que valga: **la duda es la fila entera** —
     el mismo criterio que el carnet. */
  const revisar = pideRevision(fila.confianza) || fila.falta !== undefined

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        /* 🔴 TINTE en el filete, jamás relleno de alarma (`R20`) — y ojo: esto
           marca **que la LECTURA dudó**, no que el valor esté mal. Son dos
           cosas distintas y sólo una es nuestra. */
        borderLeftWidth: revisar ? 3 : 0,
        borderLeftColor: theme.status.warningText,
        paddingLeft: revisar ? spacing[2] : 0,
      }}
    >
      {children}
      {/* Lo que falta se PIDE, con su nombre. No se rellena. */}
      {fila.falta !== undefined ? <Texto variante="apoyo" color="warning">{fila.falta}</Texto> : null}
    </View>
  )
}
