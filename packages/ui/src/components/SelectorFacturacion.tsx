/**
 * SelectorFacturacion — «DATOS PARA TU FACTURA» (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DOS opciones grandes y tocables, una elegida. Y la que **no se puede
 * elegir se ve deshabilitada CON SU RAZÓN debajo**, jamás escondida.
 *
 * 🔴 **POR QUÉ NO SE ESCONDE, que es la decisión de la pieza:** cuando el
 * total pasa el tope, «Consumidor final» deja de estar disponible. Sacarla de
 * la pantalla haría que la persona que compró dos veces vea DOS pantallas
 * distintas sin entender por qué —y la segunda vez le pediríamos la cédula
 * sin explicación—. Dejarla a la vista, apagada y con el motivo escrito,
 * convierte un límite en una **regla que se aprende**. Es la Ley 13 aplicada
 * al permiso: *el error jamás se disfraza de vacío*, y una opción ausente es
 * la forma más silenciosa del vacío.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── EL TOPE LLEGA POR PROPS, SIEMPRE ────────────────────────────────────
 * `topeConsumidorFinal` es un **número que la ley mueve** (en Ecuador ya se
 * movió), y esta pieza no lo conoce: lo recibe y lo interpola en su voz. Lo
 * mismo con la tarifa del IVA, que acá directamente no existe. **Lo vigila
 * `R84`** — cero «50», cero «15», cero «IVA» escritos adentro.
 *
 * ── EL DESPLIEGUE VA ABAJO, NO EN OTRA PANTALLA ─────────────────────────
 * Elegir «Con mis datos» abre el formulario **en el lugar** (chevron ⌄ de
 * E14): la persona no pierde de vista lo que estaba haciendo. Quien lo monta
 * pasa el `CampoIdentificacion` como hijo — la pieza **no lo construye
 * adentro** para no atarse a un formulario concreto, y así el prestador
 * puede montar el suyo.
 *
 * ── EL MICROTEXTO DE LO DEDUCIBLE SE ENCIENDE DESDE AFUERA ──────────────
 * `mostrarDeducible` nace en `false`. **Afirmar que un gasto es deducible es
 * una afirmación fiscal**, y esta pieza no tiene con qué sostenerla: la
 * enciende quien sepa (A, cuando el contador confirme). *Un default en `true`
 * convertiría una pregunta abierta en una promesa impresa en la pantalla de
 * pago.*
 */

import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { Interruptor } from './Interruptor'
import { Texto } from './Texto'
import { Chevron } from './chevron'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/** Las dos formas de facturar. Vocabulario del SRI, no inventado. */
export type ModoFacturacion = 'consumidorFinal' | 'misDatos'

export interface SelectorFacturacionProps {
  elegido: ModoFacturacion
  onElegir: (modo: ModoFacturacion) => void
  /** El total de la compra, para compararlo contra el tope. */
  total: number
  /** El tope por encima del cual «Consumidor final» deja de estar
   *  disponible. **Por props: la ley lo mueve** (ver la cabecera). */
  topeConsumidorFinal: number
  /** El monto ya formateado del tope — la pieza **no formatea plata**: eso
   *  es de `PrecioText` y del riel de moneda, y una tercera forma de
   *  escribir un monto sería la divergencia que esos dos existen para
   *  cerrar. */
  topeFormateado: string
  /** El formulario, montado por quien la usa. Se dibuja SOLO con
   *  `misDatos` elegido. */
  children?: ReactNode
  /** El switch de recordar. `undefined` = no se ofrece guardar. */
  guardar?: boolean
  onGuardar?: (guardar: boolean) => void
  /** ⚠️ Ver la cabecera: nace apagado a propósito. */
  mostrarDeducible?: boolean
  acento?: 'control' | 'oficio'
}

/** UNA receta para las dos opciones — mismo peso, mismo tamaño. Es el
 *  precedente exacto de `TarjetaDestinoPlata`: *una ley que depende de que el
 *  consumidor la respete no está puesta.* */
const RECETA_OPCION = {
  gap: spacing[1],
  padding: spacing[4],
  borderRadius: radius.suave,
  minHeight: 44,
} as const

export function SelectorFacturacion({
  elegido,
  onElegir,
  total,
  topeConsumidorFinal,
  topeFormateado,
  children,
  guardar,
  onGuardar,
  mostrarDeducible = false,
  acento = 'control',
}: SelectorFacturacionProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()

  /* El color se resuelve UNA vez y fuera del recorrido — dos resoluciones son
     dos oportunidades de que una quede distinta (idioma de
     `TarjetaDestinoPlata`). `controlBg` no existe en memorial. */
  const color = acento === 'oficio' ? theme.accent.primary : theme.accent.control
  const tinte = 'controlBg' in theme.accent && acento !== 'oficio' ? theme.accent.controlBg : theme.bg.overlay

  const superaTope = total > topeConsumidorFinal

  const OPCIONES: readonly { modo: ModoFacturacion; titulo: string; voz: string }[] = [
    {
      modo: 'consumidorFinal',
      titulo: t('facturacion.consumidorFinal'),
      voz: t('facturacion.consumidorFinalVoz'),
    },
    { modo: 'misDatos', titulo: t('facturacion.misDatos'), voz: t('facturacion.misDatosVoz') },
  ]

  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="seccion">{t('facturacion.titulo')}</Texto>

      <View style={{ gap: spacing[2] }}>
        {OPCIONES.map(({ modo, titulo, voz }) => {
          /* Sólo «Consumidor final» puede apagarse, y sólo por el tope. */
          const apagada = modo === 'consumidorFinal' && superaTope
          const marcada = elegido === modo && !apagada

          return (
            <View key={modo} style={{ gap: spacing[1] }}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: marcada, disabled: apagada }}
                accessibilityLabel={titulo}
                accessibilityHint={apagada ? t('facturacion.topeRazon', { tope: topeFormateado }) : voz}
                disabled={apagada}
                onPress={() => onElegir(modo)}
                style={{
                  ...RECETA_OPCION,
                  borderWidth: 1.5,
                  borderColor: marcada ? color : theme.border.default,
                  backgroundColor: marcada ? tinte : theme.bg.card,
                  /* Apagada = SERENA, jamás error (Ley 22: apagado es estado,
                     no falla). No pasó nada malo: la ley pide otra cosa. */
                  opacity: apagada ? 0.55 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  <View style={{ flex: 1 }}>
                    <Texto variante="cuerpo">{titulo}</Texto>
                  </View>
                  {/* El chevron ⌄ dice que ESTA opción despliega abajo (E14).
                      Sólo en la que despliega, y sólo cuando está elegida: un
                      chevron en la otra prometería algo que no pasa.
                      ⚠️ Se monta la PIEZA `Chevron`, jamás el path suelto —
                      es la regla que `chevron.tsx` declara desde adentro. */}
                  {modo === 'misDatos' && marcada ? <Chevron direccion="abajo" /> : null}
                </View>
                <Texto variante="apoyo">{voz}</Texto>
              </Pressable>

              {/* LA RAZÓN, en gris y debajo — el porqué de la cabecera. */}
              {apagada ? (
                <Texto variante="apoyo">{t('facturacion.topeRazon', { tope: topeFormateado })}</Texto>
              ) : null}
            </View>
          )
        })}
      </View>

      {elegido === 'misDatos' ? (
        <View style={{ gap: spacing[4] }}>
          {children}

          {guardar === undefined || onGuardar === undefined ? null : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <View style={{ flex: 1 }}>
                <Texto variante="cuerpo">{t('facturacion.guardar')}</Texto>
              </View>
              <Interruptor
                encendido={guardar}
                onCambio={onGuardar}
                etiqueta={t('facturacion.guardar')}
                registro={acento}
              />
            </View>
          )}

          {mostrarDeducible ? <Texto variante="apoyo">{t('facturacion.deducible')}</Texto> : null}
        </View>
      ) : null}
    </View>
  )
}
