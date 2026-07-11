/**
 * PASEADORES — B3.1 del agendamiento (S54): la card Paseo de Explorar
 * cobra vida. Lista DERIVADA de prestadores reales con oferta de paseo
 * activa (obtenerOfertaPaseo: prestador_servicios × tipos_servicio ×
 * prestadores — cero catálogo estático, cero precio inventado).
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin oferta real: EstadoVacio honesto que EDUCA (qué es
 *    un paseador acá: cuida y documenta; aparece cuando active su
 *    agenda de verdad). Jamás relleno, jamás promesa con fecha.
 *  · Peldaño 1 — oferta real: nombre del paseador + su servicio + precio
 *    y duración REALES (voz de máquina en mono).
 *  · Peldaño 2 — riqueza por datos del expediente: HOY NO MUESTRA datos
 *    del expediente (explícito). Cuando existan atenciones cerradas con
 *    calidad del paseador (paseos documentados, partes), la fila sube
 *    sola — es dato, no versión.
 *
 * B3.2 (siguiente pantalla) le da el tap → agenda real. Hasta entonces
 * las filas NO son interactivas: cero CTA muerta (regla S51).
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerOfertaPaseo, type OfertaPaseo } from '@epetplace/api';
import { useTraduccion } from '@/i18n';

export default function Paseadores() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [oferta, setOferta] = useState<OfertaPaseo[] | 'cargando' | 'error'>('cargando');

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerOfertaPaseo().then((r) => {
        if (vigente) setOferta(r.ok ? r.data : 'error');
      });
      return () => {
        vigente = false;
      };
    }, []),
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('explorar.paseadoresTitulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[3] }}>
        {oferta === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : oferta === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hogar.reintentar')}
                onPress={() => setOferta('cargando')}
              />
            }
          />
        ) : oferta.length === 0 ? (
          // Peldaño 0 — el vacío honesto que educa (jamás relleno).
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('explorar.paseadoresVacio')}
            descripcion={t('explorar.paseadoresVacioDetalle')}
          />
        ) : (
          <>
            <Tarjeta relleno="ninguno">
              {oferta.map((o, i) => (
                <View key={o.prestador_servicio_id}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={o.prestador_nombre}
                    subtitulo={o.servicio_nombre}
                    // voz de máquina: precio real + duración (mono, minúsculas)
                    metadataMono={`$${o.precio.toFixed(2)} · ${o.duracion_minutos} min`}
                  />
                </View>
              ))}
            </Tarjeta>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                color: theme.text.tertiary,
              }}
            >
              {t('explorar.paseadoresNota')}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
