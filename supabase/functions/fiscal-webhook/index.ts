// ═══════════════════════════════════════════════════════════════════════════
// fiscal-webhook · el proveedor avisa AUTORIZADO / RECHAZADO
//
// 🔴 EL ORDEN ES LA PIEZA, y ahora el código lo cumple:
//    ① se lee el cuerpo CRUDO una sola vez
//    ② se PERSISTE antes de analizar — con dedup por `X-Factuplan-Delivery`
//    ③ se verifica la firma sobre ese mismo texto
//    ④ se contesta 2xx RÁPIDO y el trabajo pesado sigue después
//
//    *El encabezado de la versión anterior prometía el paso ② y no existía
//    ninguna tabla donde guardarlo: era letra muerta, y peor que no haberla
//    escrito, porque el que la leyera daba la persistencia por hecha.*
//
// 🔴 POR QUÉ 2XX ANTES DE PROCESAR, y no es preferencia: Factuplan reintenta 5
//    veces y **desactiva el webhook tras 10 fallos seguidos**. Traer el XML y
//    el RIDE son cuatro viajes de red; una tanda lenta se lee del otro lado
//    como una entrega fallida. El crudo ya está guardado, así que lo que se
//    procesa después es reprocesable — y `fiscal-reconciliar` barre lo que
//    quede colgado.
//
// 🔴 La firma se verifica CON EL PUERTO: cada proveedor firma a su manera.
//    Un webhook sin firma verificada no mueve un documento fiscal.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { resolverPuerto, resolverProveedorConProcedencia } from '../_shared/facturacion/mod.ts';

/** Techo de lo que se guarda del cuerpo. Un aviso es chico; esto es contra basura. */
const TOPE_CRUDO = 100_000;

declare const EdgeRuntime: { waitUntil?: (p: Promise<unknown>) => void } | undefined;

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  /* ① El cuerpo, UNA sola vez. Es sobre ESTE texto que se calcula el HMAC: si
     se reparsea y se vuelve a serializar, la firma deja de coincidir — y el
     síntoma sería «firma inválida», que manda a revisar el secreto en vez del
     orden de las operaciones. */
  const crudo = await req.text();
  const delivery = req.headers.get('X-Factuplan-Delivery');
  const evento = req.headers.get('X-Factuplan-Event');

  /* ② PERSISTIR ANTES DE ANALIZAR, y el dedup en la misma escritura: el UNIQUE
     de `delivery_id` hace inexpresable procesar dos veces el mismo aviso, en
     vez de depender de que alguien se acuerde de chequearlo. */
  const { data: fila, error: eIns } = await db.from('fiscal_webhook_eventos')
    .insert({ delivery_id: delivery, evento, cuerpo_crudo: crudo.slice(0, TOPE_CRUDO) })
    .select('id').maybeSingle();

  if (eIns) {
    if (eIns.code === '23505') {
      /* Un reintento del proveedor no es un hecho nuevo. 200 para que deje de
         reintentar: ya lo tenemos. */
      return Response.json({ ok: true, codigo: 'ya_recibido', delivery }, { status: 200 });
    }
    /* Si NI SIQUIERA se pudo guardar el crudo, se pide el reintento: es lo
       único que todavía puede salvar el aviso. */
    return Response.json({ ok: false, codigo: 'no_se_pudo_persistir',
                           motivo: eIns.message }, { status: 503 });
  }
  const eventoId = fila?.id ?? null;
  const anotar = (p: Record<string, unknown>) =>
    eventoId ? db.from('fiscal_webhook_eventos').update(p).eq('id', eventoId) : Promise.resolve();

  const { data: cfg } = await db.from('app_config').select('valor')
    .eq('clave', 'fiscal_proveedor').maybeSingle();
  const prov = resolverProveedorConProcedencia(cfg?.valor);
  if (prov.discrepancia) console.warn(`fiscal_proveedor_discrepancia: ${prov.discrepancia}`);

  const { data: emisor } = await db.from('fiscal_emisor').select('ruc').maybeSingle();
  let puerto;
  try {
    puerto = resolverPuerto(prov.nombre, {
      secretoWebhook: Deno.env.get('FACTURACION_WEBHOOK_SECRET') ?? '',
      apiKey: Deno.env.get('FACTURACION_API_KEY') ?? undefined,
      rucContribuyente: emisor?.ruc,
    });
  } catch (e) {
    await anotar({ firma_verificada: false, motivo: `puerto_no_resuelto: ${String(e).slice(0, 200)}` });
    return Response.json({ ok: false, codigo: 'puerto_no_resuelto',
                           proveedor: prov.nombre, motivo: String(e).slice(0, 200) }, { status: 409 });
  }

  /* ③ La firma, sobre el MISMO texto que se guardó. Se le reconstruye al puerto
     un Request equivalente porque el cuerpo original ya se consumió. */
  const espejo = new Request(req.url, { method: req.method, headers: req.headers, body: crudo });
  const r = await puerto.recibirWebhook(espejo);

  if (!r.verificado) {
    await anotar({ firma_verificada: false, motivo: r.motivo ?? 'firma_invalida',
                   procesado_en: new Date().toISOString(), resultado: 'rechazado' });
    /* 401 y no 400: es una credencial que no valida, no un cuerpo mal armado.
       Confundirlos manda a soporte a buscar el problema equivocado. */
    return Response.json({ ok: false, codigo: 'firma_invalida', motivo: r.motivo }, { status: 401 });
  }
  await anotar({ firma_verificada: true });

  if (!r.referencia) {
    await anotar({ motivo: r.motivo ?? 'sin_referencia',
                   procesado_en: new Date().toISOString(), resultado: 'sin_referencia' });
    return Response.json({ ok: false, codigo: 'sin_referencia' }, { status: 400 });
  }

  /* ④ DE ACÁ EN ADELANTE YA SE PUEDE CONTESTAR. Lo que sigue —traer los
     archivos, subirlos, mover el estado— es reprocesable desde el crudo. */
  const trabajo = (async () => {
    try {
      const { data: doc } = await db.from('documentos_fiscales')
        .select('id, estado').eq('referencia_proveedor', r.referencia!).maybeSingle();
      if (!doc) {
        await anotar({ procesado_en: new Date().toISOString(), resultado: 'documento_no_encontrado' });
        return;
      }

      const parche: Record<string, unknown> = { estado: r.estado, motivo_rechazo: r.motivo ?? null };
      if (r.estado === 'autorizada') parche.autorizado_en = new Date().toISOString();

      /* Los archivos van a Storage PRIVADO. El bucket `fiscal` no se sirve por
         URL pública: se lee por URL firmada, y sólo por la puerta de packages/api. */
      if (r.xml) {
        const ruta = `${doc.id}/comprobante.xml`;
        await db.storage.from('fiscal').upload(
          ruta, new Blob([r.xml], { type: 'application/xml' }), { upsert: true });
        parche.xml_url = ruta;
      }
      if (r.ride) {
        /* 🔴 LA EXTENSIÓN Y EL `content-type` SALEN DEL PROVEEDOR, no de un
           literal. El simulador entrega HTML y Factuplan un PDF: fijar `.html`
           acá subiría el PDF con el tipo equivocado y **sin fallar** — un
           archivo que pesa lo correcto y no abre, que nadie descubre hasta que
           una familia lo pide. */
        const ext = r.ride.mime === 'application/pdf' ? 'pdf' : 'html';
        const cuerpo = r.ride.base64
          ? Uint8Array.from(atob(r.ride.contenido), (ch) => ch.charCodeAt(0))
          : r.ride.contenido;
        const ruta = `${doc.id}/ride.${ext}`;
        await db.storage.from('fiscal').upload(
          ruta, new Blob([cuerpo], { type: r.ride.mime }), { upsert: true });
        parche.pdf_url = ruta;
      }

      /* 🔴 El estado se escribe DESPUÉS de los archivos, a propósito: el trigger
         de inmutabilidad deja mover urls sobre un `autorizada`, pero si el
         estado entrara primero y la subida fallara, quedaría una factura
         autorizada sin respaldo y sin forma de saberlo. */
      const { data: tocadas, error: eUpd } = await db.from('documentos_fiscales')
        .update(parche).eq('id', doc.id).select('id');
      /* Cero filas es un rojo, no un silencio: en supabase-js un update que no
         encuentra su fila devuelve `{ error: null }` y sigue. */
      const ok = !eUpd && tocadas?.length === 1;
      await anotar({
        documento_id: doc.id,
        procesado_en: new Date().toISOString(),
        resultado: ok ? `aplicado:${r.estado}` : `escritura_no_llego:${eUpd?.message ?? tocadas?.length ?? 0}`,
      });
    } catch (e) {
      await anotar({ procesado_en: new Date().toISOString(),
                     resultado: `error:${String(e).slice(0, 200)}` });
    }
  })();

  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(trabajo);
  } else {
    /* Sin `waitUntil` el proceso podría cortarse al responder: se espera. Es
       más lento y es correcto — *contestar rápido y perder el trabajo es peor
       que contestar lento.* */
    await trabajo;
  }

  return Response.json({ ok: true, codigo: 'recibido', evento_id: eventoId,
                         estado: r.estado, proveedor: puerto.nombre,
                         proveedor_fuente: prov.fuente }, { status: 200 });
});
