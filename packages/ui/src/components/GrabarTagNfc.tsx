/**
 * GRABAR LA PLACA — la Hoja que acompaña el gesto (S113-B · 1.3 · B6).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ESTA PIEZA NO TOCA NFC, Y ES UNA DECISIÓN.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Escribir un tag exige **módulo nativo**, y lo nativo **no viaja por OTA**:
 * si `packages/ui` importara NFC, el design system entero dejaría de poder
 * publicarse sin una build. ⇒ **la escritura la hace quien tiene la capacidad
 * y acá llega el `estado`.** Mismo reparto con el que el dictado vive en el
 * prestador y no acá.
 *
 * ── 🔴 EL FALLO ES EL ÚNICO ROJO, Y EXIGE SU SALIDA ─────────────────────
 * `EstadoTag` es una unión discriminada: **`fallo` sin `onReintentar` no
 * compila.** Es el estado más caro de la pantalla — la persona acercó la
 * placa, algo salió mal, y sin reintento se queda con una placa a medio
 * escribir sin saber si sirve.
 *
 * Y **«ya estaba activada» y «no es una placa de e-PetPlace» NO son errores**:
 * son hechos del mundo, y pintarlos de alarma le cobra a la persona algo que
 * no hizo. *Misma doctrina con la que un código de firma vencido no se pinta
 * de rojo: lo dice el texto, no el color.*
 *
 * ── 🔴 MIENTRAS ESCRIBE, LA HOJA NO SE CIERRA DE UN TOQUE AL COSTADO ────
 * *Cerrar a mitad de una escritura deja la placa a medias y a la persona sin
 * saberlo.* Con `enCurso` la Hoja pierde su cierre; recién al terminar
 * vuelve. **No es una Hoja «modal a la fuerza»**: es que en esas dos fases no
 * hay nada que cancelar sin romper algo.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3)**: cada estado trae su frase ya redactada, con el
 * nombre adentro. **No sabe si el teléfono tiene NFC** — eso lo decide quien
 * la monta, y `AccionesPasaporte` ya lo resuelve: *sin capacidad la puerta no
 * se dibuja, jamás se dibuja apagada.*
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * El pasaporte **no existe** en memorial (`sePintaPasaporte`), y una placa es
 * su cuerpo físico: *sirve para encontrar a alguien que se perdió, y
 * ofrecérsela a una familia que ya despidió a su mascota es no haber leído la
 * pantalla.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * `AccionesPasaporte.onGrabarNfc` (C). **Entregada y no montada** — y esta
 * vez está medido: `git grep GrabarTagNfc -- apps/` da cero.
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { EsperaDeMarca } from '../brand/EsperaDeMarca'
import { Hoja } from './Hoja'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import { sePintaPasaporte } from './pasaporte-qr'
import { enCurso, esAlarma, type EstadoTag } from './tag-nfc'

export type { EstadoTag } from './tag-nfc'
export { enCurso, termino, esAlarma } from './tag-nfc'

export interface GrabarTagNfcProps {
  visible: boolean
  onCerrar: () => void
  /** *«Activar la placa de Thor»* — ya compuesto. */
  titulo: string
  estado: EstadoTag
  /** *«Acercá la placa a la parte de atrás del teléfono»* — la instrucción del
   *  gesto, que la pieza no compone. */
  vozAcercar: string
  /** *«Escribiendo…»* */
  vozEscribiendo: string
  /** *«Ver la placa»* — sólo si `ya_estaba` trae `onVerla`. */
  vozVerla?: string
  /** *«Probar de nuevo»* */
  vozReintentar: string
  /** *«Listo»* — cierra, y sólo aparece cuando ya terminó. */
  vozCerrar: string
  /** 🔴 **Del pasaporte, no de la placa.** En memorial no se dibuja. */
  enMemoria: boolean
}

export function GrabarTagNfc({
  visible,
  onCerrar,
  titulo,
  estado,
  vozAcercar,
  vozEscribiendo,
  vozVerla,
  vozReintentar,
  vozCerrar,
  enMemoria,
}: GrabarTagNfcProps) {
  /* ⛔ El pasaporte no existe en memorial, y la placa es su cuerpo. */
  if (!sePintaPasaporte({ enMemoria })) return null

  const vivo = enCurso(estado)

  return (
    <Hoja
      visible={visible}
      /* 🔴 Mientras escribe no hay cierre. Ver la cabecera. */
      onCerrar={vivo ? () => {} : onCerrar}
      conCerrar={!vivo}
      titulo={titulo}
    >
      <View style={{ gap: spacing[5], alignItems: 'center', paddingVertical: spacing[4] }}>
        {estado.fase === 'acercar' ? (
          <>
            {/* La única animación de espera legal de la casa. *Un spinner
                genérico acá diría «cargando», y no está cargando nada: está
                esperando un gesto de la persona.* */}
            <EsperaDeMarca />
            <Texto centrado>{vozAcercar}</Texto>
          </>
        ) : null}

        {estado.fase === 'escribiendo' ? (
          <>
            <EsperaDeMarca />
            <Texto centrado>{vozEscribiendo}</Texto>
          </>
        ) : null}

        {estado.fase === 'lista' ? <Texto centrado>{estado.voz}</Texto> : null}

        {estado.fase === 'ya_estaba' ? (
          <>
            {/* Sin alarma: la placa funciona, sólo que no es de esta mascota. */}
            <Texto centrado>{estado.voz}</Texto>
            {estado.onVerla !== undefined && vozVerla !== undefined ? (
              <Boton variante="secundario" tamaño="sm" etiqueta={vozVerla} onPress={estado.onVerla} />
            ) : null}
          </>
        ) : null}

        {estado.fase === 'ajena' ? <Texto centrado>{estado.voz}</Texto> : null}

        {estado.fase === 'fallo' ? (
          <>
            {/* 🔴 El único que habla en color de alarma — y lo dice el TEXTO
                además del color, porque el color solo no informa. */}
            <Texto centrado color={esAlarma(estado) ? 'danger' : 'primary'}>
              {estado.voz}
            </Texto>
            <Boton tamaño="sm" etiqueta={vozReintentar} onPress={estado.onReintentar} />
          </>
        ) : null}

        {/* Cerrar aparece SÓLO cuando ya no hay nada en curso. */}
        {vivo ? null : (
          <Boton
            variante="secundario"
            tamaño="sm"
            etiqueta={vozCerrar}
            onPress={onCerrar}
          />
        )}
      </View>
    </Hoja>
  )
}
