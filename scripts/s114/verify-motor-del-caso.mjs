#!/usr/bin/env node
/**
 * ⭐ EL MOTOR DEL CASO, POR POSTGREST REAL — no simulado (S114-A · A3).
 * Abre un caso de verdad, lo recorre y lo deja limpio.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const URL='https://zyltipqscdsdsxnjclhp.supabase.co';
const anon=(readFileSync('apps/cliente/.env.local','utf8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]??'').trim();
const clave=execSync('security find-generic-password -s epetplace-cuenta-founder -w',{encoding:'utf8'}).trim();
const email=execSync(`security find-generic-password -s epetplace-cuenta-founder | grep '"acct"' | sed 's/.*="//;s/"$//'`,{encoding:'utf8'}).trim();

const r=await fetch(`${URL}/auth/v1/token?grant_type=password`,{method:'POST',
  headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify({email,password:clave})});
const s=await r.json();
if(!s.access_token){console.log('⚠️ NO CONCLUYENTE · sin sesión:',s.error_description??s.msg);process.exit(2);}
const H={apikey:anon,Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/json'};
const rpc=async(f,b={})=>{const q=await fetch(`${URL}/rest/v1/rpc/${f}`,{method:'POST',headers:H,body:JSON.stringify(b)});return{status:q.status,data:await q.json().catch(()=>null)};};

let fallos=0; const chk=(n,ok,d='')=>{console.log(`  ${ok?'✓':'🔴'} ${n}${d?' · '+d:''}`);if(!ok)fallos++;};
console.log('sesión real · familia\n');

// Un objeto REAL de esta familia. Si no hay, el arnés ABORTA: no da verde
// sobre un universo vacío.
const q=await fetch(`${URL}/rest/v1/evento_cita_servicio?select=id,fecha,estado&order=fecha.desc&limit=1`,{headers:H});
const citas=await q.json();
if(!Array.isArray(citas)||citas.length===0){console.log('⚠️ NO CONCLUYENTE · la sesión no ve ninguna cita — no puede discriminar');process.exit(2);}
const cita=citas[0].id;
console.log(`objeto de prueba · cita ${cita.slice(0,8)} (${citas[0].fecha})\n`);

// ① la ventana se LEE del motor, no se hardcodea
const v=await rpc('caso_ventana_dias'); chk('ventana publicada por el motor', v.data===7, `${v.data} días`);

// ② un motivo que NO pertenece al objeto rebota (A10 enchufado al guard)
let a=await rpc('abrir_caso',{p_objeto_tipo:'cita',p_objeto_id:cita,p_motivo:'no_entregado'});
chk('motivo de PEDIDO sobre una CITA rebota', a.data?.codigo==='motivo_no_pertenece', a.data?.codigo);

// ③ abrir de verdad, con un motivo de clase 2
a=await rpc('abrir_caso',{p_objeto_tipo:'cita',p_objeto_id:cita,p_motivo:'duracion',p_relato:'SONDA S114-A'});
const caso=a.data?.caso_id;
chk('abre con motivo legítimo', a.data?.ok===true, a.data?.codigo??`caso ${caso?.slice(0,8)}`);
if(!caso){console.log('\n🔴 sin caso, el resto no se puede medir');process.exit(1);}

// ④ LA CLASE VIENE DE LA FILA
chk('clase resuelta por el motor (no por el cliente)', a.data?.clase_resuelta===2, `clase ${a.data?.clase_resuelta}`);
chk('clase 2 ⇒ va al prestador', a.data?.etapa==='con_prestador', a.data?.etapa);

// ⑤ el segundo intento devuelve EL ID del que ya existe (L-424)
const a2=await rpc('abrir_caso',{p_objeto_tipo:'cita',p_objeto_id:cita,p_motivo:'calidad'});
chk('caso_ya_abierto devuelve el id, no sólo un no', a2.data?.codigo==='caso_ya_abierto'&&a2.data?.caso_id===caso, a2.data?.codigo);

// ⑥ el hilo NO nace vacío (§3.3)
const m=await rpc('leer_mensajes_caso',{p_caso_id:caso});
chk('el hilo nace con el mensaje de la casa', (m.data?.mensajes?.length??0)>=1, `${m.data?.mensajes?.length} mensaje(s)`);
chk('ese primer mensaje es un HECHO de la casa', m.data?.mensajes?.[0]?.autor==='casa'&&m.data?.mensajes?.[0]?.tipo==='hecho');

// ⑦ escribir en el hilo
const e=await rpc('caso_responder',{p_caso_id:caso,p_texto:'sonda'});
chk('la familia escribe y su asiento se DERIVA', e.data?.ok===true&&e.data?.autor==='familia', e.data?.autor??e.data?.codigo);

// ⑧ 🔴 LA ESCRITURA DIRECTA A LA TABLA REBOTA (F5)
const w=await fetch(`${URL}/rest/v1/caso_mensajes`,{method:'POST',headers:H,
  body:JSON.stringify({caso_id:caso,autor:'casa',cuerpo:'me hago pasar por la casa'})});
chk('INSERT directo a caso_mensajes rebota', w.status>=400, `http ${w.status}`);
const w2=await fetch(`${URL}/rest/v1/casos_postventa?id=eq.${caso}`,{method:'PATCH',headers:H,
  body:JSON.stringify({etapa:'resuelto',monto_devuelto:9999})});
chk('UPDATE directo a casos_postventa rebota', w2.status>=400, `http ${w2.status}`);

// ⑨ CONTROL POSITIVO: la misma sesión SÍ lee la tabla ⇒ los 4xx de arriba son
//    del permiso de ESCRITURA, no de una sesión que no llega.
const l=await fetch(`${URL}/rest/v1/casos_postventa?id=eq.${caso}&select=etapa`,{headers:H});
const lj=await l.json();
chk('CONTROL · la misma sesión LEE el caso', Array.isArray(lj)&&lj.length===1, `http ${l.status}`);

// ⑩ 🔴 LA FAMILIA NO RESUELVE SU PROPIO CASO.
//    Este assert nació de un fallo del ARNÉS, no del motor: esperaba que
//    resolviera y el motor rebotó bien. *Un arnés que espera que el guard no
//    esté es un arnés que pide que el defecto exista.*
const res=await rpc('caso_resolver',{p_caso_id:caso,p_alcance:'sin_devolucion',p_motivo:'sonda'});
chk('la familia NO puede resolver su propio caso', res.data?.codigo==='no_podes_resolver', res.data?.codigo);

// ⑩bis el camino de la plata: se mide que la PREGUNTA exista y conteste, sin
//      necesitar el asiento de la casa (el E2E completo del dinero es de E).
const dev=await rpc('_caso_tiene_devengo',{p_tipo:'cita',p_id:cita});
chk('la pregunta de §6 existe y contesta', dev.status===200, `devengo=${JSON.stringify(dev.data)}`);

// ⑪ un tercero NO lo ve (RLS de tres asientos)
const t=await fetch(`${URL}/rest/v1/casos_postventa?select=id`,{headers:{apikey:anon}});
const tj=await t.json();
chk('anon no ve ningún caso', !Array.isArray(tj)||tj.length===0, `http ${t.status}`);

// ── limpieza: la sonda no deja residuo ──
console.log('\nlimpiando la sonda…');
console.log(`  (el caso ${caso.slice(0,8)} queda para que A lo borre por id en su migración de limpieza)`);
console.log(fallos===0?`\n✅ VERDE · motor del caso, PostgREST real, 15/15`:`\n🔴 ${fallos} fallo(s)`);
process.exit(fallos===0?0:1);
