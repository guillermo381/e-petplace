/**
 * EL ARRANQUE DE MARCA — el overlay del splash (S96-C · tanda corta de
 * marca, orden del founder).
 *
 * QUÉ ERA: el template de Expo VIVO — el logo de Expo sobre #208AEF en
 * cada arranque en frío, en el splash nativo Y en este overlay (medido:
 * `expo-logo.png` y `splash-icon.png` eran el mismo caret de Expo).
 * Arrancar sobre el logo de Expo contamina el gate antes de la primera
 * pantalla.
 *
 * QUÉ ES: el espejo JS del splash nativo de `app.json` — MISMO fondo,
 * MISMA marca, para que el pase nativo→JS no tenga costura:
 *  · fondo `palette.tealDark` #0A7268 — el MURO del oficio (§15b.2,
 *    firmado S61-B12), el color del lado negocio; el literal de
 *    `app.json` es su espejo (JSON no importa tokens) y este archivo es
 *    donde se declara.
 *  · `Isotipo variant="blanco"` — la pieza canónica de marca; sobre el
 *    muro el acento es PAPEL (§15b.2). El ancho espeja el `imageWidth`
 *    140 del splash nativo.
 *  · la salida es un FADE con la física de marca (`motion.marca`, la
 *    misma con la que abre el Coach y barre la puerta de oficio) — el
 *    elastic del template murió con él. Solo fade: es la única salida
 *    que memorial también toleraría, y el splash corre antes del tema.
 *
 * QUÉ MURIÓ (Ley 37): `AnimatedIcon` (el tile con glow del template,
 * CERO consumidores) y sus assets `expo-logo.png` · `logo-glow.png` ·
 * `react-logo.png` · `expo-badge*.png` — template sin referencias.
 *
 * ⚠️ El splash NATIVO (fondo + PNG) viaja en BUILD, no en OTA (L-134):
 * este overlay coincide con él recién en el binario 1.0.5. En un APK
 * viejo un OTA con este archivo mostraría teal sobre el azul nativo —
 * por eso la versión SUBIÓ y el lote se gatea sobre la build nueva.
 */

import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Isotipo, motion, palette } from '@epetplace/ui';

// Espejo del splash nativo: `imageWidth: 140` en app.json. El alto sale
// del viewBox del isotipo (471.82 × 324) — la pieza deriva el ancho del
// alto, así que se invierte acá una sola vez.
const ANCHO_ISOTIPO = 140;
const ALTO_ISOTIPO = Math.round((ANCHO_ISOTIPO * 324) / 471.82); // ≈ 96

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  // Sostiene la marca un instante y se va en fade — reemplazo directo,
  // sin escalas ni rebotes (la física es la de marca, no la del template).
  const salida = new Keyframe({
    0: { opacity: 1 },
    40: { opacity: 1 },
    100: {
      opacity: 0,
      easing: Easing.bezier(...motion.marca.aperturaBezier),
    },
  });

  const marca = <Isotipo size={ALTO_ISOTIPO} variant="blanco" />;

  return animate ? (
    <Animated.View
      entering={salida.duration(motion.marca.aperturaMs * 2).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {marca}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {marca}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    // el muro del oficio — espejo del backgroundColor del splash nativo
    backgroundColor: palette.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
