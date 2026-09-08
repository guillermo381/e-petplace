// A10 · verificación por POSTGREST REAL, no simulada.
// Prueba lo que un SELECT en SQL no puede: que la vista y el predicado sean
// alcanzables desde afuera con una sesión de verdad, y que anon rebote.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const URL = 'https://zyltipqscdsdsxnjclhp.supabase.co';
const cred = execSync('security find-generic-password -s epetplace-cuenta-prueba -w', {encoding:'utf8'}).trim();
const anon = (readFileSync('apps/cliente/.env.local','utf8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1] ?? '').trim();
if (!anon) { console.log('🔴 NO CONCLUYENTE · sin anon key en el llavero. No se cae a un fallback.'); process.exit(0); }

// El llavero guarda el EMAIL en `acct` y la CLAVE en el secreto. Los dos se
// leen al momento y ninguno se imprime.
const email = execSync("security find-generic-password -s epetplace-cuenta-prueba | grep '\"acct\"' | sed 's/.*=\"//;s/\"$//'", {encoding:'utf8'}).trim();
const clave = cred;
if (!email || !clave) { console.log('🔴 NO CONCLUYENTE · falta email o clave en el llavero'); process.exit(0); }

const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method:'POST', headers:{apikey:anon,'Content-Type':'application/json'},
  body: JSON.stringify({email, password: clave})
});
const sesion = await r.json();
if (!sesion.access_token) { console.log('🔴 NO CONCLUYENTE · no hubo sesión:', sesion.error_description ?? sesion.msg); process.exit(0); }
console.log('sesión real obtenida\n');

const H = t => ({apikey:anon, Authorization:`Bearer ${t}`});
let fallos = 0;
const chk = (n, ok, det='') => { console.log(`  ${ok?'✓':'🔴'} ${n}${det?' · '+det:''}`); if(!ok) fallos++; };

// ① la vista, por objeto — los tres tamaños medidos en SQL
for (const [obj, esperado] of [['cita',10],['estadia',12],['pedido',8]]) {
  const q = await fetch(`${URL}/rest/v1/v_motivos_resueltos?objeto_resuelto=eq.${obj}&select=codigo`, {headers:H(sesion.access_token)});
  const filas = await q.json();
  chk(`vista · ${obj}`, Array.isArray(filas) && filas.length===esperado, `${Array.isArray(filas)?filas.length:JSON.stringify(filas).slice(0,60)} (esperaba ${esperado})`);
}

// ② el predicado por RPC — los dos casos del rojo
for (const [cod, obj, esperado] of [['calidad','estadia',true], ['calidad','pedido',false], ['otra_cosa','estadia',true]]) {
  const q = await fetch(`${URL}/rest/v1/rpc/_motivo_pertenece_al_objeto`, {
    method:'POST', headers:{...H(sesion.access_token),'Content-Type':'application/json'},
    body: JSON.stringify({p_codigo:cod, p_objeto:obj})});
  const v = await q.json();
  chk(`predicado · ${obj}+${cod}`, v===esperado, `devolvió ${JSON.stringify(v)} (esperaba ${esperado})`);
}

// ③ ANÓNIMO: la vista y el predicado tienen que rebotar
const qa = await fetch(`${URL}/rest/v1/v_motivos_resueltos?select=codigo`, {headers:{apikey:anon}});
const fa = await qa.json();
chk('anon NO lee la vista', !Array.isArray(fa) || fa.length===0, `http ${qa.status}`);
const qb = await fetch(`${URL}/rest/v1/rpc/_motivo_pertenece_al_objeto`, {
  method:'POST', headers:{apikey:anon,'Content-Type':'application/json'},
  body: JSON.stringify({p_codigo:'calidad',p_objeto:'cita'})});
chk('anon NO ejecuta el predicado', qb.status >= 400, `http ${qb.status}`);

// ④ CONTROL POSITIVO DEL ARNÉS: si la sesión no sirviera, todo daría cero y
// el ③ pasaría por la razón equivocada. Se prueba que ESTA sesión sí lee algo.
const qc = await fetch(`${URL}/rest/v1/cat_motivos_postventa?select=codigo&limit=1`, {headers:H(sesion.access_token)});
const fc = await qc.json();
chk('CONTROL: la sesión SÍ lee el catálogo', Array.isArray(fc) && fc.length===1, `http ${qc.status}`);

// ⑤ EL CANDADO F5 por el camino real: authenticated no puede escribir.
const qd = await fetch(`${URL}/rest/v1/cat_motivos_postventa`, {
  method:'POST', headers:{...H(sesion.access_token),'Content-Type':'application/json'},
  body: JSON.stringify({codigo:'sonda_a10', objeto:'cita', clase:2, voz:'sonda'})});
chk('authenticated NO puede INSERT', qd.status >= 400, `http ${qd.status}`);

console.log(fallos===0 ? '\n✅ VERDE · PostgREST real, 10/10' : `\n🔴 ${fallos} fallo(s)`);
process.exit(fallos===0?0:1);
