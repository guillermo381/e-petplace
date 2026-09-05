// Wrapper de `sugerir-raza` (S113-D, lote 1.2). Molde LITERAL del de vacunas:
// errores tipados por código, guard de shape contra el contrato de la edge.
//
// 🔴 ESTA SUGERENCIA NO SE GUARDA SOLA, NUNCA. `D-379` es explícita: el
// catálogo **SUGIERE y jamás impone** —hay un cinturón que aborta toda
// migración que le ponga un FK a `mascotas.raza`—, y `mascotas.raza` es texto
// libre a propósito. Lo que devuelve esto va a una pantalla donde **la persona
// elige**; si algún día se escribiera sola, dejaría de ser una sugerencia y
// pasaría a ser el sistema decidiendo quién es la mascota de alguien.

import { FunctionsHttpError } from '@supabase/supabase-js';

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;

/** Mismo vocabulario que la extracción del carnet — la casa tiene UNA escala
 *  de confianza, no una por pieza. */
export type ConfianzaRaza = 'alta' | 'media' | 'baja';

export interface CandidataRaza {
  /** `cat_razas.slug`, VERBATIM del catálogo. Ojo: el catálogo tiene tipeos
   *  reales (`pitbul-terrier` con una L, `jack-rusell` con una S) y son el
   *  valor válido — "corregirlos" produce un código que no existe. */
  raza_codigo: string;
  confianza: ConfianzaRaza;
}

export interface SugerenciaDeRaza {
  /** Hasta 3, en orden de parecido. **Vacío es una respuesta**, no una falla:
   *  o no hay animal, o el animal no es de la especie declarada. */
  candidatas: CandidataRaza[];
  /** El animal se ve mezclado. Puede venir `true` CON candidatas: un mestizo
   *  se parece a algo. */
  mestizo: boolean;
  /** No hay ningún animal en la foto. Si es `true`, `candidatas` está vacío
   *  — la edge rebota la contradicción antes de que llegue acá. */
  sin_animal: boolean;
  /** Lo que el modelo propuso y la edge NO pudo usar, con su razón. **Una
   *  candidata que no sirve se descarta sola: no tumba la respuesta.** Es
   *  diagnóstico —la pantalla no tiene por qué mostrarlo— pero viaja para que
   *  se pueda medir cuánto se está descartando. */
  descartadas: { valor: string; motivo: string }[];
}

export interface InputSugerirRaza {
  imagenBase64: string;
  /** La especie que la persona DECLARÓ. La edge lee de `cat_razas` las razas
   *  activas de esa especie y el modelo elige sólo de ahí. */
  especie: string;
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

const CODIGOS_ERROR_RAZA = [
  'cuerpo_invalido',
  'imagen_invalida',
  'especie_desconocida',
  'configuracion_faltante',
  'error_modelo',
  'sugerencia_fallida',
] as const;

export type CodigoErrorRaza = (typeof CODIGOS_ERROR_RAZA)[number];

const MENSAJES: Record<CodigoErrorRaza | 'error_desconocido' | 'datos_inconsistentes', string> = {
  cuerpo_invalido:        'No pudimos usar esa foto. Prueba con otra.',
  imagen_invalida:        'La foto no se pudo procesar. Prueba con otra.',
  especie_desconocida:    'Todavía no tenemos razas para esa especie.',
  configuracion_faltante: 'El servicio no está disponible en este momento.',
  error_modelo:           'No pudimos mirar la foto ahora. Prueba de nuevo en un rato.',
  sugerencia_fallida:     'No pudimos reconocer nada en esa foto. Prueba con otra más clara.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Prueba de nuevo.',
};

const CONFIANZAS: readonly string[] = ['alta', 'media', 'baja'];

function esCandidata(v: unknown): v is CandidataRaza {
  return (
    esObj(v) &&
    typeof v.raza_codigo === 'string' && v.raza_codigo.trim().length > 0 &&
    typeof v.confianza === 'string' && CONFIANZAS.includes(v.confianza)
  );
}

/** Propone razas del catálogo a partir de una foto. **La persona confirma.** */
export async function sugerirRaza(
  input: InputSugerirRaza,
): Promise<ResultadoWrapper<SugerenciaDeRaza, CodigoErrorRaza>> {
  const { data, error } = await getClient().functions.invoke('sugerir-raza', {
    body: {
      imagenBase64: input.imagenBase64,
      especie: input.especie,
      mediaType: input.mediaType,
    },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const cuerpo: unknown = await error.context.json();
        const codigo = esObj(cuerpo) ? cuerpo.codigo : null;
        if (typeof codigo === 'string' && (CODIGOS_ERROR_RAZA as readonly string[]).includes(codigo)) {
          const c = codigo as CodigoErrorRaza;
          return { ok: false, codigo: c, mensaje: MENSAJES[c] };
        }
      } catch {
        // body no-JSON: cae al error_desconocido de abajo.
      }
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  if (!esObj(data) || !Array.isArray(data.candidatas) || !Array.isArray(data.descartadas) ||
      typeof data.mestizo !== 'boolean' || typeof data.sin_animal !== 'boolean') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  const candidatas: CandidataRaza[] = [];
  for (const c of data.candidatas) {
    if (!esCandidata(c)) {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
    }
    candidatas.push({ raza_codigo: c.raza_codigo, confianza: c.confianza });
  }
  return {
    ok: true,
    data: {
      candidatas,
      mestizo: data.mestizo,
      sin_animal: data.sin_animal,
      descartadas: data.descartadas as SugerenciaDeRaza['descartadas'],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// A8 · LA FICHA DE LA RAZA — lo que la familia lee sobre de dónde viene su
//      mascota. **Contenido escrito por un modelo y publicado por una persona.**
//
// 🔴 NO HACE FALTA RPC: la política de `razas_contenido` sólo deja salir las
// filas con `activo`, así que **este wrapper no puede leer un borrador aunque
// se lo pida**. *La puerta es la RLS, y por eso el error de olvidar el filtro
// es inexpresable acá arriba.*
//
// ⚠️ Y por eso el tipo no expone `conocida`: un CHECK impide publicar una ficha
// de raza no conocida, así que **todo lo que llega acá es, por construcción, de
// una raza que el modelo dijo conocer**. Exponerlo invitaría a preguntar algo
// que ya está contestado.
// ═══════════════════════════════════════════════════════════════════════════

export interface CuidadosPorEtapa {
  cachorro: string | null;
  adulto: string | null;
  senior: string | null;
}

export interface ContenidoDeRaza {
  especie: string;
  raza_codigo: string;
  origen: string | null;
  temperamento: string | null;
  talla_adulta: string | null;
  esperanza_vida: string | null;
  /** Hasta cinco. **Son temas para conversar con el veterinario, jamás
   *  diagnósticos**: que la raza tenga una predisposición no significa que ESTE
   *  animal la tenga, y la pantalla que las dibuje tiene que decirlo. */
  predisposiciones: readonly string[];
  cuidados_por_etapa: CuidadosPorEtapa;
  /** De qué modelo salió y cuándo. Viaja para que el día que un texto salga
   *  mal, la pregunta «¿cuántos más como éste hay?» tenga respuesta. */
  modelo: string;
  generado_el: string;
}

export type CodigoErrorContenidoRaza = 'datos_inconsistentes' | 'error_desconocido';

const texto = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v : null;

/**
 * La ficha PUBLICADA de una raza, o `null` cuando no hay ninguna.
 *
 * ⚠️ **`null` es la respuesta normal, no un error.** Hoy hay 105 razas en el
 * catálogo y cero fichas publicadas: lo esperable es que esto devuelva `null`
 * casi siempre. *Una pantalla que trate el `null` como falla va a decirle a la
 * familia que algo se rompió cuando lo único que pasa es que todavía no
 * escribimos sobre su raza.*
 */
export async function obtenerContenidoDeRaza(
  especie: string,
  razaCodigo: string,
): Promise<ResultadoWrapper<ContenidoDeRaza | null, CodigoErrorContenidoRaza>> {
  const { data, error } = await getClient()
    .from('razas_contenido')
    .select('especie, raza_codigo, origen, temperamento, talla_adulta, esperanza_vida, predisposiciones, cuidados_por_etapa, modelo, generado_el')
    .eq('especie', especie)
    .eq('raza_codigo', razaCodigo)
    .maybeSingle();

  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  if (data === null) return { ok: true, data: null };

  const o = data as unknown as Record<string, unknown>;
  const c = esObj(o.cuidados_por_etapa) ? o.cuidados_por_etapa : {};
  if (typeof o.especie !== 'string' || typeof o.raza_codigo !== 'string' ||
      typeof o.modelo !== 'string' || typeof o.generado_el !== 'string') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }

  return {
    ok: true,
    data: {
      especie: o.especie,
      raza_codigo: o.raza_codigo,
      origen: texto(o.origen),
      temperamento: texto(o.temperamento),
      talla_adulta: texto(o.talla_adulta),
      esperanza_vida: texto(o.esperanza_vida),
      predisposiciones: Array.isArray(o.predisposiciones)
        ? o.predisposiciones.filter((x): x is string => typeof x === 'string')
        : [],
      cuidados_por_etapa: {
        cachorro: texto(c.cachorro),
        adulto: texto(c.adulto),
        senior: texto(c.senior),
      },
      modelo: o.modelo,
      generado_el: o.generado_el,
    },
  };
}
