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
  obtenerPerfilesPublicos,
  type PerfilPublico,
  obtenerFranjasGuarderia,
  comprarPaqueteGuarderia,
  reservarDiaDePaqueteGuarderia,
  reservarDiaGuarderia,
  type FranjaGuarderia,
  type RequisitosGuarderia,
} from '@epetplace/api';
import { obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { MAPA_NATIVO_DISPONIBLE } from '@/lib/mapa-nativo';
import { PieReserva } from '@/components/reserva-piezas';

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
  const params = useLocalSearchParams<{ precio?: string; modalidad?: string; tamano?: string; bonoId?: string; fecha?: string }>();
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
   * 🔴 **LA MENSUALIDAD LLEGA HASTA ACÁ Y NO MÁS, Y LA PANTALLA LO DICE.**
   * El motor está entero (`contratar_mensualidad_guarderia` existe y el filtro
   * acepta `'mensual'`) pero **no hay wrapper de contratación**
   * (`S107-C-PEDIDO-A-A-WRAPPER-MENSUALIDAD.md`).
   *
   * *No se monta un cobro contra un motor que esta app no puede llamar*: el
   * botón queda apagado **diciendo por qué** (Ley 23), en vez de simular un
   * acto que no ocurre. **Esta rama muere entera cuando el wrapper llegue.**
   */
  const esMensual = params.modalidad === 'mensual' && bonoId === null;
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

        {/* ── EL DÍA · SE AFIRMA, NO SE PREGUNTA ─────────────────────────
               ☠️ **ACÁ VIVÍA UN CALENDARIO Y SE BORRÓ ENTERO** — instrucción
               directa del founder (30-ago): *«El calendario de la pantalla del
               prestador se elimina. No se adapta ni se reusa: se borra.»*

               El día se elige en la pantalla 2 y viaja hasta acá. Montar un
               calendario en el paso 4 lo volvía el primer paso de una reserva
               que ya iba por el cuarto — *y le daba a la familia la libertad de
               contradecir lo que ya había elegido.*

               Con él se fueron `CalendarioCupo`, la lectura de cupo del mes,
               la navegación de meses y los tipos que arrastraba (Ley 37: lo
               viejo muere en el mismo acto).

               ⚠️ **Y esto le quita su selector al CAMINO CORTO** —agendar
               contra saldo entraba acá sin día—. Su destino cambia a la tira
               de días de esa guardería, que es lo que la letra firmada pide. ── */}
        <View style={{ gap: spacing[1] }}>
          <Texto variante="seccion">{t('lugarGuarderia.elDia')}</Texto>
          <Texto variante="cuerpo">
            {fechaDeParams === null ? t('lugarGuarderia.faltaDia') : fechaLarga(fechaDeParams)}
          </Texto>
        </View>

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

                🔴 **EL `paddingHorizontal` DE ACÁ ES ANDAMIO, NO DISEÑO.** La
                `Fila` de `SemaforoSanitario` nace con `paddingVertical` y
                **sin horizontal**, así que a sangre el texto tocaría el borde.
                Se lo pongo yo para no dejar la cura a medias — pero el número
                es de la PIEZA (`CeldaNavegacion` lo lleva adentro), y va en
                pedido a B. **Cuando B lo mueva, este `View` se retira** (Ley
                37): un andamio que sobrevive a su obra es el próximo defecto. */}
            <Tarjeta relleno="ninguno">
            <View style={{ paddingHorizontal: spacing[3] }}>
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
                ? t('lugarGuarderia.comprarPaqueteDia', { n: tamano, dia: fechaCorta(fechaDeParams) })
                : esMensual
                  ? t('lugarGuarderia.contratarMensualDesde', { dia: fechaCorta(fechaDeParams) })
                  : t('lugarGuarderia.reservarDia', { dia: fechaCorta(fechaDeParams) })
        }
        habilitado={puedeReservar && !esMensual}
        insetBottom={insets.bottom}
        /* 🔴 Y ESTABA APAGADO SIN DECIR POR QUÉ — `aria-disabled=true` y ni una
           palabra. *Una pared muda le hace creer a la familia que el producto
           está roto, cuando lo único que falta es que toque un día.* */
        razonDeshabilitado={
          esMensual
            ? t('lugarGuarderia.mensualNoCobrable')
            : elegido === null
              ? t('lugarGuarderia.faltaDia')
              : t('lugarGuarderia.faltaRequisitos')
        }
        onPress={() => void reservar()}
      />
      ) : null}

    </View>
  );
}
