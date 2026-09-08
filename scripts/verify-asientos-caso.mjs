#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:asientos-caso — S114-E · §9 de `LETRA_POSTVENTA` (F5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **① EL CANDADO (§9.1).** `REVOKE INSERT, UPDATE, DELETE` sobre las tablas del
 * caso, del saldo y de los motivos a `authenticated`; escriben únicamente las
 * RPCs `SECURITY DEFINER`. **El admin no puede escapar aunque quiera** — la
 * puerta única deja de ser prosa y pasa a ser permiso (`D-889`).
 *
 * **② LOS CINCO ASIENTOS (§9.3)**, *«verificados por PostgREST real y no
 * simulado»*: familia ve los suyos · prestador los de sus objetos · casa todos ·
 * **tercero: cero** · anon: cero.
 *
 * ── LA TABLA DEL SALDO SE DESCUBRE POR PATRÓN, NO POR LISTA ──────────────
 * §7 la exige en V1 y todavía no existe. Buscarla por una lista de nombres
 * candidatos sería atarla a que alguien adivine bien el nombre: **un gate atado
 * a un nombre mide la convención, no el hecho.** Se descubre por patrón
 * (`^saldo` o `_saldo`) para que el día que nazca **entre sola al candado**.
 *
 * ── POR QUÉ EL VERDE ES VERDE AUNQUE FALTE EL SALDO ─────────────────────
 * *«No pude mirar»* y *«todavía no existe»* son estados distintos.* El gate
 * mira **todo lo que existe** y lo encuentra cerrado; la tabla que no nació no
 * es un hueco de medición, es trabajo pendiente — y va como **nota**, no como
 * bloqueo. **El día que aparezca, el patrón la mete al candado sin tocar una
 * línea, y si viene sin `REVOKE` el gate se pone rojo solo.**
 *
 * ── EL FIXTURE, DECLARADO ────────────────────────────────────────────────
 * `casos_postventa` está en CERO filas, y **sobre cero filas los cinco asientos
 * dan cero y no significan nada**. Se siembra UN caso y se borra al final.
 *
 * 🔴 **Se intenta PRIMERO por la puerta real (`abrir_caso`)**, y su rechazo
 * también se reporta: hoy devuelve `fuera_de_ventana` (7 días) sobre el objeto
 * disponible, **lo cual es la puerta funcionando**. Recién entonces se siembra
 * por `service_role` **como fixture declarado** — el sembrado es andamio; **lo
 * que tiene que ser real es la MEDICIÓN**, y lo es: cinco sesiones por
 * PostgREST con la anon key.
 *
 * ⚠️ **Residuo:** el caso sembrado se borra y el gate **verifica que quedó en
 * cero**. Si no pudo borrarlo, lo dice y sale 2 — *una sonda que deja residuo
 * contamina la medición ajena.*
 *
 * ── ¿PERDONA ALGO QUE EL PRODUCTO NO PERDONA? ────────────────────────────
 * **Sí, y son tres, declaradas:**
 * · **EL ASIENTO DE LA CASA YA SE EJERCE** (A, adenda 13): la cuenta
 *   `casa-prueba-s114@epetplace.dev` es una **sesión de usuario real con
 *   `is_admin()=true`**, no `service_role` ni bypass. Los cinco asientos se
 *   miden. *Lo que queda declarado es OTRA cosa, más fina:* **hoy TODOS los
 *   casos de la base pertenecen a la misma familia**, así que la comparación
 *   «casa ve todos» **no puede separarse de «la familia ve los suyos»** por
 *   conteo. Se mide igual —casa sin filtro contra el total real— y **se dice
 *   que esa mitad no discrimina hasta que exista un caso de otra familia.***
 * · La **sonda del candado** corre con una sola cuenta; la medición exacta por
 *   `has_table_privilege` cubre `authenticated` y `anon`, y **para cualquier
 *   otro rol este arnés es ciego**.
 * · Mide **lectura**. Que las RPCs `SECURITY DEFINER` gateen bien por dentro es
 *   otro instrumento.
 *
 * Salidas: 0 verde · 1 rojo · 2 no concluyente.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { dbQuery } from './lib-db.mjs';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s114-e';
const DEL_CASO = ['casos_postventa', 'caso_mensajes'];
const DE_MOTIVOS = ['cat_motivos_postventa'];
const MARCA = '__sonda_asientos_e3__';

const fallos = [];
const notas = [];

// El saldo se DESCUBRE, no se adivina.
const delSaldo = dbQuery(`
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and (c.relname ~ '^saldo' or c.relname ~ '_saldo')`).map((r) => r.relname);

const TODAS = [...DEL_CASO, ...delSaldo, ...DE_MOTIVOS];

// ══ ① EL CANDADO ═════════════════════════════════════════════════════════
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
console.log('   tabla                          rol             RLS  SELECT  INSERT  UPDATE  DELETE');
for (const p of priv) {
  const malo = p.ins || p.upd || p.del || (p.rol === 'anon' && p.sel) || !p.rls;
  console.log(
    `   ${malo ? '🔴' : '  '} ${p.tabla.padEnd(28)} ${p.rol.padEnd(14)} ${String(p.rls).padEnd(5)}` +
    ` ${String(p.sel).padEnd(7)} ${String(p.ins).padEnd(7)} ${String(p.upd).padEnd(7)} ${String(p.del)}`,
  );
  if (p.ins || p.upd || p.del) fallos.push(`${p.tabla}: ${p.rol} puede ESCRIBIR (§9.1 exige REVOKE)`);
  if (p.rol === 'anon' && p.sel) fallos.push(`${p.tabla}: anon puede LEER`);
  if (!p.rls) fallos.push(`${p.tabla}: sin RLS`);
}
if (delSaldo.length === 0) {
  notas.push('la tabla del SALDO (§7) todavía no existe — se descubre por patrón `^saldo|_saldo`, ' +
             'así que entra sola al candado el día que nazca');
  console.log('   ⚠️ ninguna tabla de SALDO existe todavía (§7 la exige en V1).');
}

// ══ ② SESIONES ═══════════════════════════════════════════════════════════
const env = Object.fromEntries(
  readFileSync(`${RAIZ}/apps/cliente/.env.local`, 'utf8').split('\n')
    .filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const rolAnon = JSON.parse(Buffer.from(ANON.split('.')[1], 'base64url').toString('utf8')).role;
if (rolAnon !== 'anon') {
  console.error(`\n🟠 la clave de .env.local tiene role=${rolAnon}, no "anon". El arnés PARA.`);
  process.exit(2);
}
/* `supabase/dev/.env.local` es gitignored ⇒ NO viaja al worktree, misma clase
   que `supabase/.temp` (la que volvía mudos a los gates de base). Se busca
   local y, si no está, en el árbol principal — es propiedad del REPO. */
function leerServiceRole() {
  const candidatos = [`${RAIZ}/supabase/dev/.env.local`];
  const g = execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim();
  candidatos.push(`${resolve(g, '..')}/supabase/dev/.env.local`);
  for (const c of candidatos) {
    if (!existsSync(c)) continue;
    const k = readFileSync(c, 'utf8').match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
    if (k) return k;
  }
  return null;
}
const SERVICE = leerServiceRole();
const clave = (svc, acct) => execFileSync('security',
  acct ? ['find-generic-password', '-a', acct, '-s', svc, '-w'] : ['find-generic-password', '-s', svc, '-w'],
  { encoding: 'utf8' }).trim();
const siembra = clave('epetplace-siembra-s97', 'siembra');
const claveDemo = clave('epetplace-cuenta-prueba');

async function sesion(email, pass) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: pass });
  return error ? { err: error.message } : { c };
}

// ══ ③ LA SONDA DEL CANDADO, con su control positivo ══════════════════════
console.log('\n  ── LA SONDA POR POSTGREST REAL (con control positivo) ──');
const sDemo = await sesion('demo-prestador@epetplace.dev', claveDemo);
if (sDemo.err) { console.error(`   🟠 no abre la sesión de prueba: ${sDemo.err}`); process.exit(2); }
{
  const t = 'cat_motivos_postventa';
  const { error: eSel } = await sDemo.c.from(t).select('codigo').limit(1);
  if (eSel) {
    console.error(`   🟠 NO CONCLUYENTE · el SELECT de control rebotó sobre \`${t}\`: ${eSel.message}`);
    console.error('      Una sonda que rebota en todo mide su sesión, no el candado.');
    process.exit(2);
  }
  console.log(`   ✅ control positivo: la sesión LEE \`${t}\` por PostgREST.`);
  const { data: d, error: e } = await sDemo.c.from(t)
    .insert({ codigo: MARCA, objeto: 'cita', clase: 2, voz: 'sonda' }).select('codigo');
  if (!e) {
    fallos.push(`🔴🔴 ${t}: la sonda ESCRIBIÓ. Fila '${MARCA}' quedó: ${JSON.stringify(d)}`);
    console.error(`   🔴🔴 LA SONDA ESCRIBIÓ EN \`${t}\` — el candado NO existe. La fila NO se borra.`);
  } else {
    console.log(`   ✅ el INSERT rebotó: ${e.code ?? '(sin código)'} · ${String(e.message).slice(0, 80)}`);
  }
}

// ══ ④ LOS CINCO ASIENTOS ═════════════════════════════════════════════════
console.log('\n  ── ② LOS CINCO ASIENTOS (§9.3) ──');
const admin = SERVICE ? createClient(URL, SERVICE, { auth: { persistSession: false } }) : null;
if (!admin) {
  console.error('   🟠 NO CONCLUYENTE · no se encontró `SUPABASE_SERVICE_ROLE_KEY` ni en este');
  console.error('      worktree ni en el árbol principal (`supabase/dev/.env.local`, gitignored).');
  console.error('      Sin fixture, `casos_postventa` está en 0 filas y los cinco asientos darían');
  console.error('      cero sin significar nada. El gate NO dice verde.');
  process.exit(2);
}

const FAMILIA = 'guillo381+8@gmail.com', TERCERO_FAM = 'guillo381+2@gmail.com';
const OTRO_PRESTADOR = 'guillo381+paseo1@gmail.com';
const PRESTADOR_ID = 'de300000-0000-4000-8000-0000000000e5';   // Paseos Andres

const objeto = dbQuery(`
  select c.id, c.user_id from evento_cita_servicio c
   join auth.users u on u.id = c.user_id
  where u.email = '${FAMILIA}' and c.prestador_id = '${PRESTADOR_ID}'
  order by c.fecha desc limit 1`)[0];
if (!objeto) { console.error('   🟠 no hay objeto para el fixture.'); process.exit(2); }

// La PUERTA REAL primero — su rechazo también es medición.
const sFam = await sesion(FAMILIA, siembra);
if (sFam.err) { console.error(`   🟠 la familia no abre sesión: ${sFam.err}`); process.exit(2); }
const { data: puerta } = await sFam.c.rpc('abrir_caso', {
  p_objeto_tipo: 'cita', p_objeto_id: objeto.id, p_motivo: 'calidad',
  p_relato: `${MARCA} control de asientos`, p_procedencia: 'familia', p_modo: 'texto',
});
const abrioPorLaPuerta = puerta?.ok === true;
console.log(`   puerta real \`abrir_caso\`: ${abrioPorLaPuerta ? '✅ abrió' : `rebotó · ${puerta?.codigo ?? '(sin código)'}`}` +
            (abrioPorLaPuerta ? '' : '  ← la puerta funcionando; se siembra por fixture'));

let casoId = abrioPorLaPuerta ? (puerta.caso_id ?? puerta.id) : null;
if (!casoId) {
  const { data, error } = await admin.from('casos_postventa').insert({
    objeto_tipo: 'cita', objeto_id: objeto.id, motivo_codigo: 'calidad', clase: 2,
    familia_user_id: objeto.user_id, prestador_id: PRESTADOR_ID,
    etapa: 'recibido', relato: `${MARCA} fixture declarado`, procedencia: 'familia', modo: 'texto',
  }).select('id').single();
  if (error) { console.error(`   🟠 no se pudo sembrar el fixture: ${error.message}`); process.exit(2); }
  casoId = data.id;
}

/* 🔴 PARA `anon` LO CORRECTO NO ES «VE 0 FILAS»: ES QUE LO RECHACEN.
   §9.1 le revoca el SELECT entero, así que PostgREST corta con **401 antes de
   evaluar la RLS**. Medido: `count: null · status 401 · error.message VACÍO`.
   *Una primera versión de este arnés leyó ese rechazo correcto como fallo*,
   porque asumía que todo asiento contesta con un número — y de paso el mensaje
   vacío se imprimía como `undefined`.
   ⚠️ Y la distinción no es cosmética: si algún día `anon` devolviera `0` en vez
   de 401, **significaría que tiene el grant y sólo lo frena la RLS** — una
   postura más débil que la que §9.1 firma. Por eso ese caso es ROJO. */
const cuenta = async (cli) => {
  const { count, error, status } = await cli.from('casos_postventa')
    .select('id', { count: 'exact', head: true }).eq('id', casoId);
  if (error) return { rechazado: true, status: status ?? null, cod: error.code || String(status ?? '') || 'rechazado' };
  return { n: count ?? 0 };
};

let veredictoAsientos = [];
try {
  const sTerFam = await sesion(TERCERO_FAM, siembra);
  const sOtroPre = await sesion(OTRO_PRESTADOR, siembra);
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });

  const vFam = await cuenta(sFam.c);
  const vPre = await cuenta(sDemo.c);
  const vTer = sTerFam.err ? { err: sTerFam.err } : await cuenta(sTerFam.c);
  const vOtro = sOtroPre.err ? { err: sOtroPre.err } : await cuenta(sOtroPre.c);
  const vAnon = await cuenta(anon);
  const sCasa = await sesion('casa-prueba-s114@epetplace.dev', clave('epetplace-cuenta-casa-prueba'));
  const vCasa = sCasa.err ? { err: sCasa.err } : await cuenta(sCasa.c);

  veredictoAsientos = [
    ['familia (dueña del caso)', FAMILIA, vFam, 1],
    ['prestador DEL objeto', 'demo-prestador@epetplace.dev', vPre, 1],
    ['prestador AJENO', OTRO_PRESTADOR, vOtro, 0],
    ['tercero (otra familia)', TERCERO_FAM, vTer, 0],
    ['casa (is_admin)', 'casa-prueba-s114@epetplace.dev', vCasa, 1],
    ['anon', '(sin sesión)', vAnon, 'rechazado'],
  ];
  for (const [rot, quien, v, esperado] of veredictoAsientos) {
    const visto = v.rechazado ? `RECHAZADO (${v.cod})` : String(v.n);
    const ok = esperado === 'rechazado' ? v.rechazado === true : (!v.rechazado && v.n === esperado);
    console.log(`   ${ok ? '✅' : '🔴'} ${rot.padEnd(26)} ${String(quien).padEnd(30)} ${visto.padEnd(20)} (esperado ${esperado})`);
    if (!ok) {
      fallos.push(esperado === 'rechazado'
        ? `asiento ${rot}: NO fue rechazado — devolvió ${visto}. Si tiene el grant, ` +
          'lo frena sólo la RLS: §9.1 exige que ni siquiera pueda pedirlo.'
        : `asiento ${rot}: ${visto}, esperado ${esperado}`);
    }
  }
  // Control positivo: si NADIE de los que deben ver, ve, la consulta no mide.
  if (!vFam.rechazado && !vPre.rechazado && vFam.n === 0 && vPre.n === 0) {
    console.error('   🟠 ni la familia ni el prestador ven el caso ⇒ la consulta no mide.');
    notas.push('control positivo de los asientos caído');
  }
  /* ── «CASA VE TODOS», y hasta dónde llega la prueba ──────────────────
     Ver el caso fixture prueba que la casa entra; NO prueba que vea TODOS.
     Para eso se cuenta SIN filtro y se compara contra el total real. */
  const totalReal = dbQuery('select count(*)::int n from casos_postventa')[0].n;
  const sinFiltro = async (cli) => {
    const { count, error } = await cli.from('casos_postventa').select('id', { count: 'exact', head: true });
    return error ? null : (count ?? 0);
  };
  const casaTodos = sCasa.err ? null : await sinFiltro(sCasa.c);
  const terceroTodos = sTerFam.err ? null : await sinFiltro(sTerFam.c);
  const familiaTodos = await sinFiltro(sFam.c);
  console.log(`   ── «casa ve todos»: casa ${casaTodos} · familia ${familiaTodos} · tercero ${terceroTodos} · total real ${totalReal}`);
  if (casaTodos !== totalReal) {
    fallos.push(`asiento CASA: sin filtro ve ${casaTodos} de ${totalReal} casos — no ve todos`);
  }
  if (terceroTodos !== 0) fallos.push(`el tercero ve ${terceroTodos} casos sin filtro, esperado 0`);
  if (familiaTodos === totalReal) {
    console.log('   ⚠️ hoy la familia también ve el total: TODOS los casos de la base son suyos,');
    console.log('      así que este conteo NO separa «casa ve todos» de «la familia ve los suyos».');
    notas.push('«casa ve todos» no discrimina hoy: no existe un caso de otra familia');
  }
} finally {
  // ── RESIDUO CERO ──
  await admin.from('caso_mensajes').delete().eq('caso_id', casoId);
  await admin.from('casos_postventa').delete().eq('id', casoId);
  const quedan = dbQuery(`select count(*)::int n from casos_postventa where relato like '%${MARCA}%'`)[0].n;
  if (quedan > 0) {
    console.error(`\n🟠 NO CONCLUYENTE · quedaron ${quedan} filas del fixture sin borrar.`);
    console.error('   Una sonda que deja residuo contamina la medición ajena.');
    process.exit(2);
  }
  console.log('   ✅ residuo del fixture: 0');
}

// ══ VEREDICTO ════════════════════════════════════════════════════════════
console.log('');
if (fallos.length) {
  console.error('🔴 ROJO');
  for (const f of fallos) console.error(`   · ${f}`);
  process.exit(1);
}
console.log(`🟢 VERDE · candado puesto en las ${existentes.length} tablas que existen, y los`);
console.log('   CINCO asientos de §9.3 —familia · prestador · casa · tercero · anon— más el');
console.log('   prestador AJENO, todos por PostgREST real.');
for (const n of notas) console.log(`   ⚠️ ${n}`);
