/**
 * LA GUARDERÍA · EL LUGAR, VISTO POR LA FAMILIA (S107-C, tanda 4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO DEL DUEÑO (plan §6): *«Veo el lugar: … franjas … Elijo el
 * jueves; si está lleno, el día se ve lleno y me lo dice.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 LA SOBREVENTA NO LLEGA ACÁ, Y ES POR CONSTRUCCIÓN ────────────────
 * ☠️ **ACÁ VIVÍA EL CALENDARIO Y SE BORRÓ ENTERO** (30-ago, instrucción del
 * founder). Con él se fueron `CalendarioCupo`, la lectura mensual de cupo, la
 * navegación de meses y la voz de sus cinco estados. *El día llega elegido
 * desde la pantalla 2; esta pantalla muestra al prestador y deja pagar.*
 *
 * ── LO QUE ESTA PANTALLA TODAVÍA NO HACE ────────────────────────────────
 * 🔴 **No muestra precio ni reserva, porque no existe la oferta.** Medido:
 * no hay `guarderia-oferta`; ningún wrapper escribe `prestador_servicios`
 * para este oficio. *Un botón de reservar que no reserva es peor que su
 * ausencia* — la pantalla lo dice y no lo dibuja.
 *
 * ── ⚠️ INERTE, DECLARADO: TODAVÍA NADIE NAVEGA ACÁ ──────────────────────
 * `explorar` lista guardería en **«próximamente»**, y eso **es cierto hoy**:
 * sin oferta no hay guarderías que reservar, y sin flag propio en
 * `country_config` (hoy comparte el de `hotel`) no hay condición honesta que
 * la encienda. **Las dos mitades son de A.** Cuando la oferta exista, esta
 * pantalla se enchufa con **una línea** en `explorar` — el molde S91: la
 * mitad propia construida e inerte, con su pedido al lado.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaFranja,
  FichaPrestador,
  SemaforoSanitario,
  type RequisitoSanitario,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  evaluarRequisitosGuarderia,
  obtenerPerfilesPublicos,
  resolverUrlLogoNegocio,
  type PerfilPublico,
  obtenerFranjasGuarderia,
  reservarDiaDePaqueteGuarderia,
  contratarMensualidadGuarderia,
  reservarDiaGuarderia,
  type FranjaGuarderia,
  type RequisitosGuarderia,
} from '@epetplace/api';
import { obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { MAPA_NATIVO_DISPONIBLE } from '@/lib/mapa-nativo';
import { PieReserva } from '@/components/reserva-piezas';
import { FlechaVolver } from '@/components/flecha-volver';
import { urlGaleria } from '@/lib/url-galeria';

/** 'HH:MM:SS' → 'HH:MM'. El motor manda la verdad; la pantalla la recorta. */
const aHoraCorta = (h: string) => h.slice(0, 5);

/**
 * 'YYYY-MM-DD' → la fecha en voz humana, en el idioma vivo.
 * 🔴 Se parte a mano y se arma con `Date(a, m-1, d)`: `new Date('2026-08-31')`
 * lo interpreta como **UTC** y en Guayaquil muestra el día anterior.
 */
/** «8 de septiembre» — sin año ni día de la semana: va dentro de un botón. */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString(obtenerIdiomaActual(), {
    day: 'numeric', month: 'long',
  });
}

function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString(obtenerIdiomaActual(), {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

/** Fecha LOCAL 'YYYY-MM-DD'. 🔴 Jamás `toISOString()`: eso da UTC y en
 *  Guayaquil, después de las 19:00, devuelve el día siguiente. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'roto' }
  | {
      fase: 'listo';
      franjas: FranjaGuarderia[];
      /** null = no vino mascota por la URL ⇒ no hay a quién evaluar. */
      requisitos: RequisitosGuarderia | null;
    };

export default function LugarGuarderia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{ precio?: string; modalidad?: string; tamano?: string; bonoId?: string; fecha?: string; mascotaNombre?: string }>();
  /**
   * ⭐ **EL DÍA YA SE ELIGIÓ DOS PANTALLAS ANTES, Y VIAJABA SIN QUE NADIE LO
   * LEYERA.** Etapa 1 lo manda (`fecha`), la vitrina lo reenvía con su
   * `...params`, y acá la pantalla montaba **otro calendario y lo volvía a
   * pedir** — el mismo dato, dos veces, y la segunda con la libertad de
   * contradecir a la primera.
   *
   * 🔴 **Firma del founder (30-ago):** *«Esa pantalla tiene que mostrar al
   * prestador y dejar pagar — nada más.»*
   *
   * ⚠️ **Y el camino corto —agendar contra saldo— entraba acá SIN día.** Con
   * el calendario borrado ya no tiene dónde elegirlo, así que **su destino
   * cambia**: va a la tira de días de esa guardería (pantalla 2 con su bono),
   * que es lo que la letra firmada pide. *La consecuencia se declara acá
   * porque quien borre una pieza tiene que decir a quién dejó sin ella.*
   */
  const fechaDeParams =
    typeof params.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.fecha) ? params.fecha : null;
  /** 🔴 CON BONO NO SE COMPRA: se agenda contra el saldo. **Cero cobro** — el
   *  desglose se congeló al comprar. */
  const bonoId = typeof params.bonoId === 'string' && params.bonoId.length > 0 ? params.bonoId : null;
  const esPaquete = params.modalidad === 'paquete' && bonoId === null;
  /**
   * ⭐ **LA MENSUALIDAD, VIVA** — A publicó `contratarMensualidadGuarderia`.
   * ☠️ Muere la rama inerte que decía «todavía no podemos cobrar».
   *
   * 🔴 **Y lo que se firma NO es un cobro: es el MANDATO.** El wrapper
   * devuelve `cobrada: false` **siempre** — el cobro lo hace el reloj cuando
   * el founder encienda sus claves. *La pantalla lo DICE: presentar como
   * cobrado algo que no se cobró es la clase de mentira que esta casa
   * persigue.*
   */
  const esMensual = params.modalidad === 'mensual' && bonoId === null;

  /* ☠️ **EL PAGO SE FUE DE ACÁ — firma del founder.** Esta pantalla montaba
     «Cómo quieres pagar» con la tarjeta y el botón **y no dejaba pagar**.
     *El medio de pago, los términos y el botón «Pagar» viven en el CHECKOUT,
     exactamente como en grooming («Confirmar y pagar»).* Acá el CTA sólo
     NAVEGA. Con él se fueron `useMedioDePago` y `SeccionMedioDePago`. */
  const tamano = Number(params.tamano ?? '');
  const { prestadorId, mascotaId, prestadorNombre } = useLocalSearchParams<{
    prestadorId: string;
    mascotaId?: string;
    prestadorNombre?: string;
  }>();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);
  /* 🔴 YA NO ES ESTADO: es el día que trajo el recorrido, y nada acá lo
     cambia. *Un `useState` que nadie escribe es una puerta que sugiere que
     alguna vez se va a poder abrir.* */
  const elegido = fechaDeParams;
  const [reservando, setReservando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);

  /* ⭐ **EL MAPA DE LA ZONA — la misma pieza de todas las vitrinas de la casa.**
     Censado, no construido: `MapaZona`, alimentada por `obtenerPerfilesPublicos`,
     que **lee la vista pública y jamás la tabla**.

     🔴 **Es RANGO DE SECTOR, jamás el punto exacto.** La propia pieza lo
     declara: *«si alguien le pasa `lat`/`lon` de la sede, es defecto, no
     configuración»*. *Aunque el servicio recoja y lleve, toda familia quiere
     saber dónde está su animal* — firma del founder, que corrigió mi voto.

     ⚠️ Hace falta una llamada aparte porque **`GuarderiaDisponible` NO trae
     `zona_*`**: su lector es la RPC del filtro, no la vista pública. */
  useEffect(() => {
    if (typeof prestadorId !== 'string') return;
    let vigente = true;
    void obtenerPerfilesPublicos([prestadorId]).then((r) => {
      if (vigente && r.ok) setPerfil(r.data[0] ?? null);
    });
    return () => { vigente = false; };
  }, [prestadorId]);

  const hoy = useMemo(() => new Date(), []);


  useEffect(() => {
    if (typeof prestadorId !== 'string' || prestadorId.length === 0) {
      setEstado({ fase: 'roto' });
      return;
    }
    let vigente = true;
    setEstado({ fase: 'cargando' });
    void (async () => {
      const [franjas, req] = await Promise.all([
        obtenerFranjasGuarderia(prestadorId),
        typeof mascotaId === 'string' && mascotaId.length > 0
          ? evaluarRequisitosGuarderia(mascotaId)
          : Promise.resolve(null),
      ]);
      if (!vigente) return;
      /* Un fallo de lectura JAMÁS se disfraza de «no hay lugares» (Ley 13):
         un mes que se pinta lleno porque el servidor no contestó le miente a
         la familia con la cara de un dato. */
      /* 🔴 El semáforo entra al guard: si no se pudo evaluar, la pantalla NO
         sigue. *Un gate sanitario que falla en silencio deja pasar por
         omisión* — y acá el animal viaja y convive con otros. */
      if (!franjas.ok || (req !== null && !req.ok)) {
        setEstado({ fase: 'roto' });
        return;
      }
      setEstado({
        fase: 'listo',
        franjas: franjas.data,
        requisitos: req === null ? null : req.data,
      });
    })();
    return () => {
      vigente = false;
    };
  }, [prestadorId, mascotaId, intento]);

  const idioma = obtenerIdiomaActual();

  /* Cabeceras y nombre del mes por `Intl`, por idioma — el precedente de la
     Línea de Vida (S52): los meses no se cablean en un array en español. */


  /* El vocabulario del motor → la voz de la casa. Los cinco casos tienen su
     propia frase: mezclarlos en «no disponible» deja a la familia sin saber
     si esperar, volver mañana o buscar otro lugar. */


  /** El precio viaja desde la lista: la familia ve lo que va a pagar **antes**
   *  de tocar. `null` = no llegó, y entonces el pie no monta bloque de precio
   *  — *jamás un número inventado.* */
  const precioTexto =
    bonoId !== null
      ? /* 🔴 SIN PRECIO: **no hay cobro en este paso.** *Pintar un número acá
           sugeriría que se paga otra vez lo que ya se pagó al comprar.* */
        null
      : typeof params.precio === 'string' && params.precio.length > 0
        ? params.precio
        : null;
  /* 🔴 Se estrecha por FASE antes de mirar `requisitos`: mientras carga no hay
     nada que decidir, y el pie sólo existe con la pantalla lista. */
  const req = estado.fase === 'listo' ? estado.requisitos : null;
  const puedeReservar =
    elegido !== null && req !== null && !(req.bloquea && !req.alDia);

  const alAtras = useCallback(() => router.back(), [router]);

  /**
   * Reservar UN día. La reserva nace `pendiente_pago` con hold de 15 minutos y
   * el desglose se congela solo — así que acá NO se declara nada: se navega al
   * checkout compartido, que espera la verdad del servidor.
   * 🔴 **`confirmada` sólo cuando el motor confirma** (`LETRA_PAGO_CITAS` §3).
   */
  /**
   * 🔴 **EL REBOTE QUE TIENE CAMINO, EN TODAS LAS RAMAS.**
   *
   * ⏪ Esto vivía **en una sola de las cuatro** —el día suelto—. Las otras tres
   * (agendar contra saldo, comprar paquete, su primera sesión) hacían
   * `setRebote` y paraban: *«hay que aceptar los términos» y ni esa pantalla
   * ni las anteriores tenían cómo hacerlo.* **La familia quedaba trabada sin
   * camino** — y con la compuerta que A puso en la compra, ésa es justo la
   * rama por la que se entra a comprar un paquete.
   *
   * *Nombrar el rebote fue la mitad de la cura; la otra mitad es que lleve a
   * donde se resuelve.* Ahora es UNA función y las cuatro la usan: **una rama
   * nueva que se olvide de rutear tendría que olvidarse de llamar a ésta.**
   */
  const rebotar = useCallback(
    (codigo: string, mensaje: string) => {
      setRebote(mensaje);
      if (codigo === 'documentos_sin_aceptar') router.push('/guarderia/documentos');
    },
    [router],
  );

  const reservar = useCallback(async () => {
    if (elegido === null || typeof mascotaId !== 'string' || reservando) return;
    setReservando(true);
    setRebote(null);
    /* ═══ AGENDAR CONTRA SALDO — ni compra ni cobro ═══════════════════════
       🔴 **La mascota VIAJA siempre**: con más de una elegible el motor rebota
       `mascota_no_determinada` **en vez de adivinar**, y acá ya está decidida
       desde el hub. *El bono es del hogar; a cuál animal se le agenda el martes
       lo elige la familia cada vez.* */
    if (bonoId !== null) {
      const r = await reservarDiaDePaqueteGuarderia({ bonoId, fecha: elegido, mascotaId });
      setReservando(false);
      if (!r.ok) { rebotar(r.codigo, r.mensaje); setIntento((n) => n + 1); return; }
      /* El comprobante de una reserva SIN cobro es el del paseo, censado: **un
         aviso que nombra el saldo restante + Go home**, y el rastro es la fila
         del hub. *No hay pantalla de confirmación, y está bien.* */
      mostrar({ texto: t('lugarGuarderia.agendadaDePaquete', { n: r.data.saldoRestante }), variante: 'exito' });
      if (router.canDismiss()) router.dismissAll();
      router.navigate('/hogar/guarderia');
      return;
    }

    /* ☠️ **ACÁ VIVÍA LA COMPRA DEL PAQUETE Y SOBREVIVIÓ A SU RÍO.** Cuando
       el pago se mudó al checkout agregué la rama que navega **y dejé ésta
       viva encima**: como corre primero, la nueva era inalcanzable y el CTA
       seguía comprando desde P4.
       *No lo vio ningún typecheck —las dos ramas son válidas— ni el lint: lo
       vio la red, mostrando `comprar_paquete_guarderia` disparando desde una
       pantalla que ya no debía cobrar.* **Ley 37: lo viejo muere en el mismo
       acto, y esta vez no murió.** */

    /* ═══ LOS TRES NAVEGAN · **P4 NO COBRA NI RESERVA** ══════════════════
       Firma del founder: *«la pantalla 4 termina en un CTA … y ese botón
       NAVEGA al checkout»*.

       ⏪ **El día SÍ creaba su hold acá**, y eso lo dejaba fuera de la firma
       nueva de la dirección: `reservar_dia_guarderia` **congela la dirección
       al crear la cita**, así que elegirla después no habría cambiado nada.
       *Un selector que el servidor ya no puede escuchar es un control que no
       decide.* ⇒ **el hold se mudó al checkout**, que es donde la familia
       elige a dónde pasan a buscarlo. Con eso los tres caminos eligen
       dirección en el mismo lugar y P4 queda siendo lo que la firma pide:
       vitrina y un CTA. */
    setReservando(false);
    router.push({
      pathname: '/explorar/guarderia/checkout',
      params: {
        modalidad: esMensual ? 'mensual' : esPaquete ? 'paquete' : 'dia',
        prestadorId: prestadorId as string,
        prestadorNombre: typeof prestadorNombre === 'string' ? prestadorNombre : '',
        mascotaId,
        /* 🔴 El NOMBRE viaja: el consentimiento de imagen de la confirmación
           **nombra a la mascota**, porque la imagen es suya. Sin él ese check
           no se monta — *un consentimiento que no puede nombrar a quién
           protege es un consentimiento sobre nadie.* */
        ...(typeof params.mascotaNombre === 'string' ? { mascotaNombre: params.mascotaNombre } : {}),
        fecha: elegido,
        ...(esPaquete ? { tamano: String(tamano) } : {}),
        ...(typeof params.precio === 'string' ? { precio: params.precio } : {}),
      },
    });
    return;
  }, [elegido, mascotaId, prestadorId, prestadorNombre, reservando, router, esPaquete, esMensual, tamano, params.precio]);

  /* ☠️ Con la mudanza del hold murieron acá `reservarDiaGuarderia`, el
     `rebotar` con su ruteo a documentos y el `setIntento` de recarga: **todo
     eso vive ahora en el checkout**, que es quien reserva. */

  if (estado.fase === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('lugarGuarderia.titulo')} atras onAtras={alAtras} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={64} />
            <Esqueleto alto={220} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (estado.fase === 'roto') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('lugarGuarderia.titulo')} atras onAtras={alAtras} />
        <EstadoVacio
          registro="pantalla"
          titulo={t('lugarGuarderia.noCargoTitulo')}
          descripcion={t('lugarGuarderia.noCargoDetalle')}
          accion={
            <Boton
              etiqueta={t('lugarGuarderia.reintentar')}
              onPress={() => setIntento((n) => n + 1)}
            />
          }
        />
      </View>
    );
  }

  const recogida = estado.franjas.find((f) => f.tipo === 'recogida');
  const devolucion = estado.franjas.find((f) => f.tipo === 'devolucion');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* ☠️ S109-D · ACÁ VIVÍA UN `Encabezado variante="navegacion"`, Y ERA LA
          FRANJA. El founder lo vio como familia: *«la vitrina de guardería no
          pinta la imagen hasta el techo como los demás oficios»*.

          🔴 **LA CAUSA ES UNA CONTRADICCIÓN QUE LA PROPIA PANTALLA DECLARABA:**
          montaba `FichaPrestador` con **`aSangre`** —que le pide a la pieza
          sangrar BAJO la barra de estado, y por eso ella suma `insets.top` al
          alto de la portada y baja lo que flota encima— **y encima le apilaba
          una barra de navegación**. La foto sangraba, sí: bajo un encabezado
          opaco que empezaba donde terminaba la barra. *`aSangre` y una barra
          fija arriba son mutuamente excluyentes por construcción; pedir las
          dos no falla, deja la franja.*

          MEDIDO CONTRA LA VITRINA QUE SÍ LO HACE (`prestador/[prestadorId]`,
          la de paseo, grooming y vet): tiene **cero** `Encabezado` —el volver
          es la `FlechaVolver` flotando sobre la portada, que esta pantalla YA
          pasaba en `sobrePortada`—, mismo `ScrollView`, mismo
          `paddingBottom`. *La diferencia no era safe area ni padding de
          contenedor: era un header propio, y de los tres candidatos era el
          único que dejaba rastro en el árbol.*

          ⚠️ Los otros dos `Encabezado` de este archivo —carga y error— SE
          QUEDAN: ahí no hay vitrina que sangrar, y una pantalla de error sin
          forma de volver es un callejón. */}

      {/* ══════════════════════════════════════════════════════════════════
          LA VITRINA · **`FichaPrestador`, la MISMA que grooming**
          ══════════════════════════════════════════════════════════════════
          ⏪ **ESTO ERAN BLOQUES APILADOS, NO UNA VITRINA.** Arrancaba con
          «Cuándo pasan y cuándo lo traen» sobre fondo blanco, metía una foto
          suelta en el medio y el bloque de pago quedaba a mitad de pantalla.

          🔴 **Censado antes de tocar** (orden del founder, y esta sesión ya
          pagó tres veces por no ir a leer): grooming **no tiene pantalla
          propia** — usa `prestador/[prestadorId]`, que monta `FichaPrestador`.
          Su anatomía, de arriba a abajo: **galería a sangre desde el techo con
          sus puntos · el logo montado sobre el borde · el nombre con su
          distintivo · la ubicación · el mapa · y al final el CTA.**

          ⚠️ **Guardería conserva ruta propia** —y no se manda al perfil
          genérico— porque **necesita sus parámetros** (fecha, modalidad,
          tamaño, bono): el perfil genérico no los tiene y su barra por oficio
          no existe para guardería. *Lo que se copia es la ANATOMÍA, que era el
          pedido; la ruta es de esta reserva.*

          Lo propio del oficio —las dos ventanas, el día y los requisitos— va
          en el **`pie` de la ficha**: DESPUÉS del nombre y la ubicación, que
          es donde el founder lo puso. ── */}
      {/* ☠️ **ACÁ FALTABA EL `ScrollView` Y LA PANTALLA NO SCROLLEABA.**
          Al reemplazar los bloques apilados por la vitrina me llevé puesto el
          contenedor de scroll: `FichaPrestador` quedó montada directo.

          🔴 **Y la sospecha razonable era otra** —el pie capturando el gesto,
          la trampa de `R54` que ya me cazó una vez—. *No era: no había nada
          que scrollear.* Medido antes de asumir: cero `ScrollView` alrededor
          de la ficha.

          ⚠️ **El `paddingBottom` no es estilo: es la cura del defecto clásico
          de toda barra fija** — sin él la barra TAPA el último bloque. El
          número sale del perfil genérico, que ya lo resolvió. */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
      <FichaPrestador
        aSangre
        vozNombre="bloque"
        sobrePortada={<FlechaVolver onPress={alAtras} etiqueta={t('perfilPrestador.volver')} />}
        nombre={perfil?.nombre_comercial ?? null}
        cohorte={perfil?.cohorte ?? null}
        cohorteAnio={perfil?.cohorte_anio ?? null}
        logoUrl={resolverUrlLogoNegocio(perfil?.foto_url ?? null)}
        portadas={(perfil?.portadas ?? []).map(urlGaleria).filter((u): u is string => u !== null)}
        clipUri={urlGaleria(perfil?.clip_url ?? null)}
        /* 🔴 EL GUARD DEL MAPA NATIVO, copiado del perfil genérico: sin la
           meta-data `geo.API_KEY` en el APK, montar el MapView **mata la app
           en hilo nativo** y ninguna ErrorBoundary lo atrapa. El guard se
           aplica NO PASANDO las tres — cero cambio en la pieza compartida.
           *Un secret faltante cuesta EL MAPA, jamás la app.* */
        zonaLat={MAPA_NATIVO_DISPONIBLE ? (perfil?.zona_lat ?? null) : null}
        zonaLon={MAPA_NATIVO_DISPONIBLE ? (perfil?.zona_lon ?? null) : null}
        zonaRadioM={MAPA_NATIVO_DISPONIBLE ? (perfil?.zona_radio_m ?? null) : null}
        ciudad={perfil?.ciudad ?? null}
        historia={perfil?.descripcion ?? null}
        pie={
          <View style={{ gap: spacing[5], paddingBottom: spacing[8] }}>
            {/* LAS DOS VENTANAS DE ESE DÍA */}
            {recogida !== undefined && devolucion !== undefined ? (
              <View style={{ gap: spacing[3] }}>
                <Texto variante="titulo">{t('lugarGuarderia.franjasTitulo')}</Texto>
                <FichaFranja
                  recogida={{ rotulo: t('lugarGuarderia.recogida'), desde: aHoraCorta(recogida.desde), hasta: aHoraCorta(recogida.hasta) }}
                  devolucion={{ rotulo: t('lugarGuarderia.devolucion'), desde: aHoraCorta(devolucion.desde), hasta: aHoraCorta(devolucion.hasta) }}
                  conSuperficie
                />
              </View>
            ) : null}

            {/* EL DÍA — se afirma, no se pregunta: se eligió dos pantallas antes. */}
            <View style={{ gap: spacing[1] }}>
              <Texto variante="seccion">{t('lugarGuarderia.elDia')}</Texto>
              <Texto variante="cuerpo">
                {fechaDeParams === null ? t('lugarGuarderia.faltaDia') : fechaLarga(fechaDeParams)}
              </Texto>
            </View>

            {/* LOS REQUISITOS */}
            {req !== null ? (
              <View style={{ gap: spacing[3] }}>
                <Texto variante="titulo">{t('lugarGuarderia.requisitosTitulo')}</Texto>
                <Tarjeta relleno="ninguno">
                  <View style={{ paddingHorizontal: spacing[3] }}>
                    <SemaforoSanitario
                      requisitos={req.faltantes.length === 0
                        ? [{ clave: 'todo', etiqueta: t('lugarGuarderia.requisitosAlDia'), estado: 'al_dia' }]
                        : req.faltantes.map((fa): RequisitoSanitario => ({
                            clave: fa.codigo,
                            etiqueta: fa.nombre,
                            estado: 'falta',
                            detalle: t(`lugarGuarderia.estado_${fa.estado}` as 'lugarGuarderia.estado_sin_carnet'),
                            onResolver: () => router.push('/carnet'),
                            etiquetaResolver: t('lugarGuarderia.cargarCarnet'),
                          }))}
                    />
                  </View>
                </Tarjeta>
              </View>
            ) : null}
          </View>
        }
      />

      </ScrollView>

      {/* ── RESERVAR — ⏪ **ESTABA AL FINAL DEL SCROLL Y NO SE VEÍA.**
             Medido con sesión real el 29-ago: el CTA caía en **y=1007 sobre una
             pantalla de 932** ⇒ *había que scrollear para descubrir que se
             podía reservar*, y el founder lo leyó como «el botón no está
             montado». **Sus cuatro hermanas usan `PieReserva`**, que es fijo al
             borde inferior; ésta era la única que no.
             *No era un defecto de estilo: una acción que hay que buscar es una
             acción que no existe para quien no la busca.* ── */}
      <View style={{ paddingHorizontal: spacing[5] }}>
        {rebote !== null ? <Texto variante="cuerpo">{rebote}</Texto> : null}
      </View>
      {estado.fase === 'listo' ? (
      <PieReserva
        total={precioTexto}
        /* ⭐ **EL BOTÓN LLEVA LA FECHA ADENTRO** — firma del founder (30-ago):
           *«Reservar el 8 de septiembre» · «Comprar 5 estadías y agendar el 8
           de septiembre» · «Contratar plan mensual desde el 8 de
           septiembre»*.

           *El día se eligió dos pantallas antes; nombrarlo en el botón es lo
           que deja confirmar sin volver a mirar.* Y en la mensualidad la
           preposición cambia —**desde**— porque ahí el día no es lo que se
           compra: es donde empieza a correr. */
        etiqueta={
          fechaDeParams === null
            ? t('lugarGuarderia.faltaDia')
            : bonoId !== null
              ? t('lugarGuarderia.agendarDia', { dia: fechaCorta(fechaDeParams) })
              : esPaquete
                ? t('lugarGuarderia.comprarPaqueteAqui', { n: tamano })
                : esMensual
                  ? t('lugarGuarderia.contratarMensualAqui')
                  : t('lugarGuarderia.comprarDiaAqui')
        }
        habilitado={puedeReservar}
        insetBottom={insets.bottom}
        /* 🔴 Y ESTABA APAGADO SIN DECIR POR QUÉ — `aria-disabled=true` y ni una
           palabra. *Una pared muda le hace creer a la familia que el producto
           está roto, cuando lo único que falta es que toque un día.* */
        razonDeshabilitado={
          elegido === null
              ? t('lugarGuarderia.faltaDia')
              : t('lugarGuarderia.faltaRequisitos')
        }
        onPress={() => void reservar()}
      />
      ) : null}

    </View>
  );
}
