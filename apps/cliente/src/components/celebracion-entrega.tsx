/**
 * LA CELEBRACIÓN DE LA ENTREGA — el pedido llegó, y algo quedó de él.
 * (S100-D · L3 · `DIRECCION_DISENO_S99` N14 · `DIRECCION_ARTE` §13 N10 y su
 * enmienda de la ESCALA DE LA CEREMONIA.)
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LA INTENCIÓN DE FORMA (§0.1 — va ANTES del código, no después)
 * ═══════════════════════════════════════════════════════════════════════
 * · **Qué debe sentir quien la usa:** que el pedido llegó **y que algo quedó
 *   de él**. No es euforia de compra —esta casa no celebra transacciones—:
 *   es el cierre sereno de un recorrido que la familia vino siguiendo.
 * · **Qué referencia la informa:** el `Destape` de la casa. Se toma su
 *   MECANISMO —*los ~3000 se logran ABRIENDO LAS PAUSAS, jamás estirando
 *   los gestos*— y **no se toma nada de su contenido**: isotipo, rampa y
 *   tabs son el nacimiento de un NEGOCIO, y un pedido que llega no es eso.
 * · **Qué piezas de la casa la resuelven:** `Icono` (el visto que la
 *   escalera ya usa para `entregado`) · `Texto` · los tokens de `motion`.
 *   Cero pieza nueva de `packages/ui`: esta ceremonia tiene UN consumidor.
 *
 * ── 🔴 EL JUICIO QUE DECLARO, PORQUE NO ES OBVIO: NO TRASPLANTO LOS ~3000 ──
 * La firma de ~3000 ms es de `Destape` y de **sus CINCO actos**. Acá hay
 * TRES, y son de otra naturaleza. Estirar las pausas hasta llegar a 3000
 * con tres actos no reproduce el ritual: lo vuelve lento — que es
 * exactamente lo que la enmienda previene cuando dice *«un fade de casi un
 * segundo no se lee como ceremonia: se lee como lentitud»*.
 *
 * **Y el canon ya tiene la lección con nombre:** *una proporción
 * trasplantada a otra escala deja de ser la misma* (S99, ley ③ del arco de
 * la barra). ⇒ **Lo que se hereda es la LEY —pausas abiertas, gestos en el
 * vocabulario cerrado, degradación— y no el número.**
 *
 * Los gestos NO se tocan: `estandar` (300) y `grande` (520), de `motion`.
 * Lo que se abre son los `at:` — **0 · 620 · 1400**, y el total sale de la
 * suma, como en `Destape`.
 *
 * ── REDUCE-MOTION Y MEMORIAL: crossfade corto, y comparten brazo ─────────
 * Los dos piden lo mismo —que nada se desplace— y la casa ya tiene esa
 * receta escrita en `Entrada`. Acá se aplica el mismo criterio de mesa:
 * *el ritual es para quien puede disfrutarlo, no una imposición.* Un solo
 * fundido de ~300 ms, sin escalonar, sin desplazamiento.
 *
 * ── 🔴 UNA SOLA VEZ, Y SIN ESTO LA PIEZA ES UN DEFECTO ──────────────────
 * *«Es un ritual de única vez — hay que disfrutarlo»* (firma del founder).
 * Una ceremonia que vuelve a correr **cada vez que la familia abre un
 * pedido entregado** deja de ser un ritual y pasa a ser ruido —y encima
 * ruido que se interpone entre el dueño y los datos de su compra—. Por eso
 * la vista se PERSISTE por pedido: corre en la primera apertura y nunca
 * más. *No es una optimización: es la condición para que el momento
 * signifique algo.*
 *
 * Si el almacenamiento falla, **se elige NO celebrar** (`vista = true`):
 * ante la duda, la pieza se calla. *Repetir la ceremonia molesta; no
 * mostrarla una vez no rompe nada.*
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icono, Texto, motion, spacing, useTheme } from '@epetplace/ui';
import { useReducedMotion } from 'react-native-reanimated';

/** Los tres actos, con sus PAUSAS abiertas. Los `dur` son del vocabulario
 *  cerrado de N10; lo que se abre es el `at`. Una tabla, un reloj.
 *
 *  ⚠️ **`estandar` (300) y NO `normal`:** `motion.duration.normal` vale
 *  **250** y es un token LEGADO con consumidores vivos — su propio comentario
 *  lo dice. El vocabulario cerrado de N10 son `micro · estandar · grande`;
 *  usar `normal` habría animado fuera del vocabulario **con un nombre que
 *  parece correcto**, que es la peor forma de salirse de una ley. */
const ACTOS = [
  { at: 0, dur: motion.duration.grande }, // ① el sello
  { at: 620, dur: motion.duration.estandar }, // ② llegó
  { at: 1400, dur: motion.duration.estandar }, // ③ lo que quedó
] as const;

/** El fundido único de la degradación (§ reduce-motion / memorial). */
const CROSSFADE = motion.duration.estandar;

/** El bezier de la casa `(.32,.72,0,1)` vive en `motion.marca`, NO en
 *  `motion.easing` —que tiene otros cuatro—. Medido, no supuesto. */
const BEZIER_CASA = motion.marca.aperturaBezier;

const claveVista = (pedidoId: string) => `celebracion-entrega:${pedidoId}`;

export interface CelebracionEntregaProps {
  /** Identidad del pedido — la ceremonia se recuerda POR PEDIDO. */
  pedidoId: string;
  /** El titular del momento. Lo compone la pantalla: acá no se formatea. */
  titulo: string;
  /** La línea de cierre. `undefined` = el tercer acto no existe (y entonces
   *  no se dibuja: un acto vacío es un beat que no lleva a ninguna parte). */
  cierre?: string;
}

export function CelebracionEntrega({ pedidoId, titulo, cierre }: CelebracionEntregaProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  /** Memorial y reduce-motion comparten brazo A PROPÓSITO: los dos piden
   *  que nada se desplace, y la casa ya escribió esa receta en `Entrada`. */
  const quieto = theme.mode === 'memorial' || reduceMotion;

  /** `null` = todavía no sabemos si ya se vio. No se dibuja nada hasta
   *  saberlo: mostrar y esconder sería un parpadeo. */
  const [debeCorrer, setDebeCorrer] = useState<boolean | null>(null);

  useEffect(() => {
    let vive = true;
    void AsyncStorage.getItem(claveVista(pedidoId))
      .then((v) => {
        if (vive) setDebeCorrer(v === null);
      })
      // Ante la duda, callar (ver cabecera).
      .catch(() => {
        if (vive) setDebeCorrer(false);
      });
    return () => {
      vive = false;
    };
  }, [pedidoId]);

  // Se marca como vista al CORRER, no al terminar: si la familia sale a
  // mitad de la ceremonia, ya la vio empezar — repetirla sería peor.
  useEffect(() => {
    if (debeCorrer !== true) return;
    void AsyncStorage.setItem(claveVista(pedidoId), '1').catch(() => {
      // Un fallo de escritura solo cuesta una repetición; no se grita.
    });
  }, [debeCorrer, pedidoId]);

  if (debeCorrer !== true) return null;

  return (
    <View style={{ paddingHorizontal: spacing[5], gap: spacing[2], alignItems: 'center' }}>
      {/* ① EL SELLO — 24, no 32, y no es gusto. El glifo está dibujado en
          MASA para sobrevivir a 12 px; a 32 deja de leerse como sello y se
          lee como bulto. Y hay una segunda razón, que es Chanel: la escalera
          de esta misma pantalla YA dibuja `nodoEntregado` en su último nodo.
          Repetirlo grande diría dos veces lo mismo — acá entra como SELLO
          del momento (el acto que se cierra), no como estado (que es trabajo
          de la escalera, y ya lo hace bien). */}
      <Acto indice={0} quieto={quieto}>
        <Icono nombre="nodoEntregado" tamano={24} registro="tinta" tinta={theme.accent.control} />
      </Acto>
      <Acto indice={1} quieto={quieto}>
        <Texto variante="seccion">{titulo}</Texto>
      </Acto>
      {cierre === undefined ? null : (
        <Acto indice={2} quieto={quieto}>
          <Texto variante="apoyo">{cierre}</Texto>
        </Acto>
      )}
    </View>
  );
}

/**
 * Un acto de la ceremonia. **Solo opacidad**: nada se desplaza, ni siquiera
 * en el camino normal — el desplazamiento es de `Entrada` (§5) y esto no es
 * una entrada de pantalla, es un momento adentro de una que ya está.
 */
function Acto({
  indice,
  quieto,
  children,
}: {
  indice: number;
  quieto: boolean;
  children: React.ReactNode;
}) {
  const opacidad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Degradado: UN fundido corto, sin pausa escalonada. Los tres actos
    // aparecen juntos — la ceremonia se vuelve un estado, no una secuencia.
    const at = quieto ? 0 : ACTOS[indice].at;
    const duration = quieto ? CROSSFADE : ACTOS[indice].dur;
    const anim = Animated.timing(opacidad, {
      toValue: 1,
      duration,
      delay: at,
      easing: Easing.bezier(...BEZIER_CASA),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [indice, quieto, opacidad]);

  return <Animated.View style={{ opacity: opacidad }}>{children}</Animated.View>;
}
