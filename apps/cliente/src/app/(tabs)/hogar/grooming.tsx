/**
 * EL HUB DE GROOMING DEL DUEÑO (S60-A4, hallazgo de gate founder):
 * entre el pago y el inicio de la atención, la cita ya tiene superficie.
 * DOS taps — Próximos (la sesión confirmada con verdad firme: servicio,
 * fecha, hora, groomer y EL DÓNDE) · Historial (los cerrados, navegando
 * al parte del cierre) — + Agendar arriba, que aterriza en el CUÁNDO.
 * SIN tap Agenda: no hay plan en v1 (§9); el solape Próximos/Agenda del
 * hub del paseo es defecto anotado en D-366 y NO se clona.
 *
 * Esqueleto = las piezas de la casa (Encabezado + Boton + Selector-
 * Segmentado + Celda/Tarjeta) — el hub del paseo no presta componente
 * intermedio (su cuerpo es plan/paquete/P18-específico) y NO se toca.
 *
 * ESCALERA (§4b): peldaño 0 = vacíos con camino (Agendar) · peldaño 1 =
 * todo lo pintado es REAL (citas pagadas, dirección de sede sembrada) ·
 * peldaño 2 = el parte del cierre (fotos + mensaje) vive en la historia.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  SelectorSegmentado,
  Separador,
  Tarjeta,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerMisGroomings, type GroomingDelHogar } from '@epetplace/api';
import { fechaCortaMono } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

type Tap = 'proximos' | 'historial';

export default function HubGrooming() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const [tap, setTap] = useState<Tap>('proximos');
  const [filas, setFilas] = useState<GroomingDelHogar[] | 'cargando' | 'error'>('cargando');

  const cargar = useCallback(() => {
    setFilas('cargando');
    void obtenerMisGroomings().then((r) => {
      setFilas(r.ok ? r.data : 'error');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  // Próximos = lo confirmado por venir (verdad firme; el EN VIVO vive en
  // el Hogar como celda viva) · Historial = lo cerrado, del más reciente.
  const proximos = Array.isArray(filas) ? filas.filter((f) => f.estado === 'confirmada') : [];
  const historial = Array.isArray(filas)
    ? filas.filter((f) => f.atencion_id !== null).sort((a, b) => (a.fecha > b.fecha ? -1 : 1))
    : [];

  const subtituloDe = (f: GroomingDelHogar, conDonde: boolean): string =>
    [
      f.mascota_nombre,
      f.prestador_nombre,
      conDonde ? (f.direccion !== null ? [f.direccion, f.ciudad].filter(Boolean).join(', ') : t('grooming.enSuLocal')) : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('grooming.hubTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}>
        {/* la acción primaria del hub — aterriza en el CUÁNDO ya construido */}
        <Boton
          variante="primario"
          bloque
          etiqueta={t('grooming.agendar')}
          onPress={() => router.navigate('/explorar/grooming')}
        />

        <SelectorSegmentado
          etiqueta={t('grooming.hubTitulo')}
          segmentos={[
            { codigo: 'proximos', etiqueta: t('plan.segProximos') },
            { codigo: 'historial', etiqueta: t('plan.segHistorial') },
          ]}
          activo={tap}
          onCambio={(codigo) => {
            if (codigo === 'proximos' || codigo === 'historial') setTap(codigo);
          }}
        />

        {filas === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : filas === 'error' ? (
          <EstadoVacio
            titulo={t('grooming.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : tap === 'proximos' ? (
          proximos.length === 0 ? (
            <EstadoVacio
              registro="seccion"
              icono={<Icono nombre="grooming" tamano={48} />}
              titulo={t('grooming.hubProximosVacio')}
              descripcion={t('grooming.hubProximosVacioDetalle')}
            />
          ) : (
            <Tarjeta relleno="ninguno">
              {proximos.map((f, i) => (
                <View key={f.cita_id}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={vozServicio(t, f.tipo_servicio, f.servicio_nombre) ?? f.servicio_nombre}
                    subtitulo={subtituloDe(f, true)}
                    metadataMono={`${fechaCortaMono(f.fecha, idioma)} · ${f.hora}`}
                  />
                </View>
              ))}
            </Tarjeta>
          )
        ) : historial.length === 0 ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('grooming.hubHistorialVacio')}
            descripcion={t('grooming.hubHistorialVacioDetalle')}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {historial.map((f, i) => (
              <View key={f.cita_id}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={vozServicio(t, f.tipo_servicio, f.servicio_nombre) ?? f.servicio_nombre}
                  subtitulo={subtituloDe(f, false)}
                  metadataMono={`${fechaCortaMono(f.fecha, idioma)} · ${f.hora}`}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => {
                    if (f.atencion_id !== null) {
                      router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: f.atencion_id } });
                    }
                  }}
                />
              </View>
            ))}
          </Tarjeta>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
