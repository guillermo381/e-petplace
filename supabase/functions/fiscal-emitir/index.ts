// ═══════════════════════════════════════════════════════════════════════════
// fiscal-emitir · BORRADOR → EMITIENDO → (webhook) AUTORIZADA
//
// 🔴 EL ORDEN NO ES ESTILO Y ES LO ÚNICO QUE HACE ESTO REINTENTABLE:
//    secuencial atómico → clave → **PERSISTIR `emitiendo` CON secuencial y clave**
//    → recién ahí el POST. *Un timeout después del POST encuentra el MISMO
//    documento con el MISMO número; si se persistiera después, cada reintento
//    consumiría un secuencial nuevo y dejaría huecos en la numeración que hay
//    que explicarle al SRI.*
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { resolverPuerto, resolverProveedorConProcedencia } from '../_shared/facturacion/mod.ts';
// La clave y el secuencial los resuelve `fiscal_reservar_numero` del lado de la
// base, en un solo hecho: acá ya no se construyen.
import { construirCanonico, CONSUMIDOR_FINAL, CANONICO_VERSION,
         type ItemCanonico, type ReceptorCanonico,
         type CatalogosSri } from '../_shared/facturacion/canonico.ts';

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

/**
 * TODO update del pipeline fiscal pasa por acá.
 *
 * 🔴 CERO FILAS ES UN ROJO, NO UN SILENCIO. En supabase-js un update que no
 *    encuentra su fila **no es error**: devuelve `{ error: null }` y sigue. Ése
 *    es el modo de falla que dejó dos secuenciales quemados y ninguna fila con
 *    ellos — la edge informó `emitiendo` y la fila se quedó en `borrador`.
 *    `.select('id')` obliga a PostgREST a devolver lo que tocó, y contar eso es
 *    la única forma de saber que tocó algo.
 */
/* Recibe la CONSULTA ya armada, no el cliente: el builder de PostgREST es
   *thenable* pero no es una Promise, y atar el helper al genérico del cliente
   arrastra los parámetros del schema. Así el helper es una línea y no miente. */
async function exigeUnaFila(
  q: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  paso: string,
): Promise<void> {
  const { data, error } = await q;
  if (error) throw new Error(`${paso}: ${error.message}`);
  if (!data || data.length !== 1) {
    throw new Error(`${paso}: afectó ${data?.length ?? 0} filas — la escritura no llegó`);
  }
}

Deno.serve(async (req) => {
  // Guard de perímetro, mismo molde que despachar-push: secreto compartido.
  // 🔴 NUNCA la anon key: es pública y viaja en el bundle.
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return json({ ok: false, codigo: 'no_autorizado' }, 401);
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  /* ── `D-1072` · LA LLAVE DEL RELOJ ────────────────────────────────────────
     🔴 EL RELOJ NACE APAGADO Y ESTE ES SU INTERRUPTOR. La llave vive en
        `app_config.fiscal_emision_automatica` y hoy dice `false`, porque su
        precondición es `D-1068`: medido el 12-sep, **101 de 101 pagos Nuvei no
        tienen medio de pago**, y sin forma de pago el SRI no recibe el
        comprobante. Encendido hoy, este barrido correría cada cinco minutos y
        rebotaría todo por el mismo motivo — *y el tablero se vería vivo.*

     🔴 SÓLO FRENA AL RELOJ, JAMÁS A LA MANO. Un `disparo: 'manual'` pasa
        siempre: la llave gobierna la automatización, no la capacidad de
        emitir. *Si apagara las dos, el día que el reloj falle no habría con
        qué sacar una factura.* */
  let disparo: 'reloj' | 'manual' = 'manual';
  try {
    const cuerpo = await req.clone().json();
    if (cuerpo?.disparo === 'reloj') disparo = 'reloj';
  } catch { /* cuerpo vacío o no-JSON: se trata como manual */ }

  if (disparo === 'reloj') {
    const { data: llave } = await db.from('app_config').select('valor')
      .eq('clave', 'fiscal_emision_automatica').maybeSingle();
    if (llave?.valor !== 'true') {
      /* No se anota la corrida: un reloj apagado que escribe una fila cada
         cinco minutos convierte su bitácora en ruido y esconde las corridas
         que sí significan algo. */
      return json({ ok: true, codigo: 'emision_automatica_apagada',
                    porque: 'app_config.fiscal_emision_automatica=false (D-1072; '
                          + 'su precondición es D-1068)' }, 200);
    }
  }

  /* 🔴 `fiscal_ambiente` SALIÓ DE ESTA LECTURA: se traía y NO SE USABA.
     El ambiente vive en `fiscal_emisor.ambiente` —de ahí lo toma
     `fiscal_reservar_numero` y de ahí sale el dígito de la clave—, así que la
     fila de `app_config` era una tercera fuente declarada y muerta. *Un valor
     que se lee y no se usa es peor que uno que no se lee: el próximo lo
     encuentra en la consulta y concluye que manda.* */
  const { data: cfg } = await db.from('app_config').select('clave,valor')
    .in('clave', ['fiscal_proveedor', 'fiscal_simular_cupo_agotado']);
  const prov = resolverProveedorConProcedencia(
    cfg?.find((c) => c.clave === 'fiscal_proveedor')?.valor);
  if (prov.discrepancia) console.warn(`fiscal_proveedor_discrepancia: ${prov.discrepancia}`);
  const simularCupo = cfg?.find((c) => c.clave === 'fiscal_simular_cupo_agotado')?.valor === 'true';
  /* 🔴 EL EMISOR SE LEE ANTES DEL PUERTO, y el orden es la regla: el
     contribuyente (`x-taxpayer-ruc`) sale de `fiscal_emisor.ruc`. *Resolver el
     puerto primero obligaría a sacarlo de un literal o de un secreto, que es
     justo lo que la firma del founder prohíbe: cambiar de contribuyente tiene
     que ser cambiar una fila.* */
  const { data: emisor } = await db.from('fiscal_emisor').select('*').single();
  if (!emisor) return json({ ok: false, codigo: 'sin_emisor_configurado' }, 409);

  let puerto;
  try {
    puerto = resolverPuerto(prov.nombre, {
      secretoWebhook: Deno.env.get('FACTURACION_WEBHOOK_SECRET') ?? '',
      apiKey: Deno.env.get('FACTURACION_API_KEY') ?? undefined,
      rucContribuyente: emisor.ruc,
      simularCupoAgotado: simularCupo,
    });
  } catch (e) {
    /* Fail-closed HABLADO: sin puerto no se emite, y se dice por qué en vez de
       caer a un default que emitiría contra otro. */
    return json({ ok: false, codigo: 'puerto_no_resuelto', proveedor: prov.nombre,
                  proveedor_fuente: prov.fuente, motivo: String(e).slice(0, 200) }, 409);
  }

  /* ── LOS CÓDIGOS DEL SRI SON DATO ─────────────────────────────────────────
     Se leen UNA vez por corrida y se pasan al canónico, que los CONGELA en el
     documento. *Un documento que para reimprimirse tuviera que volver a
     consultar el catálogo no se puede reimprimir dos años después: para
     entonces la tarifa cambió.* Fail-closed: sin catálogo no se emite. */
  const [{ data: tasasRows }, { data: identRows }] = await Promise.all([
    db.from('cat_tasas_impuesto')
      .select('codigo,codigo_sri,codigo_porcentaje_sri').eq('activo', true),
    db.from('cat_identificacion_sri')
      .select('codigo,codigo_sri').eq('country_code', 'EC').eq('activo', true),
  ]);
  if (!tasasRows?.length || !identRows?.length) {
    return json({ ok: false, codigo: 'catalogo_sri_vacio' }, 409);
  }
  const catalogos: CatalogosSri = {
    tasas: Object.fromEntries(tasasRows
      .filter((t) => t.codigo_sri && t.codigo_porcentaje_sri)
      .map((t) => [t.codigo, { codigo_sri: t.codigo_sri!, codigo_porcentaje_sri: t.codigo_porcentaje_sri! }])),
    identificacion: Object.fromEntries(identRows.map((i) => [i.codigo, i.codigo_sri])),
  };

  /* 🔴 SE NIEGA A EMITIR CON CÓDIGO VIEJO (`D-1073`). Tercera vez de `L-536`,
     y la que la convirtió en guard: emití con esta misma edge desatrasada, tomó
     un secuencial de NUESTRO contador para un documento que numera el proveedor,
     y **el `000000005` quedó quemado**. El gate lo sabía y la decisión de
     consultarlo vivía en la memoria de alguien.

     ⚠️ Lo que este guard ve y lo que NO: ve **migraciones aplicadas después de
     mi despliegue** —que es el caso que costó el secuencial—; **no ve** un
     cambio de código sin migración. Para eso sigue `verify:edge-desplegada`,
     que compara firmas de verdad desde afuera. *Son dos instrumentos y ninguno
     reemplaza al otro.* */
  const { data: alDia } = await db.rpc('edge_esta_al_dia', { p_slug: 'fiscal-emitir' });
  if (alDia && (alDia as { al_dia?: boolean }).al_dia === false) {
    return json({ ok: false, codigo: 'edge_desactualizada',
      detalle: 'Hay migraciones aplicadas despues de mi despliegue. No emito con codigo viejo.',
      diagnostico: alDia }, 409);
  }

  /* 🔴 LA CAPACIDAD SE PREGUNTA UNA VEZ Y SE DECLARA EN EL PARTE. Un proveedor
     que acepta nuestro secuencial y otro que numera él son dos motores, y la
     diferencia **no tiene síntoma**: los dos contestan «autorizada». */
  const numeraLaCasa = puerto.capacidades().aceptaSecuencialPropio;

  /* 🔴 LA COLA INCLUYE LOS `emitiendo`, y sin eso la retriabilidad que el
     encabezado promete no existía: un documento que quedó en vuelo —timeout,
     proveedor caído, cupo agotado— **no lo levantaba nadie**. Ahora vuelve, y
     REUSA su secuencial —`fiscal_reservar_numero` es idempotente—: tomarle uno
     nuevo dejaría un hueco que hay que explicarle al SRI. */
  const { data: pendientes } = await db.from('documentos_fiscales')
    .select('*').in('estado', ['borrador', 'emitiendo']).eq('sentido', 'emitido').limit(20);

  const hechos: unknown[] = [];
  for (const d of pendientes ?? []) {
    try {
      /* ⓪ 🔴 SI EL PROVEEDOR YA LO TOMÓ, SE CONSULTA — NO SE RE-EMITE.
         Defecto que introduje al meter los `emitiendo` en la cola: con una
         `referencia_proveedor` ya asignada, cada tick del reloj volvía a hacer
         POST del MISMO comprobante. *Un reintento de algo que sí llegó no es un
         reintento: es un envío duplicado, y del otro lado hay un comprobante
         real.* Medido en el e2e: cuatro corridas, cuatro POST. */
      if (d.referencia_proveedor && d.estado === 'emitiendo') {
        const c = await puerto.consultarEstado(d.referencia_proveedor);

        /* 🔴 LA CONSULTA TRAÍA LOS ARCHIVOS Y LOS TIRABA. `consultarEstado`
           devuelve `xml` y `ride` cuando el comprobante está autorizado —los
           baja en el mismo viaje— y este camino sólo miraba el estado. *El
           archivado vivía SÓLO en el webhook, así que con la firma sin validar
           el comprobante quedaba autorizado y sin respaldo, y nada lo decía.*
           Y no se puede posponer: el enlace del proveedor es una pre-firmada de
           S3 que vive CINCO MINUTOS. */
        const extra: Record<string, unknown> = {};
        if (c.xml) {
          const ruta = `${d.id}/comprobante.xml`;
          await db.storage.from('fiscal').upload(
            ruta, new Blob([c.xml], { type: 'application/xml' }), { upsert: true });
          extra.xml_url = ruta;
        }
        if (c.ride) {
          const ext = c.ride.mime === 'application/pdf' ? 'pdf' : 'html';
          const cuerpo = c.ride.base64
            ? Uint8Array.from(atob(c.ride.contenido), (ch) => ch.charCodeAt(0))
            : c.ride.contenido;
          const ruta = `${d.id}/ride.${ext}`;
          await db.storage.from('fiscal').upload(
            ruta, new Blob([cuerpo], { type: c.ride.mime }), { upsert: true });
          extra.pdf_url = ruta;
        }

        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: c.estado,
          motivo_rechazo: c.motivo ?? null,
          ...(c.autorizado_en ? { autorizado_en: c.autorizado_en } : {}),
          ...extra,
        }).eq('id', d.id).select('id'), 'consulta_estado');
        const { data: f } = await db.from('documentos_fiscales')
          .select('estado,secuencial').eq('id', d.id).maybeSingle();
        hechos.push({ id: d.id, camino: 'consultado', leido_de_la_fila: true,
                      estado: f?.estado, secuencial: f?.secuencial });
        continue;
      }

      // ① las líneas: son la base imponible. Sin ellas no se emite (fail-closed).
      const { data: lineas } = await db.from('pagos_desglose_lineas')
        .select('*').eq('pago_intento_id', d.pago_intento_id).order('linea');
      if (!lineas?.length) {
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: 'sin_lineas_fiscales: no hay base imponible que facturar',
        }).eq('id', d.id).select('id'), 'sin_lineas');
        hechos.push({ id: d.id, resultado: 'sin_lineas' });
        continue;
      }

      const items: ItemCanonico[] = lineas.map((l) => ({
        linea: l.linea, descripcion: l.descripcion, cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario), descuento: Number(l.descuento),
        codigo_iva: l.codigo_iva, tarifa_pct: Number(l.tarifa_pct),
        base: Number(l.base), valor_iva: Number(l.valor_iva),
      }));

      const receptor: ReceptorCanonico = d.identificacion
        ? { tipo_identificacion: d.tipo_identificacion, identificacion: d.identificacion,
            razon_social: d.razon_social ?? 'CONSUMIDOR FINAL',
            direccion: d.direccion, email: d.email }
        : CONSUMIDOR_FINAL;

      let nombreCuenta: string | null = null;
      if (d.cuenta_comercial_id) {
        const { data: cc } = await db.from('cuentas_comerciales')
          .select('razon_social').eq('id', d.cuenta_comercial_id).maybeSingle();
        nombreCuenta = cc?.razon_social ?? null;
      }

      /* 🔴 LA FORMA DE PAGO, FAIL-CLOSED. Medido: la base no distingue crédito de
         débito —`marca` es la marca de la tarjeta, `forma` es el flujo— así que
         para nuvei el medio hay que declararlo. Sin él el documento ESPERA en
         vez de salir con un `<formaPago>` inventado. */
      const { data: fp } = await db.rpc('fiscal_forma_pago_del_intento',
                                        { p_intento_id: d.pago_intento_id });
      if (!fp?.ok) {
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: `forma_pago: ${JSON.stringify(fp ?? { codigo: 'sin_respuesta' })}`.slice(0, 400),
        }).eq('id', d.id).select('id'), 'sin_forma_de_pago');
        hechos.push({ id: d.id, resultado: 'sin_forma_de_pago' });
        continue;
      }

      /* 🔴 `D-1068` ④ · SI LA FORMA DE PAGO SE ASUMIÓ, EL DOCUMENTO LO DICE.
         La marca se escribe ANTES de emitir, no después: si la emisión falla a
         mitad, la fila igual tiene que saber que su `<formaPago>` no salió de
         un dato. *Un documento asumido que no está marcado es indistinguible
         de uno medido, y esa distinción es justo la que el founder pidió poder
         listar.* */
      if (fp.asumida === true) {
        await exigeUnaFila(db.from('documentos_fiscales')
          .update({ forma_pago_asumida: true }).eq('id', d.id).select('id'),
          'marcar_forma_asumida');
      }

      const emisorCanonico = {
        ...emisor,
        /* Cae a la matriz si nadie declaró la del local — y se ve en el dato,
           no se disfraza: el XML lleva la dirección que la casa realmente tiene. */
        direccion_establecimiento: emisor.direccion_establecimiento ?? emisor.direccion_matriz,
      };

      /* 🔴 FAIL-CLOSED del 2.1.0: decirse agente de retención sin declarar la
         resolución produciría el campo vacío o inventado. El documento espera. */
      if (emisor.agente_retencion && !emisor.agente_retencion_resolucion) {
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: 'pendiente_manual',
          motivo_rechazo: 'agente_retencion_sin_resolucion: el emisor se declara agente '
                        + 'de retención y no tiene número de resolución cargado.',
        }).eq('id', d.id).select('id'), 'agente_retencion');
        hechos.push({ id: d.id, resultado: 'agente_retencion_sin_resolucion' });
        continue;
      }

      const canonico = construirCanonico({
        tipo: d.tipo, fecha_emision: d.fecha_emision, emisor: emisorCanonico,
        receptor, items, catalogos, forma_pago_sri: fp.codigo_sri,
        razonSocialCuentaComercial: nombreCuenta,
        referencias: { pago_intento_id: d.pago_intento_id, origen_tipo: lineas[0]?.origen_tipo ?? null,
                       origen_id: lineas[0]?.origen_id ?? null },
      });

      // ④ EL NÚMERO Y SU FILA, EN UN SOLO HECHO
      //
      // 🔴 Era: RPC del secuencial → UPDATE aparte. Entre los dos había una
      //    ventana, y el e2e de E la encontró: el UPDATE rebotó, nadie leyó el
      //    error, y **el número quedó consumido sin vivir en ninguna fila**.
      //    Ahora `fiscal_reservar_numero` toma el número, deriva la clave y
      //    escribe la fila en la MISMA transacción: o la fila queda con su
      //    número, o el número no se consume. Y es idempotente, así que un
      //    reintento reusa el suyo en vez de abrir un hueco.
      const { data: reserva, error: eRes } = await db.rpc('fiscal_reservar_numero', {
        p_documento_id: d.id,
        p_canonico: canonico,
        p_canonico_version: CANONICO_VERSION,
        p_proveedor: puerto.nombre,
        p_subtotal_0: canonico.subtotales_por_tarifa.find((g) => g.tarifa_pct === 0)?.base ?? 0,
        p_subtotal_15: canonico.subtotales_por_tarifa.find((g) => g.tarifa_pct !== 0)?.base ?? 0,
        p_iva: canonico.subtotales_por_tarifa.reduce((a, g) => a + g.valor_iva, 0),
        p_total: canonico.total,
        /* 🔴 QUIÉN NUMERA SE PREGUNTA, NO SE SUPONE (`Capacidades`). Sin esto
           la base tomaba un secuencial NUESTRO y derivaba NUESTRA clave, y
           acto seguido el proveedor devolvía los suyos: un secuencial quemado
           por emisión —`D-1060` sistematizado— y una clave en la fila que no
           es la del comprobante real. *Y no habría fallado: los dos números
           son plausibles y nadie los compara hasta la conciliación del mes.* */
        p_numeracion_origen: numeraLaCasa ? 'casa' : 'proveedor',
      });
      if (eRes) throw new Error(`reservar_numero: ${eRes.message}`);
      if (!reserva?.ok) throw new Error(`reservar_numero: ${JSON.stringify(reserva)}`);
      const clave: string | null = reserva.clave_acceso ?? null;

      // ⑤ recién ahora, afuera
      const r = await puerto.emitir(clave ? { ...canonico, clave_acceso: clave } : canonico);

      /* ⑤bis SI NUMERÓ EL PROVEEDOR, SE ANOTA LO QUE DEVOLVIÓ — y se coteja.
         `fiscal_anotar_numero_ajeno` verifica los 41 dígitos que siguen siendo
         nuestros y rebota por segmento: `clave_con_ruc_ajeno` no es lo mismo
         que `clave_y_secuencial_no_coinciden`. */
      let anotacion: unknown = null;
      if (!numeraLaCasa && r.clave_acceso && r.secuencial_proveedor) {
        const { data: an, error: eAn } = await db.rpc('fiscal_anotar_numero_ajeno', {
          p_documento_id: d.id,
          p_clave: r.clave_acceso,
          p_secuencial: r.secuencial_proveedor,
        });
        if (eAn) throw new Error(`anotar_numero_ajeno: ${eAn.message}`);
        anotacion = an;
        /* 🔴 Si el número ajeno NO cuadra con la fila, el documento NO avanza.
           *Guardar un estado «autorizada» sobre una clave que no es la nuestra
           sería exactamente el silencio que el CHECK existe para impedir.* */
        if (!(an as { ok?: boolean })?.ok) {
          throw new Error(`numero_ajeno_rechazado: ${JSON.stringify(an)}`);
        }
      }

      /* Un rechazo REINTENTABLE no pierde la factura: queda en `emitiendo` con
         su secuencial y su clave, y el reconciliador la vuelve a tomar. */
      const reintentable = r.reintentable === true;
      await exigeUnaFila(db.from('documentos_fiscales').update({
        referencia_proveedor: r.referencia,
        estado: reintentable ? 'emitiendo' : r.estado,
        motivo_rechazo: r.motivo ?? null,
      }).eq('id', d.id).select('id'), 'resultado_emision');

      /* 🔴 EL PARTE SE ARMA LEYENDO LA FILA. Antes salía de variables locales:
         decía `estado: 'emitiendo'` porque ESO fue lo que se intentó, no lo que
         quedó. *Un instrumento que informa su intención en vez de su efecto no
         está midiendo* — y su `ok` fue exactamente lo que tapó el defecto. */
      const { data: fila } = await db.from('documentos_fiscales')
        .select('estado,secuencial,clave_acceso,motivo_rechazo').eq('id', d.id).maybeSingle();

      hechos.push({
        id: d.id,
        leido_de_la_fila: true,
        estado: fila?.estado ?? '(no se pudo releer)',
        secuencial: fila?.secuencial ?? null,
        tiene_clave: !!fila?.clave_acceso,
        numera: numeraLaCasa ? 'la casa' : 'el proveedor',
        ...(anotacion ? { anotacion } : {}),
        ...(reintentable ? { en_cola_por: r.codigo ?? 'reintentable' } : {}),
        ...(fila?.estado !== (reintentable ? 'emitiendo' : r.estado)
            ? { divergencia: `el puerto dijo ${r.estado} y la fila dice ${fila?.estado}` }
            : {}),
      });
    } catch (e) {
      /* Un rechazo NO reutiliza el secuencial: la corrección es un documento
         NUEVO que apunta al rechazado (tanda 2). Acá sólo se nombra el fallo. */
      /* Ni el registro del fallo se da por hecho: si TAMBIÉN afecta 0 filas,
         se grita en el log — que es el único lugar que queda. */
      try {
        await exigeUnaFila(db.from('documentos_fiscales').update({
          estado: 'no_autorizada', motivo_rechazo: `emitir: ${String(e).slice(0, 180)}`,
        }).eq('id', d.id).select('id'), 'registrar_fallo');
      } catch (e2) {
        console.error(`fiscal_emitir_sin_rastro documento=${d.id} ${String(e2).slice(0, 160)}`);
      }
      hechos.push({ id: d.id, error: String(e).slice(0, 120) });
    }
  }
  /* El reporte DICE de dónde salió el proveedor. *Sin esto, «proveedor:
     simulador» no distingue «así está configurado» de «no había config y cayó
     al default» — dos situaciones con la misma cara y consecuencias opuestas.* */
  /* ── `D-1072` · LA CORRIDA SE ANOTA, Y CON SU DESGLOSE POR MOTIVO ────────
     🔴 Sin esto el reporte vive SÓLO en esta respuesta HTTP — y el cron la
        descarta. *Un reloj cuyo resultado nadie guarda no se puede auditar:
        la única forma de saber si emitió algo sería estar mirando en el
        momento exacto en que corrió.*

     Y el desglose no es adorno: `rebotados: 7` no distingue un problema de
     siete. Hoy los siete dirían `sin_forma_de_pago`, que es UN problema. */
  type Hecho = { estado?: unknown; resultado?: unknown; en_cola_por?: unknown; error?: unknown };
  const emitido = (h: Hecho) => h.estado === 'autorizada' || h.estado === 'emitiendo';
  const emitidos = (hechos as Hecho[]).filter(emitido).length;
  const porMotivo: Record<string, number> = {};
  for (const h of hechos as Hecho[]) {
    if (emitido(h)) continue;
    const m = String(h.resultado ?? h.en_cola_por ?? h.error ?? h.estado ?? 'sin_motivo');
    porMotivo[m] = (porMotivo[m] ?? 0) + 1;
  }
  /* Lo que queda esperando DESPUÉS de la corrida: es el número que convierte
     un «procesé cero» en un grito o en una tarde tranquila. */
  const { count: quedanPendientes } = await db.from('documentos_fiscales')
    .select('id', { count: 'exact', head: true })
    .in('estado', ['borrador', 'emitiendo']).eq('sentido', 'emitido');

  /* Que anotar falle NO puede voltear una emisión que ya ocurrió: se dice en
     el log y la respuesta sigue. *La bitácora sirve al que audita; el
     comprobante, a la familia.* */
  const { error: eBit } = await db.rpc('fiscal_anotar_corrida_emision', {
    p_disparo: disparo, p_procesados: hechos.length,
    p_emitidos: emitidos, p_rebotados: hechos.length - emitidos,
    p_por_motivo: porMotivo, p_pendientes: quedanPendientes ?? 0,
  });
  if (eBit) console.error(`fiscal_bitacora_no_anotada: ${eBit.message}`);

  return json({ ok: true, proveedor: puerto.nombre, proveedor_fuente: prov.fuente,
                numera: numeraLaCasa ? 'la casa' : 'el proveedor',
                disparo,
                ...(prov.discrepancia ? { proveedor_discrepancia: prov.discrepancia } : {}),
                procesados: hechos.length, emitidos,
                rebotados: hechos.length - emitidos, por_motivo: porMotivo,
                pendientes_al_cerrar: quedanPendientes ?? 0, hechos });
});
