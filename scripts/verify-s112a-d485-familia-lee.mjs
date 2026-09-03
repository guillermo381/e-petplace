#!/usr/bin/env node
/**
 * S112-A · D-485 EL CENSO — el arnés REAL, por PostgREST, no por rol simulado.
 *
 * La migración `20260908920000` ya probó las cinco tablas bajo `SET LOCAL
 * ROLE authenticated` — que hace lo mismo que PostgREST bajo el capó. Este
 * arnés prueba la OTRA mitad: el camino que de verdad usa el teléfono,
 * anon key + sesión real, y de PASO demuestra la asimetría que dio origen a
 * D-485 — la familia ESCRIBE (vía `mascotas_update_familia`) sin que hiciera
 * falta nada de esto; lo que faltaba era que también pudiera LEER.
 *
 * 🔴 Siembra y borra en la FAMILIA REAL del titular de prueba (`guillo381+8`),
 * no en una sintética — para probar el camino de PostgREST hace falta un
 * `familia_id` real con RLS real encima, y esa familia ya tiene la forma
 * correcta. Se agrega un miembro temporal y se retira al final; el resto
 * de la familia no se toca.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SEC = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();
const env = Object.fromEntries(readFileSync(`${SEC}/apps/cliente/.env.local`, 'utf8')
  .split('\n').filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = readFileSync(`${SEC}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

async function sesion(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: CLAVE });
  if (error) throw new Error(`${email}: ${error.message}`);
  return c;
}


// Titular real, su familia real, y un tercero real (fuera de esa familia).
const { data: uTitular } = await admin.auth.admin.listUsers();
const titular = uTitular.users.find((u) => u.email === 'guillo381+8@gmail.com');
const familiarCandidato = uTitular.users.find((u) => u.email === 'guillo381+1@gmail.com');
const tercero = uTitular.users.find((u) => u.email === 'guillo381+2@gmail.com');
if (!titular || !familiarCandidato || !tercero) {
  console.error('🔴 faltan cuentas guillo381+8/+1/+2'); process.exit(2);
}

const { data: fm } = await admin.from('familia_miembro').select('familia_id')
  .eq('user_id', titular.id).is('hasta', null).limit(1).single();
const familiaId = fm.familia_id;

const fallos = [];
let mascotaId, familiarInsertado = false;
try {
  // ═══ SIEMBRA — mascota del titular, ESCRITA por el familiar ANTES de leer ═
  const { data: m, error: eM } = await admin.from('mascotas').insert({
    nombre: '__arnes_d485__', especie: 'perro', sexo: 'macho', country_code: 'EC',
    familia_id: familiaId, origen: 'adoptado',
    fecha_nacimiento: '2024-01-01', fecha_nacimiento_precision: 'estimada',
    estado_vida: 'activa', user_id: titular.id,
  }).select('id').single();
  if (eM) throw new Error(`sembrar mascota: ${eM.message}`);
  mascotaId = m.id;

  const { error: eEst } = await admin.from('estadias').insert({
    prestador_id: (await admin.from('prestadores').select('id').eq('estado', 'activo').limit(1).single()).data.id,
    user_id: titular.id, mascota_id: mascotaId,
    fecha_entrada: new Date().toISOString().slice(0, 10),
    fecha_salida: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    cantidad_noches: 1, precio_por_noche: 10, precio_total: 10,
  });
  if (eEst) throw new Error(`sembrar estadia: ${eEst.message}`);

  const { error: eFam } = await admin.from('familia_miembro').insert({
    familia_id: familiaId, user_id: familiarCandidato.id, rol: 'adulto_autorizado',
  });
  if (eFam) throw new Error(`sembrar familiar: ${eFam.message}`);
  familiarInsertado = true;

  const cFamiliar = await sesion('guillo381+1@gmail.com');
  const cTercero = await sesion('guillo381+2@gmail.com');
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });

  // ═══ ① LA ESCRITURA — el familiar YA podía tocar la mascota. Es la mitad
  //    del par que hace que D-485 sea asimetría y no simplemente un permiso
  //    que faltaba entero. */
  const { error: eUpdate } = await cFamiliar.from('mascotas')
    .update({ nombre: '__arnes_d485__editado' })
    .eq('id', mascotaId);
  const escribio = !eUpdate;
  if (!escribio) fallos.push(`la familia NO pudo escribir (era el caso que ya andaba): ${eUpdate?.message}`);

  // ═══ ② LA LECTURA — mascotas y las cinco tablas del censo ═════════════════
  const tablas = ['mascotas', 'estadias'];
  const resultado = {};
  for (const t of tablas) {
    const { data: dF, error: erF } = await cFamiliar.from(t).select('id').eq(
      t === 'mascotas' ? 'id' : 'mascota_id', mascotaId,
    );
    const { data: dT, error: erT } = await cTercero.from(t).select('id').eq(
      t === 'mascotas' ? 'id' : 'mascota_id', mascotaId,
    );
    const { data: dAnon } = await anon.from(t).select('id').eq(
      t === 'mascotas' ? 'id' : 'mascota_id', mascotaId,
    );
    resultado[t] = { familiar: dF?.length ?? -1, tercero: dT?.length ?? -1, anon: dAnon?.length ?? -1 };
    if (erF) fallos.push(`${t}: familiar rebotó — ${erF.message}`);
    if (erT) fallos.push(`${t}: tercero rebotó — ${erT.message}`);
  }

  console.log('camino real (anon key + sesión), familiar vs tercero vs anon:');
  for (const [t, r] of Object.entries(resultado)) {
    console.log(`  ${t.padEnd(12)} familiar=${r.familiar} · tercero=${r.tercero} · anon=${r.anon}`);
    if (r.familiar !== 1) fallos.push(`🔴 ${t}: la familia leyó ${r.familiar}, esperaba 1 — D-485 sigue vivo`);
    if (r.tercero !== 0) fallos.push(`🔴 ${t}: un tercero leyó ${r.tercero} — la cura abrió de más`);
  }
  console.log(`escritura de la familia (la mitad que ya andaba): ${escribio ? 'sí' : 'NO — ' + eUpdate?.message}`);
} finally {
  // ═══ LIMPIEZA — pase lo que pase ═══════════════════════════════════════
  if (mascotaId) {
    await admin.from('estadias').delete().eq('mascota_id', mascotaId);
    await admin.from('mascotas').delete().eq('id', mascotaId);
  }
  if (familiarInsertado) {
    await admin.from('familia_miembro').delete()
      .eq('familia_id', familiaId).eq('user_id', familiarCandidato.id);
  }
  const { data: residuo } = await admin.from('mascotas').select('id').eq('nombre', '__arnes_d485__');
  if (residuo?.length) { console.error(`🔴 RESIDUO: ${residuo.length} mascota(s) sin borrar`); process.exit(2); }
}

if (fallos.length) { console.error('🔴 ' + fallos.join('\n🔴 ')); process.exit(1); }
console.log('✅ D-485 — familiar lee (mascotas + estadias), tercero y anon en cero, residuo 0');
process.exit(0);
