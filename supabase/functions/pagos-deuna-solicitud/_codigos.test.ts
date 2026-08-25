// ═══════════════════════════════════════════════════════════════════════════
// S103-D · EL CENSO DE CÓDIGOS DE LA PUERTA — extraído del ARCHIVO, no de una
//          lista escrita a mano
//
// 🔴 POR QUÉ EXISTE, y lo encontró un cruce, no una lectura: mi contrato D→C
//    declaraba 10 códigos y **la puerta emitía 12**. Faltaban `monto_invalido`
//    y `metodo_no_permitido`. A tradujo el contrato **fielmente**, así que
//    `CodigoDeuna` en `packages/api` heredó el hueco — y su `codigo as
//    CodigoDeuna` los deja pasar en runtime **sin que TypeScript se entere**.
//
//    *Un contrato escrito a mano diverge de la función que describe en el
//    momento exacto en que alguien agrega un `return` — y nadie lo nota,
//    porque el contrato sigue siendo cierto sobre todo lo que sí menciona.*
//
//    ⇒ Este test **lee el archivo** y falla si aparece un código que nadie
//    declaró. No prueba que las voces sean buenas: prueba que **ninguna falta**.
//
//    correr:  bash scripts/deuna/correr-tests.sh
// ═══════════════════════════════════════════════════════════════════════════

import { assert, assertEquals } from 'jsr:@std/assert@1';

/**
 * Los códigos que la puerta emite, DECLARADOS.
 *
 * 🔴 Agregar uno acá no alcanza: hay que agregarlo también al contrato D→C y
 * pedirle a A que entre a `CodigoDeuna`. **Este test sólo garantiza que nadie
 * lo agregue en silencio** — es el aviso, no la cura.
 */
const DECLARADOS = new Set([
  'metodo_no_permitido',      // 405 · no llegó por POST
  'servidor_sin_configurar',  // 500 · falta un secret (hoy: el POS)
  'sin_sesion',               // 401
  'sesion_no_verificable',    // 503 · 🔴 NO es rechazo
  'datos_invalidos',          // 400 · ni compra ni cita, o las dos
  'monto_no_se_recibe',       // 400 · el cliente mandó un monto
  'compra_no_existe',         // 409 · no existe O es de otro (a propósito)
  'cita_no_existe',           // 409 · ídem
  'desglose_incompleto',      // 409 · sin desglose congelado no hay cobro
  'monto_invalido',           // 409 · el total no es > 0 — defecto NUESTRO
  'sin_respuesta',            // 504 · 🔴 NO es rechazo
  'no_se_pudo_completar',     // 409/500 · el proveedor rechazó
]);

/** Los que NO son rechazo del cliente y no pueden vestirse como tal (§7). */
const NO_SON_RECHAZO = ['sin_respuesta', 'sesion_no_verificable'];

/** Los que significan «defecto nuestro»: la persona no tiene qué corregir. */
const DEFECTO_NUESTRO = ['servidor_sin_configurar', 'monto_invalido',
                         'metodo_no_permitido', 'desglose_incompleto'];

const fuente = await Deno.readTextFile(new URL('./index.ts', import.meta.url));

/** Extrae los `codigo: 'x'` del archivo, ignorando comentarios. */
function codigosDelArchivo(src: string): Set<string> {
  const sinComentarios = src
    .replace(/\/\*[\s\S]*?\*\//g, '')       // bloque
    .replace(/^\s*\/\/.*$/gm, '');          // línea
  const out = new Set<string>();
  for (const m of sinComentarios.matchAll(/codigo:\s*'([a-z_]+)'/g)) out.add(m[1]);
  return out;
}

Deno.test('🔴 la puerta no emite ningún código sin declarar', () => {
  const emitidos = codigosDelArchivo(fuente);
  const huerfanos = [...emitidos].filter((c) => !DECLARADOS.has(c));
  assertEquals(huerfanos, [],
    `códigos emitidos y NO declarados: ${huerfanos.join(', ')}\n` +
    '   → agregalos a DECLARADOS, al contrato D→C, y avisale a A para CodigoDeuna');
});

Deno.test('no se declaran códigos que la puerta ya no emite', () => {
  /* La otra dirección: un declarado sin emisor es letra muerta que alguien va
     a escribirle una voz. *Una voz para un caso imposible se ve exactamente
     igual que una voz que falta.* */
  const emitidos = codigosDelArchivo(fuente);
  const muertos = [...DECLARADOS].filter((c) => !emitidos.has(c));
  assertEquals(muertos, [], `declarados sin emisor: ${muertos.join(', ')}`);
});

Deno.test('🔴 CONTROL POSITIVO: el extractor ve un código nuevo', () => {
  /* Sin esto, un extractor roto que devolviera un conjunto vacío pasaría los
     dos tests de arriba con verde. */
  const s = codigosDelArchivo("return json({ ok: false, codigo: 'inventado_xyz' }, 409);");
  assert(s.has('inventado_xyz'), 'el extractor no ve un codigo real');
  assertEquals(s.size, 1);
});

Deno.test('🔴 el extractor IGNORA comentarios (L-170)', () => {
  /* Ya me pasó hoy con otro control: un grep leyó su propio comentario como
     código y dio rojo. */
  const s = codigosDelArchivo("/* codigo: 'no_soy_real' */\nreturn { codigo: 'si_soy' };");
  assertEquals([...s], ['si_soy']);
});

Deno.test('los que NO son rechazo están todos declarados', () => {
  for (const c of NO_SON_RECHAZO) {
    assert(DECLARADOS.has(c), `${c} dejó de declararse y es de los que la voz no puede vestir como rechazo`);
  }
});

Deno.test('los de «defecto nuestro» están todos declarados', () => {
  for (const c of DEFECTO_NUESTRO) {
    assert(DECLARADOS.has(c), `${c} dejó de declararse`);
  }
});
