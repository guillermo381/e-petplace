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
  interpolateColor,
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
  Isotipo,
  Texto,
  radius,
  spacing,
  typography,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';

// ═══════════════ ① EL CABEZAL — LA BANDA DE COLOR MURIÓ ═══════════════

/** EL CABEZAL DEL OFICIO (r14-6 — decisión del founder MIRANDO, sobre
 *  su propia firma de r12: el techo claro por servicio ganó el gate y
 *  DOS RONDAS DESPUÉS la banda entera muere. Se registra así, no como
 *  si la banda nunca hubiera existido: el gate de r12 eligió entre dos
 *  bandas; r14 saca la banda de la mesa).
 *
 *  Lo que queda en su lugar: EL GLIFO DEL OFICIO ADELANTE + EL ISOTIPO
 *  TEÑIDO DEL COLOR DEL OFICIO + el label. Sin banda, sin curva, sin
 *  luz de esquina — no hay techo que adornar.
 *
 *  ⚠️ DESVÍO DECLARADO — LEY 4: *"el isotipo es IDENTIDAD: va en
 *  gradiente oficial por default"*. Teñirlo del color del oficio se
 *  desvía de ese default y por eso se declara aunque sea chico contra
 *  una banda entera. DOS COSAS QUE LO ATENÚAN, medidas y no supuestas:
 *   ① el MECANISMO ya existe y está firmado — la prop `color` de
 *     `Isotipo` nació en S61-B8 por letra del founder ("isotipo en
 *     tealDark", bienvenida del prestador): teñir el isotipo con el
 *     color de un oficio YA tiene precedente firmado en la casa.
 *   ② el default habría sido el CHOQUE: el gradiente oficial es de
 *     CONTEXTO CERRADO (Ley 4 dosis) y esta es pantalla interna. Poner
 *     el isotipo en gradiente acá rompía la dosis; teñirlo la respeta.
 *  Igual es DESVÍO y lo firma el founder, no esta pantalla.
 *
 *  ⚠️ EL PRECIO NO VIAJA ACÁ, y es RETIRO, no olvido: la banda mostraba
 *  el MISMO número que el pie ("$ X · desde"). Dos veces el mismo dato
 *  es la regla Chanel directa. Queda SOLO en el pie — y el caso del día
 *  sin horarios queda honesto por consecuencia: si no hay nada que
 *  reservar, no hay precio que decir (el pie tampoco se monta). */
export function CabezalOficio({
  oficio,
  titulo,
  detalle,
  onAtras,
  insetTop,
}: {
  oficio: IconoNombre;
  titulo: string;
  /** El sujeto de la reserva (la mascota). En SANS: es un NOMBRE, no
   *  metadata de máquina — la Ley 3 reserva el mono para lo segundo, y
   *  la banda vieja lo pintaba en mono (defecto hallado al reescribir). */
  detalle: string | null;
  onAtras: () => void;
  insetTop: number;
}) {
  const { theme } = useTheme();
  // el color del OFICIO — el mismo tinte de capa que pintaba la banda,
  // ahora en su registro pleno: de fondo pasa a TINTA del isotipo.
  const colorOficio = theme.capa.cuidado;

  return (
    <View
      style={{
        backgroundColor: theme.bg.base,
        paddingTop: insetTop + spacing[3],
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[3],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Pressable
          accessibilityRole="button"
          onPress={onAtras}
          hitSlop={8}
          style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginLeft: -spacing[2] }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path
              d="m14 5-7 7 7 7"
              stroke={theme.text.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Pressable>
        {/* el glifo del oficio ADELANTE; el isotipo TEÑIDO detrás de él */}
        <Icono nombre={oficio} tamano={24} registro="capa" />
        <Isotipo size={20} color={colorOficio} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}
          >
            {titulo}
          </Text>
        </View>
      </View>
      {detalle !== null ? (
        <View style={{ marginTop: spacing[1], marginLeft: 38 + spacing[3] }}>
          <Texto variante="apoyo">{detalle}</Texto>
        </View>
      ) : null}
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
              acento={theme.accent.control}
              tinta={theme.text.primary}
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
  acento,
  tinta,
}: {
  dia: DiaOpcion;
  indice: number;
  indiceVivo: SharedValue<number>;
  cerrado: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  /** Colores YA resueltos (el worklet no puede leer el tema). */
  acento: string;
  tinta: string;
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

  /** r14-3 · EL ACENTO DEL DÍA — la letra literal de D3 ("el acento
   *  queda en el número"), que se había perdido cuando el imán entró:
   *  el elegido se distinguía solo por escala y ahí el acento no vive.
   *  VA EN EL MISMO WORKLET que la escala, y no en estado de React, por
   *  una razón de comportamiento: durante el arrastre el estado no
   *  cambia hasta soltar (`runOnJS` en `onEnd`), así que un acento
   *  atado a React llegaría TARDE — el color tiene que viajar con el
   *  dedo igual que el tamaño. Memorial degrada solo: ahí
   *  `accent.control` ES la tinta (Ley 8, sin rama propia). */
  const acentoNumero = useAnimatedStyle(() => {
    const anillo = Math.min(Math.abs(indice - indiceVivo.value), 1);
    return { color: interpolateColor(anillo, [0, 1], [acento, tinta]) };
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
        {/* r14-5 · EL NÚMERO A SANS con tabular-nums. El mono es dato
            de MÁQUINA (Ley 3) y un día que ELEGÍS es una elección, no
            un dato leído: el traje cambia con el rol. La cifra tabular
            conserva lo único que el mono aportaba acá — que 11 y 22
            ocupen lo mismo y la rueda no tiemble al pasar. */}
        <Animated.Text
          style={[
            {
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.xl,
              fontVariant: ['tabular-nums'],
            },
            acentoNumero,
          ]}
        >
          {dia.numero}
        </Animated.Text>
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

// ═══════════════ LA GRILLA QUE ELIGE + EL NULO HONESTO ═══════════════

/** LA GRILLA — una celda por opción, gramática ELEVACIÓN + ESCALA +
 *  COLOR DE TEXTO. Jamás relleno, jamás contorno.
 *
 *  r14-4 · GANÓ UN SEGUNDO CONSUMIDOR Y POR ESO SE GENERALIZÓ (era
 *  `GrillaHoras`, hora-only): la DURACIÓN venía de `SelectorOpcion`, y
 *  ahí el elegido se dibuja con BORDE en el acento — contorno magenta,
 *  que es lo que A6 mata y el founder rechazó cuatro veces. La cura NO
 *  es "sacarle el borde al SelectorOpcion" (es de `packages/ui`, y su
 *  contorno lo usan veinte pantallas): es que la duración hable la
 *  MISMA gramática que la hora, que es su vecina en la misma pantalla.
 *
 *  Y el relleno tampoco entra por la puerta de atrás: son CINCO
 *  hermanos comparables y L-b veta el pleno de 4 en adelante. Lo que
 *  queda es exactamente lo que la ley deja — elevación, escala, color
 *  de texto. Los dos ejes de la pantalla quedan con una sola voz. */
export function GrillaElegir({
  opciones,
  elegida,
  onElegir,
  voz = 'mono',
}: {
  opciones: { codigo: string; etiqueta: string }[];
  elegida: string | null;
  onElegir: (codigo: string) => void;
  /** 'mono' = dato de máquina (la hora) · 'sans' = voz humana (la
   *  duración: "30 min", "1 h"). Ley 3, sin excepción por comodidad. */
  voz?: 'mono' | 'sans';
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingHorizontal: spacing[5] }}>
      {opciones.map((o) => {
        const on = o.codigo === elegida;
        return (
          <Pressable
            key={o.codigo}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.etiqueta}
            onPress={() => onElegir(o.codigo)}
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
                fontFamily: voz === 'mono' ? typography.family.mono.regular : typography.family.sans.medium,
                fontSize: typography.size.sm,
                color: on ? theme.accent.control : theme.text.secondary,
              }}
            >
              {o.etiqueta}
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
