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
import {
  obtenerCasosDelPrestador,
  obtenerMotivosDeObjeto,
  type CasoEnBandeja,
  type ObjetoPostventa,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { tituloDelObjeto } from '@/lib/voz-del-caso';

/**
 * 🔴 **LAS ETAPAS QUE YA NO ESPERAN NADA DEL PRESTADOR.** Sobre ellas **no se
 * dice un plazo**: «Te quedan 22 horas para responder» en un caso cerrado es
 * un dato verosímil-falso — la frase es correcta como plantilla y **miente
 * sobre el mundo**, porque ahí ya no se puede responder.
 *
 * *Lo vi en el aparato: el banner y la barra «en lectura» convivían en la
 * misma pantalla, uno prometiendo una acción que el otro ya había cerrado.*
 * Ningún gate lo ve: los dos son correctos por separado.
 */
const YA_NO_ESPERAN: ReadonlySet<string> = new Set([
  'resuelto', 'cerrado', 'resuelto_entre_partes', 'retirado', 'sin_lugar',
]);

type Fase<T> = T | 'cargando' | 'error';

export default function CasosDelPrestador() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [casos, setCasos] = useState<Fase<CasoEnBandeja[]>>('cargando');
  /* 🔴 EL MOTIVO LLEGA COMO CÓDIGO, NO COMO VOZ — y sin esto la fila decía
     `calidad` en la pantalla de un prestador. `CasoEnBandeja.motivo` es el
     `codigo` del catálogo; su `voz` vive en `v_motivos_resueltos`, que ya
     tiene su puerta. *Pintar el código crudo es exactamente lo que el riel de
     voz existe para evitar, y es la tercera vez en esta tanda que aparece la
     misma clase.* Mapa `codigo → voz`, pedido UNA vez por tipo de objeto
     presente (a lo sumo tres) y no por fila. */
  const [vozDeMotivo, setVozDeMotivo] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerCasosDelPrestador();
        if (!vigente) return;
        setCasos(r.ok ? r.data : 'error');
        if (!r.ok) return;

        /* Sólo los tipos que de verdad aparecen: sin casos, cero viajes. */
        const tipos = [...new Set(r.data.map((c) => c.objetoTipo))] as ObjetoPostventa[];
        const listas = await Promise.all(tipos.map((t) => obtenerMotivosDeObjeto(t)));
        if (!vigente) return;
        const mapa: Record<string, string> = {};
        for (const l of listas) {
          if (!l.ok) continue;
          for (const m of l.data) mapa[m.codigo] = m.voz;
        }
        setVozDeMotivo(mapa);
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
        c.plazoHasta !== null && !YA_NO_ESPERAN.has(c.etapa)
          ? Math.max(0, Math.round((new Date(c.plazoHasta).getTime() - ahora) / 3_600_000))
          : null;
      return {
        clave: c.casoId,
        /* §5 · **de qué servicio hablan.** ⏪ Decía «Una cita» genérico porque
           `CasoEnBandeja` no traía el título; **A lo entregó** y ahora la fila
           dice «Paseo de Thor · martes 9». */
        /* 🔴 `null` es una DECISIÓN declarada, no una omisión. El cliente
           tiene `voz-servicio.ts` (mapa código→voz, gateado); el prestador
           NO — medido: cero claves `servicioVoz` en su diccionario. Y el
           código crudo no sale a pantalla ni acá ni allá.

           Por qué se puede: **el prestador ya sabe a qué se dedica.** Lo que
           necesita para distinguir una fila de otra es mascota y fecha —
           «Una cita de Thor · martes 9» —; el tipo de comprable es el dato
           primario para la FAMILIA, que sí tiene servicios de varias clases.
           Si la mesa quiere la voz fina acá, son ~12 cadenas nuevas es/en
           con su gate, y eso se pide, no se inventa. */
        objeto: tituloDelObjeto(
          c,
          idioma,
          t(`postventa.objeto_${c.objetoTipo}` as 'postventa.objeto_cita'),
          null,
        ),
        contraparte: t('postventa.laFamilia'),
        /* Si el catálogo todavía no llegó, se muestra el código antes que un
           hueco: **una fila sin motivo no dice de qué es el caso**. Es feo un
           instante y honesto siempre. */
        motivo: vozDeMotivo[c.motivo] ?? c.motivo,
        /* Ausente cuando ya no espera nada mío: una línea vacía donde iba un
           plazo se lee como «sin plazo», que es otra cosa. */
        ...(horas !== null && horas > 0 ? { reloj: t('postventa.teQuedan', { horas }) } : null),
      };
    });
  }, [casos, idioma, t, vozDeMotivo]);

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
