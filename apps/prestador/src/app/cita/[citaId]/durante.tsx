// ─────────────────────────────────────────────────────────────────────
// El Durante del paseo — /cita/[citaId]/durante (S44-B4.3). Dosis baja.
//
// Reconstrucción total desde la URL (7.5): al montar se consulta el
// estado real; el cronómetro corre desde iniciada_en del server, el
// track existente alimenta el contador y las novedades/fotos previas
// se ven. Estados ajenos redirigen (sin_iniciar → detalle, resto → cierre).
//
// GPS FOREGROUND (B5 = background, no acá): el track vive con la
// pantalla al frente — ver use-track-gps.ts.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Cronometro,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EvidenciaFoto,
  Hoja,
  Insignia,
  MapaRecorrido,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
  type EvidenciaFotoEstado,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  agregarIncidenciaAtencion,
  agregarNotaAtencion,
  agregarNovedadPaseo,
  obtenerIncidenciasPaseo,
  obtenerMiPrestador,
  obtenerNovedadesPaseo,
  obtenerPaseoPorCita,
  obtenerResumenCierrePaseo,
  terminarAtencionPaseo,
  type IncidenciaCatalogoPaseo,
  type NovedadCatalogoPaseo,
} from '@epetplace/api';

import { asegurarSesionDev } from '@/lib/api';
import { useTrackGps, type EstadoGps } from '@/lib/use-track-gps';
import { subirEvidencia } from '@/lib/subir-evidencia';

type DatosListos = {
  eventoAtencionId: string;
  iniciadaEn: string;
  prestadorId: string;
  puntosIniciales: number;
  novedadesCatalogo: NovedadCatalogoPaseo[];
  incidenciasCatalogo: IncidenciaCatalogoPaseo[];
  novedadesRegistradas: string[];
  fotosPrevias: number;
};

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | ({ estado: 'listo' } & DatosListos);

type FotoCola = { uri: string; estado: EvidenciaFotoEstado; storagePath?: string };

const CHIP_GPS: Record<EstadoGps, { estado: InsigniaEstado; etiqueta: string }> = {
  iniciando:     { estado: 'info',     etiqueta: 'GPS iniciando' },
  activo:        { estado: 'alDia',    etiqueta: 'GPS activo' },
  inactivo:      { estado: 'proximo',  etiqueta: 'GPS detenido' },
  sin_permiso:   { estado: 'atencion', etiqueta: 'Sin permiso de ubicación' },
  no_disponible: { estado: 'atencion', etiqueta: 'GPS no disponible' },
  error:         { estado: 'atencion', etiqueta: 'GPS con error' },
};

// Motivos de un toque para terminar sin track. El CHECK real de DB NO
// cataloga motivos (solo exige coherencia NULL↔fallido): texto libre,
// voz humana definida acá (decisión B4.3 reportada).
const MOTIVOS_GPS = [
  'El celular se quedó sin batería durante el paseo.',
  'No hubo señal de GPS en el recorrido.',
  'El GPS del teléfono estaba apagado.',
];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
        }}
      >
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function DuranteCargado({ datos, citaId }: { datos: DatosListos; citaId: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { mostrar } = useAviso();
  const gps = useTrackGps(datos.eventoAtencionId, datos.puntosIniciales);

  const [registradas, setRegistradas] = useState<string[]>(datos.novedadesRegistradas);
  const [novedadEnviando, setNovedadEnviando] = useState<string | null>(null);
  const [fotos, setFotos] = useState<FotoCola[]>([]);

  // Hoja nota/incidencia
  const [hojaNota, setHojaNota] = useState(false);
  const [esIncidencia, setEsIncidencia] = useState(false);
  const [texto, setTexto] = useState('');
  const [severidad, setSeveridad] = useState<'media' | 'alta'>('media');
  const [incidenciaCodigo, setIncidenciaCodigo] = useState<string | null>(null);
  const [enviandoNota, setEnviandoNota] = useState(false);

  // Terminar
  const [hojaTerminar, setHojaTerminar] = useState(false);
  const [pideMotivo, setPideMotivo] = useState(false);
  const [terminando, setTerminando] = useState(false);
  const terminandoRef = useRef(false);

  const chipGps = CHIP_GPS[gps.estado];

  async function tocarNovedad(n: NovedadCatalogoPaseo) {
    if (novedadEnviando) return;
    setNovedadEnviando(n.codigo);
    const r = await agregarNovedadPaseo({ evento_atencion_id: datos.eventoAtencionId, novedad_codigo: n.codigo });
    setNovedadEnviando(null);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setRegistradas((v) => [...v, n.nombre]);
    mostrar({ variante: 'exito', texto: 'Parte registrado' });
  }

  async function procesarFoto(uri: string, storagePath: string | undefined) {
    const r = await subirEvidencia({
      uri,
      prestadorId: datos.prestadorId,
      eventoAtencionId: datos.eventoAtencionId,
      storagePath,
    });
    setFotos((f) =>
      f.map((x) => (x.uri === uri ? { uri, estado: r.ok ? 'subida' : 'error', storagePath: r.storagePath } : x)),
    );
    if (!r.ok) mostrar({ variante: 'error', texto: 'La foto no se subió. Tocala para reintentar.' });
  }

  function onFoto(uri: string) {
    setFotos((f) => [...f, { uri, estado: 'subiendo' }]);
    void procesarFoto(uri, undefined);
  }

  function reintentarFoto(item: FotoCola) {
    setFotos((f) => f.map((x) => (x.uri === item.uri ? { ...x, estado: 'subiendo' } : x)));
    void procesarFoto(item.uri, item.storagePath);
  }

  async function enviarNota() {
    const t = texto.trim();
    if (t.length === 0 || enviandoNota) return;
    if (esIncidencia && incidenciaCodigo === null) {
      mostrar({ variante: 'error', texto: 'Elegí qué pasó del catálogo.' });
      return;
    }
    setEnviandoNota(true);
    const r = esIncidencia
      ? await agregarIncidenciaAtencion({
          evento_atencion_id: datos.eventoAtencionId,
          incidencia_codigo: incidenciaCodigo as string,
          descripcion: t,
          severidad,
        })
      : await agregarNotaAtencion({ evento_atencion_id: datos.eventoAtencionId, texto: t });
    setEnviandoNota(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    const fueIncidencia = esIncidencia;
    setHojaNota(false);
    setTexto('');
    setEsIncidencia(false);
    setIncidenciaCodigo(null);
    mostrar({ variante: 'exito', texto: fueIncidencia ? 'Incidencia registrada' : 'Nota registrada' });
  }

  async function terminar(motivo?: string) {
    if (terminandoRef.current) return;
    terminandoRef.current = true;
    setTerminando(true);

    const total = await gps.flushFinal();
    if (total === 0 && !motivo) {
      setPideMotivo(true);
      setTerminando(false);
      terminandoRef.current = false;
      return;
    }

    const r = await terminarAtencionPaseo({
      evento_atencion_id: datos.eventoAtencionId,
      gps_motivo_fallo: total === 0 ? motivo : undefined,
    });

    if (r.ok || r.codigo === 'atencion_no_en_curso' || r.codigo === 'atencion_estado_invalido') {
      // Ya terminada por otra vía = mismo destino (patrón S38-fix1).
      router.replace({ pathname: '/cita/[citaId]/cierre', params: { citaId } });
      return;
    }
    if (r.codigo === 'gps_motivo_innecesario') {
      // Aparecieron puntos entre el flush y el terminar: reintento limpio.
      terminandoRef.current = false;
      setTerminando(false);
      void terminar();
      return;
    }
    mostrar({ variante: 'error', texto: r.mensaje });
    setTerminando(false);
    terminandoRef.current = false;
  }

  const sinGps = gps.estado === 'sin_permiso' || gps.estado === 'no_disponible';

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[5] }}>
      {/* Estado GPS + puntos */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Insignia estado={chipGps.estado} etiqueta={chipGps.etiqueta} tamaño="sm" />
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.xs,
            letterSpacing: typography.tracking.mono,
            color: theme.text.secondary,
          }}
        >
          {`${gps.puntosTotal} ${gps.puntosTotal === 1 ? 'punto' : 'puntos'}`}
        </Text>
      </View>

      {sinGps && (
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
              Necesitamos tu ubicación para registrar el recorrido que ve la familia. El paseo puede
              seguir igual — sin ruta, al terminar te pedimos contar qué pasó.
            </Text>
            <View style={{ alignSelf: 'flex-start' }}>
              <Boton variante="secundario" tamaño="sm" etiqueta="Probar de nuevo" onPress={gps.reintentarPermiso} />
            </View>
          </View>
        </Tarjeta>
      )}

      {/* Cronómetro (tamaño display provisional — se ratifica en este gate) */}
      <View style={{ alignItems: 'center' }}>
        <Cronometro inicioTs={datos.iniciadaEn} />
      </View>

      <MapaRecorrido puntos={gps.puntosSesion} modo="vivo" capa="cuidado" alto={220} />

      {/* Parte del perro — chips de un toque, orden del catálogo (sin
          encabezados de grupo: 12 chips, el orden ya agrupa — dosis baja) */}
      <Seccion titulo={`Parte del perro${registradas.length > 0 ? ` · ${registradas.length}` : ''}`}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {datos.novedadesCatalogo.map((n) => (
            <Boton
              key={n.codigo}
              variante="secundario"
              tamaño="sm"
              etiqueta={n.nombre}
              cargando={novedadEnviando === n.codigo}
              onPress={() => void tocarNovedad(n)}
            />
          ))}
        </View>
        {registradas.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] }}>
            {registradas.map((nombre, i) => (
              <Insignia key={`${nombre}-${i}`} estado="alDia" etiqueta={nombre} tamaño="sm" />
            ))}
          </View>
        )}
      </Seccion>

      {/* Evidencia */}
      <Seccion
        titulo={`Evidencia${
          datos.fotosPrevias + fotos.filter((f) => f.estado === 'subida').length > 0
            ? ` · ${datos.fotosPrevias + fotos.filter((f) => f.estado === 'subida').length} fotos`
            : ''
        }`}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
          <EvidenciaFoto.Capturar onFoto={onFoto} />
          {fotos.map((f) => (
            <EvidenciaFoto.Thumbnail
              key={f.uri}
              uri={f.uri}
              estado={f.estado}
              onReintentar={f.estado === 'error' ? () => reintentarFoto(f) : undefined}
            />
          ))}
        </View>
      </Seccion>

      <View style={{ alignSelf: 'flex-start' }}>
        <Boton variante="ghost" etiqueta="Agregar nota o incidencia" onPress={() => setHojaNota(true)} />
      </View>

      <Boton variante="primario" bloque etiqueta="Terminar paseo" onPress={() => setHojaTerminar(true)} />

      {/* Hoja: nota / incidencia */}
      <Hoja visible={hojaNota} onCerrar={() => setHojaNota(false)} titulo="Nota o incidencia">
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <Boton
              variante={esIncidencia ? 'ghost' : 'secundario'}
              tamaño="sm"
              etiqueta="Nota"
              onPress={() => setEsIncidencia(false)}
            />
            <Boton
              variante={esIncidencia ? 'secundario' : 'ghost'}
              tamaño="sm"
              etiqueta="Incidencia"
              onPress={() => setEsIncidencia(true)}
            />
          </View>

          {esIncidencia && (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                {datos.incidenciasCatalogo.map((i) => (
                  <Boton
                    key={i.codigo}
                    variante={incidenciaCodigo === i.codigo ? 'secundario' : 'ghost'}
                    tamaño="sm"
                    etiqueta={i.nombre}
                    onPress={() => setIncidenciaCodigo(i.codigo)}
                  />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {(['media', 'alta'] as const).map((s) => (
                  <Boton
                    key={s}
                    variante={severidad === s ? 'secundario' : 'ghost'}
                    tamaño="sm"
                    etiqueta={s === 'media' ? 'Severidad media' : 'Severidad alta'}
                    onPress={() => setSeveridad(s)}
                  />
                ))}
              </View>
            </>
          )}

          <Campo
            label={esIncidencia ? 'Qué pasó' : 'Nota'}
            value={texto}
            onChangeText={setTexto}
            multilinea={3}
            placeholder={esIncidencia ? 'Contá qué pasó con calma.' : 'Algo que quieras dejar anotado.'}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={esIncidencia ? 'Registrar incidencia' : 'Guardar nota'}
            cargando={enviandoNota}
            deshabilitado={texto.trim().length === 0}
            onPress={() => void enviarNota()}
          />
        </View>
      </Hoja>

      {/* Hoja: terminar */}
      <Hoja
        visible={hojaTerminar}
        onCerrar={() => {
          if (!terminando) {
            setHojaTerminar(false);
            setPideMotivo(false);
          }
        }}
        titulo="Terminar el paseo"
      >
        <View style={{ padding: spacing[4], gap: spacing[3] }}>
          {!pideMotivo ? (
            <>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.text.secondary,
                }}
              >
                El recorrido y el tiempo quedan registrados. Después vas a poder completar el parte y
                mandarle un mensaje a la familia.
              </Text>
              <Boton
                variante="primario"
                bloque
                etiqueta="Terminar paseo"
                cargando={terminando}
                onPress={() => void terminar()}
              />
              <Boton variante="ghost" bloque etiqueta="Seguir paseando" onPress={() => setHojaTerminar(false)} />
            </>
          ) : (
            <>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.text.secondary,
                }}
              >
                No registramos ruta GPS en este paseo. Contale a la familia qué pasó:
              </Text>
              {MOTIVOS_GPS.map((m) => (
                <Boton
                  key={m}
                  variante="secundario"
                  bloque
                  etiqueta={m}
                  cargando={terminando}
                  onPress={() => void terminar(m)}
                />
              ))}
            </>
          )}
        </View>
      </Hoja>
    </ScrollView>
  );
}

export default function Durante() {
  const { theme } = useTheme();
  const router = useRouter();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setPantalla({ estado: 'cargando' });
    const sesion = await asegurarSesionDev();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const paseo = await obtenerPaseoPorCita(citaId);
    if (!paseo.ok) {
      setPantalla({ estado: 'error', mensaje: paseo.mensaje });
      return;
    }
    // 7.5 — estados ajenos redirigen:
    if (paseo.data.estado === null) {
      router.replace({ pathname: '/cita/[citaId]', params: { citaId } });
      return;
    }
    if (paseo.data.estado !== 'en_curso') {
      router.replace({ pathname: '/cita/[citaId]/cierre', params: { citaId } });
      return;
    }

    const [prestador, resumen, novedades, incidencias] = await Promise.all([
      obtenerMiPrestador(),
      obtenerResumenCierrePaseo(paseo.data.evento_atencion_id),
      obtenerNovedadesPaseo(),
      obtenerIncidenciasPaseo(),
    ]);
    if (!prestador.ok) return setPantalla({ estado: 'error', mensaje: prestador.mensaje });
    if (!resumen.ok) return setPantalla({ estado: 'error', mensaje: resumen.mensaje });
    if (!novedades.ok) return setPantalla({ estado: 'error', mensaje: novedades.mensaje });
    if (!incidencias.ok) return setPantalla({ estado: 'error', mensaje: incidencias.mensaje });

    setPantalla({
      estado: 'listo',
      eventoAtencionId: paseo.data.evento_atencion_id,
      iniciadaEn: paseo.data.iniciada_en,
      prestadorId: prestador.data.id,
      puntosIniciales: resumen.data.gps.puntos,
      novedadesCatalogo: novedades.data,
      incidenciasCatalogo: incidencias.data,
      novedadesRegistradas: resumen.data.novedades.map((n) => n.nombre),
      fotosPrevias: resumen.data.conteos.fotos,
    });
  }, [citaId, router]);

  // Focus-back re-consulta (7.5 también al volver, no solo al montar).
  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
        <Encabezado variante="navegacion" titulo="Paseo en curso" atras onAtras={() => router.back()} />
      </View>

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="linea" ancho="35%" />
              <View style={{ alignItems: 'center' }}>
                <Esqueleto forma="linea" ancho="55%" alto={56} />
              </View>
              <Esqueleto forma="bloque" alto={220} />
              <Esqueleto forma="linea" ancho="45%" />
              <Esqueleto forma="bloque" alto={48} />
            </View>
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ padding: spacing[4] }}>
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.status.dangerText,
                }}
              >
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta="Reintentar" onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        </View>
      )}

      {pantalla.estado === 'listo' && <DuranteCargado datos={pantalla} citaId={citaId} />}
    </SafeAreaView>
  );
}
