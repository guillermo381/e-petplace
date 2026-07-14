/**
 * CHECKOUT DEL PASEO — B3.3 (S54); S60-A1: la máquina (hold a la vista,
 * fases, pago simulado declarado, camino triste __DEV__) se extrajo a
 * components/checkout-reserva.tsx para que el grooming la consuma sin
 * duplicar (precedente S59-B5). Esta ruta conserva su URL y aporta LO
 * SUYO: la puerta de la dirección del hogar (D-339 — se muestra si
 * existe; si no, se captura UNA vez acá y el pago la congela en la cita
 * server-side; el CTA no paga sin dirección).
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

export default function PaseoCheckout() {
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
  }>();

  // D-339: la puerta del paseo. 'cargando' evita un flash de "sin
  // dirección" antes de saber la verdad.
  const [direccion, setDireccion] = useState<DireccionHogar | null>(null);
  const [direccionEstado, setDireccionEstado] = useState<'cargando' | 'lista'>('cargando');
  const [hojaDireccion, setHojaDireccion] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerDireccionHogar();
      if (!vigente) return;
      if (r.ok) setDireccion(r.data);
      // error de red: se queda sin dirección visible — el CTA de agregar
      // reintenta por la misma Hoja (guardar re-escribe la principal).
      setDireccionEstado('lista');
    })();
    return () => {
      vigente = false;
    };
  }, []);

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
      exitoIcono="paseo"
      puedePagar={direccionEstado !== 'cargando' && direccion !== null}
      seccionExtra={
        <View style={{ gap: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
            {t('checkout.direccionTitulo')}
          </Text>
          {direccionEstado === 'cargando' ? null : direccion !== null ? (
            <Tarjeta relleno="ninguno">
              <Celda
                titulo={direccion.direccion}
                subtitulo={[direccion.sector, direccion.ciudad].filter(Boolean).join(' · ')}
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
                {t('checkout.direccionVoz')}
              </Text>
              <Boton variante="secundario" etiqueta={t('checkout.direccionAgregar')} bloque onPress={() => setHojaDireccion(true)} />
            </View>
          )}
        </View>
      }
      fueraDeScroll={
        /* D-339: la captura de la dirección — el MISMO formulario de
           Cuenta·Tu dirección, en Hoja (una vez, jamás en cada reserva) */
        <Hoja visible={hojaDireccion} onCerrar={() => setHojaDireccion(false)} titulo={t('direccion.titulo')} conCerrar>
          {/* Cura S56 (orden founder): el teclado no tapa el campo activo */}
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
                  inicial={direccion}
                  onGuardada={(d) => {
                    setDireccion(d);
                    setHojaDireccion(false);
                  }}
                />
              </View>
            </HojaScroll>
          </KeyboardAvoidingView>
        </Hoja>
      }
    />
  );
}
