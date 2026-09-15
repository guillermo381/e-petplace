/**
 * EL CHECKOUT DEL CHASIS DE RESERVA (S60-A1) — extracción del checkout
 * del paseo (S54-B3.3) a componente compartido para que el grooming lo
 * consuma sin duplicar la máquina (~250 líneas: precedente S59-B5 — la
 * duplicación es deuda segura). UNA verdad: hold 15' a la vista con voz
 * honesta, EsperaDeMarca en el procesamiento.
 *
 * ═══ 🔴 S101-C · ACÁ MURIÓ EL PAGO SIMULADO ════════════════════════════════
 *
 * Esta pantalla es **la puerta de pago de los CUATRO oficios** (paseo ·
 * grooming · veterinaria · adiestramiento). Hasta hoy llamaba a
 * `confirmarCitaPagada`: **una RPC que cualquiera con una cuenta podía
 * ejecutar sobre su propia cita** (`D-855`) — o sea, declararse pagada sola.
 *
 * Hoy cobra **por el mismo motor que la despensa**: `pagos-cobro` con la CITA
 * como sujeto → webhook → actuador → comprobante. *Una casa, un motor, dos
 * puertas.*
 *
 * 🔴 **Y ES LA PRECONDICIÓN DEL `REVOKE`, no un adorno.** Revocar la RPC vieja
 *    con esta pantalla todavía llamándola dejaría a los cuatro oficios sin
 *    poder reservar. *Por eso el reemplazo se prueba desde su consumidor real
 *    —esta pantalla— y no desde un arnés: un arnés puede llamar a la puerta
 *    nueva y dejar la vieja en uso sin que nadie lo note.*
 *
 * Lo que cada servicio aporta por props: su sección propia (paseo = la
 * dirección del hogar D-339; grooming = el DÓNDE del local, solo
 * lectura), su gate de pago (puedePagar) y el ícono del éxito. La
 * mecánica no se toca desde afuera.
 *
 * ESCALERA (§4b): muestra SOLO el ítem del hold (snapshot de precio —
 * jamás re-resuelve); no muestra datos del expediente y lo dice.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  DesgloseCompra,
  HojaContenido,
  Cabecera,
  Boton,
  Celda,
  Confirmacion,
  Encabezado,
  EsperaLarga,
  EstadoVacio,
  Icono,
  Insignia,
  PantallaConPie,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  BotonPagar, SeccionMedioDePago, useMedioDePago,
} from '@/components/seccion-medio-de-pago';
import { SeccionFacturacion, useFacturacion } from '@/components/seccion-facturacion';
import { obtenerDesgloseDeCita, tarifaServicio, type DesgloseDeCita, type TarifaServicio as TarifaDelMotor } from '@epetplace/api';
import { AvisoNoCargo } from '@/components/aviso-no-cargo';
import { LineaFacturaEnCamino } from '@/components/linea-factura-en-camino';
import { cobrar } from '@/lib/pagos/cobro';
import { useEsperaDeConfirmacion } from '@/lib/pagos/espera-confirmacion';
import { EsperaDeUna } from '@/components/espera-deuna';
import { topeDeEspera, useEstadoDeUna } from '@/lib/pagos/deuna-estado';
import { urlWhatsApp } from '@/lib/contacto';
import { useTraduccion } from '@/i18n';
import { fechaYHoraHumana, formatearPrecio } from '@epetplace/i18n';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

/**
 * ☠️ `rechazado` y `timeout` MURIERON como fases (Ley 37).
 *
 * Eran pantallas enteras del simulador: se llegaba a ellas sin tocar el motor.
 * Con el cobro real **un fallo no es una pantalla: es un aviso, y la familia se
 * queda en el resumen con su hold vivo** —exactamente como en la despensa—
 * *porque lo que quiere después de un rechazo es probar con otra tarjeta, no
 * mirar una pantalla de disculpas y volver a empezar.*
 */
type Fase = 'resumen' | 'confirmando' | 'exito' | 'holdVencido' | 'reservaCancelada';

export function CheckoutReserva({
  citaId,
  mascotaId,
  expiraEn,
  precio,
  prestadorNombre,
  servicioNombre,
  fecha,
  hora,
  duracion,
  resumenEtiqueta,
  exitoTitulo,
  exitoDetalle,
  puedePagar,
  seccionExtra,
  fueraDeScroll,
  exitoExtra,
}: {
  citaId: string;
  /** ⭐ **S116-C lote 13 · lo pide «Ver la cita» de la confirmación.**
   *  `/citas/[mascotaId]` es la única puerta al detalle y esta máquina no lo
   *  tenía; viaja desde `lib/reserva/*`, donde ya existía. */
  mascotaId: string;
  expiraEn: string;
  precio: number;
  prestadorNombre: string;
  servicioNombre: string;
  fecha: string;
  hora: string;
  duracion: string;
  /* ☠️ **`exitoIcono` MURIÓ — S116-C lote 13.** El éxito pasa a
     `Confirmacion`, que trae su propio check y su trío; un glífo de oficio
     al lado del check serían **dos signos para el mismo hecho**. *El oficio
     lo dice el dato, que ahora lleva servicio y prestador.* Los cinco
     consumidores dejan de pasarlo. */
  /** CURA S60-C1: la VOZ resuelve por el OFICIO — la máquina no conoce
   *  keys de ningún servicio; cada consumidor trae las suyas ya
   *  traducidas (Ley 17.3: una acción, un nombre, todo el flujo). */
  resumenEtiqueta: string;
  exitoTitulo: string;
  exitoDetalle: string;
  /** Gate externo del CTA (paseo: la dirección del hogar D-339). */
  puedePagar: boolean;
  /** La sección propia del servicio, entre el hold y el aviso simulado. */
  seccionExtra?: ReactNode;
  /** Hojas del consumidor (viven fuera del ScrollView). */
  fueraDeScroll?: ReactNode;
  /**
   * S106-C t3 · Lo que el oficio agrega DEBAJO del éxito. Hoy su único
   * consumidor son los consejos de preparación de §3bis, que la letra pide
   * en la confirmación de la reserva —*«cuando el dueño acaba de pagar y
   * está atento»*—.
   *
   * ⚠️ **Su presencia cambia el layout del éxito a scrolleable** (ver el
   * bloque `fase === 'exito'`): sin él, el render es exactamente el de
   * antes, y por eso los otros tres oficios no se tocan.
   */
  exitoExtra?: ReactNode;
}) {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const cabecera = useAltoDeCabecera('empujada');
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [fase, setFase] = useState<Fase>('resumen');
  const [trabajando, setTrabajando] = useState(false);
  const [restanteSeg, setRestanteSeg] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(expiraEn).getTime() - Date.now()) / 1000)),
  );

  /* ☠️ ACÁ VIVÍA EL ESTADO DE LOS MEDIOS, **copiado del checkout de la
     despensa** — mismo `useState`, misma regla de preselección, misma función
     de agregar. Hoy sale de `useMedioDePago`, la MISMA pieza que monta la
     despensa (orden del founder ⑤).
     *Dos copias no divergen el día que se escriben: divergen el día que
     alguien afina una — y la que no se afina no da error, se queda vieja.* */
  const medio = useMedioDePago(fase === 'resumen');

  // El contador del hold — voz honesta; al llegar a 0 el horario se
  // liberó (el server lo garantiza perezoso; esto es la verdad visible).
  useEffect(() => {
    if (fase !== 'resumen') return;
    const timer = setInterval(() => {
      const s = Math.max(0, Math.floor((new Date(expiraEn).getTime() - Date.now()) / 1000));
      setRestanteSeg(s);
      if (s === 0) setFase('holdVencido');
    }, 1000);
    return () => clearInterval(timer);
  }, [fase, expiraEn]);

  /* ═══ 🔴 EL RIEL EN CURSO — se congela AL TOCAR, no se lee del selector ═══
     (S105-C · el enchufe de DeUna.)

     `medio.elegido` es estado vivo del resumen; **la fase `confirmando` tiene
     que saber por dónde entró la plata, y eso se decidió en el toque.** *Leer
     el selector durante la espera dejaría expresable que el cuerpo cambie de
     riel a mitad de una confirmación —la persona mirando un código de DeUna y
     la pantalla pasando a la rampa de tarjeta— por un re-render que no tiene
     nada que ver con lo que ella hizo.*

     `null` = todavía no se tocó nada. **No hay default**: *un riel por omisión
     es exactamente la clase de decisión que alguien toma en nombre de otro y
     no queda registrada.* */
  /* LOS DATOS PARA LA FACTURA — el hook los trae. ☠️ Acá vivían el tope, el
     perfil, el nombre, el correo y su carga: **seis pantallas de cobro los
     necesitan**, así que copiarlos era la divergencia garantizada. */
  const facturacion = useFacturacion(fase === 'resumen');

  /* ══════════════════════════════════════════════════════════════════════════
   *  ⑤ EL DESGLOSE — **leído, jamás calculado acá**
   *  ─────────────────────────────────────────────────────────────────────────
   *  🔴 Esta pantalla tiene `precio` y nada más. Partirlo en subtotal e IVA del
   *  lado del cliente sería **re-implementar la aritmética fiscal en una
   *  pantalla**: el día que un servicio tribute 0 %, o que la tarifa cambie, la
   *  pantalla diría un número y la factura otro. *El desglose que se muestra
   *  tiene que ser EL MISMO que se cobra, y el único que lo es es el que el
   *  motor congeló en `cita_desglose`.*
   *
   *  ⚠️ **Las dos lecturas son independientes y van juntas**: la tarifa de
   *  servicio no depende de la cita, y encadenarlas sumaría un viaje.
   *  Un fallo de cualquiera **no rompe el checkout**: el desglose no se dibuja y
   *  queda el total, que es el dato que de verdad hace falta para pagar.
   * ═════════════════════════════════════════════════════════════════════════ */
  const [desglose, setDesglose] = useState<DesgloseDeCita | null>(null);
  const [tarifa, setTarifa] = useState<TarifaDelMotor | null>(null);

  useEffect(() => {
    if (fase !== 'resumen') return;
    let vigente = true;
    void obtenerDesgloseDeCita(citaId).then((r) => {
      if (vigente && r.ok) setDesglose(r.data);
    });
    void tarifaServicio().then((r) => {
      if (vigente && r.ok) setTarifa(r.data);
    });
    return () => { vigente = false; };
  }, [fase, citaId]);

  const [riel, setRiel] = useState<'tarjeta' | 'deuna' | null>(null);

  /* ═══ EL CÓDIGO DE DEUNA ════════════════════════════════════════════════
     🔴 Activo **solo en `confirmando` y solo si el riel es DeUna**. El `null`
     de las otras combinaciones no es prolijidad: **pedir un código CREA un
     intento de pago contra el proveedor**, así que sin ese freno abrir el
     resumen fabricaría una transacción que nadie pidió. */
  const enDeuna = fase === 'confirmando' && riel === 'deuna';
  const deuna = useEstadoDeUna(enDeuna ? { tipo: 'cita', id: citaId } : null);

  /* ═══ LA ESPERA — la misma pieza que la despensa ════════════════════════
     🔴 Se activa **solo en `confirmando`**: pasarle `null` en las otras fases
     es lo que impide que el checkout sondee por existir.

     🔴 **Y ES LA MISMA PARA LOS DOS RIELES, que es el punto entero.** Esta
     pieza lee **el SUJETO** (`leerEstadoCita`), no al proveedor ⇒ le da igual
     si la plata entró por Nuvei o por DeUna: *una casa, un motor, dos
     puertas.* **La transición a pagada no hubo que escribirla de nuevo.**
     Lo único que cambia es **cuánto se mira** — ver `topeDeEspera`. */
  const espera = useEsperaDeConfirmacion(
    fase === 'confirmando' ? { tipo: 'cita', id: citaId } : null,
    topeDeEspera(deuna.estado),
  );

  /** El camino a soporte del hallazgo — jamás una pantalla sin salida. */
  const irASoporte = useCallback(() => {
    void Linking.openURL(urlWhatsApp(t('cuenta.soporteDesdeCobro')));
  }, [t]);

  /* 🔴 EL HOOK SE ESCUCHA. *La lección de la despensa, cobrada el 20-ago: la
     pieza estaba bien construida, probada, y desconectada del único lugar
     donde su resultado importa — la pantalla seguía diciendo «estamos
     confirmando» 44 segundos después de que la base ya decía «pagada».* */
  useEffect(() => {
    if (espera.fase !== 'resuelta') return;
    if (espera.estado === 'pagada') { setFase('exito'); return; }
    /* 🔴 Los otros desenlaces **no se dibujan como éxito ni como rechazo**.
       Una reserva que expiró no es un pago que falló: no se cobró nada y el
       horario volvió a estar libre. Cada uno con su voz. */
    if (espera.estado === 'expirada') { setFase('holdVencido'); return; }
    if (espera.estado === 'cancelada') setFase('reservaCancelada');
  }, [espera]);

  /**
   * EL PAGO — cuatro pasos, y **el tercero no es el final**:
   *   ① el medio elegido (sin él no se toca nada)
   *   ② el débito por `pagos-cobro`, que corre las compuertas server-side
   *   ③ **la respuesta es SEÑAL OPTIMISTA, jamás confirmación**
   *   ④ confirma el webhook, o el barrido *(su cadencia está medida para
   *      tarjeta; para DeUna no — `D-887`)*
   *
   * 🔴 **Nada de esto nace por abrirse ni por re-renderizar.** Corre al TOCAR.
   */
  const pagar = useCallback(async () => {
    if (trabajando) return;

    /* 🔴 SIN CORREO Y SIN SUS DATOS NO SE COBRA. El hook valida y guarda; si
       dice que no, ya avisó por qué. *Una compra pagada cuyo comprobante no
       tiene a dónde ir es una familia que no recibe su factura.* */
    if (!(await facturacion.validarYGuardar(precio))) return;

    /* ── 🔴 EL RIEL DE DEUNA NO PASA POR `cobrar()`, y no es un atajo ───────
       `cobrar()` **debita una tarjeta**: es el riel de Nuvei entero. En DeUna
       no hay nada que debitar desde acá — *lo que hacemos es pedir seis
       dígitos para que la persona pague en OTRA app*, y la plata se mueve allá
       o no se mueve.

       ⇒ El toque **solo cambia de fase**. El código lo pide `useEstadoDeUna` al
       activarse, que es lo que vuelve cierto el freno de arriba: **la puerta
       del proveedor se toca al TOCAR, y solo al tocar.**

       ⚠️ Y **no se prende `trabajando`**: no hay viaje que esperar en este
       hilo. *Un botón que gira mientras la pantalla ya cambió promete un
       trabajo que no existe.* El «pidiendo tu código» lo dice la fase
       `cargando` de `EsperaDeUna`, que es donde de verdad se está esperando. */
    if (medio.elegido?.tipo === 'deuna') {
      setRiel('deuna');
      setFase('confirmando');
      return;
    }

    setRiel('tarjeta');
    setTrabajando(true);
    const cobro = await cobrar({ tipo: 'cita', id: citaId }, medio.idTarjeta);
    setTrabajando(false);

    if (!cobro.ok) {
      /* 🔴 Se queda en el resumen, con el hold vivo: *lo que la familia quiere
         después de un rechazo es probar con otra tarjeta.* */
      mostrar({ texto: t(cobro.voz), variante: 'error' });
      return;
    }
    setFase('confirmando');
  }, [citaId, medio.elegido, mostrar, t, trabajando]);

  const mm = String(Math.floor(restanteSeg / 60)).padStart(2, '0');
  const ss = String(restanteSeg % 60).padStart(2, '0');

  if (fase === 'confirmando') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4], padding: spacing[6] }}>
          {/* ══ 🔴 LA MISMA FASE, DOS CUERPOS (S105-C) ═══════════════════════
              `LETRA_DEUNA` §6, firma ② del founder: *«funciona exactamente
              igual que si fuera tarjeta»* — **misma pantalla, misma salida,
              misma transición sola a pagada. Lo único que cambia es el
              cuerpo.** *El cliente jamás aprende un circuito distinto por
              cambiar de medio.*

              🔴 **Y la asimetría que SÍ existe, escrita para que no sorprenda:
              en tarjeta la familia ESPERA; en DeUna la familia TRABAJA.** Por
              eso `EsperaDeTrabajo` **no se monta acá** (N15, *el movimiento se
              calla donde hay apuro*): *una rampa que dice «estamos trabajando»
              mientras la persona teclea afirma algo falso — la que trabaja es
              ella.* Lo que ocupa ese lugar es la cuenta regresiva del código,
              que es **información, no adorno**. */}
          {riel === 'deuna' ? (
            <EsperaDeUna
              estado={deuna.estado}
              onGenerarNuevo={deuna.regenerar}
              onSoporte={irASoporte}
            />
          ) : (
              <>
              {/* ⭐ **S116-C lote 7 · `EsperaLarga` — LA ESPERA LARGA DE LA CASA.**
                  ☠️ Mueren el par `Texto titulo`/`Texto cuerpo` y **la línea de
                  progreso** (`EsperaDeTrabajo`, la rampa con degradado): el
                  founder la nombró y la pieza nueva lo dice en su cabecera —
                  *no sabe cuánto falta y no lo finge*. La voz **no se pierde**:
                  la misma que estaba pasa a `titulo` y `apoyo`. */}
              <EsperaLarga titulo={t('pago.esperaTitulo')} apoyo={t('pago.esperaCuerpoCita')} />
              </>
          )}
          {/* 🔴 El tope habla y **NO declara desenlace**: la reserva sigue en
              pie y el barrido la resuelve. *Un tope que se dibuja como
              «rechazado» hace que la familia pague dos veces.*
              **Vale para los dos rieles** — en DeUna llega más tarde porque el
              tope se corre con el código, no porque se haya apagado.
              ⚠️ **La cadencia del barrido NO se afirma acá.** Medida para
              tarjeta (mismo día); **para DeUna no la medí** y su aplicador
              sigue abierto (`D-887`). */}
          {/* ── 🔴 LA VUELTA AL RESUMEN — hallazgo ② del gate del founder ────
              **«Tocó por error, quiso cambiar a tarjeta, y no hay camino de
              vuelta: hay que rehacer TODO el proceso.»**

              🔴 **Y la asimetría es la cura, no un detalle:** con DeUna esta
              fase se alcanza **SIN haber cobrado nada** —sólo se pidió un
              código—, así que volver es seguro y el hold sigue vivo. Con
              tarjeta se llega **después** de que `cobrar()` salió bien: ahí
              ofrecer «cambiar de medio» sería *invitar a pagar dos veces*.
              Por eso el botón existe **sólo en el riel DeUna**, y sólo
              mientras el estado sea `esperando`: en `aprobada` la plata ya
              entró y en `cargando` todavía no hay código que abandonar.

              ⚠️ **El borde, declarado y no disimulado:** si la persona estaba
              tecleando en su app de DeUna justo cuando vuelve, el pago puede
              llegar igual — el barrido lo resuelve, **como ya pasa hoy** con
              el «Volver al hogar» de abajo. *No se agrega un riesgo nuevo: se
              agrega una salida al que ya existía.* La política definitiva de
              ese cruce es del motor de pagos, no de esta pantalla.

              La voz dice lo que pasa con el código — *un botón que devuelve
              sin avisar que el código deja de servir manda a alguien a pagar
              con un número muerto.* */}
          {riel === 'deuna' && deuna.estado.fase === 'esperando' ? (
            <View style={{ gap: spacing[2], alignItems: 'center' }}>
              <Boton
                variante="secundario"
                etiqueta={t('checkout.cambiarMedio')}
                onPress={() => {
                  setFase('resumen');
                  setRiel(null);
                }}
              />
              <Texto variante="apoyo">{t('checkout.cambiarMedioNota')}</Texto>
            </View>
          ) : null}

          {espera.fase === 'sigue_abierta' ? (
            <>
              <Texto variante="apoyo">{t('pago.esperaSigueAbiertaCita')}</Texto>
              <Boton
                variante="secundario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar');
                }}
              />
            </>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  if (fase === 'exito') {
    /* ⭐ **S116-C lote 13 · LA CONFIRMACIÓN DE LA CASA, TAMBIÉN PARA LA CITA.**
       Recorrido 5: *«el pedido de la Despensa ya usa la confirmación de la casa
       y la quiere igual acá»*.

       ☠️ **Muere el `EstadoVacio` + glífo 48 + un botón.** Era una pantalla de
       TEXTO donde la Despensa celebra — y **son el mismo hecho**: la plata pasó
       y algo quedó agendado. *Dos cierres distintos para el mismo momento no son
       dos decisiones: son una que nadie volvió a mirar.*

       🔴 **ESTO ALCANZA A LAS CINCO PUERTAS DE UNA VEZ** — paseo, grooming,
       veterinaria, adiestramiento y guardería montan esta máquina. *Por eso la
       conversión entra acá y no cinco veces: es la misma razón por la que la
       máquina existe.*

       ── EL DATO, y por qué se reparte así ────────────────────────────────
       El encargo pide *«el dato (servicio, prestador, día y hora)»* y la pieza
       tiene **UN** par `{etiqueta, valor}`. ⇒ la etiqueta lleva **qué y con
       quién**, el valor lleva **cuándo**: *lo que la persona vuelve a mirar de
       una confirmación es la hora, así que la hora va donde la pieza pone el
       énfasis.* Los cuatro hechos entran, ninguno se inventa.

       ⚠️ **`exitoDetalle` baja a `apoyo` y `exitoIcono` MUERE**: la pieza trae su
       check y su trío, y un glífo de oficio al lado del check sería **dos signos
       para el mismo hecho**. *El oficio ya lo dice el dato.*

       ⚠️ **La línea fiscal pasa de nodo a `lineaExtra`** — el slot que la pieza
       creó para eso. Muere `LineaFacturaEnCamino` como montaje local acá. */
    const cuerpo = (
      <>
        <Confirmacion
          exclamacion={t('checkout.exitoExclamacion')}
          titulo={exitoTitulo}
          apoyo={exitoDetalle}
          dato={{
            etiqueta: [servicioNombre, prestadorNombre].filter((v) => v.length > 0).join(' · '),
            valor: fechaYHoraHumana(fecha, hora.length > 0 ? hora : null, idioma),
          }}
          lineaExtra={t('checkout.exitoFactura')}
          primario={{
            texto: t('checkout.exitoVerCita'),
            onPress: () => {
              /* La misma salida de tab que el botón viejo (`D-329`): `dismissTo`
                 sólo busca en el stack ACTUAL, y `/citas` vive fuera de Explorar. */
              if (router.canDismiss()) router.dismissAll();
              router.navigate({ pathname: '/citas/[mascotaId]', params: { mascotaId, citaId } });
            },
          }}
          secundario={{
            texto: t('checkout.exitoExplorarMas'),
            onPress: () => {
              if (router.canDismiss()) router.dismissAll();
              router.navigate('/explorar');
            },
          }}
        />
        {exitoExtra}
      </>
    );
    /* S106-C t3 · **SCROLLEA SIEMPRE**: el cuerpo lleva la confirmación entera y
       un bloque extra abajo, y en un teléfono chico lo que se pierde sin scroll
       es el final — que son las acciones. */
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: spacing[4],
            gap: spacing[5],
          }}
        >
          {cuerpo}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (fase === 'reservaCancelada') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            titulo={t('pago.esperaCanceladaCita')}
            accion={<Boton variante="primario" etiqueta={t('checkout.elegirOtro')} onPress={() => router.back()} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fase === 'holdVencido') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            titulo={t('checkout.holdVencido')}
            descripcion={t('checkout.holdVencidoDetalle')}
            accion={<Boton variante="primario" etiqueta={t('checkout.elegirOtro')} onPress={() => router.back()} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* 🔴 **EL ÚLTIMO `Encabezado` DEL CLIENTE, Y LO ENCONTRÉ CAMINANDO.**
          El lote 3b declaró «cero `Encabezado` vivos» y era cierto **sobre
          `src/app`** — que es lo que el censo de B recorría y lo que
          `verify:techos-locales` mide. *Esta máquina vive en `src/components`,
          así que ningún instrumento la miraba*, y es la pantalla del PAGO: la
          que el founder abre en cada recorrido. **La vi en una captura, no en
          un grep** — el grep que la habría encontrado es el que no corrí.

          ⇒ estructura firmada: fondo ciruela + hoja, y ☠️ muere el
          `PantallaConPie` (su pie pasa al slot de la hoja, que hace la misma
          reserva medida). Lo que el comentario viejo defendía —*«no hay razón
          de producto por la que pagar un paseo tenga menos presencia que pagar
          comida»*— **sigue en pie y ahora lo sostiene la misma pieza que la
          despensa**. */}
      <HojaContenido
        arranque={cabecera.arranque}

        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="empujada"
              titulo={t('checkout.titulo')}
              onVolver={() => router.back()}
              etiquetaVolver={t('comun.volver')}
              presentacion="fondo"
            />
          </View>
        }
        pie={
          <BotonPagar
            medio={medio}
            trabajando={trabajando}
            deshabilitadoPorLaPantalla={!puedePagar}
            onPagar={() => void pagar()}
          />
        }
      >
        {/* 🔴 **EL RELLENO VA ADENTRO DE LA HOJA, NO EN EL SCROLL.** Traduje
          `contentContainerStyle` del `ScrollView` viejo a su HOMÓNIMO en la
          hoja, y no son lo mismo: **en la hoja ese estilo envuelve A LA HOJA**,
          no a su contenido. ⇒ el padding lateral dejaba una franja de ciruela
          a cada lado, el de arriba pegaba el contenido al borde redondeado
          —«Tu paseo» salía cortado— y el de abajo separaba la hoja del piso.
          *Medido en el aparato: hoja de 996 px en pantalla de 1080 = 42 px de
          ciruela por lado, que es `spacing[4]` exacto.* */}
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          {/* el ítem (forma de carrito: hoy UNO) */}
          <View style={{ gap: spacing[2] }}>
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {resumenEtiqueta}
            </Text>
            <Tarjeta relleno="ninguno">
              {/* ── 🔴 CURA ② · QUÉ SE ESTÁ COMPRANDO, Y PRESIDE ────────────────
                  ⏪ El servicio iba de SUBTÍTULO, debajo del nombre de la
                  clínica: **estaba, y no presidía**. *En el momento del pago,
                  lo que preside es lo que se lee* — y por ahí pasó el defecto
                  del servicio preseleccionado sin que nada lo delatara.

                  🔴 **Es CINTURÓN, no cura.** Aunque la preselección nunca
                  volviera a fallar, *una pantalla de pago tiene que decir qué
                  se paga*: el cinturón vale por sí mismo, no por el defecto
                  que lo motivó.

                  Se invierten los dos: el SERVICIO al título, la clínica al
                  subtítulo con su rótulo —*«con Clínica Aurora» dice quién sin
                  competir por el renglón principal*—. La metadata no se toca. */}
              {/* ⚠️ **El riesgo que trae invertirlos, cerrado acá.** Los cuatro
                  oficios pasan `servicioNombre` con fallback `''` (medido) —
                  con el prestador en el título eso no importaba; **con el
                  servicio arriba, un vacío dejaría el renglón principal mudo**.
                  *Auditar cuatro caminos para probar que nunca llega vacío es
                  más frágil que hacer que un vacío no pueda dañar:* sin nombre
                  de servicio, el título vuelve a ser la clínica y el subtítulo
                  no se monta. */}
              <Celda
                titulo={servicioNombre.trim().length > 0 ? servicioNombre : prestadorNombre}
                subtitulo={
                  servicioNombre.trim().length > 0
                    ? t('checkout.conPrestador', { prestador: prestadorNombre })
                    : undefined
                }
                /* 🔴 **`D-1096` · ACÁ SE LEÍA «2026-09-15 · 15:00», que es el
                   ejemplo literal de lo que la firma prohíbe.** `fecha` llega
                   como parámetro de URL —ISO crudo— y la hora salía de un
                   `slice(0,5)` sobre la columna `time`. Las dos pasan por el
                   riel; los minutos siguen en `metadataMono` porque «60 min» SÍ
                   es voz de máquina (Ley 3) y la duración no es una fecha. */
                // ✅ **LA FECHA SALE DE LA FUENTE MONO (lote 3f de B).** La voz
                // ya estaba curada —`fechaYHoraHumana`— y la FUENTE seguía
                // equivocada porque `Celda` sólo tenía `metadataMono`. Pedido y
                // entregado: `metadata` es el hermano en sans, **sin
                // `toLowerCase()`** —una fecha de familia no se minuscula—.
                // ⚠️ **Los minutos se van con ella y NO se quedan en mono**, y es
                // a propósito: partir la línea en dos slots pondría «60 min» en
                // otro renglón por una diferencia de registro que nadie pidió.
                // *La línea entera es una frase; el dato de máquina que queda en
                // la tarjeta es el TOTAL, y ése sigue en `metadataMono`.*
                metadata={`${fechaYHoraHumana(fecha, hora, idioma)} · ${duracion} min`}
              />
              <Separador />
              {/* lugar hecho para el cupón (B4) — deshabilitado honesto */}
              <Celda titulo={t('checkout.cupon')} fin={<Insignia estado="info" etiqueta={t('checkout.cuponPronto')} />} />
              <Separador />
              {/* ⭐ **`DesgloseCompra` — B midió que NADIE lo montaba desde
                  S115, y el encargo lo pide acá.** Los subtotales 0 % y 15 %, el
                  IVA **visible aunque sea cero**, y la tarifa de servicio como
                  línea propia con su precio tachado mientras dure la promoción.

                  🔴 **LOS DOS NULOS SON DISTINTOS Y LA PIEZA LOS DISTINGUE:**
                  `iva: 0` SE DIBUJA —es un hecho medido: «este servicio tributa
                  cero»— y `subtotal_0: null` NO —no hay nada en esa tarifa—.
                  *Es la diferencia entre decir «cero» y no decir nada, y acá la
                  primera es información fiscal.*

                  🔴 **EL LADO DEL QUE CAE CADA SUBTOTAL LO DICE EL MOTOR**, no
                  esta pantalla: `codigo_iva` viene congelado con la cita
                  (`EC_IVA_15` / `EC_IVA_0`). *Adivinarlo acá —«los servicios
                  llevan 15»— sería exactamente el número que se contradice con
                  la factura el día que una consulta veterinaria tribute otra
                  cosa.*

                  ⚠️ **Sin desglose congelado la pieza no se monta** y queda la
                  fila del total: *un desglose a medias es peor que ninguno.* */}
              {desglose === null ? (
                <Celda titulo={t('checkout.total')} metadataMono={formatearPrecio(precio)} />
              ) : (
                <View style={{ padding: spacing[3] }}>
                  <DesgloseCompra
                    subtotal_0={desglose.codigoIva === 'EC_IVA_0' ? desglose.subtotal : null}
                    subtotal_15={desglose.codigoIva === 'EC_IVA_0' ? null : desglose.subtotal}
                    iva={desglose.impuesto}
                    total={desglose.total}
                    /* La tarifa vigente sale del MISMO registro que calculó el
                       impuesto; sin ella, la del motor de la tarifa; sin
                       ninguna, 0 — y entonces la línea del IVA dice «IVA 0 %»,
                       que con `impuesto = 0` es cierto. */
                    tarifaIva={desglose.tarifaPct ?? tarifa?.tarifaPct ?? 0}
                    /* ⚠️ **Ausente = la línea NO se dibuja**, por contrato: un
                       «Tarifa de servicio · $0,00» donde no hay tarifa afirma
                       que existe y que es gratis. Acá `tarifa === null` es
                       justamente «no pudimos leerla». */
                    /* 🔴 **LA PROMOCIÓN SE DIBUJA SIN SU «HASTA», Y ESO ES UN
                       HUECO DECLARADO — no una elección de diseño.**

                       La pieza hace `hasta` **obligatorio** cuando
                       `promocionada: true`, y con razón: *«una promoción sin
                       decir hasta cuándo no es una promoción, es un precio que
                       va a cambiar sin aviso»*. **Y el motor no lo devuelve**:
                       medido contra `tarifa_servicio_vigente`, la respuesta es
                       `{base, descuento, valor_iva, codigo_iva, tarifa_pct,
                       monto_lista, promocionada}` — **sin fecha de fin**.

                       ⏪ La primera versión escribió «diciembre» en el riel y
                       **`R84` la paró**: *«una fecha escrita en el diccionario
                       es una fecha que caduca en silencio»*. La regla tiene
                       razón y **el mes era mío, no del objeto** — lo había
                       supuesto.

                       ⇒ hasta que A exponga `vigente_hasta`, la línea se dibuja
                       como **tarifa sin promoción a su precio real de hoy, que
                       es CERO**. Es cierto —hoy no se cobra— y **no afirma un
                       plazo que nadie midió**. *Lo que se pierde es el precio
                       tachado; lo que se evita es decirle a una familia que algo
                       es gratis «hasta diciembre» y que en noviembre le
                       cobremos.* Pedido en el buzón. */
                    tarifaServicio={
                      tarifa === null ? undefined : { promocionada: false, monto: tarifa.base }
                    }
                  />
                </View>
              )}
            </Tarjeta>
          </View>

          {/* el hold, con voz honesta y el contador en voz de máquina */}
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {t('checkout.holdVoz')}
            </Text>
            <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: theme.text.tertiary, fontVariant: ['tabular-nums'] }}>
              {mm}:{ss}
            </Text>
          </View>

          {/* la sección propia del servicio (dirección del hogar / el dónde) */}
          {seccionExtra}

          {/* LOS DATOS PARA LA FACTURA — se pregunta UNA vez y se recuerda.
              🔴 No se monta mientras el tope no se sepa (`'cargando'` o
              `'sinTope'`): los dos bordes de la firma —deshabilitar «Consumidor
              final» sobre el tope, no preguntar nada bajo el tope— son el MISMO
              `if` contra ese número, y sin él la sección no puede decidir cuál
              de los dos mostrar. */}
          {facturacion.props === null ? (
              facturacion.noCargo || facturacion.reintentando ? (
                <AvisoNoCargo
                  onReintentar={facturacion.reintentar}
                  reintentando={facturacion.reintentando}
                  motivo={facturacion.motivo}
                />
              ) : null
            ) : (
            <SeccionFacturacion {...facturacion.props} total={precio} />
          )}

          {/* ②③④⑤ LA SECCIÓN DE PAGO — **la misma pieza que monta la despensa**.
              Ya no es «igual a»: es LA MISMA. */}
          <SeccionMedioDePago medio={medio} />

          {/* ☠️ ACÁ VIVÍA «Fase de pruebas: el pago es simulado» y el simulador
              `__DEV__` con sus dos pantallas (Ley 37). La banda pasó de honesta a
              falsa el día del enchufe real; el simulador **fabricaba desenlaces
              que el motor nunca dijo**. *Un simulador que sobrevive a su motor
              real no es una herramienta: es una segunda verdad.* */}
        </View>
      </HojaContenido>

      {fueraDeScroll}
    </SafeAreaView>
  );
}
