/**
 * EL DURANTE EN LAS INSTALACIONES — una foto, varias familias (S111-C, ⑧).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«Son las once y están todos en el patio. Saco el teléfono,
 * una foto, y ahí mismo toco quiénes salen en ella — Thor, Luna y Kira. Una
 * foto, tres familias, un solo toque de envío.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS:** *lo que pasó en el patio llega a las familias sin sacarte de él.*
 *
 * **FIRMA:** el orden — **primero se dispara, después se etiqueta.** El hook lo
 * tenía diseñado así desde S107 (`capturarFoto` NO publica) y acá se usa tal
 * cual: *pedir los animales antes de la foto haría elegir a ciegas quién va a
 * salir en una foto que todavía no existe.*
 *
 * **CHANEL:** sin previsualización grande ni edición. *El cuidador está con los
 * animales, no con el teléfono* — la foto se ve en la miniatura y se descarta
 * si salió mal.
 *
 * ── 🔴 MULTI-DESTINO ES **UN ENVÍO**, NO N ENVÍOS ───────────────────────
 * `publicarCaptura({ mascotaIds: [a, b, c] })` publica **una sola vez** con tres
 * etiquetas — el motor lo resuelve así desde S107 (`p_mascota_ids`). *Tres
 * llamadas con un id cada una serían tres fotos distintas en la base y tres
 * avisos, que es exactamente lo que la regla de agrupación prohíbe.*
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * · **No avisa.** Los avisos de contenido van **agrupados** y los compone el
 *   digest del servidor (`encolar_resumen_media_guarderia`, cron cada 15 min).
 *   *La forma más segura de no mandar ocho push por ocho fotos es no tener
 *   dónde escribirlas* — esta pantalla no compone ninguna voz.
 * · **No graba clips todavía.** Medido: la infra compartida tiene
 *   `capturarVideoDeGaleria` pero **no captura video con CÁMARA**
 *   (`capturarConCamara` no toma `mediaTypes` y su `normalizar` siempre
 *   devuelve `foto`). Pedido a B; la cola ya acepta clips con su techo de 30 s.
 * · **No pone chips de comportamiento todavía** — y **la razón que escribí
 *   primero era falsa**: dije que el vocabulario del adiestramiento no servía
 *   porque «describe avances de un currículum». **Medido: `cat_conductas_bitacora`
 *   es la bitácora UNIVERSAL** y sus códigos son exactamente *«cómo se portó»*
 *   (`durmio_tranquilo`, `comio_normal`, `se_escondio`…). *Miré la tabla de al
 *   lado — el currículum vive en otras dos.*
 *
 *   ⇒ **El vocabulario SIRVE.** Lo que falta es el **escritor del prestador**
 *   (procedencia `declarado_por_prestador`, colgando del acto y no de la
 *   familia), y está en la cola de A. *Frené por la razón correcta —`D-976`, no
 *   trasplantar un criterio— sobre un hecho falso: la disciplina valía, la
 *   premisa no.*
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import {
  Boton,
  EvidenciaClip,
  EvidenciaFoto,
  type EvidenciaFotoEstado,
  Hoja,
  HojaScroll,
  SelectorOpcion,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import type { EstadiaDelDia } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { cablearPublicarMedia } from '@/lib/guarderia-cableado';
import {
  CLIP_TECHO_S,
  reglasSegunLugar,
  useCapturaMedia,
  type ReglaEncuadre,
} from '@/lib/use-captura-media';

export interface HojaMediaGuarderiaProps {
  /** `false` = la hoja no se monta. */
  visible: boolean;
  prestadorId: string;
  /** `YYYY-MM-DD` local del lugar. */
  fecha: string;
  /** 🔴 **El universo de etiquetado es el ROSTER DEL DÍA** (firma ①): sólo se
   *  puede etiquetar a animales que hoy están acá. *Una lista de todas las
   *  mascotas de la casa dejaría mandar la foto de un patio a una familia cuyo
   *  animal no estuvo.* */
  presentes: EstadiaDelDia[];
  onCerrar: () => void;
}

export function HojaMediaGuarderia({
  visible,
  prestadorId,
  fecha,
  presentes,
  onCerrar,
}: HojaMediaGuarderiaProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [capturada, setCapturada] = useState<string | null>(null);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  /** Lo enviado en ESTA sesión de la hoja: id local + uri, para que la
   *  miniatura no dependa de la cola (misma lección que la puerta del acta:
   *  salir de la cola es el ÉXITO, no la desaparición). */
  const [enviadas, setEnviadas] = useState<{ id: string; uri: string }[]>([]);

  /* ── EL CLIP (③) ────────────────────────────────────────────────────────
     La cámara la monta ESTA pantalla: `EvidenciaClip` recibe la vista como
     slot a propósito —`packages/ui` no tiene `expo-camera`, y un import duro
     ahí rompería el bundle del CLIENTE, que tampoco lo tiene—. El prestador sí
     lo trae, con su plugin declarado en `app.json`.

     🔴 **El patrón de grabación NO se inventó: es el de `adiestramiento/clips`**
     —`recordAsync({ maxDuration })`, `stopRecording()`, contador por diferencia
     contra el inicio—, que ya corre en producción. *Escribir un segundo
     grabador sería tener dos formas de cortar a los 30 s y descubrir en el
     aparato cuál de las dos falla.* */
  const [permisoCamara, pedirCamara] = useCameraPermissions();
  const [permisoMic, pedirMic] = useMicrophonePermissions();
  const camRef = useRef<CameraView>(null);
  const [clip, setClip] = useState<
    | { fase: 'cerrado' }
    | { fase: 'encuadre' }
    | { fase: 'grabando'; inicioTs: number }
    | { fase: 'tomado'; uri: string; duracionS: number }
  >({ fase: 'cerrado' });
  const [elegidosClip, setElegidosClip] = useState<string[]>([]);

  const publicar = useMemo(() => cablearPublicarMedia(prestadorId), [prestadorId]);
  const captura = useCapturaMedia({
    fecha,
    prestadorId,
    publicar,
    bucketFoto: 'guarderia-media',
    bucketClip: 'guarderia-media',
  });

  if (!visible) return null;

  const estadoDe = (id: string): EvidenciaFotoEstado => {
    const enCola = captura.pendientes.find((p) => p.id === id);
    if (enCola === undefined) return 'subida';
    return enCola.estado === 'error' ? 'error' : 'subiendo';
  };

  /* 🔴 `instalaciones`, no `domicilio`: acá NO rige la regla del primer plano
     —no hay fachada que proteger— y **una guía que menciona lo que no puede
     pasar enseña a ignorar la guía**. Las otras tres rigen siempre. */
  const vozRegla = (r: ReglaEncuadre): string =>
    t(`mediaGuarderia.encuadre_${r}` as 'mediaGuarderia.encuadre_animal_en_cuadro');

  /* La misma guía que ve la foto, con su voz, para la pieza del clip. **Sale
     de `reglasSegunLugar`, que desde S111-C promete una tupla NO VACÍA** —así
     el tipo de B (que exige no-vacía) se satisface sin castear, y su segunda
     capa (obturador apagado si llega vacía) queda como cinturón que no se
     ejerce. Dos capas, ninguna dependiendo de mi disciplina. */
  const [primera, ...restoReglas] = reglasSegunLugar('instalaciones');
  const reglasConVoz: readonly [{ clave: string; voz: string }, ...{ clave: string; voz: string }[]] = [
    { clave: primera, voz: vozRegla(primera) },
    ...restoReglas.map((r) => ({ clave: r, voz: vozRegla(r) })),
  ];

  const sacarFoto = async () => {
    const r = await captura.capturarFoto();
    if (r.estado === 'permiso_denegado') {
      mostrar({ variante: 'error', texto: t('mediaGuarderia.sinPermiso') });
      return;
    }
    if (r.estado !== 'capturada') return;
    setCapturada(r.uri);
  };

  /**
   * Abre el encuadre pidiendo **los DOS permisos**, cámara y micrófono.
   *
   * ⚠️ **QUÉ SÉ Y QUÉ NO, declarado porque lo escribí como hecho y no lo era:**
   * *no medí* si sin permiso de micrófono `recordAsync` graba mudo o falla
   * directo — el contrato de `expo-camera` documenta `mute` como opción, pero
   * **no dice qué hace cuando el permiso falta**.
   *
   * 🔴 **La decisión no depende de eso, y por eso se sostiene igual:** en los
   * dos casos el clip no sirve, y el cuidador se entera **después de grabar**.
   * *Pedir dos permisos molesta una vez; un clip perdido se pierde entero.*
   *
   * **Y va acá y no en la pieza** (voto de B, y coincido): `EvidenciaClip` no
   * tiene `expo-camera` ni puede tenerlo —rompería el bundle del cliente—, así
   * que una prop de permisos sería **API para un estado que la pieza no puede
   * alcanzar ni arreglar**: sólo podría dibujar «falta el micrófono» y quedarse
   * mirando. *Eso no es una puerta, es un cartel.* Pidiéndolos acá, **la pieza
   * nunca ve el estado sin permiso** (Ley 23) y no hay dos gates para lo mismo
   * — que es cómo uno de los dos envejece sin que nadie se entere.
   */
  const abrirClip = async () => {
    const c = permisoCamara?.granted === true ? permisoCamara : await pedirCamara();
    if (!c.granted) {
      mostrar({ variante: 'error', texto: t('mediaGuarderia.sinPermiso') });
      return;
    }
    const m = permisoMic?.granted === true ? permisoMic : await pedirMic();
    if (!m.granted) {
      mostrar({ variante: 'error', texto: t('mediaGuarderia.sinPermisoMic') });
      return;
    }
    setElegidosClip([]);
    setClip({ fase: 'encuadre' });
  };

  const obturadorClip = async () => {
    if (clip.fase === 'grabando') {
      camRef.current?.stopRecording();
      return;
    }
    if (clip.fase !== 'encuadre' || camRef.current === null) return;
    const inicioTs = Date.now();
    setClip({ fase: 'grabando', inicioTs });
    try {
      /* El techo lo corta el GRABADOR — `maxDuration` — y el número sale de la
         cola (`CLIP_TECHO_S`), que es su única fuente. *Un segundo número acá
         sería el que un día no coincide.* */
      const video = await camRef.current.recordAsync({ maxDuration: CLIP_TECHO_S });
      const duracionS = Math.min(
        Math.round((Date.now() - inicioTs) / 1000),
        CLIP_TECHO_S,
      );
      if (video?.uri !== undefined) {
        setClip({ fase: 'tomado', uri: video.uri, duracionS });
      } else {
        setClip({ fase: 'encuadre' });
      }
    } catch (e) {
      console.error(`[media-guarderia] grabación falló · ${String(e)}`);
      setClip({ fase: 'encuadre' });
      mostrar({ variante: 'error', texto: t('mediaGuarderia.noSeGuardo') });
    }
  };

  const publicarClip = async (mascotaIds: readonly [string, ...string[]]) => {
    if (clip.fase !== 'tomado') return;
    try {
      const id = await captura.publicarCaptura({
        uri: clip.uri,
        tipo: 'clip',
        mascotaIds: [...mascotaIds],
        duracionS: clip.duracionS,
      });
      setEnviadas((e) => [...e, { id, uri: clip.uri }]);
      setClip({ fase: 'cerrado' });
      setElegidosClip([]);
    } catch {
      mostrar({ variante: 'error', texto: t('mediaGuarderia.noSeGuardo') });
    }
  };

  const enviar = async () => {
    if (capturada === null || elegidas.length === 0 || enviando) return;
    setEnviando(true);
    try {
      /* UNA llamada con TODAS las etiquetas. Ver el encabezado. */
      const id = await captura.publicarCaptura({
        uri: capturada,
        tipo: 'foto',
        mascotaIds: elegidas,
      });
      setEnviadas((e) => [...e, { id, uri: capturada }]);
      /* Se limpia para la siguiente: la hoja queda lista para otra foto sin
         cerrarse — el cuidador saca varias seguidas. */
      setCapturada(null);
      setElegidas([]);
    } catch {
      mostrar({ variante: 'error', texto: t('mediaGuarderia.noSeGuardo') });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Hoja visible titulo={t('mediaGuarderia.titulo')} onCerrar={onCerrar}>
      <HojaScroll contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[4] }}>
        {/* LA GUÍA DE ENCUADRE — ley de captura (criterio §5), antes del
            obturador y no después. */}
        <View style={{ gap: spacing[1] }}>
          {reglasSegunLugar('instalaciones').map((r) => (
            <Texto key={r} variante="apoyo">
              {vozRegla(r)}
            </Texto>
          ))}
        </View>

        {/* LO YA ENVIADO en esta sesión, con su estado. */}
        {enviadas.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {enviadas.map((f) => (
              <EvidenciaFoto.Thumbnail
                key={f.id}
                uri={f.uri}
                estado={estadoDe(f.id)}
                onReintentar={() => void captura.reintentarPendiente(f.id)}
              />
            ))}
          </View>
        ) : null}

        {/* EL OBTURADOR — o la foto recién sacada esperando sus etiquetas. */}
        {capturada === null && clip.fase === 'cerrado' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
            <EvidenciaFoto.Capturar onFoto={() => void sacarFoto()} deshabilitado={enviando} />
            {/* ③ · EL CLIP, al lado del obturador y no en otra pantalla. *El
                cuidador no elige «modo foto» o «modo video» antes de saber qué
                va a ver: saca lo que el momento pide.* */}
            <Boton
              variante="apoyada"
              etiqueta={t('mediaGuarderia.grabarClip')}
              onPress={() => void abrirClip()}
            />
          </View>
        ) : clip.fase !== 'cerrado' ? (
          /* 🔴 LA PIEZA DE B, con la vista de cámara como SLOT: `packages/ui`
             no tiene `expo-camera` —y el CLIENTE tampoco—, así que un import
             duro allá rompería su bundle, y por nativo ni se arregla por OTA.
             El prestador sí lo trae, con su plugin declarado. */
          <EvidenciaClip
            vista={
              <CameraView
                ref={camRef}
                style={{ flex: 1 }}
                mode="video"
                facing="back"
                videoQuality="720p"
                videoBitrate={2_500_000}
              />
            }
            /* Las reglas ya vienen FILTRADAS por lugar: la pieza no sabe de
               instalaciones ni de domicilio, y no debe — eso es negocio. */
            reglas={reglasConVoz}
            /* Sin default en la pieza a propósito: la fuente del número es la
               cola. Acá se lo pasa quien la conoce. */
            techoSeg={CLIP_TECHO_S}
            momento={
              clip.fase === 'grabando'
                ? { fase: 'grabando', inicioTs: clip.inicioTs }
                : clip.fase === 'tomado'
                  ? { fase: 'tomado' }
                  : { fase: 'encuadre' }
            }
            onObturador={() => void obturadorClip()}
            onTecho={() => camRef.current?.stopRecording()}
            candidatos={presentes.map((x) => ({ id: x.mascotaId, nombre: x.mascotaNombre }))}
            elegidos={elegidosClip}
            onAlternar={(id) =>
              setElegidosClip((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
            onPublicar={(ids) => void publicarClip(ids)}
            voces={{
              guia: t('mediaGuarderia.guiaClip'),
              grabar: t('mediaGuarderia.grabar'),
              detener: t('mediaGuarderia.detener'),
              destinatarios: t('mediaGuarderia.quienesSalen'),
              publicar: t('mediaGuarderia.publicarClip'),
            }}
          />
        ) : capturada !== null ? (
          /* La foto recién sacada, esperando sus etiquetas. La condición es
             EXPLÍCITA y no el `else` de las anteriores: con tres ramas, un
             `else` afirma «si no es ninguna de las dos, hay foto» — y eso deja
             de ser cierto en cuanto nazca una cuarta. */
          <View style={{ gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <EvidenciaFoto.Thumbnail uri={capturada} estado="subida" />
              <View style={{ justifyContent: 'center' }}>
                {/* Descartar existe y es de primera clase: el encuadre manda
                    descartar lo incidental ANTES de enviar, y sin este control
                    esa regla no se puede cumplir. */}
                <Boton
                  variante="ghost"
                  tamaño="sm"
                  etiqueta={t('mediaGuarderia.descartar')}
                  onPress={() => {
                    setCapturada(null);
                    setElegidas([]);
                  }}
                />
              </View>
            </View>

            {/* QUIÉNES SALEN — multi-selección sobre el roster del día. */}
            <SelectorOpcion
              acento="oficio"
              disposicion="columnas"
              multiple
              etiqueta={t('mediaGuarderia.quienesSalen')}
              opciones={presentes.map((p) => ({
                codigo: p.mascotaId,
                etiqueta: p.mascotaNombre,
              }))}
              seleccionadas={elegidas}
              onSelect={(codigo) =>
                setElegidas((prev) =>
                  prev.includes(codigo) ? prev.filter((x) => x !== codigo) : [...prev, codigo],
                )
              }
            />
          </View>
        ) : null}
      </HojaScroll>

      {capturada !== null ? (
        <View style={{ gap: spacing[2], paddingTop: spacing[3] }}>
          {elegidas.length === 0 ? (
            <Texto variante="apoyo" color="tertiary">
              {t('mediaGuarderia.faltaElegir')}
            </Texto>
          ) : null}
          <Boton
            variante="primario"
            etiqueta={t('mediaGuarderia.enviar', { n: elegidas.length })}
            deshabilitado={elegidas.length === 0}
            cargando={enviando}
            onPress={() => void enviar()}
          />
        </View>
      ) : null}
    </Hoja>
  );
}
