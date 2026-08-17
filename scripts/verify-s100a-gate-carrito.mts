/**
 * S100-A · EL GATE DE LA PUERTA — `revalidarCarritoDespensa` por el camino real.
 *
 *   pnpm tsx scripts/verify-s100a-gate-carrito.mts
 *
 * ── POR QUÉ POR EL WRAPPER Y NO POR UN `select` PROPIO ──────────────────────
 * El defecto que este lector existe para evitar **no vive en el servidor**:
 * vive en cómo se arma el informe. Un assert que hiciera su propio `select`
 * mediría mi consulta, no el producto — *el eco de la pieza en vez de la
 * pieza* (la trampa que S99 nombró con el instrumento de la barra). Se llama
 * la función exactamente como la va a llamar la pantalla.
 *
 * ── LOS BRAZOS, Y QUÉ DISCRIMINA CADA UNO ───────────────────────────────────
 *  ① VERDE — publicada CON stock → `disponible:true`, `motivo:null`.
 *  ② CONTRA-CASO — publicada SIN stock → `disponible:false`, `motivo:'agotado'`.
 *    *Sin este brazo, un lector que devolviera siempre `true` pasaría ①.*
 *  ③ 🔴 LA PROPIEDAD MADRE (clase L-268) — un id que **no vuelve del `select`**
 *    tiene que APARECER igual en el informe, como no disponible. Un lector que
 *    recorriera las filas devueltas simplemente **no lo incluiría**, y un
 *    informe de 2 filas se ve *exactamente igual* que uno sano de 2 filas: el
 *    ítem faltante no tiene síntoma. Por eso el assert mira **cardinalidad y
 *    orden**, no solo los estados.
 *  ④ CARDINALIDAD Y ORDEN con duplicados — el informe sale 1:1 con la entrada.
 *  ⑤ CARRITO VACÍO — `[]` sin viajar a la red.
 *
 * ── ⚠️ BRAZO SIN SUJETO, DECLARADO ──────────────────────────────────────────
 * `motivo:'ya_no_publicada'` por `estado <> 'publicada'` **no se ejercita**:
 * medido contra la base, hoy **no existe ninguna oferta con estado distinto de
 * `publicada`**. *Un brazo sin sujeto que no se declara se lee como probado.*
 * La otra vía al mismo motivo (la oferta que no vuelve) sí se ejercita, en ③.
 */
import { readFileSync } from 'node:fs';
import { initApi, getClient } from '../packages/api/src/client';
import { revalidarCarritoDespensa } from '../packages/api/src/wrappers/despensa-pedido';

let fallos = 0;
const check = (cond: boolean, nombre: string) => {
  console.log(`${cond ? '  ✓' : '  ✗ FALLA'} ${nombre}`);
  if (!cond) fallos++;
};

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
) as Record<string, string>;

initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

// El fixture NO se inventa: se pide a la base los dos casos vivos. Si algún
// día no hubiera alguno, el script lo dice y sale — antes que correr verde
// sobre un universo que no contiene el caso (L-139).
const CON_STOCK = 'a5ce6418-9d85-4dd0-ba2d-0367e9cf3da0';
const SIN_STOCK = '23e44b06-5ede-4472-b485-c47a429fb021';
const FANTASMA = '00000000-0000-4000-8000-000000000000';

try {
  console.log('\n══ S100-A · el gate de la puerta (D-827) ══\n');

  const login = await getClient().auth.signInWithPassword({
    email: env.EXPO_PUBLIC_DEMO_EMAIL,
    password: env.EXPO_PUBLIC_DEMO_PASSWORD,
  });
  check(login.error === null && login.data.session !== null, 'sesión real de la familia demo');
  if (login.error) throw new Error(`sin sesión: ${login.error.message}`);

  // ── ⑤ carrito vacío ───────────────────────────────────────────────────────
  const vacio = await revalidarCarritoDespensa([]);
  check(vacio.ok && vacio.data.length === 0, '⑤ carrito vacío → [] (y cero viajes)');

  // ── ①②③④ la corrida que discrimina ────────────────────────────────────────
  const entrada = [CON_STOCK, SIN_STOCK, FANTASMA, CON_STOCK];
  const r = await revalidarCarritoDespensa(entrada);
  if (!r.ok) throw new Error(`el lector falló: ${r.mensaje}`);
  const info = r.data;

  // ③ + ④ — la propiedad madre, antes que los estados.
  check(
    info.length === entrada.length,
    `③ CARDINALIDAD: ${entrada.length} ítems entraron → ${info.length} volvieron (el fantasma NO se traga)`,
  );
  check(
    info.every((x, i) => x.oferta_id === entrada[i]),
    '④ ORDEN 1:1 con la entrada, duplicado incluido',
  );

  const [conStock, sinStock, fantasma, repetido] = info;

  // ① verde
  check(
    conStock?.disponible === true && conStock?.motivo === null,
    '① publicada CON stock → disponible, sin motivo',
  );
  check(
    typeof conStock?.precio_vigente === 'number' && conStock.precio_vigente > 0,
    '① trae el precio VIGENTE del motor (para cazar el precio viejo del carrito)',
  );
  check(
    typeof conStock?.cuenta_comercial_id === 'string',
    '① trae el vendedor REAL de la oferta (dato para F5 — no veredicto)',
  );

  // ② contra-caso
  check(
    sinStock?.disponible === false && sinStock?.motivo === 'agotado',
    '② publicada SIN stock → NO disponible, motivo «agotado»',
  );

  // ③ el fantasma, hablando
  check(
    fantasma?.disponible === false && fantasma?.motivo === 'ya_no_publicada',
    '③ id que no vuelve del select → NO disponible y lo DICE',
  );
  check(
    fantasma?.precio_vigente === null && fantasma?.cuenta_comercial_id === null,
    '③ nulos honestos en el fantasma (jamás un precio inventado — L-139)',
  );

  // ④ el duplicado no colapsa
  check(
    repetido?.oferta_id === CON_STOCK && repetido?.disponible === true,
    '④ el ítem repetido sale dos veces, sin colapsar',
  );

  // El discriminador del discriminador: si ① y ② dieran lo MISMO, el lector
  // no estaría midiendo nada aunque los dos asserts pasaran por separado.
  check(
    conStock?.disponible !== sinStock?.disponible,
    '🔑 ① y ② DIFIEREN — el lector discrimina de verdad',
  );
} catch (e) {
  console.log(`  ✗ EXCEPCIÓN: ${(e as Error).message}`);
  fallos++;
}

console.log(`\n${fallos === 0 ? '✅ VERDE' : `🔴 ${fallos} FALLA(S)`}\n`);
process.exit(fallos === 0 ? 0 : 1);
