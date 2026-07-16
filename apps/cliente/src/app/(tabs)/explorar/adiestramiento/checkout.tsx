/**
 * CHECKOUT DE LA SESIÓN SUELTA DE ADIESTRAMIENTO (S63-A Bloque 3) —
 * consume la máquina compartida (components/checkout-reserva.tsx) con
 * la voz del oficio (cura S60-C1: la máquina no conoce keys). Lo propio:
 * EL DÓNDE de la sede del adiestrador (solo lectura, NULL-honesto — las
 * modalidades finas §3 esperan S64-B0). El precio es el SNAPSHOT del
 * hold; acá jamás se re-resuelve nada.
 *
 * TESIS: "Lo que vas a pagar es exactamente lo que viste, y el pago de
 * hoy es simulado y lo dice."
 * FIRMA: la heredada de la máquina compartida (el contador del hold en
 * voz de máquina) — este consumidor no suma acentos.
 */

import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Celda, Tarjeta, spacing, typography, useTheme } from '@epetplace/ui';
import { CheckoutReserva } from '@/components/checkout-reserva';
import { useTraduccion } from '@/i18n';

export default function AdiestramientoCheckout() {
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

  const direccionSede = typeof params.direccion === 'string' && params.direccion.length > 0 ? params.direccion : null;
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
      exitoIcono="training"
      resumenEtiqueta={t('adiestramiento.checkoutResumen')}
      exitoTitulo={t('adiestramiento.exitoTitulo')}
      exitoDetalle={t('adiestramiento.exitoDetalle')}
      puedePagar
      seccionExtra={
        <View style={{ gap: spacing[2] }}>
          <Text
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.sm,
              color: theme.text.secondary,
            }}
          >
            {t('adiestramiento.dondeTitulo')}
          </Text>
          <Tarjeta relleno="ninguno">
            <Celda
              titulo={direccionSede ?? t('adiestramiento.lugarPorConfirmar')}
              subtitulo={direccionSede !== null ? ciudad ?? undefined : undefined}
            />
          </Tarjeta>
        </View>
      }
    />
  );
}
