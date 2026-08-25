// ═══════════════════════════════════════════════════════════════════════════
// S103-D · `pagos-deuna-barrido` — LA CONSULTA ACTIVA DEL RIEL DEUNA
//
// 🔴 POR QUÉ EXISTE, y por qué DeUna lo necesita más que Nuvei: el buzón sólo
//    actúa si el webhook llega. Si no llega —o llega y el análisis falla— el
//    intento queda en vuelo **con la plata ya movida del lado del cliente**, y
//    el único aviso sería que alguien reclame.
//
// 🔴🔴 Y ACÁ HAY ALGO QUE EL BARRIDO DE NUVEI NO TIENE QUE RESOLVER:
//    **`payment/info` NO devuelve `NOT_FOUND`.** Una transacción inexistente
//    contesta `HTTP 200 · PENDING · amount 0 · date ""` con la frase «please
//    check back in a moment» (medido, S103-D §1 del parte).
//    ⇒ **Nadie nos va a avisar nunca que algo no existe**, así que un barrido
//    escrito «al modo Nuvei» consultaría un fantasma para siempre.
//    Por eso el veredicto NO se lee del `status`: lo da `clasificar()`, que
//    combina la FORMA de la respuesta con NUESTROS relojes (hold y 7 días).
//
// 🔴 LA REGLA MADRE, HEREDADA DE `pagos-conciliar`: **NUNCA declara rechazado.
//    Confirma o ESCALA.** Que el proveedor no muestre algo puede ser tres cosas
//    —no se cobró · su lectura tarda · preguntamos mal— y desde acá no se
//    distinguen. *Convertir una duda nuestra en un veredicto contra el cliente
//    es exactamente lo que las voces de este motor vinieron a cerrar.*
//
// ⚠️ DEPENDE de la migración N2/N3 (`pagos_pendientes_de_conciliar` con
//    proveedor + citas + ventana, y la columna `hallazgo`). **Sin ellas no
//    corre**, y lo dice en vez de fallar raro.
//
// ⚠️ NO DESPLEGADA. El job NO se agenda solo — *agendar un barrido es empezar a
//    tocar plata en un horario*, y eso pide firma.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { clasificar, type IntentoEnVuelo } from './_reloj.ts';
import { pedirConRitmo } from './_ritmo.ts';

const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const API_KEY = Deno.env.get('DEUNA_API_KEY') ?? '';
const API_SECRET = Deno.env.get('DEUNA_API_SECRET') ?? '';

/* El override es del simulador y **en producción se ignora, siempre** — misma
   ley que la puerta. *Una perilla de pruebas que también funciona en producción
   no es una perilla de pruebas.* */
const OVERRIDE = Deno.env.get('DEUNA_BASE_URL') ?? '';
const BASE = AMBIENTE === 'produccion'
  ? 'https://apis-merchant.pdn.deunalab.com'
  : (OVERRIDE || 'https://apis-merchant.qa.deunalab.com');
const RUTA = '/merchant/v1/payment';   // 🔴 sin `api/` — medido

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

interface Candidato {
  intento_id: string; proveedor: string; sujeto: string; sujeto_id: string;
  transaction_id: string | null; referencia_corta: string | null;
  creado_en: string; fuera_de_ventana: boolean;
}

Deno.serve(async (req) => {
  /* Puerta: sólo el cron de la casa. *Un barrido público sería un oráculo de
     qué compras están sin pagar.* */
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return new Response('no', { status: 401 });
  }
  if (!API_KEY || !API_SECRET) {
    return Response.json({ ok: false, error: 'servidor_sin_configurar' }, { status: 500 });
  }

  const { data: pendientes, error } = await db.rpc('pagos_pendientes_de_conciliar', {
    p_minutos_de_gracia: 10, p_proveedor: 'deuna',
  });
  if (error) {
    /* 🔴 Si la firma nueva no existe todavía, **se dice con su nombre** en vez
       de fallar por «argumento inesperado». *Un barrido que no corrió no puede
       parecerse a uno que no encontró nada.* */
    console.error('[deuna-barrido] no pude leer candidatos', error.message);
    return Response.json({ ok: false, error: 'sin_candidatos',
      detalle: error.message.includes('p_proveedor')
        ? 'falta la migracion N3 (pagos_pendientes_de_conciliar con proveedor)'
        : error.message }, { status: 500 });
  }

  const resumen: Record<string, number> = {};
  const escalados: string[] = [];
  /* 🔴 UN SOLO `estado` COMPARTIDO ⇒ el espaciado es real entre TODAS las
     llamadas del barrido, no por-llamada. Con uno por iteración, N candidatos
     serían N ráfagas y el 429 volvería. */
  const ritmo = { ultima: 0 };

  for (const c of (pendientes ?? []) as Candidato[]) {
    /* ── ① Fuera de ventana: NI SE PREGUNTA ──────────────────────────────
       Pasados 7 días el proveedor ya no responde de esta transacción.
       Consultarla gastaría una llamada del rate limit para recibir un
       fantasma indistinguible de uno real. *El reloj es nuestro: se usa.* */
    if (c.fuera_de_ventana) {
      await marcar(c, 'huerfano_deuna_vencido');
      resumen['huerfano_deuna_vencido'] = (resumen['huerfano_deuna_vencido'] ?? 0) + 1;
      escalados.push(`${c.intento_id} (fuera de ventana, ${c.sujeto} ${c.sujeto_id})`);
      continue;
    }

    /* ── ② Preguntar, con ritmo ─────────────────────────────────────────
       `idType "0"` con su id; `"1"` con nuestra referencia como respaldo.
       🔑 `idType` es **string** y el campo lleva el typo del proveedor. */
    const cuerpo = c.transaction_id
      ? { idType: '0', idTransacionReference: c.transaction_id }
      : { idType: '1', idTransacionReference: c.referencia_corta };

    const r = await pedirConRitmo(`${BASE}${RUTA}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
                 'x-api-key': API_KEY, 'x-api-secret': API_SECRET },
      body: JSON.stringify(cuerpo),
    }, ritmo);

    /* ── ③ 🔴 NO PUDIMOS PREGUNTAR ≠ NO SE COBRÓ ─────────────────────────
       `rate_limit`, `red` y `http` significan «no sé», y **«no sé» no es
       «no»**. El intento NO se toca: queda para la próxima pasada.
       *Un 429 leído como fallo marcaría huérfano un cobro perfecto porque
       consultamos rápido — y esto corre solo, de noche, sin nadie mirando.* */
    if (!r.ok) {
      const k = `no_se_pudo_preguntar_${r.motivo}`;
      resumen[k] = (resumen[k] ?? 0) + 1;
      console.warn(`[deuna-barrido] ${c.intento_id}: ${r.motivo} — ${r.detalle}`);
      continue;
    }

    /* ── ④ El veredicto lo da el reloj, NO el `status` ───────────────────
       Porque `PENDING` significa dos cosas distintas y sólo la forma
       completa + nuestros relojes las separan. */
    const intento: IntentoEnVuelo = {
      creado_en: c.creado_en,
      hold_expira_en: await holdDe(c),
    };
    const v = clasificar(intento, r.cuerpo);

    resumen[v.clase] = (resumen[v.clase] ?? 0) + 1;

    if (v.hallazgo) await marcar(c, v.hallazgo, r.cuerpo);

    /* 🔴 Se escala lo que necesita UNA PERSONA, y se nombra. *Un barrido que
       cuenta cuántos escaló pero no cuáles obliga a volver a buscarlos, y en
       pagos «después lo miro» es plata parada.* */
    if (v.clase === 'fantasma' || v.clase === 'vencido' || v.clase === 'reverso_fallido') {
      escalados.push(`${c.intento_id} (${v.clase}: ${v.razon})`);
    }

    /* ⑤ 🔴 CONFIRMADO — **ACÁ FALTA EL CABLE, Y ESTA LÍNEA LO DECÍA AL REVÉS.**

       Decía *«lo aplica el actuador»* y **es falso**: el actuador arranca con
       `SELECT * FROM webhook_events WHERE id = p_evento_id`, o sea que
       **necesita una fila de evento**. Y el caso que este barrido existe para
       resolver es justamente **el webhook que nunca llegó** ⇒ no hay fila, no
       hay a quién pasarle nada, y el sujeto **no se mueve**.

       ⇒ **El barrido detecta el pago y nadie lo aplica.** Sin error, sin log de
       fallo: con un `console.log` que afirmaba lo contrario.

       **El contraste que lo prueba:** el barrido de Nuvei llama a
       `resolver_consulta_activa(uuid, jsonb, text)` —que existe y aplica—.
       **DeUna no tiene equivalente**: las únicas funciones `%deuna%` en la base
       son `_deuna_base36` y `deuna_nueva_referencia`, las dos del generador de
       referencia.

       *Es «puerta sin motor» escrito como comentario: la promesa compilaba.*

       **Cura: es de MOTOR y por lo tanto de A** — una hermana de
       `resolver_consulta_activa` para DeUna, o ensanchar la existente. **No la
       escribo desde acá**: aplicar un pago desde el barrido, saltándose al
       actuador, sería el segundo lugar del sistema que confirma plata — *dos
       piezas que confirman pagos es cómo se confirma dos veces.*
       Mientras tanto, el hallazgo queda marcado (`confirmado_tardio`) y
       **escalado**, para que una persona lo vea. */
    if (v.clase === 'confirmado') {
      console.error(`[deuna-barrido] 🔴 ${c.intento_id} CONFIRMADO por el proveedor `
        + `y NO HAY QUIEN LO APLIQUE (falta el equivalente de resolver_consulta_activa). `
        + `Sujeto ${c.sujeto} ${c.sujeto_id} sigue sin mover.`);
      escalados.push(`${c.intento_id} (confirmado sin aplicador — cable faltante)`);
    }
  }

  if (escalados.length) console.error('[deuna-barrido] ESCALADOS:', escalados.join(', '));

  return Response.json({
    ok: true, revisados: (pendientes ?? []).length, resumen, escalados,
  });
});

/** El hold del sujeto: es el reloj que dice si la sesión de pago sigue viva. */
async function holdDe(c: Candidato): Promise<string | null> {
  if (c.sujeto === 'cita') {
    const { data } = await db.from('evento_cita_servicio')
      .select('expira_en').eq('id', c.sujeto_id).maybeSingle();
    return (data as { expira_en?: string } | null)?.expira_en ?? null;
  }
  /* La compra no tiene un `expira_en` propio: su hold vive en la reserva de
     stock. **Se devuelve `null` en vez de inventar un reloj** — sin hold, el
     clasificador simplemente no lo usa, que es lo correcto.
     ⚠️ Queda declarado: el día que la compra tenga hold legible, entra acá. */
  return null;
}

/** Estampa el hallazgo en el intento. Vocabulario cerrado por CHECK (N4). */
async function marcar(c: Candidato, hallazgo: string, crudo?: unknown) {
  const { error } = await db.from('pagos_intentos').update({
    hallazgo, hallazgo_en: new Date().toISOString(),
    ...(crudo ? { payload_crudo: crudo } : {}),
  }).eq('id', c.intento_id);
  /* 🔴 Un error al marcar NO puede desaparecer: sin la marca, el próximo
     barrido vuelve a escalar lo mismo y nadie sabe que ya se miró. */
  if (error) console.error(`[deuna-barrido] no pude marcar ${c.intento_id}`, error.message);
}
