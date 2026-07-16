// ─────────────────────────────────────────────────────────────────────
// EL TALLER DEL ADIESTRADOR — /adiestramiento/taller (S63-B). Dosis
// baja (§15b: acento de oficio, CTA en tinta).
//
// TESIS: tu oferta de adiestramiento se publica solo COMPLETA — y
// completa incluye con quién trabajas.
// FIRMA: el paso de especies BLOQUEANTE con su porqué visible — la
// oferta fantasma (especies '[]', hallazgo del gate Bloque 2) es
// IMPOSIBLE desde esta pantalla. Comportamiento, no color.
//
// DECISIÓN DOCUMENTADA (pedido founder — sugerido vs limpio): el acote
// de especies se pide LIMPIO POR OFICIO, sin heredar del grooming:
//   (a) el techo de adiestramiento es ["perro"] (§2) — heredar el
//       acote de un groomer (perro+gato) daría un valor fuera del techo;
//   (b) el acote es una declaración de COMPETENCIA por oficio — heredar
//       en silencio reintroduce el default que este pedido mata;
//   (c) con una sola especie elegible hoy, declarar cuesta UN toque.
//
// Programas: UI sobre el motor de la A (20260715180000, RLS pp_own) —
// CHECKs espejados en el form (2-30 sesiones, vigencia >= (N-1) semanas,
// duración en pasos de 15'); el rango por nivel es AYUDA (§12.4), no
// límite. Modalidades: diferido a S64-B0 (default único del chasis).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  Hoja,
  HojaScroll,
  Insignia,
  Interruptor,
  SelectorOpcion,
  Separador,
  SliderPrecio,
  StepperCantidad,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  RANGO_SUGERIDO_POR_NIVEL,
  guardarOfertaAdiestramiento,
  guardarProgramaAdiestramiento,
  obtenerMiPrestador,
  obtenerOfertaAdiestramientoPropia,
  type MundoAdiestramientoPropio,
  type NivelPrograma,
  type ProgramaAdiestramientoPropio,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

// pasos discretos del slider (patrón taller grooming S59-B6; la
// calibración fina de los rieles es materia del gate founder)
function pasosDe(min: number, max: number, paso: number): number[] {
  const r: number[] = [];
  for (let v = min; v <= max + 1e-9; v += paso) r.push(Number(v.toFixed(2)));
  return r;
}
function indiceEn(pasos: number[], valor: number): number {
  let mejor = 0;
  for (let i = 1; i < pasos.length; i++) {
    if (Math.abs(pasos[i] - valor) < Math.abs(pasos[mejor] - valor)) mejor = i;
  }
  return mejor;
}

const PASOS_SESION = pasosDe(10, 100, 2.5);
const PASOS_PROGRAMA = pasosDe(40, 600, 10);
const DURACIONES_SESION = [30, 45, 60, 75, 90] as const;
// §12.5: default 60'.
const DURACION_DEFAULT = 60;

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | ({ estado: 'listo'; prestadorId: string } & MundoAdiestramientoPropio);

interface DraftPrograma {
  programaId: string | null;
  nivel: NivelPrograma | null;
  nombre: string;
  nSesiones: number;
  precioIndice: number;
  vigenciaSemanas: number;
  duracionMinutos: number;
  activo: boolean;
}

function draftNuevo(): DraftPrograma {
  return {
    programaId: null,
    nivel: null,
    nombre: '',
    nSesiones: 8,
    precioIndice: indiceEn(PASOS_PROGRAMA, 200),
    vigenciaSemanas: 10,
    duracionMinutos: DURACION_DEFAULT,
    activo: true,
  };
}

function draftDe(p: ProgramaAdiestramientoPropio): DraftPrograma {
  return {
    programaId: p.id,
    nivel: p.nivel,
    nombre: p.nombre,
    nSesiones: p.nSesiones,
    precioIndice: indiceEn(PASOS_PROGRAMA, p.precioPrograma),
    vigenciaSemanas: Math.max(1, Math.round(p.vigenciaDias / 7)),
    duracionMinutos: p.duracionMinutosSesion,
    activo: p.activo,
  };
}

export default function TallerAdiestramiento() {
  const { theme } = useTheme();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  // draft de la oferta (la pantalla es dueña del valor)
  const [activo, setActivo] = useState(true);
  const [precioIndice, setPrecioIndice] = useState(indiceEn(PASOS_SESION, 25));
  const [duracion, setDuracion] = useState<number>(DURACION_DEFAULT);
  // EL PASO BLOQUEANTE: arranca SIN selección en la oferta nueva —
  // jamás default silencioso.
  const [especies, setEspecies] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  // Hoja del programa
  const [hojaPrograma, setHojaPrograma] = useState(false);
  const [draft, setDraft] = useState<DraftPrograma>(draftNuevo());
  const [guardandoPrograma, setGuardandoPrograma] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) return setPantalla({ estado: 'error', mensaje: sesion.mensaje });
    const prestador = await obtenerMiPrestador();
    if (!prestador.ok) return setPantalla({ estado: 'error', mensaje: prestador.mensaje });
    const r = await obtenerOfertaAdiestramientoPropia(prestador.data.id);
    if (!r.ok) return setPantalla({ estado: 'error', mensaje: r.mensaje });
    setPantalla({ estado: 'listo', prestadorId: prestador.data.id, ...r.data });
    if (r.data.oferta !== null) {
      setActivo(r.data.oferta.activo);
      if (r.data.oferta.precio !== null) setPrecioIndice(indiceEn(PASOS_SESION, r.data.oferta.precio));
      if (r.data.oferta.duracionMinutos !== null) setDuracion(r.data.oferta.duracionMinutos);
      setEspecies(r.data.oferta.especies);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  const listo = pantalla.estado === 'listo' ? pantalla : null;
  const especiesDeclaradas = especies.length > 0;

  async function guardarOferta() {
    if (listo === null || guardando || !especiesDeclaradas) return;
    setGuardando(true);
    const r = await guardarOfertaAdiestramiento({
      prestadorId: listo.prestadorId,
      ofertaId: listo.oferta?.id ?? null,
      activo,
      precio: PASOS_SESION[precioIndice],
      duracionMinutos: duracion,
      especies,
    });
    setGuardando(false);
    if (!r.ok) return mostrar({ variante: 'error', texto: r.mensaje });
    mostrar({ variante: 'exito', texto: t('tallerAdiestramiento.guardado') });
    void cargar(true);
  }

  async function guardarPrograma() {
    if (listo?.oferta == null || guardandoPrograma || draft.nivel === null || draft.nombre.trim() === '') return;
    setGuardandoPrograma(true);
    const r = await guardarProgramaAdiestramiento({
      ofertaId: listo.oferta.id,
      programaId: draft.programaId,
      nivel: draft.nivel,
      nombre: draft.nombre,
      nSesiones: draft.nSesiones,
      precioPrograma: PASOS_PROGRAMA[draft.precioIndice],
      vigenciaDias: draft.vigenciaSemanas * 7,
      duracionMinutosSesion: draft.duracionMinutos,
      activo: draft.activo,
    });
    setGuardandoPrograma(false);
    if (!r.ok) return mostrar({ variante: 'error', texto: r.mensaje });
    setHojaPrograma(false);
    mostrar({ variante: 'exito', texto: t('tallerAdiestramiento.programaGuardado') });
    void cargar(true);
  }

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;

  const VOZ_NIVEL: Record<NivelPrograma, string> = {
    basico: t('tallerAdiestramiento.nivelBasico'),
    medio: t('tallerAdiestramiento.nivelMedio'),
    experto: t('tallerAdiestramiento.nivelExperto'),
    especialidad: t('tallerAdiestramiento.nivelEspecialidad'),
  };

  // CHECK de DB espejado: vigencia >= (N-1) semanas — el stepper no
  // deja elegir una config que el motor va a rebotar.
  const minSemanas = Math.max(1, draft.nSesiones - 1);
  const rango = draft.nivel !== null ? RANGO_SUGERIDO_POR_NIVEL[draft.nivel] : undefined;

  function Titulo({ texto }: { texto: string }) {
    return (
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.md,
          color: theme.text.primary,
        }}
      >
        {texto}
      </Text>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
        <Encabezado
          variante="navegacion"
          titulo={t('tallerAdiestramiento.titulo')}
          atras
          onAtras={() => router.back()}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[5] }}>
        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" alto={120} />
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="bloque" alto={48} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
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
        )}

        {listo !== null && (
          <>
            {/* ── CON QUIÉN TRABAJAS — el paso bloqueante ── */}
            <View style={{ gap: spacing[3] }}>
              <Titulo texto={t('tallerAdiestramiento.especiesTitulo')} />
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.especiesExplica')}</Text>
              <SelectorOpcion
                acento="oficio"
                multiple
                etiqueta={t('tallerAdiestramiento.especiesTitulo')}
                opciones={[{ codigo: 'perro', etiqueta: t('tallerAdiestramiento.especiePerro') }]}
                seleccionadas={especies}
                onSelect={(codigo) =>
                  setEspecies((prev) => (prev.includes(codigo) ? prev.filter((e) => e !== codigo) : [...prev, codigo]))
                }
              />
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.especiesTecho')}</Text>
            </View>

            {/* ── LA SESIÓN SUELTA (§4: precio único, sin matriz) ── */}
            <View style={{ gap: spacing[3] }}>
              <Titulo texto={t('tallerAdiestramiento.ofertaTitulo')} />
              <Tarjeta relleno="amplio">
                <View style={{ gap: spacing[4] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontFamily: typography.family.sans.regular,
                        fontSize: typography.size.base,
                        color: theme.text.primary,
                      }}
                    >
                      {t('tallerAdiestramiento.ofrecer')}
                    </Text>
                    <Interruptor
                      encendido={activo}
                      onCambio={setActivo}
                      etiqueta={t('tallerAdiestramiento.ofrecer')}
                      registro="oficio"
                    />
                  </View>
                  <View style={{ gap: spacing[2] }}>
                    <Text style={vozSecundaria}>{t('tallerAdiestramiento.precioSesion')}</Text>
                    <Text
                      style={{
                        fontFamily: typography.family.mono.regular,
                        fontSize: typography.size.lg,
                        letterSpacing: typography.tracking.mono,
                        color: theme.text.primary,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {`$${PASOS_SESION[precioIndice].toFixed(2)}`}
                    </Text>
                    <SliderPrecio
                      etiqueta={t('tallerAdiestramiento.precioSesion')}
                      pasos={PASOS_SESION.map((p) => `$${p.toFixed(2)}`)}
                      indice={precioIndice}
                      onCambio={setPrecioIndice}
                      registro="aa"
                    />
                  </View>
                  <SelectorOpcion
                    acento="oficio"
                    etiqueta={t('tallerAdiestramiento.duracionSesion')}
                    opciones={DURACIONES_SESION.map((d) => ({ codigo: String(d), etiqueta: `${d} min` }))}
                    seleccionada={String(duracion)}
                    onSelect={(codigo) => setDuracion(Number(codigo))}
                  />
                </View>
              </Tarjeta>
            </View>

            {/* EL BLOQUEO REAL: sin especies no hay publicación — el CTA
                se apaga y el porqué queda a la vista (Ley 17.4). */}
            {!especiesDeclaradas && <Text style={vozSecundaria}>{t('tallerAdiestramiento.especiesFalta')}</Text>}
            <Boton
              variante="primario"
              bloque
              etiqueta={t('tallerAdiestramiento.guardar')}
              cargando={guardando}
              deshabilitado={!especiesDeclaradas}
              onPress={() => void guardarOferta()}
            />

            {/* ── TUS PROGRAMAS (satélites de la oferta) ── */}
            <View style={{ gap: spacing[3] }}>
              <Titulo texto={t('tallerAdiestramiento.programasTitulo')} />
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.programasExplica')}</Text>
              {listo.oferta === null ? (
                <Text style={vozSecundaria}>{t('tallerAdiestramiento.programasEsperanOferta')}</Text>
              ) : (
                <>
                  {listo.programas.length > 0 && (
                    <Tarjeta>
                      {listo.programas.map((p, i) => (
                        <View key={p.id}>
                          {i > 0 && <Separador />}
                          <Celda
                            titulo={p.nombre}
                            subtitulo={`${VOZ_NIVEL[p.nivel]} · ${t('tallerAdiestramiento.sesionesN', { n: p.nSesiones })}`}
                            metadataMono={`$${p.precioPrograma.toFixed(2)}`}
                            fin={
                              p.activo ? undefined : (
                                <Insignia estado="proximo" etiqueta={t('tallerAdiestramiento.programaOculto')} tamaño="sm" />
                              )
                            }
                            interactiva
                            accessibilityRole="button"
                            onPress={() => {
                              setDraft(draftDe(p));
                              setHojaPrograma(true);
                            }}
                          />
                        </View>
                      ))}
                    </Tarjeta>
                  )}
                  <View style={{ alignSelf: 'flex-start' }}>
                    <Boton
                      variante="compacto"
                      etiqueta={t('tallerAdiestramiento.agregarPrograma')}
                      onPress={() => {
                        setDraft(draftNuevo());
                        setHojaPrograma(true);
                      }}
                    />
                  </View>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Hoja del programa */}
      <Hoja
        visible={hojaPrograma}
        onCerrar={() => {
          if (!guardandoPrograma) setHojaPrograma(false);
        }}
        titulo={
          draft.programaId === null
            ? t('tallerAdiestramiento.programaTituloNuevo')
            : t('tallerAdiestramiento.programaTituloEditar')
        }
      >
        <HojaScroll>
          <View style={{ padding: spacing[4], gap: spacing[4] }}>
            <SelectorOpcion
              acento="oficio"
              etiqueta={t('tallerAdiestramiento.nivel')}
              disposicion="grilla"
              opciones={(Object.keys(VOZ_NIVEL) as NivelPrograma[]).map((n) => ({
                codigo: n,
                etiqueta: VOZ_NIVEL[n],
              }))}
              seleccionada={draft.nivel ?? undefined}
              onSelect={(codigo) => setDraft((d) => ({ ...d, nivel: codigo as NivelPrograma }))}
            />
            {rango !== undefined && (
              <Text style={vozSecundaria}>
                {t('tallerAdiestramiento.rangoSugerido', { min: rango.min, max: rango.max })}
              </Text>
            )}

            <Campo
              label={t('tallerAdiestramiento.nombrePrograma')}
              value={draft.nombre}
              onChangeText={(v) => setDraft((d) => ({ ...d, nombre: v }))}
              placeholder={t('tallerAdiestramiento.nombrePlaceholder')}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.sesiones')}</Text>
              <StepperCantidad
                valor={draft.nSesiones}
                min={2}
                max={30}
                onCambio={(v) =>
                  setDraft((d) => ({
                    ...d,
                    nSesiones: v,
                    vigenciaSemanas: Math.max(d.vigenciaSemanas, Math.max(1, v - 1)),
                  }))
                }
                etiqueta={t('tallerAdiestramiento.sesiones')}
                registro="oficio"
              />
            </View>

            <View style={{ gap: spacing[2] }}>
              <Text style={vozSecundaria}>{t('tallerAdiestramiento.precioPrograma')}</Text>
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.lg,
                  letterSpacing: typography.tracking.mono,
                  color: theme.text.primary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {`$${PASOS_PROGRAMA[draft.precioIndice].toFixed(2)}`}
              </Text>
              <SliderPrecio
                etiqueta={t('tallerAdiestramiento.precioPrograma')}
                pasos={PASOS_PROGRAMA.map((p) => `$${p.toFixed(2)}`)}
                indice={draft.precioIndice}
                onCambio={(i) => setDraft((d) => ({ ...d, precioIndice: i }))}
                registro="aa"
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: spacing[3], gap: spacing[1] }}>
                <Text style={vozSecundaria}>
                  {t('tallerAdiestramiento.vigencia')} · {t('tallerAdiestramiento.vigenciaSemanas', { n: draft.vigenciaSemanas })}
                </Text>
              </View>
              <StepperCantidad
                valor={draft.vigenciaSemanas}
                min={minSemanas}
                max={52}
                onCambio={(v) => setDraft((d) => ({ ...d, vigenciaSemanas: v }))}
                etiqueta={t('tallerAdiestramiento.vigencia')}
                registro="oficio"
              />
            </View>
            <Text style={vozSecundaria}>{t('tallerAdiestramiento.vigenciaExplica')}</Text>

            <SelectorOpcion
              acento="oficio"
              etiqueta={t('tallerAdiestramiento.duracionSesion')}
              opciones={DURACIONES_SESION.map((d) => ({ codigo: String(d), etiqueta: `${d} min` }))}
              seleccionada={String(draft.duracionMinutos)}
              onSelect={(codigo) => setDraft((d) => ({ ...d, duracionMinutos: Number(codigo) }))}
            />

            {draft.programaId !== null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    color: theme.text.primary,
                  }}
                >
                  {t('tallerAdiestramiento.programaActivo')}
                </Text>
                <Interruptor
                  encendido={draft.activo}
                  onCambio={(v) => setDraft((d) => ({ ...d, activo: v }))}
                  etiqueta={t('tallerAdiestramiento.programaActivo')}
                  registro="oficio"
                />
              </View>
            )}

            <Boton
              variante="primario"
              bloque
              etiqueta={t('tallerAdiestramiento.guardarPrograma')}
              cargando={guardandoPrograma}
              deshabilitado={draft.nivel === null || draft.nombre.trim() === ''}
              onPress={() => void guardarPrograma()}
            />
          </View>
        </HojaScroll>
      </Hoja>
    </View>
  );
}
