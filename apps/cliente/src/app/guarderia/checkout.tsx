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
 * ── LA HORA NO SE INVENTA ───────────────────────────────────────────────
 * Una estadía-día **no tiene hora**: tiene dos ventanas. Por eso `hora` viaja
 * con la ventana de recogida en voz de la casa y no con un `00:00` que no
 * significa nada — *un dato vacío con forma de dato es peor que su ausencia.*
 */

import { useLocalSearchParams } from 'expo-router';

import { CheckoutReserva } from '@/components/checkout-reserva';
import { useTraduccion } from '@/i18n';

export default function CheckoutGuarderia() {
  const { t } = useTraduccion();
  const params = useLocalSearchParams();

  const texto = (k: string): string => (typeof params[k] === 'string' ? (params[k] as string) : '');

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
