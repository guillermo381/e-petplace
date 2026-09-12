/**
 * CampoClaveAcceso — LOS 49 DÍGITOS DE UN COMPROBANTE (S115-B, prestador).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ES PARA **PEGAR**, no para tipear, y toda la pieza sale de ahí.
 *
 * 🔴 **POR QUÉ NO SON 49 CAJITAS.** `CampoCodigo` dibuja una caja por dígito
 * y es lo correcto **para 8**: se leen de un vistazo y entran en una línea.
 * A 49 esa anatomía se rompe por los dos lados —seis filas de cajas ocupan
 * media pantalla y ninguna se lee— así que acá va **un campo de texto con la
 * clave AGRUPADA de a cuatro**, que es como está impresa en el papel contra
 * el que la persona la va a comparar.
 *
 * *La forma correcta no se hereda del hermano: se elige por el número.*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── EL VALOR SE GUARDA CRUDO, SE MUESTRA AGRUPADO ───────────────────────
 * `onCambiar` entrega **49 dígitos sin espacios**. Los espacios son
 * presentación y nunca entran al valor: quien guardara «1234 5678…» rompería
 * el `^\d{49}$` de su propio validador, y el síntoma aparecería recién al
 * consultar contra el SRI.
 *
 * ── SE VALIDA AL PEGAR, NO AL TIPEAR ────────────────────────────────────
 * Igual que su hermana de identificación: el módulo 11 corre **cuando el
 * valor llega a 49** y al salir del campo. Marcar en rojo el dígito 12 de 49
 * es decirle a alguien que se equivocó cuando apenas empezó.
 *
 * ── SIN CÁMARA, Y ESO ES ALCANCE, NO OLVIDO ─────────────────────────────
 * Escanear el código de barras de un comprobante es **la** forma cómoda de
 * llenar este campo, y **no entra en esta tanda porque no entra nada
 * nativo**. Queda anotado como deseo en el acta —con su condición: el día que
 * la cámara ya esté en el binario por otra razón, esto es una prop más y un
 * botón al costado. *No se construye a medias hoy: un lector de códigos que
 * no se puede probar en un teléfono es motor sin puerta.*
 */

import { useState } from 'react'
import { View } from 'react-native'

import { Campo } from './Campo'
import { Tilde } from './tilde'
import {
  LARGO_CLAVE_ACCESO,
  agrupar,
  esClaveAccesoValida,
  soloDigitos,
} from './identificacion-ec'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

export interface CampoClaveAccesoProps {
  /** Los 49 dígitos, **crudos y sin espacios**. */
  valor: string
  onCambiar: (valor: string) => void


}

export function CampoClaveAcceso({ valor, onCambiar }: CampoClaveAccesoProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [tocado, setTocado] = useState(false)

  const completo = valor.length === LARGO_CLAVE_ACCESO
  const valido = completo && esClaveAccesoValida(valor)
  const seJuzga = completo || tocado

  return (
    <View>
      <Campo
        label={t('claveAcceso.etiqueta')}
        /* El placeholder enseña el FORMATO, que es su trabajo desde N11′ —
           y acá además muestra el agrupado de a cuatro, así la persona sabe
           que los espacios los pone la pieza y no tiene que escribirlos. */
        placeholder={t('claveAcceso.formato')}
        /* Agrupado para LEER; el valor sigue crudo (ver la cabecera). */
        value={agrupar(valor)}
        onChangeText={(crudo) => onCambiar(soloDigitos(crudo, LARGO_CLAVE_ACCESO))}
        onBlur={() => setTocado(true)}
        keyboardType="number-pad"
        autoCorrect={false}
        /* ⚠️ SIN `maxLength`: con los espacios del agrupado, el largo VISIBLE
           (61) no es el largo del valor (49) — un tope sobre el texto crudo
           cortaría el pegado justo antes de completarse. El corte lo hace
           `soloDigitos`, que cuenta dígitos. */
        error={seJuzga && !valido ? t('claveAcceso.invalida') : undefined}
        /* Mientras se llena, la ayuda cuenta cuántos van: en un número de 49
           dígitos «me faltan tres» es la única forma de saber si el pegado
           entró entero. */
        ayuda={
          seJuzga && !valido
            ? undefined
            : t('claveAcceso.progreso', { n: valor.length, total: LARGO_CLAVE_ACCESO })
        }
        iconoDer={valido ? <Tilde color={theme.status.successText} tamano={16} grosor={2.2} /> : undefined}
      />
    </View>
  )
}
