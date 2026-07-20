/**
 * VACACIONES / BLOQUEOS — el prestador aparta días enteros (S56-B TAREA 2,
 * D-341). Colgada de Negocio → Tu oferta.
 *
 * LA PROMESA ES DEL MOTOR, no de esta pantalla: _prestador_bloqueado se
 * consulta en las seis puertas (slots/inicios/paseadores/hold + plan) —
 * verificado literal contra DB viva antes de construir (regla 59). El
 * bloqueo mata oferta y reservas NUEVAS; las citas ya confirmadas siguen
 * en pie (P14/P16 — jamás se tocan solas).
 *
 * LA ESCALERA declarada (§4b):
 *   peldaño 0 — sin bloqueos: invitación que educa + CTA al primero.
 *   peldaño 1 — vigentes y futuros listados; quitar SOLO futuros
 *     (terminar-antes un bloqueo vigente = peldaño posterior declarado).
 *   peldaño 2 — excepciones de calendario finas (D-332: horas sueltas,
 *     feriados) — hueco declarado, otra deuda.
 *
 * El rango se elige con SelectorOpcion (grilla de próximos días +
 * duración de un toque) — CampoFecha quedó descartado con causa: está
 * atado a la semántica de nacimiento (precisión/etapas). Dosis baja:
 * cero acento de capa, CTA en tinta.
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { fechaCortaMono, fechaLargaHumana, type IdiomaSoportado } from '@epetplace/i18n';
import {
  crearBloqueoPrestador,
  eliminarBloqueoPrestador,
  obtenerBloqueosPrestador,
  obtenerMiPrestador,
  type BloqueoPrestador,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; prestadorId: string; bloqueos: BloqueoPrestador[] };

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

/** Suma días a una fecha ISO local (sin toISOString — corre el día en UTC-5). */
function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA').format(new Date(a, m - 1, d + dias));
}

// Duraciones de un toque: código = días INCLUSIVE del rango.
const DURACIONES = [1, 3, 7, 14, 21, 30] as const;
// La grilla de inicios: hoy + 6 semanas.
const DIAS_OFRECIDOS = 42;

export default function Vacaciones() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  const [creando, setCreando] = useState(false);
  const [inicio, setInicio] = useState<string | null>(null);
  const [duracionDias, setDuracionDias] = useState<number | null>(null);
  const [motivoTexto, setMotivoTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [quitandoId, setQuitandoId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const r = await obtenerBloqueosPrestador(prestador.data.id);
        if (!vigente) return;
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({ estado: 'listo', prestadorId: prestador.data.id, bloqueos: r.data });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const recargar = () => setIntento((n) => n + 1);

  const hoy = hoyLocal();
  const diasParaElegir = useMemo(
    () =>
      Array.from({ length: DIAS_OFRECIDOS }, (_, n) => {
        const iso = sumarDias(hoy, n);
        return { codigo: iso, etiqueta: fechaCortaMono(iso, idioma as IdiomaSoportado) };
      }),
    [hoy, idioma],
  );

  const fin = inicio !== null && duracionDias !== null ? sumarDias(inicio, duracionDias - 1) : null;

  function abrirCreacion() {
    setInicio(null);
    setDuracionDias(null);
    setMotivoTexto('');
    setCreando(true);
  }

  function cerrarHoja() {
    if (guardando) return;
    setCreando(false);
  }

  async function crear() {
    if (guardando || pantalla.estado !== 'listo' || inicio === null || fin === null) return;
    setGuardando(true);
    const r = await crearBloqueoPrestador({
      prestadorId: pantalla.prestadorId,
      fechaInicio: inicio,
      fechaFin: fin,
      motivo: motivoTexto || undefined,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('vacaciones.creado'), variante: 'exito' });
    setCreando(false);
    recargar();
  }

  async function quitar(id: string) {
    if (quitandoId !== null) return;
    setQuitandoId(id);
    const r = await eliminarBloqueoPrestador(id);
    setQuitandoId(null);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('vacaciones.quitado'), variante: 'exito' });
    recargar();
  }

  const rangoMono = (b: BloqueoPrestador): string =>
    b.fechaInicio === b.fechaFin
      ? fechaCortaMono(b.fechaInicio, idioma as IdiomaSoportado)
      : `${fechaCortaMono(b.fechaInicio, idioma as IdiomaSoportado)} → ${fechaCortaMono(b.fechaFin, idioma as IdiomaSoportado)}`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('vacaciones.titulo')} atras onAtras={() => router.back()} />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="50%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={96} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('vacaciones.error')}
            descripcion={t('vacaciones.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('vacaciones.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  recargar();
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.bloqueos.length === 0 && (
        // peldaño 0 — la invitación que educa
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('vacaciones.vacioTitulo')}
            descripcion={t('vacaciones.vacioCuerpo')}
            accion={<Boton variante="primario" etiqueta={t('vacaciones.vacioCta')} onPress={abrirCreacion} />}
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.bloqueos.length > 0 && (
        <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}>
          {/* la voz honesta de la promesa — la cumple el motor */}
          <Texto variante="apoyo">
            {t('vacaciones.promesa')}
          </Texto>

          <Tarjeta relleno="ninguno">
            {pantalla.bloqueos.map((b, i) => {
              const vigenteAhora = b.fechaInicio <= hoy;
              return (
                <View key={b.id}>
                  {i > 0 && <Separador />}
                  <Celda
                    titulo={b.motivo ?? t('vacaciones.sinMotivo')}
                    subtitulo={vigenteAhora ? t('vacaciones.vigente') : undefined}
                    metadataMono={rangoMono(b)}
                    fin={
                      vigenteAhora ? undefined : (
                        <Boton
                          variante="ghost"
                          tamaño="sm"
                          etiqueta={t('vacaciones.quitar')}
                          cargando={quitandoId === b.id}
                          onPress={() => void quitar(b.id)}
                        />
                      )
                    }
                  />
                </View>
              );
            })}
          </Tarjeta>

          <Boton variante="secundario" etiqueta={t('vacaciones.agregar')} bloque onPress={abrirCreacion} />
        </ScrollView>
      )}

      {/* Hoja de creación: desde → cuánto tiempo → motivo opcional */}
      <Hoja visible={creando} onCerrar={cerrarHoja} titulo={t('vacaciones.nuevoTitulo')} altura="media">
        <HojaScroll>
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <SelectorOpcion
              acento="oficio"
              etiqueta={t('vacaciones.desde')}
              disposicion="grilla"
              opciones={diasParaElegir}
              seleccionada={inicio ?? undefined}
              onSelect={(codigo) => setInicio(codigo)}
            />
            <SelectorOpcion
              acento="oficio"
              etiqueta={t('vacaciones.duracion')}
              opciones={DURACIONES.map((d) => ({
                codigo: String(d),
                etiqueta:
                  d === 1
                    ? t('vacaciones.unDia')
                    : d === 7
                      ? t('vacaciones.unaSemana')
                      : d === 14
                        ? t('vacaciones.dosSemanas')
                        : d === 21
                          ? t('vacaciones.tresSemanas')
                          : d === 30
                            ? t('vacaciones.unMes')
                            : t('vacaciones.dias', { n: d }),
              }))}
              seleccionada={duracionDias !== null ? String(duracionDias) : undefined}
              onSelect={(codigo) => setDuracionDias(Number(codigo))}
            />
            {fin !== null ? (
              <Texto variante="apoyo">
                {t('vacaciones.hastaInclusive', { fecha: fechaLargaHumana(fin, idioma as IdiomaSoportado) })}
              </Texto>
            ) : null}
            <Campo
              label={t('vacaciones.motivo')}
              value={motivoTexto}
              onChangeText={setMotivoTexto}
              ayuda={t('vacaciones.motivoAyuda')}
              deshabilitado={guardando}
            />
            <Boton
              variante="primario"
              etiqueta={t('vacaciones.crear')}
              bloque
              cargando={guardando}
              deshabilitado={inicio === null || duracionDias === null}
              onPress={() => void crear()}
            />
          </View>
        </HojaScroll>
      </Hoja>
    </View>
  );
}
