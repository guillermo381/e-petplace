/**
 * PantallaDeCandado — EL CANDADO SOBRE LA SESIÓN (S104-B · MODELO_LOGIN §2.5).
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ ES, y qué NO es. §2.5, firma del 23-ago: *«Huella / Face ID como
 * **candado sobre la sesión existente**, jamás como factor contra
 * Supabase»*. ⇒ **esto no autentica a nadie.** La sesión ya existe y
 * sigue existiendo detrás de esta pantalla; lo único que hace el
 * candado es tapar el contenido hasta que la persona se identifique
 * ante SU TELÉFONO.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ⚠️ **ENMIENDA DEL FOUNDER — CAMBIÓ DÓNDE APARECE, NO QUÉ ES.**
 * Nació describiéndose como *«no es una puerta: es una cortina»*, y esa
 * frase quedó a medias: el founder la extendió al **patrón banca**, o
 * sea **PUERTA DE ENTRADA** — al abrir la app con sesión guardada se
 * pide la huella **en vez de tipear**, y la vuelta del segundo plano se
 * mantiene.
 *
 * 🔴 **Y la distinción que hay que no perder es justamente la que la
 * enmienda vuelve fácil de confundir: aunque ahora se vea al ABRIR, esto
 * sigue SIN crear ninguna sesión.** Desbloquea una que ya existe. El día
 * que alguien la lea como «el login biométrico» y la conecte contra
 * Supabase, habrá convertido un candado en un factor de autenticación —
 * que es literalmente lo único que §2.5 prohíbe.
 * ⇒ *Cortina que ahora también se corre en la entrada, no puerta.*
 *
 * ── 🔴 LA PIEZA ES PRESENTACIONAL, Y NO POR PRUDENCIA ─────────────────
 * **No importa `expo-local-authentication` y no debe.** Dos razones, las
 * dos duras:
 *   ① `packages/ui` no habla con módulos nativos de identidad — la
 *      pieza recibe `estado` y avisa por callbacks; **quién pregunta al
 *      SO es del consumidor.**
 *   ② **Medido: `expo-local-authentication` NO ESTÁ INSTALADO en ningún
 *      workspace** (grep en los `package.json` = 0). Es NATIVO ⇒ **no
 *      viaja por OTA** (L-134): llega con la próxima build.
 * ⇒ Esta pantalla puede montarse, mirarse y gatearse HOY en la galería,
 * y quedará **inerte hasta que el módulo viaje**. Es el patrón del
 * micrófono (S78, D-456): *la pieza se prepara y espera su tren.*
 *
 * ── 🔴 EL FALLBACK NUNCA SE ESCONDE, Y ES LO MÁS IMPORTANTE DE ACÁ ────
 * §2.5 dice *«fallback SIEMPRE al login normal»*, y esta pieza lo
 * cumple **en los tres estados, incluso mientras el SO está
 * preguntando**. No es cortesía: es la única salida que existe.
 * *Un candado cuya llave depende de un sensor que puede fallar —dedo
 * mojado, cara con barbijo, sensor roto— y que esconde la alternativa
 * mientras "verifica" es un candado que puede dejar a alguien afuera de
 * su propia cuenta.* Por eso la salida no es un estado de error: es
 * mobiliario fijo de la pantalla.
 *
 * ── POR QUÉ NO HAY GLIFO DE CANDADO NI DE ROSTRO ──────────────────────
 * Censado: el registry **no tiene candado, ni rostro, ni huella
 * dactilar** (`seguros` es un paraguas — la sustitución genérica que la
 * Ley 12 prohíbe). **No se inventó uno**, y la razón es que serían DOS
 * y ninguno se puede gatear todavía: el método real depende del
 * aparato —huella en unos, rostro en otros— así que un dibujo fijo
 * mentiría en la mitad de los teléfonos. *Dibujar dos glifos a ciegas
 * para una pieza que todavía no puede correr es inventar dos veces.*
 * ⇒ Preside **el isotipo**: lo que está cerrado es LA CASA, y eso es
 * verdad en todos los aparatos.
 *
 * ── LOS TRES TEMAS ────────────────────────────────────────────────────
 * Todo sale del tema (`bg.base`, `text.primary`) ⇒ resuelve en claro,
 * oscuro y memorial. **`MarcaDeAgua` degrada sola** (no se monta en
 * memorial, Ley 8) y el resto se conserva: **una sesión bloqueada sigue
 * bloqueada en duelo** — el candado no es ornamento.
 *
 * ── MOVIMIENTO Y REDUCE-MOTION ────────────────────────────────────────
 * **Ninguno propio.** No respira, no pulsa, no gira. Es una cortina, y
 * una cortina que se mueve sola pone nervioso. ⇒ **nada que degradar**,
 * y se declara en vez de omitirse. El único gesto posible lo pone quien
 * compone, envolviéndola.
 *
 * ── LA ESCALERA (Ley 11) ──────────────────────────────────────────────
 * No muestra datos del expediente — **a propósito y es su trabajo**: lo
 * que tapa es exactamente eso. §4b no aplica.
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { Isotipo } from '../brand/Isotipo'
import { MarcaDeAgua } from '../brand/MarcaDeAgua'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/**
 * Los tres estados del candado. **Cerrado a propósito** — no hay un
 * cuarto «bloqueado para siempre»: §2.5 lo prohíbe por diseño, porque
 * el fallback siempre existe.
 */
export type EstadoCandado =
  /** En reposo: la persona tiene que pedir el desbloqueo. */
  | 'bloqueada'
  /** El SO está preguntando (su prompt está encima de esta pantalla). */
  | 'verificando'
  /** El SO dijo que no. **No es un error de la app** — ver la voz. */
  | 'rechazada'

export interface PantallaDeCandadoProps {
  estado: EstadoCandado
  /** Vuelve a pedirle al SO. La pieza no sabe cómo: solo avisa. */
  onDesbloquear: () => void
  /**
   * 🔴 La salida que SIEMPRE se dibuja. **CIERRA LA SESIÓN** y lleva al
   * login — re-autenticación completa, no una navegación.
   *
   * ☠️ **SE LLAMABA `onUsarClave` Y EL NOMBRE SE VOLVIÓ FALSO EL MISMO
   * DÍA.** Lo nombré así cuando el botón decía «Entrar con mi
   * contraseña»; C cambió esa voz a **«Entrar con otra cuenta»** con una
   * razón medible que ratifico entera: **un usuario que entró con Google
   * NO TIENE contraseña**, y con Google vivo en el cliente ese caso dejó
   * de ser hipotético. La voz se curó y **el nombre de la prop se quedó
   * describiendo una clave que puede no existir.**
   *
   * *Es exactamente la clase de deriva que esta pista censó para otros en
   * su primer turno —el drift que sobrevive en lo que no se ve— y acá
   * apareció en mi propia API.* Un nombre no lo lee un usuario: lo lee
   * quien monta la pieza, y monta lo que el nombre promete.
   */
  onSalirDeLaSesion: () => void
}

export function PantallaDeCandado({ estado, onDesbloquear, onSalirDeLaSesion }: PantallaDeCandadoProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()

  /* La voz del estado. `rechazada` **no dice «error» y no culpa a
     nadie**: el SO rechazó una lectura, que es un hecho cotidiano (dedo
     mojado, mala luz) y no una falla del producto ni de la persona.
     Apagado es estado, no falla (Ley 22) — y acá tampoco es falla. */
  const voz =
    estado === 'rechazada'
      ? t('candado.rechazada')
      : estado === 'verificando'
        ? t('candado.verificando')
        : t('candado.bloqueada')

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[5],
        gap: spacing[6],
      }}
      /* Lo que está debajo queda tapado PARA EL OJO y también para el
         lector de pantalla: una cortina que el lector atraviesa no tapa
         nada. Es el defecto que `PantallaConPie` midió en la despensa —
         el nodo seguía en el árbol de accesibilidad. */
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <MarcaDeAgua />

      <Isotipo size={72} variant="gradiente" />

      <Texto variante="cuerpo" color="secondary">
        {voz}
      </Texto>

      <View style={{ alignSelf: 'stretch', gap: spacing[2] }}>
        <Boton
          etiqueta={t('candado.desbloquear')}
          bloque
          /* Mientras el SO pregunta, el primario se apaga: tocarlo otra
             vez apilaría un segundo prompt nativo sobre el primero. */
          deshabilitado={estado === 'verificando'}
          cargando={estado === 'verificando'}
          onPress={onDesbloquear}
        />
        {/* 🔴 SIEMPRE VISIBLE Y SIEMPRE HABILITADA — en los tres estados,
            incluso mientras se verifica. Ver la cabecera: es la única
            salida, y esconderla mientras el sensor trabaja es cómo se
            deja a alguien afuera de su propia cuenta.
            `ghost` por 19.7: la superficie ya tiene su sólido. */}
        <Boton variante="ghost" etiqueta={t('candado.usarClave')} bloque onPress={onSalirDeLaSesion} />
      </View>
    </View>
  )
}
