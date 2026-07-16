// ─────────────────────────────────────────────────────────────────────
// Clips de la sesión de adiestramiento — /adiestramiento/clips (S63-B).
// Dosis baja.
//
// TESIS: el progreso del perro se ve en movimiento — grabá el clip sin
// fricción y sin pasarte del techo.
//
// MODELO_ADIESTRAMIENTO §5 (el medio del oficio es el VIDEO) + §12.3
// (techo v1 FIRMADO: 15–30s, máximo 3 por sesión). La compresión es EN
// CAPTURA: CameraView 720p + bitrate acotado — un clip de 30s pesa
// ~9 MB, jamás el 4K del sensor.
//
// El motor de la sesión (Bloque 2, Sesión A) todavía no existe: la
// pantalla recibe `sesionId` opcional (default 'gate' para el gate en
// dispositivo) y los clips viven en la COLA LOCAL declarada
// (clips-sesion.ts) hasta que el bucket de video de la A exista.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';

import {
  CLIPS_MAX,
  CLIP_MAX_S,
  CLIP_MIN_S,
  agregarClip,
  clipsDeSesion,
  quitarClip,
  type ClipLocal,
} from '@/lib/clips-sesion';
import { useTraduccion } from '@/i18n';

/** Voz de máquina: 0:07, 0:22 (mono en la UI). */
function mmss(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

type Vista =
  | { v: 'lista' }
  | { v: 'camara' }
  | { v: 'revision'; uri: string; duracionS: number }
  | { v: 'ver'; clip: ClipLocal };

/** Revisión/re-visión del clip: player nativo (scrubbing del sistema). */
function PlayerClip({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: '100%', aspectRatio: 9 / 16, maxHeight: 420, alignSelf: 'center' }}
      contentFit="contain"
    />
  );
}

export default function ClipsSesion() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTraduccion();
  const { sesionId = 'gate' } = useLocalSearchParams<{ sesionId?: string }>();

  const [vista, setVista] = useState<Vista>({ v: 'lista' });
  const [clips, setClips] = useState<ClipLocal[]>(() => clipsDeSesion(sesionId));
  const [permisoCamara, pedirCamara] = useCameraPermissions();
  const [permisoMic, pedirMic] = useMicrophonePermissions();
  const [sinPermiso, setSinPermiso] = useState<'pedible' | 'ajustes' | null>(null);

  // Cámara
  const camRef = useRef<CameraView>(null);
  const [grabando, setGrabando] = useState(false);
  const [transcurrido, setTranscurrido] = useState(0);
  const inicioRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (tickRef.current !== null) clearInterval(tickRef.current);
    },
    [],
  );

  async function abrirCamara() {
    const cam = permisoCamara?.granted ? permisoCamara : await pedirCamara();
    const mic = permisoMic?.granted ? permisoMic : await pedirMic();
    if (!cam?.granted || !mic?.granted) {
      // Espejo del patrón GPS S62: denegado sin re-pregunta → Ajustes.
      setSinPermiso(cam?.canAskAgain === false || mic?.canAskAgain === false ? 'ajustes' : 'pedible');
      return;
    }
    setSinPermiso(null);
    setTranscurrido(0);
    setVista({ v: 'camara' });
  }

  async function grabar() {
    if (grabando || camRef.current === null) return;
    setGrabando(true);
    inicioRef.current = Date.now();
    setTranscurrido(0);
    tickRef.current = setInterval(() => {
      setTranscurrido(Math.min(Math.round((Date.now() - inicioRef.current) / 1000), CLIP_MAX_S));
    }, 500);
    try {
      // maxDuration = el techo lo corta el propio grabador a los 30s.
      const video = await camRef.current.recordAsync({ maxDuration: CLIP_MAX_S });
      const duracionS = Math.min(Math.round((Date.now() - inicioRef.current) / 1000), CLIP_MAX_S);
      if (video?.uri) {
        setVista({ v: 'revision', uri: video.uri, duracionS });
      } else {
        setVista({ v: 'lista' });
      }
    } catch (e) {
      console.error(`[clips] grabación falló · ${e instanceof Error ? e.message : String(e)}`);
      setVista({ v: 'lista' });
    } finally {
      if (tickRef.current !== null) clearInterval(tickRef.current);
      tickRef.current = null;
      setGrabando(false);
    }
  }

  function detener() {
    camRef.current?.stopRecording();
  }

  function usarClip(uri: string, duracionS: number) {
    agregarClip(sesionId, { uri, duracionS });
    setClips(clipsDeSesion(sesionId));
    setVista({ v: 'lista' });
  }

  function quitar(clip: ClipLocal) {
    quitarClip(sesionId, clip.uri);
    setClips(clipsDeSesion(sesionId));
    setVista({ v: 'lista' });
  }

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;

  // ── CÁMARA (pantalla entera; controles debajo, jamás overlay) ──────
  if (vista.v === 'camara') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <CameraView
          ref={camRef}
          style={{ flex: 1 }}
          mode="video"
          facing="back"
          videoQuality="720p"
          videoBitrate={2_500_000}
        />
        <View style={{ padding: spacing[4], gap: spacing[3] }}>
          <Text
            style={{
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.lg,
              letterSpacing: typography.tracking.mono,
              color: theme.text.primary,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
            }}
          >
            {mmss(transcurrido)} · {mmss(CLIP_MAX_S)}
          </Text>
          {grabando ? (
            <Boton variante="primario" bloque etiqueta={t('clips.detener')} onPress={detener} />
          ) : (
            <>
              <Boton variante="primario" bloque etiqueta={t('clips.empezarAGrabar')} onPress={() => void grabar()} />
              <Boton
                variante="ghost"
                bloque
                etiqueta={t('clips.cancelar')}
                onPress={() => setVista({ v: 'lista' })}
              />
            </>
          )}
        </View>
      </View>
    );
  }

  // ── REVISIÓN del clip recién grabado / re-visión de uno adjunto ────
  if (vista.v === 'revision' || vista.v === 'ver') {
    const uri = vista.v === 'revision' ? vista.uri : vista.clip.uri;
    const duracionS = vista.v === 'revision' ? vista.duracionS : vista.clip.duracionS;
    const corto = duracionS < CLIP_MIN_S;
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
          <Encabezado
            variante="navegacion"
            titulo={t('clips.revisarTitulo')}
            atras
            onAtras={() => setVista({ v: 'lista' })}
          />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
          <PlayerClip key={uri} uri={uri} />
          <Text
            style={{
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.sm,
              letterSpacing: typography.tracking.mono,
              color: theme.text.secondary,
              textAlign: 'center',
            }}
          >
            {mmss(duracionS)}
          </Text>
          {vista.v === 'revision' ? (
            corto ? (
              <>
                <Text style={vozSecundaria}>{t('clips.quedoCorto')}</Text>
                <Boton variante="primario" bloque etiqueta={t('clips.repetir')} onPress={() => void abrirCamara()} />
                <Boton
                  variante="ghost"
                  bloque
                  etiqueta={t('clips.descartar')}
                  onPress={() => setVista({ v: 'lista' })}
                />
              </>
            ) : (
              <>
                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('clips.usarClip')}
                  onPress={() => usarClip(uri, duracionS)}
                />
                <Boton
                  variante="ghost"
                  bloque
                  etiqueta={t('clips.descartarYRepetir')}
                  onPress={() => void abrirCamara()}
                />
              </>
            )
          ) : (
            <Boton variante="destructivo" bloque etiqueta={t('clips.quitarClip')} onPress={() => quitar(vista.clip)} />
          )}
        </ScrollView>
      </View>
    );
  }

  // ── LISTA (estado raíz) ─────────────────────────────────────────────
  const techo = clips.length >= CLIPS_MAX;
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
        <Encabezado variante="navegacion" titulo={t('clips.titulo')} atras onAtras={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        <Text style={vozSecundaria}>{t('clips.explica', { min: CLIP_MIN_S, max: CLIP_MAX_S, techo: CLIPS_MAX })}</Text>

        {sinPermiso !== null && (
          <Tarjeta relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.text.primary,
                }}
              >
                {t('clips.sinPermiso')}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton
                  variante="secundario"
                  tamaño="sm"
                  etiqueta={sinPermiso === 'ajustes' ? t('clips.abrirAjustes') : t('clips.probarDeNuevo')}
                  onPress={() => {
                    if (sinPermiso === 'ajustes') void Linking.openSettings();
                    else void abrirCamara();
                  }}
                />
              </View>
            </View>
          </Tarjeta>
        )}

        {clips.length > 0 && (
          <Tarjeta>
            {clips.map((c, i) => (
              <View key={c.uri}>
                {i > 0 && <Separador />}
                <Celda
                  titulo={t('clips.clipN', { n: i + 1 })}
                  metadataMono={mmss(c.duracionS)}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => setVista({ v: 'ver', clip: c })}
                />
              </View>
            ))}
          </Tarjeta>
        )}

        {techo ? (
          <Text style={vozSecundaria}>{t('clips.techoAlcanzado', { techo: CLIPS_MAX })}</Text>
        ) : (
          <Boton variante="primario" bloque etiqueta={t('clips.grabarClip')} onPress={() => void abrirCamara()} />
        )}

        {/* STUB DECLARADO (S63-B): el bucket de video es pedido a la A —
            hasta entonces la cola es local y la voz lo dice. */}
        {clips.length > 0 && <Text style={vozSecundaria}>{t('clips.envioPendiente')}</Text>}
      </ScrollView>
    </View>
  );
}
