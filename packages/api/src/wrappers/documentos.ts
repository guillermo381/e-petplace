// S89-A · orden 8 ⑤ — LOS PAPELES DEL PRODUCTO.
//
// El aparato JAMÁS pone su JWT en una URL: pide un token de un solo uso (10
// minutos, gate de acceso a la mascota en el server) y abre la URL del
// documento con ese token. La Edge Function lo valida y lo QUEMA en el mismo
// acto — un link reenviado a un tercero ya no sirve.
//
// v1: `carnet_vacunas` (S89 orden 8⑤) + `historia_clinica` (orden 10①).
// Los certificados heredan el mismo molde cuando toquen.

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:            'No hay sesión activa.',
  sin_acceso:            'No tienes acceso al expediente de esta mascota.',
  tipo_invalido:         'Ese tipo de documento no existe.',
  referencia_requerida:  'Ese papel certifica un acto puntual: falta decir cuál.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'No pudimos preparar el documento. Prueba de nuevo.',
} as const;

export type CodigoDocumento = keyof typeof MENSAJES;
type Falla = { ok: false; codigo: CodigoDocumento; mensaje: string };
function falla(codigo: CodigoDocumento): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export type TipoDocumento = 'carnet_vacunas' | 'historia_clinica' | 'certificado_salud';

/** Cada papel tiene su función; el token es del tipo que se pidió. */
const FUNCION: Record<TipoDocumento, string> = {
  carnet_vacunas: 'documento-carnet',
  historia_clinica: 'documento-historia-clinica',
  certificado_salud: 'documento-certificado',
};

/** ⚠️ S90-D — LOS DOS PAPELES NO SON LA MISMA COSA, y el tipo lo dice.
 *
 *  `carnet_vacunas` y `historia_clinica` imprimen EL EXPEDIENTE: un botón por
 *  mascota alcanza, y el token no necesita apuntar a nada.
 *  `certificado_salud` imprime UN ACTO: hay N por mascota, cada uno con su
 *  fecha, su alcance y su firmante. Su token DEBE nombrar cuál — «el último»
 *  miente en cuanto hay dos.
 *
 *  Esto es lo que hace que el papel nuevo NO pueda entrar como una fila más
 *  de `PAPELES_DE_MASCOTA` en el cliente: esa lista es de botones por tipo. */
const PAPELES_POR_ACTO: ReadonlySet<TipoDocumento> = new Set<TipoDocumento>(['certificado_salud']);

/** Devuelve la URL LISTA PARA ABRIR del documento (token de un solo uso
 *  adentro). Quien la reciba después de usada, recibe un rebote — por
 *  diseño: el papel lleva el expediente de una mascota. */
export async function urlDocumento(
  mascotaId: string,
  tipo: TipoDocumento = 'carnet_vacunas',
  /** Cuál ACTO imprime. Obligatorio para los papeles por acto (certificado);
   *  ignorado por los que imprimen el expediente entero. */
  referenciaId?: string,
): Promise<ResultadoWrapper<string, CodigoDocumento>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  // El rebote del lado del cliente NO reemplaza al del motor (que también lo
  // exige): existe para que el error se diga acá y no cueste un viaje.
  if (PAPELES_POR_ACTO.has(tipo) && !referenciaId) return falla('referencia_requerida');

  const { data, error } = await getClient().rpc('emitir_token_documento', {
    p_mascota_id: mascotaId,
    p_tipo: tipo,
    p_referencia_id: referenciaId ?? null,
  });

  if (error) {
    if (error.message.startsWith('no_access_to_mascota')) return falla('sin_acceso');
    if (error.message.startsWith('tipo_documento_invalido')) return falla('tipo_invalido');
    if (error.message.startsWith('referencia_requerida')) return falla('referencia_requerida');
    if (error.message.startsWith('referencia_no_es_de_la_mascota')) return falla('sin_acceso');
    if (error.message.startsWith('auth_required')) return falla('sin_sesion');
    return falla('error_desconocido');
  }
  const token = (data as { token?: string } | null)?.token;
  if (typeof token !== 'string') return falla('datos_inconsistentes');

  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (typeof base !== 'string' || base.length === 0) return falla('error_desconocido');
  return { ok: true, data: `${base}/functions/v1/${FUNCION[tipo]}?t=${token}` };
}
