/**
 * Alta de mascota adicional · paso mascota (S55-A A2) — espejo del
 * onboarding S45 para la familia EXISTENTE, dentro del stack del Hogar
 * (tabs visibles, back natural). Nace por el riel i18n (tuteo neutro).
 * URL-reconstruible: avanza por params, como el onboarding.
 * Escalera: el flujo no muestra datos del expediente — la mascota nueva
 * aterriza en peldaño 0 (voz "aún conociéndolo", historia que empieza).
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
  type SelectorEspecieOpcion,
} from '@epetplace/ui';
import { obtenerEspeciesActivas } from '@epetplace/api';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';

export default function AgregarPasoMascota() {
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
      <Encabezado variante="navegacion" titulo={t('agregarMascota.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        <Campo
          label={t('agregarMascota.nombreLabel')}
          placeholder={t('agregarMascota.nombrePlaceholder')}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
        />

        {opciones === null && errorCatalogo === undefined ? (
          // Ley 13: esqueleto ESTÁTICO imitando el grid 3×2 del selector
          <EsqueletoGrupo etiqueta={t('agregarMascota.cargandoEspecies')}>
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
            etiqueta={t('agregarMascota.especieEtiqueta')}
          />
        ) : null}

        {errorCatalogo !== undefined ? (
          <Boton variante="secundario" etiqueta={t('agregarMascota.reintentar')} onPress={() => router.replace('/hogar/agregar')} />
        ) : null}

        <Boton
          etiqueta={t('agregarMascota.continuar')}
          bloque
          deshabilitado={!puedeContinuar}
          onPress={() => {
            if (!puedeContinuar || especie === undefined) return;
            router.push({
              pathname: '/hogar/agregar/fecha',
              params: { nombre: nombre.trim(), especie },
            });
          }}
        />
      </ScrollView>
    </View>
  );
}
