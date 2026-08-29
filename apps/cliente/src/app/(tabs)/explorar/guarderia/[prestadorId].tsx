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
  SemaforoSanitario,
  type RequisitoSanitario,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  evaluarRequisitosGuarderia,
  obtenerCupoGuarderia,
  obtenerFranjasGuarderia,
  reservarDiaGuarderia,
  type CupoDiaGuarderia,
  type EstadoCupoDia,
  type FranjaGuarderia,
  type RequisitosGuarderia,
} from '@epetplace/api';
import { obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

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
  }, [elegido, mascotaId, prestadorId, prestadorNombre, reservando, router]);

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
        {estado.requisitos !== null ? (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="titulo">{t('lugarGuarderia.requisitosTitulo')}</Texto>
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
          </View>
        ) : null}

        {/* ── RESERVAR ── */}
        <View style={{ gap: spacing[2] }}>
          {rebote !== null ? <Texto variante="cuerpo">{rebote}</Texto> : null}
          <Boton
            etiqueta={t('lugarGuarderia.reservar')}
            bloque
            cargando={reservando}
            /* 🔴 EL GATE REFLEJA AL SERVER, NO LO DECIDE — y ahora la perilla
               viaja DENTRO de la evaluación (`bloquea`), así que **es la misma
               pantalla en los dos modos**: no hay rama nueva, hay un dato más
               en la condición.
               *Y el mismo `bloquea` lo lee `reservar_dia_guarderia`, así que
               esta puerta nunca se abre para chocar contra otra.* */
            deshabilitado={
              elegido === null ||
              estado.requisitos === null ||
              (estado.requisitos.bloquea && !estado.requisitos.alDia)
            }
            onPress={() => void reservar()}
          />
          {/* 🔴 EL MISMO FALTANTE, DOS TONOS — y la diferencia es de trato, no
              de información: **con el bloqueo encendido frena** y hay que
              decirlo; **apagado, se dice sin frenar y sin drama.** *Le falta
              algo y lo puede resolver: no está haciendo nada malo, y una voz
              de alarma sobre algo que no impide nada enseña a ignorar las
              alarmas que sí importan.* El camino a cargarlo sigue a un toque
              en los dos modos — la pieza no compila un faltante sin camino. */}
          {estado.requisitos !== null && !estado.requisitos.alDia ? (
            <Texto variante="apoyo">
              {estado.requisitos.bloquea
                ? t('lugarGuarderia.bloqueadoPorRequisitos')
                : t('lugarGuarderia.faltaSinFrenar')}
            </Texto>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
