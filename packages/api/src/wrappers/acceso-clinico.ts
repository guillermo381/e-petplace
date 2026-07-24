// ── S76-B2 (D-525): ¿PUEDO ATENDER LO CLÍNICO ACÁ? — gate de PRODUCTO ──────
//
// El gate de AUSENCIA de la superficie de "atender" (verbatim founder S75:
// "la recepción no debería poder ni verlo"). Es gate de PRODUCTO/UI: el de
// ESCRITURA vive en el motor (D-490 fase 2, los 4 DEFINER) y NO se retira
// (Ley 23: la puerta es cortesía, no validación).
//
// CÓMO RESUELVE — DECLARADO (freno de mesa S76-B, antes del commit):
// llama al MOTOR, jamás recomputa. La verdad vigente por PERSONA es el
// gate literal de los 4 escritores DEFINER (D-490 fase 2, leído con
// pg_get_functiondef):
//     COALESCE(empleado_tiene_rol(prestador, ARRAY['dueño','profesional']), false)
// Este wrapper consume ESA misma función con ESE mismo array, por la
// puerta única `empleadoTieneRol` (§14.4: la verdad de rol es del motor,
// la UI no la recomputa). UI == motor POR CONSTRUCCIÓN: lo que acá da
// false, allá rebota — Ley 23 exacta, cero segunda implementación
// (la clase D-494 / LETRA_EQUIPO §4).
//
// PEDIDO A LA MESA, DECLARADO (no cómputo de cliente): la letra §6.2
// cambia el gate clínico a "chip en alguna oferta con es_medico = true".
// Esa pregunta por PERSONA no tiene HOY función de motor que la conteste
// (`user_puede_escribir_clinico` es por MASCOTA y lee el genérico;
// `empleado_tiene_rol` no sabe de chips). Cuando la migración del flip
// llegue CON su función, este wrapper cambia UNA llamada y todos sus
// consumidores la heredan — un borrador que componía el chip con 3
// lecturas del lado cliente se descartó en esta misma tanda por el freno.
//
// Falla de red/lectura = false HONESTO: el gate CIERRA ante la duda —
// nunca abre lo que no pudo confirmar (patrón `empleadoTieneRol`, S75-B).

import { empleadoTieneRol } from './equipo';

/**
 * true ⇔ el user de la sesión puede ATENDER lo clínico en este negocio
 * según el MOTOR VIGENTE (titular por brazo 2, o empleado activo con rol
 * clínico — el mismo array del gate DEFINER de D-490 fase 2).
 * Cualquier fallo de lectura devuelve false — el caller no muestra la
 * entrada; el error ya viajó tipado por el wrapper de la puerta única.
 */
export async function puedoAtenderClinico(prestadorId: string): Promise<boolean> {
  const r = await empleadoTieneRol(prestadorId, ['dueño', 'profesional']);
  if (!r.ok) {
    console.error('[acceso-clinico] empleado_tiene_rol falló =', r.mensaje);
    return false;
  }
  return r.data;
}
