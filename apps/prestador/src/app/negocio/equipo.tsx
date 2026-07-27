// ─────────────────────────────────────────────────────────────────────
// TU NEGOCIO — LA FIRMA + EL EQUIPO (/negocio/equipo · S74-B, boceto
// fa83e5d APTO con 7 enmiendas de la vara de A, todas incorporadas).
//
// TESIS: el dueño gobierna quién actúa en su negocio y con qué permiso —
//   y quitar el acceso nunca borra lo que la persona hizo.
// FIRMA (Ley 15): el bloque de identidad del negocio presidiendo — la
//   primera vez que el prestador se VE como negocio en su propia app.
// CHANEL: sin credencial (vive en §14.2), sin acotación de actos (D-463
//   fuera de v1), sin contadores por miembro.
//
// E2 (vara): el slot del LOGO es de packages/ui (territorio A, pedido
//   emitido). HOY NO EXISTE → la firma sale SIN logo DICIENDO el hueco
//   (una línea de voz) — jamás inline, jamás placeholder decorativo.
// E3 (vara): la ruta existe para cualquier empleado (deep link) — la
//   PANTALLA gatea: la fuente del bool es-dueño es la DERIVACIÓN del
//   wrapper (empleado_roles RLS dueño-only: cero filas = no-dueño) y el
//   no-dueño ve la voz digna del solo-lectura (patrón S60), jamás blanco.
// E6 (vara): desvincular va por la policy legacy (user_id) — declarado
//   en el wrapper, NO curado acá.
// E7 (vara): ciudad NULL → el renglón SE OMITE. Jamás "no especificada".
//
// ── S78-B · LA HOJA DEL MIEMBRO, RECOMPUESTA (M1 v2 gateado con tres
//    enmiendas de composición del founder) ──
// TESIS de la Hoja: "lo que esta persona puede hacer en tu negocio se
//   decide acá — y hasta que tenga jornada, poder no es aparecer."
// FIRMA: la consecuencia visible — quitar el último chip médico no se
//   ejecuta, se informa ANTES (§4 de LETRA_EDICION_VINCULO_S77).
// CHANEL: mueren los DOS Interruptor de rol (profesional es DERIVADO de
//   ≥1 chip; recepcion es MEMBRESÍA y su DELETE podía borrar el piso que
//   A2bis concede), la clave `rolesAyuda`, el handler `toggleRol`, y los
//   divisores entre filas de servicio (Ley 18: cuatro filas del mismo
//   tipo no son "cosas realmente distintas").
// EL MONOLITO SE ROMPE: la Hoja es una PILA DE BLOQUES sobre papel, no
//   una tarjeta blanca única. La declaración ① de la mesa (la Ley 6
//   estirada: el estado por presencia/ausencia de la huella) quedó
//   RETIRADA en el gate — el estado se lee por el GLIFO ENTERO.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Insignia,
  Interruptor,
  LogoNegocio,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  radius,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  asignarServiciosEmpleado,
  desvincularEmpleado,
  invitarEmpleado,
  obtenerChipsEmpleado,
  obtenerEquipoNegocio,
  obtenerJornadaEmpleado,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerOficiosNegocio,
  quitarServiciosEmpleado,
  resolverUrlLogoNegocio,
  type ChipEmpleado,
  type EquipoNegocio,
  type JornadaEmpleado,
  type MiembroEquipo,
  type MiPrestador,
  type OficioChip,
  type OficioNegocio,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';
import { ControlEstado, IconoOficio } from '@/components/iconos-oficio';
import { TarjetaEstado } from '@/components/tarjeta-estado';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; prestador: MiPrestador; equipo: EquipoNegocio };

/** El orden de los oficios en toda superficie del prestador (el mismo del
 *  filtro del HOY). Fijo: la lista no se reordena según quién la mire. */
const ORDEN_OFICIOS: readonly OficioChip[] = ['veterinaria', 'grooming', 'paseo', 'adiestramiento'];

// La anatomía on/off firmada acá se EXTRAJO a `components/tarjeta-estado`
// cuando el selector de Jornadas (S78-B turnos) se volvió su segundo
// consumidor — una sola definición, cero clones (Ley 19 en espíritu).

export default function EquipoNegocioPantalla() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [miembro, setMiembro] = useState<MiembroEquipo | null>(null);
  const [confirmaDesvincular, setConfirmaDesvincular] = useState(false);
  const [hojaInvitar, setHojaInvitar] = useState(false);
  const [invNombre, setInvNombre] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [vozError, setVozError] = useState<string | null>(null);
  // ── S76-B4: LOS CHIPS AL INVITAR (LETRA_RECEPCION §1/§6, B0 APTO) ──
  // Decisión founder S76: los toggles escriben SOLO chips de servicio.
  // RECEPCIÓN NO SE ESCRIBE DESDE LA PANTALLA (su fila la concede el RPC
  // de aceptación — migración A2bis, tanda de A); `profesional` es
  // DERIVADO (≥1 chip) y no se escribe. EL TOGGLE ADMINISTRADOR NO SE
  // OFRECE (§5: su motor no existe — D-513 v2 + D-517 CLASE 2; gatear
  // no es conceder, Ley 23). null en oficios = no legibles: el toggle
  // no se ofrece (ausencia ante la duda; el flujo de dos pasos queda).
  const [oficios, setOficios] = useState<OficioNegocio[] | null>(null);
  const [invPrestador, setInvPrestador] = useState(false);
  const [invOficios, setInvOficios] = useState<string[]>([]);

  const [prestadorId, setPrestadorId] = useState<string | null>(null);

  // ── S78-B: el estado de la Hoja del miembro ──
  const [chips, setChips] = useState<ChipEmpleado[] | null>(null);
  const [jornada, setJornada] = useState<JornadaEmpleado | null>(null);
  const [cargandoHoja, setCargandoHoja] = useState(false);
  /** El oficio cuyo apagado dejaría a la persona SIN capacidad clínica y
   *  espera el segundo toque (§4: no se ejecuta al toque, se informa). */
  const [confirmaQuitar, setConfirmaQuitar] = useState<OficioChip | null>(null);
  /** EL ARRASTRE (S78-B punto 2): los oficios de CADA miembro, para que el
   *  subtítulo de la lista diga QUÉ ATIENDE y no "Recepción" a todo el
   *  mundo. Su fallo NO tumba la ventana: sin dato, el subtítulo se OMITE
   *  (jamás una identidad inventada — L-139). */
  const [oficiosPorMiembro, setOficiosPorMiembro] = useState<Record<string, OficioChip[]>>({});

  const cargar = useCallback(async () => {
    setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const [prestador, cuenta] = await Promise.all([obtenerMiPrestador(), obtenerMiCuentaComercial()]);
    if (!prestador.ok) {
      setPantalla({ estado: 'error', mensaje: t('equipo.errorCarga') });
      return;
    }
    setPrestadorId(prestador.data.id);
    // S76-B4: los oficios del negocio (chips al invitar). Su fallo NO
    // tumba la ventana: null = el toggle Prestador no se ofrece y el
    // flujo de dos pasos sigue entero (§5 regla 2).
    void obtenerOficiosNegocio(prestador.data.id).then((r) => {
      setOficios(r.ok ? r.data : null);
    });
    if (!cuenta.ok || cuenta.data === null) {
      // Sin cuenta comercial no hay lector de equipo (el RPC keyea por
      // cuenta). El error dirige (Ley 17.4), jamás se disfraza de
      // equipo-de-1 (Ley 13 — la cláusula E4 generalizada).
      setPantalla({ estado: 'error', mensaje: t('equipo.errorCarga') });
      return;
    }
    const equipo = await obtenerEquipoNegocio(cuenta.data.id);
    if (!equipo.ok) {
      setPantalla({ estado: 'error', mensaje: t('equipo.errorCarga') });
      return;
    }
    setPantalla({ estado: 'listo', prestador: prestador.data, equipo: equipo.data });

    // EL ARRASTRE — COSTO DECLARADO (D-497): `MiembroEquipo` NO trae chips
    // y NO existe lector de equipo-con-chips, así que son 2 viajes por
    // miembro activo no-titular. Con los equipos de hoy (unidades) es
    // tolerable; la cura de raíz es ensanchar `obtenerEquipoNegocio` —
    // PEDIDO A A, no deducido acá. En paralelo y sin bloquear la ventana.
    const aLeer = equipo.data.miembros.filter((m) => m.activo && !m.roles.includes('dueño'));
    void Promise.all(
      aLeer.map(async (m) => {
        const r = await obtenerChipsEmpleado(m.empleadoId);
        return { id: m.empleadoId, oficios: r.ok ? [...new Set(r.data.map((c) => c.oficio))] : null };
      }),
    ).then((filas) => {
      const mapa: Record<string, OficioChip[]> = {};
      for (const f of filas) if (f.oficios !== null) mapa[f.id] = f.oficios;
      setOficiosPorMiembro(mapa);
    });
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  /** Abre la Hoja y lee lo que la Hoja necesita: chips + jornada (§4bis:
   *  el chip NO promete disponibilidad — quien no tiene jornada no aparece
   *  en ninguna reserva, y la superficie tiene que decirlo). */
  function abrirMiembro(m: MiembroEquipo) {
    setVozError(null);
    setConfirmaDesvincular(false);
    setConfirmaQuitar(null);
    setChips(null);
    setJornada(null);
    setMiembro(m);
    if (m.roles.includes('dueño')) return;
    setCargandoHoja(true);
    void Promise.all([obtenerChipsEmpleado(m.empleadoId), obtenerJornadaEmpleado(m.empleadoId)]).then(
      ([rc, rj]) => {
        setCargandoHoja(false);
        if (rc.ok) setChips(rc.data);
        else setVozError(t('equipo.errorCarga'));
        if (rj.ok) setJornada(rj.data);
      },
    );
  }

  /**
   * EL CATÁLOGO ES LA UNIÓN — oficios ACTIVOS del negocio ∪ oficios que la
   * PERSONA tiene. El porqué, con literal: `obtenerOficiosNegocio` filtra
   * `activo = true`, pero `obtenerChipsEmpleado` NO filtra y
   * `empleado_tiene_capacidad_clinica` tampoco (S76, a propósito:
   * desactivar una oferta no le quita el expediente al vet). Sin la unión,
   * un chip sobre oferta apagada seguiría dando expediente y DESAPARECERÍA
   * del selector: invisible e inquitable — el lector que degrada a lista
   * vacía y esconde el hueco (§6.3).
   */
  const filasOficio = useMemo(() => {
    if (chips === null) return [];
    const activos = (oficios ?? []).map((o) => o.oficio);
    const tiene = chips.map((c) => c.oficio);
    const union = [...new Set([...activos, ...tiene])];
    return ORDEN_OFICIOS.filter((o) => union.includes(o)).map((oficio) => ({
      oficio,
      encendido: tiene.includes(oficio),
      ofertaApagada: tiene.includes(oficio) && !activos.includes(oficio),
    }));
  }, [chips, oficios]);

  /** true ⟺ apagar ESE oficio deja a la persona en CERO chips médicos —
   *  o sea, le saca el expediente (§4: es un acto clínico). */
  function dejaSinClinico(oficio: OficioChip): boolean {
    if (chips === null) return false;
    const medicosTotales = chips.filter((c) => c.esMedico).length;
    const medicosDelOficio = chips.filter((c) => c.oficio === oficio && c.esMedico).length;
    return medicosDelOficio > 0 && medicosDelOficio === medicosTotales;
  }

  async function alternarOficio(m: MiembroEquipo, oficio: OficioChip, encender: boolean) {
    if (ocupado || chips === null) return;

    if (!encender) {
      // ANTES (§4 + §6.3): si apagar deja sin capacidad clínica, NO se
      // ejecuta al toque — confirmación EN EL LUGAR, dos toques, patrón
      // `confirmaDesvincular` que esta Hoja ya usa. Jamás Hoja anidada.
      if (dejaSinClinico(oficio) && confirmaQuitar !== oficio) {
        setConfirmaQuitar(oficio);
        return;
      }
      const ids = chips.filter((c) => c.oficio === oficio).map((c) => c.servicioId);
      if (ids.length === 0) return;
      setOcupado(true);
      setVozError(null);
      const r = await quitarServiciosEmpleado(m.empleadoId, ids);
      setOcupado(false);
      setConfirmaQuitar(null);
      if (!r.ok) {
        // `estado_no_confirmado` NO es un error de lectura más: la
        // ESCRITURA YA OCURRIÓ. Decir "no se quitó" sería MENTIR con los
        // chips ya borrados (§6.3 — el requisito de voz de la letra).
        setVozError(
          r.codigo === 'estado_no_confirmado' ? t('equipo.estadoNoConfirmado') : t('equipo.errorEscritura'),
        );
        return;
      }
      // Repinta con los chips SOBREVIVIENTES que el motor devuelve — cero
      // re-lectura y, sobre todo, una ventana de desincronía menos.
      setChips(r.data.chips);
      setOficiosPorMiembro((prev) => ({
        ...prev,
        [m.empleadoId]: [...new Set(r.data.chips.map((c) => c.oficio))],
      }));
      // DESPUÉS (§6.3): el dato AUTORITATIVO es el re-leído tras el DELETE.
      // La advertencia previa puede haber envejecido en las dos direcciones.
      if (r.data.perdioCapacidadClinicaPorChip) {
        mostrar({ variante: 'neutro', texto: t('equipo.clinicoPerdida', { nombre: m.nombre }) });
      }
      return;
    }

    const ids = (oficios ?? []).find((o) => o.oficio === oficio)?.servicioIds ?? [];
    if (ids.length === 0) {
      // Ley 13: si no hay a qué oferta enganchar el chip, NO se traga el
      // toque en silencio — el toque sin efecto es la peor de las mentiras.
      setVozError(t('equipo.errorEscritura'));
      return;
    }
    setOcupado(true);
    setVozError(null);
    const r = await asignarServiciosEmpleado(m.empleadoId, ids);
    if (!r.ok) {
      setOcupado(false);
      setVozError(t('equipo.errorEscritura'));
      return;
    }
    const rc = await obtenerChipsEmpleado(m.empleadoId);
    setOcupado(false);
    if (rc.ok) {
      setChips(rc.data);
      setOficiosPorMiembro((prev) => ({
        ...prev,
        [m.empleadoId]: [...new Set(rc.data.map((c) => c.oficio))],
      }));
    }
  }

  async function desvincular(m: MiembroEquipo) {
    if (ocupado) return;
    setOcupado(true);
    setVozError(null);
    const r = await desvincularEmpleado(m.empleadoId);
    setOcupado(false);
    if (!r.ok) {
      setVozError(r.mensaje.length > 0 ? r.mensaje : t('equipo.errorEscritura'));
      return;
    }
    setConfirmaDesvincular(false);
    setMiembro(null);
    // §11.3: el número sale de un lector REAL — el RPC de baja lo devuelve
    // (S77-A). ANTES del acto no existe, así que antes se dice la
    // consecuencia SIN cantidad (L-139); acá sí, porque ya es un hecho.
    if (r.data.citasDespegadas > 0) {
      mostrar({ variante: 'neutro', texto: t('equipo.bajaDespegadas', { n: r.data.citasDespegadas }) });
    }
    await cargar();
  }

  async function invitar() {
    if (ocupado || prestadorId === null) return;
    setOcupado(true);
    setVozError(null);
    const r = await invitarEmpleado(prestadorId, invEmail.trim(), invNombre.trim());
    if (!r.ok) {
      setOcupado(false);
      // CURA D-508: los rebotes suaves del motor GANAN VOZ — jamás
      // "éxito" sobre un rechazo (el founder lo vio en campo).
      setVozError(
        r.codigo === 'ya_es_empleado'
          ? t('equipo.rebYaEnEquipo')
          : r.codigo === 'email_sin_cuenta'
            ? t('equipo.rebSinCuenta')
            : r.codigo === 'email_es_prestador'
              ? t('equipo.rebOtroPrestador')
              : r.codigo === 'no_es_dueno'
                ? t('equipo.rebNoDueno')
                : t('equipo.errorInvitar'),
      );
      return;
    }
    // S76-B4: los chips nacen CON la invitación (B0: legal por RLS sobre
    // la fila activo=false; inertes hasta la aceptación). El fallo de los
    // chips NO deshace la invitación — es un hecho que ya ocurrió y se
    // dice la verdad parcial (Ley 13), jamás un éxito redondo falso.
    const idsElegidos =
      invPrestador && oficios !== null
        ? oficios.filter((o) => invOficios.includes(o.oficio)).flatMap((o) => o.servicioIds)
        : [];
    let chipsFallaron = false;
    if (idsElegidos.length > 0) {
      const chipsR = await asignarServiciosEmpleado(r.data.empleadoId, idsElegidos);
      chipsFallaron = !chipsR.ok;
    }
    setOcupado(false);
    setHojaInvitar(false);
    setInvNombre('');
    setInvEmail('');
    setInvPrestador(false);
    setInvOficios([]);
    if (chipsFallaron) {
      mostrar({ variante: 'error', texto: t('equipo.invitarChipsError') });
    }
    await cargar();
  }

  // La voz del oficio (Ley 3) — reuso declarado de agenda.filtro* (los
  // mismos sustantivos de oficio del filtro del HOY, S61-B5/S69-B).
  const vozOficio = (o: OficioChip): string =>
    o === 'veterinaria'
      ? t('agenda.filtroVeterinaria')
      : o === 'grooming'
        ? t('agenda.filtroEstetica')
        : o === 'paseo'
          ? t('agenda.filtroPaseos')
          : t('agenda.filtroAdiestramiento');

  /**
   * EL ARRASTRE (S78-B punto 2) — el subtítulo dice QUÉ ATIENDE.
   * Antes era 100% role-driven y, como A2bis concede la fila `recepcion`
   * AL ENTRAR, le decía "Recepción" a todo el mundo — vet de seis chips
   * incluido. La fila `recepcion` es MEMBRESÍA, jamás IDENTIDAD
   * (LETRA_RECEPCION S76): `recepción ⟺ NOT EXISTS chip`.
   * Sin dato todavía leído: se OMITE (jamás una identidad inventada).
   */
  const subtituloMiembro = (m: MiembroEquipo): string | undefined => {
    if (m.roles.includes('dueño')) return t('equipo.rolDueno');
    if (!m.activo) return t('equipo.invitacionPendiente');
    const suyos = oficiosPorMiembro[m.empleadoId];
    if (suyos === undefined) return undefined;
    if (suyos.length === 0) return t('equipo.subtituloRecepcion');
    return ORDEN_OFICIOS.filter((o) => suyos.includes(o)).map(vozOficio).join(' · ');
  };

  // E1 (mesa): el aceptado SIN rol PRESIDE — primero en la lista, con su
  // acción dicha al lado (el paso NORMAL del flujo de dos pasos v1).
  const miembros =
    pantalla.estado === 'listo'
      ? [...pantalla.equipo.miembros]
          .filter((m) => m.activo)
          .sort((a, b) => Number(a.roles.length > 0) - Number(b.roles.length > 0))
      : [];

  const inicialesDe = (nombre: string): string =>
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('equipo.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={88} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
          <EstadoVacio
            registro="pantalla"
            titulo={t('equipo.errorCarga')}
            accion={<Boton variante="secundario" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />}
          />
        )}

        {pantalla.estado === 'listo' && (
          <>
            {/* ── LA FIRMA (MODELO_PRESENCIA §2 pieza 1) — nace COMPUESTA:
                nada se pregunta, todo sale de lo vivo. E7: ciudad null se
                OMITE. E2: LogoNegocio (packages/ui, S74-A) — contenido con
                aire y fondo, jamás recorte; sin foto_url productor todavía,
                el monograma honesto ES la cara (no hueco que gritar). ── */}
            <Tarjeta elevacion="reposo">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <LogoNegocio
                  nombre={pantalla.prestador.nombre_comercial}
                  logoUrl={resolverUrlLogoNegocio(pantalla.prestador.foto_url)}
                />
                <View style={{ flex: 1, gap: spacing[1] }}>
                  <Texto variante="titulo">{pantalla.prestador.nombre_comercial}</Texto>
                  {pantalla.prestador.ciudad !== null && pantalla.prestador.ciudad.length > 0 ? (
                    <Texto variante="apoyo">{pantalla.prestador.ciudad}</Texto>
                  ) : null}
                </View>
              </View>
            </Tarjeta>

            {pantalla.equipo.esDueno ? (
              <>
                {/* ── EL EQUIPO ── */}
                <View style={{ gap: spacing[3] }}>
                  <Texto variante="seccion">{t('equipo.seccion')}</Texto>
                  <Tarjeta relleno="ninguno">
                    {miembros.map((m, i) => (
                      <View key={m.empleadoId}>
                        {i > 0 ? <Separador /> : null}
                        <Celda
                          interactiva
                          accessibilityRole="button"
                          onPress={() => abrirMiembro(m)}
                          titulo={m.nombre}
                          subtitulo={subtituloMiembro(m)}
                        />
                      </View>
                    ))}
                  </Tarjeta>
                  {/* equipo de 1: el vacío no existe (el dueño siempre está);
                      la invitación serena vive bajo el CTA (boceto §3) */}
                  {miembros.length <= 1 ? (
                    <Texto variante="apoyo">{t('equipo.equipoDeUno')}</Texto>
                  ) : null}
                </View>

                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('equipo.invitarCta')}
                  onPress={() => {
                    setVozError(null);
                    setHojaInvitar(true);
                  }}
                />
              </>
            ) : (
              // E3: el no-dueño que aterriza por deep link — voz digna del
              // solo-lectura (S60): dice su porqué UNA vez, sin candados.
              <Texto variante="apoyo">{t('equipo.soloDueno')}</Texto>
            )}
          </>
        )}
      </ScrollView>

      {/* ══ S78-B · LA HOJA DEL MIEMBRO — PILA DE BLOQUES SOBRE PAPEL ══
          El monolito se rompió en el gate: cabecera SIN tarjeta · bloque
          de jornada tintado · UNA tarjeta por servicio · pie. La Hoja NO
          lleva `titulo`: el nombre vive en la cabecera con su avatar (si
          lo llevara, el nombre se diría dos veces — Chanel). ── */}
      <Hoja visible={miembro !== null} onCerrar={() => setMiembro(null)}>
        {miembro ? (
          <View style={{ padding: spacing[4], gap: spacing[4] }}>
            {/* ── [1] LA PERSONA — sin tarjeta, sobre el papel de la Hoja.
                NO se dibuja correo: `MiembroEquipo` no lo trae y el lector
                de contacto es hueco declarado del wrapper (D-455). Un
                correo inventado sería exactamente lo que L-139 prohíbe. ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: theme.bg.overlay,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Texto variante="cuerpo">{inicialesDe(miembro.nombre)}</Texto>
              </View>
              <View style={{ flex: 1, gap: spacing[1] }}>
                <Texto variante="titulo">{miembro.nombre}</Texto>
                {!miembro.activo ? (
                  <View style={{ alignSelf: 'flex-start' }}>
                    <Insignia estado="info" etiqueta={t('equipo.invitacionPendiente')} />
                  </View>
                ) : null}
              </View>
            </View>

            {miembro.roles.includes('dueño') ? (
              // §6.3 / L6: la Hoja del titular NO lleva ni controles ni baja
              // — el auto-lockout es hueco de MOTOR, no de esta pantalla.
              <View style={{ alignSelf: 'flex-start' }}>
                <Insignia estado="info" etiqueta={t('equipo.rolDueno')} />
              </View>
            ) : cargandoHoja ? (
              <EsqueletoGrupo>
                <View style={{ gap: spacing[3] }}>
                  <Esqueleto forma="bloque" ancho="100%" alto={96} />
                  <Esqueleto forma="bloque" ancho="100%" alto={180} />
                </View>
              </EsqueletoGrupo>
            ) : (
              <>
                {/* ── [2] LA JORNADA — PRESIDE (decisión founder S78).
                    §4bis: EL CHIP NO PROMETE DISPONIBILIDAD. Las 8 lectoras
                    entran por `prestador_horarios`; sin jornada esa persona
                    no aparece en NINGUNA reserva, tenga los chips que tenga.
                    DOS voces, porque son dos hechos con dos caminos: una
                    NUNCA cargó (se crea) · la otra la PAUSÓ (se reactiva).
                    Solo con ≥1 chip: sin chips no hay promesa que romper.

                    🔴 EL CTA NO SE DIBUJA, Y ES A PROPÓSITO (Ley 23 — la
                    puerta no ofrece lo que va a rechazar): NO EXISTE destino
                    de jornada por empleado. `SeccionHorarios` se monta desde
                    los cuatro talleres, keyea por `oficio` y no acepta
                    empleado; no hay ruta /horarios ni /jornada. Es D-540, y
                    es MOTOR de A. El bloque dice el hecho; el botón entra el
                    día que exista a dónde ir. ── */}
                {chips !== null && chips.length > 0 && jornada !== null && jornada.franjasActivas === 0 ? (
                  <Tarjeta tinte="warning" relleno="amplio">
                    <View style={{ gap: spacing[2] }}>
                      <Texto variante="seccion">
                        {jornada.franjasTotales === 0
                          ? t('equipo.jornadaSinTitulo')
                          : t('equipo.jornadaPausadaTitulo')}
                      </Texto>
                      <Texto variante="cuerpo">
                        {jornada.franjasTotales === 0
                          ? t('equipo.jornadaSinCuerpo')
                          : t('equipo.jornadaPausadaCuerpo')}
                      </Texto>
                    </View>
                  </Tarjeta>
                ) : null}

                {/* ── [3] QUÉ ATIENDE — UNA TARJETA POR SERVICIO ──
                    Encendida: superficie de card + elevación reposo, SIN
                    borde (regla Chanel del marco, Ley 20: borde + sombra
                    dicen lo mismo dos veces). Apagada: transparente + 1px
                    `border.default`, sin sombra. Cero divisores (Ley 18).
                    El glifo va PELADO a 27px, del registry, con la
                    primitiva Huella. Estado por el GLIFO ENTERO — la
                    declaración ① (huella como marcador) quedó RETIRADA. ── */}
                <View style={{ gap: spacing[2] }}>
                  <Texto variante="seccion">{t('equipo.atiendeSeccion')}</Texto>
                  <Texto variante="apoyo">{t('equipo.atiendeHint')}</Texto>

                  {chips !== null && chips.length === 0 && filasOficio.length === 0 ? (
                    <Texto variante="apoyo">{t('equipo.atiendeSinChips')}</Texto>
                  ) : null}

                  <View style={{ gap: spacing[2.5], marginTop: spacing[1] }}>
                    {filasOficio.map(({ oficio, encendido, ofertaApagada }) => {
                      const enConfirmacion = confirmaQuitar === oficio;
                      return (
                        <View key={oficio} style={{ gap: spacing[2] }}>
                          <TarjetaEstado
                            encendido={encendido}
                            etiqueta={vozOficio(oficio)}
                            onPress={() => void alternarOficio(miembro, oficio, !encendido)}
                          >
                            <IconoOficio
                              oficio={oficio}
                              color={encendido ? theme.text.primary : theme.text.tertiary}
                              colorHuella={encendido ? theme.accent.primary : theme.text.tertiary}
                            />
                            <View style={{ flex: 1, gap: spacing[0.5] }}>
                              <Texto variante="cuerpo">{vozOficio(oficio)}</Texto>
                              {ofertaApagada ? (
                                <Texto variante="apoyo">{t('equipo.ofertaApagada')}</Texto>
                              ) : null}
                            </View>
                            <ControlEstado
                              encendido={encendido}
                              colorEncendido={theme.accent.primary}
                              colorBorde={theme.border.default}
                              colorCheck={theme.accent.ctaTexto}
                            />
                          </TarjetaEstado>

                          {/* ── EL ACTO CLÍNICO (§4): quitar el ÚLTIMO chip
                              médico le saca a esa persona EL EXPEDIENTE. No
                              se ejecuta al toque — se dice ANTES, EN EL
                              LUGAR, con dos toques. Jamás Hoja anidada. ── */}
                          {enConfirmacion ? (
                            <Tarjeta tinte="danger" relleno="amplio">
                              <View style={{ gap: spacing[3] }}>
                                <Texto variante="seccion">{t('equipo.clinicoTitulo')}</Texto>
                                <Texto variante="cuerpo">
                                  {t('equipo.clinicoCuerpo', {
                                    oficio: vozOficio(oficio),
                                    nombre: miembro.nombre,
                                  })}
                                </Texto>
                                <Boton
                                  variante="destructivo"
                                  bloque
                                  cargando={ocupado}
                                  etiqueta={t('equipo.clinicoConfirmar', { oficio: vozOficio(oficio) })}
                                  onPress={() => void alternarOficio(miembro, oficio, false)}
                                />
                              </View>
                            </Tarjeta>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* ── [4] ⟨LUGAR RESERVADO — Administrador⟩ · NO SE DIBUJA.
                    La reserva es de ORDEN, no de píxeles: cuando su motor
                    llegue (D-513 v2 + D-517 CLASE 2) entra acá sin
                    reordenar nada. Cero placeholder, cero toggle apagado,
                    cero "próximamente" — Ley 23. ── */}

                <Separador />

                {/* ── [5] EL PIE — desvincular COMPACTO (enmienda del gate:
                    que el teal del oficio presida solo) + el aviso de
                    §11.3 ANTES del acto. SIN NÚMERO: no existe lector de
                    citas futuras por empleado, y L-139 prohíbe el número
                    plausible. El conteo REAL llega del RPC de baja, y se
                    dice DESPUÉS porque ahí ya es un hecho. ── */}
                <View style={{ gap: spacing[2] }}>
                  {confirmaDesvincular ? (
                    <View style={{ gap: spacing[3] }}>
                      <Texto variante="cuerpo">
                        {t('equipo.desvincularConfirma', { nombre: miembro.nombre })}
                      </Texto>
                      <Boton
                        variante="destructivo"
                        bloque
                        cargando={ocupado}
                        etiqueta={t('equipo.desvincularCta')}
                        onPress={() => void desvincular(miembro)}
                      />
                    </View>
                  ) : (
                    <Boton
                      variante="compacto"
                      bloque
                      etiqueta={t('equipo.desvincularCta')}
                      onPress={() => setConfirmaDesvincular(true)}
                    />
                  )}
                  <Texto variante="apoyo">{t('equipo.desvincularAviso')}</Texto>
                </View>
              </>
            )}
            {vozError !== null ? <Texto variante="apoyo">{vozError}</Texto> : null}
          </View>
        ) : null}
      </Hoja>

      {/* ── Hoja: invitar (camino v1 SIN rol — E4 de la vara: el CHECK de
          la invitación solo admite 'empleado'; el rol se asigna cuando la
          persona aparece, y E1 la hace presidir). La Hoja cubre el teclado
          (casa (a) del patrón D-498); L-162: gate con teclado arriba. ── */}
      <Hoja visible={hojaInvitar} onCerrar={() => setHojaInvitar(false)} titulo={t('equipo.invitarTitulo')}>
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <Campo label={t('equipo.invitarNombre')} value={invNombre} onChangeText={setInvNombre} />
          <Campo
            label={t('equipo.invitarEmail')}
            value={invEmail}
            onChangeText={setInvEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Texto variante="apoyo">{t('equipo.invitarAyuda')}</Texto>

          {/* ── S76-B4: EL SELECTOR DE DOS (LETRA_RECEPCION §1) ──
              Recepción es el DEFAULT y no se elige — la puerta no
              pregunta lo que ya sabe, pero LO DICE (corolario S73).
              Toggle Prestador → chips a grano de OFICIO (§6: la
              pantalla escribe oficio, el motor guarda las ofertas).
              EL TOGGLE ADMINISTRADOR NO SE OFRECE (§5): su motor no
              existe (D-513 v2 + D-517 CLASE 2) y un toggle que rebota
              al guardar es Ley 23 rota — entra cuando su motor entre.
              oficios null (no legibles) u [] (sin ofertas activas):
              el toggle no se monta y el flujo de dos pasos queda
              entero (§5 regla 2 — invitar sin rol sigue siendo camino). */}
          {oficios !== null && oficios.length > 0 && (
            <View style={{ gap: spacing[3] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Texto variante="cuerpo">{t('equipo.invitarPrestadorToggle')}</Texto>
                <Interruptor
                  encendido={invPrestador}
                  onCambio={(v) => {
                    setInvPrestador(v);
                    if (!v) setInvOficios([]);
                  }}
                  etiqueta={t('equipo.invitarPrestadorToggle')}
                  registro="oficio"
                />
              </View>
              {invPrestador && (
                <SelectorOpcion
                  etiqueta={t('equipo.invitarOficiosLabel')}
                  multiple
                  acento="oficio"
                  opciones={oficios.map((o) => ({ codigo: o.oficio, etiqueta: vozOficio(o.oficio) }))}
                  seleccionadas={invOficios}
                  onSelect={(codigo) =>
                    setInvOficios((prev) =>
                      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
                    )
                  }
                />
              )}
              <Texto variante="apoyo">{t('equipo.invitarPisoAyuda')}</Texto>
            </View>
          )}

          {vozError !== null ? <Texto variante="apoyo">{vozError}</Texto> : null}
          <Boton
            variante="primario"
            bloque
            cargando={ocupado}
            deshabilitado={
              invNombre.trim().length === 0 ||
              invEmail.trim().length === 0 ||
              // Ley 23: el toggle prendido SIN oficio elegido es una
              // promesa vacía — se completa o se apaga, no se envía a
              // medias (el rebote sería silencioso: cero filas).
              (invPrestador && invOficios.length === 0)
            }
            etiqueta={t('equipo.invitarEnviar')}
            onPress={() => void invitar()}
          />
        </View>
      </Hoja>
    </View>
  );
}
