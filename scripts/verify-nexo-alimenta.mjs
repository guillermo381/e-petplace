#!/usr/bin/env node
/**
 * verify:nexo-alimenta — S113-E, sublote 2.1 · E3.
 *
 * **Los tres rojos de alimentar el expediente desde el chat:**
 *   ① nada se guarda sin el sí de la familia
 *   ② un hecho de clase `medico` nunca entra CONFIRMADO
 *   ③ el texto de un menor no se guarda
 *
 * ── 🔴 ① SE MIDE EN LA PUERTA, NO EN LA PANTALLA ────────────────────────────
 * La pregunta no es «¿la Hoja pide confirmación?» —eso lo hace hoy y está bien—
 * sino **«¿puede alguien guardar sin ella?»**. Si la RPC no exige un acto de
 * confirmación, *la garantía vive en la pantalla y cualquier otro camino la saltea*:
 * un wrapper nuevo, una pantalla nueva, un bug de doble toque. **Una promesa que
 * sólo cumple la UI no es una promesa del producto.**
 *
 * ── ② NO ES SOBRE LA CLASE: ES SOBRE LA PROCEDENCIA ─────────────────────────
 * Un hecho médico contado por la familia **es un dato válido y hay que guardarlo**
 * — la casa ya tiene su nivel para eso (`declarado_por_familia`). Lo que no puede
 * pasar es que entre como **verificado**: *«el vet dijo que es epilepsia» es la
 * familia citando a un vet, no un vet firmando.*
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (no hay puerta que mirar).
 *
 *   node scripts/verify-nexo-alimenta.mjs --control
 *   node scripts/verify-nexo-alimenta.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exigirArgumentos } from './lib-argumentos.mjs';

exigirArgumentos(['--control'], 0);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PUERTA = process.env.NEXO_PUERTA ?? 'agregar_memoria_coach';
const TABLA = process.env.NEXO_MEMORIA ?? 'coach_memoria';
const di = (s) => console.log(s);
const plano = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { const j = JSON.parse(r.stdout.slice(i)); return j?.error ? null : (j.rows ?? null); } catch { return null; }
}

/** ① ¿la puerta EXIGE la confirmación, o la garantía vive afuera? */
export function exigeConfirmacion({ args, cuerpo }) {
  const a = plano(args), c = plano(cuerpo);
  /* 🔴 BUSCAR LA PALABRA DABA VERDE SOBRE UN ENUM. La puerta real tiene
     `if p_fuente not in ('familia', 'confirmado_de_ia')` — eso es un **vocabulario**,
     no una exigencia, y mi detector lo leyó como que la función pedía confirmación.
     *Un juez que busca una palabra mide la PRESENCIA, no el ACTO* — tercera vez que
     me muerde en dos días, y por eso ahora se busca la EXIGENCIA:
       · un parámetro booleano de confirmación en la firma, o
       · un `raise` que dependa de ella en el cuerpo.
     Un valor de enum que se LLAMA «confirmado» no cuenta: **el nombre afirma un
     acto que la función no presenció.** */
  /* 🔴 LA DIFERENCIA ES LA COMILLA, y mi primera cura no la vio.
     `'confirmado_de_ia'` es un **literal**: un valor que alguien pasa. Una exigencia
     real se apoya en un **identificador** —una variable o un parámetro— sin comillas.
     Se borran los literales ANTES de buscar, y recién ahí la pregunta discrimina. */
  const sinLiterales = c.replace(/'[^']*'/g, "''");
  const enFirma = /(confirm|acepta|aprobad)\w*\s+boolean/.test(a);
  const exigeEnCuerpo = /(if|when)[^;]{0,120}(confirm|acepta|aprobad)[^;]{0,200}raise/s.test(sinLiterales)
    || /raise[^;]{0,200}(sin_confirm|no_confirm|falta_confirm)/s.test(sinLiterales);
  if (enFirma) return { exige: true, donde: 'un booleano en la firma' };
  if (exigeEnCuerpo) return { exige: true, donde: 'un raise que depende de ella' };
  /* Se distingue «no la exige» de «tiene la palabra suelta»: el segundo es peor,
     porque se lee como que sí. */
  const soloLaPalabra = /confirm|acepta|aprobad/.test(`${a} ${c}`);
  return { exige: false, donde: null, soloLaPalabra };
}

/** ② marcas de que un hecho entró como verificado y no como dicho por la familia. */
export const CONFIRMADO = ['verificado', 'confirmado', 'validado', 'por_prestador', 'clinico'];
export function entraConfirmado(fuente) {
  const f = plano(fuente);
  return CONFIRMADO.some((m) => f.includes(plano(m)));
}

/** ③ marcas de que el texto guardado trae a un menor. PISO declarado. */
export const MENOR = ['mi hijo', 'mi hija', 'mi nieto', 'mi nieta', 'años de edad', 'el niño', 'la niña', 'mis hijos'];
export function hablaDeMenor(hecho) {
  const h = plano(hecho);
  return MENOR.filter((m) => h.includes(plano(m)));
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };

  ok(exigeConfirmacion({ args: 'p_mascota_id uuid, p_hecho text, p_confirmado boolean', cuerpo: '' }).exige,
    'POSITIVO  ① una firma con confirmación se reconoce');
  ok(!exigeConfirmacion({ args: 'p_mascota_id uuid, p_hecho text, p_fuente text', cuerpo: 'insert into ...' }).exige,
    'NEGATIVO  ① una firma SIN confirmación no se da por buena');
  ok(exigeConfirmacion({ args: 'p_id uuid', cuerpo: "if not v_confirmado then raise exception 'sin_confirmar'; end if;" }).exige,
    'CLASE     ① la confirmación vale igual si vive en el CUERPO, no sólo en la firma');
  /* 🔴 EL CASO REAL DE LA PUERTA, que me daba verde antes de curarlo. */
  const enumSolo = exigeConfirmacion({ args: 'p_mascota_id uuid, p_hecho text, p_fuente text',
    cuerpo: "if p_fuente not in ('familia', 'confirmado_de_ia') then raise exception 'fuente_invalida'; end if;" });
  ok(!enumSolo.exige && enumSolo.soloLaPalabra,
    'POSITIVO  ① un VALOR DE ENUM llamado «confirmado_de_ia» NO es una exigencia — y se dice');

  ok(entraConfirmado('verificado_por_prestador'), 'POSITIVO  ② «verificado» sale ROJO');
  ok(!entraConfirmado('declarado_por_familia'), 'NEGATIVO  ② lo dicho por la familia es la forma CORRECTA, no un rojo');
  ok(!entraConfirmado('chat'), 'CLASE     ② una fuente neutra tampoco es «confirmada»');

  ok(hablaDeMenor('Mi hijo de 7 años lo saca a pasear').length > 0, 'POSITIVO  ③ un menor en el texto sale ROJO');
  ok(hablaDeMenor('Le encanta jugar en el patio').length === 0, 'NEGATIVO  ③ un hecho del animal no produce falso rojo');
  ok(hablaDeMenor('Es muy apegado a mi hija').length > 0,
    'DECLARADO ③ «apegado a mi hija» TAMBIÉN sale rojo: es PISO y prefiere el falso rojo a la fuga');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ los tres: la puerta, la procedencia y el menor.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const f = sql(`select pg_get_function_identity_arguments(p.oid) as args,
                      pg_get_functiondef(p.oid) as cuerpo
               from pg_proc p join pg_namespace n on n.oid=p.pronamespace
               where n.nspname='public' and p.proname='${PUERTA}'`);
if (!f?.length) {
  di(`⚠️ NO CONCLUYENTE — la puerta \`${PUERTA}\` no existe.`);
  di('   Las tres reglas y su juez quedan escritos y PROBADOS (--control).');
  process.exit(2);
}

di(`verify:nexo-alimenta · puerta \`${PUERTA}\` · tabla \`${TABLA}\``);
const rojos = [];

// ① la puerta
const conf = exigeConfirmacion(f[0]);
if (!conf.exige) {
  rojos.push({ regla: '① sin sí', detalle: conf.soloLaPalabra
    ? 'la puerta NOMBRA la confirmación (un valor de fuente) pero no la EXIGE: cualquiera puede escribir ese valor sin que nadie haya confirmado'
    : 'la puerta NO exige confirmación — la garantía vive en la pantalla' });
} else di(`   ① la puerta exige confirmación (${conf.donde})`);

// ②③ sobre lo que YA se guardó
const filas = sql(`select hecho, fuente from ${TABLA} where activo`);
if (filas === null) {
  di(`⚠️ no pude leer \`${TABLA}\`: ②③ quedan sin medir.`);
} else {
  di(`   ${filas.length} hecho(s) guardado(s)`);
  for (const x of filas) {
    if (entraConfirmado(x.fuente)) rojos.push({ regla: '② confirmado', detalle: `fuente «${x.fuente}»` });
    const m = hablaDeMenor(x.hecho);
    /* No se imprime el hecho: puede traer el nombre de un menor, que es justo lo
       que esta regla existe para que no circule. Se nombra la marca, no el texto. */
    if (m.length) rojos.push({ regla: '③ menor', detalle: `un hecho guardado contiene «${m[0]}»` });
  }
  if (!filas.length) di('   ⚠️ con CERO hechos guardados, ②③ pasan por vacío: eso dice «no hay», no «está bien».');
}

if (rojos.length) {
  di(`\n🔴 ${rojos.length} incumplimiento(s):`);
  for (const r of rojos) di(`   ${r.regla.padEnd(16)} ${r.detalle}`);
  process.exit(1);
}
di('✅ los tres: nada sin sí · ningún hecho médico confirmado · ningún menor en lo guardado.');
