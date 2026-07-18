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

export const TIPOS_DOCUMENTO_VERIFICACION = ['titulo_profesional', 'registro_senescyt'] as const;
export type TipoDocumentoVerificacion = (typeof TIPOS_DOCUMENTO_VERIFICACION)[number];

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
  return v === 'titulo_profesional' || v === 'registro_senescyt';
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
    .select('id, tipo, nombre, estado, archivo_url, notas_revision, created_at')
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
    })
    .select('id, tipo, nombre, estado, archivo_url, notas_revision, created_at')
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
    },
  };
}
