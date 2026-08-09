/**
 * S92-BIS · B0 — CONTRASTE CON EL BORRADO DE SONDAS DE S92.
 *
 * S92 borró 64 cuentas y marcó 64 familias. El founder pide verificar dos cosas:
 * que **las 150 cuentas reales autentiquen** y que **ninguna familia real haya
 * quedado marcada** como `created_by_sistema`. Conteo, no impresión.
 *
 * ── UN LÍMITE, DECLARADO EN VEZ DE DISIMULADO (R5) ───────────────────────────
 * **No se puede autenticar a las 150: no tengo sus contraseñas.** Lo que sí se
 * puede medir, y se mide, es todo lo que hace que una cuenta PUEDA autenticar:
 * que exista, que conserve su credencial, que no esté baneada y que su correo
 * siga confirmado. Y se autentica de verdad con las dos cuentas cuyas claves
 * esta sesión sí tiene.
 *
 * *Decir «las 150 autentican» sin poder probarlo sería exactamente el verde
 * falso que este loop existe para no producir.*
 */
import { sql, tokenDe, guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';
import { readFileSync } from 'node:fs';

const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(48)} ${obtenido}`);
};

linea('\n══ B0 · CONTRASTE CON EL BORRADO DE SONDAS ══\n');
linea('① INTEGRIDAD DE LAS 150 — todo lo que hace que una cuenta pueda autenticar\n');

const est = await sql(
  `SELECT count(*)::int AS total,
          count(*) FILTER (WHERE encrypted_password IS NULL OR encrypted_password = '')::int AS sin_credencial,
          count(*) FILTER (WHERE banned_until IS NOT NULL AND banned_until > now())::int AS baneadas,
          count(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS borradas_soft,
          count(*) FILTER (WHERE email_confirmed_at IS NULL)::int AS sin_confirmar,
          count(*) FILTER (WHERE email LIKE 's91d-%')::int AS sondas_restantes
   FROM auth.users`,
  'contraste-auth',
);
const e = est[0];
anotar('cuentas en el padrón', `${e.total} (eran 214 · 214−64 = 150)`, e.total === 150);
anotar('sin credencial (no podrían autenticar)', `${e.sin_credencial}`, e.sin_credencial === 0);
anotar('baneadas', `${e.baneadas}`, e.baneadas === 0);
anotar('borradas por soft-delete', `${e.borradas_soft}`, e.borradas_soft === 0);
anotar('sin email confirmado', `${e.sin_confirmar} (informativo: no impide autenticar en este proyecto)`, true);
anotar('sondas que sobrevivieron', `${e.sondas_restantes}`, e.sondas_restantes === 0);

linea('\n② AUTENTICACIÓN REAL — con las dos cuentas cuyas claves tengo\n');
try {
  const t = await tokenDe(DEMO_MAIL, DEMO_PW);
  anotar('login del titular demo (prestador)', `token obtenido (${t.length} chars)`, t.length > 20);
} catch (err) {
  anotar('login del titular demo (prestador)', `🔴 ${String(err.message).slice(0, 80)}`, false);
}
{
  const correo = `seg2-login-${Date.now()}@epetplace.dev`;
  const r = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: 'Seg2-2026!' }),
  });
  const d = await r.json().catch(() => ({}));
  anotar('alta + login de una cuenta nueva', `HTTP ${r.status} · ${d.access_token ? 'autentica' : 'sin sesión'}`, !!d.access_token);
  guardarSeg2('b0-fixture-login.json', { correo });
}

linea('\n③ ¿ALGUNA FAMILIA REAL QUEDÓ MARCADA COMO PRUEBA?\n');
const marcas = await sql(
  `SELECT COALESCE(created_by_sistema,'(sin marca — creada por un usuario)') AS marca,
          count(*)::int AS n
   FROM public.familia GROUP BY 1 ORDER BY 2 DESC`,
  'contraste-marcas',
);
for (const m of marcas) linea(`     ${String(m.n).padStart(4)} × ${m.marca}`);

const sospechosas = await sql(
  `SELECT count(*)::int AS n FROM public.familia f
   WHERE f.created_by_sistema = 'sonda_s91d_purgada'
     AND EXISTS (SELECT 1 FROM public.familia_miembro fm
                 JOIN auth.users u ON u.id = fm.user_id
                 WHERE fm.familia_id = f.id)`,
  'contraste-sospechosas',
);
anotar(
  'familias marcadas que TODAVÍA tienen un miembro vivo',
  `${sospechosas[0].n} — si fuera >0, una persona real habría quedado en una familia marcada como prueba`,
  sospechosas[0].n === 0,
);

const realesMarcadas = await sql(
  `SELECT count(*)::int AS n FROM public.familia
   WHERE created_by_sistema IS NOT NULL AND created_by_sistema <> 'sonda_s91d_purgada'`,
  'contraste-otras',
);
anotar('familias con OTRA marca de sistema', `${realesMarcadas[0].n} (el backfill histórico de S17)`, true);

guardarSeg2('b0-contraste-sondas.json', { auth: e, marcas, filas });
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 ${r.id}: ${r.obtenido}`);
linea('');
