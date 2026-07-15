/**
 * SOLICITAR ACCESO (S61-B8) — el destino HONESTO del secundario de la
 * bienvenida: el flujo de solicitud NO existe (relevado — el alta de
 * prestadores es manual/admin, voto S54 vigente) y esta pantalla lo
 * dice con la verdad del grupo curado, cero link muerto. EL CONTACTO
 * es DATO del founder (hueco DECLARADO al reporte: la voz lo espera —
 * se agrega con su literal, jamás un email inventado, L-139).
 */

import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Encabezado, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function SolicitarAcceso() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('bienvenida.solicitarTitulo')}
        atras
        onAtras={() => router.back()}
      />
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[6], gap: spacing[5] }}>
        <Text
          style={{
            fontFamily: typography.family.sans.light,
            fontSize: typography.size.xl,
            lineHeight: typography.size.xl * typography.leading.snug,
            color: theme.text.primary,
            textAlign: 'center',
          }}
        >
          {t('bienvenida.solicitarCuerpoTitulo')}
        </Text>
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            lineHeight: typography.size.base * typography.leading.normal,
            color: theme.text.secondary,
            textAlign: 'center',
          }}
        >
          {t('bienvenida.solicitarCuerpo')}
        </Text>
        <Boton variante="secundario" etiqueta={t('bienvenida.volver')} bloque onPress={() => router.back()} />
      </View>
    </View>
  );
}
