/**
 * CHECKOUT DE VETERINARIA (S68-A2) — consume la máquina compartida
 * (components/checkout-reserva.tsx). Lo propio del vet: EL DÓNDE —
 * 'local' = la clínica solo lectura, NULL-honesta · 'domicilio'
 * (urgencia_domicilio) = la dirección DEL HOGAR, herencia VERBATIM del
 * bloque D-339 del grooming (se muestra si existe, se captura UNA vez
 * acá, el pago la congela server-side y el CTA no paga sin ella — el
 * motor además guarda direccion_requerida).
 *
 * El precio mostrado es el SNAPSHOT del hold — el server lo congeló;
 * acá jamás se re-resuelve nada.
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

export default function VeterinariaCheckout() {
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
  }>();

  const direccionSede = typeof params.direccion === 'string' && params.direccion.length > 0 ? params.direccion : null;
  const ciudad = typeof params.ciudad === 'string' && params.ciudad.length > 0 ? params.ciudad : null;
  const esDomicilio = params.modalidad === 'domicilio';

  // D-339 heredado (solo urgencia a domicilio): la puerta de la dirección.
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
      exitoIcono="veterinaria"
      resumenEtiqueta={t('veterinaria.checkoutResumen')}
      exitoTitulo={t('veterinaria.exitoTitulo')}
      exitoDetalle={t('veterinaria.exitoDetalle')}
      puedePagar={!esDomicilio || (direccionEstado !== 'cargando' && direccionHogar !== null)}
      seccionExtra={
        <View style={{ gap: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
            {esDomicilio ? t('veterinaria.dondeDomicilioTitulo') : t('veterinaria.dondeTitulo')}
          </Text>
          {!esDomicilio ? (
            /* la clínica, solo lectura — NULL honesta */
            <Tarjeta relleno="ninguno">
              <Celda
                titulo={direccionSede ?? t('veterinaria.enSuClinica')}
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
                {t('veterinaria.direccionDomicilioVoz')}
              </Text>
              <Boton variante="secundario" etiqueta={t('checkout.direccionAgregar')} bloque onPress={() => setHojaDireccion(true)} />
            </View>
          )}
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
