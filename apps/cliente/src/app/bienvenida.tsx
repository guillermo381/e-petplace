/**
 * Bienvenida (S45-B4 → REESCRITA S61-A8, letra firmada founder sobre
 * propuesta Claude Design — TRADUCIDA a la casa, no verbatim):
 * composición vertical serena — isotipo en gradiente oficial (el UNO
 * por pantalla; el isotipo va FUERA de la contabilidad de dosis, Ley 4)
 * · lockup e.petplace (la línea mono del ecosistema MURIÓ en S82 —
 * Chanel contra la vara "el sujeto sin explicación")
 * · el titular EL NORTE en DM Sans light display (Playfair
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
import { Boton, Entrada, Isotipo, palette, spacing, typography, useTheme } from '@epetplace/ui';

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
      {/* La identidad — el isotipo preside, el lockup lo rotula.
          S82 (vara: "se entra sabiendo que el sujeto es la mascota, sin
          que nadie lo explique") — Chanel: murió la línea mono "el
          ecosistema del mundo mascota". Era la única línea que EXPLICABA
          (y hablaba de la plataforma, no de la mascota); el lockup ya
          rotula la marca. El titular queda solo con su trabajo. */}
      <View style={{ alignItems: 'center', gap: spacing[3] }}>
        <Isotipo size={72} variant="gradiente" />
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

      {/* EL NORTE — el titular respira en el centro.
          S81 (regla 80 · §5 LA ENTRADA): la lectura entra escalonada —
          titular → CTAs → legales. La IDENTIDAD (isotipo/lockup) NO se
          envuelve: es el ancla del lugar, no ordena lectura (L-c —
          decisión declarada para el gate; la pantalla no tiene
          subtítulo nombrable: la línea mono es identidad). */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Entrada>
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
        </Entrada>
      </View>

      {/* Los caminos + los legales honestos */}
      <View style={{ gap: spacing[2] }}>
        <Entrada orden={1}>
          <View style={{ gap: spacing[2] }}>
            <Boton variante="marca" etiqueta={t('bienvenida.crearCuenta')} bloque onPress={() => router.push('/registro')} />
            {/* ⏪ S82-B r5 — ESTA ERA LA PANTALLA DEL GATE de `sinCaja` (su
                única consumidora hasta la firma), esperando que el founder
                decidiera entre el tinte sin borde y el contorno.

                ☠️ **S104-B — EL GATE SE CIERRA POR LETRA, NO POR FIRMA
                SOBRE PÍXELES:** `RITUAL_DE_ENTRADA` §2.4 dicta *«**Ya tengo
                cuenta** en `ghost`»*. Ni `sinCaja` ni `secundario`: la
                tercera opción, que es la que la 19.7 pedía desde siempre —
                por superficie UN sólido (acá el `marca` de arriba) y el
                resto baja a label.

                ⚠️ **Y baja el trinquete de `R48` de 5 a 4**, que es
                solo-baja: el alias jubilado pierde su consumidor más
                visible. *La variante que esperaba gate se resolvió al
                quedar sin pantalla que la defendiera.* */}
            <Boton variante="ghost" etiqueta={t('bienvenida.yaTengoCuenta')} bloque onPress={() => router.push('/login')} />
          </View>
        </Entrada>
        <Entrada orden={2}>
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
        </Entrada>
      </View>
    </View>
  );
}
