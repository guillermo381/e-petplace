/**
 * LAS CUATRO ACCIONES DEL PERFIL — Citas · Pasaporte · Nexo · Contanos
 * (S113-B · 2.2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EXACTAMENTE CUATRO, Y ES UNA TUPLA.**
 * ═══════════════════════════════════════════════════════════════════════════
 * *Con cinco, la fila deja de ser «lo que puedo hacer con Thor» y pasa a ser
 * un menú* — y un menú se lee de arriba abajo buscando, no de un vistazo. El
 * compilador no deja escribir la quinta. Mismo criterio que `AtajosCoach`.
 *
 * ── 🔴 UNA ACCIÓN APAGADA Y MUDA ES INEXPRESABLE ────────────────────────
 * O tiene `onPress`, o tiene `razonApagado` y la dice al tocarla. **Las dos a
 * la vez tampoco compilan.** *Un botón gris sin explicación es el defecto* —
 * y acá pasa de verdad: el pasaporte puede no estar activado todavía.
 *
 * ── EL ORBE ES LA TERCERA, Y NO SE DIBUJA COMO LAS OTRAS TRES ───────────
 * Nexo entra con `OrbeCoach`, no con un glifo: *es una presencia, no una
 * sección, y darle la misma cara que a «Citas» la convertiría en un ítem de
 * menú.* En memorial esa acción **no existe** y quedan tres.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3)** · **no decide a dónde va nada** · **no sabe si
 * el pasaporte está activo**: eso llega como `razonApagado`.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El tablero del perfil (C). **Entregada y no montada** — medido.
 */

import { Pressable, View } from 'react-native'

import { Icono, type IconoNombre } from './Icono'
import { OrbeCoach } from './OrbeCoach'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

const DISCO = 48

interface AccionBase {
  /** *«Citas»* — corta, ya redactada. */
  etiqueta: string
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
  citas: AccionPerfil & { glifo: IconoNombre }
  pasaporte: AccionPerfil & { glifo: IconoNombre }
  /** Nexo. **Se dibuja con el orbe**, no con un glifo — ver la cabecera. */
  nexo: AccionPerfil
  contanos: AccionPerfil & { glifo: IconoNombre }
  /** Qué hacer al tocar una apagada: la pantalla dice la razón **en una
   *  línea**. La pieza no elige el vehículo. */
  onRazonApagado?: (razon: string) => void
}

export function FilaAcciones({ citas, pasaporte, nexo, contanos, onRazonApagado }: FilaAccionesProps) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: spacing[2] }}>
      <Accion accion={citas} glifo={citas.glifo} onRazonApagado={onRazonApagado} />
      <Accion accion={pasaporte} glifo={pasaporte.glifo} onRazonApagado={onRazonApagado} />
      {/* ⛔ En memorial el Coach no existe y la fila queda con tres: *una
          acción que abre a Nexo en un duelo es exactamente lo que §7.1 apaga.* */}
      {esMemorial ? null : <Accion accion={nexo} onRazonApagado={onRazonApagado} />}
      <Accion accion={contanos} glifo={contanos.glifo} onRazonApagado={onRazonApagado} />
    </View>
  )
}

function Accion({
  accion,
  glifo,
  onRazonApagado,
}: {
  accion: AccionPerfil
  /** Ausente = es Nexo, y se dibuja con el orbe. */
  glifo?: IconoNombre
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
        {glifo === undefined ? (
          <OrbeCoach tamano={32} encendido={1} />
        ) : (
          <Icono nombre={glifo} tamano={24} registro="tinta" montaje="control" />
        )}
      </View>
      <Texto variante="apoyo">{accion.etiqueta}</Texto>
    </Pressable>
  )
}
