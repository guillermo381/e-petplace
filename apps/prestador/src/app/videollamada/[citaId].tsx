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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useRoomContext } from '@livekit/components-react';
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
  Insignia,
  ModalDosAlturas,
  SelectorOpcion,
  Separador,
  radius,
  sobreVideo,
  AsaModal,
  SuperficieLlamada,
  Texto,
  spacing,
  useAviso,
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
import { VideoPropioEnLlamada, VideoRemoto, useCamara } from '@/components/videollamada-piezas';
import { DictadoEnVivo } from '@/components/dictado-en-vivo';
import { AVISO_CUADRO, pcIdDeLaSala } from '@/lib/telemedicina/cuadro';
import { capturarCuadro } from '@epetplace/cuadro-video';
import {
  cerrarTeleconsulta,
  estructurarNotaClinica,
  guardarBorradorNota,
  leerBorradorNota,
  obtenerDetalleMascotaPrestador,
  obtenerHistorialClinicoMascota,
  obtenerMiPrestador,
  type DetalleMascotaPrestador,
  type ItemHistorialClinico,
} from '@epetplace/api';
import { fechaCortaMono, type IdiomaSoportado } from '@epetplace/i18n';

/** La línea rotulada que cada conclusión deja EN la nota. Mapa cerrado: un
 *  código sin voz no puede escribir una línea vacía en un expediente. */
const VOZ_CONCLUSION: Record<string, 'consulta.vcConclusionLineaResuelta' | 'consulta.vcConclusionLineaPresencial' | 'consulta.vcConclusionLineaUrgencias'> = {
  resuelta: 'consulta.vcConclusionLineaResuelta',
  presencial: 'consulta.vcConclusionLineaPresencial',
  urgencias: 'consulta.vcConclusionLineaUrgencias',
};

/**
 * Las cuatro tarjetas del contexto clínico, con su regla de honestidad.
 *
 * 🔴 **Un dato que no está NO se pinta como «0» ni como «ninguna».** El peso
 * sin medir y el peso cero no son lo mismo; «sin alergias registradas» y «no
 * tiene alergias» tampoco — *la segunda es una afirmación clínica que el
 * expediente no hizo.* Por eso cada tarjeta que no tiene dato **no se monta**,
 * salvo las alergias, que dicen exactamente lo que el expediente sabe.
 */
function tarjetasClinicas(
  d: DetalleMascotaPrestador,
  t: (k: never) => string,
  idioma: string,
): Array<{ clave: string; etiqueta: string; valor: string }> {
  const salida: Array<{ clave: string; etiqueta: string; valor: string }> = [];
  if (d.peso_clinico_kg !== null) {
    salida.push({
      clave: 'peso',
      etiqueta: t('consulta.vcClinicoPeso' as never),
      valor: `${d.peso_clinico_kg} kg`,
    });
  }
  salida.push({
    clave: 'vacunas',
    etiqueta: t('consulta.vcClinicoVacunas' as never),
    valor: String(d.vacunas_total),
  });
  /* La última visita sale de las atenciones de ESTE prestador (visibilidad
     parcial, por RLS): sin ninguna, la tarjeta no existe — *decir «primera
     visita» sería afirmar algo sobre el historial de otros negocios que esta
     app no puede ver.* */
  const cerradas = d.atenciones
    .map((a) => a.cerrada_en)
    .filter((f): f is string => f !== null)
    .sort();
  const ultima = cerradas.length > 0 ? cerradas[cerradas.length - 1] : null;
  if (ultima !== undefined && ultima !== null) {
    salida.push({
      clave: 'ultima',
      etiqueta: t('consulta.vcClinicoUltima' as never),
      valor: fechaCortaMono(ultima.slice(0, 10), idioma as IdiomaSoportado),
    });
  }
  salida.push({
    clave: 'alergias',
    etiqueta: t('consulta.vcClinicoAlergias' as never),
    valor: d.tiene_alergias
      ? t('consulta.vcClinicoAlergiasSi' as never)
      : t('consulta.vcClinicoAlergiasNo' as never),
  });
  return salida;
}

type Fase = 'pidiendo' | 'encall' | 'sin_entrada';

export default function VideollamadaProfesional() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { citaId = '', familia = '', mascotaId = '' } = useLocalSearchParams<{
    citaId?: string;
    familia?: string;
    mascotaId?: string;
  }>();

  /* OBRA 5 · se enciende al montar y se apaga al desmontar, solo. */
  usePreventScreenCapture();

  /* ── EL CONTEXTO CLÍNICO DE LA MASCOTA (firma del founder, 26-ago) ────────
     Peso · vacunas · última visita · alergias, **sólo del lado del
     PROFESIONAL**: *el dueño ya conoce a su animal, y lo que necesita es ver
     a la doctora.*
     Se lee UNA vez al entrar —son datos del expediente, no del momento— y
     **su fallo no tumba la llamada** (Ley 13): las tarjetas no se dibujan y
     la consulta sigue igual. */
  const [clinico, setClinico] = useState<DetalleMascotaPrestador | null>(null);
  useEffect(() => {
    if (mascotaId.length === 0) return;
    let vigente = true;
    void (async () => {
      const pr = await obtenerMiPrestador();
      if (!vigente || !pr.ok) return;
      const r = await obtenerDetalleMascotaPrestador(mascotaId, pr.data.id);
      if (vigente && r.ok) setClinico(r.data);
    })();
    return () => {
      vigente = false;
    };
  }, [mascotaId]);

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
          onGirar={(track) => void alternarCamara(track)}
          /* 🔴 EL BORRADOR NO MUERE AL COLGAR (firma del founder, 26-ago).
             Cae en el Durante que el vet ya conoce de las presenciales, con su
             confirmación campo por campo — **ahí sedimenta, no acá**.
             `replace` y no `push`: volver con atrás a una sala que ya se dejó
             no tiene sentido.
             Sin borrador se sale y ya: *obligar a pasar por el Durante a quien
             no escribió nada sería cobrarle un trámite por no haber usado una
             función.* */
          clinico={clinico}
          mascotaId={mascotaId}
          citaId={citaId}
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
            /* 🔴 EL DESENLACE VIAJA AL DURANTE, con su mapeo declarado.
               El motor tiene vocabulario CERRADO de dos —`resuelto` ·
               `derivacion`— y la pantalla ofrece tres. **No es una
               discrepancia: es que el motor sólo necesita saber si el
               diagnóstico era posible.** «Necesita presencial» y «derivada a
               urgencias» son las DOS derivaciones — en las dos el vet no
               pudo diagnosticar a distancia, que es exactamente lo que el
               guard acotado contempla.
               *Un vocabulario de motor más grueso que el de la pantalla está
               bien cuando el motor decide MENOS cosas; lo que estaría mal es
               al revés.* */
            const desenlace = conclusion === 'resuelta' ? 'resuelto' : conclusion !== undefined ? 'derivacion' : '';
            const linea = conclusion !== undefined ? t(VOZ_CONCLUSION[conclusion]) : null;
            const texto = linea === null ? borrador : `${borrador}\n\n${linea}`.trim();
            if (texto.trim().length === 0) {
              router.back();
              return;
            }
            router.replace({
              pathname: '/veterinaria/consulta/[citaId]',
              params: { citaId, borrador: texto, desenlace },
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
  clinico,
  mascotaId,
  citaId,
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
  /** Recibe el track propio: el giro real ocurre arriba, con él. */
  onGirar: (track: LocalVideoTrack | null | undefined) => void;
  /** Recibe el borrador: **al colgar la nota no se pierde, se entrega.** */
  /** El borrador de la nota + la conclusión elegida (o `undefined`). */
  onSalir: (borrador: string, conclusion?: string) => void;
  /** El contexto clínico para las tarjetas sobre el video; `null` = no se
   *  pudo leer y **no se dibujan** (Ley 13, jamás datos inventados). */
  clinico: DetalleMascotaPrestador | null;
  /** Para pedir el historial cuando el panel llega a `completo`. */
  mascotaId: string;
  /** La PK del borrador: hay UNO por cita, por construcción. */
  citaId: string;
}) {
  const { t, idioma } = useTraduccion();
  const estado = useConnectionState();
  const { localParticipant, cameraTrack } = useLocalParticipant();
  /* La sala, para leer el `pcId` del track remoto (ver `cuadro.ts`). */
  const sala = useRoomContext();
  const { mostrar } = useAviso();
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

  /* ── 🔴 EL CUADRO CONGELADO, en la llamada ────────────────────────────────
     La prueba contra el track LOCAL dio verde (gate del founder): la vía
     nativa produce **la imagen real**. Acá se ejerce contra el **REMOTO**,
     que es lo que cierra el verde y **es el caso de uso**: el vet captura lo
     que la cámara del dueño está mostrando, no su propia cara.

     🔴 **LAS TRES FIRMAS:**
     ① **No cuenta como grabación** — un cuadro quieto no es la transmisión.
        `roomRecord:false` **no se toca**.
     ② **El dueño lo VE en el momento** — se le avisa por el canal de datos
        de LiveKit ANTES de nada. *No se captura en silencio a alguien que
        está en cámara.*
     ③ **Entra al expediente con su marca** — ⚠️ **pendiente**: falta el
        wrapper de subida a `cita-archivos` (pedido a A). *Hasta que exista,
        la captura ocurre y se ve, y no llega al expediente — se dice.* */
  const [cuadro, setCuadro] = useState<string | null>(null);
  const [capturando, setCapturando] = useState(false);

  const capturar = useCallback(async () => {
    /* ── 🔴 INSTRUMENTADO ANTES DE CONSTRUIR (L-427) ────────────────────────
       El botón no produjo imagen en la cita real. `[CUADRO_C]` es una marca
       que **sólo este código pudo poner**, en cada punto donde puede morir —
       el mismo método que fue lo único que cerró el caso de `[GIRO_C]`.

       ⚠️ **Y el dato del founder no se asume en ninguna dirección:** no pudo
       observar el aviso al dueño (dura 4 s y estaba mirando la otra
       pantalla). *Por eso el despacho del aviso se marca acá: si salió, el
       botón corrió y murió después; si no salió, murió antes.* */
    const marca = (paso: string, detalle?: unknown) =>
      console.log(`[CUADRO_C] ${paso}`, detalle ?? '');

    const pista = pistasRemotas[0]?.publication?.track?.mediaStreamTrack;
    const pc = pcIdDeLaSala(sala);
    marca('toque', {
      hayPista: pista !== undefined,
      pcId: pc,
      /* 🔴 **La pista puede EXISTIR y estar MUTEADA** — con la cámara del
         otro apagada sigue publicada y no emite. *Ése es el borde que puede
         explicar el caso entero, y hasta hoy no se medía.* */
      muteada: pistasRemotas[0]?.publication?.isMuted,
      enabled: pista?.enabled,
    });
    if (pista === undefined || pc === null) {
      marca('sale:sin_pista_o_sin_pc');
      mostrar({ texto: t('consulta.vcCuadroSinImagen'), variante: 'error' });
      return;
    }
    setCapturando(true);
    /* ② PRIMERO el aviso, después la captura. *Avisar después sería avisar
       de algo ya hecho, y la firma dice que lo VE en el momento.* Su fallo
       no frena: el vet no puede quedarse sin capturar porque el canal falló,
       y el dueño igual ve el aviso en pantalla del lado del vet. */
    try {
      await localParticipant.publishData(
        new TextEncoder().encode(AVISO_CUADRO) as Uint8Array<ArrayBuffer>,
        { reliable: true },
      );
      marca('aviso:despachado');
    } catch (e) {
      marca('aviso:fallo', String(e));
    }

    const r = await capturarCuadro(pista.id, pc);
    setCapturando(false);
    marca('resultado', r);

    if (r.ok) {
      setCuadro(r.ruta);
      return;
    }
    /* 🔴 **EL FALLO SE DICE.** La v1 guardaba `null` y no pintaba nada: *el
       founder tocó el botón y no pasó NADA — ni imagen, ni error, ni motivo.*
       `sin_frame` tiene voz propia porque **no es una falla: es el criterio
       funcionando** —no había imagen que capturar— y confundirlo con un error
       mandaría a buscar un defecto donde no hay ninguno. */
    setCuadro(null);
    mostrar({
      texto: r.codigo === 'sin_frame' ? t('consulta.vcCuadroSinImagen') : t('consulta.vcCuadroFallo'),
      variante: 'error',
    });
  }, [pistasRemotas, sala, localParticipant, mostrar, t]);

  /* ── 🔴 EL BORRADOR — veinte minutos de dictado no dependen de la memoria
     del vet ni de que la app no se cierre ─────────────────────────────────
     **Se lee al montar** (si el vet ya había dictado y volvió, su trabajo
     está) y **se guarda solo cada 5 s cuando hay cambios**.

     Tres cosas que el wrapper de A deja escritas y esta pantalla respeta:
     · **`existe: false` es la respuesta NORMAL** la primera vez — no un
       fallo, y por eso no tiene voz de error.
     · **No se borra**: lo limpia un trigger al sedimentar. *Llamar a un
       borrado que el motor ya hace sería competir con él.*
     · **No se valida**: es `jsonb` opaco a propósito — *una nota a medio
       escribir es inválida por definición, y validarla sería impedir
       exactamente lo que el borrador existe para permitir.*

     ⚠️ **Su fallo NO interrumpe la consulta y NO se grita.** Un aviso de
     «no pudimos guardar» cada cinco segundos, encima del video, mientras el
     vet examina a un animal, es peor que el riesgo que evita. Lo que sí
     hace es **dejar de decir «Guardado»**: la pantalla no afirma lo que no
     puede probar. */
  const [guardadoEn, setGuardadoEn] = useState<string | null>(null);
  const sucio = useRef(false);
  const ultimoGuardado = useRef('');

  useEffect(() => {
    if (citaId.length === 0) return;
    let vigente = true;
    void leerBorradorNota(citaId).then((r) => {
      if (!vigente || !r.ok || !r.data.existe) return;
      const texto = r.data.nota?.['texto'];
      if (typeof texto === 'string' && texto.length > 0) {
        setNota(texto);
        ultimoGuardado.current = texto;
        setGuardadoEn(r.data.actualizadoEn);
      }
    });
    return () => {
      vigente = false;
    };
  }, [citaId]);

  const guardarAhora = useCallback(async () => {
    if (citaId.length === 0) return;
    const texto = nota;
    if (texto === ultimoGuardado.current) return;
    const r = await guardarBorradorNota(citaId, { texto, conclusion: conclusion ?? null });
    if (r.ok) {
      ultimoGuardado.current = texto;
      sucio.current = false;
      setGuardadoEn(r.data.guardadoEn);
    } else {
      /* Silencio deliberado: ver la cabecera. Lo que se pierde es la marca
         de guardado, que es justo la señal honesta. */
      setGuardadoEn(null);
    }
  }, [citaId, nota, conclusion]);

  /* ── 🔴 EL ESTRUCTURADOR, LA MITAD QUE ENTRA ──────────────────────────────
     **El problema real que nombró el founder:** *«lo que el vet dicta en
     veinte minutos llega crudo al final».*

     **Medido, el estructurador entero NO entra acá:** en el Durante, después
     de estructurar, `setFase('confirmacion')` abre **una pantalla completa de
     revisión** —campos editables, vitales, medicación—. Traer eso adentro de
     un panel sobre una llamada en curso es rehacer esa pantalla, y a medias
     sería peor.

     **Lo que SÍ entra, y resuelve el problema entero:** estructurar acá y
     **dejar el resultado EN EL BORRADOR**. Cuando el vet cuelga y cae al
     Durante, su nota **ya llegó estructurada** — sólo revisa. *El costo es
     una llamada; lo que evita es que veinte minutos de dictado aterricen
     como un bloque de texto que hay que releer entero.*

     ⚠️ **El muro §8.3 viaja intacto**: la IA asigna las palabras DEL VET a
     campos y jamás agrega contenido clínico que él no dictó. Acá no se toca
     ese contrato — se lo llama antes, no distinto.

     Su fallo **no interrumpe**: el texto crudo sigue en el borrador y el
     Durante estructura como siempre. *Lo que se pierde es un adelanto, no el
     trabajo.* */
  const [estructurando, setEstructurando] = useState(false);
  const estructurar = useCallback(async () => {
    if (nota.trim().length === 0 || estructurando) return;
    setEstructurando(true);
    const r = await estructurarNotaClinica({
      texto: nota,
      especie: clinico?.mascota.especie ?? undefined,
    });
    setEstructurando(false);
    if (!r.ok) return;
    /* Se guarda junto al texto: el borrador es `jsonb` opaco y admite las dos
       cosas. **El crudo NO se pisa** — *el dictado original es la fuente y la
       estructura es su lectura; perder la fuente para quedarse con la lectura
       es exactamente lo que L-139 prohíbe.* */
    const g = await guardarBorradorNota(citaId, {
      texto: nota,
      conclusion: conclusion ?? null,
      estructurada: r.data as unknown as Record<string, unknown>,
    });
    if (g.ok) {
      ultimoGuardado.current = nota;
      sucio.current = false;
      setGuardadoEn(g.data.guardadoEn);
    }
  }, [nota, estructurando, clinico, citaId, conclusion]);

  /* El reloj del guardado automático. **5 s y no cada tecla**: cada llamada
     es un upsert contra el servidor, y guardar en cada letra convertiría una
     red mala en una pantalla que no responde. */
  useEffect(() => {
    if (!sucio.current) return;
    const id = setTimeout(() => void guardarAhora(), 5000);
    return () => clearTimeout(id);
  }, [nota, conclusion, guardarAhora]);

  /* ── EL HISTORIAL: se pide la PRIMERA vez que el panel llega a `completo`.
     *No al montar —la mayoría de las consultas no lo abren— ni en cada
     subida: es historia, no estado del momento.* */
  const [historial, setHistorial] = useState<ItemHistorialClinico[] | 'cargando' | 'error'>('cargando');
  const [filtroCaso, setFiltroCaso] = useState('todo');
  const pedido = useRef(false);
  useEffect(() => {
    if (altura !== 'completo' || pedido.current || mascotaId.length === 0) return;
    pedido.current = true;
    void obtenerHistorialClinicoMascota(mascotaId, { limite: 50 }).then((r) => {
      setHistorial(r.ok ? r.data : 'error');
    });
  }, [altura, mascotaId]);

  /* Los casos que la mascota REALMENTE tiene — el filtro sale de los datos,
     jamás de una lista escrita: *un filtro con opciones que no existen ofrece
     vacíos.* */
  const casosPresentes = Array.isArray(historial)
    ? [
        ...new Map(
          historial
            .filter((h) => h.casoClinicoId !== null && h.casoCondicion !== null)
            .map((h) => [h.casoClinicoId as string, { codigo: h.casoClinicoId as string, etiqueta: h.casoCondicion as string }]),
        ).values(),
      ]
    : [];

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
          /* 🔴 EL TRACK VIAJA HACIA ARRIBA: el estado de `facingMode` vive
             afuera y el track sólo existe acá adentro (`useLocalParticipant`).
             *Sin esto el giro se pedía sin track y el espejo se movía sobre
             una cámara que no había cambiado* — el defecto del gate. */
          onGirar(propio);
        }}
        onAltavoz={alternarAltavoz}
      altavozActivo={altavoz}
      onColgar={salir}
        vozControles={{
          microfono: t('consulta.vcVozMic'),
          camara: t('consulta.vcVozCam'),
          colgar: t('consulta.vcVozColgar'),
        altavoz: t('consulta.vcVozAltavoz'),
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
      {/* ③ · LAS TARJETAS Y EL ASA VIVEN EN `cerrado` **Y EN `medio`**.
          🔴 La v1 las ató sólo a `cerrado` y el founder no las vio: *el
          momento en que el vet quiere el contexto clínico es exactamente
          cuando abre el panel para escribir.* En `completo` no van — ahí la
          pantalla ES la historia, y el contexto vive adentro de ella.
          **Cuarto caso del patrón, y de otra clase: no era «sin montar», era
          «montado donde no sirve».** */}
      {altura !== 'completo' && (
        <View
          style={{ position: 'absolute', left: 0, right: 0, bottom: insetBottom + 120, gap: spacing[2] }}
          pointerEvents="box-none"
        >
          {/* ── LAS TARJETAS DEL CONTEXTO CLÍNICO (firma del founder) ────────
              **Sobre el video y encima de los controles**, no dentro del
              modal: son lo que el vet mira MIENTRAS observa al animal, y
              tenerlas detrás de un panel las vuelve inútiles justo cuando
              sirven.

              🔴 **Sólo del lado del PROFESIONAL.** El dueño no las ve: *ya
              conoce a su animal, y lo que necesita es ver a la doctora.*

              Fila horizontal desplazable: con cuatro datos de largo variable
              —«3 vacunas» y «Sin alergias registradas» no miden lo mismo—
              apretarlas en el ancho las trunca, y *un dato clínico truncado
              es peor que uno ausente: se lee como si dijera otra cosa.* */}
          {clinico !== null && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[2] }}
            >
              {tarjetasClinicas(clinico, t, idioma).map((tj) => (
                <View
                  key={tj.clave}
                  style={{
                    backgroundColor: sobreVideo.banda,
                    borderRadius: radius.suave,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    minHeight: 44,
                    justifyContent: 'center',
                  }}
                >
                  <Texto variante="dato" color="sobreVideo">
                    {tj.etiqueta}
                  </Texto>
                  <Texto variante="cuerpo" color="sobreVideo">
                    {tj.valor}
                  </Texto>
                </View>
              ))}
            </ScrollView>
          )}
          {/* 🔴 EL BOTÓN DEL CUADRO — sobre el video, donde el vet está
              mirando. Sólo con video remoto: *capturar antes de que llegue
              imagen produciría el frame vacío que el criterio de verde
              prohíbe.* */}
          {pistasRemotas.length > 0 && (
            <View style={{ paddingHorizontal: spacing[4] }}>
              <Boton
                variante="secundario"
                etiqueta={capturando ? t('consulta.vcCuadroCapturando') : t('consulta.vcCuadroCta')}
                onPress={() => void capturar()}
                cargando={capturando}
              />
              {cuadro !== null && (
                <Texto variante="apoyo" color="sobreVideo">
                  {t('consulta.vcCuadroListo')}
                </Texto>
              )}
            </View>
          )}

          <AsaModal
            etiqueta={t('consulta.vcAsaModal')}
            onPress={() => setAltura(altura === 'cerrado' ? 'medio' : 'completo')}
          />
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
        {/* ── ② y ③ · EL CUERPO SCROLLEA, y B despejó la tensión ────────────
            *El `Pan` de la pieza está atado SÓLO AL ASA a propósito, para que
            un scroll en el cuerpo no pelee con él* ⇒ acá va un `ScrollView`
            normal y anda. **`blocksExternalGesture` NO hace falta acá**: esa
            receta es para cuando el contenedor arrastra desde el cuerpo, que
            no es lo que hace `ModalDosAlturas`.

            `keyboardShouldPersistTaps` para que tocar otro campo con el
            teclado abierto **funcione al primer toque** — sin eso el primero
            sólo cierra el teclado y el vet toca dos veces sin saber por qué.

            Y esto es la mitad de ②: el alto reservado ya estaba; **lo que
            faltaba era que el contenido se pudiera correr** para que el cursor
            quede a la vista. */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[6] }}
        >
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
          <DictadoEnVivo
            value={nota}
            onChangeText={(x) => {
              sucio.current = true;
              setNota(x);
            }}
            onEscuchandoCambia={setDictando}
          />

          <Campo
            label={t('consulta.vcNotaTitulo')}
            placeholder={t('consulta.vcNotaPlaceholder')}
            value={nota}
            onChangeText={(x) => {
              sucio.current = true;
              setNota(x);
            }}
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
            onSelect={(c) => {
              sucio.current = true;
              setConclusion(c);
            }}
          />

          {/* ── ② LA HISTORIA CLÍNICA, con sus filtros ──────────────────────
              **Sólo en `completo`, y sólo ahí se pide.** *Traerla al abrir el
              panel sería pagar una consulta que en la mayoría de las
              consultas nadie va a mirar.*

              🔴 Su gate es el **CLÍNICO**, no el de acceso — lo dice el
              wrapper de A: *«quien puede ver que existe una mascota no es
              necesariamente quien puede leer su historia»*. Acá no se
              re-verifica: la puerta es del servidor.

              El filtro por CASO nace de los datos que vuelven, no de una
              lista escrita: *un filtro con opciones que la mascota no tiene
              ofrece vacíos.* */}
          {altura === 'completo' && (
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('consulta.vcHistoriaTitulo')}</Texto>

              {casosPresentes.length > 0 && (
                <SelectorOpcion
                  etiqueta={t('consulta.vcHistoriaFiltroCaso')}
                  disposicion="tira"
                  opciones={[
                    { codigo: 'todo', etiqueta: t('consulta.vcHistoriaTodo') },
                    ...casosPresentes,
                  ]}
                  seleccionada={filtroCaso}
                  onSelect={setFiltroCaso}
                />
              )}

              {historial === 'cargando' ? (
                <Texto variante="apoyo">{t('consulta.vcHistoriaCargando')}</Texto>
              ) : historial === 'error' ? (
                /* Ley 13: el fallo se DICE. *Un historial que falla y se pinta
                   vacío le dice al vet que la mascota no tiene historia, que es
                   una afirmación clínica falsa.* */
                <Texto variante="apoyo">{t('consulta.vcHistoriaError')}</Texto>
              ) : historial.length === 0 ? (
                <Texto variante="apoyo">{t('consulta.vcHistoriaVacia')}</Texto>
              ) : (
                historial
                  .filter((h) => filtroCaso === 'todo' || h.casoClinicoId === filtroCaso)
                  .map((h) => (
                    <View key={h.eventoId} style={{ gap: spacing[1] }}>
                      <Separador />
                      <Texto variante="dato">
                        {h.fecha !== null
                          ? fechaCortaMono(h.fecha.slice(0, 10), idioma as IdiomaSoportado)
                          : t('consulta.vcHistoriaSinFecha')}
                        {h.negocioNombre !== null ? ` · ${h.negocioNombre}` : ''}
                      </Texto>
                      {/* Motivo y diagnóstico: los dos con `null` HONESTO. La
                          lista trae el encabezado, jamás la nota entera — *lo
                          que se esconde igual viajó.* */}
                      {h.motivoConsulta !== null && (
                        <Texto variante="cuerpo">{h.motivoConsulta}</Texto>
                      )}
                      {h.diagnostico !== null && (
                        <Texto variante="apoyo">{h.diagnostico}</Texto>
                      )}
                      {h.modalidad === 'telemedicina' && (
                        <View style={{ alignSelf: 'flex-start' }}>
                          <Insignia modalidad="teleconsulta" tamaño="sm" />
                        </View>
                      )}
                    </View>
                  ))
              )}
            </View>
          )}

          {/* ── ④ CERRAR EL PANEL ───────────────────────────────────────────
              🔴 **Dice «Listo», no «Guardar», y la diferencia es honestidad.**
              Medido: **no existe un borrador persistente** — el Durante
              sedimenta al final con `sedimentar_nota_clinica` y no hay dónde
              dejar una nota a medio escribir. *Un botón «Guardar» que sólo
              baja el panel le haría creer al vet que su nota está a salvo de
              un cierre de app, y no lo está.*
              Lo escrito viaja al Durante **al colgar**, que es donde sí
              sedimenta. El borrador persistente es pedido a A. */}
          {/* 🔴 AHORA DICE «GUARDAR» DE VERDAD — el borrador existe (A, 27-ago).
              Guarda y baja el panel. *Y la marca de abajo es la parte que
              importa: dice CUÁNDO se guardó, no «guardado» a secas — un
              «guardado» sin hora no distingue lo de recién de lo de hace
              veinte minutos, que es justo lo que el vet necesita saber
              cuando la red estuvo mala.* */}
          {/* Sólo con algo dictado: *un botón que ordena la nada no ordena
              nada, y ofrecerlo vacío enseña que a veces no hace efecto.* */}
          {nota.trim().length > 0 && (
            <Boton
              variante="secundario"
              etiqueta={estructurando ? t('consulta.vcModalEstructurando') : t('consulta.vcModalEstructurar')}
              onPress={() => void estructurar()}
              cargando={estructurando}
            />
          )}

          <Boton
            variante="secundario"
            etiqueta={t('consulta.vcModalGuardar')}
            onPress={() => {
              void guardarAhora();
              setAltura('cerrado');
            }}
          />
          {guardadoEn !== null && (
            <Texto variante="apoyo">
              {t('consulta.vcModalGuardadoA', {
                hora: new Intl.DateTimeFormat(idioma === 'en' ? 'en-US' : 'es-EC', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(guardadoEn)),
              })}
            </Texto>
          )}
        </ScrollView>
      </ModalDosAlturas>

      <HojaConfirmacionDestructiva
        visible={confirmandoSalir}
        onCerrar={() => setConfirmandoSalir(false)}
        titulo={t('consulta.vcColgarConfirma')}
        sujeto={t('consulta.vcColgarSujeto')}
        etiquetaConfirmar={t('consulta.vcColgarSi')}
        etiquetaCancelar={t('consulta.vcColgarNo')}
        onConfirmar={() => {
          /* 🔴 CIERRA DE VERDAD — ver el gemelo del cliente. Se sale igual si
             el cierre falla: *retener al vet en una llamada que quiere
             terminar es peor que una sala abierta*, y para eso está el cierre
             perezoso. */
          void cerrarTeleconsulta(citaId);
          onSalir(nota, conclusion);
        }}
      >
        {/* La consecuencia va en el CUERPO, no en el título: el título hace
            la pregunta y esto dice qué pasa si la respuesta es sí. */}
        <Texto variante="cuerpo">{t('consulta.vcColgarDetalle')}</Texto>
      </HojaConfirmacionDestructiva>
    </>
  );
}
