/**
 * CHECKOUT DEL GROOMING (S60-A1; S61-A6 D-392) — consume la máquina
 * compartida (components/checkout-reserva.tsx). Lo propio del grooming:
 * EL DÓNDE por MODALIDAD — 'local' = la sede del groomer solo lectura,
 * NULL-honesta (v1 de siempre) · 'domicilio' = la dirección DEL HOGAR,
 * clon del bloque del paseo (D-339: se muestra si existe, se captura
 * UNA vez acá, el pago la congela server-side y el CTA no paga sin
 * ella — el motor además guarda direccion_requerida).
 *
 * El precio mostrado es el SNAPSHOT del hold — el server lo congeló por
 * talla + extra + recargo (S61); acá jamás se re-resuelve nada. El
 * DESGLOSE viaja del QUIÉN (server-side) y solo se DECLARA.
 */

import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  Hoja,
  HojaScroll,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerDireccionHogar, type DireccionHogar } from '@epetplace/api';
import { CheckoutReserva } from '@/components/checkout-reserva';
import { DireccionHogarForm } from '@/components/direccion-hogar-form';
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
    modalidad?: string;
    precioBase?: string;
    extraPelaje?: string;
    recargoDomicilio?: string;
  }>();

  const direccionSede = typeof params.direccion === 'string' && params.direccion.length > 0 ? params.direccion : null;
  const ciudad = typeof params.ciudad === 'string' && params.ciudad.length > 0 ? params.ciudad : null;
  const esDomicilio = params.modalidad === 'domicilio';
  const extraPelaje = Number(params.extraPelaje ?? 0);
  const recargoDomicilio = Number(params.recargoDomicilio ?? 0);
  const precioBase = Number(params.precioBase ?? 0);

  // D-339 heredado (solo domicilio): la puerta de la dirección del hogar.
  const [direccionHogar, setDireccionHogar] = useState<DireccionHogar | null>(null);
  const [direccionEstado, setDireccionEstado] = useState<'cargando' | 'lista'>('cargando');
  const [hojaDireccion, setHojaDireccion] = useState(false);

  useEffect(() => {
    if (!esDomicilio) {
      setDireccionEstado('lista');
      return;
    }
    let vigente = true;
    void (async () => {
      const r = await obtenerDireccionHogar();
      if (!vigente) return;
      if (r.ok) setDireccionHogar(r.data);
      setDireccionEstado('lista');
    })();
    return () => {
      vigente = false;
    };
  }, [esDomicilio]);

  // El desglose se DECLARA solo cuando hay algo que desglosar (Chanel:
  // sin extra ni recargo, el total ya lo dice todo).
  const hayDesglose = extraPelaje > 0 || recargoDomicilio > 0;

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
      puedePagar={!esDomicilio || (direccionEstado !== 'cargando' && direccionHogar !== null)}
      seccionExtra={
        <View style={{ gap: spacing[4] }}>
          {/* EL DÓNDE por modalidad (S61-A6) */}
          <View style={{ gap: spacing[2] }}>
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {esDomicilio ? t('grooming.dondeDomicilioTitulo') : t('grooming.dondeTitulo')}
            </Text>
            {!esDomicilio ? (
              /* la sede del groomer, solo lectura (v1 de siempre) */
              <Tarjeta relleno="ninguno">
                <Celda
                  titulo={direccionSede ?? t('grooming.enSuLocal')}
                  subtitulo={direccionSede !== null ? ciudad ?? undefined : undefined}
                />
              </Tarjeta>
            ) : direccionEstado === 'cargando' ? null : direccionHogar !== null ? (
              <Tarjeta relleno="ninguno">
                <Celda
                  titulo={direccionHogar.direccion}
                  subtitulo={[direccionHogar.sector, direccionHogar.ciudad].filter(Boolean).join(' · ')}
                  fin={
                    <Boton
                      variante="ghost"
                      tamaño="sm"
                      etiqueta={t('checkout.direccionCambiar')}
                      onPress={() => setHojaDireccion(true)}
                    />
                  }
                />
              </Tarjeta>
            ) : (
              <View style={{ gap: spacing[2] }}>
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
                  {t('grooming.direccionDomicilioVoz')}
                </Text>
                <Boton variante="secundario" etiqueta={t('checkout.direccionAgregar')} bloque onPress={() => setHojaDireccion(true)} />
              </View>
            )}
          </View>

          {/* EL DESGLOSE — server-side, declarado (S61-A6) */}
          {hayDesglose ? (
            <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {[
                `${t('grooming.desgloseServicio')} $${precioBase.toFixed(2)}`,
                extraPelaje > 0 ? `${t('grooming.desgloseExtraPelaje')} +$${extraPelaje.toFixed(2)}` : null,
                recargoDomicilio > 0 ? `${t('grooming.desgloseDomicilio')} +$${recargoDomicilio.toFixed(2)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          ) : null}
        </View>
      }
      fueraDeScroll={
        esDomicilio ? (
          /* D-339 heredado: el MISMO formulario de dirección, en Hoja */
          <Hoja visible={hojaDireccion} onCerrar={() => setHojaDireccion(false)} titulo={t('direccion.titulo')} conCerrar>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <HojaScroll>
                <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      lineHeight: typography.size.sm * 1.4,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('direccion.voz')}
                  </Text>
                  <DireccionHogarForm
                    inicial={direccionHogar}
                    onGuardada={(d) => {
                      setDireccionHogar(d);
                      setHojaDireccion(false);
                    }}
                  />
                </View>
              </HojaScroll>
            </KeyboardAvoidingView>
          </Hoja>
        ) : undefined
      }
    />
  );
}
