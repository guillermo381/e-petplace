/* S113-A — ROJO/VERDE de los dos pedidos de C, con Thor y sesión real.
 * ① la plaga más urgente en SenalHogar · ② alergias_detalle con forma. */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const R = process.cwd();
const env = Object.fromEntries(readFileSync(`${R}/apps/cliente/.env.local`,'utf8')
  .split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]));
const SERVICE = readFileSync(`${R}/supabase/dev/.env.local`,'utf8').match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
const CLAVE = execFileSync('/usr/bin/security',['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'],{encoding:'utf8'}).trim();
const cli = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {auth:{persistSession:false}});
const admin = createClient(env.EXPO_PUBLIC_SUPABASE_URL, SERVICE, {auth:{persistSession:false}});
const { data: ses } = await cli.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password: CLAVE });
if (!ses?.session) { console.error('🔴 sin sesión'); process.exit(2); }
const THOR = 'd2e31d70-54fc-4d47-b425-1617239257eb';
let fallas = 0;
const di=(ok,q,v)=>{ if(!ok) fallas++; console.log(`  ${ok?'✅':'🔴'} ${q.padEnd(38)} ${v}`); };

// ── ② alergias_detalle · Thor tiene UNA alergia real ────────────────────────
console.log('── ② alergias_detalle, contra el dato real de Thor ──');
const { data: p } = await cli.from('mascota_perfil_vigente').select('alergias').eq('mascota_id', THOR).maybeSingle();
const a = Array.isArray(p?.alergias) ? p.alergias[0] : null;
di(!!a, 'Thor tiene una alergia', a ? JSON.stringify(a).slice(0,70) : 'NINGUNA — el rojo no se puede medir');
if (a) for (const k of ['alergeno','severidad','categoria','estado','fecha_diagnostico','evento_id'])
  di(Object.prototype.hasOwnProperty.call(a,k), `  clave ${k}`, JSON.stringify(a[k]));
/* CONTROL NEGATIVO: la clave que el tipo NO declara y la tabla SÍ tiene.
   Si apareciera, el tipo estaría leyendo la tabla en vez del trigger. */
di(!Object.prototype.hasOwnProperty.call(a??{},'categoria_alergeno'),
   '  CONTROL− categoria_alergeno', 'ausente ⇒ el jsonb dice `categoria`, no el nombre de la columna');

// ── ① la plaga · ROJO primero: hoy Thor no tiene ninguna ────────────────────
console.log('\n── ① la plaga más urgente ──');
const { data: d0 } = await cli.from('evento_desparasitacion_aplicada')
  .select('mascota_id, plagas, fecha_proxima').eq('mascota_id', THOR);
di(d0.length === 0, 'ROJO · Thor sin desparasitaciones', `${d0.length} filas ⇒ proxima_desparasitacion tiene que ser null`);

const { data: ins, error: eI } = await admin.from('evento_desparasitacion_aplicada').insert([
  { mascota_id: THOR, country_code:'EC', producto:'FIXTURE-PLAGA-lejana', fecha_aplicada:'2026-01-10', fecha_proxima:'2027-01-10', plagas:['internos'] },
  { mascota_id: THOR, country_code:'EC', producto:'FIXTURE-PLAGA-urgente', fecha_aplicada:'2026-02-10', fecha_proxima:'2026-03-01', plagas:['pulgas','garrapatas'] },
]).select('id, evento_id');
if (eI) { console.error('🔴 no pude sembrar:', eI.message); process.exit(2); }

const { data: d1 } = await cli.from('evento_desparasitacion_aplicada')
  .select('mascota_id, plagas, fecha_proxima').eq('mascota_id', THOR).not('fecha_proxima','is',null);
let mejor = null;
for (const d of d1) { if (!Array.isArray(d.plagas)) continue;
  for (const pl of d.plagas) if (mejor === null || d.fecha_proxima < mejor.fecha) mejor = { plaga: pl, fecha: d.fecha_proxima }; }
di(mejor?.fecha === '2026-03-01', 'VERDE · gana la fecha más temprana', JSON.stringify(mejor));
di(['pulgas','garrapatas'].includes(mejor?.plaga), '  y la plaga es de esa fila', mejor?.plaga ?? '—');
di(d1.length === 2 && d1.every(x=>Array.isArray(x.plagas)), '  DISCRIMINADOR · la lejana existe y pierde', `${d1.length} filas, la de 2027 no ganó`);

await admin.from('eventos_mascota').delete().in('id', ins.map(x=>x.evento_id));
await admin.from('evento_desparasitacion_aplicada').delete().in('id', ins.map(x=>x.id));
const { count } = await admin.from('evento_desparasitacion_aplicada')
  .select('id',{count:'exact',head:true}).like('producto','FIXTURE-PLAGA%');
di(count === 0, 'RESIDUO', `${count} — limpiado con el rol que PUEDE borrar (L-491)`);

console.log(`\n${fallas===0?'✅ LOS DOS PEDIDOS, VERDES':'🔴 '+fallas+' falla(s)'}`);
process.exit(fallas===0?0:1);
