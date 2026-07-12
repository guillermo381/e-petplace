/**
 * Onboarding · paso mascota (S45-B4) — "¿Quién vive con vos?".
 * Especies del CATÁLOGO real vía wrapper (regla 21, las 6 F1 post-D-287).
 * Dosis normal: sin gradiente (el hero quedó en bienvenida).
 * URL-reconstruible: no depende de estado previo; avanza por params.
 */

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  SelectorEspecie,
  spacing,
  useTheme,
  type AvatarMascotaEspecie,
  type SelectorEspecieOpcion,
} from '@epetplace/ui';
import { obtenerEspeciesActivas } from '@epetplace/api';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';

export default function PasoMascota() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState<string | undefined>(undefined);
  const [opciones, setOpciones] = useState<SelectorEspecieOpcion[] | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerEspeciesActivas();
      if (!vigente) return;
      if (!r.ok) {
        setErrorCatalogo(r.mensaje);
        return;
      }
      const validas: SelectorEspecieOpcion[] = [];
      for (const e of r.data) {
        if (esEspecieUi(e.codigo)) validas.push({ codigo: e.codigo, nombre: e.nombre });
      }
      setOpciones(validas);
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const puedeContinuar = nombre.trim().length > 0 && especie !== undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="portada" saludo={t('onboarding.titulo')} isotipo="ninguno" />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        <Campo label={t('onboarding.nombreLabel')} placeholder={t('onboarding.nombrePlaceholder')} value={nombre} onChangeText={setNombre} autoCapitalize="words" />

        {opciones === null && errorCatalogo === undefined ? (
          // Ley 13: esqueleto ESTÁTICO imitando el grid 3×2 del selector
          <EsqueletoGrupo etiqueta={t('onboarding.cargandoEspecies')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
              {Array.from({ length: 6 }, (_, i) => (
                <View key={i} style={{ flexBasis: '30%', flexGrow: 1 }}>
                  <Esqueleto forma="bloque" alto={120} />
                </View>
              ))}
            </View>
          </EsqueletoGrupo>
        ) : null}

        {opciones !== null ? (
          <SelectorEspecie
            opciones={opciones}
            seleccionada={especie}
            onSelect={setEspecie}
            etiqueta={t('onboarding.especieEtiqueta')}
          />
        ) : null}

        {errorCatalogo !== undefined ? (
          <Boton variante="secundario" etiqueta={t('onboarding.reintentar')} onPress={() => router.replace('/onboarding/mascota')} />
        ) : null}

        <Boton
          etiqueta={t('onboarding.continuar')}
          bloque
          deshabilitado={!puedeContinuar}
          onPress={() => {
            if (!puedeContinuar || especie === undefined) return;
            router.push({
              pathname: '/onboarding/fecha',
              params: { nombre: nombre.trim(), especie },
            });
          }}
        />
      </ScrollView>
    </View>
  );
}
