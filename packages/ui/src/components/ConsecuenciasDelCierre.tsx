/**
 * ConsecuenciasDelCierre — «ESTO SE VA, ESTO QUEDA» (S104-B · P15 §4).
 *
 * ═══════════════════════════════════════════════════════════════════
 * LA CLÁUSULA QUE SOSTIENE, verbatim: *«**Se le dice EXACTAMENTE eso
 * antes de confirmar.** No «vamos a borrar todo»: qué se va, qué queda y
 * por qué.»* Y el titular firmado que la ordena: ***«Cerrar la cuenta la
 * vuelve INALCANZABLE. No destruye el registro.»***
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── 🔴 LA DECISIÓN ESTRUCTURAL: CADA CONSECUENCIA NOMBRA A SU MOTOR ───
 * La forma obvia era dos listas de strings. **Se descartó, y ésta es la
 * pieza entera:** cada ítem lleva un **`respaldo`** — el nombre del
 * wrapper de `@epetplace/api` que EJECUTA ese efecto, o el literal
 * `'sin_motor'`.
 *
 * **Por qué:** una pantalla de cierre es el lugar del producto donde una
 * promesa falsa cuesta más — le decís a alguien que su dato se va, se va
 * tranquilo, y el dato sigue ahí. *Con dos listas de strings, prometer de
 * más es tan fácil como escribir una línea, y nada lo nota.* Acá **no se
 * puede agregar una consecuencia sin declarar quién la cumple**, y
 * `'sin_motor'` es una palabra que alguien tiene que TECLEAR: deja de ser
 * un olvido y pasa a ser una afirmación que un juez puede contar.
 * ⇒ **`R64` cuenta los `'sin_motor'` con trinquete solo-baja y verifica
 * que los demás nombren un símbolo que `@epetplace/api` exporta de
 * verdad.** El estado malo no se vigila con disciplina: se vuelve
 * declarado y medible.
 *
 * ⚠️ **HOY EL MOTOR DE CIERRE ES CERO** (medido: cero `cerrar_cuenta`,
 * cero `anonimizar`, cero `baja_cuenta` en `packages/api`). ⇒ un
 * consumidor honesto va a montar casi todo con `'sin_motor'`, **y eso es
 * correcto**: la pieza no existe para esconder que el motor falta, existe
 * para que **falte a la vista y con número**.
 *
 * ── 🔴 LO QUE ESTA PIEZA NO ESCRIBE, Y ES LO MÁS IMPORTANTE ───────────
 * **No trae las listas adentro.** Podría: P15 y el censo de S103 dicen
 * bastante. **No se hizo a propósito** — lo que se va y lo que queda
 * depende de qué construyó el motor, y **hoy no hay motor**. Hornear la
 * lista acá la volvería letra muerta el día que el motor haga otra cosa,
 * y nadie se enteraría: *la pieza seguiría diciendo la verdad de ayer con
 * cara de verdad de hoy.* Las listas las pone quien conoce el motor.
 *
 * ── LAS DOS COLUMNAS SON OBLIGATORIAS, Y NO ES SIMETRÍA ───────────────
 * `seVa` y `queda` **no tienen default**. Montar solo la primera daría
 * *«vamos a borrar todo»*, que es **exactamente la frase que P15 §4
 * prohíbe con todas las letras**. Y montar solo la segunda sería
 * tranquilizar sin decir el costo. *La política pide las dos mitades; la
 * pieza no deja montar una.*
 *
 * ── EL «POR QUÉ» ES OBLIGATORIO EN LO QUE QUEDA ───────────────────────
 * P15 §4 pide *«qué se va, qué queda **y por qué**»*. Lo que se va se
 * explica solo; **lo que QUEDA es lo que necesita razón** —«tu factura,
 * porque la ley obliga a conservarla»—. Sin eso, la columna de la derecha
 * se lee como *«nos guardamos tus cosas»*. Por eso `razon` es obligatorio
 * en `queda` y opcional en `seVa`.
 *
 * ── LOS TRES TEMAS · MOVIMIENTO ───────────────────────────────────────
 * Todo del tema. **Movimiento propio: NINGUNO** (Ley 6) — nada se anima
 * en la pantalla donde alguien decide irse. Memorial no degrada: esto no
 * es ornamento, es información legal.
 *
 * ── LA ESCALERA (Ley 11) ──────────────────────────────────────────────
 * Habla DE datos del expediente pero **no muestra ninguno** — nombra
 * categorías, jamás una mascota ni un evento. §4b no aplica. Declarado.
 */

import { View } from 'react-native'

import { Texto } from './Texto'
import { Separador } from './Separador'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/**
 * Quién EJECUTA el efecto: el nombre del wrapper de `@epetplace/api`, o
 * el literal `'sin_motor'` si todavía no existe.
 *
 * ⚠️ **`'sin_motor'` no es un escape cómodo: es una declaración que `R64`
 * cuenta y que solo puede BAJAR.** Ver la cabecera.
 */
export type RespaldoDeConsecuencia = string

export interface Consecuencia {
  /** Qué, en voz de la persona: «tu forma de entrar», «tus recordatorios». */
  texto: string
  /**
   * Por qué. **Obligatorio en `queda`** (P15 §4) — sin razón, conservar se
   * lee como quedarse con algo. Opcional en `seVa`: irse se explica solo.
   */
  razon?: string
  /** 🔴 Quién lo ejecuta. Ver `RespaldoDeConsecuencia` y `R64`. */
  respaldo: RespaldoDeConsecuencia
}

export interface ConsecuenciasDelCierreProps {
  /** Lo que la persona pierde. Sin default: ver la cabecera. */
  seVa: Consecuencia[]
  /** Lo que se conserva, CADA UNO con su razón. Sin default. */
  queda: Array<Consecuencia & { razon: string }>
}

function Columna({ titulo, items }: { titulo: string; items: Consecuencia[] }) {
  const { theme } = useTheme()
  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="titulo">{titulo}</Texto>
      {items.map((c, i) => (
        <View key={i} style={{ gap: spacing[1] }}>
          <Texto variante="cuerpo">{c.texto}</Texto>
          {c.razon !== undefined && (
            <Texto variante="apoyo" color="secondary">
              {c.razon}
            </Texto>
          )}
        </View>
      ))}
      {items.length === 0 && (
        /* Una columna vacía NO se calla: decirlo es más honesto que
           dejar un hueco que se lee como «no hay nada que decir acá».
           En una pantalla legal, el silencio se interpreta a favor de
           quien la escribió. */
        <Texto variante="apoyo" color="secondary">
          {theme.mode === 'memorial' ? '—' : '—'}
        </Texto>
      )}
    </View>
  )
}

export function ConsecuenciasDelCierre({ seVa, queda }: ConsecuenciasDelCierreProps) {
  const { t } = useTraduccionUi()
  return (
    <View style={{ gap: spacing[5] }}>
      <Columna titulo={t('cierre.seVa')} items={seVa} />
      <Separador />
      <Columna titulo={t('cierre.queda')} items={queda} />
      {/* EL TITULAR DE P15, siempre visible y no opcional: es la frase que
          resume las dos columnas y la única que la política firmó
          textualmente. Si el consumidor pudiera omitirla, la pantalla
          volvería a poder leerse como «se borra todo». */}
      <Texto variante="apoyo" color="secondary">
        {t('cierre.titular')}
      </Texto>
    </View>
  )
}
