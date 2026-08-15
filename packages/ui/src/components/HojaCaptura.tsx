/**
 * HojaCaptura — LA PUERTA ÚNICA DE «¿DE DÓNDE SALE ESTA FOTO?» (S99-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ NACE, Y NO ES «MENOS DUPLICACIÓN». Firma del founder:
 * ***«ya cargamos la foto de la mascota, ¿por qué crear un componente
 * diferente?»***
 *
 * El censo de S99-B midió que el PICKER nunca se duplicó —`capturaFoto`
 * es una sola implementación y todos la llaman—: **lo duplicado era la
 * PUERTA**, la hoja de «Tomar foto / Elegir de la galería», escrita a
 * mano en **diez lugares**.
 *
 * Y el número que convierte esto de prolijidad en defecto:
 *
 *   ⚠️ **EL CERROJO CONTRA EL DOBLE TAP VIVE EN 2 DE LOS 10 SITIOS —
 *      y los 2 son los que ya eran pieza** (`SelectorAvatar`,
 *      `EvidenciaFoto`). Los **ocho** que viven en `apps/` no lo tienen:
 *      dos toques antes del próximo render **lanzan dos pickers**.
 *
 * *No es que ocho pantallas hayan sido descuidadas: es que el cuidado
 * solo se hereda cuando hay de quién heredarlo.* Un sitio que copia la
 * anatomía copia lo que se VE; el cerrojo no se ve.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LA ANATOMÍA QUE GANA, Y POR QUÉ NO ES UN EMPATE ─────────────────
 * La casa tenía DOS hojas para la misma pregunta:
 *   · **dos `Boton secundario bloque` + la X** — `HojaFotoMascota`
 *     (S82-A), la del ALTA DE MASCOTA: **la que el founder señaló.**
 *   · **tres `Celda interactiva`** — `SelectorAvatar` (S45).
 *
 * Gana la primera, y **no por ser la que se citó**: la citó porque es la
 * que cumple la ley. **Ley 22c — un comando con consecuencias viste de
 * botón**; abrir la cámara es un comando, no una navegación. `Celda`
 * es la fila de una lista, y una lista promete que tocar te LLEVA.
 *
 * ── LAS DOS ACCIONES SON TODAS LAS ACCIONES ─────────────────────────
 * No hay tercera fila de salida. La Hoja ya sale por su X, por el swipe
 * y por el back — un «Por ahora no» adentro es el mismo camino escrito
 * dos veces, y la **REGLA DE ORO** del Norte dice *ante la duda, quitá
 * antes que agregar*. Cuando la salida es parte del FLUJO (la foto del
 * alta es opcional-pero-muy-sugerida) vive **en la pantalla**, con el
 * peso que esa decisión merece — como ya lo hace `PasoFoto`.
 *
 * ── LO QUE ESTA PIEZA NO DECIDE ─────────────────────────────────────
 * ① **La voz del permiso denegado.** La pieza REPORTA (`onPermisoDenegado`)
 *    y la pantalla DICE, porque lo que hay que decir cambia de verdad:
 *    en el alta *el permiso jamás frena el alta*; en el avatar hay una
 *    tarjeta de recuperación con «Abrir ajustes». Meter una sola voz acá
 *    obligaría a la mitad de los sitios a mentir.
 * ② **Las opciones de captura** (`recorteCuadrado`/`calidad`/`redimensionarA`).
 *    Pasan derecho a `capturaFoto`: 800 para un avatar, 1600 para un
 *    documento y el lado del carnet son decisiones MEDIDAS de cada
 *    dominio, no de la puerta. La puerta no re-decide lo que ya se midió.
 * ③ **La absorción de `SelectorAvatar`.** Su tercera fila («Por ahora no»
 *    de primera clase) es una decisión FIRMADA en S45; cambiarla es un
 *    gate de forma, no un refactor, y no viaja escondido adentro de una
 *    pieza nueva.
 */

import { useRef } from 'react'
import { View } from 'react-native'

import { Boton } from './Boton'
import { Hoja } from './Hoja'
import { capturarConCamara, capturarDeGaleria, type FotoCapturada, type OpcionesCaptura } from './capturaFoto'
import { spacing } from '../tokens/spacing'
import { useTraduccionUi } from '../i18n'

export interface HojaCapturaProps {
  visible: boolean
  /** Qué foto se está pidiendo, en voz del consumidor ("Foto de Zeus"). */
  titulo: string
  onCerrar: () => void
  onFoto: (foto: FotoCapturada) => void
  /** La pieza reporta; la pantalla dice (ver ① en la cabecera). */
  onPermisoDenegado: () => void
  /** Pasan derecho a `capturaFoto` — la puerta no re-decide (ver ②). */
  opciones?: OpcionesCaptura
}

export function HojaCaptura({ visible, titulo, onCerrar, onFoto, onPermisoDenegado, opciones }: HojaCapturaProps) {
  const { t } = useTraduccionUi()
  /** EL CERROJO — la razón de existir de esta pieza (ver cabecera). Es
   *  SINCRÓNICO (ref, no estado): dos toques antes del próximo render
   *  comparten el estado viejo, así que un `useState` llegaría tarde. */
  const lanzandoRef = useRef(false)

  /** ⚠️ SIN estado visible de «lanzando», Y ES DECISIÓN, NO OLVIDO: la
   *  primera línea del camino es `onCerrar()`, así que un `cargando` en
   *  estos botones se pintaría sobre una hoja que ya se está yendo — un
   *  indicador que nadie llega a ver es peso sin lector. La espera de
   *  verdad la muestra el sistema: el picker es una pantalla del SO. */
  async function capturar(via: 'camara' | 'galeria') {
    if (lanzandoRef.current) return
    lanzandoRef.current = true
    onCerrar()
    try {
      const fn = via === 'camara' ? capturarConCamara : capturarDeGaleria
      const r = await fn(opciones ?? {})
      if (r.tipo === 'permiso_denegado') {
        onPermisoDenegado()
        return
      }
      if (r.tipo === 'foto') onFoto(r.foto)
      // 'cancelada': no se dice nada — cancelar ya es su propia respuesta.
    } finally {
      lanzandoRef.current = false
    }
  }

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={titulo} conCerrar>
      <View style={{ gap: spacing[3], padding: spacing[4] }}>
        <Boton variante="secundario" bloque etiqueta={t('captura.camara')} onPress={() => void capturar('camara')} />
        <Boton variante="secundario" bloque etiqueta={t('captura.galeria')} onPress={() => void capturar('galeria')} />
      </View>
    </Hoja>
  )
}
