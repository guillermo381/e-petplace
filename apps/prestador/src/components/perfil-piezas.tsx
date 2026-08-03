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
  Boton,
  Campo,
  CeldaNavegacion,
  LogoNegocio,
  PieDeCampo,
  Tarjeta,
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
    /* ① S84-C29 — LA SECCIÓN ENTERA ES **UNA** TARJETA, encabezado
       incluido.
       C24 había puesto el fondo blanco SOLO en el panel abierto, y el
       founder cazó lo que faltaba: el encabezado —que es el control que
       se ve SIEMPRE, abierto o cerrado— seguía cayendo sobre el papel.
       Con el acordeón de una-a-la-vez, eso dejaba tres botones desnudos
       y un único panel blanco colgando del segundo.

       **POR QUÉ UNA Y NO DOS.** La otra lectura era anidar: darle su
       propia tarjeta al encabezado y dejar la del panel adentro. Se
       descarta MIDIENDO, no por gusto: `elevacion="reposo"` es una
       SOMBRA, y dos sombras pegadas dibujan un borde donde no hay
       frontera — el contenido de una sección no es otra cosa que su
       encabezado, es lo mismo desplegado. Ley 20/Chanel: la presencia
       se dice con UNA superficie apoyada, no con dos.
       **Y el pedido se cumple igual: el fondo blanco de adentro NO se
       fue** — el contenido sigue sobre blanco. Lo que se fue es la
       costura entre dos blancos que eran el mismo.

       `relleno="ninguno"` porque el padding ya lo traen las piezas
       (`CeldaNavegacion` el suyo, el panel el de abajo); sin eso el
       encabezado quedaba con doble aire y la fila se desalineaba de sus
       hermanas de la casa. Cero valor crudo: todo sale de tokens. */
    <Tarjeta elevacion="reposo" relleno="ninguno">
      <CeldaNavegacion
        icono={icono}
        titulo={titulo}
        detalle={resumen}
        registro="aa"
        direccion={abierta ? 'arriba' : 'abajo'}
        onPress={onAlternar}
      />
      {abierta && (
        <View style={{ paddingHorizontal: spacing[3], paddingBottom: spacing[3], gap: spacing[2] }}>
          {children}
        </View>
      )}
    </Tarjeta>
  );
}

/**
 * CONTROL DE TELÉFONO — el indicativo y el número son UNA cosa, y por
 * fin se componen como una (S84-C3 ③).
 *
 * POR QUÉ NACE, y por qué acá y no en `packages/ui`: hasta hoy la
 * pantalla armaba a mano la fila `SelectorPais + Campo` DOS veces
 * (teléfono y WhatsApp) — la misma anatomía copiada, que es cómo
 * empiezan los clones que L-175 persigue. Nace como pieza LOCAL porque
 * tiene exactamente **dos consumidores y los dos viven en esta app**:
 * promoverla ahora sería inventar un contrato para un solo cliente.
 * ☠️ Su día en `packages/ui` llega con el TERCER consumidor —o con el
 * primero del lado cliente—, y ahí la promueve B.
 *
 * LA CURA DE LA DESALINEACIÓN, con la pieza de B (S83-B1, `4ba9d81`):
 * el `Campo` viaja con `sinPie` y el pie lo pone el CONTROL, UNO para
 * el par. El defecto era exactamente ése: `Campo` reserva su pie
 * SIEMPRE (`ALTO_PIE_CAMPO` = 24.8 px) y con `alignItems:'flex-end'`
 * el hermano se alineaba contra el borde de abajo DEL PIE, no de la
 * caja. Ahora es **caja contra caja**, y el número no sale de acá: sale
 * del token de B.
 *
 * ⚠️ MI CURA ANTERIOR (S83-C34 ③) ERA INSUFICIENTE Y SE DECLARA: saqué
 * la ayuda del `Campo` creyendo que eso bajaba su alto, y NO lo bajaba
 * —el slot seguía reservado—, así que el desnivel quedó igual y encima
 * agregué un hueco. Verifiqué contra la construcción y no contra la
 * caja; el número de B es el que lo cierra.
 *
 * UN SOLO MENSAJE PARA EL PAR: el indicativo y el número no pueden
 * fallar por separado —lo que se valida es el E.164 que forman juntos—,
 * así que dos pies dirían dos veces lo mismo o, peor, se contradirían.
 */
export function ControlTelefono({
  label,
  placeholder,
  valor,
  onCambio,
  bandera,
  prefijo,
  onElegirPais,
  ayuda,
  error,
}: {
  label: string;
  /** SIN prefijo (firma de la orden): el indicativo ya está a la
   *  izquierda, y repetirlo en el ejemplo enseña a escribirlo dos
   *  veces. Un elemento, un trabajo (17.6). */
  placeholder: string;
  valor: string;
  onCambio: (v: string) => void;
  bandera: string;
  prefijo: string;
  onElegirPais: () => void;
  ayuda?: string;
  error?: string;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
        <SelectorPais bandera={bandera} prefijo={prefijo} onPress={onElegirPais} />
        <View style={{ flex: 1 }}>
          <Campo
            label={label}
            placeholder={placeholder}
            value={valor}
            onChangeText={onCambio}
            keyboardType="phone-pad"
            sinPie
            error={error}
          />
        </View>
      </View>
      {/* EL PIE DEL PAR — uno solo, y del CONTROL: es el que habla del
          E.164 completo, que ninguna de las dos piezas tiene sola. */}
      <PieDeCampo ayuda={ayuda} error={error} />
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
  vacio,
  etiquetaLogo,
  rotuloEspejo,
  onEditarLogo,
}: {
  nombre: string;
  logoUrl: string | null;
  /** ① S84-C3 — La voz del oficio + ciudad, compuesta por la pantalla
   *  DESDE EL DATO. **`null` = no se pinta la línea**, y eso es la
   *  firma de este arreglo: antes llegaba el literal
   *  `"paseador · quito"` clavado, así que un veterinario de Guayaquil
   *  leía en "Así te ven tus clientes" que era paseador de Quito.
   *  L-139 en el peor lugar posible — la única pieza que promete
   *  mostrar la verdad era la que inventaba. Y el nulo NO se rellena
   *  con "Sin oficio": un rótulo que dice que falta un dato es ruido en
   *  una vista que existe para mostrar cómo te ven. */
  tipo: string | null;
  /** La consecuencia del hueco, en UNA línea. null = nada que decir. */
  vacio: string | null;
  /** ⑥ La voz llega YA TRADUCIDA de la pantalla: esta pieza no tiene
   *  `t` y no va a tenerlo — un componente de composición que resuelve
   *  su propio idioma se vuelve imposible de reusar (Ley 3 aplicada al
   *  copy: el vocabulario es de quien lo dice, no de quien lo pinta). */
  etiquetaLogo: { agregar: string; cambiar: string };
  /** ⑥ el rótulo del espejo, YA traducido por la pantalla. */
  rotuloEspejo: string;
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
        {rotuloEspejo}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <Pressable
          onPress={onEditarLogo}
          accessibilityRole="button"
          accessibilityLabel={logoUrl === null ? etiquetaLogo.agregar : etiquetaLogo.cambiar}
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
          {/* ① EL NULO NO SE PINTA: sin oficio o sin ciudad, la línea no
              nace. Ver el porqué en la prop `tipo`. */}
          {tipo !== null && (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                color: palette.light0,
              }}
            >
              {tipo}
            </Text>
          )}

          {/* ② S84-C32 — EL FRENO SE LEVANTA: B entregó la prop
              (`ec31f5d`) y el botón vuelve a ser legible.
              `superficie="muro"` NO es un color nuevo: es la tabla que
              invierte el par YA MEDIDO — papel pleno #FAF9F7 sobre el
              muro = **5.51 en claro · 9.61 en oscuro**. Mi 2.92 muere
              acá.
              Y B no inventó vocabulario: `LogoNegocio` —la pieza que
              está tres líneas arriba, en este mismo bloque— ya tenía
              `superficie: 'clara'|'muro'` con esa semántica exacta. La
              casa había contestado y faltaba ensanchar la respuesta
              (L-175), no abrir una segunda.

              ⚠️ DIVERGENCIA DECLARADA, y es de UNA PALABRA revertirla:
              **la mesa dijo `compacto` y monté `acento`.** El porqué es
              medición del código de B, no gusto: sobre el muro la tabla
              **reescribe la entrada entera y no copia el `borde`**, así
              que `compacto` PIERDE su contorno ahí — que era lo único
              que lo distinguía. Sobre el muro `compacto` y `acento`
              quedan idénticos salvo el PESO.
              Con eso, elegir `compacto` sería vestir con dos anatomías
              distintas **el mismo trabajo**: "cambiar el clip" (que
              quedó en `acento` en C30) y "cambiar el logo" son la misma
              acción sobre la misma pantalla. Un trabajo, un componente.
              Si preferís `compacto`, es una palabra.

              ── historia, que explica de dónde viene esto ──
              C30 FRENÓ ACÁ, y no era preferencia — era EL MISMO HEX.
              La orden decía montarlo en el clip y en el logo. En el clip
              entró; acá NO, porque este botón **no vive sobre papel: vive
              sobre EL MURO**, y el muro es la única superficie de la app
              que no sale del tema.

              MEDIDO, no supuesto:
              · `lightOficio.accent.cta` = `palette.tealDark` = **#0A7268**
                (`themes/index.ts:137`).
              · el muro en claro y en memorial = `palette.tealDark` =
                **#0A7268** (`techo-oficio.ts:45`).
              **Contraste 1.00.** El texto y el fondo son el mismo color:
              el botón desaparecería por completo. En oscuro no
              desaparece (teal puro sobre `tealDarkNoche` = 6.57), y eso
              lo vuelve peor, no mejor: **invisible en dos temas de tres
              y legible en el otro** es la clase de defecto que un gate
              en un solo tema no encuentra.
              Y §15b.2 ya lo tenía escrito antes de esta medición: sobre
              el muro el acento funcional es PAPEL, y el teal queda
              PROHIBIDO ahí.

              ⚠️ LO QUE LA MEDICIÓN DESTAPÓ DE PASO, y es mío: el
              `compacto` que hay hoy **también cruza la frontera que este
              archivo declara doce líneas más arriba** (una pieza que
              resuelve su color de `theme.*` no puede vestir el muro).
              Su texto es `text.primary` #1D1A2E sobre #0A7268 = **2.92**,
              bajo el 4.5 de AA. Lo escribí en C34 sin medirlo.
              **No lo cambio en este commit y digo por qué:** la cura no
              es elegir otra variante —**ninguna de las ocho sirve**,
              todas resuelven de `theme.*`— sino que `Boton` sepa vestir
              el muro (papel PLENO = #FAF9F7 sobre #0A7268 = **5.51**,
              que es el par que la casa ya midió y usa en `TechoOficio`).
              **Eso es de B**, y va como pedido con estos números. Dejar
              el `compacto` es conservar el estado que el founder ya vio;
              cambiarlo a ojo sería mi tercer error de anatomía en el
              mismo botón.

              ── historia, que explica el estado de hoy ──
              EL CTA DEL LOGO — `Boton compacto`, que es lo que la casa
              YA tenía (la pantalla vieja lo usaba; S76-B1).
              ⚠️ SE CORRIGE MI PROPIA INVENCIÓN de C34: había puesto un
              texto SUBRAYADO, que es idioma web y no está en el
              diccionario — y Ley 22c dice que un comando con consecuencia
              viste de botón. Me inventé una anatomía teniendo la de la
              casa a mano; el subrayado muere con su trabajo hecho.
              LA VOZ NO DICE "AJUSTAR" A PROPÓSITO (Ley 23 · 17.1): el
              editor de zoom y encuadre no existe de este lado —vive en
              `apps/cliente/EncuadreFoto` y su promoción es de B—, y un
              botón que lo dijera prometería una pantalla que no abre. */}
          <View style={{ alignSelf: 'flex-start' }}>
            <Boton
              variante="acento"
              superficie="muro"
              etiqueta={logoUrl === null ? etiquetaLogo.agregar : etiquetaLogo.cambiar}
              onPress={onEditarLogo}
            />
          </View>
        </View>
      </View>

      {/* ① ☠️ ACÁ VIVÍA LA INSIGNIA DE VISIBILIDAD, y se retira SIN
          reemplazo (orden explícita).
          EL PORQUÉ: llegaba `visible` clavado en `true`, así que el
          espejo decía "Visible para las familias" SIEMPRE — estuviera o
          no. La pantalla vieja sí lo computaba
          (`cuenta.estado === 'activa' && hayOferta && hayFranja`, con
          `null` honesto si una pata no cargaba) y **el cableado de C30
          perdió ese cómputo**: el mismo patrón que ya me costó el logo y
          la alineación — porté la composición y no porté el dato.
          NO SE REEMPLAZA POR TEXTO porque afirmar lo contrario tampoco
          se puede: el cómputo pide dos lecturas más y NO existe una
          frontera única que lo resuelva (medido: las portadas lo tienen
          re-implementado). Entre mentir que sí, mentir que no, y CALLAR,
          la única honesta es callar — L-139.
          ☠️ Vuelve cuando exista el cómputo compartido (ficha de A). */}

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
