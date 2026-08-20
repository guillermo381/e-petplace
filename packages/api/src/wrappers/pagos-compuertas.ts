/**
 * S101-B · FASE 3 · LAS COMPUERTAS PRE-COBRO, POR LA PUERTA ÚNICA.
 *
 * 🔴 LA REGLA MADRE QUE ESTE WRAPPER SIRVE: *todo lo que pueda impedir la
 *    entrega se verifica ANTES del débito.* Porque el reverso es **mismo-día**
 *    (cortes 17:00 / 17:50, medidos): **la plata que no se cobra mal no hay
 *    que devolverla.**
 *
 * 🔴 `no_evaluables` VIAJA SIEMPRE, INCLUSO EN EL VERDE — y no es decoración:
 *    la cobertura **no la evalúa el pago, por diseño** (se valida al elegir la
 *    dirección). *Una compuerta que no puede evaluar y calla es peor que una
 *    que falta: la que falta se nota.* Por eso el tipo la expone y ningún
 *    llamador puede leer un `ok` como «cobertura verificada».
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/**
 * Los códigos que la función devuelve. **Son OCHO** — medidos por ESTRUCTURA
 * contra la migración `20260821020000`, no por nombre.
 *
 * ⚠️ `pedidos_sin_reserva` **NO está acá a propósito**: no es un código, es una
 * clave del `detalle` de `reserva_vencida`. *La primera lectura de esta lista
 * lo contó como noveno código — medir identificadores no es medir la forma.*
 */
export type CodigoCompuerta =
  | 'compra_no_existe'
  | 'compra_sin_pedidos'
  | 'desglose_incompleto'
  | 'monto_divergente'
  | 'pago_en_proceso'
  | 'reserva_vencida'
  | 'token_ausente'
  | 'vendedor_no_activo';

/** Los dos que hablan hacia SOPORTE: son defecto NUESTRO, jamás del cliente. */
export const COMPUERTAS_DEFECTO_NUESTRO: readonly CodigoCompuerta[] = [
  'monto_divergente',
  'compra_sin_pedidos',
  'desglose_incompleto',
] as const;

export type CompuertasVerde = {
  ok: true;
  /** 🔴 Siempre presente. Hoy: `['cobertura']`. */
  noEvaluables: string[];
  montoVerificado: number | null;
};

export type CompuertasRojo = {
  ok: false;
  codigo: CodigoCompuerta;
  /** `true` cuando la causa es NUESTRA — la voz manda a soporte, no al cliente. */
  esDefectoNuestro: boolean;
  noEvaluables: string[];
};

export type Compuertas = CompuertasVerde | CompuertasRojo;

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

const CODIGOS: readonly string[] = [
  'compra_no_existe', 'compra_sin_pedidos', 'desglose_incompleto',
  'monto_divergente', 'pago_en_proceso', 'reserva_vencida',
  'token_ausente', 'vendedor_no_activo',
];

/**
 * Corre las compuertas. **No cobra nada y no escribe nada** — solo mira.
 *
 * *Se llama al TOCAR pagar, jamás al abrir el checkout ni al re-renderizar:
 * la lección del andamio anterior (una pantalla que fabricaba estado por
 * abrirse) rige acá por construcción.*
 */
export async function verificarCompuertas(
  compraId: string,
  token: string | null,
): Promise<ResultadoWrapper<Compuertas, 'error_compuertas'>> {
  const { data, error } = await getClient().rpc('verificar_compuertas_pre_cobro', {
    p_compra_id: compraId,
    p_token: token ?? undefined,
  });
  if (error) return { ok: false, codigo: 'error_compuertas', mensaje: error.message };
  if (!esObj(data)) return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'datos_inconsistentes' };

  const noEvaluables = Array.isArray(data.no_evaluables)
    ? data.no_evaluables.filter((x): x is string => typeof x === 'string')
    : [];

  if (data.ok === true) {
    return {
      ok: true,
      data: {
        ok: true,
        noEvaluables,
        montoVerificado: typeof data.monto_verificado === 'number' ? data.monto_verificado : null,
      },
    };
  }

  const codigo = typeof data.codigo === 'string' && CODIGOS.includes(data.codigo)
    ? (data.codigo as CodigoCompuerta)
    : null;

  /* 🔴 Un código que no reconocemos NO se dibuja como si lo entendiéramos.
     *Mapearlo al cajón de «datos inválidos» le diría a la familia que revise
     algo que puede estar perfecto.* */
  if (codigo === null) {
    return { ok: false, codigo: 'error_compuertas', mensaje: String(data.codigo ?? 'desconocido') };
  }

  return {
    ok: true,
    data: {
      ok: false,
      codigo,
      esDefectoNuestro: COMPUERTAS_DEFECTO_NUESTRO.includes(codigo),
      noEvaluables,
    },
  };
}
