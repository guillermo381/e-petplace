/**
 * NEGOCIO — stub digno del ciclo B1/B2 (S51-B3.4, DISEÑO_EXPERIENCIA
 * §14 + alma §2.6): cada módulo tiene su LUGAR visible y dice qué lo
 * despierta — en términos de HITOS, jamás "$0" ni formularios muertos.
 * Los flujos del portal web (servicios/precios/horarios/equipo) se
 * portan en A4/B1; la cuenta comercial es el wizard B2.3; las
 * liquidaciones despiertan con la primera plata (B2.4).
 *
 * UNA función viva: el selector de idioma es/en del riel B1a (mismo
 * patrón que Cuenta del cliente). Y la salida de sesión.
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Hoja,
  Insignia,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { cambiarIdioma, type IdiomaSoportado } from '@epetplace/i18n';
import { cerrarSesion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function Negocio() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();

  const [cambiando, setCambiando] = useState(false);
  const [salirAbierta, setSalirAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  async function alElegirIdioma(codigo: string) {
    if (cambiando || codigo === idioma || (codigo !== 'es' && codigo !== 'en')) return;
    setCambiando(true);
    try {
      await cambiarIdioma(codigo as IdiomaSoportado);
    } catch {
      mostrar({ texto: t('negocio.idiomaError'), variante: 'error' });
    }
    setCambiando(false);
  }

  // los lugares del negocio: qué los despierta, en hitos (§2.6)
  const lugares: Array<{ titulo: string; detalle?: string }> = [
    { titulo: t('negocio.servicios') },
    { titulo: t('negocio.horarios') },
    { titulo: t('negocio.equipo') },
    { titulo: t('negocio.cuentaComercial'), detalle: t('negocio.cuentaComercialDetalle') },
    { titulo: t('negocio.liquidaciones'), detalle: t('negocio.liquidacionesDetalle') },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
        <Encabezado variante="portada" saludo={t('negocio.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          <View style={{ gap: spacing[3] }}>
            <Tarjeta relleno="ninguno">
              {lugares.map((lugar, i) => (
                <View key={lugar.titulo}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={lugar.titulo}
                    subtitulo={lugar.detalle}
                    fin={<Insignia estado="proximo" etiqueta={t('negocio.enPreparacion')} tamaño="sm" />}
                  />
                </View>
              ))}
            </Tarjeta>
          </View>

          {/* idioma: LA función viva del stub (riel B1a) */}
          <Tarjeta>
            <SelectorOpcion
              etiqueta={t('negocio.idioma')}
              opciones={[
                { codigo: 'es', etiqueta: t('negocio.idiomaEs') },
                { codigo: 'en', etiqueta: t('negocio.idiomaEn') },
              ]}
              seleccionada={idioma}
              onSelect={(codigo) => void alElegirIdioma(codigo)}
            />
          </Tarjeta>

          <View style={{ gap: spacing[3] }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.sm,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                color: theme.text.tertiary,
              }}
            >
              {t('sesion.titulo')}
            </Text>
            <Boton variante="secundario" etiqueta={t('sesion.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
          </View>
        </View>
      </ScrollView>

      <Hoja visible={salirAbierta} onCerrar={() => setSalirAbierta(false)} titulo={t('sesion.titulo')}>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
            {t('sesion.confirmacionCierre')}
          </Text>
          <Boton
            variante="destructivo"
            etiqueta={t('sesion.cerrarSesion')}
            bloque
            cargando={cerrando}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void (async () => {
                await cerrarSesion();
                setCerrando(false);
                setSalirAbierta(false);
                // sin ruta de login (D-290): el raíz muestra el estado
                // honesto de sin-sesión — el mismo del arranque.
              })();
            }}
          />
          <Boton variante="ghost" etiqueta={t('sesion.cancelar')} bloque onPress={() => setSalirAbierta(false)} />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
