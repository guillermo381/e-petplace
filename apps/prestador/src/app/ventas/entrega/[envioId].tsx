/**
 * LA ENTREGA — el detalle del repartidor (S96-C · C-B4 ·
 * LETRA_RECORRIDO §9.1–§9.3).
 *
 * BOCETO M1:
 *  · TESIS: «Encontrás la casa y cerrás la entrega — con guantes puestos
 *    y a pleno sol.»
 *  · FIRMA: TRES ACCIONES Y NADA MÁS — «voy hacia acá» (manual, decisión
 *    ⑤ del arranque) · «entregado» (foto + código) · «no había nadie».
 *    Sin rutas, sin chat, sin catálogo, sin otro pedido.
 *  · CHANEL: sin monto, sin ítems, sin mascota — el snapshot del envío
 *    es todo lo que la puerta necesita, y el TIPO de `FilaEntrega` lo
 *    vuelve inexpresable (L-222).
 *  · ESTADOS: cargando · no existe/error · en_reparto · hacia_destino ·
 *    fallido (solo lectura — el reintento lo despacha el vendedor).
 *
 * La entrega fallida sigue la letra §9.3: llamar → esperar un rato corto
 * CON EL RELOJ A LA VISTA → la instrucción de entrega decide, o vuelve.
 * El botón de marcar fallida no se enciende hasta que la espera corrió —
 * la espera es parte del trato con la familia, no una sugerencia. Los
 * 60 s son perilla de PANTALLA (declarada), no del motor.
 *
 * «Entregado» exige código + foto — el motor rebota sin los dos
 * (`codigo_incorrecto` · `foto_requerida`): entregado no es la palabra
 * de una sola parte. La foto va al bucket privado `entregas` (§9.4: la
 * ven el vendedor y e-PetPlace, jamás otro cliente; 90 días; el
 * expediente jamás la toca — la voz de la pantalla lo dice).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvidenciaFotoCapturar,
  EvidenciaFotoThumbnail,
  EvitaTeclado,
  FilaDato,
  FilaEntrega,
  Hoja,
  HojaScroll,
  MarcaDeAgua,
  Tarjeta,
  Texto,
  leerBytes,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  entregarConEvidencia,
  marcarEnCaminoADestino,
  marcarEntregaFallida,
  misEntregasAsignadas,
  subirFotoEntrega,
  type EntregaAsignada,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useTrackGps } from '@/lib/use-track-gps';
import { horaCorta } from '@/lib/ventas-formato';

/** Los controles que la captura le presta al cierre: el flush final corre
 *  ANTES de entregar/fallar (contrato de ventana M23) y detener apaga
 *  SOLO esta sesión. */
interface ControlesTrack {
  flushFinal: () => Promise<{ total: number; pendientes: number }>;
  detener: () => Promise<void>;
}

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; entrega: EntregaAsignada };

// La espera corta de §9.3, con el reloj a la vista. Perilla de pantalla.
const ESPERA_SEGUNDOS = 60;

export default function DetalleEntrega() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { envioId } = useLocalSearchParams<{ envioId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [enviando, setEnviando] = useState(false);

  // hoja «entregado»
  const [entregando, setEntregando] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [fotoFallo, setFotoFallo] = useState(false);

  // el track del reparto (§9.5) — los controles llegan del hijo montado
  // solo en `hacia_destino`; null = no hay captura corriendo (y el cierre
  // no flushea nada, correcto: la ventana del motor tampoco lo aceptaría)
  const controlesTrackRef = useRef<ControlesTrack | null>(null);
  const alListoTrack = useCallback((c: ControlesTrack | null) => {
    controlesTrackRef.current = c;
  }, []);

  // hoja «no había nadie»
  const [fallando, setFallando] = useState(false);
  const [segundos, setSegundos] = useState<number | null>(null);
  const [esperaCorrida, setEsperaCorrida] = useState(false);
  const [motivoFallida, setMotivoFallida] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (typeof envioId !== 'string') return;
      let vigente = true;
      void (async () => {
        const r = await misEntregasAsignadas();
        if (!vigente) return;
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const entrega = r.data.find((e) => e.envio_id === envioId);
        if (entrega === undefined) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({ estado: 'listo', entrega });
      })();
      return () => {
        vigente = false;
      };
    }, [envioId, intento]),
  );

  // el reloj a la vista (§9.3) — cuenta hacia cero y habilita la fallida
  useEffect(() => {
    if (segundos === null || segundos <= 0) return;
    const timer = setTimeout(() => {
      setSegundos((s) => (s === null ? null : s - 1));
      if (segundos === 1) setEsperaCorrida(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [segundos]);

  const recargar = () => setIntento((n) => n + 1);

  async function voyHaciaAca() {
    if (enviando || pantalla.estado !== 'listo') return;
    setEnviando(true);
    const r = await marcarEnCaminoADestino(pantalla.entrega.envio_id);
    setEnviando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('ventas.entregas.enCamino'), variante: 'exito' });
    recargar();
  }

  async function confirmarEntrega() {
    if (enviando || pantalla.estado !== 'listo' || fotoUri === null) return;
    setEnviando(true);
    setFotoFallo(false);
    // leerBytes LANZA ante un uri ilegible (frontera L-137) — el catch
    // habla y la foto no desaparece (contrato de EvidenciaFoto).
    let bytes: ArrayBuffer;
    try {
      bytes = await leerBytes(fotoUri);
    } catch {
      setEnviando(false);
      setFotoFallo(true);
      mostrar({ texto: t('ventas.comunes.errorTitulo'), variante: 'error' });
      return;
    }
    const subida = await subirFotoEntrega(pantalla.entrega.envio_id, bytes);
    if (!subida.ok) {
      setEnviando(false);
      setFotoFallo(true);
      mostrar({ texto: subida.mensaje, variante: 'error' });
      return;
    }
    // 🔴 EL FLUSH FINAL DEL TRACK, ANTES del cierre (contrato de ventana
    // M23): con el envío entregado el motor rebota `track_fuera_de_ventana`
    // y esos puntos se pierden a propósito. El track es best-effort: su
    // fallo no frena la entrega.
    await controlesTrackRef.current?.flushFinal().catch(() => {});
    const r = await entregarConEvidencia(pantalla.entrega.pedido_id, codigo, subida.data.path);
    setEnviando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    await controlesTrackRef.current?.detener().catch(() => {});
    setEntregando(false);
    mostrar({ texto: t('ventas.entregas.exitoEntregada'), variante: 'exito' });
    router.back();
  }

  async function confirmarFallida() {
    if (enviando || pantalla.estado !== 'listo' || motivoFallida.trim().length === 0) return;
    setEnviando(true);
    // El flush final también acá — la fallida cierra la ventana igual.
    await controlesTrackRef.current?.flushFinal().catch(() => {});
    const r = await marcarEntregaFallida(pantalla.entrega.envio_id, motivoFallida);
    setEnviando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    await controlesTrackRef.current?.detener().catch(() => {});
    setFallando(false);
    mostrar({ texto: t('ventas.entregas.exitoFallida'), variante: 'exito' });
    router.back();
  }

  if (pantalla.estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo={t('ventas.entregas.titulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="80%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={140} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (pantalla.estado === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo={t('ventas.entregas.titulo')} atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.comunes.errorTitulo')}
            descripcion={t('ventas.comunes.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('ventas.comunes.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  recargar();
                }}
              />
            }
          />
        </View>
      </View>
    );
  }

  const { entrega } = pantalla;
  const activa = entrega.estado === 'en_reparto' || entrega.estado === 'hacia_destino';
  const telefono = entrega.telefono_receptor;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.entregas.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: insets.bottom + spacing[10],
          gap: spacing[4],
        }}
      >
        {/* la parada — la pieza de B, con su vara de guantes */}
        <Tarjeta>
          <FilaEntrega
            direccion={entrega.destino_direccion}
            referencia={entrega.destino_referencia ?? undefined}
            instrucciones={entrega.instrucciones_entrega ?? undefined}
            onLlamar={
              telefono !== null ? () => void Linking.openURL(`tel:${telefono}`) : undefined
            }
          />
        </Tarjeta>

        {/* el punto en el mapa — navega con la app de mapas del aparato */}
        {(entrega.destino_lat !== null && entrega.destino_lon !== null) && (
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('ventas.pedido.abrirMapa')}
            onPress={() =>
              void Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${entrega.destino_lat},${entrega.destino_lon}`,
              )
            }
          />
        )}

        {entrega.promesa_desde !== null && entrega.promesa_hasta !== null && (
          <FilaDato
            etiqueta={t('ventas.pedido.entregaTitulo')}
            valor={`${horaCorta(entrega.promesa_desde)}–${horaCorta(entrega.promesa_hasta)}`}
            mono
          />
        )}

        {entrega.estado === 'fallido' && (
          <Tarjeta tinte="warning">
            <View style={{ gap: spacing[1] }}>
              <Texto variante="seccion">{t('ventas.desvios.noLlego')}</Texto>
              <Texto variante="apoyo">{t('ventas.desvios.noLlegoDetalle')}</Texto>
            </View>
          </Tarjeta>
        )}

        {/* ── LAS TRES ACCIONES ── */}
        {activa && (
          <View style={{ gap: spacing[3] }}>
            {entrega.estado === 'en_reparto' ? (
              <View style={{ gap: spacing[1] }}>
                <Boton
                  variante="primario"
                  tamaño="lg"
                  bloque
                  cargando={enviando}
                  etiqueta={t('ventas.entregas.voyCta')}
                  onPress={() => void voyHaciaAca()}
                />
                <Texto variante="apoyo">{t('ventas.entregas.voyDetalle')}</Texto>
              </View>
            ) : (
              <Texto variante="apoyo">{t('ventas.entregas.enCamino')}</Texto>
            )}
            {/* §9.5 · el track del reparto — ARRANCA al marcar «voy hacia
                acá» (el hijo se monta con `hacia_destino`) y PARA al
                entregar o fallar (flush final + detener en los cierres).
                Callado cuando funciona (la notificación del servicio ya
                lo dice); habla solo cuando NO está registrando. */}
            {entrega.estado === 'hacia_destino' && (
              <CapturaTrackEnvio envioId={entrega.envio_id} alListo={alListoTrack} />
            )}
            <Boton
              variante={entrega.estado === 'hacia_destino' ? 'primario' : 'secundario'}
              tamaño="lg"
              bloque
              etiqueta={t('ventas.entregas.entregarCta')}
              onPress={() => {
                setFotoUri(null);
                setCodigo('');
                setFotoFallo(false);
                setEntregando(true);
              }}
            />
            <Boton
              variante="secundario"
              tamaño="lg"
              bloque
              etiqueta={t('ventas.entregas.fallidaCta')}
              onPress={() => {
                setSegundos(null);
                setEsperaCorrida(false);
                setMotivoFallida('');
                setFallando(true);
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* ── ENTREGADO: foto + código ── */}
      <Hoja
        visible={entregando}
        onCerrar={() => {
          if (!enviando) setEntregando(false);
        }}
        titulo={t('ventas.entregas.entregarTitulo')}
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">{t('ventas.entregas.fotoLabel')}</Texto>
                <Texto variante="apoyo">{t('ventas.entregas.fotoAyuda')}</Texto>
                {fotoUri === null ? (
                  <EvidenciaFotoCapturar onFoto={(uri) => setFotoUri(uri)} deshabilitado={enviando} />
                ) : (
                  <EvidenciaFotoThumbnail
                    uri={fotoUri}
                    estado={enviando ? 'subiendo' : fotoFallo ? 'error' : 'subida'}
                    onReintentar={() => setFotoUri(null)}
                  />
                )}
              </View>
              <Campo
                label={t('ventas.entregas.codigoLabel')}
                value={codigo}
                onChangeText={setCodigo}
                ayuda={t('ventas.entregas.codigoAyuda')}
                autoCapitalize="characters"
                deshabilitado={enviando}
              />
              <Boton
                variante="primario"
                bloque
                cargando={enviando}
                deshabilitado={fotoUri === null || codigo.trim().length === 0}
                etiqueta={t('ventas.entregas.confirmarEntregaCta')}
                onPress={() => void confirmarEntrega()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>

      {/* ── NO HABÍA NADIE: llamar → esperar con reloj → la instrucción decide ── */}
      <Hoja
        visible={fallando}
        onCerrar={() => {
          if (!enviando) setFallando(false);
        }}
        titulo={t('ventas.entregas.fallidaTitulo')}
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <View style={{ gap: spacing[2] }}>
                <Texto variante="cuerpo">{t('ventas.entregas.fallidaPaso1')}</Texto>
                {telefono !== null && (
                  <Boton
                    variante="secundario"
                    bloque
                    etiqueta={t('ventas.pedido.llamar')}
                    onPress={() => void Linking.openURL(`tel:${telefono}`)}
                  />
                )}
                <Texto variante="cuerpo">{t('ventas.entregas.fallidaPaso2')}</Texto>
                {segundos === null ? (
                  <Boton
                    variante="secundario"
                    bloque
                    etiqueta={t('ventas.entregas.esperarCta')}
                    onPress={() => setSegundos(ESPERA_SEGUNDOS)}
                  />
                ) : segundos > 0 ? (
                  <Texto variante="dato">{t('ventas.entregas.esperando', { segundos })}</Texto>
                ) : null}
                <Texto variante="cuerpo">{t('ventas.entregas.fallidaPaso3')}</Texto>
                {/* la instrucción que decide, repetida EN el punto de decisión
                    (no es Chanel: es el árbitro del caso, §9.3) */}
                {entrega.instrucciones_entrega !== null && (
                  <Tarjeta>
                    <Texto variante="cuerpo">{entrega.instrucciones_entrega}</Texto>
                  </Tarjeta>
                )}
              </View>
              <Campo
                label={t('ventas.entregas.motivoLabel')}
                value={motivoFallida}
                onChangeText={setMotivoFallida}
                ayuda={t('ventas.entregas.motivoAyudaFallida')}
                deshabilitado={enviando}
              />
              <Boton
                variante="primario"
                bloque
                cargando={enviando}
                deshabilitado={!esperaCorrida || motivoFallida.trim().length === 0}
                etiqueta={t('ventas.entregas.confirmarFallidaCta')}
                onPress={() => void confirmarFallida()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>
    </View>
  );
}

/**
 * S96-C · LA CAPTURA DEL RECORRIDO (§9.5) — monta el hook heredado del
 * paseo con destino 'envio' y la voz de notificación de la entrega. Vive
 * como hijo para que el hook exista SOLO en `hacia_destino` (los hooks no
 * se condicionan; los componentes sí). Presta sus controles al padre
 * (flush final + detener) y solo dibuja cuando hay un PROBLEMA: el estado
 * sano no necesita chip — la notificación del servicio ya lo dice.
 * Los estados finos del paseo (aproximado, sin señal) quedan callados en
 * v1 — declarado, no olvidado: el vocabulario completo del chip es de la
 * tanda de diseño.
 */
function CapturaTrackEnvio({
  envioId,
  alListo,
}: {
  envioId: string;
  alListo: (c: ControlesTrack | null) => void;
}) {
  const { t } = useTraduccion();
  const track = useTrackGps(envioId, 0, {
    destino: 'envio',
    notificacion: {
      titulo: t('ventas.entregas.fondoNotifTitulo'),
      cuerpo: t('ventas.entregas.fondoNotifCuerpo'),
    },
  });

  useEffect(() => {
    alListo({ flushFinal: track.flushFinal, detener: track.detenerTrack });
    return () => alListo(null);
  }, [alListo, track.flushFinal, track.detenerTrack]);

  const problema =
    track.estado === 'sin_permiso' ||
    track.estado === 'sin_permiso_ajustes' ||
    track.estado === 'no_disponible' ||
    track.estado === 'error';
  if (!problema) return null;

  return (
    <Tarjeta tinte="warning">
      <View style={{ gap: spacing[2] }}>
        <Texto variante="apoyo">
          {track.estado === 'sin_permiso_ajustes'
            ? t('ventas.entregas.gpsAjustes')
            : t('ventas.entregas.gpsSinPermiso')}
        </Texto>
        <Boton
          variante="ghost"
          tamaño="sm"
          etiqueta={t('ventas.entregas.gpsReintentar')}
          onPress={track.reintentarPermiso}
        />
      </View>
    </Tarjeta>
  );
}
