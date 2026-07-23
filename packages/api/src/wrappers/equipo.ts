// EQUIPO DEL NEGOCIO (S74-B, LETRA_EQUIPO — PORTAL_PRESTADOR §14): la
// ventana v1 compuesta sobre lo VIVO, cero motor nuevo.
//
// Decisión E5 de la vara (extender-vs-nuevo, DECLARADA): NO se ensancha
// `obtener_empleados_cuenta` — sirve a OTRO trabajo (el selector de
// "Fijar fecha") con OTRO gate (`_user_opera_cuenta_comercial`, cualquier
// operador); ensancharlo cambiaría su gate o forzaría a su consumidor a
// descartar campos. La verdad única es la TABLA + `empleado_tiene_rol`
// (§14.4), no el lector: este wrapper COMPONE el RPC vivo + las lecturas
// RLS de `empleado_roles` (las tres policies dueño-only por la puerta
// única, enmienda v3). El pedido D-455 que QUEDA para el lector server-side
// es contacto de miembros + lista de invitaciones (huecos declarados v1).
//
// E6 (vara A, declarada NO curada acá): `empleados_dueño_actualiza` gatea
// por `prestadores.user_id = auth.uid()` (modelo unipersonal LEGACY, la
// misma clase de columna que D-485) — un co-dueño por la hija no podría
// desvincular. v1 unipersonal alcanza; la absorbe la próxima pasada del
// motor de equipo.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// S75-B: `administrador` NACE como valor aparte en el CHECK de
// `empleado_roles` (migración de A, decisión de mesa firmada) — `dueño`
// queda RESERVADO al titular, jamás asignable. El tipo del UI lo refleja
// para razonar el gate ['dueño','administrador'].
export type RolEquipo = 'dueño' | 'administrador' | 'profesional' | 'recepcion';

const ROLES_VIVOS: readonly RolEquipo[] = ['dueño', 'administrador', 'profesional', 'recepcion'];

function esRolEquipo(v: string): v is RolEquipo {
  return (ROLES_VIVOS as readonly string[]).includes(v);
}

export interface MiembroEquipo {
  empleadoId: string;
  nombre: string;
  activo: boolean;
  roles: RolEquipo[];
}

export interface EquipoNegocio {
  /** DERIVACIÓN DECLARADA (E3 de la vara — la fuente del bool es-dueño):
   *  la policy SELECT de `empleado_roles` es dueño-only por
   *  `empleado_tiene_rol(…, ['dueño'])` y TODO negocio tiene al menos la
   *  fila del backfill S73 (5/5 titulares) — quien lee ≥1 fila ES dueño;
   *  cero filas = no-dueño (si lo fueras, verías tu propia fila). */
  esDueno: boolean;
  miembros: MiembroEquipo[];
}

export type CodigoErrorEquipo = 'error_lectura' | 'error_escritura' | 'sin_sesion';

type R<T> = Promise<ResultadoWrapper<T, CodigoErrorEquipo>>;

export async function obtenerEquipoNegocio(cuentaComercialId: string): R<EquipoNegocio> {
  const cliente = getClient();
  const empleados = await cliente.rpc('obtener_empleados_cuenta', {
    p_cuenta_comercial_id: cuentaComercialId,
  });
  if (empleados.error) {
    return { ok: false, codigo: 'error_lectura', mensaje: empleados.error.message };
  }
  const filas = empleados.data ?? [];
  const ids = filas.map((f) => f.empleado_id);
  // RLS decide: dueño ve las filas de su negocio; no-dueño ve cero.
  const roles = ids.length
    ? await cliente.from('empleado_roles').select('empleado_id, rol').in('empleado_id', ids)
    : { data: [] as Array<{ empleado_id: string; rol: string }>, error: null };
  if (roles.error) {
    return { ok: false, codigo: 'error_lectura', mensaje: roles.error.message };
  }
  const porEmpleado = new Map<string, RolEquipo[]>();
  for (const r of roles.data ?? []) {
    if (!esRolEquipo(r.rol)) continue; // rol desconocido: jamás se pinta crudo (Ley 3)
    const lista = porEmpleado.get(r.empleado_id) ?? [];
    lista.push(r.rol);
    porEmpleado.set(r.empleado_id, lista);
  }
  return {
    ok: true,
    data: {
      esDueno: (roles.data ?? []).length > 0,
      miembros: filas.map((f) => ({
        empleadoId: f.empleado_id,
        nombre: f.nombre,
        activo: f.activo,
        roles: porEmpleado.get(f.empleado_id) ?? [],
      })),
    },
  };
}

/** Asignar un rol = INSERT en la hija (auditable de nacimiento, §14.2).
 *  `asignado_por` es NOT NULL sin default: viaja el user de la sesión. */
export async function asignarRolEmpleado(
  empleadoId: string,
  rol: Exclude<RolEquipo, 'dueño'>,
): R<null> {
  const cliente = getClient();
  const { data: auth } = await cliente.auth.getUser();
  if (!auth.user) return { ok: false, codigo: 'sin_sesion', mensaje: 'No hay sesión activa.' };
  const { error } = await cliente
    .from('empleado_roles')
    .insert({ empleado_id: empleadoId, rol, asignado_por: auth.user.id });
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  return { ok: true, data: null };
}

export async function quitarRolEmpleado(
  empleadoId: string,
  rol: Exclude<RolEquipo, 'dueño'>,
): R<null> {
  const { error } = await getClient()
    .from('empleado_roles')
    .delete()
    .eq('empleado_id', empleadoId)
    .eq('rol', rol);
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  return { ok: true, data: null };
}

/** Desvincular = `activo=false` (el mecanismo probado de la desactivación
 *  S73). La procedencia preserva los actos (§14.1) — el acceso muere, lo
 *  hecho queda. Policy: `empleados_dueño_actualiza` (E6 arriba). */
export async function desvincularEmpleado(empleadoId: string): R<null> {
  const { error } = await getClient()
    .from('prestador_empleados')
    .update({ activo: false })
    .eq('id', empleadoId);
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  return { ok: true, data: null };
}

/** Los rebotes SUAVES de `crear_empleado_directo` — el RPC devuelve
 *  `{ok:false, mensaje:'<literal>'}` SIN campo código (estilo portal
 *  legado). CURA D-508 (S74-B): antes este wrapper solo miraba el error
 *  de PostgREST y los 4 rebotes viajaban como ÉXITO — el founder vio
 *  "éxito" de un rebote en campo. DECLARADO (tensión regla 35): el
 *  motor no da código, así que el mapeo es por el LITERAL del mensaje —
 *  única discriminación posible sin tocar motor; la enmienda del RPC
 *  (campo `codigo` o RAISE tipado, patrón de la casa) es pedido a A y
 *  viaja con D-509. Literales verificados contra `prosrc` vivo (L-141). */
export type CodigoInvitar =
  | 'no_es_dueno'
  | 'email_sin_cuenta'
  | 'email_es_prestador'
  | 'ya_es_empleado'
  | 'rebote_desconocido'
  | 'error_escritura';

export const REBOTES_INVITAR: ReadonlyArray<{ literal: string; codigo: CodigoInvitar }> = [
  { literal: 'No sos dueño de este prestador', codigo: 'no_es_dueno' },
  { literal: 'El email no existe en la plataforma', codigo: 'email_sin_cuenta' },
  { literal: 'Este email pertenece a otro prestador', codigo: 'email_es_prestador' },
  { literal: 'Esta persona ya es empleado de este prestador', codigo: 'ya_es_empleado' },
];

/** Invitar SIN rol (camino v1 ratificado por E4: el CHECK de
 *  `empleado_invitaciones.rol` solo admite 'empleado'). El rol se asigna
 *  cuando la persona aparece en la lista (E1: preside con su acción).
 *  VERIFICADO S74-B (por comportamiento, no por nombre): el handshake
 *  "al próximo login" NO OCURRE por ningún camino — cero consumidores de
 *  aceptar/rechazar/marcar, cero triggers, cero edge. La fila queda
 *  activo=false para siempre. La invitación HOY solo REGISTRA; el
 *  handshake es pedido de motor BLOQUEANTE (sin él no sirve ni por mail
 *  ni por link). La voz de la pantalla dice ESA verdad angosta. */
export async function invitarEmpleado(
  prestadorId: string,
  email: string,
  nombre: string,
): Promise<ResultadoWrapper<null, CodigoInvitar>> {
  const { data, error } = await getClient().rpc('crear_empleado_directo', {
    p_prestador_id: prestadorId,
    p_email: email,
    p_nombre: nombre,
  });
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  // El jsonb SE LEE (cura D-508): ok:false = rebote suave tipificado.
  const fila = (typeof data === 'object' && data !== null ? data : {}) as {
    ok?: boolean;
    mensaje?: string;
  };
  if (fila.ok !== true) {
    const mensaje = typeof fila.mensaje === 'string' ? fila.mensaje : '';
    const rebote = REBOTES_INVITAR.find((r) => mensaje.startsWith(r.literal));
    return {
      ok: false,
      codigo: rebote?.codigo ?? 'rebote_desconocido',
      // el mensaje del motor queda de fallback (jamás mudo — Ley 13);
      // la voz humana la pone la pantalla por código (Ley 3).
      mensaje: mensaje.length > 0 ? mensaje : 'La invitación no se pudo crear.',
    };
  }
  return { ok: true, data: null };
}

// ── S75-B · GATE DE ROL DE NAVEGACIÓN (D-513, la mitad UI) ──────────────
// Los gates son INERTES hasta que la puerta abra (B3): hoy solo el dueño
// resuelve prestador (obtenerMiPrestador por user_id — D-512), y el dueño
// SIEMPRE pasa ['dueño','administrador'] por la rama de titular del helper.
// Cuando A abra el resolvedor de empleados, este mismo código gatea al
// profesional/recepción sin tocarse — es el switch armado (D-512).

/** ¿El user de la sesión puede gestionar el NEGOCIO de este prestador?
 *  Delega en el helper único `empleado_tiene_rol` (§14.4 — la verdad de
 *  rol es del motor, la UI no la recomputa): true para el TITULAR (rama
 *  de dueño del helper) y para el empleado con rol en `p_roles`. El gate
 *  de PRODUCTO de la UI; el gate de ESCRITURA vive en el server (D-490/
 *  D-513, territorio A). Falla de red = false HONESTO — el gate cierra
 *  ante la duda (nunca abre lo que no pudo confirmar; Ley 23). */
export async function empleadoTieneRol(
  prestadorId: string,
  roles: readonly RolEquipo[],
): R<boolean> {
  const { data, error } = await getClient().rpc('empleado_tiene_rol', {
    p_prestador_id: prestadorId,
    p_roles: roles as string[],
  });
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: error.message };
  return { ok: true, data: data === true };
}

/** El vínculo de empleado ACTIVO del user, si existe — para la VOZ de la
 *  puerta (S75-B): cuando `obtenerMiPrestador` falla (no sos titular,
 *  D-512) el raíz cae en `sin_rol`; esta sonda distingue al EMPLEADO
 *  ACTIVO (te sumaron y aceptaste, pero la puerta aún no abre) del user
 *  sin negocio alguno. Lee `prestador_empleados` por la policy
 *  `empleados_self` (user_id = auth.uid()) — CERO motor. Devuelve el
 *  nombre del negocio para la voz honesta; null = no hay vínculo activo.
 *  HERMANA de la sonda del handshake B1 (esa mira `activo=false`, esta
 *  `activo=true`) — por eso no colisionan. MUERE cuando la puerta abra:
 *  entonces el empleado activo entra a (tabs) y nunca ve esta rama. */
export async function obtenerNegocioEmpleadoActivo(): R<string | null> {
  const cliente = getClient();
  const { data: auth } = await cliente.auth.getUser();
  if (!auth.user) return { ok: true, data: null };
  const { data, error } = await cliente
    .from('prestador_empleados')
    .select('prestador_id, created_at, prestadores(nombre_comercial)')
    .eq('user_id', auth.user.id)
    .eq('activo', true)
    // Enmienda (a) de la vara S75: `invitado_en` es NULLABLE — el orden
    // determinista es `created_at` (NOT NULL), alineado con el criterio de
    // R1. El vínculo más antiguo preside; mismo orden en los dos pisos.
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: error.message };
  if (data === null) return { ok: true, data: null };
  // el embed puede venir objeto u array según cardinalidad inferida;
  // el nombre puede ser null si el prestador no es legible (jamás inventa)
  const p = data.prestadores as { nombre_comercial: string | null } | { nombre_comercial: string | null }[] | null;
  const nombre = Array.isArray(p) ? (p[0]?.nombre_comercial ?? null) : (p?.nombre_comercial ?? null);
  return { ok: true, data: nombre };
}

// ── S75-B1 · EL HANDSHAKE DE PRODUCTO (D-514 (a)) ──────────────────────
// El invitado INACTIVO (crear_empleado_directo dejó su fila activo=false)
// no tiene camino a entrar: obtenerMiPrestador falla (no es titular) y el
// raíz lo mandaría a "sin negocio" — MENTIRA, sí tiene, lo invitaron.
// Esta sonda + su pantalla cierran el handshake. CERO motor nuevo: la
// sonda lee su propia fila por `empleados_self`; el aceptador es el RPC
// vivo `aceptar_invitacion_pendiente_login` (clase ok:false, D-511).

export interface InvitacionPendiente {
  /** el argumento del RPC — NO se renderiza. */
  empleadoId: string;
  /** nombre del negocio que invitó; null si el prestador no es legible
   *  (Ley 13/L-139: la pantalla dice "un equipo", jamás inventa nombre). */
  negocioNombre: string | null;
  /** el nombre con que se te sumó (línea de apoyo de la pantalla). */
  nombreInvitado: string;
}

/** ¿El user tiene una invitación de equipo SIN aceptar? Lee su fila
 *  `activo=false` por `empleados_self` (CERO motor). Orden `created_at`
 *  (enmienda (a): `invitado_en` es nullable) — el vínculo más antiguo
 *  preside, alineado con R1. null = no hay handshake pendiente (el guard
 *  no redirige — Ley 23). HERMANA de `obtenerNegocioEmpleadoActivo`
 *  (esa mira `activo=true`): por eso no colisionan. */
export async function obtenerInvitacionPendiente(): R<InvitacionPendiente | null> {
  const cliente = getClient();
  const { data: auth } = await cliente.auth.getUser();
  if (!auth.user) return { ok: true, data: null };
  const { data, error } = await cliente
    .from('prestador_empleados')
    .select('id, nombre, created_at, prestadores(nombre_comercial)')
    .eq('user_id', auth.user.id)
    .eq('activo', false)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: error.message };
  if (data === null) return { ok: true, data: null };
  const p = data.prestadores as { nombre_comercial: string | null } | { nombre_comercial: string | null }[] | null;
  const negocioNombre = Array.isArray(p) ? (p[0]?.nombre_comercial ?? null) : (p?.nombre_comercial ?? null);
  return {
    ok: true,
    data: { empleadoId: data.id, negocioNombre, nombreInvitado: data.nombre },
  };
}

/** Los rebotes suaves de `aceptar_invitacion_pendiente_login` — jsonb
 *  `{ok:false, mensaje:'<literal>'}` sin campo código (clase D-511, mismo
 *  patrón que `invitarEmpleado`). Literales verificados contra `prosrc`
 *  vivo (L-141). */
export type CodigoAceptar =
  | 'sin_sesion'
  | 'ya_activado'
  | 'no_es_tuya'
  | 'rebote_desconocido'
  | 'error_escritura';

const REBOTES_ACEPTAR: ReadonlyArray<{ literal: string; codigo: CodigoAceptar }> = [
  { literal: 'Sin sesión', codigo: 'sin_sesion' },
  { literal: 'Empleado no encontrado o ya activado', codigo: 'ya_activado' },
  { literal: 'No tenés permiso para aceptar esta invitación', codigo: 'no_es_tuya' },
];

/** Aceptar = el motor pone `activo=true` y marca la invitación aceptada.
 *  Éxito NO significa acceso a (tabs): la puerta (B3) sigue cerrada — la
 *  pantalla dice esa verdad honesta (L-139), jamás promete entrar. */
export async function aceptarInvitacionEquipo(
  empleadoId: string,
): Promise<ResultadoWrapper<null, CodigoAceptar>> {
  const { data, error } = await getClient().rpc('aceptar_invitacion_pendiente_login', {
    p_empleado_id: empleadoId,
  });
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  const fila = (typeof data === 'object' && data !== null ? data : {}) as {
    ok?: boolean;
    mensaje?: string;
  };
  if (fila.ok !== true) {
    const mensaje = typeof fila.mensaje === 'string' ? fila.mensaje : '';
    const rebote = REBOTES_ACEPTAR.find((r) => mensaje.startsWith(r.literal));
    return {
      ok: false,
      codigo: rebote?.codigo ?? 'rebote_desconocido',
      mensaje: mensaje.length > 0 ? mensaje : 'No pudimos confirmar tu ingreso.',
    };
  }
  return { ok: true, data: null };
}
