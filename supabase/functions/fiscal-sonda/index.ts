// ═══════════════════════════════════════════════════════════════════════════
// fiscal-sonda · LO QUE SE PUEDE MEDIR DEL PROVEEDOR SIN EMITIR NADA
//
// 🔴 Existe porque la API key vive en un secreto y un secreto **sólo se puede
//    usar desde una edge**. Sin esta sonda, la única forma de saber si la
//    credencial sirve sería emitir un comprobante — o sea, descubrirlo con un
//    documento fiscal real de por medio.
//
// NO EMITE. NO ESCRIBE. Tres lecturas: quién dice ser el contribuyente de la
// fila, qué contesta el proveedor sobre su certificado, y cuánta cuota queda.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { usoDelApi, estadoCertificado } from '../_shared/facturacion/factuplan.ts';
import { resolverProveedorConProcedencia } from '../_shared/facturacion/mod.ts';

Deno.serve(async (req) => {
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return Response.json({ ok: false, codigo: 'no_autorizado' }, { status: 401 });
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: cfg } = await db.from('app_config').select('valor')
    .eq('clave', 'fiscal_proveedor').maybeSingle();
  const prov = resolverProveedorConProcedencia(cfg?.valor);

  const { data: emisor } = await db.from('fiscal_emisor')
    .select('ruc, razon_social, ambiente, establecimiento, punto_emision, version_esquema').maybeSingle();

  const apiKey = Deno.env.get('FACTURACION_API_KEY') ?? '';
  /* 🔴 NO SE IMPRIME LA CLAVE — ni enmascarada. Lo único que se reporta es su
     PREFIJO de ambiente (`ak_test_` / `ak_live_`), que es la pregunta que
     importa —«¿estoy apuntando a pruebas o a producción?»— y no es el valor. */
  const prefijo = apiKey.startsWith('ak_live_') ? 'ak_live_'
                : apiKey.startsWith('ak_test_') ? 'ak_test_'
                : apiKey ? 'desconocido' : 'ausente';

  const salida: Record<string, unknown> = {
    ok: true,
    proveedor: prov.nombre,
    proveedor_fuente: prov.fuente,
    ...(prov.discrepancia ? { proveedor_discrepancia: prov.discrepancia } : {}),
    api_key: prefijo,
    webhook_secreto_cargado: Boolean(Deno.env.get('FACTURACION_WEBHOOK_SECRET')),
    emisor_de_la_fila: emisor ?? null,
  };

  if (!apiKey || !emisor?.ruc) {
    salida.medicion = 'no_concluyente';
    salida.motivo = !apiKey ? 'FACTURACION_API_KEY ausente' : 'fiscal_emisor sin RUC';
    return Response.json(salida);
  }

  const [cert, uso] = await Promise.all([
    estadoCertificado(apiKey, emisor.ruc),
    usoDelApi(apiKey, emisor.ruc),
  ]);
  salida.certificado = cert;
  salida.uso = uso;

  /* La pregunta que decide si mañana arranca: ¿el contribuyente de la fila es
     el del workspace? El proveedor lo contesta devolviendo el RUC de SU
     certificado. Si no coincide, se DICE — no se deduce del fallo. */
  const rucDelProveedor = (cert as { ruc?: string })?.ruc;
  if (rucDelProveedor) {
    salida.contribuyente_coincide = rucDelProveedor === emisor.ruc;
    if (rucDelProveedor !== emisor.ruc) {
      salida.contribuyente_detalle =
        `fiscal_emisor.ruc=${emisor.ruc} · el proveedor responde ${rucDelProveedor}`;
    }
  }
  return Response.json(salida);
});
