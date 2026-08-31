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
  ActaDeEntrega,
  Boton,
  type Conformidad,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Campo,
  Hoja,
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
  confirmarActaGuarderia,
  obtenerActaGuarderia,
  obtenerMediaDeMiMascota,
  obtenerMisEstadiasGuarderia,
  obtenerPuntoVivo,
  type ActaGuarderia,
  type EstadiaDeMiMascota,
  type MediaGuarderia,
  type PuntoVivo,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { MAPA_NATIVO_DISPONIBLE } from '@/lib/mapa-nativo';

const LADO_THUMB = 96;

/** Hora local corta. La fecha completa no aporta: el acta es del día que se mira. */
const horaCorta = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

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
  const [punto, setPunto] = useState<PuntoVivo | null>(null);
  const [acta, setActa] = useState<ActaGuarderia | null>(null);
  const [conformando, setConformando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [reserva, setReserva] = useState('');

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

  /* ✅ EL PUNTO VIVO, ENCENDIDO — A proyectó los dos `tramo_id` el 29-ago.
     ⏪ *Y su hueco cambió de clase dos veces antes de llegar acá: primero
     escribí que faltaba la ENTIDAD (falso), después medí que faltaba la
     PROYECCIÓN (cierto). La segunda medición es la que lo destrabó.* */
  useEffect(() => {
    if (estadia.fase !== 'listo') return;
    const e = estadia.e;
    /* El tramo del momento: recogida mientras va a buscarlo, devolución
       mientras vuelve. **Fuera de esos dos no hay viaje que mirar.** */
    const tramoId =
      e.estadoEstadia === 'recogida_en_curso' ? e.tramoRecogidaId
      : e.estadoEstadia === 'retorno_en_curso' ? e.tramoDevolucionId
      : null;
    if (tramoId === null) { setPunto(null); return; }
    let vigente = true;
    const leer = async () => {
      const r = await obtenerPuntoVivo(tramoId);
      if (vigente && r.ok) setPunto(r.data);
    };
    void leer();
    /* Sondeo con la cadencia de la casa (~30 s), como el EN VIVO del paseo.
       🔴 Y **jamás se promete «tiempo real»**: la voz dice cuándo se lo vio. */
    const id = setInterval(() => void leer(), 30_000);
    return () => { vigente = false; clearInterval(id); };
  }, [estadia]);

  /* EL ACTA. Se pide la de DEVOLUCIÓN si existe —es la que el dueño conforma al
     recibirlo— y si no, la de recogida. */
  useEffect(() => {
    if (estadia.fase !== 'listo') return;
    const id = estadia.e.actaDevolucionId ?? estadia.e.actaRecogidaId;
    if (id === null) { setActa(null); return; }
    let vigente = true;
    void (async () => {
      const r = await obtenerActaGuarderia(id);
      if (vigente && r.ok) setActa(r.data);
    })();
    return () => { vigente = false; };
  }, [estadia]);

  /** 🔴 RE-LEE EL ACTA DESPUÉS DE CONFIRMAR, no escribe el estado a mano:
   *  *la conformidad la sella el servidor con su hora, y pintarla de este lado
   *  mostraría un sello que todavía no existe.* */
  const enviarConformidad = useCallback(
    async (c: 'conforme' | 'con_reserva') => {
      if (acta === null || enviando) return;
      setEnviando(true);
      const r = await confirmarActaGuarderia({
        actaId: acta.actaId,
        conformidad: c,
        reservaTexto: c === 'con_reserva' ? reserva.trim() : undefined,
      });
      if (r.ok) {
        const f = await obtenerActaGuarderia(acta.actaId);
        if (f.ok) setActa(f.data);
        setConformando(false);
      }
      setEnviando(false);
    },
    [acta, enviando, reserva],
  );

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

        {/* ── ② DÓNDE VA — sólo mientras viaja, y sólo si hay punto ── */}
        {estadia.fase === 'listo' && estaViajando(estadia.e) ? (
          <Tarjeta>
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('duranteGuarderia.dondeVa')}</Texto>
              {/* 🔴 S109-D · EL MAPA PUEDE NO ESTAR, Y SE DICE EN PALABRAS.
                       El flag lo decide `lib/mapa-nativo`. *Un rectángulo gris sin
                       explicación y una app caída son la misma falta de respeto:
                       la pantalla tiene que seguir siendo útil sin el mapa.* */}
              {!MAPA_NATIVO_DISPONIBLE ? (
                <Texto variante="apoyo">{t('duranteGuarderia.mapaNoDisponible')}</Texto>
              ) : punto === null ? (
                /* `null` no es error: es «todavía no lo vemos». **No se muestra
                   un punto viejo** — un mapa que miente sobre dónde está un
                   animal es peor que un mapa ausente. */
                <Texto variante="apoyo">{t('duranteGuarderia.sinPunto')}</Texto>
              ) : (
                <>
                  <MapaRecorrido
                    modo="vivo"
                    mirada="espectador"
                    alto={220}
                    /* 🔴 **UN SOLO PUNTO — la garantía es estructural.** Una
                       polilínea de un punto no dibuja nada: no hay forma de que
                       un descuido futuro pinte la traza sin agregar puntos a
                       mano. *Las paradas de una ruta son las casas de otras
                       familias*, y el tramo es del VIAJE: lo comparten todos
                       los animales a bordo. */
                    puntos={[{ lat: punto.lat, lng: punto.lon, t: punto.vistoEn }]}
                    centroInicial={{ lat: punto.lat, lng: punto.lon }}
                    marcadorVivo={<MarcaDeMapa variante="moto" />}
                  />
                  {/* Frescura honesta: jamás «en tiempo real». */}
                  <Texto variante="apoyo">
                    {t('duranteGuarderia.vistoA', {
                      hora: new Date(punto.vistoEn).toLocaleTimeString(undefined, {
                        hour: '2-digit', minute: '2-digit',
                      }),
                    })}
                  </Texto>
                </>
              )}
            </View>
          </Tarjeta>
        ) : null}

        {/* ── ④ EL ACTA — ✅ EL BOTÓN DE CONFORMAR NACIÓ CON SU LECTOR
               (29-ago). *La condición estaba escrita acá: «el botón nace CON el
               lector del contenido, no antes». Se cumplió y por eso existe.*

               🔴 **EL MAPEO DE CONFORMIDAD NO ES UN PASO DIRECTO, y esconde un
               defecto silencioso:** `sin_conformidad` **existe en los dos
               vocabularios con sentidos OPUESTOS**.

               | motor | significa | pieza |
               |---|---|---|
               | `sin_conformidad` | **todavía no la miró** | `pendiente` (sereno) |
               | `conforme` | aceptó | `conforme` (success) |
               | `con_reserva` | aceptó **señalando algo** | `sin_conformidad` (warning) |

               *Pasarlo directo pintaría un WARNING sobre un dueño que
               simplemente no abrió el acta — y el warning existe para decir
               que alguien señaló un problema.* ── */}
        {estadia.fase === 'listo' && acta !== null ? (
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('duranteGuarderia.actaTitulo')}</Texto>
            <ActaDeEntrega
              modo="leer"
              direccion={acta.direccion}
              /* 🔴 EL LECTOR DEVUELVE **HECHOS, NO VOZ** — los ítems se componen
                 acá, con el idioma de la casa. *El motor no sabe cómo se llama
                 «carnet a la vista» en esta letra, y no debe saberlo.* */
              items={[
                {
                  clave: 'carnet',
                  etiqueta: t('duranteGuarderia.actaCarnet'),
                  marcado: acta.carnetVerificado,
                },
                ...(acta.objetos !== null && acta.objetos.length > 0
                  ? [{ clave: 'objetos', etiqueta: acta.objetos, marcado: true }]
                  : []),
              ]}
              rotuloItems={t('duranteGuarderia.actaItems')}
              observaciones={acta.observaciones ?? undefined}
              rotuloObservaciones={t('duranteGuarderia.actaObservaciones')}
              conformidad={
                (acta.conformidad === 'conforme'
                  ? 'conforme'
                  : acta.conformidad === 'con_reserva'
                    ? 'sin_conformidad'
                    : 'pendiente') satisfies Conformidad
              }
              vozConformidad={t(
                acta.conformidad === 'conforme'
                  ? 'duranteGuarderia.actaConforme'
                  : acta.conformidad === 'con_reserva'
                    ? 'duranteGuarderia.actaConReserva'
                    : 'duranteGuarderia.actaPendiente',
              )}
              onConformar={
                acta.conformidad === 'sin_conformidad' ? () => setConformando(true) : undefined
              }
              etiquetaConformar={t('duranteGuarderia.actaConformar')}
            />
            {/* 🔴 LAS DOS HORAS, SIEMPRE — firma de A. `cerradaEn` es la hora de
                la PUERTA; `recibidaEn`, cuándo llegó al servidor. *La diferencia
                entre ellas es la cola offline: esconderla haría que un acta
                levantada SIN SEÑAL parezca levantada tarde.* */}
            {acta.cerradaEn !== null ? (
              <Texto variante="apoyo">
                {t('duranteGuarderia.actaCerradaEn', { hora: horaCorta(acta.cerradaEn) })}
              </Texto>
            ) : null}
            {acta.recibidaEn !== null ? (
              <Texto variante="apoyo">
                {t('duranteGuarderia.actaRecibidaEn', { hora: horaCorta(acta.recibidaEn) })}
              </Texto>
            ) : null}
          </View>
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

      {/* LA HOJA DE LA CONFORMIDAD — dos caminos parejos, sin default oscuro.
          🔴 **«Con salvedad» NO es un rechazo**, y por eso no se pinta como
          peligro: *el dueño acepta y deja constancia de algo. Tratarlo como un
          «no» empujaría a callar lo que hay que anotar.* */}
      <Hoja
        visible={conformando}
        onCerrar={() => setConformando(false)}
        titulo={t('duranteGuarderia.actaConformarTitulo')}
      >
        <View style={{ gap: spacing[3] }}>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('duranteGuarderia.actaConforme_si')}
            cargando={enviando}
            onPress={() => void enviarConformidad('conforme')}
          />
          <Campo
            label={t('duranteGuarderia.actaReservaEtiqueta')}
            value={reserva}
            onChangeText={setReserva}
            multilinea={3}
          />
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('duranteGuarderia.actaReservaEnviar')}
            /* Sin texto no hay salvedad que dejar: *un «con reserva» vacío es
               una conformidad con cara de queja.* */
            deshabilitado={reserva.trim().length === 0}
            razonDeshabilitado={t('duranteGuarderia.actaReservaEtiqueta')}
            cargando={enviando}
            onPress={() => void enviarConformidad('con_reserva')}
          />
        </View>
      </Hoja>

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
