// ═══════════════════════════════════════════════════════════════════════════
// S101-B · `pagos-alta-tarjeta` — LA ÚNICA PUERTA POR LA QUE NACE UNA TARJETA
//
// La llama la PÁGINA del Add Card (host propio), desde el navegador de la
// familia, con el token que emitió el SDK de Nuvei.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 🔴 QUÉ NO CRUZA ESTE PUNTO, NUNCA: PAN, CVC, VENCIMIENTO.               │
// │    Lo que entra es el TOKEN del proveedor y metadatos de RECONOCIMIENTO │
// │    (bin, últimos 4, marca, titular). `ultimos4` que entrega el SDK son  │
// │    cuatro dígitos, no el número.                                        │
// │    El día que alguien agregue el PAN acá, e-PetPlace pasa a ser PCI y   │
// │    ningún typecheck lo va a decir.                                      │
// └─────────────────────────────────────────────────────────────────────────┘
//
// 🔴 POR QUÉ ES PÚBLICA Y AUN ASÍ NO ES UNA PUERTA ABIERTA:
//    la página corre en el navegador de la familia y **no puede llevar un
//    secreto** (cualquiera abre el inspector). Lo que la autoriza es el
//    HANDLE: una fila de `altas_tarjeta` emitida server-side, atada a un
//    usuario del auth, de un solo uso y con TTL corto.
//    ⇒ Sin handle vigente no se escribe nada. Un handle vencido, ya usado o
//      inventado **no crea ninguna tarjeta**, y deja su traza.
//    *Precedente: D-713 — un endpoint público que cambia estado sin validar
//    es una puerta para escribir desde afuera.*
//
// ⚠️ EL `stoken` DE `addCard` NO ESTÁ MEDIDO CONTRA LA DOC.
//    La fórmula conocida es la de TRANSACCIONES
//    (MD5(transaction_id + '_' + app_code + '_' + user_id + '_' + app_key)).
//    Acá se **registra lo que venga** con su procedencia y se valida **solo
//    si viene**, sin bloquear el alta por su ausencia. *Bloquear con una
//    fórmula no medida convertiría un desconocimiento nuestro en un rechazo
//    para la familia; y declararla válida sin medirla sería un verde falso.*
//    La medición es su propia tarea — sale de la doc, no de acá.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APP_CODE_SERVER = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY_SERVER = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';

/** Orígenes que pueden llamar. Un `*` acá dejaría que cualquier página del
 *  mundo dispare altas con handles robados de una URL. */
const ORIGENES = (Deno.env.get('PAGOS_ORIGENES_PERMITIDOS') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cors(origen: string | null): Record<string, string> {
  const permitido = origen && ORIGENES.includes(origen) ? origen : '';
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...(permitido
      ? {
          'Access-Control-Allow-Origin': permitido,
          'Access-Control-Allow-Headers': 'content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Vary': 'Origin',
        }
      : {}),
  };
}

/** MD5 sin dependencias, sobre el WebCrypto de Deno no disponible para MD5:
 *  se usa la implementación de la stdlib. Se aísla acá para que el resto del
 *  archivo no dependa de su forma. */
async function md5Hex(texto: string): Promise<string> {
  const { crypto } = await import('jsr:@std/crypto@1');
  const buf = await crypto.subtle.digest('MD5', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Registra DE DÓNDE salió el stoken, no solo si validó — mismo patrón que el
 *  buzón de S101-A: un `false` tiene que poder distinguir «la fórmula está
 *  mal» de «lo leí del lugar equivocado». */
function extraerStoken(b: Record<string, unknown>): { valor: string | null; de: string } {
  const card = (b.card ?? {}) as Record<string, unknown>;
  if (typeof b.stoken === 'string' && b.stoken) return { valor: b.stoken, de: 'raiz.stoken' };
  if (typeof card.stoken === 'string' && card.stoken) return { valor: card.stoken, de: 'card.stoken' };
  return { valor: null, de: 'ninguno' };
}

Deno.serve(async (req) => {
  const origen = req.headers.get('origin');
  const cabeceras = cors(origen);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabeceras });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, codigo: 'metodo_no_permitido' }),
      { status: 405, headers: cabeceras });
  }
  if (ORIGENES.length > 0 && (!origen || !ORIGENES.includes(origen))) {
    // No se dice qué orígenes valen: sería un mapa para quien prueba.
    return new Response(JSON.stringify({ ok: false, codigo: 'origen_no_permitido' }),
      { status: 403, headers: cabeceras });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ ok: false, codigo: 'servidor_sin_configurar' }),
      { status: 500, headers: cabeceras });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const alta = typeof body.alta === 'string' ? body.alta : '';
  if (!UUID_RE.test(alta)) {
    return new Response(JSON.stringify({ ok: false, codigo: 'alta_invalida' }),
      { status: 400, headers: cabeceras });
  }

  const desenlace = body.desenlace === 'rechazada' ? 'rechazada' : 'guardada';
  const token = typeof body.token === 'string' ? body.token.trim() : '';

  if (desenlace === 'guardada' && !token) {
    return new Response(JSON.stringify({ ok: false, codigo: 'token_ausente' }),
      { status: 400, headers: cabeceras });
  }

  // ── El stoken, si vino ────────────────────────────────────────────────────
  const st = extraerStoken(body);
  let stokenValido: boolean | null = null;
  let stokenDetalle = `stoken_de=${st.de}`;
  if (st.valor) {
    if (APP_CODE_SERVER && APP_KEY_SERVER) {
      // Fórmula CANDIDATA — la de transacciones, con el token de la tarjeta en
      // el lugar del transaction_id y el handle como user_id (que es el `uid`
      // con el que se tokenizó: por eso no pueden divergir).
      const esperado = await md5Hex(`${token}_${APP_CODE_SERVER}_${alta}_${APP_KEY_SERVER}`);
      stokenValido = esperado === st.valor.toLowerCase();
      stokenDetalle += ` formula=candidata_transaccion valido=${stokenValido}`;
    } else {
      stokenDetalle += ' formula=no_evaluada:faltan_credenciales_server';
    }
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // 🔴 TODA la decisión vive en la función de la base: handle vigente, un solo
  //    uso, dueño del alta, y la tarjeta naciendo por la única puerta. Acá no
  //    se re-implementa ninguna de esas reglas — se las llama.
  const { data, error } = await sb.rpc('resolver_alta_tarjeta', {
    p_alta_id: alta,
    p_desenlace: desenlace,
    p_token: token || null,
    p_bin: typeof body.bin === 'string' ? body.bin : null,
    p_ultimos4: typeof body.ultimos4 === 'string' ? body.ultimos4 : null,
    p_marca: typeof body.marca === 'string' ? body.marca : null,
    p_titular: typeof body.titular === 'string' ? body.titular : null,
    p_motivo: typeof body.motivo === 'string' ? body.motivo : null,
    /* 🔴 El alias es DATO DEL CLIENTE: se acota y se pasa tal cual. No se
       interpreta, no se compara, no decide nada. El largo se recorta acá
       además del CHECK — *un CHECK que rebota le da a la familia un error
       por algo que podíamos haber acomodado.* */
    p_alias: typeof body.alias === 'string' ? body.alias.trim().slice(0, 40) || null : null,
    p_stoken_valido: stokenValido,
    p_stoken_detalle: stokenDetalle,
  });

  if (error) {
    // El detalle del error NO viaja al navegador: es información de nuestra
    // base. La familia recibe una causa, no un stack.
    console.error('[alta-tarjeta] rpc', error.message);
    return new Response(JSON.stringify({ ok: false, codigo: 'no_se_pudo_completar' }),
      { status: 500, headers: cabeceras });
  }

  const r = (data ?? {}) as Record<string, unknown>;
  // 🔴 Al navegador vuelve el DESENLACE y nada más. Ni el `tarjeta_id`, ni el
  //    user, ni el token: la app los lee de su propia sesión, que es donde
  //    están autorizados.
  const ok = r.ok === true;
  return new Response(
    JSON.stringify({ ok, codigo: ok ? null : (r.codigo ?? 'no_se_pudo_completar'), estado: r.estado ?? null }),
    { status: ok ? 200 : 409, headers: cabeceras },
  );
});
