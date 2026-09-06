#!/usr/bin/env node
/**
 * verify:nexo-anticipa — S113-E, sublote 2.1 · E2.
 *
 * **Los seis rojos de la anticipación por raza y etapa.** Las reglas viven en
 * `scripts/nexo/anticipacion.json` con su ley; acá está el juez.
 *
 * ── CINCO SE DECIDEN EN EL MOTOR Y UNO EN EL TEXTO ──────────────────────────
 * memorial · opt-in · uno por (mascota, tema, etapa) · sin raza · ficha no
 * publicada se contestan **con una consulta**, sin llamar a ningún modelo.
 * *Cuanto más arriba se decide un rojo, menos depende de que el modelo se porte
 * bien.* El sexto es el único que exige leer prosa, y es el que define el producto.
 *
 * ── 🔴 EL SEXTO: «NUNCA THOR TIENE» ─────────────────────────────────────────
 * «Los Bulldog inglés **suelen tener** displasia» es una estadística de raza.
 * «Thor **tiene** displasia» es un **diagnóstico**. Es una palabra de diferencia y
 * cambia de qué habla el aviso: de la población al individuo. **No deja síntoma**
 * —se lee igual de útil— y la familia lo cree.
 * Por eso el juez mira **la frase que contiene el nombre**: si ahí hay un verbo de
 * afirmación y **ningún modalizador**, es rojo. *Buscar «tiene» a secas marcaría
 * en rojo la forma correcta, que también lo contiene.*
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (no hay motor de anticipación).
 *
 *   node scripts/verify-nexo-anticipa.mjs --control
 *   node scripts/verify-nexo-anticipa.mjs
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exigirArgumentos } from './lib-argumentos.mjs';

exigirArgumentos(['--control'], 0);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const REGLAS = JSON.parse(readFileSync(new URL('./nexo/anticipacion.json', import.meta.url), 'utf8'));
const TABLA = process.env.NEXO_TABLA ?? 'avisos_coach';
const TIPO = process.env.NEXO_TIPO_ANTICIPA ?? 'predisposicion';
const di = (s) => console.log(s);
const plano = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try {
    const j = JSON.parse(r.stdout.slice(i));
    if (j?.error) return null;
    return j.rows ?? null;
  } catch { return null; }
}

/**
 * 🔴 EL JUEZ DEL SEXTO. Mira **la frase donde aparece el nombre**, no el aviso entero:
 * un aviso puede decir «los bulldog suelen tener X» en una oración y nombrar a Thor
 * en otra, y eso está bien. Mezclarlas en un solo texto plano fabricaría rojos.
 */
export function afirmaSobreElIndividuo(texto, nombre, { afirma, modaliza }) {
  const t = plano(texto);
  const n = plano(nombre);
  if (!n || n.length < 2) return { rojo: false, nota: 'sin nombre con el que juzgar' };
  for (const frase of t.split(/[.;!?\n]/)) {
    if (!frase.includes(n)) continue;
    const hayAfirmacion = afirma.some((a) => frase.includes(plano(a)));
    if (!hayAfirmacion) continue;
    /* El modalizador es lo que convierte la afirmación en estadística. Si está en
       la MISMA frase, habla de la población y no del animal. */
    if (modaliza.some((m) => frase.includes(plano(m)))) continue;
    return { rojo: true, nota: `afirma sobre el individuo: «…${frase.trim().slice(0, 70)}…»` };
  }
  return { rojo: false, nota: 'no afirma sobre el individuo' };
}

/** Los cinco del motor, sobre las filas que el job produjo. */
export function juzgarMotor(avisos) {
  const rojos = [];
  const vistos = new Map();
  for (const a of avisos) {
    if (a.memorial) rojos.push({ regla: 'memorial', detalle: `aviso sobre una mascota que no está activa` });
    if (a.opt_in === false) rojos.push({ regla: 'opt_in', detalle: `aviso a una familia sin opt-in` });
    if (!a.raza) rojos.push({ regla: 'sin_raza', detalle: `aviso sobre una mascota sin raza declarada` });
    if (a.ficha_activa === false) rojos.push({ regla: 'ficha_no_activa', detalle: `apoyado en una ficha sin publicar` });
    const k = `${a.mascota_id}|${a.tema}|${a.etapa}`;
    vistos.set(k, (vistos.get(k) ?? 0) + 1);
  }
  for (const [k, n] of vistos) if (n > 1) {
    const [, tema, etapa] = k.split('|');
    rojos.push({ regla: 'uno_por_tema', detalle: `${n} avisos de «${tema}» en la etapa «${etapa}» a la misma mascota` });
  }
  return rojos;
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };
  const V = { afirma: REGLAS.afirma, modaliza: REGLAS.modaliza };
  const sano = { mascota_id: 'm1', tema: 'cadera', etapa: 'senior', memorial: false, opt_in: true, raza: 'Bulldog inglés', ficha_activa: true };

  // ── los cinco del motor
  ok(juzgarMotor([sano]).length === 0, 'NEGATIVO  un aviso bien formado no produce rojos');
  for (const [campo, valor, regla] of [['memorial', true, 'memorial'], ['opt_in', false, 'opt_in'],
                                       ['raza', null, 'sin_raza'], ['ficha_activa', false, 'ficha_no_activa']]) {
    ok(juzgarMotor([{ ...sano, [campo]: valor }]).some((r) => r.regla === regla),
      `POSITIVO  ${regla.padEnd(16)} sale ROJO y se lo nombra`);
  }
  ok(juzgarMotor([sano, sano]).some((r) => r.regla === 'uno_por_tema'),
    'POSITIVO  uno_por_tema     dos del mismo tema y etapa salen ROJO');
  ok(juzgarMotor([sano, { ...sano, etapa: 'adulto' }]).length === 0,
    'CLASE     el mismo tema en OTRA etapa no es repetición — el techo es por etapa');

  // ── 🔴 el sexto, y sus dos casos son la pieza entera
  const bueno = 'Thor entra a senior en marzo. Los Bulldog inglés suelen tener displasia de cadera: vale la pena hablarlo con tu vet.';
  const malo = 'Thor entra a senior en marzo y tiene displasia de cadera; conviene un estudio.';
  ok(!afirmaSobreElIndividuo(bueno, 'Thor', V).rojo,
    'NEGATIVO  la forma CORRECTA no sale roja, aunque contenga «tener»');
  ok(afirmaSobreElIndividuo(malo, 'Thor', V).rojo,
    'POSITIVO  «Thor tiene displasia» sale ROJO — una palabra de diferencia');
  ok(!afirmaSobreElIndividuo('Los bulldog pueden tener problemas de cadera. Te aviso por Thor.', 'Thor', V).rojo,
    'CLASE     la estadística en una frase y el nombre en otra NO es afirmación');
  ok(afirmaSobreElIndividuo('Thor sufre de problemas respiratorios.', 'Thor', V).rojo,
    'CLASE     el detector no depende de la palabra «tiene»: también caza «sufre de»');
  ok(!afirmaSobreElIndividuo('Thor tiene una cita el sábado.', 'Thor', V).rojo === false,
    'DECLARADO un «tiene» que no es clínico igual sale rojo: es PISO, y prefiere el falso rojo');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ los cinco del motor se nombran, y el sexto distingue la población del individuo.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const filas = sql(`select a.mascota_id::text as mascota_id, a.tipo, a.detalle,
                          coalesce(a.detalle->>'tema', a.tipo) as tema,
                          coalesce(a.detalle->>'etapa', '') as etapa,
                          m.nombre, m.raza,
                          (m.estado_vida <> 'activa') as memorial,
                          (f.avisos_nexo_desde is not null) as opt_in,
                          coalesce((select c.activo from razas_contenido c
                                    where c.raza_codigo = (select r.slug from cat_razas r where r.nombre = m.raza limit 1)
                                    limit 1), false) as ficha_activa
                   from ${TABLA} a
                   join mascotas m on m.id = a.mascota_id
                   join familia f on f.id = m.familia_id
                   where a.tipo = '${TIPO}'`);

if (filas === null) {
  di(`⚠️ NO CONCLUYENTE — no pude leer \`${TABLA}\` con la forma que este gate espera.`);
  di(`   Puede ser que el motor de anticipación todavía no exista, o que el tipo no se`);
  di(`   llame \`${TIPO}\` (se ajusta con NEXO_TIPO_ANTICIPA). Las seis reglas y su juez`);
  di('   quedan escritos y PROBADOS (--control). NO es verde.');
  process.exit(2);
}

di(`verify:nexo-anticipa · \`${TABLA}\` tipo \`${TIPO}\` · ${filas.length} aviso(s) de anticipación`);
if (!filas.length) {
  di('⚠️ NO CONCLUYENTE — el motor existe y no produjo ningún aviso de este tipo todavía.');
  di('   *Con cero filas las seis reglas pasan por vacío: eso dice «no hay avisos», no');
  di('   «los avisos están bien».*');
  process.exit(2);
}

const rojos = juzgarMotor(filas);
const V = { afirma: REGLAS.afirma, modaliza: REGLAS.modaliza };
for (const a of filas) {
  const texto = typeof a.detalle === 'string' ? a.detalle : JSON.stringify(a.detalle ?? '');
  const v = afirmaSobreElIndividuo(texto, a.nombre, V);
  if (v.rojo) rojos.push({ regla: 'no_afirma', detalle: v.nota });
}

if (rojos.length) {
  di(`\n🔴 ${rojos.length} incumplimiento(s):`);
  for (const r of rojos) di(`   ${r.regla.padEnd(18)} ${r.detalle}`);
  process.exit(1);
}
di('✅ las seis: memorial · opt-in · uno por tema y etapa · sin raza · ficha publicada · no afirma sobre el individuo.');
