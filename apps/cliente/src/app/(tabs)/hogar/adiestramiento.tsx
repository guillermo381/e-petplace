/**
 * EL HUB DE ADIESTRAMIENTO DEL DUEÑO (S63-A Bloque 3, gemela del hub de
 * grooming S60-A4): entre el pago y la sesión, la cita tiene superficie.
 * Próximos · Historial (SelectorSegmentado, Ley 19.3) — la cita futura
 * se PREPARA, no se toca (precedente S60-C1); la cerrada navega a SU
 * PARTE. La identidad k/N del programa se dice en cada fila (§1: la
 * sesión 3 no es la 7).
 *
 * TESIS: "Tus sesiones de adiestramiento viven acá — las que vienen y
 * lo que cada una dejó."
 * FIRMA: la identidad 'Sesión k de N' en la fila (el programa se LEE
 * como camino, no como lista de citas iguales).
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Insignia,
  Separador,
  SelectorSegmentado,
  Tarjeta,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerMisAdiestramientos, type AdiestramientoDelHogar } from '@epetplace/api';
import { fechaCortaMono } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';

export default function HubAdiestramiento() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const [vista, setVista] = useState<'proximos' | 'historial'>('proximos');
  const [citas, setCitas] = useState<AdiestramientoDelHogar[] | 'cargando' | 'error'>('cargando');

  const cargar = useCallback(() => {
    setCitas('cargando');
    void obtenerMisAdiestramientos().then((r) => {
      setCitas(r.ok ? r.data : 'error');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const proximos = Array.isArray(citas)
    ? citas.filter((c) => c.estado === 'confirmada' || c.estado === 'en_curso')
    : [];
  const historial = Array.isArray(citas)
    ? citas.filter((c) => c.tiene_parte).slice().reverse()
    : [];
  const visibles = vista === 'proximos' ? proximos : historial;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adiestramiento.hubTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] }}>
        <Boton
          variante="primario"
          etiqueta={t('adiestramiento.agendar')}
          onPress={() => router.push('/explorar/adiestramiento')}
        />

        <SelectorSegmentado
          etiqueta={t('adiestramiento.hubTitulo')}
          segmentos={[
            { codigo: 'proximos', etiqueta: t('adiestramiento.hubProximos') },
            { codigo: 'historial', etiqueta: t('adiestramiento.hubHistorial') },
          ]}
          activo={vista}
          onCambio={(v) => setVista(v === 'historial' ? 'historial' : 'proximos')}
        />

        {citas === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : citas === 'error' ? (
          <EstadoVacio
            titulo={t('adiestramiento.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : visibles.length === 0 ? (
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="training" tamano={48} />}
            titulo={vista === 'proximos' ? t('adiestramiento.hubProximosVacioTitulo') : t('adiestramiento.hubHistorialVacioTitulo')}
            descripcion={
              vista === 'proximos' ? t('adiestramiento.hubProximosVacioDetalle') : t('adiestramiento.hubHistorialVacioDetalle')
            }
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {visibles.map((c, i) => {
              // la identidad k del programa (§1) — estado pasivo,
              // jamás botón (Ley 19.4)
              const fin =
                c.sesion_numero !== null ? (
                  <Insignia estado="info" etiqueta={t('adiestramiento.sesionK', { k: String(c.sesion_numero) })} />
                ) : undefined;
              const titulo = c.mascota_nombre ?? t('adiestramiento.titulo');
              const subtitulo = c.prestador_nombre ?? undefined;
              const metadataMono = `${fechaCortaMono(c.fecha, idioma)} · ${c.hora}`;
              const navegable = vista === 'historial' && c.tiene_parte;
              return (
                <View key={c.cita_id}>
                  {i > 0 ? <Separador /> : null}
                  {navegable ? (
                    <Celda
                      titulo={titulo}
                      subtitulo={subtitulo}
                      metadataMono={metadataMono}
                      fin={fin}
                      interactiva
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname: '/adiestramiento/[citaId]',
                          params: { citaId: c.cita_id, mascotaNombre: c.mascota_nombre ?? '' },
                        })
                      }
                    />
                  ) : (
                    // la cita futura se PREPARA, no se toca (S60-C1)
                    <Celda titulo={titulo} subtitulo={subtitulo} metadataMono={metadataMono} fin={fin} />
                  )}
                </View>
              );
            })}
          </Tarjeta>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
