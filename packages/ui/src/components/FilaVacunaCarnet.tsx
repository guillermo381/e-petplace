/**
 * FILA DE VACUNA DEL CARNET — lo que el papel dice, y sólo eso (S113-B · 1.0).
 *
 * Cerrada: **nombre y fecha de aplicación**, con un punto de estado. Abierta:
 * una grilla de dos columnas con **todo lo que se sepa y nada más**.
 *
 * ── 🔴 LO QUE ES `null` NO APARECE ─────────────────────────────────────
 * Ni «—», ni «sin dato», ni una fila vacía. *Un guion es una respuesta, y acá
 * no hay respuesta: hay un campo que el carnet no traía.* La diferencia
 * importa porque el dueño lee la ficha para saber qué tiene, y una grilla con
 * seis guiones le dice «tu carnet está incompleto» cuando lo que pasa es que
 * esa vacuna no lleva esos campos.
 *
 * ── EL PUNTO DE ESTADO ES TINTA, NO SEMÁFORO ───────────────────────────
 * Un disco de color por fila convierte el carnet en un tablero de alarmas.
 * **El punto usa el status de la casa y el TEXTO dice el estado** — el color
 * acompaña, la palabra informa. *Quien no distingue colores tiene que poder
 * leer el carnet igual.*
 *
 * ⚠️ **`sinRefuerzo` no es «al día».** Que el carnet no diga cuándo toca la
 * próxima no quiere decir que falte mucho: quiere decir que no sabemos. Se
 * dibuja distinto y se dice distinto.
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Icono } from './Icono'
import { PuntoEstado } from './PuntoEstado'
import { Texto } from './Texto'
import { VisorFoto } from './VisorFoto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { detalleVisible, estadoDeVacuna, marcaDeEstado } from './vacunas-estado'

export interface FilaVacunaCarnetProps {
  nombre: string
  /** `YYYY-MM-DD`. Ya formateada por la pantalla — la pieza no traduce fechas. */
  fechaAplicadaTexto: string
  /** Crudas, para el estado. `null` = el carnet no lo traía. */
  fechaAplicada?: string | null
  fechaProxima?: string | null
  /** `YYYY-MM-DD` de hoy. **Entra por prop y no se lee del reloj**: así su
   *  gate puede pararse en cualquier día sin viajar en el tiempo. */
  hoy: string
  /** El detalle. **Lo que venga `null` no se dibuja** (ver cabecera). */
  detalle: {
    lote?: string | null
    laboratorio?: string | null
    via?: string | null
    aplicadaPor?: string | null
    proximaDosis?: string | null
    venceBiologico?: string | null
  }
  /** Las etiquetas de esos seis campos, en la voz de la pantalla (Ley 3). */
  etiquetas: {
    lote: string
    laboratorio: string
    via: string
    aplicadaPor: string
    proximaDosis: string
    venceBiologico: string
  }
  /** La voz del estado, ya compuesta con su número. */
  vozEstado: string
  /** La foto del carnet de donde salió, si la hay. */
  fotoUrl?: string | null
  /** Para el lector de pantalla: *«Ver el carnet de …»*. */
  vozFoto?: string
}

export function FilaVacunaCarnet({
  nombre,
  fechaAplicadaTexto,
  fechaAplicada,
  fechaProxima,
  hoy,
  detalle,
  etiquetas,
  vozEstado,
  fotoUrl,
  vozFoto,
}: FilaVacunaCarnetProps) {
  const { theme } = useTheme()
  const [abierta, setAbierta] = useState(false)
  const [verFoto, setVerFoto] = useState(false)
  const estado = estadoDeVacuna({ fechaAplicada, fechaProxima }, hoy)
  /* ☠️ Acá vivía un `switch` de colores COPIADO del de `ListaPlanVacunal`,
     los dos con una rama `default`. **La clasificación es UNA y vive en
     `marcaDeEstado`**: con el `default`, una clase nueva se dibujaba idéntica
     a otra sin que nada fallara. */
  const marca = marcaDeEstado(estado, {
    exito: theme.status.successText,
    aviso: theme.status.warningText,
    peligro: theme.status.dangerText,
    tinta: theme.text.secondary,
  })

  /* Los seis campos, filtrados. La pieza itera lo que salga: **no hay una
     rama por campo, así que no hay dónde olvidarse de uno.** */
  const campos = detalleVisible([
    { etiqueta: etiquetas.lote, valor: detalle.lote },
    { etiqueta: etiquetas.laboratorio, valor: detalle.laboratorio },
    { etiqueta: etiquetas.via, valor: detalle.via },
    { etiqueta: etiquetas.aplicadaPor, valor: detalle.aplicadaPor },
    { etiqueta: etiquetas.proximaDosis, valor: detalle.proximaDosis },
    { etiqueta: etiquetas.venceBiologico, valor: detalle.venceBiologico },
  ])

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={`${nombre} · ${fechaAplicadaTexto} · ${vozEstado}`}
        onPress={() => setAbierta((v) => !v)}
        style={{ minHeight: 44, justifyContent: 'center', paddingVertical: spacing[2], gap: spacing[1] }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          {/* El punto: acompaña. **La palabra es la que informa.** */}
          <PuntoEstado {...marca} />
          <Texto variante="cuerpo" numberOfLines={1}>
            {nombre}
          </Texto>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingLeft: spacing[4] }}>
          <Texto variante="dato">{fechaAplicadaTexto}</Texto>
          <Texto variante="apoyo">{vozEstado}</Texto>
        </View>
      </Pressable>

      {abierta && (campos.length > 0 || fotoUrl != null) ? (
        <View style={{ paddingLeft: spacing[4], paddingBottom: spacing[3], gap: spacing[3] }}>
          {/* La grilla de dos columnas. `flexWrap` y no un grid tecleado: con
              uno, tres o cinco campos la última fila queda como quede, y eso
              es correcto — **la grilla se adapta a lo que hay, no al revés.** */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {campos.map((c) => (
              <View key={c.etiqueta} style={{ width: '50%', paddingRight: spacing[3], paddingBottom: spacing[3] }}>
                <Texto variante="apoyo">{c.etiqueta}</Texto>
                <Texto variante="cuerpo">{c.valor}</Texto>
              </View>
            ))}
          </View>
          {fotoUrl != null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={vozFoto ?? nombre}
              onPress={() => setVerFoto(true)}
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.md,
                overflow: 'hidden',
                backgroundColor: theme.bg.hundido,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icono nombre="carnet" tamano={22} registro="tinta" montaje="control" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {fotoUrl != null ? (
        <VisorFoto visible={verFoto} fotos={[fotoUrl]} etiqueta={vozFoto} onCerrar={() => setVerFoto(false)} />
      ) : null}
    </View>
  )
}
