// ═══════════════════════════════════════════════════════════════════════════
// S101-B · FASE 6 · EL BARRIDO — la consulta activa contra el proveedor
//
// 🔴 QUÉ RESUELVE: los casos ② y ④ de la letra §6, que son el mismo problema —
//    **el webhook no llegó**. Sin esto, *un pago cobrado por Nuvei y nunca
//    confirmado queda invisible, con la plata ya debitada al cliente*, y el
//    único aviso de que algo salió mal es que un cliente reclame.
//
//    Y no es hipotético: el 20-ago el callback del primer débito real **se
//    perdió** porque nuestro buzón devolvía 500. Con esto, esa compra se habría
//    resuelto sola el mismo día.
//
// 🔴 LA REGLA MADRE: **NUNCA declara rechazado. Confirma o ESCALA.**
//    Que el proveedor no muestre una transacción aprobada puede ser tres cosas
//    distintas —no se cobró · su lectura tarda · preguntamos mal— y desde acá
//    no se distinguen. *Convertir una duda nuestra en un veredicto contra el
//    cliente es la trampa que las voces de esta sesión vinieron a cerrar.*
//
// 🔴 LA CADENCIA (E4, firmada): pasada ~12:00 y **última 16:15
//    America/Guayaquil** — 45 min antes del corte de Medianet (17:00).
//    **Porque el reverso es MISMO DÍA:** un huérfano detectado hoy se reversa;
//    detectado mañana es plata retenida y un trámite con el banco (§6ter).
//
// 🔴 EL JOB NO SE AGENDA SOLO. Se agenda con firma — *agendar un barrido es
//    empezar a tocar plata en un horario.*
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const BASE = AMBIENTE === 'produccion'
  ? 'https://ccapi.paymentez.com'
  : 'https://ccapi-stg.paymentez.com';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

/** `Base64(APP_CODE;ts;SHA256(app_key+ts))`, con ventana de 15 s del proveedor. */
function authToken(): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const uniq = createHash('sha256').update(APP_KEY + ts).digest('hex');
  return btoa(`${APP_CODE};${ts};${uniq}`);
}

Deno.serve(async (req) => {
  // Puerta: solo el cron de la casa. Un barrido público sería un oráculo de
  // qué compras están sin pagar.
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return new Response('no', { status: 401 });
  }

  /* ═══ 🔴 S108-B2 · EL LECTOR RESUELVE POR SUJETO ══════════════════════════
     Era `pagos_pendientes_de_conciliar` (`FROM compras`) ⇒ este barrido sólo
     veía compras. Medido: 12 huérfanos existían, veía 6, y los 6 invisibles
     eran citas. */
  const { data: pendientes, error } = await db.rpc('pagos_huerfanos_por_sujeto', {
    p_minutos_de_gracia: 10, p_proveedor: 'nuvei',
  });
  if (error) {
    console.error('[conciliar] no pude leer candidatos', error);
    return Response.json({ ok: false, error: 'sin_candidatos' }, { status: 500 });
  }

  const resumen: Record<string, number> = {};
  const escalados: string[] = [];

  for (const p of (pendientes ?? []) as Array<{
    intento_id: string; sujeto_tipo: string; sujeto_id: string;
    compra_id: string | null; transaction_id: string;
  }>) {
    /* ☠️ MURIÓ EL ESCALADO POR «SUJETO NO CUBIERTO».
       S108-B2 tuvo que escalar por nombre lo que el lector veía y el aplicador
       no podía aplicar —`resolver_consulta_activa` está tecleada por compra—,
       porque *encontrar un huérfano que después no se puede aplicar es peor que
       no encontrarlo: deja una fila que dice «acá hay algo» y ningún camino.*
       **S109-B le dio el camino:** `aplicar_consulta_activa_nuvei` recibe el
       INTENTO, resuelve el sujeto por catálogo y, cuando es una compra, delega
       en la función de siempre. ⇒ Una sola llamada para los siete. */
    let crudo: unknown = null;
    try {
      const r = await fetch(`${BASE}/v2/transaction/${encodeURIComponent(p.transaction_id)}`, {
        headers: { 'Auth-Token': authToken(), 'Content-Type': 'application/json' },
      });
      crudo = await r.json().catch(() => ({ http: r.status }));
    } catch (e) {
      /* 🔴 Si no pudimos PREGUNTAR, no sabemos nada — y «no sé» no es «no».
         Se registra como escalado con su causa; la compra no se toca. */
      crudo = { error_de_red: String(e).slice(0, 300) };
    }

    const { data: res, error: e2 } = await db.rpc('aplicar_consulta_activa_nuvei', {
      p_intento_id: p.intento_id,
      p_crudo: crudo,
      p_origen: 'barrido',
    });
    /* 🔴 UN ERROR NO ES UNA RESOLUCIÓN, Y NO PUEDE DESAPARECER.
       La v1 hacía `continue` y el barrido devolvía `revisados: 2, resumen: {}`
       — *«no hice nada y no digo por qué»*, que es la forma más cara de un
       verde. Medido en la primera corrida real. */
    if (e2) {
      console.error('[conciliar] aplicador falló', p.sujeto_tipo, p.sujeto_id, e2);
      resumen['error_al_resolver'] = (resumen['error_al_resolver'] ?? 0) + 1;
      escalados.push(`${p.sujeto_tipo} ${p.sujeto_id} (error: ${e2.message})`);
      continue;
    }

    const resol = (res as { resolucion?: string })?.resolucion ?? 'desconocida';
    resumen[resol] = (resumen[resol] ?? 0) + 1;
    // Todo lo que empieza con `huerfano` necesita una persona, no solo el que
    // el proveedor no reconoció.
    /* 🔴 Y ahora el escalado NOMBRA EL SUJETO. Decía `compra_id` para todo
       porque el lector sólo traía compras; con siete, un escalado que nombra
       el sujeto equivocado manda a mirar el objeto equivocado. */
    if (resol.startsWith('huerfano') || resol === 'sin_desglose'
        || resol === 'monto_no_coincide' || resol === 'sujeto_indeterminado') {
      escalados.push(`${p.sujeto_tipo} ${p.sujeto_id} (${resol})`);
    }
  }

  /* 🔴 Los escalados se NOMBRAN en la respuesta y en el log. *Un barrido que
     cuenta cuántos escaló pero no cuáles obliga a que alguien vuelva a buscar
     — y en pagos, «después lo miro» es plata parada.* */
  if (escalados.length) console.error('[conciliar] ESCALADOS:', escalados.join(', '));

  return Response.json({ ok: true, revisados: (pendientes ?? []).length, resumen, escalados });
});
