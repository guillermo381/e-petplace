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

export type RolEquipo = 'dueño' | 'profesional' | 'recepcion';

const ROLES_VIVOS: readonly RolEquipo[] = ['dueño', 'profesional', 'recepcion'];

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

/** Invitar SIN rol (camino v1 ratificado por E4: el CHECK de
 *  `empleado_invitaciones.rol` solo admite 'empleado'). El rol se asigna
 *  cuando la persona aparece en la lista (E1: preside con su acción).
 *  El Json de retorno del RPC NO se interpreta en v1 — éxito = sin error;
 *  el consumidor recarga la lista. */
export async function invitarEmpleado(
  prestadorId: string,
  email: string,
  nombre: string,
): R<null> {
  const { error } = await getClient().rpc('crear_empleado_directo', {
    p_prestador_id: prestadorId,
    p_email: email,
    p_nombre: nombre,
  });
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  return { ok: true, data: null };
}
