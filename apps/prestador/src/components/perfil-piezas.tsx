/**
 * PIEZAS DEL PERFIL v2 (S83-C10) — las TRES anatomías locales de la
 * pantalla de verificación `/perfil-v2`.
 *
 * ⚠️ POR QUÉ VIVEN ACÁ Y NO EN `packages/ui` — declarado, no improvisado.
 * La orden C10 manda construir con piezas de `packages/ui` y FRENAR si
 * una falta. **Falta una, y es la del despliegue.** Medido:
 *   · `CeldaNavegacion` tiene `chevron?: boolean` — prendido/apagado, y
 *     su glifo es SIEMPRE `›`. No sabe decir ⌄/⌃ (E14 exige que la
 *     información despliegue y la acción lleve).
 *   · `PieRevelar` SÍ tiene el chevron direccional, pero es un PIE:
 *     centrado, sin glifo, etiqueta "Ver {n} más". No es un encabezado.
 *   · `FilaCita` tiene exactamente el prop que falta —
 *     `direccion: 'derecha' | 'abajo' | 'arriba'`, S82 E15 — pero es
 *     componente de DOMINIO: exige oficio y mascota.
 *
 * LA CURA COORDINADA que se propone (territorio de B, 76(d)):
 * `CeldaNavegacion` gana `direccion` con el MISMO vocabulario y el
 * MISMO mapa de paths que `FilaCita` ya usa — se ENSANCHA la pieza que
 * existe, jamás se copia (L-175). Mientras eso no pase, esto vive local
 * con el patrón declarado de la casa: `TarjetaEstado` vivió local desde
 * S78 y se promovió en S83-B1; `GateRoto`/`PantallaCaida` viven locales
 * hoy con su promoción coordinada (skill §S79). No es inline en una
 * pantalla: es UNA anatomía nombrada, con tokens, reusable.
 *
 * Cero hex crudo, cero sombra artesanal: todo sale de tokens (Ley 1/20).
 * El muro y su vidrio se consumen de `techo-oficio` — la frontera del
 * muro es una sola verdad y no se redibuja (§15b.2).
 */

import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Icono,
  LogoNegocio,
  Texto,
  motion,
  palette,
  radius,
  spacing,
  typography,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';

import { CURVA_OFICIO, VIDRIO_OFICIO, useMuroOficio } from '@/components/techo-oficio';

/** El mismo mapa de `FilaCita` (S82 E15) — cuando `CeldaNavegacion` gane
 *  su `direccion`, esta constante muere con la pieza (Ley 37). */
const CHEVRON = {
  derecha: 'M9 18l6-6-6-6',
  abajo: 'M6 9l6 6 6-6',
  arriba: 'M6 15l6-6 6 6',
} as const;

/**
 * SECCIÓN DESPLEGABLE — encabezado + panel que se abre en su lugar.
 *
 * E14 en su forma exigible: esto DESPLIEGA información, así que su
 * chevron mira ⌄ cerrado y ⌃ abierto, y GIRA (firma founder S73 sobre
 * PieRevelar). Lo que NAVEGA a otra pantalla no usa esta pieza: usa
 * `CeldaNavegacion`, que lleva `›`.
 *
 * `resumen` es el trabajo de densidad (§15b.3): cerrada, la sección
 * sigue diciendo su estado — dato de máquina en mono (Ley 3). Con
 * `pendiente`, ese resumen habla en la voz de lo que falta.
 */
export function SeccionDesplegable({
  icono,
  titulo,
  resumen,
  pendiente = false,
  abierta,
  onAlternar,
  children,
}: {
  icono?: IconoNombre;
  titulo: string;
  /** El estado de la sección con la sección CERRADA. Mono, corto. */
  resumen: string;
  /** El resumen dice lo que FALTA (voz de atención, jamás error). */
  pendiente?: boolean;
  abierta: boolean;
  onAlternar: () => void;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  const [presionada, setPresionada] = useState(false);

  return (
    <View>
      <Pressable
        onPress={onAlternar}
        onPressIn={() => setPresionada(true)}
        onPressOut={() => setPresionada(false)}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={`${titulo}, ${resumen}`}
      >
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
            minHeight: 56,
            paddingVertical: spacing[2],
            transform: [{ scale: presionada ? 0.99 : 1 }],
            transitionProperty: 'transform',
            transitionDuration: motion.duration.fast,
            transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
          }}
        >
          {icono !== undefined && <Icono nombre={icono} tamano={24} registro="aa" />}
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Texto variante="seccion">{titulo}</Texto>
            <Texto variante="dato" color={pendiente ? 'danger' : 'secondary'} numberOfLines={1}>
              {resumen}
            </Texto>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <Path
              d={abierta ? CHEVRON.arriba : CHEVRON.abajo}
              stroke={theme.text.tertiary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Pressable>
      {abierta && <View style={{ paddingBottom: spacing[4], gap: spacing[2] }}>{children}</View>}
    </View>
  );
}

/**
 * EL ESPEJO — lo que la familia ve, presidiendo y a sangre contra el
 * muro del oficio (§15b.2: papel PLENO sobre el muro, vidrio OSCURO).
 *
 * Preside de verdad (Ley 15): el nombre en `Texto titulo` y el logo
 * grande. No son campos — son la portada. El bloque de VACÍO dice la
 * CONSECUENCIA en una línea, en vez de repartir cuatro celdas diciendo
 * "sin dato" (el eje VACÍO del bloque de auditoría).
 */
export function EspejoNegocio({
  nombre,
  logoUrl,
  tipo,
  visible,
  vacio,
  onEditarLogo,
}: {
  nombre: string;
  logoUrl: string | null;
  /** La voz del tipo + ciudad, ya compuesta por la pantalla. */
  tipo: string;
  visible: boolean;
  /** La consecuencia del hueco, en UNA línea. null = nada que decir. */
  vacio: string | null;
  onEditarLogo: () => void;
}) {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();

  return (
    <View
      style={{
        backgroundColor: muro,
        paddingTop: insets.top + spacing[6],
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[5],
        borderBottomLeftRadius: CURVA_OFICIO.izquierda,
        borderBottomRightRadius: CURVA_OFICIO.derecha,
        overflow: 'hidden',
        gap: spacing[4],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <Pressable onPress={onEditarLogo} accessibilityRole="button" accessibilityLabel="Cambiar el logo del negocio">
          <LogoNegocio nombre={nombre} logoUrl={logoUrl} tamano={76} superficie="muro" />
        </Pressable>
        {/* ⚠️ SOBRE EL MURO NO ENTRA `Texto` — es la frontera que esta
            misma app ya declaró (D-535, `techo-oficio`): una pieza que
            resuelve su color de `theme.*` no puede vestir el muro,
            porque el muro es constante en los tres temas y NO está en
            la escala del tema (`TextoColor` no tiene 'onGradient':
            medido). Papel PLENO y tipografía por token, como
            `TechoOficio` — jamás opacidad (regla §15b.2). */}
        <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={{
              fontFamily: typography.family.sans.light,
              fontSize: typography.size.xl,
              color: palette.light0,
            }}
          >
            {nombre}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.sm,
              color: palette.light0,
            }}
          >
            {tipo}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontFamily: typography.family.sans.regular,
          fontSize: typography.size.base,
          color: palette.light0,
        }}
      >
        {visible ? 'Visible para las familias' : 'Todavía no visible'}
      </Text>

      {vacio !== null && (
        <View style={{ backgroundColor: VIDRIO_OFICIO, borderRadius: radius.md, padding: spacing[3] }}>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              color: palette.light0,
            }}
          >
            {vacio}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * EL RASTRO — la fila compacta que queda pegada al tope cuando el
 * espejo se fue (gate a′). Existe para que nunca dejes de saber qué
 * negocio estás editando; cuesta alto permanente, y por eso es gate.
 */
export function RastroNegocio({ nombre, visible }: { nombre: string; visible: boolean }) {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        backgroundColor: muro,
        paddingTop: insets.top + spacing[2],
        paddingBottom: spacing[2],
        paddingHorizontal: spacing[5],
      }}
    >
      <LogoNegocio nombre={nombre} logoUrl={null} tamano={30} superficie="muro" />
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* misma frontera del muro que el espejo: papel pleno por token */}
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.base,
            color: palette.light0,
          }}
        >
          {nombre}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: typography.family.mono.regular,
          fontSize: typography.size.sm,
          color: palette.light0,
        }}
      >
        {visible ? 'visible' : 'oculto'}
      </Text>
    </View>
  );
}
