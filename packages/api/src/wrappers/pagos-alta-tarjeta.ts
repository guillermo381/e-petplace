/**
 * S101-B · EL ALTA DE TARJETA — la puerta de la app.
 *
 * 🔴 LO QUE ESTA CAPA **NO** EXPONE, A PROPÓSITO: `resolver_alta_tarjeta`.
 *    Cerrar un alta es el camino del SERVIDOR (está revocada de
 *    `authenticated` y el cinturón de la migración lo vigila). *Si viviera
 *    acá, cualquiera con la anon key podría declararse dueño del token de una
 *    tarjeta ajena.* Mismo criterio que `confirmar_pago_pedido` (D-764).
 *
 * 🔴 Y LO QUE NO VIAJA NUNCA POR ACÁ: PAN, CVC, vencimiento. El número se
 *    tokeniza dentro del formulario de Nuvei, en el navegador. La app **jamás
 *    lo ve** — no es doctrina, es lo que el proveedor verifica (rechazó el
 *    camino server-to-server con `401 Application is not PCI`).
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type CodigoAltaTarjeta =
  | 'sin_sesion'
  | 'proveedor_invalido'
  | 'alta_no_existe';

/** Los tres desenlaces + el estado en vuelo. */
export type EstadoAlta = 'pendiente' | 'guardada' | 'rechazada' | 'abandonada';

export type AltaEmitida = {
  /**
   * El handle de ESTA alta. Viaja en la URL de la página.
   *
   * 🔴 **YA NO ES el `uid` ante el proveedor, y ese cambio es `D-921`.** Este
   * comentario decía que sí, y era la descripción exacta del defecto: como el
   * `altaId` es nuevo en cada alta, **el proveedor veía a la misma persona como
   * un usuario distinto cada vez que guardaba una tarjeta** — y por eso
   * `card/list` devolvía `result_size: 1` con dos tarjetas guardadas.
   */
  altaId: string;
  /**
   * 🔴 LA IDENTIDAD ESTABLE ANTE EL PROVEEDOR — `D-921`.
   *
   * Es **nuestro** identificador para esa persona en ese riel: mismo usuario +
   * mismo proveedor ⇒ **siempre el mismo valor**, alta tras alta. Es lo que va
   * en el `uid` de la página de pago.
   *
   * ⚠️ **NO es el `user_id` de la sesión y no debe reemplazarse por él.**
   * Mandarle nuestro identificador interno a un tercero es justo lo que la
   * firma prohíbe — son dos identidades para dos mundos, y el motor las
   * mantiene separadas a propósito.
   *
   * Viaja en el MISMO acto que el alta: *el alta y su identidad ante el
   * proveedor se deciden juntas, así que no hay ventana donde una exista sin
   * la otra* — y es un viaje, no dos (`L-223`).
   */
  uid: string;
  expiraEn: string;
};

export type AltaLeida = {
  altaId: string;
  estado: EstadoAlta;
  /** `true` cuando el TTL pasó. **`abandonada` sale de acá y de ningún otro
   *  lado** — jamás del retorno del navegador. */
  vencida: boolean;
  motivo: string | null;
  tarjetaId: string | null;
  expiraEn: string;
};

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function fallo<T>(mensaje: string, codigo?: CodigoAltaTarjeta): ResultadoWrapper<T, CodigoAltaTarjeta> {
  return { ok: false, codigo: codigo ?? 'error_desconocido', mensaje };
}

/**
 * ① EMITIR EL HANDLE. Lo llama la app **antes** de abrir el navegador.
 *
 * El alta nace `pendiente` con TTL corto (15 min, el mismo número que el hold
 * de la agenda). *Que exista la fila es lo que después vuelve medible a
 * `abandonada`: sin fila no hay vencimiento, y sin vencimiento «abandonada»
 * sería una suposición con nombre de estado.*
 */
export async function crearAltaTarjeta(
  proveedor: 'nuvei' | 'deuna' = 'nuvei',
): Promise<ResultadoWrapper<AltaEmitida, CodigoAltaTarjeta>> {
  const { data, error } = await getClient().rpc('crear_alta_tarjeta', {
    p_proveedor: proveedor,
  });
  if (error) return fallo(error.message);
  if (!esObj(data)) return fallo('datos_inconsistentes', undefined);
  if (data.ok !== true) {
    return fallo(
      typeof data.codigo === 'string' ? data.codigo : 'error_desconocido',
      typeof data.codigo === 'string' ? (data.codigo as CodigoAltaTarjeta) : undefined,
    );
  }
  /* 🔴 EL `uid` SE EXIGE, NO SE TOLERA AUSENTE. Un alta sin identidad estable
     es exactamente el defecto de `D-921` volviendo por la puerta de atrás:
     funcionaría —la página abre igual— y el proveedor volvería a ver un
     usuario nuevo. *Un campo que falta y no rompe nada es un campo que va a
     faltar en producción sin que nadie se entere.* */
  if (
    typeof data.alta_id !== 'string' ||
    typeof data.expira_en !== 'string' ||
    typeof data.uid !== 'string' || data.uid.length === 0
  ) {
    return fallo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: { altaId: data.alta_id, uid: data.uid, expiraEn: data.expira_en },
  };
}

/**
 * ② LEER EL DESENLACE — **la fuente de verdad del alta.**
 *
 * 🔴 El `?desenlace=` que trae la URL de retorno es una PISTA para pintar
 *    rápido, JAMÁS el hecho. La app confirma acá antes de declarar nada.
 *
 * *Enmienda de mesa del 19-ago: deducir `abandonada` del retorno del navegador
 * confundiría tres cosas distintas —que la familia cerró la ventana, que el
 * navegador falló, y que el alta de verdad venció—. **Solo la fila que expiró
 * es un hecho**, y esta función es la que la lee.*
 */
export async function obtenerAltaTarjeta(
  altaId: string,
): Promise<ResultadoWrapper<AltaLeida, CodigoAltaTarjeta>> {
  const { data, error } = await getClient().rpc('obtener_alta_tarjeta', {
    p_alta_id: altaId,
  });
  if (error) return fallo(error.message);
  if (!esObj(data)) return fallo('datos_inconsistentes');
  if (data.ok !== true) {
    return fallo(
      typeof data.codigo === 'string' ? data.codigo : 'error_desconocido',
      typeof data.codigo === 'string' ? (data.codigo as CodigoAltaTarjeta) : undefined,
    );
  }
  const estado = data.estado;
  if (
    estado !== 'pendiente' && estado !== 'guardada' &&
    estado !== 'rechazada' && estado !== 'abandonada'
  ) {
    return fallo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      altaId: typeof data.alta_id === 'string' ? data.alta_id : altaId,
      estado,
      vencida: data.vencida === true,
      motivo: typeof data.motivo === 'string' ? data.motivo : null,
      tarjetaId: typeof data.tarjeta_id === 'string' ? data.tarjeta_id : null,
      expiraEn: typeof data.expira_en === 'string' ? data.expira_en : '',
    },
  };
}
