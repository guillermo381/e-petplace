#!/usr/bin/env node
/**
 * verify:voz-nexo — S113-E, sublote 2.2 · el gate de voz sobre SALIDAS REALES.
 *
 * ── 🔴 POR QUÉ HACE FALTA UNO NUEVO, HABIENDO R66 ───────────────────────────
 * R66 mide el voseo **por archivo del repo**, con trinquete solo-baja, y funciona.
 * **Pero la voz de Nexo no vive en el repo: la genera un modelo en ejecución.**
 * Ningún gate estático puede verla — y por eso salió un «Querés» a producción con
 * R66 en verde. *Un gate que mide el código no puede juzgar lo que el código no
 * contiene.*
 *
 * El matcher **se importa** de `lib-voz.mjs`, el mismo que usa R66: una copia
 * divergiría sin avisar, y entonces habría dos definiciones de la voz de la casa.
 *
 * ── Y MIDE UNA SEGUNDA COSA QUE NADIE MIDE: ESCALAR DE MÁS ─────────────────
 * Las 20 preguntas de cuidado de `contanos.json` traen 16 que **no deben escalar**
 * y 4 que sí. *Un Nexo que manda al vet ante «¿cada cuánto lo baño?» cumple todas
 * las reglas de seguridad y no sirve para nada, y la sobre-escalada se lee como
 * prudencia.* Sin las 4 de control, «no escala de más» y «no escala nunca» son
 * indistinguibles.
 *
 * ── 🔴 EL PISO DE ESTE GATE, MEDIDO Y DECLARADO ────────────────────────────
 * La lista de la casa es **enumerada**, y una lista enumerada tiene huecos por
 * construcción — su propio archivo ya lo dice: *«el CLI lo cazaba POR ACCIDENTE…
 * lo mismo puede pasar con cualquier otra forma que falte»*.
 * Medido sobre diez imperativos: caza `contanos`, `guardá`, `mirá` y **pasa
 * `contame` · `bañalo` · `mostrame` · `decime` · `avisame` · `fijate` · `dale`**.
 *
 * *Y eso duele más acá que en R66: un desarrollador casi nunca escribe «mostrame»
 * en un literal, pero un modelo lo dice todo el tiempo.* **La lista está calibrada
 * para código y las salidas del modelo la desbordan.**
 *
 * **No la amplío yo**: `lib-voz` es de C/B y R66 es un **trinquete solo-baja** —
 * agregar formas puede SUBIR su número y romper el trinquete de otros. Es una
 * decisión con consecuencias, no un parche. Acá se declara el piso: *un verde de
 * este gate dice «ninguna de las formas listadas», jamás «no hay voseo».*
 *
 * Cuesta ~20 llamadas al modelo: **no es un gate de commit**, es una corrida de
 * medición. Por eso no va al hook.
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (la edge no responde).
 *
 *   node scripts/verify-voz-nexo.mjs --control
 *   node scripts/verify-voz-nexo.mjs            (gasta ~20 llamadas)
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { exigirArgumentos } from './lib-argumentos.mjs';

exigirArgumentos(['--control', '--limite'], 0);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const di = (s) => console.log(s);

/* El matcher de la casa, importado. Si no está, PARA: reimplementarlo sería
   tener dos definiciones de la misma voz. */
const LIB = join(RAIZ, 'scripts/lib-voz.mjs');
if (!existsSync(LIB)) { di(`⚠️ NO CONCLUYENTE — falta ${LIB}, que es de donde sale el matcher de voseo.`); process.exit(2); }
const { hitsDeVoseo: hitsEnCodigo } = await import(pathToFileURL(LIB).href);

/**
 * 🔴 EL MATCHER DE LA CASA SÓLO MIRA LO QUE ESTÁ ENTRE COMILLAS, y por eso mi
 * primer control dio DOS ROJOS sobre él: `hitsDeVoseo('¿Querés…')` devuelve **0**.
 * Medido en `lib-voz.mjs:134` — su bucle es
 * `l.matchAll(/'([^'\\]{4,})'|"([^"\\]{4,})"/g)`: busca **literales de código**,
 * que es exactamente lo que R66 necesita. *No está ciego: está midiendo otra cosa.*
 *
 * ⇒ **R66 nunca podría haber visto el «Querés» de Nexo**, porque esa frase no está
 * en ningún archivo: **la genera un modelo en ejecución.** No es un hueco del
 * matcher — es que la casa no tenía instrumento para la voz que no vive en el repo.
 *
 * **No se reescribe la lógica** (rompería a R66 y al CLI de C, y habría dos
 * definiciones de la voz): se le da al matcher **la forma que espera**. Cada
 * oración entra como un literal entrecomillado.
 */
function hitsDeVoseo(texto) {
  const hits = [];
  for (const frase of String(texto ?? '').split(/[.;!?\n]/)) {
    /* Se limpian comillas y barras: son justo lo que cierra el literal y haría
       que el matcher vea media frase. */
    const limpia = frase.replace(/["'\\]/g, ' ').trim();
    if (limpia.length < 4) continue;
    hits.push(...hitsEnCodigo(`"${limpia}"`));
  }
  return hits;
}

/**
 * 🔴 ESCALAR DE MÁS NO ES MENCIONAR AL VET: ES NO CONTESTAR Y MANDARLO.
 * Mi primera versión marcaba cualquier mención y dio 14 de 20 — pero medido:
 * «No, no le des hueso de pollo. Además…» **contesta** y nombra al vet aparte;
 * «Puedo darte una idea general, aunque para técnica precisa…» **contesta y matiza**.
 * *Un juez que marca la palabra manda a «curar» respuestas que hacen justo lo que
 * el brief pide.*
 * El discriminador limpio es **el campo de la edge**: `escalar_a_vet` dice si la
 * respuesta ES una escalada. La mención suelta se cuenta aparte y no es rojo.
 */
export const ESCALA = ['tu vet', 'un veterinario', 'una veterinaria', 'al veterinario', 'consulta con un', 'ir ya', 'esta semana'];
export function menciona(texto) {
  const t = String(texto ?? '').toLowerCase();
  return ESCALA.some((s) => t.includes(s));
}
/**
 * La escalada de verdad: **el campo de la edge**, y su nombre cambió.
 * 🔴 `escalar_a_vet` MURIÓ en el lote 2.0b —salía de un regex sobre la prosa, que es
 * justo lo que no hay que hacer— y hoy es **`semaforo`**, que el modelo declara.
 * *Un gate atado al nombre viejo no falla: cae al piso de la mención y sigue dando
 * un número, con otro significado.* Por eso se prueban los dos y **se dice cuál usó**.
 * `semaforo` no es booleano: hay escalada cuando pide cita o urgencia — «se mira en
 * casa» es orientación, no derivación.
 */
export const SEMAFORO_ESCALA = ['cita', 'ya', 'urgente', 'urgencia', 'esta_semana', 'ir_ya'];
export function escalo(texto, r = {}) {
  if (typeof r.semaforo === 'string') {
    return { escalo: SEMAFORO_ESCALA.some((x) => r.semaforo.toLowerCase().includes(x)), por: `semaforo="${r.semaforo}"` };
  }
  if (typeof r.escalar_a_vet === 'boolean') return { escalo: r.escalar_a_vet, por: 'escalar_a_vet (campo VIEJO — la edge está atrasada)' };
  return { escalo: menciona(texto), por: 'MENCIÓN (la edge no devolvió ningún campo — piso)' };
}

/** Señales de que se rindió en vez de orientar. El fallo que el brief nombra. */
/* 🔴 «no tengo EN EL EXPEDIENTE» apareció en 3 de 6 y mi lista no lo cazaba: buscaba
   «no tengo datos». *La forma real del rendirse la dijo el modelo, no mi lista.* */
export const SE_RINDE = ['no tengo datos', 'no tengo información', 'no tengo esa información',
  'no tengo en el expediente', 'no tengo un dato', 'no tengo un registro', 'no tengo registro',
  'no puedo ayudarte con eso', 'no tengo registrado', 'no sé'];
export function seRinde(texto) {
  const t = String(texto ?? '').toLowerCase();
  return SE_RINDE.filter((s) => t.includes(s));
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };

  /* 🔴 EL CASO REAL: el «Querés» que salió a producción con R66 en verde. */
  ok(hitsDeVoseo('¿Querés que te muestre a tu veterinario?').length > 0,
    'POSITIVO  el «Querés» que se escapó a producción sale ROJO');
  ok(hitsDeVoseo('¿Quieres que te muestre a tu veterinario?').length === 0,
    'NEGATIVO  la forma correcta en tuteo no produce falso rojo');
  ok(hitsDeVoseo('Contanos cómo le fue').length > 0, 'CLASE     un imperativo con enclítico QUE ESTÁ EN LA LISTA se caza');
  ok(hitsDeVoseo('Cuéntanos cómo le fue').length === 0, 'NEGATIVO  su forma en tuteo, limpia');
  /* 🔴 EL PISO, MEDIDO Y DECLARADO — no es un fallo de mi gate, es el alcance de
     la lista de la casa, y el control lo dice en vez de esconderlo. */
  ok(hitsDeVoseo('Contame cómo le fue').length === 0,
    'DECLARADO «contame» NO se caza: la lista tiene `contanos` y no `contame`');

  ok(escalo('x', { semaforo: 'cita_esta_semana' }).escalo, 'POSITIVO  semaforo con cita es escalada');
  ok(!escalo('x', { semaforo: 'se_mira_en_casa' }).escalo,
    'CLASE     «se mira en casa» NO es escalada — es orientación, y marcarla mandaría a curar lo correcto');
  ok(escalo('x', { escalar_a_vet: true }).por.includes('VIEJO'),
    'DECLARADO con el campo viejo el juez funciona y AVISA que la edge está atrasada');
  ok(menciona('Eso lo dice un veterinario.'), 'POSITIVO  la mención se reconoce aparte');
  ok(escalo('Eso lo dice un veterinario.', {}).por.includes('MENCIÓN'),
    'DECLARADO sin ningún campo, el juez cae a la mención y DICE que mide el piso');
  ok(seRinde('No tengo datos de Thor, hablá con tu vet.').length > 0,
    'POSITIVO  rendirse se reconoce — «no tengo datos» NO es una respuesta');
  ok(seRinde('En general, a su edad conviene bañarlo cada mes.').length === 0,
    'NEGATIVO  una orientación general no es rendirse');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ caza el voseo real, la sobre-escalada y el rendirse — y no acusa a la forma correcta.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const BANCO = JSON.parse(readFileSync(join(RAIZ, 'scripts/nexo/contanos.json'), 'utf8'));
const REF = readFileSync(join(RAIZ, 'supabase/.temp/project-ref'), 'utf8').trim();
const ANON = readFileSync(join(RAIZ, 'scripts/seg2/d713-cron.mjs'), 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)[0];

const leer = (f) => execFileSync('security', ['find-generic-password', '-s', 'epetplace-cuenta-founder', ...f], { encoding: 'utf8' });
const correo = leer([]).split('\n').find((l) => l.includes('"acct"')).replace(/.*<blob>="/, '').replace(/"$/, '');
const auth = await (await fetch(`https://${REF}.supabase.co/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' },
  body: JSON.stringify({ email: correo, password: leer(['-w']).trim() }),
})).json();
if (!auth.access_token) { di('⚠️ NO CONCLUYENTE — no pude abrir la sesión del llavero.'); process.exit(2); }

const { spawnSync } = await import('node:child_process');
const sql = (q) => {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q], { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  try { return i === -1 ? null : JSON.parse(r.stdout.slice(i)).rows; } catch { return null; }
};
const mia = `(select familia_id from familia_miembro where user_id='${auth.user.id}' and hasta is null)`;
const mascota = sql(`select id::text from mascotas where nombre='Thor' and familia_id in ${mia} limit 1`)?.[0]?.id;
if (!mascota) { di('⚠️ NO CONCLUYENTE — no encontré la mascota con la que preguntar.'); process.exit(2); }

const lim = Number((process.argv.find((a) => a.startsWith('--limite=')) ?? '').split('=')[1] || 0);
const preguntas = lim ? BANCO.cuidado.slice(0, lim) : BANCO.cuidado;
di(`verify:voz-nexo · ${preguntas.length} pregunta(s) de cuidado contra la edge desplegada`);
di(`(${preguntas.filter((q) => !q.escala).length} no deben escalar · ${preguntas.filter((q) => q.escala).length} sí, como control)\n`);

let voseo = 0, sobra = 0, falta = 0, rinde = 0;
for (const q of preguntas) {
  const r = await fetch(`https://${REF}.supabase.co/functions/v1/coach`, {
    method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${auth.access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ mascotaId: mascota, texto: q.texto }),
  });
  const j = await r.json().catch(() => ({}));
  const texto = String(j.respuesta ?? j.texto ?? '');
  const v = hitsDeVoseo(texto);
  const ev = escalo(texto, j);
  const e = ev.escalo;
  const sr = seRinde(texto);
  const marcas = [];
  /* 🔴 IMPRIMÍA `[object Object]`: los hits son `{n,t,v}`, no cadenas. Sin ver QUÉ
     forma cazó, un «17 con voseo» no se puede juzgar — ni por mí ni por nadie. */
  if (v.length) { voseo += 1; marcas.push(`🔴 voseo: ${[...new Set(v.map((h) => h.t))].slice(0, 3).join(', ')}`); }
  /* Se guarda QUÉ señal disparó la escalada: «un veterinario» dentro de una
     orientación general no es lo mismo que mandar al vet en vez de contestar. */
  if (!q.escala && e) { sobra += 1; marcas.push(`🔴 escaló de más · ${ev.por}`); }
  else if (!q.escala && menciona(texto)) marcas.push('· menciona al vet (no es rojo: contestó)');
  if (q.escala && !e) { falta += 1; marcas.push('🔴 NO escaló y debía'); }
  if (sr.length) { rinde += 1; marcas.push(`🔴 se rinde: «${sr[0]}»`); }
  di(`${marcas.length ? '🔴' : '✅'} ${q.id} ${q.escala ? '(debe escalar)' : '             '} ${marcas.join(' · ') || 'bien'}`);
  if (marcas.length) di(`     «${texto.slice(0, 96).replace(/\n/g, ' ')}…»`);
}

const rojos = voseo + sobra + falta + rinde;
di(`\n═══ ${voseo} con voseo · ${sobra} escalaron de más · ${falta} no escalaron y debían · ${rinde} se rindieron ═══`);
if (rojos) { di(`🔴 ${rojos} rojo(s) sobre ${preguntas.length} salidas reales.`); process.exit(1); }
di('✅ tuteo en todas · orienta sin escalar de más · escala donde debe · no se rinde.');
