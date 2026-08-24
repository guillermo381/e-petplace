// ============================================================================
// baja-correo — LA BAJA EN UN CLIC, LLAMABLE DESDE EL SITIO ESTÁTICO
// ============================================================================
// Nace por un pedido de C (S104, tanda 2) con una razón que la decide sola:
// **el sitio es estático y NO mete la anon key** — política declarada en su
// `Formulario.astro`, que para los leads usa `PUBLIC_URL_LEADS` contra
// `capturar-lead`. La baja necesita el mismo molde: **un endpoint**, no una
// credencial repartida en HTML.
//
// *Meter la anon key en el sitio para resolver una pantalla sería pagar una
// página con una política — y esa política existe porque una clave en un HTML
// estático no se puede rotar sin redeployar el sitio entero.*
//
// ── POR QUÉ NO TIENE GUARD DE SECRETO, y es a propósito ──────────────────
// `despachar-*` exige `x-despacho-secret` porque lo llama la casa. **A ésta la
// llama la persona que quiere darse de baja, desde un correo, sin cuenta.**
// Pedirle una credencial sería exigirle identificarse para ejercer un derecho
// que ejerce justamente porque no quiere estar identificada.
// **El token de la invitación ES la credencial**: 256 bits, y sin él no se
// alcanza nada.
//
// ── LO QUE NO HACE ───────────────────────────────────────────────────────
// **No distingue token válido de inválido.** La RPC contesta `listo` siempre y
// acá se devuelve igual: *distinguir convertiría la baja en un oráculo de
// tokens válidos.* La página dice lo mismo en los dos casos.
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return Response.json({ error: 'solo_post' }, { status: 405, headers: CORS });
  }

  let token = '';
  try {
    const body = await req.json();
    token = typeof body?.token === 'string' ? body.token : '';
  } catch {
    token = '';
  }

  // Un token vacío contesta como cualquier otro: la respuesta es uniforme y no
  // informa nada sobre qué tokens existen.
  if (token === '') return Response.json({ resultado: 'listo' }, { headers: CORS });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await supabase.rpc('dar_de_baja_correo', { p_token: token });

  if (error) {
    // Un fallo de infraestructura SÍ se dice: si la baja no se registró, decir
    // «listo» sería la única mentira que esta función no puede permitirse.
    return Response.json({ error: 'no_se_pudo' }, { status: 500, headers: CORS });
  }
  return Response.json({ resultado: 'listo' }, { headers: CORS });
});
