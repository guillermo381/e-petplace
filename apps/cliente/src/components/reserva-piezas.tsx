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
 * ✅ r15 — EL DATO QUE NO EXISTÍA, YA EXISTE. En r9 declaré los días
 * CERRADOS como dato ausente (la lámina los pintaba de un array
 * hardcodeado) y dejé la prop esperando en vez de inventarlos. A
 * construyó el lector en su r7 (`obtener_dias_cerrados` + wrapper) y
 * acá se consume. Lo que la prop esperaba, llegó — y el hueco se
 * cerró en el orden correcto: primero el motor, después la pantalla.
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
  capa,
  titulo,
  detalle,
  onAtras,
  insetTop,
}: {
  oficio: IconoNombre;
  /** ⚠️ r30 · LA CATEGORÍA, DECLARADA POR LA PANTALLA — y OBLIGATORIA a
   *  propósito. Hasta hoy el tinte estaba fijo en `capa.cuidado`, que es
   *  correcto para paseo y MENTIRA para veterinaria; el riesgo real no
   *  era el color de hoy sino que se clonara así a tres oficios más
   *  (orden del founder: resolverlo ANTES de que se clone). Sin default:
   *  el tsc obliga a cada clon a DECIRLO, que es la única forma de que
   *  una taxonomía no se herede por copiar-pegar.
   *  Ley 10: paseo · grooming · adiestramiento = CUIDADO ·
   *  veterinaria = SALUD.
   *
   *  ⚠️ Y EL NOMBRE DEL TOKEN NO COINCIDE CON LA LEY, medido: NO EXISTE
   *  `capa.salud`. Las cuatro claves del tema son identidad · cuidado ·
   *  comunidad · comunidadAmplia, y lo que la Ley 10 llama SALUD vive
   *  bajo `identidad` (verdeVitalDark, "Capa 1 · vida" en el comentario
   *  del tema) — el token es más viejo que la taxonomía. La pantalla
   *  habla la LEY y la pieza traduce al token que existe, en UN solo
   *  lugar. Si algún día nace `capa.salud`, se cambia acá y nada más. */
  capa: 'cuidado' | 'salud';
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
  // ⚠️ NOTA DE LÁMINA (advertencia del founder): en CLARO `capa.cuidado`
  // YA NO es el teal vivo — es tealDark. El vivo daba 1.46 sobre papel
  // algodón (medido: 1.46 sobre light0, 1.40 sobre el tapiz) y B lo bajó
  // en su r5. Cualquier canto copiado de una lámina vieja trae el vivo:
  // acá el color sale del TEMA, jamás de una lámina.
  const colorOficio = capa === 'salud' ? theme.capa.identidad : theme.capa.cuidado;

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

// ═══════════════ ② EL DÍA — LA RUEDA D3 ═══════════════
//
// ⏫ PROMOVIDA A `packages/ui` EN S85-B8 (Regla de las Piezas: apareció el
// segundo consumidor, el bloque «Tu día» del prestador). Acá queda el
// RE-EXPORT para que las pantallas de este app no se toquen; su código,
// su calibración firmada y sus porqués viven ahora en
// `packages/ui/src/components/SelectorDia.tsx`, que es donde se leen al
// construir. Si algo hay que cambiar, se cambia allá.
export { SelectorDia, type DiaOpcion } from '@epetplace/ui';

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
const COLUMNAS = 4;

export function GrillaElegir({
  opciones,
  elegida,
  onElegir,
  voz = 'mono',
  columnas = COLUMNAS,
}: {
  opciones: { codigo: string; etiqueta: string }[];
  elegida: string | null;
  onElegir: (codigo: string) => void;
  /** r31 · cuántas columnas. Default 4 (horas, duraciones). El QUÉ de
   *  grooming son DOS comprables con etiqueta larga ("Baño y corte"):
   *  a 4 columnas no entran. La grilla se generaliza en vez de que ese
   *  eje se vaya a otro control — la pantalla habla UNA gramática. */
  columnas?: number;
  /** 'mono' = dato de máquina (la hora) · 'sans' = voz humana (la
   *  duración: "30 min", "1 h"). Ley 3, sin excepción por comodidad. */
  voz?: 'mono' | 'sans';
}) {
  const { theme } = useTheme();
  const [ancho, setAncho] = useState(0);
  // r16-2 · ANCHO UNIFORME, POR COLUMNAS IGUALES. De los dos caminos
  // que el founder ofreció, se elige LA GRILLA y no el scroll, por tres
  // razones y ninguna es estética:
  //  ① la grilla ya es la gramática de la HORA, que es su vecina en la
  //    misma pantalla — y unificar esas dos voces fue el punto de r14-4;
  //  ② un scroll ESCONDE opciones: cinco bloques de duración es un
  //    catálogo chico y completo, y lo que no se ve no se elige;
  //  ③ arriba vive la rueda de días, que ya captura el pan horizontal —
  //    dos carruseles apilados se pelean el mismo gesto.
  // El ancho se MIDE (no se estima con porcentajes): con `flexBasis:22%`
  // + `flexGrow:1` cada celda crecía según su contenido y la última fila
  // estiraba al chip solitario a todo el ancho. Columna medida = todas
  // iguales SIEMPRE, y la fila incompleta queda alineada con las de
  // arriba en vez de deformarse.
  const gap = spacing[2];
  const cols = Math.max(1, columnas);
  // 🔴 r17-3 · LA CUENTA ERA EXACTA Y POR ESO FALLABA. `(ancho - gaps)/4`
  // da un decimal (p.ej. 95.909…) cuyos cuatro anchos + tres gaps suman
  // EXACTAMENTE el contenedor en aritmética real — pero Yoga redondea
  // cada hijo a la grilla de píxeles del dispositivo, y basta que UNO
  // redondee hacia arriba para que la fila no entre y el cuarto chip
  // baje. Se ven tres y sobra hueco a la derecha, que es lo que el
  // founder vio. El diagnóstico que traía la orden ("divide contra un
  // ancho fijo") no era el caso — el reparto sí usa el ancho real; lo
  // que faltaba era CEDER EL RESTO: piso entero, y el sobrante (menos
  // de 4 px) queda al final en vez de romper la fila.
  const celda = ancho > 0 ? Math.floor((ancho - gap * (cols - 1)) / cols) : 0;
  return (
    // el padding vive AFUERA y la medición ADENTRO: `layout.width` de una
    // View con padding devuelve el ancho CON el padding, y restarlo a mano
    // es la clase de cuenta que se desincroniza sola.
    <View style={{ paddingHorizontal: spacing[5] }}>
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}
    >
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
              width: celda > 0 ? celda : undefined,
              flexGrow: 0,
              flexShrink: 0,
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

// ═══════════════ EL PIE FLOTANTE — SE MUDÓ A LA CASA ═══════════════

/** `PieReserva` YA NO VIVE ACÁ: subió a `@epetplace/ui` en S82-B r35,
 *  porque dos de sus cuatro pantallas lo tenían COPIADO A MANO y la
 *  copia había perdido el precio entero. Se re-exporta desde este
 *  archivo —en vez de cambiarle el import a cada consumidor— para que
 *  la mudanza no toque ni una pantalla: las tres que ya lo usaban
 *  siguen igual, y el `verify:diseno` R24 se encarga de que la próxima
 *  no nazca copiada. El contrato y sus tres cláusulas viven en el
 *  archivo de la pieza, que es donde se leen antes de tocarla. */
export { PieReserva, type PieReservaProps } from '@epetplace/ui';
