/**
 * 01 · PROPUESTA — la primera pantalla de alguien que llega (S116-C lote 3).
 *
 * ── QUÉ SE VE ─────────────────────────────────────────────────────────────
 * Fondo con el degradado de entrada. Arriba, la nariz con el wordmark (clara,
 * chica). En el medio, el claim de la casa. Debajo, **una** línea de apoyo.
 * Abajo, dos acciones: «Crear cuenta» primaria y «Ya tengo cuenta» secundaria
 * en blanco. Todo entra escalonado **la primera vez**. *Nada más en la
 * pantalla* — el encargo lo dice así y es la mitad de lo que la hace funcionar.
 *
 * ── ☠️ LO QUE MURIÓ DE LA VERSIÓN S104, con su razón ─────────────────────
 * La ceremonia vieja tenía cuatro actos (`RespiroDeMarca` · `PaseoDeHuellas` ·
 * `MarcaDeAgua` · `Entrada`). **Mueren los tres primeros:**
 *   · **la marca de agua** y **la senda de huellas**: la revisión de mesa las
 *     nombró en el Hogar —*«los círculos decorativos translúcidos y la marca de
 *     agua del isotipo… el sketch no los tiene; son ruido»*— y la razón es la
 *     misma acá. Además la letra §1.1 retira la huella como ley del ícono.
 *   · **el respiro**: su lugar es el splash (00), donde la marca está sola.
 *     *Repetirlo acá lo gastaría: un gesto que ocurre dos veces seguidas deja
 *     de leerse como un saludo y pasa a leerse como un loader.*
 * **Queda `Entrada`**, la escalonada de la casa (45/300, bezier .32,.72,0,1).
 *
 * ── LA CONTINUIDAD CON 00, dicha por lo que es ───────────────────────────
 * El splash termina oscureciéndose a ESTE degradado y la nariz queda arriba,
 * en el mismo eje. **No es un objeto que viaja entre rutas** (eso es un
 * *shared element* y exige agrupar estas rutas, que es tocar la navegación:
 * la nota de S104 sigue rigiendo). *Es continuidad compuesta, y se declara
 * como tal para que nadie la lea como lo otro.*
 *
 * ✅ **EL ACENTO DEL CLAIM YA ESTÁ** — B entregó `acentoSobreOscuro` (pedido 4
 * del buzón) y *«una vida.»* deja de ser un párrafo blanco. **Resuelve a la
 * PALETA y no al tema**, porque la superficie ciruela es oscura *aunque el
 * tema sea claro*; en memorial cae a `inverso`, que es §4 apagando la fiesta.
 * ⚠️ Por eso el claim se parte en dos `Texto` y no es un string: **el acento
 * es un color, no una palabra** — y un color no viaja adentro de una clave.
 *
 * TESIS: «acá vive la vida de tu mascota — entrá». FIRMA: el claim en Baloo
 * sobre la ciruela. Memorial N/A (pre-sesión).
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Boton, Entrada, LogoV5, Texto, gradients, motion, spacing } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** Cuánto baja el logo al empezar el viaje — es «el centro de la pantalla»
 *  aproximado, no una medición: el viaje es continuidad de GESTO, no de
 *  geometría (ver el comentario del render). */
const VIAJE_CAIDA = 220;

export default function Bienvenida() {
  const router = useRouter();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  /* ── EL VIAJE DE LA NARIZ · su motor ─────────────────────────────────────
     Arranca donde el splash la dejó —grande y bajada al centro— y se asienta.
     **Los dos números salen del token**: la curva es la de la marca (la misma
     que respira la nariz en 00) y la duración es la `grande` de la casa, que
     es la del registro de celebración. *Un viaje con la curva de otra pantalla
     se lee como dos apps.*

     ⚠️ **`useReducedMotion` apaga el viaje entero, no lo acorta**: quien pidió
     no ver desplazamiento no quiere uno más rápido, quiere ninguno. Misma ley
     que `Entrada` y que el splash. */
  const quieto = useReducedMotion();
  const viaje = useSharedValue(quieto ? 1 : 0);
  useEffect(() => {
    if (quieto) return;
    viaje.value = withTiming(1, {
      duration: motion.duration.grande,
      easing: Easing.bezier(...motion.marca.aperturaBezier),
    });
  }, [quieto, viaje]);
  const estiloViaje = useAnimatedStyle(() => ({
    /* De 1.9× —cerca del protagonista del splash— a su tamaño de cabecera. */
    transform: [
      /* 🔴 **LA AMPLITUD SE RECALIBRA CON EL TOKEN, y por eso se toca acá.**
         El viaje iba de 1,9× a 1 porque el logo aterrizaba en `cabecera`
         (120 px) y tenía que salir del tamaño del splash. Con `portada` ya
         llega grande —46 % contra el 50 % de `protagonista`—, así que lo que
         queda por recorrer es **poco**: de 1,15 a 1. *Dejar el 1,9 con el
         token nuevo lo lanzaría a casi el ancho entero de la pantalla: el
         mismo viaje con otro destino deja de ser un viaje y pasa a ser un
         salto.* */
      { scale: 1 + (1 - viaje.value) * 0.15 },
      /* Y bajada: en el splash estaba al centro de la pantalla. */
      { translateY: (1 - viaje.value) * VIAJE_CAIDA },
    ],
  }));

  return (
    <LinearGradient
      colors={gradients.entradaV5.colors as unknown as readonly [string, string, ...string[]]}
      locations={gradients.entradaV5.locations as unknown as readonly [number, number, ...number[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.05, y: 1 }}
      style={{
        flex: 1,
        paddingTop: insets.top + spacing[8],
        paddingBottom: insets.bottom + spacing[6],
        paddingHorizontal: spacing[6],
      }}
    >
      {/* ① LA IDENTIDAD — arriba, chica. Sobre el degradado va la versión
          para fondo oscuro. El logo queda FUERA de la contabilidad de dosis
          (Ley 4): es identidad, no acento. */}
      {/* 🔴 **EL VIAJE DE LA NARIZ — S116-C lote 3e, y se declara CÓMO está
          hecho porque no es lo que parece.**

          El encargo pide que la nariz *viaje* del splash a 01. La forma
          canónica sería un ELEMENTO COMPARTIDO entre rutas — **y esta casa lo
          retiró en S80**, medido: API experimental de Reanimated 4, costo alto
          contra retorno cero. *No se reabre una decisión medida para un
          adorno.*

          Lo que hace esto: el logo de 01 **entra grande y centrado —donde
          estaba la nariz— y se asienta en su lugar**. El viaje es del lado de
          01, no entre las dos. **Y funciona porque 00 sale EN EL ACTO** (su
          propia cabecera lo firma: nunca espera a terminar una animación), así
          que el ojo ve una continuidad: lo último del splash es la marca
          grande al centro, y lo primero de 01 es la marca grande al centro
          yéndose a su sitio.

          ⚠️ **No pretende ser el mismo píxel**, y por eso no se le pide
          exactitud: es continuidad de gesto, no de geometría. *Prometer un
          elemento compartido y entregar una ilusión sería el verosímil-falso
          de siempre; entregar la ilusión diciendo que lo es, es honesto.* */}
      <Animated.View style={[{ alignItems: 'center' }, estiloViaje]}>
        {/* ⭐ **`portada`, el MISMO token que 05 — S116-C lote 3i.**
            ⏪ Acá decía `cabecera`, que es **120 px FIJOS**; `portada` es el
            **46 % del ancho** (≈497 en un teléfono de 1080). *Cuatro veces más
            chico, y en la pantalla donde la marca preside.* El founder lo vio
            en el aparato comparándola con 05.
            **No es que 01 «se veía chica»: consumía otro token** — y los dos
            existían, así que nada fallaba. */}
        <LogoV5 sobre="oscuro" tamano="portada" />
      </Animated.View>

      {/* ② EL CLAIM — el centro de la pantalla, y lo único que se lee de
          lejos. `titulo` es la variante de display del cliente. */}
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing[4] }}>
        <Entrada orden={1}>
          <Texto variante="titulo" color="inverso">
            {`${t('bienvenida.titular')} `}
            <Texto variante="titulo" color="acentoSobreOscuro">
              {t('bienvenida.titularAcento')}
            </Texto>
          </Texto>
        </Entrada>
        {/* ③ UNA sola línea de apoyo. *Dos líneas acá convierten una promesa
            en un folleto.* */}
        <Entrada orden={2}>
          <Texto variante="cuerpo" color="inverso">
            {t('bienvenida.apoyo')}
          </Texto>
        </Entrada>
      </View>

      {/* ④ LAS DOS ACCIONES. Una sola es la principal (N5 · Ley 5): «Crear
          cuenta» en magenta; «Ya tengo cuenta» baja a secundario blanco.
          Tocar durante la entrada navega igual — la interacción le gana a la
          coreografía. */}
      <Entrada orden={3}>
        <View style={{ gap: spacing[3] }}>
          <Boton
            variante="primario"
            superficie="oscura"
            etiqueta={t('bienvenida.crearCuenta')}
            bloque
            onPress={() => router.push('/beneficios')}
          />
          {/* ✅ **`superficie="oscura"`** — B lo entregó (pedido 5). Va como
              SUPERFICIE y no como variante porque *la superficie es ortogonal
              a la variante*: el día que otra variante necesite este fondo cae
              en la tabla sola. El primario conserva su magenta —es la acción,
              y magenta sobre ciruela es el par de la letra §2—; el secundario
              pasa a blanco y deja de ser magenta sobre ciruela, que §2
              prohíbe textual. */}
          <Boton
            variante="secundario"
            superficie="oscura"
            etiqueta={t('bienvenida.yaTengoCuenta')}
            bloque
            onPress={() => router.push('/login')}
          />
        </View>
      </Entrada>
    </LinearGradient>
  );
}
