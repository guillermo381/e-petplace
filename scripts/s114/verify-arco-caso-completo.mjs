#!/usr/bin/env node
/**
 * ⭐ EL ARCO ENTERO DEL CASO, DOS ASIENTOS REALES (S114-A · adenda 13)
 * familia abre → casa resuelve → familia elige saldo → se acredita.
 * El único que no se había caminado completo por camino real.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const URL='https://zyltipqscdsdsxnjclhp.supabase.co';
const anon=(readFileSync('apps/cliente/.env.local','utf8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]??'').trim();
const kc=(s,email=false)=> email
  ? execSync(`security find-generic-password -s ${s} | grep '"acct"' | sed 's/.*="//;s/"$//'`,{encoding:'utf8'}).trim()
  : execSync(`security find-generic-password -s ${s} -w`,{encoding:'utf8'}).trim();
async function sesion(svc){
  const r=await fetch(`${URL}/auth/v1/token?grant_type=password`,{method:'POST',
    headers:{apikey:anon,'Content-Type':'application/json'},
    body:JSON.stringify({email:kc(svc,true),password:kc(svc)})});
  const s=await r.json();
  if(!s.access_token) throw new Error(`${svc}: ${s.error_description??s.msg}`);
  return s;
}
const rpc=(tok)=>async(f,b={})=>{const q=await fetch(`${URL}/rest/v1/rpc/${f}`,{method:'POST',
  headers:{apikey:anon,Authorization:`Bearer ${tok}`,'Content-Type':'application/json'},body:JSON.stringify(b)});
  return {status:q.status,data:await q.json().catch(()=>null)};};

let fallos=0; const chk=(n,ok,d='')=>{console.log(`  ${ok?'✓':'🔴'} ${n}${d?' · '+d:''}`);if(!ok)fallos++;};

const fam=await sesion('epetplace-cuenta-founder');   // la familia
const casa=await sesion('epetplace-cuenta-casa-prueba'); // el asiento de la casa
const rf=rpc(fam.access_token), rc=rpc(casa.access_token);
chk('el asiento casa es admin', (await rc('is_admin')).data===true);
chk('la familia NO es admin', (await rf('is_admin')).data===false);

const famId=(await rf('_familia_del_user',{p_user:fam.user.id})).data;
const saldo0=Number((await rf('saldo_hogar_disponible',{p_familia:famId})).data);
console.log(`  familia ${String(famId).slice(0,8)} · saldo inicial ${saldo0}\n`);

// FAMILIA abre el caso
const hace6=new Date(Date.now()-6*864e5).toISOString().slice(0,10);
const cit=(await (await fetch(`${URL}/rest/v1/evento_cita_servicio?select=id&fecha=gte.${hace6}&order=fecha.asc&limit=1`,{headers:{apikey:anon,Authorization:`Bearer ${fam.access_token}`}})).json())[0].id;
const ab=await rf('abrir_caso',{p_objeto_tipo:'cita',p_objeto_id:cit,p_motivo:'duracion',p_relato:'SONDA ARCO-13'});
const caso=ab.data?.caso_id;
chk('FAMILIA abre el caso', ab.data?.ok===true, `clase ${ab.data?.clase_resuelta}`);
if(!caso){console.log('🔴 sin caso');process.exit(1);}

// la CASA lo toma y lo resuelve (parcial 4) — camino real, no bypass
await rf('caso_pedir_casa',{p_caso_id:caso});   // familia lo escala
const res=await rc('caso_resolver',{p_caso_id:caso,p_alcance:'parcial',p_monto:4.00,p_motivo:'sonda'});
chk('la CASA resuelve (is_admin, no service_role)', res.data?.ok===true, `camino=${res.data?.camino} tenia_devengo=${res.data?.tenia_devengo}`);

// FAMILIA elige saldo → se acredita
const el=await rf('caso_elegir_destino',{p_caso_id:caso,p_destino:'saldo'});
chk('FAMILIA elige saldo y se acredita', el.data?.ok===true && el.data?.estado==='aplicado', JSON.stringify(el.data).slice(0,70));
const saldo1=Number((await rf('saldo_hogar_disponible',{p_familia:famId})).data);
chk('el saldo subió exactamente 4', saldo1===saldo0+4, `${saldo0} → ${saldo1}`);

// un TERCERO no ve el caso (RLS de tres asientos, por camino real)
const ter=await sesion('epetplace-cuenta-prueba'); // prestador demo, no es de esta familia ni la casa
const vt=await fetch(`${URL}/rest/v1/casos_postventa?id=eq.${caso}&select=id`,{headers:{apikey:anon,Authorization:`Bearer ${ter.access_token}`}});
const vtj=await vt.json();
chk('un tercero NO ve este caso', Array.isArray(vtj)&&vtj.length===0, `${vtj.length??'?'} filas`);

console.log(fallos===0?'\n✅ VERDE · arco entero, dos asientos reales, PostgREST':`\n🔴 ${fallos} fallo(s)`);
execSync(`cat > /tmp/cl13.sql <<X
delete from saldo_hogar_movimientos where origen_id='${caso}';
delete from caso_mensajes where caso_id='${caso}';
delete from casos_postventa where id='${caso}';
X`);
process.exit(fallos===0?0:1);
