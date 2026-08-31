// ═══════════════════════════════════════════════════════════════════════════
// S103-D · `pagos-deuna-solicitud` — LA PUERTA DEL RIEL DEUNA
//
// La llama la APP con la sesión de la familia. Crea el intento, pide el código
// a DeUna y devuelve **el código de 6 dígitos con su vencimiento**.
//
// 🔴 ES LA HERMANA DE `pagos-cobro`, CON EL MISMO CONTRATO DE SEGURIDAD — y se
//    escribió leyendo su cuerpo, no de memoria:
//      ① la SESIÓN es la autorización (JWT del usuario, jamás un secreto que
//         una app publicada tendría que guardar);
//      ② 🔴 EL MONTO JAMÁS VIAJA DEL CLIENTE — sale del desglose congelado;
//      ③ pertenencia verificada, con la MISMA respuesta para «no existe» y «es
//         de otro» (si no, es un oráculo de compras ajenas);
//      ④ compuertas server-side;
//      ⑤ credenciales que jamás salen de acá;
//      ⑥ devuelve SEÑAL, jamás «pagado».
//
// 🔴 LA DIFERENCIA DE NATURALEZA (LETRA_DEUNA §1): Nuvei es PULL —debitamos una
//    tarjeta— y DeUna es PUSH: el cliente paga desde SU app. Por eso acá **no
//    hay tarjeta, no hay token y no hay OTP**, y la compuerta #5 de E3 (token
//    vigente) NO APLICA. Ninguna compuerta nueva nace.
//
// ⚠️ NO DESPLEGADA. `pointOfSale` sigue sin dato (S103-D §2ter) y el deploy
//    pide autorización del founder por tanda.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
/* El motivo del rechazo se lee de la forma REAL del error de DeUna, que viene
   anidado. Vive aparte para poder probarlo contra los errores grabados. */
import { motivoDeError } from './_motivo.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const API_KEY = Deno.env.get('DEUNA_API_KEY') ?? '';
const API_SECRET = Deno.env.get('DEUNA_API_SECRET') ?? '';
const POS = Deno.env.get('DEUNA_POINT_OF_SALE') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';

/* 🔴 QA Y PDN SON HOSTS DISTINTOS Y EL AMBIENTE LO DECIDE UN SECRET, jamás una
   bandera del request. *Una bandera compartida entre la prueba y la plata es un
   solo error de configuración de distancia.* (misma ley que el buzón de Nuvei) */
/* 🔴 EL OVERRIDE EXISTE PARA EL SIMULADOR LOCAL, Y TIENE CANDADO:
   **en producción se ignora, siempre.** Sin ese candado, una variable de
   entorno mal puesta podría mandar cobros reales a un host que no es el
   proveedor. *Una perilla de pruebas que también funciona en producción no es
   una perilla de pruebas: es un agujero con buenas intenciones.* */
const OVERRIDE = Deno.env.get('DEUNA_BASE_URL') ?? '';
const BASE = AMBIENTE === 'produccion'
  ? 'https://apis-merchant.pdn.deunalab.com'
  : (OVERRIDE || 'https://apis-merchant.qa.deunalab.com');

/* 🔴 SIN EL `api/`. Medido contra QA: `/merchant/api/v1/payment/*` devuelve 404
   y `/merchant/v1/payment/*` responde. La doc del proveedor dice lo primero.
   *Un 404 acá sería indistinguible de «la transacción no existe», que es un
   caso de negocio real.* (S103-D §2) */
const RUTA = '/merchant/v1/payment';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE || !API_KEY || !API_SECRET || !POS) {
    /* 🔴 EL POS ENTRA EN ESTE GUARD A PROPÓSITO. Sin él el proveedor rebota
       `Hierarchy tree parent not found`, y ese error se lee como un problema de
       la transacción y no como una configuración que falta. *Fallar temprano y
       con nombre propio vale más que fallar tarde con el nombre de otro.* */
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }

  // ── ① LA SESIÓN ES LA AUTORIZACIÓN ────────────────────────────────────────
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json({ ok: false, codigo: 'sin_sesion' }, 401);

  const comoUsuario = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data: u, error: eU } = await comoUsuario.auth.getUser();
  // «No hay sesión» y «no se pudo verificar» son cosas distintas: tratarlas
  // igual esconde una caída del proveedor de auth detrás de un 401 del usuario.
  if (eU) return json({ ok: false, codigo: 'sesion_no_verificable' }, 503);
  if (!u?.user) return json({ ok: false, codigo: 'sin_sesion' }, 401);
  const userId = u.user.id;

  // ── El sujeto: compra, cita, paquete o plan — EXACTAMENTE UNO ─────────────
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const compraId = typeof body.compra_id === 'string' ? body.compra_id : '';
  const citaId = typeof body.cita_id === 'string' ? body.cita_id : '';
  /* S108-B · los dos sujetos de guardería, por el MISMO riel y con el mismo
     contrato: la sesión autoriza, el monto sale del desglose congelado. */
  const bonoId = typeof body.bono_id === 'string' ? body.bono_id : '';
  const menId = typeof body.guarderia_suscripcion_id === 'string'
    ? body.guarderia_suscripcion_id : '';
  const progId = typeof body.programa_contratado_id === 'string'
    ? body.programa_contratado_id : '';
  const hayCompra = UUID_RE.test(compraId);
  const hayCita = UUID_RE.test(citaId);
  const hayBono = UUID_RE.test(bonoId);
  const hayMen = UUID_RE.test(menId);
  const hayProg = UUID_RE.test(progId);
  /* 🔴 Con dos sujetos `hayCompra === hayCita` era un XOR correcto. **Con
     cuatro deja de decir lo que decía** —dos verdaderos lo satisfacen igual—,
     así que se CUENTA. *Una condición exacta para dos y laxa para cuatro no
     rompe ningún test: sigue compilando y deja pasar.* */
  if ([hayCompra, hayCita, hayBono, hayMen, hayProg].filter(Boolean).length !== 1) {
    return json({ ok: false, codigo: 'datos_invalidos' }, 400);
  }

  // 🔴 Si llega un monto, se RECHAZA en vez de ignorarse: ignorarlo dejaría
  //    vivo un cliente que se cree con esa facultad.
  if ('monto' in body || 'amount' in body || 'total' in body) {
    return json({ ok: false, codigo: 'monto_no_se_recibe' }, 400);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  /* S108-B · los dos sujetos de guardería son DEL HOGAR. Mismo predicado que
     sus policies, con el user EXPLÍCITO porque acá `auth.uid()` es NULL. */
  const esDeLaFamilia = async (familiaId: string | null, uid: string) => {
    if (!familiaId) return false;
    const { data } = await db.from('familia_miembro')
      .select('user_id').eq('familia_id', familiaId).eq('user_id', uid)
      .is('hasta', null).maybeSingle();
    return data != null;
  };

  // ── ③ PERTENENCIA ─────────────────────────────────────────────────────────
  let moneda = 'USD';
  if (hayCompra) {
    const { data: c } = await db.from('compras')
      .select('id, user_id, moneda').eq('id', compraId).maybeSingle();
    if (!c || c.user_id !== userId) return json({ ok: false, codigo: 'compra_no_existe' }, 409);
    moneda = c.moneda ?? 'USD';
  }
  /* 🔴 MISMO `else`, MISMO DEFECTO — curado en pareja. Su gemelo en
     `pagos-cobro` se midió contra la edge desplegada: un bono volvía
     `cita_no_existe`. Acá no se esperó a reproducirlo: *el segundo riel es
     justo el que se olvida* (`L` de S105), y dejar uno curado y el otro no es
     cómo los dos rieles terminan diciendo cosas distintas. */
  if (hayCita) {
    const { data: cita } = await db.from('evento_cita_servicio')
      .select('id, mascota_id').eq('id', citaId).maybeSingle();
    if (!cita) return json({ ok: false, codigo: 'cita_no_existe' }, 409);
    /* La variante CON USUARIO EXPLÍCITO: acá corremos con service_role y
       `auth.uid()` es NULL — la original diría que no siempre. */
    const { data: puede } = await db.rpc('user_tiene_acceso_a_mascota_como', {
      p_user_id: userId, p_mascota_id: cita.mascota_id,
    });
    if (puede !== true) return json({ ok: false, codigo: 'cita_no_existe' }, 409);
  }

  /* ═══ 🔴 S108-B · PERTENENCIA Y ESTADO DE LOS DOS DE GUARDERÍA ═════════════
     Espejo EXACTO de `pagos-cobro`. *Dos rieles que verifican la pertenencia
     con criterios distintos son dos respuestas a de quién es el paquete — y la
     lección de S105 es que el segundo riel es justo el que se olvida.* */
  let menPeriodo: string | null = null;
  let menMonto = 0;
  if (hayBono) {
    const { data: b } = await db.from('bonos')
      .select('id, familia_id, estado_pago, estado, pago_expira_en')
      .eq('id', bonoId).maybeSingle();
    if (!b || !(await esDeLaFamilia(b.familia_id, userId))) {
      return json({ ok: false, codigo: 'bono_no_existe' }, 409);
    }
    if (b.estado_pago === 'pagado') return json({ ok: false, codigo: 'bono_ya_pagado' }, 409);
    if (b.estado_pago !== 'pendiente') return json({ ok: false, codigo: 'bono_no_existe' }, 409);
    if (b.pago_expira_en !== null && new Date(b.pago_expira_en).getTime() <= Date.now()) {
      return json({ ok: false, codigo: 'bono_vencido' }, 409);
    }
    if (b.estado !== 'activo') return json({ ok: false, codigo: 'bono_vencido' }, 409);
  }

  /* ═══ 🔴 S109-B · EL PROGRAMA DE ADIESTRAMIENTO ════════════════════════════
     Su arco estaba entero y **le faltaba la puerta de entrada**: nada creaba su
     intento. Pertenencia por `user_id` —el programa se contrata para una
     mascota pero lo compra una persona—, y el mismo hold que el paquete. */
  if (hayProg) {
    const { data: pr } = await db.from('programas_contratados')
      .select('id, user_id, estado, estado_pago, pago_expira_en')
      .eq('id', progId).maybeSingle();
    if (!pr || pr.user_id !== userId) {
      return json({ ok: false, codigo: 'programa_no_existe' }, 409);
    }
    if (pr.estado_pago === 'pagado') return json({ ok: false, codigo: 'programa_ya_pagado' }, 409);
    if (pr.estado_pago !== 'pendiente') return json({ ok: false, codigo: 'programa_no_existe' }, 409);
    if (pr.pago_expira_en !== null && new Date(pr.pago_expira_en).getTime() <= Date.now()) {
      return json({ ok: false, codigo: 'programa_vencido' }, 409);
    }
  }

  if (hayMen) {
    const { data: susc } = await db.from('guarderia_suscripciones')
      .select('id, familia_id, estado, precio_mensual, monto_esperado, periodo_hasta')
      .eq('id', menId).maybeSingle();
    if (!susc || !(await esDeLaFamilia(susc.familia_id, userId))) {
      return json({ ok: false, codigo: 'mensualidad_no_existe' }, 409);
    }
    if (susc.estado !== 'activa') {
      return json({ ok: false, codigo: 'mensualidad_no_activa' }, 409);
    }
    /* ═══ 🔴 «PAGAR ES ARRANCAR» — firma del founder, 31-ago ════════════════
       El período **no existe hasta que la plata entra**: lo ancla el actuador
       en la fecha del intento aprobado. ⇒ En el PRIMER cobro no hay desglose
       congelado que leer, y eso **no es una excepción cómoda a la regla**: el
       número lo congela el MANDATO al firmar (`precio_mensual`), y su techo
       —`monto_esperado`— es literalmente lo que la familia autorizó. *Un techo
       firmado al firmar es tan fuerte como un desglose: los dos son un número
       que la familia vio antes de que nadie cobrara.*

       ⚠️ Por eso acá NO se exige `guarderia_suscripcion_desglose`: esa tabla la
       congela `cobrar_periodo_mensualidad_guarderia` DENTRO del acto, o sea
       siempre después de este cobro. Exigirla haría el primer cobro imposible
       — y sería el guard que bloquea el único camino que tiene que abrir. */
    if (!(Number(susc.precio_mensual) > 0)) {
      return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    }
    /* 🔴 EL TECHO SE VERIFICA ACÁ TAMBIÉN, no sólo en el actuador. *Descubrir
       que se excedió la autorización cuando la plata ya se movió obliga a
       reversar; descubrirlo antes es no cobrar de más.* */
    if (Number(susc.precio_mensual) > Number(susc.monto_esperado)) {
      return json({ ok: false, codigo: 'monto_divergente' }, 409);
    }

    /* El período que se va a anclar. Se calcula con la MISMA regla que
       `cobrar_periodo_mensualidad_guarderia` —hoy, o `periodo_hasta + 1`— para
       que la columna del intento y el plan no cuenten dos historias.
       `hoy_local()` se le pregunta a la base: *derivar la zona acá sería una
       segunda respuesta a qué día es hoy en Guayaquil.* */
    const { data: hoy } = await db.rpc('hoy_local');
    const hoyStr = String(hoy ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hoyStr)) {
      return json({ ok: false, codigo: 'no_se_pudo_completar' }, 500);
    }
    if (susc.periodo_hasta !== null && String(susc.periodo_hasta) >= hoyStr) {
      /* El plan ya tiene mes vigente: no se cobra el siguiente por adelantado.
         *Cobrar dos meses seguidos porque alguien tocó dos veces es la clase de
         cosa que la familia descubre en el resumen de su tarjeta.* */
      return json({ ok: false, codigo: 'periodo_ya_cobrado' }, 409);
    }
    const proximo = susc.periodo_hasta === null
      ? hoyStr
      : new Date(new Date(String(susc.periodo_hasta) + 'T00:00:00Z').getTime() + 86400000)
          .toISOString().slice(0, 10);

    /* 🔴 COMPUERTA 0 DE ESTE SUJETO: un intento en vuelo frena. *Sin esto, dos
       toques seguidos disparan dos débitos y el segundo llega antes de que el
       primero confirme.* */
    const { data: intentos } = await db.from('pagos_intentos')
      .select('estado').eq('guarderia_suscripcion_id', menId)
      .in('estado', ['iniciado', 'pendiente']);
    if ((intentos ?? []).length > 0) {
      return json({ ok: false, codigo: 'pago_en_proceso' }, 409);
    }
    /* ═══ 🔴 LA COMPUERTA PRE-COBRO DEL MES ════════════════════════════════
       Medido con un cobro REAL (`DF-2107864`, $100): el débito salió y el acto 2
       se cayó por `duplicate key` de `(mascota, fecha)` ⇒ **plata tomada, plan
       sin arrancar, cero días.** El freno existía —«cobrar un mes y no poder dar
       todos sus días es vender lo que no se tiene»— **del lado equivocado del
       cobro**. *Un freno que sólo puede actuar cuando la plata ya se movió no
       evita vender lo que no se tiene: obliga a devolverlo.*
       La compuerta ENSAYA el acto real en una subtransacción que se deshace, así
       que no puede divergir de él. */
    const { data: gm } = await db.rpc('verificar_compuertas_mensualidad_guarderia', {
      p_suscripcion_id: menId, p_periodo_desde: proximo,
    });
    const gate = (gm ?? {}) as Record<string, unknown>;
    if (gate.ok !== true) {
      return json({ ok: false, codigo: gate.codigo ?? 'mes_no_comprometible',
                    detalle: gate.causa ?? null }, 409);
    }

    menPeriodo = proximo;
    menMonto = Number(susc.precio_mensual);
  }

  // ── ② EL MONTO SALE DEL DESGLOSE CONGELADO ────────────────────────────────
  let monto = 0, pedidoDelIntento: string | null = null;
  if (hayCompra) {
    const { data: d } = await db.from('compra_desglose')
      .select('pedido_id, total').eq('compra_id', compraId);
    if (!d || d.length === 0) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = d.reduce((a, r) => a + Number(r.total ?? 0), 0);
    pedidoDelIntento = d[0].pedido_id;
  }
  /* 🔴 El segundo `else` de la misma clase, curado en pareja con su gemelo de
     `pagos-cobro`. Ver el comentario largo allá. */
  if (hayCita) {
    const { data: d } = await db.from('cita_desglose')
      .select('total, moneda').eq('cita_id', citaId).maybeSingle();
    // Fail-closed: sin desglose congelado no hay cobro. El desglose es lo que
    // se le prometió al cliente al reservar.
    if (!d) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = Number(d.total ?? 0);
    moneda = d.moneda ?? 'USD';
  }
  if (hayBono) {
    const { data: d } = await db.from('bono_desglose')
      .select('total, moneda').eq('bono_id', bonoId).maybeSingle();
    if (!d) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = Number(d.total ?? 0);
    moneda = d.moneda ?? 'USD';
  }
  if (hayMen) {
    /* Espejo de `pagos-cobro`: el número sale del mandato («pagar es arrancar»)
       y la moneda de la cuenta comercial. Sin moneda no se cobra. */
    const { data: cta } = await db.from('guarderia_suscripciones')
      .select('prestadores(cuentas_comerciales(moneda))').eq('id', menId).maybeSingle();
    const m = (cta as { prestadores?: { cuentas_comerciales?: { moneda?: string } } } | null)
      ?.prestadores?.cuentas_comerciales?.moneda;
    if (!m) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    moneda = m;
    monto = menMonto;
  }

  if (hayProg) {
    const { data: d } = await db.from('programa_desglose')
      .select('total, moneda').eq('programa_contratado_id', progId).maybeSingle();
    if (!d) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = Number(d.total ?? 0);
    moneda = d.moneda ?? 'USD';
  }
  /* 🔴 Se enumera: con cuatro sujetos el ternario encadenado deja al último
     haciendo de `else`, y el `else` es cómo un sujeto viaja con la referencia
     del otro. */
  const sujeto = hayCompra ? compraId : hayCita ? citaId : hayBono ? bonoId : hayMen ? menId : progId;
  if (!UUID_RE.test(sujeto)) return json({ ok: false, codigo: 'datos_invalidos' }, 400);
  if (!(monto > 0)) return json({ ok: false, codigo: 'monto_invalido' }, 409);

  // ── ④ COMPUERTAS SERVER-SIDE ──────────────────────────────────────────────
  /* La #5 (token vigente) NO APLICA: en DeUna no hay tarjeta. Se declara en
     `no_evaluables` en vez de callarse — *una compuerta que no puede evaluar y
     calla es peor que una que falta: la que falta se nota* (§5.0). */
  if (hayCompra) {
    const { data: g } = await db.rpc('verificar_compuertas_pre_cobro', {
      p_compra_id: compraId,
      p_token: null,
      /* 🔴 LA COMPUERTA 5 NO APLICA A ESTE RIEL, y hasta hoy se aplicaba igual.
         `LETRA_DEUNA` §3.1 lo decía desde su v1.0 —*«todas menos la #5
         (tarjeta/token vigente), que NO APLICA: no hay tarjeta»*— pero la
         función no tenía cómo saberlo: la corría siempre, y esta puerta le
         mandaba `p_token: null`, **que es exactamente el valor que rechaza.**

         ⇒ **la puerta de DeUna no podía pasar su propia compuerta, y nunca
         pudo**: cero intentos `deuna` en toda la base. *No es que falló hoy;
         es que hoy fue el primer día que llegamos lo bastante lejos para
         tocarlo* — los frenos de antes (reserva vencida, desglose sin
         congelar) lo tapaban.

         🔴 SE PASA EXPLÍCITO Y NO SE APROVECHA EL DEFAULT: el default es
         `true`, así que omitirlo dejaría el bug. Y decirlo por nombre hace
         legible la INTENCIÓN —«este riel no tiene tarjeta»— en vez de un
         silencio que el próximo lector tendría que deducir.
         *`token_ausente` sigue vivo para el riel de tarjeta, donde sí es un
         defecto real.* */
      p_exige_token: false,
    });
    const gate = (g ?? {}) as Record<string, unknown>;
    if (gate.ok !== true) {
      return json({ ok: false, codigo: gate.codigo ?? 'no_se_pudo_completar',
                    no_evaluables: gate.no_evaluables ?? [] }, 409);
    }
  }

  // ── LA REFERENCIA CORTA ───────────────────────────────────────────────────
  /* 🔴 <= 20 chars: el UUID de 36 NO CABE (LETRA_DEUNA §4). La genera la base
     por secuencia ofuscada — única por construcción, y **se resuelve a intento
     POR TABLA, jamás parseando el string**. */
  const { data: ref, error: eR } = await db.rpc('deuna_nueva_referencia');
  if (eR || typeof ref !== 'string') return json({ ok: false, codigo: 'no_se_pudo_completar' }, 500);

  // ── EL INTENTO, ANTES DE DISPARAR ─────────────────────────────────────────
  /* Si pedimos el código y perdemos la respuesta, esta fila es lo único que
     prueba que se pidió. Sin ella el caso ④ (no llega ninguno) es indetectable:
     no habría contra qué barrer. */
  const { data: intento, error: eI } = await db.from('pagos_intentos').insert({
    pedido_id: pedidoDelIntento,
    cita_id: hayCita ? citaId : null,
    compra_id: hayCompra ? compraId : null,
    bono_id: hayBono ? bonoId : null,
    guarderia_suscripcion_id: hayMen ? menId : null,
    guarderia_suscripcion_periodo: hayMen ? menPeriodo : null,
    programa_contratado_id: hayProg ? progId : null,
    proveedor: 'deuna', forma: 'codigo_push', estado: 'iniciado',
    proveedor_referencia: sujeto, referencia_corta: ref,
    monto, moneda,
    clave_idempotencia: `deuna:${sujeto}:${ref}`,
    // La sesión ES el pagador (LETRA_SALDO §2). Explícito y jamás por DEFAULT
    // auth.uid(): acá corremos con service_role y ahí es NULL.
    pagador_user_id: userId, pagador_origen: 'sesion',
  }).select('id').single();
  if (eI) return json({ ok: false, codigo: 'no_se_pudo_completar' }, 500);

  // ── ⑤ LA SOLICITUD A DEUNA ────────────────────────────────────────────────
  /* 🔑 LA FORMA DEL CUERPO, MEDIDA CONTRA QA CAMPO POR CAMPO (S103-D §2bis):
       · `format: "5"` + `qrType: "dynamic"` ⇒ una llamada devuelve código, QR
         y deeplink. **v1 muestra SOLO el código** (firma ① del founder); QR y
         deeplink quedan en el crudo como reserva sin pantalla.
       · `detail` ≤ 50 y SIN dato personal (no se le muestra al cliente).
       · `expiredTime` es **NÚMERO**, jamás string.
       · 🔴 **`currency` NO DEBE EXISTIR** — rebota el request entero. Es el
         campo que cualquiera agregaría por analogía con Nuvei, que sí lo lleva. */
  let status = 0; let crudo = ''; let resp: Record<string, unknown> = {};
  try {
    const r = await fetch(`${BASE}${RUTA}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY, 'x-api-secret': API_SECRET,
      },
      body: JSON.stringify({
        pointOfSale: POS,
        qrType: 'dynamic',
        format: '5',
        amount: Number(monto.toFixed(2)),
        detail: `e-PetPlace ${sujeto.slice(0, 8)}`,   // ≤50, sin dato personal
        internalTransactionReference: ref,
      }),
    });
    status = r.status;
    /* 🔴 SE PARSEA EL TEXTO COMPLETO Y RECIÉN DESPUÉS SE TRUNCA PARA EL REGISTRO.
       Al revés estaba, y costó la primera corrida del riel: `slice(0, 4000)`
       **antes** de `JSON.parse` **parte el JSON al medio** —la respuesta mide
       **7844 bytes** porque trae el QR en base64— y el `catch` mudo dejaba
       `resp` vacío.

       ⇒ El rebote decía **`sin transactionId · sin numericCode`**, o sea
       acusaba al proveedor de no mandar lo que sí había mandado. *Un truncado
       de log convertido en veredicto sobre un tercero.*

       **Se probó con la MISMA referencia, monto y detail por curl: DeUna
       devolvió el código.** El request nunca estuvo mal; el defecto era
       nuestro y estaba a dos líneas del parseo. */
    const textoCompleto = await r.text();
    try { resp = JSON.parse(textoCompleto); } catch { /* queda el crudo */ }
    /* El truncado sigue existiendo —el QR no aporta nada a un log y ocupa
       todo— pero **ya no decide nada**: es registro, no fuente. */
    crudo = textoCompleto.slice(0, 4000);
  } catch (e) {
    /* Red caída ≠ rechazo. El intento queda en vuelo y el barrido lo encuentra
       — no se cierra como rechazado por no haber podido preguntar. */
    await db.from('pagos_intentos').update({
      motivo_rechazo: `red: ${String(e).slice(0, 200)}`,
    }).eq('id', intento.id);
    return json({ ok: false, codigo: 'sin_respuesta' }, 504);
  }

  const d = (resp.data ?? resp) as Record<string, unknown>;
  const txId = typeof d.transactionId === 'string' ? d.transactionId : null;
  const codigo = d.numericCode != null ? String(d.numericCode) : null;

  if (status < 200 || status >= 300 || !txId || !codigo) {
    /* 🔴 EL MOTIVO JAMÁS QUEDA NULL (L-316), con `http_<status>` de último
       recurso. Un rechazo sin motivo obliga a abrir el crudo, y nadie lo abre
       cuando hay una explicación plausible a mano. */
    const faltantes = [!txId && 'sin transactionId', !codigo && 'sin numericCode']
      .filter(Boolean).join(' · ');
    const motivo = [motivoDeError(resp, status), faltantes]
      .filter(Boolean).join(' | ').slice(0, 400);
    await db.from('pagos_intentos').update({
      estado: 'rechazado', motivo_rechazo: motivo,
      cerrado_en: new Date().toISOString(), payload_crudo: resp,
    }).eq('id', intento.id);
    return json({ ok: false, codigo: 'no_se_pudo_completar', motivo }, 409);
  }

  /* 🔴 EL RELOJ DEL CÓDIGO: 3 minutos. **Es del proveedor y no lo elegimos.**
     ⚠️ TENSIÓN DECLARADA (S103-D §8): su doc dice «3 min fijos, no
     configurables», pero el request acepta `expiredTime`. Hasta que soporte
     conteste (pregunta #10), **el vencimiento se toma de la RESPUESTA si viene,
     y sólo si no viene se asume 3 min** — *preferir el dato del proveedor a
     nuestro supuesto es lo que evita que la cuenta regresiva mienta.* */
  const expiraProveedor = typeof d.expiredAt === 'string' ? Date.parse(d.expiredAt) : NaN;
  const expira = new Date(Number.isFinite(expiraProveedor)
    ? expiraProveedor : Date.now() + 3 * 60_000);

  await db.from('pagos_intentos').update({
    estado: 'pendiente',
    proveedor_transaction_id: txId,
    codigo_numerico: codigo,
    codigo_expira_en: expira.toISOString(),
    payload_crudo: resp,   // QR y deeplink viven acá: reserva sin pantalla
  }).eq('id', intento.id);

  /* 🔴 ⑥ SEÑAL, JAMÁS «PAGADO». Que exista el código no significa que alguien
     haya pagado: eso lo dice el webhook verificado, o el barrido. */
  return json({
    ok: true,
    intento_id: intento.id,
    codigo,                                  // los 6 dígitos, para la pantalla
    expira_en: expira.toISOString(),         // el reloj DEL CÓDIGO
    monto, moneda,
    estado: 'esperando_pago',
  });
});
