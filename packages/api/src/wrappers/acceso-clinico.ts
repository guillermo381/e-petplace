// ── S76-B2 (D-525): ¿PUEDO ATENDER LO CLÍNICO ACÁ? — gate de PRODUCTO ──────
//
// El gate de AUSENCIA de la superficie de "atender" (verbatim founder S75:
// "la recepción no debería poder ni verlo"). Es gate de PRODUCTO/UI: el de
// ESCRITURA vive en el motor (D-490 fase 2 + flip §6.2) y NO se retira
// (Ley 23: la puerta es cortesía, no validación).
//
// CÓMO RESUELVE — DECLARADO: llama al MOTOR, jamás recomputa. La verdad
// vigente por PERSONA es `empleado_tiene_capacidad_clinica(prestador)` —
// el flip §6.2 que A aplicó (bcc9744): el gate clínico dejó de leer el
// cargo `profesional` y pasa a leer el CHIP (admin OR titular OR empleado
// activo con chip sobre una oferta `es_medico = true`). Este wrapper
// consume ESA misma función, la MISMA que gatea los 6 escritores clínicos
// del motor. UI == motor POR CONSTRUCCIÓN: lo que acá da false, allá
// rebota — Ley 23 exacta, cero segunda implementación (clase D-494 /
// LETRA_EQUIPO §4).
//
// EL PAR LIGADO, COBRADO (S76-B, cierre del par declarado en el header
// original): hasta bcc9744 esto llamaba `empleado_tiene_rol(prestador,
// ['dueño','profesional'])` — el gate viejo por cargo. Con el flip
// aplicado, esa llamada divergía del motor: la SUPERFICIE rechazaba a un
// vet que el MOTOR ya aceptaba (el empleado afdc7fb9, 6 chips médicos
// reales). El cambio es de UNA llamada, como el header prometió; el gate
// por chip vive AHORA en una sola verdad server-side.
//
// Falla de red/lectura = false HONESTO: el gate CIERRA ante la duda —
// nunca abre lo que no pudo confirmar (patrón `empleadoTieneRol`, S75-B).

import { getClient } from '../client';

/**
 * true ⇔ el user de la sesión puede ATENDER lo clínico en este negocio
 * según el MOTOR VIGENTE — `empleado_tiene_capacidad_clinica` (flip §6.2):
 * admin, titular, o empleado activo con chip sobre una oferta médica.
 * Cualquier fallo de lectura devuelve false — el caller no muestra la
 * entrada; el error queda loggeado acá con su literal (regla 36).
 */
export async function puedoAtenderClinico(prestadorId: string): Promise<boolean> {
  const { data, error } = await getClient().rpc('empleado_tiene_capacidad_clinica', {
    p_prestador_id: prestadorId,
  });
  if (error) {
    console.error('[acceso-clinico] empleado_tiene_capacidad_clinica falló =', error.message);
    return false;
  }
  return data === true;
}
