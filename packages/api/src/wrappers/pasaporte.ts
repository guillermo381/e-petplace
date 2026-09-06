/**
 * ⭐ **EL PASAPORTE — la puerta única del motor que A construyó en el 1.3.**
 *
 * ⚠️ **ENMIENDA ADITIVA DE C, declarada (76(d)).** El motor entró a `main` con
 * sus cinco RPC y **sin wrapper**, así que la app no tenía por dónde llamarlo.
 * Se escribe acá **copiando el molde de la casa**, sin tocar una línea de A y
 * sin agregar comportamiento: cada función es su RPC y nada más. *Si A prefiere
 * otra forma, esto se reemplaza entero — lo que no se podía era dejar el motor
 * sin puerta y la noche parada.*
 *
 * ── LO QUE SE MIDIÓ ANTES DE ESCRIBIR ──────────────────────────────────────
 * Las cinco firmas salieron de `pg_proc`, no de la migración, y los códigos de
 * error de los `RAISE EXCEPTION` del cuerpo: **`auth_required` ·
 * `no_access_to_mascota` · `mascota_inexistente` · `mascota_en_memorial`**.
 * *Un mapa de errores copiado de lo que uno supone que la función hace es un
 * mapa que traduce mal justo el día que algo falla.*
 *
 * 🔴 **`mascota_en_memorial` no es un error de borde: es la ley.** Una mascota
 * que ya no está no emite pasaporte — y el motor lo impide, así que la pantalla
 * no puede saltárselo aunque quiera.
 */
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export const CODIGOS_PASAPORTE = [
  'auth_required',
  'no_access_to_mascota',
  'mascota_inexistente',
  'mascota_en_memorial',
  'error_desconocido',
] as const;
export type CodigoErrorPasaporte = (typeof CODIGOS_PASAPORTE)[number];

const MENSAJES: Record<CodigoErrorPasaporte, string> = {
  auth_required: 'Necesitas iniciar sesión.',
  no_access_to_mascota: 'Esta mascota no es de tu familia.',
  mascota_inexistente: 'No encontramos esa mascota.',
  /* En voz de familia y sin rodeos: *el memorial no es un permiso que falta,
     es que la pregunta ya no aplica.* */
  mascota_en_memorial: 'No se emite un pasaporte para quien ya no está.',
  error_desconocido: 'No pudimos hacerlo. Prueba de nuevo en un rato.',
};

function codigoDe(mensaje: string): CodigoErrorPasaporte {
  for (const c of CODIGOS_PASAPORTE) {
    if (c !== 'error_desconocido' && mensaje.includes(c)) return c;
  }
  return 'error_desconocido';
}

const esObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** El pasaporte vigente de una mascota. **El token viaja porque ES la URL** —
 *  la placa impresa lo lleva, y vive hasta que la familia revoque. */
export interface PasaporteEmitido {
  id: string;
  token: string;
}

export async function emitirPasaporte(
  mascotaId: string,
): Promise<ResultadoWrapper<PasaporteEmitido, CodigoErrorPasaporte>> {
  const { data, error } = await getClient().rpc('emitir_pasaporte', { p_mascota_id: mascotaId });
  if (error) {
    const c = codigoDe(error.message);
    return { ok: false, codigo: c, mensaje: MENSAJES[c] };
  }
  if (!esObj(data) || typeof data.id !== 'string' || typeof data.token !== 'string') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: { id: data.id, token: data.token } };
}

/** 🔴 **Revocar es definitivo para la placa que ya está impresa.** Devuelve
 *  cuántos revocó: *el número importa porque la pantalla tiene que poder decir
 *  «la placa vieja deja de funcionar» y no prometerlo a ciegas.* */
export async function revocarPasaporte(
  mascotaId: string,
): Promise<ResultadoWrapper<{ revocados: number }, CodigoErrorPasaporte>> {
  const { data, error } = await getClient().rpc('revocar_pasaporte', { p_mascota_id: mascotaId });
  if (error) {
    const c = codigoDe(error.message);
    return { ok: false, codigo: c, mensaje: MENSAJES[c] };
  }
  if (!esObj(data) || typeof data.revocados !== 'number') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: { revocados: data.revocados } };
}

export interface ConfiguracionDePasaporte {
  mostrarContacto: boolean;
  mostrarSalud: boolean;
  mostrarChip: boolean;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  contactoMensaje: string | null;
}

export async function configurarPasaporte(
  mascotaId: string,
  cfg: ConfiguracionDePasaporte,
): Promise<ResultadoWrapper<true, CodigoErrorPasaporte>> {
  const { error } = await getClient().rpc('configurar_pasaporte', {
    p_mascota_id: mascotaId,
    p_mostrar_contacto: cfg.mostrarContacto,
    p_mostrar_salud: cfg.mostrarSalud,
    p_mostrar_chip: cfg.mostrarChip,
    /* 🔴 **La ausencia viaja como `undefined`, no como `null`.** El parámetro
       de la RPC tiene DEFAULT, así que el generador lo tipa opcional — y
       mandar `null` explícito **escribiría un nulo** donde la función esperaba
       «no lo toques». *Son dos cosas distintas: borrar el contacto y no
       hablar de él.* */
    p_contacto_nombre: cfg.contactoNombre ?? undefined,
    p_contacto_telefono: cfg.contactoTelefono ?? undefined,
    p_contacto_mensaje: cfg.contactoMensaje ?? undefined,
  });
  if (error) {
    const c = codigoDe(error.message);
    return { ok: false, codigo: c, mensaje: MENSAJES[c] };
  }
  return { ok: true, data: true };
}

/** `ya_estaba` distingue **«lo marcaste vos ahora»** de **«ya estaba así»**: sin
 *  eso, tocar dos veces se ve igual que no haber tocado. */
export async function marcarPerdida(
  mascotaId: string,
  perdida: boolean,
): Promise<ResultadoWrapper<{ yaEstaba: boolean; estadoVida: string | null }, CodigoErrorPasaporte>> {
  const { data, error } = await getClient().rpc('marcar_perdida', {
    p_mascota_id: mascotaId,
    p_perdida: perdida,
  });
  if (error) {
    const c = codigoDe(error.message);
    return { ok: false, codigo: c, mensaje: MENSAJES[c] };
  }
  if (!esObj(data) || typeof data.ya_estaba !== 'boolean') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return {
    ok: true,
    data: {
      yaEstaba: data.ya_estaba,
      estadoVida: typeof data.estado_vida === 'string' ? data.estado_vida : null,
    },
  };
}
