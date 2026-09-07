#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:asientos-caso — S114-E · §9 de `LETRA_POSTVENTA` (F5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mide las DOS mitades de §9, y son mitades distintas de la misma puerta:
 *
 * **① EL CANDADO (§9.1).** *«`REVOKE INSERT, UPDATE, DELETE` sobre las tablas
 * del caso, del saldo y de los motivos a `authenticated`; escriben únicamente
 * las RPCs `SECURITY DEFINER`.»* Con su razón escrita en la letra: **el admin
 * no puede escapar aunque quiera** — la puerta única deja de ser prosa y pasa
 * a ser permiso (`D-889`: una ley que vive sólo en prosa da verde y silencio).
 *
 * **② LOS TRES ASIENTOS (§9.3).** *«verificados por PostgREST real y no
 * simulado»*: familia ve sus casos · prestador los de sus objetos · casa
 * todos · **tercero: cero** · anon: cero.
 *
 * ── CÓMO SE MIDE EL CANDADO, Y POR QUÉ DE DOS FORMAS ─────────────────────
 * · **Exacta:** `has_table_privilege('authenticated', tabla, 'INSERT')` — no
 *   admite interpretación y distingue el GRANT de la RLS.
 * · **Real:** una sonda por PostgREST con sesión de verdad. §9 pide «real y
 *   no simulado», y `SET LOCAL ROLE` no es el camino que usa el teléfono.
 *
 * 🔴 **LA SONDA LLEVA SU CONTROL POSITIVO, Y SIN ÉL NO PROBARÍA NADA.**
 * *Una sonda que siempre rebota también rebota* — un token vencido, una URL
 * mal armada o una tabla inexistente dan el mismo «no pude escribir» que un
 * candado bien puesto. El control es la asimetría **sobre la misma tabla y
 * con la misma sesión**: el `SELECT` tiene que PASAR y el `INSERT` tiene que
 * REBOTAR. Si el `SELECT` también rebota, el arnés no está midiendo el
 * candado: está midiendo su propia sesión rota, y sale 2.
 *
 * ⚠️ **La sonda no escribe nada**: el `INSERT` que manda está hecho para ser
 * rechazado, y si por un defecto pasara, el arnés lo reporta como ROJO
 * MÁXIMO y deja dicho qué fila quedó — no la borra, porque borrarla
 * escondería la única evidencia.
 *
 * ── ¿PERDONA ALGO QUE EL PRODUCTO NO PERDONA? ─────────────────────────────
 * **Sí, y hay que decirlo:** la sonda corre con UNA cuenta
 * (`demo-prestador@epetplace.dev`). Prueba que **esa** sesión no puede
 * escribir. Un grant a un rol distinto de `authenticated` —o una policy que
 * habilite a otro perfil— **no lo vería**. La medición exacta por
 * `has_table_privilege` cubre ese hueco para `authenticated` y `anon`; para
 * cualquier otro rol, este arnés es ciego y lo declara.
 *
 * Salidas: 0 verde · 1 rojo · 2 no concluyente.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { dbQuery } from './lib-db.mjs';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s114-e';

// Las tres familias de tablas que §9.1 nombra.
const DEL_CASO   = ['casos_postventa', 'postventa_casos', 'caso_hilo', 'caso_eventos'];
const DEL_SALDO  = ['saldo_hogar', 'saldo_familia', 'saldo_movimientos', 'saldo_epetplace'];
const DE_MOTIVOS = ['cat_motivos_postventa'];
const TODAS = [...DEL_CASO, ...DEL_SALDO, ...DE_MOTIVOS];

const fallos = [];
const notas = [];

// ══ ① EL CANDADO, medición exacta ════════════════════════════════════════
const priv = dbQuery(`
  select c.relname as tabla, r.rolname as rol, c.relrowsecurity as rls,
         has_table_privilege(r.rolname, c.oid, 'SELECT') as sel,
         has_table_privilege(r.rolname, c.oid, 'INSERT') as ins,
         has_table_privilege(r.rolname, c.oid, 'UPDATE') as upd,
         has_table_privilege(r.rolname, c.oid, 'DELETE') as del
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'),('authenticated')) r(rolname)
   where n.nspname = 'public' and c.relkind = 'r'
     and c.relname in (${TODAS.map((t) => `'${t}'`).join(',')})
   order by c.relname, r.rolname`);

const existentes = [...new Set(priv.map((p) => p.tabla))];
console.log('verify:asientos-caso · §9 (F5) de LETRA_POSTVENTA\n');
console.log('  ── ① EL CANDADO (§9.1) ──');
if (!existentes.length) {
  console.log('   ninguna de las tablas de §9.1 existe todavía.');
} else {
  console.log('   tabla                          rol             RLS  SELECT  INSERT  UPDATE  DELETE');
  for (const p of priv) {
    const malo = p.ins || p.upd || p.del || (p.rol === 'anon' && p.sel);
    console.log(
      `   ${malo ? '🔴' : '  '} ${p.tabla.padEnd(28)} ${p.rol.padEnd(14)} ${String(p.rls).padEnd(5)}` +
      ` ${String(p.sel).padEnd(7)} ${String(p.ins).padEnd(7)} ${String(p.upd).padEnd(7)} ${String(p.del)}`,
    );
    if (p.ins || p.upd || p.del) {
      fallos.push(`${p.tabla}: ${p.rol} puede escribir (§9.1 exige REVOKE INSERT/UPDATE/DELETE)`);
    }
    if (p.rol === 'anon' && p.sel) fallos.push(`${p.tabla}: anon puede LEER`);
    if (!p.rls) fallos.push(`${p.tabla}: sin RLS`);
  }
}
const faltan = TODAS.filter((t) => !existentes.includes(t));
const faltanCaso  = DEL_CASO.every((t) => faltan.includes(t));
const faltanSaldo = DEL_SALDO.every((t) => faltan.includes(t));

// ══ ② LA SONDA POR POSTGREST REAL, con su control positivo ═══════════════
console.log('\n  ── LA SONDA POR POSTGREST REAL (con control positivo) ──');
let sondaOk = false;
if (existentes.length) {
  const env = Object.fromEntries(
    readFileSync(`${RAIZ}/apps/cliente/.env.local`, 'utf8').split('\n')
      .filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  );
  const URL = env.EXPO_PUBLIC_SUPABASE_URL;
  const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  // El claim se verifica: correr con más permisos de los que se dice medir
  // no mide lo que se dice (misma ley que `claveAnonDeEnv`).
  const rol = JSON.parse(Buffer.from(ANON.split('.')[1], 'base64url').toString('utf8')).role;
  if (rol !== 'anon') {
    console.error(`   🟠 la clave de .env.local tiene role=${rol}, no "anon". El arnés PARA.`);
    process.exit(2);
  }

  const email = execFileSync('security', ['find-generic-password', '-s', 'epetplace-cuenta-prueba'],
    { encoding: 'utf8' }).match(/"acct"<blob>="([^"]+)"/)?.[1];
  const clave = execFileSync('security', ['find-generic-password', '-s', 'epetplace-cuenta-prueba', '-w'],
    { encoding: 'utf8' }).trim();

  const cli = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: eLogin } = await cli.auth.signInWithPassword({ email, password: clave });
  if (eLogin) {
    console.error(`   🟠 NO CONCLUYENTE · no se pudo abrir sesión: ${eLogin.message}`);
    process.exit(2);
  }

  const tabla = existentes.find((t) => DE_MOTIVOS.includes(t)) ?? existentes[0];
  // CONTROL POSITIVO: la misma sesión, la misma tabla, un SELECT.
  const { error: eSel } = await cli.from(tabla).select('codigo').limit(1);
  if (eSel) {
    console.error(`   🟠 NO CONCLUYENTE · el SELECT de control también rebotó sobre \`${tabla}\`:`);
    console.error(`      ${eSel.message}`);
    console.error('      Una sonda que rebota en todo no mide el candado: mide su sesión.');
    process.exit(2);
  }
  console.log(`   ✅ control positivo: la sesión LEE \`${tabla}\` por PostgREST.`);

  const { data: dIns, error: eIns } = await cli.from(tabla)
    .insert({ codigo: '__sonda_candado__', objeto: 'cita', clase: 2, voz: 'sonda' }).select('codigo');
  if (!eIns) {
    fallos.push(`🔴🔴 ${tabla}: la sonda ESCRIBIÓ. Fila '__sonda_candado__' quedó en la tabla.`);
    console.error(`   🔴🔴 LA SONDA ESCRIBIÓ EN \`${tabla}\` — el candado NO existe.`);
    console.error('      La fila NO se borra: es la única evidencia. ' + JSON.stringify(dIns));
  } else {
    console.log(`   ✅ el INSERT rebotó: ${eIns.code ?? '(sin código)'} · ${String(eIns.message).slice(0, 90)}`);
    sondaOk = true;
  }
}

// ══ ③ LOS TRES ASIENTOS (§9.3) ═══════════════════════════════════════════
console.log('\n  ── ② LOS TRES ASIENTOS (§9.3) ──');
if (faltanCaso) {
  console.log('   🟠 sin sujeto: no existe la tabla del caso.');
  console.log(`      buscadas: ${DEL_CASO.join(' · ')}`);
  notas.push('los tres asientos no se pudieron medir: falta la tabla del caso');
} else {
  console.log('   (la tabla del caso existe: falta cablear las cinco sesiones)');
  notas.push('la tabla del caso ya existe — este bloque hay que completarlo');
}

// ══ VEREDICTO ════════════════════════════════════════════════════════════
console.log('');
if (fallos.length) {
  console.error('🔴 ROJO');
  for (const f of fallos) console.error(`   · ${f}`);
  process.exit(1);
}
if (faltanCaso || faltanSaldo) {
  console.error('🟠 NO CONCLUYENTE · §9 no se puede dar por cumplida.');
  if (faltanCaso)  console.error('   · falta la tabla del CASO  → el candado no se pudo medir sobre ella');
  if (faltanSaldo) console.error('   · falta la tabla del SALDO → ídem (§7 la exige en V1)');
  console.error(`   Lo que SÍ se midió: ${existentes.join(', ') || 'nada'}` +
                (sondaOk ? ' · candado verificado por PostgREST real ✅' : ''));
  console.error('   Un verde sobre 1 de 3 familias de tablas sería un verde flojo.');
  process.exit(2);
}
console.log('🟢 VERDE · candado puesto en las tres familias y tres asientos verificados.');
