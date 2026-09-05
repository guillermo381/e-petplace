/**
 * S113-A · LAS DOS LLAMADAS REALES contra las edges recién desplegadas.
 *
 * No es un arnés de unidad: **pega contra el proyecto vivo con una sesión de
 * verdad**, porque lo que hay que probar no es la lógica —eso ya lo prueban los
 * arneses de D— sino que la función DESPLEGADA contesta.
 *
 * Las credenciales se leen del `.env.local` AL MOMENTO y **jamás se imprimen**.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const sb = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const { data: sesion, error: errAuth } = await sb.auth.signInWithPassword({
  email: env.EXPO_PUBLIC_DEMO_EMAIL,
  password: env.EXPO_PUBLIC_DEMO_PASSWORD,
});
if (errAuth) {
  console.log('  🔴 sin sesión:', errAuth.message);
  process.exit(1);
}
console.log(`  sesión: ${sesion.user.email} · uid ${sesion.user.id.slice(0, 8)}`);

const arg = process.argv[2];

// ── ① sugerir-raza sobre una foto de perro real ────────────────────────────
if (arg === 'raza') {
  const ruta = process.argv[3];
  const b64 = readFileSync(ruta).toString('base64');
  const tipo = ruta.endsWith('.png') ? 'image/png' : 'image/jpeg';
  console.log(`  foto: ${ruta.split('/').pop()} · ${(b64.length / 1365).toFixed(0)} kB`);

  const t0 = Date.now();
  const { data, error } = await sb.functions.invoke('sugerir-raza', {
    body: { imagenBase64: b64, especie: 'perro', mediaType: tipo },
  });
  const ms = Date.now() - t0;

  if (error) {
    let cuerpo = '(no JSON)';
    try { cuerpo = JSON.stringify(await error.context.json()); } catch { /* body no-JSON */ }
    console.log(`  🔴 ${error.name} en ${ms} ms → ${cuerpo}`);
  } else {
    console.log(`  ✅ 200 en ${ms} ms`);
    console.log(`     ${JSON.stringify(data)}`);
  }
}

// ── ② extract-vacuna sobre el carnet real del founder ──────────────────────
if (arg === 'carnet') {
  const ruta = process.argv[3];
  const b64 = readFileSync(ruta).toString('base64');
  console.log(`  carnet: ${ruta.split('/').pop()} · ${(b64.length / 1365).toFixed(0)} kB`);

  const t0 = Date.now();
  const { data, error } = await sb.functions.invoke('extract-vacuna', {
    body: { imageBase64: b64, mediaType: 'image/jpeg' },
  });
  const ms = Date.now() - t0;

  if (error) {
    let cuerpo = '(no JSON)';
    try { cuerpo = JSON.stringify(await error.context.json()); } catch { /* body no-JSON */ }
    console.log(`  🔴 ${error.name} en ${ms} ms → ${cuerpo}`);
    process.exit(0);
  }

  const vs = data?.vacunas ?? [];
  console.log(`  ✅ 200 en ${ms} ms · ${vs.length} filas · descartadas ${(data?.filas_descartadas ?? []).length}`);
  for (const [i, v] of vs.entries()) {
    const marca = v.dudosa ? ` 🔸dudosa=${v.dudosa}` : '';
    console.log(`     ${i + 1}. ${v.nombre ?? '(sin nombre)'} · ${v.fecha_aplicada ?? 'SIN FECHA'}` +
      `${v.fecha_literal ? ` «${v.fecha_literal}»` : ''}${marca}`);
  }
  if (data?.plan_impreso) console.log(`     plan_impreso: ${JSON.stringify(data.plan_impreso).slice(0, 120)}`);
  for (const d of data?.filas_descartadas ?? []) {
    console.log(`     ✗ ${d.lista}[${d.indice}]: ${d.motivo}`);
  }
}
