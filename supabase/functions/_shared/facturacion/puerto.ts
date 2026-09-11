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
  /**
   * 🔴 EL CÓDIGO, NO EL MENSAJE. Un motivo es para que lo lea un humano; el
   *    motor decide por esto. *Decidir por `motivo.includes('cupo')` es la
   *    misma clase que comparar contra un literal ajeno (`L-535`): el día que
   *    el proveedor cambie una palabra, el reintento deja de existir.*
   */
  codigo?: 'cupo_agotado' | 'proveedor_caido' | 'rechazo_del_sri' | 'otro';
  /**
   * ¿Se puede volver a intentar CON EL MISMO documento?
   *
   * Un rechazo por CUPO o un proveedor caído no son un rechazo del comprobante:
   * el comprobante nunca llegó a evaluarse. **El documento conserva su
   * secuencial y su clave y vuelve a la cola** — porque tomarle un secuencial
   * nuevo dejaría un hueco en la numeración que hay que explicarle al SRI, y
   * emitirlo dos veces sería peor.
   */
  reintentable?: boolean;
}

/**
 * EL RIDE, con su forma declarada.
 *
 * 🔴 NO ES SIEMPRE HTML. El simulador lo genera en HTML; Factuplan devuelve un
 *    **PDF binario**. *Meter los dos en un `string` obliga a adivinar del otro
 *    lado, y el modo de falla es mudo: un PDF leído como texto se sube igual,
 *    con el `content-type` equivocado, y lo que se rompe es el archivo — que
 *    nadie abre hasta que una familia lo pide.*
 */
export interface RideEntregado {
  contenido: string;
  mime: string;
  /** `true` ⇒ `contenido` viene en base64 y hay que decodificar antes de subir. */
  base64: boolean;
}

export interface ResultadoConsulta {
  estado: EstadoFiscal;
  autorizado_en?: string;
  xml?: string;
  ride?: RideEntregado;
  motivo?: string;
}

export interface ResultadoWebhook {
  verificado: boolean;
  referencia: string | null;
  estado: EstadoFiscal | null;
  xml?: string;
  ride?: RideEntregado;
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
