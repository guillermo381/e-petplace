/**
 * Entrada del app del dueño (S45-B4 → fix S45-splash) — routing por
 * estado real:
 *   sin sesión → /bienvenida
 *   sesión sin familia → /hogar (vacío) — `D-1101`
 *   sesión con familia → /home
 * URL-reconstruible: esta ruta no guarda nada, decide y redirige.
 * Regla 36: si el estado no llega (red muerta, backend caído), esto
 * NO se queda mudo — a los 8s muestra un estado digno con reintento.
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Entrada, EstadoVacio, IsotipoV5, Personaje, gradients, motion, palette, radius, spacing, type EspeciePersonaje, useTheme } from '@epetplace/ui';

import { getEstadoOnboardingDueno, obtenerPreferencias, obtenerSesion } from '@epetplace/api';

import { pisoDePermanenciaMs } from '@/lib/primera-apertura';
import { useRuedaDeCaras } from '@/lib/rueda-de-caras';
import { cambiarIdioma, obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

/**
 * 00 · SPLASH — la marca mientras se resuelve la sesión (S116-C lote 3).
 *
 * ── LO QUE SE VE, en el orden en que aparece ──────────────────────────────
 * ① la pantalla entera magenta con la nariz al centro, **sola** · ② en un
 * respiro la nariz se asienta (crece apenas y vuelve) y aparece un halo
 * detrás · ③ abajo entran, escalonados, los seis personajes; el del centro es
 * más grande y **cada tres segundos la cara grande se funde en la siguiente**
 * —fundido cruzado, sin deslizar— mientras la fila marca cuál es.
 *
 * ── 🔴 NO HAY BARRA DE CARGA, Y ES UNA CORRECCIÓN AL MOCK ────────────────
 * El plan §5 lo dice textual: *«la barra "Perros · Cargando" no simula
 * progreso. Es el paso de los personajes o desaparece»*. **La fila ES el
 * indicador.** *Una barra que se llena sin saber cuánto falta es una promesa
 * que el código no puede cumplir* — y acá no se puede saber: lo que se espera
 * es una respuesta de red.
 *
 * ── LA SALIDA NO ESPERA A LA VUELTA ──────────────────────────────────────
 * Cuando la sesión resuelve, se sale **en el acto**: no se completa el ciclo
 * de tres segundos ni se espera a ninguna cara. *Hacer esperar a alguien para
 * terminar una animación es cobrarle el adorno.*
 *
 * ── QUÉ PASA SI TARDA ────────────────────────────────────────────────────
 * Su consumidor (`index.tsx`) monta el estado digno con reintento a los 8 s.
 * **Acá no se dice nada de la demora**: esta pieza muestra la marca, no
 * diagnostica. *Dos superficies diciendo «está tardando» es una de más.*
 *
 * ⚠️ **`useReducedMotion`**: con la preferencia puesta, **nada se mueve** —
 * la nariz queda quieta, el halo fijo y la cara grande no rota. *Un splash es
 * puro movimiento: si alguien pidió no verlo, lo que queda es la marca
 * quieta, que sigue diciendo lo mismo.* (Misma ley que `usePresionado` en el
 * lote 2 de B, letra §1.11.)
 */

/** El orden de las caras. `otro` es la nariz, que cierra la vuelta. */
const CARAS: readonly EspeciePersonaje[] = ['perro', 'gato', 'conejo', 'ave', 'roedor', 'otro']



/* ── 🔴 LOS TIEMPOS SALEN DEL TOKEN, NO DE LA PANTALLA (firma del founder,
   13-sep-2026) ────────────────────────────────────────────────────────────
   ⏪ Acá había cinco números tecleados: `420`, `380`, `600`, `500` y el bezier
   `(0.32, 0.72, 0, 1)` **repetido dos veces**. Ese bezier **ES**
   `motion.marca.aperturaBezier` — o sea que la pantalla estaba reescribiendo
   la curva de la marca a mano. *Dos copias de la misma curva no se ven
   distintas hoy: se ven distintas el día que alguien afine una.* */

/** El respiro de la marca — ida y vuelta con la curva de marca. */
const MS_RESPIRO = motion.marca.aperturaMs
/** El halo entra después de la nariz: es luz que aparece, no un gesto.
 *  🔴 Tenía `legacy_verySlow` (600) y **`R51` lo cazó con razón**: el
 *  vocabulario del movimiento es CERRADO —150 · 300 · 520— y los legados están
 *  ahí para morir, no para estrenarse. Va `grande`, que es su registro: la
 *  aparición de la marca es el gesto más grande de la app. */
const MS_HALO = motion.duration.grande
/** «crece apenas y vuelve» — apenas, medido en la lámina: 6 %. */
const ESCALA_RESPIRO = 1.06
/** La curva de la marca, UNA vez. */
const CURVA_MARCA = Easing.bezier(...motion.marca.aperturaBezier)

function SplashMarca() {
  const quieto = useReducedMotion()
  const rueda = useRuedaDeCaras(CARAS)
  const indice = rueda.indice

  /* El respiro de la nariz: crece apenas y vuelve. UNA vez y después queda —
     un latido permanente convertiría la marca en un indicador de actividad,
     que es justamente lo que esta pantalla decidió no tener. */
  const escala = useSharedValue(1)
  /* El halo entra DESPUÉS del respiro: primero la marca sola, como pide el
     encargo («Nada más al principio»). */
  const halo = useSharedValue(0)

  useEffect(() => {
    if (quieto) {
      halo.value = 1
      return
    }
    escala.value = withSequence(
      withTiming(ESCALA_RESPIRO, { duration: MS_RESPIRO, easing: CURVA_MARCA }),
      withTiming(1, { duration: MS_RESPIRO, easing: CURVA_MARCA }),
    )
    halo.value = withTiming(1, { duration: MS_HALO, easing: Easing.out(Easing.quad) })
  }, [quieto, escala, halo])

  /* El fundido cruzado de la cara grande. **Se apaga y se prende sobre el
     cambio de índice**, no se desliza: el encargo lo pide así y además un
     deslizamiento sugeriría una lista que se puede recorrer con el dedo. */
  /* 🪦 ACÁ VIVÍA EL RELOJ DE LA RUEDA, y se muda a `lib/rueda-de-caras`.
     **02 nació con la misma rotación** (lote 5) y la `OndaAcceso` de B ya
     tenía una tercera. *Tres relojes iguales son tres que se desincronizan, y
     peor: tres lugares donde alguien tiene que acordarse de `useReducedMotion`*
     — la doctrina la escribió la casa al construir la onda, y acá se aplica.
     Lo que se mudó es el TIEMPO; el dibujo —la fila de seis, la cara grande—
     sigue siendo de esta pantalla. */

  const estiloNariz = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }))
  const estiloHalo = useAnimatedStyle(() => ({ opacity: halo.value * 0.18 }))
  const estiloCara = useAnimatedStyle(() => ({ opacity: rueda.opacidad.value }))

  return (
    <View style={{ flex: 1, backgroundColor: palette.magentaAccion, alignItems: 'center', justifyContent: 'center' }}>
      {/* ② EL HALO — detrás de la nariz, no encima. Es luz, no un aro: por eso
          es un círculo suave del rosa de la marca y no un borde. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: 260,
            height: 260,
            /* `radius.full` y no la mitad del lado: la casa tiene UNA escala y
               un círculo es la píldora llevada al cuadrado. *Un 130 tecleado
               además se rompe solo el día que alguien cambie el 260.* */
            borderRadius: radius.full,
            backgroundColor: palette.magentaLuz,
          },
          estiloHalo,
        ]}
      />

      {/* ① LA NARIZ — la marca, sobre magenta ⇒ la versión para fondo oscuro. */}
      <Animated.View style={estiloNariz}>
        {/* ⭐ **`tamano="protagonista"` — S116-C lote 3d.**
            ⏪ Estaba en `splash`, que es `avatarHogar` (**78 px**, el tamaño de
            un avatar de ficha) y en un teléfono de 390 ocupaba el 30 % del
            ancho: *la marca sola en pantalla entera se veía chica*.
            **El tamaño es una FRACCIÓN del ancho, no un número** —la pieza lo
            resuelve con `useWindowDimensions`—, así que acá no se pasa
            ninguna medida. *«Cerca de la mitad del ancho» no es un tamaño: es
            una proporción, y un px fijo la cumple en un aparato y la incumple
            en los demás.* */}
        <IsotipoV5 sobre="oscuro" tamano="protagonista" />
      </Animated.View>

      {/* ③ LA FILA — el indicador. La cara grande al centro se funde; las
          otras marcan cuál es. *La fila no es decoración: es lo único que
          dice que algo está pasando.* */}
      <View style={{ position: 'absolute', bottom: spacing[10], alignItems: 'center', gap: spacing[4] }}>
        <Animated.View style={estiloCara}>
          <Personaje especie={rueda.actual} tamano="hogar" fondo="blanco" />
        </Animated.View>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          {/* 🔴 **ENTRAN ESCALONADOS — S116-C lote 3e.**
              ⏪ La cabecera de esta pieza decía *«abajo entran, escalonados,
              los seis personajes»* desde el lote 3, **y el render los dibujaba
              los seis de una**. *Una coreografía escrita en un comentario es
              una coreografía que nadie ve* — y no fallaba nada, por eso
              sobrevivió tres lotes.

              Va `Entrada` y no un escalonado propio: es **la** entrada de la
              casa (45/300, la curva de marca) y **ya trae los dos brazos que
              esta pantalla necesita** —memorial y `useReducedMotion`— que un
              stagger local tendría que volver a escribir y alguien olvidaría.
              *El `orden` es semántico: es el orden de lectura, izquierda a
              derecha, no una posición física.* */}
          {CARAS.map((especie, i) => (
            <Entrada key={especie} orden={i}>
              <Personaje
                especie={especie}
                tamano="fila"
                fondo="blanco"
                elegido={i === indice}
              />
            </Entrada>
          ))}
        </View>
      </View>
    </View>
  )
}


// D-316 (S55-B3): al entrar con sesión, la preferencia de idioma de DB
// (verdad multi-dispositivo) pisa el cache local si difieren. Fire and
// forget: el routing no espera al riel.
function sincronizarIdiomaDesdeDB(): void {
  void obtenerPreferencias().then((r) => {
    if (r.ok && r.data.idioma !== null && r.data.idioma !== obtenerIdiomaActual()) {
      void cambiarIdioma(r.data.idioma);
    }
  });
}

const UMBRAL_COLGADO_MS = 8000;

/* ⏪ Se llamaba `Entrada`, y chocaba de frente con `Entrada` de
   `@epetplace/ui` —la entrada escalonada de la casa— que esta misma pantalla
   ahora monta. **El nombre del default export de una ruta no lo lee nadie más
   que quien abre el archivo**, así que el que tenía que ceder era éste: el de
   la pieza es vocabulario compartido. *Es el caso exacto que los tokens de
   `motion` describen — un nombre plausible es peor que uno que falta.* */
export default function Raiz() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [colgado, setColgado] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    const timer = setTimeout(() => {
      if (vigente) setColgado(true);
    }, UMBRAL_COLGADO_MS);

    /* 🔴 **EL PISO DE PERMANENCIA ARRANCA ACÁ Y CORRE EN PARALELO, jamás en
       fila.** Si se esperara el piso ANTES de pedir la sesión, en la primera
       apertura la app tardaría dos segundos **más** de lo que tarda hoy. Así,
       el piso y la red se gastan el mismo tiempo: en la práctica no demora
       nada que no estuviera esperando igual.

       Y se pide UNA vez, fuera del `async` de abajo: `esPrimeraApertura…`
       **marca en el mismo acto que lee**, así que llamarla dos veces daría
       `true` y después `false`. */
    const piso = pisoDePermanenciaMs().then(
      (ms) => new Promise<void>((listo) => setTimeout(listo, ms)),
    );

    void (async () => {
      const sesion = await obtenerSesion();
      if (!vigente) return;
      if (!sesion.ok || sesion.data === null) {
        /* El piso se cumple ANTES de irse, no antes de decidir a dónde: lo que
           se sostiene es la MARCA en pantalla, no el trabajo. */
        await piso;
        if (!vigente) return;
        clearTimeout(timer);
        router.replace('/bienvenida');
        return;
      }
      sincronizarIdiomaDesdeDB();
      const estado = await getEstadoOnboardingDueno();
      if (!vigente) return;
      clearTimeout(timer);
      if (!estado.ok) {
        // Sesión con backend inaccesible: estado digno con reintento.
        setColgado(true);
        return;
      }
      /* 🪦 `D-1101` · EL GUARD DEJA DE BIFURCAR. Antes: con familia al hogar,
         sin familia al onboarding. Hoy **las dos van al hogar** — el hogar
         sabe dibujar los dos estados, y tener dos destinos para la misma
         pregunta es cómo nacen dos verdades. */
      await piso;
      if (!vigente) return;
      router.replace('/hogar');
    })();

    return () => {
      vigente = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  if (colgado) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('raiz.tardando')}
          descripcion={t('raiz.tardandoDetalle')}
          accion={
            <Boton
              etiqueta={t('raiz.probarDeNuevo')}
              onPress={() => {
                setColgado(false);
                setIntento((n) => n + 1);
              }}
            />
          }
        />
      </View>
    );
  }

  /* ⭐ **00 · EL SPLASH — S116-C lote 3.** Acá vivía una superficie base
     quieta, y su razón era la Ley 13 (*nada parpadea*). **Sigue vigente y por
     eso el splash tampoco simula progreso**: la fila de personajes marca que
     algo pasa, sin prometer cuánto falta.

     ⚠️ **Es la MISMA pantalla, no una ruta nueva.** Esta ruta resuelve la
     sesión y redirige; ponerle una ruta propia al splash habría agregado un
     paso al historial que después hay que esconder. */
  return <SplashMarca />;
}
