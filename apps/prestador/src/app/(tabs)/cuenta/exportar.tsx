/**
 * Cuenta · EXPORTAR MIS DATOS (prestador) — la portabilidad (S104-C, TANDA 3,
 * P15 cl.5). Hermana del cliente: se ofrece antes de cerrar y también vale
 * por sí sola. La copia va por CORREO, firmada y con vencimiento — la URL NO
 * vuelve a la app (decisión de A, ratificada). La pantalla solo dice a dónde
 * se envió.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Encabezado, Texto, spacing, useTheme } from '@epetplace/ui';
import { exportarMisDatos } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'reposo' }
  | { fase: 'pidiendo' }
  | { fase: 'enviado'; correo: string; yaEstaba: boolean }
  | { fase: 'error' };

export default function ExportarDatos() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTraduccion();

  const [estado, setEstado] = useState<Estado>({ fase: 'reposo' });

  async function pedirCopia() {
    if (estado.fase === 'pidiendo') return;
    setEstado({ fase: 'pidiendo' });
    const r = await exportarMisDatos();
    if (!r.ok) {
      setEstado({ fase: 'error' });
      return;
    }
    setEstado({ fase: 'enviado', correo: r.data.enviada_a, yaEstaba: r.data.ya_estaba });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('exportarDatos.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[4],
        }}
      >
        <Texto variante="cuerpo" color="secondary">
          {t('exportarDatos.intro')}
        </Texto>
        <Texto variante="apoyo">{t('exportarDatos.detalle')}</Texto>

        {estado.fase === 'enviado' && (
          <Texto variante="cuerpo" color="success">
            {t(estado.yaEstaba ? 'exportarDatos.yaEnCamino' : 'exportarDatos.enviado', { correo: estado.correo })}
          </Texto>
        )}
        {estado.fase === 'error' && (
          <Texto variante="apoyo" color="danger">
            {t('exportarDatos.error')}
          </Texto>
        )}

        <View style={{ paddingTop: spacing[2] }}>
          <Boton
            etiqueta={estado.fase === 'enviado' ? t('exportarDatos.pedirDeNuevo') : t('exportarDatos.cta')}
            bloque
            cargando={estado.fase === 'pidiendo'}
            onPress={() => void pedirCopia()}
          />
        </View>
      </ScrollView>
    </View>
  );
}
