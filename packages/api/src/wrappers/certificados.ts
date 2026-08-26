// ============================================================================
// ⚠️ PEDIDO A LA PISTA A — packages/api es SU territorio (§1 del método).
//
// Esta pista (S90-D) escribió este archivo para poder MEDIR la pantalla y el
// camino real; NO es una decisión tomada por encima de A. Se verifica y se
// firma, o se revierte. La alternativa —entregar una pantalla que no compila—
// habría hecho imposible el gate que la orden pide.
// ============================================================================
//
// EL CERTIFICADO DE SALUD — la captura del juicio y su papel (S90-D).
//
// La diferencia con `documentos.ts`, que es la que ordena todo: el carnet y
// la historia clínica IMPRIMEN lo que ya hay. El certificado CERTIFICA UN
// JUICIO que hoy no vive en ninguna tabla — por eso primero se EMITE (un
// acto, con la declaración del profesional en sus propias palabras) y recién
// después se abre su papel, apuntando a ESE acto.

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion: 'No hay sesión activa.',
  sin_permiso_clinico: 'Emitir un certificado es un acto clínico: tu rol no lo permite.',
  sin_matricula:
    'Para emitir un certificado necesitas tu matrícula profesional cargada. Sin ella el papel no dice quién firma.',
  sin_vinculo: 'No encontramos tu vínculo activo con este negocio.',
  negocio_ambiguo:
    'Trabajás en más de un negocio: emití el certificado desde la cita, así el papel dice desde cuál.',
  negocio_incompleto: 'El negocio no tiene nombre comercial cargado: el papel no tendría emisor.',
  alcance_invalido: 'Ese alcance no existe.',
  alcance_no_aplica: 'Para esta mascota solo se puede emitir una constancia de atención.',
  declaracion_requerida: 'Falta tu declaración: el certificado son tus palabras, no las nuestras.',
  cita_invalida: 'Esa cita no corresponde a esta mascota.',
  mascota_no_existe: 'No encontramos a esta mascota.',
  sin_acceso: 'No tienes acceso al expediente de esta mascota.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'No pudimos emitir el certificado. Prueba de nuevo.',
} as const;

export type CodigoCertificado = keyof typeof MENSAJES;
type Falla = { ok: false; codigo: CodigoCertificado; mensaje: string };
function falla(codigo: CodigoCertificado): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

/** El alcance se ELIGE y se imprime. Un certificado sin alcance promete todo. */
export type AlcanceCertificado = 'viaje' | 'hospedaje' | 'guarderia' | 'constancia';

export interface CertificadoEmitido {
  id: string;
  alcance: AlcanceCertificado;
  declaracion: string;
  fechaExamen: string;
  emitidoEn: string;
  emisorNombre: string;
  emisorMatricula: string;
  negocioNombre: string;
  estadoVidaAlEmitir: 'activa' | 'perdida' | 'fallecida';
}

/** Los rebotes del motor, mapeados por PREFIJO — los RAISE llevan detalle
 *  después de los dos puntos y `startsWith` los cubre sin string-matching
 *  frágil sobre el mensaje entero. */
function codigoDeError(mensaje: string): CodigoCertificado {
  if (mensaje.startsWith('auth_required')) return 'sin_sesion';
  if (mensaje.startsWith('rol_sin_emision_clinica')) return 'sin_permiso_clinico';
  if (mensaje.startsWith('matricula_profesional_faltante')) return 'sin_matricula';
  if (mensaje.startsWith('firmante_sin_nombre')) return 'sin_matricula';
  if (mensaje.startsWith('sin_vinculo_activo') || mensaje.startsWith('sin_negocio')) return 'sin_vinculo';
  if (mensaje.startsWith('negocio_ambiguo')) return 'negocio_ambiguo';
  if (mensaje.startsWith('negocio_sin_nombre')) return 'negocio_incompleto';
  if (mensaje.startsWith('alcance_no_aplica_al_estado')) return 'alcance_no_aplica';
  if (mensaje.startsWith('alcance_invalido')) return 'alcance_invalido';
  if (mensaje.startsWith('declaracion_requerida')) return 'declaracion_requerida';
  if (mensaje.startsWith('cita_de_otra_mascota') || mensaje.startsWith('cita_no_existe')) return 'cita_invalida';
  if (mensaje.startsWith('mascota_no_existe')) return 'mascota_no_existe';
  return 'error_desconocido';
}

/**
 * EMITE el certificado: captura el juicio del profesional.
 *
 * `declaracion` son LAS PALABRAS DEL VET y viajan tal cual. Este wrapper no
 * las completa, no las sugiere y no las deriva de nada — derivar «apto» de la
 * ausencia de condiciones en el expediente sería una firma que nadie dio.
 */
export async function emitirCertificadoSalud(args: {
  mascotaId: string;
  alcance: AlcanceCertificado;
  declaracion: string;
  citaId?: string | null;
}): Promise<ResultadoWrapper<{ certificadoId: string; fechaExamen: string }, CodigoCertificado>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('emitir_certificado_salud', {
    p_mascota_id: args.mascotaId,
    p_alcance: args.alcance,
    p_declaracion: args.declaracion,
    // el tipo generado pide `string | undefined` (el DEFAULT NULL vive en la
    // firma SQL): un null explícito acá no compila contra el contrato real
    ...(args.citaId ? { p_cita_id: args.citaId } : {}),
  });

  if (error) return falla(codigoDeError(error.message));

  const fila = data as { certificado_id?: string; fecha_examen?: string } | null;
  if (typeof fila?.certificado_id !== 'string' || typeof fila?.fecha_examen !== 'string') {
    return falla('datos_inconsistentes');
  }
  return { ok: true, data: { certificadoId: fila.certificado_id, fechaExamen: fila.fecha_examen } };
}

/** La identidad de firma de QUIEN MIRA, en este negocio.
 *
 *  Existe para que la superficie pueda decir «te falta la matrícula» ANTES de
 *  que el vet escriba su declaración entera — descubrirlo con el rebote de la
 *  emisión sería descubrirlo tarde.
 *
 *  `matricula: null` = EL DATO FALTA. No es un permiso denegado (L-178), y la
 *  pantalla tiene que tratarlo como lo que es. */
export interface FirmaClinica {
  empleadoId: string;
  nombre: string | null;
  matricula: string | null;
  paisEmisor: string | null;
}

export async function obtenerMiFirmaClinica(
  prestadorId: string,
): Promise<ResultadoWrapper<FirmaClinica | null, CodigoCertificado>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('mi_firma_clinica', {
    p_prestador_id: prestadorId,
  });
  if (error) return falla(codigoDeError(error.message));
  if (!Array.isArray(data)) return falla('datos_inconsistentes');
  // Sin vínculo activo la función devuelve CERO filas. `null` es la respuesta
  // honesta: distinta de «tiene vínculo y le falta la matrícula».
  if (data.length === 0) return { ok: true, data: null };

  const f = data[0] as Record<string, unknown>;
  return {
    ok: true,
    data: {
      empleadoId: String(f.empleado_id),
      nombre: (f.nombre as string | null) ?? null,
      matricula: (f.matricula as string | null) ?? null,
      paisEmisor: (f.pais_emisor as string | null) ?? null,
    },
  };
}

/** La relectura: qué certificados tiene esta mascota. Lector INVOKER — la
 *  RLS de `certificado_salud` es la puerta (rol declarado, D-587). */
export async function obtenerCertificadosMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<CertificadoEmitido[], CodigoCertificado>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('obtener_certificados_mascota', {
    p_mascota_id: mascotaId,
  });
  if (error) return falla(codigoDeError(error.message));
  if (!Array.isArray(data)) return falla('datos_inconsistentes');

  return {
    ok: true,
    data: (data as Record<string, unknown>[]).map((f) => ({
      id: String(f.id),
      alcance: f.alcance as AlcanceCertificado,
      declaracion: String(f.declaracion ?? ''),
      fechaExamen: String(f.fecha_examen ?? ''),
      emitidoEn: String(f.emitido_en ?? ''),
      emisorNombre: String(f.emisor_nombre ?? ''),
      emisorMatricula: String(f.emisor_matricula ?? ''),
      negocioNombre: String(f.negocio_nombre ?? ''),
      estadoVidaAlEmitir: f.estado_vida_al_emitir as 'activa' | 'perdida' | 'fallecida',
    })),
  };
}
