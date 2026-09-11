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
  /* 🔴 EL PREFIJO ES LA ÚNICA FORMA DE SABER A QUÉ AMBIENTE APUNTAMOS, y
     «desconocido» no alcanza: deja la pregunta sin contestar justo cuando la
     respuesta decide si un comprobante es de prueba o es real.
     Se reportan los SEGMENTOS DE NAMESPACE —lo que va antes de la parte de
     entropía— y sólo si hay al menos tres separados por `_`, de modo que el
     valor nunca viaja. Si el formato no se reconoce, se dice eso y su LARGO:
     *un largo no es la clave y sirve para saber si está truncada.* */
  const partes = apiKey.split('_');
  const bajo = apiKey.toLowerCase();
  /* Sólo el primer segmento, y sólo si es corto y alfabético: un namespace no
     es entropía. Si no hay separador, no se reporta NADA de la clave. */
  const ns = (partes.length >= 2 && /^[A-Za-z]{1,10}$/.test(partes[0])) ? partes[0] : null;
  const prefijo = !apiKey ? 'ausente'
    : `segmentos=${partes.length} · largo=${apiKey.length}${ns ? ` · ns="${ns}"` : ' · sin namespace legible'}`;

  /* 🔴 DOS BITS, Y SON LOS QUE DECIDEN. No se reporta la clave: se reporta si
     contiene «test» o «live». Es la única pregunta que importa acá —¿a qué
     ambiente apunto?— y la respuesta no reconstruye nada.
     Si ninguno aparece, NO se degrada a «probablemente pruebas»: se declara no
     concluyente y la emisión se frena. *Adivinar acá es la diferencia entre un
     comprobante de ensayo y uno que el SRI considera real.* */
  const diceTest = bajo.includes('test');
  const diceLive = bajo.includes('live') || bajo.includes('prod');
  const ambienteDeLaClave = diceTest && !diceLive ? 'pruebas'
                          : diceLive && !diceTest ? 'PRODUCCION'
                          : 'no_concluyente';

  const salida: Record<string, unknown> = {
    ok: true,
    proveedor: prov.nombre,
    proveedor_fuente: prov.fuente,
    ...(prov.discrepancia ? { proveedor_discrepancia: prov.discrepancia } : {}),
    api_key: prefijo,
    api_key_ambiente: ambienteDeLaClave,
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
