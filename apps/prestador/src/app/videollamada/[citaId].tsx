/**
 * LA VIDEOCONSULTA — LADO PROFESIONAL. Obras 4 y 5.
 * Rige `docs/DIRECCION_ARTE_VIDEOCONSULTA.md` §1 y §3.
 *
 * ── LA JERARQUÍA (§1.1) ───────────────────────────────────────────────────
 * **El profesional tiene que ver al animal.** Todo lo demás compite con eso —
 * y por eso el modal *«nunca sale de la pantalla ni tapa el video del todo»*
 * (firma del founder): aun en completo queda franja de video arriba.
 *
 * ── OBRA 5 · `FLAG_SECURE` SÓLO ACÁ ───────────────────────────────────────
 * `usePreventScreenCapture()` **enciende al montar y apaga al desmontar por
 * sí solo** — que es exactamente lo que la letra pide, y sin el riesgo de que
 * quede encendido si la pantalla sale por un camino que nadie previó.
 *
 * 🔴 **El límite honesto, escrito porque la letra lo manda escribir:** bloquea
 * la captura del sistema, **no** que alguien fotografíe la pantalla con otro
 * teléfono. *Bloquea el camino fácil; no es una promesa de confidencialidad.*
 *
 * ⚠️ **Y por eso vive SÓLO acá:** si quedara encendido en el resto de la app,
 * el founder no podría sacar capturas para revisar diseño.
 */

import { useCallback, useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
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
  Campo,
  Encabezado,
  EsperaDeMarca,
  EstadoVacio,
  HojaConfirmacionDestructiva,
  ModalDosAlturas,
  SuperficieLlamada,
  Texto,
  spacing,
  useTheme,
  type AlturaModal,
} from '@epetplace/ui';
import {
  obtenerConfigVideo,
  pedirTokenVideollamada,
  type TokenVideollamada,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { livekitListo } from '@/lib/livekit';
import { queDibujar } from '@/lib/telemedicina/veredicto-entrada';
import { VideoPropioEnLlamada, VideoRemoto, girarCamara, useCamara } from '@/components/videollamada-piezas';

type Fase = 'pidiendo' | 'encall' | 'sin_entrada';

export default function VideollamadaProfesional() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { citaId = '', familia = '' } = useLocalSearchParams<{ citaId?: string; familia?: string }>();

  /* OBRA 5 · se enciende al montar y se apaga al desmontar, solo. */
  usePreventScreenCapture();

  const [fase, setFase] = useState<Fase>('pidiendo');
  const [credencial, setCredencial] = useState<TokenVideollamada | null>(null);
  const [vozSinEntrada, setVozSinEntrada] = useState<string | null>(null);
  const [bitrateKbps, setBitrateKbps] = useState<number | null>(null);
  const [micActivo, setMicActivo] = useState(true);
  const [camaraActiva, setCamaraActiva] = useState(true);
  const { camara, alternar: alternarCamara } = useCamara('user');

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const cfg = await obtenerConfigVideo();
      if (vigente && cfg.ok) setBitrateKbps(cfg.data.bitrateKbps);
      const r = await pedirTokenVideollamada(citaId);
      if (!vigente) return;
      if (r.ok) {
        setCredencial(r.data);
        setFase('encall');
        return;
      }
      const q = queDibujar(r, idioma);
      setVozSinEntrada(
        q.boton || q.claveVoz === null
          ? null
          : q.hora !== undefined
            ? t(q.claveVoz as never, { hora: q.hora })
            : t(q.claveVoz as never),
      );
      setFase('sin_entrada');
    })();
    return () => {
      vigente = false;
    };
  }, [citaId, idioma, t]);

  const cabecera = (
    <Encabezado variante="navegacion" titulo={t('consulta.vcTitulo')} atras onAtras={() => router.back()} />
  );

  if (!livekitListo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top']}>
        {cabecera}
        <EstadoVacio
          registro="pantalla"
          titulo={t('consulta.vcSinModulo')}
          descripcion={t('consulta.vcSinModuloDetalle')}
        />
      </SafeAreaView>
    );
  }

  if (fase === 'pidiendo') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top']}>
        {cabecera}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <EsperaDeMarca />
        </View>
      </SafeAreaView>
    );
  }

  if (fase === 'sin_entrada' || credencial === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top']}>
        {cabecera}
        <EstadoVacio
          registro="pantalla"
          titulo={vozSinEntrada ?? t('consulta.vcSinEntrada')}
          descripcion=""
          accion={<Boton variante="primario" etiqueta={t('atender.reintentar')} onPress={() => router.back()} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.tinta }}>
      <LiveKitRoom
        serverUrl={credencial.url}
        token={credencial.token}
        connect
        audio={micActivo}
        video={camaraActiva}
        options={{
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
          ...(bitrateKbps !== null
            ? { publishDefaults: { videoEncoding: { maxBitrate: bitrateKbps * 1000, maxFramerate: 30 } } }
            : null),
        }}
        onDisconnected={() => router.back()}
      >
        <MesaDeTrabajo
          alto={height}
          insetTop={insets.top}
          insetBottom={insets.bottom}
          nombreFamilia={familia.length > 0 ? familia : t('consulta.vcFamilia')}
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

/** Vive DENTRO de `LiveKitRoom`: los hooks necesitan su contexto. */
function MesaDeTrabajo({
  alto,
  insetTop,
  insetBottom,
  nombreFamilia,
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
  nombreFamilia: string;
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
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const remotos = useRemoteParticipants();
  const pistasRemotas = useParticipantTracks([Track.Source.Camera], remotos[0]?.identity);
  const [inicioTs] = useState(() => Date.now());
  const [altura, setAltura] = useState<AlturaModal>('cerrado');
  const [nota, setNota] = useState('');
  const [confirmandoSalir, setConfirmandoSalir] = useState(false);

  const estadoConexion =
    estado === ConnectionState.Reconnecting || estado === ConnectionState.Connecting
      ? 'reconectando'
      : estado === ConnectionState.Connected
        ? 'buena'
        : 'inestable';

  const propio = cameraTrack?.track as LocalVideoTrack | undefined;
  const salir = useCallback(() => setConfirmandoSalir(true), []);

  return (
    <>
      <SuperficieLlamada
        alto={alto}
        insetTop={insetTop}
        insetBottom={insetBottom}
        videoGrande={<VideoRemoto referencia={pistasRemotas[0]} />}
        videoChico={camaraActiva ? <VideoPropioEnLlamada track={propio} camara={camara} /> : null}
        onIntercambiar={() => {
          /* v1: no intercambia. Declarado, no simulado — igual que del lado
             familia. */
        }}
        etiquetaTile={t('consulta.vcTuVideo')}
        encabezado={{
          nombre: nombreFamilia,
          estado: estadoConexion,
          vozEstado: {
            buena: t('consulta.vcConexionBuena'),
            inestable: t('consulta.vcConexionInestable'),
            reconectando: t('consulta.vcConexionReconectando'),
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
        onGirarCamara={() => {
          girarCamara(propio);
          onGirar();
        }}
        onColgar={salir}
        vozControles={{
          microfono: t('consulta.vcVozMic'),
          camara: t('consulta.vcVozCam'),
          colgar: t('consulta.vcVozColgar'),
          girarCamara: t('consulta.vcVozGirar'),
        }}
      />

      {/* §3 · EL MODAL DE DOS ALTURAS. `medio` = dictar viendo al animal, que
          es el caso real; `completo` = leer la historia. **Nunca tapa el video
          del todo** — eso lo garantiza la pieza. */}
      <ModalDosAlturas
        altura={altura}
        onAltura={setAltura}
        altoPantalla={alto}
        insetBottom={insetBottom}
        etiquetaAsa={t('consulta.vcAsaModal')}
        /* Bajar con texto sin guardar pide confirmación — lo resuelve la pieza
           con este aviso; acá sólo se le dice si hay algo escrito. */
        hayCambiosSinGuardar={nota.trim().length > 0}
      >
        <View style={{ gap: spacing[4] }}>
          <Texto variante="seccion">{t('consulta.vcNotaTitulo')}</Texto>
          {/* El mismo registro del Durante: texto libre en `Campo`.
              🔴 Su regla viaja intacta — **la plataforma jamás sugiere
              medicamentos, tratamientos ni posologías**. El placeholder nombra
              CAMPOS, no contenido. */}
          <Campo
            label={t('consulta.vcNotaTitulo')}
            placeholder={t('consulta.vcNotaPlaceholder')}
            value={nota}
            onChangeText={setNota}
            multilinea={6}
          />

          {altura === 'completo' && (
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('consulta.vcHistoriaTitulo')}</Texto>
              <Texto variante="apoyo">{t('consulta.vcHistoriaLectura')}</Texto>
            </View>
          )}
        </View>
      </ModalDosAlturas>

      <HojaConfirmacionDestructiva
        visible={confirmandoSalir}
        onCerrar={() => setConfirmandoSalir(false)}
        titulo={t('consulta.vcColgarConfirma')}
        sujeto={t('consulta.vcColgarSujeto')}
        etiquetaConfirmar={t('consulta.vcColgarSi')}
        etiquetaCancelar={t('consulta.vcColgarNo')}
        onConfirmar={onSalir}
      />
    </>
  );
}
