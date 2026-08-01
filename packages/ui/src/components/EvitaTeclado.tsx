/**
 * EvitaTeclado — EL envoltorio de teclado de la casa (S73-B nace local
 * en prestador; S81 SUBE a packages/ui por orden de mesa — D-498: la
 * casa tiene UNA; su propio JSDoc local ya lo pedía: "si el patrón lo
 * pide el cliente, la enmienda en packages/ui" — el cliente lo pedía
 * CUATRO veces en crudo, byte-idénticas).
 *
 * El porqué de raíz (S73-B, hallazgo de campo del founder — "escribí a
 * ciegas"): el manifest trae `windowSoftInputMode="adjustResize"`, pero
 * SDK 57 fuerza EDGE-TO-EDGE en Android y ahí el sistema NO achica la
 * ventana — adjustResize queda letra muerta y el campo bajo queda
 * tapado. La receta probada en dispositivo es la de la Hoja (gates
 * S45+): KeyboardAvoidingView ios='padding' / android='height'.
 *
 * Envuelve al ScrollView de la pantalla; no toca su contenido ni sus
 * insets. Toda pantalla con Campo lo porta (el barrido D-498 corre
 * sobre su censo).
 */
import type { ReactNode } from 'react'
import { KeyboardAvoidingView } from 'react-native'

export function EvitaTeclado({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      // S83-B36 — `padding` EN LAS DOS PLATAFORMAS. `height` encoge el
      // CONTENEDOR contando con que la ventana se achique, y bajo
      // edge-to-edge (SDK 57) la ventana YA NO SE ACHICA: el contenedor
      // se encoge contra nada y el campo enfocado queda debajo del
      // teclado. Es la misma familia de L-193 (la premisa heredada que
      // nadie fechó — `adjustResize` es letra muerta bajo edge-to-edge).
      // `padding` no depende de eso: empuja el contenido con el inset del
      // teclado, que sí llega.
      behavior="padding"
      style={{ flex: 1 }}
    >
      {children}
    </KeyboardAvoidingView>
  )
}
