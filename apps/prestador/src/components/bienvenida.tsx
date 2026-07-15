/**
 * LA BIENVENIDA DEL PRESTADOR (S61-B8, letra founder) — el landing
 * sin-sesión del raíz (reemplaza al EstadoVacio de S51; las ramas de
 * error y sin-rol quedan intactas en el layout).
 *
 * TESIS: "esta app respeta tu oficio — entrás a un grupo curado, no a
 * un marketplace más."
 * FIRMA: el lockup del oficio — isotipo en tealDark (el acento del
 * prestador, enmienda aditiva de Isotipo) + 'para prestadores' en mono
 * minúsculas: la marca de la casa hablando el registro del trabajo.
 * CHANEL: los sellos del pie van SIN ícono (no existe glifo b′ legal
 * para 'identidad verificada'; poner solo el de pagos rompía la
 * simetría — texto terciario sereno). Dosis §15b: CTA en TINTA (jamás
 * verde sólido), cero gradiente, un solo acento (el teal del lockup).
 */

import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Isotipo, palette, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export function BienvenidaPrestador() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        padding: spacing[6],
        justifyContent: 'center',
        gap: spacing[8],
      }}
    >
      {/* el lockup del oficio — LA FIRMA */}
      <View style={{ alignItems: 'center', gap: spacing[2] }}>
        <Isotipo size={64} color={palette.tealDark} />
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.sm,
            letterSpacing: typography.tracking.mono,
            color: theme.text.secondary,
          }}
        >
          {t('bienvenida.paraPrestadores')}
        </Text>
      </View>

      <View style={{ gap: spacing[3] }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: typography.family.sans.light,
            fontSize: typography.size['2xl'],
            lineHeight: typography.size['2xl'] * typography.leading.snug,
            color: theme.text.primary,
            textAlign: 'center',
          }}
        >
          {t('bienvenida.titular')}
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
          {t('bienvenida.subtitulo')}
        </Text>
      </View>

      <View style={{ gap: spacing[2] }}>
        <Boton
          variante="primario"
          etiqueta={t('bienvenida.ingresar')}
          bloque
          onPress={() => router.push('/login')}
        />
        <Boton
          variante="ghost"
          etiqueta={t('bienvenida.solicitarAcceso')}
          bloque
          onPress={() => router.push('/solicitar-acceso')}
        />
      </View>

      {/* los sellos — voz terciaria, sin ícono (Chanel declarado) */}
      <Text
        style={{
          fontFamily: typography.family.sans.regular,
          fontSize: typography.size.sm,
          color: theme.text.tertiary,
          textAlign: 'center',
        }}
      >
        {`${t('bienvenida.selloIdentidad')} · ${t('bienvenida.selloPagos')}`}
      </Text>
    </View>
  );
}
