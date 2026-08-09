/**
 * 🔴 P0-B · ③ y ④ — ¿ESTÁ ROTO EL LOGIN, O ES LA CONTRASEÑA?
 *
 * **SOLO LEE Y AUTENTICA. No escribe una fila de `auth.users`.**
 *
 * ③ Si una cuenta de prestador **recién creada, con contraseña conocida**,
 *   tampoco entra, el problema es el login. Si entra, el login funciona y lo
 *   que falla es la credencial de esa cuenta puntual.
 * ④ Y el camino que la app recorre al arrancar sesión de prestador se ejercita
 *   entero, para descartar que S92 haya roto una pieza de ese arranque.
 */
import { sql, rest, rpc, tokenDe, guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';
import { readFileSync } from 'node:fs';

const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(50)} ${obtenido}`);
};

linea('\n══ P0-B · ③ ¿EL LOGIN FUNCIONA? ══\n');

// (a) una cuenta de prestador VIVA cuya clave conocemos
{
  const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
  const mail = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
  const pw = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();
  try {
    const t = await tokenDe(mail, pw);
    anotar(`login de ${mail}`, `ENTRA (token de ${t.length} chars)`, true);
  } catch (e) {
    anotar(`login de ${mail}`, `🔴 NO ENTRA — ${String(e.message).slice(0, 90)}`, false);
  }
}

// (b) una cuenta NUEVA, creada al momento, con contraseña que yo elijo
{
  const correo = `seg2-prestador-${Date.now()}@epetplace.dev`;
  const pw = 'Seg2-Prestador-2026!';
  const alta = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: pw, data: { nombre: 'Sonda Prestador' } }),
  });
  const d = await alta.json().catch(() => ({}));
  anotar('alta de una cuenta nueva', `HTTP ${alta.status}`, alta.status < 400);
  try {
    const t = await tokenDe(correo, pw);
    anotar('login de esa cuenta recién creada', `ENTRA (token de ${t.length} chars)`, t.length > 20);
  } catch (e) {
    anotar('login de esa cuenta recién creada', `🔴 NO ENTRA — ${String(e.message).slice(0, 90)}`, false);
  }
  guardarSeg2('p0b-fixture-prestador.json', { correo });
}

// (c) el rebote esperado con una contraseña equivocada — para probar que el
//     endpoint DISCRIMINA y no está diciendo que no a todo
{
  const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
  const mail = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: mail, password: 'contraseña-que-no-es' }),
  });
  const j = await r.json().catch(() => ({}));
  anotar('esa misma cuenta con clave EQUIVOCADA', `HTTP ${r.status} · ${j.error_code ?? j.error ?? ''}`, r.status >= 400);
}

linea('\n══ ④ EL CAMINO DE ARRANQUE DE SESIÓN DEL PRESTADOR ══\n');
{
  const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
  const t = await tokenDe(
    env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim(),
    env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim(),
  );
  // lo que la app consulta apenas hay sesión, en orden
  const u = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${t}` } });
  anotar('/auth/v1/user (quién soy)', `HTTP ${u.status}`, u.status === 200);
  const p = await rpc('obtener_mi_prestador', {}, { token: t });
  anotar('obtener_mi_prestador (resuelve el negocio)', `HTTP ${p.status}`, p.status === 200);
  const perfil = await rest('/rest/v1/profiles?select=id,nombre&limit=1', { token: t });
  anotar('profiles (el perfil)', `HTTP ${perfil.status}`, perfil.status === 200);
  const emp = await rest('/rest/v1/prestador_empleados?select=id,rol,activo&limit=3', { token: t });
  anotar('prestador_empleados (el vínculo)', `HTTP ${emp.status}`, emp.status === 200);
  const roles = await rest('/rest/v1/empleado_roles?select=id,rol&limit=3', { token: t });
  anotar('empleado_roles (los chips de rol)', `HTTP ${roles.status}`, roles.status === 200);
}

// ── ⑤ LAS CUENTAS QUE NO PUEDEN ENTRAR POR CLAVE, Y POR QUÉ ───────────────
linea('\n══ ⑤ CUENTAS DE PRESTADOR QUE NO PUEDEN ENTRAR CON CONTRASEÑA ══\n');
const sinClave = await sql(
  `SELECT u.email,
          COALESCE((SELECT string_agg(i.provider, ',') FROM auth.identities i WHERE i.user_id=u.id),'(ninguna)') AS proveedores,
          u.last_sign_in_at::text AS ultimo
   FROM auth.users u
   WHERE (u.encrypted_password IS NULL OR u.encrypted_password='')
     AND (EXISTS (SELECT 1 FROM public.prestadores p WHERE p.user_id=u.id)
          OR EXISTS (SELECT 1 FROM public.cuentas_comerciales c WHERE c.owner_profile_id=u.id))
   ORDER BY u.created_at`,
  'p0b-sinclave',
);
for (const s of sinClave) {
  const [l, dm] = s.email.split('@');
  linea(`  🔴 ${l.slice(0, 3)}${'*'.repeat(Math.max(0, l.length - 3))}@${dm}`);
  linea(`       sin contraseña · entra por: ${s.proveedores} · último ingreso ${s.ultimo?.slice(0, 19) ?? 'nunca'}`);
}
if (sinClave.length === 0) linea('  (ninguna)');

guardarSeg2('p0b-login-vivo.json', { filas, sinClave: sinClave.length });
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──\n`);
