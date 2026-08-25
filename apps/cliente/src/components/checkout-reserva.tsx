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
  Boton,
  Celda,
  Encabezado,
  EsperaDeTrabajo,
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
import { cobrar } from '@/lib/pagos/cobro';
import { useEsperaDeConfirmacion } from '@/lib/pagos/espera-confirmacion';
import { EsperaDeUna } from '@/components/espera-deuna';
import { topeDeEspera, useEstadoDeUna } from '@/lib/pagos/deuna-estado';
import { urlWhatsApp } from '@/lib/contacto';
import { useTraduccion } from '@/i18n';

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
  expiraEn,
  precio,
  prestadorNombre,
  servicioNombre,
  fecha,
  hora,
  duracion,
  exitoIcono,
  resumenEtiqueta,
  exitoTitulo,
  exitoDetalle,
  puedePagar,
  seccionExtra,
  fueraDeScroll,
}: {
  citaId: string;
  expiraEn: string;
  precio: number;
  prestadorNombre: string;
  servicioNombre: string;
  fecha: string;
  hora: string;
  duracion: string;
  /** El ícono b′ del éxito — el oficio firma su cierre. */
  exitoIcono: 'paseo' | 'grooming' | 'training' | 'veterinaria';
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
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
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
              <Texto variante="titulo">{t('pago.esperaTitulo')}</Texto>
              <Texto variante="cuerpo">{t('pago.esperaCuerpoCita')}</Texto>
              {/* ⑦ La rampa que trabaja — la MISMA que la despensa. */}
              <EsperaDeTrabajo />
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
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            icono={<Icono nombre={exitoIcono} tamano={48} />}
            titulo={exitoTitulo}
            descripcion={exitoDetalle}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  // D-329: dismissTo solo busca en el stack ACTUAL
                  // (Explorar) — /hogar vive en otro tab y el CTA no
                  // navegaba. Se vacía el stack de Explorar (si hay
                  // algo que vaciar — deep link entra directo) y recién
                  // ahí se cambia de tab.
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar');
                }}
              />
            }
          />
        </View>
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
      <Encabezado variante="navegacion" titulo={t('checkout.titulo')} atras onAtras={() => router.back()} />
      {/* ① EL PIE FIJO — **el mismo que la despensa**. Antes el botón de pagar
          vivía suelto en el scroll y era chico; *no hay una razón de producto
          por la que pagar un paseo tenga menos presencia que pagar comida.*
          `PantallaConPie` además RESERVA el alto del pie midiéndolo, así que la
          sección de pago deja de quedar debajo del botón. */}
      <PantallaConPie
        contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}
        pie={
          <BotonPagar
            medio={medio}
            trabajando={trabajando}
            deshabilitadoPorLaPantalla={!puedePagar}
            onPagar={() => void pagar()}
          />
        }
      >
        {/* el ítem (forma de carrito: hoy UNO) */}
        <View style={{ gap: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
            {resumenEtiqueta}
          </Text>
          <Tarjeta relleno="ninguno">
            <Celda
              titulo={prestadorNombre}
              subtitulo={servicioNombre}
              metadataMono={`${fecha} · ${hora.slice(0, 5)} · ${duracion} min`}
            />
            <Separador />
            {/* lugar hecho para el cupón (B4) — deshabilitado honesto */}
            <Celda titulo={t('checkout.cupon')} fin={<Insignia estado="info" etiqueta={t('checkout.cuponPronto')} />} />
            <Separador />
            <Celda titulo={t('checkout.total')} metadataMono={`$${precio.toFixed(2)}`} />
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

        {/* ②③④⑤ LA SECCIÓN DE PAGO — **la misma pieza que monta la despensa**.
            Ya no es «igual a»: es LA MISMA. */}
        <SeccionMedioDePago medio={medio} />

        {/* ☠️ ACÁ VIVÍA «Fase de pruebas: el pago es simulado» y el simulador
            `__DEV__` con sus dos pantallas (Ley 37). La banda pasó de honesta a
            falsa el día del enchufe real; el simulador **fabricaba desenlaces
            que el motor nunca dijo**. *Un simulador que sobrevive a su motor
            real no es una herramienta: es una segunda verdad.* */}
      </PantallaConPie>

      {fueraDeScroll}
    </SafeAreaView>
  );
}
