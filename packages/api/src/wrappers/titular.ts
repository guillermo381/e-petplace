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

/**
 * MI fila de empleado activo en este negocio (S75-A25) — el id de la
 * persona LOGUEADA, no del titular.
 *
 * EL BUG QUE CURA: la pantalla de atención vet usaba `obtenerTitularId`
 * para resolver el `empleado_tratante` de la consulta — el supuesto
 * unipersonal (el titular es el único que atiende). Con un empleado real
 * atendiendo, ese wrapper devuelve **null**: la RLS `empleados_self`
 * (`user_id = auth.uid()`) le deja ver SU propia fila, jamás la del
 * titular (`empleados_dueño_ve_todos` es dueño-only). La consulta moría
 * en la carga con "No pudimos abrir" — falla de LECTURA, idéntica para
 * recepción y profesional (el rol clínico ni entra: el titular no se ve).
 * Es el HERMANO de `obtenerMiPrestador` (R1): el mismo muro unipersonal,
 * un piso más adentro. Quien ATIENDE es quien está logueado.
 *
 * NO reemplaza a `obtenerTitularId` (que sigue siendo "el titular" para
 * las franjas del negocio unipersonal, V0). Filtra por `user_id` explícito
 * porque el titular, por `empleados_dueño_ve_todos`, vería TODAS las filas
 * del negocio — se quiere SOLO la propia. Para el titular devuelve su
 * fila `dueño` (mismo id que `obtenerTitularId` le daba: cero regresión);
 * para el empleado, la suya.
 */
export async function obtenerMiEmpleadoId(prestadorId: string): Promise<string | null> {
  const { data: auth } = await getClient().auth.getUser();
  const uid = auth.user?.id;
  if (uid === undefined) return null;
  const { data, error } = await getClient()
    .from('prestador_empleados')
    .select('id')
    .eq('prestador_id', prestadorId)
    .eq('user_id', uid)
    .eq('activo', true)
    .maybeSingle();
  if (error || data === null) return null;
  return data.id;
}
