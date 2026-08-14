/**
 * LA CAPACIDAD DE `ATENDER` — LAS DOS FUENTES, COMPUESTAS EN VISTA.
 * (S98-C · `LA_CASA_DEL_PRESTADOR` §2.1bis, firma del founder 13-ago.)
 *
 * ═══ LA LEY, LITERAL ═══════════════════════════════════════════════════
 * §2.1bis: *«`ATENDER` lee DOS fuentes, una por naturaleza. La tab se
 * monta si cualquiera de las dos aporta algo.»*
 *
 * | fuente          | qué aporta                    | de dónde sale                            |
 * |-----------------|-------------------------------|------------------------------------------|
 * | `Tus servicios` | atención de mostrador · alta  | ofertas activas con `atiende_local=true` |
 * | `Tu tienda`     | venta de mostrador con código | la cuenta comercial con `seller_productos` |
 *
 * Y la mitad que gobierna el montaje es un **Y**, no un O: hace falta
 * **rol** (`empleado_es_mostrador_o_gestion`, el predicado que YA existe y
 * gobierna la plata del día desde §4ter) **Y capacidad**. El profesional
 * puro tiene la capacidad de su negocio y no la puerta; un titular sin
 * local ni tienda tiene la puerta y nada que abrir.
 *
 * ═══ POR QUÉ NO ES UNA CONSULTA ════════════════════════════════════════
 * §2.1bis lo escribe para que nadie lo invente: *«las dos mitades NO se
 * fusionan en una consulta»*. `MODELO_DESPENSA` §3.4 es la razón — pedido
 * de producto y cita de servicio no comparten tabla. **Acá se componen al
 * LEER**, que es lo mismo que ya hacen el feed del HOY y el paso ③ del
 * wizard. *El cinturón no prohíbe que dos cosas se vean juntas: prohíbe
 * que se guarden juntas.*
 *
 * ═══ EL CACHÉ, Y POR QUÉ ═══════════════════════════════════════════════
 * Dos superficies preguntan lo mismo en el mismo foco: **la barra** (para
 * saber si monta la tab) y **la portada** (para dibujar sus baldosas). Sin
 * espejo eso son dos olas de peticiones para una sola verdad — el peaje de
 * ~150 ms por petición que D-497/D-738 midieron. Patrón y precedente:
 * `contextoVentas` (S96-C), con su misma cura incorporada: **el espejo se
 * invalida con el evento de auth, jamás con la memoria de quién salió**
 * (el logout EN CALIENTE no recarga el bundle).
 */

import {
  getClient,
  obtenerOficiosNegocio,
  type OficioChip,
  type ServicioDeOficio,
} from '@epetplace/api';

import { contextoVentas } from './cuenta-ventas';

/** Los cuatro oficios que pueden atender por la puerta. Es el mismo eje
 *  de `OficioChip` (`es_medico ⇒ veterinaria`; si no, la categoría) — se
 *  reusa el tipo del wrapper en vez de declarar un quinto vocabulario. */
export type OficioAtender = OficioChip;

/** UN oficio que atiende en el local, con las ofertas que lo sostienen. */
export interface OficioConLocal {
  oficio: OficioAtender;
  /** Solo las que tienen `atiendeLocal` — las de domicilio puro no abren
   *  la puerta del mostrador, que es de quien LLEGA. */
  servicios: ServicioDeOficio[];
}

export interface CapacidadAtender {
  /** La mitad `Tus servicios`. Vacía = este negocio no atiende en local. */
  oficios: OficioConLocal[];
  /** La mitad `Tu tienda`: cuenta comercial con rol `seller_productos`. */
  tienda: boolean;
}

/**
 * 🔴 ¿ESTE OFICIO OFRECE ATENCIÓN EN LOCAL? — FIRMA DEL FOUNDER (14-ago):
 * **EL PASEO ES SIEMPRE A DOMICILIO. NO EXISTE PASEO EN LOCAL.**
 *
 * A un paseo nadie llega y espera — el paseador va a buscar al perro, o la
 * familia lo deja y se va; **no hay mostrador donde atender a alguien que
 * está parado enfrente.** Por eso el paseo no compone `ATENDER`.
 *
 * ═══ ESTO ES UN ESPEJO, NO UNA SEGUNDA VERDAD ══════════════════════════
 * **El motor ya lo cumple, y por las dos vías** (A, migración
 * `20260814160000`): los **9 paseos vivos** pasaron a `atiende_local =
 * false · atiende_domicilio = true`, y **`trg_ps_paseo_sin_local` vuelve
 * el estado INEXPRESABLE** —un intento de prender local en un paseo
 * rebota `paseo_no_atiende_en_local`—, con contra-caso medido: **22 filas
 * de otros oficios intactas**. Con eso, `atiende_local` sola ya excluye
 * los paseos y este filtro **no puede cambiar ningún resultado**.
 *
 * **Se conserva igual, y con el patrón declarado de la casa** (precedente
 * `puedeEncenderVitrina`, S78: *el espejo EXACTO del predicado del
 * servidor, con su no-divergencia declarada*), por dos razones:
 *  · **tiene un segundo consumidor que el dato no cubre — el paso ② del
 *    wizard**, que decide si DIBUJA el toggle «atiendo en mi local». Ahí
 *    la regla tiene que existir del lado de la pantalla: *es mejor no
 *    ofrecerlo que rebotarlo* (Ley 23, y palabra de A).
 *  · la divergencia peligrosa —esconder un oficio que el motor sí
 *    permite— **es imposible por construcción**: el trigger no deja nacer
 *    el caso que la haría visible.
 *
 * ☠️ **D-792 CERRADA** con esta firma: la ficha no frenaba por miedo al
 * `UPDATE`, frenaba por falta de criterio. *El `DEFAULT true` que barrió
 * los cuatro oficios no era una decisión: era una columna que nació para
 * el domicilio del grooming y nadie volvió a mirar.*
 *
 * Es una TABLA y no un `if` por el mismo motivo que `REGLA_OFICIO`
 * (S86-C): el `Record` completo no compila incompleto, así que el oficio
 * que nazca mañana **obliga** a contestar. Con un `if` caería en el `else`
 * y contestaría solo — la clase de defecto que funciona y contesta mal.
 */
/* ✅ Y LO QUE LA MIGRACIÓN DE A CERRÓ DE PASO, sin que fuera su objetivo:
   el gate del rol **recepción** (`puede_ofrecer_rol_recepcion`, §2.3)
   cuenta servicios con `atiende_local`. Antes de `20260814160000` un
   negocio de SOLO PASEOS lo contestaba `true` —ofrecía recepción para un
   mostrador que no existe— y `ATENDER` le decía que no: dos criterios,
   dos respuestas. **Con los 9 paseos en `false`, los dos coinciden por
   dato.** Se escribe acá porque era una divergencia real y su cierre no
   fue explícito: si alguien vuelve a mover esa columna, vuelven a ser dos. */
const TIENE_PRESENCIAL: Record<OficioAtender, boolean> = {
  veterinaria: true,
  grooming: true,
  adiestramiento: true,
  paseo: false,
};

/** ¿Aporta algo alguna de las dos mitades? */
export function hayCapacidad(c: CapacidadAtender): boolean {
  return c.oficios.length > 0 || c.tienda;
}

// undefined = nunca leído. La clave es el prestador: un mismo proceso de
// JS puede ver dos negocios (el vehículo Shyris de S81 — cambiar de cuenta
// sin reiniciar la app), y un espejo booleano por proceso fue exactamente
// el defecto que aquella sesión midió.
let cache: { prestadorId: string; capacidad: CapacidadAtender } | undefined;
let escuchandoAuth = false;

function asegurarEscuchaAuth(): void {
  if (escuchandoAuth) return;
  escuchandoAuth = true;
  getClient().auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT' || evento === 'SIGNED_IN') cache = undefined;
  });
}

/** Se llama cuando algo que este espejo refleja cambia — hoy, el toggle
 *  «atiendo en mi local» del paso ② del wizard y de la configuración. */
export function invalidarCapacidadAtender(): void {
  cache = undefined;
}

/**
 * LAS DOS FUENTES, EN UNA OLA.
 *
 * ⚠️ **El fallo NO se degrada a «sin capacidad»** (L-139 / Ley 13): un
 * `{oficios:[], tienda:false}` con cara de dato diría «este negocio no
 * atiende por la puerta», y lo que pasó fue que no pudimos preguntar.
 * Quien consuma decide qué hacer con el error — la barra lo cierra (abajo
 * está el porqué y por qué no deja a nadie sin camino), la portada lo
 * DICE y ofrece reintentar.
 */
export async function resolverCapacidadAtender(
  prestadorId: string,
): Promise<{ ok: true; data: CapacidadAtender } | { ok: false; mensaje: string }> {
  asegurarEscuchaAuth();
  if (cache !== undefined && cache.prestadorId === prestadorId) {
    return { ok: true, data: cache.capacidad };
  }

  // Las dos mitades viajan JUNTAS: son dominios distintos (el cinturón) y
  // por eso son dos lectores, pero no hay ninguna razón para que sean dos
  // esperas — nada de la segunda depende de la primera.
  const [ofic, ventas] = await Promise.all([obtenerOficiosNegocio(prestadorId), contextoVentas()]);
  if (!ofic.ok) return { ok: false, mensaje: ofic.mensaje };
  if (!ventas.ok) return { ok: false, mensaje: ventas.mensaje };

  const oficios: OficioConLocal[] = ofic.data
    .filter((o) => TIENE_PRESENCIAL[o.oficio])
    .map((o) => ({ oficio: o.oficio, servicios: o.servicios.filter((s) => s.atiendeLocal) }))
    .filter((o) => o.servicios.length > 0);

  const capacidad: CapacidadAtender = {
    oficios,
    // La cuenta tiene que estar ACTIVA además de tener el rol: una cuenta
    // en revisión no puede cobrar, y una puerta de venta que no cobra es
    // una promesa (Ley 23 — la puerta no ofrece lo que va a rechazar).
    // ⚠️ LISTA BLANCA, no lista negra (precedente D-560, la sala de
    // espera): el enum medido es `pendiente_validacion · activa ·
    // suspendida · cerrada`, y el quinto valor que nazca mañana cae
    // AFUERA por default en vez de colarse por omisión.
    tienda: ventas.data !== null && ventas.data.esVendedora && ventas.data.estadoCuenta === 'activa',
  };
  cache = { prestadorId, capacidad };
  return { ok: true, data: capacidad };
}
