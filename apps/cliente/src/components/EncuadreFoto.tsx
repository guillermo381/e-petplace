/**
 * EncuadreFoto — el editor de encuadre de la foto de mascota (S82-A).
 *
 * LA LÁMINA ES EL ACUERDO: docs/laminas/2026-07-29-s82-foto-onboarding.html
 * — y es CRITERIO, no evidencia (§10): sombras por elevacion.ts (solo
 * niveles existentes, cero dos-capas artesanal ni sombra interior),
 * motion por Reanimated, voces por el riel (tuteo neutro, regla 27),
 * cero hex nuevo (teal · magentaDark/controlLleno · onGradient — todos
 * de palette/temas vivos).
 *
 * MECÁNICA (foto-encuadre.ts): pinza (z 1..3) + arrastre, con el CLAMP
 * del mandato — el recorte JAMÁS sale de la foto. En zoom 1 no hay
 * margen y el texto de ayuda LO DICE. Las previews son las superficies
 * de la lámina EN VIVO mientras se mueve (shared values → animated
 * styles; una sola matemática para visor y marcos).
 *
 * Radios (regla 21b): suelto = squircle 32% · anidado declara POSICIÓN
 * ('chip') y el radio se deriva — ninguna pantalla pasa un número.
 *
 * CANDIDATA PARA B (cero packages/ui esta sesión): este editor + la
 * matemática se promueven cuando AvatarMascota gane `encuadre`.
 */

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Texto, palette, radius, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';
import {
  AIRE,
  LADO_VISOR,
  TAMANO_SUPERFICIE,
  clampEncuadre,
  hayMargen,
  ladoRecorte,
  layoutMarco,
  radioPorPosicion,
  radioSquircle,
  type DimFoto,
  type Encuadre,
  type PosicionMarco,
} from './foto-encuadre';

// ── El marco vivo: un recorte que sigue los shared values ──────────────────

interface MarcoVivoProps {
  uri: string;
  dim: DimFoto;
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  z: SharedValue<number>;
  lado: number;
  aire?: number;
  posicion?: PosicionMarco;
  fondo: string;
}

function MarcoVivo({ uri, dim, cx, cy, z, lado, aire = AIRE.resto, posicion = 'suelto', fondo }: MarcoVivoProps) {
  const estilo = useAnimatedStyle(() => {
    const l = layoutMarco(dim, { cx: cx.value, cy: cy.value, z: z.value }, lado, aire);
    return {
      width: l.width,
      height: l.height,
      transform: [{ translateX: l.left }, { translateY: l.top }],
    };
  });
  return (
    <View
      style={{
        width: lado,
        height: lado,
        borderRadius: radioPorPosicion(posicion, lado),
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: fondo,
      }}
    >
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, estilo]}>
        <Image source={{ uri }} contentFit="fill" transition={0} style={{ width: '100%', height: '100%' }} />
      </Animated.View>
    </View>
  );
}

// ── El editor ──────────────────────────────────────────────────────────────

export interface EncuadreFotoProps {
  uri: string;
  dim: DimFoto;
  inicial: Encuadre;
  nombre: string;
  /** Se llama al SOLTAR cada gesto con el encuadre vigente (clampeado). */
  onCambio: (e: Encuadre) => void;
}

export function EncuadreFoto({ uri, dim, inicial, nombre, onCambio }: EncuadreFotoProps) {
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const ini = clampEncuadre(dim, inicial);
  const cx = useSharedValue(ini.cx);
  const cy = useSharedValue(ini.cy);
  const z = useSharedValue(ini.z);
  const zInicio = useSharedValue(ini.z);
  const [conMargen, setConMargen] = useState(hayMargen(dim, ini.z));

  const sync = (e: Encuadre) => onCambio(e);

  const pan = Gesture.Pan()
    .onChange((ev) => {
      const k = LADO_VISOR / ladoRecorte(dim, z.value);
      const c = clampEncuadre(dim, {
        cx: cx.value - ev.changeX / k / dim.iw,
        cy: cy.value - ev.changeY / k / dim.ih,
        z: z.value,
      });
      cx.value = c.cx;
      cy.value = c.cy;
    })
    .onEnd(() => {
      runOnJS(sync)({ cx: cx.value, cy: cy.value, z: z.value });
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      zInicio.value = z.value;
    })
    .onChange((ev) => {
      const c = clampEncuadre(dim, { cx: cx.value, cy: cy.value, z: zInicio.value * ev.scale });
      cx.value = c.cx;
      cy.value = c.cy;
      z.value = c.z;
    })
    .onEnd(() => {
      runOnJS(sync)({ cx: cx.value, cy: cy.value, z: z.value });
    });

  const gesto = Gesture.Simultaneous(pan, pinch);

  // En zoom 1 no hay margen: el texto de ayuda tiene que decirlo (mandato).
  useAnimatedReaction(
    () => hayMargen(dim, z.value),
    (v, prev) => {
      if (v !== prev) runOnJS(setConMargen)(v);
    },
  );

  const vozChica = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.xs,
    lineHeight: Math.round(typography.size.xs * typography.leading.snug),
    color: theme.text.tertiary,
    textAlign: 'center' as const,
  };

  return (
    <View style={{ gap: spacing[4] }}>
      {/* El visor — pinza + arrastre. Sombra: NIVEL existente (elevada). */}
      <View style={{ alignItems: 'center' }}>
        <GestureDetector gesture={gesto}>
          <View
            style={{
              width: LADO_VISOR,
              height: LADO_VISOR,
              borderRadius: radioSquircle(LADO_VISOR),
              borderCurve: 'continuous',
              overflow: 'hidden',
              backgroundColor: theme.bg.overlay,
              boxShadow: theme.elevacion.elevada,
            }}
            accessibilityLabel={t('fotoEncuadre.visorA11y', { nombre })}
          >
            <MarcoVivo uri={uri} dim={dim} cx={cx} cy={cy} z={z} lado={LADO_VISOR} fondo={theme.bg.overlay} />
          </View>
        </GestureDetector>
      </View>
      <Texto variante="apoyo" centrado>
        {conMargen ? t('fotoEncuadre.arrastra') : t('fotoEncuadre.acerca')}
      </Texto>

      {/* Así lo vas a ver — las superficies de la lámina, EN VIVO */}
      <View style={{ gap: spacing[1] }}>
        <Texto variante="seccion">{t('fotoEncuadre.asiSeVe')}</Texto>
        <Texto variante="apoyo">{t('fotoEncuadre.asiSeVeDetalle')}</Texto>
      </View>

      {/* fila 1: perfil (aire 1.75) · hogar · sala vet — sueltos, squircle */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[4] }}>
        <View style={{ alignItems: 'center', gap: spacing[2] }}>
          <MarcoVivo uri={uri} dim={dim} cx={cx} cy={cy} z={z} lado={TAMANO_SUPERFICIE.perfil} aire={AIRE.perfil} fondo={theme.bg.overlay} />
          <Text style={vozChica}>{t('fotoEncuadre.enPerfil')}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: spacing[2], maxWidth: 110 }}>
          <MarcoVivo uri={uri} dim={dim} cx={cx} cy={cy} z={z} lado={TAMANO_SUPERFICIE.hogar} fondo={theme.bg.overlay} />
          <Text style={vozChica}>{t('fotoEncuadre.enHogar')}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: spacing[2], maxWidth: 100 }}>
          <MarcoVivo uri={uri} dim={dim} cx={cx} cy={cy} z={z} lado={TAMANO_SUPERFICIE.salaVet} fondo={theme.bg.overlay} />
          <Text style={vozChica}>{t('fotoEncuadre.enSalaVet')}</Text>
        </View>
      </View>

      {/* fila 2: el entity chip — reposo y elegido (controlLleno; memorial
          degrada al chip sereno, patrón SelectorOpcion: narrow por 'in') */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[5] }}>
        {[false, true].map((elegido) => {
          const hayLleno = 'controlLleno' in theme.accent;
          const lleno = elegido && hayLleno;
          return (
            <View key={String(elegido)} style={{ alignItems: 'center', gap: spacing[2] }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: lleno ? (theme.accent as { controlLleno: string }).controlLleno : theme.bg.card,
                  borderRadius: radius.full,
                  padding: 3,
                  paddingRight: spacing[4],
                  gap: spacing[2],
                  boxShadow: theme.elevacion.reposo,
                }}
              >
                <MarcoVivo
                  uri={uri}
                  dim={dim}
                  cx={cx}
                  cy={cy}
                  z={z}
                  lado={TAMANO_SUPERFICIE.chip}
                  posicion="chip"
                  fondo={theme.bg.overlay}
                />
                <Text
                  style={{
                    fontFamily: typography.family.sans.medium,
                    fontSize: typography.size.sm,
                    color: lleno ? theme.text.onGradient : theme.text.primary,
                  }}
                >
                  {nombre}
                </Text>
              </View>
              <Text style={vozChica}>{elegido ? t('fotoEncuadre.alReservarElegido') : t('fotoEncuadre.alReservar')}</Text>
            </View>
          );
        })}
      </View>

      {/* fila 3: la fila de cita (canto de CAPA — teal puro, gráfica) + el pin del mapa */}
      <View style={{ gap: spacing[3] }}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.bg.card,
            borderRadius: radius.suave,
            borderCurve: 'continuous',
            overflow: 'hidden',
            boxShadow: theme.elevacion.reposo,
          }}
        >
          <View style={{ width: 4, backgroundColor: palette.teal }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3] }}>
            <MarcoVivo uri={uri} dim={dim} cx={cx} cy={cy} z={z} lado={TAMANO_SUPERFICIE.fila} fondo={theme.bg.overlay} />
            <View>
              <Text
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.sm,
                  color: theme.text.primary,
                }}
              >
                {t('fotoEncuadre.filaTitulo', { nombre })}
              </Text>
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.xs,
                  letterSpacing: typography.tracking.mono,
                  color: theme.text.secondary,
                }}
              >
                {t('fotoEncuadre.filaDetalle')}
              </Text>
            </View>
          </View>
        </View>

        {/* el mapa: superficie serena + el pin con la cara (posición declarada) */}
        <View
          style={{
            height: 104,
            borderRadius: radius.suave,
            borderCurve: 'continuous',
            backgroundColor: theme.bg.overlay,
            overflow: 'hidden',
            alignItems: 'center',
          }}
        >
          <View style={{ width: 58, height: 70, marginTop: spacing[2] }}>
            <Svg width={58} height={70}>
              <Path d="M29 68C29 68 52 44.5 52 27.5A23 23 0 006 27.5C6 44.5 29 68 29 68z" fill={palette.teal} />
            </Svg>
            <View style={{ position: 'absolute', left: 9, top: 9 }}>
              <MarcoVivo
                uri={uri}
                dim={dim}
                cx={cx}
                cy={cy}
                z={z}
                lado={TAMANO_SUPERFICIE.pin}
                posicion="chip"
                fondo={theme.bg.overlay}
              />
            </View>
          </View>
        </View>
        <Text style={vozChica}>{t('fotoEncuadre.leyendaFila')}</Text>
      </View>
    </View>
  );
}
