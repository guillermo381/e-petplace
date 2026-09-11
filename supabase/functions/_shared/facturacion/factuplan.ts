// ═══════════════════════════════════════════════════════════════════════════
// FACTUPLAN — la tercera implementación del puerto (SigniaDigital, RUC 0993411372001)
//
// Base: https://api-rest.factuplan.com.ec/v1 · headers `x-api-key` + `x-taxpayer-ruc`.
// Contratos leídos del SDK oficial `factuplan@0.15.0` (`dist/index.d.ts`) y de la
// colección Postman pública — NO de la prosa de la doc. *La doc describe; el
// `.d.ts` es lo que el servidor contesta.*
//
// 🔴 DOS MODOS, y la diferencia es QUIÉN NUMERA:
//    · 'factuplan'     → POST /developer/invoices       · numeran ELLOS
//    · 'factuplan_xml' → POST /developer/sign-and-authorize · numeramos NOSOTROS
//    Se expresa en `capacidades()` y el motor ya sabe leerlo. No es una bandera
//    adentro del adaptador: son dos puertos con el mismo código.
//
// 🔴 SE ESCRIBE CONTRA fetch Y NO CONTRA EL SDK npm, a propósito. El SDK es
//    Node/npm, la superficie que usamos son ocho endpoints, y su contrato ya
//    está leído. *Una dependencia que no controlamos en el camino de la
//    facturación agrega un modo de falla —su breaking change— a cambio de
//    ahorrar código que igual hay que entender para depurar un rechazo del SRI.*
// ═══════════════════════════════════════════════════════════════════════════
import type {
  PuertoFacturacion, ResultadoEmision, ResultadoConsulta, ResultadoWebhook, Capacidades,
  RideEntregado,
} from './puerto.ts';
import type { DocumentoCanonico } from './canonico.ts';

const BASE = 'https://api-rest.factuplan.com.ec/v1';

/** Ventana de la firma del webhook. Más viejo que esto, no se procesa. */
const TOLERANCIA_FIRMA_S = 300;

export type ModoFactuplan = 'create' | 'xml';

export interface OpcionesFactuplan {
  apiKey: string;
  /** El contribuyente del workspace. Sale de `fiscal_emisor.ruc`, jamás de un literal. */
  rucContribuyente: string;
  /** `whsec_…` del panel. Sin él, NINGÚN webhook mueve un documento. */
  secretoWebhook: string;
  modo: ModoFactuplan;
  /** Sólo para `sign-and-authorize`: el XML sin firmar lo arma el generador. */
  generarXml?: (c: DocumentoCanonico) => string;
}

/* ── Los contratos que nos importan, copiados del `.d.ts` del SDK ─────────── */
interface RespuestaFactura { id: string; accessKey: string; sequential: string; status: string; total?: number | string }
interface RespuestaFirmar  { id: string; accessKey: string; status: string }
interface EstadoComprobante { id: string; status: string; accessKey?: string; authorizationNumber?: string; authorizationDate?: string }
/** ⚠️ `url` es una pre-firmada de S3 que **EXPIRA EN 5 MINUTOS**. */
interface RespuestaDescarga { url: string; previewUrl?: string }
export interface UsoApi { apiKeyId: string; month: string; quota: number; used: number; remaining: number }
export interface EstadoCertificado { hasCertificate: boolean; isExpired?: boolean; daysUntilExpiry?: number | null; ruc?: string; legalName?: string; expiresAt?: string }

/**
 * El estado de Factuplan → el nuestro.
 *
 * 🔴 FAIL-CLOSED: un estado que no conocemos NO cae a `no_autorizada` ni a
 *    `autorizada`. *Traducir lo desconocido a cualquiera de los dos extremos
 *    afirma algo que nadie midió* — uno da por perdido un comprobante vivo, el
 *    otro da por bueno uno que no lo está. Se queda en vuelo y se consulta.
 */
function traducirEstado(
  s: string,
  /**
   * ¿El comprobante trae número de autorización? Es el DESEMPATE de `COMPLETED`.
   *
   * 🔴 `COMPLETED` NO ESTÁ EN LA DOCUMENTACIÓN — el `.d.ts` del SDK enumera
   *    `DRAFT | PENDING | PROCESSING | AUTHORIZED | REJECTED | VOIDED`, y el
   *    servidor devuelve un séptimo. *Lo encontró el fail-closed, no un gate:
   *    la consulta contestó `estado_desconocido_del_proveedor: COMPLETED` y
   *    dejó el documento en vuelo en vez de afirmar nada.* Si el default
   *    hubiera sido «autorizada» habríamos dado por buena una factura sin
   *    mirarla; si hubiera sido «no autorizada», habríamos dado por perdida una
   *    que estaba bien. **Las dos se habrían visto perfectamente normales.**
   *
   *    Y tampoco se traduce `COMPLETED` a secas: «completado» puede ser el fin
   *    del proceso con CUALQUIER desenlace. Manda el número de autorización,
   *    que es un hecho del SRI y no una palabra del proveedor.
   */
  tieneAutorizacion = false,
): { estado: ResultadoEmision['estado']; conocido: boolean } {
  switch (s?.toUpperCase()) {
    case 'AUTHORIZED': return { estado: 'autorizada', conocido: true };
    case 'COMPLETED':
      return tieneAutorizacion
        ? { estado: 'autorizada', conocido: true }
        : { estado: 'emitiendo', conocido: false };
    case 'REJECTED':
    case 'RETURNED':
    case 'VOIDED':     return { estado: 'no_autorizada', conocido: true };
    case 'DRAFT':
    case 'PENDING':
    case 'PROCESSING': return { estado: 'emitiendo', conocido: true };
    default:           return { estado: 'emitiendo', conocido: false };
  }
}

/** `IVA_0` vs `IVA_RATE`, con las tarifas que el SDK declara válidas. */
const TARIFAS_VALIDAS = new Set([0, 5, 8, 12, 14, 15]);

/** Nuestro vocabulario de identificación → el de ellos. */
const IDENTIFICACION: Record<string, string> = {
  ruc: 'RUC', cedula: 'CEDULA', pasaporte: 'PASSPORT', consumidor_final: 'FINAL_CONSUMER',
};

/** Comparación en tiempo constante: un `===` sobre un HMAC filtra el prefijo. */
function igualEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function hmacSha256Hex(secreto: string, mensaje: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const f = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(mensaje));
  return [...new Uint8Array(f)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * El NOMBRE del evento → lo que significa. **Son TRES por tipo de documento,
 * no dos** (medido por el founder en el panel: «Factura autorizada · Factura
 * rechazada · Factura con error»).
 *
 * 🔴 «CON ERROR» NO ES «RECHAZADA», y confundirlas cuesta plata:
 *    · **rechazada** — el SRI la evaluó y la rechazó. Es definitivo: se corrige
 *      emitiendo un documento nuevo, y el secuencial viejo queda como hueco.
 *    · **con error** — no llegó a evaluarse (firma, servicio caído, proceso).
 *      El comprobante está intacto y **`invoices.retry(id)` lo reintenta sin
 *      consumir cuota**. *Marcarla `no_autorizada` daría por perdido un
 *      comprobante que sólo hay que volver a mandar.*
 *
 * 🔴 Y EL DESCONOCIDO NO SE TRAGA. Los nombres exactos de la API no están
 *    documentados —la doc muestra UN ejemplo, `invoice.authorized`, y el panel
 *    once eventos con nombres visibles en español— así que acá se reconoce por
 *    subcadena y **lo que no entra en ninguna clase se ANOTA con su nombre
 *    literal**. *Un evento desconocido que cae en el mismo balde que «con
 *    error» pierde la única información que tenía: cómo se llama.* El primero
 *    que llegue nos enseña el string, en vez de desaparecer en un default.
 */
export function traducirEventoWebhook(nombre: string): {
  estado: ResultadoWebhook['estado'];
  clase: 'autorizada' | 'rechazada' | 'con_error' | 'desconocido';
  reintentable: boolean;
  motivo?: string;
} {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('authorized') || n.includes('autorizad')) {
    return { estado: 'autorizada', clase: 'autorizada', reintentable: false };
  }
  if (n.includes('rejected') || n.includes('rechazad') ||
      n.includes('returned') || n.includes('devuelt') ||
      n.includes('voided')   || n.includes('anulad')) {
    return { estado: 'no_autorizada', clase: 'rechazada', reintentable: false };
  }
  if (n.includes('error') || n.includes('failed') || n.includes('fallid')) {
    /* Queda EN VUELO: el comprobante conserva su número y su clave, y lo que
       corresponde es `retry`, no un documento nuevo. */
    return { estado: 'emitiendo', clase: 'con_error', reintentable: true,
             motivo: `con_error_del_proveedor: ${nombre} — reintentable con invoices.retry` };
  }
  return { estado: 'emitiendo', clase: 'desconocido', reintentable: false,
           motivo: `evento_desconocido: ${nombre}` };
}

export function crearFactuplan(o: OpcionesFactuplan): PuertoFacturacion {
  if (!o.apiKey) throw new Error('factuplan_sin_api_key');
  if (!/^\d{13}$/.test(o.rucContribuyente ?? '')) {
    /* 🔴 Fail-closed sobre el contribuyente: es el header que decide BAJO QUÉ
       RUC se emite. Sin él, o con uno mal formado, no se hace la llamada —
       *un RUC equivocado no da error de red: da un comprobante de otro.* */
    throw new Error(`factuplan_ruc_contribuyente_invalido: ${o.rucContribuyente}`);
  }

  const cab = () => ({
    'x-api-key': o.apiKey,
    'x-taxpayer-ruc': o.rucContribuyente,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  async function llamar<T>(
    metodo: string, ruta: string, cuerpo?: unknown,
  ): Promise<{ ok: true; data: T } | { ok: false; status: number; codigo: string; mensaje: string; detalles?: unknown }> {
    let r: Response;
    try {
      r = await fetch(`${BASE}${ruta}`, {
        method: metodo, headers: cab(),
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        /* Techo explícito: un fetch sin techo cuelga su promesa y el silencio
           del proceso se lee como progreso. */
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e) {
      return { ok: false, status: 0, codigo: 'red', mensaje: String(e).slice(0, 200) };
    }
    const txt = await r.text();
    let j: Record<string, unknown> = {};
    try { j = txt ? JSON.parse(txt) : {}; } catch { /* cuerpo no-JSON: se dice abajo */ }
    if (!r.ok) {
      /* 🔴 EL ERROR VIENE ANIDADO — medido contra el proveedor real, no leído:
         `{ data: null, meta: {...}, error: { code, message, statusCode, details } }`.
         La v1 hacía `j.code ?? j.error`, y como `j.code` no existe caía al
         OBJETO `j.error` y lo pasaba por `String()`: el motivo quedaba
         literalmente `[object Object]`.
         *Y el daño real no era el texto feo: `codigo` nunca iba a valer
         `API_10002`, así que **la guarda de cupo agotado no habría disparado
         jamás** — un rechazo por cuota se habría tratado como rechazo del SRI,
         marcando `no_autorizada` un comprobante que sólo había que reencolar.*
         Es `L-535` mordiendo por donde no la esperaba: tenía razón en decidir
         por el código, y el código estaba un piso más adentro. */
      const err = (j.error ?? {}) as Record<string, unknown>;
      return {
        ok: false, status: r.status,
        codigo: String(err.code ?? j.code ?? `http_${r.status}`),
        mensaje: String(err.message ?? j.message ?? txt).slice(0, 400),
        detalles: (err.details ?? j.details) as unknown,
      };
    }
    return { ok: true, data: (j.data ?? j) as T };
  }

  /** El cuerpo de `POST /developer/invoices` desde nuestro canónico. */
  function cuerpoFactura(c: DocumentoCanonico) {
    const idTipo = IDENTIFICACION[c.receptor.tipo_identificacion];
    if (!idTipo) throw new Error(`identificacion_sin_traduccion: ${c.receptor.tipo_identificacion}`);

    const items = c.items.map((it) => {
      const cero = it.tarifa_pct === 0;
      if (!cero && !TARIFAS_VALIDAS.has(it.tarifa_pct)) {
        throw new Error(`tarifa_no_admitida_por_el_proveedor: ${it.tarifa_pct}`);
      }
      return {
        code: String(it.linea),
        description: it.descripcion,
        quantity: it.cantidad,
        unitPrice: it.precio_unitario,
        ...(it.descuento ? { discount: it.descuento } : {}),
        taxType: cero ? 'IVA_0' : 'IVA_RATE',
        ...(cero ? {} : { tax: it.tarifa_pct }),
      };
    });

    /* 🔴 LA SUMA DE `payments` DEBE SER EXACTA AL TOTAL o el proveedor rebota
       400. Se manda UN pago por el total y se verifica acá: *un 400 por
       centavos es un diagnóstico caro, y el redondeo ya está resuelto una línea
       más arriba en el canónico.* */
    const pagos = [{ method: c.forma_pago_sri, amount: c.total }];
    const suma = Math.round(pagos.reduce((a, p) => a + p.amount, 0) * 100) / 100;
    if (suma !== Math.round(c.total * 100) / 100) {
      throw new Error(`pagos_no_suman_el_total: ${suma} vs ${c.total}`);
    }

    return {
      establishment: c.emisor.establecimiento,
      emissionPoint: c.emisor.punto_emision,
      customer: {
        identificationType: idTipo,
        identification: c.receptor.identificacion,
        legalName: c.receptor.razon_social,
        ...(c.receptor.email ? { email: c.receptor.email } : {}),
        ...(c.receptor.direccion ? { address: c.receptor.direccion } : {}),
        saveToContacts: false,
      },
      items,
      payments: pagos,
      additionalInfo: c.informacion_adicional,
      /* 🔴 `sendEmail` NO VA, y no es una decisión nuestra: **la API desplegada
         lo RECHAZA**. Medido contra el proveedor real:
           «property sendEmail should not exist»  (400, validación por lista
            blanca)
         La documentación y el `.d.ts` del SDK 0.15.0 lo declaran como opción de
         primer nivel con default `true`. *El SDK va adelante de la API que está
         corriendo, y el que manda es la que contesta.*

         ⚠️ CONSECUENCIA QUE HAY QUE DECIR EN VOZ ALTA: sin poder apagarlo, **el
         proveedor manda su propio correo al receptor**, con su RIDE y no el
         nuestro, y fuera del motor de avisos de la casa — que es exactamente lo
         que el founder quería evitar. Es decisión suya, no un detalle técnico:
         o se pide a Factuplan que lo habilite, o el correo «Tu factura» de la
         casa convive con el de ellos. Queda declarado en `D-1065`. */
    };
  }

  /** El XML y el RIDE, TRAÍDOS — no sus enlaces. */
  async function traerArchivos(id: string): Promise<{ xml?: string; ride?: RideEntregado }> {
    /* 🔴 LOS ENLACES NO SE GUARDAN: la URL es una pre-firmada de S3 que **expira
       en 5 minutos**, y en Pruebas el documento entero se borra cada hora.
       *Guardar el enlace sería guardar un papel que se despinta solo* — se
       traen los bytes y se archivan en el mismo acto. */
    const out: { xml?: string; ride?: RideEntregado } = {};
    const x = await llamar<RespuestaDescarga>('GET', `/developer/receipts/${id}/xml`);
    if (x.ok && x.data?.url) {
      try {
        const b = await fetch(x.data.url, { signal: AbortSignal.timeout(30_000) });
        if (b.ok) out.xml = await b.text();
      } catch { /* el estado igual avanza; la falta de archivo se ve en la fila */ }
    }
    const p = await llamar<RespuestaDescarga>('GET', `/developer/receipts/${id}/pdf`);
    if (p.ok && p.data?.url) {
      try {
        const b = await fetch(p.data.url, { signal: AbortSignal.timeout(30_000) });
        if (b.ok) {
          /* 🔴 BYTES, no `.text()`. El RIDE de Factuplan es un PDF: leerlo como
             texto lo corrompe **sin fallar** — el archivo se sube, pesa lo
             parecido, y no abre. Viaja en base64 y la edge decodifica. */
          const bytes = new Uint8Array(await b.arrayBuffer());
          let bin = '';
          for (let i = 0; i < bytes.length; i += 0x8000) {
            bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          }
          out.ride = { contenido: btoa(bin), mime: 'application/pdf', base64: true };
        }
      } catch { /* idem */ }
    }
    return out;
  }

  return {
    nombre: o.modo === 'xml' ? 'factuplan_xml' : 'factuplan',

    capacidades(): Capacidades {
      /* 🔴 Lo que cambia entre los dos modos es EXACTAMENTE esto, y por eso las
         capacidades se preguntan en vez de suponerse: con `create` el motor no
         debe tomar secuencial (quemaría uno por emisión). */
      return o.modo === 'xml'
        ? { aceptaSecuencialPropio: true,  aceptaClavePropia: true,
            devuelveRide: true, devuelveXml: true, webhooks: true, contingencia: false }
        : { aceptaSecuencialPropio: false, aceptaClavePropia: false,
            devuelveRide: true, devuelveXml: true, webhooks: true, contingencia: false };
    },

    async emitir(canonico: unknown): Promise<ResultadoEmision> {
      const c = canonico as DocumentoCanonico;
      let r;
      if (o.modo === 'xml') {
        if (!o.generarXml) throw new Error('factuplan_xml_sin_generador');
        r = await llamar<RespuestaFirmar>('POST', '/developer/sign-and-authorize',
                                          { xml: o.generarXml(c) });
      } else {
        r = await llamar<RespuestaFactura>('POST', '/developer/invoices', cuerpoFactura(c));
      }

      if (!r.ok) {
        /* 🔴 LA CUOTA NO ES UN RECHAZO DEL COMPROBANTE. `API_10002` sobre 429 es
           el código exacto que el proveedor documenta; el comprobante ni se
           evaluó, así que conserva su número y vuelve a la cola. */
        const esCupo = r.status === 429 || r.codigo === 'API_10002';
        const esCaido = r.status === 0 || r.status >= 500;
        return {
          referencia: null,
          estado: esCupo || esCaido ? 'emitiendo' : 'no_autorizada',
          clave_acceso: null,
          motivo: `${r.codigo}: ${r.mensaje}`,
          codigo: esCupo ? 'cupo_agotado' : esCaido ? 'proveedor_caido' : 'rechazo_del_sri',
          reintentable: esCupo || esCaido,
        };
      }

      const t = traducirEstado(r.data.status);
      /* `sequential` sólo viene en `create` —en `sign-and-authorize` el número
         es nuestro y ya está en la fila—. Se pasa tal cual: normalizarlo acá
         (rellenar a 9, recortar) escondería una discrepancia que el cotejo
         contra la fila existe para encontrar. */
      const sec = (r.data as { sequential?: string }).sequential ?? null;
      return {
        referencia: r.data.id,
        estado: t.estado,
        clave_acceso: r.data.accessKey ?? null,
        ...(sec ? { secuencial_proveedor: sec } : {}),
        ...(t.conocido ? {} : { motivo: `estado_desconocido_del_proveedor: ${r.data.status}` }),
      };
    },

    async consultarEstado(referencia: string): Promise<ResultadoConsulta> {
      const r = await llamar<EstadoComprobante>('GET', `/developer/receipts/${referencia}/status`);
      if (!r.ok) {
        return { estado: 'emitiendo', motivo: `consulta_fallo ${r.codigo}: ${r.mensaje}` };
      }
      const t = traducirEstado(r.data.status, Boolean(r.data.authorizationNumber));
      const res: ResultadoConsulta = {
        estado: t.estado,
        ...(r.data.authorizationDate ? { autorizado_en: r.data.authorizationDate } : {}),
        ...(t.conocido ? {} : { motivo: `estado_desconocido_del_proveedor: ${r.data.status}` }),
      };
      if (t.estado === 'autorizada') Object.assign(res, await traerArchivos(referencia));
      return res;
    },

    async recibirWebhook(req: Request): Promise<ResultadoWebhook> {
      if (!o.secretoWebhook) {
        return { verificado: false, referencia: null, estado: null,
                 motivo: 'sin_secreto_de_webhook: FACTURACION_WEBHOOK_SECRET no está cargado' };
      }
      /* 🔴 SOBRE EL CUERPO CRUDO. Si se parsea y se vuelve a serializar, la
         firma no coincide — y el síntoma es «firma inválida», que manda a
         revisar el secreto en vez del orden de las operaciones. */
      const crudo = await req.text();
      const cab = req.headers.get('X-Factuplan-Signature') ?? '';
      const t = /t=(\d+)/.exec(cab)?.[1];
      const v1 = /v1=([0-9a-f]+)/.exec(cab)?.[1];
      if (!t || !v1) {
        return { verificado: false, referencia: null, estado: null,
                 motivo: 'firma_ausente_o_mal_formada' };
      }
      /* Ventana de 5 minutos: sin esto, una entrega capturada se puede repetir
         para siempre y la firma sigue siendo válida. */
      const edad = Math.abs(Date.now() / 1000 - Number(t));
      if (edad > TOLERANCIA_FIRMA_S) {
        return { verificado: false, referencia: null, estado: null,
                 motivo: `firma_vencida: ${Math.round(edad)}s` };
      }
      const esperado = await hmacSha256Hex(o.secretoWebhook, `${t}.${crudo}`);
      if (!igualEnTiempoConstante(esperado, v1)) {
        return { verificado: false, referencia: null, estado: null, motivo: 'firma_no_coincide' };
      }

      let ev: { event?: string; data?: { receiptId?: string; accessKey?: string; authorizationNumber?: string } };
      try { ev = JSON.parse(crudo); } catch {
        return { verificado: true, referencia: null, estado: null, motivo: 'cuerpo_no_json' };
      }
      const id = ev.data?.receiptId ?? null;
      if (!id) return { verificado: true, referencia: null, estado: null, motivo: 'sin_receiptId' };

      /* 🔴 El aviso NO trae el XML ni el RIDE — sólo el `receiptId` y la clave
         (medido en `WebhookReceiptData` del SDK). Se traen acá, en caliente,
         porque el enlace vive 5 minutos y en Pruebas el documento una hora. */
      const clasif = traducirEventoWebhook(ev.event ?? '');
      const archivos = clasif.estado === 'autorizada' ? await traerArchivos(id) : {};
      return {
        verificado: true, referencia: id, estado: clasif.estado,
        ...(clasif.motivo ? { motivo: clasif.motivo } : {}),
        ...archivos,
      };
    },
  };
}

/* ── Lecturas de operación: no son del puerto, son del tablero ────────────── */

export async function usoDelApi(apiKey: string, ruc: string): Promise<UsoApi | { error: string }> {
  const r = await fetch(`${BASE}/developer/usage`, {
    headers: { 'x-api-key': apiKey, 'x-taxpayer-ruc': ruc, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(20_000),
  }).catch((e) => ({ ok: false, status: 0, text: () => Promise.resolve(String(e)) } as unknown as Response));
  const txt = await r.text();
  if (!r.ok) return { error: `http_${r.status}: ${txt.slice(0, 200)}` };
  try { const j = JSON.parse(txt); return (j.data ?? j) as UsoApi; }
  catch { return { error: `respuesta_no_json: ${txt.slice(0, 200)}` }; }
}

export async function estadoCertificado(apiKey: string, ruc: string): Promise<EstadoCertificado | { error: string }> {
  const r = await fetch(`${BASE}/developer/certificate/status`, {
    headers: { 'x-api-key': apiKey, 'x-taxpayer-ruc': ruc, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(20_000),
  }).catch((e) => ({ ok: false, status: 0, text: () => Promise.resolve(String(e)) } as unknown as Response));
  const txt = await r.text();
  if (!r.ok) return { error: `http_${r.status}: ${txt.slice(0, 200)}` };
  try { const j = JSON.parse(txt); return (j.data ?? j) as EstadoCertificado; }
  catch { return { error: `respuesta_no_json: ${txt.slice(0, 200)}` }; }
}
