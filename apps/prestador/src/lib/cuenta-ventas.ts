/**
 * EL CONTEXTO DEL MÓDULO DE VENTAS — con caché de módulo.
 *
 * Cada pantalla de /ventas necesita la cuenta comercial y su naturaleza.
 * Sin caché, cada foco pagaría 2-3 viajes solo para resolver quién soy —
 * exactamente el prólogo serial que S94-PERF midió como el costo real
 * (D-738: el peaje es la PETICIÓN, no los datos). Precedente del patrón:
 * `hogarCargadoRef` (S92-BIS) — un espejo de módulo que se invalida a
 * mano, jamás un estado de render capturado.
 *
 * ⏪ S98-C · ACÁ DECÍA que no hacía falta invalidar «porque nada lo cambia
 * desde la app — la cuenta y sus roles se otorgan del lado de e-PetPlace».
 * **Esa frase describía bien el hecho y sacaba la conclusión opuesta**, y
 * costó el incidente de D-821. Hoy rige lo contrario y está abajo, en el
 * cuerpo: **lo que otorga un tercero no se cachea.**
 * `invalidarContextoVentas()` sigue existiendo para lo ESTABLE (el día que
 * la app cree una cuenta desde adentro).
 */

import {
  getClient,
  obtenerConfigMoneda,
  obtenerMiCuentaComercial,
  rolesActivosDeMiCuenta,
} from '@epetplace/api';
import { MONEDA_FALLBACK, type ConfigMoneda } from '@epetplace/i18n';

export interface ContextoVentas {
  cuentaComercialId: string;
  nombreComercial: string;
  estadoCuenta: string;
  /** La cuenta tiene el rol `seller_productos` ACTIVO. */
  esVendedora: boolean;
  moneda: ConfigMoneda;
}

// undefined = nunca cargado · null = la persona NO tiene cuenta comercial
let cache: ContextoVentas | null | undefined;

export function invalidarContextoVentas(): void {
  cache = undefined;
}

// 🔴 S96-C (cura de un hueco PROPIO, cazado al cablear al vendedor puro):
// el header de este archivo decía «el logout reinicia el bundle» — FALSO
// para el logout EN CALIENTE (cerrar sesión desde una pantalla no recarga
// JS): el caché del usuario anterior le quedaba al siguiente. El espejo
// se invalida con el estado de auth, no con la memoria de quién salió.
let escuchandoAuth = false;
function asegurarEscuchaAuth(): void {
  if (escuchandoAuth) return;
  escuchandoAuth = true;
  getClient().auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT' || evento === 'SIGNED_IN') cache = undefined;
  });
}

/* 🔴 S98-C · D-821 — LO QUE OTORGA e-PetPlace NO SE CACHEA. NUNCA.
 *
 * EL INCIDENTE, con el founder parado en la puerta: A le aprobó
 * `seller_productos` **con la app abierta**, y `/ventas` le siguió diciendo
 * *«Tu negocio todavía no vende productos»*. Medido en la base al momento:
 * `cuenta_roles` con `seller_productos` **activo** y la cuenta **activa**.
 * La pantalla no estaba equivocada: **estaba leyendo un veredicto viejo**.
 *
 * ⚠️ **Y ESTE ARCHIVO TENÍA EL RAZONAMIENTO ESCRITO — AL REVÉS.** Su
 * cabecera decía: *«`invalidarContextoVentas()` se llama cuando algo que
 * este caché refleja cambia (hoy: nada lo cambia desde la app — la cuenta y
 * sus roles se otorgan del lado de e-PetPlace)»*, y concluía que por eso no
 * hacía falta invalidar. **Es exactamente al revés: que lo otorgue un
 * TERCERO es lo que garantiza que el caché quede viejo sin que nadie se
 * entere.** Un dato que solo cambia por acción tuya se puede cachear —
 * vos sabés cuándo tocarlo. Uno que cambia por acción AJENA, no.
 * (Y `invalidarContextoVentas` nunca tuvo un solo llamador: la válvula
 * existía y no estaba conectada a nada.)
 *
 * ⇒ **EL CACHÉ SE PARTE POR QUIÉN PUEDE CAMBIAR EL DATO**, no por si es
 * caro de leer:
 *   · **estable** (se cachea) — id, nombre comercial, moneda del país.
 *   · **otorgado** (JAMÁS) — `esVendedora` y `estadoCuenta`, que e-PetPlace
 *     concede, suspende y cierra desde afuera.
 *
 * COSTO DECLARADO: las pantallas que hoy pagaban CERO pasan a pagar **una
 * ola de dos peticiones en paralelo** (D-738 · L-223: lo que se paga en
 * reloj es la cadena, no la cantidad). *Es el precio de no mentir sobre un
 * permiso, y una pantalla que le niega a alguien lo que ya le dieron cuesta
 * más que 150 ms.*
 */
/* 🔴 LA DEDUPLICACIÓN EN VUELO — y nace de una medición, no de un temor.
 *
 * Al quitar el caché del veredicto, el instrumento contó **3 consultas a
 * `cuenta_roles` por visita** donde yo había declarado «una ola de dos
 * peticiones». La causa: en la misma pantalla hay TRES consumidores
 * (`_layout`, `negocio`, `capacidad-atender`) llamando a la vez, y cada uno
 * arrancaba su propia lectura. *Mi número estaba mal y lo dijo la corrida,
 * no el razonamiento.*
 *
 * Esto **NO devuelve el caché**: no guarda el veredicto para después —
 * guarda la promesa mientras está EN EL AIRE, y la suelta al resolver. Tres
 * preguntas simultáneas comparten una respuesta; la próxima vez se vuelve a
 * preguntar. *La diferencia entre deduplicar y cachear es el tiempo: una
 * dura lo que dura el viaje, el otro dura hasta que alguien se acuerde de
 * invalidarlo — y ahí estaba el incidente.* */
let enVuelo:
  | Promise<{ ok: true; data: ContextoVentas | null } | { ok: false; mensaje: string }>
  | null = null;

export async function contextoVentas(): Promise<
  { ok: true; data: ContextoVentas | null } | { ok: false; mensaje: string }
> {
  if (enVuelo !== null) return enVuelo;
  enVuelo = resolverContexto().finally(() => {
    enVuelo = null;
  });
  return enVuelo;
}

async function resolverContexto(): Promise<
  { ok: true; data: ContextoVentas | null } | { ok: false; mensaje: string }
> {
  asegurarEscuchaAuth();
  // `null` cacheado = esta persona NO tiene cuenta comercial. Eso sí es
  // estable dentro de la sesión: una cuenta se crea por un acto propio, y
  // ese acto pasa por `invalidarContextoVentas()`.
  if (cache === null) return { ok: true, data: null };

  const [cta, monedaCacheada] = [await obtenerMiCuentaComercial(), cache?.moneda];
  if (!cta.ok) return { ok: false, mensaje: cta.mensaje };
  if (cta.data === null) {
    cache = null;
    return { ok: true, data: null };
  }

  const [roles, moneda] = await Promise.all([
    // EL VEREDICTO, SIEMPRE FRESCO — es el dato del incidente.
    rolesActivosDeMiCuenta(cta.data.id),
    // La moneda sale del país de la cuenta y no cambia: se cachea de verdad.
    monedaCacheada !== undefined
      ? Promise.resolve({ ok: true as const, data: monedaCacheada })
      : obtenerConfigMoneda(cta.data.countryCode),
  ]);
  if (!roles.ok) return { ok: false, mensaje: roles.mensaje };

  cache = {
    cuentaComercialId: cta.data.id,
    nombreComercial: cta.data.nombreComercial,
    estadoCuenta: cta.data.estado,
    esVendedora: roles.data.includes('seller_productos'),
    // La config de moneda que no se pudo leer degrada al fallback DECLARADO
    // del riel (USD/$/2) — no es un hardcode nuestro: es la única moneda
    // viva y el riel la declara como tal.
    moneda: moneda.ok ? moneda.data : MONEDA_FALLBACK,
  };
  return { ok: true, data: cache };
}
