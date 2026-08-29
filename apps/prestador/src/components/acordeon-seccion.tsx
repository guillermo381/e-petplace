/**
 * AcordeonSeccion — una sección que se pliega (S107-C).
 *
 * ⚠️ **ANATOMÍA LOCAL, PROMOCIÓN DECLARADA** (precedente `GateRoto`/`GateAjeno`,
 * S79). `packages/ui` **no tiene acordeón** —medido— y esta pantalla necesita
 * dos. Se construye acá para no bloquear, y **queda declarado como candidato a
 * pieza de la casa**: el día que una segunda pantalla lo necesite, sube a `ui`
 * y ésta muere en el mismo acto (Ley 37). *Un tercer consumidor sin promoción
 * es la duplicación que `D-645` acaba de costar.*
 *
 * ── POR QUÉ EL ESTADO ES DEL CONSUMIDOR ─────────────────────────────────
 * `abierto` + `onAlternar` en vez de estado propio: la pantalla decide **qué
 * nace abierto y qué nace cerrado**, y eso es una decisión de producto (los
 * horarios ya están guardados y no hace falta verlos; los precios sí).
 * *Un acordeón que se acuerda solo de su estado se lo impone a todos.*
 *
 * ── ACCESIBILIDAD ───────────────────────────────────────────────────────
 * La cabecera es un `button` con `accessibilityState.expanded` — quien no ve
 * la flecha **necesita que el lector le diga si está abierto**.
 */

import type { ReactNode } from 'react';
import Animated from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { Chevron, Texto, spacing, useTheme, usePresionado } from '@epetplace/ui';

export function AcordeonSeccion({
  titulo,
  detalle,
  abierto,
  onAlternar,
  children,
}: {
  titulo: string;
  /** Lo que resume el contenido cuando está cerrado. Ausente = no se dibuja. */
  detalle?: string;
  abierto: boolean;
  onAlternar: () => void;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  const { handlers, estiloPresionado } = usePresionado(0.99);

  return (
    <View style={{ gap: spacing[3] }}>
      <Pressable
        onPress={onAlternar}
        {...handlers}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        accessibilityLabel={titulo}
      >
        {/* La física del pressed va en el `Animated.View` y no en el
            `Pressable`: es el mismo montaje que `dictado-en-vivo`, y su razón
            es de tipos — el estilo del hook lleva transición, que el style de
            `Pressable` no admite. */}
        <Animated.View
          style={[estiloPresionado, {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
            paddingVertical: spacing[2],
            borderBottomWidth: 1,
            borderBottomColor: theme.border.subtle,
          }]}
        >
          <View style={{ flex: 1, gap: spacing[1] }}>
            <Texto variante="seccion">{titulo}</Texto>
            {/* El resumen sólo cuando está cerrado: abierto, el contenido ya
                lo dice, y repetirlo es ruido. */}
            {!abierto && detalle !== undefined ? (
              <Texto variante="apoyo">{detalle}</Texto>
            ) : null}
          </View>
          <Chevron direccion={abierto ? 'arriba' : 'abajo'} />
        </Animated.View>
      </Pressable>

      {abierto ? <View style={{ gap: spacing[4] }}>{children}</View> : null}
    </View>
  );
}
