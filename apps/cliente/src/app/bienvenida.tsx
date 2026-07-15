/**
 * Bienvenida (S45-B4 → REESCRITA S61-A8, letra firmada founder sobre
 * propuesta Claude Design — TRADUCIDA a la casa, no verbatim):
 * composición vertical serena — isotipo en gradiente oficial (el UNO
 * por pantalla; el isotipo va FUERA de la contabilidad de dosis, Ley 4)
 * · "el ecosistema del mundo mascota" en mono minúsculas · lockup
 * e.petplace · el titular EL NORTE en DM Sans light display (Playfair
 * PROHIBIDA; el acento en "una vida" es GRÁFICA — palette.pink, la
 * reserva del destello) · Boton marca (gradiente = la dosis del
 * contexto cerrado) · secundario · legales HONESTOS sin link muerto
 * (D-336: los textos definitivos no existen — la línea declara, no
 * finge navegar). El movimiento de marca = D-395 (v1 estática digna).
 *
 * TESIS: "acá vive la vida de tu mascota — entrá". FIRMA: el titular
 * de EL NORTE con su destello en "una vida". Memorial N/A (pre-sesión);
 * Boton marca degrada solo si algún día aplica.
 */

import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Isotipo, palette, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function Bienvenida() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        paddingTop: insets.top + spacing[8],
        paddingBottom: insets.bottom + spacing[6],
        paddingHorizontal: spacing[5],
      }}
    >
      {/* La identidad — el isotipo preside, la voz de máquina lo rotula */}
      <View style={{ alignItems: 'center', gap: spacing[3] }}>
        <Isotipo size={72} variant="gradiente" />
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.xs,
            letterSpacing: typography.tracking.mono,
            color: theme.text.secondary,
          }}
        >
          {t('bienvenida.ecosistema')}
        </Text>
        {/* el lockup — nombre de marca, identidad (no es string de voz) */}
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.lg,
            color: theme.text.primary,
          }}
        >
          e.petplace
        </Text>
      </View>

      {/* EL NORTE — el titular respira en el centro */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text
          style={{
            fontFamily: typography.family.sans.light,
            fontSize: typography.size['3xl'],
            lineHeight: Math.round(typography.size['3xl'] * typography.leading.snug),
            letterSpacing: typography.tracking.tight,
            color: theme.text.primary,
          }}
        >
          {t('bienvenida.titular')}{' '}
          <Text style={{ color: palette.pink }}>{t('bienvenida.titularAcento')}</Text>
        </Text>
      </View>

      {/* Los caminos + los legales honestos */}
      <View style={{ gap: spacing[2] }}>
        <Boton variante="marca" etiqueta={t('bienvenida.crearCuenta')} bloque onPress={() => router.push('/registro')} />
        <Boton variante="secundario" etiqueta={t('bienvenida.yaTengoCuenta')} bloque onPress={() => router.push('/login')} />
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.xs,
            lineHeight: Math.round(typography.size.xs * typography.leading.normal),
            color: theme.text.tertiary,
            textAlign: 'center',
            marginTop: spacing[2],
          }}
        >
          {t('bienvenida.legales')}
        </Text>
      </View>
    </View>
  );
}
