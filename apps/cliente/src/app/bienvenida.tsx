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
 * 🔴 **EL ACENTO DEL CLAIM ESTÁ PENDIENTE DE PIEZA.** El encargo pide *«una
 * vida.» en rosa sobre ciruela*; `TextoColor` no tiene ese miembro (medido) y
 * escribir el color acá lo caza `R4`, con razón. **Va entero en `inverso`** y
 * el pedido está en el buzón: es un cambio de una palabra el día que exista.
 *
 * TESIS: «acá vive la vida de tu mascota — entrá». FIRMA: el claim en Baloo
 * sobre la ciruela. Memorial N/A (pre-sesión).
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Boton, Entrada, LogoV5, Texto, gradients, spacing } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function Bienvenida() {
  const router = useRouter();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

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
      <Entrada>
        <View style={{ alignItems: 'center' }}>
          <LogoV5 sobre="oscuro" tamano="cabecera" />
        </View>
      </Entrada>

      {/* ② EL CLAIM — el centro de la pantalla, y lo único que se lee de
          lejos. `titulo` es la variante de display del cliente. */}
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing[4] }}>
        <Entrada orden={1}>
          <Texto variante="titulo" color="inverso">
            {`${t('bienvenida.titular')} ${t('bienvenida.titularAcento')}`}
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
            etiqueta={t('bienvenida.crearCuenta')}
            bloque
            onPress={() => router.push('/beneficios')}
          />
          {/* 🔴 **PEDIDO DE PIEZA, declarado donde muerde:** el encargo dice
              *«secundario blanco»* y `Boton` no tiene un secundario para fondo
              oscuro (medido: `primario · marca · secundario · ghost ·
              destructivo · compacto · apoyada · sinCaja · acento`). El
              `secundario` de la casa lleva **borde magenta**, que sobre
              ciruela es magenta sobre ciruela — lo que la letra §2 prohíbe
              textual. *Es el mismo hueco que `Texto` ya resolvió con el color
              `inverso`.* Va en el buzón; monto la forma correcta con el color
              que hay y queda declarado en el parte. */}
          <Boton
            variante="secundario"
            etiqueta={t('bienvenida.yaTengoCuenta')}
            bloque
            onPress={() => router.push('/login')}
          />
        </View>
      </Entrada>
    </LinearGradient>
  );
}
