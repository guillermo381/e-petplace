#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// S103-D · SIMULADOR LOCAL — DeUna **y** Supabase, para probar
//          `pagos-deuna-solicitud` de punta a punta sin red y sin base.
//
// 🔴 POR QUÉ TAMBIÉN SIMULA SUPABASE, y no es capricho: la pista A pidió veda
//    76(g) —**cero escrituras que creen filas en `pagos_intentos`**— y un E2E
//    real crearía una por corrida. Apuntando `SUPABASE_URL` acá, el E2E corre
//    entero **sin tocar la base**. *La veda no se rodea: se respeta y se
//    prueba igual.*
//
// 🔴 QUÉ ES MEDIDO Y QUÉ ES SINTÉTICO — marcado abajo campo por campo:
//    · La respuesta de `payment/info` es **REAL** (grabada de QA el 22-ago).
//    · La respuesta de `payment/request` es **SINTÉTICA**: nunca pudimos
//      obtener una —exige `pointOfSale`—. Está construida sobre los nombres
//      que la doc del proveedor declara. **El lunes se reemplaza por la real y
//      este simulador es lo primero que se corrige.**
//    · Los errores 400 del validador **SON REALES**, copiados literales.
//
//    uso:  node scripts/deuna/simulador-local.mjs [puerto]
// ═══════════════════════════════════════════════════════════════════════════

import { createServer } from 'node:http';

const PUERTO = Number(process.argv[2] ?? 8787);

// ── LO QUE EL SIMULADOR ACEPTA COMO VÁLIDO (medido contra QA) ──────────────
const POS_VALIDO = '9999';                 // el que el E2E usa
const REF_MAX = 20;                        // "at most 20 characters long" — REAL
const DETAIL_MAX = 50;                     // "shorter than or equal to 50"  — REAL

const registro = [];                        // lo que pasó, para el reporte

/* ═══ 🔴 EL SIMULADOR RECUERDA LO QUE CREÓ — y esto lo destapó el ensayo ═════
   La v1 devolvía SIEMPRE el fantasma en `/info`, existiera o no la
   transacción. Consecuencia medida en el primer ensayo en seco: el paso del
   `amount` salió **❌**, y ese ❌ **se lee como una medición** — alguien podría
   creer que el supuesto ya quedó refutado cuando lo único que pasó es que el
   instrumento no sabe distinguir.
   *Un simulador que contesta siempre lo mismo no simula: convierte el ensayo
   en una tautología, y encima con veredicto.*
   ⇒ Ahora guarda lo que creó y responde distinto para lo suyo. **Lo que NO
   sabe —cómo se ve una transacción real— sigue sin saberlo, y por eso el
   ensayo NO reemplaza al día 1: lo prepara.** */
const creadas = new Map();   // transactionId → { ref, amount, creado }
let casoActivo = '';         // escenario forzado, vía /sim/caso
let seq = 0;

// ⚠️ SINTÉTICA — nunca observamos una respuesta exitosa de payment/request.
const respuestaRequest = (ref) => ({
  transactionId: `11111111-2222-4333-8444-${String(++seq).padStart(12, '0')}`,
  numericCode: '483920',                    // ⚠️ SINTÉTICO (la firma ① depende de este nombre)
  internalTransactionReference: ref,
  qr: 'data:image/png;base64,SIMULADO',     // ⚠️ SINTÉTICO — reserva sin pantalla
  deeplink: 'deuna://pay/SIMULADO',         // ⚠️ SINTÉTICO — reserva sin pantalla
  amount: 24.5,
  status: 'PENDING',
});

// ✅ REAL — grabada de QA el 22-ago-2026 (transacción inexistente).
const FANTASMA_REAL = {
  status: 'PENDING', internalTransactionReference: '', amount: 0,
  transactionId: '00000000-0000-4000-8000-000000000000', transferNumber: '',
  date: '', branchId: '', posId: '', currency: 'USD',
  description: 'Your payment is being synchronized. Please check back in a moment.',
  ordererName: '', ordererIdentification: '',
};

const json = (res, code, cuerpo) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(cuerpo));
};

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const ruta = url.pathname;
  let cuerpo = {};
  if (req.method !== 'GET') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    try { cuerpo = JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { /* vacío */ }
  }
  registro.push({ metodo: req.method, ruta, cuerpo });

  /* ═══ 🔴 FORZAR ESCENARIOS — para EJERCER los códigos, no sólo declararlos ══
     El E2E ejercía 6 de los 12 códigos de la puerta. Los otros 6 estaban
     *declarados* (contrato), *tipados* (wrapper) y *con voz* (pantalla)… y
     **nadie había visto a la puerta emitirlos**.
     *Un código con contrato, tipo y voz se ve exactamente igual que uno que
     funciona — hasta que alguien lo provoca.*
     🔴 Se fuerza por un ENDPOINT DE CONTROL y no por header: la puerta hace
     sus propias llamadas a Supabase y **no propaga headers ajenos** — un
     header puesto en la petición de entrada no llega a la de salida. */
  if (ruta === '/sim/caso') {                    // POST {"caso":"..."} → arma
    casoActivo = String(cuerpo.caso ?? '');
    return json(res, 200, { caso: casoActivo || '(ninguno)' });
  }
  const caso = casoActivo;
  if (ruta === '/rest/v1/pagos_intentos') console.log('[sim] accept=', req.headers['accept'], '| prefer=', req.headers['prefer']);

  // ══════════ DEUNA ══════════
  if (ruta === '/merchant/v1/payment/request') {
    // ✅ Las credenciales: el gateway rechaza ANTES que el esquema (medido).
    if (!req.headers['x-api-key'] || !req.headers['x-api-secret']) {
      return json(res, 401, { statusCode: 401,
        message: 'Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.' });
    }
    // ✅ REALES: los mensajes del validador, campo por campo, en su orden.
    if ('currency' in cuerpo) {
      return json(res, 400, { statusCode: 400, message: { response: {
        message: ['property currency should not exist'], error: 'Bad Request', statusCode: 400 } } });
    }
    if (!cuerpo.pointOfSale || !/^\d+$/.test(String(cuerpo.pointOfSale))) {
      return json(res, 400, { statusCode: 400, message: { response: {
        message: ['pointOfSale must contain only numeric characters.', 'pointOfSale should not be empty'],
        error: 'Bad Request', statusCode: 400 } } });
    }
    if (String(cuerpo.detail ?? '').length > DETAIL_MAX) {
      return json(res, 400, { statusCode: 400, message: { response: {
        message: [`detail must be shorter than or equal to ${DETAIL_MAX} characters`],
        error: 'Bad Request', statusCode: 400 } } });
    }
    if (String(cuerpo.internalTransactionReference ?? '').length > REF_MAX) {
      return json(res, 400, { statusCode: 400, message: { response: {
        message: [`internalTransactionReference must be at most ${REF_MAX} characters long.`],
        error: 'Bad Request', statusCode: 400 } } });
    }
    if ('expiredTime' in cuerpo && typeof cuerpo.expiredTime !== 'number') {
      return json(res, 400, { statusCode: 400, message: { response: {
        message: ['expiredTime must be a number conforming to the specified constraints', 'expired-time is invalid'],
        error: 'Bad Request', statusCode: 400 } } });
    }
    if (String(cuerpo.pointOfSale) !== POS_VALIDO) {
      // ✅ REAL: el error de jerarquía, con su forma exacta.
      return json(res, 400, { statusCode: 400, message: { response: {
        message: 'Entity does not exist in system', statusCode: 400,
        errors: [{ code: 2000, reason: `Hierarchy tree parent ${cuerpo.pointOfSale}  not found` }] } } });
    }
    {
      const r = respuestaRequest(cuerpo.internalTransactionReference);
      /* 🔴 Cada request nace con su PROPIO transactionId. La v1 devolvía uno
         fijo, y por eso el paso de regeneración salía «mismo txId ⇒ idempotente
         por referencia» — **una conclusión falsa fabricada por el instrumento**,
         sobre la pregunta §12.6 que el plan manda MEDIR. */
      creadas.set(r.transactionId, {
        ref: cuerpo.internalTransactionReference,
        amount: Number(cuerpo.amount), creado: new Date().toISOString(),
      });
      return json(res, 200, r);
    }
  }

  if (ruta === '/merchant/v1/payment/info') {
    // ✅ REAL: idType es STRING y el campo lleva el typo del proveedor.
    if (!['0', '1'].includes(String(cuerpo.idType))) {
      return json(res, 400, { statusCode: 400, message: { response: {
        message: ['idType must be one of the following string values: 0, 1'],
        error: 'Bad Request', statusCode: 400 } } });
    }
    if (!cuerpo.idTransacionReference) {
      return json(res, 400, { statusCode: 400, message: { response: {
        message: ['idTransacionReference is required.'], error: 'Bad Request', statusCode: 400 } } });
    }
    /* ¿La conoce? Por su id (`"0"`) o por nuestra referencia (`"1"`). */
    const id = String(cuerpo.idTransacionReference);
    const hit = String(cuerpo.idType) === '1'
      ? [...creadas.entries()].find(([, v]) => v.ref === id)
      : (creadas.has(id) ? [id, creadas.get(id)] : undefined);

    if (!hit) {
      // ✅ NO la conoce → el fantasma REAL, tal cual QA lo devolvió.
      const eco = String(cuerpo.idType) === '1'
        ? { internalTransactionReference: id, transactionId: '' }
        : { transactionId: id };
      return json(res, 200, { ...FANTASMA_REAL, ...eco });
    }

    /* ⚠️ SINTÉTICO Y ES EL CAMPO MÁS DELICADO DEL SIMULADOR: qué devuelve una
       transacción que SÍ existe y no se pagó. **Nunca lo observamos** — es
       justamente el PASO 1 del guion del día 1.
       Acá se asume lo plausible (trae su monto y su fecha) **para que el
       ensayo pueda correr**, y el guion lo dice: *el ensayo no responde esa
       pregunta, la deja lista para preguntarla.* */
    const [txid, v] = hit;
    return json(res, 200, {
      ...FANTASMA_REAL, status: 'PENDING',
      internalTransactionReference: v.ref, transactionId: txid,
      amount: v.amount, date: v.creado, transferNumber: '',
      description: 'SINTETICO: transaccion conocida por el simulador',
    });
  }

  /* 🔴 `/refund` — el ensayo lo destapó: la v1 no lo tenía y devolvía 404, que
     el guion leía como «rebota, correcto». *Un 404 de ruta inexistente y un
     rechazo de negocio se ven parecidos en una tabla de veredictos.* */
  if (ruta === '/merchant/v1/payment/refund') {
    if (!['0', '1'].includes(String(cuerpo.idType))) {
      return json(res, 400, { statusCode: 400, message: { response: {
        message: ['idType must be one of the following string values: 0, 1'],
        error: 'Bad Request', statusCode: 400 } } });
    }
    // ✅ REAL: el literal del rechazo, que confirma la ventana de mismo día.
    return json(res, 404, { statusCode: 404, message: 'Http Exception', error: { response: {
      cancelError: `Transaction not found with transactionId: ${cuerpo.idTransacionReference}.`,
      reverseError: `The transfer number ${cuerpo.idTransacionReference} is invalid, not found, or only valid for the purchase day. Please verify the number and try again.` } } });
  }

  // ══════════ SUPABASE (lo mínimo que la función toca) ══════════
  if (ruta === '/auth/v1/user') {
    // `sesion_no_verificable`: auth existe pero no contesta bien. NO es 401.
    if (caso === 'auth_caido') return json(res, 500, { message: 'auth down' });
    return json(res, 200, { id: 'u-simulado-0001', email: 'familia@simulado.test' });
  }
  if (ruta.startsWith('/rest/v1/rpc/')) {
    const fn = ruta.replace('/rest/v1/rpc/', '');
    if (fn === 'deuna_nueva_referencia') return json(res, 200, 'EPsim0000a1');
    if (fn === 'verificar_compuertas_pre_cobro') {
      return json(res, 200, { ok: true, no_evaluables: ['cobertura'] });
    }
    if (fn === 'user_tiene_acceso_a_mascota_como') return json(res, 200, true);
    return json(res, 200, null);
  }
  if (ruta === '/rest/v1/compras') {
    // `compra_no_existe`: no existe O es de otro — la MISMA respuesta a
    // propósito, para no ser un oráculo de compras ajenas.
    if (caso === 'compra_ajena') return json(res, 200, [{ id: 'x', user_id: 'OTRO', moneda: 'USD' }]);
    if (caso === 'compra_no_existe') return json(res, 200, []);
    return json(res, 200, [{ id: url.searchParams.get('id')?.replace('eq.', ''),
                             user_id: 'u-simulado-0001', moneda: 'USD' }]);
  }
  if (ruta === '/rest/v1/evento_cita_servicio') {
    if (caso === 'cita_no_existe') return json(res, 200, []);
    return json(res, 200, [{ id: url.searchParams.get('id')?.replace('eq.', ''),
                             mascota_id: 'm-simulada-01' }]);
  }
  if (ruta === '/rest/v1/cita_desglose') {
    if (caso === 'desglose_incompleto') return json(res, 200, []);
    if (caso === 'monto_cero') return json(res, 200, [{ total: 0, moneda: 'USD' }]);
    return json(res, 200, [{ total: 24.5, moneda: 'USD' }]);
  }
  if (ruta === '/rest/v1/compra_desglose') {
    // `desglose_incompleto`: fail-closed — sin desglose congelado no hay cobro.
    if (caso === 'desglose_incompleto') return json(res, 200, []);
    // `monto_invalido`: el desglose EXISTE y su total no es > 0. Defecto nuestro.
    if (caso === 'monto_cero') return json(res, 200, [{ pedido_id: 'p1', subtotal: 0,
                                                       impuesto: 0, envio: 0, total: 0 }]);
    return json(res, 200, [{ pedido_id: 'ped-simulado-01', subtotal: 24.5,
                             impuesto: 0, envio: 0, total: 24.5 }]);
  }
  if (ruta === '/rest/v1/pagos_intentos') {
    // 🔴 NO PERSISTE NADA. Es exactamente el punto: la veda de A dice cero
    //    filas nuevas en esta tabla, y acá no nace ninguna.
    if (req.method === 'POST') {
      /* PostgREST con `.single()` manda `Accept: application/vnd.pgrst.object+json`
         y responde UN OBJETO, no un array. Devolver el array hacía que
         `intento.id` saliera `undefined` y la puerta contestara **sin
         `intento_id`** — sin fallar. *Lo cazó el E2E, no la lectura del
         código: mirando el archivo, `.select('id').single()` se ve bien.* */
      const single = String(req.headers['accept'] ?? '').includes('pgrst.object');
      const fila = { id: 'intento-simulado-01' };
      return json(res, 201, single ? fila : [fila]);
    }
    return json(res, 200, []);              // PATCH / GET
  }

  json(res, 404, { statusCode: 404, message: 'Resource not found' });
});

servidor.listen(PUERTO, () => {
  console.log(`simulador DeUna+Supabase en http://localhost:${PUERTO}`);
  console.log(`  pointOfSale valido: ${POS_VALIDO}`);
});

process.on('SIGTERM', () => {
  console.log(`\n${registro.length} peticiones recibidas`);
  servidor.close(() => process.exit(0));
});
