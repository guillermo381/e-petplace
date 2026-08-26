/**
 * S106-A t2 · EL CUADRO CONGELADO — la puerta del adjunto de teleconsulta.
 *
 * El profesional congela un cuadro del video remoto y queda en el expediente
 * de la mascota. **El contrato de la pieza de motor incluye su wrapper**: en
 * este frente el patrón «motor sin puerta» ya cobró tres veces.
 *
 * 🔴 **LA MARCA DE TELECONSULTA NO VIAJA COMO CAMPO: VIAJA POR ESTRUCTURA.**
 *    El adjunto cuelga del evento padre de la cita, y la cita dice
 *    `modalidad = 'telemedicina'`. Por eso **también viaja cuando la ficha se
 *    exporta o se imprime**, sin que nadie tenga que acordarse de copiarla —
 *    que es exactamente lo que el análisis legal del 26-ago pidió.
 *
 *    *Y lo que esa marca hace, que no es decorativo: delimita el estándar
 *    contra el que se juzga al veterinario — lo que podía ver por video, no
 *    lo que habría palpado.*
 *
 * 🔴 **ESTE WRAPPER NO SUBE EL ARCHIVO.** Recibe el `storage_path` de algo que
 *    YA está en el bucket. *Son dos fallas distintas —«no se pudo subir» y «se
 *    subió pero no se pudo registrar»— y colapsarlas dejaría a la superficie
 *    diciendo «no se guardó» sobre una imagen que sí está.*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/** Los códigos, **del cuerpo vivo de la función**, no de un contrato a mano. */
export type CodigoCuadroTeleconsulta =
  | 'sin_sesion'
  | 'bucket_requerido'
  | 'storage_path_requerido'
  | 'cita_inexistente'
  /** La cita existe y **no es** teleconsulta. */
  | 'no_es_teleconsulta'
  /** Defecto nuestro: la cita no tiene evento en la línea de vida. */
  | 'cita_sin_evento_padre'
  /** Quien llama no puede escribir clínica en ese negocio. */
  | 'sin_capacidad_clinica'
  | 'categoria_archivo_invalida'
  | 'categoria_archivo_inactiva'
  | 'no_se_pudo_completar';

export interface CuadroAdjuntado {
  adjuntoId: string;
  /** El evento de la línea de vida del que cuelga: **es la cita**. */
  eventoPadreId: string;
  /** Siempre `foto_consulta`. Se expone para que la pantalla no lo suponga. */
  categoria: string;
}

export interface InputCuadroTeleconsulta {
  citaId: string;
  bucket: string;
  /** Path del objeto **ya subido**. */
  storagePath: string;
  mimeType?: string;
  tamanoBytes?: number;
  descripcion?: string;
}

/**
 * Adjunta un cuadro congelado a la historia de la mascota.
 *
 * **No interrumpe la llamada.** Quien la consuma dibuja su flash y sigue; si
 * esto falla, lo dice y **no promete** — el cuadro no quedó en la historia.
 */
export async function adjuntarCuadroTeleconsulta(
  input: InputCuadroTeleconsulta,
): Promise<ResultadoWrapper<CuadroAdjuntado, CodigoCuadroTeleconsulta>> {
  const { data, error } = await getClient().rpc('adjuntar_cuadro_teleconsulta', {
    p_cita_id: input.citaId,
    p_bucket: input.bucket,
    p_storage_path: input.storagePath,
    /* `undefined`, no `null`: los tipos generados declaran estos parámetros
       como opcionales, y mandar `null` explícito no compila. */
    p_mime_type: input.mimeType,
    p_tamano_bytes: input.tamanoBytes,
    p_descripcion: input.descripcion,
  });

  if (error) {
    /* Los códigos llegan como `RAISE EXCEPTION '<codigo>'`, a veces con cola
       (`categoria_archivo_invalida: foto_consulta`) ⇒ se normaliza por
       `startsWith`, jamás por igualdad (L-115). */
    const msg = error.message ?? '';
    const conocidos: CodigoCuadroTeleconsulta[] = [
      'sin_sesion', 'bucket_requerido', 'storage_path_requerido',
      'cita_inexistente', 'no_es_teleconsulta', 'cita_sin_evento_padre',
      'sin_capacidad_clinica', 'categoria_archivo_invalida', 'categoria_archivo_inactiva',
    ];
    const hallado = conocidos.find((c) => msg.startsWith(c));
    return {
      ok: false,
      codigo: hallado ?? 'no_se_pudo_completar',
      mensaje: hallado ?? msg,
    };
  }

  const d = (data ?? {}) as Record<string, unknown>;
  /* Se verifica la forma antes de devolverla: un `ok:true` sin `adjunto_id`
     hace fallar a la pantalla dos pasos más adelante, donde ya nadie sabe que
     el problema fue la respuesta del servidor. */
  if (
    d.ok !== true || typeof d.adjunto_id !== 'string' ||
    typeof d.evento_padre_id !== 'string' || typeof d.categoria !== 'string'
  ) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'respuesta_incompleta' };
  }

  return {
    ok: true,
    data: {
      adjuntoId: d.adjunto_id,
      eventoPadreId: d.evento_padre_id,
      categoria: d.categoria,
    },
  };
}
