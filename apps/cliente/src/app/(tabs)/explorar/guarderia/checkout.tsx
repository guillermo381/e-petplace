/**
 * CHECKOUT DE GUARDERÍA (S107-C, tanda 7).
 *
 * 🔴 **NO ES UN CHECKOUT NUEVO: es el de la casa con otros datos.** Monta
 * `CheckoutReserva`, la MISMA pieza que paseo y grooming — la superficie de
 * pago es UNA (S101, vigilada por `R57`). *Un segundo checkout sería una
 * segunda forma de equivocarse con la plata.*
 *
 * ── LA ESPERA CON VOZ ES DE LA PIEZA, Y ESO ES LO CORRECTO ──────────────
 * La reserva llegó `pendiente_pago` con hold de 15 minutos y **el desglose se
 * congeló solo** en el motor. Esta pantalla **no declara nada**: la pieza
 * espera la verdad del servidor y **`confirmada` sólo cuando el motor
 * confirma** (`LETRA_PAGO_CITAS` §3). *Una pantalla que se adelanta al motor
 * le dice a la familia que pagó antes de que exista el cobro.*
 *
 * ── ⭐ TRES MODALIDADES, UNA SOLA PANTALLA DE PAGO (30-ago) ─────────────
 * Firma del founder: *«el medio de pago, los términos y el botón Pagar viven
 * en el checkout»*. La pantalla 4 **navega acá** con su modalidad.
 *
 * · **día** — llega con HOLD (`citaId` + `expiraEn` + precio congelado) y va
 *   por `CheckoutReserva` tal cual. **Su reloj es real.**
 * · **paquete** y **mensual** — 🔴 **NO TIENEN HOLD: el motor no emite uno
 *   para ellos.** Llegan por parámetro y el acto ocurre al tocar Pagar.
 *   *No se inventa un temporizador que ningún servidor está honrando: un
 *   reloj falso apura a la familia por nada.* Se declara: estas dos **no
 *   expiran**, y la pantalla no promete que expiren.
 *
 * ⚠️ Las dos comparten la MISMA `SeccionMedioDePago` que `CheckoutReserva`
 * monta adentro (`R57`): la superficie de pago sigue siendo una.
 *
 * ── LA HORA NO SE INVENTA ───────────────────────────────────────────────
 * Una estadía-día **no tiene hora**: tiene dos ventanas. Por eso `hora` viaja
 * con la ventana de recogida en voz de la casa y no con un `00:00` que no
 * significa nada — *un dato vacío con forma de dato es peor que su ausencia.*
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton, Celda, Encabezado, EsperaDeTrabajo, EstadoVacio, Icono, Tarjeta, Texto,
  spacing, useAviso, useTheme,
} from '@epetplace/ui';
import {
  comprarPaqueteGuarderia,
  getEstadoOnboardingDueno,
  obtenerMisPaquetesGuarderia,
  obtenerMisPlanesGuarderia,
  obtenerPaquetesGuarderia,
  reservarDiaGuarderia,
  contratarMensualidadGuarderia,
  reservarDiaDePaqueteGuarderia,
} from '@epetplace/api';
import { TAMANOS_PAQUETE, type TamanoPaqueteGuarderia } from '@/lib/guarderia-modalidad';

import { CheckoutReserva } from '@/components/checkout-reserva';
import { cobrar } from '@/lib/pagos/cobro';
import { useEsperaDeConfirmacion, type SujetoEnEspera } from '@/lib/pagos/espera-confirmacion';
import { SeccionMedioDePago, useMedioDePago } from '@/components/seccion-medio-de-pago';
import { SeccionDireccion, useDireccionEntrega } from '@/components/seccion-direccion';
import { CheckImagenes } from '@/components/check-imagenes';
import { fechaLargaHumana, obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

export default function CheckoutGuarderia() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams();

  const texto = (k: string): string => (typeof params[k] === 'string' ? (params[k] as string) : '');
  const modalidad = texto('modalidad');
  const esPaquete = modalidad === 'paquete';
  const esMensual = modalidad === 'mensual';

  /* ⭐ **EL PAQUETE TAMBIÉN ELIGE TARJETA (S108-C · T3).** ⏪ Decía
     `useMedioDePago(esMensual)` porque el paquete no cobraba: nacía `pagado`
     con `pago_simulado`. Desde que el cobro es real, **una compra sin medio no
     es una compra**. */
  const medio = useMedioDePago(esMensual || esPaquete);
  /**
   * ⭐ **DE DÓNDE LO PASAN A BUSCAR.** La pieza extraída de despensa — la
   * pregunta es la misma (a qué dirección va alguien) y sólo cambia la voz.
   *
   * 🔴 Viaja el **ID**, jamás un snapshot: el server valida contra las
   * direcciones de quien reserva y arma el snapshot él mismo. Y `null` es
   * válido: significa **la principal**, y no se inventa un default.
   */
  /* Los TRES eligen dirección — el día también, desde que su hold se crea acá. */
  const dir = useDireccionEntrega(true);


  /**
   * ⭐ **EL TOTAL DEL PAQUETE SE LEE ACÁ, NO SE HEREDA (S108-C · T1).**
   *
   * ⏪ **Lo que estaba mal, y es la cuarta puerta de un defecto ya conocido.**
   * El total salía de `texto('precio')` — **una cadena preformateada que viaja
   * por la URL** desde la lista, y que para paquete era `min(gp.precio)`: *el
   * paquete más barato del lugar, no el que la familia eligió.* El literal del
   * hub lo dice con todas las letras desde S107: **«La familia veía $40 y
   * pagaba $75. En la superficie donde se decide pagar.»** Se había curado en
   * los chips y en la tarjeta de la lista, **y sobrevivió justo en la
   * superficie que esa frase nombra.**
   *
   * 🔴 **Por eso no alcanza con arreglar el parámetro aguas arriba.** Un número
   * que llega por la URL es un número que nadie puede volver a verificar: entra
   * igual por un deep link, sobrevive a un back y no envejece. *La pantalla
   * donde se decide pagar resuelve su propio precio* — el mismo principio por
   * el que el motor lee el monto del desglose congelado y no del cliente.
   *
   * ⚠️ **Y mientras no lo sepa, no deja pagar.** No se pinta un total viejo ni
   * un «—»: *pagar a ciegas es peor que esperar dos segundos.*
   */
  type PrecioPaquete =
    | { fase: 'noAplica' }
    | { fase: 'cargando' }
    | { fase: 'noPudimos' }
    /** El lugar ya no vende ESE tamaño — la compra rebotaría igual. */
    | { fase: 'noVende' }
    | { fase: 'listo'; precio: number };
  const [precioPaquete, setPrecioPaquete] = useState<PrecioPaquete>({ fase: 'noAplica' });

  /**
   * ⭐ **MODO REANUDACIÓN** — se entra con un bono que YA existe y cuyo pago
   * quedó a medias. *Un paquete pendiente de pago que sólo se puede completar
   * volviendo a comprarlo dejaría a la familia con dos bonos y una sola
   * intención.*
   */
  const esReanudacion = esPaquete && texto('bonoId') !== '';

  /* El tamaño se valida contra el catálogo, jamás se confía del `Number()`. */
  const tamanoElegido: TamanoPaqueteGuarderia | null = (() => {
    if (!esPaquete) return null;
    const n = Number(params.tamano);
    return TAMANOS_PAQUETE.find((x) => x === n) ?? null;
  })();

  useEffect(() => {
    if (!esPaquete) { setPrecioPaquete({ fase: 'noAplica' }); return; }
    let vigente = true;
    setPrecioPaquete({ fase: 'cargando' });

    /* ⭐ **REANUDACIÓN: el precio sale del BONO, no del catálogo.**
       Cuando se vuelve a completar el pago de un paquete que ya existe, el
       precio **ya está congelado en él** — *volver a preguntarle al lugar
       podría mostrar el precio de hoy sobre una compra de ayer, que es un
       total distinto del que se va a cobrar.* Y el catálogo ni siquiera
       serviría: la reanudación llega sin tamaño elegido. */
    if (esReanudacion) {
      void (async () => {
        const r = await obtenerMisPaquetesGuarderia();
        if (!vigente) return;
        if (!r.ok) { setPrecioPaquete({ fase: 'noPudimos' }); return; }
        const b = r.data.find((x) => x.bonoId === texto('bonoId'));
        setPrecioPaquete(
          b === undefined || b.porDia === null
            ? { fase: 'noPudimos' }
            : { fase: 'listo', precio: b.porDia * b.total },
        );
      })();
      return () => { vigente = false; };
    }

    const prestadorId = texto('prestadorId');
    if (tamanoElegido === null || prestadorId === '') { setPrecioPaquete({ fase: 'noPudimos' }); return; }
    void (async () => {
      const r = await obtenerPaquetesGuarderia(prestadorId);
      if (!vigente) return;
      /* Ley 13: un fallo de lectura no se disfraza de «no lo vende». */
      if (!r.ok) { setPrecioPaquete({ fase: 'noPudimos' }); return; }
      const pq = r.data.find((x) => x.tamano === tamanoElegido && x.activo);
      setPrecioPaquete(pq === undefined ? { fase: 'noVende' } : { fase: 'listo', precio: pq.precio });
    })();
    return () => { vigente = false; };
  }, [esPaquete, esReanudacion, tamanoElegido]);

  const [enviando, setEnviando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);

  /* ═══ ⭐ S108-C · T3 · LA MÁQUINA DEL DÍA, PARA LOS OTROS DOS ═══════════════
     Hasta hoy el paquete y la mensualidad **declaraban éxito solos**, en el
     mismo tick en que el wrapper decía `ok`. Podían: no había cobro. *Con plata
     real, un `ok` del wrapper significa «el proveedor contestó» y nada más* —
     la confirmación llega por webhook o por barrido, después.

     ⇒ Pasan por **la misma máquina que la cita**: señal optimista → `confirmando`
     con voz y movimiento → `useEsperaDeConfirmacion` sobre SU sujeto → éxito
     sólo cuando el servidor lo dice. **No es una máquina nueva: es la de la
     casa, que ya sabía esperar dos sujetos y ahora espera cuatro.** */
  const [fase, setFase] = useState<'resumen' | 'confirmando' | 'agendando'>('resumen');
  /** Qué se está esperando. `null` fuera de `confirmando` — *pasarle `null` es
   *  lo que impide que esta pantalla sondee por existir.* */
  const [sujeto, setSujeto] = useState<SujetoEnEspera | null>(null);
  /** El bono en vuelo: lo necesita el agendamiento que sigue al cobro. */
  const [bonoEnVuelo, setBonoEnVuelo] = useState<string | null>(null);
  const espera = useEsperaDeConfirmacion(fase === 'confirmando' ? sujeto : null);
  /**
   * ⭐ **LA CONFIRMACIÓN ES LA MISMA QUE LA DE TODOS LOS SERVICIOS.**
   * Firma del founder: *«después de pagar va a la pantalla de confirmación
   * que ya usan todos los servicios — reusala, no la construyas»*.
   *
   * ⏪ Paquete y mensual mostraban **un toast y volvían al hogar**. *Un toast
   * se va solo: el acto más caro del recorrido no puede confirmarse con algo
   * que desaparece.* Ahora aterrizan en el mismo `EstadoVacio` con el glifo
   * del oficio y el «volver al hogar» que usan las cuatro hermanas.
   */
  const [exito, setExito] = useState<{ titulo: string; detalle: string } | null>(null);
  /* La familia, para el check de imagen: se resuelve una vez y sirve a las
     tres confirmaciones. */
  const [familiaId, setFamiliaId] = useState<string | null>(null);
  useEffect(() => {
    void getEstadoOnboardingDueno().then((r) => { if (r.ok) setFamiliaId(r.data.familia_id); });
  }, []);

  /**
   * ⭐ El check de imagen, en la confirmación de las TRES modalidades.
   * *Se monta sólo con familia y nombre resueltos: un consentimiento que no
   * puede nombrar a la mascota es un consentimiento sobre nadie.*
   */
  const checkImagenes =
    familiaId !== null && texto('mascotaNombre') !== ''
      ? <CheckImagenes familiaId={familiaId} mascotaNombre={texto('mascotaNombre')} />
      : null;

  const rebotar = useCallback(
    (codigo: string, mensaje: string) => {
      setRebote(mensaje);
      /* Nombrar el rebote es la mitad; la otra es que lleve a donde se
         resuelve — la misma cura que las cuatro ramas de la pantalla 4. */
      if (codigo === 'documentos_sin_aceptar') router.push('/guarderia/documentos');
      /* ⭐ **«YA TENÉS UN PLAN» NO ES UN ERROR: ES UN DESTINO.**
         Esto es lo que el founder vivió como *«no me deja pagar»*: su primer
         toque **sí firmó el mandato** y el segundo rebotaba con el mensaje
         crudo de un índice. *No era «no se pudo»: era «ya lo tenés y no supe
         explicártelo».*
         🔴 Y llevar al hub sólo sirve **desde que el plan se ve ahí** — lo
         monté en la misma tanda. *Llevar a una pantalla que no muestra lo que
         se fue a buscar es la mitad de la cura otra vez.* */
      if (codigo === 'ya_tienes_plan_activo') {
        /* 🔴 **EL MENSAJE VIAJA EN UN TOAST, NO EN LA PANTALLA.** Medido: con
           `setRebote` solo, la explicación se pintaba y **se iba con la
           navegación** — la familia aparecía en el hub sin saber por qué la
           movieron. *Llevarla al lugar correcto sin decirle qué pasó es
           cambiar un error mudo por una mudanza muda.* Un toast sobrevive al
           cambio de pantalla; el texto de la pantalla no. */
        /* `neutro`, no `error`: **no se equivocó en nada** — ya tiene el
           plan. *Pintar de error un estado correcto le enseña a la familia a
           desconfiar de lo que hizo bien.* */
        mostrar({ texto: mensaje, variante: 'neutro' });
        if (router.canDismiss()) router.dismissAll();
        router.navigate('/hogar/guarderia');
      }
    },
    [router, mostrar],
  );

  /**
   * ⭐ **EL HOLD DEL DÍA SE CREA ACÁ, no en la pantalla 4.**
   * `reservar_dia_guarderia` **congela la dirección al crear la cita**, así
   * que si el hold naciera antes, elegir la dirección después no cambiaría
   * nada — *un selector que el servidor ya no puede escuchar es un control que
   * no decide.*
   *
   * `null` = todavía no se reservó; con la cita, se monta `CheckoutReserva`
   * con su hold, su reloj real y su precio congelado por el motor.
   */
  const [holdDia, setHoldDia] = useState<{ citaId: string; expiraEn: string; precio: number } | null>(null);

  const reservarElDia = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    setRebote(null);
    const r = await reservarDiaGuarderia({
      prestadorId: texto('prestadorId'),
      mascotaId: texto('mascotaId'),
      fecha: texto('fecha'),
      direccionId: dir.direccionId ?? undefined,
    });
    setEnviando(false);
    if (!r.ok) { rebotar(r.codigo, r.mensaje); return; }
    setHoldDia({ citaId: r.data.citaId, expiraEn: r.data.expiraEn, precio: r.data.precio });
  }, [enviando, dir.direccionId, rebotar]);

  /**
   * ⭐ **EL CIERRE DE LA MENSUALIDAD — la fecha del próximo cobro se PREGUNTA.**
   * Calcularla acá obligaría a replicar la regla de anclaje del motor, y S108-A
   * midió su borde: la renovación es `periodo_hasta + 1`, así que **un plan que
   * arranca el 31-ene salta al 28-feb** y el día del mes no se conserva. *Una
   * fecha que la pantalla calcula y el motor no honra es el defecto que esta
   * tanda vino a cerrar.* Con el cobro confirmado el período YA existe, así que
   * ahora sí hay fecha que decir.
   */
  const cerrarMensual = useCallback(async (suscripcionId: string) => {
    const plan = await obtenerMisPlanesGuarderia();
    const mio = plan.ok ? plan.data.find((x) => x.suscripcionId === suscripcionId) : undefined;
    /* ⭐ **DEL SERVIDOR, RESUELTA.** ⏪ Acá decía `mio?.periodoHasta`, que es el
       fin del período pagado y **cae un día antes del cobro**: la pantalla daba
       la fecha corrida. A publicó `proximoCobro` ya resuelto, con la regla que
       recupera el día original. */
    const proximo = mio?.proximoCobro ?? null;
    setFase('resumen');
    setExito({
      titulo: t('checkoutGuarderia.mensualExito'),
      detalle: proximo === null
        ? t('checkoutGuarderia.mensualExitoDetalleSinFecha')
        : t('checkoutGuarderia.mensualExitoDetalle', { fecha: fechaLargaHumana(proximo, obtenerIdiomaActual()) }),
    });
  }, [t]);

  /**
   * ⭐ **AGENDAR EL PRIMER DÍA — el segundo acto, invisible para la familia.**
   *
   * Firma del founder: *«el primer día se agenda, y ese agendamiento paga el
   * paquete entero»* — **de su lado sigue siendo UN SOLO ACTO.** Lo que se
   * separa es adentro, porque la confirmación del cobro es asincrónica y
   * `reservar_dia_de_paquete_guarderia` **exige el bono pagado** (rebota
   * `paquete_no_pagado`, la voz que S108-A le dio para que deje de decir «no te
   * quedan días» sobre un paquete comprado hace treinta segundos).
   *
   * 🔴 **Y NO SE CONSTRUYÓ HOLD SOBRE EL CUPO, por decisión medida:** *el bono
   * es SALDO, no un día.* El hold de la cita protege la agenda de un
   * profesional a una hora, que se pierde de verdad; un día de cupo no — si se
   * ocupa, la familia agenda otro y **su saldo sigue intacto**. Por eso este
   * camino tiene un final honesto para «se ocupó mientras se cobraba» en vez de
   * una reserva que nadie prometió.
   */
  const agendarPrimerDia = useCallback(async (bonoId: string) => {
    const fecha = texto('fecha');
    /* Sin día elegido no hay nada que agendar: el paquete quedó comprado y la
       familia elige cuándo. Es el caso de completar un pago desde el hogar. */
    if (fecha === '') {
      setFase('resumen');
      setExito({ titulo: t('checkoutGuarderia.paqueteExito'), detalle: t('checkoutGuarderia.paqueteElegiDia') });
      return;
    }
    setFase('agendando');
    const r = await reservarDiaDePaqueteGuarderia({
      bonoId, fecha, mascotaId: texto('mascotaId'), direccionId: dir.direccionId ?? undefined,
    });
    if (r.ok) {
      setFase('resumen');
      setExito({
        titulo: t('checkoutGuarderia.paqueteExito'),
        detalle: t('lugarGuarderia.paqueteListo', { n: r.data.saldoRestante }),
      });
      return;
    }
    /* 🔴 **EL PAQUETE ESTÁ COMPRADO Y PAGADO.** *Decir sólo «no se pudo» sobre
       una compra que SÍ ocurrió dejaría a la familia creyendo que perdió la
       plata.* El saldo se nombra, y el camino lleva a elegir otro día. */
    setFase('resumen');
    setExito({
      titulo: t('checkoutGuarderia.paqueteExito'),
      detalle: t('checkoutGuarderia.paqueteDiaSeOcupo', { mensaje: r.mensaje }),
    });
  }, [dir.direccionId, t]);

  const pagar = useCallback(async () => {
    if (enviando) return;
    /* Ni el paquete ni la mensualidad se tocan sin medio: los dos cobran. */
    if (medio.idTarjeta === null) { setRebote(t('lugarGuarderia.faltaTarjeta')); return; }
    setEnviando(true);
    setRebote(null);
    const prestadorId = texto('prestadorId');
    const mascotaId = texto('mascotaId');

    if (esMensual) {
      /* 🔴 EN LA MENSUALIDAD LA DIRECCIÓN VA EN EL MANDATO, igual que el
         medio de pago: **las citas del plan las crea el reloj, sin nadie
         presente.** Se resuelve AL FIRMAR y jamás al cobrar. */
      const r = await contratarMensualidadGuarderia({
        prestadorId, tarjetaId: medio.idTarjeta, mascotaId, direccionId: dir.direccionId ?? undefined,
      });
      if (!r.ok) { setEnviando(false); rebotar(r.codigo, r.mensaje); return; }
      /* ⭐ **CONTRATAR NO COBRA — el motor devuelve el sujeto y el cobro va por
         la misma puerta que los otros tres** (confirmado con S108-A: la RPC no
         cobra por dentro, a propósito, para que la espera siga siendo UNA
         pieza). */
      const cobro = await cobrar({ tipo: 'mensualidad', id: r.data.suscripcionId }, medio.idTarjeta);
      setEnviando(false);
      if (!cobro.ok) {
        /* Se queda en el resumen con todo lo elegido: *lo que la familia quiere
           después de un rechazo es probar con otra tarjeta.* */
        mostrar({ texto: t(cobro.voz), variante: 'error' });
        return;
      }
      setSujeto({ tipo: 'mensualidad', id: r.data.suscripcionId });
      setFase('confirmando');
      return;
    }

    /* ═══ PAQUETE ══════════════════════════════════════════════════════════
       🔴 **EL BONO SE COMPRA UNA SOLA VEZ, aunque el cobro se reintente.**
       `bonoEnVuelo` guarda el que ya nació: sin él, cada reintento tras un
       rechazo crearía **otro bono pendiente** — la familia terminaría con tres
       paquetes fantasma por haber probado tres tarjetas. */
    let bonoId = bonoEnVuelo ?? (texto('bonoId') !== '' ? texto('bonoId') : null);
    if (bonoId === null) {
      const compra = await comprarPaqueteGuarderia({ prestadorId, tamano: Number(params.tamano ?? 0) });
      if (!compra.ok) { setEnviando(false); rebotar(compra.codigo, compra.mensaje); return; }
      bonoId = compra.data.bonoId;
      setBonoEnVuelo(bonoId);
    }
    const cobro = await cobrar({ tipo: 'bono', id: bonoId }, medio.idTarjeta);
    setEnviando(false);
    if (!cobro.ok) { mostrar({ texto: t(cobro.voz), variante: 'error' }); return; }
    setSujeto({ tipo: 'bono', id: bonoId });
    setFase('confirmando');
  }, [enviando, esMensual, medio.idTarjeta, params.tamano, bonoEnVuelo, dir.direccionId, mostrar, rebotar, t]);

  /**
   * 🔴 **EL HOOK SE ESCUCHA.** *La lección de la despensa: la pieza estaba bien
   * construida, probada, y desconectada del único lugar donde su resultado
   * importa.* Cada desenlace con su voz — y **ninguno se dibuja como éxito ni
   * como rechazo si el servidor no lo dijo.**
   */
  useEffect(() => {
    if (espera.fase !== 'resuelta' || sujeto === null) return;
    const e = espera.estado;

    if (sujeto.tipo === 'mensualidad') {
      if (e === 'activa') { void cerrarMensual(sujeto.id); return; }
      setFase('resumen');
      /* `fallida` es un veredicto REAL (S108-A lee el intento de la familia),
         no un timeout: por eso se puede decir que no entró. */
      setRebote(e === 'fallida' ? t('checkoutGuarderia.mensualNoEntro') : t('checkoutGuarderia.mensualCancelada'));
      return;
    }

    if (e === 'pagado') { void agendarPrimerDia(sujeto.id); return; }
    setFase('resumen');
    setBonoEnVuelo(null);
    /* 🔴 CADA FINAL CON SU FRASE. «No llegaste a pagarlo» y «te devolvimos la
       plata» son dos cosas distintas, y S108-A les dio valores distintos justo
       para que acá no se cuenten con la misma. */
    setRebote(
      e === 'no_pagado_a_tiempo' ? t('checkoutGuarderia.paqueteNoPagadoATiempo')
      : e === 'vencido' ? t('checkoutGuarderia.paqueteVencido')
      : t('checkoutGuarderia.paqueteNoEntro'),
    );
  }, [espera, sujeto, agendarPrimerDia, t]);

  /* ═══ ⭐ LA ESPERA — voz y movimiento, jamás un spinner mudo ══════════════
     Es el MISMO cuerpo que la cita: `EsperaDeTrabajo` (la rampa que trabaja) y
     una frase que dice qué está pasando. **La pantalla cambia sola** cuando el
     servidor confirma — no hay botón «ya pagué» ni pull-to-refresh.
     🔴 Y el tope **NO declara desenlace**: la compra sigue viva y el barrido la
     resuelve. *Un tope que se dibuja como «rechazado» hace que la familia pague
     dos veces.* */
  if (fase === 'confirmando' || fase === 'agendando') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4], padding: spacing[6] }}>
          <Texto variante="titulo">
            {fase === 'agendando' ? t('checkoutGuarderia.agendandoTitulo') : t('pago.esperaTitulo')}
          </Texto>
          <Texto variante="cuerpo">
            {fase === 'agendando'
              ? t('checkoutGuarderia.agendandoCuerpo')
              : esMensual
                ? t('checkoutGuarderia.esperaMensual')
                : t('checkoutGuarderia.esperaPaquete')}
          </Texto>
          <EsperaDeTrabajo />
          {espera.fase === 'sigue_abierta' ? (
            <>
              <Texto variante="apoyo">{t('pago.esperaSigueAbiertaCita')}</Texto>
              <Boton
                variante="secundario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar/guarderia');
                }}
              />
            </>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  if (exito !== null) {
    return (
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            icono={<Icono nombre="guarderia" tamano={48} />}
            titulo={exito.titulo}
            descripcion={exito.detalle}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  /* D-329: `dismissTo` sólo busca en el stack ACTUAL. */
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar/guarderia');
                }}
              />
            }
          />
          {checkImagenes}
        </View>
      </SafeAreaView>
    );
  }

  if (esPaquete || esMensual || holdDia === null) {
    return (
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" atras titulo={t('checkout.titulo')} onAtras={() => router.back()} />
        <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}>
          <Texto variante="seccion">{t('checkout.resumen')}</Texto>
          <Tarjeta relleno="ninguno">
            <Celda
              titulo={
                esMensual
                  ? t('checkoutGuarderia.mensualServicio')
                  : esReanudacion
                    ? t('checkoutGuarderia.paqueteCompletarPago')
                    : esPaquete
                      ? t('checkoutGuarderia.paqueteServicio', { n: texto('tamano') })
                      : t('checkoutGuarderia.servicio')
              }
              subtitulo={texto('prestadorNombre')}
              /* ☠️ **LA FECHA DE INICIO, DEROGADA (S108-C · T2).** Para la
                 mensualidad esta línea pintaba el día que la familia había
                 elegido *como si fuera el arranque del plan* — y con «pagar es
                 arrancar» el arranque es hoy. *Dejar un día ahí sería seguir
                 prometiendo el modelo viejo en la superficie donde se firma.*
                 Las otras dos conservan su fecha: para ellas ES la estadía. */
              metadataMono={esMensual ? undefined : texto('fecha')}
            />
            {/* ⭐ **EL TOTAL DEL PAQUETE SALE DEL PAQUETE, no de la URL.**
                Las otras dos siguen con su parámetro **y eso es correcto,
                medido**: para día `precioModalidad` es `ps.precio` y para
                mensual `ps.precio_mensual_plan` — los dos exactos y del lugar.
                *El único que era un mínimo era el paquete.*
                🔴 Mientras no se resuelve **no se pinta ningún número**: un
                total viejo o un «—» en la pantalla de pago se leen como dato. */}
            <Celda
              titulo={t('checkout.total')}
              metadataMono={
                esPaquete
                  ? precioPaquete.fase === 'listo'
                    ? `$ ${precioPaquete.precio.toFixed(2)}`
                    : undefined
                  : texto('precio')
              }
            />
          </Tarjeta>

          {/* ═══ ⭐ LA AUSENCIA ESCRITA (S108-C · T2) ═══════════════════════
              🔴 **Acá se elegía el día en que empezaba el plan.** El founder lo
              derogó el 31-ago: *pagar es arrancar.* **Y una decisión que se ve
              como una ausencia se escribe en el lugar donde se ve la ausencia**
              — si no, el hueco se lee como un dato que falta, y la familia
              autoriza un cobro que se repite sin saber cuándo cae.

              Las tres cosas, y ninguna es decorativa: **cuándo se cobra la
              primera vez** (hoy — lo que cambió), **cuándo se repite** (el
              ancla de la recurrencia) y **cómo se sale** (sin eso, un cobro
              mensual es una puerta de entrada sin salida). */}
          {esMensual ? (
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('checkoutGuarderia.mensualCuando')}</Texto>
              <Texto variante="cuerpo">{t('checkoutGuarderia.mensualCuandoPrimera')}</Texto>
              <Texto variante="cuerpo">{t('checkoutGuarderia.mensualCuandoRepite')}</Texto>
              <Texto variante="cuerpo">{t('checkoutGuarderia.mensualCuandoCancela')}</Texto>
            </View>
          ) : null}

          {/* A DÓNDE PASAN A BUSCARLO — antes del medio de pago: primero
              dónde, después con qué. */}
          <SeccionDireccion
            dir={dir}
            rotulo={t('checkoutGuarderia.dondeRecogen')}
            apoyo={esMensual ? t('checkoutGuarderia.dondeRecogenMensual') : undefined}
          />

          {esMensual ? (
            <>
              {/* 🔴 `recurrente`: los dos medios prometen cosas distintas y las
                  dos se dicen ANTES de elegir. El PAQUETE es compra suelta y no
                  lleva la marca. */}
              <SeccionMedioDePago medio={medio} recurrente />
              <Texto variante="apoyo">{t('lugarGuarderia.mensualMandato')}</Texto>
            </>
          ) : esPaquete ? (
            /* ☠️ **ACÁ VIVÍA «El cobro de este paquete todavía es simulado».**
               Era cierta y por eso estaba escrita; **deja de serlo en esta misma
               tanda**, con el cobro real enchufado. *Un texto honesto se retira
               cuando cambia lo que describe — ni antes, ni después.* Lo que
               ocupa su lugar es la sección de medio de pago, que ahora el
               paquete también necesita. */
            <SeccionMedioDePago medio={medio} />
          ) : null}

          {rebote !== null ? <Texto variante="cuerpo">{rebote}</Texto> : null}
        </ScrollView>
        <View style={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[4] }}>
          <Boton
            variante="primario"
            bloque
            /* El día todavía no reservó: su botón CONTINÚA al pago con el
               hold recién creado. Los otros dos pagan acá mismo. */
            etiqueta={esPaquete || esMensual ? t('checkout.pagar') : t('checkoutGuarderia.continuar')}
            cargando={enviando}
            /* ⭐ **NO SE PAGA UN TOTAL QUE LA PANTALLA NO PUDO LEER.** Y el
                apagado DICE qué falta, cada causa con su frase — *una pared
                muda hace creer que el producto está roto.* */
            deshabilitado={
              ((esMensual || esPaquete) && medio.idTarjeta === null) ||
              (esPaquete && precioPaquete.fase !== 'listo')
            }
            razonDeshabilitado={
              /* La tarjeta se pregunta PRIMERO: con el paquete cobrando de
                 verdad, «falta el precio» sobre un carrito sin medio mandaría a
                 mirar el lugar equivocado. */
              medio.idTarjeta === null
                ? t('lugarGuarderia.faltaTarjeta')
                : precioPaquete.fase === 'noVende'
                  ? t('checkoutGuarderia.paqueteYaNoSeVende')
                  : precioPaquete.fase === 'noPudimos'
                    ? t('checkoutGuarderia.precioNoLeido')
                    : t('checkoutGuarderia.precioCargando')
            }
            onPress={() => void (esPaquete || esMensual ? pagar() : reservarElDia())}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CheckoutReserva
      citaId={holdDia.citaId}
      expiraEn={holdDia.expiraEn}
      precio={holdDia.precio}
      prestadorNombre={texto('prestadorNombre')}
      servicioNombre={t('checkoutGuarderia.servicio')}
      fecha={texto('fecha')}
      /* Sin hora: la estadía ocupa el día entre las dos ventanas. */
      hora={t('checkoutGuarderia.sinHora')}
      duracion={t('checkoutGuarderia.duracion')}
      exitoIcono="guarderia"
      resumenEtiqueta={t('checkout.resumen')}
      exitoTitulo={t('checkoutGuarderia.exitoTitulo')}
      exitoDetalle={t('checkoutGuarderia.exitoDetalle')}
      /* El slot que la pieza ya tenía para esto — y que además hace que su
         éxito pase a `ScrollView`, así el check no empuja el botón fuera. */
      exitoExtra={checkImagenes}
      /* No hay dirección que elegir: pasan a buscarlo por su casa. */
      puedePagar
    />
  );
}
