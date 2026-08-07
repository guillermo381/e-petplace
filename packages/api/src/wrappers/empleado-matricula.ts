// S90-B — LA MATRÍCULA DE LA PERSONA (D-676) · la puerta que faltaba.
//
// ⚠️ TERRITORIO DECLARADO: este archivo lo escribió la pista B, que en S90
// es dueña de `apps/prestador`. `packages/api` se comparte por ARCHIVOS
// NUEVOS + hunks aditivos (regla 76(c)/(d) del CONTRATO) — por eso nace
// como archivo propio y toca `index.ts` con una sola línea aditiva.
// **Queda a ratificación de A**, que es quien conduce el motor y su puerta.
//
// POR QUÉ EXISTE: D-676 construyó las dos columnas, el helper único
// `_empleado_matricula_ok` y el gate en los tres puntos de asignación y en
// la vitrina — pero NINGÚN camino para CARGAR el dato. Medido al abrir
// S90-B: **0 de 21 empleados con matrícula**, y el corte del gate es el
// 15-AGO. Sin esta puerta, los vets vivos pierden visibilidad ese día.
//
// POR QUÉ TABLA DIRECTA Y NO RPC — medido, no supuesto:
//   · policy `empleados_dueño_actualiza` UPDATE = `user_gestiona_prestador(prestador_id)`
//     (titular o administrador; el mismo helper que usa el resto de la casa)
//   · policy `empleados_dueño_ve_todos` SELECT para la lectura
//   · `authenticated` tiene grants de COLUMNA (SELECT/UPDATE) sobre las dos
//   · el trigger `prestador_empleados_protege_gobierno` guarda `activo`,
//     `rol` y `prestador_id` — la matrícula NO está entre lo protegido
// ⇒ la RLS ya es exactamente la puerta que esta operación necesita. Un RPC
// DEFINER re-implementaría un permiso que la tabla ya sabe resolver, y
// sería un segundo lugar donde la regla puede divergir.
//
// LO QUE ESTA PUERTA NO DECIDE, y se dice para que nadie lo dé por hecho:
// existe además la policy `empleados_self_actualiza` (`user_id = auth.uid()`)
// ⇒ **una persona podría escribir SU PROPIA matrícula.** Este wrapper no la
// usa —la superficie es la Hoja del miembro, que es del gestor— pero el
// borde es real y es decisión de LETRA, no de wrapper (a la mesa).

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion: 'No hay sesión activa.',
  matricula_vacia: 'Escribí el número de matrícula.',
  sin_permiso: 'No podés editar los datos de esta persona.',
  error_lectura: 'No pudimos leer la matrícula. Probá de nuevo.',
  error_escritura: 'No pudimos guardar la matrícula. Probá de nuevo.',
} as const;

export type CodigoMatricula = keyof typeof MENSAJES;
type Falla = { ok: false; codigo: CodigoMatricula; mensaje: string };
function falla(codigo: CodigoMatricula): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export interface MatriculaEmpleado {
  /** `null` = no declarada. JAMÁS cadena vacía: la ausencia es un hecho y
   *  se dice con `null` (el helper del motor normaliza con `btrim`, y acá
   *  se espeja para que las dos puntas midan lo mismo). */
  matricula: string | null;
  /** El país que la EMITIÓ — viaja con la matrícula, jamás separado: un
   *  número sin su emisor no identifica un registro profesional. */
  paisEmisor: string | null;
}

/** Lee la matrícula de UNA persona del equipo. La RLS decide si se puede. */
export async function obtenerMatriculaEmpleado(
  empleadoId: string,
): Promise<ResultadoWrapper<MatriculaEmpleado, CodigoMatricula>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_empleados')
    .select('matricula_profesional, matricula_pais_emisor')
    .eq('id', empleadoId)
    .maybeSingle();

  if (error) return falla('error_lectura');
  // Sin fila legible: la RLS no la concede. Se dice como falta de permiso,
  // jamás como "no tiene matrícula" — que sería afirmar sobre lo no leído.
  if (data === null) return falla('sin_permiso');

  const bruto = (data.matricula_profesional ?? '').trim();
  const pais = (data.matricula_pais_emisor ?? '').trim();
  return {
    ok: true,
    data: {
      matricula: bruto === '' ? null : bruto,
      paisEmisor: pais === '' ? null : pais,
    },
  };
}

/**
 * Guarda la matrícula de una persona del equipo.
 *
 * El país viaja SIEMPRE con el número (contrato de arriba). Un número vacío
 * se rebota tipado en vez de escribir `''`: el motor mide con
 * `coalesce(btrim(...), '') <> ''`, así que una cadena vacía sería una
 * matrícula que existe para la tabla y no existe para el gate — el peor de
 * los dos mundos.
 */
export async function guardarMatriculaEmpleado(
  empleadoId: string,
  matricula: string,
  paisEmisor: string,
): Promise<ResultadoWrapper<MatriculaEmpleado, CodigoMatricula>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const numero = matricula.trim();
  if (numero === '') return falla('matricula_vacia');
  const pais = paisEmisor.trim();

  const { data, error } = await getClient()
    .from('prestador_empleados')
    .update({
      matricula_profesional: numero,
      matricula_pais_emisor: pais === '' ? null : pais,
    })
    .eq('id', empleadoId)
    .select('matricula_profesional, matricula_pais_emisor')
    .maybeSingle();

  if (error) return falla('error_escritura');
  // UPDATE que no devuelve fila = la RLS no dejó escribir. Se dice como
  // permiso, jamás como éxito silencioso (L-192: un fallo cuyo modo es el
  // silencio no es un fallo detectable).
  if (data === null) return falla('sin_permiso');

  const guardado = (data.matricula_profesional ?? '').trim();
  const guardadoPais = (data.matricula_pais_emisor ?? '').trim();
  return {
    ok: true,
    data: {
      matricula: guardado === '' ? null : guardado,
      paisEmisor: guardadoPais === '' ? null : guardadoPais,
    },
  };
}
