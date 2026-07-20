// ─────────────────────────────────────────────────────────────────────
// El DURANTE del adiestramiento — /adiestramiento/cita/[citaId]/durante
// (S63-B, MODELO_ADIESTRAMIENTO §5). Dosis baja.
//
// TESIS: registrar el progreso cuesta un toque — el adiestrador
// trabaja, no documenta.
// FIRMA: el objetivo que SUBE de trabajado a ALCANZADO con su toggle
// visible (la progresión §6 hecha gesto — comportamiento, no color).
//
// LA DECISIÓN DEL GESTO trabajado→alcanzado (pedido founder, criterio
// documentado): TOQUE = trabajado (chip server-toggle, patrón grooming
// S62 con cargando POR CHIP) · el registrado aparece en la lista de
// abajo con su INTERRUPTOR "Alcanzado" (segundo gesto = toggle
// VISIBLE). Descartados: toque largo (sin affordance, pelea con el
// scroll) y doble toque (promociones accidentales + pelea con el
// anti-doble-disparo de la casa). El upsert del motor conserva la nota
// al promover. Destocar el chip = quitar (reversible, sin fricción).
//
// El currículum del nivel se presenta PRIMERO como sugerencia —
// sugerencia, jamás límite: el vocabulario entero queda abajo.
//
// PISO DE CALIDAD VISIBLE ANTES DE TERMINAR (hallazgo declarado): el
// motor solo permite registrar con la atención EN CURSO y solo cierra
// TERMINADA — terminar sin piso dejaría la sesión atrapada (sin vía de
// reparación, a diferencia del grooming). La Hoja de terminar BLOQUEA
// hasta que el piso esté: ≥1 objetivo trabajado + ≥1 nota o clip.
// Los clips de la cola LOCAL no cuentan para el piso (el motor cuenta
// los registrados; la cola conecta cuando la config del bucket llegue)
// — la voz lo dice.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  CeldaNavegacion,
  Cronometro,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  Hoja,
  Interruptor,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerAdiestramientoPorCita,
  obtenerCitaAdiestramientoPorId,
  obtenerCurriculumNivel,
  obtenerEstadoDuranteAdiestramiento,
  obtenerObjetivosAdiestramiento,
  quitarObjetivoAdiestramiento,
  registrarNotaAdiestramiento,
  registrarObjetivoAdiestramiento,
  terminarAtencionAdiestramiento,
  type ObjetivoAdiestramientoCatalogo,
  type ObjetivoRegistrado,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { clipsDeSesion } from '@/lib/clips-sesion';
import { useTraduccion } from '@/i18n';

type DatosListos = {
  adiestramientoId: string;
  iniciadaEn: string;
  sesionKN: { k: number; n: number } | null;
  vocabulario: ObjetivoAdiestramientoCatalogo[];
  /** Códigos del currículum del nivel (sugerencia, jamás límite). */
  sugeridos: string[];
};

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | ({ estado: 'listo' } & DatosListos);

function DuranteCargado({ datos, citaId }: { datos: DatosListos; citaId: string }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  const [objetivos, setObjetivos] = useState<ObjetivoRegistrado[]>([]);
  const [notasTotal, setNotasTotal] = useState(0);
  const [clipsServidor, setClipsServidor] = useState(0);
  const [cargandoCodigo, setCargandoCodigo] = useState<string | null>(null);
  const [promoviendo, setPromoviendo] = useState<string | null>(null);

  // Hoja nota conductual
  const [hojaNota, setHojaNota] = useState(false);
  const [texto, setTexto] = useState('');
  const [enviandoNota, setEnviandoNota] = useState(false);

  // Hoja terminar
  const [hojaTerminar, setHojaTerminar] = useState(false);
  const [terminando, setTerminando] = useState(false);
  const terminandoRef = useRef(false);

  const refrescarEstado = useCallback(async () => {
    const r = await obtenerEstadoDuranteAdiestramiento(datos.adiestramientoId);
    if (r.ok) {
      setObjetivos(r.data.objetivos);
      setNotasTotal(r.data.notas_total);
      setClipsServidor(r.data.clips_total);
    }
  }, [datos.adiestramientoId]);

  useFocusEffect(
    useCallback(() => {
      void refrescarEstado();
    }, [refrescarEstado]),
  );

  const registrados = new Map(objetivos.map((o) => [o.objetivo_codigo, o.alcanzado]));
  const vozDe = new Map(datos.vocabulario.map((o) => [o.codigo, o.nombre]));

  async function tocarObjetivo(codigo: string) {
    if (cargandoCodigo !== null) return;
    setCargandoCodigo(codigo);
    const r = registrados.has(codigo)
      ? await quitarObjetivoAdiestramiento({ adiestramiento_id: datos.adiestramientoId, objetivo_codigo: codigo })
      : await registrarObjetivoAdiestramiento({
          adiestramiento_id: datos.adiestramientoId,
          objetivo_codigo: codigo,
          alcanzado: false,
        });
    setCargandoCodigo(null);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    // El estado del chip ES el feedback (sin fricción: cero toast).
    setObjetivos((prev) =>
      registrados.has(codigo)
        ? prev.filter((o) => o.objetivo_codigo !== codigo)
        : [...prev, { objetivo_codigo: codigo, alcanzado: false }],
    );
  }

  async function alternarAlcanzado(codigo: string, alcanzado: boolean) {
    if (promoviendo !== null) return;
    setPromoviendo(codigo);
    const r = await registrarObjetivoAdiestramiento({
      adiestramiento_id: datos.adiestramientoId,
      objetivo_codigo: codigo,
      alcanzado,
    });
    setPromoviendo(null);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setObjetivos((prev) => prev.map((o) => (o.objetivo_codigo === codigo ? { ...o, alcanzado } : o)));
  }

  async function enviarNota() {
    const cuerpo = texto.trim();
    if (cuerpo.length === 0 || enviandoNota) return;
    setEnviandoNota(true);
    const r = await registrarNotaAdiestramiento({ adiestramiento_id: datos.adiestramientoId, texto: cuerpo });
    setEnviandoNota(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setHojaNota(false);
    setTexto('');
    setNotasTotal((n) => n + 1);
    mostrar({ variante: 'exito', texto: t('citaAdiestramiento.notaGuardada') });
  }

  // EL PISO, computado en vivo (≥1 objetivo trabajado + ≥1 nota o clip
  // DEL SERVIDOR — los de la cola local aún no cuentan, declarado).
  const pisoObjetivo = objetivos.length > 0;
  const pisoNotaClip = notasTotal > 0 || clipsServidor > 0;
  const pisoCompleto = pisoObjetivo && pisoNotaClip;

  async function terminar() {
    if (terminandoRef.current || !pisoCompleto) return;
    terminandoRef.current = true;
    setTerminando(true);
    const r = await terminarAtencionAdiestramiento(datos.adiestramientoId);
    if (r.ok || r.codigo === 'atencion_no_en_curso') {
      router.replace({ pathname: '/adiestramiento/cita/[citaId]/cierre', params: { citaId } });
      return;
    }
    mostrar({ variante: 'error', texto: r.mensaje });
    setTerminando(false);
    terminandoRef.current = false;
  }

  const clipsLocales = clipsDeSesion(datos.adiestramientoId).length;

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;
  const tituloSeccion = {
    fontFamily: typography.family.sans.medium,
    fontSize: typography.size.sm,
    color: theme.text.secondary,
  } as const;

  const sugeridosSet = new Set(datos.sugeridos);
  const opcionesDe = (lista: ObjetivoAdiestramientoCatalogo[]) =>
    lista.map((o) => ({
      codigo: o.codigo,
      etiqueta: o.nombre,
      cargando: cargandoCodigo === o.codigo,
    }));
  const sugeridos = datos.vocabulario.filter((o) => sugeridosSet.has(o.codigo));
  const resto = datos.vocabulario.filter((o) => !sugeridosSet.has(o.codigo));

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[5] }}>
      {/* Contexto del programa — jamás score (§6) */}
      {datos.sesionKN !== null && (
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.sm,
            letterSpacing: typography.tracking.mono,
            color: theme.text.secondary,
            textAlign: 'center',
          }}
        >
          {t('citaAdiestramiento.sesionKN', { k: datos.sesionKN.k, n: datos.sesionKN.n })}
        </Text>
      )}
      <View style={{ alignItems: 'center' }}>
        <Cronometro inicioTs={datos.iniciadaEn} />
      </View>

      {/* LA FIRMA — el vocabulario a un toque (registrar sin fricción) */}
      <View style={{ gap: spacing[3] }}>
        <Text style={tituloSeccion}>
          {`${t('citaAdiestramiento.objetivosTitulo')}${objetivos.length > 0 ? ` · ${objetivos.length}` : ''}`}
        </Text>
        {sugeridos.length > 0 && (
          <SelectorOpcion
            acento="oficio"
            multiple
            disposicion="grilla"
            etiqueta={t('citaAdiestramiento.objetivosSugeridos')}
            opciones={opcionesDe(sugeridos)}
            seleccionadas={[...registrados.keys()].filter((c) => sugeridosSet.has(c))}
            onSelect={(codigo) => void tocarObjetivo(codigo)}
          />
        )}
        {resto.length > 0 && (
          <SelectorOpcion
            acento="oficio"
            multiple
            disposicion="grilla"
            etiqueta={
              sugeridos.length > 0
                ? t('citaAdiestramiento.objetivosTodos')
                : t('citaAdiestramiento.objetivosTitulo')
            }
            opciones={opcionesDe(resto)}
            seleccionadas={[...registrados.keys()].filter((c) => !sugeridosSet.has(c))}
            onSelect={(codigo) => void tocarObjetivo(codigo)}
          />
        )}
      </View>

      {/* Los registrados con su toggle VISIBLE de alcanzado (§6) */}
      {objetivos.length > 0 && (
        <Tarjeta>
          {objetivos.map((o, i) => (
            <View key={o.objetivo_codigo}>
              {i > 0 && <Separador />}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  gap: spacing[3],
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {vozDe.get(o.objetivo_codigo) ?? o.objetivo_codigo}
                  </Text>
                  <Text style={vozSecundaria}>
                    {o.alcanzado ? t('citaAdiestramiento.alcanzado') : t('citaAdiestramiento.trabajado')}
                  </Text>
                </View>
                <Interruptor
                  encendido={o.alcanzado}
                  onCambio={(v) => void alternarAlcanzado(o.objetivo_codigo, v)}
                  etiqueta={`${t('citaAdiestramiento.alcanzado')} · ${vozDe.get(o.objetivo_codigo) ?? ''}`}
                  registro="oficio"
                />
              </View>
            </View>
          ))}
        </Tarjeta>
      )}

      {/* Nota conductual + clips — el "≥1 nota o clip" del piso */}
      <View style={{ gap: spacing[3] }}>
        <Text style={tituloSeccion}>
          {`${t('citaAdiestramiento.registroTitulo')}${notasTotal > 0 ? ` · ${t('citaAdiestramiento.notasN', { n: notasTotal })}` : ''}`}
        </Text>
        <Tarjeta relleno="ninguno">
          <CeldaNavegacion
            registro="aa"
            icono="training"
            titulo={t('citaAdiestramiento.clipsCelda')}
            detalle={
              clipsLocales > 0
                ? t('citaAdiestramiento.clipsDetalleN', { n: clipsLocales })
                : t('citaAdiestramiento.clipsDetalle')
            }
            onPress={() =>
              router.push({ pathname: '/adiestramiento/clips', params: { sesionId: datos.adiestramientoId } })
            }
          />
        </Tarjeta>
        <View style={{ alignSelf: 'flex-start' }}>
          <Boton variante="ghost" etiqueta={t('citaAdiestramiento.agregarNota')} onPress={() => setHojaNota(true)} />
        </View>
      </View>

      <Boton
        variante="primario"
        bloque
        etiqueta={t('citaAdiestramiento.terminar')}
        onPress={() => setHojaTerminar(true)}
      />

      {/* Hoja: nota conductual */}
      <Hoja visible={hojaNota} onCerrar={() => setHojaNota(false)} titulo={t('citaAdiestramiento.notaTitulo')}>
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <Campo
            label={t('citaAdiestramiento.notaTitulo')}
            value={texto}
            onChangeText={setTexto}
            multilinea={3}
            placeholder={t('citaAdiestramiento.notaPlaceholder')}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('citaAdiestramiento.guardarNota')}
            cargando={enviandoNota}
            deshabilitado={texto.trim().length === 0}
            onPress={() => void enviarNota()}
          />
        </View>
      </Hoja>

      {/* Hoja: terminar — EL PISO SE VE ANTES DE INTENTAR (y bloquea:
          post-terminar no hay vía de reparación, hallazgo declarado) */}
      <Hoja
        visible={hojaTerminar}
        onCerrar={() => {
          if (!terminando) setHojaTerminar(false);
        }}
        titulo={t('citaAdiestramiento.terminarTitulo')}
      >
        <View style={{ padding: spacing[4], gap: spacing[3] }}>
          {pisoCompleto ? (
            <>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.text.secondary,
                }}
              >
                {t('citaAdiestramiento.terminarExplicacion')}
              </Text>
              <Boton
                variante="primario"
                bloque
                etiqueta={t('citaAdiestramiento.terminar')}
                cargando={terminando}
                onPress={() => void terminar()}
              />
              <Boton
                variante="ghost"
                bloque
                etiqueta={t('citaAdiestramiento.seguir')}
                onPress={() => setHojaTerminar(false)}
              />
            </>
          ) : (
            <>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.text.primary,
                }}
              >
                {t('citaAdiestramiento.pisoTitulo')}
              </Text>
              {!pisoObjetivo && <Text style={vozSecundaria}>{`· ${t('citaAdiestramiento.pisoFaltaObjetivo')}`}</Text>}
              {!pisoNotaClip && <Text style={vozSecundaria}>{`· ${t('citaAdiestramiento.pisoFaltaNotaClip')}`}</Text>}
              {!pisoNotaClip && clipsLocales > 0 && (
                <Text style={vozSecundaria}>{t('citaAdiestramiento.pisoClipsLocales')}</Text>
              )}
              <Boton
                variante="primario"
                bloque
                etiqueta={t('citaAdiestramiento.seguirRegistrando')}
                onPress={() => setHojaTerminar(false)}
              />
            </>
          )}
        </View>
      </Hoja>
    </ScrollView>
  );
}

export default function DuranteAdiestramiento() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setPantalla({ estado: 'cargando' });
      const sesion = await verificarSesion();
      if (!sesion.ok) return setPantalla({ estado: 'error', mensaje: sesion.mensaje });

      const atencion = await obtenerAdiestramientoPorCita(citaId);
      if (!atencion.ok) return setPantalla({ estado: 'error', mensaje: atencion.mensaje });
      // 7.5 — estados ajenos redirigen:
      if (atencion.data.estado === null) {
        router.replace({ pathname: '/adiestramiento/cita/[citaId]', params: { citaId } });
        return;
      }
      if (atencion.data.estado !== 'en_curso') {
        router.replace({ pathname: '/adiestramiento/cita/[citaId]/cierre', params: { citaId } });
        return;
      }

      const [cita, vocabulario] = await Promise.all([
        obtenerCitaAdiestramientoPorId(citaId),
        obtenerObjetivosAdiestramiento(),
      ]);
      if (!cita.ok) return setPantalla({ estado: 'error', mensaje: cita.mensaje });
      if (!vocabulario.ok) return setPantalla({ estado: 'error', mensaje: vocabulario.mensaje });

      // El currículum del NIVEL del programa — sugerencia; su fallo
      // calla (el vocabulario entero siempre está, L-139).
      let sugeridos: string[] = [];
      if (cita.data.programa !== null) {
        const rCurr = await obtenerCurriculumNivel(cita.data.programa.nivel);
        if (rCurr.ok) sugeridos = rCurr.data.map((c) => c.objetivo_codigo);
      }

      setPantalla({
        estado: 'listo',
        adiestramientoId: atencion.data.adiestramiento_id,
        iniciadaEn: atencion.data.iniciada_en ?? new Date().toISOString(),
        sesionKN:
          cita.data.programa !== null && cita.data.sesion_numero !== null
            ? { k: cita.data.sesion_numero, n: cita.data.programa.n_sesiones }
            : null,
        vocabulario: vocabulario.data,
        sugeridos,
      });
    },
    [citaId, router],
  );

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
        <Encabezado
          variante="navegacion"
          titulo={t('citaAdiestramiento.enCursoTitulo')}
          atras
          onAtras={() => router.back()}
        />
      </View>

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <View style={{ alignItems: 'center' }}>
                <Esqueleto forma="linea" ancho="55%" alto={56} />
              </View>
              <Esqueleto forma="bloque" alto={160} />
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
