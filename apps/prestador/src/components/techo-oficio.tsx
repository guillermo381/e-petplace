/**
 * TECHO DEL OFICIO — el header de la dosis del prestador (S58-B
 * §15b.2; RE-FIRMADO S61-B11/B12 sobre píxeles: el founder cuestionó
 * la tinta y GANÓ EL MURO tealDark). Nace TechoOficio (ex TechoTinta):
 * bg tealDark #0A7268 (constante en los 3 temas — el muro del oficio
 * no celebra ni se apaga), la MISMA curva orgánica 44/26, ISOTIPO en
 * blanco (identidad, fuera de la contabilidad de dosis).
 *
 * REGLAS NUEVAS DE LA ENMIENDA (verify-contrast S61):
 *   · sobre el muro, el acento funcional es PAPEL — el teal puro cae a
 *     3.77 sobre tealDark y queda PROHIBIDO ahí;
 *   · TODO texto sobre el muro va papel PLENO (la opacidad .78 caía a
 *     4.01 — la jerarquía la da el tamaño, jamás la transparencia);
 *   · el VIDRIO sobre el muro es OSCURO (negro .18 → papel 7.37; el
 *     claro .14 caía a 4.15).
 *
 * `pie` (S61-B12): el slot del toggle compacto (Hoy/Semana del HOY) —
 * el segmentado gemelo apilado MURIÓ; ToggleTecho es el control
 * canónico sobre el muro (activo = superficie PAPEL con texto del
 * muro, 5.51 ✓). Composición local del app (patrón espejo-oferta); su
 * promoción a packages/ui sigue anotada como pedido a la A.
 */

import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type DimensionValue } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Insignia, Isotipo, motion, palette, radius, spacing, typography, useTheme } from '@epetplace/ui';

/** La curva orgánica del techo (patrón Hogar v2) — una sola verdad. */
export const CURVA_OFICIO = { izquierda: 44, derecha: 26 };
const CURVA = CURVA_OFICIO;

/**
 * El muro del oficio (§15b.2 S61) — una sola verdad para techo y velo.
 * S63 (D-407 pagada): el muro gana su PAR OSCURO — en dark resuelve a
 * tealDarkNoche #0A4A44 (papel 9.61 · textDark0 8.81 · teal puro 6.57,
 * mediciones S63-B); light y memorial siguen en tealDark #0A7268. La
 * const de módulo murió (Ley 37): el muro ahora escucha el tema.
 */
export function useMuroOficio(): string {
  const { mode } = useTheme();
  return mode === 'dark' ? palette.tealDarkNoche : palette.tealDark;
}
/** El vidrio OSCURO sobre el muro (AA verificado: papel 7.37 — sobre
 *  el par noche el contraste solo SUBE). */
export const VIDRIO_OFICIO = 'rgba(0,0,0,0.18)';

/**
 * Sobre el MURO los íconos de la barra de estado son CLAROS — el muro
 * es constante en los 3 temas. Con foco se fuerza 'light'; al perderlo
 * vuelve 'auto'. (Patrón BarraTabs, wiring por pantalla.)
 */
export function useBarraEstadoClara() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, []),
  );
}

/**
 * El VELO de la barra de estado — la zona del inset superior se pinta
 * del muro SIEMPRE, también cuando el techo (dentro del ScrollView) ya
 * scrolleó. Último hijo del contenedor raíz de la pantalla.
 */
export function VeloBarraEstadoOficio() {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();
  if (insets.top === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: muro,
      }}
    />
  );
}

// D-401 (S62): el segmento del toggle responde al dedo — la receta de
// la casa (SelectorOpcion/Boton: scale 0.99, transición spring fast).
function SegmentoTecho({
  esActivo,
  etiqueta,
  onPress,
}: {
  esActivo: boolean;
  etiqueta: string;
  onPress: () => void;
}) {
  const muro = useMuroOficio();
  const [presionado, setPresionado] = useState(false);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: esActivo }}
      onPress={onPress}
      onPressIn={() => setPresionado(true)}
      onPressOut={() => setPresionado(false)}
    >
      <Animated.View
        style={{
          paddingVertical: spacing[1.5],
          paddingHorizontal: spacing[4],
          borderRadius: radius.suave - 3,
          backgroundColor: esActivo ? palette.light0 : 'transparent',
          transform: [{ scale: presionado ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            color: esActivo ? muro : palette.light0,
          }}
        >
          {etiqueta}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** El toggle compacto SOBRE el muro (S61-B12): activo = superficie
 *  PAPEL apoyada con texto del muro; riel = vidrio oscuro. */
export function ToggleTecho<C extends string>({
  etiqueta,
  opciones,
  activo,
  onCambio,
}: {
  etiqueta: string;
  opciones: { codigo: C; etiqueta: string }[];
  activo: C;
  onCambio: (codigo: C) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={etiqueta}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        backgroundColor: VIDRIO_OFICIO,
        borderRadius: radius.suave,
        padding: 3,
      }}
    >
      {opciones.map((o) => {
        const esActivo = o.codigo === activo;
        return (
          <SegmentoTecho
            key={o.codigo}
            esActivo={esActivo}
            etiqueta={o.etiqueta}
            onPress={() => onCambio(o.codigo)}
          />
        );
      })}
    </View>
  );
}

/**
 * S77-B (D-531) — LA FORMA DE CARGA SOBRE EL MURO.
 *
 * POR QUÉ NO ES `Esqueleto` DE packages/ui: su color es
 * `theme.bg.overlay`, que en claro resuelve a `#EDEBF5` (casi blanco) —
 * sobre el muro serían bloques BRILLANTES, más ruidosos que el contenido
 * que reemplazan, y contra la regla medida de §15b.2 (sobre el muro el
 * material de superficie es VIDRIO OSCURO; el claro .14 caía a 4.15).
 * Es la MISMA frontera ya declarada arriba para `Texto`: un componente
 * del sistema que resuelve su color de `theme.*` no puede vestir el
 * muro, porque el muro no está en la escala del tema.
 *
 * Ley 13 intacta: INERTE — sin shimmer, sin pulso, sin fade. Y se
 * compone imitando el layout final para que el reemplazo no corra nada
 * (el punto de D-531: la portada tiene que leerse CARGANDO, no ROTA).
 * El contrato de a11y se hereda del sistema: cada forma se oculta del
 * lector y el ANUNCIO lo pone `EsqueletoGrupo` de `@epetplace/ui`, que
 * es agnóstico de color y por eso sí cruza.
 *
 * Composición local del app (patrón espejo-oferta, igual que
 * `ToggleTecho`); su promoción a packages/ui queda anotada como pedido
 * a la A: `Esqueleto` con `superficie="clara" | "muro"`, exactamente el
 * eje que `LogoNegocio` ya resolvió (S76-B1.2).
 */
export function EsqueletoOficio({
  ancho,
  alto,
  radio = radius.sm,
}: {
  ancho: DimensionValue;
  alto: number;
  radio?: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: ancho, height: alto, borderRadius: radio, backgroundColor: VIDRIO_OFICIO }}
    />
  );
}

/**
 * S71-B1 — LA LÍNEA DE LA JORNADA (`jornada`, enmienda ADITIVA).
 *
 * El techo dejó de rotular para ORIENTAR: `titulo` es la persona,
 * `dato` el negocio, y `jornada` la forma del día — el dato que cuenta
 * hacia atrás ("Te quedan 2 · terminas 18:30" → "Jornada completa.").
 * Ausente ⇒ el techo se comporta EXACTAMENTE como antes: `negocio.tsx`
 * no se toca.
 *
 * E8 de la vara cruzada — RÉGIMEN DEL TECHO, declarado: la línea va
 * ENTERA en DM Sans (`md` medium, papel PLENO). La hora inline NO va en
 * mono: `18:30` dentro de una frase humana es prosa, no metadata de
 * fila, y partir la fuente a mitad de oración viola Ley 17.6. Por la
 * misma frontera, `Texto` (S71-A1) NO aplica acá: sin prop `style` no
 * puede dar papel pleno sobre el muro — `theme.text.*` resuelve a la
 * escala del tema, no a la del muro.
 *
 * E5 — `numberOfLines={1}` en persona Y negocio: `nombre_comercial` es
 * texto libre y largo ("Clínica Veterinaria Aurora del Valle Sur").
 */
export function TechoOficio({
  titulo,
  dato,
  jornada,
  pie,
  cohorte,
  cohorteAnio,
}: {
  titulo: string;
  dato: string;
  jornada?: string;
  pie?: ReactNode;
  /**
   * ⭐ S85-C27 — LA COHORTE, CRUDA. `Insignia` compone la frase en las
   * dos lenguas (B `9449bf5`); **esta casa no arma la etiqueta**. Armarla
   * acá pondría la misma frase en dos diccionarios, y dos diccionarios se
   * desincronizan sin que nada falle.
   *
   * ⚠️ **SE MONTA ACÁ ADENTRO Y NO EN LA PANTALLA, y no es comodidad:**
   * `superficie="muro"` **no es opcional en este techo** — sin ella
   * `capaText.comunidad` da **1.03 de contraste en claro**, o sea
   * invisible (medido por B). Si la pieza viviera en la pantalla, cada
   * consumidor tendría que acordarse de una prop **cuyo olvido no rompe
   * nada y no se ve**. *La regla del muro vive con el muro:* acá es
   * imposible olvidarla.
   *
   * ⚠️ **EL GUARD DE NULOS ES DE ESTA CASA, y es correcto que lo sea:**
   * `Insignia` pide los dos campos NO nulos —*los dos datos o ninguno*—
   * y `MiPrestador` los da nullable. **No es un catálogo duplicado** (eso
   * sería repetir `'fundador' | 'pionero'`): es saber si mi fuente trae
   * el dato, que es responsabilidad de quien la lee. Incompleto = la
   * insignia **no se monta**, jamás un hueco ni una frase a medias.
   */
  cohorte?: 'fundador' | 'pionero' | null;
  cohorteAnio?: number | null;
}) {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();
  useBarraEstadoClara();

  return (
    <View
      style={{
        backgroundColor: muro,
        paddingTop: insets.top + spacing[4],
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[5],
        borderBottomLeftRadius: CURVA.izquierda,
        borderBottomRightRadius: CURVA.derecha,
        overflow: 'hidden',
        gap: spacing[4],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {/* enmienda §15b.2 FIRMADA en gate S58: el isotipo en blanco —
            identidad, UNO por pantalla, fuera de la contabilidad */}
        <Isotipo size={26} variant="blanco" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.xl,
              color: palette.light0,
            }}
          >
            {titulo}
          </Text>
          {/* papel PLENO (regla S61): sobre el muro la opacidad muere.
              La insignia va JUNTO AL NOMBRE DEL NEGOCIO —no al saludo—
              porque la cohorte es del negocio, no de la persona. El
              nombre cede ancho (`flexShrink`) para que la distinción no
              se corte: entre truncar el nombre propio y truncar una
              insignia de dos palabras, se trunca el que el prestador ya
              conoce de memoria. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                color: palette.light0,
              }}
            >
              {dato}
            </Text>
            {cohorte !== null && cohorte !== undefined && cohorteAnio !== null && cohorteAnio !== undefined && (
              <Insignia distincion="cohorte" superficie="muro" cohorte={cohorte} cohorteAnio={cohorteAnio} tamaño="sm" />
            )}
          </View>
        </View>
      </View>
      {/* La forma del día — su propio aire, papel pleno, DM Sans entera. */}
      {jornada !== undefined && (
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.md,
            color: palette.light0,
          }}
        >
          {jornada}
        </Text>
      )}
      {pie}
    </View>
  );
}

/**
 * ⭐ S85-C23 — LOS TRES NÚMEROS DEL TECHO (`PORTAL_PRESTADOR` §2.4bis).
 *
 * **CARGA · PLATA · VIDAS**, siempre los tres, siempre en ese orden. Vive
 * ACÁ y no en la portada porque **las reglas del muro viven acá**: papel
 * PLENO (sobre el muro la opacidad muere, regla S61) y cero acento —
 * ponerlo en la pantalla obligaría a repetir esas reglas y a que alguien
 * las mantenga en dos lugares.
 *
 * ── POR QUÉ UNA LÍNEA POR COLUMNA, Y NO valor-arriba/unidad-abajo ────
 * Porque **la unidad NO siempre es una unidad**: cuando PLATA no es
 * visible, ese hueco dice una FRASE (un permiso), no un número con
 * rótulo. Un layout de "valor + unidad" obligaría a inventar un valor
 * para el caso sin valor — y el vacío se lee como CERO, que es
 * justamente lo que §2.4bis prohíbe.
 *
 * ⚠️ `numberOfLines={2}`: la frase del permiso es más larga que un
 * número, y en un tercio de ancho estiraría la columna. **Por eso la voz
 * visible es corta y la completa viaja en `accessibilityLabel`** — la
 * posición del hueco ya aporta "los ingresos". *Tres columnas donde una
 * tiene tres renglones y las otras uno se lee como algo roto, y un techo
 * que parece roto no orienta.*
 */
export function TresNumeros({
  carga,
  plata,
  vidas,
  plataDetalle,
}: {
  carga: string;
  plata: string;
  vidas: string;
  /** La voz COMPLETA cuando la visible se acortó (permiso / fallo). */
  plataDetalle?: string;
}) {
  const celda = (texto: string, detalle?: string) => (
    <View style={{ flex: 1 }}>
      <Text
        numberOfLines={2}
        accessibilityLabel={detalle}
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          // papel PLENO — sobre el muro la opacidad muere (regla S61)
          color: palette.light0,
        }}
      >
        {texto}
      </Text>
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' }}>
      {celda(carga)}
      {celda(plata, plataDetalle)}
      {celda(vidas)}
    </View>
  );
}
