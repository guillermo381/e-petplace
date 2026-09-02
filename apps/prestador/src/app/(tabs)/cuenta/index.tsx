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
  obtenerMiPosicionEnPrestador,
  obtenerMiCuentaRefugio,
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
import { contextoVentas } from '@/lib/cuenta-ventas';
import { MAPA_NATIVO_DISPONIBLE } from '@/lib/mapa-nativo';
import { vozOficio } from '@/lib/voz-oficio';
import { useGateGestor } from '@/lib/gate-gestor';
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
  /** S85-C39: el año de la cohorte, para la placa. `null` = la placa no se
   *  monta — el año sale del DATO y jamás se hornea. */
  cohorteAnio: number | null;
  /** ⭐ A7 · **QUÉ CLASE DE CASA ES**, cuando la casa es un refugio:
   *  «Organización» o «Rescatista independiente» (`N4`). Va en el subtítulo,
   *  al lado de la voz del oficio, porque es lo que ocupa ese lugar para un
   *  actor que no tiene oficio: *no es una ciudad y no se disfraza de una.*
   *  `null` en todos los demás. */
  vozRefugio: string | null;
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
  /* S86-C · el oficio vet, para «El movimiento». Ya se computaba acá
     (`vetActivo`) y se usaba solo para la voz y los hitos; ahora también
     GATEA — los presupuestos son clínicos, y esa condición viajó con la
     celda desde NEGOCIO. Cero query nueva. */
  vet: boolean;
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
  /* ⭐ S86-C · D-649 — BUSCAR ACTUALIZACIONES A MANO.
     LO QUE LO OBLIGA (D-650, medido por A): el GPS del paseo mantiene VIVO
     el proceso ⇒ nunca hay cold start ⇒ `expo-updates` nunca busca. Y el
     primer cold start SOLO descarga (aplica en el siguiente). Resultado:
     **un prestador que pasea puede quedarse indefinidamente sin
     actualizaciones**, y su única salida hoy es Ajustes de Android →
     Forzar detención, DOS VECES. Pasa en el uso NORMAL, no en un borde.
     ⚠️ `noSePudo` NO es `alDia`, y ésa es la mitad que importa (L-197): si
     la consulta falla, decir "estás al día" es afirmar sobre algo que no
     se pudo mirar — y acá esa mentira deja al prestador exactamente donde
     estaba, creyendo que no. El fallo degrada a AUSENCIA de respuesta. */
  /* S86-C · el gate de «El movimiento» (abajo): mismo predicado que gatea
     el tab NEGOCIO, de donde baja — cambio nulo de audiencia. */
  const { gate } = useGateGestor();
  const [upd, setUpd] = useState<
    'reposo' | 'buscando' | 'alDia' | 'descargando' | 'descargado' | 'noSePudo'
  >('reposo');

  async function buscarActualizacion() {
    setUpd('buscando');
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        setUpd('alDia');
        return;
      }
      setUpd('descargando');
      await Updates.fetchUpdateAsync();
      setUpd('descargado');
    } catch {
      /* Un solo catch para las DOS llamadas a propósito: al prestador le da
         igual cuál de las dos falló —no puede hacer nada distinto— y
         partirlo en dos voces sería precisión sin consecuencia. */
      setUpd('noSePudo');
    }
  }
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
  /** Vendedor SIN prestador: su histórico son pedidos, no citas (ver la
   *  bifurcación de la voz, abajo). Default `false` = la voz de siempre —
   *  una lectura que no volvió no cambia la voz de nadie. */
  const [soloPedidos, setSoloPedidos] = useState(false);
  const [fallo, setFallo] = useState<{ reintentable: boolean } | null>(null);
  /** ⭐ S88-C · titularidad para las celdas vitrina/cuenta-comercial —
   *  null = sin confirmar (las celdas no se ofrecen, Ley 23). */
  const [esTitular, setEsTitular] = useState<boolean | null>(null);
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
          /* 🔴 S99-C · EL CUARTO CUARTO HONESTO (caminata en aparato, 15-ago).
             `sin_prestador` NO es un fallo para el VENDEDOR PURO: su negocio
             es de productos y no tiene fila en `prestadores`. El techo decía
             «No pudimos cargar tu negocio» — un error donde hay un ESTADO, que
             es exactamente L-178 (un dato faltante jamás se disfraza de fallo).
             Es la misma cura que HOY, ATENDER y DATOS ya llevan; faltaba acá
             porque este techo se lee al final del recorrido y nadie lo caminó.
             El contexto de ventas está CACHEADO (lo cargó el HOY), así que el
             viaje es gratis en la práctica. Sin logo, sin ciudad, sin cohorte:
             la cuenta comercial no tiene esas cosas y no se inventan (L-139). */
          if (prestador.codigo === 'sin_prestador') {
            const ctx = await contextoVentas();
            if (!vigente) return;
            if (ctx.ok && ctx.data !== null && ctx.data.esVendedora) {
              /* ⭐ S99-D — VENDEDOR SIN PRESTADOR: su histórico lista PEDIDOS
                 y nada más, así que su entrada no puede hablar de citas. Se
                 marca ACÁ porque es el único punto donde las dos mitades del
                 discriminador ya están resueltas (`sin_prestador` **y**
                 `esVendedora`); preguntarlo otra vez abajo sería un viaje
                 nuevo para un dato que este `if` ya tiene en la mano. */
              setSoloPedidos(true);
              setFallo(null);
              setIdentidad({
                nombre: ctx.data.nombreComercial,
                ciudad: null,
                logoPath: null,
                cohorteAnio: null,
                vozRefugio: null,
              });
              return;
            }
          }
          /* ═══ A7 · EL REFUGIO LEÍA «NO PUDIMOS CARGAR TU NEGOCIO» ═══════

             🔴 **Es `L-178` otra vez, un actor después.** El refugio **no tiene
             fila en `prestadores`** —su casa es una cuenta comercial de tipo
             refugio—, así que `obtenerMiPrestador` devuelve `sin_prestador` y
             esta rama lo mandaba al fallo. *Un dato que no existe salía
             disfrazado de algo que no se pudo leer*, y el refugio abría su
             Cuenta y veía un error donde hay un ESTADO perfectamente sano.

             La cura es LITERALMENTE la de S99-C dos ramas más arriba —el
             vendedor puro tenía el mismo defecto, encontrado en la misma
             caminata—, y por eso va acá y no en otro lado: **éste es el único
             punto donde `sin_prestador` ya está resuelto** y preguntar de nuevo
             abajo sería un viaje para un dato que este `if` tiene en la mano.

             ⚠️ **Se pinta lo que el contrato trae y NADA MÁS.** `obtener_mi_
             cuenta_refugio` da nombre, tipo, estado y `puede_publicar`; **no da
             ciudad ni zona** —el founder las pidió y hoy viven en
             `v_prestadores_publicos`, que el refugio todavía no puebla porque
             `prestadores.tipo` no acepta `refugio` (medido por A)—. *Se declara
             en vez de inventarse* (`L-139`): sin ciudad, la línea no la dibuja.

             🔑 **`puedePublicar` NO se deriva de `estado` ni de `verificadoEn`**
             — los tres pueden divergir y el booleano es el que manda (aviso
             literal de A). Acá todavía no gatea nada; queda nombrado para la
             vitrina (A6). */
          if (prestador.codigo === 'sin_prestador') {
            const refugio = await obtenerMiCuentaRefugio();
            if (!vigente) return;
            if (refugio.ok && refugio.data !== null) {
              setSoloPedidos(false);
              setFallo(null);
              setIdentidad({
                nombre: refugio.data.nombreComercial ?? '',
                ciudad: null,
                logoPath: null,
                cohorteAnio: null,
                vozRefugio:
                  refugio.data.tipo === 'organizacion'
                    ? t('miCuenta.refugioOrganizacion')
                    : refugio.data.tipo === 'rescatista'
                      ? t('miCuenta.refugioRescatista')
                      : /* `null` es legal: un vínculo anterior a N4. **No se
                           adivina la clase de casa** — se omite la línea. */
                        null,
              });
              return;
            }
          }
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
          cohorteAnio: prestador.data.cohorte_anio,
          vozRefugio: null,
        });

        /* ⭐ S88-C (hallazgo del gate founder) · TITULARIDAD para las
           celdas de la vitrina y la cuenta comercial — el MISMO eje que
           el servidor (RLS por `user_id` + carpeta de storage; medido
           por A). Gatear por gestión dejaría pasar al admin y el server
           lo seguiría rebotando. null = sin confirmar ⇒ las celdas no
           se ofrecen (Ley 23: ante la duda, ausencia). */
        /* ⏪ S88-C (D-664, 5-ago-2026): acá vivió la derivación de la casa
           (titularId === miFila, dos RPCs) — reemplazada el MISMO día por
           el lector del servidor: la titularidad es un HECHO de
           `prestadores.user_id`, no una inferencia, y en UN viaje. */
        void obtenerMiPosicionEnPrestador(prestador.data.id).then((r) => {
          if (!vigente) return;
          setEsTitular(r.ok ? r.data.esTitular : null);
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
          vet: vetActivo,
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
    /* ⭐ S88-C (hallazgo del gate founder): LA VITRINA ES DEL TITULAR —
       se ofrecía al profesional y a recepción y el servidor rebota por
       TITULARIDAD (campo por campo: RLS + carpeta de storage). La ruta
       sigue montada: `perfil.tsx` responde con GateAjeno (§3). */
    ...(esTitular === true
      ? [{ etiqueta: t('miCuenta.perfil'), ruta: '/cuenta/perfil' as const, icono: 'cuenta' as const }]
      : []),
    /* ⭐ S87-C (LÁMINA §4.2) — LA CELDA SE GATEA, y el caso vale registrarlo
       porque NO fue "nadie sabía del gate": este archivo YA lo tenía en la
       mano (`useGateGestor` arriba, aplicado 40 líneas abajo a «El
       movimiento») y esta fila igual salía incondicional. Medido con dedo
       en S87: el profesional (`gestor=false`) llegaba a «Business details»
       —la identidad FISCAL del negocio— y hasta al wizard de alta, por una
       celda visible en la primera tarjeta de Cuenta. Cero deep link.
       ⚠️ ES CURA DE SUPERFICIE PURA, y la lámina lo dice con letra: el
       servidor ya está acotado (el CHECK ata la fila a `auth.uid()`), así
       que esto NO cura D-656 — cerrar la puerta que no debía estar abierta
       y dejar de quemar a quien la cruzó son dos cosas, y la segunda es
       contrato.
       `=== 'permitido'` y no `!== 'denegado'`: Ley 23, ante la duda se
       cierra — mismo predicado exacto que su vecina de abajo.
       ⏪ S88-C — EL PREDICADO CAMBIA DE GESTIÓN A TITULARIDAD: con el
       admin REAL (D-660, 5-ago-2026), `gate === 'permitido'` lo dejaba
       pasar y el servidor lo rebota igual (el CHECK ata la fila a
       `auth.uid()` — titularidad, medido por A en S87). La ley del lote
       de la vitrina rige acá también: mismo eje que el servidor. */
    ...(esTitular === true
      ? [{ etiqueta: t('miCuenta.negocio'), ruta: '/cuenta-comercial' as const, icono: 'negocio' as const }]
      : []),
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
                {(vozDelOficio !== null ||
                  identidad.vozRefugio !== null ||
                  identidad.ciudad !== null) && (
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: palette.light0 }}>
                    {[vozDelOficio, identidad.vozRefugio, identidad.ciudad]
                      .filter((x): x is string => x !== null)
                      .join(' · ')}
                  </Text>
                )}
                {/* LA PLACA: pill de vidrio con papel (informa = píldora,
                    Ley 21; el programa es D-398) — desde S81-C gana el
                    brillo §8.5, la firma física de §2.2 traducida al portal.

                    ⏪ S85-C39 · DECÍA «Prestador fundador» Y AHORA DICE EL
                    AÑO. Firma del founder: ahí la app **otorgaba un
                    reconocimiento** en vez de decir un hecho — el mismo acto
                    de habla que rechazó en el emblema. *«Desde 2026» dice lo
                    mismo sin condecorar a nadie.*
                    ⚠️ **EL AÑO SALE DEL DATO** (`cohorte_anio`), jamás
                    horneado: un 2026 escrito a mano sería el «15» otra vez
                    con otra ropa. **Sin año la placa NO SE MONTA** — regla de
                    existencia, igual que la insignia del techo. */}
                {identidad.cohorteAnio !== null && (
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
                    {t('miCuenta.desde', { anio: identidad.cohorteAnio })}
                  </Text>
                </View>
                )}
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

          {/* ⭐ S86-C · «EL MOVIMIENTO» BAJA DE NEGOCIO A CUENTA (firma de
              mesa): es PLATA DE LA CUENTA COMERCIAL, no configuración del
              oficio. Y NO SE PARTE — «Lo que te espera» en HOY sigue
              apuntando al mismo destino: *dos vistas, una fuente*. Esa
              entrada del HOY queda intacta a propósito.

              ⚠️ **DIVERGENCIA MEDIDA CON LA ORDEN, y se declara en vez de
              maquillarse:** la orden dice «a CUENTA, al lado de Cobros,
              con el gate de Cobros». **Cobros/Liquidaciones NO está en
              Cuenta** — su celda vive en NEGOCIO y empuja a `/liquidaciones`
              (raíz). Medido, no supuesto. ⇒ el movimiento llega SOLO, y
              «el gate de Cobros» se honra por su PREDICADO, que es el que
              gatea el tab NEGOCIO donde Cobros vive hoy: `useGateGestor`
              (`dueño|administrador`). Así ve exactamente la misma gente
              que lo veía ayer — cambio nulo de audiencia.
              Si la mesa quería a los dos juntos, falta mover Liquidaciones,
              y eso NO se hizo porque la misma orden dijo no moverla. */}
          {/* ⚠️ DOS gates, no uno — el segundo viajó con la celda y casi se
              pierde: en NEGOCIO estaba dentro de `serviciosVet.length > 0`.
              Los presupuestos son CLÍNICOS: sin oficio vet la pantalla
              destino no tiene nada que mostrar, y ofrecerla sería una
              puerta que no rechaza pero tampoco lleva (Ley 23). */}
          {gate === 'permitido' && (negocio?.vet ?? false) && (
            <Tarjeta relleno="ninguno" elevacion="reposo">
              <CeldaNavegacion
                icono="presupuesto"
                registro="aa"
                titulo={t('miCuenta.movimiento')}
                detalle={t('miCuenta.movimientoDetalle')}
                onPress={() => router.push('/veterinaria/movimiento')}
              />
            </Tarjeta>
          )}

          {/* S91-B (firma founder 8-ago-2026) · EL HISTÓRICO NAVEGABLE.
              Nace de un hallazgo de gate: la relectura de la receta estaba
              bien montada y era INALCANZABLE — el HOY lee `hoy-3..hoy+6` y
              no había NINGÚN otro camino a una cita más vieja.

              POR QUÉ ACÁ, y no se dedujo: la firma dijo «la sección Datos»,
              y el literal que define esa frontera vive en `negocio.tsx` —
              **«DATOS consulta · NEGOCIO configura»**, la razón por la que
              «El movimiento» se mudó a esta pantalla. Un histórico es
              consulta pura, así que queda de hermano suyo. *(Se midió
              primero la otra lectura posible: «Datos comerciales» es la
              pantalla FISCAL/BANCARIA del Perfil — un archivo de trabajo
              al lado de la cuenta bancaria habría chocado de contenido.)*

              SIN GATE DE OFICIO, a diferencia de su hermana: el histórico
              lee los CUATRO oficios y un paseador tiene tanto pasado como
              un vet. El gate que sí rige es el de los propios lectores
              (verdad firme + `prestador_id`), que no se re-implementa acá. */}
          <Tarjeta relleno="ninguno" elevacion="reposo">
            <CeldaNavegacion
              icono="mes"
              registro="aa"
              titulo={t('historico.entrada')}
              /* 🔴 LA VOZ SIGUE A LO QUE LA PANTALLA MUESTRA (hallazgo ② del
                 gate del founder). La entrada prometía «las atenciones y
                 citas que ya pasaron» **y para el vendedor lista pedidos**.
                 ⚠️ La cura NO toca la clave compartida: esa frase **es
                 verdad** para quien tiene citas, y curar una pantalla
                 rompiendo la voz correcta de otra no es curar — es mover el
                 defecto. Se bifurca por población, y la clave nueva
                 (`entradaDetalleVenta`) ya existía en los dos idiomas.
                 ⚠️ **EL DUAL QUEDA CON LA VOZ DE CITAS, y lo declaro en vez
                 de taparlo:** su histórico muestra las DOS naturalezas, así
                 que esta frase le dice MENOS de lo que va a encontrar — es el
                 mismo defecto en versión leve. **No invento una tercera voz
                 sin firma**; queda servido a la mesa con su caso. */
              detalle={t(soloPedidos ? 'historico.entradaDetalleVenta' : 'historico.entradaDetalle')}
              onPress={() => router.push('/historico')}
            />
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
          {/* ── ☠️ S112-C · LA ENTRADA A LA GALERÍA SE RETIRA TAMBIÉN ACÁ
              (firma del founder, 2-sep-2026 — A8, `L-478`): *«sacá "Láminas
              de gate · para firmar" del menú de Cuenta en las dos apps: la
              galería no es una puerta del producto.»*

              🔑 **Ésta es la firma que su propio texto pedía.** La fila decía,
              literal, que **no se retiraba por iniciativa de ninguna sesión** y
              que su retiro *«se DECIDE en el gate de producción — es una FIRMA,
              no una fecha del calendario»*. Llegó la firma; por eso se va, y
              por eso el aviso queda escrito: quien lea el historial no va a
              encontrar una sesión que se pasó por encima de esa cláusula.

              La hermana del cliente se había retirado en S107-C con la misma
              razón, y la nota de allá anunciaba que **ésta se conservaba hasta
              el gate**. Esa asimetría termina hoy: las dos casas quedan sin
              entrada.

              ⚠️ **La galería NO murió y sigue siendo obligatoria (`R17`).** Lo
              que se retira es el CAMINO desde Cuenta; `/gallery` sigue
              registrada y se alcanza por deep link con cable, igual que antes
              de que esta fila existiera.

              ⚠️ **`R18` no se toca desde acá.** Su corpus (`CUENTAS_GALERIA`)
              vive en `scripts/verify-diseno.mjs`, territorio de B, y su
              polaridad es que la entrada EXISTA — o sea que este retiro la deja
              en rojo hasta que B la angoste o la jubile. *Se declara en vez de
              editarla de contrabando: una regla que la casa cambia sin pedirlo
              deja de ser una regla.* Pedido a B en el buzón. ── */}

          {/* ── Sesión y cuenta (la sesión se MUDÓ desde Negocio) ── */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('sesion.titulo')}</Texto>
            <Boton variante="secundario" etiqueta={t('sesion.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            {/* S104-C · TANDA 3: dejó de ser voz sin motor. Navega al doble
                paso (dos caminos: cerrar mi cuenta con el motor de A, o cerrar
                el negocio con trámite asistido). */}
            <Boton variante="ghost" etiqueta={t('miCuenta.eliminarCuenta')} bloque onPress={() => router.push('/cuenta/cerrar')} />
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
            {/* 🔴 S111-A (firma founder) · DICE **`updateId`** Y NO `update`, y la
                palabra es toda la cura. El 1-sep el founder leyó `01a05e9d` y lo
                reportó como **group id**; era el `updateId` del group anterior.
                *Dos identificadores parecidos donde uno se lee como el otro
                costó una vuelta entera del gate* — `D-785` otra vez.

                ⚠️ **EL GROUP NO SE PUEDE MOSTRAR, y se declara para que nadie
                lo vuelva a intentar:** medido contra `expo-updates` — expone
                `updateId · channel · runtimeVersion · createdAt ·
                isEmbeddedLaunch · manifest` y **NADA MÁS**. El group id vive en
                EAS y **no viaja al cliente**. Nombrar bien el que sí está es lo
                único construible, y resuelve el caso real: quien lea esto ya no
                puede confundirlo con un group. ── */}
          <Texto variante="dato">
            {/* S89 orden 7: EL SELLO — id corto + canal + FECHA del update.
                Verificar un bundle = leer este código; ningún diagnóstico de
                OTA vuelve a empezar por «¿qué bundle corre?». */}
            {!Updates.isEmbeddedLaunch && Updates.updateId !== null
              ? `updateId ${Updates.updateId.slice(0, 8)} · ${Updates.channel ?? 'sin canal'}${
                  Updates.createdAt
                    ? ` · ${String(Updates.createdAt.getDate()).padStart(2, '0')}/${String(
                        Updates.createdAt.getMonth() + 1,
                      ).padStart(2, '0')} ${String(Updates.createdAt.getHours()).padStart(2, '0')}:${String(
                        Updates.createdAt.getMinutes(),
                      ).padStart(2, '0')}`
                    : ''
                }`
              /* 🔴 S106-A · LOS DOS CASOS SE SEPARAN — la cura de S103-C se
               * había aplicado SOLO AL CLIENTE y acá quedó el literal viejo.
               *
               * ⏪ Decía `'bundle embebido / dev'` para los DOS casos: el
               * bundle horneado en la APK **y** Metro sirviendo una rama
               * cualquiera. *El discriminador ya existía en la línea de
               * arriba (`isEmbeddedLaunch`) y el pie lo tiraba a la basura.*
               *
               * **Ya costó casi un veredicto falso una vez** (`L-336`): la
               * pista A tomó el aparato mientras C tenía Metro corriendo
               * desde su worktree, leyó `bundle embebido / dev` e iba a
               * reportar que su gate corría sobre el bundle de la APK.
               *
               * **Y lo destapó preparar el gate del cable de LiveKit**, que
               * se corre con dos teléfonos y una APK `development`: en el
               * prestador el founder habría leído la misma cadena en los dos
               * casos y no habría podido confirmar sobre qué corre.
               *
               * *La cura no era nueva: estaba escrita, firmada y aplicada a
               * medias. Media cura mirando a la otra.* */
              : Updates.isEmbeddedLaunch
                ? 'bundle embebido'
                : 'metro · dev'}
          </Texto>

          {/* 🔴 S106-A · LA MARCA DE LA BUILD DE PRUEBA (`D-944`), colgada de
              `MAPA_NATIVO_DISPONIBLE` **a propósito**.
              *Atarla a `isEmbeddedLaunch` la habría hecho desaparecer con el
              primer OTA* — seguiría al ARRANQUE y no al HECHO. Este flag sigue
              al hecho: es `false` exactamente cuando el APK salió sin la key, y
              sobrevive a cualquier update.
              ☠️ Muere sola: una build de la nube trae las dos cosas, el flag
              vuelve a `true` y esto deja de dibujarse. */}
          {!MAPA_NATIVO_DISPONIBLE ? (
            <Texto variante="dato">BUILD DE PRUEBA · sin mapas · sin push</Texto>
          ) : null}

          {/* ⭐ S86-C · D-649 — el botón vive PEGADO al marcador de arriba a
              propósito: el id que se lee ahí es exactamente lo que este
              botón cambia, y juntos contestan la pregunta entera («¿qué
              estoy corriendo?» / «¿hay algo más nuevo?»).

              ⚠️ REGLA DE EXISTENCIA (Ley 23 — la puerta no ofrece lo que va
              a rechazar): sin `Updates.isEnabled` —dev, Expo Go, web— la
              consulta SIEMPRE tira, así que el control NO EXISTE ahí. Un
              botón que solo sabe fallar es peor que ninguno.

              ⚠️ Y NO SE OFRECE «aplicar ahora» (`reloadAsync`), que sería
              lo obvio: recargar el bundle MATA la pantalla viva, y el caso
              que parió esta deuda es justamente el prestador PASEANDO con
              el GPS corriendo. La cura no puede tener como efecto perder la
              atención en curso. Por eso el estado final DICE lo que hay que
              hacer —se aplica al volver a abrir— en vez de hacerlo. */}
          {Updates.isEnabled && (
            <View style={{ gap: spacing[2], alignItems: 'flex-start' }}>
              <Boton
                variante="secundario"
                tamaño="sm"
                etiqueta={t('miCuenta.buscarUpdate')}
                cargando={upd === 'buscando' || upd === 'descargando'}
                onPress={() => void buscarActualizacion()}
              />
              {upd !== 'reposo' && (
                <Texto variante="apoyo">
                  {upd === 'buscando'
                    ? t('miCuenta.updBuscando')
                    : upd === 'alDia'
                      ? t('miCuenta.updAlDia')
                      : upd === 'descargando'
                        ? t('miCuenta.updDescargando')
                        : upd === 'descargado'
                          ? t('miCuenta.updDescargado')
                          : t('miCuenta.updNoSePudo')}
                </Texto>
              )}
            </View>
          )}
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

      {/* ☠️ S104-C · TANDA 3 — LA HOJA DE «VOZ HONESTA» MURIÓ (Ley 37). Era
          P17 §4: «va a estar acá». Ya está: la entrada navega a
          `/cuenta/cerrar`, el doble paso con los dos caminos del prestador. */}
      {/* el velo del muro — la barra de estado jamás queda blanca */}
      <VeloBarraEstadoOficio />
    </View>
  );
}
