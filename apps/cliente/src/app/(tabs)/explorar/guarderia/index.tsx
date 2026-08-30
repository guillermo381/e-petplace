/**
 * GUARDERÍA · **ELEGIR CÓMO Y CUÁNDO** — la pantalla que decide todo antes de
 * ver un solo lugar (S107-C, reestructura firmada 29-ago).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA SECUENCIA, firmada por el founder:
 *   ① modalidad → ② lo que ESA modalidad necesita → ③ el día
 *   → ④ el valor y si hay quién → ⑤ «Ver quién puede», que es UN BOTÓN
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⏪ **QUÉ ESTABA MAL ANTES, y es de secuencia, no de estilo:** esta pantalla
 * **mostraba la lista de lugares antes de que la familia hubiera elegido nada**.
 * *Una lista que aparece antes de la pregunta obliga a leerla dos veces: una
 * para entender qué es, otra cuando ya significa algo.* La lista se fue a
 * `disponibles`, que es su pantalla.
 *
 * ── 🔴 NADA SE MUESTRA HASTA QUE HAYA ELECCIÓN ───────────────────────────
 * Sin modalidad no hay día; sin día no hay valor ni botón. **Cada paso aparece
 * cuando el anterior se contestó** — *la revelación progresiva no es adorno:
 * es que una pantalla no puede preguntar cinco cosas a la vez sin que la
 * familia adivine cuál importa primero.*
 *
 * ── LOS REQUISITOS SON INFORMATIVOS, Y ESO ES UNA FIRMA ──────────────────
 * Viven **debajo del selector de fecha en los tres caminos** y **no habilitan
 * ni deshabilitan nada** mientras el gate esté apagado (`requisitos.bloquea`,
 * hoy `false` — `D-968`). *Lo único que gobierna el botón es que existan
 * prestadores para (modalidad, día, radio, especie).*
 *
 * ── 🔴 LEY 23: LA CAUSA SE VE SIN TOCAR EL BOTÓN ─────────────────────────
 * Cuando no hay ninguno, **el mensaje está a la vista** — no detrás de un
 * `razonDeshabilitado` que exige apretar una puerta cerrada para saber por qué
 * lo está.
 *
 * ✅ **EL MENSAJE VA ENCIMA DEL BOTÓN — FIRMADO ASÍ (founder, 29-ago-2026).**
 *
 * El dictado original decía *«debajo del botón»*. El botón vive en
 * `PieReserva`, que es **fijo al borde inferior**: **debajo de él no hay lugar
 * donde algo pueda vivir**. Queda **inmediatamente encima**, y la mesa lo firmó
 * con su razón: *cumple lo que la firma perseguía —**visible sin tocarlo**— y
 * no vale romper el pie fijo por la letra.*
 *
 * 🔴 **Se escribe acá, y no sólo en un parte, para que nadie lo lea como un
 * desvío pendiente de curar.** *Una divergencia firmada que vive únicamente en
 * el reporte de quien la propuso vuelve como «defecto» en el próximo gate, y el
 * que la encuentre no va a tener con qué defenderla.*
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Esqueleto,
  EsqueletoGrupo,
  SelectorDia,
  SelectorOpcion,
  SelectorSegmentado,
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
  obtenerDiasGuarderiaDisponibles,
  type DiaGuarderiaAgregado,
  obtenerGuarderiasDisponibles,
  obtenerPaquetesGuarderia,
  obtenerResumenGuarderias,
  reservarDiaDePaqueteGuarderia,
  type CausaSinGuarderias,
  type RequisitosGuarderia,
} from '@epetplace/api';
import { obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { CabezalOficio, PieReserva } from '@/components/reserva-piezas';
import {
  MODALIDADES_ABIERTAS,
  TAMANOS_PAQUETE,
  type ModalidadGuarderia,
  type TamanoPaqueteGuarderia,
} from '@/lib/guarderia-modalidad';

/** Fecha LOCAL. 🔴 Jamás `toISOString()`: en Guayaquil, después de las 19:00,
 *  devuelve el día siguiente. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * ✅ **EL RESUMEN DE A YA EXISTE** (`obtenerResumenGuarderias`) — *«una sola
 * consulta devuelve las tres cosas: el precio más bajo, si hay lugares, y la
 * causa si no hay»*.
 *
 * ── 🔴 LAS CUATRO CONDICIONES QUE A DEJÓ ESCRITAS, Y CÓMO SE HONRAN ──────
 *
 * ① **`cuantos > 0 ⟺ causa === null`. Nunca vienen los dos.** ⇒ acá **no se
 *    escribe lógica para el caso imposible**: se pregunta por la causa y basta.
 *    *Un `if` que contempla un estado que el motor no puede producir es código
 *    que nadie va a poder probar y que igual hay que leer para siempre.*
 *
 * ② **`precioDesde` es `null`, jamás `0`.** Si es `null`, **no se pinta nada** —
 *    *un cero se leería como GRATIS.*
 *
 * ③ 🔴 **LA VÍSPERA NO ES UNA CAUSA.** Con `fecha <= hoy` el lector **lanza
 *    `fecha_no_ofertable`**, y se trata **aparte del botón apagado**:
 *    *ofrecerle «prueba con otro día» a quien pidió HOY sería mandarlo a
 *    cambiar lo que estaba bien.* Se le explica **la regla** —se reserva con un
 *    día de anticipación—, que es lo que de verdad no sabía. El `SelectorDia`
 *    ya no ofrece hoy; esto es **el cinturón del server**.
 *
 * ④ **`sin_cobertura` sólo puede venir si se manda `lat`/`lon`.** Esta pantalla
 *    **no manda ubicación todavía**, así que esa etapa no descarta a nadie y
 *    **esa causa no puede aparecer**. Su voz está mapeada para el día que la
 *    ubicación viaje, y **se declara que hoy es inalcanzable** — *escribirla
 *    como si pudiera salir haría creer que ya cubrimos un caso que ni siquiera
 *    se evalúa.*
 */
type Resumen =
  | { fase: 'ocioso' }
  | { fase: 'cargando' }
  /**
   * 🔴 **DOS ERRORES DISTINTOS, Y CONFUNDIRLOS ESCONDE LA RAZÓN.**
   *
   * `noPudimos` es la voz de Ley 13 —*«no es que no haya: no pudimos
   * preguntar»*—, correcta cuando algo se cayó. **`causa` es un DIAGNÓSTICO
   * del motor que ahora tiene voz propia** (A tipó 17 códigos el 29-ago).
   *
   * *Antes los dos caían en el mismo estado, así que `mascota_no_elegible`
   * —«la guardería es solo para perros y gatos»— salía como «no pudimos
   * preguntar»: **una afirmación falsa que además tapaba la verdadera.***
   */
  | { fase: 'noPudimos' }
  | { fase: 'causaDelMotor'; mensaje: string }
  /** ③ — su propio estado, no una causa. */
  | { fase: 'vispera' }
  | { fase: 'listo'; cuantos: number; precioDesde: number | null; causa: CausaSinGuarderias | null };

export default function ElegirGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const idioma = obtenerIdiomaActual();
  const params = useLocalSearchParams<{ mascotaId?: string; mascotaNombre?: string; bonoId?: string; prestadorId?: string }>();

  /**
   * ⭐ **EL CAMINO CORTO — agendar contra saldo.** Entra desde el hub con su
   * bono y su guardería ya determinados: *«va directo a la tira de días DE ESA
   * GUARDERÍA: sin elegir lugar y sin pagar»* (letra firmada).
   *
   * ⏪ Antes entraba a la pantalla del prestador y elegía el día en su
   * calendario. **Ese calendario se borró**, así que el día se elige acá —
   * donde la casa elige días— y esta pantalla **se recorta a la tira**: sin
   * modalidad (ya la decidió el bono), sin tamaño (ya está comprado) y sin
   * «ver quién puede» (el lugar lo determina el bono).
   */
  /**
   * ⭐ **LA TIRA DICE SU ESTADO SIN QUE LA TOQUEN** (`obtenerDiasGuarderiaDisponibles`).
   *
   * ⏪ Antes los 14 días se veían **iguales** y `cerrados` recibía un
   * `new Set()`: la familia tocaba un sábado, el botón quedaba apagado y
   * **recién ahí** aparecía la causa. *Medido tocándolos uno por uno: dos de
   * los siete primeros no llevaban a ningún lado y no se distinguían de los
   * cinco que sí.* **Es el candidato serio a por qué el founder nunca pudo
   * reservar.**
   *
   * 🔴 **Un fallo de lectura NO se disfraza de «todos abiertos»** (Ley 13): si
   * el server no contestó, la tira queda tocable y el rebote del botón sigue
   * siendo la red — *lo que no se hace es pintar catorce días verdes sobre una
   * pregunta que nadie respondió.* Se declara en `diasLeidos`.
   */
  const [diasEstado, setDiasEstado] = useState<DiaGuarderiaAgregado[] | null>(null);
  const [agendando, setAgendando] = useState(false);
  const [reboteSaldo, setReboteSaldo] = useState<string | null>(null);
  const bonoId = typeof params.bonoId === 'string' && params.bonoId.length > 0 ? params.bonoId : null;

  const mascotaId = typeof params.mascotaId === 'string' && params.mascotaId.length > 0
    ? params.mascotaId
    : null;

  /* ⏪ **LA MODALIDAD ARRANCA EN «DÍA» — enmienda firmada del founder (29-ago).**
     La versión anterior nacía SIN elegir *«para que nada aparezca antes de que
     la familia decida»*. **El efecto real, visto en el aparato: con dos
     modalidades la pantalla aterrizaba VACÍA** — un cabezal, dos chips y nada
     más.

     > *La revelación progresiva servía cuando el primer paso era el día. Con la
     > modalidad adelante, esperar a que elijan lo más común convierte el paso
     > cero en una pantalla en blanco.*

     🔴 **Y la firma NO se aflojó, se acotó:** «día» es **la más común y la única
     que hoy se cobra sola** — *no es un default oscuro: es el camino que la
     familia iba a tomar igual.* **Nada más viene elegido**: el día, el precio y
     el botón **siguen apareciendo a medida que avanza**, que es lo que la
     revelación progresiva protegía de verdad. */
  const [modalidad, setModalidad] = useState<ModalidadGuarderia | null>('dia');
  const [tamano, setTamano] = useState<TamanoPaqueteGuarderia | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [requisitos, setRequisitos] = useState<RequisitosGuarderia | null>(null);
  const [resumen, setResumen] = useState<Resumen>({ fase: 'ocioso' });
  /**
   * ⭐ **EL PRECIO DE CADA TAMAÑO — el mínimo entre los lugares que ofrecen ESE
   * paquete.** `{}` = todavía no se sabe.
   *
   * ⏪ **Acá estuvo mi peor cura de la sesión.** El resumen devuelve
   * `min(gp.precio)` **sobre todos los tamaños**, así que los tres chips
   * mostraban el precio del de 5. **Mi arreglo fue dejar de pintar ninguno** —
   * *cambié el síntoma y empeoré la pantalla*, y **no lo verifiqué contra el
   * render**, que es exactamente por lo que no me di cuenta.
   *
   * 🔴 **El dato SÍ existía y no lo busqué:** `obtenerPaquetesGuarderia`
   * devuelve `(tamano, precio)` por lugar. *No hacía falta esperar a A para
   * decir la verdad: hacía falta buscar dónde vivía.*
   */
  const [precioPorTamano, setPrecioPorTamano] = useState<Record<number, number>>({});

  /* Los requisitos son de la MASCOTA, no del día: se piden una vez. */
  useEffect(() => {
    if (mascotaId === null) return;
    let vigente = true;
    void (async () => {
      const r = await evaluarRequisitosGuarderia(mascotaId);
      if (vigente && r.ok) setRequisitos(r.data);
    })();
    return () => { vigente = false; };
  }, [mascotaId]);

  /* ⏪ **EL ORDEN SE INVIRTIÓ — enmienda firmada del founder (29-ago), sobre
     una medición mía.** Antes el tamaño iba ANTES de la fecha, y eso dejaba
     **el primer toque a ciegas**: los precios por tamaño salen de los lugares
     que operan ESE día, así que sin fecha no hay precio que mostrar.

     > *La firma original ponía los chips antes porque se asumía que el precio
     > no dependía del día. Depende — de los lugares que abren.*

     ⇒ **la fecha va primero y los chips de tamaño después**, ya con su precio.
     El día siempre se puede preguntar; **lo que espera ahora es el tamaño.** */
  const listoParaDia = modalidad !== null;
  /** El botón sí exige tamaño en paquete: **se compra un tamaño, no «un paquete».** */
  const listoParaSeguir = modalidad !== null && (modalidad !== 'paquete' || tamano !== null);

  useEffect(() => {
    if (!listoParaDia || fecha === null || mascotaId === null) {
      setResumen({ fase: 'ocioso' });
      return;
    }
    let vigente = true;
    setResumen({ fase: 'cargando' });
    void (async () => {
      const r = await obtenerResumenGuarderias({ modalidad, fecha, mascotaId });
      if (!vigente) return;
      if (!r.ok) {
        /* ③ LA VÍSPERA SE APARTA ACÁ, antes que cualquier otra cosa.
           ☠️ **EL `String(...)` MURIÓ EL 29-AGO:** A tipó el código —y otros 16
           que tampoco estaban—. *Declarar que el código existía y no estaba en
           la unión es lo que lo hizo aparecer; un `catch` genérico lo habría
           escondido para siempre.* */
        /* Los códigos que describen el MUNDO llevan su voz; los que describen
           una caída, la de Ley 13. *La lista es corta a propósito: sólo entran
           los que una familia puede provocar y entender.* */
        setResumen(
          r.codigo === 'fecha_no_ofertable'
            ? { fase: 'vispera' }
            : r.codigo === 'mascota_no_elegible' || r.codigo === 'no_access_to_mascota'
              ? { fase: 'causaDelMotor', mensaje: r.mensaje }
              : { fase: 'noPudimos' },
        );
        return;
      }
      setResumen({
        fase: 'listo',
        cuantos: r.data.cuantos,
        precioDesde: r.data.precioDesde,
        causa: r.data.causa,
      });
    })();
    return () => { vigente = false; };
    /* ⏪ `tamano` FALTABA EN LAS DEPS: cambiar de chip no volvía a preguntar.
       *Era la mitad del defecto — la otra mitad es que el server no sabe el
       tamaño (ver abajo), así que ni preguntando de nuevo cambiaría.* */
  }, [listoParaDia, fecha, mascotaId, modalidad, tamano]);

  /* Los precios por tamaño: una llamada por lugar, en paralelo, y **la
     pantalla no espera** — los chips se completan cuando llegan.
     ⚠️ Es un N+1 declarado: con los lugares de hoy es barato. *El día que sean
     muchos, el pedido a A (`p_tamano` en el resumen) lo cierra de una.* */
  useEffect(() => {
    if (modalidad !== 'paquete' || fecha === null || mascotaId === null) {
      setPrecioPorTamano({});
      return;
    }
    let vigente = true;
    void (async () => {
      const lug = await obtenerGuarderiasDisponibles({ fecha, mascotaId, modalidad: 'paquete' });
      if (!vigente || !lug.ok) return;
      const packs = await Promise.all(
        [...new Set(lug.data.map((g) => g.prestadorId))].map((id) => obtenerPaquetesGuarderia(id)),
      );
      if (!vigente) return;
      const min: Record<number, number> = {};
      for (const r of packs) {
        if (!r.ok) continue;
        for (const pq of r.data) {
          if (!pq.activo) continue;
          /* 🔴 El MÍNIMO entre lugares, que es un «desde» honesto — **jamás el
             de otro tamaño**, que era el defecto. */
          if (min[pq.tamano] === undefined || pq.precio < min[pq.tamano]) min[pq.tamano] = pq.precio;
        }
      }
      setPrecioPorTamano(min);
    })();
    return () => { vigente = false; };
  }, [modalidad, fecha, mascotaId]);

  const dias = useMemo(() => {
    const corto = new Intl.DateTimeFormat(idioma, { weekday: 'short' });
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + 1 + i);
      return { iso: iso(d), dia: corto.format(d).replace('.', '').toLowerCase(), numero: String(d.getDate()) };
    });
  }, [idioma]);

  /* La ventana que la tira ofrece: mañana + 13. Se deriva de `dias` para que
     el rango leído y el rango pintado no puedan divergir. */
  useEffect(() => {
    if (mascotaId === null || dias.length === 0) return;
    let vigente = true;
    void (async () => {
      const r = await obtenerDiasGuarderiaDisponibles({
        mascotaId,
        desde: dias[0].iso,
        hasta: dias[dias.length - 1].iso,
        modalidad: modalidad ?? 'dia',
      });
      if (!vigente) return;
      /* 🔴 `null` = **no sé**, y NO «todos abiertos». La tira queda tocable y
         el rebote del botón sigue siendo la red. */
      setDiasEstado(r.ok ? r.data : null);
    })();
    return () => { vigente = false; };
  }, [mascotaId, dias, modalidad]);

  /** Los días que NO llevan a ningún lado. Vacío mientras no se leyó. */
  const cerrados = useMemo(
    () => new Set((diasEstado ?? []).filter((d) => !d.reservable).map((d) => d.fecha)),
    [diasEstado],
  );

  /**
   * 🔴 **LA VOZ DEL DÍA CERRADO — y acá hay una brecha DECLARADA.**
   * `SelectorDia` toma **una sola** `etiquetaCerrado` para todos los días, y
   * sólo la usa en el `accessibilityLabel`. *«Ningún lugar abre» y «están todos
   * llenos» son dos verdades distintas —ante la primera se elige otro día,
   * ante la segunda se puede esperar— y con una sola cadena no se pueden
   * decir las dos.*
   *
   * Lo que se hace mientras tanto, sin inventar: **si todos los días cerrados
   * comparten motivo, se dice ESE motivo, que es exacto**; si conviven los
   * dos, se dice el neutro. ⇒ `S107-C-PEDIDO-A-B-VOZ-POR-DIA.md`.
   */
  const etiquetaCerrado = useMemo(() => {
    const motivos = new Set((diasEstado ?? []).filter((d) => !d.reservable).map((d) => d.motivo));
    if (motivos.size === 1) {
      const m = [...motivos][0];
      if (m === 'ningun_lugar_abre') return t('elegirGuarderia.diaNadieAbre');
      if (m === 'sin_cupo') return t('elegirGuarderia.diaSinCupo');
      if (m === 'mascota_ya_reservada_ese_dia') return t('elegirGuarderia.diaYaReservado');
    }
    return t('hubGuarderia.diaCerrado');
  }, [diasEstado, t]);

  const vozCausa = useCallback(
    (c: CausaSinGuarderias): string =>
      t(
        c === 'sin_cupo_ese_dia' ? 'elegirGuarderia.causaSinCupo'
        /* ⭐ A la tipó como causa propia (29-ago). 🔴 **Su voz NO lleva «prueba
           con otro día» pegado**: el día no es el problema — lo que la familia
           no sabía es CUÁNDO sí abren. *Mandarla a mover el dedo sería
           esconderle el dato que le falta.* */
        : c === 'no_opera_ese_dia' ? 'elegirGuarderia.causaNoOpera'
        : c === 'nadie_vende_esa_modalidad' ? 'elegirGuarderia.causaSinModalidad'
        /* ④ Mapeada, **hoy inalcanzable**: sin `lat`/`lon` esa etapa no
           descarta a nadie y el server no puede devolverla. */
        : c === 'sin_cobertura' ? 'elegirGuarderia.causaSinCobertura'
        : c === 'especie_sin_oferta' ? 'elegirGuarderia.causaEspecie'
        : 'elegirGuarderia.causaIndeterminada',
      ),
    [t],
  );

  /* ① Se pregunta por la causa y basta: `cuantos > 0 ⟺ causa === null`. */
  const puedeSeguir = listoParaSeguir && resumen.fase === 'listo' && resumen.causa === null;
  /* ② `null` ⇒ nada. Jamás un `0` que se lea como gratis.
     ═══════════════════════════════════════════════════════════════════════
     ⭐ **EL PRECIO DEL PAQUETE VIVE ACÁ ABAJO, JUNTO AL BOTÓN — firma
     original del founder, re-firmada el 30-ago:** *«El chip dice el tamaño;
     el precio vive donde vive el de Día.»*

     ⏪ **Se había implementado distinto** —el precio metido dentro del chip—
     y eso lo sacaba del único lugar donde la casa pone el valor de lo que se
     va a pagar. *Dos superficies distintas para el mismo dato según la
     modalidad hacen que la familia tenga que aprender la pantalla dos veces.*

     🔴 **Y sigue vigente la cura del defecto caro que lo originó:** el founder
     reportó *«con 5 muestra su precio; al elegir 10 sigue mostrando el de 5»*.
     Medido: `obtener_resumen_guarderias` **no recibe el tamaño** y devuelve
     `min(gp.precio)` — el paquete MÁS BARATO del lugar.

     > ### La familia veía $40 y pagaba $75. En la superficie donde se decide pagar.

     ⇒ **el número NO sale del resumen: sale de `precioPorTamano`**, que se
     resuelve por lugar CON el tamaño elegido. Sin tamaño elegido no hay
     número, y la ausencia es honesta.
     ═══════════════════════════════════════════════════════════════════════ */
  const total =
    modalidad === 'paquete'
      ? tamano !== null && precioPorTamano[tamano] !== undefined
        ? `$ ${precioPorTamano[tamano].toFixed(2)}`
        : null
      : resumen.fase === 'listo' && resumen.precioDesde !== null
        ? `$ ${resumen.precioDesde.toFixed(2)}`
        : null;

  /**
   * EL CAMINO CORTO, EJECUTADO. Sin cobro: el bono ya se pagó.
   * 🔴 **La mascota VIAJA siempre** — con más de una elegible el motor rebota
   * `mascota_no_determinada` en vez de adivinar, y acá ya viene del hub.
   */
  const agendarContraSaldo = useCallback(async () => {
    if (bonoId === null || fecha === null || mascotaId === null || agendando) return;
    setAgendando(true);
    const r = await reservarDiaDePaqueteGuarderia({ bonoId, fecha, mascotaId });
    setAgendando(false);
    if (!r.ok) { setReboteSaldo(r.mensaje); return; }
    /* El comprobante de una reserva SIN cobro es el del paseo, censado: un
       aviso que nombra el saldo restante + Go home. El rastro es la fila del
       hub, marcada «Con tu paquete». */
    mostrar({ texto: t('lugarGuarderia.agendadaDePaquete', { n: r.data.saldoRestante }), variante: 'exito' });
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/hogar/guarderia');
  }, [bonoId, fecha, mascotaId, agendando, mostrar, router, t]);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <CabezalOficio
        oficio="guarderia"
        capa="cuidado"
        titulo={t('hubGuarderia.titulo')}
        detalle={params.mascotaNombre ?? t('hubGuarderia.cabezalDetalle')}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {/* ── ① LA MODALIDAD. Con una sola abierta no se dibuja (N=1 colapsa).
               🔴 Y con un BONO tampoco: la modalidad ya la decidió la compra.
               *Ofrecerle cambiarla sería ofrecerle gastar plata que ya gastó.* ── */}
        {MODALIDADES_ABIERTAS.length > 1 && bonoId === null ? (
          <SelectorSegmentado
            proposito="eleccion"
            etiqueta={t('modalidadGuarderia.etiqueta')}
            segmentos={MODALIDADES_ABIERTAS.map((m) => ({
              codigo: m,
              etiqueta: t(m === 'dia' ? 'modalidadGuarderia.dia' : m === 'paquete' ? 'modalidadGuarderia.paquete' : 'modalidadGuarderia.mensual'),
            }))}
            activo={modalidad ?? ''}
            onCambio={(c) => { setModalidad(c as ModalidadGuarderia); setFecha(null); setTamano(null); }}
          />
        ) : null}

        {/* ── ③ EL DÍA, con el rótulo de SU modalidad ── */}
        {listoParaDia ? (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">
              {modalidad === 'paquete' ? t('elegirGuarderia.primeraEstadia')
                : modalidad === 'mensual' ? t('elegirGuarderia.primerDia')
                : t('hubGuarderia.queDia')}
            </Texto>
            <SelectorDia
              dias={dias}
              elegido={fecha ?? ''}
              cerrados={cerrados}
              etiquetaCerrado={etiquetaCerrado}
              onElegir={setFecha}
            />
          </View>
        ) : null}

        {/* ── ③bis LA LETRA DE LA MENSUALIDAD ────────────────────────────
               🔴 **Es lo que la familia está firmando, y no se decía.** Va
               pegada al día porque el día ELEGIDO es el que fija la
               recurrencia: *«se cobra ese mismo día cada mes»*.

               *Una recurrencia que no se declara antes de contratar es la
               clase de cosa que se descubre en el segundo cobro.* ── */}
        {modalidad === 'mensual' && fecha !== null ? (
          <Texto variante="apoyo">{t('elegirGuarderia.mensualLetra')}</Texto>
        ) : null}

        {/* ── ③ EL TAMAÑO, **DESPUÉS del día** — ver la enmienda arriba.
               Con la fecha puesta, cada chip ya puede decir su precio. ── */}
        {/* Con bono NO hay tamaño que elegir: ya está comprado. */}
        {modalidad === 'paquete' && fecha !== null && bonoId === null ? (
          <SelectorOpcion
            acento="control"
            disposicion="tira"
            etiqueta={t('hubGuarderia.cuantasEstadias')}
            /* Cada chip con SU precio. Sin precio todavía, sólo el tamaño:
               **la etiqueta no espera al número**, y un chip sin precio es
               honesto mientras un chip con el precio de otro no lo era. */
            /* ⏪ **SÓLO LOS TAMAÑOS QUE ALGUIEN VENDE.** `TAMANOS_PAQUETE` es
               el vocabulario del producto (5·10·15), **no la oferta**: medido
               contra la base, el lugar vende 5 y 10 — y el chip de 15 se
               ofrecía igual. *La familia lo elegía, recorría los seis pasos
               que siguen, y el motor la rebotaba `paquete_no_disponible` al
               final.* **Ley 23: la puerta no ofrece lo que va a rechazar**, y
               menos seis pasos antes del rechazo.

               ⚠️ El filtro corre **sólo con precios ya resueltos**: mientras
               no llegaron, `precioPorTamano` está vacío y filtrar dejaría la
               lista en cero — *que se leería como «no hay paquetes», y es
               «todavía no sé»*. Sin precios se muestran todos, sin número,
               que es lo que la etiqueta ya hacía. */
            opciones={TAMANOS_PAQUETE
              .filter((n) => Object.keys(precioPorTamano).length === 0 || precioPorTamano[n] !== undefined)
              .map((n) => ({
                codigo: String(n),
                /* 🔴 SÓLO EL TAMAÑO. El precio vive al pie, junto al botón —
                   firma del founder. `precioPorTamano` sigue usándose acá
                   arriba **para filtrar** (un tamaño sin precio es un tamaño
                   que el lugar no vende), pero no se pinta. */
                etiqueta: t('hubGuarderia.tamanoEstadias', { n }),
              }))}
            seleccionada={tamano === null ? '' : String(tamano)}
            /* 🔴 **ACÁ VIVÍA `setFecha(null)`, Y HACÍA IMPOSIBLE COMPRAR UN
               PAQUETE.** Los chips y el pie están montados bajo
               `fecha !== null`, así que elegir un tamaño **borraba el día y
               con él los propios chips y el botón**: la pantalla volvía a
               «elegí un día» vacía, y no había forma de llegar a pagar.

               Es un resto de cuando el tamaño iba ANTES de la fecha — ahí
               limpiar el día al cambiar de tamaño era correcto, porque el
               precio dependía del tamaño elegido. **El founder firmó invertir
               el orden el 29-ago y esta línea sobrevivió a su razón.**

               *No lo vio ningún typecheck ni ningún lint: los dos estados son
               válidos por separado, y la pantalla no falla — se vacía.* Lo
               encontró recorrer el camino por donde entra el dedo. */
            onSelect={(c) => setTamano(Number(c) as TamanoPaqueteGuarderia)}
          />
        ) : null}

        {/* ── ⑤ LOS REQUISITOS — **DESPUÉS de elegir el día**, en los tres
               caminos, e INFORMATIVOS.

               ⏪ Aparecían apenas se abría la pantalla: con una sola modalidad,
               `listoParaDia` es verdadero desde el arranque. **Firma de la mesa
               (29-ago): van después del día, con el ritmo estricto.**

               🔴 **Y la firma gana contra un argumento correcto**, que por eso
               se deja escrito: los requisitos son de la MASCOTA, no del día, y
               verlos temprano dejaría arreglar el carnet mientras se elige.
               *Pero el ritmo es lo que le dice a la familia que la pantalla va
               paso a paso — y una excepción bien razonada en el medio de una
               secuencia la vuelve una pantalla que a veces se adelanta.* */}
        {fecha !== null && requisitos !== null ? (
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
                requisitos={requisitos.faltantes.length === 0
                  ? [{ clave: 'todo', etiqueta: t('lugarGuarderia.requisitosAlDia'), estado: 'al_dia' }]
                  : requisitos.faltantes.map((f): RequisitoSanitario => ({
                      clave: f.codigo,
                      etiqueta: f.nombre,
                      estado: 'falta',
                      detalle: t(`lugarGuarderia.estado_${f.estado}` as 'lugarGuarderia.estado_sin_carnet'),
                      onResolver: () => router.push('/carnet'),
                      etiquetaResolver: t('lugarGuarderia.cargarCarnet'),
                    }))}
              />
            </View>
            </Tarjeta>
            {/* 🔴 LO DICE, para que nadie lea el semáforo como una puerta: hoy
                informa y no frena (`bloquea === false`). */}
            {!requisitos.bloquea ? (
              <Texto variante="apoyo">{t('elegirGuarderia.requisitosInforman')}</Texto>
            ) : null}
          </View>
        ) : null}

        {/* ── ⑦ LA CAUSA, VISIBLE SIN TOCAR EL BOTÓN (Ley 23) ── */}
        {resumen.fase === 'cargando' ? (
          <EsqueletoGrupo><Esqueleto alto={44} /></EsqueletoGrupo>
        ) : resumen.fase === 'vispera' ? (
          /* ③ NO dice «prueba con otro día»: explica LA REGLA, que es lo que
             la familia no sabía. */
          <Texto variante="apoyo">{t('elegirGuarderia.vispera')}</Texto>
        ) : resumen.fase === 'causaDelMotor' ? (
          /* La voz del motor, tal cual: **ya está en tuteo y ya dice el hecho.**
             *Envolverla en «no pudimos preguntar» la convertiría en mentira.* */
          <Texto variante="apoyo">{resumen.mensaje}</Texto>
        ) : resumen.fase === 'noPudimos' ? (
          <Texto variante="apoyo">{t('hubGuarderia.listaNoCargoDetalle')}</Texto>
        ) : resumen.fase === 'listo' && resumen.causa !== null ? (
          <Texto variante="apoyo">{vozCausa(resumen.causa)}</Texto>
        ) : null}

        {/* El rebote del camino corto vive ENCIMA del pie: el pie es fijo y
            debajo no hay dónde vivir. */}
        {reboteSaldo !== null ? <Texto variante="cuerpo">{reboteSaldo}</Texto> : null}
      </ScrollView>

      {/* ── ④+⑤ EL VALOR Y EL BOTÓN. «Ver quién puede» es UN BOTÓN, no una lista. ── */}
      {listoParaDia && fecha !== null ? (
        <PieReserva
          total={total}
          /* El resumen da UN número —el más bajo entre los que van a
             aparecer—, así que siempre es un «desde». *A lo calcula después de
             filtrar: un «desde $8» de un lugar que no aparece promete de más.* */
          totalDesde={resumen.fase === 'listo' && resumen.cuantos > 1}
          /* 🔴 CON BONO EL PIE NO NAVEGA: AGENDA. No hay lugar que elegir
             —lo determina el bono— ni cobro que hacer —el desglose se congeló
             al comprar—. *Pasarlo por «quién puede» sería ofrecerle cambiar
             algo que ya eligió, y abrir la puerta a que elija mal.* */
          etiqueta={bonoId !== null ? t('lugarGuarderia.agendarDePaquete') : t('elegirGuarderia.verQuienPuede')}
          habilitado={bonoId !== null ? fecha !== null && !agendando : puedeSeguir}
          insetBottom={insets.bottom}
          onPress={() => {
            if (bonoId !== null) { void agendarContraSaldo(); return; }
            router.push({
              pathname: '/explorar/guarderia/disponibles',
              params: {
                ...params,
                modalidad: modalidad ?? 'dia',
                fecha,
                ...(modalidad === 'paquete' && tamano !== null ? { tamano: String(tamano) } : {}),
              },
            });
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
