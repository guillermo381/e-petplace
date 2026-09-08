/**
 * S114-C · C6 · **MIS CASOS** — Cuenta > Ayuda.
 *
 * TESIS (Ley 14): *lo que abrí y en qué quedó.*
 *
 * FIRMA (Ley 15): **los abiertos arriba.** No es orden cronológico: es que lo
 * que todavía espera algo va primero, y lo terminado se lee después.
 *
 * CHANEL (Ley 16): la misma `FilaBandejaCaso` que usa el prestador — *un caso
 * no se ve distinto según quién lo mire*. Y **sin puntaje**: es una lista.
 *
 * ⚠️ **El plazo NO se muestra acá.** `CasoEnBandeja.plazoHasta` es el reloj
 * del PRESTADOR, y §2 de la letra es explícito: *«La familia no ve el reloj de
 * 48 h — un countdown sobre el incumplimiento ajeno convierte la espera en
 * espectáculo.»* La misma pieza, dos asientos: el prestador recibe `reloj` y
 * la familia no.
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
import {
  obtenerMisCasos,
  obtenerMotivosDeObjeto,
  type CasoEnBandeja,
  type ObjetoPostventa,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { tituloDelObjeto } from '@/lib/voz-del-caso';

type Fase<T> = T | 'cargando' | 'error';

/** Las etapas en las que el caso ya terminó. Ordenan la lista (§: abiertos arriba). */
const TERMINADAS: ReadonlySet<string> = new Set([
  'resuelto', 'cerrado', 'resuelto_entre_partes', 'retirado', 'sin_lugar',
]);

export default function MisCasos() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [casos, setCasos] = useState<Fase<CasoEnBandeja[]>>('cargando');
  const [vozDeMotivo, setVozDeMotivo] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerMisCasos();
        if (!vigente) return;
        setCasos(r.ok ? r.data : 'error');
        if (!r.ok) return;

        /* El motivo llega como CÓDIGO; su voz vive en el catálogo. Una lectura
           por tipo de objeto presente, no por fila. */
        const tipos = [...new Set(r.data.map((c) => c.objetoTipo))] as ObjetoPostventa[];
        const listas = await Promise.all(tipos.map((x) => obtenerMotivosDeObjeto(x)));
        if (!vigente) return;
        const mapa: Record<string, string> = {};
        for (const l of listas) {
          if (!l.ok) continue;
          /* ⚠️ Lo PROPIO pisa a lo HEREDADO: `v_motivos_resueltos` devuelve
             `no_ejecutado` dos veces para estadía, con dos voces (aviso de D).
             Sin esto, la fila mostraría la voz de cita sobre una estadía. */
          for (const m of l.data) {
            if (mapa[m.codigo] === undefined || m.procedencia === 'propio') mapa[m.codigo] = m.voz;
          }
        }
        setVozDeMotivo(mapa);
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  const filas: FilaDeBandeja[] = useMemo(() => {
    if (typeof casos === 'string') return [];
    /* 🔴 LOS ABIERTOS ARRIBA, y dentro de cada grupo lo más nuevo primero.
       `sort` sobre una copia: ordenar el arreglo del estado lo mutaría. */
    return [...casos]
      .sort((a, b) => {
        const ta = TERMINADAS.has(a.etapa) ? 1 : 0;
        const tb = TERMINADAS.has(b.etapa) ? 1 : 0;
        if (ta !== tb) return ta - tb;
        return b.creadoEn.localeCompare(a.creadoEn);
      })
      .map((c) => ({
        clave: c.casoId,
        objeto: tituloDelObjeto(c, idioma, t(`postventa.objeto_${c.objetoTipo}` as 'postventa.objeto_cita')),
        contraparte: t('postventa.asientoPrestador'),
        motivo: vozDeMotivo[c.motivo] ?? c.motivo,
        ...(c.mascotaNombre !== null ? { nombreMascota: c.mascotaNombre } : null),
        /* Sin `reloj`: el plazo es del prestador — ver la cabecera. */
      }));
  }, [casos, idioma, t, vozDeMotivo]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('postventa.misCasosTitulo')}
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
          <EstadoVacio titulo={t('postventa.misCasosNoSePudo')} />
        ) : filas.length === 0 ? (
          /* Vacío SERENO — no haber tenido que reclamar nada es la buena
             noticia, no un hueco que llenar. */
          <EstadoVacio titulo={t('postventa.misCasosVacio')} />
        ) : (
          <>
            <Texto variante="apoyo">{t('postventa.misCasosIntro')}</Texto>
            {filas.map((f) => (
              <FilaBandejaCaso
                key={f.clave}
                caso={f}
                onPress={() => router.push(`/postventa/caso/${f.clave}`)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
