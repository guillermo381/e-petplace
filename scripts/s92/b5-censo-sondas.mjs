/**
 * S92-A · B5 — CENSO DE LAS CUENTAS DE SONDA, ANTES DE BORRAR NADA.
 *
 * Orden explícita del founder al abrir S92: «las 64 cuentas s91d-* SE BORRAN en
 * S92, con conteo antes/después y verificación de que ningún dato real fue
 * tocado». Esto es la primera mitad: el conteo y la verificación. **No borra.**
 *
 * Lo que hay que saber ANTES de un DELETE en `auth.users`:
 *   · cuántas son exactamente, y que el patrón no atrape a nadie más
 *   · qué cuelga de ellas (familias, mascotas, prestadores, citas)
 *   · y sobre todo: que NINGUNA fila de un usuario real dependa de ellas
 *
 * *Un borrado que se mide después no es un borrado verificado: es un borrado
 * con suerte.*
 *
 * Corre: node scripts/s92/b5-censo-sondas.mjs
 */

import { sql, guardar, linea } from './lib-s92.mjs';

// ① ¿a quiénes atrapa el patrón? Se listan de verdad, no se cuentan a ciegas.
const sondas = await sql(
  `SELECT id, email, created_at::text AS creada
   FROM auth.users
   WHERE email LIKE 's91d-%@epetplace.dev'
   ORDER BY email`,
  'b5-sondas',
);

// ② y el control: ¿el patrón podría atrapar a alguien que NO es sonda?
const parecidas = await sql(
  `SELECT email FROM auth.users
   WHERE (email ILIKE '%s91d%' OR email ILIKE '%sonda%' OR email ILIKE '%s92a%')
     AND email NOT LIKE 's91d-%@epetplace.dev'
   ORDER BY 1`,
  'b5-parecidas',
);

// ③ el total, para saber qué proporción del padrón se toca
const [{ total }] = await sql(`SELECT count(*)::int AS total FROM auth.users`, 'b5-total');

// ④ QUÉ CUELGA de esas cuentas
const ids = sondas.map((s) => `'${s.id}'`).join(',');
const dependencias = ids
  ? await sql(
      `SELECT 'familia (creada por)' AS que, count(*)::int AS n FROM public.familia WHERE created_by_user_id IN (${ids})
       UNION ALL SELECT 'familia_miembro', count(*)::int FROM public.familia_miembro WHERE user_id IN (${ids})
       UNION ALL SELECT 'mascotas (user_id)', count(*)::int FROM public.mascotas WHERE user_id IN (${ids})
       UNION ALL SELECT 'profiles', count(*)::int FROM public.profiles WHERE id IN (${ids})
       UNION ALL SELECT 'prestadores', count(*)::int FROM public.prestadores WHERE user_id IN (${ids})
       UNION ALL SELECT 'cuentas_comerciales', count(*)::int FROM public.cuentas_comerciales WHERE owner_profile_id IN (${ids})
       UNION ALL SELECT 'evento_cita_servicio (user_id)', count(*)::int FROM public.evento_cita_servicio WHERE user_id IN (${ids})
       UNION ALL SELECT 'push_tokens', count(*)::int FROM public.push_tokens WHERE user_id IN (${ids})
       ORDER BY 1`,
      'b5-deps',
    )
  : [];

// ⑤ EL BRAZO QUE PROTEGE LO REAL: ¿alguna mascota o familia de una sonda tiene
//    miembros que NO son sondas? Si la hubiera, borrar arrastraría datos ajenos.
const cruce = ids
  ? await sql(
      `SELECT count(*)::int AS n
       FROM public.familia_miembro fm
       WHERE fm.familia_id IN (SELECT id FROM public.familia WHERE created_by_user_id IN (${ids}))
         AND fm.user_id NOT IN (${ids})`,
      'b5-cruce',
    )
  : [{ n: 0 }];

guardar('b5-censo-sondas.json', { sondas, parecidas, total, dependencias, cruce });

linea('\n══ B5 · CENSO DE SONDAS — antes de borrar ══\n');
linea(`  cuentas que matchean 's91d-%@epetplace.dev': ${sondas.length}`);
linea(`  (el acta de S91 declaró 64 · diferencia: ${sondas.length - 64})`);
linea(`  total de cuentas en auth.users: ${total}`);
linea(`\n  ⚠️ cuentas PARECIDAS que el patrón NO atrapa (control de que no barre de más): ${parecidas.length}`);
for (const p of parecidas) linea(`     · ${p.email}`);

linea('\n  ── QUÉ CUELGA DE ELLAS ──');
for (const d of dependencias) linea(`     ${String(d.n).padStart(4)} × ${d.que}`);

linea(`\n  ── EL BRAZO QUE PROTEGE LO REAL ──`);
linea(`     miembros NO-sonda dentro de familias de sonda: ${cruce[0].n}`);
linea(
  cruce[0].n === 0
    ? '     ✅ ninguna familia de sonda contiene a una persona real: borrar no arrastra datos ajenos.'
    : '     🔴 HAY CRUCE — el borrado se FRENA: arrastraría datos de alguien real.',
);

linea('\n  primeras 8, para que se vean:');
for (const s of sondas.slice(0, 8)) linea(`     · ${s.email}  (${s.creada.slice(0, 19)})`);
linea('');
