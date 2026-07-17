// V0 — FUNDACIÓN DEL MODELO DE ACTOR (S67, MODELO_VETERINARIA PARTE I).
// El titular materializado: cada prestador tiene su persona rol='dueño'
// en prestador_empleados (persona = negocio de 1, §1). Desde la
// fundación, TODA franja de prestador_horarios es de una persona
// (empleado_id NOT NULL): las "franjas propias del prestador" que los
// wrappers filtraban con .is('empleado_id', null) son ahora las del
// titular — la conspiración de NULLs murió en la migración
// 20260717170000; este helper es la única resolución del lado app.
import { getClient } from '../client';

/**
 * El id de la persona TITULAR (prestador_empleados.rol='dueño', activa)
 * del prestador, o null si no existe — estado que la fundación V0
 * impide para prestadores vivos; el caller lo trata como error.
 */
export async function obtenerTitularId(prestadorId: string): Promise<string | null> {
  const { data, error } = await getClient()
    .from('prestador_empleados')
    .select('id')
    .eq('prestador_id', prestadorId)
    .eq('rol', 'dueño')
    .eq('activo', true)
    .maybeSingle();
  if (error || data === null) return null;
  return data.id;
}
