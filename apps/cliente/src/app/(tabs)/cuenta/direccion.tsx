/**
 * Cuenta · Tu dirección (S56-A, D-339) — la puerta del hogar: donde el
 * paseador busca y devuelve a la mascota. UNA dirección principal por
 * user (índice parcial en DB); las citas de paseo llevan SNAPSHOT
 * congelado server-side — editar acá jamás toca citas ya creadas.
 * Escalera: no muestra datos del expediente (formulario puro).
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerDireccionHogar, type DireccionHogar } from '@epetplace/api';

import { DireccionHogarForm } from '@/components/direccion-hogar-form';
import { useTraduccion } from '@/i18n';

export default function DireccionCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [direccion, setDireccion] = useState<DireccionHogar | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerDireccionHogar();
      if (!vigente) return;
      if (!r.ok) {
        setEstado('error');
        return;
      }
      setDireccion(r.data);
      setEstado('listo');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('direccion.titulo')} atras onAtras={() => router.back()} />

      {estado === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : estado === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.reintentar')}
                onPress={() => {
                  setEstado('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              lineHeight: typography.size.base * 1.4,
              color: theme.text.secondary,
            }}
          >
            {t('direccion.voz')}
          </Text>
          <DireccionHogarForm inicial={direccion} onGuardada={() => router.back()} />
        </ScrollView>
      )}
    </View>
  );
}
