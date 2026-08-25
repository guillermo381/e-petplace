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

import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@1';
import { cuerpoDeConsulta, esVerdadVerificada } from './_verdad.ts';

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

// ════════════════════════════════════════════════════════════════════════════
// CON QUÉ LLAVE SE PREGUNTA — dictamen de mesa, 22-ago
//
// 🔴 El motivo es MEDIDO: la respuesta real de QA por `idType "0"` trae
//    `internalTransactionReference` VACÍO (ver `fantasma_idType_0` arriba), y
//    el actuador resuelve el sujeto SÓLO por ese campo. Por `"1"` la respuesta
//    devuelve la referencia por eco — también medido.
// ════════════════════════════════════════════════════════════════════════════

Deno.test('con referencia, se pregunta por idType "1" — la que vuelve por eco', () => {
  assertEquals(cuerpoDeConsulta('tx-abc', 'EPsim0001'),
    { idType: '1', idTransacionReference: 'EPsim0001' });
});

Deno.test('la referencia GANA aunque haya transactionId', () => {
  /* Es el corazón del dictamen: antes ganaba el txId, y por ahí volvía sin la
     llave para resolver el sujeto. */
  const c = cuerpoDeConsulta('tx-abc', 'EPsim0001');
  assertEquals(c?.idType, '1', 'volvio a preferir el txId — se perdio la cura');
});

Deno.test('sin referencia, cae a idType "0" — preguntar es mejor que no preguntar', () => {
  assertEquals(cuerpoDeConsulta('tx-abc', ''),
    { idType: '0', idTransacionReference: 'tx-abc' });
});

Deno.test('sin ninguna llave devuelve null, que NO es un cuerpo vacio', () => {
  /* `null` significa «no hay a quien preguntarle» — distinto de una consulta
     que se hizo y falló. El llamador los trata distinto. */
  assertEquals(cuerpoDeConsulta('', ''), null);
});

Deno.test('🔴 REAL · el eco de idType "1" es lo que la cura compra', () => {
  /* La fixture REAL de idType 1 devuelve la referencia que mandamos; la de
     idType 0 la devuelve VACIA. Si esto cambiara, la cura pierde su razon. */
  assertEquals(fx.fantasma_idType_1.internalTransactionReference, 'EPQAnoexiste01');
  assertEquals(fx.fantasma_idType_0.internalTransactionReference, '',
    'la fixture de idType 0 ya no viene vacia — re-evaluar el dictamen');
});

// ════════════════════════════════════════════════════════════════════════════
// 🔴 EL VEREDICTO VIVE EN SU COLUMNA — no en `detalle`
//
// `_evento_autenticado` lee `verificado IS TRUE`. Si el buzón dejara de
// escribir esa columna, **NINGÚN evento de DeUna autenticaría** y el fallo
// sería silencioso: los eventos llegarían, se guardarían, y el sujeto no se
// movería. Es «motor sin puerta» del lado de la escritura.
//
// Este test lee el ARCHIVO, igual que el censo de códigos: la conexión no se
// puede probar sin base, pero **sí se puede probar que sigue escrita**.
// ════════════════════════════════════════════════════════════════════════════

const fuenteBuzon = await Deno.readTextFile(new URL('./index.ts', import.meta.url));

const sinComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

Deno.test('🔴 el buzón escribe la columna `verificado` en el update del veredicto', () => {
  const src = sinComentarios(fuenteBuzon);
  assert(/^\s*verificado,\s*$/m.test(src) || /verificado:\s*verificado/.test(src),
    'el veredicto dejó de ir a su columna — ningun evento DeUna autenticaria');
});

Deno.test('el buzón marca `origen` al persistir el crudo', () => {
  const src = sinComentarios(fuenteBuzon);
  assert(src.includes("origen: 'webhook'"),
    'sin `origen`, el aplicador del barrido no puede distinguir por qué puerta entró');
});

Deno.test('los rechazos escriben verificado=false EXPLÍCITO, no lo dejan NULL', () => {
  /* NULL significa «sin veredicto»; false significa «preguntamos y no
     confirmó». *Colapsarlos haría que un secreto invalido se vea igual que un
     evento que todavía no se analizó.* */
  const src = sinComentarios(fuenteBuzon);
  const n = (src.match(/verificado:\s*false/g) ?? []).length;
  assert(n >= 2, `solo ${n} rechazos marcan verificado=false; se esperaban al menos 2`);
});

Deno.test('🔴 CONTROL POSITIVO: el detector ve su ausencia', () => {
  /* Sin esto, un regex roto pasaría los tres de arriba con verde. */
  const falso = sinComentarios("await db.update({ stoken_valido: true, resultado: 'recibido' });");
  assertFalse(/^\s*verificado,\s*$/m.test(falso) || /verificado:\s*verificado/.test(falso));
  assertFalse(falso.includes("origen: 'webhook'"));
});
