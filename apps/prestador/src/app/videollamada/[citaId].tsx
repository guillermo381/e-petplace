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
import { Keyboard, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
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
  Campo,
  Encabezado,
  EsperaDeMarca,
  EstadoVacio,
  HojaConfirmacionDestructiva,
  ModalDosAlturas,
  SelectorOpcion,
  AsaModal,
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
import { DictadoEnVivo } from '@/components/dictado-en-vivo';

/** La línea rotulada que cada conclusión deja EN la nota. Mapa cerrado: un
 *  código sin voz no puede escribir una línea vacía en un expediente. */
const VOZ_CONCLUSION: Record<string, 'consulta.vcConclusionLineaResuelta' | 'consulta.vcConclusionLineaPresencial' | 'consulta.vcConclusionLineaUrgencias'> = {
  resuelta: 'consulta.vcConclusionLineaResuelta',
  presencial: 'consulta.vcConclusionLineaPresencial',
  urgencias: 'consulta.vcConclusionLineaUrgencias',
};

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
    else router.replace('/(tabs)');
  }, [fase, sinEntrada, router]);

  const cabecera = (
    <Encabezado variante="navegacion" titulo={t('consulta.vcTitulo')} atras onAtras={() => router.back()} />
  );

  if (!livekitListo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top', 'bottom']}>
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

  if (fase === 'sin_entrada' || credencial === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top', 'bottom']}>
        {cabecera}
        <EstadoVacio
          registro="pantalla"
          titulo={sinEntrada?.tipo === 'voz' ? sinEntrada.texto : t('consulta.vcSinEntrada')}
          descripcion=""
          accion={<Boton
              variante="primario"
              etiqueta={t('atender.reintentar')}
              onPress={() => {
                setFase('pidiendo');
                setIntento((n) => n + 1);
              }}
            />}
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
          /* 🔴 EL BORRADOR NO MUERE AL COLGAR (firma del founder, 26-ago).
             Cae en el Durante que el vet ya conoce de las presenciales, con su
             confirmación campo por campo — **ahí sedimenta, no acá**.
             `replace` y no `push`: volver con atrás a una sala que ya se dejó
             no tiene sentido.
             Sin borrador se sale y ya: *obligar a pasar por el Durante a quien
             no escribió nada sería cobrarle un trámite por no haber usado una
             función.* */
          onSalir={(borrador, conclusion) => {
            /* 🔴 LA CONCLUSIÓN VIAJA DENTRO DE LA NOTA, y es lo que la firma
               pide: *«es parte de la nota clínica»*. Se le pone su rótulo para
               que el que la lea después —persona o estructurador— sepa que es
               el desenlace y no una frase más del relato.

               ⚠️ **Declarado: hoy viaja como TEXTO, no como campo.** La nota
               clínica no tiene una columna para el desenlace, y esa columna es
               MOTOR — pedido a A. *Mientras tanto la conclusión se conserva y
               se lee; lo que no se puede todavía es consultarla como dato
               («cuántas teleconsultas derivaron a urgencias»).* Preferible a
               perderla: un dato en prosa se puede migrar, uno que no se
               registró no. */
            const linea = conclusion !== undefined ? t(VOZ_CONCLUSION[conclusion]) : null;
            const texto = linea === null ? borrador : `${borrador}\n\n${linea}`.trim();
            if (texto.trim().length === 0) {
              router.back();
              return;
            }
            router.replace({
              pathname: '/veterinaria/consulta/[citaId]',
              params: { citaId, borrador: texto },
            });
          }}
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
  /** Recibe el borrador: **al colgar la nota no se pierde, se entrega.** */
  /** El borrador de la nota + la conclusión elegida (o `undefined`). */
  onSalir: (borrador: string, conclusion?: string) => void;
}) {
  const { t } = useTraduccion();
  const estado = useConnectionState();
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const remotos = useRemoteParticipants();
  const pistasRemotas = useParticipantTracks([Track.Source.Camera], remotos[0]?.identity);
  const [inicioTs] = useState(() => Date.now());
  const [altura, setAltura] = useState<AlturaModal>('cerrado');
  const [nota, setNota] = useState('');
  /* 🔴 LA CONCLUSIÓN CLÍNICA — `undefined` = el vet todavía no eligió, y
     **no hay default**: *un valor preseleccionado en un campo clínico es un
     diagnóstico que puso la app y no el veterinario.* */
  const [conclusion, setConclusion] = useState<string | undefined>(undefined);
  /* 🔴 MIENTRAS EL VET DICTA, EL MICRÓFONO DE LA LLAMADA SE APAGA.
     Dos consumidores del mic no conviven en Android — y además es lo
     correcto: *está dictando la nota clínica, no hablándole a la familia.* */
  const [dictando, setDictando] = useState(false);

  /* 🔴 EL ALTO DEL TECLADO — hallazgos ① y ⑤ del gate.
     `ModalDosAlturas` acepta `altoTeclado` y **yo no se lo pasaba**, así que
     el panel no reservaba nada y el teclado se comía el final del contenido
     (la conclusión clínica, que es lo último). *Una prop que la pieza expone
     y el consumidor no llena es la mitad de una función.*
     ⚠️ Y es lo único del crash que puedo tocar sin el stack: la hipótesis
     medida es que el teclado **redimensiona la ventana** y el SurfaceView de
     LiveKit se recrea — *el mismo modo de falla que el MapView sin key de
     `D-575`, que también murió en hilo nativo, fuera de toda ErrorBoundary.*
     Reservar el alto no cambia el modo de la ventana; **el diagnóstico sigue
     pedido y esto no lo reemplaza.** */
  const [altoTeclado, setAltoTeclado] = useState(0);
  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', (e) =>
      setAltoTeclado(e.endCoordinates.height),
    );
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setAltoTeclado(0));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  /* 🔴 EL APAGADO REAL, no sólo el ícono. Si el track siguiera publicado, el
     dueño escucharía al vet dictando su nota clínica — que es exactamente lo
     que esta cura evita. Y al terminar vuelve al estado que el vet **tenía
     elegido**, no a «encendido»: *devolverle el micrófono a alguien que lo
     había apagado a propósito es peor que dejarlo apagado.* */
  useEffect(() => {
    void localParticipant.setMicrophoneEnabled(micActivo && !dictando);
  }, [dictando, micActivo, localParticipant]);
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
        /* Mientras dicta, el control se muestra apagado: es la verdad —
         el micrófono está en la nota, no en la llamada. */
      microfonoActivo={micActivo && !dictando}
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

      {/* ── 🔴 EL ASA, SOBRE EL VIDEO — hallazgo ④ del gate del founder ──────
          **«El vet no tiene con qué escribir.»** El panel SÍ se montaba; lo
          que no se veía era su manija, y la medición dice por qué **sin
          necesidad de aparato**:

          ① `ModalDosAlturas` cerrado vive en `bottom: 0` con 28 px de alto, y
             `SuperficieLlamada` pone su barra de controles **también en
             `bottom: 0`**. El modal se monta después ⇒ **su franja tapa la
             parte baja de los controles y el asa se pierde ahí.**
          ② Peor: esos 28 px **no descuentan `insetBottom`**, así que caen
             dentro de la barra de gestos del sistema. *Es el gemelo exacto
             del hallazgo ② de B en la tanda 2 —el botón «entrar» pisado por
             los botones del sistema—: el mismo defecto, otra pantalla.*

          ⇒ Se monta `AsaModal`, que **B exportó para exactamente esto** y lo
          dejó escrito en su JSDoc: *«el asa suelta, para montarla sobre el
          video cuando el panel está cerrado»*. **Estaba construida y nadie la
          montaba** — mi obra, no la suya.

          El `120` no es un número elegido: es **el mismo que la propia
          `SuperficieLlamada` usa** para poner contenido justo encima de su
          barra de controles. *Copiar su número en vez de estimar uno es lo
          que hace que el asa siga en su lugar el día que la barra cambie.*

          Sólo con el panel `cerrado`: abierto, el asa del panel es la que
          manda y dos manijas para lo mismo confunden más que ninguna. */}
      {altura === 'cerrado' && (
        <View
          style={{ position: 'absolute', left: 0, right: 0, bottom: insetBottom + 120 }}
          pointerEvents="box-none"
        >
          <AsaModal etiqueta={t('consulta.vcAsaModal')} onPress={() => setAltura('medio')} />
        </View>
      )}

      {/* §3 · EL MODAL DE DOS ALTURAS. `medio` = dictar viendo al animal, que
          es el caso real; `completo` = leer la historia. **Nunca tapa el video
          del todo** — eso lo garantiza la pieza. */}
      <ModalDosAlturas
        altura={altura}
        onAltura={setAltura}
        altoPantalla={alto}
        /* ⑤ · el contenido termina ARRIBA de los controles de la llamada, que
           viven en `bottom: 0` y se dibujan encima. El 120 es el mismo número
           que usa la propia `SuperficieLlamada` para poner algo sobre su
           barra — copiarlo en vez de estimar es lo que hace que siga
           calzando el día que la barra cambie. */
        insetBottom={insetBottom + 120}
        altoTeclado={altoTeclado}
        etiquetaAsa={t('consulta.vcAsaModal')}
        /* Bajar con texto sin guardar pide confirmación — lo resuelve la pieza
           con este aviso; acá sólo se le dice si hay algo escrito. */
        /* La conclusión también cuenta como trabajo sin guardar: bajar el
           panel después de elegir «urgencias» y perderlo en silencio sería
           tirar el dato más importante de la consulta. */
        hayCambiosSinGuardar={nota.trim().length > 0 || conclusion !== undefined}
      >
        <View style={{ gap: spacing[4] }}>
          <Texto variante="seccion">{t('consulta.vcNotaTitulo')}</Texto>
          {/* El mismo registro del Durante: texto libre en `Campo`.
              🔴 Su regla viaja intacta — **la plataforma jamás sugiere
              medicamentos, tratamientos ni posologías**. El placeholder nombra
              CAMPOS, no contenido. */}
          {/* 🔴 EL DICTADO — hallazgo ② del gate: **no se montaba.**
              `DictadoEnVivo` existe desde S78 (D-456, con su gate pasado) y
              vivía en UNA sola pantalla, el Durante presencial. *Es el mismo
              patrón que el asa: pieza construida, probada, y sin montar.*

              **Y era el punto del modal**, no un extra: el vet escribe
              MIRANDO al animal, no al teclado. Si no está el módulo nativo o
              el reconocedor del SO, la pieza **no se dibuja** (Ley 23) y queda
              el campo — nunca un control muerto.

              ⚠️ **Y es además la mitigación del crash (①):** la hipótesis
              medida es que el teclado redimensiona la ventana y el
              SurfaceView de LiveKit se recrea. *Dictando no se abre el
              teclado.* No sustituye al diagnóstico —el stack sigue pedido—
              pero le da al vet un camino para trabajar hoy. */}
          <DictadoEnVivo value={nota} onChangeText={setNota} onEscuchandoCambia={setDictando} />

          <Campo
            label={t('consulta.vcNotaTitulo')}
            placeholder={t('consulta.vcNotaPlaceholder')}
            value={nota}
            onChangeText={setNota}
            multilinea={6}
          />

          {/* ── 🔴 CÓMO TERMINA LA CONSULTA (firma del founder, 26-ago) ──────
              **Es parte de la NOTA CLÍNICA, no un motivo de cierre**, y la
              diferencia no es de forma: *una consulta que termina en «llevala
              a urgencias» SÍ OCURRIÓ* — el vet atendió, cobra, y el expediente
              tiene que decir qué pasó. **No se confunde con «no realizable»**,
              que es la consulta que NO se pudo hacer y devuelve la plata: son
              opuestos para el dinero y para el registro.

              *Por eso vive acá adentro y no en un formulario al colgar: un
              formulario al colgar se lee como «motivo de cierre», y ahí la
              derivación empieza a parecerse a un fracaso del servicio cuando
              es su resultado más valioso.*

              🔴 **Las tres salen de la LETRA, no de mi criterio:**
              «necesita atención presencial» es verbatim de §4 —*«eso ES el
              servicio prestado»*— y «derivar a urgencias» es la salida que el
              aviso de §3 ya nombra. *Si el vocabulario clínico crece, es letra
              y no código.*

              **Ninguna preselecciona y las tres pesan igual**: si «urgencias»
              presidiera, la app empujaría hacia el desenlace más caro — el
              mismo argumento que sostiene la paridad del aviso §3.

              **No bloquea nada.** Sin elegir, la conclusión va vacía y la nota
              sigue siendo válida: *es la nota clínica, no un peaje.* */}
          <SelectorOpcion
            etiqueta={t('consulta.vcConclusionTitulo')}
            disposicion="columnas"
            opciones={[
              { codigo: 'resuelta', etiqueta: t('consulta.vcConclusionResuelta') },
              { codigo: 'presencial', etiqueta: t('consulta.vcConclusionPresencial') },
              { codigo: 'urgencias', etiqueta: t('consulta.vcConclusionUrgencias') },
            ]}
            seleccionada={conclusion}
            onSelect={setConclusion}
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
        onConfirmar={() => onSalir(nota, conclusion)}
      />
    </>
  );
}
