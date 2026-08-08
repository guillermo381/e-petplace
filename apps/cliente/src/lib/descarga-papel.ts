/**
 * LA DECISIÓN DE CÓMO SE BAJA UN PAPEL — en UN solo lugar (S91-C).
 *
 * ⚠️ EL PORQUÉ DE QUE ESTO EXISTA: **el cliente baja papeles desde DOS
 * superficies** (el perfil de la mascota y Cuenta → Documentos del hogar),
 * y las dos hacían lo mismo a mano. Si la cura del picker vivía en una,
 * la otra seguía chocando contra el mismo muro. La regla que la casa ya
 * conoce: la lógica se extrae, no se clona.
 *
 * EL MURO QUE CURA (gate del founder, S90): la fila «Receta» llamaba
 * `urlDocumento(mascotaId, 'receta')` SIN refId, y el wrapper rebotaba
 * con `ref_requerida` — «falta indicar cuál». **Un rebote que no da
 * salida no es un error: es una puerta cerrada con cartel** (Ley 23: la
 * puerta no ofrece lo que va a rechazar). Acá la puerta se abre: la
 * receta pertenece a UNA consulta, así que se pregunta cuál.
 *
 * Y el porqué de preguntar en vez de adivinar, con su número vivo: Thor
 * tiene DOS consultas con medicación (Clínica Aurora · Paseos Andres).
 * «Traer la última» habría entregado un papel equivocado la mitad de las
 * veces, sin decirlo nunca — L-139 en su forma más cara.
 */

import {
  obtenerConsultasConReceta,
  urlDocumento,
  type ConsultaConReceta,
  type TipoDocumentoExpediente,
} from '@epetplace/api';

/** Lo que hay que hacer con el toque. La pantalla NO decide: ejecuta. */
export type Descarga =
  /** Listo: abrir esta URL (token de un solo uso adentro). */
  | { modo: 'abrir'; url: string }
  /** Hay N actos posibles: la familia elige cuál se imprime. */
  | { modo: 'elegir'; consultas: ConsultaConReceta[] }
  /** No hay ningún acto que imprimir. NO es un fallo: es una ausencia
   *  honesta, y la superficie la dice en voz neutra — pintar de rojo la
   *  falta de recetas sería mentir sobre qué pasó. */
  | { modo: 'sinActos' }
  /** Fallo real (sin sesión, sin acceso, sin red). El mensaje viene del
   *  wrapper — `packages/api` no tiene capa de idioma (D-539). */
  | { modo: 'falla'; mensaje: string };

/**
 * CÓMO SE BAJA CADA PAPEL DEL EXPEDIENTE — exhaustivo POR CONSTRUCCIÓN.
 *
 * El `Record` sobre el union obliga a que un papel nuevo declare su
 * camino o el typecheck se cae. Es el mismo tripwire de `lib/papeles.ts`,
 * y existe por la misma razón: **el día que nazca el papel número seis y
 * exija un acto, nadie puede olvidarse de darle su selector** — sin esto
 * heredaría el camino directo y volvería a chocar contra `ref_requerida`,
 * que es exactamente el muro que este archivo cura.
 *
 * `porConsulta` hoy lo cumple SOLO la receta, porque su lector
 * (`obtener_consultas_con_receta`) es de recetas. Un papel nuevo con acto
 * necesita SU lector: marcarlo `porConsulta` acá sin él sería letra muerta.
 */
const CAMINO: Record<TipoDocumentoExpediente, 'directo' | 'porConsulta'> = {
  carnet_vacunas: 'directo',
  historia_clinica: 'directo',
  ficha_identidad: 'directo',
  receta: 'porConsulta',
};

/** Abre el papel de UN acto ya elegido (o el que la resolución eligió
 *  sola porque era el único). */
export async function abrirReceta(mascotaId: string, citaId: string): Promise<Descarga> {
  const r = await urlDocumento(mascotaId, 'receta', citaId);
  return r.ok ? { modo: 'abrir', url: r.data } : { modo: 'falla', mensaje: r.mensaje };
}

/**
 * Resuelve qué hacer al tocar un papel. Un solo viaje cuando alcanza;
 * dos cuando hay que elegir y la elección es única (se elige sola: **una
 * sola consulta NO se pregunta** — preguntar con una opción es hacerle
 * pagar al usuario una decisión que no existe).
 */
export async function resolverDescarga(
  mascotaId: string,
  tipo: TipoDocumentoExpediente,
): Promise<Descarga> {
  if (CAMINO[tipo] === 'directo') {
    const r = await urlDocumento(mascotaId, tipo);
    return r.ok ? { modo: 'abrir', url: r.data } : { modo: 'falla', mensaje: r.mensaje };
  }

  const consultas = await obtenerConsultasConReceta(mascotaId);
  if (!consultas.ok) return { modo: 'falla', mensaje: consultas.mensaje };
  if (consultas.data.length === 0) return { modo: 'sinActos' };
  // El lector usa EL MISMO predicado que `emitir_token_documento` (letra
  // de A en el wrapper): lo que se lista acá jamás rebota al descargarse.
  const unica = consultas.data[0];
  if (consultas.data.length === 1 && unica !== undefined) {
    return abrirReceta(mascotaId, unica.citaId);
  }
  return { modo: 'elegir', consultas: consultas.data };
}
