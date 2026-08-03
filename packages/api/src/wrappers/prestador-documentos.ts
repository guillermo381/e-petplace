// LA VERIFICACIÓN PROFESIONAL — documentos del prestador (S68-B, P3).
// Contrato relevado contra DB VIVA (S68-B, solo lectura — chasis LEGACY
// completo, cero DDL nuevo):
//   · prestador_documentos: tipo CHECK con 'titulo_profesional' y
//     'registro_senescyt' (entre otros); estado CHECK
//     pendiente|aprobado|rechazado|vencido con DEFAULT 'pendiente'
//     ("En revisión" es la voz de ese default — la revisión es del
//     admin: revisado_por/notas_revision quedan de su lado).
//   · RLS prestador_documentos_own: el prestador escribe SOLO sus filas
//     (por prestadores.user_id) — escritura directa, cero RPC.
//   · Storage: bucket PRIVADO 'prestador-documentos', policy
//     prestador_archivos_propios — la carpeta raíz del path es el
//     auth.uid() del usuario (NO el prestador_id); admin lee.
// La verificación BLOQUEA ABRIR, jamás construir: este wrapper no gatea
// nada del taller — solo dice el estado con honestidad.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/* ── S84-A32 · LA VERIFICACIÓN PASA A SER DE PLATAFORMA ────────────────
   `LETRA_VERIFICACION_S85` (firmada 2-ago) parte la verificación en DOS
   EJES QUE NO SE MEZCLAN:

     ① POR FIGURA JURÍDICA — LOS CUATRO OFICIOS
        `persona_natural` → **cédula** · las otras tres → **RUC**
     ② POR OFICIO — solo veterinaria, ENCIMA del ①
        título profesional · registro SENESCYT

   **El ② no reemplaza al ①: se suma.** Una clínica constituida como
   empresa presenta RUC (①) **y** sus documentos de vet (②).

   ⚠️ CORRECCIÓN DE UNA MEDICIÓN PROPIA, declarada: al escribir la letra
   se dijo que este wrapper era "genérico". **Lo era en la DB —el ciclo de
   revisión no menciona vet— pero NO acá:** `TIPOS_DOCUMENTO_VERIFICACION`
   listaba solo los dos de veterinaria, y `obtenerDocumentosVerificacion`
   filtraba por ellos. *El motor servía a los cuatro oficios y el wrapper
   servía a uno.* **Eso es lo que este hunk ensancha.**

   Y LO QUE **NO** SE TOCÓ, con su razón: el trigger
   `_trg_ps_verificacion_profesional`. Al medirlo resultó **no ser un
   disparador de verificación sino un GUARD DE BLOQUEO** — impide activar
   un servicio médico sin documento aprobado. **Es de la capa ②, que la
   orden excluye explícitamente**, y además chocaría con §5 (*sin
   verificación el prestador opera igual*) si se lo ensanchara a los
   cuatro oficios. **Ensanchar el llamador no toca el ciclo; ensanchar ese
   trigger sí habría sido otra cosa.** */

/** Los del eje ① — TODOS los oficios. La cédula y el RUC ya existían en
 *  el CHECK de la tabla desde antes de esta letra: el esquema se adelantó. */
export const TIPOS_DOCUMENTO_FIGURA = ['cedula', 'ruc'] as const;

/** Los del eje ② — solo veterinaria, encima del ①. */
export const TIPOS_DOCUMENTO_OFICIO_VET = ['titulo_profesional', 'registro_senescyt'] as const;

/**
 * LA TERCERA CAPA — opcionales (S85, firma del founder). Migración
 * `20260803160000`: el CHECK de la tabla no tenía **ningún** tipo para una
 * certificación o acreditación; lo más cercano era `otro`, que sirve para
 * guardar el archivo y no para saber qué es. *Una certificación guardada
 * como `otro` es un documento que nadie puede volver a encontrar por lo
 * que ES.*
 *
 * ⚠️ **NO GATEA NADA, y por eso está aparte de los otros dos arreglos.**
 * `LETRA_PERFIL_S79` §6: la credencial de la PERSONA gatea la oferta
 * médica; todo lo demás **se recolecta y no bloquea**. Sumar este tipo al
 * predicado de `_trg_ps_verificacion_profesional` sería enmienda de §6 con
 * su propia firma — la separación en tres constantes existe justamente
 * para que nadie los mezcle de oficio.
 */
export const TIPOS_DOCUMENTO_OPCIONAL = ['certificacion'] as const;

export const TIPOS_DOCUMENTO_VERIFICACION = [
  ...TIPOS_DOCUMENTO_FIGURA,
  ...TIPOS_DOCUMENTO_OFICIO_VET,
  ...TIPOS_DOCUMENTO_OPCIONAL,
] as const;
export type TipoDocumentoVerificacion = (typeof TIPOS_DOCUMENTO_VERIFICACION)[number];

/**
 * QUÉ DOCUMENTO PIDE EL EJE ① — se decide por lo que el negocio **TIENE**,
 * no por cómo se llama (firma del founder sobre el cuarteto fiscal).
 *
 * `persona_natural` es la ÚNICA que va con cédula. Las otras tres tienen
 * RUC: `persona_natural_obligada` porque está obligada a llevar
 * contabilidad, `persona_juridica` porque es el caso "empresa", y
 * `entidad_sin_fines_lucro` porque también lo tiene — **y son los
 * refugios**, que EL NORTE nombra como actor del ecosistema.
 *
 * **La puerta no pregunta lo que ya sabe (Ley 23):** la figura sale de
 * `cuentas_comerciales.tipo_fiscal`, que es NOT NULL y ya está poblada.
 * *Volver a preguntarla abriría la puerta a que las dos respuestas se
 * contradigan — y ese día ninguna es la verdad, porque nada dice cuál
 * gana.*
 */
export function documentoDeFigura(tipoFiscal: string): 'cedula' | 'ruc' {
  return tipoFiscal === 'persona_natural' ? 'cedula' : 'ruc';
}

export const ESTADOS_DOCUMENTO = ['pendiente', 'aprobado', 'rechazado', 'vencido'] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];

export interface DocumentoVerificacion {
  id: string;
  tipo: TipoDocumentoVerificacion;
  nombre: string;
  estado: EstadoDocumento;
  /** PATH dentro del bucket privado (jamás URL pública — patrón S47). */
  archivoPath: string;
  notasRevision: string | null;
  createdAt: string;
  /** ISO-3166-1 alfa-2 del país que EMITIÓ el documento. **null = no
   *  declarado**, jamás "el del negocio": derivarlo de `country_code` está
   *  prohibido (P21 — un vet colombiano en Quito tiene tarjeta
   *  colombiana). Los 9 documentos previos a S84 lo tienen en null, que
   *  es la verdad: no se preguntó. */
  paisEmisor: string | null;
}

const CODIGOS = ['sin_sesion', 'sin_datos'] as const;
export type CodigoErrorDocumentos = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorDocumentos | 'error_desconocido' | 'datos_inconsistentes', string> = {
  sin_sesion: 'No hay sesión activa.',
  sin_datos: 'No pudimos leer tus documentos.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'Ocurrió un error inesperado. Prueba de nuevo.',
};

function esTipoVerificacion(v: unknown): v is TipoDocumentoVerificacion {
  return (TIPOS_DOCUMENTO_VERIFICACION as readonly string[]).includes(v as string);
}

function esEstado(v: unknown): v is EstadoDocumento {
  return (ESTADOS_DOCUMENTO as readonly string[]).includes(v as string);
}

/** Los documentos de verificación PROPIOS (título/registro), del más
 *  reciente al más viejo — el vigente por tipo es el primero. */
export async function obtenerDocumentosVerificacion(
  prestadorId: string,
): Promise<ResultadoWrapper<DocumentoVerificacion[], CodigoErrorDocumentos>> {
  const { data, error } = await getClient()
    .from('prestador_documentos')
    .select('id, tipo, nombre, estado, archivo_url, notas_revision, created_at, pais_emisor')
    .eq('prestador_id', prestadorId)
    .in('tipo', [...TIPOS_DOCUMENTO_VERIFICACION])
    .order('created_at', { ascending: false });

  if (error) return { ok: false, codigo: 'sin_datos', mensaje: MENSAJES.sin_datos };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  const docs: DocumentoVerificacion[] = [];
  for (const f of data) {
    if (!esTipoVerificacion(f.tipo) || !esEstado(f.estado)) continue;
    docs.push({
      id: f.id,
      tipo: f.tipo,
      paisEmisor: typeof f.pais_emisor === 'string' ? f.pais_emisor : null,
      nombre: f.nombre,
      estado: f.estado,
      archivoPath: f.archivo_url,
      notasRevision: f.notas_revision,
      createdAt: f.created_at,
    });
  }
  return { ok: true, data: docs };
}

// ── S68-B7: la URL FIRMADA del documento (preview en la pantalla) ──
// Clon del patrón fotos.ts (S47): bucket privado, la firma es efímera
// (jamás se persiste), cache en memoria con TTL y margen. Un path que
// no firma devuelve null con su literal al log — el consumidor cae al
// placeholder digno (degradación diseñada, regla 36).

const BUCKET_DOCUMENTOS = 'prestador-documentos';
const TTL_SEGUNDOS = 3600;
const MARGEN_MS = 5 * 60 * 1000;
const cacheFirmas = new Map<string, { url: string; venceEn: number }>();

export async function resolverUrlDocumento(path: string): Promise<string | null> {
  const hit = cacheFirmas.get(path);
  if (hit && hit.venceEn > Date.now()) return hit.url;
  if (hit) cacheFirmas.delete(path);

  const { data, error } = await getClient()
    .storage.from(BUCKET_DOCUMENTOS)
    .createSignedUrl(path, TTL_SEGUNDOS);

  if (error || !data?.signedUrl) {
    console.error('[prestador-documentos] no se pudo firmar', path, '=', error?.message ?? 'sin signedUrl');
    return null;
  }
  cacheFirmas.set(path, { url: data.signedUrl, venceEn: Date.now() + TTL_SEGUNDOS * 1000 - MARGEN_MS });
  return data.signedUrl;
}

export interface RegistrarDocumentoInput {
  prestadorId: string;
  tipo: TipoDocumentoVerificacion;
  /** El nombre humano del documento (voz del prestador, ej. "Título de
   *  Médico Veterinario"). */
  nombre: string;
  /** El PATH ya subido dentro del bucket 'prestador-documentos'. */
  archivoPath: string;
  /** ISO-3166-1 alfa-2 del país que EMITIÓ el documento. **Se DECLARA:**
   *  la pantalla lo pregunta y este wrapper lo pasa tal cual.
   *  **Omitirlo guarda null (no declarado) — jamás el `country_code` del
   *  negocio.** Un vet colombiano en Quito tiene tarjeta colombiana, y
   *  derivarlo sería el mismo error que el teléfono ya nos cobró (P21). */
  paisEmisor?: string;
}

/** Registra un documento subido — nace 'pendiente' (el default de DB es
 *  la voz "En revisión"; la promoción es del admin, jamás de este lado). */
export async function registrarDocumentoVerificacion(
  input: RegistrarDocumentoInput,
): Promise<ResultadoWrapper<DocumentoVerificacion, CodigoErrorDocumentos>> {
  const { data, error } = await getClient()
    .from('prestador_documentos')
    .insert({
      prestador_id: input.prestadorId,
      tipo: input.tipo,
      nombre: input.nombre,
      archivo_url: input.archivoPath,
      // sin país ⇒ null explícito, que es "no declarado" y no un default.
      pais_emisor: input.paisEmisor ?? null,
    })
    .select('id, tipo, nombre, estado, archivo_url, notas_revision, created_at, pais_emisor')
    .single();

  if (error || data === null) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  if (!esTipoVerificacion(data.tipo) || !esEstado(data.estado)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  return {
    ok: true,
    data: {
      id: data.id,
      tipo: data.tipo,
      nombre: data.nombre,
      estado: data.estado,
      archivoPath: data.archivo_url,
      notasRevision: data.notas_revision,
      createdAt: data.created_at,
      paisEmisor: typeof data.pais_emisor === 'string' ? data.pais_emisor : null,
    },
  };
}
