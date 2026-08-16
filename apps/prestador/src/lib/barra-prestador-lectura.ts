/**
 * LA LECTURA DE LA CAPACIDAD DE BARRA (S98-C · D-819).
 *
 * Separada de `barra-prestador` a propósito: allá vive el ORDEN, que es
 * puro y se puede ejercer sin levantar nada; acá viven las TRES lecturas,
 * que necesitan sesión y red. *Juntas, la parte verificable arrastraba
 * React Native y el ejercicio no corría.*
 *
 * Sus DOS consumidores son la barra (`(tabs)/_layout`) y el destape del
 * wizard — y por eso está acá y no adentro de uno de ellos: la barra ya
 * tenía esta lectura escrita inline, y el destape la habría copiado.
 */

import { empleadoTieneRol, obtenerMiPosicionEnPrestador } from '@epetplace/api';

import {
  capacidadVendedorPuro,
  hayCapacidad,
  resolverCapacidadAtender,
} from './capacidad-atender';
import type { ContextoVentas } from './cuenta-ventas';
import type { CapacidadDeBarra } from './barra-prestador';

/**
 * QUIÉN ESTÁ ENTRANDO — y por qué es una unión y no un `prestadorId | null`.
 *
 * S99-D (L1 · D-820): desde que el vendedor puro entra a la casa de tabs hay
 * **dos naturalezas** que componen barra, y una de ellas **no tiene
 * `prestador_id`**. Un `string | null` habría dejado el caso legible como
 * «prestador cuyo id no pudimos leer», que es otra cosa y con otra cura.
 * *La unión hace inexpresable el estado equivocado* — el precedente de la
 * casa (un estado malo no se documenta: se vuelve imposible, L-222).
 */
export type QuienEntra =
  | { tipo: 'prestador'; prestadorId: string }
  /* 🔴 El vendedor puro trae SU CONTEXTO, y por eso el tipo lo exige.
     Medido: el guard raíz ya resolvió `contextoVentas()` tres líneas antes
     de llegar acá —es cómo supo que era vendedor—, así que una lectura
     propia acá son **dos peticiones encadenadas de más** en el arranque de
     la única población que este lote sirve (la deduplicación en vuelo de
     `contextoVentas` no alcanza: deduplica lo simultáneo, no lo
     secuencial). Pedirlo por tipo hace que el desperdicio no se pueda
     escribir. */
  | { tipo: 'vendedorPuro'; contexto: ContextoVentas | null };

/**
 * LAS DOS PREGUNTAS, EN UNA SOLA OLA — y **la asimetría de sus fallos es
 * la parte pensada**, no un descuido:
 *
 *  · **el ROL cierra** — no saber si alguien puede es no poder afirmar que
 *    puede. Un permiso no se concede por un error de red (Ley 23).
 *  · **la CAPACIDAD abre** — no saber si el negocio tiene local no es un
 *    problema de permisos: es un dato que faltó, y la portada de ATENDER
 *    sabe decirlo y ofrecer reintento, mientras que una barra sin la tab
 *    no dice nada: *el que no la ve no sabe que existe.*
 *
 * ⚠️ `empleadoTieneRol` NO se cambia por `gestiona` de
 * `obtenerMiPosicionEnPrestador` aunque contesten parecido: son predicados
 * distintos (`gestiona` incluye admin de plataforma), y cambiarlo acá
 * movería el gate de NEGOCIO de contrabando.
 *
 * ⚠️ Las tres lecturas van JUNTAS: ninguna depende de otra, y encadenarlas
 * sumaría ~300 ms al arranque de cada foco (D-738 · L-223 — el peaje es la
 * PETICIÓN, y lo que se paga en reloj es la CADENA).
 */
export async function resolverCapacidadDeBarra(
  quien: QuienEntra,
): Promise<CapacidadDeBarra> {
  if (quien.tipo === 'vendedorPuro') return barraVendedorPuro(quien.contexto);
  const { prestadorId } = quien;
  const [rol, posicion, capacidad] = await Promise.all([
    empleadoTieneRol(prestadorId, ['dueño', 'administrador']),
    obtenerMiPosicionEnPrestador(prestadorId),
    resolverCapacidadAtender(prestadorId),
  ]);
  return {
    esGestor: rol.ok ? rol.data : false,
    montaAtender:
      (posicion.ok ? posicion.data.esMostradorOGestion : false) &&
      (capacidad.ok ? hayCapacidad(capacidad.data) : true),
  };
}

/**
 * EL VENDEDOR PURO (S99-D · L1 · D-820) — **una sola pregunta, no tres.**
 *
 * `LA_CASA_DEL_PRESTADOR` §2.0 (firma del founder, 14-ago): *«el vendedor
 * puro deja de ser el caso sin barra: es un DUEÑO y tiene la casa entera»*.
 *
 * **`esGestor: true` sin preguntar, y el porqué está medido:** las otras dos
 * lecturas resuelven *«¿esta persona manda en el negocio de otro?»*, y acá
 * **no hay negocio de otro**: la cuenta comercial es suya (`owner_profile_id`
 * es su perfil — así llegó a esta rama). Preguntarle a `empleadoTieneRol`
 * por un `prestador_id` que no existe no es una pregunta más estricta: es
 * una pregunta sin sujeto.
 *
 * ⚠️ **Y NEGOCIO no es un tab de más para él: es donde vive su plata.**
 * Ahí están su facturación y su liquidación; sin `NEGOCIO`, el puntero
 * «Datos de facturación» de `ventas/configuracion.tsx` —que hoy se le dibuja
 * SOLO a él porque *«sin él se queda sin ningún camino a sus datos
 * fiscales»*— no tendría a dónde morir. *La barra completa no le regala un
 * cuarto: le devuelve el que su puntero venía supliendo.*
 *
 * **NO LEE NADA, y eso es la cura de una regresión mía** (ver el porqué
 * medido en `capacidadVendedorPuro`): el contexto llega por el tipo, así que
 * esta rama no paga un solo viaje. **La asimetría de los fallos se conserva
 * igual, un piso más arriba:** un `contexto` en `null` puede ser «no tiene
 * cuenta» o «no se pudo leer», y las dos caen en `montaAtender: false` — la
 * CAPACIDAD abre por su fallo *en el brazo del prestador*, donde hay una
 * lectura que puede fallar; acá no hay lectura, y quien la hizo (el guard)
 * ya decidió que sin contexto legible esta persona ni siquiera es vendedora.
 * El brazo del ROL no aparece porque no hay rol que preguntar.
 */
function barraVendedorPuro(contexto: ContextoVentas | null): CapacidadDeBarra {
  return { esGestor: true, montaAtender: hayCapacidad(capacidadVendedorPuro(contexto)) };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * S99-A · LOTE #0a — LA COMPOSICIÓN POR CAPACIDAD, DESDE EL CONTEXTO ÚNICO.
 *
 * ENSANCHE, no lectura paralela (L-175, y el §12.5 de D lo pidió con estas
 * palabras): `obtener_contexto_arranque()` trae en UN viaje lo que
 * `resolverCapacidadDeBarra` resolvía en una ola de tres — y estas dos
 * funciones son PURAS: componen sobre el contexto ya leído, cero red.
 * Una fuente, N consumidores (el guard raíz · el HOY · la ventana de L4).
 *
 * `resolverCapacidadDeBarra` (arriba) SIGUE VIVA para quien todavía no
 * migró (el destape del wizard) — muere cuando su último caller consuma
 * el contexto. No se borra antes: dos caminos declarados le ganan a uno
 * roto.
 * ═══════════════════════════════════════════════════════════════════════ */

import type { ContextoArranque } from '@epetplace/api';

/** El adaptador al shape que `capacidadVendedorPuro` y las pantallas de
 *  ventas ya hablan. `null` = sin cuenta comercial (la misma semántica que
 *  `contextoVentas()` — y con la moneda cayendo al fallback DECLARADO del
 *  riel, byte-idéntico a `resolverContexto`). */
export function contextoVentasDesdeArranque(ctx: ContextoArranque): ContextoVentas | null {
  if (ctx.cuentaComercial === null) return null;
  return {
    cuentaComercialId: ctx.cuentaComercial.id,
    nombreComercial: ctx.cuentaComercial.nombreComercial,
    estadoCuenta: ctx.cuentaComercial.estado,
    esVendedora: ctx.esVendedora,
    moneda: ctx.moneda ?? { codigo: 'USD', simbolo: '$', decimales: 2 },
  };
}

/** LA COMPOSICIÓN: qué barra le toca a quien entra, leída del contexto.
 *  · prestador → las dos preguntas de siempre, ya contestadas por el motor
 *    (rol gestor · posición de mostrador × capacidad de local o tienda).
 *  · sin prestador y vendedora → la barra del vendedor puro (§2.0).
 *  El brazo DUAL no existe como brazo (enmienda de D, aceptada 16-ago):
 *  un prestador que además vende ES un prestador acá — su puerta a pedidos
 *  la monta el HOY con `ctx.esVendedora`, no esta composición. */
export function capacidadDesdeContexto(ctx: ContextoArranque): CapacidadDeBarra {
  if (ctx.prestador !== null) {
    return {
      esGestor: ctx.esGestor,
      montaAtender: ctx.esMostradorOGestion && (ctx.hayOficioLocal || ctx.esVendedora),
    };
  }
  return barraVendedorPuro(contextoVentasDesdeArranque(ctx));
}
