/**
 * CUENTA — el stub digno del ciclo B1 (S51-B2.5, DISEÑO_EXPERIENCIA
 * §8) con UNA función VIVA: el selector de idioma es/en sobre el riel
 * B1a (cambia la app al toque y persiste en dispositivo; la sync a DB
 * es D-316). El resto del ciclo B1 (perfil, contraseña, notificaciones,
 * eliminación de cuenta) tiene su LUGAR visible con "en preparación"
 * honesto — jamás formularios muertos. La salida de sesión vive acá
 * (migrada del Hogar S45).
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
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
      {texto}
    </Text>
  );
}

export default function Cuenta() {
  const router = useRouter();
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
      // la persistencia falló: el idioma cambió en vivo pero puede no
      // sobrevivir al reinicio — se dice (regla 36, cero silencio)
      mostrar({ texto: t('cuenta.idiomaError'), variante: 'error' });
    }
    setCambiando(false);
  }

  const lugaresB1 = [
    t('cuenta.perfil'),
    t('cuenta.contrasena'),
    t('cuenta.notificaciones'),
    t('cuenta.eliminarCuenta'),
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
        <Encabezado variante="portada" saludo={t('cuenta.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          {/* ── Idioma: LA función viva del stub ── */}
          <Tarjeta>
            <SelectorOpcion
              etiqueta={t('cuenta.idioma')}
              opciones={[
                { codigo: 'es', etiqueta: t('cuenta.idiomaEs') },
                { codigo: 'en', etiqueta: t('cuenta.idiomaEn') },
              ]}
              seleccionada={idioma}
              onSelect={(codigo) => void alElegirIdioma(codigo)}
            />
          </Tarjeta>

          {/* ── El ciclo B1: lugares honestos, cero formularios muertos ── */}
          <View style={{ gap: spacing[3] }}>
            <Tarjeta relleno="ninguno">
              {lugaresB1.map((lugar, i) => (
                <View key={lugar}>
                  {i > 0 ? <Separador /> : null}
                  <Celda titulo={lugar} fin={<Insignia estado="proximo" etiqueta={t('cuenta.enPreparacion')} />} />
                </View>
              ))}
            </Tarjeta>
          </View>

          {/* ── Sesión (migrada del Hogar S45) ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('cuenta.sesion')} />
            <Boton variante="secundario" etiqueta={t('ajustes.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
          </View>
        </View>
      </ScrollView>

      <Hoja visible={salirAbierta} onCerrar={() => setSalirAbierta(false)} titulo={t('ajustes.titulo')}>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
            {t('ajustes.confirmacionCierre')}
          </Text>
          <Boton
            variante="destructivo"
            etiqueta={t('ajustes.cerrarSesion')}
            bloque
            cargando={cerrando}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void (async () => {
                await cerrarSesion();
                setCerrando(false);
                setSalirAbierta(false);
                router.replace('/bienvenida');
              })();
            }}
          />
          <Boton variante="ghost" etiqueta={t('ajustes.cancelar')} bloque onPress={() => setSalirAbierta(false)} />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
