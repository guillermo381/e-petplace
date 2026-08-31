#!/usr/bin/env node
/** LA CITA contra la edge de hoy — cobro real, acto 2 y comprobante. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const SEC='/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE=execFileSync('security',['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'],{encoding:'utf8'}).trim();
const env=Object.fromEntries(readFileSync(`${SEC}/apps/cliente/.env.local`,'utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')).trim(),l.slice(l.indexOf('=')+1).trim()]));
const URL=env.EXPO_PUBLIC_SUPABASE_URL, ANON=env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE=readFileSync(`${SEC}/supabase/dev/.env.local`,'utf8').match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)[1].trim();
const admin=createClient(URL,SERVICE,{auth:{persistSession:false}});
const cli=createClient(URL,ANON,{auth:{persistSession:false}});
const { data: ses }=await cli.auth.signInWithPassword({email:'guillo381+8@gmail.com',password:CLAVE});
const TOKEN=ses.session.access_token, uid=ses.session.user.id;
const esperar=(ms)=>new Promise(s=>setTimeout(s,ms));
const fallas=[]; const exigir=(c,q)=>{ if(!c){fallas.push(q); console.log(`   🔴 ${q}`);} };

const { data: tj }=await admin.from('tarjetas_guardadas').select('id, ultimos4')
  .eq('user_id',uid).eq('estado','guardada').limit(1).maybeSingle();
const { data: fm }=await admin.from('familia_miembro').select('familia_id')
  .eq('user_id',uid).is('hasta',null).limit(1).maybeSingle();
const { data: mas }=await admin.from('mascotas').select('id, nombre, especie')
  .eq('familia_id',fm.familia_id).eq('estado_vida','activa');
console.log(`\nsesión guillo381+8 · tarjeta ****${tj.ultimos4}`);

/* Un servicio con slots reales en los próximos días. El caso se fabrica: se
   pregunta por los inicios ANTES de reservar, en vez de adivinar una hora. */
/* 🔴 SÓLO ofertas de prestadores CON AGENDA. Medido: hay 68 franjas activas y
   son de 4 prestadores; la primera versión recorría todas las ofertas y las
   suyas no estaban entre ellas, así que reportó «ninguna tiene slot» sobre un
   conjunto donde no podía haberlos. *Buscar en el lugar equivocado y llamarlo
   ausencia es la misma forma que el censo por patrón que acota y no cierra.* */
const { data: conAgenda }=await admin.from('prestador_horarios')
  .select('prestador_id').eq('activo',true);
const agenda=new Set((conAgenda??[]).map(x=>x.prestador_id));
const { data: todas, error: eT }=await admin.from('prestador_servicios')
  .select('id, prestador_id, tipo_servicio')
  .eq('activo',true).in('tipo_servicio',['paseo','grooming','veterinaria']);
/* 🔴 EL ERROR SE LEE. Tercera vez en este arnés que una consulta falla y su
   `data` null se lee como «no hay»: `especies_elegibles` no es columna de esta
   tabla, el select rebotaba entero, y el arnés reportó «0 ofertas» sobre una
   medición que nunca ocurrió. *Un `data` vacío que nadie contrastó con su
   `error` dice «no hay» cuando lo que pasó es «no pude preguntar».* */
if (eT) { console.error(`🔴 no se pudieron leer las ofertas: ${eT.message}`); process.exit(2); }
const ofs=(todas??[]).filter(o=>agenda.has(o.prestador_id));
console.log(`   ${ofs.length} oferta(s) de prestadores con agenda`);
const hasta=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
const desde=new Date(Date.now()+86400000).toISOString().slice(0,10);
let elegido=null;
for (const o of (ofs??[])) {
  /* 🔴 CON LA SESIÓN, no con `service_role`: la RPC exige `auth.uid()` y con
     service_role rebota `auth_required`. Y el error SE LEE — la primera versión
     lo descartaba y `slots` quedaba en null, así que el arnés reportó «ninguna
     oferta tiene slot libre» sobre una medición que nunca ocurrió. */
  const { data: slots, error: eS }=await cli.rpc('obtener_slots_disponibles',
    { p_prestador_id:o.prestador_id, p_servicio_id:o.id, p_desde:desde, p_hasta:hasta });
  if (eS) { console.log(`   ${o.tipo_servicio} ${o.id.slice(0,8)} → ${eS.message.slice(0,50)}`); continue; }
  const libre=(slots??[])[0];
  if (libre) { elegido={ o, slot: libre }; break; }
}
if (!elegido) { console.error('🔴 ninguna oferta tiene slot libre en 7 días'); process.exit(2); }
/* 🔴 LA MASCOTA SE PRUEBA CONTRA LA PUERTA, no se deduce. La primera versión
   tomaba la primera del hogar y llevó un ave a una oferta de grooming:
   `mascota_no_elegible`. *La elegibilidad la sabe el motor —`especies_elegibles`
   por oferta— y adivinarla desde el arnés es re-implementar el guard que se
   viene a ejercer.* Se intenta y se acepta la primera que la puerta admita. */
let citaId=null, mascota=null;
for (const m of (mas??[])) {
  const { data: h, error: e }=await cli.rpc('crear_bloqueo_agenda', {
    p_prestador_id: elegido.o.prestador_id, p_servicio_id: elegido.o.id,
    p_mascota_id: m.id, p_fecha: elegido.slot.fecha, p_hora: elegido.slot.hora });
  if (e) { console.log(`   ${m.nombre} (${m.especie}) → ${e.message.slice(0,40)}`); continue; }
  citaId = h?.cita_id ?? h?.id; mascota = m;
  console.log(`   ${m.nombre} (${m.especie}) → cita ${String(citaId).slice(0,8)}`);
  break;
}
if (!citaId) { console.error('🔴 ninguna mascota del hogar es elegible para esa oferta'); process.exit(2); }

const r=await fetch(`${URL}/functions/v1/pagos-cobro`,{method:'POST',
  headers:{Authorization:`Bearer ${TOKEN}`,apikey:ANON,'Content-Type':'application/json'},
  body:JSON.stringify({cita_id:citaId, tarjeta_id:tj.id})});
const body=await r.json().catch(()=>({}));
console.log(`   pagos-cobro → HTTP ${r.status} · ${JSON.stringify(body).slice(0,110)}`);
exigir(r.status===200, `pagos-cobro rebotó ${r.status}: ${body?.codigo??''} ${body?.detalle??''}`);

await esperar(2500);
const { data: i0 }=await admin.from('pagos_intentos').select('proveedor_transaction_id')
  .eq('cita_id',citaId).order('creado_en',{ascending:false}).limit(1).maybeSingle();
let w=null; const t0=Date.now();
while (i0?.proveedor_transaction_id && Date.now()-t0<60000) {
  const { data }=await admin.from('webhook_events').select('resultado, detalle')
    .eq('transaction_id',i0.proveedor_transaction_id).maybeSingle();
  if (data?.resultado && data.resultado!=='pendiente') { w=data; break; }
  await esperar(2000);
}
console.log(`   webhook: ${w?.resultado ?? 'no llegó'} · ${String(w?.detalle??'').slice(-44)}`);
exigir(w?.resultado==='aplicado', `el acto 2 no aplicó — quedó «${w?.resultado}»`);
const { data: i }=await admin.from('pagos_intentos')
  .select('estado, monto, proveedor_transaction_id, authorization_code')
  .eq('cita_id',citaId).order('creado_en',{ascending:false}).limit(1).maybeSingle();
console.log(`   intento ${i?.estado} · $${i?.monto} · tx=${i?.proveedor_transaction_id} · auth=${i?.authorization_code}`);
const { data: c }=await admin.from('notificacion_intencion').select('datos')
  .like('clave_dedup',`comprobante:${citaId}%`).maybeSingle();
console.log(`   COMPROBANTE: «${c?.datos?.concepto ?? 'ninguno'}» · $${c?.datos?.monto ?? '—'}`);
exigir(!!c, 'sin comprobante');
const { data: fin }=await admin.from('evento_cita_servicio').select('estado').eq('id',citaId).maybeSingle();
console.log(`   la cita quedó: ${fin?.estado}`);
console.log(`\n   ID: ${citaId}`);
if (fallas.length) { console.log(`\n🔴 ${fallas.length} falla(s)\n`); process.exit(1); }
console.log('\n✅ la cita cobra contra la edge de hoy\n');
