// ═══════════════════════════════════════════════════════════════════════════
// fiscal-ensayo · UNA factura de prueba contra el proveedor real
//
// 🔴 POR QUÉ EXISTE APARTE DEL PIPELINE, y es una decisión, no un atajo.
//    El camino completo (`fiscal-emitir`) arranca en un `pagos_intentos`, que
//    exige SIETE claves foráneas y cumple nueve CHECKs —un solo sujeto, un
//    pagador con su origen, un monto positivo…—. *Fabricar ese pago para
//    estrenar el proveedor sería inventar una compra que nadie hizo, dentro de
//    la tabla donde vive la plata de verdad.* Acá se arma el canónico a mano,
//    marcado como ensayo, y NO SE TOCA NINGUNA TABLA DE NEGOCIO.
//
// 🔴 LO QUE SÍ EJERCE DE VERDAD: los catálogos del SRI leídos de la base, la
//    traducción fail-closed del canónico, el adaptador entero y la respuesta
//    real del proveedor. Lo único simulado es de dónde salen las líneas.
//
// ⚠️ NO escribe en `documentos_fiscales`. El aviso del webhook va a anotar
//    `documento_no_encontrado` — y está bien: las mediciones que importan
//    (firma, nombre del evento, forma del `data`, formato del `t`, tiempos)
//    ocurren ANTES de ese paso.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { resolverPuerto, resolverProveedorConProcedencia } from '../_shared/facturacion/mod.ts';
import { construirCanonico, CONSUMIDOR_FINAL, type CatalogosSri,
         type ItemCanonico } from '../_shared/facturacion/canonico.ts';

Deno.serve(async (req) => {
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return Response.json({ ok: false, codigo: 'no_autorizado' }, { status: 401 });
  }
  const t0 = Date.now();
  /* Modo CONSULTA: `?referencia=<id>` no emite nada — sólo vuelve a preguntar y
     archiva. Existe porque la autorización es ASÍNCRONA: la emisión devuelve
     `PROCESSING` y el comprobante queda listo un minuto después, así que el
     archivo NO puede hacerse en el mismo viaje que la emisión. */
  const soloConsultar = new URL(req.url).searchParams.get('referencia');
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: cfg } = await db.from('app_config').select('valor')
    .eq('clave', 'fiscal_proveedor').maybeSingle();
  const prov = resolverProveedorConProcedencia(cfg?.valor);
  const { data: emisor } = await db.from('fiscal_emisor').select('*').single();
  if (!emisor) return Response.json({ ok: false, codigo: 'sin_emisor' }, { status: 409 });

  /* 🔴 FRENO DE AMBIENTE. Un ensayo que se pueda correr contra producción no es
     un ensayo: es una factura real esperando un descuido. */
  if (emisor.ambiente !== 1) {
    return Response.json({ ok: false, codigo: 'ambiente_no_es_pruebas',
                           ambiente: emisor.ambiente }, { status: 409 });
  }

  const puerto = resolverPuerto(prov.nombre, {
    secretoWebhook: Deno.env.get('FACTURACION_WEBHOOK_SECRET') ?? '',
    apiKey: Deno.env.get('FACTURACION_API_KEY') ?? undefined,
    rucContribuyente: emisor.ruc,
  });

  /* Los catálogos SALEN DE LA BASE, igual que en el camino real: si faltara un
     código, el ensayo tiene que rebotar por el mismo motivo que rebotaría una
     factura de verdad. */
  const [{ data: tasas }, { data: idents }] = await Promise.all([
    db.from('cat_tasas_impuesto').select('codigo,codigo_sri,codigo_porcentaje_sri').eq('activo', true),
    db.from('cat_identificacion_sri').select('codigo,codigo_sri').eq('country_code', 'EC').eq('activo', true),
  ]);
  if (!tasas?.length || !idents?.length) {
    return Response.json({ ok: false, codigo: 'catalogo_sri_vacio' }, { status: 409 });
  }
  const catalogos: CatalogosSri = {
    tasas: Object.fromEntries(tasas.filter((t) => t.codigo_sri && t.codigo_porcentaje_sri)
      .map((t) => [t.codigo, { codigo_sri: t.codigo_sri!, codigo_porcentaje_sri: t.codigo_porcentaje_sri! }])),
    identificacion: Object.fromEntries(idents.map((i) => [i.codigo, i.codigo_sri])),
  };

  /* La forma de pago sale del catálogo, no de un literal: el ensayo usa el
     mismo camino fail-closed que el pipeline. */
  const { data: fp } = await db.from('cat_forma_pago_sri')
    .select('codigo_sri').eq('country_code', 'EC').eq('medio', 'credito').eq('activo', true).maybeSingle();
  if (!fp?.codigo_sri) {
    return Response.json({ ok: false, codigo: 'sin_forma_de_pago_en_catalogo' }, { status: 409 });
  }

  /* CARRITO MIXTO 0 % y 15 %, que es uno de los puntos a medir: la mitad de un
     carrito real de esta casa es servicio gravado y la otra mitad no. */
  const items: ItemCanonico[] = [
    { linea: 1, descripcion: 'ENSAYO · Servicio de cuidado', cantidad: 1,
      precio_unitario: 10, descuento: 0, codigo_iva: 'EC_IVA_15', tarifa_pct: 15,
      base: 10, valor_iva: 1.5 },
    { linea: 2, descripcion: 'ENSAYO · Alimento (tarifa 0)', cantidad: 2,
      precio_unitario: 5, descuento: 0, codigo_iva: 'EC_IVA_0', tarifa_pct: 0,
      base: 10, valor_iva: 0 },
  ];

  let canonico;
  try {
    canonico = construirCanonico({
      tipo: 'factura',
      fecha_emision: new Date().toISOString().slice(0, 10),
      emisor: { ...emisor, direccion_establecimiento:
                 emisor.direccion_establecimiento ?? emisor.direccion_matriz },
      /* 🔴 El proveedor EXIGE `customer.email` incluso para consumidor final
         —«customer.email is required and must be a valid email address»,
         medido—, cosa que el SRI no pide. Para el ensayo va una dirección
         nuestra y evidente; en el camino real esto es una decisión de producto
         (`D-1065`): a qué correo se factura cuando la familia no dio ninguno. */
      receptor: { ...CONSUMIDOR_FINAL, email: 'ensayo-fiscal@epetplace.com' },
      items, catalogos, forma_pago_sri: fp.codigo_sri,
      referencias: { pago_intento_id: null, origen_tipo: 'ensayo', origen_id: null },
    });
  } catch (e) {
    return Response.json({ ok: false, codigo: 'canonico_rebotado',
                           motivo: String(e).slice(0, 300) }, { status: 409 });
  }

  const tEmision = Date.now();
  const r = soloConsultar
    ? { referencia: soloConsultar, estado: 'emitiendo' as const, clave_acceso: null,
        secuencial_proveedor: null, motivo: 'modo_consulta', codigo: undefined }
    : await puerto.emitir(canonico);
  const msEmision = Date.now() - tEmision;

  const salida: Record<string, unknown> = {
    ok: true,
    proveedor: puerto.nombre, proveedor_fuente: prov.fuente,
    numera: puerto.capacidades().aceptaSecuencialPropio ? 'la casa' : 'el proveedor',
    canonico_total: canonico.total,
    canonico_subtotales: canonico.subtotales_por_tarifa,
    emision: {
      referencia: r.referencia, estado: r.estado,
      clave_acceso: r.clave_acceso,
      secuencial_del_proveedor: r.secuencial_proveedor ?? null,
      motivo: r.motivo ?? null, codigo: r.codigo ?? null,
      ms: msEmision,
    },
  };

  /* Si salió, se CONSULTA y se archivan los bytes en el mismo acto. El enlace
     del proveedor es una pre-firmada de S3 que vive CINCO MINUTOS. */
  if (r.referencia) {
    const tCons = Date.now();
    const c = await puerto.consultarEstado(r.referencia);
    const archivo: Record<string, unknown> = {
      estado: c.estado, autorizado_en: c.autorizado_en ?? null,
      numero_autorizacion: (c as { numero_autorizacion?: string }).numero_autorizacion ?? null,
      motivo: c.motivo ?? null, ms: Date.now() - tCons,
      xml_bytes: c.xml ? c.xml.length : 0,
      ride_mime: c.ride?.mime ?? null,
      ride_bytes: c.ride ? c.ride.contenido.length : 0,
    };
    const base = `ensayo/${r.referencia}`;
    if (c.xml) {
      await db.storage.from('fiscal').upload(`${base}/comprobante.xml`,
        new Blob([c.xml], { type: 'application/xml' }), { upsert: true });
      archivo.xml_guardado = `${base}/comprobante.xml`;
      /* Los primeros 1200 caracteres del XML AUTORIZADO, para poder cotejar a
         ojo el RUC del emisor, la moneda, el esquema y el `rucProveedor` que
         ellos inyectan — sin tener que bajar el archivo. */
      /* 🔴 LOS CAMPOS SE EXTRAEN, NO SE LEEN A OJO. Son los que el founder pidió
         verificar contra el XML real en vez de darlos por hecho — y cada uno
         responde una pregunta distinta: si el RUC del emisor es el NUESTRO,
         si el del proveedor lo inyectan ellos, qué moneda ponen, qué forma de
         pago llegó y con qué esquema firmaron. */
      const t1 = (tag: string) => {
        const m = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(c.xml!);
        return m ? m[1] : null;
      };
      const tN = (tag: string) =>
        [...c.xml!.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g'))].map((m) => m[1]);
      archivo.xml_campos = {
        version_esquema: /<factura[^>]*version="([^"]+)"/.exec(c.xml)?.[1] ?? null,
        ruc_emisor: t1('ruc'),
        razon_social: t1('razonSocial'),
        ambiente: t1('ambiente'),
        estab: t1('estab'), ptoEmi: t1('ptoEmi'), secuencial: t1('secuencial'),
        dirEstablecimiento: t1('dirEstablecimiento'),
        tipoIdentificacionComprador: t1('tipoIdentificacionComprador'),
        moneda: t1('moneda'),
        propina: t1('propina'),
        importeTotal: t1('importeTotal'),
        totalSinImpuestos: t1('totalSinImpuestos'),
        formaPago: tN('formaPago'),
        codigoPorcentaje: tN('codigoPorcentaje'),
        tarifa: tN('tarifa'),
        /* El campo adicional del registro obligatorio: lo inyectan ellos. */
        rucProveedorFacturacion:
          /nombre="rucProveedorFacturacion"[^>]*>([^<]*)</.exec(c.xml)?.[1] ??
          t1('rucProveedorFacturacion'),
        campos_adicionales: [...c.xml.matchAll(/<campoAdicional nombre="([^"]+)"[^>]*>([^<]*)</g)]
          .map((m) => `${m[1]}=${m[2]}`),
        numero_autorizacion: t1('numeroAutorizacion'),
        fecha_autorizacion: t1('fechaAutorizacion'),
      };
    }
    if (c.ride) {
      const cuerpo = c.ride.base64
        ? Uint8Array.from(atob(c.ride.contenido), (ch) => ch.charCodeAt(0))
        : c.ride.contenido;
      const ext = c.ride.mime === 'application/pdf' ? 'pdf' : 'html';
      await db.storage.from('fiscal').upload(`${base}/ride.${ext}`,
        new Blob([cuerpo], { type: c.ride.mime }), { upsert: true });
      archivo.ride_guardado = `${base}/ride.${ext}`;
    }
    salida.consulta_y_archivo = archivo;
  }

  salida.ms_total = Date.now() - t0;
  return Response.json(salida);
});
