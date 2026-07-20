/**
 * S70-A5 — LA HOJA DE AUTORIZACIÓN DEL MOSTRADOR (cara del dueño).
 * Destino del DEEP-LINK del push ("Clínica Aurora quiere atender a Thor"):
 * una Hoja con la voz por tipo + Autorizar / Rechazar en un toque.
 * Estados dignos: vencida / ya respondida / ya no disponible.
 *
 * ANOTADO para la sesión de gate (territorio B en vuelo): el POLL de
 * `obtenerSolicitudesPendientesDueno()` en el Hogar (badge + apertura sin
 * push) queda para integrar en `hogar/index.tsx`. Acá vive el destino del
 * deep-link, autónomo.
 */

import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Boton, Hoja, spacing, typography, useAviso, useTheme } from '@epetplace/ui';
import {
  obtenerSolicitudesPendientesDueno,
  responderSolicitudAutorizacion,
  type SolicitudPendiente,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function AutorizacionScreen() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();

  const [estado, setEstado] = useState<SolicitudPendiente | 'cargando' | 'no_disponible'>('cargando');
  const [procesando, setProcesando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void (async () => {
        if (typeof solicitudId !== 'string' || solicitudId.length === 0) return;
        const r = await obtenerSolicitudesPendientesDueno();
        if (!vivo) return;
        const s = r.ok ? r.data.find((x) => x.solicitudId === solicitudId) : undefined;
        setEstado(s ?? 'no_disponible');
      })();
      return () => {
        vivo = false;
      };
    }, [solicitudId]),
  );

  const cerrar = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/hogar');
  }, []);

  const responder = useCallback(
    async (accion: 'autorizar' | 'rechazar') => {
      if (typeof solicitudId !== 'string') return;
      setProcesando(true);
      const r = await responderSolicitudAutorizacion(solicitudId, accion);
      setProcesando(false);
      if (r.ok) {
        const negocio = estado !== 'cargando' && estado !== 'no_disponible' ? (estado.negocioNombre ?? '') : '';
        mostrar({
          texto: r.data.estado === 'autorizada' ? t('autorizacion.autorizadaOk', { negocio }) : t('autorizacion.rechazadaOk'),
          variante: r.data.estado === 'autorizada' ? 'exito' : 'neutro',
        });
        cerrar();
      } else {
        mostrar({
          texto:
            r.codigo === 'solicitud_expirada'
              ? t('autorizacion.vencida')
              : r.codigo === 'solicitud_no_pendiente'
                ? t('autorizacion.yaRespondida')
                : r.codigo === 'solicitud_no_existe'
                  ? t('autorizacion.noExiste')
                  : t('autorizacion.error'),
          variante: 'error',
        });
        if (r.codigo === 'solicitud_expirada' || r.codigo === 'solicitud_no_pendiente' || r.codigo === 'solicitud_no_existe') {
          cerrar();
        }
      }
    },
    [solicitudId, estado, t, mostrar, cerrar],
  );

  const disponible = estado !== 'cargando' && estado !== 'no_disponible';
  const titulo = disponible
    ? estado.tipo === 'alta_mascota'
      ? t('autorizacion.tituloAlta', { negocio: estado.negocioNombre ?? '', mascota: estado.mascotaNombre ?? '' })
      : t('autorizacion.tituloAtencion', { negocio: estado.negocioNombre ?? '', mascota: estado.mascotaNombre ?? '' })
    : t('autorizacion.cargando');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={[]}>
      <Hoja visible onCerrar={cerrar} titulo={estado === 'no_disponible' ? t('autorizacion.noExiste') : titulo} conCerrar>
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          {estado === 'no_disponible' ? (
            <Boton variante="secundario" bloque etiqueta={t('autorizacion.cerrar')} onPress={cerrar} />
          ) : (
            <>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.md,
                  color: theme.text.secondary,
                }}
              >
                {t('autorizacion.cuerpo')}
              </Text>
              <View style={{ gap: spacing[2] }}>
                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('autorizacion.autorizar')}
                  cargando={procesando}
                  onPress={() => void responder('autorizar')}
                />
                <Boton
                  variante="ghost"
                  bloque
                  etiqueta={t('autorizacion.rechazar')}
                  deshabilitado={procesando}
                  onPress={() => void responder('rechazar')}
                />
              </View>
            </>
          )}
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
