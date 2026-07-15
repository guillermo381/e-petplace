/**
 * A DÓNDE IR — el snapshot D-339 de la cita, pintado (S61-B6).
 * Nació DENTRO del detalle del paseo (S56-B TAREA 3); al llegar el
 * grooming a domicilio (D-392) se EXTRAJO acá VERBATIM — una sola
 * verdad para los dos oficios (precedente seccion-horarios). Pinta lo
 * que la FILA de la cita trae (snapshot congelado al pagar); null
 * honesto para citas sin dirección. Dosis baja: cero acento, la
 * acción del mapa en ghost. El mapa es DEL SISTEMA por plataforma.
 */

import { Linking, Platform, Text, View } from 'react-native';
import { Boton, Tarjeta, spacing, typography, useAviso, useTheme } from '@epetplace/ui';
import type { DireccionCitaPaseo } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

// D-339 (S56-B TAREA 3): la URL del mapa del SISTEMA por plataforma.
// Con lat/lon apunta exacto; sin coordenadas, búsqueda por el texto.
function urlMapa(d: DireccionCitaPaseo): string {
  const consulta = [d.direccion, d.sector, d.ciudad]
    .filter((x): x is string => x !== null)
    .join(', ');
  const q = encodeURIComponent(consulta);
  if (Platform.OS === 'ios') {
    return d.lat !== null && d.lon !== null
      ? `http://maps.apple.com/?ll=${d.lat},${d.lon}&q=${q}`
      : `http://maps.apple.com/?q=${q}`;
  }
  if (Platform.OS === 'android') {
    return d.lat !== null && d.lon !== null
      ? `geo:${d.lat},${d.lon}?q=${d.lat},${d.lon}(${q})`
      : `geo:0,0?q=${q}`;
  }
  return d.lat !== null && d.lon !== null
    ? `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function SeccionDireccion({ direccion }: { direccion: DireccionCitaPaseo | null }) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  };

  return (
    <Tarjeta elevacion="plana" relleno="amplio">
      <View style={{ gap: spacing[2] }}>
        <Text style={vozSecundaria}>{t('cita.direccionTitulo')}</Text>
        {direccion === null ? (
          <Text style={vozSecundaria}>{t('cita.direccionSinDato')}</Text>
        ) : (
          <>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                lineHeight: typography.size.base * 1.4,
                color: theme.text.primary,
              }}
            >
              {direccion.direccion}
            </Text>
            {direccion.sector !== null || direccion.ciudad !== null ? (
              <Text style={vozSecundaria}>
                {[direccion.sector, direccion.ciudad].filter((x): x is string => x !== null).join(' · ')}
              </Text>
            ) : null}
            {direccion.referencias !== null ? <Text style={vozSecundaria}>{direccion.referencias}</Text> : null}
            <View style={{ alignSelf: 'flex-start' }}>
              <Boton
                variante="ghost"
                tamaño="sm"
                etiqueta={t('cita.direccionAbrirMapa')}
                onPress={() => {
                  Linking.openURL(urlMapa(direccion)).catch(() => {
                    mostrar({ variante: 'error', texto: t('cita.direccionMapaError') });
                  });
                }}
              />
            </View>
          </>
        )}
      </View>
    </Tarjeta>
  );
}
