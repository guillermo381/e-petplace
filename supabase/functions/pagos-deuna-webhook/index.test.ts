// ═══════════════════════════════════════════════════════════════════════════
// S103-D · TEST DEL PREDICADO DE VERDAD VERIFICADA
//
// 🔴 Corre contra las respuestas **REALES grabadas** del QA de DeUna
//    (`fixtures-qa-deuna.json`), no contra un payload imaginado. Ese es el
//    punto: el fantasma —200 / PENDING / amount 0 para algo que no existe— no
//    se dedujo de la doc, se midió, y el test lo consume tal cual volvió.
//
//    correr:  deno test --allow-read supabase/functions/pagos-deuna-webhook/
// ═══════════════════════════════════════════════════════════════════════════

import { assert, assertFalse } from 'jsr:@std/assert@1';
import { esVerdadVerificada } from './_verdad.ts';

const fx = JSON.parse(await Deno.readTextFile(
  new URL('./fixtures-qa-deuna.json', import.meta.url)));

// ── LO MEDIDO ──────────────────────────────────────────────────────────────

Deno.test('el fantasma de idType 0 (REAL, grabado) NO verifica', () => {
  // 200 + PENDING + amount 0 sobre un uuid inventado.
  assertFalse(esVerdadVerificada(true, fx.fantasma_idType_0));
});

Deno.test('el fantasma de idType 1 (REAL) NO verifica, ni con el eco de nuestra referencia', () => {
  // Devuelve internalTransactionReference con lo que mandamos: parece existir.
  assert(fx.fantasma_idType_1.internalTransactionReference === 'EPQAnoexiste01',
    'la fixture perdio el eco — es justamente lo que la hace peligrosa');
  assertFalse(esVerdadVerificada(true, fx.fantasma_idType_1));
});

// ── EL CASO FILOSO, sintético y declarado como tal ─────────────────────────

Deno.test('APPROVED con amount 0 NO verifica — el candado del monto', () => {
  /* Si el proveedor algún día contestara APPROVED sobre un registro vacío, sin
     esta condición lo daríamos por cobrado. *La forma del fantasma ya la vimos;
     lo único que cambiaría es la palabra.* */
  assertFalse(esVerdadVerificada(true, fx._sinteticos.aprobada_sin_monto));
});

Deno.test('REVERSED y REVERSED_FAILED no verifican', () => {
  assertFalse(esVerdadVerificada(true, fx._sinteticos.reversada));
  assertFalse(esVerdadVerificada(true, fx._sinteticos.reverso_fallido));
});

Deno.test('un HTTP no-ok no verifica, aunque el cuerpo diga APPROVED', () => {
  assertFalse(esVerdadVerificada(false, fx._sinteticos.aprobada_con_monto));
});

Deno.test('cuerpos degenerados no verifican', () => {
  for (const c of [null, undefined, {}, { status: 'APPROVED' }, { amount: 10 }]) {
    assertFalse(esVerdadVerificada(true, c), `verifico con ${JSON.stringify(c)}`);
  }
});

// ── 🔴 CONTROL POSITIVO — sin esto el test es un verde flojo ───────────────

Deno.test('CONTROL POSITIVO: el predicado SÍ verifica el caso bueno', () => {
  /* *Seis asserts que dicen «no» probarían igual de bien un predicado que
     devuelve siempre false. Este es el que separa «filtra el fantasma» de
     «no deja pasar nada».* */
  assert(esVerdadVerificada(true, fx._sinteticos.aprobada_con_monto),
    'el predicado no deja pasar ni una transaccion aprobada con monto');
});
