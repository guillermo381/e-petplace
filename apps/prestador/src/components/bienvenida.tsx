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
 *
 * ── 🔴 S99-C · LA TERCERA PUERTA, hallazgo de caminar el Gate 2 ───────
 * Esta pantalla ofrecía dos caminos y **los dos eran del prestador**. Un
 * repartidor recién registrado por su negocio —que llega porque alguien
 * le dijo «entrá con este correo»— tenía que tocar **«Ingresar»**, una
 * puerta que todavía no le sirve, para recién ahí descubrir «Crear tu
 * cuenta» escondida abajo del formulario. *La pantalla le pedía adivinar.*
 *
 * **Lo que NO se tocó, y se declara:** el titular es **letra founder
 * firmada** (S61-B13 · S87-C) y el subtítulo habla del grupo curado de
 * prestadores fundadores. **La puerta era lo que faltaba, no el saludo**
 * — y reescribir copy pendiente de gate para arreglar un camino ausente
 * habría sido curar el síntoma en el lugar equivocado. *Si al founder le
 * suena excluyente el subtítulo, es firma suya, no cura mía.*
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

      {/* LAS TRES PUERTAS — un solo sólido, el resto etiquetas (19.7).
          Las dos etiquetas NAVEGAN, así que llevan chevron: *información
          despliega, acción lleva* (E14). Iba sin él en la que ya existía;
          se le pone a las dos, porque dos hermanas donde una tiene flecha
          y la otra no se lee como que una está rota. */}
      <View style={{ gap: spacing[2] }}>
        <Boton
          variante="primario"
          etiqueta={t('bienvenida.ingresar')}
          bloque
          onPress={() => router.push('/login')}
        />
        <Boton
          variante="ghost"
          etiqueta={t('bienvenida.registradoPorNegocio')}
          bloque
          chevron
          onPress={() => router.push('/registro')}
        />
        <Boton
          variante="ghost"
          etiqueta={t('bienvenida.solicitarAcceso')}
          bloque
          chevron
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
