/**
 * LA PORTADA DEL PRESTADOR — los tres números (`PORTAL_PRESTADOR` §2.4bis).
 *
 * **Esqueleto fijo CARGA · PLATA · VIDAS.** Este archivo empieza por el
 * segundo; los otros dos llegan con su lector.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS = ['sin_sesion', 'error_desconocido'] as const;
export type CodigoErrorPortada = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorPortada, string> = {
  sin_sesion: 'No hay sesión activa.',
  error_desconocido: 'No pudimos leer el resumen de tu día.',
};

export interface PlataDelDia {
  /** **`false` = este rol NO ve la plata** — no es un fallo ni un cero.
   *  `S72-P1a`: la app es multi-actor y el mostrador vive en HOY; *plata sin
   *  gate = la recepción ve los ingresos*. La superficie **DICE algo** en vez
   *  de dejar un hueco (A3.5bis: no se esconde que existe, se modula qué se ve). */
  visible: boolean;
  /** Suma de `precio` de las citas VIVAS del día. `null` si `visible=false`. */
  total: number | null;
  citas: number | null;
  /** Citas del día **sin precio**. `>0` ⇒ **el total es PARCIAL** y la
   *  superficie tiene que decirlo. *Un NULL no vale 0: eso sería mentir por
   *  omisión con un número redondo* (L-197). */
  sinPrecio: number | null;
}

/**
 * **PLATA = el valor AGENDADO del día. NO lo devengado, NO lo cobrado.**
 * Contesta *"¿cuánto vale mi jornada?"*, no *"¿cuánto llevo cobrado?"*.
 *
 * ⚠️ **NO es ingreso del prestador ni base de liquidación: es la suma de
 * unitarios efectivos de un día.** *Dos días con el mismo trabajo pueden dar
 * números distintos si un plan cambió de N* — el unitario del plan es
 * `mensual ÷ N generadas`, **derivado y no estable entre períodos** (Decisión S
 * enmendada). **Dentro del día, en cambio, es exacto y ya está calculado**: el
 * motor lo estampa en `precio` al crear la cita, así que este lector suma, no
 * deriva. Lo que el prestador va a COBRAR vive en Liquidaciones, que lee el
 * ledger.
 *
 * **El gate vive en el SERVIDOR** (RPC DEFINER) porque un gate del cliente es
 * decorativo. ⚠️ Y lo que **no** cierra, declarado: `precio` sigue siendo
 * legible por la RLS para quien ve la cita — **esta es la puerta del TOTAL, no
 * la del DATO** (D-641).
 */
export async function obtenerPlataDelDia(
  prestadorId: string,
  fecha: string,
): Promise<ResultadoWrapper<PlataDelDia, CodigoErrorPortada>> {
  const { data, error } = await getClient().rpc('obtener_plata_del_dia', {
    p_prestador_id: prestadorId,
    p_fecha: fecha,
  });

  if (error) {
    const codigo: CodigoErrorPortada = (error.message ?? '').startsWith('auth_required')
      ? 'sin_sesion'
      : 'error_desconocido';
    return { ok: false, codigo, mensaje: MENSAJES[codigo] };
  }

  /* Guard de shape contra el RETURNS real (jsonb) — L-124. Y **el fallo NO
     degrada a `visible:false`**: eso le diría al prestador "tu rol no ve esto"
     cuando la verdad es "no pude leer". Dos hechos distintos no comparten
     representación (L-197). */
  const d = data as { visible?: unknown; total?: unknown; citas?: unknown; sinPrecio?: unknown } | null;
  if (d === null || typeof d.visible !== 'boolean') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  if (!d.visible) {
    return { ok: true, data: { visible: false, total: null, citas: null, sinPrecio: null } };
  }
  return {
    ok: true,
    data: {
      visible: true,
      total: typeof d.total === 'number' ? d.total : Number(d.total ?? 0),
      citas: typeof d.citas === 'number' ? d.citas : 0,
      sinPrecio: typeof d.sinPrecio === 'number' ? d.sinPrecio : 0,
    },
  };
}
