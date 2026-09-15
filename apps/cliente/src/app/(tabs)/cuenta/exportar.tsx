/**
 * Cuenta · EXPORTAR MIS DATOS — la portabilidad (S104-C, TANDA 3, P15 cl.5).
 *
 * Se ofrece ANTES de cerrar, en el mismo flujo de la salida, pero vive en su
 * pantalla porque también es un derecho por sí solo (LOPDP): pedir una copia
 * de lo que e-PetPlace guarda sobre vos y tus mascotas, sin tener que irte.
 *
 * ── LA COPIA NO VUELVE A LA APP, VA POR CORREO (decisión de A, ratificada) ─
 * `exportarMisDatos` arma el archivo y lo manda al correo, firmado y con
 * vencimiento. La URL NO vuelve al cliente a propósito: una URL firmada a un
 * export de datos personales quedaría en el estado de la pantalla y en
 * cualquier log — la clase de cosa que no se manda a un sitio del que no se
 * puede sacar. La pantalla solo dice A DÓNDE se envió (`enviado_a`), jamás la
 * copia misma.
 *
 * `ya_estaba` = ya hay una corriendo: entonces la voz dice «ya te la estamos
 * mandando», que es verdad y útil, no un error.
 *
 * TESIS: tus datos son tuyos, y te damos la copia cuando la pidas.
 */

import {useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HojaContenido, Cabecera, Boton, Texto, spacing, useTheme } from '@epetplace/ui';
import { exportarMisDatos } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

type Estado = { fase: 'reposo' } | { fase: 'pidiendo' } | { fase: 'enviado'; correo: string; yaEstaba: boolean } | { fase: 'error' };

export default function ExportarDatos() {
  const cabecera = useAltoDeCabecera('empujada');
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
    setEstado({ fase: 'enviado', correo: r.data.enviado_a, yaEstaba: r.data.ya_estaba });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* ⭐ **LA ESTRUCTURA FIRMADA — S116-C lote 3b (precisión del founder).**
          *Migrar no es cambiar `Encabezado` por `Cabecera`.* El ciruela es el
          FONDO —`presentacion="fondo"`: sin radio inferior, sin sombra— y el
          contenido vive en una hoja de lienzo que lo tapa al scrollear. **La
          curva es de la HOJA y mira hacia ARRIBA**; la cabecera-tarjeta con las
          esquinas de abajo redondeadas muere en el cliente.
          ⚠️ El `paddingBottom` con `insets.bottom` que había acá SE RETIRA: lo
          paga la hoja en su propio render, y sumarlo sería pagarlo dos veces
          (`R53`). */}
      <HojaContenido
        arranque={cabecera.arranque}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera variante="empujada" titulo={t('exportarDatos.titulo')} onVolver={() => router.back()}  etiquetaVolver={t('comun.volver')}
              presentacion="fondo"
            />
          </View>
        }
        scroll={{ contentContainerStyle: {
          padding: spacing[5],
          gap: spacing[4],
        } }}
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
      </HojaContenido>
    </View>
  );
}
