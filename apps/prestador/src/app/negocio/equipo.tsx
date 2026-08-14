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
  EvitaTeclado,
  FilaDato,
  Hoja,
  Insignia,
  Interruptor,
  LogoNegocio,
  MarcaDeAgua,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  palette,
  radius,
  spacing,
  useAviso,
  useTheme,
  TarjetaEstado,
} from '@epetplace/ui';
import {
  actualizarExponePersonas,
  asignarRolEmpleado,
  quitarRolEmpleado,
  type RolEquipo,
  asignarServiciosEmpleado,
  desvincularEmpleado,
  guardarMatriculaEmpleado,
  invitarEmpleado,
  obtenerChipsEmpleado,
  obtenerMatriculaEmpleado,
  obtenerEquipoNegocio,
  obtenerJornadaEmpleado,
  obtenerMiCuentaComercial,
  obtenerMiPosicionEnPrestador,
  obtenerMiPrestador,
  obtenerOficiosNegocio,
  puedeOfrecerRolRecepcion,
  quitarServiciosEmpleado,
  resolverUrlLogoNegocio,
  type ChipEmpleado,
  type EquipoNegocio,
  type JornadaEmpleado,
  type MatriculaEmpleado,
  type MiembroEquipo,
  type MiPrestador,
  type OficioChip,
  type OficioNegocio,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';
import { ControlEstado, IconoOficio } from '@/components/iconos-oficio';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; prestador: MiPrestador; equipo: EquipoNegocio };

/** El orden de los oficios en toda superficie del prestador (el mismo del
 *  filtro del HOY). Fijo: la lista no se reordena según quién se la mire. */
const ORDEN_OFICIOS: readonly OficioChip[] = ['veterinaria', 'grooming', 'paseo', 'adiestramiento'];

/** S78-B · EL GATE MECÁNICO DE LA VITRINA, del lado de la puerta: el
 *  trigger de A7 rebota el encendido mientras `notificar_reasignacion_cita`
 *  no exista — y HOY no existe (medido en la migración s78a7). `false`
 *  hasta que A entregue el LECTOR del gate (pedido emitido): conservador
 *  solo puede SUB-ofrecer, jamás rebotar (Ley 23). */
const VITRINA_GATE_ABIERTO = false;

/** EL PUENTE a la jornada (S78-B, hallazgo del gate founder): la ruta del
 *  taller de cada oficio — los cuatro aceptan `?seccion=horarios` (el de
 *  adiestramiento es página única: el param sobra y no daña) y
 *  `?persona=<empleadoId>` (S78-B). */
const RUTA_TALLER = {
  veterinaria: '/veterinaria/taller',
  grooming: '/grooming/taller',
  paseo: '/paseo/taller',
  adiestramiento: '/adiestramiento/taller',
} as const satisfies Record<OficioChip, string>;

/** El oficio del destino: el PRIMER oficio con chip en el orden fijo de la
 *  casa (voto founder: sin selector para un caso — multi-oficio — que hoy
 *  no existe en datos; las Jornadas del taller ya muestran a la persona). */
const oficioDestino = (chips: ChipEmpleado[]): OficioChip | null =>
  ORDEN_OFICIOS.find((o) => chips.some((c) => c.oficio === o)) ?? null;

// La anatomía on/off firmada acá se EXTRAJO cuando el selector de
// Jornadas (S78-B turnos) se volvió su segundo consumidor — una sola
// definición, cero clones (Ley 19 en espíritu). Con cuatro superficies
// vivas PROMOVIÓ a `@epetplace/ui` como `TarjetaEstado` (S83-B1).

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
  // OFRECE **AL INVITAR** — ⏪ S97-D: esta nota decía «esa pantalla no
  // existe. Sin lámina no se dibuja», y quedó FALSA el día que la Hoja del
  // miembro ganó su cuarto bloque. Se corrige en vez de dejarse: una prosa
  // que niega algo construido manda a construirlo dos veces.
  // Lo que rige HOY, y es distinto: el rol se da **sobre una persona que ya
  // está en el equipo** (la Hoja del miembro), no en la invitación. El
  // porqué es de letra: nombrar administradores exige el aviso de §6 ANTES
  // del acto (S74), y una invitación es una promesa a futuro sobre alguien
  // que todavía no aceptó — el aviso llegaría antes que la persona.
  // null en oficios = no legibles: el toggle
  // no se ofrece (ausencia ante la duda; el flujo de dos pasos queda).
  const [oficios, setOficios] = useState<OficioNegocio[] | null>(null);
  const [invPrestador, setInvPrestador] = useState(false);
  const [invOficios, setInvOficios] = useState<string[]>([]);

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  /** ⭐ S88-C (D-664): GESTIÓN dicha por el servidor — null = sin
   *  confirmar (la pantalla no llega a 'listo' sin él). */
  const [gestiona, setGestiona] = useState<boolean | null>(null);
  /** ⭐ S97-D · TITULARIDAD dicha por el servidor, y es OTRA pregunta que
   *  `gestiona`: el administrador GESTIONA (D-660) y **no nombra
   *  administradores** — eso es del titular y solo del titular
   *  (`LETRA_ROLES_EQUIPO_S74`, firma del founder; la mesa había propuesto
   *  que el administrador también, y el founder lo bajó). Sin este dato el
   *  bloque [4] tendría que deducir la titularidad, y deducir un permiso es
   *  cómo nacen los gates decorativos. `null` = sin confirmar. */
  const [esTitular, setEsTitular] = useState<boolean | null>(null);
  /* ⭐ S97-D · ¿SE PUEDE OFRECER RECEPCIÓN EN ESTE EQUIPO?
     (`LA_CASA_DEL_PRESTADOR` §2.3, firma founder 13-ago — Ley 23 aplicada al
     alta de personas: la puerta no ofrece lo que no existe.)

     ⚠️ LOS TRES ESTADOS NO SON DOS, y de eso depende que esto no mienta:
     `true` = se ofrece · `false` = el server DIJO que no · **`null` = no se
     pudo preguntar, y eso NO es un no**. Solo se esconde con `false`
     explícito — la permisividad la declara el propio wrapper (D-792) y la
     razón es L-139: un `false` fabricado por un fallo de red diría «este
     negocio no atiende en su local», que es una afirmación sobre el negocio
     que nadie hizo. Esconder un rol por un error de red es decidir permisos
     con información que no tenemos. */
  const [puedeRecepcion, setPuedeRecepcion] = useState<boolean | null>(null);
  /** El segundo toque del toggle Administrador: `null` = nadie esperando ·
   *  `'dar'` / `'quitar'` = el aviso está a la vista y falta confirmar
   *  (§6: el aviso va ANTES del acto, jamás como resultado). */
  const [confirmaAdmin, setConfirmaAdmin] = useState<'dar' | 'quitar' | null>(null);

  // ── S78-B: el estado de la Hoja del miembro ──
  const [chips, setChips] = useState<ChipEmpleado[] | null>(null);
  const [jornada, setJornada] = useState<JornadaEmpleado | null>(null);
  const [cargandoHoja, setCargandoHoja] = useState(false);
  /** El oficio cuyo apagado dejaría a la persona SIN capacidad clínica y
   *  espera el segundo toque (§4: no se ejecuta al toque, se informa). */
  const [confirmaQuitar, setConfirmaQuitar] = useState<OficioChip | null>(null);

  /* ⭐ S90-B (D-676) · LA MATRÍCULA DE LA PERSONA — el estado de su bloque.
     `null` = todavía no leída; su fallo NO tumba la Hoja (el resto del
     miembro se sigue operando) pero TAMPOCO se disfraza de "no tiene":
     afirmar ausencia sobre algo que no se pudo leer es exactamente lo que
     L-197 prohíbe — por eso el bloque solo habla con dato en la mano. */
  const [matricula, setMatricula] = useState<MatriculaEmpleado | null>(null);
  const [editandoMat, setEditandoMat] = useState(false);
  const [matNumero, setMatNumero] = useState('');
  const [matPais, setMatPais] = useState('');
  const [guardandoMat, setGuardandoMat] = useState(false);
  const [errorMat, setErrorMat] = useState<string | null>(null);
  // EL ARRASTRE (S78-B punto 2) MIGRÓ A D-547: `MiembroEquipo.oficios`
  // viaja en el lector de equipo — el 2×N por fila que esta pantalla
  // pagaba (y declaraba) MURIÓ (A `dc08147`: "B migra cuando quiera").

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
    /* ⭐ S88-C (D-664) · LA POSICIÓN LA DICE EL SERVIDOR, y esta pantalla
       pregunta por GESTIÓN (orden de mesa): D-660 le dio al administrador
       poder sobre el equipo y el founder lo gateó — el admin ganó esta
       superficie y no la pierde. Se resuelve ANTES de 'listo': cero
       parpadeo entre solo-lectura y edición. Su fallo NO abre (Ley 23):
       cae a error con reintento, jamás a un rol adivinado. */
    /* ⭐ S97-D · el lector de §2.3 entra al MISMO Promise.all — cero
       round-trip extra (la lección de D-531: una pantalla que abre con una
       cascada en serie ya costó 579 ms una vez).
       ⚠️ Y su fallo NO tumba la pantalla, a diferencia de los otros dos:
       equipo y posición son la pantalla; esto solo decide si se NOMBRA un
       rol. Caer a error por no poder responder una pregunta accesoria sería
       apagar la gestión del equipo entera por un detalle de copy. */
    const [equipo, posicion, recepcion] = await Promise.all([
      obtenerEquipoNegocio(cuenta.data.id),
      obtenerMiPosicionEnPrestador(prestador.data.id),
      puedeOfrecerRolRecepcion(prestador.data.id),
    ]);
    if (!equipo.ok || !posicion.ok) {
      setPantalla({ estado: 'error', mensaje: t('equipo.errorCarga') });
      return;
    }
    setGestiona(posicion.data.gestiona);
    setEsTitular(posicion.data.esTitular);
    setPuedeRecepcion(recepcion.ok ? recepcion.data : null);
    setPantalla({ estado: 'listo', prestador: prestador.data, equipo: equipo.data });

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
    setMatricula(null);
    setEditandoMat(false);
    setErrorMat(null);
    setMiembro(m);
    if (m.roles.includes('dueño')) return;
    setCargandoHoja(true);
    // ⭐ S90-B: la matrícula entra al MISMO Promise.all — cero round-trip
    // extra de latencia (la lección de D-531: una Hoja que abre con una
    // cascada en serie ya costó 579 ms una vez).
    void Promise.all([
      obtenerChipsEmpleado(m.empleadoId),
      obtenerJornadaEmpleado(m.empleadoId),
      obtenerMatriculaEmpleado(m.empleadoId),
    ]).then(([rc, rj, rm]) => {
      setCargandoHoja(false);
      if (rc.ok) setChips(rc.data);
      else setVozError(t('equipo.errorCarga'));
      if (rj.ok) setJornada(rj.data);
      // Su fallo NO tumba la Hoja y NO se disfraza de "no tiene": el
      // bloque se queda callado hasta tener el dato (L-197).
      if (rm.ok) {
        setMatricula(rm.data);
        setMatNumero(rm.data.matricula ?? '');
        // P21 AFILADA («proponer no es deducir»): el país del NEGOCIO se
        // ofrece como punto de partida EDITABLE cuando la persona todavía
        // no declaró el suyo. No se deriva ni se guarda solo: si el gestor
        // no toca nada y no guarda, no se escribe nada.
        setMatPais(
          rm.data.paisEmisor ??
            (pantalla.estado === 'listo' ? (pantalla.prestador.country_code ?? '') : ''),
        );
      }
    });
  }

  /** ⭐ S90-B (D-676) — guarda la matrícula de ESTA persona. El país viaja
   *  con el número: un registro profesional sin su emisor no identifica
   *  nada. La superficie es del GESTOR (esta Hoja), no de la persona. */
  async function guardarMatricula(empleadoId: string) {
    setErrorMat(null);
    setGuardandoMat(true);
    const r = await guardarMatriculaEmpleado(empleadoId, matNumero, matPais);
    setGuardandoMat(false);
    if (!r.ok) {
      setErrorMat(r.mensaje);
      return;
    }
    setMatricula(r.data);
    setEditandoMat(false);
    mostrar({ variante: 'neutro', texto: t('equipo.matriculaGuardada') });
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
    if (rc.ok) setChips(rc.data);
  }

  async function alternarVitrina(valor: boolean) {
    if (ocupado || pantalla.estado !== 'listo') return;
    setOcupado(true);
    const r = await actualizarExponePersonas(pantalla.prestador.id, valor);
    setOcupado(false);
    if (!r.ok) {
      // el rebote del gate viaja TIPADO: la voz dice el porqué exacto
      mostrar({
        variante: 'error',
        texto:
          r.codigo === 'aviso_reasignacion_no_existe'
            ? t('equipo.vitrinaRebote')
            : t('equipo.errorEscritura'),
      });
      return;
    }
    await cargar();
  }

  /** ⭐ S97-D · DAR O QUITAR EL ROL ADMINISTRADOR.
   *
   *  El motor existe desde D-660 (5-ago-2026, gateado): 19 policies cuelgan
   *  de `user_gestiona_prestador`, que ya resuelve titular OR administrador.
   *  Lo único que faltaba era esta puerta.
   *
   *  ⚠️ EL SERVIDOR SIGUE SIENDO LA AUTORIDAD. Este handler no se llama sin
   *  `esTitular`, pero eso es CORTESÍA (Ley 23: la puerta no ofrece lo que
   *  va a rechazar), no la validación — la RLS de `empleado_roles` decide.
   *  Un gate que solo vive en la pantalla es decorativo.
   *
   *  ⚠️ Y NO se optimiza el estado local: tras escribir se RECARGA. El rol
   *  cambia lo que esa persona puede hacer en 19 policies — pintar el
   *  toggle encendido sin confirmar que el server lo aceptó sería decirle
   *  al titular que entregó un poder que quizá no entregó. */
  async function alternarAdministrador(m: MiembroEquipo, encender: boolean) {
    if (ocupado) return;
    setOcupado(true);
    setVozError(null);
    const r = encender
      ? await asignarRolEmpleado(m.empleadoId, 'administrador')
      : await quitarRolEmpleado(m.empleadoId, 'administrador');
    setOcupado(false);
    setConfirmaAdmin(null);
    if (!r.ok) {
      setVozError(t('equipo.adminError'));
      return;
    }
    // La Hoja lee de `miembro`, que es una FOTO de la lista: sin esto el
    // toggle volvería a su posición vieja hasta cerrar y reabrir.
    const roles: RolEquipo[] = encender
      ? [...m.roles, 'administrador']
      : m.roles.filter((x) => x !== 'administrador');
    setMiembro({ ...m, roles });
    await cargar();
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
              : r.codigo === 'no_gestiona'  // D-660: el rename lo forzó el motor
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
    if (m.oficios.length === 0) return t('equipo.subtituloRecepcion');
    return ORDEN_OFICIOS.filter((o) => m.oficios.includes(o)).map(vozOficio).join(' · ');
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
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('equipo.titulo')} atras onAtras={() => router.back()} />
      {/* ⭐ S86-C · D-498 — esta pantalla abre teclado y no portaba la
          pieza. `adjustResize` del manifest es LETRA MUERTA bajo
          edge-to-edge (SDK 57): la ventana no se achica y el campo
          enfocado queda DEBAJO del teclado. Envuelve al ScrollView SIN
          re-indentar su contenido — la forma de `login.tsx`. */}
      <EvitaTeclado>
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

            {/* ⏪ S88-C (D-664, 5-ago-2026): acá gateaba `equipo.esDueno` —
                la derivación «leí ≥1 fila = dueño», que medida daba TRUE
                PARA LOS CUATRO ROLES (la fila recepcion de A2bis se la
                devolvía a todos). Ahora pregunta GESTIÓN al servidor. */}
            {gestiona === true ? (
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

                {/* ── S78-B · LA VITRINA (LETRA_VITRINA A1bis + motor A7).
                    Se monta SOLO con 2+ personas OFERTABLES (con oficio) —
                    con una, el concepto no existe (la estructura de
                    Jornadas). Y SOLO con el gate mecánico ABIERTO: el
                    trigger de A7 rebota el encendido hasta que exista
                    `notificar_reasignacion_cita`, y un toggle que rebota
                    al guardar es Ley 23 rota (el precedente literal del
                    Administrador, esta misma pantalla L426-428). HOY el
                    gate está CERRADO (medido: cero productor del aviso a
                    la familia) ⇒ la sección no se dibuja; el LECTOR del
                    gate (`puede_encender_vitrina`) es PEDIDO A A — cuando
                    llegue, la constante muere y esto se enciende solo. ── */}
                {VITRINA_GATE_ABIERTO &&
                  miembros.filter((m) => m.oficios.length > 0).length >= 2 && (
                    <View style={{ gap: spacing[2] }}>
                      <Texto variante="seccion">{t('equipo.vitrinaSeccion')}</Texto>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Texto variante="cuerpo">{t('equipo.vitrinaToggle')}</Texto>
                        <Interruptor
                          encendido={pantalla.prestador.expone_personas === true}
                          onCambio={(v) => void alternarVitrina(v)}
                          registro="oficio"
                          etiqueta={t('equipo.vitrinaToggle')}
                        />
                      </View>
                      {/* la voz honesta de qué cambia PARA LA FAMILIA */}
                      <Texto variante="apoyo">
                        {pantalla.prestador.expone_personas === true
                          ? t('equipo.vitrinaEncendida')
                          : t('equipo.vitrinaApagada')}
                      </Texto>
                    </View>
                  )}
              </>
            ) : (
              // E3: el no-dueño que aterriza por deep link — voz digna del
              // solo-lectura (S60): dice su porqué UNA vez, sin candados.
              <Texto variante="apoyo">{t('equipo.soloDueno')}</Texto>
            )}
          </>
        )}
      </ScrollView>
      </EvitaTeclado>

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

                    EL PUENTE (hallazgo del gate founder, 26-jul): el CTA
                    que esta construcción dejó declarado-sin-destino AHORA
                    TIENE destino (A2 + turnos `44c94cb`). Navega a Días y
                    horarios del taller del PRIMER oficio con chip (voto
                    founder: sin selector para un caso que hoy no existe en
                    datos) con ?persona= — la persona llega SELECCIONADA.
                    La regla de siempre: se monta SOLO si resuelve; el
                    bloque solo se pinta con ≥1 chip, así que el destino
                    resuelve siempre que el CTA exista. ── */}
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
                      {oficioDestino(chips) !== null ? (
                        <Boton
                          variante="primario"
                          bloque
                          etiqueta={
                            jornada.franjasTotales === 0
                              ? t('equipo.jornadaCargarCta')
                              : t('equipo.jornadaVerCta')
                          }
                          onPress={() => {
                            const destino = oficioDestino(chips);
                            if (destino === null) return;
                            const empleadoId = miembro.empleadoId;
                            setMiembro(null);
                            router.push({
                              pathname: RUTA_TALLER[destino],
                              params: { seccion: 'horarios', persona: empleadoId },
                            });
                          }}
                        />
                      ) : null}
                    </View>
                  </Tarjeta>
                ) : null}

                {/* ── ⭐ [2bis] LA MATRÍCULA — S90-B, D-676 ──
                    HERMANA DEL BLOQUE DE JORNADA, y por eso vive acá pegada
                    a él: las dos contestan la MISMA pregunta del gestor —
                    «¿por qué esta persona no recibe citas?». La jornada dice
                    que no tiene horario; ésta, que no tiene credencial.

                    SOLO LO MÉDICO LA PIDE, y la regla NO se re-implementa:
                    se lee `esMedico` de los chips, que es el mismo
                    `tipos_servicio.es_medico` con el que el motor decide en
                    `_empleado_matricula_ok` (cinturón: lo no-médico devuelve
                    true sin mirar la matrícula). Se usa el chip VIVO y no el
                    `tieneChipMedico` de la lista, porque el gestor puede
                    encender veterinaria acá mismo y el flag de la lista
                    quedaría viejo.

                    SIN REGAÑO Y SIN URGENCIA ARTIFICIAL (letra de la orden):
                    el tinte es `warning`, jamás `danger` — el que ya existía
                    tiene gracia. **Y NO SE PINTA NINGÚN CONTADOR DE DÍAS**:
                    el lector `vets_sin_matricula()` calcula su
                    `dias_de_gracia` contra el 1-SEP mientras el gate de
                    `_empleado_matricula_ok` corta el 15-AGO — hoy eso son 25
                    contra 8. Publicar ese número sería decirle al titular que
                    tiene tres semanas cuando le quedan ocho días. Va a la
                    mesa como hallazgo; acá se dice la FECHA, que es la que
                    las dos mitades sí comparten. ── */}
                {chips !== null && chips.some((c) => c.esMedico) && matricula !== null ? (
                  matricula.matricula !== null && !editandoMat ? (
                    // CARGADA — dato exacto, voz de máquina (Ley 3): una
                    // credencial es dato, no prosa.
                    <View style={{ gap: spacing[2] }}>
                      <FilaDato
                        etiqueta={t('equipo.matriculaEtiqueta')}
                        valor={
                          matricula.paisEmisor !== null
                            ? `${matricula.matricula} · ${matricula.paisEmisor}`
                            : matricula.matricula
                        }
                        mono
                      />
                      <View style={{ alignSelf: 'flex-start' }}>
                        <Boton
                          variante="compacto"
                          etiqueta={t('equipo.matriculaEditar')}
                          onPress={() => {
                            setMatNumero(matricula.matricula ?? '');
                            setMatPais(matricula.paisEmisor ?? '');
                            setErrorMat(null);
                            setEditandoMat(true);
                          }}
                        />
                      </View>
                    </View>
                  ) : (
                    <Tarjeta tinte="warning" relleno="amplio">
                      <View style={{ gap: spacing[3] }}>
                        <Texto variante="seccion">{t('equipo.matriculaTitulo')}</Texto>
                        <Texto variante="cuerpo">
                          {t('equipo.matriculaCuerpo', { nombre: miembro.nombre })}
                        </Texto>
                        <Campo
                          label={t('equipo.matriculaEtiqueta')}
                          value={matNumero}
                          onChangeText={setMatNumero}
                          autoCapitalize="characters"
                          error={errorMat ?? undefined}
                        />
                        {/* P21 · «proponer no es deducir»: se PROPONE el país
                            del negocio como punto de partida editable —
                            jamás se deriva ni se escribe solo. */}
                        <Campo
                          label={t('equipo.matriculaPaisEtiqueta')}
                          ayuda={t('equipo.matriculaPaisAyuda')}
                          value={matPais}
                          onChangeText={setMatPais}
                          autoCapitalize="characters"
                          maxLength={2}
                        />
                        <Boton
                          variante="primario"
                          bloque
                          cargando={guardandoMat}
                          etiqueta={t('equipo.matriculaGuardar')}
                          onPress={() => void guardarMatricula(miembro.empleadoId)}
                        />
                        {/* La salida, SOLO cuando hay a dónde volver: si la
                            matrícula ya existía, editarla tiene que poder
                            deshacerse sin cerrar la Hoja entera. Cuando NO
                            existe no se ofrece — no hay estado anterior al
                            que volver, y un «Cancelar» que no cancela nada
                            es un control que miente. */}
                        {matricula.matricula !== null ? (
                          <Boton
                            variante="sinCaja"
                            bloque
                            etiqueta={t('equipo.matriculaCancelar')}
                            onPress={() => {
                              setMatNumero(matricula.matricula ?? '');
                              setMatPais(matricula.paisEmisor ?? '');
                              setErrorMat(null);
                              setEditandoMat(false);
                            }}
                          />
                        ) : null}
                      </View>
                    </Tarjeta>
                  )
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
                            {/* S82-B (cobro del lint R5, Ley 21/22): el
                                slot accent.cta* es de Boton — el check
                                sobre fill SÓLIDO va en blanco, como el
                                thumb del Interruptor (Ley 22: "contenido
                                en blanco/papel"). */}
                            <ControlEstado
                              encendido={encendido}
                              colorEncendido={theme.accent.primary}
                              colorBorde={theme.border.default}
                              colorCheck={palette.white}
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

                {/* ── [4] ⭐ S97-D · ADMINISTRADOR — el cuarto bloque OCUPA
                    su lugar reservado, sin reordenar nada (la reserva de
                    S88-C era de ORDEN y se respeta al pie de la letra).

                    HERMANO del toggle Prestador de la Hoja de invitar, y
                    eso es deliberado: mismo trabajo (estado BINARIO) ⇒
                    mismo control (`Interruptor`, Ley 22 SÓLIDO + diccionario
                    19), mismo `registro="oficio"`. No se inventó una forma
                    nueva para un trabajo que la casa ya resuelve.

                    ⚠️ SOLO EL TITULAR (letra S74, firma del founder — la
                    mesa proponía que el administrador también y el founder
                    lo bajó). Para un gestor NO titular el bloque NO SE
                    DIBUJA: Ley 23, la puerta no ofrece lo que va a
                    rechazar. `esTitular === null` (sin confirmar) tampoco
                    dibuja — ante la duda, ausencia; un permiso adivinado
                    es peor que un permiso que falta.

                    ⚠️ EL AVISO DE §6 ES UN PLACEHOLDER DECLARADO Y SE VE
                    QUE LO ES. Su literal está FIRMADO por el founder en
                    `LETRA_ROLES_EQUIPO_S74` §6 y **no viajó a esta pista**
                    (L-142: lo que no llegó como texto no se reconstruye de
                    memoria). Se eligió un placeholder que GRITA en vez de
                    uno plausible a propósito: si esto llegara a un gate sin
                    su firma, el founder lo ve en un segundo — un texto
                    verosímil pero inventado no se descubre nunca (L-139).

                    ⚠️ Y la nota de oficio de S74 que SÍ viajó y sí rige: el
                    botón dice «dar el rol», JAMÁS «hacerla administradora»
                    — el género no se resuelve desde un nombre. ── */}
                {esTitular === true && (
                  <>
                    <Separador />
                    <View style={{ gap: spacing[3] }}>
                      <Texto variante="seccion">{t('equipo.adminTitulo')}</Texto>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: spacing[3],
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Texto variante="cuerpo">{t('equipo.adminToggle')}</Texto>
                        </View>
                        <Interruptor
                          encendido={miembro.roles.includes('administrador')}
                          onCambio={(v) => setConfirmaAdmin(v ? 'dar' : 'quitar')}
                          etiqueta={t('equipo.adminToggle')}
                          registro="oficio"
                        />
                      </View>
                      <Texto variante="apoyo">{t('equipo.adminAyuda')}</Texto>

                      {/* El aviso ANTES del acto (§6) — mismo patrón de dos
                          toques que ya usan «quitar oficio clínico» y
                          «desvincular»: el toggle ABRE la pregunta, el
                          botón la ejecuta. Sin esto, entregar el gobierno
                          del negocio costaría un toque accidental. */}
                      {confirmaAdmin !== null && (
                        <Tarjeta tinte="warning" relleno="amplio">
                          <View style={{ gap: spacing[3] }}>
                            <Texto variante="cuerpo">
                              {confirmaAdmin === 'dar'
                                ? t('equipo.adminAvisoPENDIENTE', { nombre: miembro.nombre })
                                : t('equipo.adminQuitarAviso', { nombre: miembro.nombre })}
                            </Texto>
                            <Boton
                              variante={confirmaAdmin === 'dar' ? 'primario' : 'destructivo'}
                              bloque
                              cargando={ocupado}
                              etiqueta={
                                confirmaAdmin === 'dar' ? t('equipo.adminDarCta') : t('equipo.adminQuitarCta')
                              }
                              onPress={() =>
                                void alternarAdministrador(miembro, confirmaAdmin === 'dar')
                              }
                            />
                            <Boton
                              variante="compacto"
                              bloque
                              etiqueta={t('equipo.adminCancelar')}
                              onPress={() => setConfirmaAdmin(null)}
                            />
                          </View>
                        </Tarjeta>
                      )}
                    </View>
                  </>
                )}

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
              EL TOGGLE ADMINISTRADOR NO SE OFRECE **ACÁ** — ⏪ S97-D: ya
              existe, pero en la Hoja del miembro (bloque [4]), sobre una
              persona que YA aceptó. ⏪ S88-C: la razón
              vieja («su motor no existe», D-513 v2) CADUCÓ el 5-ago-2026
              con D-660. La vigente es de LETRA: nombrar administradores
              es del TITULAR con su aviso (S74 §6), y esa superficie no
              tiene lámina — sin ella, dibujarlo acá re-decidiría la
              letra desde una pantalla.
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
              {/* ⭐ S97-D · §2.3 — LA REGLA CONDICIONAL DE RECEPCIÓN.
                  Esta línea es LA que ofrece el rol («sin servicios
                  activados, entra como recepción»), así que es LA que la
                  regla apaga.

                  ⚠️ EL PREDICADO VIVO NO ERA EL DE LA LETRA, y por eso esto
                  no era un no-op: el bloque entero ya se gatea en
                  `oficios.length > 0`, que apaga al VENDEDOR PURO por
                  accidente —el caso que la letra nombra— pero deja pasar al
                  negocio que tiene servicios y NINGUNO con atención en
                  local. Ese es el hueco que el lector del server cierra.

                  ⚠️ SOLO CON `false` EXPLÍCITO (ver el estado): con `null`
                  la línea SE MUESTRA. La permisividad es la declarada en
                  D-792 y no una omisión — hoy `atiende_local` es
                  `DEFAULT true` en 32 de 33 filas vivas, así que este guard
                  discrimina el borde que importa y es permisivo en el
                  centro hasta que alguien toque el toggle del paso ②. */}
              {puedeRecepcion !== false && (
                <Texto variante="apoyo">{t('equipo.invitarPisoAyuda')}</Texto>
              )}
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
