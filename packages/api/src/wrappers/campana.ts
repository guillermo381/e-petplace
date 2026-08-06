// S88-A — LA CAMPANA (motor: migración 20260805280000, lámina firmada 5-ago).
//
// ⚠️ LEY DE SECUENCIA, escrita en la lámina y vigente mientras se lea esto:
//   `in_app` tiene `transporte_vivo = false`, y **la campana ES su
//   transporte**. El flip a `true` es el ÚLTIMO acto —después de que la
//   pantalla exista y el founder la gatee—, jamás antes: encenderlo antes
//   haría que el motor entregue a un buzón que nadie puede abrir, **sin
//   fallar, sin rebotar y sin rastro rojo**.
//   ⇒ **Hoy este lector devuelve lista vacía, y eso es correcto.** Cero es
//   «no hay», no «no puede» — y se puede construir y probar contra él.
//
// ⚠️ EL DESTINO SON REFERENTES, JAMÁS UNA RUTA. La misma notificación lleva a
//   pantallas DISTINTAS en el prestador y en el cliente, así que la ruta la
//   arma cada app con `tipo` + `mascotaId`/`eventoId`. Una ruta en el motor
//   sería voz de producto adentro de la DB (D-539) y se rompería sola.
//
// ⚠️ NO HAY «marcar todos». Es letra firmada, no una omisión: *borrar sin leer
//   es perder*. Un botón que vacía la campana convierte «no lo leí» en «no
//   existió», y el que se pierde así es justo el que la persona no alcanzó a
//   mirar. El motor tampoco lo tiene, y su cinturón lo verifica.

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:           'No hay sesión activa.',
  aviso_no_encontrado:  'Ese aviso ya no está disponible.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoCampana = keyof typeof MENSAJES;

type Falla = { ok: false; codigo: CodigoCampana; mensaje: string };
function falla(codigo: CodigoCampana): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export interface AvisoDeCampana {
  id: string;
  /** LA VOZ VIAJA COMO DATO — la escribió quien registró la intención y es LA
   *  MISMA que sale por correo. **La pantalla no traduce tipos**: no necesita
   *  saber que existen (lámina §2). `null` honesto si la intención nació sin
   *  voz — se declara, no se inventa un texto. */
  titulo: string | null;
  mensaje: string | null;
  tipo: string;
  categoria: string;
  /** REFERENTES del hecho, para que la app arme SU ruta. */
  mascotaId: string | null;
  eventoId: string | null;
  /** **La lámina: «un aviso sin destino no se pinta como si lo tuviera».**
   *  Con `false`, la fila se muestra pero NO es tocable. */
  tieneDestino: boolean;
  creadoEn: string;
  leida: boolean;
  leidaEn: string | null;
}

/** Los avisos de la persona, más nuevo arriba. Lo descartado (memorial
 *  incluido), lo retenido por el kill switch y lo que está en sombra **no
 *  aparecen nunca** — el motor ya los cortó y la campana lo hereda: la
 *  pantalla no vuelve a decidirlo. */
export async function obtenerMisAvisos(
  limite = 50,
): Promise<ResultadoWrapper<AvisoDeCampana[], CodigoCampana>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('obtener_mis_avisos', { p_limite: limite });

  if (error) {
    return error.message.startsWith('auth_required') ? falla('sin_sesion') : falla('error_desconocido');
  }
  if (!Array.isArray(data)) return falla('datos_inconsistentes');

  return {
    ok: true,
    data: data.map((f) => ({
      id: f.id,
      titulo: f.titulo,
      mensaje: f.mensaje,
      tipo: f.tipo,
      categoria: f.categoria,
      mascotaId: f.mascota_id,
      eventoId: f.evento_id,
      tieneDestino: f.tiene_destino,
      creadoEn: f.creado_en,
      leida: f.leida,
      leidaEn: f.leida_en,
    })),
  };
}

/**
 * Marca UN aviso leído. **Por aviso — no existe la variante «todos».**
 *
 * `aviso_no_encontrado` cubre tres casos a propósito —no es tuyo · no existe ·
 * no es de campana— porque distinguirlos le diría a un extraño si un id
 * existe.
 */
export async function marcarAvisoLeido(
  avisoId: string,
): Promise<ResultadoWrapper<null, CodigoCampana>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { error } = await getClient().rpc('marcar_aviso_leido', { p_aviso_id: avisoId });

  if (error) {
    if (error.message.startsWith('aviso_no_encontrado')) return falla('aviso_no_encontrado');
    if (error.message.startsWith('auth_required')) return falla('sin_sesion');
    return falla('error_desconocido');
  }
  return { ok: true, data: null };
}
