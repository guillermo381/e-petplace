#!/usr/bin/env node
/**
 * S108-A · EL GUARD DEL NÚMERO DE MIGRACIÓN.
 *
 * ═══ POR QUÉ EXISTE — dos choques en un día, y el segundo fue peor ═════════
 * Con cuatro pistas en vuelo, dos migraciones nacieron con el MISMO número.
 * `schema_migrations` sólo pudo nombrar una, y el `ON CONFLICT DO NOTHING` dejó
 * pasar la segunda **en silencio**.
 *
 * 🔴 La segunda vez fue peor y es la que define la forma de este guard:
 * `db push` dijo **«Remote database is up to date»** y **no aplicó una sola
 * línea** — porque el número ya estaba en el ledger, puesto por la migración de
 * otra pista. *El ledger dijo que sí; el objeto decía que no.* Se cazó sólo
 * porque alguien fue a preguntarle a la función si existía.
 *
 * ⇒ **Detectar el duplicado NO ALCANZA.** Este guard mide DOS cosas:
 *   ① que no haya dos archivos con el mismo prefijo en el directorio, y
 *   ② que cada versión registrada esté registrada CON EL NOMBRE DE SU ARCHIVO —
 *      lo que caza el choque **vivo**, no sólo el que ya llegó a `main`.
 *
 * *Un número repetido es invisible en la rama propia y letal en el replay: en
 * un ambiente nuevo, `db push` saltea LAS DOS creyéndolas aplicadas.*
 *
 * L-197: si no puede medir contra la base, sale **ROJO**, jamás verde. El
 * escape es `--sin-motor`, ruidoso y declarado.
 */
import { readdirSync } from 'node:fs';
import { dbQuery } from './lib-db.mjs';

const SIN_MOTOR = process.argv.includes('--sin-motor');
const DIR = 'supabase/migrations';
let rojo = false;
const di = (s) => process.stdout.write(s + '\n');

// ── ① DUPLICADOS EN EL DIRECTORIO ─────────────────────────────────────────
const archivos = readdirSync(DIR).filter((f) => f.endsWith('.sql'));
const porVersion = new Map();
for (const f of archivos) {
  const v = f.split('_')[0];
  if (!/^\d{14}$/.test(v)) { di(`⚠️  nombre sin versión de 14 dígitos: ${f}`); continue; }
  porVersion.set(v, [...(porVersion.get(v) ?? []), f]);
}
const dup = [...porVersion.entries()].filter(([, fs]) => fs.length > 1);
if (dup.length) {
  rojo = true;
  di('🔴 NÚMEROS DUPLICADOS EN EL DIRECTORIO — en un ambiente nuevo se aplica UNA y');
  di('   la otra se saltea en silencio. Renumerá la más nueva a un hueco libre.');
  for (const [v, fs] of dup) di(`   ${v} → ${fs.join('  ·  ')}`);
} else {
  di(`✅ ① sin duplicados de número · ${archivos.length} migraciones`);
}

// ── ② EL LEDGER DICE LO QUE EL ARCHIVO DICE ───────────────────────────────
if (SIN_MOTOR) {
  di('⚠️  ② NO MEDIDO (--sin-motor). El choque VIVO no se puede ver sin la base:');
  di('    un número tomado por otra pista se ve igual que uno libre desde acá.');
} else {
  /* `dbQuery` devuelve las filas y LANZA si no pudo — no un `{ok}`. Se leyó su
     contrato en vez de suponerlo: la primera versión de este guard asumió la
     forma equivocada y salió ROJO con `undefined` de causa. */
  let filas = null;
  try {
    filas = dbQuery(
      'select version, name from supabase_migrations.schema_migrations order by version',
    );
  } catch (e) {
    rojo = true;
    di('🔴 ② NO SE PUDO MEDIR contra la base — sale ROJO, jamás verde (L-197).');
    di(`   ${e.message}`);
  }
  if (filas) {
    const remoto = new Map(filas.map((x) => [x.version, x.name]));
    let choques = 0;
    for (const [v, fs] of porVersion) {
      if (!remoto.has(v)) continue;
      /* El nombre del archivo sin su versión ni su `.sql` es lo que el CLI
         registra. Si no coincide, **ese número lo aplicó OTRA migración**. */
      const propio = fs[0].replace(/^\d{14}_/, '').replace(/\.sql$/, '');
      const registrado = remoto.get(v);
      /* 🔴 UN RENOMBRE EN SU LUGAR NO ES UNA COLISIÓN, y hay uno histórico
         declarado: `20260719140000` quedó en el ledger como
         `…_SUPERSEDED_POR_A12` (S70, reconciliado en su acta). Si un nombre
         CONTIENE al otro es la misma migración renombrada; si son nombres
         ajenos, son dos migraciones peleando por un número.
         *Se afloja acá y sólo acá: una colisión real es entre pistas distintas
         —`s108a_…` contra `s108b2_…`— y esos nombres nunca se contienen.* */
      const mismaFamilia = registrado
        && (registrado.startsWith(propio) || propio.startsWith(registrado));
      if (registrado && registrado !== propio && !mismaFamilia) {
        rojo = true; choques++;
        di(`🔴 CHOQUE VIVO en ${v}:`);
        di(`     tu archivo  → ${propio}`);
        di(`     el ledger   → ${registrado}`);
        di(`   ⇒ el número ya lo usó otra pista. Tu contenido PUEDE NO HABERSE`);
        di(`     APLICADO y \`db push\` va a decir «up to date». Renumerá.`);
      }
    }
    const soloRemoto = [...remoto.keys()].filter((v) => !porVersion.has(v));
    if (!choques) di(`✅ ② el ledger coincide con el archivo en las ${porVersion.size} versiones locales`);
    if (soloRemoto.length) {
      /* NO es rojo: es trabajo de otra pista aplicado y todavía sin mergear. */
      di(`ℹ️  ${soloRemoto.length} versión(es) en el remoto sin archivo local — trabajo`);
      di(`   de otra pista en vuelo, no un error: ${soloRemoto.join(', ')}`);
    }
  }
}

di(rojo ? '\n🔴 verify:migraciones — ROJO' : '\n✅ verify:migraciones — VERDE');
process.exit(rojo ? 1 : 0);
