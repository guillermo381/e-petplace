// ═══════════════════════════════════════════════════════════════════════════
// EL PUERTO DE FACTURACIÓN — la única superficie con la que el motor habla
//
// 🔴 EL MOTOR NO SABE QUÉ PROVEEDOR HAY DEL OTRO LADO, y eso es el punto.
//    Cambiar de proveedor es cambiar `app_config.fiscal_proveedor`, jamás tocar
//    la emisión. El proveedor REAL será un tercer archivo cuando exista; nada de
//    lo que hay acá lo supone.
//
// Letra: MODELO_FISCAL v0.3 §7 · v0.4.
// ═══════════════════════════════════════════════════════════════════════════

/** Los estados que el puerto conoce. Espejo de `fiscal_estado_enum` en la base. */
export type EstadoFiscal =
  | 'emitiendo' | 'autorizada' | 'no_autorizada' | 'pendiente_manual';

export interface ResultadoEmision {
  referencia: string | null;
  estado: EstadoFiscal;
  clave_acceso: string | null;
  motivo?: string;
}

export interface ResultadoConsulta {
  estado: EstadoFiscal;
  autorizado_en?: string;
  xml?: string;
  ride?: string;
  motivo?: string;
}

export interface ResultadoWebhook {
  verificado: boolean;
  referencia: string | null;
  estado: EstadoFiscal | null;
  xml?: string;
  ride?: string;
  motivo?: string;
}

/**
 * 🔴 LAS CAPACIDADES SE PREGUNTAN, NO SE SUPONEN.
 *
 * Un proveedor que numera él mismo y otro que acepta nuestro secuencial son dos
 * motores distintos, y la diferencia **no tiene síntoma**: los dos devuelven
 * «autorizada». *Si el motor asume que su secuencial viaja y el proveedor lo
 * ignora, la numeración de la casa y la del SRI se separan en silencio y nadie
 * se entera hasta la conciliación del mes.*
 */
export interface Capacidades {
  aceptaSecuencialPropio: boolean;
  aceptaClavePropia: boolean;
  devuelveRide: boolean;
  devuelveXml: boolean;
  webhooks: boolean;
  contingencia: boolean;
}

export interface PuertoFacturacion {
  nombre: string;
  emitir(canonico: unknown): Promise<ResultadoEmision>;
  consultarEstado(referencia: string): Promise<ResultadoConsulta>;
  recibirWebhook(req: Request): Promise<ResultadoWebhook>;
  capacidades(): Capacidades;
}
