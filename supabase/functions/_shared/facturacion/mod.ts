// El resolvedor: qué puerto está vivo lo dice `app_config.fiscal_proveedor`.
import type { PuertoFacturacion } from './puerto.ts';
import { crearSimulador } from './simulador.ts';
import { crearManual } from './manual.ts';

export * from './puerto.ts';
export * from './canonico.ts';
export * from './clave_acceso.ts';
export { MARCA_PRUEBAS, xmlDesdeCanonico, rideDesdeCanonico, hmacHex } from './simulador.ts';

export function resolverPuerto(
  nombre: string,
  secretoWebhook: string,
  /* Sólo el simulador la mira: es la palanca del ensayo de cupo agotado. */
  simularCupoAgotado = false,
): PuertoFacturacion {
  switch (nombre) {
    case 'simulador': return crearSimulador(secretoWebhook, simularCupoAgotado);
    case 'manual':    return crearManual();
    /* 🔴 Fail-closed: un nombre desconocido NO cae al simulador. *Caer al
       simulador emitiría documentos de prueba creyendo que son reales* — que es
       exactamente la clase de silencio que este motor no puede tener. */
    default:
      throw new Error(`fiscal_proveedor_desconocido: ${nombre}`);
  }
}
