/* S108-B4 · EL CAMINO FELIZ DE LA MENSUALIDAD, DE PUNTA A PUNTA.
   Hogar limpio generado para esto: familia de `guillo381+7`, mascota Jack —
   cero días de guardería futuros, así que el mes no choca contra el guard de
   `(mascota, fecha)`. Contra la EDGE DESPLEGADA, no contra un arnés.
   Secretos leídos al momento y jamás impresos. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();
const env = Object.fromEntries(
  readFileSync(`${RAIZ}/apps/cliente/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = readFileSync(`${RAIZ}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
if (!CLAVE || !URL || !ANON || !SERVICE) { console.error('🔴 falta un secreto'); process.exit(1); }

/* 🔴 POR QUÉ ESTE HOGAR Y NO EL OTRO, medido y no elegido al azar:
   · `guillo381+7` tiene el hogar limpio (mascota sin días de guardería) pero su
     tarjeta —tokenizada el 26-ago— rebota `uid does not match` del lado de
     Nuvei. Los tres uid COINCIDEN en nuestra base: el desajuste es del
     proveedor, y re-hacer el alta pide 3DS en un navegador.
   · `guillo381+8` tiene la tarjeta que SÍ cobra (probada con `DF-2107863`),
     pero **todas sus mascotas elegibles tienen un día PAGADO dentro del mes**.
     No se cancelan días pagados para que pase un arnés.
   ⇒ Se genera lo que falta POR LAS PUERTAS REALES: una mascota nueva sin
     historia, y el mandato viejo se cancela con su propia RPC. */
const EMAIL = 'guillo381+8@gmail.com';
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const cli = createClient(URL, ANON, { auth: { persistSession: false } });

const { data: ses, error: eL } = await cli.auth.signInWithPassword({ email: EMAIL, password: CLAVE });
if (eL || !ses?.session) { console.error('🔴 sin sesión:', eL?.message); process.exit(1); }
const uid = ses.session.user.id;
console.log(`① sesión de ${EMAIL}`);

const { data: fm } = await admin.from('familia_miembro')
  .select('familia_id').eq('user_id', uid).is('hasta', null).limit(1).maybeSingle();
/* Una mascota NUEVA, por la puerta real: sin historia no puede chocar. */
const { data: nueva, error: eM } = await cli.rpc('agregar_mascota_a_familia', {
  p_nombre_mascota: 'Kira', p_especie: 'perro',
  p_fecha_nacimiento: '2024-03-15', p_precision_fecha: 'exacta', p_sexo: 'hembra',
});
if (eM) { console.error('🔴 no pude crear la mascota:', eM.message); process.exit(1); }
const masc = { id: nueva.mascota_id ?? nueva.id, nombre: 'Kira' };

/* El mandato viejo se cancela POR SU PUERTA, no a mano: `ya_tienes_plan_activo`
   es por (familia, prestador) y hay uno vivo cuyo único cobro falló. */
const { data: viejo } = await admin.from('guarderia_suscripciones')
  .select('id').eq('familia_id', fm.familia_id).eq('estado', 'activa').maybeSingle();
if (viejo) {
  const { error: eC } = await cli.rpc('cancelar_mensualidad_guarderia', { p_suscripcion_id: viejo.id });
  console.log(`   · mandato viejo ${viejo.id.slice(0,8)} cancelado por su RPC${eC ? ' ⚠️ '+eC.message : ''}`);
}
const { data: tar } = await admin.from('tarjetas_guardadas')
  .select('id, marca, ultimos4').eq('user_id', uid).eq('estado', 'guardada').limit(1).maybeSingle();
const { data: paq } = await admin.from('guarderia_paquetes')
  .select('prestador_id').eq('activo', true).limit(1).maybeSingle();
console.log(`② hogar ${fm.familia_id.slice(0,8)} · mascota ${masc.nombre} · tarjeta ${tar.marca} ****${tar.ultimos4}`);

/* 🔴 EL MANDATO SE FIRMA POR LA PUERTA REAL. */
const { data: firma, error: eF } = await cli.rpc('contratar_mensualidad_guarderia', {
  p_prestador_id: paq.prestador_id, p_tarjeta_id: tar.id, p_mascota_id: masc.id,
});
if (eF) { console.error('🔴 la puerta del mandato rebotó:', eF.message); process.exit(1); }
const suscId = firma.suscripcion_id;
console.log(`③ mandato ${suscId.slice(0,8)} firmado · $${firma.precio_mensual}/mes · cobrada=${firma.cobrada}`);

/* ④ LA EDGE DESPLEGADA. */
const r = await fetch(`${URL}/functions/v1/pagos-cobro`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ses.session.access_token}` },
  body: JSON.stringify({ guarderia_suscripcion_id: suscId, tarjeta_id: tar.id }),
});
console.log(`④ pagos-cobro (desplegada) → HTTP ${r.status} · ${(await r.text()).slice(0,260)}`);

await new Promise((s) => setTimeout(s, 6000));
const { data: ints } = await admin.from('pagos_intentos')
  .select('id, estado, monto, proveedor_transaction_id, authorization_code, motivo_rechazo, guarderia_suscripcion_periodo')
  .eq('guarderia_suscripcion_id', suscId).order('creado_en', { ascending: false });
for (const i of ints ?? []) {
  console.log(`⑤ intento ${i.id.slice(0,8)} · ${i.estado} · $${i.monto} · periodo=${i.guarderia_suscripcion_periodo}`);
  console.log(`   transaction_id = ${i.proveedor_transaction_id} · authorization_code = ${i.authorization_code}`);
  if (i.motivo_rechazo) console.log(`   motivo = ${i.motivo_rechazo.slice(0,180)}`);
}
const { data: ev } = await admin.from('webhook_events')
  .select('resultado, detalle').eq('transaction_id', ints?.[0]?.proveedor_transaction_id ?? 'x').maybeSingle();
console.log(`⑥ webhook: resultado=${ev?.resultado} · ${(ev?.detalle ?? '').slice(-90)}`);

const { data: fin } = await admin.from('guarderia_suscripciones')
  .select('periodo_desde, periodo_hasta, dia_de_cobro').eq('id', suscId).maybeSingle();
console.log(`⑦ el plan ARRANCÓ: desde=${fin?.periodo_desde} hasta=${fin?.periodo_hasta} dia_de_cobro=${fin?.dia_de_cobro}`);
const { data: dg } = await admin.from('guarderia_suscripcion_desglose')
  .select('periodo, subtotal, impuesto, total, moneda').eq('guarderia_suscripcion_id', suscId);
console.log(`⑧ desglose congelado: ${JSON.stringify(dg)}`);
const { count: citas } = await admin.from('evento_cita_servicio')
  .select('*', { count: 'exact', head: true }).eq('metadata->>suscripcion_id', suscId);
console.log(`⑨ días del plan generados: ${citas}`);
const { data: comp } = await admin.from('notificacion_intencion')
  .select('clave_dedup, datos').like('clave_dedup', `comprobante:${suscId}%`);
for (const c of comp ?? []) {
  console.log(`⑩ COMPROBANTE ${c.clave_dedup}`);
  console.log(`   concepto = «${c.datos.concepto}» · negocio = ${c.datos.negocio}`);
  console.log(`   monto=${c.datos.monto} ${c.datos.moneda} · subtotal=${c.datos.subtotal} impuesto=${c.datos.impuesto}`);
  console.log(`   tx=${c.datos.transaction_id} · auth=${c.datos.authorization_code} · sujeto_id=${c.datos.sujeto_id?.slice(0,8)}`);
}
if (!comp?.length) console.log('⑩ COMPROBANTE: ninguno');
console.log(`\nMANDATO DE LA PRUEBA: ${suscId}`);
