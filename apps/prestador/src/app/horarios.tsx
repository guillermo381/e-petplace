/**
 * HORARIOS — las franjas de disponibilidad del paseo (S55-B B2).
 * Franjas GENERALES por día de semana (regla 32: 0=Domingo, la DB manda
 * sin transformaciones; el orden de DISPLAY arranca en lunes, decisión
 * de superficie). Grilla fija de 30 min en v1; el CUPO (max_citas_por_slot)
 * es "paseos simultáneos" y es EDITABLE — el motor de ocupación de la
 * Sesión A lo respeta por ventana.
 *
 * LA ESCALERA declarada (§4b):
 *   peldaño 0 — sin franjas: invitación que educa + CTA a la primera.
 *   peldaño 1 — franjas por día: agregar, pausar/reactivar, quitar
 *     (las franjas son configuración de disponibilidad, no historia —
 *     quitar es legal; la regla 7.8 protege eventos y plata).
 *   peldaño 2 — franjas por servicio y por empleado: hueco DECLARADO
 *     (el schema ya las soporta con servicio_id/empleado_id; llegan con
 *     el modelo de equipo — relevamiento empleados S55-B).
 *
 * HUECO DECLARADO — compatibilidad grupal: cupo >1 significa paseos en
 * paralelo; la compatibilidad entre perros del grupo aún no se modela
 * (insumo de MODELO_PASEO). La voz del cupo es neutral y honesta.
 *
 * SOLAPE validado en el wrapper contra TODAS las franjas del día
 * (relevado S55: el UNIQUE del schema no protege con servicio_id NULL).
 * Dosis baja (test 7).
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
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
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  actualizarFranjaHorario,
  crearFranjaHorario,
  eliminarFranjaHorario,
  obtenerFranjasHorario,
  obtenerMiPrestador,
  type FranjaHorario,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; prestadorId: string; franjas: FranjaHorario[] };

// display lunes-primero; el ÍNDICE que viaja a DB sigue siendo 0=Domingo
const ORDEN_DISPLAY = [1, 2, 3, 4, 5, 6, 0] as const;

// grilla v1: pasos de 30 min, 05:00–22:00
const HORAS: string[] = [];
for (let m = 5 * 60; m <= 22 * 60; m += 30) {
  HORAS.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}

type VistaNueva = 'form' | 'dia' | 'desde' | 'hasta';

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
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

export default function Horarios() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  // Hoja de creación (con sub-vistas) y de edición
  const [creando, setCreando] = useState(false);
  const [vistaNueva, setVistaNueva] = useState<VistaNueva>('form');
  const [diaSel, setDiaSel] = useState<number | null>(null);
  const [desdeSel, setDesdeSel] = useState<string | null>(null);
  const [hastaSel, setHastaSel] = useState<string | null>(null);
  const [cupoSel, setCupoSel] = useState('1');
  const [editando, setEditando] = useState<FranjaHorario | null>(null);
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);
  const [guardando, setGuardando] = useState(false);

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
        const r = await obtenerFranjasHorario(prestador.data.id);
        if (!vigente) return;
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({ estado: 'listo', prestadorId: prestador.data.id, franjas: r.data });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const recargar = () => setIntento((n) => n + 1);

  const vozDia = (dia: number): string => {
    switch (dia) {
      case 0: return t('horarios.dia0');
      case 1: return t('horarios.dia1');
      case 2: return t('horarios.dia2');
      case 3: return t('horarios.dia3');
      case 4: return t('horarios.dia4');
      case 5: return t('horarios.dia5');
      case 6: return t('horarios.dia6');
      default: return String(dia);
    }
  };

  const vozCupo = (cupo: number): string =>
    cupo === 1 ? t('horarios.cupoUno') : t('horarios.cupoVarios', { cantidad: cupo });

  function abrirCreacion() {
    setCreando(true);
    setVistaNueva('form');
    setDiaSel(null);
    setDesdeSel(null);
    setHastaSel(null);
    setCupoSel('1');
  }

  function cerrarHojas() {
    if (guardando) return;
    setCreando(false);
    setEditando(null);
    setConfirmandoQuitar(false);
  }

  async function crearFranja() {
    if (guardando || pantalla.estado !== 'listo') return;
    if (diaSel === null || desdeSel === null || hastaSel === null) return;
    setGuardando(true);
    const r = await crearFranjaHorario({
      prestadorId: pantalla.prestadorId,
      diaSemana: diaSel,
      horaInicio: desdeSel,
      horaFin: hastaSel,
      maxCitasPorSlot: Number.parseInt(cupoSel, 10),
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.codigo === 'franja_solapada' ? t('horarios.solape') : r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('horarios.creada'), variante: 'exito' });
    setCreando(false);
    recargar();
  }

  async function guardarEdicion(cambios: { activo?: boolean; maxCitasPorSlot?: number }) {
    if (guardando || editando === null) return;
    setGuardando(true);
    const r = await actualizarFranjaHorario({ id: editando.id, ...cambios });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('horarios.guardado'), variante: 'exito' });
    setEditando(null);
    recargar();
  }

  async function quitarFranja() {
    if (guardando || editando === null) return;
    setGuardando(true);
    const r = await eliminarFranjaHorario(editando.id);
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('horarios.quitada'), variante: 'exito' });
    setEditando(null);
    setConfirmandoQuitar(false);
    recargar();
  }

  const listo = pantalla.estado === 'listo';
  const franjas = listo ? pantalla.franjas : [];
  const puedeCrear = diaSel !== null && desdeSel !== null && hastaSel !== null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('horarios.titulo')} atras onAtras={() => router.back()} />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="35%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={100} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={100} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('horarios.error')}
            descripcion={t('horarios.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('horarios.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  recargar();
                }}
              />
            }
          />
        </View>
      )}

      {listo && franjas.length === 0 && (
        // peldaño 0 — la invitación que educa
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('horarios.vacioTitulo')}
            descripcion={t('horarios.vacioCuerpo')}
            accion={<Boton variante="primario" etiqueta={t('horarios.vacioCta')} onPress={abrirCreacion} />}
          />
        </View>
      )}

      {listo && franjas.length > 0 && (
        <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}>
          {ORDEN_DISPLAY.filter((dia) => franjas.some((f) => f.diaSemana === dia)).map((dia) => (
            <View key={dia} style={{ gap: spacing[3] }}>
              <TituloBloque texto={vozDia(dia)} />
              <Tarjeta relleno="ninguno">
                {franjas
                  .filter((f) => f.diaSemana === dia)
                  .map((f, i) => (
                    <View key={f.id}>
                      {i > 0 && <Separador />}
                      <Celda
                        interactiva
                        accessibilityRole="button"
                        onPress={() => {
                          setEditando(f);
                          setCupoSel(String(f.maxCitasPorSlot));
                          setConfirmandoQuitar(false);
                        }}
                        titulo={vozCupo(f.maxCitasPorSlot)}
                        subtitulo={f.activo ? undefined : t('horarios.pausada')}
                        metadataMono={`${f.horaInicio} – ${f.horaFin}`}
                      />
                    </View>
                  ))}
              </Tarjeta>
            </View>
          ))}

          <Boton variante="secundario" etiqueta={t('horarios.agregarFranja')} bloque onPress={abrirCreacion} />
        </ScrollView>
      )}

      {/* Hoja de creación — una sola Hoja, el contenido cambia de vista */}
      <Hoja
        visible={creando}
        onCerrar={cerrarHojas}
        titulo={
          vistaNueva === 'dia'
            ? t('horarios.diaElegir')
            : vistaNueva === 'desde' || vistaNueva === 'hasta'
              ? t('horarios.horaElegir')
              : t('horarios.nuevaTitulo')
        }
        altura="media"
      >
        {vistaNueva === 'form' && (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <Tarjeta relleno="ninguno">
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('horarios.dia')}
                subtitulo={diaSel !== null ? vozDia(diaSel) : t('horarios.diaElegir')}
                onPress={() => setVistaNueva('dia')}
              />
              <Separador />
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('horarios.desde')}
                metadataMono={desdeSel ?? undefined}
                subtitulo={desdeSel === null ? t('horarios.horaElegir') : undefined}
                onPress={() => setVistaNueva('desde')}
              />
              <Separador />
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('horarios.hasta')}
                metadataMono={hastaSel ?? undefined}
                subtitulo={hastaSel === null ? t('horarios.horaElegir') : undefined}
                onPress={() => setVistaNueva('hasta')}
              />
            </Tarjeta>
            <SelectorOpcion
              etiqueta={t('horarios.cupo')}
              opciones={[
                { codigo: '1', etiqueta: '1' },
                { codigo: '2', etiqueta: '2' },
                { codigo: '3', etiqueta: '3' },
                { codigo: '4', etiqueta: '4' },
              ]}
              seleccionada={cupoSel}
              onSelect={setCupoSel}
            />
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.xs,
                color: theme.text.tertiary,
              }}
            >
              {t('horarios.cupoAyuda')}
            </Text>
            <Boton
              variante="primario"
              etiqueta={t('horarios.crear')}
              bloque
              cargando={guardando}
              deshabilitado={!puedeCrear}
              onPress={() => void crearFranja()}
            />
          </View>
        )}

        {vistaNueva === 'dia' && (
          <HojaScroll>
            {ORDEN_DISPLAY.map((dia, i) => (
              <View key={dia}>
                {i > 0 && <Separador />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={vozDia(dia)}
                  onPress={() => {
                    setDiaSel(dia);
                    setVistaNueva('form');
                  }}
                />
              </View>
            ))}
          </HojaScroll>
        )}

        {(vistaNueva === 'desde' || vistaNueva === 'hasta') && (
          <HojaScroll>
            {HORAS.filter((h) => (vistaNueva === 'hasta' && desdeSel !== null ? h > desdeSel : true)).map((h, i) => (
              <View key={h}>
                {i > 0 && <Separador />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={h}
                  onPress={() => {
                    if (vistaNueva === 'desde') {
                      setDesdeSel(h);
                      if (hastaSel !== null && hastaSel <= h) setHastaSel(null);
                    } else {
                      setHastaSel(h);
                    }
                    setVistaNueva('form');
                  }}
                />
              </View>
            ))}
          </HojaScroll>
        )}
      </Hoja>

      {/* Hoja de edición: cupo, pausar/reactivar, quitar con confirmación */}
      <Hoja
        visible={editando !== null}
        onCerrar={cerrarHojas}
        titulo={editando !== null ? `${vozDia(editando.diaSemana)} · ${editando.horaInicio} – ${editando.horaFin}` : t('horarios.editarTitulo')}
      >
        {editando !== null && (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            {!confirmandoQuitar ? (
              <>
                <SelectorOpcion
                  etiqueta={t('horarios.cupo')}
                  opciones={[
                    { codigo: '1', etiqueta: '1' },
                    { codigo: '2', etiqueta: '2' },
                    { codigo: '3', etiqueta: '3' },
                    { codigo: '4', etiqueta: '4' },
                  ]}
                  seleccionada={cupoSel}
                  onSelect={setCupoSel}
                />
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.xs,
                    color: theme.text.tertiary,
                  }}
                >
                  {t('horarios.cupoAyuda')}
                </Text>
                <Boton
                  variante="primario"
                  etiqueta={t('horarios.guardar')}
                  bloque
                  cargando={guardando}
                  onPress={() => void guardarEdicion({ maxCitasPorSlot: Number.parseInt(cupoSel, 10) })}
                />
                <Boton
                  variante="ghost"
                  etiqueta={editando.activo ? t('horarios.pausar') : t('horarios.reactivar')}
                  bloque
                  onPress={() => void guardarEdicion({ activo: !editando.activo })}
                />
                <Boton
                  variante="destructivo"
                  etiqueta={t('horarios.quitar')}
                  bloque
                  onPress={() => setConfirmandoQuitar(true)}
                />
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    lineHeight: typography.size.base * typography.leading.normal,
                    color: theme.text.secondary,
                  }}
                >
                  {t('horarios.quitarConfirmacion')}
                </Text>
                <Boton
                  variante="destructivo"
                  etiqueta={t('horarios.quitarConfirmar')}
                  bloque
                  cargando={guardando}
                  onPress={() => void quitarFranja()}
                />
                <Boton variante="ghost" etiqueta={t('horarios.cancelar')} bloque onPress={() => setConfirmandoQuitar(false)} />
              </>
            )}
          </View>
        )}
      </Hoja>
    </View>
  );
}
