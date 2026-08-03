// Países activos con su NOMBRE (S58-B, curas del gate) — la voz humana
// para agrupar catálogos por país (zonas del taller: la Hoja "Otra
// ciudad" jamás muestra un código de motor, Ley 3/17.2). Puerta única
// sobre la RPC pública pre-login `get_paises_activos` (familia L-140:
// EXECUTE público intacto por decisión — es catálogo de arranque).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_PAISES = ['error_desconocido'] as const;
export type CodigoErrorPaises = (typeof CODIGOS_ERROR_PAISES)[number];

const MENSAJES: Record<CodigoErrorPaises, string> = {
  error_desconocido: 'No pudimos cargar los países. Prueba de nuevo.',
};

export interface PaisActivo {
  codigo: string; // iso2 — la key de agrupación (country_code de la casa)
  nombre: string;
}

export async function obtenerPaisesActivos(): Promise<ResultadoWrapper<PaisActivo[], CodigoErrorPaises>> {
  const { data, error } = await getClient().rpc('get_paises_activos');
  if (error || !Array.isArray(data)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const paises: PaisActivo[] = [];
  for (const fila of data) {
    if (typeof fila?.codigo_iso2 === 'string' && typeof fila?.nombre === 'string') {
      paises.push({ codigo: fila.codigo_iso2, nombre: fila.nombre });
    }
  }
  return { ok: true, data: paises };
}

// ─────────────────────────────────────────────────────────────────────────
// S85-A · LOS PAÍSES DEL MUNDO — la mitad de A de D-633.
//
// ⚠️ ESTO NACE **DENTRO** DE ESTE ARCHIVO Y NO EN UNO NUEVO, y el porqué es
// el hallazgo que lo justifica: al ir a crear `wrappers/paises.ts` me
// encontré con que **YA EXISTÍA desde S58**. **D-633 nunca lo contó.** Su
// censo miró copias en `apps/` y **no miró los lectores de `packages/api`**
// — o sea que el mapa de "dónde viven los países" estaba incompleto en la
// dirección contraria a la que la ficha denunciaba.
//
// *Crear un segundo `paises.ts` para curar una deuda de duplicación habría
// sido el chiste completo.* L-175 al pie: **se ensancha, jamás se copia.**
//
// ── SON TRES PREGUNTAS DISTINTAS, y por eso conviven ─────────────────────
//
//   · `obtenerPaisesActivos()`      → activos, código+nombre. Agrupar
//                                     catálogos por país (zonas del taller).
//   · `obtenerPaisesParaRegistro()` → activos + datos FISCALES (tipos,
//                                     máscaras, nombres). Abrir cuenta.
//   · `obtenerPaisesDelMundo()`     → **TODOS**, con su prefijo y formato de
//                                     teléfono. **Declarar un ORIGEN.**
//
// **El país que EMITIÓ un documento no tiene por qué ser uno donde
// operamos**, y el caso canónico ya nos cobró dos veces: *un profesional
// colombiano ejerciendo en Quito tiene tarjeta colombiana*, y el WhatsApp
// del founder es `+57` con perfil `EC`. **Con un lector de activos, ese caso
// real es imposible de declarar.**
//
// ── LO QUE ESTE LECTOR VIENE A MATAR, medido fila por fila (S85-A2) ──────
//
// `apps/prestador/src/lib/paises.ts` tiene los mismos 23 códigos, nombres y
// prefijos que `cat_paises`. **Y UN formato distinto:**
//
//     PE · Perú    cat_paises: ^\+51\d{7,9}$    la copia: ^\+51\d{9}$
//
// **La app rebota números peruanos que la fuente acepta.** *No era una
// divergencia de volumen —la ficha creía que la copia tenía siete países de
// más, y no los tiene— sino de CONTENIDO, en el único campo que valida.*
// Cablear esto la cura sola: el formato deja de tener dos autores.
//
// **La función de motor ya existía y jamás tuvo un consumidor**
// (`get_paises_para_telefono`, cero ocurrencias fuera de los tipos
// generados). *No se escribe un lector: se cablea el que está.*
//
// NOTA DE PRIVILEGIOS (L-140, declarada y no heredada en silencio): la RPC
// lleva `anon=X` en su `proacl`. **No se toca acá** —cambiar grants de una
// función con cero consumidores es una migración que nadie pidió— pero
// queda dicho: es catálogo de solo lectura y la app la llama como
// `authenticated`. Angostarla, si algún día se decide, va por escrito.
// ─────────────────────────────────────────────────────────────────────────

export interface PaisDelMundo {
  /** ISO-3166-1 alfa-2. */
  codigo: string;
  nombre: string;
  /** Con su `+` — E.164 entero (regla 28 derogada el 2-ago). */
  prefijo: string | null;
  /** Regex del número completo. **`null` = este país no declara formato ⇒
   *  NO se valida.** Medido: 9 de 23 lo declaran. *Al que no lo tiene no se
   *  le inventa uno parecido — sería el dato plausible-y-falso de L-180.* */
  formato: string | null;
}

/** Los 23 del catálogo **sin filtrar por `activo`**, con los activos
 *  primero (el orden lo pone la función de motor, no este wrapper). */
export async function obtenerPaisesDelMundo(): Promise<
  ResultadoWrapper<PaisDelMundo[], CodigoErrorPaises>
> {
  const { data, error } = await getClient().rpc('get_paises_para_telefono');
  if (error || !Array.isArray(data)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const paises: PaisDelMundo[] = [];
  for (const fila of data) {
    /* Guard de shape contra el RETURNS REAL, verificado con
       `pg_get_function_result` (L-124): codigo_iso2 · nombre ·
       prefijo_telefono · formato_telefono. Una fila sin código o sin nombre
       no es un país a medias: no se puede mostrar, y se descarta en vez de
       pintar `undefined`. */
    if (typeof fila?.codigo_iso2 !== 'string' || typeof fila?.nombre !== 'string') continue;
    paises.push({
      codigo: fila.codigo_iso2,
      nombre: fila.nombre,
      prefijo: typeof fila.prefijo_telefono === 'string' ? fila.prefijo_telefono : null,
      formato: typeof fila.formato_telefono === 'string' ? fila.formato_telefono : null,
    });
  }
  return { ok: true, data: paises };
}
