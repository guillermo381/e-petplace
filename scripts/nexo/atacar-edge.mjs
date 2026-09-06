#!/usr/bin/env node
/**
 * atacar-edge — S113-E, lote 2.0 · E2 contra la edge DESPLEGADA.
 *
 * Los 11 ataques del banco contra `coach` **por su puerta real**, con la sesión
 * del founder. Es lo que `atacar-system` no puede ver: memorial y otra familia
 * los decide la PUERTA antes del modelo, y sólo se prueban llamando de verdad.
 *
 * ── EL BRAZO QUE NINGÚN OTRO GATE TIENE ─────────────────────────────────────
 * **Pregunta de dato ⇒ `ia_uso` NO crece.** Se cuenta la tabla antes y después:
 * delta exacto **0**. Y con su DISCRIMINADOR en la misma corrida —un turno de
 * narrativa que SÍ la hace crecer—, porque *si sólo se mide el cero, un `ia_uso`
 * que dejó de escribirse por cualquier motivo da verde para siempre.*
 *
 * Credenciales del llavero, al momento, jamás impresas.
 *   node scripts/nexo/atacar-edge.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const di = (s) => console.log(s);
const JUEZ = join(RAIZ, 'scripts/verify-nexo-rojos.mjs');
if (!existsSync(JUEZ)) { di(`🔴 me falta mi juez: ${JUEZ}`); process.exit(2); }
const { juzgar } = await import(pathToFileURL(JUEZ).href);
const BANCO = JSON.parse(readFileSync(join(RAIZ, 'scripts/nexo/rojos.json'), 'utf8'));
const REF = readFileSync(join(RAIZ, 'supabase/.temp/project-ref'), 'utf8').trim();
const ANON = readFileSync(join(RAIZ, 'scripts/seg2/d713-cron.mjs'), 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)[0];

/** Sesión del founder, del llavero, al momento. Nunca se imprime. */
async function sesion() {
  const leer = (f) => execFileSync('security', ['find-generic-password', '-s', 'epetplace-cuenta-founder', ...f], { encoding: 'utf8' });
  const correo = leer([]).split('\n').find((l) => l.includes('"acct"')).replace(/.*<blob>="/, '').replace(/"$/, '');
  const clave = leer(['-w']).trim();
  const r = await fetch(`https://${REF}.supabase.co/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' },
    body: JSON.stringify({ email: correo, password: clave }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('no pude iniciar sesión con la cuenta del llavero. PARA.');
  return { tok: j.access_token, uid: j.user.id };
}

const sql = (q) => {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  return i === -1 ? null : JSON.parse(r.stdout.slice(i)).rows;
};

const { tok, uid } = await sesion();
/** Los tres sujetos se BUSCAN, no se escriben: un id fijo envejece. */
const mias = `(select familia_id from familia_miembro where user_id='${uid}' and hasta is null)`;
const viva = sql(`select id::text from mascotas where nombre='Thor' and familia_id in ${mias} limit 1`)?.[0]?.id;
const memorial = sql(`select id::text from mascotas where familia_id in ${mias} and estado_vida<>'activa' limit 1`)?.[0]?.id;
const ajena = sql(`select id::text from mascotas where familia_id not in ${mias} and estado_vida='activa' limit 1`)?.[0]?.id;
if (!viva || !memorial || !ajena) { di('🔴 no encontré los tres sujetos (viva · memorial · ajena). PARA.'); process.exit(2); }

const sujetoDe = (c) => (c.sujeto === 'memorial' ? memorial : c.sujeto === 'ajena' ? ajena : viva);
/* 🔴 SE CUENTA EL REDACTOR, NO LA TABLA. «Pregunta de dato ⇒ cero llamadas al
   modelo» es ambiguo y mi primera versión lo leyó mal: contó `ia_uso` entero y
   dio ROJO porque **el router también es un modelo** — y el router DEBE correr,
   porque es justamente quien decide que la pregunta es de dato. Medido: en 13
   turnos el router corrió 12 veces y el redactor 8. *Lo que la plantilla ahorra
   es la REDACCIÓN, no el enrutado.* */
const PIEZA_REDACTOR = process.env.COACH_PIEZA ?? 'coach';
const contar = (pieza) => Number(sql(`select count(*)::int as n from ia_uso where pieza='${pieza}'`)?.[0]?.n ?? -1);
const contarIaUso = () => contar(PIEZA_REDACTOR);

async function pedir(mascotaId, texto) {
  const t0 = Date.now();
  const r = await fetch(`https://${REF}.supabase.co/functions/v1/coach`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${tok}`, 'content-type': 'application/json' },
    body: JSON.stringify({ mascotaId, texto }),
  });
  const ms = Date.now() - t0;
  let j = {}; try { j = await r.json(); } catch {}
  return { estado: r.status, ms, ...j };
}

di(`atacar-edge · ${REF} · sesión del founder · ${BANCO.casos.length} ataques`);
di(`sujetos resueltos: viva · memorial · ajena (ids no se imprimen)\n`);

let rojos = 0;
for (const caso of BANCO.casos) {
  const r = await pedir(sujetoDe(caso), caso.texto);
  const ajenos = caso.juicio === 'canario_dato'
    ? (sql(`select nombre from mascotas where familia_id not in ${mias} and nombre is not null limit 40`) ?? []).map((x) => x.nombre)
    : [];
  const propios = caso.juicio === 'canario_dato'
    ? (sql(`select nombre from mascotas where familia_id in ${mias} and nombre is not null`) ?? []).map((x) => x.nombre)
    : [];
  const v = juzgar(caso, r, { canario: BANCO.canario, ajenos, propios });
  if (v.rojo) rojos += 1;
  const cuerpo = (r.texto ?? r.respuesta ?? r.codigo ?? r.error ?? '').toString();
  di(`${v.rojo ? '🔴' : '✅'} ${caso.id.padEnd(20)} HTTP ${r.estado} ${String(r.ms).padStart(5)}ms · ${v.nota}`);
  di(`   «${cuerpo.slice(0, 88).replace(/\n/g, ' ')}…»`);
}

di(`\n── el brazo que ningún otro gate tiene: pregunta de dato ⇒ el REDACTOR (\`${PIEZA_REDACTOR}\`) no corre ──`);
const antes = contarIaUso();
const rd = await pedir(viva, '¿Cuándo le toca la próxima vacuna?');
const medio = contarIaUso();
const rn = await pedir(viva, '¿Cómo viene de peso este año? Contame en un párrafo.');
const despues = contarIaUso();
const deltaDato = medio - antes, deltaNarr = despues - medio;
di(`  dato      ${rd.estado} ${String(rd.ms).padStart(5)}ms · redactor ${antes} → ${medio}  (delta ${deltaDato})  ${deltaDato === 0 ? '✅' : '🔴 llamó al modelo'}`);
di(`  narrativa ${rn.estado} ${String(rn.ms).padStart(5)}ms · redactor ${medio} → ${despues}  (delta ${deltaNarr})  ${deltaNarr > 0 ? '✅ discrimina' : '🔴 el instrumento no mide: tampoco creció con narrativa'}`);
if (deltaDato !== 0) rojos += 1;
if (deltaNarr <= 0) { di('  ⚠️ sin discriminador, el cero de arriba NO prueba nada.'); rojos += 1; }

di(`\n${rojos === 0 ? '✅' : '🔴'} ${rojos} rojo(s) contra la edge desplegada.`);
process.exit(rojos ? 1 : 0);
