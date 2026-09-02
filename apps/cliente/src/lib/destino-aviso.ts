/**
 * EL DESTINO DE UN AVISO — el mapeo del CLIENTE (S88-D, lámina de la
 * campana §3: «tocar un aviso lleva AL LUGAR DEL HECHO»).
 *
 * El motor NO manda rutas: manda tipo + referentes, y CADA app arma la
 * suya (la misma notificación lleva a pantallas distintas por app — el
 * mapeo del prestador vive en su casa; forma compartida, destino de
 * cada casa, §6 del método). Un tipo que esta app no sabe llevar es
 * SIN DESTINO: «un aviso sin destino no se pinta como si lo tuviera».
 *
 * VIVE EN lib/ para que su par discrimine contra la fuente.
 *
 * ⚠️ DECLARADO SIN MAPEAR — autorización: la lámina del cliente nombra
 * ese destino (`/autorizacion/[solicitudId]`) pero `AvisoDeCampana` no
 * porta `solicitudId`; mapearlo por otro campo sería adivinar. El día
 * que el lector lo porte, la rama se agrega acá y su par con ella.
 */

import type { AvisoDeCampana } from '@epetplace/api';

import { destinoDePushDeEstaApp } from './destino-de-push';

export type DestinoAviso =
  /**
   * 🔴 **LA RUTA QUE MANDA EL SERVIDOR (S112).** Nació con el vertical de
   * adopción y **no contradice la regla de arriba**: el motor emite **una
   * intención por destinatario**, así que cada `ruta` ya es de una sola app.
   *
   * ⚠️ **Y no se navega cruda.** Pasa por `destinoDePushDeEstaApp`, el MISMO
   * filtro que la push — *un guard que sirve a un camino y no al otro es cómo
   * los dos terminan diciendo cosas distintas sobre la misma ruta*. Si la ruta
   * no es de esta app, esta rama devuelve `null` y se cae al mapeo por tipo.
   */
  | { ruta: string }
  | { pathname: '/citas/[mascotaId]'; params: { mascotaId: string; nombre: string } }
  | { pathname: '/hogar/vacunas/[mascotaId]'; params: { mascotaId: string } }
  | { pathname: '/hogar/mascota/[mascotaId]'; params: { mascotaId: string } }
  | { pathname: '/hogar/paseos' }
  | { pathname: '/hogar/adiestramiento' }
  | { pathname: '/cuenta/pagos' }
  | null;

export function destinoDeAviso(a: {
  tieneDestino: boolean;
  tipo: string;
  mascotaId: string | null;
  mascotaNombre: string | null;
  /** Opcional en la firma **para no romper a quien la llame sin ella**: los
   *  avisos viejos no tienen ruta y siguen resolviéndose por tipo. */
  ruta?: string | null;
}): DestinoAviso {
  if (!a.tieneDestino) return null;

  /* LA RUTA DEL SERVIDOR PRESIDE, y sólo si es de esta app. **Sin ella el
     vertical de adopción no tiene destino posible**: sus avisos no llevan
     `mascotaId` a propósito —pasarla los descarta con `descartada_sin_acceso`,
     porque ni el refugio ni el postulante son «familia» del adoptable antes de
     la entrega— y el `solicitud_id` no viaja como columna. *El mapeo por tipo
     no puede inventar un id que no recibió.* */
  if (typeof a.ruta === 'string' && a.ruta.length > 0) {
    const mia = destinoDePushDeEstaApp(a.ruta);
    if (mia !== null) return { ruta: mia };
    console.warn(`[avisos] ruta que esta app no atiende, se cae al mapeo por tipo · ${a.ruta}`);
  }

  // La vacuna vive en el carnet — el expediente de la mascota.
  if (a.tipo === 'vacuna_vencida' && a.mascotaId !== null) {
    return { pathname: '/hogar/vacunas/[mascotaId]', params: { mascotaId: a.mascotaId } };
  }
  // La cita: el hub de citas de SU mascota (el destino canónico del
  // doble-clic del servicio es el hub — regla de plataforma S67).
  if ((a.tipo.startsWith('cita_') || a.tipo === 'procedimiento_agendado') && a.mascotaId !== null) {
    return {
      pathname: '/citas/[mascotaId]',
      params: { mascotaId: a.mascotaId, nombre: a.mascotaNombre ?? '' },
    };
  }
  // Lo pagado que vence o se renueva: su hub.
  if (a.tipo.startsWith('plan_') || a.tipo === 'paquete_vence') {
    return { pathname: '/hogar/paseos' };
  }
  if (a.tipo.startsWith('programa_')) {
    return { pathname: '/hogar/adiestramiento' };
  }
  // La plata: el historial de pagos.
  if (a.tipo === 'pago_confirmado' || a.tipo === 'devolucion_estado') {
    return { pathname: '/cuenta/pagos' };
  }
  // Fallback: si el aviso habla de una mascota, su expediente ES el
  // lugar del hecho genérico.
  if (a.mascotaId !== null) {
    return { pathname: '/hogar/mascota/[mascotaId]', params: { mascotaId: a.mascotaId } };
  }
  return null;
}

export function esDestinoAviso(d: DestinoAviso): d is Exclude<DestinoAviso, null> {
  return d !== null;
}
