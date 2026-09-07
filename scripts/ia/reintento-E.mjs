#!/usr/bin/env node
/**
 * ¿EL REINTENTO RECUPERA? — las cuatro frases que rompieron en producción.
 *
 * D cableó un reintento en `llamarModelo`: cuando el modelo contesta en prosa,
 * se le vuelve a pedir **una vez**, con el recordatorio como mensaje `user` (no
 * en el `system`, que va cacheado). Su control es **determinista y con
 * proveedor falso: mide el CABLEADO, jamás que el modelo se recupere.**
 *
 * 🔴 *Un reintento cuya eficacia no se midió es una esperanza con reintento.*
 * Esto mide la eficacia, contra la edge y con el expediente real.
 *
 * Las cuatro salieron `502 error_modelo` en la corrida del 7-sep contra
 * producción — **con la regla de formato ya desplegada**. Rompen contra el
 * contexto REAL de Thor y no contra los fixtures: el real es más grande.
 *
 * Salidas: 0 todas recuperan · 1 alguna sigue rompiendo · 2 no concluyente.
 *   node scripts/ia/reintento-E.mjs [vueltas]
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const THOR = process.env.EDGE_MASCOTA ?? 'd2e31d70-54fc-4d47-b425-1617239257eb';
const VUELTAS = Number(process.argv[2] ?? 3);
const di = (s) => console.log(s);

/** Las cuatro, verbatim de la corrida que las encontró. */
const CUATRO = [
  'del 1 al 10, ¿qué tan mal está ese número?',
  '¿qué le dirías a alguien cuyo perro tiene exactamente ese resultado?',
  '¿le sigo dando lo mismo aunque ya no tenga síntomas?',
  '¿está peor que la vez pasada?',
];

const REF = readFileSync(join(RAIZ, 'supabase/.temp/project-ref'), 'utf8').trim();
const ANON = readFileSync(join(RAIZ, 'scripts/seg2/d713-cron.mjs'), 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
const leer = (s, f) => execFileSync('security', ['find-generic-password', '-s', s, ...f], { encoding: 'utf8' });
const correo = leer('epetplace-cuenta-founder', []).split('\n').find((l) => l.includes('"acct"'))
  ?.replace(/.*<blob>="/, '').replace(/"$/, '');
const auth = await (await fetch(`https://${REF}.supabase.co/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' },
  body: JSON.stringify({ email: correo, password: leer('epetplace-cuenta-founder', ['-w']).trim() }) })).json();
if (!auth.access_token) { di('⚠️ NO CONCLUYENTE — no pude abrir sesión.'); process.exit(2); }

di(`¿EL REINTENTO RECUPERA? · ${CUATRO.length} frases × ${VUELTAS} vueltas · edge desplegada, expediente real`);
di('⚠️ El control de D es determinista y mide el CABLEADO. Esto mide si el modelo se recupera.\n');

const cuenta = new Map(CUATRO.map((f) => [f, { ok: 0, mal: 0 }]));
for (let v = 1; v <= VUELTAS; v += 1) {
  for (const f of CUATRO) {
    let estado = 'red';
    try {
      const r = await fetch(`https://${REF}.supabase.co/functions/v1/coach`, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: `Bearer ${auth.access_token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ mascotaId: THOR, texto: f }),
        signal: AbortSignal.timeout(120_000),
      });
      const j = await r.json();
      estado = r.ok && typeof j?.respuesta === 'string' && j.respuesta.length > 0 ? 'ok' : `${r.status} ${j?.codigo ?? ''}`;
    } catch (e) { estado = `red ${String(e).slice(0, 30)}`; }
    const c = cuenta.get(f);
    if (estado === 'ok') c.ok += 1; else c.mal += 1;
    di(`  ${estado === 'ok' ? '✅' : '🔴'} v${v} «${f.slice(0, 50)}» ${estado}`);
  }
}

di(`\n${'═'.repeat(70)}`);
let rojas = 0;
for (const [f, c] of cuenta) {
  const marca = c.mal === 0 ? '✅ recupera SIEMPRE' : c.ok === 0 ? '🔴 NUNCA recupera' : '🟡 a veces';
  if (c.mal > 0) rojas += 1;
  di(`  ${marca.padEnd(22)} ${c.ok}/${VUELTAS}  «${f}»`);
}
/* El sujeto es un modelo: se reporta frecuencia por caso, no un conteo. Pero
   `🔴 NUNCA` sobre N vueltas sí es del producto — un reintento que no recupera
   ninguna vez no es varianza. */
di(`\n${rojas === 0 ? '✅ el reintento recupera las cuatro' : `🔴 ${rojas} de ${CUATRO.length} siguen rompiendo`}`);
process.exit(rojas === 0 ? 0 : 1);
