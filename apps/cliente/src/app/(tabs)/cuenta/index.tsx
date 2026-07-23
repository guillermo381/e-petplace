/**
 * CUENTA — el índice del ciclo §3.5 (S55-B3, sobre el stub S51-B2.5).
 * Mapa: Tu perfil · Tu familia · Preferencias · Pagos · Ayuda y
 * legales · Sesión y cuenta (cerrar sesión + eliminar cuenta con voz
 * honesta — letra (a): visible, espec P15 en docs, jamás borra hoy).
 * Escalera: esta pantalla no muestra datos del expediente (índice puro).
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Hoja,
  Separador,
  Tarjeta,
  Texto,
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
  const insets = useSafeAreaInsets();
  const { t } = useTraduccion();

  const [salirAbierta, setSalirAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [eliminarAbierta, setEliminarAbierta] = useState(false);

  // S58 (D-361): el freno del grupo se LEVANTA — el lote 3 trae los
  // íconos y las entradas hablan la Ley 19.1 (perfil usa la chapita
  // 'cuenta'; la dirección usa el pin 'ubicacion').
  const lugares = [
    { etiqueta: t('cuenta.perfil'), ruta: '/cuenta/perfil' as const, icono: 'cuenta' as const },
    { etiqueta: t('direccion.titulo'), ruta: '/cuenta/direccion' as const, icono: 'ubicacion' as const },
    { etiqueta: t('cuenta.familia'), ruta: '/cuenta/familia' as const, icono: 'familia' as const },
    { etiqueta: t('cuenta.preferencias'), ruta: '/cuenta/preferencias' as const, icono: 'preferencias' as const },
    { etiqueta: t('cuenta.pagos'), ruta: '/cuenta/pagos' as const, icono: 'pagos' as const },
    { etiqueta: t('cuenta.ayuda'), ruta: '/cuenta/ayuda' as const, icono: 'ayuda' as const },
    // S74 — ENTRADA TEMPORAL del gate de la fusión del avatar (la lámina
    // se juzga en DISPOSITIVO: Chromium aplica borderCurve y no puede
    // desmentir el engaño que produjo). MUERE con la firma del founder,
    // junto a la lámina (Ley 37 — precedente lámina S73).
    { etiqueta: t('cuenta.laminaFusion'), ruta: '/lamina-fusion' as const, icono: 'preferencias' as const },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
        <Encabezado variante="portada" saludo={t('cuenta.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          <Tarjeta relleno="ninguno">
            {lugares.map((lugar, i) => (
              <View key={lugar.ruta}>
                {i > 0 ? <Separador /> : null}
                <CeldaNavegacion
                  icono={lugar.icono}
                  titulo={lugar.etiqueta}
                  onPress={() => router.push(lugar.ruta)}
                />
              </View>
            ))}
          </Tarjeta>

          {/* ── Sesión y cuenta ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('cuenta.sesion')} />
            <Boton variante="secundario" etiqueta={t('ajustes.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            <Boton variante="compacto" etiqueta={t('cuenta.eliminarCuenta')} bloque onPress={() => setEliminarAbierta(true)} />
          </View>

          {/* ── S74-A · EL MARCADOR RENDERIZADO (L-160 enmendada / L-161):
              el [update] era SOLO console.log — logcat-only, inalcanzable
              para el founder sin cable. La identidad del build gana
              PANTALLA (receta de B, 0225701 — las dos apps no divergen).
              Voz de máquina (Ley 3); id corto = primeros 8 del updateId
              (único por publicación); embebido/dev se dice honesto.
              Camino literal: tab Cuenta → el pie. ── */}
          <Texto variante="dato">
            {Updates.updateId !== null
              ? `update ${Updates.updateId.slice(0, 8)} · ${Updates.channel ?? 'sin canal'}`
              : 'bundle embebido / dev'}
          </Texto>
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
