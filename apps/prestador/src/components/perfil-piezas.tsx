/**
 * PIEZAS DEL PERFIL v2 (S83-C10 · S83-C13) — las anatomías locales de la
 * pantalla `cuenta/perfil` (nacieron con su ruta de verificación
 * `/perfil-v2`, que murió al pasar la pantalla a producción — S83-C30).
 *
 * ☠️ EL CLON MURIÓ EN C13, y lo mató su propia condición de muerte.
 * C10 declaró el hueco: no existía encabezado de sección que DESPLEGARA
 * (⌄/⌃) y propuso ensanchar `CeldaNavegacion` con el `direccion` que
 * `FilaCita` ya tenía. **B lo construyó** (S83-B12): la prop existe, y
 * el trazo se fue a la tabla ÚNICA `packages/ui/components/chevron.ts`
 * — el mapa que este archivo tenía copiado era la quinta copia que
 * L-175 prohíbe. `SeccionDesplegable` deja de dibujar su chevron y su
 * fila: **compone `CeldaNavegacion`**. Con el mapa local muere también
 * la constante (Ley 37: lo que sale de la UI sale del código).
 *
 * DOS CONSECUENCIAS DECLARADAS DE CONSUMIR LA PIEZA DE LA CASA:
 *  · el `resumen` pasa de MONO a SANS secundario — lo decide `detalle`
 *    de la pieza, y **la pieza tiene razón**: "sin descripción" o "solo
 *    whatsapp" son ESTADOS, no metadata de máquina (Ley 3 reserva el
 *    mono para fechas, horas, IDs). El mono era mi elección y era la
 *    que estaba corrida.
 *  · se pierde `accessibilityState={{ expanded }}` — la pieza anuncia
 *    rol `button` y no el estado de despliegue. **Se declara como hueco
 *    de a11y, no se parchea local** (sería reabrir el clon por otra
 *    puerta): candidata de enmienda para B, una línea en la pieza.
 *
 * Lo que SIGUE local, con su porqué: `EspejoNegocio` y `RastroNegocio`
 * son composición de ESTA pantalla sobre el muro del oficio, y
 * `SelectorPais` es su disparador de Hoja. Cero hex crudo, cero sombra
 * artesanal (Ley 1/20); el muro y su vidrio se consumen de
 * `techo-oficio` — la frontera del muro es una sola verdad (§15b.2).
 */

import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CeldaNavegacion,
  LogoNegocio,
  Texto,
  palette,
  radius,
  spacing,
  typography,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';
import type { ReactNode } from 'react';

import { CURVA_OFICIO, VIDRIO_OFICIO, useMuroOficio } from '@/components/techo-oficio';

/**
 * SECCIÓN DESPLEGABLE — el encabezado de la casa + el panel que abre.
 *
 * E14 por la pieza, no a mano: `direccion='abajo'` cerrada · `'arriba'`
 * abierta. Lo que NAVEGA usa la MISMA celda con su `'derecha'` — el
 * contraste de la ley se lee en una sola pantalla, con un solo
 * componente.
 */
export function SeccionDesplegable({
  icono,
  titulo,
  resumen,
  abierta,
  onAlternar,
  children,
}: {
  icono?: IconoNombre;
  titulo: string;
  /** El estado con la sección CERRADA — el trabajo de densidad (§15b.3). */
  resumen: string;
  abierta: boolean;
  onAlternar: () => void;
  children: ReactNode;
}) {
  return (
    <View>
      <CeldaNavegacion
        icono={icono}
        titulo={titulo}
        detalle={resumen}
        registro="aa"
        direccion={abierta ? 'arriba' : 'abajo'}
        onPress={onAlternar}
      />
      {abierta && <View style={{ paddingBottom: spacing[4], gap: spacing[2] }}>{children}</View>}
    </View>
  );
}

/**
 * SELECTOR DE PAÍS — el disparador del indicativo: bandera + prefijo.
 *
 * ⚠️ POR QUÉ ES UNA PIEZA Y NO UN `Boton` (el defecto que el founder
 * reportó en dispositivo, S83-C13 ①): la bandera venía DENTRO de la
 * `etiqueta` del botón, que es `string` — un solo `<Text>` con dos
 * fuentes adentro. **El emoji de bandera no lo dibuja DM Sans ni
 * JetBrains Mono** (la app carga esas dos y ninguna trae banderas): lo
 * resuelve la fuente de emoji del sistema, con SU ascendente y SU
 * descendente. En una corrida de texto única, RN maquetó la línea con
 * las métricas de la fuente base y el emoji quedó fuera de la línea
 * base — no era un problema de espaciado.
 *
 * ⚠️ LA PRIMERA CURA (S83-C13) NO ALCANZÓ — y el founder la volvió a
 * reportar en el gate del Perfil cableado (S83-C32 ①). **El error de
 * método fue mío y se declara: la di por curada POR CONSTRUCCIÓN, no por
 * PANTALLA** (L-153 aplicada a quien construye). Al re-medir, lo primero
 * que se descartó fue la hipótesis barata: `SelectorPais` SÍ era la pieza
 * montada (líneas 348 y 367 de `cuenta/perfil`), así que no había un
 * clon viejo corriendo — lo que estaba mal era la cura.
 *
 * POR QUÉ NO PODÍA GANAR: peleaba contra las MÉTRICAS del texto, y las
 * métricas de esa fuente no son nuestras.
 *  · `textAlignVertical` en Android **solo actúa con alto acotado** —
 *    sin altura fija el flag es decorativo.
 *  · La fuente de emoji del sistema **puede ignorar el `lineHeight` que
 *    le pedimos**: no la cargamos nosotros y no le imponemos su caja.
 * Pedirle a un glifo ajeno que respete nuestra tipografía es pedirle
 * algo que no está obligado a cumplir.
 *
 * LA CURA QUE RIGE (S83-C33) — **CAJA FIJA, no métricas**: el emoji va
 * dentro de un `View` de alto y ancho FIJOS (`linea`), centrado por
 * `alignItems/justifyContent`. La geometría deja de depender de la
 * línea base y pasa a depender de la caja, que sí controlamos.
 * *Un glifo que no controlo no se alinea por métrica; se alinea por caja.*
 * `includeFontPadding:false` SOBREVIVE (sigue siendo correcto en
 * Android); lo que murió es el `lineHeight`/`textAlignVertical` sobre el
 * nodo del emoji, que prometían una alineación que no podían dar.
 *
 * Y EL BORDE QUE PIDE LA ORDEN — el prefijo más largo contra el más
 * corto (`+593`/`+591` de 4 contra `+1` de 2): el prefijo va en MONO
 * con `minWidth`, así el disparador NO cambia de ancho al cambiar de
 * país y la bandera no se corre de lugar entre una elección y otra.
 */
export function SelectorPais({
  bandera,
  prefijo,
  onPress,
}: {
  /** Ya resuelta por la pantalla (emoji o las dos letras). */
  bandera: string;
  prefijo: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  // el alto de línea COMPARTIDO: el mismo número para los dos nodos
  const linea = Math.round(typography.size.base * typography.leading.normal);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`País del número, ${prefijo}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center', // ① por contenedor, jamás por línea base
        gap: spacing[2],
        minHeight: 44,
        paddingHorizontal: spacing[3],
        borderRadius: radius.md,
        backgroundColor: theme.bg.hundido,
      }}
    >
      {/* ① S83-C33 — LA CAJA FIJA. Ver el porqué arriba: se dejó de pelear
          con las métricas. El emoji vive DENTRO de un View de alto y ancho
          FIJOS que lo centra por contenedor; lo que la fuente haga con su
          línea base ya no puede correr nada, porque el nodo de texto ya no
          define la geometría — la define la caja. */}
      <View style={{ width: linea, height: linea, alignItems: 'center', justifyContent: 'center' }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: typography.size.md,
            includeFontPadding: false, // Android; no-op en iOS
            color: theme.text.primary,
          }}
        >
          {bandera}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: typography.family.mono.regular,
          fontSize: typography.size.base,
          lineHeight: linea,
          includeFontPadding: false,
          // el borde de la orden: +1 (2 chars) y +593 (4) no cambian el ancho
          minWidth: 44,
          color: theme.text.primary,
        }}
      >
        {prefijo}
      </Text>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
        <Path
          d="M6 9l6 6 6-6"
          stroke={theme.text.tertiary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

/**
 * EL ESPEJO — lo que la familia ve, presidiendo y a sangre contra el
 * muro del oficio (§15b.2: papel PLENO sobre el muro, vidrio OSCURO).
 *
 * Preside de verdad (Ley 15): el nombre en `Texto titulo` y el logo
 * grande. No son campos — son la portada. El bloque de VACÍO dice la
 * CONSECUENCIA en una línea, en vez de repartir cuatro celdas diciendo
 * "sin dato" (el eje VACÍO del bloque de auditoría).
 */
export function EspejoNegocio({
  nombre,
  logoUrl,
  tipo,
  visible,
  vacio,
  onEditarLogo,
}: {
  nombre: string;
  logoUrl: string | null;
  /** La voz del tipo + ciudad, ya compuesta por la pantalla. */
  tipo: string;
  visible: boolean;
  /** La consecuencia del hueco, en UNA línea. null = nada que decir. */
  vacio: string | null;
  onEditarLogo: () => void;
}) {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();

  return (
    <View
      style={{
        backgroundColor: muro,
        paddingTop: insets.top + spacing[6],
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[5],
        borderBottomLeftRadius: CURVA_OFICIO.izquierda,
        borderBottomRightRadius: CURVA_OFICIO.derecha,
        overflow: 'hidden',
        gap: spacing[4],
      }}
    >
      {/* ④ S83-C34 — "ASÍ TE VEN TUS CLIENTES", el rótulo que faltaba.
          §15b.5 declara el espejo del artesano para las DOS caras del
          mundo, y el espejo estaba construido pero MUDO: sin la frase,
          el bloque se lee como una cabecera decorativa y no como lo que
          es — la vista de la familia. Es la diferencia entre adornar la
          pantalla y explicarle al prestador qué está mirando. */}
      <Text
        style={{
          fontFamily: typography.family.sans.regular,
          fontSize: typography.size.sm,
          color: palette.light0,
        }}
      >
        Así te ven tus clientes
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <Pressable
          onPress={onEditarLogo}
          accessibilityRole="button"
          accessibilityLabel={logoUrl === null ? 'Agregar el logo del negocio' : 'Cambiar el logo del negocio'}
        >
          <LogoNegocio nombre={nombre} logoUrl={logoUrl} tamano={76} superficie="muro" />
        </Pressable>
        {/* ⚠️ SOBRE EL MURO NO ENTRA `Texto` — es la frontera que esta
            misma app ya declaró (D-535, `techo-oficio`): una pieza que
            resuelve su color de `theme.*` no puede vestir el muro,
            porque el muro es constante en los tres temas y NO está en
            la escala del tema (`TextoColor` no tiene 'onGradient':
            medido). Papel PLENO y tipografía por token, como
            `TechoOficio` — jamás opacidad (regla §15b.2). */}
        <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={{
              fontFamily: typography.family.sans.light,
              fontSize: typography.size.xl,
              color: palette.light0,
            }}
          >
            {nombre}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.sm,
              color: palette.light0,
            }}
          >
            {tipo}
          </Text>

          {/* ④ EL CTA VISIBLE — el defecto del founder era de AFFORDANCE:
              el logo se tocaba y nada lo decía, así que para quien no
              adivina el tap, el logo no se podía cambiar.
              ⚠️ LA VOZ NO DICE "AJUSTAR" A PROPÓSITO (Ley 23 · 17.1): el
              editor de zoom y encuadre TODAVÍA NO EXISTE de este lado —
              vive en `apps/cliente/EncuadreFoto` y su promoción es de B.
              Un botón que dijera "Ajustar" prometería una pantalla que no
              abre. Dice lo que HOY pasa al tocarlo, y pasará a "Ajustar
              logo" el día que el editor llegue. */}
          <Pressable
            onPress={onEditarLogo}
            accessibilityRole="button"
            style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}
          >
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.sm,
                color: palette.light0,
                textDecorationLine: 'underline',
              }}
            >
              {logoUrl === null ? 'Agregar logo' : 'Cambiar logo'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Text
        style={{
          fontFamily: typography.family.sans.regular,
          fontSize: typography.size.base,
          color: palette.light0,
        }}
      >
        {visible ? 'Visible para las familias' : 'Todavía no visible'}
      </Text>

      {vacio !== null && (
        <View style={{ backgroundColor: VIDRIO_OFICIO, borderRadius: radius.md, padding: spacing[3] }}>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              color: palette.light0,
            }}
          >
            {vacio}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ☠️ EL RASTRO MURIÓ EN SU GATE (S83-C34 ①, firma del founder en
 * dispositivo). Era la fila compacta que se pegaba al tope cuando el
 * espejo se iba, y había pasado el gate (a′) en la LÁMINA. En pantalla
 * real, con el pulgar y el scroll de verdad, el veredicto fue otro:
 * *"genera un efecto de flaseo feo"* — la fila aparecía y desaparecía
 * al cruzar el umbral y ese parpadeo cuesta más que el dato que traía.
 *
 * NO SE SUAVIZÓ (orden explícita): no hay fade, ni histéresis, ni umbral
 * más alto. Un elemento que el ojo rechaza no se negocia a la baja — se
 * saca. **L-153 en su forma más limpia: la lámina propone, la pantalla
 * dispone**, y entre las dos gana la que el founder mira.
 * Ley 37: se fue la pieza, su estado (`rastroVisible`), su `onScroll` y
 * su import. Lo que quedó fue el espejo de arriba, que nunca parpadeó
 * porque nunca dependió del scroll. */
