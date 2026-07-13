/**
 * Cuenta · Preferencias (S57-B, P17) — el idioma se MUDA acá desde
 * Negocio, y gana la persistencia D-316 del cliente (el cambio viaja a
 * DB además del dispositivo — verdad multi-dispositivo). Notificaciones:
 * el vocabulario de tipos del LADO PRESTADOR no existe todavía (el del
 * cliente es suyo — inventar tipos acá sería catálogo imaginado, L-084);
 * la sección dice su verdad ("Pronto") y despierta con el motor B4.
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Encabezado,
  SelectorOpcion,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { cambiarIdioma, type IdiomaSoportado } from '@epetplace/i18n';
import { guardarIdiomaPreferido } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function PreferenciasCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [cambiando, setCambiando] = useState(false);

  async function alElegirIdioma(codigo: string) {
    if (cambiando || codigo === idioma || (codigo !== 'es' && codigo !== 'en')) return;
    setCambiando(true);
    try {
      await cambiarIdioma(codigo as IdiomaSoportado);
    } catch {
      mostrar({ texto: t('negocio.idiomaError'), variante: 'error' });
    }
    // D-316 (paridad con el cliente): la preferencia viaja a DB; si
    // falla, se dice — el idioma local ya cambió (regla 36).
    const r = await guardarIdiomaPreferido(codigo as IdiomaSoportado);
    if (!r.ok) mostrar({ texto: t('negocio.idiomaError'), variante: 'error' });
    setCambiando(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('miCuenta.preferencias')} atras onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[5] }}>
        <Tarjeta>
          <SelectorOpcion
            etiqueta={t('negocio.idioma')}
            opciones={[
              { codigo: 'es', etiqueta: t('negocio.idiomaEs') },
              { codigo: 'en', etiqueta: t('negocio.idiomaEn') },
            ]}
            seleccionada={idioma}
            onSelect={(codigo) => void alElegirIdioma(codigo)}
          />
        </Tarjeta>

        {/* Notificaciones — la verdad: el vocabulario del prestador no
            existe; el lugar queda hecho y lo dice (jamás toggles que
            no gobiernan nada). */}
        <View style={{ gap: spacing[3] }}>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
          >
            {t('miCuenta.notificaciones')}
          </Text>
          <Tarjeta>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: typography.size.sm * 1.4,
                color: theme.text.secondary,
              }}
            >
              {t('miCuenta.notifPronto')}
            </Text>
          </Tarjeta>
        </View>
      </ScrollView>
    </View>
  );
}
