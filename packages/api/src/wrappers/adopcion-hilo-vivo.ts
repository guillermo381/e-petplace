/**
 * EL HILO EN VIVO — la ÚNICA puerta a realtime del monorepo.
 *
 * 🔴 **POR QUÉ ES UN WRAPPER Y NO UN `.channel()` EN LA PANTALLA.** La puerta
 * única es la regla de la casa, y acá pesa más que en un `select`: una
 * suscripción **abre un socket, se queda viva y hay que cerrarla**. *Un
 * `.channel()` suelto en una pantalla es una fuga que no falla: sigue
 * escuchando después de que la persona se fue, y nadie lo nota hasta que son
 * veinte.* Hasta hoy el monorepo tenía **cero** — medido, y la única mención
 * era un comentario.
 *
 * ⚠️ **`setAuth` NO es opcional.** Sin él la RLS no se evalúa sobre el socket
 * y **cualquiera recibiría los mensajes de cualquier hilo**. Se probó al revés
 * antes de publicar la tabla: con `setAuth`, un tercero suscripto al mismo
 * canal recibió **cero** mientras las dos partes recibían.
 *
 * ⚠️ **El filtro por `solicitud_id` es una CONVENIENCIA, no la defensa.** La
 * defensa es la RLS del servidor. *Si el filtro fuera lo único, alguien que
 * cambiara una línea se llevaría los mensajes de todos los hilos.*
 */

import { getClient } from '../client';

export interface MensajeEnVivo {
  id: string;
  solicitudId: string;
  autorUserId: string | null;
  cuerpo: string;
  automatica: boolean;
  creadoEn: string;
}

/**
 * Escucha los mensajes nuevos de UN hilo.
 *
 * @returns la función de **desuscripción**. Llamala al salir de la pantalla —
 *   *no es higiene: es lo único que cierra el socket.*
 */
export function suscribirseAlHilo(
  solicitudId: string,
  onMensaje: (m: MensajeEnVivo) => void,
): () => void {
  const supabase = getClient();

  /* El token del momento, no uno guardado: si la sesión se renovó, el socket
     tiene que hablar con el token vigente o la RLS lo evalúa contra uno viejo. */
  void supabase.auth.getSession().then(({ data }) => {
    const token = data.session?.access_token;
    if (token) supabase.realtime.setAuth(token);
  });

  const canal = supabase
    .channel(`hilo-adopcion-${solicitudId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'adopcion_mensaje',
        filter: `solicitud_id=eq.${solicitudId}`,
      },
      (payload) => {
        const f = payload.new as Record<string, unknown>;
        if (typeof f.id !== 'string' || typeof f.cuerpo !== 'string') return;
        onMensaje({
          id: f.id,
          solicitudId: String(f.solicitud_id ?? solicitudId),
          autorUserId: typeof f.autor_user_id === 'string' ? f.autor_user_id : null,
          cuerpo: f.cuerpo,
          automatica: f.automatica === true,
          creadoEn: typeof f.creado_en === 'string' ? f.creado_en : new Date().toISOString(),
        });
      },
    );

  void canal.subscribe();

  return () => {
    void supabase.removeChannel(canal);
  };
}
