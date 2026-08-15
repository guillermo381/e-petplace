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
  obtenerModalidadesPorOficio,
  obtenerOficiosNegocio,
  type OficioChip,
  type ServicioDeOficio,
} from '@epetplace/api';

import { contextoVentas, type ContextoVentas } from './cuenta-ventas';

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
  const [ofic, ventas, modalidades] = await Promise.all([
    obtenerOficiosNegocio(prestadorId),
    contextoVentas(),
    obtenerModalidadesPorOficio(),
  ]);
  if (!ofic.ok) return { ok: false, mensaje: ofic.mensaje };
  if (!ventas.ok) return { ok: false, mensaje: ventas.mensaje };
  // El catálogo que no responde NO se degrada a «todos admiten local»: eso
  // dibujaría puertas que el motor rebota. Su propio wrapper ya rebota en
  // vez de devolver `{}` por la misma razón — acá se respeta, no se
  // absorbe (Ley 13: el fallo se dice).
  if (!modalidades.ok) return { ok: false, mensaje: modalidades.mensaje };

  /* ☠️ ACÁ VIVÍA `TIENE_PRESENCIAL`, una tabla con `paseo: false` escrito a
     mano. **MURIÓ, y no por prolijidad: la regla se mudó al CATÁLOGO**
     (`tipos_servicio.admite_atencion_local`, A · `20260814170000`).

     La historia completa, porque es la lección y no el changelog: la firma
     del paseo se cumplía en TRES lugares —los datos, un trigger que
     nombraba `'paseo'` en su cuerpo, y esta constante de UI— y **ninguno de
     los tres era la fuente**. Yo declaré la mía «espejo con no-divergencia
     garantizada» y estaba equivocado en la mitad que importaba: lo que
     garantizaba la coincidencia era el DATO de una migración, no una
     construcción — *si alguien volvía a mover la columna, volvían a ser
     dos*. Al ir a verificarlo, A encontró el literal en su propio trigger.

     ⇒ **Ahora los tres leen una sola columna, y el oficio que nazca mañana
     trae su modalidad con él** — antes había que acordarse de tocar un
     trigger y una constante de pantalla que vivían a dos repos de
     distancia. */
  const admiteLocal = modalidades.data;
  const oficios: OficioConLocal[] = ofic.data
    .map((o) => ({
      oficio: o.oficio,
      // POR SERVICIO y no por oficio, que es más fino que lo que la tabla
      // muerta podía decir: un negocio puede tener dos ofertas del mismo
      // oficio y atender en local solo una. Las dos condiciones son
      // distintas y las dos hacen falta — el CATÁLOGO dice si el oficio
      // PUEDE tener mostrador; la OFERTA dice si este negocio lo usa.
      servicios: o.servicios.filter((s) => s.atiendeLocal && admiteLocal[s.tipoServicio] === true),
    }))
    .filter((o) => o.servicios.length > 0);

  const capacidad: CapacidadAtender = {
    oficios,
    tienda: esTiendaActiva(ventas.data),
  };
  cache = { prestadorId, capacidad };
  return { ok: true, data: capacidad };
}

/**
 * LA MITAD `Tu tienda`, AISLADA — y aislada a propósito, no por prolijidad.
 *
 * Es la ÚNICA mitad que el VENDEDOR PURO puede tener (§2.1bis: *«vendedor
 * puro → solo la mitad de tienda»*), y él no tiene `prestador_id` con qué
 * llamar a la función de arriba. **Sin extraerla, la rama del vendedor puro
 * habría copiado este predicado** — y un predicado copiado no diverge algún
 * día: diverge la primera vez que alguien cura una sola copia (D-819, la
 * lección que partió esta misma familia de archivos).
 *
 * La cuenta tiene que estar ACTIVA además de tener el rol: una cuenta en
 * revisión no puede cobrar, y una puerta de venta que no cobra es una
 * promesa (Ley 23 — la puerta no ofrece lo que va a rechazar).
 * ⚠️ LISTA BLANCA, no lista negra (precedente D-560, la sala de espera): el
 * enum medido es `pendiente_validacion · activa · suspendida · cerrada`, y
 * el quinto valor que nazca mañana cae AFUERA por default en vez de colarse
 * por omisión.
 */
function esTiendaActiva(ctx: ContextoVentas | null): boolean {
  return ctx !== null && ctx.esVendedora && ctx.estadoCuenta === 'activa';
}

/**
 * LA CAPACIDAD DEL VENDEDOR PURO (S99-D · L1 · D-820) — **PURA, sin leer.**
 *
 * El vendedor puro **no tiene fila en `prestadores`** —medido en la base:
 * `duenodes` y `vendedorpuro`, cero filas—, así que `resolverCapacidadAtender`
 * no es llamable para él: sus dos primeras lecturas piden `prestadorId`.
 * **Su capacidad es una sola pregunta**, y `oficios` es `[]` **por
 * construcción y no por lectura vacía**: no tiene negocio de servicios que
 * consultar.
 *
 * 🔴 **RECIBE EL CONTEXTO, NO LO PIDE — y eso lo corrigió mi propio
 * instrumento, no el razonamiento.** La primera versión hacía su
 * `await contextoVentas()` adentro. `verify-s99d-olas-vendedor-puro` contó
 * la entrada real: **11 peticiones**, con `cuentas_comerciales × 3` y
 * `cuenta_roles × 3` — y **dos de esas eran mías**: el guard raíz ya había
 * resuelto el contexto tres líneas antes, así que mi llamada llegaba
 * DESPUÉS y la deduplicación en vuelo de `contextoVentas` no podía
 * ayudarla (deduplica lo simultáneo, no lo secuencial).
 *
 * *Le agregué dos viajes encadenados al arranque de la única población que
 * este lote existe para servir* — que es exactamente la enfermedad que
 * D-738 midió en este mismo guard. Con el contexto como PARÁMETRO la
 * función deja de leer, y **pedirlo dos veces se vuelve inexpresable**: el
 * que llama ya lo tiene o lo consigue una vez.
 */
export function capacidadVendedorPuro(ctx: ContextoVentas | null): CapacidadAtender {
  return { oficios: [], tienda: esTiendaActiva(ctx) };
}
