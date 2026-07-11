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
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import type { ReactNode } from 'react';
import { obtenerServiciosPais, type ServiciosPais } from '@epetplace/api';

import {
  IconoServicioAdiestramiento,
  IconoServicioGrooming,
  IconoServicioPaseo,
  IconoServicioVet,
} from '@/components/iconos-servicios';
import { useTraduccion } from '@/i18n';

// El soft launch es Ecuador (DEFINICION_SOFTLAUNCH); el país del
// usuario llega con el riel de país del ciclo B1.
const PAIS_SOFT_LAUNCH = 'EC';

// S52-P4b sistémico: títulos humanizados — sentence case, sin eyebrow.
function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.md,
        color: theme.text.primary,
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

  // vertical activa → su ficha (ícono en el hex puro de su capa —
  // registro gráfico, Ley 12 — + nombre + voz); las inactivas van a
  // "próximamente" — la config es la verdad, el layout solo la lee.
  const colorServicio = theme.capa.cuidado;
  const fichasActivas: Array<{ clave: string; titulo: string; detalle: string; icono: ReactNode }> = [];
  const proximamente: string[] = [];
  if (servicios !== 'cargando' && servicios !== 'error') {
    if (servicios.walking) fichasActivas.push({ clave: 'paseo', titulo: t('explorar.servicioPaseo'), detalle: t('explorar.servicioPaseoDetalle'), icono: <IconoServicioPaseo color={colorServicio} /> });
    if (servicios.grooming) fichasActivas.push({ clave: 'grooming', titulo: t('explorar.servicioGrooming'), detalle: t('explorar.servicioGroomingDetalle'), icono: <IconoServicioGrooming color={colorServicio} /> });
    if (servicios.veterinary) fichasActivas.push({ clave: 'vet', titulo: t('explorar.servicioVet'), detalle: t('explorar.servicioVetDetalle'), icono: <IconoServicioVet color={colorServicio} /> });
    if (servicios.training) fichasActivas.push({ clave: 'adiestramiento', titulo: t('explorar.servicioAdiestramiento'), detalle: t('explorar.servicioAdiestramientoDetalle'), icono: <IconoServicioAdiestramiento color={colorServicio} /> });
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                      {f.icono}
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                          {f.titulo}
                        </Text>
                        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
                          {f.detalle}
                        </Text>
                      </View>
                    </View>
                  </Tarjeta>
                ))}
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
                  {t('explorar.agendarLlega')}
                </Text>
              </View>
            )}
          </View>

          {/* ── Refugios / adopción (M0) — vacío SERENO (P5b) ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('explorar.refugios')} />
            <EstadoVacio registro="seccion" titulo={t('explorar.refugiosVacio')} descripcion={t('explorar.refugiosVacioDetalle')} />
          </View>

          {/* ── Próximamente honesto — UNA sección, filas serenas en
              texto secundario (P5c: el muro de Insignias ochre murió;
              el título de la sección ya dice todo) ── */}
          {proximamente.length > 0 ? (
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('explorar.proximamente')} />
              <Tarjeta relleno="ninguno">
                {proximamente.map((nombre, i) => (
                  <View key={nombre}>
                    {i > 0 ? <Separador /> : null}
                    <View style={{ paddingHorizontal: spacing[3], paddingVertical: spacing[3] }}>
                      <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
                        {nombre}
                      </Text>
                    </View>
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
