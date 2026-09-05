/* S113-A · lote 1.0 · A4 — EL ROJO POR CAMPO, con sesión REAL.
 *
 * Mide, contra Thor d2e31d70 (guillo381+8), qué campos VIENEN de la base con el
 * select del wrapper. Se corre en dos anclas: antes de A4 tiene que faltar todo
 * lo nuevo; después tiene que estar. Sin controles, un «está» no dice nada — por
 * eso cada bloque lleva un campo que YA existía y tiene que seguir estando. */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const env = Object.fromEntries(readFileSync(`${process.cwd()}/apps/cliente/.env.local`,'utf8')
  .split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]));
const CLAVE = execFileSync('/usr/bin/security',
  ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'], { encoding:'utf8' }).trim();
const cli = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, { auth:{persistSession:false} });
const { data: ses } = await cli.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password: CLAVE });
if (!ses?.session) { console.error('🔴 sin sesión'); process.exit(2); }

const { data: m } = await cli.from('mascotas')/* ⚠️ id COMPLETO, no `like`: PostgREST no aplica `like` sobre una columna
      uuid y devuelve vacío SIN error — un cero por instrumento, no por dato.
      Lo cazó el control de esta misma línea. */
  .select('id,nombre').eq('id','d2e31d70-54fc-4d47-b425-1617239257eb').maybeSingle();
if (!m) { console.error('🔴 CONTROL: no veo a Thor d2e31d70 con esta sesión'); process.exit(2); }
console.log(`sesión OK · ${m.nombre} ${m.id.slice(0,8)}\n`);

const di = (ok, k, v) => console.log(`  ${ok?'✅':'🔴'} ${k.padEnd(28)} ${v}`);
const hay = (o,k) => o && Object.prototype.hasOwnProperty.call(o,k);
let fallas = 0;
const chk = (o,k,control=false) => {
  const p = hay(o,k); if (!p) fallas++;
  di(p, k, p ? (o[k]===null?'null honesto':JSON.stringify(o[k]).slice(0,60)) : 'AUSENTE del objeto');
};

console.log('── VACUNAS ──────────────────────────────────────────────');
const { data: v } = await cli.from('evento_vacuna_aplicada')
  .select('evento_id, nombre_vacuna, tipo_vacuna, fecha_aplicada, fecha_proxima, lote, veterinario_nombre_externo, laboratorio, via_administracion, vencimiento_biologico, archivo_url')
  .eq('mascota_id', m.id).limit(1).maybeSingle();
console.log('  (CONTROL+ los que ya viajaban)');
['nombre_vacuna','fecha_aplicada'].forEach(k=>chk(v,k,true));
console.log('  (los que A4 agrega)');
['lote','veterinario_nombre_externo','laboratorio','via_administracion','vencimiento_biologico','archivo_url'].forEach(k=>chk(v,k));

console.log('\n── PERFIL VIGENTE ───────────────────────────────────────');
const { data: p } = await cli.from('mascota_perfil_vigente')
  .select('peso_clinico_kg, condiciones_cronicas, medicacion_actual, tiene_emergencia_activa, alergias, alergias_ninguna_declarada_en')
  .eq('mascota_id', m.id).maybeSingle();
console.log('  (CONTROL+)'); ['peso_clinico_kg','alergias'].forEach(k=>chk(p,k,true));
console.log('  (A4)'); ['medicacion_actual'].forEach(k=>chk(p,k));
console.log(`  · condiciones_cronicas: ${JSON.stringify(p?.condiciones_cronicas)}  ⚠️ vacío en TODA la base`);
console.log(`  · medicacion_actual: ${Array.isArray(p?.medicacion_actual)?p.medicacion_actual.length:0} ítems`);

console.log('\n── RESTRICCIONES ────────────────────────────────────────');
const { data: r, error: er } = await cli.from('restricciones_mascota_activas')
  .select('familia_servicio, severidad, cat_restricciones_servicio(descripcion)')
  .eq('mascota_id', m.id).eq('estado','activa');
if (er) { fallas++; di(false,'consulta','🔴 '+er.message); }
else { di(r.length>0, 'filas activas', `${r.length} · ${JSON.stringify(r[0]??null).slice(0,90)}`); if(!r.length) fallas++; }

console.log('\n── DESPARASITACIONES ────────────────────────────────────');
const { data: d, error: ed } = await cli.from('evento_desparasitacion_aplicada')
  .select('producto, tipo_desparasitacion, fecha_aplicada, fecha_proxima, plagas, lote')
  .eq('mascota_id', m.id).limit(1);
if (ed) { fallas++; di(false,'consulta','🔴 '+ed.message); }
else di(true,'la consulta con plagas+lote', `no rebota · ${d.length} filas (cero desparasitaciones en toda la base)`);

console.log(`\n════ ${fallas===0?'✅ TODO PRESENTE':'🔴 '+fallas+' campo(s) ausentes'} ════`);
process.exit(fallas===0?0:1);
