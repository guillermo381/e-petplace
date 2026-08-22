// ═══════════════════════════════════════════════════════════════════════════
// S103-D · TEST DEL RITMO — con 429 FORZADO
//
// El 429 es REAL: `{"statusCode":429,"message":"Rate limit is exceeded. Try
// again in 1 seconds."}` es el cuerpo textual que QA devolvió el 22-ago al
// hacer dos llamadas seguidas. Lo que es sintético es el ESCENARIO (cuántos
// 429 seguidos, y en qué orden) — no se puede pedirle a un proveedor que falle
// a demanda.
//
//    correr:  deno test supabase/functions/pagos-deuna-barrido/_ritmo.test.ts
// ═══════════════════════════════════════════════════════════════════════════

import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  ESPACIADO_MS, REINTENTOS_429, esperaSugerida, pedirConRitmo, type Deps,
} from './_ritmo.ts';

/** El cuerpo textual REAL del 429 de QA. */
const CUERPO_429 =
  '{ "statusCode": 429, "message": "Rate limit is exceeded. Try again in 1 seconds." }';
const CUERPO_OK = '{"status":"APPROVED","amount":24.5,"date":"2026-08-22T14:00:00Z"}';

/** Reloj y sueño simulados: el test no espera un segundo de verdad. */
function deps(respuestas: Array<{ status: number; texto: string } | 'red'>) {
  const dormidas: number[] = [];
  const instantes: number[] = [];
  let t = 0;
  let i = 0;
  const d: Deps = {
    ahora: () => t,
    dormir: (ms) => { dormidas.push(ms); t += ms; return Promise.resolve(); },
    fetch: ((_u: string, _i: RequestInit) => {
      instantes.push(t);
      const r = respuestas[Math.min(i++, respuestas.length - 1)];
      t += 50;                                     // la llamada tarda algo
      if (r === 'red') return Promise.reject(new Error('ECONNRESET'));
      return Promise.resolve(new Response(r.texto, { status: r.status }));
    }) as unknown as typeof fetch,
  };
  return { d, dormidas, instantes };
}

// ════════════════════════════════════════════════════════════════════════════
// ① EL ESPACIADO
// ════════════════════════════════════════════════════════════════════════════

Deno.test('dos llamadas seguidas quedan separadas por al menos el espaciado', async () => {
  const { d, instantes } = deps([{ status: 200, texto: CUERPO_OK }]);
  const estado = { ultima: 0 };
  await pedirConRitmo('u', {}, estado, d);
  await pedirConRitmo('u', {}, estado, d);
  assertEquals(instantes.length, 2);
  const separacion = instantes[1] - instantes[0];
  assert(separacion >= ESPACIADO_MS,
    `quedaron a ${separacion} ms, y el proveedor rechaza por debajo de ~1000`);
});

Deno.test('la primera llamada no espera (no hay a quien respetar)', async () => {
  const { d, dormidas } = deps([{ status: 200, texto: CUERPO_OK }]);
  await pedirConRitmo('u', {}, { ultima: 0 }, d);
  assertEquals(dormidas.length, 0, 'la primera llamada durmio sin motivo');
});

// ════════════════════════════════════════════════════════════════════════════
// ② EL 429 FORZADO — el corazón del test
// ════════════════════════════════════════════════════════════════════════════

Deno.test('429 y despues 200: reintenta y devuelve el cuerpo bueno', async () => {
  const { d, dormidas } = deps([
    { status: 429, texto: CUERPO_429 },
    { status: 200, texto: CUERPO_OK },
  ]);
  const r = await pedirConRitmo('u', {}, { ultima: 0 }, d);
  assert(r.ok, 'un 429 seguido de 200 tiene que terminar bien');
  assertEquals((r as { cuerpo: Record<string, unknown> }).cuerpo.status, 'APPROVED');
  assert(dormidas.some((ms) => ms >= 1000), 'no respeto la espera que el proveedor pidio');
});

Deno.test('🔴 429 AGOTADO: NO es fallo del pago — no trae cuerpo interpretable', async () => {
  const { d } = deps([{ status: 429, texto: CUERPO_429 }]);   // 429 siempre
  const r = await pedirConRitmo('u', {}, { ultima: 0 }, d);

  assertEquals(r.ok, false);
  assertEquals((r as { motivo: string }).motivo, 'rate_limit');

  /* 🔴 ESTE ES EL ASSERT QUE IMPORTA. Si el resultado trajera un `cuerpo`,
     alguien lo pasaría al clasificador y un cobro perfecto terminaría marcado
     huérfano porque preguntamos rápido. **No se puede leer mal lo que no
     existe.** */
  assert(!('cuerpo' in r), 'un rate_limit NO puede traer cuerpo: se leeria como estado del pago');
  assert(!('status' in r) || (r as { status?: number }).status === undefined,
    'un rate_limit no expone status HTTP: invita a interpretarlo');
});

Deno.test('el backoff CRECE entre reintentos', async () => {
  const { d, dormidas } = deps([{ status: 429, texto: CUERPO_429 }]);
  await pedirConRitmo('u', {}, { ultima: 0 }, d);
  // Las esperas por 429 son las > 0 que siguen al primer intento.
  const esperas = dormidas.filter((ms) => ms >= 1000);
  assert(esperas.length >= 2, `hubo ${esperas.length} esperas de backoff`);
  assert(esperas[1] > esperas[0],
    `no crecio: ${esperas.join(', ')} — repetir el mismo numero no ayuda si el primero no alcanzo`);
});

Deno.test('reintenta exactamente REINTENTOS_429 veces y no mas', async () => {
  const { d, instantes } = deps([{ status: 429, texto: CUERPO_429 }]);
  await pedirConRitmo('u', {}, { ultima: 0 }, d);
  assertEquals(instantes.length, REINTENTOS_429 + 1,
    'un barrido que reintenta sin techo se queda pegado en un solo intento');
});

// ════════════════════════════════════════════════════════════════════════════
// ③ LAS OTRAS FORMAS DE «no pude preguntar»
// ════════════════════════════════════════════════════════════════════════════

Deno.test('la red caida tampoco es fallo del pago, y tampoco trae cuerpo', async () => {
  const { d } = deps(['red']);
  const r = await pedirConRitmo('u', {}, { ultima: 0 }, d);
  assertEquals(r.ok, false);
  assertEquals((r as { motivo: string }).motivo, 'red');
  assert(!('cuerpo' in r));
});

Deno.test('un 500 se distingue de un 429: son cosas distintas', async () => {
  const { d } = deps([{ status: 500, texto: 'boom' }]);
  const r = await pedirConRitmo('u', {}, { ultima: 0 }, d);
  assertEquals((r as { motivo: string }).motivo, 'http');
  assertEquals((r as { status: number }).status, 500);
});

Deno.test('esperaSugerida lee el numero del mensaje REAL del proveedor', () => {
  assertEquals(esperaSugerida(CUERPO_429), 1000);
  assertEquals(esperaSugerida('Rate limit is exceeded. Try again in 12 seconds.'), 12_000);
  assertEquals(esperaSugerida('otra cosa'), null);
});

// ════════════════════════════════════════════════════════════════════════════
// ④ 🔴 CONTROL POSITIVO
// ════════════════════════════════════════════════════════════════════════════

Deno.test('CONTROL POSITIVO: el camino feliz devuelve el cuerpo, sin esperas de mas', async () => {
  /* *Ocho asserts que dicen «no pasó» probarían igual de bien una función que
     siempre devuelve error. Este separa «respeta el ritmo» de «no funciona».* */
  const { d, dormidas } = deps([{ status: 200, texto: CUERPO_OK }]);
  const r = await pedirConRitmo('u', {}, { ultima: 0 }, d);
  assert(r.ok);
  assertEquals((r as { cuerpo: Record<string, unknown> }).cuerpo.amount, 24.5);
  assertEquals(dormidas.length, 0);
});
