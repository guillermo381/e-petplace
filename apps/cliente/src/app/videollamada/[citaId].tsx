/**
 * LA VIDEOCONSULTA — LADO FAMILIA. Obras 2 y 3.
 * Rige `docs/DIRECCION_ARTE_VIDEOCONSULTA.md` §1 y §2.
 *
 * ── DOS FASES, UNA RUTA ───────────────────────────────────────────────────
 * `prejoin` → `encall`. Es un recorrido, no dos destinos: *«toco entrar, veo
 * mi cámara y me acomodo, toco entrar a la consulta»*. Dos rutas obligarían a
 * un back que devuelve a una sala que ya se dejó.
 *
 * ── 🔴 «NO HAY NADA, Y ESO ES EL DISEÑO» (§2) ─────────────────────────────
 * El dueño **no ve tarjetas de datos de su mascota** (firma del founder): ya
 * conoce a su animal — lo que necesita es ver a la doctora.
 *
 * ── LA CONFIGURACIÓN DE SALA, medida por D ────────────────────────────────
 * `adaptiveStream` y `dynacast` vienen **APAGADOS por defecto** ⇒ encenderlos
 * **no es un no-op**: hoy se mandan bytes que nadie mira.
 * **`resolution` en `h720`** hasta que el founder lo mire con un animal en
 * pantalla (la dirección declara que el piso de calidad **no lo decide este
 * documento**).
 * 🔴 **`pixelDensity` queda en su default, a propósito**: en `'screen'` un
 * teléfono con DPR 3 dispara el ancho de banda — *sería la misma perilla
 * girada al revés adentro de la opción que vinimos a encender para ahorrar.*
 */

import { useCallback, useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AudioSession,
  AndroidAudioTypePresets,
  LiveKitRoom,
  useConnectionState,
  useLocalParticipant,
  useParticipantTracks,
  useRemoteParticipants,
} from '@livekit/react-native';
import { ConnectionState, Track, VideoPresets, type LocalVideoTrack } from 'livekit-client';
import {
  Boton,
  ControlLlamada,
  Encabezado,
  EsperaDeMarca,
  EstadoVacio,
  HojaConfirmacionDestructiva,
  SuperficieLlamada,
  Texto,
  radius,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerConfigVideo,
  pedirTokenVideollamada,
  type TokenVideollamada,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { livekitListo } from '@/lib/livekit';
import { queDibujar } from '@/lib/telemedicina/veredicto-entrada';
import {
  PreviewPropio,
  VideoPropioEnLlamada,
  VideoRemoto,
  useCamara,
} from '@/components/videollamada-piezas';

type Fase = 'pidiendo' | 'prejoin' | 'encall' | 'sin_entrada';

export default function Videollamada() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { citaId = '', profesional = '' } = useLocalSearchParams<{
    citaId?: string;
    profesional?: string;
  }>();

  const [fase, setFase] = useState<Fase>('pidiendo');
  const [credencial, setCredencial] = useState<TokenVideollamada | null>(null);
  /* 🔴 EL SILENCIO ES SU PROPIO CASO, y antes no lo era.
     Con `string | null`, `null` significaba DOS cosas —«no hay voz» y «no
     pintes nada»— y la pantalla las trataba igual: caía al título por defecto
     y mostraba el genérico.
     **Y ese genérico también confirma que la cita existe**, así que el
     silencio que `ajeno_a_la_cita` protege se perdía en el último tramo:
     la decisión estaba bien en la lógica y no tenía dónde vivir en la
     superficie. *Un estado que no se puede expresar se convierte en el
     estado de al lado.* */
  const [sinEntrada, setSinEntrada] = useState<{ tipo: 'silencio' } | { tipo: 'voz'; texto: string } | null>(null);
  const [bitrateKbps, setBitrateKbps] = useState<number | null>(null);

  /* Mic y cámara: **el estado en que van a entrar** (§2). Se eligen en el
     pre-join y viajan tal cual — sin sorpresas. */
  const [intento, setIntento] = useState(0);
  const [micActivo, setMicActivo] = useState(true);
  const [camaraActiva, setCamaraActiva] = useState(true);
  const { camara, alternar: alternarCamara } = useCamara('user');

  /* 🔴 EL REINTENTO REINTENTA. *La v1 de este botón hacía `router.back()`, y
     abierto por deep link **no hay pila atrás: era un no-op**.* El síntoma es
     el peor de su clase — la pantalla dice «probá de nuevo», el founder toca,
     y no pasa NADA: ni error, ni spinner, ni cambio. Se lee como app colgada
     cuando el servidor estaba contestando bien.
     Bumpear `intento` vuelve a correr el efecto; `fase='pidiendo'` da la señal
     de que algo pasó. *Un reintento sin realimentación visible es
     indistinguible de un botón muerto.* */
  useEffect(() => {
    let vigente = true;
    void (async () => {
      /* El bitrate lo dice el servidor. Si no contesta **no se inventa**: se
         entra con el default del SDK. *Un bitrate adivinado por la app es una
         decisión de calidad tomada donde nadie la firmó.* */
      const cfg = await obtenerConfigVideo();
      if (vigente && cfg.ok) setBitrateKbps(cfg.data.bitrateKbps);

      const r = await pedirTokenVideollamada(citaId);
      if (!vigente) return;
      if (r.ok) {
        setCredencial(r.data);
        setFase('prejoin');
        return;
      }
      /* El veredicto negativo reusa la MISMA tabla que el botón de entrada
         (Obra 1): una sola tabla de motivos para toda la casa. */
      const q = queDibujar(r, idioma);
      setSinEntrada(
        q.boton || q.claveVoz === null
          ? { tipo: 'silencio' }
          : {
              tipo: 'voz',
              texto:
                q.hora !== undefined
                  ? t(q.claveVoz as never, { hora: q.hora })
                  : t(q.claveVoz as never),
            },
      );
      setFase('sin_entrada');
    })();
    return () => {
      vigente = false;
    };
  }, [citaId, idioma, t, intento]);

  /* ── 🔴 EL ALTAVOZ — la sesión de audio la configura ESTA pantalla ─────────
     **Gate del founder (26-ago): la llamada sonaba por el AURICULAR** y sin
     auriculares no se escuchaba.

     **La causa no es una mala configuración: es que NADIE configuraba** — B
     midió cero llamadas a `AudioSession` en toda la app, así que decidía el
     sistema, y en Android el sistema elige el auricular.

     **La llave, leída del JSDoc del SDK y verificada contra el objeto** (no
     supuesta): en modo `communication` el ruteo **está APAGADO** y la lista de
     salidas —que ya trae `speaker` antes que `earpiece`— **no se aplica**.
     ⇒ *Reordenar la lista NO alcanza: `forceHandleAudioRouting` es lo que la
     enciende.*

     🔴 **`earpiece` queda FUERA de la lista a propósito, no por olvido** — es
     justo el comportamiento que se vino a corregir. **Bluetooth y auriculares
     siguen ganando**: *si alguien se puso auriculares, quiere auriculares.*

     ⚠️ **Y no es cosmético:** sin altavoz el dueño necesita el teléfono en la
     oreja, y con el teléfono en la oreja **no tiene las dos manos para
     sostener al animal y mostrárselo al veterinario** — que es el acto central
     del servicio. *Va junto con girar cámara: son el mismo problema visto dos
     veces.*

     Se descartó un selector de salida con el argumento de B: *un toggle no
     arregla un default malo, lo delega en el usuario.*

     Vive acá y no en `packages/ui` porque **ui no importa LiveKit** (decisión
     de arquitectura ratificada): la sesión se configura donde se monta el
     Room. Se apaga al desmontar — *una sesión de audio que queda abierta se
     lleva el audio del teléfono a una llamada que ya terminó.* */
  useEffect(() => {
    let vigente = true;
    void (async () => {
      try {
        await AudioSession.configureAudio({
          android: {
            preferredOutputList: ['bluetooth', 'headset', 'speaker'],
            audioTypeOptions: {
              ...AndroidAudioTypePresets.communication,
              forceHandleAudioRouting: true,
            },
          },
          ios: { defaultOutput: 'speaker' },
        });
        if (!vigente) return;
        await AudioSession.startAudioSession();
      } catch {
        /* Si la sesión no se pudo configurar **la llamada sigue**: se escucha
           peor, pero se escucha. *Tumbar una videoconsulta médica por el ruteo
           del audio sería cambiar un problema por uno mucho peor.* */
      }
    })();
    return () => {
      vigente = false;
      void AudioSession.stopAudioSession();
    };
  }, []);


  /* El silencio no dibuja: SALE. Una pantalla en blanco sería un callejón, y
     cualquier texto —hasta el genérico— confirmaría que la cita existe.
     `canGoBack` porque a esta pantalla se puede llegar por deep link, donde
     `back()` no tiene a dónde volver (el mismo defecto que el gate encontró
     en «Probar de nuevo»). */
  useEffect(() => {
    if (fase !== 'sin_entrada' || sinEntrada?.tipo !== 'silencio') return;
    if (router.canGoBack()) router.back();
    else router.replace('/hogar');
  }, [fase, sinEntrada, router]);

  const cabecera = (
    <Encabezado
      variante="navegacion"
      titulo={t('veterinaria.vcTitulo')}
      atras
      onAtras={() => router.back()}
    />
  );

  // El módulo nativo no está: binario horneado antes de esta build. Se dice.
  if (!livekitListo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top', 'bottom']}>
        {cabecera}
        <EstadoVacio
          registro="pantalla"
          titulo={t('veterinaria.vcSinModulo')}
          descripcion={t('veterinaria.vcSinModuloDetalle')}
        />
      </SafeAreaView>
    );
  }

  if (fase === 'pidiendo') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top', 'bottom']}>
        {cabecera}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <EsperaDeMarca />
        </View>
      </SafeAreaView>
    );
  }

  // Silencio: no se monta nada mientras el efecto de arriba saca de acá.
  if (fase === 'sin_entrada' && sinEntrada?.tipo === 'silencio') return null;

  if (fase === 'sin_entrada') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top', 'bottom']}>
        {cabecera}
        <EstadoVacio
          registro="pantalla"
          titulo={sinEntrada?.tipo === 'voz' ? sinEntrada.texto : t('veterinaria.vcSinEntrada')}
          descripcion=""
          accion={
            <Boton
              variante="primario"
              etiqueta={t('hogar.reintentar')}
              onPress={() => {
                setFase('pidiendo');
                setIntento((n) => n + 1);
              }}
            />
          }
        />
      </SafeAreaView>
    );
  }

  const nombreProfesional = profesional.length > 0 ? profesional : t('veterinaria.vcProfesional');

  /* 🔴 HALLAZGO DEL GATE (26-ago): el CTA «Entrar a la consulta» quedaba
     **debajo de los botones del sistema**. La causa: estas pantallas
     declaraban `edges={['top']}` y el inset de ABAJO no se aplicaba nunca.
     *Un CTA que el pulgar no alcanza no es un problema de estilo: es una
     pantalla sin salida.*

     ⚠️ **La in-call NO lleva `SafeAreaView` y eso es correcto**: el video va a
     sangre y los insets viajan como props a `SuperficieLlamada`, que los
     aplica en su barra (`paddingBottom: insetBottom + …`). *Envolverla la
     recortaría con dos franjas donde tiene que haber imagen.*

     ── OBRA 2 · EL PRE-JOIN ────────────────────────────────────────────────
     El preview propio es lo PRIMERO: *lo primero que hace cualquiera antes de
     una videollamada es mirarse.* Y **el permiso se pide acá** — un diálogo
     del sistema sobre la cara del veterinario es la peor interrupción
     posible. */
  if (fase === 'prejoin') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top', 'bottom']}>
        {cabecera}
        <View style={{ flex: 1, padding: spacing[4], gap: spacing[4] }}>
          <View
            style={{
              flex: 1,
              borderRadius: radius.lg,
              overflow: 'hidden',
              backgroundColor: theme.bg.elevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {camaraActiva ? <PreviewPropio activa camara={camara} /> : null}
            {/* Sin cámara **se dice**: nunca un rectángulo negro mudo. */}
            {!camaraActiva && <Texto variante="apoyo">{t('veterinaria.vcCamApagar')}</Texto>}
          </View>

          <Texto variante="seccion">
            {t('veterinaria.vcVasAEntrarCon', { nombre: nombreProfesional })}
          </Texto>

          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            {/* ── 🔴 GLIFOS, NO BOTONES DE TEXTO (gate 27-ago) ─────────────
                Tres botones con texto **no entraban**: el tercero salía
                cortado («Gi…»). Y el texto decía la ACCIÓN («apagar
                micrófono»), que obliga a leer para deducir el estado actual.

                `ControlLlamada` sirve tal cual —**no hace falta pieza nueva**:
                su `activo` **invierte el disco**, así que el estado con el que
                se va a entrar **se ve**, no se lee. Es la misma gramática que
                la barra de la llamada, que es lo que el founder pidió: *la
                antesala y la llamada no pueden hablar dos idiomas.*

                Girar no lleva `activo` **por decisión de la pieza**: es una
                acción, no un estado que se pueda cortar. */}
            <ControlLlamada
              glifo="microfono"
              etiqueta={t('veterinaria.vcVozMic')}
              activo={micActivo}
              onPress={() => setMicActivo((v) => !v)}
            />
            <ControlLlamada
              glifo="camara"
              etiqueta={t('veterinaria.vcVozCam')}
              activo={camaraActiva}
              onPress={() => setCamaraActiva((v) => !v)}
            />
            {camaraActiva && (
              <ControlLlamada
                glifo="girarCamara"
                etiqueta={t('veterinaria.vcVozGirar')}
                onPress={() => void alternarCamara()}
              />
            )}
          </View>

          <Boton
            variante="primario"
            bloque
            etiqueta={t('veterinaria.vcEntrar')}
            onPress={() => setFase('encall')}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── OBRA 3 · LA IN-CALL ─────────────────────────────────────────────────
  if (credencial === null) return null;

  return (
    /* El lienzo detrás del video sale del TEMA (`bg.tinta`, la superficie más
       oscura de la casa) y no de un hex: un `#000` a mano se queda igual en
       oscuro y en memorial — la mitad del sistema apagada en silencio. */
    <View style={{ flex: 1, backgroundColor: theme.bg.tinta }}>
      <LiveKitRoom
        serverUrl={credencial.url}
        token={credencial.token}
        connect
        audio={micActivo}
        video={camaraActiva}
        options={{
          // D: vienen APAGADOS por defecto — encenderlos NO es un no-op.
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
          ...(bitrateKbps !== null
            ? { publishDefaults: { videoEncoding: { maxBitrate: bitrateKbps * 1000, maxFramerate: 30 } } }
            : null),
        }}
        onDisconnected={() => router.back()}
      >
        <SalaDelDueno
          alto={height}
          insetTop={insets.top}
          insetBottom={insets.bottom}
          nombreProfesional={nombreProfesional}
          micActivo={micActivo}
          camaraActiva={camaraActiva}
          camara={camara}
          onMic={() => setMicActivo((v) => !v)}
          onCam={() => setCamaraActiva((v) => !v)}
          onGirar={(track) => void alternarCamara(track)}
          onSalir={() => router.back()}
        />
      </LiveKitRoom>
    </View>
  );
}

/** Vive DENTRO de `LiveKitRoom` porque los hooks necesitan su contexto. */
function SalaDelDueno({
  alto,
  insetTop,
  insetBottom,
  nombreProfesional,
  micActivo,
  camaraActiva,
  camara,
  onMic,
  onCam,
  onGirar,
  onSalir,
}: {
  alto: number;
  insetTop: number;
  insetBottom: number;
  nombreProfesional: string;
  micActivo: boolean;
  camaraActiva: boolean;
  camara: 'user' | 'environment';
  onMic: () => void;
  onCam: () => void;
  /** Recibe el track propio: el giro real ocurre arriba, con él. */
  onGirar: (track: LocalVideoTrack | null | undefined) => void;
  onSalir: () => void;
}) {
  const { t } = useTraduccion();
  const estado = useConnectionState();
  const [confirmandoColgar, setConfirmandoColgar] = useState(false);
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const remotos = useRemoteParticipants();
  const pistasRemotas = useParticipantTracks([Track.Source.Camera], remotos[0]?.identity);
  const [inicioTs] = useState(() => Date.now());
  /* ── ⑤ EL TOGGLE DE ALTAVOZ (pieza de B, `372012e6`) ──────────────────────
     🔴 **SE DIBUJA SIEMPRE**, también con auriculares conectados — corrección
     de firma del founder (27-ago). *La v1 de mi plan lo escondía con
     `getAudioOutputs()`; no va así: un control que aparece y desaparece según
     lo que el teléfono tenga enchufado es un control que nadie aprende dónde
     está.*

     Arranca en **altavoz**, que es lo que la sesión de audio configura: el
     estado del botón dice la verdad del ruteo desde el primer segundo.

     ⚠️ El toggle es binario y su implementación difiere por plataforma —
     lo midió B. Acá sólo se declara la intención; el SDK resuelve el cómo. */
  const [altavoz, setAltavoz] = useState(true);
  const alternarAltavoz = useCallback(() => {
    setAltavoz((v) => {
      const siguiente = !v;
      void AudioSession.selectAudioOutput(siguiente ? 'speaker' : 'earpiece').catch(() => {
        /* Si el sistema no acepta el cambio, **el estado vuelve**: un botón
           que se pinta encendido sobre un ruteo que no cambió miente. */
        setAltavoz(v);
      });
      return siguiente;
    });
  }, []);


  /* §1.6 · tres estados y **ninguno miente**. `reconectando` es el único que
     el usuario NECESITA entender para no colgar creyendo que se rompió. */
  const estadoConexion =
    estado === ConnectionState.Reconnecting || estado === ConnectionState.Connecting
      ? 'reconectando'
      : estado === ConnectionState.Connected
        ? 'buena'
        : 'inestable';

  /* «Colgar pregunta una vez, breve» (§2). *Colgar sin querer en medio de una
     consulta paga es caro.* Una sola vez: la Hoja de la casa, no un toast. */
  const colgar = useCallback(() => setConfirmandoColgar(true), []);

  const propio = cameraTrack?.track as LocalVideoTrack | undefined;

  return (
    <>
    <SuperficieLlamada
      alto={alto}
      insetTop={insetTop}
      insetBottom={insetBottom}
      videoGrande={<VideoRemoto referencia={pistasRemotas[0]} />}
      videoChico={camaraActiva ? <VideoPropioEnLlamada track={propio} camara={camara} /> : null}
      onIntercambiar={() => {
        /* v1: el tile no intercambia. **Se declara en vez de simularlo**: la
           dirección lo pide, y hacerlo de mentira sería peor que no tenerlo.
           Entra cuando el founder lo pida viendo la pantalla. */
      }}
      etiquetaTile={t('veterinaria.vcTuVideo')}
      encabezado={{
        nombre: nombreProfesional,
        estado: estadoConexion,
        /* La pieza recibe LAS TRES y elige: así el estado y su voz no se
           pueden desincronizar en el consumidor. */
        vozEstado: {
          buena: t('veterinaria.vcConexionBuena'),
          inestable: t('veterinaria.vcConexionInestable'),
          reconectando: t('veterinaria.vcConexionReconectando'),
        },
        inicioTs,
      }}
      microfonoActivo={micActivo}
      camaraActiva={camaraActiva}
      onMicrofono={() => {
        void localParticipant.setMicrophoneEnabled(!micActivo);
        onMic();
      }}
      onCamara={() => {
        void localParticipant.setCameraEnabled(!camaraActiva);
        onCam();
      }}
      /* 🔴 Obligatorio del lado dueño (§2: «el botón más usado»). */
      onGirarCamara={() => {
        /* 🔴 EL TRACK VIAJA HACIA ARRIBA: el estado de `facingMode` vive en
           el componente de afuera, y el track sólo existe acá adentro (sale
           de `useLocalParticipant`). *Sin esto el giro se pedía sin track y
           el espejo se movía sobre una cámara que no cambió.* */
        onGirar(propio);
      }}
      onAltavoz={alternarAltavoz}
      altavozActivo={altavoz}
      onColgar={colgar}
      vozControles={{
        microfono: t('veterinaria.vcVozMic'),
        camara: t('veterinaria.vcVozCam'),
        colgar: t('veterinaria.vcVozColgar'),
        altavoz: t('veterinaria.vcVozAltavoz'),
        girarCamara: t('veterinaria.vcVozGirar'),
      }}
    />
    <HojaConfirmacionDestructiva
      visible={confirmandoColgar}
      onCerrar={() => setConfirmandoColgar(false)}
      titulo={t('veterinaria.vcColgarConfirma')}
      sujeto={t('veterinaria.vcColgarSujeto')}
      etiquetaConfirmar={t('veterinaria.vcColgarSi')}
      etiquetaCancelar={t('veterinaria.vcColgarNo')}
      onConfirmar={onSalir}
    >
      {/* La consecuencia va en el CUERPO, no en el título: el título hace
          la pregunta y esto dice qué pasa si la respuesta es sí. */}
      <Texto variante="cuerpo">{t('veterinaria.vcColgarDetalle')}</Texto>
    </HojaConfirmacionDestructiva>
    </>
  );
}
