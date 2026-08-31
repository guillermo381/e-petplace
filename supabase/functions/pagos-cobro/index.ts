// ═══════════════════════════════════════════════════════════════════════════
// S101-B · `pagos-cobro` — EL COBRO. **Es PRODUCTO, no andamio.**
//
// La llama la APP, con la sesión de la familia. Es la única puerta por la que
// se dispara un débito desde el cliente.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 🔴 EL CONTRATO DE SEGURIDAD, ENTERO — y cada punto tiene su porqué      │
// │                                                                         │
// │ ① AUTORIZA EL JWT DEL USUARIO. No un secreto compartido, no un handle. │
// │    *A diferencia de la página del alta —que corre en un navegador sin  │
// │    sesión— acá HAY sesión, y esa sesión ES la autorización.* Un secreto │
// │    compartido acá sería un secreto que la app tendría que llevar, y una │
// │    app publicada no guarda secretos.                                    │
// │                                                                         │
// │ ② 🔴 EL MONTO JAMÁS VIAJA DEL CLIENTE. La app manda IDS y nada más.    │
// │    El monto se LEE del desglose congelado, server-side.                 │
// │    *Si el monto llegara del cliente, la compuerta 2 estaría verificando │
// │    un número contra sí mismo — y un cobro por un monto que no es el     │
// │    nuestro es el defecto más caro posible.*                             │
// │                                                                         │
// │ ③ PERTENENCIA: la compra y la tarjeta son del usuario del JWT, o corta. │
// │    *Sin esto, un id ajeno alcanzaría para cobrarle a otro.*             │
// │                                                                         │
// │ ④ COMPUERTAS SERVER-SIDE, con el candado de idempotencia contra         │
// │    intentos REALES. Las de la app son para hablar temprano; **las que   │
// │    protegen son estas**, porque el cliente no las puede saltear.        │
// │                                                                         │
// │ ⑤ El débito con las credenciales SERVER, que jamás salen de acá.        │
// │                                                                         │
// │ ⑥ Devuelve SEÑAL OPTIMISTA tipada. **Nunca dice «pagado»:** eso lo dice │
// │    el webhook, o el barrido mismo-día.                                  │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ⚠️ **ROJO ESPERADO (firma del founder):** hoy el débito rebota en
//    `order.vat` — staging aparenta exigir `vat > 0` y el catálogo es
//    `EC_IVA_0`. **No es nuestro código, está en `D-852`, y NO se
//    re-diagnostica.** Se construye igual: el flujo tiene que existir entero
//    para que el día que el vat se destrabe no quede nada por hacer.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { verificarIva, type LineaIva } from '../_shared/iva.ts';
import { crypto } from 'jsr:@std/crypto@1';
import { encodeHex } from 'jsr:@std/encoding@1/hex';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const BASE = AMBIENTE === 'produccion'
  ? 'https://ccapi.paymentez.com'
  : 'https://ccapi-stg.paymentez.com';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


/** Ventana de 15 s ⇒ **se genera en el momento**, jamás se cachea. */
async function authToken(): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const h = encodeHex(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(`${APP_KEY}${ts}`)));
  return btoa(`${APP_CODE};${ts};${h}`);
}

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE || !APP_CODE || !APP_KEY) {
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }

  // ── ① LA SESIÓN ES LA AUTORIZACIÓN ────────────────────────────────────────
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json({ ok: false, codigo: 'sin_sesion' }, 401);

  const comoUsuario = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data: u, error: eU } = await comoUsuario.auth.getUser();
  /* 🔴 El error se distingue del ausente: «no hay sesión» y «la sesión no se
     pudo verificar» son cosas distintas, y tratarlas igual esconde una caída
     del proveedor de auth detrás de un 401 que parece del usuario. */
  if (eU) return json({ ok: false, codigo: 'sesion_no_verificable' }, 503);
  if (!u?.user) return json({ ok: false, codigo: 'sin_sesion' }, 401);
  const userId = u.user.id;

  // ── La app manda IDS. Nada más. ───────────────────────────────────────────
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  /* ═══ 🔴 S101-C · EL SUJETO DEL COBRO — compra O cita, EXACTAMENTE UNO ═════
     La letra `LETRA_PAGO_CITAS` §1 lo dice y el motor lo cumple sin
     reescribirse: **la cita entra como lo que es, jamás disfrazada de compra.**
     Todo lo que sigue —pertenencia, monto del desglose congelado, compuertas,
     intento antes de disparar, débito, señal optimista— **es idéntico**. Lo
     único que cambia es qué objeto se resuelve. */
  const compraId = typeof body.compra_id === 'string' ? body.compra_id : '';
  const citaId = typeof body.cita_id === 'string' ? body.cita_id : '';
  /* ═══ 🔴 S108-B · LOS DOS SUJETOS DE GUARDERÍA ═════════════════════════════
     El paquete (`bonos`) y la mensualidad (`guarderia_suscripciones`) entran
     por esta misma puerta. **Nada del contrato de seguridad cambia**: la sesión
     autoriza, el monto sale del desglose congelado, la pertenencia se verifica
     acá. Lo único que cambia es qué objeto se resuelve. */
  const bonoId = typeof body.bono_id === 'string' ? body.bono_id : '';
  const menId = typeof body.guarderia_suscripcion_id === 'string'
    ? body.guarderia_suscripcion_id : '';
  const progId = typeof body.programa_contratado_id === 'string'
    ? body.programa_contratado_id : '';
  const tarjetaId = typeof body.tarjeta_id === 'string' ? body.tarjeta_id : '';
  const hayCompra = UUID_RE.test(compraId);
  const hayCita = UUID_RE.test(citaId);
  const hayBono = UUID_RE.test(bonoId);
  const hayMen = UUID_RE.test(menId);
  const hayProg = UUID_RE.test(progId);
  /* 🔴 «Exactamente uno» también en la puerta, no solo en el CHECK: *un
     llamador que manda los dos no está pidiendo dos cosas — está pidiendo algo
     que no existe, y adivinar cuál quiso es cómo se cobra el objeto
     equivocado.*

     ⚠️ Con dos sujetos esto era `hayCompra === hayCita`, que es un XOR
     disfrazado de igualdad. **Con cuatro esa forma deja de significar lo que
     decía** —dos verdaderos la satisfacen igual—, así que se CUENTA. *Una
     condición que era exacta para dos y silenciosamente laxa para cuatro es la
     clase de cosa que no rompe ningún test: sigue compilando y deja pasar.* */
  const cuantosSujetos = [hayCompra, hayCita, hayBono, hayMen, hayProg].filter(Boolean).length;
  if (cuantosSujetos !== 1 || !UUID_RE.test(tarjetaId)) {
    return json({ ok: false, codigo: 'datos_invalidos' }, 400);
  }
  /* 🔴 Si alguna vez llega un `monto`, es señal de que un llamador cree que
     puede fijarlo. Se rechaza en vez de ignorarlo: *ignorarlo dejaría vivo un
     cliente que se cree con esa facultad, y el día que el server confíe, cobra
     lo que el cliente diga.* */
  if ('monto' in body || 'amount' in body || 'total' in body) {
    return json({ ok: false, codigo: 'monto_no_se_recibe' }, 400);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  /* ═══ 🔴 S108-B · ¿ES DE ESTA FAMILIA? ═════════════════════════════════════
     Los dos sujetos de guardería pertenecen al HOGAR: el paquete se compra sin
     mascota y la mensualidad la firma un adulto para la familia. Se pregunta
     con el MISMO predicado que sus policies —`familia_miembro` con
     `hasta IS NULL`—, **copiado y medido**: `user_es_de_familia` no existe en
     esta base. *Atar la pertenencia a `user_id` dejaría a la pareja sin poder
     pagar el paquete de su propia casa.*

     ⚠️ Vive acá adentro, cerrado sobre `db`, y no a nivel de módulo: `db` corre
     con `service_role` y `auth.uid()` es NULL — el user tiene que viajar
     EXPLÍCITO. *Es la misma trampa del `uid` del proveedor: una función
     correcta que, llamada desde otro lado, contesta otra cosa.* */
  const esDeLaFamilia = async (familiaId: string | null, uid: string) => {
    if (!familiaId) return false;
    const { data } = await db.from('familia_miembro')
      .select('user_id').eq('familia_id', familiaId).eq('user_id', uid)
      .is('hasta', null).maybeSingle();
    return data != null;
  };

  // ── ③ PERTENENCIA ─────────────────────────────────────────────────────────
  /* 🔴 La respuesta es la MISMA para «no existe» y «es de otro» — en los dos
     sujetos. *Distinguirlas convertiría esto en un oráculo de compras o de
     citas ajenas.* */
  let moneda = 'USD';
  if (hayCompra) {
    const { data: compra } = await db.from('compras')
      .select('id, user_id, moneda').eq('id', compraId).maybeSingle();
    if (!compra || compra.user_id !== userId) {
      return json({ ok: false, codigo: 'compra_no_existe' }, 409);
    }
    moneda = compra.moneda ?? 'USD';
  }
  /* 🔴 ERA UN `else`, Y EL `else` SE COMIÓ AL BONO — medido contra la edge
     DESPLEGADA, no contra un arnés: un cobro real de paquete volvió
     `cita_no_existe`. Con dos sujetos `if (hayCompra) … else …` era un XOR
     correcto; con cuatro, **el `else` deja de significar «la cita» y pasa a
     significar «todo lo que no es compra»** ⇒ el bono entraba a resolverse
     como cita, con `citaId = ''`.
     *Es exactamente la clase que este archivo ya nombra dos bloques más abajo
     al enumerar el sujeto — y la dejé viva acá arriba. Un `else` no es una
     rama: es el sujeto por defecto, y el sujeto por defecto siempre es el
     último que alguien recuerda.*
     Ningún typecheck lo ve: compila igual y devuelve un código tipado que
     además suena plausible. **Lo encontró pedir un cobro de verdad.** */
  if (hayCita) {
    /* La cita no tiene `user_id`: pertenece a una MASCOTA, y el acceso lo dice
       la familia. Se pregunta por el camino de la casa —`user_tiene_acceso_a_mascota`
       vía la vista de la cita— en vez de inventar una regla nueva. */
    const { data: cita } = await db.from('evento_cita_servicio')
      .select('id, mascota_id, estado_reserva').eq('id', citaId).maybeSingle();
    if (!cita) return json({ ok: false, codigo: 'cita_no_existe' }, 409);
    /* 🔴 La variante CON USUARIO EXPLÍCITO, no la de `auth.uid()`: acá el
       cliente corre con `service_role` y `auth.uid()` es NULL — la original
       diría que no siempre. *Es la misma trampa que el `uid` del proveedor: una
       función correcta que, llamada desde otro lado, contesta otra cosa.*
       Y es la MISMA implementación que usan las 62 policies: el original
       delega en ésta. */
    const { data: puede } = await db.rpc('user_tiene_acceso_a_mascota_como', {
      p_user_id: userId, p_mascota_id: cita.mascota_id,
    });
    if (puede !== true) return json({ ok: false, codigo: 'cita_no_existe' }, 409);
  }

  /* ═══ 🔴 S108-B · PERTENENCIA Y ESTADO DE LOS DOS SUJETOS DE GUARDERÍA ═════
     Los dos son **DEL HOGAR**, no de una persona: el paquete se compra sin
     mascota y la mensualidad la firma un adulto para la familia. Por eso la
     pertenencia se pregunta por `familia_miembro` y no por `user_id` — *atarlo
     a quien tecleó dejaría a la pareja sin poder pagar el paquete de su propia
     casa.* Es el mismo predicado que usan sus policies. */
  let bono: { id: string; estado_pago: string; estado: string; pago_expira_en: string | null } | null = null;
  let menPeriodo: string | null = null;
  let menMonto = 0;

  if (hayBono) {
    const { data: b } = await db.from('bonos')
      .select('id, familia_id, estado_pago, estado, pago_expira_en')
      .eq('id', bonoId).maybeSingle();
    /* La MISMA respuesta para «no existe» y «es de otra familia» — igual que
       los otros dos sujetos. *Distinguirlas convertiría esto en un oráculo de
       paquetes ajenos.* */
    if (!b || !(await esDeLaFamilia(b.familia_id, userId))) {
      return json({ ok: false, codigo: 'bono_no_existe' }, 409);
    }
    /* 🔴 IDEMPOTENCIA ANTES QUE NADA: un paquete ya pagado no se vuelve a
       cobrar. *El doble toque de una familia impaciente no puede costarle dos
       paquetes.* */
    if (b.estado_pago === 'pagado') return json({ ok: false, codigo: 'bono_ya_pagado' }, 409);
    if (b.estado_pago !== 'pendiente') return json({ ok: false, codigo: 'bono_no_existe' }, 409);
    /* 🔴 LA VENTANA DE 15 MINUTOS, LEÍDA — no supuesta. `expirar_bonos_sin_pago`
       corre por reloj, así que entre el vencimiento y su barrida hay una
       ventana en la que el bono todavía dice `pendiente`. **Cobrar ahí sería
       cobrar algo que el motor ya considera muerto**, y el actuador lo rebota
       después con `pago_tardio_bono_cancelado` — con la plata ya tomada. */
    if (b.pago_expira_en !== null && new Date(b.pago_expira_en).getTime() <= Date.now()) {
      return json({ ok: false, codigo: 'bono_vencido' }, 409);
    }
    if (b.estado !== 'activo') return json({ ok: false, codigo: 'bono_vencido' }, 409);
    bono = b;
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

  const { data: tarjeta } = await db.from('tarjetas_guardadas')
    .select('id, user_id, token, estado, proveedor_uid').eq('id', tarjetaId).maybeSingle();
  if (!tarjeta || tarjeta.user_id !== userId || tarjeta.estado !== 'guardada') {
    return json({ ok: false, codigo: 'token_ausente' }, 409);
  }

  /* Sin `proveedor_uid` no se puede cobrar esa tarjeta: **no se adivina**.
     *Mandar el id de auth «por si acaso» es exactamente lo que produjo el
     rebote que esta cura corrige.* */
  const uidProveedor = (tarjeta as { proveedor_uid?: string | null }).proveedor_uid ?? '';
  if (!uidProveedor) return json({ ok: false, codigo: 'tarjeta_sin_uid' }, 409);

  // ── ② EL MONTO SALE DEL DESGLOSE CONGELADO — del sujeto que sea ───────────
  let monto = 0, iva = 0, base = 0, pedidoDelIntento: string | null = null;
  if (hayCompra) {
    const { data: desglose } = await db.from('compra_desglose')
      .select('pedido_id, subtotal, impuesto, envio, total').eq('compra_id', compraId);
    if (!desglose || desglose.length === 0) {
      return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    }
    monto = desglose.reduce((a, d) => a + Number(d.total ?? 0), 0);
    iva = desglose.reduce((a, d) => a + Number(d.impuesto ?? 0), 0);
    base = desglose.reduce((a, d) => a + Number(d.subtotal ?? 0) + Number(d.envio ?? 0), 0);
    pedidoDelIntento = desglose[0].pedido_id;
  }
  /* 🔴 EL SEGUNDO `else` DE LA MISMA CLASE, en el mismo archivo — y apareció
     al medir otra vez DESPUÉS de curar el primero. Curado el `else` de la
     pertenencia, el cobro del bono dejó de decir `cita_no_existe` y pasó a
     decir `desglose_incompleto`: caía acá, leyendo `cita_desglose` con
     `citaId = ''`.
     *Curar el síntoma reportado y no censar la CLASE es media cura* — la otra
     mitad estaba tres bloques abajo, con un código distinto y también
     plausible. El censo de `} else {` en los dos rieles se corrió recién
     entonces: eran exactamente dos, uno por archivo. */
  if (hayCita) {
    const { data: d } = await db.from('cita_desglose')
      .select('subtotal, impuesto, total, moneda').eq('cita_id', citaId).maybeSingle();
    /* 🔴 FAIL-CLOSED, igual que la compra: **sin desglose congelado no hay
       cobro.** *El desglose es lo que se le prometió al cliente al reservar;
       cobrar sin él sería cobrar un número que nadie le mostró.* */
    if (!d) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = Number(d.total ?? 0);
    iva = Number(d.impuesto ?? 0);
    base = Number(d.subtotal ?? 0);
    moneda = d.moneda ?? 'USD';
  }

  /* ═══ 🔴 S108-B · EL DESGLOSE DE LOS DOS DE GUARDERÍA — MISMO FAIL-CLOSED ══
     `bono_desglose` y `guarderia_suscripcion_desglose` tienen la forma exacta
     de `cita_desglose`. **Sin fila no hay cobro**, y no se congela una acá:
     el desglose es lo que se le prometió a la familia al comprar o al firmar. */
  if (hayBono) {
    const { data: d } = await db.from('bono_desglose')
      .select('subtotal, impuesto, total, moneda').eq('bono_id', bonoId).maybeSingle();
    if (!d) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = Number(d.total ?? 0);
    iva = Number(d.impuesto ?? 0);
    base = Number(d.subtotal ?? 0);
    moneda = d.moneda ?? 'USD';
  }
  if (hayMen) {
    /* El número YA se resolvió arriba, contra el mandato — ver «pagar es
       arrancar». Acá sólo falta la moneda, que vive en la cuenta comercial del
       prestador (la suscripción no tiene columna de moneda, medido) y se
       resuelve por el MISMO camino que las tres congeladoras de la casa. */
    const { data: cta } = await db.from('guarderia_suscripciones')
      .select('prestadores(cuentas_comerciales(moneda))').eq('id', menId).maybeSingle();
    const m = (cta as { prestadores?: { cuentas_comerciales?: { moneda?: string } } } | null)
      ?.prestadores?.cuentas_comerciales?.moneda;
    /* 🔴 SIN MONEDA NO SE COBRA — no se cae a 'USD'. *Un cobro con una moneda
       supuesta cobra en una moneda que nadie eligió*, y es exactamente lo que
       `_trg_cita_congela_desglose` se niega a hacer tres capas más abajo. */
    if (!m) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    moneda = m;
    monto = menMonto;
    /* IVA 0 DERIVADO, jamás tecleado: los servicios no llevan IVA en el
       catálogo. Mismo criterio y mismo lugar donde cambiarlo que sus hermanas. */
    iva = 0;
    base = menMonto;
  }


  if (hayProg) {
    const { data: d } = await db.from('programa_desglose')
      .select('subtotal, impuesto, total, moneda').eq('programa_contratado_id', progId).maybeSingle();
    if (!d) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = Number(d.total ?? 0);
    iva = Number(d.impuesto ?? 0);
    base = Number(d.subtotal ?? 0);
    moneda = d.moneda ?? 'USD';
  }
  /* 🔴 EL SUJETO — lo que viaja como `dev_reference` y lo que el actuador va a
     resolver del otro lado. Con cuatro sujetos el ternario encadenado deja al
     último de la cadena haciendo de `else`; se enumera. */
  const sujeto = hayCompra ? compraId : hayCita ? citaId : hayBono ? bonoId : hayMen ? menId : progId;
  if (!UUID_RE.test(sujeto)) {
    /* No puede pasar —la puerta ya contó exactamente uno—, pero un
       `dev_reference` vacío es justo el defecto que la cita ya produjo una vez:
       *un cobro que sale sin referencia mueve la plata y no la traza.* */
    return json({ ok: false, codigo: 'datos_invalidos' }, 400);
  }
  if (!(monto > 0)) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
  const nombreDelSujeto = hayCompra ? 'compra' : hayCita ? 'cita'
    : hayBono ? 'paquete' : hayMen ? 'plan' : 'programa';

  /* 🔴 LAS COLUMNAS DEL SUJETO, EN UN SOLO LUGAR. Estaban repetidas en los DOS
     INSERT de `pagos_intentos` (el del rechazo por IVA y el del cobro), y con
     dos sujetos la repetición era barata. **Con cuatro, mantener dos listas en
     sincronía a mano es cómo un sujeto entra a una y no a la otra** — y el
     intento del rechazo quedaría sin sujeto, violando el XOR, justo en el
     camino que nadie ejercita. */
  const columnasDelSujeto = () => ({
    pedido_id: pedidoDelIntento,
    cita_id: hayCita ? citaId : null,
    compra_id: hayCompra ? compraId : null,
    bono_id: hayBono ? bonoId : null,
    guarderia_suscripcion_id: hayMen ? menId : null,
    guarderia_suscripcion_periodo: hayMen ? menPeriodo : null,
    programa_contratado_id: hayProg ? progId : null,
  });

  /* 🔑 LA FORMA DEL `order` CON IVA 0 — respuesta de Erick, 20-ago (letra §6bis):
     `vat: 0` es válido **siempre que vayan también `tax_percentage: 0` y
     `taxable_amount: 0`**. Eso cierra `D-852`.

     🔴 Y van DERIVADOS del desglose, jamás literales: *un cero tecleado a mano
     funciona hoy porque todo el catálogo es `EC_IVA_0`, y miente el día que
     entre un producto gravado.* */
  /* ═══ EL GUARD DEL IVA — contrato de A, firmado por el founder 25-ago ═══
     ☠️ MURIÓ `iva_no_probado`: describía un estado del mundo —«esto nunca se
     probó»— y ese estado deja de ser cierto cuando se prueba. *Un código que
     caduca solo es un código que algún día miente.*

     🔴 La tasa NO se infiere dividiendo: se lee del NOMINAL congelado en el
     ítem (`pedido_items.impuesto_pct`). *Inferirla da exactamente el 14,98 que
     este guard existe para no volver a producir.* Medido: los 81 ítems vivos
     tienen su `impuesto_pct` limpio (0.00 o 15.00). */
  const { data: itemsIva } = pedidoDelIntento
    ? await db.from('pedido_items')
        .select('subtotal, impuesto_monto, impuesto_pct, impuesto_codigo')
        .eq('pedido_id', pedidoDelIntento)
    : { data: null };

  const lineasIva: LineaIva[] = (itemsIva ?? []).length > 0
    ? (itemsIva ?? []).map((i) => ({
        subtotal: Number(i.subtotal ?? 0),
        impuesto: Number(i.impuesto_monto ?? 0),
        pct: i.impuesto_pct != null ? Number(i.impuesto_pct) : null,
        codigo: (i.impuesto_codigo as string) ?? null,
      }))
    /* Sin ítems —una CITA— no hay tasa declarada: `cita_desglose` guarda
       `subtotal/impuesto/total/moneda` y **ningún código**. Con IVA 0 pasa
       igual; con IVA > 0 rebota `iva_sin_tasa_declarada`, que es la verdad. */
    : [{ subtotal: base, impuesto: iva, pct: null, codigo: null }];

  const vIva = verificarIva(lineasIva);
  if (!vIva.ok) {
    await db.from('pagos_intentos').insert({
      ...columnasDelSujeto(),
      proveedor: 'nuvei',
      proveedor_referencia: sujeto, monto, moneda,
      forma: 'tokenizacion', estado: 'rechazado',
      motivo_rechazo: `${vIva.codigo}: ${vIva.detalle}`,
      cerrado_en: new Date().toISOString(),
      clave_idempotencia: `cobro:iva:${sujeto}:${Date.now()}`,
      pagador_user_id: userId, pagador_origen: 'sesion',
    });
    return json({ ok: false, codigo: vIva.codigo, detalle: vIva.detalle }, 409);
  }


  // ── ④ COMPUERTAS SERVER-SIDE ──────────────────────────────────────────────
  /* 🔴 Las compuertas de la COMPRA son de la compra. **La cita ya trae las
     suyas** —doce, medidas en el censo: hold, cuenta activa, fee, dirección…—
     y corren en su propia reserva, ANTES de este cobro (letra §3, orden 1).
     *No se reconstruyen acá: duplicar una compuerta es garantizar que algún
     día las dos digan cosas distintas.* */
  /* 🔴 CADA SUJETO DECLARA QUÉ NO SE EVALUÓ, CON SU NOMBRE. Antes el `else`
     devolvía siempre *«las compuertas de la cita corren en su reserva»* — que
     con dos sujetos era cierto y **con cuatro se vuelve una afirmación falsa
     sobre un paquete**. *Un `no_evaluables` que nombra al sujeto equivocado es
     peor que uno vacío: hace creer que algo se verificó donde no.* */
  const { data: g } = hayCompra
    ? await db.rpc('verificar_compuertas_pre_cobro', { p_compra_id: compraId, p_token: tarjeta.token })
    : {
        data: {
          ok: true,
          no_evaluables: hayCita
            ? ['compuertas_de_la_cita_corren_en_su_reserva']
            : hayBono
              /* El paquete trae las suyas de `comprar_paquete_guarderia`:
                 documentos del hogar, prestador activo, cuenta cobrable, fee.
                 Y su hold vivo se verificó arriba, contra `pago_expira_en`. */
              ? ['compuertas_del_paquete_corren_en_su_compra']
              /* El mandato trae las suyas de `contratar_mensualidad_guarderia`:
                 tarjeta guardada y no vencida, dirección, plan único por lugar. */
              : ['compuertas_del_mandato_corren_en_su_firma'],
        },
      };
  const gate = (g ?? {}) as Record<string, unknown>;
  if (gate.ok !== true) {
    return json({ ok: false, codigo: gate.codigo ?? 'no_se_pudo_completar',
                  no_evaluables: gate.no_evaluables ?? [] }, 409);
  }

  // ── El intento, ANTES de disparar ─────────────────────────────────────────
  /* 🔴 Si disparamos y perdemos la respuesta, esta fila es lo único que prueba
     que se disparó. Sin ella el caso ④ (no llega ninguno) es indetectable: no
     habría contra qué barrer. Y deja la compuerta 0 armada. */
  const { data: intento, error: eI } = await db.from('pagos_intentos').insert({
    ...columnasDelSujeto(),
    proveedor: 'nuvei',
    proveedor_referencia: sujeto, monto, moneda,
    forma: 'tokenizacion', estado: 'iniciado',
    clave_idempotencia: `cobro:${sujeto}:${Date.now()}`,
    /* ═══ 🔴 S102 · QUIÉN PAGÓ — la mitad que hacía falta ═══════════════════
       `LETRA_SALDO` §2 (RIGE, firma founder 19-ago): *«Del usuario que pagó.
       La plata vuelve a quien la puso, no al hogar ni a la familia.»* Hasta
       hoy esta tabla no lo registraba: para el pedido se derivaba de
       `pedidos.user_id`, y **para la cita no había de dónde**.

       `userId` sale de `comoUsuario.auth.getUser()` con el header de la
       petición (línea ~90) ⇒ **la sesión ES el pagador.** No se deriva de la
       mascota ni del hogar: se registra a quien está pagando.

       🔴 **VA EXPLÍCITO Y JAMÁS COMO `DEFAULT auth.uid()` EN LA COLUMNA.**
       Medido, y este mismo archivo ya lo dice en su comentario de más arriba:
       **`db` corre con `service_role`, y ahí `auth.uid()` es NULL.** Un
       default habría escrito NULL en cada fila **sin fallar y sin avisar** —
       la forma exacta del defecto que esta línea viene a cerrar.

       `pagador_origen='sesion'` es la PROCEDENCIA: distingue para siempre lo
       que registró la puerta de las 7 filas históricas que el backfill de
       S102 marcó como `backfill_s102`. *Un dato del que no se puede decir si
       se midió o se dedujo no sirve para responder una contracargo.* */
    pagador_user_id: userId, pagador_origen: 'sesion',
  }).select('id').single();
  if (eI) return json({ ok: false, codigo: 'no_se_pudo_completar' }, 500);

  // ── ⑤ EL DÉBITO ───────────────────────────────────────────────────────────
  let status = 0; let crudo = ''; let jsonResp: Record<string, unknown> = {};
  try {
    const r = await fetch(`${BASE}/v2/transaction/debit/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Auth-Token': await authToken() },
      body: JSON.stringify({
        /* 🔴 EL uid ES EL DEL PROVEEDOR, no el nuestro. La tarjeta se tokenizó
           con el handle del alta; mandar el id de auth hace que el proveedor
           rebote `uid does not match` — **medido en el aparato el 20-ago**.
           *Un identificador que significa algo del otro lado no se sustituye
           por el equivalente del nuestro solo porque nombren a la misma
           persona.* */
        user: { id: uidProveedor, email: u.user.email ?? 'sin-correo@epetplace.com' },
        order: {
          amount: Number(monto.toFixed(2)),
          /* 🔴 DECÍA «compra» PARA TODO SUJETO y usaba `compraId`, que para una
             cita es `''` ⇒ salía *«e-PetPlace compra »*, con el nombre del
             sujeto equivocado y sin id. Es la MISMA clase que el
             `dev_reference` vacío que ya se curó tres líneas más abajo —
             *el dato del camino viejo colándose en el nuevo* — y agregar dos
             sujetos más la volvía a cobrar. */
          description: `e-PetPlace ${nombreDelSujeto} ${sujeto.slice(0, 8)}`,
        /* 🔴 EL SUJETO, jamás un pedido — y jamás el otro sujeto.
           **Medido: con `compraId` fijo, el cobro de una cita mandaba
           `dev_reference: ""`** y el callback quedaba sin a quién apuntar. *Un
           cobro que sale sin referencia es un cobro que el webhook no puede
           reconocer: la plata se mueve y la traza no.* */
          dev_reference: sujeto,
          // 🔑 Los TRES juntos — forma exacta de Erick, derivada del desglose.
          /* 🔴 LOS TRES SALEN DEL VEREDICTO, y `tax_percentage` es el NOMINAL
             (15), jamás el recalculado: *mandarle 14,98 al proveedor sería
             declararle una tasa que no existe en Ecuador.* */
          vat: vIva.vat,
          taxable_amount: vIva.taxable_amount,
          tax_percentage: vIva.tax_percentage,
        },
        card: { token: tarjeta.token },
      }),
    });
    status = r.status;
    crudo = (await r.text()).slice(0, 4000);
    try { jsonResp = JSON.parse(crudo); } catch { /* el crudo queda igual */ }
  } catch (e) {
    /* Red caída ≠ rechazo. El intento queda en vuelo y **el barrido lo va a
       encontrar** — no se cierra como rechazado por no haber podido preguntar. */
    await db.from('pagos_intentos').update({
      motivo_rechazo: `red: ${String(e).slice(0, 200)}`, payload_crudo: { error: String(e) },
    }).eq('id', intento.id);
    return json({ ok: false, codigo: 'sin_respuesta' }, 504);
  }

  const tx = (jsonResp.transaction ?? {}) as Record<string, unknown>;
  const aprobado = status >= 200 && status < 300 &&
    (tx.status === 'success' || tx.status === 'approved');

  /* 🔴 EL MOTIVO JAMÁS QUEDA NULL (L-316) — con `http_<status>` como último
     recurso. *Un rechazo sin motivo obliga a abrir el crudo, y nadie lo abre
     cuando hay una explicación plausible a mano.* */
  const err = (jsonResp.error ?? {}) as Record<string, unknown>;

  /* ═══ 🔴 QUIÉN HABLÓ: ¿EL BANCO, O NOSOTROS? ═══════════════════════════════
     **El banco solo habla cuando OPINÓ.** Un `OperationNotAllowed*`, un
     `AuthError`, un `Server Error` o un HTTP 5xx **no son veredictos del
     emisor**: son defectos de nuestro request o del proveedor.

     Medido el 20-ago en el aparato: la pantalla dijo «el banco no autorizó,
     probá con otra tarjeta» cuando la causa era `uid does not match`. *Le pidió
     a la familia que probara otra tarjeta cuando NINGUNA iba a funcionar* — y
     además le atribuyó al emisor una decisión que nunca tomó.

     ⇒ Se separan, y el criterio es uno: **veredicto del emisor ⟺ hubo
     transacción y su `status` la rechazó.** Todo lo demás es nuestro. */
  const tipoErr = String(err.type ?? '');
  const esDefectoTecnico =
    status >= 500 ||
    /OperationNotAllowed|AuthError|Server ?Error|AttributeError|Invalid/i.test(tipoErr) ||
    (!aprobado && !tx.status);          // sin transacción, el banco no opinó
  const motivo = aprobado ? null : [
    err.type, err.description, tx.message, tx.status_detail,
  ].filter(Boolean).join(': ').slice(0, 400) || `http_${status}`;

  await db.from('pagos_intentos').update({
    estado: aprobado ? 'pendiente' : 'rechazado',
    proveedor_transaction_id: typeof tx.id === 'string' ? tx.id : null,
    authorization_code: typeof tx.authorization_code === 'string' ? tx.authorization_code : null,
    motivo_rechazo: motivo,
    cerrado_en: aprobado ? null : new Date().toISOString(),
    payload_crudo: jsonResp,
  }).eq('id', intento.id);

  /* 🔴 ⑥ SEÑAL OPTIMISTA. `aprobado` significa «el proveedor contestó que sí»,
     y el llamador pasa a `confirmando`. **Acá nadie dice «pagado»** — eso lo
     dice el webhook, o el barrido. El estado del intento queda `pendiente`
     justamente por eso. */
  if (!aprobado) {
    return json({
      ok: false,
      /* `rechazado` = el emisor dijo que no. `defecto_nuestro` = falló algo de
         nuestro lado o del proveedor, y la familia no tiene nada que corregir. */
      codigo: esDefectoTecnico ? 'defecto_nuestro' : 'rechazado',
      motivo,
    }, 409);
  }
  return json({ ok: true, señal: 'optimista', estado: 'confirmando' });
});
