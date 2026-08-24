/**
 * CierreEnCurso — EL ESTADO MIENTRAS LA VENTANA CORRE (S104-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * 🔴 ESTA PIEZA NACE CON UN CHOQUE DE LETRA DECLARADO. Se construyó por
 * orden explícita («el estado "cierre en curso" para los 30 días») y **su
 * voz está deliberadamente recortada**, porque la política que la
 * respaldaría **no está firmada** y su otra mitad **no puede ejecutarse**.
 *
 * **Lo medido, con su ubicación:**
 *   · **`P15` está FIRMADA y sus CINCO cláusulas no mencionan 30 días.**
 *   · El único lugar donde viven: `POLITICAS_EPETPLACE.md:439`, bajo el
 *     encabezado *«Lo que la implementación TODAVÍA tiene que resolver»*,
 *     y rotulado ***«Propuesta:»***. No es firma.
 *   · `MODELO_LOGIN.md:106` los atribuye a P15 (*«P15: … → 30 días»*).
 *     **P15 no los dice.** Es una cita que la fuente no sostiene.
 *   · Esa propuesta termina en ***«luego borrado duro programado»***, y
 *     eso **choca de frente con el titular FIRMADO de P15** —*«la vuelve
 *     INALCANZABLE. No destruye el registro»*— y con `P23`.
 *   · **Y el borrado duro no es solo ilegal por letra: es inejecutable.**
 *     El censo de S103 midió **62 FKs a `auth.users`, 24 BLOQUEANTES** ⇒
 *     un `DELETE` rebota. Y donde NO rebota (21 `CASCADE`, entre ellas
 *     `familia_miembro` y `mascota_codueño`) **hace daño callado**: se
 *     lleva el vínculo con la mascota sin preguntarle a los otros
 *     cuidadores.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── ⇒ QUÉ DICE ESTA PIEZA, Y QUÉ SE NIEGA A DECIR ────────────────────
 * **Dice:** que el cierre está en curso, **en qué fecha se cumple**, y que
 * **se puede cancelar**. Las tres son ciertas bajo cualquier resolución de
 * la mesa.
 * **NO dice** —y no se agrega sin firma— que el día 0 «se borra todo» ni
 * nada equivalente. *Prometer una destrucción que la base rebota sería
 * exactamente el defecto que `R64` existe para cazar, cometido por la
 * pieza que lo vigila.*
 *
 * ── ⚠️ NACE INERTE, COMO EL CANDADO ──────────────────────────────────
 * Medido: **cero motor de cierre** en `packages/api` (sin `cerrar_cuenta`,
 * sin `anonimizar`, sin `baja_cuenta`). No hay quién ponga esta pantalla
 * en pantalla todavía. Se construye para que exista cuando el motor
 * llegue, y **la `fecha` la calcula el server** — jamás esta pieza: un
 * plazo legal derivado del reloj del teléfono es un plazo que se puede
 * mover cambiando la hora del aparato.
 *
 * ── LOS TRES TEMAS · MOVIMIENTO ───────────────────────────────────────
 * Todo del tema. **Movimiento propio: NINGUNO.** Una cuenta regresiva que
 * se anima es una cuenta regresiva que apura, y acá el producto no tiene
 * ningún interés en apurar a nadie (Ley 6). Memorial no degrada: es
 * información de estado, no ornamento.
 *
 * ── LA ESCALERA (Ley 11) ──────────────────────────────────────────────
 * No muestra datos del expediente ⇒ **§4b no aplica.** Declarado.
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import { useTraduccionUi } from '../i18n'
import { fechaLargaHumana } from '@epetplace/i18n'

export interface CierreEnCursoProps {
  /**
   * **LA FECHA en que se cierra (ISO), no los días que faltan.** La
   * calcula el SERVER y viaja como dato: derivar un plazo legal del reloj
   * del teléfono deja moverlo cambiando la hora del aparato.
   *
   * 🔴 **POR QUÉ UNA FECHA Y NO UN CONTADOR, y no es preferencia:**
   *   ① **Medido — el plural no se puede resolver acá.** i18next resuelve
   *      plurales por SUFIJO (`_one`/`_other`) y este riel tipa la clave
   *      LITERAL contra el diccionario español (`ClaveDe<D>`): la clave
   *      con sufijo no existe para el tipo, y la sin sufijo no existe en
   *      runtime. *Son incompatibles sin construir infraestructura nueva,
   *      y esta tanda no es el lugar.* La casa ya vive con esa deuda
   *      (`esperaConNumero` dice «1 segundos» y nadie la curó); **no se
   *      agrega un caso más.**
   *   ② **Y una fecha es mejor para un plazo legal, no un empate.** «12
   *      días» obliga a la persona a hacer una cuenta para saber cuándo;
   *      «el 23 de septiembre» es el dato que va a la agenda. *Un
   *      contador además envejece: se ve distinto según cuándo abriste la
   *      app, y el plazo no cambió.*
   */
  fecha: string
  /** Cancelar el cierre y volver. La pieza no sabe cómo: avisa. */
  onCancelar: () => void
  /** Mientras el motor cancela. */
  trabajando?: boolean
}

export function CierreEnCurso({ fecha, onCancelar, trabajando = false }: CierreEnCursoProps) {
  const { t, idioma } = useTraduccionUi()
  return (
    <View style={{ gap: spacing[4] }}>
      <Texto variante="titulo">{t('cierre.enCursoTitulo')}</Texto>

      {/* La fecha la formatea el RIEL (`fechaLargaHumana`), que ya resuelve
          el locale y la trampa de la medianoche UTC (D-312). La pieza no
          formatea fechas a mano. */}
      <Texto variante="cuerpo">{t('cierre.enCursoFecha', { fecha: fechaLargaHumana(fecha, idioma) })}</Texto>

      {/* 🔴 LA SALIDA ES UN SÓLIDO, y es la única vez que esta familia de
          pantallas le da el peso máximo a NO destruir. En el resto del
          arco el sólido es el acto destructivo; acá el acto ya ocurrió y
          lo que está en juego es deshacerlo. *La jerarquía sigue a lo que
          la persona vino a hacer, no al color de la pantalla.* */}
      <Boton
        etiqueta={t('cierre.cancelarCierre')}
        bloque
        cargando={trabajando}
        deshabilitado={trabajando}
        onPress={onCancelar}
      />

      <Texto variante="apoyo" color="secondary">
        {t('cierre.enCursoNota')}
      </Texto>
    </View>
  )
}
