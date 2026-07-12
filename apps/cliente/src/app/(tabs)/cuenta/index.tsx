/**
 * CUENTA — el índice del ciclo §3.5 (S55-B3, sobre el stub S51-B2.5).
 * Mapa: Tu perfil · Tu familia · Preferencias · Pagos · Ayuda y
 * legales · Sesión y cuenta (cerrar sesión + eliminar cuenta con voz
 * honesta — letra (a): visible, espec P15 en docs, jamás borra hoy).
 * Escalera: esta pantalla no muestra datos del expediente (índice puro).
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
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { cerrarSesion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
    >
      {texto}
    </Text>
  );
}

export default function Cuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const [salirAbierta, setSalirAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [eliminarAbierta, setEliminarAbierta] = useState(false);

  const lugares = [
    { etiqueta: t('cuenta.perfil'), ruta: '/cuenta/perfil' as const },
    // S56-A D-339: la dirección es del HOGAR (no del perfil personal) —
    // celda propia; el checkout reusa el mismo formulario.
    { etiqueta: t('direccion.titulo'), ruta: '/cuenta/direccion' as const },
    { etiqueta: t('cuenta.familia'), ruta: '/cuenta/familia' as const },
    { etiqueta: t('cuenta.preferencias'), ruta: '/cuenta/preferencias' as const },
    { etiqueta: t('cuenta.pagos'), ruta: '/cuenta/pagos' as const },
    { etiqueta: t('cuenta.ayuda'), ruta: '/cuenta/ayuda' as const },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
        <Encabezado variante="portada" saludo={t('cuenta.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          <Tarjeta relleno="ninguno">
            {lugares.map((lugar, i) => (
              <View key={lugar.ruta}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  onPress={() => router.push(lugar.ruta)}
                  titulo={lugar.etiqueta}
                />
              </View>
            ))}
          </Tarjeta>

          {/* ── Sesión y cuenta ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('cuenta.sesion')} />
            <Boton variante="secundario" etiqueta={t('ajustes.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            <Boton variante="ghost" etiqueta={t('cuenta.eliminarCuenta')} bloque onPress={() => setEliminarAbierta(true)} />
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

      {/* Eliminar cuenta — letra (a): la voz honesta; la política P15
          (destino del expediente, co-dueños, hitos) se firma ANTES de
          que esto ejecute nada. */}
      <Hoja visible={eliminarAbierta} onCerrar={() => setEliminarAbierta(false)} titulo={t('cuenta.eliminarCuenta')} conCerrar>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            {t('cuenta.eliminarVoz')}
          </Text>
          <Boton variante="secundario" etiqueta={t('cuenta.entendido')} bloque onPress={() => setEliminarAbierta(false)} />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
