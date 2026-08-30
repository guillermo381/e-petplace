/**
 * LA GUARDERÍA · EL LUGAR, VISTO POR LA FAMILIA (S107-C, tanda 4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO DEL DUEÑO (plan §6): *«Veo el lugar: … franjas … Elijo el
 * jueves; si está lleno, el día se ve lleno y me lo dice.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 LA SOBREVENTA NO LLEGA ACÁ, Y ES POR CONSTRUCCIÓN ────────────────
 * `obtenerCupoGuarderia` devuelve `sobrevendido`, y **esta pantalla no lo
 * pasa a ninguna parte**. Firma de la mesa: *el dueño ve lleno; la sobreventa
 * es problema operativo del prestador, no información suya.*
 *
 * ⚠️ Y el mecanismo es más fuerte que la disciplina: `EstadoCupo` de
 * `CalendarioCupo` es `'elegible' | 'sin_cupo'` — **la pieza no tiene canal
 * para expresar una sobreventa aunque alguien quisiera pasarla.** *Una
 * promesa de diseño que el código vuelve inexpresable no se puede olvidar en
 * la próxima pasada.*
 *
 * ── EL DÍA PASADO SE VE LLENO, Y ES LEY DE PUERTA ───────────────────────
 * El motor responde el cupo de cualquier fecha, incluidas las de ayer — no
 * sabe de «pasado», y hace bien: es un contador, no una agenda. La pantalla
 * **no ofrece lo que el servidor va a rechazar** (Ley 23, el principio de la
 * puerta): los días anteriores a hoy salen `sin_cupo` **con su propio
 * motivo**, jamás mezclados con «se llenó».
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
  CalendarioCupo,
  type DiaDeCupo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaFranja,
  MapaZona,
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
  obtenerCupoGuarderia,
  obtenerPerfilesPublicos,
  type PerfilPublico,
  obtenerFranjasGuarderia,
  comprarPaqueteGuarderia,
  reservarDiaDePaqueteGuarderia,
  reservarDiaGuarderia,
  type CupoDiaGuarderia,
  type EstadoCupoDia,
  type FranjaGuarderia,
  type RequisitosGuarderia,
} from '@epetplace/api';
import { obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { MAPA_NATIVO_DISPONIBLE } from '@/lib/mapa-nativo';
import { PieReserva } from '@/components/reserva-piezas';

/** 'HH:MM:SS' → 'HH:MM'. El motor manda la verdad; la pantalla la recorta. */
const aHoraCorta = (h: string) => h.slice(0, 5);

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
      cupo: CupoDiaGuarderia[];
      /** null = no vino mascota por la URL ⇒ no hay a quién evaluar. */
      requisitos: RequisitosGuarderia | null;
    };

export default function LugarGuarderia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{ precio?: string; modalidad?: string; tamano?: string; bonoId?: string }>();
  /** 🔴 CON BONO NO SE COMPRA: se agenda contra el saldo. **Cero cobro** — el
   *  desglose se congeló al comprar. */
  const bonoId = typeof params.bonoId === 'string' && params.bonoId.length > 0 ? params.bonoId : null;
  const esPaquete = params.modalidad === 'paquete' && bonoId === null;
  const tamano = Number(params.tamano ?? '');
  const { prestadorId, mascotaId, prestadorNombre } = useLocalSearchParams<{
    prestadorId: string;
    mascotaId?: string;
    prestadorNombre?: string;
  }>();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);
  /** 0 = este mes. Nunca baja de 0: el pasado no se reserva. */
  const [mesOffset, setMesOffset] = useState(0);
  const [elegido, setElegido] = useState<string | null>(null);
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
  const primeroDelMes = useMemo(
    () => new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1),
    [hoy, mesOffset],
  );
  const ultimoDelMes = useMemo(
    () => new Date(primeroDelMes.getFullYear(), primeroDelMes.getMonth() + 1, 0),
    [primeroDelMes],
  );

  useEffect(() => {
    if (typeof prestadorId !== 'string' || prestadorId.length === 0) {
      setEstado({ fase: 'roto' });
      return;
    }
    let vigente = true;
    setEstado({ fase: 'cargando' });
    void (async () => {
      const [franjas, cupo, req] = await Promise.all([
        obtenerFranjasGuarderia(prestadorId),
        obtenerCupoGuarderia(prestadorId, iso(primeroDelMes), iso(ultimoDelMes)),
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
      if (!franjas.ok || !cupo.ok || (req !== null && !req.ok)) {
        setEstado({ fase: 'roto' });
        return;
      }
      setEstado({
        fase: 'listo',
        franjas: franjas.data,
        cupo: cupo.data,
        requisitos: req === null ? null : req.data,
      });
    })();
    return () => {
      vigente = false;
    };
  }, [prestadorId, mascotaId, primeroDelMes, ultimoDelMes, intento]);

  const idioma = obtenerIdiomaActual();

  /* Cabeceras y nombre del mes por `Intl`, por idioma — el precedente de la
     Línea de Vida (S52): los meses no se cablean en un array en español. */
  const cabecerasDias = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(idioma, { weekday: 'narrow' });
    // Lunes primero: 2026-01-05 fue lunes.
    return [0, 1, 2, 3, 4, 5, 6].map((i) => fmt.format(new Date(2026, 0, 5 + i)).toUpperCase());
  }, [idioma]);

  const rotuloMes = useMemo(
    () => new Intl.DateTimeFormat(idioma, { month: 'long', year: 'numeric' }).format(primeroDelMes),
    [idioma, primeroDelMes],
  );

  /* El vocabulario del motor → la voz de la casa. Los cinco casos tienen su
     propia frase: mezclarlos en «no disponible» deja a la familia sin saber
     si esperar, volver mañana o buscar otro lugar. */
  const vozDelEstado = useCallback(
    (e: Exclude<EstadoCupoDia, 'elegible'>): string =>
      t(`lugarGuarderia.cupo_${e}` as 'lugarGuarderia.cupo_pasado'),
    [t],
  );

  const dias: DiaDeCupo[] = useMemo(() => {
    if (estado.fase !== 'listo') return [];
    const porFecha = new Map(estado.cupo.map((c) => [c.fecha, c]));
    const salida: DiaDeCupo[] = [];
    for (let d = 1; d <= ultimoDelMes.getDate(); d += 1) {
      const fecha = iso(new Date(primeroDelMes.getFullYear(), primeroDelMes.getMonth(), d));
      const c = porFecha.get(fecha);
      /* 🔴 EL MOTIVO LO RESUELVE EL SERVER Y LA PANTALLA LO PINTA — no lo
         deduce. Es la corrección de la mesa (29-ago) sobre lo que yo había
         inferido acá: **«no opera» se mide del PATRÓN del lugar, no del cupo**,
         y desde la pantalla los dos llegaban como `disponible = 0`. *Dos ceros
         distintos que sólo el motor puede separar.*
         La pieza sólo tiene `elegible | sin_cupo`, así que los cuatro «no» se
         distinguen por su MOTIVO — y eso importa: *«ya pasó», «hoy no», «no
         abren» y «se llenó» le piden a la familia cosas distintas.* */
      const st = c?.estado;
      if (st === 'elegible') {
        salida.push({ clave: fecha, numero: String(d), estado: 'elegible' });
        continue;
      }
      /* Sin fila para ese día, el día no es elegible y se dice sin inventar
         una causa: sólo el motor sabe por qué. */
      const motivo =
        st === undefined ? t('lugarGuarderia.cupo_sin_dato') : vozDelEstado(st);
      salida.push({ clave: fecha, numero: String(d), estado: 'sin_cupo', motivo });
    }
    return salida;
  }, [estado, primeroDelMes, ultimoDelMes, vozDelEstado, t]);

  /** Lunes = columna 0. `getDay()` da domingo=0, así que se corre. */
  const columnaInicial = (primeroDelMes.getDay() + 6) % 7;

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
      if (!r.ok) { setRebote(r.mensaje); setIntento((n) => n + 1); return; }
      /* El comprobante de una reserva SIN cobro es el del paseo, censado: **un
         aviso que nombra el saldo restante + Go home**, y el rastro es la fila
         del hub. *No hay pantalla de confirmación, y está bien.* */
      mostrar({ texto: t('lugarGuarderia.agendadaDePaquete', { n: r.data.saldoRestante }), variante: 'exito' });
      if (router.canDismiss()) router.dismissAll();
      router.navigate('/hogar/guarderia');
      return;
    }

    /* ═══ EL CAMINO DEL PAQUETE — DOS LLAMADAS, UN SOLO ACTO ═══════════════
       Firma del founder: **el toggle de la primera sesión va prendido y es
       obligatorio en la primera compra.** Por eso acá no hay interruptor: *un
       toggle que no se puede apagar es una casilla decorativa.*

       🔴 **COMPRAR NO ES RESERVAR — y por eso son dos llamadas.** El motor lo
       dice en su contrato: `comprarPaqueteGuarderia` crea SÓLO el bono (cero
       citas), y la primera sesión se agenda con la segunda. *Meterlas en una
       sola RPC habría atado el paquete a un día, y el paquete es del HOGAR.*

       ⚠️ **Y no hay checkout, medido:** el bono nace `estado_pago='pagado'` con
       `pago_simulado: true`. **La pantalla lo DICE** — *un cobro simulado que la
       superficie presenta como real es la clase de mentira que esta casa
       persigue.* */
    if (esPaquete) {
      const compra = await comprarPaqueteGuarderia({ prestadorId: prestadorId as string, tamano });
      if (!compra.ok) {
        setRebote(compra.mensaje);
        setReservando(false);
        return;
      }
      /* La mascota VIAJA acá aunque sea opcional: en la primera compra ya está
         decidida y mandarla evita el rebote `mascota_no_determinada` en el
         único momento del flujo donde la familia no lo entendería. */
      const primera = await reservarDiaDePaqueteGuarderia({
        bonoId: compra.data.bonoId,
        fecha: elegido,
        mascotaId,
      });
      setReservando(false);
      if (!primera.ok) {
        /* 🔴 EL BONO YA EXISTE. *Decir sólo «no se pudo» sobre una compra que SÍ
           ocurrió dejaría a la familia creyendo que perdió la plata.* */
        setRebote(t('lugarGuarderia.paqueteSinPrimera', { mensaje: primera.mensaje }));
        return;
      }
      mostrar({
        texto: t('lugarGuarderia.paqueteListo', { n: primera.data.saldoRestante }),
        variante: 'exito',
      });
      if (router.canDismiss()) router.dismissAll();
      router.navigate('/hogar/guarderia');
      return;
    }

    const r = await reservarDiaGuarderia({ prestadorId: prestadorId as string, mascotaId, fecha: elegido });
    setReservando(false);
    if (!r.ok) {
      /* El rebote llega con SU voz desde el wrapper —«ese día ya no tiene
         lugar», «faltan requisitos»— y se muestra tal cual. Y se recarga: si
         el cupo cambió mientras miraba, el calendario tiene que decirlo. */
      setRebote(r.mensaje);
      setIntento((n) => n + 1);
      /* ⭐ S107-C · **EL ÚNICO REBOTE QUE TIENE ADÓNDE IR.**
         `documentos_sin_aceptar` no es un error: es **el paso anterior**, y
         toda familia nueva lo recibe. *Nombrarlo fue la mitad de la cura —A lo
         tipó y dejó de salir como «error inesperado»—; la otra mitad es que
         lleve a donde se resuelve.*
         🔴 **Los otros rebotes NO navegan a propósito:** `sin_cupo` y
         `requisitos_sanitarios` se arreglan en esta misma pantalla o en el
         carnet, y `documentos_no_disponibles` **no se arregla del lado de la
         familia** — mandarla a una pantalla que va a decirle lo mismo sería
         pasearla. */
      if (r.codigo === 'documentos_sin_aceptar') {
        router.push('/guarderia/documentos');
      }
      return;
    }
    router.push({
      pathname: '/explorar/guarderia/checkout',
      params: {
        citaId: r.data.citaId,
        expiraEn: r.data.expiraEn,
        precio: String(r.data.precio),
        prestadorNombre: typeof prestadorNombre === 'string' ? prestadorNombre : '',
        fecha: elegido,
      },
    });
  }, [elegido, mascotaId, prestadorId, prestadorNombre, reservando, router, esPaquete, tamano, mostrar, t, bonoId]);

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
      <Encabezado variante="navegacion" titulo={t('lugarGuarderia.titulo')} atras onAtras={alAtras} />

      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: spacing[6], paddingBottom: insets.bottom + spacing[8] }}
      >
        {/* LAS DOS VENTANAS — la misma pieza que el prestador configura. */}
        {recogida !== undefined ? (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="titulo">{t('lugarGuarderia.franjasTitulo')}</Texto>
            <FichaFranja
              recogida={{
                rotulo: t('lugarGuarderia.recogida'),
                desde: aHoraCorta(recogida.desde),
                hasta: aHoraCorta(recogida.hasta),
              }}
              devolucion={
                devolucion === undefined
                  ? undefined
                  : {
                      rotulo: t('lugarGuarderia.devolucion'),
                      desde: aHoraCorta(devolucion.desde),
                      hasta: aHoraCorta(devolucion.hasta),
                    }
              }
              conSuperficie
            />
          </View>
        ) : null}

        {/* EL CALENDARIO */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="titulo">{t('lugarGuarderia.elegiDia')}</Texto>
          <CalendarioCupo
            dias={dias}
            columnaInicial={columnaInicial}
            cabecerasDias={cabecerasDias}
            elegido={elegido}
            onElegir={setElegido}
            rotulo={rotuloMes}
          />
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            {/* El mes anterior sólo si no es pasado: la puerta no ofrece lo
                que va a rechazar. */}
            {mesOffset > 0 ? (
              <Boton
                variante="secundario"
                etiqueta={t('lugarGuarderia.mesAnterior')}
                onPress={() => {
                  setElegido(null);
                  setMesOffset((m) => m - 1);
                }}
              />
            ) : null}
            <Boton
              variante="secundario"
              etiqueta={t('lugarGuarderia.mesSiguiente')}
              onPress={() => {
                setElegido(null);
                setMesOffset((m) => m + 1);
              }}
            />
          </View>
        </View>

        {/* ── EL SEMÁFORO SANITARIO ──
            🔴 NACE CERRADO. La compuerta vive en el SERVER
            (`_guarderia_puede_reservar`) y esta pantalla la REFLEJA — no la
            reimplementa y no la ablanda. *Un gate que la pantalla decide es
            decorativo: se salta cambiando de cliente.*
            La firma ③ es dura: sin carnet cargado y rabia vigente no se
            reserva. **Y los pocos animales con carnet hoy no son razón para
            abrirlo: son el catálogo vacío, y cada familia lo llena en su
            primera reserva.** */}
        {/* LA ZONA. 🔴 **El guard del mapa nativo se aplica NO PASANDO las
            tres** —igual que el perfil del cliente—: la pieza no monta nada si
            falta cualquiera, así que **cero cambio en el componente
            compartido**. *Un secret faltante cuesta EL MAPA, jamás la app.* */}
        {MAPA_NATIVO_DISPONIBLE &&
        perfil !== null &&
        perfil.zona_lat !== null &&
        perfil.zona_lon !== null &&
        perfil.zona_radio_m !== null ? (
          <View style={{ gap: spacing[2] }}>
            <Texto variante="titulo">{t('lugarGuarderia.zonaTitulo')}</Texto>
            <MapaZona lat={perfil.zona_lat} lon={perfil.zona_lon} radioM={perfil.zona_radio_m} />
            <Texto variante="apoyo">{t('lugarGuarderia.zonaDetalle')}</Texto>
          </View>
        ) : null}

        {estado.requisitos !== null ? (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="titulo">{t('lugarGuarderia.requisitosTitulo')}</Texto>
            {/* ⭐ LA SUPERFICIE BLANCA LA PONE EL CONSUMIDOR — firma del
                founder: *«fondo blanco y un chevron a la derecha, o sea la
                anatomía de una FILA»*. **El chevron ya lo dibuja la pieza** (el
                defecto era que su path salía como texto, curado por B); lo que
                faltaba era el fondo, y `SemaforoSanitario` **no expone
                superficie** — como `FichaFranja`, la decide quien la monta.
                *Sin ella las filas flotan sobre el papel y se leen como texto
                suelto, que es exactamente lo que el founder reportó.*

                ⏪ **`relleno="ninguno"` Y NO EL DEFAULT — el founder lo vio
                «muy ancho, la caja mal dimensionada», y estaba MEDIDO:**

                  | | acá con `<Tarjeta>` | la fila equivalente de la casa |
                  |---|---|---|
                  | relleno de la carta | 12 | **0** (`ninguno`) |
                  | alto con detalle | 12+68+12 = **~92** | **~60** |

                *53 % más alta que `CeldaNavegacion` dentro de su carta, para
                la misma información.* **El criterio ya estaba escrito en la
                casa** (`pedidos/pedido/[pedidoId]`): *«`relleno="ninguno"`
                porque adentro van `Celda` a sangre con sus `Separador`»* — y
                acá adentro van filas, que es el mismo caso. El canon es
                `parte/[eventoId]`: carta sin relleno con UNA fila adentro.

                ⏪ **ANDAMIO YA RETIRADO — ver la lápida de abajo.** Decía: la
                `Fila` de `SemaforoSanitario` nace con `paddingVertical` y
                **sin horizontal**, así que a sangre el texto tocaría el borde.
                Se lo pongo yo para no dejar la cura a medias — pero el número
                es de la PIEZA (`CeldaNavegacion` lo lleva adentro), y va en
                pedido a B. **B lo movió y el `View` se retiró.** */}
            <Tarjeta relleno="ninguno">
            {/* ☠️ ACÁ VIVÍA UN `View` con `paddingHorizontal: spacing[3]` — el
                ANDAMIO que C declaró mientras la `Fila` de `SemaforoSanitario`
                nacía sin padding horizontal. **B movió el número a la pieza
                (S107-B), así que el andamio se retira en la misma tanda**
                (Ley 37, y era la condición que este comentario tenía escrita).
                🔴 **Y se retira ACÁ y no después a propósito:** con el padding
                puesto en los dos lados la fila quedaría con 24 — *un andamio
                que sobrevive un rato a su obra no es neutro: dobla el número
                que vino a arreglar.* */}
              <SemaforoSanitario
                requisitos={estado.requisitos.faltantes.length === 0
                  ? [{
                      clave: 'todo',
                      etiqueta: t('lugarGuarderia.requisitosAlDia'),
                      estado: 'al_dia',
                    }]
                  : estado.requisitos.faltantes.map((f): RequisitoSanitario => ({
                      clave: f.codigo,
                      etiqueta: f.nombre,
                      estado: 'falta',
                      /* El estado del motor se traduce a VOZ acá — el server
                         manda códigos, la voz es de la casa (contrato §⑥bis). */
                      detalle: t(`lugarGuarderia.estado_${f.estado}` as 'lugarGuarderia.estado_sin_carnet'),
                      /* 🔴 El tipo de la pieza hace INEXPRESABLE un faltante sin
                         camino: `falta` no compila sin `onResolver`. */
                      onResolver: () => router.push('/carnet'),
                      etiquetaResolver: t('lugarGuarderia.cargarCarnet'),
                    }))}
              />
            </Tarjeta>
          </View>
        ) : null}

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
        etiqueta={
          bonoId !== null
            ? t('lugarGuarderia.agendarDePaquete')
            : esPaquete
              ? t('lugarGuarderia.comprarPaquete', { n: tamano })
              : t('lugarGuarderia.reservar')
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
