/**
 * CHECKOUT DEL GROOMING (S60-A1) — consume la máquina compartida
 * (components/checkout-reserva.tsx: hold 15' a la vista, pago SIMULADO
 * declarado, camino triste __DEV__). Lo propio del grooming: EL DÓNDE
 * (condición 4 del visto) — v1 es EN EL LOCAL (D-380: el domicilio no
 * se dibuja), la dirección de la sede viaja del QUIÉN y se pinta solo
 * lectura, NULL-honesta. SIN captura de dirección del hogar (esa puerta
 * es del paseo, D-339): el CTA paga siempre.
 *
 * El precio mostrado es el SNAPSHOT del hold — el server lo congeló por
 * talla + extra (S59-A5); acá jamás se re-resuelve nada.
 */

import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Celda, Tarjeta, spacing, typography, useTheme } from '@epetplace/ui';
import { CheckoutReserva } from '@/components/checkout-reserva';
import { useTraduccion } from '@/i18n';

export default function GroomingCheckout() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const params = useLocalSearchParams<{
    citaId: string;
    expiraEn: string;
    precio: string;
    prestadorNombre: string;
    servicioNombre: string;
    fecha: string;
    hora: string;
    duracion: string;
    direccion: string;
    ciudad: string;
  }>();

  const direccion = typeof params.direccion === 'string' && params.direccion.length > 0 ? params.direccion : null;
  const ciudad = typeof params.ciudad === 'string' && params.ciudad.length > 0 ? params.ciudad : null;

  return (
    <CheckoutReserva
      citaId={typeof params.citaId === 'string' ? params.citaId : ''}
      expiraEn={typeof params.expiraEn === 'string' ? params.expiraEn : ''}
      precio={Number(params.precio ?? 0)}
      prestadorNombre={typeof params.prestadorNombre === 'string' ? params.prestadorNombre : ''}
      servicioNombre={typeof params.servicioNombre === 'string' ? params.servicioNombre : ''}
      fecha={typeof params.fecha === 'string' ? params.fecha : ''}
      hora={typeof params.hora === 'string' ? params.hora : ''}
      duracion={typeof params.duracion === 'string' ? params.duracion : ''}
      exitoIcono="grooming"
      resumenEtiqueta={t('grooming.checkoutResumen')}
      exitoTitulo={t('grooming.exitoTitulo')}
      exitoDetalle={t('grooming.exitoDetalle')}
      puedePagar
      seccionExtra={
        /* EL DÓNDE — el dueño tiene que saber a dónde llevar a su
           mascota (condición 4): la sede del groomer, solo lectura */
        <View style={{ gap: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
            {t('grooming.dondeTitulo')}
          </Text>
          <Tarjeta relleno="ninguno">
            <Celda
              titulo={direccion ?? t('grooming.enSuLocal')}
              subtitulo={direccion !== null ? ciudad ?? undefined : undefined}
            />
          </Tarjeta>
        </View>
      }
    />
  );
}
