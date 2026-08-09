/**
 * 🔴 P0-B · EL FOUNDER NO PUEDE AUTENTICAR SU CUENTA DE PRESTADOR.
 *
 * **ESTE SCRIPT SOLO LEE.** No toca `auth.users`, no resetea nada, no escribe
 * una fila. La recuperación la decide el founder con la medición delante.
 *
 * Paso 1 y 2 de la orden: ¿la cuenta existe, con qué credencial, y qué dice el
 * audit de auth?
 *
 * ── R6 · NINGÚN SECRETO NI DATO PERSONAL SE TRANSCRIBE ──────────────────────
 * Los correos de personas reales van enmascarados (3 primeras letras + dominio).
 * Alcanza para que el founder reconozca cuál es la suya y no alcanza para que
 * el archivo sea una lista de correos. Los `@epetplace.dev` son cuentas de
 * sistema y van enteros.
 */
import { sql, guardarSeg2, linea } from './lib-seg2.mjs';

const enmascarar = (email) => {
  if (!email) return '(sin email)';
  const [local, dom] = email.split('@');
  if (dom === 'epetplace.dev') return email; // cuenta de sistema
  return `${local.slice(0, 3)}${'*'.repeat(Math.max(0, local.length - 3))}@${dom}`;
};

// ── ① TODAS LAS CUENTAS CON VÍNCULO DE PRESTADOR ───────────────────────────
const cuentas = await sql(
  `SELECT u.id, u.email,
          u.created_at::text            AS creada,
          u.email_confirmed_at::text    AS confirmada,
          u.last_sign_in_at::text       AS ultimo_ingreso,
          u.banned_until::text          AS baneada_hasta,
          u.deleted_at::text            AS borrada,
          (u.encrypted_password IS NOT NULL AND u.encrypted_password <> '') AS tiene_password,
          u.updated_at::text            AS actualizada,
          COALESCE((SELECT string_agg(i.provider, ',' ORDER BY i.provider)
                    FROM auth.identities i WHERE i.user_id = u.id), '(ninguna)') AS proveedores,
          EXISTS (SELECT 1 FROM public.prestadores p WHERE p.user_id = u.id)          AS es_titular,
          EXISTS (SELECT 1 FROM public.prestador_empleados pe
                   WHERE pe.user_id = u.id AND pe.activo)                            AS es_empleado_activo,
          EXISTS (SELECT 1 FROM public.cuentas_comerciales cc WHERE cc.owner_profile_id = u.id) AS es_owner_cuenta
   FROM auth.users u
   WHERE EXISTS (SELECT 1 FROM public.prestadores p WHERE p.user_id = u.id)
      OR EXISTS (SELECT 1 FROM public.prestador_empleados pe WHERE pe.user_id = u.id)
      OR EXISTS (SELECT 1 FROM public.cuentas_comerciales cc WHERE cc.owner_profile_id = u.id)
   ORDER BY u.created_at`,
  'p0b-cuentas',
);

linea('\n══ P0-B · ① LAS CUENTAS CON VÍNCULO DE PRESTADOR ══\n');
linea(`  ${cuentas.length} cuenta(s)\n`);
for (const c of cuentas) {
  const roles = [
    c.es_titular ? 'titular' : null,
    c.es_empleado_activo ? 'empleado activo' : null,
    c.es_owner_cuenta ? 'dueña de cuenta comercial' : null,
  ]
    .filter(Boolean)
    .join(' · ');
  linea(`  ${enmascarar(c.email)}`);
  linea(`     rol .............. ${roles}`);
  linea(`     ¿tiene password? . ${c.tiene_password ? 'SÍ' : '🔴 NO'}   ·   proveedores: ${c.proveedores}`);
  linea(`     creada ........... ${c.creada?.slice(0, 19)}`);
  linea(`     confirmada ....... ${c.confirmada?.slice(0, 19) ?? '(sin confirmar)'}`);
  linea(`     último ingreso ... ${c.ultimo_ingreso?.slice(0, 19) ?? 'NUNCA'}`);
  linea(`     actualizada ...... ${c.actualizada?.slice(0, 19) ?? '—'}`);
  linea(`     baneada .......... ${c.baneada_hasta ?? 'no'}   ·   borrada: ${c.borrada ?? 'no'}`);
  linea('');
}

// ── ② ¿ALGUNA QUEDÓ MARCADA POR EL BARRIDO DE S92? ────────────────────────
const marcadas = await sql(
  `SELECT count(*)::int AS n
   FROM public.familia f
   WHERE f.created_by_sistema = 'sonda_s91d_purgada'
     AND EXISTS (SELECT 1 FROM public.familia_miembro fm
                 JOIN auth.users u ON u.id = fm.user_id
                 WHERE fm.familia_id = f.id
                   AND EXISTS (SELECT 1 FROM public.prestadores p WHERE p.user_id = u.id))`,
  'p0b-marcadas',
);
linea('══ ② ¿EL BARRIDO DE S92 TOCÓ ALGUNA CUENTA DE PRESTADOR? ══\n');
linea(`  familias marcadas que contienen a un titular de prestador: ${marcadas[0].n} ${marcadas[0].n === 0 ? '✅' : '🔴'}`);
const borradasS92 = await sql(
  `SELECT count(*)::int AS n FROM public.prestadores p
   WHERE p.user_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id)`,
  'p0b-huerfanos',
);
linea(`  prestadores cuyo user_id ya NO existe en auth (o sea, borrado): ${borradasS92[0].n} ${borradasS92[0].n === 0 ? '✅' : '🔴'}\n`);

guardarSeg2('p0b-cuentas.json', cuentas.map((c) => ({ ...c, email: enmascarar(c.email) })));
