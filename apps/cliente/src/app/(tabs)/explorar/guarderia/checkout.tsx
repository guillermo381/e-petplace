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

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Celda, Encabezado, EstadoVacio, Icono, Tarjeta, Texto, spacing, useAviso, useTheme } from '@epetplace/ui';
import {
  comprarPaqueteGuarderia,
  reservarDiaGuarderia,
  contratarMensualidadGuarderia,
  reservarDiaDePaqueteGuarderia,
} from '@epetplace/api';

import { CheckoutReserva } from '@/components/checkout-reserva';
import { SeccionMedioDePago, useMedioDePago } from '@/components/seccion-medio-de-pago';
import { SeccionDireccion, useDireccionEntrega } from '@/components/seccion-direccion';
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

  /* La sección de pago sólo se activa donde hace falta elegir tarjeta. */
  const medio = useMedioDePago(esMensual);
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


  const [enviando, setEnviando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);
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

  const rebotar = useCallback(
    (codigo: string, mensaje: string) => {
      setRebote(mensaje);
      /* Nombrar el rebote es la mitad; la otra es que lleve a donde se
         resuelve — la misma cura que las cuatro ramas de la pantalla 4. */
      if (codigo === 'documentos_sin_aceptar') router.push('/guarderia/documentos');
    },
    [router],
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

  const pagar = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    setRebote(null);
    const prestadorId = texto('prestadorId');
    const mascotaId = texto('mascotaId');
    const fecha = texto('fecha');

    if (esMensual) {
      if (medio.idTarjeta === null) { setEnviando(false); setRebote(t('lugarGuarderia.faltaTarjeta')); return; }
      /* 🔴 EN LA MENSUALIDAD LA DIRECCIÓN VA EN EL MANDATO, igual que el
         medio de pago: **las citas del plan las crea el reloj, sin nadie
         presente.** Se resuelve AL FIRMAR y jamás al cobrar — dejarla para
         después la volvería un dato de la sesión del reloj, y la familia
         habría autorizado una dirección que puede haber cambiado. */
      const r = await contratarMensualidadGuarderia({
        prestadorId, tarjetaId: medio.idTarjeta, mascotaId, direccionId: dir.direccionId ?? undefined,
      });
      setEnviando(false);
      if (!r.ok) { rebotar(r.codigo, r.mensaje); return; }
      setExito({ titulo: t('checkoutGuarderia.mensualExito'), detalle: t('checkoutGuarderia.mensualExitoDetalle') });
      return;
    }

    /* PAQUETE — dos llamadas, un solo acto: comprar el bono y agendar su
       primera estadía. *Meterlas en una sola RPC habría atado el paquete a un
       día, y el paquete es del HOGAR.* */
    const compra = await comprarPaqueteGuarderia({ prestadorId, tamano: Number(params.tamano ?? 0) });
    if (!compra.ok) { setEnviando(false); rebotar(compra.codigo, compra.mensaje); return; }
    const primera = await reservarDiaDePaqueteGuarderia({
      bonoId: compra.data.bonoId, fecha, mascotaId, direccionId: dir.direccionId ?? undefined,
    });
    setEnviando(false);
    if (!primera.ok) {
      /* 🔴 EL BONO YA EXISTE. *Decir sólo «no se pudo» sobre una compra que SÍ
         ocurrió dejaría a la familia creyendo que perdió la plata.* */
      rebotar(primera.codigo, t('lugarGuarderia.paqueteSinPrimera', { mensaje: primera.mensaje }));
      return;
    }
    setExito({
      titulo: t('checkoutGuarderia.paqueteExito'),
      detalle: t('lugarGuarderia.paqueteListo', { n: primera.data.saldoRestante }),
    });
  }, [enviando, esMensual, medio.idTarjeta, params.tamano, mostrar, rebotar, router, t]);

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
                  : esPaquete
                    ? t('checkoutGuarderia.paqueteServicio', { n: texto('tamano') })
                    : t('checkoutGuarderia.servicio')
              }
              subtitulo={texto('prestadorNombre')}
              metadataMono={texto('fecha')}
            />
            <Celda titulo={t('checkout.total')} metadataMono={texto('precio')} />
          </Tarjeta>

          {/* A DÓNDE PASAN A BUSCARLO — antes del medio de pago: primero
              dónde, después con qué. */}
          <SeccionDireccion
            dir={dir}
            rotulo={t('checkoutGuarderia.dondeRecogen')}
            apoyo={esMensual ? t('checkoutGuarderia.dondeRecogenMensual') : undefined}
          />

          {esMensual ? (
            <>
              <SeccionMedioDePago medio={medio} />
              <Texto variante="apoyo">{t('lugarGuarderia.mensualMandato')}</Texto>
            </>
          ) : esPaquete ? (
            /* 🔴 EL PAQUETE NO ELIGE TARJETA: el cobro es SIMULADO y la
               pantalla lo dice. *Un cobro simulado que la superficie presenta
               como real es la clase de mentira que esta casa persigue.*
               ⏪ **Esta línea se colaba en el DÍA**: al unificar los cuerpos
               quedó como el `else` de «¿es mensual?», y el día no es paquete.
               *El día sí tiene cobro real, con su hold — decirle que es
               simulado era mentirle al revés.* */
            <Texto variante="apoyo">{t('checkoutGuarderia.paqueteSimulado')}</Texto>
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
            deshabilitado={esMensual && medio.idTarjeta === null}
            razonDeshabilitado={t('lugarGuarderia.faltaTarjeta')}
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
      /* No hay dirección que elegir: pasan a buscarlo por su casa. */
      puedePagar
    />
  );
}
