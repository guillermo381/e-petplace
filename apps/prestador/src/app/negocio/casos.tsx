/**
 * S114-C · NEGOCIOS · LA BANDEJA DE CASOS — §5 de `DIRECCION_POSTVENTA`.
 *
 * TESIS (Ley 14): *hay algo que resolver, y sé de qué, con quién y cuánto me
 * queda.*
 *
 * FIRMA (Ley 15): **tres acciones y nada más** — Responder · Reconocer y
 * resolver · Pedir a e-PetPlace. §5 las nombra y cierra la lista.
 *
 * CHANEL (Ley 16): **el reloj se ve y NO es rojo**, y no late. `BannerPlazo`
 * lo hace inexpresable (cero `danger`, cero reloj adentro). *Un countdown
 * sobre el incumplimiento convierte la espera en espectáculo* — y acá el que
 * espera es el otro lado.
 *
 * 🔴 **EL HISTORIAL ES UNA LISTA, JAMÁS UN PUNTAJE** (§5). Sin barras, sin
 * porcentajes, sin comparación con otros prestadores. *Un número sobre cómo
 * te fue en tus casos es una calificación, y la letra la prohíbe con todas
 * las letras.* Por eso esta pantalla **no cuenta nada**: dibuja filas.
 *
 * ⚠️ **`FilaBandejaCaso` está memoizada por item** (`mismoCaso`), así que
 * todo lo que la fila dibuja viaja EN el item — incluido el reloj ya
 * redactado. Componerlo en el render rompería la memoización sin avisar.
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaBandejaCaso,
  Texto,
  spacing,
  useTheme,
  type CasoEnBandeja as FilaDeBandeja,
} from '@epetplace/ui';
import { obtenerCasosDelPrestador, type CasoEnBandeja } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

export default function CasosDelPrestador() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [casos, setCasos] = useState<Fase<CasoEnBandeja[]>>('cargando');

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerCasosDelPrestador();
        if (!vigente) return;
        setCasos(r.ok ? r.data : 'error');
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  /* §5 · el reloj, **ya redactado y sin reloj vivo**. Se compone acá y viaja
     en el item: la fila está memoizada y componerlo en el render la
     redibujaría sin que nada haya cambiado. */
  const filas: FilaDeBandeja[] = useMemo(() => {
    if (typeof casos === 'string') return [];
    const ahora = Date.now();
    return casos.map((c) => {
      const horas =
        c.plazoHasta !== null
          ? Math.max(0, Math.round((new Date(c.plazoHasta).getTime() - ahora) / 3_600_000))
          : null;
      return {
        clave: c.casoId,
        objeto: t(`postventa.objeto_${c.objetoTipo}` as 'postventa.objeto_cita'),
        contraparte: t('postventa.laFamilia'),
        motivo: c.motivo,
        /* Ausente cuando ya no espera nada mío: una línea vacía donde iba un
           plazo se lee como «sin plazo», que es otra cosa. */
        ...(horas !== null && horas > 0 ? { reloj: t('postventa.teQuedan', { horas }) } : null),
      };
    });
  }, [casos, t]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('postventa.casosTitulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[6],
          gap: spacing[3],
        }}
      >
        {casos === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={72} />
          </EsqueletoGrupo>
        ) : casos === 'error' ? (
          /* Ley 13: el error jamás se disfraza de vacío. */
          <EstadoVacio titulo={t('postventa.casosNoSePudo')} />
        ) : filas.length === 0 ? (
          /* Vacío SERENO: sin casos no hay nada que resolver, y eso es la
             buena noticia — no un hueco que llenar con un número en cero. */
          <EstadoVacio titulo={t('postventa.casosVacio')} />
        ) : (
          <>
            <Texto variante="apoyo">{t('postventa.casosIntro')}</Texto>
            {filas.map((f) => (
              <FilaBandejaCaso
                key={f.clave}
                caso={f}
                onPress={() => router.push(`/negocio/caso/${f.clave}`)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
