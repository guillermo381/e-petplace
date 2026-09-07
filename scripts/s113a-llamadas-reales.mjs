/**
 * S113-A · LAS DOS LLAMADAS REALES contra las edges recién desplegadas.
 *
 * No es un arnés de unidad: **pega contra el proyecto vivo con una sesión de
 * verdad**, porque lo que hay que probar no es la lógica —eso ya lo prueban los
 * arneses de D— sino que la función DESPLEGADA contesta.
 *
 * 🔴 LA CUENTA DE PRUEBA SALE DEL LLAVERO, NO DE UN ARCHIVO NI DE UNA CONSTANTE
 * (firma del founder, 5-sep-2026, tras aparecer impresa en el transcript de una
 * pista). Servicio `epetplace-cuenta-prueba`. **Se lee al momento de usarla y no
 * se imprime nunca** — ni siquiera enmascarada, porque *un valor que se muestra
 * a medias sigue estando en el transcript.*
 *
 * ⚠️ El `.env.local` queda como fallback SÓLO para el ambiente de desarrollo del
 * founder, que es donde la app lo necesita para arrancar. **Ningún arnés escribe
 * la clave inline, y ninguno la imprime.**
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

/** Del llavero, al momento. Si no está, se dice cómo ponerla — jamás se cae al
 *  archivo en silencio: *un fallback callado convierte la regla en una sugerencia.* */
function cuentaDePrueba() {
  try {
    const clave = execFileSync('security',
      ['find-generic-password', '-s', 'epetplace-cuenta-prueba', '-w'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const cuenta = execFileSync('security',
      ['find-generic-password', '-s', 'epetplace-cuenta-prueba'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const email = /"acct"<blob>="([^"]+)"/.exec(cuenta)?.[1];
    if (!email) throw new Error('sin acct');
    return { email, clave };
  } catch {
    console.log('  🔴 la cuenta de prueba no está en el llavero. Ponela con:');
    console.log('     security add-generic-password -a <email> -s epetplace-cuenta-prueba -w');
    process.exit(1);
  }
}

const cuenta = cuentaDePrueba();
const sb = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const { data: sesion, error: errAuth } = await sb.auth.signInWithPassword({
  email: cuenta.email,
  password: cuenta.clave,
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
      `${v.fecha_literal ? ` «${v.fecha_literal}»` : ''}${marca}` +
      ` · evidencia=${v.evidencia ?? '—'} · confianza=${v.confianza ?? '—'}`);
  }
  if (data?.plan_impreso) console.log(`     plan_impreso: ${JSON.stringify(data.plan_impreso).slice(0, 120)}`);
  for (const d of data?.filas_descartadas ?? []) {
    console.log(`     ✗ ${d.lista}[${d.indice}]: ${d.motivo}`);
  }
}
