/**
 * CUENTA del prestador — el índice (S57-B, letra P17 firmada; anatomía
 * calcada de la Cuenta v1 del cliente S55-B3, dosis prestador sobria).
 * Mapa: Tu perfil · Preferencias · Sesión y cuenta (cerrar sesión,
 * MUDADO desde Negocio + eliminar cuenta con voz honesta "Pronto" —
 * P17 §4: la construcción real espera la enmienda de letra con la A;
 * JAMÁS un botón que finja borrar).
 * El pulido fino es la pasada de acabados — acá vive la estructura.
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
    { etiqueta: t('miCuenta.perfil'), ruta: '/cuenta/perfil' as const },
    { etiqueta: t('miCuenta.preferencias'), ruta: '/cuenta/preferencias' as const },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
        <Encabezado variante="portada" saludo={t('miCuenta.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          {/* B3 (S58): papel+sombra — los tokens de elevación cruzaron
              (D-358); las celdas con ícono b′ esperan el lote D-361 y el
              COPIAR NIVEL fino, su PNG patrón. */}
          <Tarjeta relleno="ninguno" elevacion="reposo">
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

          {/* ── Sesión y cuenta (la sesión se MUDÓ desde Negocio) ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('sesion.titulo')} />
            <Boton variante="secundario" etiqueta={t('sesion.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            <Boton variante="ghost" etiqueta={t('miCuenta.eliminarCuenta')} bloque onPress={() => setEliminarAbierta(true)} />
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
                // D-290: la salida aterriza en el login; el replace
                // desmonta las tabs y el guard raíz re-decide fresco.
                router.replace('/login');
              })();
            }}
          />
          <Boton variante="ghost" etiqueta={t('sesion.cancelar')} bloque onPress={() => setSalirAbierta(false)} />
        </View>
      </Hoja>

      {/* Eliminar cuenta — P17 §4: la entrada existe y dice su verdad;
          las reglas (citas pagadas, planes vivos, saldo por liquidar)
          se escriben como enmienda de letra ANTES de construir. */}
      <Hoja visible={eliminarAbierta} onCerrar={() => setEliminarAbierta(false)} titulo={t('miCuenta.eliminarCuenta')} conCerrar>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            {t('miCuenta.eliminarVoz')}
          </Text>
          <Boton variante="secundario" etiqueta={t('miCuenta.entendido')} bloque onPress={() => setEliminarAbierta(false)} />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
