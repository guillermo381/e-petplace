/**
 * EL CONTEO DE LA SEMANA DEL PRESTADOR — la puerta que S113-C dejó declarada.
 *
 * Pedido literal en `apps/prestador/src/app/(tabs)/index.tsx` («🔴 PUERTA
 * PENDIENTE — PEDIDO A LA PISTA A»). Hasta hoy el techo del HOY sacaba el
 * número de `citasRango.length`, y era **falso en su ventana**: el fetch trae
 * hoy−3..hoy+6, así que «3 esta semana» podían ser dos citas de anteayer.
 *
 * ── POR QUÉ EL NÚMERO LO CUENTA EL SERVIDOR ────────────────────────────────
 * No es performance: es que **la pantalla no tiene con qué contarlo bien**. Su
 * lista está recortada a otra ventana y filtrada para dibujar, no para contar.
 * *Un número derivado de una lista traída para otra cosa es plausible y falso.*
 * `contar_citas_semana_prestador` (migración `20260908940000`) devuelve un
 * entero: acá no hay lista que recorrer.
 *
 * ── LOS ESTADOS Y EL DISCRIMINADOR SON COPIA LITERAL, NO EQUIVALENTES ──────
 * Medidos en los cuatro lectores del día antes de escribir la RPC:
 *   `paseo.ts:410` · `grooming-atencion.ts:189` · `veterinaria-atencion.ts:86`
 *   · `adiestramiento-atencion.ts:150`  →  todos
 *   `.in('estado', ['confirmada','en_curso','completada','no_show'])`
 * y el oficio: paseo/grooming/adiestramiento por `tipo.categoria`, **el médico
 * por `tipo.es_medico`** — jamás por categoría, porque `es_medico` abarca
 * `veterinario`, `telemedicina` y `emergencia` (medido en `tipos_servicio`), y
 * contar por categoría perdería las dos últimas en silencio.
 *
 * ⚠️ **GUARDERÍA QUEDA AFUERA A PROPÓSITO** — son estadías, otra tabla y otro
 * lector. El pedido de C dice «los CUATRO oficios». Medido sobre datos reales:
 * un prestador con 21 estadías confirmadas en la ventana devuelve 0 acá.
 *
 * ── LA VENTANA SE RESUELVE EN LA ZONA DEL NEGOCIO ─────────────────────────
 * `hoy` sale de `diaDelNegocio(zona)` de `@epetplace/domain` — la misma
 * aritmética `Intl` con `timeZone` que usa `hoyEnZona()` en el prestador
 * (S112-C). **JAMÁS `hoy_local()` de la base**: medido, `hoy_local()` es
 * `(now() AT TIME ZONE 'America/Guayaquil')::date`, una CONSTANTE — no la zona
 * del prestador. Es `D-1007`, y por eso la ventana la arma el cliente.
 *
 * 🔴 **ANOTADO, no curado:** `diaDelNegocio` (domain) y `hoyEnZona`
 * (`apps/prestador/src/lib/dia-local.ts`) son la MISMA aritmética en dos
 * lugares; hasta hoy `diaDelNegocio` no tenía un solo consumidor. Este wrapper
 * es el primero. Unificarlas toca territorio del prestador y no se hace acá.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import { diaDelNegocio } from '@epetplace/domain';

const CODIGOS = ['sin_prestador', 'error_desconocido'] as const;
export type CodigoErrorConteoSemana = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorConteoSemana, string> = {
  // El prestador no existe o la RLS no lo deja verlo: son el mismo hecho desde
  // acá y no se distinguen inventando. La superficie degrada a «sin número».
  sin_prestador: 'No pudimos leer el negocio.',
  error_desconocido: 'No pudimos contar la semana.',
};

/** Los 6 días que siguen a hoy, inclusive: la ventana es hoy..hoy+6 = 7 días. */
const DIAS_DE_LA_VENTANA = 6;

/** Suma días a un `YYYY-MM-DD` **por partes literales**.
 *
 *  🔴 Jamás `new Date(iso)`: el ISO de fecha sola se parsea como UTC y en
 *  UTC−5 devuelve el día anterior (D-312, hallazgo S55). La misma trampa que
 *  `sumarDias` documenta en `apps/prestador/src/lib/dia-local.ts`. */
function sumarDiasIso(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const base = new Date(a ?? 0, (m ?? 1) - 1, (d ?? 1) + dias);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(base);
}

export interface InputConteoSemanaPrestador {
  prestador_id: string;
}

/**
 * Cuántas citas FIRMES tiene el prestador entre hoy y hoy+6, contadas por el
 * servidor y en la zona horaria de SU negocio.
 */
export async function obtenerConteoSemanaPrestador(
  input: InputConteoSemanaPrestador,
): Promise<ResultadoWrapper<number, CodigoErrorConteoSemana>> {
  const cliente = getClient();

  /* La zona sale de la fila del prestador. Si la fila no se puede leer, NO se
     cae a la zona de la casa: un default plausible acá contaría la semana de
     Ecuador para un negocio que puede no estar acá, sin error y sin aviso —
     el atajo que `dia-local.ts` volvió inexpresable a propósito (S112-C). */
  const prestador = await cliente
    .from('prestadores')
    .select('zona_horaria')
    .eq('id', input.prestador_id)
    .maybeSingle();

  if (prestador.error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const zona = prestador.data?.zona_horaria ?? null;
  if (zona === null) {
    return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  }

  const desde = diaDelNegocio(zona);
  const hasta = sumarDiasIso(desde, DIAS_DE_LA_VENTANA);

  const { data, error } = await cliente.rpc('contar_citas_semana_prestador', {
    p_prestador_id: input.prestador_id,
    p_desde: desde,
    p_hasta: hasta,
  });

  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  /* Guard de shape (L-124): la RPC devuelve `integer`, pero un `null` o algo
     que no sea número NO se degrada a 0 — un cero es un hecho («no tenés nada
     esta semana») y fabricarlo desde un fallo es la mentira más cara de esta
     pantalla. Error honesto, y el techo dibuja «Hoy libre» sin número. */
  if (typeof data !== 'number' || !Number.isFinite(data)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  return { ok: true, data };
}
