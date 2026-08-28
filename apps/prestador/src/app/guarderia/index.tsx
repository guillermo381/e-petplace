/**
 * EL MUNDO GUARDERÍA — su portada (S107-C, tanda 8).
 *
 * Dos puertas: **tu día** (lo que pasa hoy) y **la configuración** (cupo,
 * ventanas y precio). Es la misma anatomía que `/paseo` y `/grooming`.
 *
 * ── ⚠️ TENSIÓN DECLARADA CON §15b, Y NO LA RESUELVO ACÁ ─────────────────
 * `DISEÑO_EXPERIENCIA` §15b firma **«HOY acciona / NEGOCIO gestiona»**, y
 * *«tu día»* es de HOY, no de Negocio. **Está acá porque HOY tiene 2.854
 * líneas y su propia lógica de merge de citas** —y una estadía-día no es una
 * cita con hora: es un día entre dos ventanas—, así que inyectarla ahí es un
 * cambio a la pantalla que el prestador usa todos los días y merece su tanda.
 *
 * 🔴 **Se declara en vez de dejarlo pasar:** el destino correcto de «tu día»
 * es una entrada en HOY. *Una ley firmada que se incumple en silencio se
 * vuelve una ley que nadie sabe que rige.*
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CeldaNavegacion, Encabezado, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function MundoGuarderia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('mundoGuarderia.titulo')} atras onAtras={() => router.back()} />
      <View style={{ padding: spacing[5], gap: spacing[3] }}>
        <CeldaNavegacion
          icono="guarderia"
          titulo={t('mundoGuarderia.tuDia')}
          detalle={t('mundoGuarderia.tuDiaDetalle')}
          onPress={() => router.push('/guarderia/dia')}
        />
        <CeldaNavegacion
          icono="preferencias"
          titulo={t('mundoGuarderia.configuracion')}
          detalle={t('mundoGuarderia.configuracionDetalle')}
          onPress={() => router.push('/guarderia/taller')}
        />
      </View>
    </View>
  );
}
