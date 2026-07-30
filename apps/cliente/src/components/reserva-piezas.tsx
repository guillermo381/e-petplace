/**
 * @override-s82c — LAS PIEZAS DEL FLUJO DE RESERVA (r9, del contexto 3
 * de la lámina patron-2-lista-colapsable.html, leída como CRITERIO §10:
 * cero box-shadow/transición de CSS, el motion va por Reanimated, el
 * .js es DOM y su lógica se re-pensó).
 *
 * ✅ LOS DOS GATES, CERRADOS POR EL FOUNDER EN DISPOSITIVO (r12):
 *
 *  ① GANA EL TECHO CLARO POR SERVICIO. El oscuro MURIÓ (Ley 37) — y su
 *    porqué queda escrito: la marca YA es el degradado oscuro del hogar
 *    y de la ficha, así que un oficio oscuro competía con ella.
 *
 *  ② GANA LA RUEDA D3, CON IMÁN. El riel MURIÓ. La calibración FIRMADA
 *    se conserva íntegra (escalas 1.16/0.94/0.84/0.78 · opacidades
 *    1/.62/.34/.18 · 520 ms cubic-bezier(.32,.72,0,1) · ítem 66 · paso
 *    76 · el elegido SIEMPRE centrado). Lo que se suma es el GESTO: pan
 *    + snap al intervalo, con la curva de la casa — hasta hoy la rueda
 *    solo respondía al clic, que es media rueda.
 *
 *  El SwitchGate murió con ellos: era andamio y el gate ya pasó.
 *
 * ⚠️ COLOR: cero hexes de la lámina (mismo paro que r7 — 16 de 17 no
 * existen en palette.ts). Todo con nuestros tokens.
 *
 * LAS TRES LEYES DE LA LÁMINA, respetadas sin escribirlas (regla 80):
 *  · UN SOLO RELLENO PLENO por pantalla: el CTA que cierra. Día y hora
 *    (diez y ocho hermanos) se eligen por ELEVACIÓN, ESCALA y COLOR DE
 *    TEXTO — jamás por relleno.
 *  · Si un eje no parte los datos, no se dibuja.
 *  · EL NULO HONESTO: el día sin horarios no muestra ocho celdas
 *    tachadas — dice que no hay, dice por qué, ofrece la salida, y el
 *    PIE FLOTANTE DESAPARECE (no hay total de algo que no existe).
 *
 * 🔴 DATO QUE NO EXISTE, DECLARADO (no se inventa): la lámina pinta
 * días CERRADOS (`.rit.cerr`) desde un array hardcodeado. Nuestro motor
 * responde por UN día (`obtenerIniciosPaseo`) — marcar los cerrados
 * costaría 10-14 llamadas (D-497). Todos los días nacen TOCABLES y el
 * nulo honesto sostiene el caso. El lector es un pedido a A,
 * secuenciado. La prop `cerrados` ya existe acá: el día que el lector
 * llegue, se llena y nada más cambia.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import {
  Boton,
  EstadoVacio,
  Icono,
  Texto,
  radius,
  spacing,
  typography,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';

// ═══════════════ ① EL TECHO — LAS DOS OPCIONES ═══════════════

/** EL TECHO CLARO POR SERVICIO — FIRMADO en dispositivo (r12). Toma el
 *  TINTE de la capa del oficio sobre papel; el texto va en tinta. */
export function TechoReserva({
  oficio,
  titulo,
  detalle,
  precio,
  precioDesde,
  onAtras,
  insetTop,
}: {
  oficio: IconoNombre;
  titulo: string;
  detalle: string | null;
  /** null = todavía no hay precio que decir (nada se inventa). */
  precio: string | null;
  /** true = el precio VARÍA entre prestadores → dice "desde" (escalera
   *  del precio S61-A13, FIRMADA: el exacto se dice en el QUIÉN). */
  precioDesde: boolean;
  onAtras: () => void;
  insetTop: number;
}) {
  const { theme } = useTheme();
  const esMemorial = theme.mode === 'memorial';
  // (b) el techo claro toma el TINTE de la capa del oficio; (a) el
  // oscuro toma la tinta de la casa. Cero hex nuevo. (El tinte se
  // resuelve ANTES del ternario: memorial no tiene registro capaBg y
  // el narrowing del `in` dentro del ternario dejaba theme en never.)
  // el tinte de la capa del oficio (memorial no tiene registro capaBg)
  const fondo = 'capaBg' in theme ? theme.capaBg.cuidado : theme.bg.overlay;
  const sobre = theme.text.primary;
  const sobreSuave = theme.text.secondary;

  return (
    <View
      style={{
        backgroundColor: fondo,
        paddingTop: insetTop + spacing[3],
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[5],
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
        overflow: 'hidden',
      }}
    >
      {/* ⚠️ A4 — LA LUZ DE LA ESQUINA, INVERTIDA (r12-bis, corrección
          del founder sobre MI error de método). Lo que hice mal en r12:
          MATÉ la luz apoyándome en L-c, pero A4 está FIRMADA (§9bis.2)
          y su letra dice "el ÚNICO adorno permitido EN UN TECHO" — sin
          acotar a techo de marca. Matar una firmada por medición propia
          es exactamente lo que la casa prohíbe: el choque SE DECLARA.
          La medición seguía siendo correcta (blanco al 7% sobre tinte
          claro no se ve); lo que estaba mal era la conclusión.
          LA INVERSIÓN: misma intención, mismo alfa FIRMADO (7%), mismo
          diámetro (~60% del ancho) y mismo desborde por la esquina
          superior derecha — lo único que cambia es el REGISTRO del
          color, que se resuelve POR CONTEXTO: sobre techo oscuro la luz
          es blanca; sobre techo claro es TINTA. Es el patrón que la
          casa ya usa en tealDark (mismo color, otro registro) y en el
          tapiz. El valor sale del token del tema, no de un literal.
          ⚠️ AL GATE, no resuelto acá: si la inversión TAMPOCO se lee,
          entonces A4 necesita ALCANCE FINO ("en un techo de MARCA") y
          eso lo firma el founder — no se deduce de una pantalla. Por
          eso el techo claro NO SE PROPAGA a los otros oficios todavía:
          si la luz muere en cada techo, A4 moriría en veinte pantallas
          sin que nadie lo haya decidido. */}
      <View
        style={{
          position: 'absolute',
          top: -86,
          right: -64,
          width: 242,
          height: 242,
          borderRadius: 999,
          backgroundColor: theme.text.primary,
          opacity: 0.07,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Pressable
          accessibilityRole="button"
          onPress={onAtras}
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            backgroundColor: theme.bg.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="m14 5-7 7 7 7" stroke={sobre} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </Pressable>
        <Icono nombre={oficio} tamano={26} registro="tinta" tinta={sobre} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing[3], marginTop: spacing[5] }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size.xl, color: sobre }}>
            {titulo}
          </Text>
          {detalle !== null ? (
            <Text
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.sm,
                letterSpacing: typography.tracking.mono,
                color: sobreSuave,
                marginTop: spacing[1],
              }}
            >
              {detalle}
            </Text>
          ) : null}
        </View>
        {/* el precio del techo: SOLO si existe, y con "desde" cuando
            varía — la escalera FIRMADA le gana al total exacto de la
            lámina (que mentiría antes de elegir prestador). */}
        {precio !== null ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: typography.family.mono.medium, fontSize: typography.size.lg, color: sobre }}>
              {precio}
            </Text>
            {precioDesde ? (
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: sobreSuave }}>
                {'desde'}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ═══════════════ ② EL DÍA — RIEL vs RUEDA (D3) ═══════════════

export type DiaOpcion = { iso: string; dia: string; numero: string };

const CURVA_D3 = Easing.bezier(0.32, 0.72, 0, 1);

/** LA RUEDA D3 — FIRMADA en dispositivo (r12), con su calibración
 *  intacta Y SU IMÁN: pan + snap al intervalo con la curva de la casa.
 *  Hasta r11 solo respondía al clic, que es media rueda: el gesto es
 *  la mitad que la hace rueda. El elegido SIEMPRE centrado
 *  (translateX), los vecinos decaen por anillo:
 *  escalas 1.16/0.94/0.84/0.78 · opacidades 1/.62/.34/.18 ·
 *  520 ms cubic-bezier(.32,.72,0,1) · ítem 66 · separación 10 ·
 *  paso 76. El movimiento lo pone Reanimated (§10), jamás CSS. */
const D3 = {
  item: 66,
  paso: 76,
  escalas: [1.16, 0.94, 0.84, 0.78],
  opacidades: [1, 0.62, 0.34, 0.18],
  duracion: 520,
} as const;

function RuedaDias({
  dias,
  elegido,
  cerrados,
  onElegir,
}: {
  dias: DiaOpcion[];
  elegido: string;
  cerrados: Set<string>;
  onElegir: (iso: string) => void;
}) {
  const { theme } = useTheme();
  const [ancho, setAncho] = useState(0);
  const indice = Math.max(0, dias.findIndex((d) => d.iso === elegido));
  // `centro` = el desplazamiento que deja al elegido en el medio.
  const centro = (i: number) => ancho / 2 - D3.item / 2 - i * D3.paso;
  const desplaz = useSharedValue(0);
  const inicioPan = useSharedValue(0);
  // el índice VIVO durante el arrastre (para que escalas y opacidades
  // sigan al dedo, no al estado de React)
  const indiceVivo = useSharedValue(indice);

  useEffect(() => {
    if (ancho === 0) return;
    indiceVivo.value = indice;
    desplaz.value = withTiming(centro(indice), { duration: D3.duracion, easing: CURVA_D3 });
  }, [indice, ancho]);

  const elegirPorIndice = (i: number) => {
    const d = dias[i];
    if (d !== undefined && !cerrados.has(d.iso)) onElegir(d.iso);
  };

  /** EL IMÁN: al soltar, la rueda cae al día más cercano — jamás queda
   *  entre dos. El snap usa la MISMA curva y duración firmadas. */
  const pan = Gesture.Pan()
    .onBegin(() => {
      inicioPan.value = desplaz.value;
    })
    .onUpdate((e) => {
      desplaz.value = inicioPan.value + e.translationX;
      const i = Math.round((ancho / 2 - D3.item / 2 - desplaz.value) / D3.paso);
      indiceVivo.value = Math.min(Math.max(i, 0), dias.length - 1);
    })
    .onEnd(() => {
      const crudo = (ancho / 2 - D3.item / 2 - desplaz.value) / D3.paso;
      const i = Math.min(Math.max(Math.round(crudo), 0), dias.length - 1);
      indiceVivo.value = i;
      desplaz.value = withTiming(ancho / 2 - D3.item / 2 - i * D3.paso, {
        duration: D3.duracion,
        easing: CURVA_D3,
      });
      runOnJS(elegirPorIndice)(i);
    });

  const pista = useAnimatedStyle(() => ({ transform: [{ translateX: desplaz.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        style={{ height: 96, justifyContent: 'center', overflow: 'hidden' }}
      >
        <Animated.View style={[{ flexDirection: 'row', gap: D3.paso - D3.item }, pista]}>
          {dias.map((d, i) => (
            <ItemRueda
              key={d.iso}
              dia={d}
              indice={i}
              indiceVivo={indiceVivo}
              cerrado={cerrados.has(d.iso)}
              onPress={() => elegirPorIndice(i)}
              theme={theme}
            />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/** Un día de la rueda. Escala y opacidad SIGUEN AL DEDO (worklet sobre
 *  `indiceVivo`), no al estado de React: durante el arrastre el anillo
 *  se recalcula en el hilo de UI. */
function ItemRueda({
  dia,
  indice,
  indiceVivo,
  cerrado,
  onPress,
  theme,
}: {
  dia: DiaOpcion;
  indice: number;
  indiceVivo: SharedValue<number>;
  cerrado: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const vivo = useAnimatedStyle(() => {
    const anillo = Math.min(Math.abs(indice - indiceVivo.value), D3.escalas.length - 1);
    const bajo = Math.floor(anillo);
    const alto = Math.min(bajo + 1, D3.escalas.length - 1);
    const t = anillo - bajo;
    // interpolación entre anillos: el decaimiento es continuo mientras
    // el dedo arrastra, y cae exacto en la calibración al soltar
    const escala = D3.escalas[bajo] + (D3.escalas[alto] - D3.escalas[bajo]) * t;
    const opacidad = D3.opacidades[bajo] + (D3.opacidades[alto] - D3.opacidades[bajo]) * t;
    return { transform: [{ scale: escala }], opacity: cerrado ? 0.18 : opacidad };
  });
  return (
    <Animated.View style={vivo}>
      <Pressable
        disabled={cerrado}
        accessibilityRole="radio"
        accessibilityState={{ disabled: cerrado }}
        accessibilityLabel={`${dia.dia} ${dia.numero}`}
        onPress={onPress}
        style={{
          width: D3.item,
          height: 76,
          borderRadius: 22,
          backgroundColor: theme.bg.card,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          boxShadow: theme.elevacion.reposo,
        }}
      >
        <Texto variante="dato">{dia.dia}</Texto>
        <Text
          style={{
            fontFamily: typography.family.mono.medium,
            fontSize: typography.size.xl,
            color: theme.text.primary,
          }}
        >
          {dia.numero}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function SelectorDia(props: {
  dias: DiaOpcion[];
  elegido: string;
  /** Fechas SIN disponibilidad. Hoy llega VACÍO: el dato no existe en
   *  el motor y no se inventa (ver cabecera). */
  cerrados?: Set<string>;
  onElegir: (iso: string) => void;
}) {
  const cerrados = props.cerrados ?? new Set<string>();
  return <RuedaDias dias={props.dias} elegido={props.elegido} cerrados={cerrados} onElegir={props.onElegir} />;
}

// ═══════════════ LA GRILLA DE HORAS + EL NULO HONESTO ═══════════════

export function GrillaHoras({
  horas,
  elegida,
  onElegir,
}: {
  horas: string[];
  elegida: string | null;
  onElegir: (h: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingHorizontal: spacing[5] }}>
      {horas.map((h) => {
        const on = h === elegida;
        return (
          <Pressable
            key={h}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onElegir(h)}
            style={{
              flexBasis: '22%',
              flexGrow: 1,
              height: 44,
              borderRadius: radius.suave,
              backgroundColor: theme.bg.card,
              alignItems: 'center',
              justifyContent: 'center',
              // ELEVACIÓN + ESCALA + COLOR DE TEXTO (jamás relleno)
              boxShadow: on ? theme.elevacion.elevada : theme.elevacion.reposo,
              transform: [{ scale: on ? 1.05 : 1 }],
            }}
          >
            <Text
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.sm,
                color: on ? theme.accent.control : theme.text.secondary,
              }}
            >
              {h}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** EL NULO HONESTO (tercera ley): dice que no hay, dice POR QUÉ, y
 *  ofrece la salida. Jamás ocho celdas tachadas. */
export function DiaSinHorarios({
  titulo,
  porque,
  etiquetaSalida,
  onSalida,
}: {
  titulo: string;
  porque: string;
  etiquetaSalida: string | null;
  onSalida: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: spacing[5] }}>
      <EstadoVacio
        registro="seccion"
        titulo={titulo}
        descripcion={porque}
        accion={
          etiquetaSalida !== null ? (
            <Boton variante="primario" tamaño="sm" etiqueta={etiquetaSalida} onPress={onSalida} />
          ) : undefined
        }
      />
    </View>
  );
}

// ═══════════════ EL PIE FLOTANTE — QUE DESAPARECE ═══════════════

/** El ÚNICO relleno pleno de la pantalla: el CTA que cierra. Y la
 *  cláusula de la tercera ley: si no hay qué totalizar, el pie NO SE
 *  MONTA (no hay total de algo que no existe). */
export function PieReserva({
  total,
  totalDesde,
  cuando,
  etiqueta,
  habilitado,
  onPress,
  insetBottom,
}: {
  total: string | null;
  totalDesde: boolean;
  cuando: string | null;
  etiqueta: string;
  habilitado: boolean;
  onPress: () => void;
  insetBottom: number;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: spacing[5],
        paddingTop: spacing[3],
        paddingBottom: Math.max(insetBottom, spacing[4]),
        backgroundColor: theme.bg.base,
        borderTopWidth: 1,
        borderTopColor: theme.border.subtle,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
      }}
    >
      {total !== null ? (
        <View>
          <Text style={{ fontFamily: typography.family.mono.medium, fontSize: typography.size.lg, color: theme.text.primary }}>
            {total}
          </Text>
          {cuando !== null ? <Texto variante="dato">{totalDesde ? `desde · ${cuando}` : cuando}</Texto> : null}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Boton variante="primario" bloque etiqueta={etiqueta} deshabilitado={!habilitado} onPress={onPress} />
      </View>
    </View>
  );
}
