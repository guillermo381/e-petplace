/**
 * CONFIGURACIÓN DEL PASAPORTE — qué se muestra a un desconocido (S113-B · 1.3).
 *
 * Tres interruptores y el contacto de emergencia. **Cada interruptor apaga su
 * campo en TODAS las superficies** —la tarjeta, la placa y la página pública—
 * porque lo apagado no se filtra al dibujar: **no viaja** (`filtrarPorVisibilidad`).
 * *Esconderlo en la vista y mandarlo igual sería peor que no ofrecer el
 * interruptor: la familia creería que lo apagó.*
 *
 * ── 🔴 CADA UNO DICE QUÉ EXPONE, NO CÓMO SE LLAMA EL CAMPO ─────────────
 * *«Mostrar contacto» es una decisión sobre quién puede llamarte a tu casa.*
 * La voz la pone la pantalla, pero esta pieza le exige una por interruptor y
 * una explicación debajo: **un permiso sin consecuencia escrita se activa sin
 * pensarlo.**
 *
 * ⚠️ **El contacto de emergencia no tiene interruptor propio**: si «Mostrar
 * contacto» está apagado, no hay a quién llamar y la página lo dice. *Dos
 * apagados para lo mismo dejan a la familia sin saber cuál manda.*
 */

import { View } from 'react-native'

import { Interruptor } from './Interruptor'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import type { VisibilidadPasaporte } from './pasaporte-qr'

/** Un interruptor con su consecuencia escrita. */
export interface OpcionPasaporte {
  etiqueta: string
  /** *«Quien encuentre a Thor va a ver tu teléfono»* — la consecuencia, no la
   *  descripción del campo. */
  consecuencia: string
}

export interface ConfiguracionPasaporteProps {
  visibilidad: VisibilidadPasaporte
  onCambiar: (v: VisibilidadPasaporte) => void
  opciones: { contacto: OpcionPasaporte; salud: OpcionPasaporte; chip: OpcionPasaporte }
  /** El contacto de emergencia. **Sólo se dibuja con `visibilidad.contacto`**:
   *  configurar un teléfono que no se va a mostrar es trabajo para nada. */
  contacto?: {
    tituloSeccion: string
    nombre: React.ReactNode
    telefono: React.ReactNode
    mensaje: React.ReactNode
  }
}

export function ConfiguracionPasaporte({
  visibilidad,
  onCambiar,
  opciones,
  contacto,
}: ConfiguracionPasaporteProps) {
  const fila = (clave: keyof VisibilidadPasaporte, o: OpcionPasaporte) => (
    <View key={clave} style={{ gap: spacing[1] }}>
      <Interruptor
        encendido={visibilidad[clave]}
        etiqueta={o.etiqueta}
        onCambio={(v) => onCambiar({ ...visibilidad, [clave]: v })}
      />
      {/* 🔴 La consecuencia, siempre: un permiso sin ella se activa sin
          pensarlo — y éste decide qué ve un desconocido. */}
      <Texto variante="apoyo">{o.consecuencia}</Texto>
    </View>
  )

  return (
    <View style={{ gap: spacing[5] }}>
      {fila('contacto', opciones.contacto)}
      {fila('salud', opciones.salud)}
      {fila('chip', opciones.chip)}

      {/* Sin «Mostrar contacto» no hay a quién llamar: configurar un teléfono
          que no se va a mostrar es trabajo para nada. */}
      {visibilidad.contacto && contacto !== undefined ? (
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{contacto.tituloSeccion}</Texto>
          {contacto.nombre}
          {contacto.telefono}
          {contacto.mensaje}
        </View>
      ) : null}
    </View>
  )
}
