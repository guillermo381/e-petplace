/**
 * EXPLORAR v1 — descubrimiento DELIBERADO (S51-B2.4, DISEÑO_EXPERIENCIA
 * §8): para cuando el dueño BUSCA. Tres bloques:
 *   1. Servicios ACTIVOS por country_config (la DB dice la verdad —
 *      regla 21; cero hardcode). v1 son fichas informativas SIN CTA
 *      muerta: agendar llega con A2 y se dice honesto.
 *   2. Refugios/adopción (M0, día 1): hoy 0 refugios en DB → vacío
 *      digno que dice la verdad.
 *   3. "Próximamente honesto" — sin fechas prometidas (hotel,
 *      guardería, seguros, telemedicina, Prime preparado-apagado).
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerServiciosPais, type ServiciosPais } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

// El soft launch es Ecuador (DEFINICION_SOFTLAUNCH); el país del
// usuario llega con el riel de país del ciclo B1.
const PAIS_SOFT_LAUNCH = 'EC';

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.sm,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: theme.text.tertiary,
      }}
    >
      {texto}
    </Text>
  );
}

export default function Explorar() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [servicios, setServicios] = useState<ServiciosPais | 'cargando' | 'error'>('cargando');

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerServiciosPais(PAIS_SOFT_LAUNCH).then((r) => {
        if (vigente) setServicios(r.ok ? r.data : 'error');
      });
      return () => {
        vigente = false;
      };
    }, []),
  );

  // vertical activa → su ficha (nombre + voz); las inactivas van a
  // "próximamente" — la config es la verdad, el layout solo la lee.
  const fichasActivas: Array<{ clave: string; titulo: string; detalle: string }> = [];
  const proximamente: string[] = [];
  if (servicios !== 'cargando' && servicios !== 'error') {
    if (servicios.walking) fichasActivas.push({ clave: 'paseo', titulo: t('explorar.servicioPaseo'), detalle: t('explorar.servicioPaseoDetalle') });
    if (servicios.grooming) fichasActivas.push({ clave: 'grooming', titulo: t('explorar.servicioGrooming'), detalle: t('explorar.servicioGroomingDetalle') });
    if (servicios.veterinary) fichasActivas.push({ clave: 'vet', titulo: t('explorar.servicioVet'), detalle: t('explorar.servicioVetDetalle') });
    if (servicios.training) fichasActivas.push({ clave: 'adiestramiento', titulo: t('explorar.servicioAdiestramiento'), detalle: t('explorar.servicioAdiestramientoDetalle') });
    if (!servicios.hotel) proximamente.push(t('explorar.proxHotel'), t('explorar.proxGuarderia'));
    if (!servicios.insurance) proximamente.push(t('explorar.proxSeguros'));
    if (!servicios.telemedicine) proximamente.push(t('explorar.proxTelemedicina'));
    if (!servicios.prime) proximamente.push(t('explorar.proxPrime'));
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
        <Encabezado variante="portada" saludo={t('explorar.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          {/* ── Servicios activos ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('explorar.servicios')} />
            {servicios === 'cargando' ? (
              <EsqueletoGrupo>
                <View style={{ gap: spacing[3] }}>
                  <Esqueleto forma="bloque" ancho="100%" alto={72} />
                  <Esqueleto forma="bloque" ancho="100%" alto={72} />
                </View>
              </EsqueletoGrupo>
            ) : servicios === 'error' ? (
              <EstadoVacio
                titulo={t('explorar.error')}
                descripcion={t('hogar.errorHistoriaDetalle')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setServicios('cargando')} />}
              />
            ) : (
              <View style={{ gap: spacing[3] }}>
                {fichasActivas.map((f) => (
                  <Tarjeta key={f.clave}>
                    <View style={{ gap: spacing[1] }}>
                      <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                        {f.titulo}
                      </Text>
                      <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
                        {f.detalle}
                      </Text>
                    </View>
                  </Tarjeta>
                ))}
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
                  {t('explorar.agendarLlega')}
                </Text>
              </View>
            )}
          </View>

          {/* ── Refugios / adopción (M0) ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('explorar.refugios')} />
            <EstadoVacio titulo={t('explorar.refugiosVacio')} descripcion={t('explorar.refugiosVacioDetalle')} />
          </View>

          {/* ── Próximamente honesto (sin fechas) ── */}
          {proximamente.length > 0 ? (
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('explorar.proximamente')} />
              <Tarjeta relleno="ninguno">
                {proximamente.map((nombre, i) => (
                  <View key={nombre}>
                    {i > 0 ? <Separador /> : null}
                    <Celda titulo={nombre} fin={<Insignia estado="proximo" etiqueta={t('explorar.proximamente')} />} />
                  </View>
                ))}
              </Tarjeta>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
