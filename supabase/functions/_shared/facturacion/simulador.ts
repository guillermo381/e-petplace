// ═══════════════════════════════════════════════════════════════════════════
// EL SIMULADOR — autoriza en segundos, contra NADIE
//
// 🔴 NO ES UN PROVEEDOR DE MENTIRA: es el proveedor de PRUEBAS de la casa, y su
//    trabajo es que el motor se ejercite entero (secuencial → clave → emitir →
//    webhook → archivo) sin depender de un tercero que todavía no se contrató.
//    Todo lo que produce lleva la marca de que no vale ante el SRI — en el RIDE,
//    en el XML y en el ambiente. *Un documento de pruebas indistinguible de uno
//    real es exactamente lo que no puede pasar.*
// ═══════════════════════════════════════════════════════════════════════════
import type {
  PuertoFacturacion, ResultadoEmision, ResultadoConsulta, ResultadoWebhook, Capacidades,
} from './puerto.ts';
import type { DocumentoCanonico } from './canonico.ts';

export const MARCA_PRUEBAS = 'AMBIENTE DE PRUEBAS · SIN VALIDEZ TRIBUTARIA';

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** XML mínimo derivado del canónico. No pretende ser la ficha 2.34 completa. */
export function xmlDesdeCanonico(c: DocumentoCanonico, claveAcceso: string): string {
  const items = c.items.map((i) => `
    <detalle>
      <descripcion>${esc(i.descripcion)}</descripcion>
      <cantidad>${i.cantidad}</cantidad>
      <precioUnitario>${i.precio_unitario.toFixed(2)}</precioUnitario>
      <descuento>${i.descuento.toFixed(2)}</descuento>
      <precioTotalSinImpuesto>${i.base.toFixed(2)}</precioTotalSinImpuesto>
      <impuesto><codigo>${esc(i.codigo_sri ?? '')}</codigo><codigoPorcentaje>${esc(i.codigo_porcentaje_sri ?? '')}</codigoPorcentaje>` +
      `<tarifa>${i.tarifa_pct}</tarifa><baseImponible>${i.base.toFixed(2)}</baseImponible>` +
      `<valor>${i.valor_iva.toFixed(2)}</valor></impuesto>
    </detalle>`).join('');

  const grupos = c.subtotales_por_tarifa.map((g) =>
    `<totalImpuesto><codigo>${esc(c.items.find((i) => i.codigo_iva === g.codigo_iva)?.codigo_sri ?? '')}</codigo><codigoPorcentaje>${esc(c.items.find((i) => i.codigo_iva === g.codigo_iva)?.codigo_porcentaje_sri ?? '')}</codigoPorcentaje>` +
    `<baseImponible>${g.base.toFixed(2)}</baseImponible><valor>${g.valor_iva.toFixed(2)}</valor></totalImpuesto>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<${c.tipo === 'factura' ? 'factura' : 'notaCredito'} id="comprobante" version="1.0.0">
  <!-- ${MARCA_PRUEBAS} -->
  <infoTributaria>
    <ambiente>${c.emisor.ambiente}</ambiente><tipoEmision>1</tipoEmision>
    <razonSocial>${esc(c.emisor.razon_social)}</razonSocial>
    <nombreComercial>${esc(c.emisor.nombre_comercial)}</nombreComercial>
    <ruc>${esc(c.emisor.ruc)}</ruc>
    <claveAcceso>${esc(claveAcceso)}</claveAcceso>
    <estab>${esc(c.emisor.establecimiento)}</estab><ptoEmi>${esc(c.emisor.punto_emision)}</ptoEmi>
    <dirMatriz>${esc(c.emisor.direccion_matriz)}</dirMatriz>
  </infoTributaria>
  <infoComprobante>
    <obligadoContabilidad>${c.emisor.obligado_contabilidad ? 'SI' : 'NO'}</obligadoContabilidad>
    <tipoIdentificacionComprador>${esc(c.receptor.tipo_identificacion_sri ?? '')}</tipoIdentificacionComprador>
    <fechaEmision>${esc(c.fecha_emision_sri)}</fechaEmision>
    <razonSocialComprador>${esc(c.receptor.razon_social)}</razonSocialComprador>
    <identificacionComprador>${esc(c.receptor.identificacion)}</identificacionComprador>
    <totalDescuento>${c.descuento_total.toFixed(2)}</totalDescuento>
    ${grupos}
    <importeTotal>${c.total.toFixed(2)}</importeTotal>
  </infoComprobante>
  <detalles>${items}
  </detalles>
  <infoAdicional>
    ${Object.entries(c.informacion_adicional).map(([k, v]) =>
      `<campoAdicional nombre="${esc(k)}">${esc(v)}</campoAdicional>`).join('\n    ')}
    <campoAdicional nombre="advertencia">${MARCA_PRUEBAS}</campoAdicional>
  </infoAdicional>
</${c.tipo === 'factura' ? 'factura' : 'notaCredito'}>`;
}

/** RIDE propio y simple. La marca de agua va EN CADA PÁGINA (§ del simulador). */
export function rideDesdeCanonico(c: DocumentoCanonico, claveAcceso: string): string {
  const filas = c.items.map((i) => `<tr>
    <td>${esc(i.descripcion)}</td><td class="n">${i.cantidad}</td>
    <td class="n">${i.precio_unitario.toFixed(2)}</td><td class="n">${i.base.toFixed(2)}</td>
    <td class="n">${i.tarifa_pct}%</td><td class="n">${i.valor_iva.toFixed(2)}</td></tr>`).join('');

  return `<!doctype html><meta charset="utf-8">
<style>
  @page { size: A4; margin: 14mm; }
  body { font: 12px/1.45 -apple-system, system-ui, sans-serif; color:#221E19; }
  .marca { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
           transform: rotate(-28deg); font-size: 34px; letter-spacing:.06em;
           color: rgba(200,30,60,.14); font-weight:700; pointer-events:none; z-index:0; }
  table { width:100%; border-collapse:collapse; margin-top:10px; }
  th,td { border-bottom:1px solid #e6e2dc; padding:6px 4px; text-align:left; }
  .n { text-align:right; font-variant-numeric: tabular-nums; }
  .clave { font-family: ui-monospace, Menlo, monospace; font-size:10px; word-break:break-all; }
  h1 { font-size:15px; margin:0 0 2px; } .tot { font-weight:700; }
</style>
<div class="marca">${MARCA_PRUEBAS}</div>
<h1>${esc(c.emisor.razon_social)}</h1>
<div>RUC ${esc(c.emisor.ruc)} · ${esc(c.emisor.direccion_matriz)}</div>
<div>${esc(c.tipo === 'factura' ? 'FACTURA' : 'NOTA DE CRÉDITO')} ${esc(c.emisor.establecimiento)}-${esc(c.emisor.punto_emision)}</div>
<div class="clave">Clave de acceso: ${esc(claveAcceso)}</div>
<div style="margin-top:8px">Cliente: ${esc(c.receptor.razon_social)} · ${esc(c.receptor.identificacion)}</div>
<table><tr><th>Descripción</th><th class="n">Cant</th><th class="n">P. unit</th>
<th class="n">Base</th><th class="n">Tarifa</th><th class="n">IVA</th></tr>${filas}</table>
<p class="n tot">TOTAL ${c.total.toFixed(2)}</p>
<p style="color:#7a736a">${MARCA_PRUEBAS}</p>`;
}

export function crearSimulador(secretoWebhook: string): PuertoFacturacion {
  return {
    nombre: 'simulador',
    capacidades(): Capacidades {
      return {
        aceptaSecuencialPropio: true,
        aceptaClavePropia: true,
        devuelveRide: true,
        devuelveXml: true,
        webhooks: true,
        contingencia: false,
      };
    },
    // deno-lint-ignore require-await
    async emitir(canonico: unknown): Promise<ResultadoEmision> {
      const c = canonico as DocumentoCanonico & { clave_acceso?: string };
      const clave = c.clave_acceso ?? null;
      if (!clave) {
        return { referencia: null, estado: 'no_autorizada', clave_acceso: null,
                 motivo: 'sin_clave_acceso: la casa pone el número y no llegó' };
      }
      return { referencia: `sim_${clave.slice(-12)}`, estado: 'emitiendo', clave_acceso: clave };
    },
    // deno-lint-ignore require-await
    async consultarEstado(referencia: string): Promise<ResultadoConsulta> {
      /* El simulador autoriza siempre: su trabajo es ejercitar el circuito, no
         inventar rechazos. El rechazo se ensaya a propósito desde el arnés. */
      return { estado: 'autorizada', autorizado_en: new Date().toISOString(),
               motivo: `simulado:${referencia}` };
    },
    async recibirWebhook(req: Request): Promise<ResultadoWebhook> {
      const crudo = await req.text();
      const firma = req.headers.get('x-facturacion-firma') ?? '';
      const esperada = await hmacHex(secretoWebhook, crudo);
      /* 🔴 Se compara en tiempo CONSTANTE. Un `===` sobre un HMAC filtra por
         cuánto tarda en fallar. */
      if (!igualEnTiempoConstante(firma, esperada)) {
        return { verificado: false, referencia: null, estado: null, motivo: 'firma_invalida' };
      }
      const body = JSON.parse(crudo || '{}');
      return {
        verificado: true,
        referencia: body.referencia ?? null,
        estado: body.estado ?? null,
        xml: body.xml, ride: body.ride, motivo: body.motivo,
      };
    },
  };
}

export async function hmacHex(secreto: string, cuerpo: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(cuerpo));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function igualEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
