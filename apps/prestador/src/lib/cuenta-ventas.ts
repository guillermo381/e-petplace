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
 * `invalidarContextoVentas()` se llama cuando algo que este caché refleja
 * cambia (hoy: nada lo cambia desde la app — la cuenta y sus roles se
 * otorgan del lado de e-PetPlace). El logout reinicia el bundle, así que
 * no hay fuga entre sesiones en v1; si algún día el cambio de cuenta vive
 * sin reinicio, este módulo es el primer lugar a mirar.
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

export async function contextoVentas(): Promise<
  { ok: true; data: ContextoVentas | null } | { ok: false; mensaje: string }
> {
  asegurarEscuchaAuth();
  if (cache !== undefined) return { ok: true, data: cache };

  const cta = await obtenerMiCuentaComercial();
  if (!cta.ok) return { ok: false, mensaje: cta.mensaje };
  if (cta.data === null) {
    cache = null;
    return { ok: true, data: null };
  }

  const [roles, moneda] = await Promise.all([
    rolesActivosDeMiCuenta(cta.data.id),
    obtenerConfigMoneda(cta.data.countryCode),
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
