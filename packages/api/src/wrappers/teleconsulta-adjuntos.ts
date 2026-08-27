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

/* ── LA PUERTA DE SUBIDA DEL CUADRO ──────────────────────────────────────── */

/**
 * 🔴 **Existe porque el motor estaba sin su puerta — el SEXTO caso de la
 * sesión.** `adjuntarCuadroTeleconsulta` ya tomaba `bucket` + `storagePath`,
 * pero **nadie podía producir ese path**: la captura ocurría, se veía, y **no
 * llegaba al expediente.**
 *
 * ⇒ *El contrato de una pieza de motor incluye su wrapper.* Es `L-318` en su
 * forma de superficie, y se anota acá para que la próxima pieza nazca con las
 * dos mitades.
 *
 * ── LA FORMA NO ES NUEVA: ES LA DE `subirEvidencia` ────────────────────────
 * Mismo bucket (`cita-archivos`), **mismo path `{prestadorId}/…`** — que no es
 * una convención: **la policy del bucket valida
 * `user_puede_acceder_prestador(primer segmento)`**, así que un path con otra
 * forma **rebota**. *Copiar el molde no es comodidad: es que el permiso está
 * escrito sobre esa forma.*
 *
 * ── EL HUÉRFANO RECUPERABLE, y por qué importa acá más que en el paseo ─────
 * Son **dos pasos** —subir y registrar— y el segundo puede fallar solo. Si eso
 * pasa, se devuelve el `storagePath` **para reintentar sólo el registro**.
 *
 * > *En una teleconsulta el cuadro es irrepetible: el animal ya no está frente
 * > a la cámara. Perderlo por un fallo de red del segundo paso sería tirar la
 * > única imagen que iba a existir de ese momento.*
 */
export type CausaSubidaCuadro = 'lectura' | 'red' | 'servidor';

export interface ResultadoSubidaCuadro {
  ok: boolean;
  /** El path ya subido. **Se conserva aunque el registro falle**, para que el
   *  reintento salte el paso 1 y no vuelva a subir la imagen. */
  storagePath?: string;
  /** El id del adjunto en el expediente. Lo devuelve el motor, no se compone. */
  adjuntoId?: string;
  mensaje?: string;
  causa?: CausaSubidaCuadro;
}

const BUCKET_CUADRO = 'cita-archivos';

function esRedCuadro(m: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(m);
}

/**
 * Sube el PNG del cuadro y lo adjunta a la teleconsulta.
 *
 * @param bytes  el PNG ya decodificado. **Se recibe en bytes, no como uri**:
 *   el cuadro sale del módulo nativo en memoria y *hacerlo pasar por un archivo
 *   temporal sólo para volver a leerlo agrega un modo de falla que no existe.*
 */
export async function subirCuadroTeleconsulta(input: {
  citaId: string;
  prestadorId: string;
  bytes: ArrayBuffer;
  /** Reintento post-subida: salta el paso 1. */
  storagePath?: string;
}): Promise<ResultadoSubidaCuadro> {
  let path = input.storagePath;

  if (path === undefined) {
    /* 🔴 EL PRIMER SEGMENTO ES EL PRESTADOR — lo exige la policy, no el gusto. */
    path = `${input.prestadorId}/cuadro-teleconsulta-${Date.now()}.png`;
    const { error } = await getClient()
      .storage.from(BUCKET_CUADRO)
      .upload(path, input.bytes, { contentType: 'image/png', upsert: false });
    if (error) {
      /* La causa queda en el log con su literal: *«no pudimos subir» sin la
         causa manda a revisar el wifi cuando el problema es un permiso.* */
      console.error(`[cuadro-teleconsulta] SUBIDA falló · bucket=${BUCKET_CUADRO} · ${error.message}`);
      return { ok: false, causa: esRedCuadro(error.message) ? 'red' : 'servidor', mensaje: error.message };
    }
  }

  const r = await adjuntarCuadroTeleconsulta({
    citaId: input.citaId,
    bucket: BUCKET_CUADRO,
    storagePath: path,
  });
  if (!r.ok) {
    /* ⚠️ **El path viaja de vuelta aunque esto falle.** Sin él, el reintento
       subiría la imagen otra vez y dejaría un huérfano en el bucket. */
    return { ok: false, storagePath: path, causa: 'servidor', mensaje: r.mensaje };
  }

  return { ok: true, storagePath: path, adjuntoId: r.data.adjuntoId };
}
