// ═══════════════════════════════════════════════════════════════════════════
// S103-D · TEST DEL RELOJ DE HUÉRFANOS
//
// 🔴 QUÉ ES REAL Y QUÉ ES SINTÉTICO — declarado, porque mezclarlos sería vender
//    como medición algo que se construyó:
//
//    · REALES (grabadas de QA el 22-ago, `../pagos-deuna-webhook/
//      fixtures-qa-deuna.json`): las **dos respuestas fantasma**, por `idType 0`
//      y por `idType 1`. Son las únicas respuestas de este API que pudimos
//      obtener sin `pointOfSale`.
//    · SINTÉTICAS: todo lo demás — APPROVED, REVERSED, REVERSED_FAILED y el
//      PENDING legítimo con monto. **Construidas sobre la FORMA real** (los
//      mismos campos, en el mismo lugar), pero no observadas.
//
//    *No es una formalidad: el día que haya POS, las sintéticas se reemplazan
//     por grabadas y estos tests se vuelven a correr. Si estuvieran mezcladas
//     nadie sabría cuáles reemplazar.*
//
//    correr:  deno test --allow-read supabase/functions/pagos-deuna-barrido/
// ═══════════════════════════════════════════════════════════════════════════

import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@1';
import { clasificar, esFantasma, VENTANA_DIAS } from './_reloj.ts';

// ── REALES ─────────────────────────────────────────────────────────────────
const fx = JSON.parse(await Deno.readTextFile(
  new URL('../pagos-deuna-webhook/fixtures-qa-deuna.json', import.meta.url)));
const FANTASMA_0 = fx.fantasma_idType_0;   // REAL
const FANTASMA_1 = fx.fantasma_idType_1;   // REAL

// ── SINTÉTICAS (marcadas: no son observaciones) ────────────────────────────
const S_APROBADA = { status: 'APPROVED', amount: 24.5, date: '2026-08-22T14:00:00Z' };
const S_REVERSED = { status: 'REVERSED', amount: 24.5, date: '2026-08-22T14:00:00Z' };
const S_REV_FAIL = { status: 'REVERSED_FAILED', amount: 24.5, date: '2026-08-22T14:00:00Z' };
/* 🔴 EL CASO QUE SEPARA «fantasma» DE «todavía no pagó»: un PENDING legítimo
   trae SU MONTO y su fecha. Sin este caso, el test no probaría que el
   clasificador distingue — probaría que dice fantasma a todo PENDING. */
const S_PENDIENTE_REAL = { status: 'PENDING', amount: 24.5, date: '2026-08-22T14:00:00Z' };

const AHORA = new Date('2026-08-22T15:00:00Z');
const hace = (h: number) => new Date(AHORA.getTime() - h * 3_600_000).toISOString();

const enVuelo = (horas: number, holdEnHoras: number | null = 1) => ({
  creado_en: hace(horas),
  hold_expira_en: holdEnHoras === null ? null
    : new Date(AHORA.getTime() + holdEnHoras * 3_600_000).toISOString(),
});

// ════════════════════════════════════════════════════════════════════════════
// ① EL FANTASMA — sobre las respuestas REALES
// ════════════════════════════════════════════════════════════════════════════

Deno.test('REAL · el fantasma de idType 0 es fantasma DESDE EL PRIMER SEGUNDO', () => {
  const v = clasificar(enVuelo(0.0003), FANTASMA_0, AHORA);   // ~1 segundo de vida
  assertEquals(v.clase, 'fantasma');
  assertEquals(v.hallazgo, 'huerfano_deuna_vencido');
  assert(v.terminal, 'un fantasma que no es terminal se consulta para siempre');
});

Deno.test('REAL · el fantasma de idType 1 también, con el eco de nuestra referencia', () => {
  assertEquals(FANTASMA_1.internalTransactionReference, 'EPQAnoexiste01',
    'la fixture perdio el eco — es justamente lo que la hace peligrosa');
  assertEquals(clasificar(enVuelo(0.0003), FANTASMA_1, AHORA).clase, 'fantasma');
});

Deno.test('REAL · el fantasma NO espera los 7 dias', () => {
  // Mismo cuerpo, un intento recién nacido: ya es terminal.
  const v = clasificar(enVuelo(0.001), FANTASMA_0, AHORA);
  assert(v.terminal);
  assert(!v.razon.includes('dias'), 'no debe decidirse por la ventana sino por la forma');
});

// ════════════════════════════════════════════════════════════════════════════
// ② 🔴 EL DISCRIMINADOR — un PENDING con monto NO es fantasma
// ════════════════════════════════════════════════════════════════════════════

Deno.test('SINTÉTICO · un PENDING con SU MONTO no es fantasma: es un cliente que aun no pago', () => {
  assertFalse(esFantasma(S_PENDIENTE_REAL));
  const v = clasificar(enVuelo(1), S_PENDIENTE_REAL, AHORA);
  assertEquals(v.clase, 'en_vuelo');
  assertFalse(v.terminal, 'el unico caso que debe volver a preguntarse');
});

Deno.test('SINTÉTICO · las tres marcas del fantasma se exigen juntas', () => {
  // Si bastara una sola, el clasificador llamaria fantasma al caso normal.
  assertFalse(esFantasma({ status: 'PENDING', amount: 24.5, date: '' }));
  assertFalse(esFantasma({ status: 'PENDING', amount: 0, date: '2026-08-22T14:00:00Z' }));
  assertFalse(esFantasma({ status: 'APPROVED', amount: 0, date: '' }));
  assert(esFantasma({ status: 'PENDING', amount: 0, date: '' }));
});

// ════════════════════════════════════════════════════════════════════════════
// ③ LOS RELOJES — hold y ventana
// ════════════════════════════════════════════════════════════════════════════

Deno.test('SINTÉTICO · hold VIVO: el intento es legitimo y sigue en vuelo', () => {
  const v = clasificar(enVuelo(2, /*hold vence en*/ 1), S_PENDIENTE_REAL, AHORA);
  assertEquals(v.clase, 'en_vuelo');
  assertFalse(v.terminal);
});

Deno.test('SINTÉTICO · hold MUERTO: se rearma', () => {
  const v = clasificar(enVuelo(2, /*vencio hace*/ -1), S_PENDIENTE_REAL, AHORA);
  assertEquals(v.clase, 'hold_vencido');
  assertEquals(v.hallazgo, null, 'un rearme no es un hallazgo de soporte');
  assert(v.terminal);
});

Deno.test('SINTÉTICO · sin hold, el reloj del hold no decide nada', () => {
  const v = clasificar(enVuelo(2, null), S_PENDIENTE_REAL, AHORA);
  assertEquals(v.clase, 'en_vuelo');
});

Deno.test('SINTÉTICO · a los 7 dias: huerfano_deuna_vencido con nombre', () => {
  const v = clasificar(
    { creado_en: hace(24 * VENTANA_DIAS), hold_expira_en: null }, S_PENDIENTE_REAL, AHORA);
  assertEquals(v.clase, 'vencido');
  assertEquals(v.hallazgo, 'huerfano_deuna_vencido');
  assert(v.terminal, 'pasada la ventana no hay a quien preguntarle');
});

Deno.test('SINTÉTICO · en el borde (6,9 dias) TODAVIA no vence', () => {
  const v = clasificar(
    { creado_en: hace(24 * VENTANA_DIAS - 2), hold_expira_en: null }, S_PENDIENTE_REAL, AHORA);
  assertEquals(v.clase, 'en_vuelo');
});

// ════════════════════════════════════════════════════════════════════════════
// ④ PRECEDENCIA — el orden de las preguntas ES la decisión
// ════════════════════════════════════════════════════════════════════════════

Deno.test('SINTÉTICO · un cobro REAL a los 9 dias se confirma igual, no se vence', () => {
  /* 🔴 El caso que justifica que CONFIRMADO vaya primero: cerrar como vencido
     una transaccion aprobada seria perder plata que entro de verdad. */
  const v = clasificar(
    { creado_en: hace(24 * 9), hold_expira_en: hace(24 * 8) }, S_APROBADA, AHORA);
  assertEquals(v.clase, 'confirmado');
  assertEquals(v.hallazgo, 'confirmado_tardio');
});

Deno.test('SINTÉTICO · REVERSED gana sobre el hold muerto', () => {
  const v = clasificar(enVuelo(2, -1), S_REVERSED, AHORA);
  assertEquals(v.clase, 'reversado');
});

Deno.test('SINTÉTICO · REVERSED_FAILED es hallazgo de soporte, jamas se archiva solo', () => {
  const v = clasificar(enVuelo(2, -1), S_REV_FAIL, AHORA);
  assertEquals(v.clase, 'reverso_fallido');
  assertEquals(v.hallazgo, 'reverso_fallido');
});

// ════════════════════════════════════════════════════════════════════════════
// ⑤ 🔴 CONTROL POSITIVO — sin esto, un clasificador que devolviera siempre
//    'fantasma' pasaria varios de los tests de arriba.
// ════════════════════════════════════════════════════════════════════════════

Deno.test('CONTROL POSITIVO: las siete clases son alcanzables', () => {
  const vistas = new Set([
    clasificar(enVuelo(1), S_APROBADA, AHORA).clase,
    clasificar(enVuelo(1), S_REVERSED, AHORA).clase,
    clasificar(enVuelo(1), S_REV_FAIL, AHORA).clase,
    clasificar(enVuelo(1), FANTASMA_0, AHORA).clase,
    clasificar({ creado_en: hace(24 * 8), hold_expira_en: null }, S_PENDIENTE_REAL, AHORA).clase,
    clasificar(enVuelo(1, -1), S_PENDIENTE_REAL, AHORA).clase,
    clasificar(enVuelo(1), S_PENDIENTE_REAL, AHORA).clase,
  ]);
  assertEquals(vistas.size, 7, `alguna clase es inalcanzable: ${[...vistas].join(', ')}`);
});
