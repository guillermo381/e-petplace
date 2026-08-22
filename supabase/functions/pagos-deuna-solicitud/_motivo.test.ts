// ═══════════════════════════════════════════════════════════════════════════
// S103-D · TEST DEL MOTIVO — contra los cuerpos de error REALES de QA
//
// 🔴 Los cinco cuerpos de abajo son **literales**, copiados de las respuestas
//    que el ambiente QA devolvió el 22-ago-2026. No hay nada sintético acá: son
//    exactamente los errores que la puerta va a ver el lunes.
// ═══════════════════════════════════════════════════════════════════════════

import { assert, assertEquals } from 'jsr:@std/assert@1';
import { motivoDeError } from './_motivo.ts';

// ✅ REALES
const E_401 = { statusCode: 401, message: 'Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.' };
const E_POS_VACIO = { statusCode: 400, message: { response: { message: ['pointOfSale must contain only numeric characters.', 'pointOfSale should not be empty'], error: 'Bad Request', statusCode: 400 } } };
const E_CURRENCY = { statusCode: 400, message: { response: { message: ['property currency should not exist'], error: 'Bad Request', statusCode: 400 } } };
const E_REF_LARGA = { statusCode: 400, message: { response: { message: ['internalTransactionReference must be at most 20 characters long.'], error: 'Bad Request', statusCode: 400 } } };
const E_JERARQUIA = { statusCode: 400, message: { response: { message: 'Entity does not exist in system', statusCode: 400, errors: [{ code: 2000, reason: 'Hierarchy tree parent 1  not found', details: [{ source: 'system', code: 2006, reason: 'endpoint_does_not_exist', details: 'Service request failed with status code 404' }] }] } } };

Deno.test('🔴 EL DEFECTO QUE ESTO CURA: jamas devuelve [object Object]', () => {
  /* Antes de este archivo, el motivo del POS equivocado salia literalmente
     "[object Object]: sin transactionId". *Un motivo relleno con basura es peor
     que uno vacio: el vacio manda a abrir el crudo, el otro se da por leido.* */
  for (const e of [E_401, E_POS_VACIO, E_CURRENCY, E_REF_LARGA, E_JERARQUIA]) {
    const m = motivoDeError(e, 400);
    assert(!m.includes('[object Object]'), `salio con [object Object]: ${m}`);
    assert(m.length > 0);
  }
});

Deno.test('REAL · el 401 de credenciales (message string plano)', () => {
  assert(motivoDeError(E_401, 401).includes('missing subscription key'));
});

Deno.test('REAL · el array de mensajes del validador sale entero', () => {
  const m = motivoDeError(E_POS_VACIO, 400);
  assert(m.includes('only numeric characters'));
  assert(m.includes('should not be empty'), 'perdio el segundo mensaje del array');
});

Deno.test('REAL · currency — el campo que rebota el request entero', () => {
  assert(motivoDeError(E_CURRENCY, 400).includes('property currency should not exist'));
});

Deno.test('REAL · la referencia larga dice SU limite', () => {
  assert(motivoDeError(E_REF_LARGA, 400).includes('at most 20 characters'));
});

Deno.test('🔴 REAL · la jerarquia: el texto UTIL esta en errors[].reason', () => {
  const m = motivoDeError(E_JERARQUIA, 400);
  /* *«Entity does not exist in system» no le dice a nadie que arreglar;
     «Hierarchy tree parent 1 not found» le dice que el pointOfSale esta mal.* */
  assert(m.includes('Hierarchy tree parent'), `perdio la causa real: ${m}`);
  assert(m.includes('Entity does not exist'), 'perdio el mensaje de cabecera');
});

Deno.test('no repite el mismo texto dos veces', () => {
  const m = motivoDeError({ message: 'X', response: { message: 'X' } }, 400);
  assertEquals(m, 'X');
});

Deno.test('🔴 ULTIMO RECURSO: jamas queda vacio (L-316)', () => {
  assertEquals(motivoDeError({}, 502), 'http_502');
  assertEquals(motivoDeError(null, 500), 'http_500');
  assertEquals(motivoDeError({ message: {} }, 400), 'http_400');
});

Deno.test('CONTROL POSITIVO: un objeto anidado no se estampa, pero su texto SI se extrae', () => {
  /* Sin este control, una funcion que devolviera siempre `http_400` pasaria
     el test del [object Object]. */
  const m = motivoDeError(E_JERARQUIA, 400);
  assert(m !== 'http_400', 'no extrajo nada: cayo al ultimo recurso');
  assert(m.length > 30, `extrajo demasiado poco: ${m}`);
});
