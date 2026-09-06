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

/**
 * 🔴 EL ARRANQUE SE CAÍA POR ACÁ, y el defecto tiene dos mitades que se
 * necesitan (S113-A · noche, medido por E con un deep link durante el
 * arranque: 3 de 4 caídas).
 *
 * ① **El canal se llamaba `'mis-hilos'`, fijo.** `supabase-js` indexa los
 *    canales POR NOMBRE: con dos montajes —y durante un arranque con deep link
 *    hay dos— el segundo `.channel(nombreDeCanal('mis-hilos'))` no crea uno nuevo, **toca el
 *    mismo objeto que el primero todavía tiene suscrito**. Suscribirse dos
 *    veces al mismo canal es un error de estado, y en el arranque se ve como
 *    una raíz que se cae.
 * ② **`void supabase.removeChannel(canal)`.** Es asíncrono, y con `void` nadie
 *    lo espera: el montaje nuevo se suscribe mientras el viejo todavía se está
 *    yendo. *Una limpieza que no se espera no es una limpieza: es una carrera.*
 *
 * La cura vuelve el estado **inexpresable**, no lo esquiva: el nombre es único
 * por montaje (dos montajes NO pueden compartir canal aunque quieran) y todo
 * subscribe/remove pasa por UNA cadena de promesas del módulo, así que el
 * siguiente empieza cuando el anterior terminó — **en orden y sin solaparse**.
 *
 * ⚠️ La función de limpieza sigue siendo SÍNCRONA porque es lo que `useEffect`
 * exige. Lo que se encadena es el trabajo, no la firma.
 */
let _serie = 0;
let _cadena: Promise<unknown> = Promise.resolve();

/** Un nombre que dos montajes no pueden compartir ni por accidente. */
function nombreDeCanal(base: string): string {
  _serie += 1;
  return `${base}-${_serie}-${Math.random().toString(36).slice(2, 8)}`;
}

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
    .channel(nombreDeCanal(`hilo-adopcion-${solicitudId}`))
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

  // misma cadena que el canal de la lista: dos hilos abiertos a la vez —o el
  // mismo hilo reabierto— no pueden solaparse.
  _cadena = _cadena.then(() => canal.subscribe());

  return () => {
    _cadena = _cadena.then(() => supabase.removeChannel(canal)).catch(() => {});
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MIS HILOS — UNA suscripción por SESIÓN, no una por hilo
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lo que cambió. C decide si refresca el contador o si lo ajusta en el lugar.
 *
 * `esMio` está para que **mandar un mensaje no haga parpadear tu propia
 * burbuja**: el motor ya no lo cuenta, pero sin este dato C tendría que pedir
 * el contador de nuevo para enterarse de algo que ya sabía.
 */
export type CambioEnMisHilos =
  | { tipo: 'mensaje'; solicitudId: string; esMio: boolean }
  | { tipo: 'lectura'; solicitudId: string }
  /**
   * 🔴 **El socket se cayó y volvió — lo que pasó en el hueco NO llega nunca.**
   * En un teléfono eso ocurre cada vez que la pantalla se apaga. *Sin este
   * aviso la burbuja queda con el número de antes de dormir y se lee como si
   * fuera el de ahora* — que es peor que no tener burbuja.
   *
   * ⚠️ Llega TAMBIÉN en la primera conexión, a propósito: así C tiene **un
   * solo camino** («llegó algo, pedí el contador») y la carga inicial sale
   * gratis del mismo lugar.
   */
  | { tipo: 'reconectado' };

/**
 * Escucha **todos los hilos donde participo**, con una sola suscripción.
 *
 * 🔴 **NO LLEVA FILTRO, Y ESO ES LA DECISIÓN.** `postgres_changes` filtra por
 * igualdad de UNA columna: no existe «`solicitud_id` en esta lista». Abrir una
 * suscripción por hilo escalaría con la cantidad de conversaciones y hay que
 * rehacerla cada vez que nace una ⇒ **se escucha la tabla entera y la RLS
 * elige qué entregar.**
 *
 * ⇒ *entre un extraño y todos los mensajes de adopción de la casa no queda
 * NADA más que la RLS del socket.* Por eso se midió antes de escribir esto,
 * y no se dedujo del rojo de `suscribirseAlHilo` —que tenía filtro y por lo
 * tanto probaba otra cosa—: `scripts/verify-s112a-mis-hilos-realtime.mjs`,
 * un mensaje real, tres asientos, **familia=1 · refugio=1 · tercero=0 ·
 * residuo=0**. Los tres oyentes son el mismo objeto: que los participantes
 * reciban es lo que convierte el cero del tercero en una medición.
 *
 * @returns la función de desuscripción. **Se llama al cerrar sesión**, no al
 *   salir de una pantalla: esta suscripción es de la sesión.
 */
export function suscribirseAMisHilos(onCambio: (c: CambioEnMisHilos) => void): () => void {
  const supabase = getClient();
  let miUid: string | null = null;

  void supabase.auth.getSession().then(({ data }) => {
    miUid = data.session?.user?.id ?? null;
    const token = data.session?.access_token;
    if (token) supabase.realtime.setAuth(token);
  });

  /* 🔴 EL TOKEN QUE VENCE — lo que `suscribirseAlHilo` podía ignorar y ésta no.
     Aquélla vive lo que dura una pantalla; ésta vive lo que dura la sesión, y
     un access token dura una hora. *Sin re-autenticar, el socket sigue
     conectado y deja de entregar: no hay error, hay silencio*, y un silencio
     se lee igual que «no tenés pendientes». */
  const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
    miUid = sesion?.user?.id ?? null;
    if (sesion?.access_token) supabase.realtime.setAuth(sesion.access_token);
  });

  const canal = supabase
    .channel(nombreDeCanal('mis-hilos'))
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'adopcion_mensaje' },
      (payload) => {
        const f = payload.new as Record<string, unknown>;
        if (typeof f.solicitud_id !== 'string') return;
        onCambio({
          tipo: 'mensaje',
          solicitudId: f.solicitud_id,
          esMio: typeof f.autor_user_id === 'string' && f.autor_user_id === miUid,
        });
      },
    )
    .on(
      /* `adopcion_lectura` se escribe con `ON CONFLICT DO UPDATE` ⇒ la primera
         vez es INSERT y las demás UPDATE. Se escucha `*` porque las dos son el
         mismo hecho: alguien abrió el hilo. Su policy es `user_id = auth.uid()`
         sobre ALL ⇒ el socket sólo entrega **las filas de quien escucha**. */
      'postgres_changes',
      { event: '*', schema: 'public', table: 'adopcion_lectura' },
      (payload) => {
        const f = (payload.new ?? payload.old) as Record<string, unknown> | null;
        if (!f || typeof f.solicitud_id !== 'string') return;
        onCambio({ tipo: 'lectura', solicitudId: f.solicitud_id });
      },
    );

  /* El subscribe entra a la cadena: si otro montaje todavía se está yendo,
     éste espera. *Sin la cadena, «limpiar» y «suscribir» corren a la vez.* */
  _cadena = _cadena.then(() => canal.subscribe((estado) => {
    if (estado === 'SUBSCRIBED') onCambio({ tipo: 'reconectado' });
  }));

  return () => {
    sub?.subscription?.unsubscribe();
    // se ENCADENA (no se descarta): el próximo subscribe arranca después
    _cadena = _cadena.then(() => supabase.removeChannel(canal)).catch(() => {});
  };
}
