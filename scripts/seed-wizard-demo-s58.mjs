// Prestador DEMO del wizard (S58-B v3.1, cura 2a) — el founder gatea el
// peldaño 0 real sin tocar su prestador con oferta. Marca DEMO como
// manda la casa. DOS fases:
//   node scripts/seed-wizard-demo-s58.mjs           → asegura el auth user
//   node scripts/seed-wizard-demo-s58.mjs --check   → login + prestador + conteos en 0
// (entre ambas corre el SQL: supabase/dev/seed_wizard_demo_s58.sql)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const EMAIL = 'guillo381+wizard@gmail.com';
const PASSWORD = 'wizard-demo-s58';

const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (process.argv.includes('--check')) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (error || !data.session) {
    console.log(`✗ login del demo wizard FALLÓ: ${error?.message ?? 'sin sesión'}`);
    process.exit(1);
  }
  // prestadores_public muestra TODOS los activos (el QUIÉN lo necesita):
  // el propio se pide por user_id
  const { data: prest } = await supabase
    .from('prestadores')
    .select('id, nombre_comercial')
    .eq('user_id', data.session.user.id)
    .maybeSingle();
  if (!prest) {
    console.log('✗ el user demo no tiene fila de prestadores (corre el SQL primero)');
    process.exit(1);
  }
  const [ofertas, franjas, zonas] = await Promise.all([
    supabase.from('prestador_servicios').select('id').eq('prestador_id', prest.id),
    supabase.from('prestador_horarios').select('id').eq('prestador_id', prest.id),
    supabase.from('prestador_zonas').select('id').eq('prestador_id', prest.id),
  ]);
  const c = (r) => r.data?.length ?? 0;
  console.log(`✓ login ok · prestador "${prest.nombre_comercial}"`);
  console.log(`✓ peldaño 0 real: ofertas=${c(ofertas)} franjas=${c(franjas)} zonas=${c(zonas)}`);
  process.exit(c(ofertas) === 0 && c(franjas) === 0 && c(zonas) === 0 ? 0 : 1);
}

const { data, error } = await supabase.auth.signUp({ email: EMAIL, password: PASSWORD });
if (error) {
  if (/already/i.test(error.message)) {
    console.log(`✓ el auth user ya existía (${EMAIL})`);
    process.exit(0);
  }
  console.log(`✗ signUp falló: ${error.message}`);
  process.exit(1);
}
console.log(`✓ auth user listo: ${data.user?.id} (sesión inmediata: ${data.session ? 'sí' : 'NO — requiere confirmación de email'})`);
