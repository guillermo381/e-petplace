/**
 * LA AGENDA DE RECEPCIÓN (S78-B) — construida SOBRE la lámina propia
 * (`2026-07-26-s78b-LAMINA-agenda-recepcion.html`) sin re-decidir nada,
 * contra el motor s78a6 VERIFICADO aplicado en la DB viva.
 *
 * TESIS: "la recepcionista ve la puerta de su negocio ahora — quién
 *   llegó, quién está adentro y qué sigue — sin una sola línea clínica."
 * FIRMA (Ley 15): LA PUERTA QUE PRESIDE — la agenda no abre en la grilla
 *   de horas sino en las personas que están físicamente ahí.
 * CHANEL: la Puerta vacía no se monta · el profesional no se repite en
 *   la celda de su propia sección (el header lo porta, Ley 12/18) ·
 *   cero candado clínico.
 *
 * §13.3 DECIDIDO EN EL M1: el día con 2+ personas se compone por
 * SECCIONES POR PERSONA — "Del negocio" (empleado_id NULL, las
 * despegadas de S77 §11a) preside, después el titular, después
 * alfabético. Con una persona: lista simple.
 *
 * CERO CLÍNICO EN LA CELDA (D-489). Y DOS BRECHAS DEL CONTRATO,
 * DECLARADAS (jamás inventadas — L-139): el motor no devuelve ESPECIE ni
 * ETAPA de la mascota (la celda de §9 las pide) ni la banda de cuidado
 * especial (D-469 sin motor). Las tres entran ENSANCHANDO
 * `obtener_jornada_recepcion` — la migración lo reserva textual: "no
 * nace un lector paralelo". El avatar degrada a huella digna (sin foto
 * en el contrato) y el tipo_servicio crudo NO se pinta (Ley 3: cero
 * enums en pantalla).
 *
 * DOS LUGARES RESERVADOS, no dibujados: la banda de cuidado especial ·
 * reagendar (espera P22).
 *
 * D-541 RIGE: el error jamás se disfraza de día libre — un falso "no hay
 * citas" acá manda gente a su casa.
 *
 * El reloj §7bis LO DICE EL SERVER (segundos_restantes); la superficie
 * refresca por MINUTO (texto que cambia, jamás animación — Ley 6).
 */

import { useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  EstadoVacio,
  Esqueleto,
  EsqueletoGrupo,
  PieRevelar,
  SelectorOpcion,
  SelectorSegmentado,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
  TarjetaEstado,
} from '@epetplace/ui';
import {
  obtenerJornadaRecepcion,
  obtenerSolicitudesMostrador,
  registrarLlegada,
  type CitaJornadaRecepcion,
  type SolicitudMostrador,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

// Helpers de fecha COPIADOS VERBATIM de (tabs)/index.tsx (D-312 /
// hallazgo S55: jamás Date(iso) ni toISOString — corren el día en
// UTC-5). Si nace un tercer consumidor, se extraen a lib (declarado).
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}
function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA').format(new Date(a ?? 0, (m ?? 1) - 1, (d ?? 1) + dias));
}

/** 'HH:MM:SS' del motor → 'HH:MM' para el ojo (voz de máquina, mono). */
const horaCorta = (h: string | null): string => (h ?? '').slice(0, 5);

type Vista = 'hoy' | 'adelante';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; fecha: string; citas: CitaJornadaRecepcion[]; solicitudes: SolicitudMostrador[] };

export function AgendaRecepcion({
  prestadorId,
  cuentaComercialId,
  titularId,
}: {
  prestadorId: string;
  /** null = sin cuenta legible: las solicitudes §7bis no se montan
   *  (ausencia ante la duda; la jornada vive igual). */
  cuentaComercialId: string | null;
  /** La fila de empleado del titular — ordena las secciones (negocio →
   *  titular → alfabético). null = el orden degrada a alfabético puro. */
  titularId: string | null;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [vista, setVista] = useState<Vista>('hoy');
  const [diaAdelante, setDiaAdelante] = useState<string>(sumarDias(hoyLocal(), 1));
  const [pasadasAbiertas, setPasadasAbiertas] = useState<Record<string, boolean>>({});
  const [marcando, setMarcando] = useState<string | null>(null);
  const montada = useRef(true);

  const fechaVista = vista === 'hoy' ? hoyLocal() : diaAdelante;

  const cargar = useCallback(
    async (fecha: string, esHoy: boolean) => {
      setPantalla({ estado: 'cargando' });
      const [rj, rs] = await Promise.all([
        obtenerJornadaRecepcion(prestadorId, fecha),
        // las solicitudes son de HOY (ventana 24 h del motor); en
        // Adelante no se piden
        esHoy && cuentaComercialId !== null
          ? obtenerSolicitudesMostrador(cuentaComercialId)
          : Promise.resolve({ ok: true as const, data: [] as SolicitudMostrador[] }),
      ]);
      if (!montada.current) return;
      // D-541: el fallo del día dice fallo. El fallo de las solicitudes
      // NO tumba la jornada (bloque secundario) — pero tampoco se pinta
      // "cero solicitudes" sobre un lector caído: el bloque se omite.
      if (!rj.ok) {
        setPantalla({ estado: 'error' });
        return;
      }
      setPantalla({
        estado: 'listo',
        fecha,
        citas: rj.data,
        solicitudes: rs.ok ? rs.data : [],
      });
    },
    [prestadorId, cuentaComercialId],
  );

  useFocusEffect(
    useCallback(() => {
      montada.current = true;
      void cargar(fechaVista, vista === 'hoy');
      // El reloj §7bis y las llegadas envejecen: refresco por MINUTO
      // mientras la pantalla está en foco (sondeo, jamás "tiempo real" —
      // el patrón de frescura honesta S59).
      const reloj = setInterval(() => {
        void cargar(fechaVista, vista === 'hoy');
      }, 60_000);
      return () => {
        montada.current = false;
        clearInterval(reloj);
      };
    }, [cargar, fechaVista, vista]),
  );

  async function marcarLlegada(cita: CitaJornadaRecepcion) {
    if (marcando !== null) return;
    setMarcando(cita.citaId);
    const r = await registrarLlegada(cita.citaId);
    setMarcando(null);
    if (!r.ok) {
      mostrar({
        variante: 'error',
        texto: r.codigo === 'cita_no_activa' ? t('recepcion.llegoNoActiva') : t('recepcion.llegoError'),
      });
      return;
    }
    await cargar(fechaVista, vista === 'hoy');
  }

  // ── derivaciones de composición (la lámina, literal) ──
  const esHoy = pantalla.estado === 'listo' && pantalla.fecha === hoyLocal();
  const citas = pantalla.estado === 'listo' ? pantalla.citas : [];
  const solicitudes = pantalla.estado === 'listo' ? pantalla.solicitudes : [];

  // LA PUERTA: lo vivo AHORA — adentro (en_curso) y esperando (llegó y
  // aún no pasa). Solo hoy; vacía NO se monta (regla de existencia).
  const adentro = esHoy ? citas.filter((c) => c.estado === 'en_curso') : [];
  const esperando = esHoy ? citas.filter((c) => c.estado === 'confirmada' && c.llegadaEn !== null) : [];
  const solicitudesVivas = solicitudes.filter(
    (s) => s.estado === 'pendiente' || (s.estado === 'expirada' && s.respondidaEn === null),
  );

  // EL DÍA por SECCIONES (§13.3): del negocio → titular → alfabético.
  const pasada = (c: CitaJornadaRecepcion): boolean => c.estado === 'completada' || c.estado === 'no_show';
  const clavesPersona = [...new Set(citas.map((c) => c.empleadoId ?? ''))];
  const nombreDe = (clave: string): string | null =>
    citas.find((c) => (c.empleadoId ?? '') === clave)?.empleadoNombre ?? null;
  const secciones = clavesPersona
    .sort((a, b) => {
      if (a === '') return -1; // "Del negocio" preside: exige decisión
      if (b === '') return 1;
      if (titularId !== null && a === titularId) return -1;
      if (titularId !== null && b === titularId) return 1;
      return (nombreDe(a) ?? '').localeCompare(nombreDe(b) ?? '');
    })
    .map((clave) => {
      const suyas = citas.filter((c) => (c.empleadoId ?? '') === clave);
      return {
        clave,
        nombre: clave === '' ? t('recepcion.delNegocio') : (nombreDe(clave) ?? t('recepcion.personaFallback')),
        vivas: suyas.filter((c) => !pasada(c)),
        pasadas: suyas.filter(pasada),
      };
    });
  // N=1 (una sola persona y nada del negocio): lista simple — el
  // vocabulario de persona no existe (la regla dura de S78).
  const listaSimple = secciones.length === 1 && secciones[0].clave !== '';

  const vozEstado = (c: CitaJornadaRecepcion): string => {
    if (c.estado === 'en_curso') return t('recepcion.adentro');
    if (c.estado === 'no_show') return t('recepcion.noVino');
    if (c.estado === 'completada') return t('recepcion.atendida');
    if (c.llegadaEn !== null) return t('recepcion.llego');
    return t('recepcion.porLlegar');
  };

  const celdaCita = (c: CitaJornadaRecepcion, conPersona: boolean) => {
    const activa = c.estado === 'en_curso' || (c.llegadaEn !== null && !pasada(c));
    const partes = [vozEstado(c)];
    // en la celda PLANA (Puerta / lista simple) la persona se dice; en
    // sección NO se repite — el header la porta (Ley 12/18)
    if (conPersona && c.empleadoNombre !== null && c.estado === 'en_curso') {
      partes[0] = t('recepcion.adentroCon', { nombre: c.empleadoNombre });
    }
    return (
      /* LUGAR RESERVADO (P22): la celda ganará onPress al detalle/
         reagenda cuando su política exista — hoy NO es tocable (Ley 23:
         un toque que no hace nada es una promesa rota). */
      <TarjetaEstado
        key={c.citaId}
        encendido={activa}
        etiqueta={`${c.mascotaNombre ?? t('agenda.mascotaFallback')} · ${partes.join(' · ')}`}
      >
        <AvatarMascota nombre={c.mascotaNombre ?? ''} tamano="sm" />
        <View style={{ flex: 1, gap: spacing[0.5] }}>
          <Texto variante="cuerpo">{c.mascotaNombre ?? t('agenda.mascotaFallback')}</Texto>
          <Texto variante="apoyo">{partes.join(' · ')}</Texto>
        </View>
        {c.estado === 'confirmada' && c.llegadaEn === null && esHoy ? (
          <Boton
            variante="compacto"
            etiqueta={t('recepcion.llegoCta')}
            cargando={marcando === c.citaId}
            onPress={() => void marcarLlegada(c)}
          />
        ) : (
          <Texto variante="dato">{horaCorta(c.hora)}</Texto>
        )}
      </TarjetaEstado>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing[4],
          padding: spacing[4],
          gap: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        <Texto variante="titulo">{t('recepcion.titulo')}</Texto>

        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={44} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
          <EstadoVacio
            registro="pantalla"
            titulo={t('recepcion.errorDia')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('agenda.reintentar')}
                onPress={() => void cargar(fechaVista, vista === 'hoy')}
              />
            }
          />
        )}

        {pantalla.estado === 'listo' && (
          <>
            {/* ── [1] LA PUERTA — preside; vacía no se monta ── */}
            {(adentro.length > 0 || esperando.length > 0 || solicitudesVivas.length > 0) && (
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">{t('recepcion.puerta')}</Texto>
                <View style={{ gap: spacing[2.5] }}>
                  {adentro.map((c) => celdaCita(c, true))}
                  {esperando.map((c) => celdaCita(c, true))}
                </View>
                {solicitudesVivas.map((s) => (
                  <Tarjeta key={s.solicitudId} tinte="warning" relleno="amplio">
                    <View style={{ gap: spacing[1] }}>
                      <Texto variante="seccion">
                        {s.estado === 'expirada'
                          ? t('recepcion.solicitudExpirada', {
                              mascota: s.mascotaNombre ?? t('agenda.mascotaFallback'),
                            })
                          : t('recepcion.solicitudPendiente', {
                              mascota: s.mascotaNombre ?? t('agenda.mascotaFallback'),
                            })}
                      </Texto>
                      {s.estado === 'pendiente' ? (
                        // el reloj lo dijo el SERVER; acá solo se viste
                        <Texto variante="dato">
                          {t('recepcion.solicitudReloj', {
                            min: Math.max(1, Math.ceil(s.segundosRestantes / 60)),
                          })}
                        </Texto>
                      ) : (
                        <Texto variante="cuerpo">{t('recepcion.solicitudExpiradaCuerpo')}</Texto>
                      )}
                    </View>
                  </Tarjeta>
                ))}
              </View>
            )}

            {/* ── [2] REGISTRAR ATENCIÓN — el verbo grande, ÚNICO sólido ── */}
            <Boton
              variante="primario"
              bloque
              etiqueta={t('recepcion.registrarAtencion')}
              onPress={() => router.push('/veterinaria/mostrador')}
            />

            {/* ── [3] EL DÍA · Hoy / Adelante ── */}
            <SelectorSegmentado
              segmentos={[
                { codigo: 'hoy', etiqueta: t('recepcion.vistaHoy') },
                { codigo: 'adelante', etiqueta: t('recepcion.vistaAdelante') },
              ]}
              activo={vista}
              onCambio={(v) => setVista(v === 'adelante' ? 'adelante' : 'hoy')}
              etiqueta={t('recepcion.vistaEtiqueta')}
            />
            {vista === 'adelante' && (
              // [4] ADELANTE: el teléfono pregunta por el jueves — la tira
              // de días próximos, misma composición, SOLO LECTURA
              <SelectorOpcion
                etiqueta={t('recepcion.adelanteEtiqueta')}
                disposicion="tira"
                acento="oficio"
                opciones={Array.from({ length: 6 }, (_, i) => {
                  const iso = sumarDias(hoyLocal(), i + 1);
                  return { codigo: iso, etiqueta: iso.slice(5) };
                })}
                seleccionada={diaAdelante}
                onSelect={(iso) => setDiaAdelante(iso)}
              />
            )}

            {citas.length === 0 ? (
              // vacío CON camino — el día libre no es negocio muerto
              <EstadoVacio
                registro="seccion"
                titulo={t('recepcion.sinCitas')}
                descripcion={t('recepcion.sinCitasCamino')}
              />
            ) : listaSimple ? (
              <View style={{ gap: spacing[2.5] }}>
                {secciones[0].vivas.map((c) => celdaCita(c, true))}
                <PieRevelar
                  n={secciones[0].pasadas.length}
                  revelado={pasadasAbiertas[secciones[0].clave] === true}
                  onPress={() =>
                    setPasadasAbiertas((p) => ({ ...p, [secciones[0].clave]: p[secciones[0].clave] !== true }))
                  }
                />
                {pasadasAbiertas[secciones[0].clave] === true &&
                  secciones[0].pasadas.map((c) => celdaCita(c, true))}
              </View>
            ) : (
              secciones.map((sec) => (
                <View key={sec.clave || 'negocio'} style={{ gap: spacing[2] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Texto variante="seccion">{sec.nombre}</Texto>
                    <Texto variante="apoyo">
                      {t('recepcion.citasDelDia', { n: sec.vivas.length + sec.pasadas.length })}
                    </Texto>
                  </View>
                  <View style={{ gap: spacing[2.5] }}>
                    {sec.vivas.map((c) => celdaCita(c, false))}
                  </View>
                  <PieRevelar
                    n={sec.pasadas.length}
                    revelado={pasadasAbiertas[sec.clave] === true}
                    onPress={() => setPasadasAbiertas((p) => ({ ...p, [sec.clave]: p[sec.clave] !== true }))}
                  />
                  {pasadasAbiertas[sec.clave] === true && (
                    <View style={{ gap: spacing[2.5] }}>{sec.pasadas.map((c) => celdaCita(c, false))}</View>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
