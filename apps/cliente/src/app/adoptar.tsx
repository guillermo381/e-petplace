/**
 * ADOPTAR (S73 ítem 2, C3 — letra founder): la puerta de la ADOPCIÓN.
 *
 * C3 (mandato S72): "adoptá un nuevo miembro" NO es agregar mascota —
 * adopción es REFUGIOS, otro actor de EL NORTE. Esta pantalla es la
 * FEATURE nueva en su peldaño 0: el próximamente HONESTO del actor que
 * todavía no llegó (hoy 0 refugios en DB — mismo dato que la sección de
 * Explorar). Sin marketing falso, sin lista vacía disfrazada: la voz
 * dice qué va a vivir acá y cuándo ("cuando estén"), y el atrás es el
 * camino (precedente: los próximamente serenos de S52).
 *
 * TESIS: "acá va a empezar una historia nueva — todavía no, y te lo
 * decimos derecho." FIRMA: la voz. CHANEL: cero CTA decorativo (el
 * vacío sereno no inventa acciones); cero componente nuevo.
 */

import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Encabezado, EstadoVacio, Icono, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function Adoptar() {
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adoptar.titulo')} atras onAtras={() => router.back()} />
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[6] }}>
        <EstadoVacio
          icono={<Icono nombre="refugio" tamano={48} />}
          titulo={t('adoptar.proximamenteTitulo')}
          descripcion={t('adoptar.proximamenteDetalle')}
        />
      </View>
    </SafeAreaView>
  );
}
