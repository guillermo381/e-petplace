import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const URL='https://zyltipqscdsdsxnjclhp.supabase.co';
const anon=(readFileSync('apps/cliente/.env.local','utf8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]??'').trim();
const clave=execSync('security find-generic-password -s epetplace-cuenta-founder -w',{encoding:'utf8'}).trim();
const email=execSync(`security find-generic-password -s epetplace-cuenta-founder | grep '"acct"' | sed 's/.*="//;s/"$//'`,{encoding:'utf8'}).trim();
const r=await fetch(`${URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify({email,password:clave})});
const s=await r.json();
const H={apikey:anon,Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/json'};
const rpc=async(f,b={})=>{const q=await fetch(`${URL}/rest/v1/rpc/${f}`,{method:'POST',headers:H,body:JSON.stringify(b)});return{status:q.status,data:await q.json().catch(()=>null)};};
let fallos=0; const chk=(n,ok,d='')=>{console.log(`  ${ok?'✓':'🔴'} ${n}${d?' · '+d:''}`);if(!ok)fallos++;};

// C6: obtener_mis_casos devuelve array
const m=await rpc('obtener_mis_casos');
chk('obtener_mis_casos responde array', Array.isArray(m.data), `${m.status} · ${Array.isArray(m.data)?m.data.length+' casos':JSON.stringify(m.data).slice(0,50)}`);

// C②: abrir un caso, retirarlo (final alterno), y leer etapa_en_escalera
const hace6=new Date(Date.now()-6*864e5).toISOString().slice(0,10);
const citas=await (await fetch(`${URL}/rest/v1/evento_cita_servicio?select=id,fecha&fecha=gte.${hace6}&order=fecha.asc&limit=1`,{headers:H})).json();
if(!Array.isArray(citas)||citas.length===0){console.log('⚠️ NO CONCLUYENTE · sin cita dentro de ventana para C②');process.exit(2);}
const cit=citas[0].id;
const a=await rpc('abrir_caso',{p_objeto_tipo:'cita',p_objeto_id:cit,p_motivo:'duracion',p_relato:'SONDA C2'});
const caso=a.data?.caso_id;
if(!caso){ chk('C② pudo abrir un caso para medir', false, JSON.stringify(a.data)); } else {
  const rr=await rpc('caso_pedir_casa',{p_caso_id:caso});  // → con_casa (en escalera)
  const l1=await rpc('leer_caso',{p_caso_id:caso});
  chk('en escalera: etapa_en_escalera = etapa actual', l1.data?.etapa_en_escalera===l1.data?.etapa, `${l1.data?.etapa}`);
  // retirar es final alterno FUERA de escalera
  const ret=await rpc('caso_responder',{p_caso_id:caso,p_texto:'x'}); // sólo para no dejar hilo raro
  // mover a retirado por la familia
  const q=await fetch(`${URL}/rest/v1/rpc/_caso_mover`,{method:'POST',headers:H,body:JSON.stringify({p_caso_id:caso,p_hasta:'retirado',p_actor:'familia',p_actor_user:s.user.id})});
  const l2=await rpc('leer_caso',{p_caso_id:caso});
  chk('final alterno: etapa_en_escalera conserva el paso previo', l2.data?.etapa==='retirado' && l2.data?.etapa_en_escalera==='con_casa', `etapa=${l2.data?.etapa} escalera=${l2.data?.etapa_en_escalera}`);
  chk('en_escalera=false en el final alterno', l2.data?.en_escalera===false);
}
console.log(fallos===0?'\n✅ VERDE · C6 y C② por PostgREST real':`\n🔴 ${fallos} fallo(s)`);
// limpiar
execSync(`echo "delete from caso_mensajes where caso_id in (select id from casos_postventa where relato='SONDA C2'); delete from casos_postventa where relato='SONDA C2';" > /tmp/cl.sql`);
process.exit(fallos===0?0:1);
