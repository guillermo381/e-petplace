/**
 * 02 · BENEFICIOS — UNA pantalla, UNA sola vez (S116-C lote 5, firma de mesa).
 *
 * ── ☠️ MUEREN LAS TRES TARJETAS DESLIZABLES, Y CON ELLAS SU MAQUINARIA ────
 * ⏪ Hasta hoy 02 eran **tres tarjetas con `pagingEnabled`**, sus puntos de
 * paginación y el CTA que aparecía sólo en la última. **Firma del founder
 * (14-sep): vuelve a ser UNA pantalla, como el sketch.** Se van el
 * `ScrollView` horizontal, el estado `actual`, el `useWindowDimensions`, la
 * fila de puntos y la condición del CTA — *Ley 37: se retira entero, no se
 * comenta.*
 *
 * **Lo que se conserva y por qué**: la marca de «ya la vio» y el
 * `CONTEO_PENDIENTE` de los dos toques. *El cambio es de forma, no de
 * contabilidad: cuántos saltan y cuántos completan se sigue queriendo saber
 * el día que exista la puerta.*
 *
 * ── CUÁNDO SE VE, Y DÓNDE VIVE ESA MARCA ─────────────────────────────────
 * Sólo la primera vez que alguien toca «Crear cuenta» **en este aparato**;
 * después, nunca más. **La marca va en el almacenamiento local y NO en la
 * base**, y no es una comodidad: en este punto del recorrido **todavía no hay
 * cuenta** — no hay dónde guardarla del lado del servidor ni a quién
 * atribuírsela. *Una preferencia de alguien que aún no existe sólo puede vivir
 * en su teléfono.*
 *
 * ⚠️ **Consecuencia declarada:** quien reinstale la app la vuelve a ver. Es el
 * comportamiento correcto para lo que esta pantalla es (una presentación), y
 * el costo de evitarlo sería atarla a una identidad que todavía no hay.
 *
 * ── 🔴 EL CONTEO QUE EL ENCARGO PIDE — MEDIDO, Y NO EXISTE LA PUERTA ──────
 * El encargo dice: *«Contá dos cosas: cuántos tocan "Saltar" y cuántos llegan
 * a "Comenzar", por la puerta de eventos que la casa ya use; si no hay
 * ninguna, lo decís y queda NULL — no inventes una»*.
 *
 * **Medido: la casa NO tiene puerta de eventos.** Cero en `apps/cliente/src/lib`
 * y cero en `packages/api` (`registrarEvento`/`analitica`/`telemetria`/`track`).
 * ⇒ **queda NULL, como el encargo manda.** Los dos toques quedan marcados en
 * el código con `CONTEO_PENDIENTE` para que el día que exista la puerta, los
 * dos sitios se encuentren con un grep y no haya que volver a leer la pantalla.
 *
 * *La letra §1.6 dice «en octubre se decide con dato». Este comentario existe
 * para que ese día se sepa que el dato no se está juntando.*
 *
 * ── «SALTAR» SIGUE ARRIBA, Y «COMENZAR» ES LA ÚNICA PRIMARIA ────────────
 * Una acción por vista (Ley 5). **«Saltar» está siempre**, arriba y en tinta
 * apagada — *una presentación de la que no se puede salir deja de ser una
 * presentación.*
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  Boton,
  Entrada,
  FilaBeneficio,
  Icono,
  Personaje,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
  type EspeciePersonaje,
  type IconoNombre,
} from '@epetplace/ui';

import { useRuedaDeCaras } from '@/lib/rueda-de-caras';

import { useTraduccion } from '@/i18n';

/** La marca de «ya la vio». Monótona: una presentación vista no se desve. */
export const CLAVE_BENEFICIOS_VISTOS = 'epp.cliente.beneficiosVistos.v1';

/** ¿Hay que mostrarla? La lee quien decide el camino, no esta pantalla. */
export async function yaVioBeneficios(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLAVE_BENEFICIOS_VISTOS)) === '1';
  } catch {
    /* Sin almacenamiento la presentación se ve de nuevo. *Preferir mostrarla
       de más antes que romper el camino a crear la cuenta.* */
    return false;
  }
}

/* 🔴 **EL CONTEO QUE NO EXISTE.** Ver la cabecera: la casa no tiene puerta de
   eventos, así que esto NO llama a nada. Marca los dos sitios para el día que
   la haya. *Escribir un `console.log` acá sería fabricar un dato que nadie
   junta y que igual se leería como si se estuviera midiendo.* */
function CONTEO_PENDIENTE(_cual: 'salto' | 'completo'): void {
  /* sin puerta de eventos en la casa — medido, S116-C lote 3 */
}

/** Las seis caras de la rueda. Orden fijo y no sorteado: *una rueda que
 *  sortea puede repetir dos veces seguidas la misma cara, y eso se lee como
 *  que se colgó.* `otro` es la nariz, que cierra la vuelta. */
const CARAS: readonly EspeciePersonaje[] = ['perro', 'gato', 'conejo', 'ave', 'roedor', 'otro'];

/** Las cuatro filas. **Van en un arreglo y no escritas a mano** para que el
 *  escalonado salga del índice: cuatro `Entrada orden={i}` copiadas divergen
 *  la primera vez que alguien reordena. */
const FILAS: readonly { glifo: IconoNombre; clave: 'buscar' | 'verificado' | 'agenda' | 'documento' }[] = [
  { glifo: 'lupa', clave: 'buscar' },
  /* 🔴 **`checkEnCirculo` y NO `certificaciones`, y es una decisión con razón:**
     `certificaciones` es *«papel + huella como SELLO»* — el DOCUMENTO. Esta
     fila no dice «hay certificados»: dice que los profesionales **están
     verificados**, que es un estado. *Montar el papel donde va el estado es el
     préstamo entre significados distintos que la casa prohíbe.* */
  { glifo: 'checkEnCirculo', clave: 'verificado' },
  { glifo: 'hoy', clave: 'agenda' },
  { glifo: 'documento', clave: 'documento' },
];

export default function Beneficios() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  /* La rueda vive en un hook compartido con 00: el reloj se escribe UNA vez.
     Ver su cabecera — la casa ya midió que dos ruedas se desincronizan. */
  const rueda = useRuedaDeCaras(CARAS);
  const estiloCara = useAnimatedStyle(() => ({ opacity: rueda.opacidad.value }));

  /** Marca y sigue. La marca no bloquea el camino: si falla, se pasa igual. */
  const seguir = async (cual: 'salto' | 'completo') => {
    CONTEO_PENDIENTE(cual);
    try {
      await AsyncStorage.setItem(CLAVE_BENEFICIOS_VISTOS, '1');
    } catch {
      /* sin marca, la próxima vez la ve de nuevo — no es motivo para frenar */
    }
    router.replace('/registro');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, paddingTop: insets.top }}>
      {/* «Saltar», arriba a la derecha y siempre, en tinta apagada. */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
        <Boton
          variante="ghost"
          tamaño="sm"
          etiqueta={t('beneficios.saltar')}
          onPress={() => void seguir('salto')}
        />
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing[5], gap: spacing[6] }}>
        {/* ① LA CARA Y EL TÍTULO, en fila. El círculo grande a la izquierda,
            el título al lado — **no centrado arriba**: el sketch los pone
            juntos, y así el título arranca a la altura de la mirada del
            personaje en vez de flotar encima. */}
        <Entrada>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
            <Animated.View style={estiloCara}>
              {/* `forma="circulo"` y `fondo="blanco"`: el círculo blanco grande
                  del sketch. `grande` es el doble del avatar del hogar — la
                  pieza lo resuelve, acá no hay número. */}
              <Personaje especie={rueda.actual} tamano="grande" fondo="blanco" forma="circulo" />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Texto variante="titulo">{t('beneficios.titulo')}</Texto>
            </View>
          </View>
        </Entrada>

        {/* ② LAS CUATRO FILAS — **UNA TARJETA BLANCA POR BENEFICIO** (S116-C
            lote 7 · punto ⑦, firma del founder: *«FilaBeneficio de B ya está en
            main: montala CUATRO veces, una tarjeta blanca por beneficio como el
            sketch»*).

            ⏪ **Era UNA `Tarjeta` con cuatro `Celda` adentro**, y la pieza que
            lo corrige explica por qué importa: *«una lista dice "estos ítems van
            juntos"; cuatro tarjetas dicen "cada uno vale por sí mismo", que es
            lo que una pantalla de propuesta necesita»*.

            🔴 **Y `FilaBeneficio` NO es `Celda` sin `onPress`** —también lo dice
            su cabecera, y es lo que impide montar el atajo fácil—: una celda
            **anuncia toque** con el rol de botón y el hundido, y sin `onPress`
            queda *«una puerta que no abre»*. Acá no hay control que anunciar:
            hay una frase sobre lo que la app hace. **Ni `accessibilityRole`, ni
            `Pressable`, ni chevrón.**

            La tarjeta la trae la pieza adentro; acá sólo va el escalonado, que
            sigue saliendo del ÍNDICE y no de cuatro `Entrada` copiadas. */}
        {FILAS.map((f, i) => (
          <Entrada key={f.clave} orden={i}>
            <FilaBeneficio
              glifo={f.glifo}
              titulo={t(`beneficios.${f.clave}Titulo` as 'beneficios.buscarTitulo')}
              apoyo={t(`beneficios.${f.clave}Apoyo` as 'beneficios.buscarApoyo')}
            />
          </Entrada>
        ))}
      </View>

      {/* ③ LA ÚNICA PRIMARIA. Ahora está SIEMPRE: con una sola pantalla no hay
          «última» en la que aparecer. */}
      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: insets.bottom + spacing[6],
          paddingTop: spacing[4],
        }}
      >
        <Boton
          variante="primario"
          bloque
          etiqueta={t('beneficios.comenzar')}
          onPress={() => void seguir('completo')}
        />
      </View>
    </View>
  );
}
