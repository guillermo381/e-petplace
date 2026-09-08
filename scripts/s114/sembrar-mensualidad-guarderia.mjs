#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIEMBRA · el caso vivo de MENSUALIDAD de guardería — S114-E
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **POR QUÉ.** El cinturón de A para el devengo de guardería sale NO
 * CONCLUYENTE en su rama de mensualidad: **no hay ni una estadía de
 * mensualidad en la base**, así que la fórmula `precio_mensual / días del
 * período` **nunca se ejerció**. *No se calibra un reparto de plata contra
 * datos que no existen* — hace falta el sujeto.
 *
 * ── TODO POR LAS RPCs, Y NINGUNA MUEVE PLATA ────────────────────────────
 *   ① `contratar_mensualidad_guarderia`  — medido: **no toca `pagos_intentos`**
 *   ② `cobrar_periodo_mensualidad_guarderia(susc, NULL, NULL)` — su nombre
 *      dice «cobrar» y **no llama a la pasarela** (medido: cero `net.http`):
 *      es el APLICADOR, el que materializa los días del período ya pactado.
 *      Con `p_intento_id = NULL` no exige ningún pago aprobado.
 *      🔴 **Se la llama con `service_role`, y no es un atajo:** medido,
 *      `authenticated` recibe `permission denied` — **no es una puerta de
 *      cliente.** En producción la llama `aplicar_evento_de_pago`, que es
 *      DEFINER, o sea **el sistema**. Llamarla como sistema es *más* parecido a
 *      producción que llamarla como familia. Sigue siendo la RPC real: la
 *      fórmula `precio_mensual / días` corre igual, que es lo que se quiere
 *      probar. *Lo prohibido era el `INSERT`, no el rol.*
 *   ③ `marcar_a_bordo` → `llegada` → `retorno` → `entregada` — y **el devengo
 *      nace del acta de entregar**, que es lo que el cinturón necesita ver.
 *
 * 🔴 **NADA POR `INSERT`.** Las estadías de una mensualidad sólo nacen por ②;
 * una fila puesta a mano no habría pasado por la fórmula que se quiere probar,
 * y el cinturón estaría midiendo el fixture en vez del motor.
 *
 * ── ⚠️ LA MARCA DE SIEMBRA SALE DEL OBJETO, PORQUE LA TABLA NO TIENE DÓNDE ─
 * `guarderia_suscripciones` **no tiene ningún campo de texto** donde escribir
 * una marca (a diferencia de `casos_postventa`, que tiene `relato`). Así que
 * la marca **se hereda de la mascota**: se contrata sobre una ya marcada
 * `creado_por_sistema = 'fixture_founder_s113'`, y el censo es:
 *
 *   select count(*) from guarderia_suscripciones s
 *     join mascotas m on m.id = s.mascota_id
 *    where m.creado_por_sistema is not null;
 *
 * *Un marcador derivado del objeto vale más que uno escrito en un campo libre:
 * no se puede borrar sin borrar el sujeto.*
 *
 * ── 🔴 POR QUÉ NO SE USA LA MENSUALIDAD QUE YA EXISTE, NI SE LA CANCELA ──
 * La única activa es de **Pepe, un AVE**, y la oferta declara
 * `especies_compatibles: ['gato','perro']` — o sea que **el dato está y la
 * puerta no lo mira**: el defecto que el canon ya tiene medido, ahora con su
 * evidencia exacta. **Sembrar encima habría fabricado estadías que la regla de
 * especie debería impedir**, y después ese sujeto calibraría un reparto de
 * plata. **Y cancelarla para liberar el cupo habría BORRADO la evidencia de un
 * defecto abierto** — *una siembra no destruye el sujeto de otra medición.*
 *
 * ⇒ La familia se **DESCUBRE**: la que tenga tarjeta, dirección, un perro o
 * gato vivo y **ninguna mensualidad activa con ese prestador** (el guard es por
 * `(familia, prestador)`, medido en el cuerpo de la puerta).
 *
 * ── EL RELOJ, VERIFICADO ANTES DE CREAR EL MANDATO ──────────────────────
 * Contratar deja un **mandato** (tarjeta + autorización). Se verifica que
 * `guarderia_recurrente_vivo()` esté en **false** antes de crearlo: *dejar un
 * mandato vivo que un cron pueda cobrar sería sembrar una deuda, no un sujeto.*
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { dbQuery } from '../lib-db.mjs';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s114-e';

const env = Object.fromEntries(readFileSync(`${RAIZ}/apps/cliente/.env.local`, 'utf8').split('\n')
  .filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const cl = (svc, acct) => execFileSync('security',
  acct ? ['find-generic-password', '-a', acct, '-s', svc, '-w'] : ['find-generic-password', '-s', svc, '-w'],
  { encoding: 'utf8' }).trim();
async function sesion(email, pass) {
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error(`${email}: ${error.message}`);
  return c;
}

// ── ⓪ EL FRENO: el reloj tiene que estar apagado ─────────────────────────
const vivo = dbQuery('select guarderia_recurrente_vivo() v')[0].v;
if (vivo) {
  console.error('🟠 FRENO · `guarderia_recurrente_vivo()` está en TRUE.');
  console.error('   Contratar dejaría un mandato que un cron puede cobrar: eso es sembrar');
  console.error('   una deuda, no un sujeto. NO se siembra.');
  process.exit(2);
}
console.log('⓪ reloj recurrente APAGADO ✅ — el mandato no lo va a cobrar nadie\n');

// ── ① CONTRATAR, sobre un perro YA MARCADO como fixture ──────────────────
const oferta = dbQuery(`
  select ps.prestador_id, ps.precio_mensual_plan
    from prestador_servicios ps join prestadores p on p.id = ps.prestador_id
   where ps.tipo_servicio = 'guarderia_dia' and ps.activo
     and ps.precio_mensual_plan is not null and p.estado = 'activo' limit 1`)[0];
if (!oferta) { console.error('🟠 ningún prestador ofrece mensualidad de guardería.'); process.exit(2); }

/* ↻ RETOMAR primero: si ya existe una mensualidad activa sobre un perro o gato
   —o sea, una VÁLIDA— se reusa. Sin esta rama el script sólo corre una vez:
   la segunda, su propio resultado le tapa el descubrimiento. */
const yaValida = dbQuery(`
  select s.id, u.email, m.nombre, m.especie, m.creado_por_sistema
    from guarderia_suscripciones s
    join mascotas m on m.id = s.mascota_id
    join familia_miembro fm on fm.familia_id = s.familia_id and fm.hasta is null
    join auth.users u on u.id = fm.user_id
   where s.estado = 'activa' and m.especie in ('perro','gato')
     and s.prestador_id = '${oferta.prestador_id}'
   limit 1`)[0];

const cand = yaValida ? null : dbQuery(`
  select u.email, m.id as mascota_id, m.nombre, m.especie, m.creado_por_sistema,
         t.id as tarjeta_id, d.id as direccion_id
    from auth.users u
    join familia_miembro fm on fm.user_id = u.id and fm.hasta is null
    join mascotas m on m.familia_id = fm.familia_id
       and m.especie in ('perro','gato') and m.estado_vida = 'activa'
    join tarjetas_guardadas t on t.user_id = u.id
    join direcciones_guardadas d on d.user_id = u.id
   where not exists (
     select 1 from guarderia_suscripciones s
      where s.familia_id = fm.familia_id and s.prestador_id = '${oferta.prestador_id}'
        and s.estado = 'activa')
   order by (m.creado_por_sistema is not null) desc
   limit 1`)[0];
if (!cand && !yaValida) {
  console.error('🟠 NO CONCLUYENTE · ninguna familia tiene tarjeta + dirección + perro/gato');
  console.error(`   y sin mensualidad activa con el prestador ${oferta.prestador_id}.`);
  console.error('   El guard es por (familia, prestador): con un solo prestador ofreciendo');
  console.error('   mensualidad, una familia que ya tiene una queda sin camino.');
  process.exit(2);
}
const FAMILIA = yaValida ? yaValida.email : cand.email;
const molde = { prestador_id: oferta.prestador_id, tarjeta_id: cand?.tarjeta_id,
                direccion_id: cand?.direccion_id, monto_esperado: oferta.precio_mensual_plan, riel: 'tarjeta' };
const mascota = yaValida
  ? { id: null, nombre: yaValida.nombre, especie: yaValida.especie, creado_por_sistema: yaValida.creado_por_sistema }
  : { id: cand.mascota_id, nombre: cand.nombre, especie: cand.especie, creado_por_sistema: cand.creado_por_sistema };
console.log(`   familia ${yaValida ? 'con mensualidad válida ya existente' : 'descubierta'}: ${FAMILIA}`);
console.log(`① contratar sobre ${mascota.nombre} (${mascota.especie}, marca \`${mascota.creado_por_sistema ?? 'SIN MARCA — se declara'}\`)`);

const sFam = await sesion(FAMILIA, cl('epetplace-siembra-s97', 'siembra'));
let susc = yaValida ? yaValida.id : null;
if (susc) console.log(`   ↻ ya existía una mensualidad activa para esta mascota: ${susc}`);
else {
  const { data, error } = await sFam.rpc('contratar_mensualidad_guarderia', {
    p_prestador_id: molde.prestador_id, p_tarjeta_id: molde.tarjeta_id,
    p_mascota_id: mascota.id, p_monto_esperado: molde.monto_esperado,
    p_direccion_id: molde.direccion_id, p_riel: molde.riel,
  });
  if (error || data?.ok === false) { console.error(`   🟠 contratar rebotó: ${error?.message ?? JSON.stringify(data)}`); process.exit(1); }
  susc = data?.suscripcion_id ?? data?.id ?? data;
  console.log(`   ✅ mensualidad ${susc}`);
}

// ── ② APLICAR EL PERÍODO — sin intento, sin pasarela ─────────────────────
console.log('\n② aplicar el período (sin `p_intento_id`: no exige pago y no llama a la pasarela)');
let estadias = dbQuery(`
  select e.id, e.estado, c.fecha from guarderia_estadias e
   join evento_cita_servicio c on c.id = e.cita_id
  where c.suscripcion_servicio_id = '${susc}' order by c.fecha limit 40`);
if (estadias.length === 0) {
  const SERVICE = (() => {
    for (const c of [`${RAIZ}/supabase/dev/.env.local`,
      `${execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim()}/../supabase/dev/.env.local`]) {
      try { const k = readFileSync(c, 'utf8').match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim(); if (k) return k; } catch { /* siguiente */ }
    }
    return null;
  })();
  if (!SERVICE) { console.error('   🟠 sin service_role no se puede aplicar el período.'); process.exit(2); }
  const sistema = createClient(URL_, SERVICE, { auth: { persistSession: false } });
  const { data, error } = await sistema.rpc('cobrar_periodo_mensualidad_guarderia', {
    p_suscripcion_id: susc, p_periodo_desde: null, p_intento_id: null,
  });
  if (error) console.error(`   🟠 rebotó: ${error.message}`);
  else console.log(`   ✅ ${JSON.stringify(data).slice(0, 160)}`);
  estadias = dbQuery(`
    select e.id, e.estado, c.fecha from guarderia_estadias e
     join evento_cita_servicio c on c.id = e.cita_id
    where c.suscripcion_servicio_id = '${susc}' order by c.fecha limit 40`);
}
console.log(`   estadías de la mensualidad: ${estadias.length}`);
if (estadias.length === 0) { console.error('   🟠 sin estadías: el cinturón sigue sin sujeto.'); process.exit(1); }

// ── ③ UNA ESTADÍA HASTA `entregada` — el acta que devenga ────────────────
console.log('\n③ llevar UNA estadía hasta `entregada` (el acta que devenga)');
const titular = dbQuery(`
  select u.email from prestadores p join auth.users u on u.id = p.user_id
   where p.id = '${molde.prestador_id}'`)[0]?.email;
let sPre = null;
for (const [em, pw] of [[titular, cl('epetplace-siembra-s97', 'siembra')],
                        ['demo-prestador@epetplace.dev', cl('epetplace-cuenta-prueba')]]) {
  if (!em) continue;
  try { sPre = await sesion(em, pw); console.log(`   sesión del prestador: ${em}`); break; } catch { /* siguiente */ }
}
if (!sPre) { console.error(`   🟠 no abre la sesión del titular (${titular}).`); process.exit(1); }

const objetivo = estadias.find((e) => e.estado === 'reservada') ?? estadias[0];
const ayer = new Date(Date.now() - 3600_000).toISOString();
const pasos = [
  ['marcar_a_bordo_guarderia', { p_estadia_id: objetivo.id, p_carnet_verificado: true, p_ocurrido_en: ayer, p_objetos: 'siembra', p_observaciones: 'SIEMBRA S114-E', p_clave_idempotencia: `siembra-abordo-${objetivo.id}` }],
  ['marcar_llegada_guarderia', { p_estadias: [objetivo.id], p_ocurrido_en: ayer }],
  ['marcar_retorno_guarderia', { p_estadias: [objetivo.id], p_ocurrido_en: ayer }],
  ['marcar_entregada_guarderia', { p_estadia_id: objetivo.id, p_ocurrido_en: ayer, p_objetos: 'siembra', p_observaciones: 'SIEMBRA S114-E', p_clave_idempotencia: `siembra-entrega-${objetivo.id}` }],
];
for (const [rpc, args] of pasos) {
  const { data, error } = await sPre.rpc(rpc, args);
  const malo = error || data?.ok === false;
  console.log(`   ${malo ? '🟠' : '✅'} ${rpc.padEnd(30)} ${malo ? (error?.message ?? JSON.stringify(data)).slice(0, 110) : 'ok'}`);
  if (malo) break;
}

// ── CENSO ────────────────────────────────────────────────────────────────
const fin = dbQuery(`
  select e.estado, count(*)::int n from guarderia_estadias e
   join evento_cita_servicio c on c.id = e.cita_id
  where c.suscripcion_servicio_id = '${susc}' group by 1 order by 1`);
const ev = dbQuery(`
  select ee.id, ee.monto_bruto, ee.metadata->>'via' via from eventos_economicos ee
   where ee.origen_tipo = 'estadia' and ee.origen_id = '${objetivo.id}'`);
console.log('\n── LO SEMBRADO ──');
for (const f of fin) console.log(`   estadía ${f.estado.padEnd(18)} ${f.n}`);
console.log(`   evento económico de la estadía entregada: ${ev.length ? JSON.stringify(ev[0]) : '🟠 NINGUNO'}`);
console.log('\n   censo (marca heredada de la mascota):');
console.log('   select count(*) from guarderia_suscripciones s join mascotas m on m.id=s.mascota_id');
console.log("    where m.creado_por_sistema is not null;");
console.log('   ⚠️ SIEMBRA, NO TRÁFICO: ningún número de estas filas es línea base.');
