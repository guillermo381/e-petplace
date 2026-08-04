/**
 * CUENTA del prestador — el índice (S57-B, letra P17 firmada; header
 * CD S61-B12/D-370, pulgar founder sobre el mock B8 traducido a la
 * casa). Mapa: header del oficio con la identidad · Tu perfil ·
 * Preferencias · Sesión y cuenta (P17 §4 intacto).
 *
 * TESIS: "este es TU negocio en e-PetPlace — quién eres para las
 * familias y qué está en marcha, de un vistazo."
 * FIRMA: la identidad sobre el MURO del oficio — avatar squircle 32%
 * (A10) + el trío de datos REALES en la banda de vidrio (variante
 * prestador-nuevo: hitos de preparación; JAMÁS ceros — sin hitos, la
 * banda no existe).
 * CHANEL: el Encabezado portada MURIÓ (la navegación es 'cuenta' en
 * mono + el engranaje en vidrio → Preferencias); el badge fundador es
 * PILL DE VIDRIO con texto papel — la Insignia de papel no pasa AA
 * sobre el muro (regla S61: sobre el muro el acento funcional es
 * PAPEL). El programa del badge = D-398.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  CeldaNavegacion,
  EsqueletoGrupo,
  Hoja,
  Icono,
  LogoNegocio,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  palette,
  radius,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  cerrarSesion,
  obtenerFranjasHorario,
  obtenerMiPrestador,
  obtenerMundoVeterinariaPropio,
  obtenerOfertaAdiestramientoPropia,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
  resolverUrlLogoNegocio,
} from '@epetplace/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CURVA_OFICIO,
  EsqueletoOficio,
  VIDRIO_OFICIO,
  VeloBarraEstadoOficio,
  useBarraEstadoClara,
  useMuroOficio,
} from '@/components/techo-oficio';
import { vozOficio } from '@/lib/voz-oficio';
import { useTraduccion } from '@/i18n';

// El lado del slot de identidad del header CD (S61-B12, firmado).
// S76-B1.2: `RADIO_SQUIRCLE` MURIÓ con el monograma inline (Ley 37) —
// el slot lo llena `LogoNegocio`, que trae su propia forma: caja
// `radius.suave`, la forma canónica del logo de negocio en la casa.
// DELTA VISIBLE DECLARADO AL GATE: el contenedor pasa de squircle 32%
// (27) a suave (10). Se elige la COHERENCIA DEL COMPONENTE — el mismo
// logo se ve idéntico en las tres superficies (portada, equipo,
// invitación); un squircle acá le daría dos formas al mismo objeto en
// la misma app. El squircle 32% sigue siendo de las CARAS (Ley 21b,
// AvatarMascota), y un logo no es una cara. Reversión barata si el
// founder prefiere la forma vieja: una prop de radio en el componente.
const LADO_AVATAR = 84;

/**
 * S81-C — EL BRILLO DE PLACA de la pill "Prestador fundador" (§8.5, LA
 * ley del brillo: legal solo donde la cosa ES un objeto — placa, sello,
 * credencial; censo al firmar S80 = UNO, exactamente esta pill). El
 * número es del founder y está FIRMADO: **6 s LINEALES, en loop** —
 * "lento lo material: 6 s es el paso del vidrio; por debajo de ~4 s se
 * lee como LED" (§5.4). D-572 MEDIDA (L-131): papel sobre vidrio del
 * muro + pico del brillo al 14% blanco = 5.22 en el peor muro
 * (tealDark claro) — AA con margen; a 18% caía a 4.74 y se eligió 14
 * por número. Y el HALLAZGO de la medición: la variante rampa-de-fondo
 * con tinta (la lámina S80) queda REFUTADA — falla en el punto MEDIO de
 * la interpolación (4.48 < 4.5), no en el más claro que D-572
 * sospechaba. La pill conserva vidrio + papel (regla S61: sobre el muro
 * el acento funcional es PAPEL); el brillo es la luz sobre ese vidrio.
 */
function BrilloDePlaca() {
  const progreso = useSharedValue(0);
  useEffect(() => {
    progreso.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progreso]);
  const estilo = useAnimatedStyle(() => ({
    // la banda barre de fuera a fuera; la pill (~140 px) queda cubierta
    transform: [{ translateX: -60 + progreso.value * 260 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, bottom: 0, width: 48 }, estilo]}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="brilloPlaca" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.white} stopOpacity="0" />
            <Stop offset="0.5" stopColor={palette.white} stopOpacity="0.14" />
            <Stop offset="1" stopColor={palette.white} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#brilloPlaca)" />
      </Svg>
    </Animated.View>
  );
}

/**
 * S77-B (D-531) — EL PORTÓN, PARTIDO EN DOS.
 *
 * Antes había UN estado y UN `setIdentidad`: el nombre y el logo colgaban
 * del MISMO gate que la banda de hitos. Medido en S77-B: el header
 * esperaba CINCO viajes de red en serie cuando solo necesitaba DOS
 * (`obtenerMiPrestador` = getUser + select). Los otros tres son de los
 * hitos — contenido SECUNDARIO del muro que estaba tomando de rehén a la
 * identidad. (Lo que el canon sospechaba, `resolverUrlLogoNegocio`, quedó
 * descartado con medición: es síncrona y sin red.)
 *
 * El estado FINAL es idéntico al de antes; cambia CUÁNDO pinta cada parte.
 */
type Identidad = {
  nombre: string;
  ciudad: string | null;
  /** S76-B1.2 (D-505): el PATH del logo — la portada lo pinta si existe.
   *  La lectura ya viene en `obtenerMiPrestador`; lo que faltaba era
   *  que esta pantalla lo mirara. */
  logoPath: string | null;
};

/** Lo que sale de las lecturas de oferta y agenda. Llega DESPUÉS y
 *  su ausencia ya no borra el header: la voz del oficio se suma al
 *  subtítulo cuando llega, y la banda de hitos conserva su regla de
 *  existencia (sin hitos NO existe — jamás ceros, S61-B12).
 *  S79-B (T2-B3): la voz de oficio pasa a computarse de los CUATRO
 *  oficios (lib/voz-oficio) — solo-vet y solo-adiestramiento estaban
 *  MUDOS, y la cohorte que se recluta es de vets. */
type Negocio = {
  vozOficio: string | null;
  hitos: string[];
};


export default function Cuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();
  useBarraEstadoClara();

  const [salirAbierta, setSalirAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [eliminarAbierta, setEliminarAbierta] = useState(false);
  // la identidad del header CD (S61-B12): datos REALES o nada
  const [identidad, setIdentidad] = useState<Identidad | null>(null);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  // D-531: si la identidad NO se puede leer, el esqueleto tiene que
  // PARARSE. Un esqueleto eterno es peor que el hueco — sería el error
  // disfrazado de "cargando" (Ley 13, la cara inversa de "el error jamás
  // se disfraza de vacío").
  //
  // D-536 (S77-B) — Y AHORA EL FALLO DICE QUE ES UN FALLO. La cura de
  // D-531 colapsaba el header a título+engranaje: honesto contra el
  // esqueleto eterno, pero seguía siendo **el error pintado como dato
  // ausente**, que es la misma ley por el otro lado. Faltaba la tercera
  // vía —una voz— y no se tomó entonces porque exigía inventar copy sin
  // gate. Ahora existe, con UN solo string propuesto.
  //
  // `reintentable` NO es decoración: Ley 17.4 — un reintento que no puede
  // arreglar nada es una promesa falsa. `sin_prestador` y `sin_sesion` no
  // son fallos de lectura, son ESTADOS (el vínculo existe pero el negocio
  // no está activo; o no hay sesión) — ahí reintentar no cambia nada.
  // Precedente literal de la casa: `consulta.errorDetalle` (S75-B16) se
  // escribió "sin promesa falsa de reintento: si no hay acceso, reintentar
  // no lo arregla".
  const [fallo, setFallo] = useState<{ reintentable: boolean } | null>(null);
  // El reintento re-corre EL MISMO camino de carga en vez de duplicarlo:
  // el efecto de foco depende de este contador.
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setFallo({
            reintentable:
              prestador.codigo !== 'sin_prestador' && prestador.codigo !== 'sin_sesion',
          });
          return;
        }
        // ── EL HEADER PINTA ACÁ: los 2 viajes que de verdad necesita ──
        setFallo(null);
        setIdentidad({
          nombre: prestador.data.nombre_comercial,
          ciudad: prestador.data.ciudad,
          logoPath: prestador.data.foto_url,
        });

        // ── y recién ahora lo secundario, con su propio estado ──
        // S79-B (T2-B3): entran vet y adiestramiento — la voz de oficio ya
        // no es ciega a la mitad de los oficios (+2 viajes en la carga
        // SECUNDARIA; el header ya pintó — D-531 intacta).
        const [rPaseo, rGrooming, rAdiestramiento, rVet, rFranjas] = await Promise.all([
          obtenerOfertasPaseoPropias(prestador.data.id),
          obtenerOfertasGroomingPropias(prestador.data.id),
          obtenerOfertaAdiestramientoPropia(prestador.data.id),
          obtenerMundoVeterinariaPropio(prestador.data.id),
          obtenerFranjasHorario(prestador.data.id),
        ]);
        if (!vigente) return;
        const paseoActivo = rPaseo.ok && rPaseo.data.some((o) => o.activo);
        const groomingActivo = rGrooming.ok && rGrooming.data.some((o) => o.activo);
        const adiestramientoActivo =
          rAdiestramiento.ok && (rAdiestramiento.data.oferta?.activo ?? false);
        const vetActivo = rVet.ok && rVet.data.servicios.some((s) => s.activo);
        const diasActivos = rFranjas.ok
          ? new Set(rFranjas.data.filter((f) => f.activo).map((f) => f.diaSemana)).size
          : 0;
        const domicilio = rGrooming.ok && rGrooming.data.some((o) => o.activo && o.atiendeDomicilio);
        // el trío: SOLO datos reales — sin nada, la banda no existe
        const hitos: string[] = [];
        if (paseoActivo || groomingActivo || adiestramientoActivo || vetActivo)
          hitos.push(t('miCuenta.hitoOferta'));
        if (diasActivos > 0) hitos.push(t('miCuenta.hitoAgenda', { n: diasActivos }));
        if (domicilio) hitos.push(t('miCuenta.hitoDomicilio'));
        setNegocio({
          vozOficio: vozOficio(
            { paseo: paseoActivo, grooming: groomingActivo, adiestramiento: adiestramientoActivo, vet: vetActivo },
            t,
          ),
          hitos,
        });
      })();
      return () => {
        vigente = false;
      };
      // `intento` (D-536): al reintentar, el efecto vuelve a correr el
      // mismo camino — cero lógica de carga duplicada.
    }, [t, intento]),
  );

  const vozDelOficio = negocio?.vozOficio ?? null;

  // D-531 (higiene, DECLARADA como tal): la derivación de la URL pública
  // es síncrona y sin red — está MEDIDO que no es el cuello (microsegundos).
  // Se memoiza porque corría en cada render sin necesidad, no porque cure
  // la deuda.
  const logoUrl = useMemo(
    () => resolverUrlLogoNegocio(identidad?.logoPath ?? null),
    [identidad?.logoPath],
  );

  // S58 (D-361 levantado): cada entrada con su ícono b′ del registry —
  // el perfil comparte la chapita 'cuenta' (decisión del lote ea7e8e4)
  /* ═══ S85-C2 · LAS CUATRO PUERTAS (firma del founder sobre el censo) ═══
     El índice pasa de cuatro entradas confusas a cuatro que se distinguen
     por AUDIENCIA, que es el eje que faltaba:

       · **Tu perfil** — lo que la familia VE. Vitrina y nada más.
       · **Tu negocio** — lo que solo ve el EQUIPO (fiscal · cobro ·
         documentos). Puerta NUEVA en la raíz, no un rename del perfil.
       · **Seguridad** — lo que no ve NADIE: tu nombre y tu clave.
       · **Preferencias** — sin cambios.

     ☠️ QUÉ MURIÓ Y POR QUÉ, medido en el censo:
      · **`Tus datos`** llevaba a una pantalla titulada "Seguridad" — se
        tocaba una cosa y se aterrizaba en otra (17.3). Hoy la celda y la
        pantalla se llaman IGUAL.
      · **La celda `Contraseña`** era la SEGUNDA puerta a lo mismo (la
        otra vivía dentro de la pantalla de identidad). **Puerta única.**
      · **`/cuenta/identidad`** dejó de existir: su contenido está adentro
        de Seguridad, entero.

     ⚠️ `Tu negocio` NO es un rename de `Tu perfil`: son dos destinos
     distintos que antes compartían pantalla. Su régimen de acceso queda
     INTACTO —la cuenta comercial es owner-only por RLS y esta puerta no
     lo toca—; lo único que cambia es dónde se la busca. */
  const lugares = [
    { etiqueta: t('miCuenta.perfil'), ruta: '/cuenta/perfil' as const, icono: 'cuenta' as const },
    { etiqueta: t('miCuenta.negocio'), ruta: '/cuenta-comercial' as const, icono: 'negocio' as const },
    /* ⭐ S85-C6 — EL ESCUDO (salida (a) firmada por la mesa). Reusa
       `seguros`, que ES el escudo del registry ("la vida protegida").
       ⚠️ LA COLISIÓN DE METÁFORA SE DECLARA, no se esconde: ese glifo
       tiene consumidor VIVO como SERVICIO en el cliente
       (`explorar/index.tsx:106`, la fila "próximamente Seguros"). El
       atenuante que lo hace aceptable está MEDIDO y es el que firmó la
       mesa: viven en apps distintas y **ningún usuario ve los dos** — un
       prestador no entra a Explorar del cliente. Pedir un segundo escudo
       habría producido dos dibujos casi iguales, que es peor que un
       dibujo con dos usos declarados.
       ☠️ Su nota en el registry la escribe B (territorio suyo); acá solo
       se consume. */
    { etiqueta: t('seguridad.tituloPantalla'), ruta: '/cuenta/seguridad' as const, icono: 'seguros' as const },
    { etiqueta: t('miCuenta.preferencias'), ruta: '/cuenta/preferencias' as const, icono: 'preferencias' as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
        {/* EL HEADER CD (S61-B12, D-370): la identidad sobre el MURO —
            navegación mono + engranaje en vidrio · dos columnas con el
            squircle A10 · el trío real en banda de vidrio oscuro
            (papel 7.37 ✓; el vidrio claro caía a 4.15). */}
        <View
          style={{
            backgroundColor: muro,
            paddingTop: insets.top + spacing[3],
            paddingBottom: spacing[5],
            paddingHorizontal: spacing[5],
            borderBottomLeftRadius: CURVA_OFICIO.izquierda,
            borderBottomRightRadius: CURVA_OFICIO.derecha,
            overflow: 'hidden',
            gap: spacing[4],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.sm,
                letterSpacing: typography.tracking.mono,
                color: palette.light0,
              }}
            >
              {t('miCuenta.titulo').toLowerCase()}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('miCuenta.preferencias')}
              onPress={() => router.push('/cuenta/preferencias')}
              // D-401 (S62): el engranaje responde al dedo — receta de la
              // casa (scale 0.97 de Boton: es un botón circular, no una
              // superficie); el vidrio no cambia de color al tocarse.
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: radius.full,
                backgroundColor: VIDRIO_OFICIO,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Icono nombre="preferencias" registro="tinta" tinta={palette.light0} tamano={21} />
            </Pressable>
          </View>

          {/* D-531 · LEY 13: mientras la identidad viaja, el muro reserva
              SU GEOMETRÍA FINAL con formas de vidrio. El lado del logo (84)
              gobierna el alto de la fila en los dos estados, así que el
              reemplazo no corre nada — la portada se lee CARGANDO, no ROTA
              (que es como se leía: el muro pintaba solo título+engranaje y
              después crecía de golpe). Inerte por ley: sin shimmer, sin
              pulso, sin fade. NO es la espera de marca — esa la reserva
              DIRECCION_ARTE §5.3 para procesos >2s, y esto es carga de
              contenido. Con `fallo` no se dibuja: un esqueleto
              eterno sería el error disfrazado de cargando. */}
          {identidad === null && fallo === null && (
            <EsqueletoGrupo>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                <EsqueletoOficio ancho={LADO_AVATAR} alto={LADO_AVATAR} radio={radius.suave} />
                <View style={{ flex: 1, gap: spacing[1.5] }}>
                  {/* el nombre · el subtítulo · la pill del badge */}
                  <EsqueletoOficio ancho="70%" alto={typography.size.xl} />
                  <EsqueletoOficio ancho="45%" alto={typography.size.sm} />
                  <EsqueletoOficio
                    ancho={104}
                    alto={typography.size.xs + spacing[3]}
                    radio={radius.full}
                  />
                </View>
              </View>
            </EsqueletoGrupo>
          )}

          {/* D-536 · LA VOZ DEL FALLO — el error deja de verse como "no hay
              nada". Ocupa el MISMO slot que la identidad, pero NO su forma:
              sin caja de logo y sin monograma. Esa distinción es el pedido
              central de la deuda — un negocio SIN LOGO sigue mostrando su
              fila completa (monograma + nombre + badge, que es la ausencia
              REAL y es correcta); un negocio que NO SE PUDO LEER muestra una
              línea. Ausencia y fallo dejan de ser el mismo dibujo.
              Un monograma acá sería peor que el hueco: habría que inventarle
              iniciales a un nombre que justamente no se pudo leer.
              Materiales: los del muro, ya medidos (§15b.2) — texto en papel
              PLENO, píldora de VIDRIO OSCURO (papel 7.37 ✓). Cero token
              nuevo ⇒ cero par WCAG nuevo. */}
          {fallo !== null && (
            <View style={{ gap: spacing[3], alignItems: 'flex-start' }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  color: palette.light0,
                }}
              >
                {t('miCuenta.identidadNoCargo')}
              </Text>
              {/* Ley 17.5 (cero finales mudos) — pero SOLO cuando reintentar
                  puede servir de algo (Ley 17.4). La píldora reusa el MISMO
                  material que el badge fundador de esta pantalla y la receta
                  de presión del engranaje (scale 0.97): vocabulario propio
                  del archivo, no invención. `Boton` no cruza al muro por la
                  frontera ya declarada en techo-oficio.tsx (resuelve color de
                  `theme.*`, que no está en la escala del muro) — su
                  consolidación es D-535, no esta cura. */}
              {fallo.reintentable && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIntento((n) => n + 1)}
                  style={({ pressed }) => ({
                    minHeight: 44,
                    justifyContent: 'center',
                    paddingHorizontal: spacing[4],
                    borderRadius: radius.full,
                    backgroundColor: VIDRIO_OFICIO,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.sm,
                      color: palette.light0,
                    }}
                  >
                    {t('agenda.reintentar')}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {identidad !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
              {/* S76-B1.2 (D-505, gate del founder): LA PORTADA MOSTRABA
                  UN MONOGRAMA QUE NUNCA PODÍA SER EL LOGO. Este slot era
                  un View inline con la inicial (S61-B12, tres sesiones
                  antes de que LogoNegocio existiera): por eso el founder
                  subió su logo CUATRO VECES y la pantalla le dijo que no
                  había pasado nada. No era refresco — era una superficie
                  que jamás leyó `foto_url`. El slot NO cambia (mismo lado
                  84, mismo squircle, mismo vidrio): cambia su CONTENIDO
                  cuando el dato existe, como todo avatar de la casa. El
                  logo se CONTIENE (decisión de mesa S76: una cara llena
                  un círculo, una marca se destruye si se recorta). */}
              <LogoNegocio
                nombre={identidad.nombre}
                logoUrl={logoUrl}
                tamano={LADO_AVATAR}
                superficie="muro"
              />
              <View style={{ flex: 1, gap: spacing[1.5] }}>
                <Text
                  accessibilityRole="header"
                  style={{ fontFamily: typography.family.sans.light, fontSize: typography.size.xl, color: palette.light0 }}
                >
                  {identidad.nombre}
                </Text>
                {(vozDelOficio !== null || identidad.ciudad !== null) && (
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: palette.light0 }}>
                    {[vozDelOficio, identidad.ciudad].filter((x): x is string => x !== null).join(' · ')}
                  </Text>
                )}
                {/* el badge fundador: PILL de vidrio con papel (informa
                    = píldora, Ley 21; el programa es D-398) — desde
                    S81-C es LA PLACA: gana el brillo §8.5 (el único
                    sitio del censo), la firma física de §2.2 traducida
                    al portal. */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: VIDRIO_OFICIO,
                    borderRadius: radius.full,
                    paddingVertical: spacing[1],
                    paddingHorizontal: spacing[3],
                    overflow: 'hidden',
                  }}
                >
                  <BrilloDePlaca />
                  <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.xs, color: palette.light0 }}>
                    {t('miCuenta.fundador')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* D-531: la banda NO lleva esqueleto, a propósito. Su regla de
              existencia es "sin hitos NO existe" (S61-B12, jamás ceros):
              un esqueleto acá prometería una banda que en muchos negocios
              no va a llegar nunca — y al no llegar tendría que desaparecer,
              que es el corrimiento que se quería evitar, con una promesa
              rota de yapa. Llega cuando llega. */}
          {negocio !== null && negocio.hitos.length > 0 && (
            <View
              style={{
                backgroundColor: VIDRIO_OFICIO,
                borderRadius: radius.suave,
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[3],
              }}
            >
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.sm,
                  letterSpacing: typography.tracking.mono,
                  color: palette.light0,
                }}
              >
                {negocio.hitos.join(' · ')}
              </Text>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          {/* B3 (S58): papel+sombra — los tokens de elevación cruzaron
              (D-358); las celdas con ícono b′ esperan el lote D-361 y el
              COPIAR NIVEL fino, su PNG patrón. */}
          <Tarjeta relleno="ninguno" elevacion="reposo">
            {lugares.map((lugar, i) => (
              <View key={lugar.ruta}>
                {i > 0 ? <Separador /> : null}
                <CeldaNavegacion
                  icono={lugar.icono}
                  registro="aa"
                  titulo={lugar.etiqueta}
                  onPress={() => router.push(lugar.ruta)}
                />
              </View>
            ))}
          </Tarjeta>

          {/* ⭐ S85-C11 — LA GALERÍA SUBE, ARRIBA DE "Sesión y cuenta".
              El founder no encontró los dos emblemas, y la medición dijo
              que NO era alcanzabilidad: la entrada estaba viva y sin
              `__DEV__`. **Estaba ENTERRADA** — quedaba DEBAJO de "cerrar
              sesión" y "eliminar cuenta", o sea después del bloque que
              cualquiera lee como el final de la pantalla. *Una puerta
              después del final no es una puerta.*
              Es L-161 en su tercera forma: primero no existía (S83), después
              estaba nombrada en nuestro idioma (S84-C9), y ahora estaba
              puesta donde nadie sigue leyendo. **Las tres veces el gate era
              inalcanzable por una razón distinta.**
              El pie queda SOLO con el marcador de update, que es lo único
              que pertenece al final. */}
          {/* ── S83-C15 · LA PUERTA DE LA GALERÍA (decisión founder).
              El prestador NUNCA la tuvo: `/gallery` está registrada en
              el layout pero vive SOLO por URL (medido en C10) — y con
              las tres firmas de atmósfera publicadas, eso dejaba TRES
              gates del founder inalcanzables. Es L-161 al pie de la
              letra: una superficie de gate que no se puede alcanzar no
              es un gate. El cliente la tiene desde D-580; ésta es su
              hermana. SIN `__DEV__`: en un APK preview `__DEV__` es
              false y la entrada desaparecería justo donde tiene que
              existir — el defecto exacto que R18 vigila del lado
              cliente.

              ⚠️ SU CONDICIÓN NO ES LA DE SU VECINA, y la distinción es
              lo que hay que leer antes de tocarla: la celda de Perfil v2
              (arriba) SÍ muere — cuando esa pantalla se firme y
              reemplace a la vieja. **Ésta NO se retira por iniciativa de
              ninguna sesión.** La enmienda FIRMADA del founder en D-580
              lo dice para la hermana del cliente y rige igual acá: la
              galería queda visible en Cuenta, no se esconde tras
              `__DEV__` sin orden explícita, y **su retiro se DECIDE en
              el gate de producción — es una FIRMA, no una fecha del
              calendario**. El checklist de tiendas es insumo de esa
              decisión, no la decisión.
              Se escribe así, y no como "provisional", porque el modo de
              falla real es que alguien la borre creyendo que paga una
              deuda: del lado cliente eso lo caza el guard R18, cuya
              polaridad es que la entrada EXISTA.
              ⚠️ HUECO DECLARADO: **R18 mira SOLO la Cuenta del cliente**
              (`CUENTA_CLIENTE` en `verify-diseno.mjs`) — esta entrada
              queda SIN guard hasta que la regla se ensanche a las dos
              casas. Es una línea, y va aparte de este OTA.

              Los textos van LITERALES fuera del riel i18n — igual que su
              hermana del cliente: la galería no es pantalla de producto
              y su copy no pertenece al lote de strings. ── */}
          {/* ⭐ S85-C2 — LA FILA DESNUDA #1 SE VISTE. El censo la midió
              como la única fila del índice que caía sobre el papel
              mientras sus cuatro hermanas vivían en una `Tarjeta` — y una
              fila sin superficie al lado de cuatro con superficie no se
              lee como "distinta", se lee como suelta. Ahora tiene su
              propia Tarjeta: sigue SEPARADA de las cuatro (no es una
              puerta del producto), pero deja de estar desvestida. */}
          <Tarjeta relleno="ninguno" elevacion="reposo">
            <CeldaNavegacion
              icono="preferencias"
              /* S84-C9 (Ley 17.2 — los nombres van del lado del usuario).
                 El founder no la encontraba, y B midió que no estaba
                 escondida: **estaba nombrada en NUESTRO idioma**. "Galería
                 de tokens" es vocabulario de quien construye, y su
                 subtítulo —"no es pantalla de producto"— le decía
                 literalmente que eso no era para él. El nombre nuevo dice
                 QUÉ HAY y QUÉ SE ESPERA DE ÉL: son láminas, son de gate, y
                 las tiene que firmar. */
              titulo="Láminas de gate · para firmar"
              detalle="lo que espera tu ojo esta sesión"
              registro="aa"
              onPress={() => router.push('/gallery')}
            />
          </Tarjeta>

          {/* ── Sesión y cuenta (la sesión se MUDÓ desde Negocio) ── */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('sesion.titulo')}</Texto>
            <Boton variante="secundario" etiqueta={t('sesion.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            <Boton variante="ghost" etiqueta={t('miCuenta.eliminarCuenta')} bloque onPress={() => setEliminarAbierta(true)} />
          </View>

          




          {/* ── S74-B · EL MARCADOR RENDERIZADO (L-160/L-161): el
              [update] era SOLO console.log — logcat-only, inalcanzable
              para el founder sin cable (hallazgo del gate S74). La
              identidad del build gana pantalla: Cuenta → pie. Voz de
              máquina (Ley 3: metadata en mono); id corto = los primeros
              8 del updateId (único por publicación); embebido/dev se
              dice honesto. Camino literal: tab Cuenta → el pie. ── */}
          {/* S81-B2: el lanzamiento EMBEBIDO de un release tiene updateId
              NO-nulo (el id de assets/app.manifest — el founder leyó
              "update 6aab7106" corriendo el bundle embebido). El
              discriminador es isEmbeddedLaunch, no la nulidad (L-160). */}
          <Texto variante="dato">
            {!Updates.isEmbeddedLaunch && Updates.updateId !== null
              ? `update ${Updates.updateId.slice(0, 8)} · ${Updates.channel ?? 'sin canal'}`
              : 'bundle embebido / dev'}
          </Texto>
        </View>
      </ScrollView>

      <Hoja visible={salirAbierta} onCerrar={() => setSalirAbierta(false)} titulo={t('sesion.titulo')}>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          {/* S81-C: la prosa de la Hoja por la pieza del sistema — los
              Text crudos del MURO quedan (frontera techo-oficio, D-535);
              este vive sobre el tema y no tenía excusa. */}
          <Texto variante="cuerpo" color="secondary">
            {t('sesion.confirmacionCierre')}
          </Texto>
          <Boton
            variante="destructivo"
            etiqueta={t('sesion.cerrarSesion')}
            bloque
            cargando={cerrando}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void (async () => {
                await cerrarSesion();
                setCerrando(false);
                setSalirAbierta(false);
                // D-290: la salida aterriza en el login; el replace
                // desmonta las tabs y el guard raíz re-decide fresco.
                router.replace('/login');
              })();
            }}
          />
          <Boton variante="ghost" etiqueta={t('sesion.cancelar')} bloque onPress={() => setSalirAbierta(false)} />
        </View>
      </Hoja>

      {/* Eliminar cuenta — P17 §4: la entrada existe y dice su verdad;
          las reglas (citas pagadas, planes vivos, saldo por liquidar)
          se escriben como enmienda de letra ANTES de construir. */}
      <Hoja visible={eliminarAbierta} onCerrar={() => setEliminarAbierta(false)} titulo={t('miCuenta.eliminarCuenta')} conCerrar>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo" color="secondary">
            {t('miCuenta.eliminarVoz')}
          </Texto>
          <Boton variante="secundario" etiqueta={t('miCuenta.entendido')} bloque onPress={() => setEliminarAbierta(false)} />
        </View>
      </Hoja>
      {/* el velo del muro — la barra de estado jamás queda blanca */}
      <VeloBarraEstadoOficio />
    </View>
  );
}
