#!/usr/bin/env node
/**
 * verify:nexo-antispam — S113-E, lote 2.1 · E5.
 *
 * **Nexo avisa poco o no avisa.** Cuatro reglas, y ninguna es de gusto:
 *   ① como máximo **un aviso por tipo, por mascota, por día**.
 *   ② **cero en memorial** — LOYALTY §8.1: el silencio es parte del respeto.
 *   ③ **cero sin opt-in**.
 *   ④ **el job NO manda push**: escribe la fila y prende los arcos del orbe.
 *
 * ── ④ ES LA QUE SE MIDE LEYENDO, Y ES LA MÁS FÁCIL DE ROMPER SIN QUERER ─────
 * Un aviso que además vibra el teléfono a las 7 de la mañana no es el mismo
 * producto. La casa ya tiene un despachador de push y **está a un import de
 * distancia**: la regla no se rompe por una decisión, se rompe por una línea
 * cómoda. Por eso ④ se mide sobre la FUENTE del job, no sobre su salida —
 * *cuando se mide en la salida, ya sonó en el teléfono de alguien.*
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (el job no existe).
 *
 *   node scripts/verify-nexo-antispam.mjs --control
 *   node scripts/verify-nexo-antispam.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const JOB = process.env.NEXO_JOB ?? 'supabase/functions/nexo-avisos';
const di = (s) => console.log(s);

/** ④ Señales de que el job despacha push. Nombres de la casa, no inventados. */
export const SEÑALES_PUSH = [
  'despachar-push', 'despachar_push', 'notificacion_intencion', 'push_tokens',
  'expo.dev/--/api/v2/push', 'fcm.googleapis.com',
];

/** ④ — sobre la FUENTE. Devuelve las señales encontradas, con su archivo. */
export function buscaPush(dir) {
  if (!existsSync(dir)) return { existe: false, motivo: `no existe \`${dir}\`` };
  const hallazgos = [];
  const rec = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { rec(p); continue; }
      if (!/\.(ts|js|sql|mjs)$/.test(e.name)) continue;
      const src = readFileSync(p, 'utf8');
      for (const s of SEÑALES_PUSH) if (src.includes(s)) hallazgos.push({ archivo: p, señal: s });
    }
  };
  rec(dir);
  return { existe: true, hallazgos };
}

/**
 * ①②③ — el juez sobre los avisos que el job produjo.
 * `avisos`: [{ mascota_id, tipo, dia, memorial, opt_in }]
 */
export function juzgarAvisos(avisos) {
  const rojos = [];
  const vistos = new Map();
  for (const a of avisos) {
    if (a.memorial) rojos.push({ regla: '② memorial', detalle: `${a.tipo} sobre una mascota en memorial` });
    if (a.opt_in === false) rojos.push({ regla: '③ opt-in', detalle: `${a.tipo} sin opt-in` });
    const k = `${a.mascota_id}|${a.tipo}|${a.dia}`;
    vistos.set(k, (vistos.get(k) ?? 0) + 1);
  }
  for (const [k, n] of vistos) if (n > 1) {
    const [, tipo, dia] = k.split('|');
    rojos.push({ regla: '① uno por día', detalle: `${n} avisos de «${tipo}» el ${dia} a la misma mascota` });
  }
  return rojos;
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };
  const base = { mascota_id: 'm1', dia: '2026-09-05', memorial: false, opt_in: true };

  ok(juzgarAvisos([base]).length === 0 && juzgarAvisos([{ ...base, tipo: 'vacuna' }, { ...base, tipo: 'cita' }]).length === 0,
    'NEGATIVO  un aviso, y dos de tipos distintos el mismo día, no son spam');
  ok(juzgarAvisos([{ ...base, tipo: 'vacuna' }, { ...base, tipo: 'vacuna' }]).some((r) => r.regla.startsWith('①')),
    'POSITIVO  dos del MISMO tipo el mismo día salen ROJO');
  ok(juzgarAvisos([{ ...base, tipo: 'vacuna' }, { ...base, tipo: 'vacuna', dia: '2026-09-06' }]).length === 0,
    'CLASE     el mismo tipo en días distintos NO es spam — el techo es por día');
  ok(juzgarAvisos([{ ...base, tipo: 'vacuna', memorial: true }]).some((r) => r.regla.startsWith('②')),
    'POSITIVO  un aviso en memorial sale ROJO');
  ok(juzgarAvisos([{ ...base, tipo: 'vacuna', opt_in: false }]).some((r) => r.regla.startsWith('③')),
    'POSITIVO  un aviso sin opt-in sale ROJO');
  ok(juzgarAvisos([{ ...base, tipo: 'v', mascota_id: 'm1' }, { ...base, tipo: 'v', mascota_id: 'm2' }]).length === 0,
    'CLASE     el mismo tipo a DOS mascotas el mismo día no es spam — el techo es por mascota');

  // ④ el positivo tiene que ser sobre la casa real: un despachador vivo lleva las señales.
  const vivo = buscaPush('supabase/functions/despachar-push');
  ok(vivo.existe && vivo.hallazgos.length > 0,
    'POSITIVO  el detector encuentra push donde SÍ lo hay (despachar-push)', `(${vivo.hallazgos.length} señal(es))`);
  const limpio = buscaPush('supabase/functions/lugares');
  ok(limpio.existe && limpio.hallazgos.length === 0,
    'NEGATIVO  una edge que no manda push no produce hallazgo (lugares)');
  ok(!buscaPush('supabase/functions/no_existe_s113e').existe, 'POSITIVO  sin job el gate NO puede dar verde');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ caza las cuatro y no acusa a quien se porta bien.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const r = buscaPush(JOB);
if (!r.existe) {
  di(`⚠️ NO CONCLUYENTE — ${r.motivo}.`);
  di('   El job de avisos de Nexo todavía no existe. Las cuatro reglas y su juez');
  di('   quedan escritos y probados (--control). NO es verde: «no hace spam» y');
  di('   «no hay job» son distintos.');
  process.exit(2);
}
di(`verify:nexo-antispam · ${JOB}`);
if (r.hallazgos.length) {
  di(`\n🔴 ④ el job de avisos toca el camino del push:`);
  for (const h of r.hallazgos) di(`   ${h.archivo}  →  ${h.señal}`);
  di('   Un aviso de Nexo prende un arco y escribe una fila. No vibra un teléfono.');
  process.exit(1);
}
di('✅ ④ el job no toca el camino del push. ①②③ exigen correr el job — ver el parte.');
process.exit(0);
