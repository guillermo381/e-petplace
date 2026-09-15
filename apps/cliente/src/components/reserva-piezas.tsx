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

import { useEffect, useState, type ReactNode } from 'react';
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
  Texto,
  radius,
  spacing,
  typography,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';

// ═══════════════ ① EL CABEZAL — LA BANDA DE COLOR MURIÓ ═══════════════

/* ☠️ **`CabezalOficio` MURIÓ (S116-C tanda 06 · punto 2).** Era el techo de las
 * cinco pantallas de oficio, y **ningún instrumento lo veía**: el censo del lote
 * 3b las contó como «sin cabecera» —no montaban `Encabezado` ni `Cabecera`— y
 * `verify:techos-locales` tampoco, porque su marcador es `LinearGradient` y esta
 * pieza pintaba `bg.base` PLANO. *El gate declara ese punto ciego en su propia
 * cabecera; lo que faltaba era alguien parado justo ahí.*
 *
 * Las cinco pasaron a `Cabecera variante="empujada"` + `HojaContenido`: el
 * título del oficio queda, el nombre de la mascota pasa a `apoyo`, y **el glifo
 * del oficio se pierde** — `Cabecera` no tiene ese slot y no se dibuja local.
 * Pedido a B, en el buzón. */

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

/**
 * SIN QUIÉN RESERVAR — **dos hechos distintos que compartían una sola voz**
 * (S112-C, censo del ítem 15).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL DEFECTO QUE LA PARIÓ, medido en las cinco raíces de oficio:** todas
 * decidían con `elegibles.length === 0`, que es VERDADERO en dos situaciones
 * que no se parecen en nada:
 *   ① **el hogar está vacío** — no hay ninguna mascota;
 *   ② **hay mascotas y ninguna aplica** — el hogar tiene un ave y el paseo es
 *      para perros.
 *
 * Con una sola voz, tres de las cinco **mentían en el caso ①**: paseo decía
 * *«El paseo es para perros — tu hogar todavía no tiene un perro registrado»*
 * a alguien que **no tiene ninguna mascota**, y eso se lee como *«tenés
 * mascotas pero ninguna es perro»*. **Y veterinaria mentía en el ② al revés:**
 * decía *«Tu hogar todavía no tiene mascotas»* a quien sí las tiene.
 *
 * *Ninguna de las dos frases es falsa por descuido: cada una es la verdad del
 * otro caso.* **El defecto no era el texto — era que un guard con dos hechos
 * adentro sólo puede decir uno.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Por qué una pieza y no cinco ternarios:** la voz del caso ① es la MISMA en
 * los cinco oficios (no hay nadie en el hogar — el oficio no cambia ese
 * hecho), y la del ② es propia de cada uno. *Cinco copias de la voz universal
 * es cómo una queda vieja.* Acá vive el reparto; cada oficio sigue trayendo su
 * propia frase de especie por props, donde siempre estuvo.
 *
 * ⚠️ **NO ofrece adopción, y es deliberado.** El founder la pidió en el HOGAR
 * sin mascotas, que es donde la persona está mirando su casa. Acá está a mitad
 * de una reserva: ofrecerle adoptar a quien vino a reservar un baño es cambiarle
 * de tema. *El camino honesto acá es el que ya estaba — agregar su mascota.*
 */
export function SinQuienReservar({
  hayMascotas,
  tituloSinNadie,
  detalleSinNadie,
  tituloEspecie,
  detalleEspecie,
  etiquetaSinNadie,
  etiquetaEspecie,
  onAccion,
  icono,
}: {
  /** 🔴 **El discriminador.** `true` = hay mascotas y ninguna aplica (②);
   *  `false` = el hogar está vacío (①). Se pasa el HECHO, no la voz elegida:
   *  *si el llamador eligiera el texto, cada pantalla podría volver a
   *  equivocarse de caso, que es el defecto que esta pieza cierra.* */
  hayMascotas: boolean;
  tituloSinNadie: string;
  detalleSinNadie: string;
  tituloEspecie: string;
  detalleEspecie: string;
  /** 🔴 **LA ETIQUETA TAMBIÉN SE PARTE, y fue el tercer hallazgo del censo:**
   *  las cuatro raíces mandaban `paquete.sinPerrosAccion` —*«Agregar a mi
   *  perro»*— **incluida veterinaria, que atiende a todas las especies**, y
   *  grooming, que atiende perros y gatos. Con el hogar vacío eso le dice a
   *  alguien que para usar al veterinario tiene que conseguirse un perro.
   *  *El botón es parte del guard: si el título se parte y la etiqueta no, la
   *  mitad del mensaje sigue siendo del otro caso.* */
  etiquetaSinNadie: string;
  etiquetaEspecie: string;
  onAccion: () => void;
  icono?: ReactNode;
}) {
  return (
    <EstadoVacio
      icono={icono}
      titulo={hayMascotas ? tituloEspecie : tituloSinNadie}
      descripcion={hayMascotas ? detalleEspecie : detalleSinNadie}
      accion={
        <Boton
          variante="primario"
          etiqueta={hayMascotas ? etiquetaEspecie : etiquetaSinNadie}
          onPress={onAccion}
        />
      }
    />
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
