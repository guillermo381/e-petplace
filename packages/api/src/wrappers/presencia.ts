/**
 * EL ESCRIBA DE LA PRESENCIA (S84-A10) — puerta única sobre la Edge
 * Function `escribir-presencia`. Molde LITERAL de `extraerVacunasDeCarnet`
 * (S46): **la app jamás llama edge functions directo**; `packages/api` es
 * la puerta.
 *
 * La letra es `MODELO_PRESENCIA` §5, y la function la implementa entera
 * (muros en el prompt del sistema, verificación del superlativo en la
 * salida). Este wrapper **no re-implementa ninguna regla**: traduce.
 *
 * ── LOS SEIS CÓDIGOS VIAJAN TIPADOS, Y NO SE COLAPSAN ────────────────
 * El mapeo a voz es **contrato, no cosmética**. Si viviera en la pantalla,
 * el día que un código cambie **el error se degradaría en silencio** — la
 * superficie seguiría mostrando su voz vieja para un caso que ya no
 * existe, y nadie se enteraría. Por eso los seis llegan distinguibles
 * aunque cuatro compartan tono.
 *
 * Los DOS que la superficie tiene que distinguir sí o sí:
 *   · `faltan_respuestas`   → dispara las dos preguntas de §5
 *   · `tope_regeneraciones` → la voz del límite
 *
 * ── EL PATRÓN QUE ESTO DEJA ESCRITO ──────────────────────────────────
 * **El rebote por `faltan_respuestas` NO es validación de formulario: es
 * el MOTOR imponiendo §5.** Sobre un campo vacío la IA solo podría
 * inventar, y eso es el primer muro de la letra. **La conducta del botón
 * —preguntar antes de escribir— no depende de que la pantalla se acuerde
 * de implementarla**: si una superficie futura llama sin respuestas, el
 * motor la frena igual. *Una regla que vive en el motor no se puede
 * olvidar; una que vive en la pantalla se olvida en la segunda pantalla.*
 */

import { FunctionsHttpError } from '@supabase/supabase-js';
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/** Los SEIS de la function + los dos que solo puede producir el borde
 *  del transporte (sin red / forma inesperada). */
const CODIGOS_ERROR_PRESENCIA = [
  'faltan_respuestas',
  'tope_regeneraciones',
  'entrada_invalida',
  'configuracion_faltante',
  'error_modelo',
  'redaccion_fallida',
  'datos_inconsistentes',
  'error_desconocido',
] as const;
export type CodigoErrorPresencia = (typeof CODIGOS_ERROR_PRESENCIA)[number];

const MENSAJES: Record<CodigoErrorPresencia, string> = {
  // ① el que dispara las preguntas de §5 — NO es un error del usuario:
  //    es el producto pidiendo el material que necesita para no inventar.
  faltan_respuestas:      'Todavía no hay con qué escribir: contanos algo tuyo primero.',
  // ② la voz del límite
  tope_regeneraciones:    'Ya generamos varios borradores. Editá el que más te guste.',
  // ③-⑥ comparten tono de fallo, y aun así llegan distinguibles
  entrada_invalida:       'No pudimos armar el borrador con esos datos.',
  configuracion_faltante: 'El asistente no está disponible ahora mismo.',
  error_modelo:           'El asistente no respondió. Probá de nuevo en un momento.',
  // el muro roto: la function prefiere no entregar nada antes que entregar
  // una afirmación que el prestador no puede sostener.
  redaccion_fallida:      'El borrador no salió como debía. Probá de nuevo.',
  datos_inconsistentes:   'La respuesta del asistente no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Probá de nuevo.',
};

export interface HechoPresencia {
  /** `verificado` se CITA, no se parafrasea (§5). */
  etiqueta: 'verificado' | 'declarado';
  texto: string;
}

export interface InputEscribirPresencia {
  hechos: HechoPresencia[];
  /** Las 2-3 respuestas humanas de §5. **Vacío ⇒ `faltan_respuestas`** —
   *  no se manda un pedido que el motor va a rechazar (Ley 23), pero el
   *  motor lo rechaza igual si alguien lo saltea. */
  respuestas: string[];
  /** Si existe, el escriba MEJORA en vez de crear de cero. */
  borradorPrevio?: string;
  /** 1-based. El tope vive en el MOTOR: mandarlo mal no lo levanta. */
  intento?: number;
  /** ④ S84-A14/A19 — **"probar otra" NO es "mejorar"**, y el motor sabe la
   *  diferencia: con `alternativa` escribe uno DISTINTO en vez de retocar
   *  el anterior. Default `mejorar`, así que quien no lo manda no cambia
   *  de comportamiento.
   *  *Faltaba acá: la function lo soportaba entero y el wrapper no lo
   *  reenviaba — el botón de C prometía variedad y recibía continuidad.* */
  modo?: 'mejorar' | 'alternativa';
}

/** El borrador nace bilingüe (§5 + DEFINICION_SOFTLAUNCH). */
export interface BorradorPresencia {
  es: string;
  en: string;
}

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export async function escribirPresencia(
  input: InputEscribirPresencia,
): Promise<ResultadoWrapper<BorradorPresencia, CodigoErrorPresencia>> {
  // Ley 23 — la puerta no ofrece lo que va a rechazar: el viaje se ahorra.
  // **No es el guard**: el guard está en la function y sigue ahí aunque
  // esto se borre. Acá solo se evita un round-trip inútil.
  const respuestas = input.respuestas
    .filter((r) => typeof r === 'string' && r.trim().length > 0)
    .map((r) => r.trim());
  if (respuestas.length === 0) {
    return { ok: false, codigo: 'faltan_respuestas', mensaje: MENSAJES.faltan_respuestas };
  }

  const { data, error } = await getClient().functions.invoke('escribir-presencia', {
    body: {
      hechos: input.hechos,
      respuestas,
      borradorPrevio: input.borradorPrevio,
      intento: input.intento,
      modo: input.modo,
    },
  });

  if (error) {
    // La function responde { codigo, mensaje } con status de error;
    // functions-js los entrega como FunctionsHttpError con la Response
    // sin consumir en .context.
    if (error instanceof FunctionsHttpError) {
      try {
        const cuerpo: unknown = await error.context.json();
        const codigo = esObj(cuerpo) ? cuerpo.codigo : null;
        if (
          typeof codigo === 'string' &&
          (CODIGOS_ERROR_PRESENCIA as readonly string[]).includes(codigo)
        ) {
          const c = codigo as CodigoErrorPresencia;
          return { ok: false, codigo: c, mensaje: MENSAJES[c] };
        }
      } catch {
        // body no-JSON: cae al error_desconocido de abajo.
      }
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  if (!esObj(data) || !esObj(data.borrador)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  const b = data.borrador;
  if (typeof b.es !== 'string' || b.es.trim().length === 0 ||
      typeof b.en !== 'string' || b.en.trim().length === 0) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }

  return { ok: true, data: { es: b.es, en: b.en } };
}
