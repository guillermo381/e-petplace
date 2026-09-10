// ═══════════════════════════════════════════════════════════════════════════
// EL PUERTO MANUAL — deja el documento en `pendiente_manual` y NO HACE NADA MÁS
//
// 🔴 Es el modo honesto para lo que la casa NO emite: la factura que emite un
//    tercero (una clínica en agencia), y el día que el proveedor real esté caído.
//    *No intenta, no reintenta y no promete: alguien la cierra a mano con su
//    clave, y hasta entonces el estado lo dice.*
// ═══════════════════════════════════════════════════════════════════════════
import type {
  PuertoFacturacion, ResultadoEmision, ResultadoConsulta, ResultadoWebhook, Capacidades,
} from './puerto.ts';

export function crearManual(): PuertoFacturacion {
  return {
    nombre: 'manual',
    capacidades(): Capacidades {
      return {
        aceptaSecuencialPropio: false,
        aceptaClavePropia: false,
        devuelveRide: false,
        devuelveXml: false,
        webhooks: false,
        contingencia: true,
      };
    },
    // deno-lint-ignore require-await
    async emitir(): Promise<ResultadoEmision> {
      return { referencia: null, estado: 'pendiente_manual', clave_acceso: null,
               motivo: 'puerto_manual: el documento espera que una persona lo cierre' };
    },
    // deno-lint-ignore require-await
    async consultarEstado(): Promise<ResultadoConsulta> {
      return { estado: 'pendiente_manual', motivo: 'puerto_manual: no hay a quién consultar' };
    },
    // deno-lint-ignore require-await
    async recibirWebhook(): Promise<ResultadoWebhook> {
      return { verificado: false, referencia: null, estado: null,
               motivo: 'puerto_manual: no recibe webhooks' };
    },
  };
}
