/**
 * @override-s82c — LAS PIEZAS DEL FLUJO DE RESERVA (r9, del contexto 3
 * de la lámina patron-2-lista-colapsable.html, leída como CRITERIO §10:
 * cero box-shadow/transición de CSS, el motion va por Reanimated, el
 * .js es DOM y su lógica se re-pensó).
 *
 * ⚠️ DOS GATES ABIERTOS, LAS DOS OPCIONES CONSTRUIDAS (orden founder —
 * la lámina daba por firmado lo que no lo está):
 *
 *  ① EL TECHO DEL OFICIO **NUNCA SE FIRMÓ**. La lámina afirma "el gate
 *    quedó en B" y es FALSO. Van las dos: (a) techo OSCURO con texto
 *    papel · (b) techo CLARO por oficio. El founder elige en el
 *    teléfono; la perdedora muere después del gate.
 *
 *  ② EL RIEL NO REEMPLAZA A D3. D3 es una RUEDA con calibración
 *    FIRMADA (escalas 1.16/0.94/0.84/0.78 · opacidades 1/.62/.34/.18 ·
 *    520 ms cubic-bezier(.32,.72,0,1) · ítem 66 · separación 10 · paso
 *    76 · el elegido SIEMPRE centrado). El riel es OTRA INTERACCIÓN,
 *    no otra calibración de la misma. Van las dos tras el mismo switch.
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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

// ═══════════════ EL SWITCH DE GATE (debug, muere post-gate) ═══════════

export type ModoTecho = 'oscuro' | 'oficio';
export type ModoDia = 'riel' | 'rueda';

/** El control que el founder toca EN EL TELÉFONO para comparar las dos
 *  opciones de cada gate. NO usa `__DEV__` a propósito: `__DEV__` no
 *  viaja al bundle de preview y el gate se corre sobre la APK (L-138).
 *  Se ve feo A PROPÓSITO — es andamio, no producto, y su fealdad es lo
 *  que garantiza que nadie lo confunda con una pieza terminada. */
export function SwitchGate({
  techo,
  dia,
  onTecho,
  onDia,
}: {
  techo: ModoTecho;
  dia: ModoDia;
  onTecho: (m: ModoTecho) => void;
  onDia: (m: ModoDia) => void;
}) {
  const { theme } = useTheme();
  const btn = (activo: boolean) => ({
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.suave,
    backgroundColor: activo ? theme.text.primary : theme.bg.overlay,
  });
  const txt = (activo: boolean) => ({
    fontFamily: typography.family.mono.regular,
    fontSize: 11,
    color: activo ? theme.bg.card : theme.text.secondary,
  });
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: theme.bg.overlay,
      }}
    >
      <Text style={{ fontFamily: typography.family.mono.regular, fontSize: 10, color: theme.text.tertiary }}>gate</Text>
      <Pressable onPress={() => onTecho('oscuro')} style={btn(techo === 'oscuro')} accessibilityRole="radio">
        <Text style={txt(techo === 'oscuro')}>techo oscuro</Text>
      </Pressable>
      <Pressable onPress={() => onTecho('oficio')} style={btn(techo === 'oficio')} accessibilityRole="radio">
        <Text style={txt(techo === 'oficio')}>techo claro</Text>
      </Pressable>
      <View style={{ width: 1, height: 16, backgroundColor: theme.border.default }} />
      <Pressable onPress={() => onDia('riel')} style={btn(dia === 'riel')} accessibilityRole="radio">
        <Text style={txt(dia === 'riel')}>riel</Text>
      </Pressable>
      <Pressable onPress={() => onDia('rueda')} style={btn(dia === 'rueda')} accessibilityRole="radio">
        <Text style={txt(dia === 'rueda')}>rueda D3</Text>
      </Pressable>
    </View>
  );
}

// ═══════════════ ① EL TECHO — LAS DOS OPCIONES ═══════════════

/** (a) OSCURO con texto papel · (b) CLARO por oficio (el tinte de la
 *  capa sobre papel). Ninguna está firmada: el gate decide. */
export function TechoReserva({
  modo,
  oficio,
  titulo,
  detalle,
  precio,
  precioDesde,
  onAtras,
  insetTop,
}: {
  modo: ModoTecho;
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
  const claro = modo === 'oficio' && !esMemorial;
  // (b) el techo claro toma el TINTE de la capa del oficio; (a) el
  // oscuro toma la tinta de la casa. Cero hex nuevo. (El tinte se
  // resuelve ANTES del ternario: memorial no tiene registro capaBg y
  // el narrowing del `in` dentro del ternario dejaba theme en never.)
  const tinteCapa = 'capaBg' in theme ? theme.capaBg.cuidado : theme.bg.overlay;
  const tintaCasa = theme.bg.tinta;
  const fondo = esMemorial ? theme.bg.card : claro ? tinteCapa : tintaCasa;
  const sobre = esMemorial || claro ? theme.text.primary : theme.text.onGradient;
  const sobreSuave = esMemorial || claro ? theme.text.secondary : theme.text.onGradient;

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
      {/* la luz de la esquina (A4 §9bis.2 FIRMADA) — el único adorno.
          En el claro se apaga: sobre un tinte suave, blanco al 7% es
          ruido invisible (L-c: si no dice nada, sobraba). */}
      {!claro && !esMemorial ? (
        <View
          style={{
            position: 'absolute',
            top: -86,
            right: -64,
            width: 242,
            height: 242,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.07)',
          }}
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Pressable
          accessibilityRole="button"
          onPress={onAtras}
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            backgroundColor: claro || esMemorial ? theme.bg.card : 'rgba(255,255,255,0.15)',
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

/** (a) EL RIEL — la propuesta de la lámina: tarjetas 66×80, el elegido
 *  crece a 1.06 y se eleva; los otros a 0.955 y 0.86 de opacidad. */
function RielDias({
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing[2.5], paddingHorizontal: spacing[5], paddingVertical: spacing[1] }}
    >
      {dias.map((d) => {
        const on = d.iso === elegido;
        const cerrado = cerrados.has(d.iso);
        return (
          <Pressable
            key={d.iso}
            disabled={cerrado}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, disabled: cerrado }}
            accessibilityLabel={`${d.dia} ${d.numero}`}
            onPress={() => onElegir(d.iso)}
            style={{
              width: 66,
              height: 80,
              borderRadius: 22,
              backgroundColor: theme.bg.card,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              // ELEVACIÓN + ESCALA, jamás relleno (ley 1 de la lámina)
              boxShadow: on ? theme.elevacion.elevada : theme.elevacion.reposo,
              transform: [{ scale: on ? 1.06 : 0.955 }],
              opacity: cerrado ? 0.42 : on ? 1 : 0.86,
            }}
          >
            <Texto variante="dato">{d.dia}</Texto>
            <Text
              style={{
                fontFamily: typography.family.mono.medium,
                fontSize: typography.size.xl,
                // COLOR DE TEXTO: el tercer eje legal de la selección
                color: on ? theme.accent.control : theme.text.secondary,
              }}
            >
              {d.numero}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** (b) LA RUEDA — D3, con su calibración FIRMADA. El elegido SIEMPRE
 *  centrado (translateX), los vecinos decaen por anillo:
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
  const desplaz = useSharedValue(0);

  useEffect(() => {
    if (ancho === 0) return;
    // el elegido SIEMPRE centrado (la letra de D3)
    desplaz.value = withTiming(ancho / 2 - D3.item / 2 - indice * D3.paso, {
      duration: D3.duracion,
      easing: CURVA_D3,
    });
  }, [indice, ancho, desplaz]);

  const pista = useAnimatedStyle(() => ({ transform: [{ translateX: desplaz.value }] }));

  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={{ height: 96, justifyContent: 'center', overflow: 'hidden' }}
    >
      <Animated.View style={[{ flexDirection: 'row', gap: D3.paso - D3.item }, pista]}>
        {dias.map((d, i) => {
          const anillo = Math.min(Math.abs(i - indice), D3.escalas.length - 1);
          const cerrado = cerrados.has(d.iso);
          const on = i === indice;
          return (
            <Pressable
              key={d.iso}
              disabled={cerrado}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: cerrado }}
              accessibilityLabel={`${d.dia} ${d.numero}`}
              onPress={() => onElegir(d.iso)}
              style={{
                width: D3.item,
                height: 76,
                borderRadius: 22,
                backgroundColor: theme.bg.card,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                boxShadow: on ? theme.elevacion.elevada : theme.elevacion.reposo,
                transform: [{ scale: D3.escalas[anillo] }],
                opacity: cerrado ? 0.18 : D3.opacidades[anillo],
              }}
            >
              <Texto variante="dato">{d.dia}</Texto>
              <Text
                style={{
                  fontFamily: typography.family.mono.medium,
                  fontSize: typography.size.xl,
                  color: on ? theme.accent.control : theme.text.secondary,
                }}
              >
                {d.numero}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

export function SelectorDia(props: {
  modo: ModoDia;
  dias: DiaOpcion[];
  elegido: string;
  /** Fechas SIN disponibilidad. Hoy llega VACÍO: el dato no existe en
   *  el motor y no se inventa (ver cabecera). */
  cerrados?: Set<string>;
  onElegir: (iso: string) => void;
}) {
  const cerrados = props.cerrados ?? new Set<string>();
  return props.modo === 'rueda' ? (
    <RuedaDias dias={props.dias} elegido={props.elegido} cerrados={cerrados} onElegir={props.onElegir} />
  ) : (
    <RielDias dias={props.dias} elegido={props.elegido} cerrados={cerrados} onElegir={props.onElegir} />
  );
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
