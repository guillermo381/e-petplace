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
  obtenerMisEstadiasGuarderia,
  type EstadiaDeMiMascota,
  type MediaGuarderia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

const LADO_THUMB = 96;

/* ☠️ ACÁ VIVÍA `cargarEstadia`, el enchufe pendiente, y su contrato de
   superficie `lib/guarderia/estadia-en-curso.ts`. **Los dos murieron el
   29-ago**: A publicó `obtenerMisEstadiasGuarderia` y la pantalla lee del
   objeto. *El contrato prometía morir en una línea cuando el lector existiera —
   y así fue* (Ley 37: el andamio se retira con su razón). */

/** Los dos tramos: mientras viaja, hay a dónde mirar. */
function estaViajando(e: EstadiaDeMiMascota): boolean {
  return e.estadoEstadia === 'recogida_en_curso' || e.estadoEstadia === 'retorno_en_curso';
}

type Estadia =
  | { fase: 'cargando' }
  | { fase: 'noPudimos' }
  /** El id no está entre las estadías de esta familia. */
  | { fase: 'noEsTuya' }
  | { fase: 'listo'; e: EstadiaDeMiMascota };
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
  const [visor, setVisor] = useState<number | null>(null);

  useEffect(() => {
    const id = params.estadiaId;
    if (typeof id !== 'string' || id.length === 0) { setEstadia({ fase: 'noPudimos' }); return; }
    let vigente = true;
    void (async () => {
      /* 🔴 SE PIDE POR MASCOTA Y SE BUSCA EL ID, no se pide «la estadía»: el
         lector de A es por familia, y **eso es correcto** — *la RLS ya decide
         qué es tuyo, y un lector por id abriría una puerta angosta nueva para
         responder lo mismo.* */
      const r = await obtenerMisEstadiasGuarderia(
        typeof params.mascotaId === 'string' && params.mascotaId.length > 0
          ? { mascotaId: params.mascotaId }
          : {},
      );
      if (!vigente) return;
      if (!r.ok) { setEstadia({ fase: 'noPudimos' }); return; }
      const e = r.data.find((x) => x.estadiaId === id) ?? null;
      /* No estar en la lista **no es un fallo**: es que no es suya. Decirlo
         distinto de «no pudimos preguntar» es la diferencia entre un error y
         un permiso. */
      setEstadia(e === null ? { fase: 'noEsTuya' } : { fase: 'listo', e });
    })();
    return () => { vigente = false; };
  }, [params.estadiaId, params.mascotaId]);

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

  /* ⏪ EL PUNTO VIVO QUEDA INERTE, y la razón cambió — se dice porque yo mismo
     escribí antes la razón equivocada:
     · **ANTES afirmé que `guarderia_tramos` no existía.** Falso: existe, es del
       VIAJE (`prestador_id, fecha, direccion`) y la estadía apunta con
       `tramo_recogida_id` / `tramo_devolucion_id`.
     · **AHORA el hueco es de PROYECCIÓN, no de entidad:** `EstadiaDeMiMascota`
       **no trae esos dos ids**, así que la familia no tiene con qué llamar a
       `obtenerPuntoVivo`. **Pedido a A: dos campos en el mismo lector.**
     *Un tramo por estadía haría que el mismo vehículo emitiera N puntos
     idénticos — por eso la pantalla NO los crea ni los infiere: los LEE.* */

  const fotos = media.fase === 'listo' ? media.lista.filter((m) => m.tipo === 'foto') : [];

  const vozDelEstado = useCallback(
    (e: EstadiaDeMiMascota): string =>
      t(
        e.estadoEstadia === 'recogida_en_curso'
          ? 'duranteGuarderia.recogidaEnCurso'
          : e.estadoEstadia === 'en_guarderia'
            ? 'duranteGuarderia.enGuarderia'
            : e.estadoEstadia === 'retorno_en_curso'
              ? 'duranteGuarderia.retornoEnCurso'
              : e.estadoEstadia === 'entregada'
                ? 'duranteGuarderia.entregada'
                : e.estadoEstadia === 'no_recogida'
                  ? 'duranteGuarderia.noRecogida'
                  : e.estadoEstadia === 'cancelada'
                    ? 'duranteGuarderia.cancelada'
                    /* 🔴 `estadoEstadia` es `null` mientras el prestador no la
                       ejecutó: **la cita existe y la estadía todavía no.** No es
                       un estado desconocido — es el primero de todos. */
                    : 'duranteGuarderia.reservada',
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
        ) : estadia.fase === 'noEsTuya' ? (
          <EstadoVacio registro="seccion" titulo={t('duranteGuarderia.noEsTuya')} />
        ) : estadia.fase === 'noPudimos' ? (
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

        {/* ── ② DÓNDE VA — construido, INERTE hasta que el lector proyecte
               `tramo_recogida_id` / `tramo_devolucion_id` (ver arriba). Mientras
               tanto la pantalla **dice que viaja** sin prometer un mapa. ── */}
        {estadia.fase === 'listo' && estaViajando(estadia.e) ? (
          <Tarjeta>
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('duranteGuarderia.dondeVa')}</Texto>
              <Texto variante="apoyo">{t('duranteGuarderia.sinPunto')}</Texto>
            </View>
          </Tarjeta>
        ) : null}

        {/* ── ④ EL ACTA — 🔴 SE PUEDE CONFIRMAR Y NO SE PUEDE LEER ──────────
               `confirmarActaGuarderia(actaId)` existe y `ActaDeEntrega` tiene su
               `modo='leer'`. **Falta el lector del CONTENIDO** — los ítems, las
               observaciones, la media y la conformidad actual.

               ═══════════════════════════════════════════════════════════
               🔴 **EL BOTÓN DE CONFORMAR FALTA A PROPÓSITO. FIRMADO POR LA
               MESA (29-ago-2026). NO SE «COMPLETA».**

               > ### La conformidad existe porque el dueño VIO lo que firma.
               > Un botón «conforme» sobre un acta que no se puede leer **no es
               > una función a medias: es pedirle a alguien que firme a ciegas.**

               ⇒ **El botón nace CON el lector del contenido, no antes.** *Si
               llegaste acá viendo un hueco donde debería haber una acción: el
               hueco es la decisión.* El lector está pedido en
               `S107-C-PEDIDO-A-A-ACTA-Y-TRAMOS.md`.
               ═══════════════════════════════════════════════════════════ */}
        {estadia.fase === 'listo' &&
        (estadia.e.actaRecogidaId !== null || estadia.e.actaDevolucionId !== null) ? (
          <Tarjeta>
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('duranteGuarderia.actaTitulo')}</Texto>
              <Texto variante="apoyo">{t('duranteGuarderia.actaPendienteLector')}</Texto>
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
