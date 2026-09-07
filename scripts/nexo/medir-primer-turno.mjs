#!/usr/bin/env node
/**
 * medir-primer-turno — S113-E, sublote 2.1 · E4.
 *
 * **Cuánto cuesta y cuánto tarda el PRIMER turno**, que es el caro y el que decide
 * si la familia vuelve: lleva el contexto completo, escribe el caché y —cuando la
 * presentación exista— además redacta las tres burbujas.
 *
 * Se mide **contra la edge desplegada**, por su puerta, con la cuenta del founder.
 * Los tokens y el costo salen de `ia_uso`, **no del `ok:true` de la edge**: una
 * señal optimista no es un hecho.
 *
 *   node scripts/nexo/medir-primer-turno.mjs
 */
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const REF = readFileSync(`${RAIZ}/supabase/.temp/project-ref`, 'utf8').trim();
const ANON = readFileSync(`${RAIZ}/scripts/seg2/d713-cron.mjs`, 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)[0];
const di = (s) => console.log(s);
const sql = (q) => {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  try { return i === -1 ? null : (JSON.parse(r.stdout.slice(i)).rows ?? null); } catch { return null; }
};

const leer = (f) => execFileSync('security', ['find-generic-password', '-s', 'epetplace-cuenta-founder', ...f], { encoding: 'utf8' });
const correo = leer([]).split('\n').find((l) => l.includes('"acct"')).replace(/.*<blob>="/, '').replace(/"$/, '');
const auth = await (await fetch(`https://${REF}.supabase.co/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' },
  body: JSON.stringify({ email: correo, password: leer(['-w']).trim() }),
})).json();
if (!auth.access_token) { di('🔴 no pude iniciar sesión con la cuenta del llavero. PARA.'); process.exit(2); }

const mia = `(select familia_id from familia_miembro where user_id='${auth.user.id}' and hasta is null)`;
const mascota = sql(`select id::text from mascotas where nombre='Thor' and familia_id in ${mia} limit 1`)?.[0]?.id;
if (!mascota) { di('🔴 no encontré la mascota con la que medir. PARA.'); process.exit(2); }

/* 🔴 EL HILO SE BORRA ANTES: si hay conversación previa, NO es un primer turno.
   *Medir el «primer turno» sobre un hilo con historia mide otra cosa, y el número
   sale más barato de lo que la familia va a pagar de verdad.* */
const borrar = sql(`select public.borrar_hilo_coach('${mascota}')::text as r`);
di(`hilo previo: ${borrar?.length ? 'borrado' : '⚠️ NO pude borrarlo — con historia previa esto NO es un primer turno y el número sale barato de más'}`);

/* 🔴 COMPARABA UUIDs COMO TEXTO PARA DETECTAR FILAS NUEVAS, y los UUID no ordenan
   por tiempo: `ia_uso` registró el turno y mi consulta devolvió cero. *El costo se
   reportó como «no se puede afirmar» sobre un turno que sí se midió.* Se usa el
   RELOJ DE LA BASE, no el mío ni el id. */
const t0db = sql(`select now()::text as t`)?.[0]?.t;
if (!t0db) { di('🔴 no pude leer el reloj de la base. PARA — sin ancla no sé qué filas son de este turno.'); process.exit(2); }
const t0 = Date.now();
const r = await fetch(`https://${REF}.supabase.co/functions/v1/coach`, {
  method: 'POST',
  headers: { apikey: ANON, Authorization: `Bearer ${auth.access_token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ mascotaId: mascota, texto: '¿Cómo viene Thor este año?' }),
});
const ms = Date.now() - t0;
const j = await r.json().catch(() => ({}));

/* El costo se lee de `ia_uso`, no de la respuesta: la edge puede decir ok y no
   haber registrado, y al revés. */
const filas = sql(`select pieza, modelo, tokens_entrada, tokens_salida,
                          tokens_cache_lectura, tokens_cache_escritura,
                          latencia_ms, costo_estimado_usd::text as usd, prompt_chars
                   from ia_uso where created_at >= '${t0db}'::timestamptz order by created_at`) ?? [];

di(`\nprimer turno · HTTP ${r.status} · ${ms} ms de punta a punta`);
di(`respuesta: ${(j.texto ?? j.codigo ?? '').toString().slice(0, 70)}…\n`);
if (!filas.length) { di('🔴 `ia_uso` no registró NADA para este turno: el costo no se puede afirmar.'); process.exit(1); }

let total = 0;
for (const f of filas) {
  total += Number(f.usd ?? 0);
  di(`  ${String(f.pieza).padEnd(14)} ${String(f.modelo).padEnd(18)} ent ${String(f.tokens_entrada).padStart(5)} · sal ${String(f.tokens_salida).padStart(4)} · cache w/r ${f.tokens_cache_escritura}/${f.tokens_cache_lectura} · ${String(f.latencia_ms).padStart(5)} ms · USD ${Number(f.usd ?? 0).toFixed(6)}`);
}
const prompt = Math.max(...filas.map((f) => Number(f.prompt_chars ?? 0)));
di(`\n═══ PRIMER TURNO ═══`);
di(`  costo    USD ${total.toFixed(6)}   · ${filas.length} llamada(s) al modelo`);
di(`  latencia ${ms} ms de punta a punta (el techo del brief es 6.000)`);
di(`  contexto ${prompt} chars en el prompt más grande`);
/* 🔴 EL NÚMERO NO ES DE UN PRIMER TURNO SI EL CACHÉ ESTABA CALIENTE.
   Medido: la primera corrida dio `cache w/r 0/1700` — LEYÓ y no escribió, porque
   mis propias pruebas lo habían dejado tibio. *Un «primer turno» medido sobre un
   caché caliente sale 2,5× más barato de lo que la familia va a pagar de verdad*,
   y el número se lee igual de creíble. Se detecta y se dice; no se corrige a mano. */
const escribio = filas.reduce((a, f) => a + Number(f.tokens_cache_escritura ?? 0), 0);
const leyo = filas.reduce((a, f) => a + Number(f.tokens_cache_lectura ?? 0), 0);
if (!escribio && leyo) {
  const extra = leyo * (2.5 - 0.2) / 1e6;   // escritura 2,5 $/M contra lectura 0,2 $/M
  di(`\n🔴 ESTE NO ES UN PRIMER TURNO FRÍO: leyó ${leyo} tokens de caché y escribió 0.`);
  di(`   Un primer turno de verdad paga la ESCRITURA de esos ${leyo} tokens:`);
  di(`   USD ${(total + extra).toFixed(6)} en vez de ${total.toFixed(6)} — **${((total + extra) / total).toFixed(1)}× más**.`);
  di(`   El caché de 5 minutos se enfría solo; para medirlo frío hay que esperar.`);
  di(`\n  proyección con el número FRÍO · 1.000 aperturas = USD ${((total + extra) * 1000).toFixed(2)}`);
} else {
  di(`\n  proyección · 1.000 familias que abren Nexo una vez = USD ${(total * 1000).toFixed(2)}`);
  di(`  ${escribio ? `✅ turno frío de verdad: escribió ${escribio} tokens de caché.` : ''}`);
}
