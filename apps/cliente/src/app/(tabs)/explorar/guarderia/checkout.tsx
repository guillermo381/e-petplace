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
import { Boton, Celda, Encabezado, Tarjeta, Texto, spacing, useAviso, useTheme } from '@epetplace/ui';
import {
  comprarPaqueteGuarderia,
  contratarMensualidadGuarderia,
  reservarDiaDePaqueteGuarderia,
} from '@epetplace/api';

import { CheckoutReserva } from '@/components/checkout-reserva';
import { SeccionMedioDePago, useMedioDePago } from '@/components/seccion-medio-de-pago';
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
  const [enviando, setEnviando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);

  const rebotar = useCallback(
    (codigo: string, mensaje: string) => {
      setRebote(mensaje);
      /* Nombrar el rebote es la mitad; la otra es que lleve a donde se
         resuelve — la misma cura que las cuatro ramas de la pantalla 4. */
      if (codigo === 'documentos_sin_aceptar') router.push('/guarderia/documentos');
    },
    [router],
  );

  const pagar = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    setRebote(null);
    const prestadorId = texto('prestadorId');
    const mascotaId = texto('mascotaId');
    const fecha = texto('fecha');

    if (esMensual) {
      if (medio.idTarjeta === null) { setEnviando(false); setRebote(t('lugarGuarderia.faltaTarjeta')); return; }
      const r = await contratarMensualidadGuarderia({ prestadorId, tarjetaId: medio.idTarjeta, mascotaId });
      setEnviando(false);
      if (!r.ok) { rebotar(r.codigo, r.mensaje); return; }
      mostrar({ texto: t('lugarGuarderia.mensualFirmada'), variante: 'exito' });
      if (router.canDismiss()) router.dismissAll();
      router.navigate('/hogar/guarderia');
      return;
    }

    /* PAQUETE — dos llamadas, un solo acto: comprar el bono y agendar su
       primera estadía. *Meterlas en una sola RPC habría atado el paquete a un
       día, y el paquete es del HOGAR.* */
    const compra = await comprarPaqueteGuarderia({ prestadorId, tamano: Number(params.tamano ?? 0) });
    if (!compra.ok) { setEnviando(false); rebotar(compra.codigo, compra.mensaje); return; }
    const primera = await reservarDiaDePaqueteGuarderia({ bonoId: compra.data.bonoId, fecha, mascotaId });
    setEnviando(false);
    if (!primera.ok) {
      /* 🔴 EL BONO YA EXISTE. *Decir sólo «no se pudo» sobre una compra que SÍ
         ocurrió dejaría a la familia creyendo que perdió la plata.* */
      rebotar(primera.codigo, t('lugarGuarderia.paqueteSinPrimera', { mensaje: primera.mensaje }));
      return;
    }
    mostrar({ texto: t('lugarGuarderia.paqueteListo', { n: primera.data.saldoRestante }), variante: 'exito' });
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/hogar/guarderia');
  }, [enviando, esMensual, medio.idTarjeta, params.tamano, mostrar, rebotar, router, t]);

  if (esPaquete || esMensual) {
    return (
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" atras titulo={t('checkout.titulo')} onAtras={() => router.back()} />
        <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}>
          <Texto variante="seccion">{t('checkout.resumen')}</Texto>
          <Tarjeta relleno="ninguno">
            <Celda
              titulo={esMensual ? t('checkoutGuarderia.mensualServicio') : t('checkoutGuarderia.paqueteServicio', { n: texto('tamano') })}
              subtitulo={texto('prestadorNombre')}
              metadataMono={texto('fecha')}
            />
            <Celda titulo={t('checkout.total')} metadataMono={texto('precio')} />
          </Tarjeta>

          {esMensual ? (
            <>
              <SeccionMedioDePago medio={medio} />
              <Texto variante="apoyo">{t('lugarGuarderia.mensualMandato')}</Texto>
            </>
          ) : (
            /* 🔴 EL PAQUETE NO ELIGE TARJETA: el cobro es SIMULADO y la
               pantalla lo dice. *Un cobro simulado que la superficie presenta
               como real es la clase de mentira que esta casa persigue.* */
            <Texto variante="apoyo">{t('checkoutGuarderia.paqueteSimulado')}</Texto>
          )}

          {rebote !== null ? <Texto variante="cuerpo">{rebote}</Texto> : null}
        </ScrollView>
        <View style={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[4] }}>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('checkout.pagar')}
            cargando={enviando}
            deshabilitado={esMensual && medio.idTarjeta === null}
            razonDeshabilitado={t('lugarGuarderia.faltaTarjeta')}
            onPress={() => void pagar()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CheckoutReserva
      citaId={texto('citaId')}
      expiraEn={texto('expiraEn')}
      precio={Number(params.precio ?? 0)}
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
