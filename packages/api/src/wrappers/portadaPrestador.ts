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

  /* ── LA BANDA DEL DÍA (S97-A, D-808) ──────────────────────────────────────
     Dictado ② del founder, verbatim: *"un dashboard pequeño arriba con datos
     de los servicios prestados y valores, **si está en 0 se muestra en 0**"*.
     La cláusula final es LEY: el cero se muestra, jamás se esconde.
     ⚠️ `null` acá sigue significando **"este rol no ve"**, jamás cero. */

  /** 🔴 **EL HECHO: citas `completada` del día.** Es lo que el founder pidió
   *  por "servicios prestados".
   *  **NO confundir con `citas`**, que cuenta lo AGENDADO (`_estados_cita_
   *  contables()` = confirmada + en_curso + completada) — medido: en un día
   *  real, `citas`=6 y `prestadas`=1.
   *  *Un tablero que suma promesas y las llama "prestados" miente en la
   *  dirección optimista, que es la peor: nadie audita un número que le
   *  gusta.* */
  prestadas: number | null;
  /** Citas `en_curso`. Está pasando — ni promesa ni hecho todavía. */
  enCurso: number | null;
  /** Citas `confirmada`. La promesa del día. */
  agendadas: number | null;
  /** **Cobro presencial del día, eje = fecha de la CITA** (el mismo que
   *  `total`, a propósito).
   *  🔴 NO es "plata que entró hoy": un cobro registrado hoy sobre una cita de
   *  ayer NO entra acá. *Se eligió así porque el eje del registro haría que
   *  este número y `total` nunca cerraran entre sí, y **un tablero que no
   *  cierra consigo mismo no se audita: se desconfía entero**.* El arqueo de
   *  caja es otro lector con otro nombre, el día que exista. */
  cobrado: number | null;
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
  const d = data as {
    visible?: unknown;
    total?: unknown;
    citas?: unknown;
    sinPrecio?: unknown;
    prestadas?: unknown;
    enCurso?: unknown;
    agendadas?: unknown;
    cobrado?: unknown;
  } | null;
  if (d === null || typeof d.visible !== 'boolean') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  if (!d.visible) {
    return {
      ok: true,
      data: {
        visible: false,
        total: null,
        citas: null,
        sinPrecio: null,
        prestadas: null,
        enCurso: null,
        agendadas: null,
        cobrado: null,
      },
    };
  }
  /* `?? 0` es correcto acá y solo acá: llegamos con `visible=true`, o sea el
     servidor CONTÓ. Un cero de un rol que sí ve es un cero de verdad — y el
     founder firmó que se muestra ("si está en 0 se muestra en 0"). */
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));
  return {
    ok: true,
    data: {
      visible: true,
      total: num(d.total),
      citas: num(d.citas),
      sinPrecio: num(d.sinPrecio),
      prestadas: num(d.prestadas),
      enCurso: num(d.enCurso),
      agendadas: num(d.agendadas),
      cobrado: num(d.cobrado),
    },
  };
}
