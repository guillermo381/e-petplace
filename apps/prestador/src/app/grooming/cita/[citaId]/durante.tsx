// ─────────────────────────────────────────────────────────────────────
// EL DURANTE del grooming — /grooming/cita/[citaId]/durante (S60-B1,
// §8: registrar SIN fricción — el groomer trabaja, no documenta; la
// captura jamás se exige en caliente). Dosis baja.
//
// TESIS: registras lo que haces con un toque, en el orden real del
// oficio — recibir, trabajar, entregar.
// FIRMA: el flujo son los TRES MOMENTOS de la silla (recibir / la
// sesión / entregar) — la pantalla ES la línea de tiempo del trabajo.
//
// 7.5: reconstrucción total desde la URL. Estados ajenos redirigen
// (sin atención → el Antes; terminada/cerrada → cierre).
// El motor exige foto_entregar para TERMINAR (guard D-270 de la era
// web) — la sección de entrega lo DICE antes de que el error hable.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Cronometro,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EvidenciaFoto,
  Hoja,
  SelectorOpcion,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
  type EvidenciaFotoEstado,
} from '@epetplace/ui';
import {
  agregarIncidenciaAtencion,
  agregarNotaAtencion,
  agregarServicioGrooming,
  obtenerEstadoDuranteGrooming,
  obtenerEstadosPelajeCatalogo,
  obtenerGroomingPorCita,
  obtenerIncidenciasGrooming,
  obtenerServiciosGroomingCatalogo,
  quitarEstadoPelajeGrooming,
  quitarServicioGrooming,
  registrarEstadoPelajeGrooming,
  terminarAtencionGrooming,
  type EstadoDuranteGrooming,
  type EstadoPelajeCatalogo,
  type IncidenciaGroomingCatalogo,
  type ServicioGroomingCatalogo,
  type TipoArchivoGrooming,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { subirEvidenciaGrooming } from '@/lib/subir-evidencia-grooming';
import { useTraduccion } from '@/i18n';

type Momento = 'recibir' | 'entregar';

type DatosListos = {
  groomingId: string;
  durante: EstadoDuranteGrooming;
  serviciosCatalogo: ServicioGroomingCatalogo[];
  estadosCatalogo: EstadoPelajeCatalogo[];
  incidenciasCatalogo: IncidenciaGroomingCatalogo[];
};

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | ({ estado: 'listo' } & DatosListos);

type FotoCola = {
  uri: string;
  tipo: TipoArchivoGrooming;
  estado: EvidenciaFotoEstado;
  storagePath?: string;
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <Text
        accessibilityRole="header"
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
  const { t } = useTraduccion();

  // servicios aplicados / estados de pelaje — estado local sembrado del server
  const [aplicados, setAplicados] = useState<string[]>(datos.durante.servicios_aplicados);
  const [estadosPelaje, setEstadosPelaje] = useState(datos.durante.estados_pelaje);
  const [servicioEnviando, setServicioEnviando] = useState<string | null>(null);

  // Hoja de estado de pelaje (por momento)
  const [hojaMomento, setHojaMomento] = useState<Momento | null>(null);
  const [estadoSel, setEstadoSel] = useState<string | null>(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  // fotos por tipo (la cola local; las previas del server son conteo)
  const [fotos, setFotos] = useState<FotoCola[]>([]);

  // Hoja nota/incidencia (voz genérica de atención, reuso cita.*)
  const [hojaNota, setHojaNota] = useState(false);
  const [esIncidencia, setEsIncidencia] = useState(false);
  const [texto, setTexto] = useState('');
  const [severidad, setSeveridad] = useState<'media' | 'alta'>('media');
  const [incidenciaCodigo, setIncidenciaCodigo] = useState<string | null>(null);
  const [enviandoNota, setEnviandoNota] = useState(false);

  // Terminar
  const [hojaTerminar, setHojaTerminar] = useState(false);
  const [terminando, setTerminando] = useState(false);
  const terminandoRef = useRef(false);

  const nombreEstado = (codigo: string | undefined): string | null => {
    if (!codigo) return null;
    return datos.estadosCatalogo.find((e) => e.codigo === codigo)?.nombre ?? codigo;
  };

  async function toggleServicio(s: ServicioGroomingCatalogo) {
    if (servicioEnviando) return;
    setServicioEnviando(s.codigo);
    const estaAplicado = aplicados.includes(s.codigo);
    const r = estaAplicado
      ? await quitarServicioGrooming({ grooming_id: datos.groomingId, servicio_codigo: s.codigo })
      : await agregarServicioGrooming({ grooming_id: datos.groomingId, servicio_codigo: s.codigo });
    setServicioEnviando(null);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setAplicados((v) => (estaAplicado ? v.filter((c) => c !== s.codigo) : [...v, s.codigo]));
  }

  async function guardarEstadoPelaje() {
    if (hojaMomento === null || estadoSel === null || guardandoEstado) return;
    setGuardandoEstado(true);
    // Cambiar = quitar el registrado + registrar el nuevo (el motor
    // rebota el duplicado por momento — UNO por momento es la regla).
    if (estadosPelaje[hojaMomento]) {
      const q = await quitarEstadoPelajeGrooming({ grooming_id: datos.groomingId, momento: hojaMomento });
      if (!q.ok) {
        setGuardandoEstado(false);
        mostrar({ variante: 'error', texto: q.mensaje });
        return;
      }
    }
    const r = await registrarEstadoPelajeGrooming({
      grooming_id: datos.groomingId,
      momento: hojaMomento,
      estado_codigo: estadoSel,
    });
    setGuardandoEstado(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setEstadosPelaje((v) => ({ ...v, [hojaMomento]: estadoSel }));
    setHojaMomento(null);
    setEstadoSel(null);
  }

  async function procesarFoto(item: FotoCola) {
    const r = await subirEvidenciaGrooming({
      uri: item.uri,
      prestadorId: datos.durante.prestador_id,
      groomingId: datos.groomingId,
      tipo: item.tipo,
      storagePath: item.storagePath,
    });
    setFotos((f) =>
      f.map((x) =>
        x.uri === item.uri ? { ...x, estado: r.ok ? 'subida' : 'error', storagePath: r.storagePath } : x,
      ),
    );
    if (!r.ok) {
      // S61-B10: la voz ya no traga la causa — título + detalle (Ley
      // 17.4; 'revisa tu conexión' RESERVADO a errores de red)
      const detalle =
        r.causa === 'red'
          ? t('cita.fotoNoSubioRed')
          : r.causa === 'lectura'
            ? t('cita.fotoNoSubioLectura')
            : r.mensaje;
      mostrar({ variante: 'error', texto: detalle ? `${t('cita.fotoNoSubio')} ${detalle}` : t('cita.fotoNoSubio') });
    }
  }

  function onFoto(uri: string, tipo: TipoArchivoGrooming) {
    const item: FotoCola = { uri, tipo, estado: 'subiendo' };
    setFotos((f) => [...f, item]);
    void procesarFoto(item);
  }

  function reintentarFoto(item: FotoCola) {
    setFotos((f) => f.map((x) => (x.uri === item.uri ? { ...x, estado: 'subiendo' } : x)));
    void procesarFoto({ ...item, estado: 'subiendo' });
  }

  async function enviarNota() {
    const cuerpo = texto.trim();
    if (cuerpo.length === 0 || enviandoNota) return;
    if (esIncidencia && incidenciaCodigo === null) {
      mostrar({ variante: 'error', texto: t('cita.elegirIncidencia') });
      return;
    }
    setEnviandoNota(true);
    const r = esIncidencia
      ? await agregarIncidenciaAtencion({
          evento_atencion_id: datos.durante.evento_atencion_id,
          incidencia_codigo: incidenciaCodigo as string,
          descripcion: cuerpo,
          severidad,
        })
      : await agregarNotaAtencion({ evento_atencion_id: datos.durante.evento_atencion_id, texto: cuerpo });
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
    mostrar({ variante: 'exito', texto: fueIncidencia ? t('cita.incidenciaRegistrada') : t('cita.notaRegistrada') });
  }

  async function terminar() {
    if (terminandoRef.current) return;
    terminandoRef.current = true;
    setTerminando(true);
    const r = await terminarAtencionGrooming(datos.groomingId);
    if (r.ok || r.codigo === 'atencion_no_en_curso') {
      // Ya terminada por otra vía = mismo destino (patrón S38-fix1).
      router.replace({ pathname: '/grooming/cita/[citaId]/cierre', params: { citaId } });
      return;
    }
    // falta_foto_entregar y compañía: el error DIRIGE (Ley 17.4) —
    // la Hoja se cierra para que la sección de entrega quede a la vista.
    mostrar({ variante: 'error', texto: r.mensaje });
    setHojaTerminar(false);
    setTerminando(false);
    terminandoRef.current = false;
  }

  const fotosDe = (tipo: TipoArchivoGrooming) => fotos.filter((f) => f.tipo === tipo);
  const previasDe = (tipo: TipoArchivoGrooming) => datos.durante.fotos_por_tipo[tipo] ?? 0;
  const hayFotoEntregar =
    previasDe('foto_entregar') > 0 || fotosDe('foto_entregar').some((f) => f.estado === 'subida');

  const opcionesMomento =
    hojaMomento === null
      ? []
      : datos.estadosCatalogo
          .filter((e) => e.momento === hojaMomento)
          .map((e) => ({ codigo: e.codigo, etiqueta: e.nombre }));

  function FotosDeTipo({ tipo }: { tipo: TipoArchivoGrooming }) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
        <EvidenciaFoto.Capturar onFoto={(uri) => onFoto(uri, tipo)} />
        {fotosDe(tipo).map((f) => (
          <EvidenciaFoto.Thumbnail
            key={f.uri}
            uri={f.uri}
            estado={f.estado}
            onReintentar={f.estado === 'error' ? () => reintentarFoto(f) : undefined}
          />
        ))}
      </View>
    );
  }

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[5] }}>
      {/* El tiempo de la sesión corre desde el server */}
      <View style={{ alignItems: 'center' }}>
        <Cronometro inicioTs={datos.durante.iniciada_en ?? new Date().toISOString()} />
      </View>

      {/* ── Momento 1: al recibir ── */}
      <Seccion titulo={t('citaGrooming.alRecibir')}>
        <Tarjeta relleno="ninguno">
          <Celda
            interactiva
            accessibilityRole="button"
            onPress={() => {
              setEstadoSel(estadosPelaje.recibir ?? null);
              setHojaMomento('recibir');
            }}
            titulo={nombreEstado(estadosPelaje.recibir) ?? t('citaGrooming.estadoPelajeElegir')}
            subtitulo={estadosPelaje.recibir ? t('citaGrooming.pelaje') : undefined}
          />
        </Tarjeta>
        <FotosDeTipo tipo="foto_recibir" />
      </Seccion>

      {/* ── Momento 2: la sesión — servicios aplicados + registro libre.
          S62 (§15b.2 clase-4, enmienda a9ab4dd de la A): el toggle real
          con roundtrip viste SelectorOpcion multiple con `cargando` POR
          CHIP — murió el último Boton-disfrazado del inventario. ── */}
      <SelectorOpcion
        acento="oficio"
        etiqueta={`${t('citaGrooming.serviciosAplicados')}${aplicados.length > 0 ? ` · ${aplicados.length}` : ''}`}
        multiple
        disposicion="grilla"
        opciones={datos.serviciosCatalogo.map((s) => ({
          codigo: s.codigo,
          etiqueta: s.nombre,
          cargando: servicioEnviando === s.codigo,
        }))}
        seleccionadas={aplicados}
        onSelect={(codigo) => {
          const s = datos.serviciosCatalogo.find((x) => x.codigo === codigo);
          if (s) void toggleServicio(s);
        }}
      />

      <Seccion titulo={t('citaGrooming.fotosSesion')}>
        <FotosDeTipo tipo="foto_durante" />
      </Seccion>

      <View style={{ alignSelf: 'flex-start' }}>
        <Boton variante="ghost" etiqueta={t('cita.agregarNotaIncidencia')} onPress={() => setHojaNota(true)} />
      </View>

      {/* ── Momento 3: al entregar — el motor pide la foto para terminar ── */}
      <Seccion titulo={t('citaGrooming.alEntregar')}>
        <Tarjeta relleno="ninguno">
          <Celda
            interactiva
            accessibilityRole="button"
            onPress={() => {
              setEstadoSel(estadosPelaje.entregar ?? null);
              setHojaMomento('entregar');
            }}
            titulo={nombreEstado(estadosPelaje.entregar) ?? t('citaGrooming.estadoPelajeElegir')}
            subtitulo={estadosPelaje.entregar ? t('citaGrooming.pelaje') : undefined}
          />
        </Tarjeta>
        {!hayFotoEntregar && <Text style={vozSecundaria}>{t('citaGrooming.fotoEntregarAyuda')}</Text>}
        <FotosDeTipo tipo="foto_entregar" />
      </Seccion>

      <Boton variante="primario" bloque etiqueta={t('citaGrooming.terminar')} onPress={() => setHojaTerminar(true)} />

      {/* Hoja: estado del pelaje por momento */}
      <Hoja
        visible={hojaMomento !== null}
        onCerrar={() => {
          if (!guardandoEstado) {
            setHojaMomento(null);
            setEstadoSel(null);
          }
        }}
        titulo={hojaMomento === 'entregar' ? t('citaGrooming.alEntregar') : t('citaGrooming.alRecibir')}
      >
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <SelectorOpcion
            acento="oficio"
            etiqueta={t('citaGrooming.estadoPelajeElegir')}
            opciones={opcionesMomento}
            seleccionada={estadoSel ?? undefined}
            onSelect={(codigo) => setEstadoSel(codigo)}
            disposicion="grilla"
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('citaGrooming.estadoPelajeElegir')}
            deshabilitado={estadoSel === null}
            cargando={guardandoEstado}
            onPress={() => void guardarEstadoPelaje()}
          />
        </View>
      </Hoja>

      {/* Hoja: nota / incidencia (voz genérica de atención, reuso cita.*) */}
      <Hoja visible={hojaNota} onCerrar={() => setHojaNota(false)} titulo={t('cita.notaOIncidencia')}>
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          {/* S62 (§15b.2 clase-4): la SELECCIÓN dejó de vestir de botón —
              SelectorOpcion con el acento del oficio (Ley 19/21/22) */}
          <SelectorOpcion
            acento="oficio"
            etiqueta={t('cita.queRegistras')}
            opciones={[
              { codigo: 'nota', etiqueta: t('cita.nota') },
              { codigo: 'incidencia', etiqueta: t('cita.incidencia') },
            ]}
            seleccionada={esIncidencia ? 'incidencia' : 'nota'}
            onSelect={(codigo) => setEsIncidencia(codigo === 'incidencia')}
          />

          {esIncidencia && (
            <>
              <SelectorOpcion
                acento="oficio"
                etiqueta={t('cita.incidenciaTipo')}
                disposicion="grilla"
                opciones={datos.incidenciasCatalogo.map((i) => ({ codigo: i.codigo, etiqueta: i.nombre }))}
                seleccionada={incidenciaCodigo ?? undefined}
                onSelect={setIncidenciaCodigo}
              />
              <SelectorOpcion
                acento="oficio"
                etiqueta={t('cita.severidad')}
                opciones={[
                  { codigo: 'media', etiqueta: t('cita.severidadMedia') },
                  { codigo: 'alta', etiqueta: t('cita.severidadAlta') },
                ]}
                seleccionada={severidad}
                onSelect={(codigo) => setSeveridad(codigo === 'alta' ? 'alta' : 'media')}
              />
            </>
          )}

          <Campo
            label={esIncidencia ? t('cita.quePaso') : t('cita.nota')}
            value={texto}
            onChangeText={setTexto}
            multilinea={3}
            placeholder={esIncidencia ? t('cita.incidenciaPlaceholder') : t('cita.notaPlaceholder')}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={esIncidencia ? t('cita.registrarIncidencia') : t('cita.guardarNota')}
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
          if (!terminando) setHojaTerminar(false);
        }}
        titulo={t('citaGrooming.terminarTitulo')}
      >
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              lineHeight: typography.size.base * 1.4,
              color: theme.text.primary,
            }}
          >
            {/* Guard de UI contra el callejón del motor: los servicios NO
                se pueden registrar después de terminar (solo el estado de
                pelaje tiene vía en el cierre) — sin ≥1 servicio, cerrar
                sería imposible. El error dirige ANTES de ocurrir. */}
            {aplicados.length === 0
              ? t('citaGrooming.terminarFaltaServicio')
              : t('citaGrooming.terminarExplicacion')}
          </Text>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('citaGrooming.terminar')}
            cargando={terminando}
            deshabilitado={aplicados.length === 0}
            onPress={() => void terminar()}
          />
          <Boton
            variante="ghost"
            bloque
            etiqueta={t('citaGrooming.seguirTrabajando')}
            onPress={() => setHojaTerminar(false)}
          />
        </View>
      </Hoja>
    </ScrollView>
  );
}

export default function DuranteGrooming() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });

  const cargar = useCallback(async () => {
    setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const g = await obtenerGroomingPorCita(citaId);
    if (!g.ok) {
      setPantalla({ estado: 'error', mensaje: g.mensaje });
      return;
    }
    if (g.data.grooming_id === null) {
      router.replace({ pathname: '/grooming/cita/[citaId]', params: { citaId } });
      return;
    }
    if (g.data.estado !== 'en_curso') {
      router.replace({ pathname: '/grooming/cita/[citaId]/cierre', params: { citaId } });
      return;
    }
    const groomingId = g.data.grooming_id;
    const [durante, servicios, estados, incidencias] = await Promise.all([
      obtenerEstadoDuranteGrooming(groomingId),
      obtenerServiciosGroomingCatalogo(),
      obtenerEstadosPelajeCatalogo(),
      obtenerIncidenciasGrooming(),
    ]);
    if (!durante.ok) {
      setPantalla({ estado: 'error', mensaje: durante.mensaje });
      return;
    }
    if (!servicios.ok || !estados.ok || !incidencias.ok) {
      // Sin catálogo no hay registro honesto — error explícito (regla 36).
      const mal = !servicios.ok ? servicios : !estados.ok ? estados : incidencias;
      setPantalla({ estado: 'error', mensaje: mal.ok ? '' : mal.mensaje });
      return;
    }
    setPantalla({
      estado: 'listo',
      groomingId,
      durante: durante.data,
      serviciosCatalogo: servicios.data,
      estadosCatalogo: estados.data,
      incidenciasCatalogo: incidencias.data,
    });
  }, [citaId, router]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ paddingHorizontal: spacing[4] }}>
        <Encabezado
          variante="navegacion"
          titulo={t('citaGrooming.enCursoTitulo')}
          atras
          onAtras={() => router.back()}
        />
      </View>

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[4] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <View style={{ alignItems: 'center' }}>
                <Esqueleto forma="linea" ancho="30%" />
              </View>
              <Esqueleto forma="bloque" alto={72} />
              <Esqueleto forma="bloque" alto={120} />
              <Esqueleto forma="bloque" alto={72} />
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
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        </View>
      )}

      {pantalla.estado === 'listo' && <DuranteCargado datos={pantalla} citaId={citaId} />}
    </View>
  );
}
