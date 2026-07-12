/**
 * Cuenta · Ayuda y legales (S55-B3) — términos y privacidad con
 * PLACEHOLDER DECLARADO (los textos legales definitivos no existen:
 * deuda con disparo pre-compuerta B6) y el canal de ayuda como hueco
 * B5 honesto. Escalera: no muestra datos del expediente.
 */

import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Encabezado, Tarjeta, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function AyudaCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const bloques = [
    { titulo: t('cuenta.terminosTitulo'), cuerpo: t('cuenta.legalPlaceholder') },
    { titulo: t('cuenta.privacidadTitulo'), cuerpo: t('cuenta.legalPlaceholder') },
    { titulo: t('cuenta.ayudaCanal'), cuerpo: t('cuenta.ayudaPronto') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.ayuda')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}>
        {bloques.map((b) => (
          <Tarjeta key={b.titulo}>
            <View style={{ gap: spacing[2] }}>
              <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                {b.titulo}
              </Text>
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.5, color: theme.text.secondary }}>
                {b.cuerpo}
              </Text>
            </View>
          </Tarjeta>
        ))}
      </ScrollView>
    </View>
  );
}
