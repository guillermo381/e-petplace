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
  LiveKitRoom,
  useConnectionState,
  useLocalParticipant,
  useParticipantTracks,
  useRemoteParticipants,
} from '@livekit/react-native';
import { ConnectionState, Track, VideoPresets, type LocalVideoTrack } from 'livekit-client';
import {
  Boton,
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
  girarCamara,
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
            <Boton
              variante="secundario"
              etiqueta={micActivo ? t('veterinaria.vcMicApagar') : t('veterinaria.vcMicEncender')}
              onPress={() => setMicActivo((v) => !v)}
            />
            <Boton
              variante="secundario"
              etiqueta={camaraActiva ? t('veterinaria.vcCamApagar') : t('veterinaria.vcCamEncender')}
              onPress={() => setCamaraActiva((v) => !v)}
            />
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
          onGirar={alternarCamara}
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
  onGirar: () => void;
  onSalir: () => void;
}) {
  const { t } = useTraduccion();
  const estado = useConnectionState();
  const [confirmandoColgar, setConfirmandoColgar] = useState(false);
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const remotos = useRemoteParticipants();
  const pistasRemotas = useParticipantTracks([Track.Source.Camera], remotos[0]?.identity);
  const [inicioTs] = useState(() => Date.now());

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
        girarCamara(propio);
        onGirar();
      }}
      onColgar={colgar}
      vozControles={{
        microfono: t('veterinaria.vcVozMic'),
        camara: t('veterinaria.vcVozCam'),
        colgar: t('veterinaria.vcVozColgar'),
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
    />
    </>
  );
}
