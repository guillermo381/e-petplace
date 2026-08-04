/**
 * ATENCIONES ABIERTAS FUERA DEL DÍA — la 4ª fuente de «Necesita tu atención».
 *
 * **Qué es "abierta", medido:** `evento_atencion.estado` tiene dos valores vivos
 * — `cerrada_con_calidad` y `terminada`. ⇒ **abierta = `terminada`**: el trabajo
 * se hizo y **nadie lo cerró con calidad**. *No es una atención en curso: es una
 * que quedó a mitad del último paso.*
 *
 * ⚠️ **Y ES PLATA QUE NO SE DEVENGÓ.** Por la Decisión R el evento económico
 * nace **al CERRAR CON CALIDAD** — así que una `terminada` es **trabajo hecho y
 * no cobrado**, y hasta hoy el prestador no tenía ninguna superficie que se lo
 * dijera. *Medido al construir: **UNA sola, del 15-jul, 19 días, $6.00**. No es
 * un borde teórico — es plata parada que nadie vio porque nada la mostraba.*
 *
 * **NO suma al `$ del día`** (§2.4bis: PLATA = valor agendado de HOY). *Son dos
 * preguntas y la portada no las mezcla: «¿cuánto vale mi jornada?» vs «¿qué
 * quedó sin cerrar?».*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS = ['sin_sesion', 'sin_acceso', 'error_desconocido'] as const;
export type CodigoErrorAtencionesAbiertas = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorAtencionesAbiertas, string> = {
  sin_sesion: 'No hay sesión activa.',
  sin_acceso: 'No trabajas en este negocio.',
  error_desconocido: 'No pudimos leer lo que quedó sin cerrar.',
};

export interface AtencionAbierta {
  atencionId: string;
  citaId: string | null;
  mascotaId: string | null;
  mascotaNombre: string | null;
  tipoServicio: string | null;
  iniciadaEn: string;
  /** Días desde que se inició. **Lo viejo primero** — es lo que más duele. */
  diasAbierta: number;
  /** El precio congelado de la cita. **`null` no vale 0**: hay 2 citas vivas sin
   *  precio (las del 7-jul, anteriores al snapshot). *Un 0 diría que ese trabajo
   *  no valía nada* (L-197). */
  precio: number | null;
}

/**
 * ⚠️ **El gate NO es el de `$ del día`** (titular-only), y la diferencia es de
 * producto: *allá se protege **la plata del negocio**; acá se muestra **trabajo
 * sin cerrar**, y cerrarlo es la tarea del que atendió.* **Ocultárselo al
 * empleado sería esconderle su propio pendiente.** ⇒ titular **o empleado
 * activo**. *Se declara porque copiar el gate del vecino era lo cómodo y habría
 * estado mal: la regla no es "todo lo del negocio es del titular" — es que la
 * PLATA lo es.*
 */
export async function obtenerAtencionesAbiertas(
  prestadorId: string,
  diasAtras = 90,
): Promise<ResultadoWrapper<AtencionAbierta[], CodigoErrorAtencionesAbiertas>> {
  const { data, error } = await getClient().rpc('obtener_atenciones_abiertas', {
    p_prestador_id: prestadorId,
    p_dias_atras: diasAtras,
  });

  if (error) {
    const raw = error.message ?? '';
    const codigo: CodigoErrorAtencionesAbiertas = raw.startsWith('sin_acceso')
      ? 'sin_acceso'
      : raw.startsWith('auth_required')
        ? 'sin_sesion'
        : 'error_desconocido';
    return { ok: false, codigo, mensaje: MENSAJES[codigo] };
  }
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  return {
    ok: true,
    data: data.map((f) => ({
      atencionId: f.atencion_id,
      citaId: f.cita_id ?? null,
      mascotaId: f.mascota_id ?? null,
      mascotaNombre: f.mascota_nombre ?? null,
      tipoServicio: f.tipo_servicio ?? null,
      iniciadaEn: f.iniciada_en,
      diasAbierta: typeof f.dias_abierta === 'number' ? f.dias_abierta : 0,
      precio: typeof f.precio === 'number' ? f.precio : null,
    })),
  };
}
