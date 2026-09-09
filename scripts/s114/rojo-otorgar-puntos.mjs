// ROJO de `otorgar_puntos` por el CAMINO REAL (PostgREST), no por lectura de ACL.
// «El permiso está abierto» es una lectura; «acuñó puntos» es un hecho (L-321).
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const URL='https://zyltipqscdsdsxnjclhp.supabase.co';
const anon=(readFileSync('apps/cliente/.env.local','utf8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]??'').trim();
const clave=execSync('security find-generic-password -s epetplace-cuenta-prueba -w',{encoding:'utf8'}).trim();
const email=execSync(`security find-generic-password -s epetplace-cuenta-prueba | grep '"acct"' | sed 's/.*="//;s/"$//'`,{encoding:'utf8'}).trim();

const r=await fetch(`${URL}/auth/v1/token?grant_type=password`,{method:'POST',
  headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify({email,password:clave})});
const s=await r.json();
if(!s.access_token){console.log('NO CONCLUYENTE · sin sesión');process.exit(2);}

// ¿Es admin esta cuenta? Si lo fuera, el rojo no probaría nada.
const qa=await fetch(`${URL}/rest/v1/rpc/is_admin`,{method:'POST',
  headers:{apikey:anon,Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/json'},body:'{}'});
const esAdmin=await qa.json();
console.log(`cuenta de prueba · is_admin = ${JSON.stringify(esAdmin)}`);
if(esAdmin===true){console.log('🔴 NO CONCLUYENTE · la cuenta ES admin; su éxito no probaría el agujero');process.exit(2);}

// EL ATAQUE: un usuario común se acuña 999 puntos A SÍ MISMO.
const yo=s.user.id;
const q=await fetch(`${URL}/rest/v1/rpc/otorgar_puntos`,{method:'POST',
  headers:{apikey:anon,Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/json'},
  body:JSON.stringify({p_user_id:yo,p_puntos:999,p_tipo:'ajuste',p_descripcion:'ROJO S114-A · sonda de seguridad'})});
console.log(`\nusuario COMÚN llamando otorgar_puntos → HTTP ${q.status}`);
const cuerpo = q.status>=400 ? await q.text() : '';
if(q.status>=400){
  // 🔴 DISCRIMINADOR. Un 400 con `23514` es un CHECK que rebotó DESPUÉS de
  // ejecutar la función — o sea, el permiso pasó. Sólo un 42501 o un 403
  // prueban que la puerta está cerrada. *Leer «≥400 = seguro» es cómo un
  // arnés de seguridad da verde sobre un agujero abierto.*
  const esPermiso = q.status===403 || cuerpo.includes('42501') || cuerpo.includes('permission denied');
  console.log('   respuesta:', cuerpo.slice(0,120));
  if(esPermiso){ console.log('\n✅ CERRADO · rebotó por PERMISO'); process.exit(0); }
  console.log('\n🔴 NO CONCLUYENTE · rebotó, pero NO por permiso — la función se ejecutó.');
  process.exit(2);
}

console.log('   🔴 ENTRÓ. Un usuario con sesión acuña puntos para quien quiera.');
// Se mide el efecto y se limpia.
const v=await fetch(`${URL}/rest/v1/puntos_usuario?user_id=eq.${yo}&select=puntos_totales`,
  {headers:{apikey:anon,Authorization:`Bearer ${s.access_token}`}});
console.log('   efecto en puntos_usuario:', JSON.stringify(await v.json()));
console.log('\n   ⚠️  LA SONDA DEJÓ RESIDUO — se limpia en la migración de la cura.');
process.exit(1);
