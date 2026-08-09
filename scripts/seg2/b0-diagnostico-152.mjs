/**
 * S92-BIS · ¿152 y 8 son REGRESIONES de S92, o son otra cosa?
 *
 * El contraste dio dos rojos y ninguno se acepta sin medir:
 *   · **152 cuentas** donde se esperaban 150
 *   · **8 sin `encrypted_password`**, o sea que no pueden autenticar por clave
 *
 * La primera hipótesis para cada una —y hay que probarla, no creerla— es que
 * ninguna tiene que ver con S92: la primera serían **mis propios fixtures** de
 * esta sesión, y la segunda **las 8 cuentas solo-Google del legado** que el
 * canon documenta desde S81 (*«8 cuentas SOLO-Google del legado en callejón
 * total, Satori incluida»*).
 *
 * *Un rojo heredado que se reporta como regresión propia manda a alguien a
 * buscar un bug que no existe.*
 */
import { sql, guardarSeg2, linea } from './lib-seg2.mjs';

// ── ① las 152 ──────────────────────────────────────────────────────────────
const extra = await sql(
  `SELECT email, created_at::text AS creada
   FROM auth.users
   WHERE email LIKE 'seg2-%@epetplace.dev'
   ORDER BY created_at`,
  'diag-seg2',
);
linea('\n══ ① ¿POR QUÉ 152 Y NO 150? ══\n');
linea(`  cuentas con prefijo seg2-* (fixtures de ESTA sesión): ${extra.length}`);
for (const x of extra) linea(`     · ${x.email}  (${x.creada.slice(0, 19)})`);
linea(`\n  150 reales + ${extra.length} fixtures = ${150 + extra.length}`);
linea(
  extra.length === 2
    ? '  ✅ NO es regresión: es mi propio instrumento. Se limpian al cierre (§3 del arranque).\n'
    : '  ⚠️ el número no cierra solo con mis fixtures — mirar.\n',
);

// ── ② las 8 sin credencial ─────────────────────────────────────────────────
const sin = await sql(
  `SELECT u.email,
          u.created_at::text AS creada,
          COALESCE((SELECT string_agg(i.provider, ',') FROM auth.identities i WHERE i.user_id = u.id), '(ninguna)') AS proveedores,
          u.last_sign_in_at::text AS ultimo_ingreso
   FROM auth.users u
   WHERE u.encrypted_password IS NULL OR u.encrypted_password = ''
   ORDER BY u.created_at`,
  'diag-sincred',
);

linea('══ ② LAS 8 SIN CONTRASEÑA — ¿pueden entrar por otra puerta? ══\n');
for (const s of sin) {
  // R6: el correo de una cuenta real es dato personal. Se muestra el dominio y
  // el largo del local-part, que alcanza para clasificar sin exponer a nadie.
  const [local, dominio] = s.email.split('@');
  linea(`  · ${local.slice(0, 3)}${'*'.repeat(Math.max(0, local.length - 3))}@${dominio}`);
  linea(`      proveedores: ${s.proveedores}   ·   último ingreso: ${s.ultimo_ingreso ?? 'nunca'}`);
}

const conGoogle = sin.filter((s) => s.proveedores.includes('google')).length;
const soloEmail = sin.filter((s) => s.proveedores === 'email').length;
const sinNada = sin.filter((s) => s.proveedores === '(ninguna)').length;

linea(`\n  con identidad Google (entran por OAuth): ${conGoogle}`);
linea(`  solo identidad email y sin clave (CALLEJÓN): ${soloEmail}`);
linea(`  sin ninguna identidad: ${sinNada}`);

const creadasHoy = sin.filter((s) => s.creada >= '2026-08-08').length;
linea(`\n  creadas el 8-ago o después (o sea, que S92 podría haber tocado): ${creadasHoy}`);
linea(
  creadasHoy === 0
    ? '  ✅ NINGUNA es reciente ⇒ **no es regresión de S92**: es el hueco de login que el canon\n     documenta desde S81 («8 cuentas SOLO-Google del legado en callejón total»).\n'
    : '  ⚠️ hay cuentas recientes sin credencial — eso sí habría que mirarlo.\n',
);

guardarSeg2('b0-diagnostico-152.json', { fixtures: extra.length, sinCredencial: sin.length, conGoogle, soloEmail, sinNada, creadasHoy });
