// El resolvedor: qué puerto está vivo lo dice `app_config.fiscal_proveedor`.
import type { PuertoFacturacion } from './puerto.ts';
import { crearSimulador } from './simulador.ts';
import { crearManual } from './manual.ts';
import { crearFactuplan } from './factuplan.ts';

export * from './puerto.ts';
export * from './canonico.ts';
export * from './clave_acceso.ts';
export { MARCA_PRUEBAS, xmlDesdeCanonico, rideDesdeCanonico, hmacHex } from './simulador.ts';

/**
 * 🔴 EL PROVEEDOR ES CONFIGURACIÓN, NO SECRETO — firma del founder, S115-A.
 *
 * Vive en `app_config.fiscal_proveedor`: ahí tiene historial, se ve desde el
 * portal de operaciones y se cambia sin tocar secretos. Los secretos quedan
 * para lo que sí lo es — la API key y la firma del webhook.
 *
 * ⚠️ `FACTURACION_PROVEEDOR` y `FACTURACION_AMBIENTE` **están cargados en el
 *    proyecto y NO SE LEEN**. Medido el 10-sep-2026: cero lectores en edges, en
 *    SQL y en `packages/api`. *Un secreto cargado que nadie lee no es inocuo:
 *    se lee como autoridad —alguien abre el panel, ve `factuplan` y concluye
 *    que el adaptador está vivo— y no hay forma de descubrir que no lo es sin
 *    leer el código.* Por eso esto no se resuelve con un comentario: se resuelve
 *    DICIENDO en cada corrida de dónde salió el valor, y gritando si el secreto
 *    homónimo dice otra cosa.
 */
export interface ProveedorResuelto {
  nombre: string;
  fuente: 'app_config.fiscal_proveedor' | 'default:manual';
  /** El secreto homónimo existe y NO coincide. No manda — pero se dice. */
  discrepancia?: string;
}

export function resolverProveedorConProcedencia(
  valorDeAppConfig: string | null | undefined,
): ProveedorResuelto {
  const r: ProveedorResuelto = valorDeAppConfig
    ? { nombre: valorDeAppConfig, fuente: 'app_config.fiscal_proveedor' }
    /* Fail-closed en el sentido del negocio: sin configuración no se emite
       contra nadie — se deja el documento para que una persona lo cierre. */
    : { nombre: 'manual', fuente: 'default:manual' };

  const delSecreto = Deno.env.get('FACTURACION_PROVEEDOR');
  if (delSecreto && delSecreto !== r.nombre) {
    r.discrepancia =
      `FACTURACION_PROVEEDOR dice "${delSecreto}" y NO se lee: ` +
      `manda ${r.fuente} = "${r.nombre}". El secreto es decorativo (S115-A).`;
  }
  return r;
}

export interface ContextoPuerto {
  /** `FACTURACION_WEBHOOK_SECRET`. Sin él ningún webhook mueve un documento. */
  secretoWebhook: string;
  /** `FACTURACION_API_KEY`. Sólo la usa el proveedor real. */
  apiKey?: string;
  /**
   * 🔴 EL CONTRIBUYENTE SALE DE `fiscal_emisor.ruc`, JAMÁS DE UN LITERAL NI DE
   *    UN SECRETO. Es el header `x-taxpayer-ruc`, que decide BAJO QUÉ RUC se
   *    emite. *Cambiar de contribuyente tiene que ser cambiar una fila* — firma
   *    del founder, S115-A — y el día que Satori Inov se dé de alta, eso es
   *    todo lo que cambia.
   */
  rucContribuyente?: string;
  /** Sólo el simulador la mira: es la palanca del ensayo de cupo agotado. */
  simularCupoAgotado?: boolean;
}

export function resolverPuerto(nombre: string, ctx: ContextoPuerto): PuertoFacturacion {
  switch (nombre) {
    case 'simulador':
      return crearSimulador(ctx.secretoWebhook, ctx.simularCupoAgotado ?? false);
    case 'manual':
      return crearManual();
    /* Los dos modos de Factuplan son DOS PUERTOS con el mismo código: lo que
       cambia es quién numera, y eso se lee en `capacidades()`. */
    case 'factuplan':
    case 'factuplan_xml':
      if (!ctx.apiKey) throw new Error('factuplan_sin_api_key: FACTURACION_API_KEY no está cargado');
      if (!ctx.rucContribuyente) throw new Error('factuplan_sin_contribuyente: fiscal_emisor.ruc está vacío');
      return crearFactuplan({
        apiKey: ctx.apiKey,
        rucContribuyente: ctx.rucContribuyente,
        secretoWebhook: ctx.secretoWebhook,
        modo: nombre === 'factuplan_xml' ? 'xml' : 'create',
      });
    /* 🔴 Fail-closed: un nombre desconocido NO cae al simulador. *Caer al
       simulador emitiría documentos de prueba creyendo que son reales* — que es
       exactamente la clase de silencio que este motor no puede tener. */
    default:
      throw new Error(`fiscal_proveedor_desconocido: ${nombre}`);
  }
}
