/**
 * GUARDERÍA · **EL DURANTE, DEL LADO DE LA FAMILIA** (S107-C).
 *
 * *«¿Dónde está Thor ahora?»* — la única pregunta por la que se abre esta
 * pantalla, y las tres cosas que la contestan: **en qué momento del día está**,
 * **qué le pasó** (las fotos y los clips) y, mientras viaja, **dónde va**.
 *
 * ═══ 🔴 ESTADO REAL — leelo antes de tocarla ══════════════════════════════
 *
 * **Está construida y todavía NO es alcanzable, y las dos mitades son
 * deliberadas** (molde literal de `pedidos/serie/[serieId].tsx`, S103-C):
 *
 * · ✅ **LA MEDIA ES REAL.** `obtenerMediaDeMiMascota(mascotaId, fecha)` existe
 *   y se llama de verdad — la mitad que el motor sí sostiene funciona hoy.
 *   Y su recorte es del SERVER: *«los otros animales de la foto no viajan —
 *   ni el id, ni el nombre, ni el conteo»*. **Lo que no viaja no se filtra mal.**
 * · ❌ **LA ESTADÍA NO SE PUEDE LEER.** Medido el 29-ago: no existe lector de
 *   estadías del lado de la familia. `cargarEstadia` es **el enchufe pendiente
 *   con nombre**, y su contrato está en `lib/guarderia/estadia-en-curso.ts`.
 *
 * 🔴 **Y POR ESO NO SE CABLEÓ LA ENTRADA DESDE EL HUB.** *Una fila que lleva a
 * una pantalla que no puede leer nada es un callejón con nombre bonito* — el
 * precedente es de esta casa y su frase es literal. **La entrada nace con el
 * lector, en la misma línea.** Hasta entonces la ruta se alcanza a mano, y así
 * se gatea.
 *
 * ── 🔴 EL PUNTO VIVO: UNA REGLA QUE NO SE NEGOCIA ────────────────────────
 *
 * > **UN PUNTO O NADA. JAMÁS LA TRAZA.**
 * > *Las paradas de una ruta son las casas de otras familias* — un recorrido
 * > dibujado cuenta a quién más recogieron y en qué orden, que es información
 * > de terceros que nadie autorizó.
 *
 * **Y acá no se sostiene con disciplina: se sostiene por construcción.** A
 * `MapaRecorrido` se le pasa un array de **exactamente un punto**, y una
 * polilínea de un punto no dibuja nada. *No hay forma de que un descuido
 * futuro pinte una traza sin antes agregar puntos a mano.*
 *
 * El lector **ya devuelve un punto o `null`** (`obtenerPuntoVivo`), y el
 * recorte vive en el servidor. `null` **no es un error**: es *«todavía no
 * salió»*, y la pantalla lo dice en vez de mostrar un punto viejo.
 *
 * ── LA FORMA ─────────────────────────────────────────────────────────────
 * N21: cada grupo rotulado en su carta. **El estado preside** porque es lo que
 * cambia lo que la familia tiene que hacer; el mapa **sólo existe mientras hay
 * viaje**; y la media **se cuenta acá aunque el aviso no lo haga**: el digest
 * agrupa sin decir número a propósito, y acá el número sirve porque hay algo
 * que abrir.
 */

import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MapaRecorrido,
  MarcaDeMapa,
  Tarjeta,
  Texto,
  VisorFoto,
  radius,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerMediaDeMiMascota,
  obtenerPuntoVivo,
  type MediaGuarderia,
  type PuntoVivo,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import type { EstadiaEnCurso } from '@/lib/guarderia/estadia-en-curso';

const LADO_THUMB = 96;

/**
 * 🔴 EL ENCHUFE PENDIENTE — pedido a la pista A
 * (`docs/loop/S107-C-PEDIDO-A-A-LOG-FAMILIA.md`).
 *
 * Devuelve `null` mientras el lector no exista. **No se improvisa una lectura
 * directa a la tabla**: `packages/api` es la puerta única de la casa y es
 * territorio de A. *Escribir un `supabase.from('guarderia_estadias')` acá sería
 * saltarse la puerta para llegar tres días antes, y esa deuda la paga otro.*
 */
async function cargarEstadia(_estadiaId: string): Promise<EstadiaEnCurso | null> {
  return null;
}

/** Los dos tramos: mientras viaja, hay a dónde mirar. */
function estaViajando(e: EstadiaEnCurso): boolean {
  return e.estado === 'recogida_en_curso' || e.estado === 'retorno_en_curso';
}

type Estadia = { fase: 'cargando' } | { fase: 'sinLector' } | { fase: 'listo'; e: EstadiaEnCurso };
type Media = { fase: 'cargando' } | { fase: 'error' } | { fase: 'listo'; lista: MediaGuarderia[] };

export default function DuranteGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    estadiaId?: string;
    mascotaId?: string;
    mascotaNombre?: string;
    fecha?: string;
  }>();

  const [estadia, setEstadia] = useState<Estadia>({ fase: 'cargando' });
  const [media, setMedia] = useState<Media>({ fase: 'cargando' });
  const [punto, setPunto] = useState<PuntoVivo | null>(null);
  const [visor, setVisor] = useState<number | null>(null);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const e = await cargarEstadia(params.estadiaId ?? '');
      if (!vigente) return;
      setEstadia(e === null ? { fase: 'sinLector' } : { fase: 'listo', e });
    })();
    return () => {
      vigente = false;
    };
  }, [params.estadiaId]);

  /* ✅ LA MITAD VIVA. Sólo necesita mascota y fecha, y las dos viajan por
     parámetro — por eso funciona hoy aunque la estadía no se pueda leer. */
  useEffect(() => {
    const mascotaId = params.mascotaId;
    if (typeof mascotaId !== 'string' || mascotaId.length === 0) {
      setMedia({ fase: 'error' });
      return;
    }
    let vigente = true;
    void (async () => {
      const r = await obtenerMediaDeMiMascota(mascotaId, params.fecha);
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «no hay fotos» (Ley 13): la familia
         leería «no le sacaron ninguna» cuando lo cierto es «no pudimos
         preguntar» — y en el durante esa diferencia es angustia. */
      setMedia(r.ok ? { fase: 'listo', lista: r.data } : { fase: 'error' });
    })();
    return () => {
      vigente = false;
    };
  }, [params.mascotaId, params.fecha]);

  /* EL PUNTO, sólo mientras viaja. Se apaga solo al cambiar de estado. */
  useEffect(() => {
    if (estadia.fase !== 'listo') return;
    const tramoId = estadia.e.tramoActivoId;
    if (tramoId === null || !estaViajando(estadia.e)) {
      setPunto(null);
      return;
    }
    let vigente = true;
    const leer = async () => {
      const r = await obtenerPuntoVivo(tramoId);
      if (vigente && r.ok) setPunto(r.data);
    };
    void leer();
    /* Sondeo con la cadencia de la casa (~30 s), como el EN VIVO del paseo.
       🔴 Y **jamás se promete «tiempo real»**: la voz dice cuándo se lo vio. */
    const id = setInterval(() => void leer(), 30_000);
    return () => {
      vigente = false;
      clearInterval(id);
    };
  }, [estadia]);

  const fotos = media.fase === 'listo' ? media.lista.filter((m) => m.tipo === 'foto') : [];

  const vozDelEstado = useCallback(
    (e: EstadiaEnCurso): string =>
      t(
        e.estado === 'reservada'
          ? 'duranteGuarderia.reservada'
          : e.estado === 'recogida_en_curso'
            ? 'duranteGuarderia.recogidaEnCurso'
            : e.estado === 'en_guarderia'
              ? 'duranteGuarderia.enGuarderia'
              : e.estado === 'retorno_en_curso'
                ? 'duranteGuarderia.retornoEnCurso'
                : e.estado === 'entregada'
                  ? 'duranteGuarderia.entregada'
                  : e.estado === 'no_recogida'
                    ? 'duranteGuarderia.noRecogida'
                    : 'duranteGuarderia.cancelada',
        { nombre: e.mascotaNombre },
      ),
    [t],
  );

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        atras
        /* 🔴 SIN MASCOTA CAE A «Guardería», NO a «Su día» — el recorrido lo
           destapó: el cabezal y la sección de fotos decían **la misma frase
           dos veces en la misma pantalla**. *Chanel: si dice lo mismo, sobra
           uno.* Y el que se queda es el de la sección, porque rotula algo. */
        titulo={params.mascotaNombre ?? t('hubGuarderia.titulo')}
        onAtras={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {/* ── ① EL MOMENTO DEL DÍA — preside ── */}
        {estadia.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
          </EsqueletoGrupo>
        ) : estadia.fase === 'sinLector' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('duranteGuarderia.sinEstadoTitulo')}
            descripcion={t('duranteGuarderia.sinEstadoDetalle')}
          />
        ) : (
          <Tarjeta>
            <View style={{ gap: spacing[2] }}>
              <Texto variante="titulo">{vozDelEstado(estadia.e)}</Texto>
              <Texto variante="apoyo">{estadia.e.prestadorNombre}</Texto>
            </View>
          </Tarjeta>
        )}

        {/* ── ② DÓNDE VA — sólo mientras viaja ── */}
        {estadia.fase === 'listo' && estaViajando(estadia.e) ? (
          <Tarjeta>
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('duranteGuarderia.dondeVa')}</Texto>
              {punto === null ? (
                <Texto variante="apoyo">{t('duranteGuarderia.sinPunto')}</Texto>
              ) : (
                <>
                  <MapaRecorrido
                    modo="vivo"
                    mirada="espectador"
                    alto={220}
                    puntos={[{ lat: punto.lat, lng: punto.lon, t: punto.vistoEn }]}
                    centroInicial={{ lat: punto.lat, lng: punto.lon }}
                    marcadorVivo={<MarcaDeMapa variante="moto" />}
                  />
                  <Texto variante="apoyo">
                    {t('duranteGuarderia.vistoA', {
                      hora: new Date(punto.vistoEn).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    })}
                  </Texto>
                </>
              )}
            </View>
          </Tarjeta>
        ) : null}

        {/* ── ③ SU DÍA — las fotos y los clips ── */}
        <Tarjeta>
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('duranteGuarderia.suDia')}</Texto>

            {media.fase === 'cargando' ? (
              <EsqueletoGrupo>
                <Esqueleto alto={LADO_THUMB} />
              </EsqueletoGrupo>
            ) : media.fase === 'error' ? (
              <Texto variante="apoyo">{t('duranteGuarderia.mediaNoCargo')}</Texto>
            ) : media.lista.length === 0 ? (
              <Texto variante="apoyo">{t('duranteGuarderia.sinMediaTodavia')}</Texto>
            ) : (
              <>
                <Texto variante="apoyo">
                  {media.lista.length === 1
                    ? t('duranteGuarderia.cuentaUna')
                    : t('duranteGuarderia.cuenta', { n: media.lista.length })}
                </Texto>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                  {fotos.map((m, i) => (
                    <Pressable
                      key={m.mediaId}
                      onPress={() => setVisor(i)}
                      accessibilityRole="button"
                      accessibilityLabel={t('duranteGuarderia.verFoto', {
                        i: i + 1,
                        total: fotos.length,
                      })}
                    >
                      <Image
                        source={{ uri: m.archivoUrl }}
                        contentFit="cover"
                        transition={0}
                        style={{ width: LADO_THUMB, height: LADO_THUMB, borderRadius: radius.md }}
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        </Tarjeta>
      </ScrollView>

      <VisorFoto
        visible={visor !== null}
        onCerrar={() => setVisor(null)}
        fotos={fotos.map((m) => m.archivoUrl)}
        indiceInicial={visor ?? 0}
        etiqueta={t('duranteGuarderia.suDia')}
      />
    </SafeAreaView>
  );
}
