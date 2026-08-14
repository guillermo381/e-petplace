/**
 * LA BALDOSA DE `ATENDER` — la pieza que se ELIGE.
 * (S98-C · `LA_CASA_DEL_PRESTADOR` §2.1bis · `DIRECCION_ARTE` §13.)
 *
 * ═══ POR QUÉ NO ES UNA `Celda` ═════════════════════════════════════════
 * Dirección de forma del founder (Acto II): **tarjetas para lo que se
 * elige, filas para lo que se lee.** Las puertas de esta portada se
 * eligen —una por oficio, una por la tienda— y son entre una y cinco: una
 * lista de filas las leería como inventario. *Una fila dice «esto es lo
 * que hay»; una tarjeta dice «entrá por acá».*
 *
 * ═══ ANATOMÍA LOCAL, CON SU PROMOCIÓN DECLARADA ════════════════════════
 * Vive en `apps/prestador` y **no en `packages/ui`** a propósito, con el
 * precedente de la casa (`GateRoto`/`PantallaCaida`, S79-B): *la pieza
 * nace local, se gatea, y recién con el ojo del founder encima se
 * promueve.* El contrato ya viajó a B (pedido de esta sesión) para que la
 * promoción sea una mudanza y no un rediseño.
 *
 * ═══ EL CANTO: LA LEY 10, REPLICADA Y DECLARADA ════════════════════════
 * `EL CANTO DICE CATEGORÍA, EL GLIFO DICE SERVICIO` — la misma ley que
 * `FilaCita` cierra adentro:
 *   · **SALUD** → `capa.identidad` (veterinaria)
 *   · **CUIDADO** → `capa.cuidado` (paseo · grooming · adiestramiento
 *     COMPARTEN teal a propósito: los separa el glifo, no el canto)
 *   · **CONSUMO** → el ocre (`status.warning`), la capa con la que el
 *     registry ya viste `despensa`, `negocio` y `pagos`.
 *
 * ⚠️ **La resolución está DUPLICADA de `FilaCita` y se declara**, igual
 * que `FilaCita` declaró su propia duplicación de los tokens de `Tarjeta`.
 * No se pudo reusar porque esa pieza cierra el color adentro y **no expone
 * API para elegirlo — que es exactamente lo correcto** (una prop de color
 * sería API genérica para romper la ley desde cualquier pantalla). La
 * duplicación queda ACOTADA a este archivo y muere con la promoción a B.
 *
 * **La pantalla no elige color, ni ancho, ni alfa:** entra un oficio (o la
 * tienda) y sale su canto.
 *
 * ═══ LO QUE CUMPLE DEL NORTE ═══════════════════════════════════════════
 * · **N7** — el glifo va a 48 sobre su tinte: presencia real, jamás 32.
 * · **N4** — `radius.lg`, el mismo de `Tarjeta`. Nada fuera de escala.
 * · **N2** — todo el espaciado sale de `spacing` (múltiplos de 8; el 4
 *   solo para el par íntimo glifo-texto, que acá ni siquiera hace falta).
 * · **N5** — cero acento propio: el color vive en el canto y en el tinte
 *   del glifo, que son CAPA (taxonomía), no acento de acción.
 * · **N6** — `usePresionado`, la receta única de la casa.
 * · **N1** — los tamaños salen de las variantes de `Texto`, jamás de un
 *   número tipeado.
 */

import { Pressable, View } from 'react-native';
import {
  Icono,
  Texto,
  radius,
  spacing,
  usePresionado,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';
import Animated from 'react-native-reanimated';

import type { OficioAtender } from '@/lib/capacidad-atender';

const ANCHO_CANTO = 3;
const LADO_GLIFO = 48;

/** El glifo de cada puerta. `training` es el nombre del registry para
 *  adiestramiento (S67, estrenado por pedido del founder en su gate). */
const GLIFO: Record<OficioAtender, IconoNombre> = {
  veterinaria: 'veterinaria',
  grooming: 'grooming',
  paseo: 'paseo',
  adiestramiento: 'training',
};

export type PuertaBaldosa = { clase: 'oficio'; oficio: OficioAtender } | { clase: 'tienda' };

export interface BaldosaAtenderProps {
  puerta: PuertaBaldosa;
  titulo: string;
  subtitulo: string;
  onPress: () => void;
}

export function BaldosaAtender({ puerta, titulo, subtitulo, onPress }: BaldosaAtenderProps) {
  const { theme } = useTheme();
  // La receta única de la casa (D-401): 0.99, el escalón de superficie
  // grande — el mismo que `Tarjeta`, porque esto ES una superficie grande.
  const { handlers, estiloPresionado } = usePresionado(0.99);

  // LEY 10 — cerrada acá dentro, sin API que permita romperla.
  const capa =
    puerta.clase === 'tienda'
      ? theme.status.warning
      : puerta.oficio === 'veterinaria'
        ? theme.capa.identidad
        : theme.capa.cuidado;
  // EL PLATO DEL GLIFO. **Memorial no tiene `capaBg`, y su ausencia es la
  // LEY, no un hueco** (`Insignia`, S82): ahí el tinte de capa cae a la
  // superficie serena — el patrón exacto de `AvatarMascota` y
  // `FichaMascotaHogar`, copiado y no reinventado.
  const esMemorial = theme.mode === 'memorial';
  const conCapa = !esMemorial && 'capaBg' in theme;
  const tinte =
    puerta.clase === 'tienda'
      ? theme.status.warningBg
      : conCapa
        ? theme.capaBg[puerta.oficio === 'veterinaria' ? 'identidad' : 'cuidado']
        : theme.bg.overlay;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={subtitulo}
      onPressIn={handlers.onPressIn}
      onPressOut={handlers.onPressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[4],
            padding: spacing[5],
            // Los tokens EXACTOS de `Tarjeta` reposo, igual que `FilaCita`
            // (ver el encabezado: la duplicación es acotada y declarada).
            backgroundColor: theme.bg.card,
            borderRadius: radius.lg,
            boxShadow: theme.elevacion.reposo,
            // EL CANTO: borde izquierdo del elemento que lleva el radio
            // (§9.1/§9.2) — un borde con `borderRadius` sigue la curva por
            // construcción, en vez de ser mordido por el recorte.
            borderLeftWidth: ANCHO_CANTO,
            borderLeftColor: capa,
          },
          estiloPresionado,
        ]}
      >
        <View
          style={{
            width: LADO_GLIFO,
            height: LADO_GLIFO,
            borderRadius: radius.md,
            backgroundColor: tinte,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icono
            nombre={puerta.clase === 'tienda' ? 'despensa' : GLIFO[puerta.oficio]}
            tamano={28}
            registro="aa"
          />
        </View>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Texto variante="seccion">{titulo}</Texto>
          <Texto variante="apoyo" color="secondary">
            {subtitulo}
          </Texto>
        </View>
      </Animated.View>
    </Pressable>
  );
}
