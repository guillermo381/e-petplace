// ═══════════════════════════════════════════════════════════════════════════
// S95-G4 · EL ALTA DEL VENDEDOR DE PRUEBAS — las cuatro piezas POR FUNCIÓN
//
// 🔴 NINGUNA A MANO. Cuatro llamadas, cero INSERT directo (D-762).
//   ① crear_cuenta_comercial_inicial  → la cuenta, nace `pendiente_validacion`
//   ② otorgar_rol_vendedor            → el rol Y la activación, en un acto
//   ③ definir_regla_envio_vendedor    → flota propia + la frontera de cobertura
//   ④ crear_bodega_vendedor           → el origen del despacho
//
// 🔴 LA CUENTA ES DE PRUEBAS Y ESTÁ DISEÑADA PARA BORRARSE, NO PARA
//    RENOMBRARSE: su RUC es falso a propósito y su razón social lo dice.
//    Cualquier otro número de 13 dígitos que pase la máscara de Ecuador
//    **puede pertenecer a una empresa real**.
//
// Idempotente: si la cuenta ya existe, la reusa y sigue.
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TMP = mkdtempSync(join(tmpdir(), 'alta-'));
let seq = 0;
function sql(texto) {
  const f = join(TMP, `q${seq++}.sql`);
  writeFileSync(f, texto);
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', '--file', f],
    { encoding: 'utf8' });
  const s = r.stdout || '';
  const i = s.indexOf('{');
  if (r.status !== 0 || i === -1) {
    const crudo = (r.stdout || '') + (r.stderr || '');
    const m = crudo.match(/ERROR:\s*[0-9A-Z]+:\s*([^\\"]+)/);
    throw new Error(m ? m[1].trim() : crudo.slice(0, 400).trim());
  }
  return JSON.parse(s.slice(i)).rows;
}

const RUC = '9999999999999';
const RAZON = 'VENDEDOR DE PRUEBAS - NO ES UN COMERCIO REAL';
const NOMBRE = 'Despensa de Pruebas (borrable)';

// 🔴 LA COBERTURA FIRMADA POR EL FOUNDER. Los DOS ÚLTIMOS NO SON QUITO:
//    Sangolquí y San Rafael pertenecen al cantón RUMIÑAHUI, y entran por
//    decisión explícita del founder, no por pertenencia administrativa.
//    *Quien mañana «limpie» la lista dejando solo el DMQ va a quitar dos zonas
//    que el founder puso a propósito.*
const COBERTURA = [
  'Quito', 'Cumbayá', 'Tumbaco', 'Puembo', 'Pifo', 'Tababela', 'Yaruquí',
  'El Quinche', 'Checa', 'Conocoto', 'Amaguaña', 'Alangasí', 'La Merced',
  'Píntag', 'Calderón', 'Llano Chico', 'Pomasqui', 'San Antonio de Pichincha',
  'Calacalí',
  'Sangolquí', 'San Rafael',   // ← cantón Rumiñahui, por decisión del founder
];

const arr = (a) => `ARRAY[${a.map((x) => `'${x.replace(/'/g, "''")}'`).join(',')}]::text[]`;

// ── 🔴 QUIÉN ES EL TITULAR, Y POR QUÉ NO ES CUALQUIERA ─────────────────────
//
// PRIMER INTENTO, Y SU REBOTE: se usó `demo-prestador@epetplace.dev` y
// `crear_cuenta_comercial_inicial` rebotó hablado — *«Ya tienes una cuenta
// comercial registrada. No puedes crear otra desde este flujo.»* **Una persona,
// una cuenta comercial** (`MODELO_FINANCIERO` §2.7). Ese perfil ya es titular
// de «Paseos Andres».
//
// LO QUE **NO** SE HIZO: colgar la cuenta de pruebas del perfil de una persona
// real. Los perfiles libres que aparecieron primero son correos de gente de
// verdad, y **una cuenta comercial con RUC falso colgada del perfil de una
// persona real es exactamente lo que la disciplina de esta jornada evita.**
//
// Se usa un perfil de PRUEBA de la casa, sin cuenta comercial. Si el vendedor
// real llega, su cuenta nace de su propio perfil y ésta se borra — está hecha
// para eso.
const EMAIL_TITULAR = 'nuevo_test2@e-petplace.com';

const ctx = sql(`
  SELECT (SELECT id FROM admin_users WHERE activo ORDER BY created_at LIMIT 1) admin,
         (SELECT id FROM profiles WHERE email = '${EMAIL_TITULAR}') titular`)[0];
if (!ctx.admin || !ctx.titular) {
  console.log('✗ ABORTA: falta un admin activo o el perfil titular de pruebas.');
  process.exit(1);
}
console.log(`\nadmin ${ctx.admin}\ntitular ${ctx.titular}\n`);

const como = (uid) =>
  `SELECT set_config('request.jwt.claims','{"sub":"${uid}","role":"authenticated"}',false);`;

// ── ① LA CUENTA ────────────────────────────────────────────────────────────
let cuenta = sql(`SELECT id FROM cuentas_comerciales WHERE identificacion_fiscal='${RUC}'`)[0]?.id;
if (cuenta) {
  console.log(`① cuenta YA EXISTÍA: ${cuenta}`);
} else {
  cuenta = sql(`${como(ctx.titular)}
    SELECT c.cuenta_comercial_id id
    FROM crear_cuenta_comercial_inicial('EC','persona_juridica'::tipo_fiscal_enum,
      '${RUC}', '${RAZON}', '${NOMBRE}') c;`)[0].id;
  console.log(`① cuenta CREADA: ${cuenta}`);
}
const estado0 = sql(`SELECT estado FROM cuentas_comerciales WHERE id='${cuenta}'`)[0].estado;
console.log(`   estado al nacer: ${estado0}`);

// ── ② EL ROL — y la activación en el mismo acto (S95-G3) ───────────────────
const rol = sql(`${como(ctx.admin)}
  SELECT otorgar_rol_vendedor('${cuenta}', 'S95-G4 alta del vendedor de pruebas') r;`)[0].r;
console.log(`② rol otorgado · ya lo tenía: ${rol.ya_lo_tenia} · cuenta activada ahora: ${rol.cuenta_activada_ahora}`);
const post = sql(`SELECT estado, activado_por FROM cuentas_comerciales WHERE id='${cuenta}'`)[0];
console.log(`   estado: ${post.estado} · activado_por: ${post.activado_por ?? 'NULL'}`);

// ── ③ LA REGLA DE ENVÍO + LA FRONTERA ──────────────────────────────────────
const regla = sql(`${como(ctx.titular)}
  SELECT definir_regla_envio_vendedor('${cuenta}', 'flota_propia',
    '{"monto":0}'::jsonb, 'vendedor', ${arr(COBERTURA)}, 100) r;`)[0].r;
console.log(`③ regla ${regla.tipo} · pagado_por ${regla.parametros.pagado_por} · ${COBERTURA.length} ciudades`);

// ── ④ LA BODEGA ────────────────────────────────────────────────────────────
const bodega = sql(`${como(ctx.titular)}
  SELECT crear_bodega_vendedor('${cuenta}', 'Bodega de pruebas', 'Quito',
    NULL, '15:00'::time, 24) r;`)[0].r;
console.log(`④ bodega ${bodega.bodega_id} · ya existía: ${bodega.ya_existia}`);

console.log(`\n✅ ALTA COMPLETA\n   CUENTA: ${cuenta}\n`);
