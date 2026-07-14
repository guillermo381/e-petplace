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
import { router, useFocusEffect } from 'expo-router';
import {
  Celda,
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import type { ReactNode } from 'react';
import { obtenerServiciosPais, type ServiciosPais } from '@epetplace/api';

// S58 (D-361): adiestramiento migró al set b′ — la estrella murió
// (violaba el set); el silbato canónico vive en el registry.
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
  const fichasActivas: Array<{
    clave: string;
    titulo: string;
    detalle: string;
    icono: ReactNode;
    // S54-B3.1: la vertical con agendamiento VIVO navega; el resto sigue
    // informativo (cero CTA muerta — la card gana el tap con su flujo).
    onPress?: () => void;
  }> = [];
  const proximamente: Array<{ nombre: string; icono: 'hotel' | 'guarderia' | 'seguros' | 'telemedicina' | 'prime' }> = [];
  if (servicios !== 'cargando' && servicios !== 'error') {
    if (servicios.walking) fichasActivas.push({ clave: 'paseo', titulo: t('explorar.servicioPaseo'), detalle: t('explorar.servicioPaseoDetalle'), icono: <Icono nombre="paseo" tamano={34} />, onPress: () => router.navigate('/hogar/paseos') });
    // S60-A1: el grooming dejó el coming-soon — la card gana su flujo
    // (directo al CUÁNDO: el grooming no tiene hub de planes, v2 §9).
    if (servicios.grooming) fichasActivas.push({ clave: 'grooming', titulo: t('explorar.servicioGrooming'), detalle: t('explorar.servicioGroomingDetalle'), icono: <Icono nombre="grooming" tamano={34} />, onPress: () => router.navigate('/explorar/grooming') });
    if (servicios.veterinary) fichasActivas.push({ clave: 'vet', titulo: t('explorar.servicioVet'), detalle: t('explorar.servicioVetDetalle'), icono: <Icono nombre="veterinaria" tamano={34} /> });
    if (servicios.training) fichasActivas.push({ clave: 'adiestramiento', titulo: t('explorar.servicioAdiestramiento'), detalle: t('explorar.servicioAdiestramientoDetalle'), icono: <Icono nombre="training" tamano={26} /> });
    if (!servicios.hotel) proximamente.push({ nombre: t('explorar.proxHotel'), icono: 'hotel' }, { nombre: t('explorar.proxGuarderia'), icono: 'guarderia' });
    if (!servicios.insurance) proximamente.push({ nombre: t('explorar.proxSeguros'), icono: 'seguros' });
    if (!servicios.telemedicine) proximamente.push({ nombre: t('explorar.proxTelemedicina'), icono: 'telemedicina' });
    if (!servicios.prime) proximamente.push({ nombre: t('explorar.proxPrime'), icono: 'prime' });
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
                {/* QW2 (S53, decisión founder): grilla de 2 columnas,
                    cards cuadradas con el Icono b′ PRESIDIENDO. */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
                  {fichasActivas.map((f) => {
                    const contenido = (
                      <View style={{ aspectRatio: 1.05, justifyContent: 'space-between' }}>
                        <View style={{ paddingTop: spacing[1] }}>{f.icono}</View>
                        <View style={{ gap: 2 }}>
                          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                            {f.titulo}
                          </Text>
                          <Text
                            numberOfLines={3}
                            style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, lineHeight: typography.size.xs * 1.45, color: theme.text.secondary }}
                          >
                            {f.detalle}
                          </Text>
                          {f.onPress ? (
                            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.xs, color: theme.text.primary, marginTop: 2 }}>
                              {t('explorar.paseoAgendable')}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                    return (
                      <View key={f.clave} style={{ flexBasis: '47%', flexGrow: 1 }}>
                        {f.onPress ? (
                          <Tarjeta relleno="amplio" interactiva onPress={f.onPress} accessibilityRole="button" etiqueta={`${f.titulo} — ${t('explorar.paseoAgendable')}`}>
                            {contenido}
                          </Tarjeta>
                        ) : (
                          <Tarjeta relleno="amplio">{contenido}</Tarjeta>
                        )}
                      </View>
                    );
                  })}
                </View>
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
                  {t('explorar.agendarLlegaOtros')}
                </Text>
              </View>
            )}
          </View>

          {/* ── Refugios / adopción (M0) — vacío SERENO (P5b) ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('explorar.refugios')} />
            <EstadoVacio
              registro="seccion"
              icono={<Icono nombre="refugio" tamano={48} />}
              titulo={t('explorar.refugiosVacio')}
              descripcion={t('explorar.refugiosVacioDetalle')}
            />
          </View>

          {/* ── Próximamente honesto — UNA sección, filas serenas en
              texto secundario (P5c: el muro de Insignias ochre murió;
              el título de la sección ya dice todo) ── */}
          {proximamente.length > 0 ? (
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('explorar.proximamente')} />
              <Tarjeta relleno="ninguno">
                {/* S58 (D-361): la celda VISTE, no promete — ícono del
                    registry + fila informativa SIN chevron ni tap (un
                    coming soon no navega: no es CeldaNavegacion, Ley 19.4) */}
                {proximamente.map((p, i) => (
                  <View key={p.nombre}>
                    {i > 0 ? <Separador /> : null}
                    <Celda inicio={<Icono nombre={p.icono} tamano={24} registro="aa" />} titulo={p.nombre} />
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
