/**
 * LAS ACCIONES DEL PERFIL — lo que puedo hacer con Thor (S113-B · 2.2.3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **DEJÓ DE SER CUATRO SLOTS CON NOMBRE Y PASÓ A SER UNA LISTA.**
 * ═══════════════════════════════════════════════════════════════════════════
 * ⏪ Hasta el 2.2 la pieza recibía `citas`, `pasaporte`, `nexo` y `contanos`
 * por nombre, y **el tercero era especial**: se dibujaba con `OrbeCoach` y no
 * admitía glifo, porque Nexo *es una presencia, no una sección*.
 *
 * **Nexo salió de la fila** —ya flota en toda la app— y con él **el único
 * motivo que tenían los slots para llamarse por su nombre**. Sin un miembro
 * especial, nombrarlos sólo compra una cosa: *que cambiar el juego de acciones
 * sea cambiar el TIPO*, y este juego acaba de cambiar por segunda vez.
 *
 * Hoy la pieza sabe **cuántas** y **cómo se dibuja una**; **cuáles** lo sabe la
 * pantalla. *Ése es exactamente el reparto que ya rige en el resto de la casa:
 * la pieza pone la forma, la pantalla pone el contenido.*
 *
 * ── 🔴 EL TECHO SIGUE SIENDO LEY, Y LO SOSTIENE EL COMPILADOR ───────────
 * `readonly [A,A,A] | readonly [A,A,A,A]` — **tres o cuatro, jamás cinco**.
 * *Con cinco la fila deja de ser «lo que puedo hacer con Thor» y pasa a ser un
 * menú, y un menú se lee de arriba abajo buscando, no de un vistazo.*
 *
 * ⚠️ Y **tres es legal a propósito**: no es una concesión, es el caso que la
 * pieza ya producía —memorial dejaba tres al esconder a Nexo—. *Un tipo que
 * sólo admitiera cuatro habría vuelto inexpresable un estado que existía.*
 *
 * ⭐ **DOS TAMBIÉN, y es el MISMO argumento** (enmienda aditiva de la pista C,
 * 76(d), S113 · 2.2.4). El hueco que esta cabecera declaraba —*¿«Cuéntanos»
 * corresponde en memorial? Es del founder, no mía*— **lo contestó el founder**:
 * en memorial van **DOS**, Documentos y Cuéntanos. *De quien ya no está se
 * siguen leyendo sus papeles y se sigue pudiendo guardar un recuerdo; Citas y
 * Pasaporte no.*
 * El piso de tres venía del caso «memorial esconde a Nexo», que esa firma
 * acaba de retirar — así que sostenerlo hoy volvería inexpresable el estado
 * que la firma creó. **El techo de cuatro NO se toca**: la razón de arriba
 * sigue entera.
 *
 * ── ☠️ LA EXCEPCIÓN DE MEMORIAL MURIÓ CON SU SUJETO ─────────────────────
 * Acá la pieza escondía **la acción de Nexo** en memorial (`MODELO_LOYALTY`
 * §7.1). Esa regla no era sobre la POSICIÓN: era sobre el Coach — *una acción
 * que abre a Nexo en un duelo es lo que §7.1 apaga*. Con Nexo fuera **se quedó
 * sin sujeto**, y una regla sin sujeto no se conserva «por las dudas»: aplicada
 * a la cuarta cualquiera escondería algo que nadie decidió esconder.
 *
 * 🔴 **Y lo que queda es una pregunta de producto que la pieza NO contesta:**
 * *¿«Cuéntanos» corresponde en memorial?* Contar recuerdos de quien ya no está
 * puede ser lo más valioso, o puede ser un pedido fuera de lugar. **Es del
 * founder, no mía**, y hoy la pieza **dibuja lo que le den**: si en memorial
 * van tres, la pantalla manda tres. *Prefiero un hueco declarado a una regla
 * inventada que después nadie recuerda haber decidido.*
 *
 * ── 🔴 UNA ACCIÓN APAGADA Y MUDA ES INEXPRESABLE ────────────────────────
 * O tiene `onPress`, o tiene `razonApagado` y la dice al tocarla. **Las dos a
 * la vez tampoco compilan.** *Un botón gris sin explicación es el defecto* —
 * y acá pasa de verdad: el pasaporte puede no estar activado todavía.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3)** · **no decide a dónde va nada** · **no sabe si el
 * pasaporte está activo**: eso llega como `razonApagado`.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El tablero del perfil (C). Juego vigente: **Citas · Pasaporte y QR ·
 * Documentos · Cuéntanos**.
 * ⚠️ **Y una advertencia medida para quien la monte: el registry NO tiene
 * glifo `pasaporte` ni `qr`.** Los parientes vivos son `carnet`, `documento`,
 * `documentos`, `datos` y `compartir`. *Un glifo nuevo no se improvisa acá:
 * pasa por su hoja de contacto y su gate por ícono* (`DIRECCION_ARTE` §6b).
 */

import { Pressable, View } from 'react-native'

import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

const DISCO = 48

interface AccionBase {
  /** *«Citas»* — corta, ya redactada. */
  etiqueta: string
  /** 🔴 **Obligatorio.** Ya no hay miembro que se dibuje distinto. */
  glifo: IconoNombre
}

/**
 * 🔴 O lleva a algún lado, o dice por qué no. **Nunca las dos, nunca
 * ninguna.** *No es un chequeo que alguien corre: un botón apagado y mudo no
 * se puede escribir.*
 */
export type AccionPerfil =
  | (AccionBase & { onPress: () => void; razonApagado?: never })
  | (AccionBase & { onPress?: never; razonApagado: string })

export interface FilaAccionesProps {
  /**
   * 🔴 **TRES O CUATRO — el compilador no deja escribir la quinta.** Ver la
   * cabecera. El orden es el que se dibuja: la pieza no reordena.
   */
  acciones:
    | readonly [AccionPerfil, AccionPerfil]
    | readonly [AccionPerfil, AccionPerfil, AccionPerfil]
    | readonly [AccionPerfil, AccionPerfil, AccionPerfil, AccionPerfil]
  /** Qué hacer al tocar una apagada: la pantalla dice la razón **en una
   *  línea**. La pieza no elige el vehículo. */
  onRazonApagado?: (razon: string) => void
}

export function FilaAcciones({ acciones, onRazonApagado }: FilaAccionesProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: spacing[2] }}>
      {/* La clave es la etiqueta y no el índice: *con índices, reordenar las
          acciones entre dos renders reusaría el nodo de otra* — hoy no guardan
          estado y no se notaría, y el día que una lo guarde se notaría mal. */}
      {acciones.map((a) => (
        <Accion key={a.etiqueta} accion={a} onRazonApagado={onRazonApagado} />
      ))}
    </View>
  )
}

function Accion({
  accion,
  onRazonApagado,
}: {
  accion: AccionPerfil
  onRazonApagado?: (razon: string) => void
}) {
  const { theme } = useTheme()
  const apagado = accion.razonApagado !== undefined

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accion.etiqueta}
      accessibilityState={{ disabled: apagado }}
      accessibilityHint={accion.razonApagado}
      onPress={() => {
        /* 🔴 El apagado NO es mudo: dice su razón. *Un toque que no hace nada
           enseña que la pantalla está rota.* */
        if (accion.razonApagado !== undefined) {
          onRazonApagado?.(accion.razonApagado)
          return
        }
        accion.onPress()
      }}
      style={{ alignItems: 'center', gap: spacing[1], flex: 1 }}
    >
      <View
        style={{
          width: DISCO,
          height: DISCO,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.bg.card,
          /* La razón se dibuja: **atenuado, no ausente.** *Un botón que
             desaparece deja a la persona sin saber que existía.* */
          opacity: apagado ? 0.45 : 1,
        }}
      >
        <Icono nombre={accion.glifo} tamano={24} registro="tinta" montaje="control" />
      </View>
      {/* Dos palabras como «Pasaporte y QR» no se cortan: envuelven y se
          centran. *Una etiqueta cortada obliga a tocar para saber qué era.*

          🔴 **PERO UNA SOLA PALABRA NO SE PARTE** (ojo del founder, S113 ·
          C 2.2.3 — enmienda aditiva declarada a esta pieza, 76(d)).
          «Documentos» entraba en el mismo envoltorio y se cortaba a la mitad:
          «Documento» arriba, «s» sola abajo. *Una palabra partida no se lee
          como una etiqueta larga: se lee como un defecto de la app.*
          `adjustsFontSizeToFit` achica el rótulo hasta que entre — que es lo
          que el founder pidió: **se achica el rótulo, no la palabra**. Las de
          dos palabras siguen envolviendo, porque `numberOfLines={2}` les deja
          su segunda línea. */}
      <Texto variante="apoyo" centrado numberOfLines={2} ajustaParaEntrar>
        {accion.etiqueta}
      </Texto>
    </Pressable>
  )
}
