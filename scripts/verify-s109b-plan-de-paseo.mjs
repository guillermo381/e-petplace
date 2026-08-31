#!/usr/bin/env node
/**
 * EL SEXTO SUJETO — el plan de paseo, hasta el id.
 * Hasta hoy **podía renovar y no podía empezar**: el lazo recurrente lo cobraba
 * y el checkout no tenía puerta.
 * Exige acto 2 APLICADO y comprobante que diga qué se compró. *Sin acto 2 no
 * cuenta como ejercido.*
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SEC = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE = execFileSync('security',
  ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'],
  { encoding: 'utf8' }).trim();
const env = Object.fromEntries(readFileSync(`${SEC}/apps/cliente/.env.local`,'utf8')
  .split('\n').filter((l)=>l.includes('=')).map((l)=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]));
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = readFileSync(`${SEC}/supabase/dev/.env.local`,'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
const admin = createClient(URL, SERVICE, { auth:{persistSession:false} });
const cli = createClient(URL, ANON, { auth:{persistSession:false} });
const { data: ses } = await cli.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password:CLAVE });
if (!ses?.session) { console.error('🔴 sin sesión'); process.exit(2); }
const TOKEN = ses.session.access_token;
const esperar = (ms) => new Promise((s)=>setTimeout(s,ms));

const fallas = [];
const exigir = (c,q)=>{ if(!c){ fallas.push(q); console.log(`   🔴 ${q}`);} };

const { data: tj } = await admin.from('tarjetas_guardadas')
  .select('id, ultimos4').eq('user_id', ses.user.id).eq('estado', 'guardada').limit(1).maybeSingle();
const { data: fm } = await admin.from('familia_miembro')
  .select('familia_id').eq('user_id', ses.user.id).is('hasta', null).limit(1).maybeSingle();
const { data: perros } = await admin.from('mascotas')
  .select('id, nombre').eq('familia_id', fm.familia_id).eq('especie','perro').eq('estado_vida','activa');
/* Un perro sin plan vivo: `L-443` — el caso se fabrica, no se busca. */
const { data: conPlan } = await admin.from('suscripciones_servicio')
  .select('mascota_id').in('estado', ['activa','pendiente']);
const ocup = new Set((conPlan??[]).map(x=>x.mascota_id));
const perro = (perros??[]).find(m=>!ocup.has(m.id)) ?? perros[0];
const { data: ofs } = await admin.from('prestador_servicios')
  .select('id, prestador_id, precio').eq('activo',true).eq('tipo_servicio','paseo');
const of = ofs[0];
console.log(`\nsesión guillo381+8 · tarjeta ****${tj.ultimos4} · mascota ${perro.nombre}`);

const manana = new Date(Date.now()+86400000).toISOString().slice(0,10);
const { data: pl, error: eP } = await cli.rpc('contratar_plan_paseo', {
  p_prestador_id: of.prestador_id, p_servicio_id: of.id, p_mascota_id: perro.id,
  p_dias: [1,3,5], p_hora: '10:00:00', p_frecuencia: 'semanal',
  p_auto_renovar: true, p_fecha_inicio: manana,
  /* El riel se declara EN EL MISMO ACTO que la tarjeta: el CHECK
     `chk_susc_riel_valido` exige que si el riel es tarjeta haya tarjeta. */
  p_riel: 'tarjeta', p_tarjeta_id: tj.id });
if (eP) { console.error(`🔴 la puerta rebotó: ${eP.message}`); process.exit(1); }
const planId = pl?.suscripcion_id ?? pl?.id;
console.log(`   plan ${String(planId).slice(0,8)} · ${JSON.stringify(pl).slice(0,120)}`);

const r = await fetch(`${URL}/functions/v1/pagos-cobro`, {
  method:'POST',
  headers:{ Authorization:`Bearer ${TOKEN}`, apikey:ANON, 'Content-Type':'application/json' },
  body: JSON.stringify({ suscripcion_servicio_id: planId, tarjeta_id: tj.id }) });
const body = await r.json().catch(()=>({}));
console.log(`   pagos-cobro → HTTP ${r.status} · ${JSON.stringify(body).slice(0,110)}`);
exigir(r.status === 200, `pagos-cobro rebotó ${r.status}: ${body?.codigo ?? ''} ${body?.detalle ?? ''}`);

await esperar(2500);
const { data: i0 } = await admin.from('pagos_intentos')
  .select('proveedor_transaction_id').eq('suscripcion_servicio_id', planId)
  .order('creado_en',{ascending:false}).limit(1).maybeSingle();
let w = null;
const t0 = Date.now();
while (i0?.proveedor_transaction_id && Date.now()-t0 < 60000) {
  const { data } = await admin.from('webhook_events')
    .select('resultado, detalle').eq('transaction_id', i0.proveedor_transaction_id).maybeSingle();
  if (data?.resultado && data.resultado !== 'pendiente') { w = data; break; }
  await esperar(2000);
}
console.log(`   webhook: ${w?.resultado ?? 'no llegó'} · ${String(w?.detalle??'').slice(-46)}`);
exigir(w?.resultado === 'aplicado', `el acto 2 no aplicó — quedó «${w?.resultado}»`);

const { data: i } = await admin.from('pagos_intentos')
  .select('estado, monto, proveedor_transaction_id, authorization_code')
  .eq('suscripcion_servicio_id', planId).order('creado_en',{ascending:false}).limit(1).maybeSingle();
console.log(`   intento ${i?.estado} · $${i?.monto} · tx=${i?.proveedor_transaction_id} · auth=${i?.authorization_code}`);
exigir(!!i?.proveedor_transaction_id, 'sin id de transacción');

const { data: c } = await admin.from('notificacion_intencion')
  .select('datos').like('clave_dedup', `comprobante:${planId}%`).maybeSingle();
console.log(`   COMPROBANTE: «${c?.datos?.concepto ?? 'ninguno'}» · $${c?.datos?.monto ?? '—'} ${c?.datos?.moneda ?? ''}`);
exigir(!!c, 'sin comprobante');
exigir(!!c && c.datos.concepto !== 'Pago en e-PetPlace', `el comprobante no dice qué se compró («${c?.datos?.concepto}»)`);

const { data: fin } = await admin.from('suscripciones_servicio')
  .select('estado, estado_pago, periodo_inicio').eq('id', planId).maybeSingle();
console.log(`   el plan quedó: estado=${fin?.estado} estado_pago=${fin?.estado_pago} desde=${fin?.periodo_inicio}`);
console.log(`\n   ID: ${planId}`);

if (fallas.length) { console.log(`\n🔴 ${fallas.length} falla(s)\n`); process.exit(1); }
console.log('\n✅ el sexto sujeto cobra de verdad\n');
