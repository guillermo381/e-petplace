// ═══════════════════════════════════════════════════════════════════════════
// fiscal-validar-clave · le pregunta al SRI por una clave de acceso
//
// 🔴 CONTRA QUÉ SE CONSTRUYÓ, y no se volvió a medir: la sonda de la tanda 1
//    ya alcanzó los dos WSDL **desde una edge** (200, con el positivo de Nuvei
//    en la misma corrida, que es lo que prueba que el 200 era del SRI y no de
//    un proxy amable). Eso rige; volver a medirlo no agregaría nada.
//
// 🔴 EL PARSER ES TOLERANTE Y GUARDA EL CRUDO (`L-535`). Siete facturas reales
//    de producción escriben distinto lo mismo —`PRODUCCIÓN`/`PRODUCCION`,
//    dos formatos de `fechaAutorizacion`— y las siete son válidas. *Comparar
//    contra un literal nuestro no falla: RECHAZA, y rechazar un comprobante
//    ajeno válido se lee como «el proveedor mandó algo mal».*
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

/** Host del web service por ambiente. 1 = pruebas · 2 = producción. */
const HOST = { 1: 'celcer.sri.gob.ec', 2: 'cel.sri.gob.ec' } as const;

const sobre = (clave: string) =>
  `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" `
  + `xmlns:ec="http://ec.gob.sri.ws.autorizacion"><soapenv:Header/><soapenv:Body>`
  + `<ec:autorizacionComprobante><claveAccesoComprobante>${clave}`
  + `</claveAccesoComprobante></ec:autorizacionComprobante></soapenv:Body></soapenv:Envelope>`;

/** Saca un tag sin importar el prefijo de namespace que le haya puesto el otro. */
const tag = (xml: string, nombre: string): string | null =>
  xml.match(new RegExp(`<(?:\\w+:)?${nombre}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${nombre}>`))?.[1]?.trim() ?? null;

/** Normaliza para COMPARAR — nunca para guardar. Sin tildes, sin caja, sin bordes. */
const norm = (s: string | null) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();

Deno.serve(async (req) => {
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return json({ ok: false, codigo: 'no_autorizado' }, 401);
  }

  let clave: string | null = null;
  let documentoId: string | null = null;
  try {
    const b = await req.json();
    clave = b?.clave ?? null;
    documentoId = b?.documento_id ?? null;
  } catch { /* cuerpo vacío */ }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (!clave && documentoId) {
    const { data } = await db.from('documentos_fiscales')
      .select('clave_acceso').eq('id', documentoId).maybeSingle();
    clave = data?.clave_acceso ?? null;
  }
  if (!clave || !/^\d{49}$/.test(clave)) {
    return json({ ok: false, codigo: 'clave_invalida', clave }, 400);
  }

  const { data: emisor } = await db.from('fiscal_emisor').select('ambiente').single();
  const host = HOST[(emisor?.ambiente ?? 1) as 1 | 2];
  const url = `https://${host}/comprobantes-electronicos-ws/AutorizacionComprobantesOffline`;

  let http = 0; let crudo = '';
  try {
    /* Techo explícito: un fetch sin timeout cuelga su promesa y el silencio se
       lee como progreso. El SRI se cae seguido; caerse rápido es parte de esto. */
    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), 20_000);
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml;charset=UTF-8', SOAPAction: '' },
      body: sobre(clave),
      signal: ctrl.signal,
    });
    clearTimeout(reloj);
    http = r.status;
    crudo = await r.text();
  } catch (e) {
    return json({ ok: false, codigo: 'sri_inalcanzable', detalle: String(e).slice(0, 180), url });
  }

  if (http !== 200) {
    return json({ ok: false, codigo: `sri_http_${http}`, crudo: crudo.slice(0, 400), url });
  }

  const estadoCrudo = tag(crudo, 'estado');
  const numero = tag(crudo, 'numeroAutorizacion');
  const fecha = tag(crudo, 'fechaAutorizacion');
  const mensaje = tag(crudo, 'mensaje');
  const autorizado = norm(estadoCrudo) === 'AUTORIZADO';

  /* Lo que llega se guarda COMO LLEGA; lo normalizado es sólo para decidir. */
  if (documentoId && autorizado) {
    await db.from('documentos_fiscales').update({
      estado: 'autorizada',
      sri_numero_autorizacion: numero,
      sri_fecha_autorizacion: fecha,   // el formato del SRI, sin re-escribir
      autorizado_en: new Date().toISOString(),
    }).eq('id', documentoId);
  }

  return json({
    ok: true,
    autorizado,
    estado_crudo: estadoCrudo,          // ⚠️ el crudo es la evidencia
    estado_normalizado: norm(estadoCrudo),
    numero_autorizacion: numero,
    fecha_autorizacion: fecha,
    mensaje,
    ambiente: emisor?.ambiente ?? 1,
    url,
  });
});
