/**
 * TECHO DEL OFICIO — el header de la dosis del prestador (S58-B
 * §15b.2; RE-FIRMADO S61-B11/B12 sobre píxeles: el founder cuestionó
 * la tinta y GANÓ EL MURO tealDark). Nace TechoOficio (ex TechoTinta):
 * bg tealDark #0A7268 (constante en los 3 temas — el muro del oficio
 * no celebra ni se apaga), la MISMA curva orgánica 44/26, ISOTIPO en
 * blanco (identidad, fuera de la contabilidad de dosis).
 *
 * REGLAS NUEVAS DE LA ENMIENDA (verify-contrast S61):
 *   · sobre el muro, el acento funcional es PAPEL — el teal puro cae a
 *     3.77 sobre tealDark y queda PROHIBIDO ahí;
 *   · TODO texto sobre el muro va papel PLENO (la opacidad .78 caía a
 *     4.01 — la jerarquía la da el tamaño, jamás la transparencia);
 *   · el VIDRIO sobre el muro es OSCURO (negro .18 → papel 7.37; el
 *     claro .14 caía a 4.15).
 *
 * `pie` (S61-B12): el slot del toggle compacto (Hoy/Semana del HOY) —
 * el segmentado gemelo apilado MURIÓ; ToggleTecho es el control
 * canónico sobre el muro (activo = superficie PAPEL con texto del
 * muro, 5.51 ✓). Composición local del app (patrón espejo-oferta); su
 * promoción a packages/ui sigue anotada como pedido a la A.
 */

import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type DimensionValue } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Badge, Boton, Hoja, Icono, Insignia, Isotipo, Texto, motion, palette, radius, spacing, typography, useEtiquetaBadge, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** La curva orgánica del techo (patrón Hogar v2) — una sola verdad. */
export const CURVA_OFICIO = { izquierda: 44, derecha: 26 };
const CURVA = CURVA_OFICIO;

/**
 * El muro del oficio (§15b.2 S61) — una sola verdad para techo y velo.
 * S63 (D-407 pagada): el muro gana su PAR OSCURO — en dark resuelve a
 * tealDarkNoche #0A4A44 (papel 9.61 · textDark0 8.81 · teal puro 6.57,
 * mediciones S63-B); light y memorial siguen en tealDark #0A7268. La
 * const de módulo murió (Ley 37): el muro ahora escucha el tema.
 */
export function useMuroOficio(): string {
  const { mode } = useTheme();
  return mode === 'dark' ? palette.tealDarkNoche : palette.tealDark;
}
/** El vidrio OSCURO sobre el muro (AA verificado: papel 7.37 — sobre
 *  el par noche el contraste solo SUBE). */
/* S85-C34 · EL VIDRIO SALE DEL TOKEN. Era un literal acá y B lo promovió a
   `palette.vidrioOficio` con el mismo valor — dos fuentes para un material
   es lo mismo que dos fuentes para un dibujo: divergen sin que nada falle.
   Se conserva el nombre exportado porque tiene consumidores en esta casa. */
export const VIDRIO_OFICIO = palette.vidrioOficio;

/**
 * Sobre el MURO los íconos de la barra de estado son CLAROS — el muro
 * es constante en los 3 temas. Con foco se fuerza 'light'; al perderlo
 * vuelve 'auto'. (Patrón BarraTabs, wiring por pantalla.)
 */
export function useBarraEstadoClara() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, []),
  );
}

/**
 * El VELO de la barra de estado — la zona del inset superior se pinta
 * del muro SIEMPRE, también cuando el techo (dentro del ScrollView) ya
 * scrolleó. Último hijo del contenedor raíz de la pantalla.
 */
export function VeloBarraEstadoOficio() {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();
  if (insets.top === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: muro,
      }}
    />
  );
}

// D-401 (S62): el segmento del toggle responde al dedo — la receta de
// la casa (SelectorOpcion/Boton: scale 0.99, transición spring fast).
function SegmentoTecho({
  esActivo,
  etiqueta,
  onPress,
}: {
  esActivo: boolean;
  etiqueta: string;
  onPress: () => void;
}) {
  const muro = useMuroOficio();
  const [presionado, setPresionado] = useState(false);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: esActivo }}
      onPress={onPress}
      onPressIn={() => setPresionado(true)}
      onPressOut={() => setPresionado(false)}
    >
      <Animated.View
        style={{
          paddingVertical: spacing[1.5],
          paddingHorizontal: spacing[4],
          borderRadius: radius.suave - 3,
          backgroundColor: esActivo ? palette.light0 : 'transparent',
          transform: [{ scale: presionado ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            color: esActivo ? muro : palette.light0,
          }}
        >
          {etiqueta}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** El toggle compacto SOBRE el muro (S61-B12): activo = superficie
 *  PAPEL apoyada con texto del muro; riel = vidrio oscuro. */
export function ToggleTecho<C extends string>({
  etiqueta,
  opciones,
  activo,
  onCambio,
}: {
  etiqueta: string;
  opciones: { codigo: C; etiqueta: string }[];
  activo: C;
  onCambio: (codigo: C) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={etiqueta}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        backgroundColor: VIDRIO_OFICIO,
        borderRadius: radius.suave,
        padding: 3,
      }}
    >
      {opciones.map((o) => {
        const esActivo = o.codigo === activo;
        return (
          <SegmentoTecho
            key={o.codigo}
            esActivo={esActivo}
            etiqueta={o.etiqueta}
            onPress={() => onCambio(o.codigo)}
          />
        );
      })}
    </View>
  );
}

/**
 * S77-B (D-531) — LA FORMA DE CARGA SOBRE EL MURO.
 *
 * POR QUÉ NO ES `Esqueleto` DE packages/ui: su color es
 * `theme.bg.overlay`, que en claro resuelve a `#EDEBF5` (casi blanco) —
 * sobre el muro serían bloques BRILLANTES, más ruidosos que el contenido
 * que reemplazan, y contra la regla medida de §15b.2 (sobre el muro el
 * material de superficie es VIDRIO OSCURO; el claro .14 caía a 4.15).
 * Es la MISMA frontera ya declarada arriba para `Texto`: un componente
 * del sistema que resuelve su color de `theme.*` no puede vestir el
 * muro, porque el muro no está en la escala del tema.
 *
 * Ley 13 intacta: INERTE — sin shimmer, sin pulso, sin fade. Y se
 * compone imitando el layout final para que el reemplazo no corra nada
 * (el punto de D-531: la portada tiene que leerse CARGANDO, no ROTA).
 * El contrato de a11y se hereda del sistema: cada forma se oculta del
 * lector y el ANUNCIO lo pone `EsqueletoGrupo` de `@epetplace/ui`, que
 * es agnóstico de color y por eso sí cruza.
 *
 * Composición local del app (patrón espejo-oferta, igual que
 * `ToggleTecho`); su promoción a packages/ui queda anotada como pedido
 * a la A: `Esqueleto` con `superficie="clara" | "muro"`, exactamente el
 * eje que `LogoNegocio` ya resolvió (S76-B1.2).
 */
export function EsqueletoOficio({
  ancho,
  alto,
  radio = radius.sm,
}: {
  ancho: DimensionValue;
  alto: number;
  radio?: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: ancho, height: alto, borderRadius: radio, backgroundColor: VIDRIO_OFICIO }}
    />
  );
}

/**
 * S71-B1 — LA LÍNEA DE LA JORNADA (`jornada`, enmienda ADITIVA).
 *
 * El techo dejó de rotular para ORIENTAR: `titulo` es la persona,
 * `dato` el negocio, y `jornada` la forma del día — el dato que cuenta
 * hacia atrás ("Te quedan 2 · terminas 18:30" → "Jornada completa.").
 * Ausente ⇒ el techo se comporta EXACTAMENTE como antes: `negocio.tsx`
 * no se toca.
 *
 * E8 de la vara cruzada — RÉGIMEN DEL TECHO, declarado: la línea va
 * ENTERA en DM Sans (`md` medium, papel PLENO). La hora inline NO va en
 * mono: `18:30` dentro de una frase humana es prosa, no metadata de
 * fila, y partir la fuente a mitad de oración viola Ley 17.6. Por la
 * misma frontera, `Texto` (S71-A1) NO aplica acá: sin prop `style` no
 * puede dar papel pleno sobre el muro — `theme.text.*` resuelve a la
 * escala del tema, no a la del muro.
 *
 * E5 — `numberOfLines={1}` en persona Y negocio: `nombre_comercial` es
 * texto libre y largo ("Clínica Veterinaria Aurora del Valle Sur").
 */
/** La identidad del techo — isotipo + saludo + negocio con su insignia.
 *  Extraída de la fila del techo en S88-C para que el `gap` de la esquina
 *  de la campana quede LEGIBLE al lado de su montaje (R32). Sin cambio de
 *  composición: es el mismo bloque que vivía inline desde S58/S85. */
function IdentidadDelTecho({
  titulo,
  dato,
  cohorte,
  cohorteAnio,
  onEmblema,
}: {
  titulo: string;
  dato: string;
  cohorte?: 'fundador' | 'pionero' | null;
  cohorteAnio?: number | null;
  onEmblema: () => void;
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      {/* enmienda §15b.2 FIRMADA en gate S58: el isotipo en blanco —
          identidad, UNO por pantalla, fuera de la contabilidad */}
      <Isotipo size={26} variant="blanco" />
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.xl,
            color: palette.light0,
          }}
        >
          {titulo}
        </Text>
        {/* papel PLENO (regla S61): sobre el muro la opacidad muere.
            La insignia va JUNTO AL NOMBRE DEL NEGOCIO —no al saludo—
            porque la cohorte es del negocio, no de la persona. El
            nombre cede ancho (`flexShrink`) para que la distinción no
            se corte: entre truncar el nombre propio y truncar una
            insignia de dos palabras, se trunca el que el prestador ya
            conoce de memoria. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Text
            numberOfLines={1}
            style={{
              flexShrink: 1,
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              color: palette.light0,
            }}
          >
            {dato}
          </Text>
          {cohorte !== null && cohorte !== undefined && cohorteAnio !== null && cohorteAnio !== undefined && (
            <Insignia
              distincion="cohorte"
              superficie="muro"
              cohorte={cohorte}
              cohorteAnio={cohorteAnio}
              tamaño="sm"
              onPress={onEmblema}
            />
          )}
        </View>
      </View>
    </View>
  );
}

export function TechoOficio({
  titulo,
  dato,
  jornada,
  pie,
  cohorte,
  cohorteAnio,
  avisosSinLeer,
  onAvisos,
}: {
  titulo: string;
  dato: string;
  jornada?: string;
  pie?: ReactNode;
  /**
   * ⭐ S85-C27 — LA COHORTE, CRUDA. `Insignia` compone la frase en las
   * dos lenguas (B `9449bf5`); **esta casa no arma la etiqueta**. Armarla
   * acá pondría la misma frase en dos diccionarios, y dos diccionarios se
   * desincronizan sin que nada falle.
   *
   * ⚠️ **SE MONTA ACÁ ADENTRO Y NO EN LA PANTALLA, y no es comodidad:**
   * `superficie="muro"` **no es opcional en este techo** — sin ella
   * `capaText.comunidad` da **1.03 de contraste en claro**, o sea
   * invisible (medido por B). Si la pieza viviera en la pantalla, cada
   * consumidor tendría que acordarse de una prop **cuyo olvido no rompe
   * nada y no se ve**. *La regla del muro vive con el muro:* acá es
   * imposible olvidarla.
   *
   * 🔴 **DEUDA DECLARADA (S85, gate del founder): LA JERARQUÍA DEL TECHO
   * NO PUEDE DEPENDER DE UN DATO OPCIONAL.**
   *
   * El founder pidió el nombre del negocio *"más chico"* y después firmó
   * el resultado —pero **el `fontSize` nunca cambió**: sigue en `sm`, igual
   * que antes (medido contra su ancla anterior `0419cc8`; los tokens de
   * tipografía y el `Isotipo`, intactos). *Lo que cambió es la
   * COMPOSICIÓN:* el nombre dejó de ser lo único de su renglón —ahora lo
   * comparte con esta insignia— y arriba de los tres números. **Pesa menos
   * sin haber encogido.**
   *
   * ⇒ **La mejora que le gusta depende de que la insignia SE MONTE.** Un
   * prestador **sin cohorte** recupera el renglón entero y **vuelve a la
   * queja original sin que nadie sepa por qué** — porque lo que se
   * "arregló" no existe como cambio.
   *
   * **Hoy el caso no está vivo** (todos los prestadores tienen cohorte) y
   * **nace el día que alguien entre después de marzo 2027**, cuando la
   * ventana fundacional cierre. **Dueño: B**, junto con el rehecho del
   * bloque de los tres números — el renglón del nombre tiene que
   * sostenerse solo, con o sin insignia. *Si necesita decisión de diseño,
   * va a la mesa.*
   *
   * ⚠️ **EL GUARD DE NULOS ES DE ESTA CASA, y es correcto que lo sea:**
   * `Insignia` pide los dos campos NO nulos —*los dos datos o ninguno*—
   * y `MiPrestador` los da nullable. **No es un catálogo duplicado** (eso
   * sería repetir `'fundador' | 'pionero'`): es saber si mi fuente trae
   * el dato, que es responsabilidad de quien la lee. Incompleto = la
   * insignia **no se monta**, jamás un hueco ni una frase a medias.
   */
  cohorte?: 'fundador' | 'pionero' | null;
  cohorteAnio?: number | null;
  /** S88-C · LA CAMPANA (lámina firmada). `onAvisos` presente = la campana
   *  se monta INLINE en la fila del techo (jamás absoluta — la esquina
   *  firmada); ausente = el techo queda como era (negocio.tsx no la lleva:
   *  la lámina la pone en el encabezado del HOY). `avisosSinLeer` es el
   *  BOOLEANO de `hayAvisosSinLeer` — la huella marca PRESENCIA, jamás un
   *  número, y la forma del dato lo hace imposible. */
  avisosSinLeer?: boolean;
  onAvisos?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();
  const { t } = useTraduccion();
  const etiquetaBadge = useEtiquetaBadge();
  useBarraEstadoClara();
  /* S85-C34 · EL MODAL DEL EMBLEMA. Vive acá, con la insignia: la Hoja no
     necesita nada de la pantalla y sacarla afuera obligaría a cablear un
     estado que solo esta pieza usa. */
  const [emblemaAbierto, setEmblemaAbierto] = useState(false);

  return (
    <View
      style={{
        backgroundColor: muro,
        paddingTop: insets.top + spacing[4],
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[5],
        borderBottomLeftRadius: CURVA.izquierda,
        borderBottomRightRadius: CURVA.derecha,
        overflow: 'hidden',
        gap: spacing[4],
      }}
    >
      {/* S88-C · LA ESQUINA DE LA CAMPANA (lámina firmada): la campana va
          INLINE en la fila del techo, jamás absoluta — el layout la cuenta.
          El `gap: spacing[5]` (20dp) de esta fila es EL NÚMERO CONGELADO de
          la lámina (10+10, los hitSlop de los dos vecinos) y R32 lo lee
          estáticamente — la identidad se extrajo a su pieza EXACTAMENTE
          para que este gap sea legible al lado de la campana (la primera
          corrida de R32 no lo veía a 60 líneas: el guard tenía razón).
          La regla de truncado no cambia: título y dato ceden ancho
          adentro de IdentidadDelTecho. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[5] }}>
        <IdentidadDelTecho
          titulo={titulo}
          dato={dato}
          cohorte={cohorte}
          cohorteAnio={cohorteAnio}
          onEmblema={() => setEmblemaAbierto(true)}
        />
        {onAvisos !== undefined && (
          <Pressable
            onPress={onAvisos}
            hitSlop={10}
            accessibilityRole="button"
            /* El estado viaja en el label (contrato del Badge, mitad ②):
               con huella el label dice «sin leer», jamás un número. */
            accessibilityLabel={etiquetaBadge(t('avisos.titulo'), avisosSinLeer === true ? 1 : 0, 'huella')}
          >
            <Badge n={avisosSinLeer === true ? 1 : 0} forma="huella">
              {/* Campana EN TRAZO (ley del único relleno: el relleno es de
                  la huella del Badge); papel pleno sobre el muro. */}
              <Icono nombre="campana" tamano={24} tinta={palette.light0} />
            </Badge>
          </Pressable>
        )}
      </View>
      {/* La forma del día — su propio aire, papel pleno, DM Sans entera. */}
      {jornada !== undefined && (
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.md,
            color: palette.light0,
          }}
        >
          {jornada}
        </Text>
      )}
      {pie}

      {/* ⭐ S85-C34 · EL MODAL DEL EMBLEMA (`PORTAL_PRESTADOR` §2.3).

          **NO es una glosa de la insignia** (*"la cohorte fundadora es…"*):
          es **LA BIENVENIDA DEVUELTA**. El prestador toca su emblema y
          vuelve a leer **por qué fue elegido**, con la firma de quien lo
          eligió. *Explicar qué significa un badge sería contarle una regla
          del producto; esto le devuelve una decisión sobre él.*

          ⚠️ **SIN EL "N"** (firma del founder): un número horneado en una
          app **envejece sin avisar**. ⏪ Esta nota decía que la app *"ya
          tiene el caso, porque `dia1.eleccion` dice uno de los 15"* — y
          **ese era el argumento, no un ejemplo**: la misma frase vivía en
          dos pantallas con dos verdades. **El founder resolvió la
          divergencia sacando el N también de la carta** (S85-C35), así que
          hoy las dos superficies dicen lo mismo y ninguna caduca.
          *Se corrige acá porque el texto citaba un estado del árbol que
          este mismo commit cambió: un argumento que describe algo que ya
          no pasa se lee como advertencia vigente* (L-198).

          ⚠️ **LA FIRMA VA CON NOMBRE PROPIO, jamás "el equipo":** un
          reconocimiento firmado por una institución **deja de ser una
          elección**. Y no se escribe una segunda — `dia1.firmaNombre` /
          `dia1.firmaRol` ya existen: la firma del founder vive UNA vez.

          Modulado por cohorte: la pieza ya sabe cuál es, así que la voz
          del fundador y la del pionero no necesitan un condicional afuera. */}
      <Hoja visible={emblemaAbierto} onCerrar={() => setEmblemaAbierto(false)} titulo={t('emblema.titulo')}>
        <View style={{ gap: spacing[4] }}>
          <Texto variante="cuerpo">
            {cohorte === 'pionero' ? t('emblema.cuerpoPionero') : t('emblema.cuerpoFundador')}
          </Texto>
          <View style={{ gap: 2 }}>
            <Texto variante="cuerpo">{t('dia1.firmaNombre')}</Texto>
            <Texto variante="apoyo">{t('dia1.firmaRol')}</Texto>
          </View>
          <View style={{ alignSelf: 'flex-start' }}>
            <Boton variante="secundario" etiqueta={t('emblema.cerrar')} onPress={() => setEmblemaAbierto(false)} />
          </View>
        </View>
      </Hoja>
    </View>
  );
}

/* ☠️ ACÁ VIVÍA `TresNumeros` (S85-C23) — MURIÓ AL SUBIR A packages/ui
   (B, S85-B26). Ley 37: una pieza local con una gemela en la casa no es
   una pieza, es una copia esperando divergir.
   Y LO QUE SE GANÓ NO ES ORDEN, ES UN TIPO: el contrato de B distingue
   `{valor, rotulo}` de `{frase}`, así que **la diferencia entre "una
   cifra" y "un permiso que se explica" dejó de vivir en un ternario mío
   y pasó a vivir en el tipo** — no se puede mezclar mal. Y exige la
   TUPLA de tres, o sea que "siempre los tres, siempre en ese orden" ya
   no es una nota: es una firma que el compilador verifica. */

