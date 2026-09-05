/* S113-A · 1.0 · A6 — LA LLAMADA REAL a extract-vacuna v2, con el carnet «1 → 12».
 * Pega la respuesta (vacunas + plan_impreso) y la fila de ia_uso que quedó. */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const R = process.cwd();
const env = Object.fromEntries(readFileSync(`${R}/apps/cliente/.env.local`,'utf8')
  .split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]));
const SERVICE = readFileSync(`${R}/supabase/dev/.env.local`,'utf8').match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
const CLAVE = execFileSync('/usr/bin/security',
  ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'], { encoding:'utf8' }).trim();

const cli   = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, { auth:{persistSession:false} });
const admin = createClient(env.EXPO_PUBLIC_SUPABASE_URL, SERVICE, { auth:{persistSession:false} });
const { data: ses } = await cli.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password: CLAVE });
if (!ses?.session) { console.error('🔴 sin sesión'); process.exit(2); }

const CARNET = '889a72c5-8d55-4cfd-a48f-b427cf9e9305/carnet-1783564367515.jpg';
const { data: blob, error: eB } = await admin.storage.from('mascotas').download(CARNET);
if (eB) { console.error('🔴 no pude bajar el carnet:', eB.message); process.exit(2); }
const b64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
console.log(`carnet «1 → 12» · ${CARNET.split('/')[1]} · ${(b64.length/1024).toFixed(0)} kB en base64\n`);

const antes = new Date().toISOString();
const t0 = Date.now();
const r = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/extract-vacuna`, {
  method:'POST',
  headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${ses.session.access_token}`, apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY },
  body: JSON.stringify({ imageBase64: b64, mediaType: 'image/jpeg' }),
});
const ms = Date.now() - t0;
const j = await r.json().catch(()=>null);
console.log(`HTTP ${r.status} · ${(ms/1000).toFixed(1)} s de pared\n`);
if (!j) { console.error('🔴 respuesta no-JSON'); process.exit(2); }
if (r.status !== 200) { console.log('CUERPO DEL ERROR:', JSON.stringify(j)); }

console.log(`── vacunas: ${Array.isArray(j.vacunas)?j.vacunas.length:'—'} ──`);
for (const v of j.vacunas ?? []) console.log('  ', JSON.stringify(v));
console.log(`\n── plan_impreso: ${Array.isArray(j.plan_impreso)?j.plan_impreso.length:'—'} ──`);
for (const p of j.plan_impreso ?? []) console.log('  ', JSON.stringify(p));

const { data: uso } = await admin.from('ia_uso').select('*').gte('created_at', antes)
  .order('created_at',{ascending:false}).limit(1);
console.log('\n── la fila de ia_uso ──');
console.log(uso?.[0] ? JSON.stringify(uso[0], null, 2) : '🔴 NINGUNA fila nueva en ia_uso');
