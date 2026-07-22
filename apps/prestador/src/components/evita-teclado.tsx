/**
 * S73-B 🔴 (hallazgo de campo del founder: "escribí a ciegas — el campo
 * quedó debajo del teclado"): EL ENVOLTORIO DE TECLADO de las pantallas
 * con formulario del prestador.
 *
 * El porqué de raíz: el manifest trae `windowSoftInputMode="adjustResize"`
 * (literal), pero SDK 57 fuerza EDGE-TO-EDGE en Android y en edge-to-edge
 * el sistema NO achica la ventana — adjustResize queda letra muerta y el
 * campo bajo queda tapado. La receta que SÍ está probada en dispositivo
 * es la de la Hoja (packages/ui/src/components/Hoja.tsx:274-278, gates
 * S45+): KeyboardAvoidingView ios='padding' / android='height'.
 *
 * Composición LOCAL del app (patrón techo-oficio/filtro-oficio): si el
 * patrón lo pide el cliente también, la enmienda en packages/ui es
 * pedido a la A. Envuelve al ScrollView de la pantalla; no toca su
 * contenido ni sus insets.
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

export function EvitaTeclado({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
