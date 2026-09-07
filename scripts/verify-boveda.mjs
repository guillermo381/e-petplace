#!/usr/bin/env node
/**
 * verify:boveda — S113-E, fase 3 · los rojos de traer papeles de otra clínica.
 *
 * La bóveda es el arma de conquista: una familia que ya tiene expediente en
 * otro lado trae su historia con una foto. Eso la vuelve **la superficie donde
 * un error se ve exactamente igual que un acierto** — un valor de laboratorio
 * mal transcrito no falla, no avisa y se lee perfecto.
 *
 * ── LAS SEIS PREGUNTAS ──────────────────────────────────────────────────────
 *   ① ¿la procedencia se puede DECIR, o todo entra con el mismo sello?
 *   ② ¿la confirmación humana se EXIGE, o vive en la pantalla?
 *   ③ ¿sobrevive el `literal` — lo que deja comprobar la lectura?
 *   ④ ¿el bucket es privado y por mascota?
 *   ⑤ ¿hay permisos de escritura que sólo frena la AUSENCIA de una policy?
 *   ⑥ ¿el rango de referencia se parte dentro del motor o afuera?
 *
 * ── 🔴 ③ Y ⑥ SON UNA SOLA COSA, Y ES LA MÁS CARA ────────────────────────────
 * `extract-papel` devuelve `referencia` como UNA cadena impresa («0.5 - 1.6») y
 * produce `literal` **para que se pueda comprobar la lectura sin reabrir el
 * papel** — lo dice su propio prompt. Si la tabla guarda `ref_min`/`ref_max` por
 * separado, **alguien parte esa cadena**; y si además descarta el `literal`,
 * *el corte queda sin testigo*. Un rango partido al revés convierte un valor
 * normal en uno alarmante, y no hay contra qué cotejarlo.
 *
 * ── LO QUE ESTE GATE NO MIDE, declarado ─────────────────────────────────────
 * No juzga si el modelo transcribió BIEN — eso exige papeles reales y es otra
 * medición. Mide que **la casa esté construida para poder desmentirlo**.
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (no hay bóveda que mirar).
 *
 *   node scripts/verify-boveda.mjs --control
 *   node scripts/verify-boveda.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exigirArgumentos } from './lib-argumentos.mjs';

const ESTE = fileURLToPath(import.meta.url) === process.argv[1];
if (ESTE) exigirArgumentos(['--control'], 0);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PUERTA = process.env.BOVEDA_PUERTA ?? 'registrar_papel_de_familia';
const TABLA = process.env.BOVEDA_TABLA ?? 'papeles_familia';
const VALORES = process.env.BOVEDA_VALORES ?? 'papel_valor';
const BUCKET = process.env.BOVEDA_BUCKET ?? 'papeles-familia';
const di = (s) => console.log(s);

export function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { const j = JSON.parse(r.stdout.slice(i)); return j?.error ? null : (j.rows ?? null); } catch { return null; }
}

/**
 * ① Un vocabulario declara N valores; la puerta puede escribir M.
 * **Rojo cuando M < N**: un valor que nada puede escribir no distingue nada —
 * sólo lo parece, y las filas salen todas iguales sin que se note.
 */
export function valoresAlcanzables({ vocabulario, args, cuerpo, columna }) {
  const a = String(args ?? '').toLowerCase();
  const c = String(cuerpo ?? '').toLowerCase();
  /* Si la puerta recibe la columna como parámetro, puede escribir CUALQUIER
     valor del vocabulario: no hace falta buscarlos uno por uno. */
  const porParametro = new RegExp(`p_${columna}\\b`).test(a);
  if (porParametro) return { alcanzables: [...vocabulario], por: 'parámetro' };
  /* Si no, sólo alcanza los que aparezcan escritos como literal en el cuerpo. */
  const alcanzables = vocabulario.filter((v) => c.includes(`'${v.toLowerCase()}'`));
  return { alcanzables, por: 'literales en el cuerpo' };
}

/**
 * ② La misma pregunta que `verify:nexo-alimenta` ①, y por la misma razón:
 * **una garantía que sólo cumple la pantalla no es una garantía del producto.**
 * Un `SECURITY DEFINER` concedido a `authenticated` se llama desde PostgREST
 * con la clave que viaja en el bundle: la pantalla no es el único camino.
 */
export function exigeConfirmacion({ args, cuerpo }) {
  const a = String(args ?? '').toLowerCase();
  const c = String(cuerpo ?? '').toLowerCase();
  /* Los literales se borran ANTES de buscar: `'confirmado_de_ia'` es un valor
     que alguien pasa; una exigencia se apoya en un IDENTIFICADOR. */
  const sinLiterales = c.replace(/'[^']*'/g, "''");
  if (/(confirm|acepta|aprobad)\w*\s+boolean/.test(a)) return { exige: true, donde: 'un booleano en la firma' };
  if (/(if|when)[^;]{0,120}(confirm|acepta|aprobad)[^;]{0,200}raise/s.test(sinLiterales)
      || /raise[^;]{0,200}(sin_confirm|no_confirm|falta_confirm)/s.test(sinLiterales))
    return { exige: true, donde: 'un raise que depende de ella' };
  return { exige: false, donde: null, soloLaPalabra: /confirm|acepta|aprobad/.test(`${a} ${c}`) };
}

/** ③⑥ ¿la puerta guarda un campo que el extractor produce? */
export function camposQueSeCaen(produce, columnas, leidosPorLaPuerta) {
  const cols = new Set(columnas.map((x) => x.toLowerCase()));
  const leidos = new Set(leidosPorLaPuerta.map((x) => x.toLowerCase()));
  return produce.filter((f) => !cols.has(f.toLowerCase()) && !leidos.has(f.toLowerCase()));
}

/** ⑤ permisos de escritura que sólo frena la ausencia de una policy. */
export function escrituraSinPolicy(grants, policies) {
  const escribir = ['INSERT', 'UPDATE', 'DELETE'];
  const conPolicy = new Set(policies.map((p) => String(p).toUpperCase()));
  const abierta = conPolicy.has('ALL');
  return escribir.filter((c) => grants.includes(c) && !abierta && !conPolicy.has(c));
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (ESTE && process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et) => { di(`${b ? '✅' : '🔴'} ${et}`); if (!b) fallos += 1; };
  const VOC = ['tecleado', 'extraido_por_ia'];

  // ① — el positivo PRIMERO: el caso real de la puerta de hoy.
  const solo1 = valoresAlcanzables({ vocabulario: VOC, columna: 'modo_captura',
    args: 'p_mascota_id uuid, p_clase text', cuerpo: "insert into e (modo_captura) values ('extraido_por_ia')" });
  ok(solo1.alcanzables.length === 1 && solo1.alcanzables[0] === 'extraido_por_ia',
    'POSITIVO ① una puerta que sólo escribe un literal alcanza UN valor de dos');
  ok(valoresAlcanzables({ vocabulario: VOC, columna: 'modo_captura',
    args: 'p_mascota_id uuid, p_modo_captura text', cuerpo: 'insert ...' }).alcanzables.length === 2,
    'NEGATIVO ① si la columna es PARÁMETRO, el vocabulario entero es alcanzable');
  ok(valoresAlcanzables({ vocabulario: VOC, columna: 'modo_captura', args: '',
    cuerpo: "case when x then 'tecleado' else 'extraido_por_ia' end" }).alcanzables.length === 2,
    'CLASE    ① dos literales en el cuerpo también alcanzan los dos — no exige parámetro');

  // ②
  ok(!exigeConfirmacion({ args: 'p_mascota_id uuid', cuerpo: 'insert into t (confirmado_por) values (v_uid)' }).exige,
    'POSITIVO ② escribir `confirmado_por = v_uid` NO es exigir una confirmación');
  ok(exigeConfirmacion({ args: 'p_id uuid, p_confirmado boolean', cuerpo: '' }).exige,
    'NEGATIVO ② un booleano en la firma sí lo es');
  ok(!exigeConfirmacion({ args: 'p_f text', cuerpo: "if p_f not in ('confirmado_de_ia') then raise; end if;" }).exige,
    'CLASE    ② un VALOR DE ENUM llamado «confirmado» tampoco — la diferencia es la comilla');

  // ③⑥
  ok(camposQueSeCaen(['analito', 'valor', 'literal'], ['analito', 'valor', 'unidad'], []).includes('literal'),
    'POSITIVO ③ un campo que el extractor produce y la tabla no tiene, se nombra');
  ok(camposQueSeCaen(['analito', 'valor'], ['analito', 'valor', 'unidad'], []).length === 0,
    'NEGATIVO ③ si la tabla tiene todo lo que el extractor produce, no hay caída');
  ok(camposQueSeCaen(['literal'], [], ['literal']).length === 0,
    'CLASE    ③ un campo que la puerta LEE (aunque no sea columna) no se cuenta como caído');

  // ⑤
  ok(escrituraSinPolicy(['SELECT', 'INSERT', 'UPDATE'], ['SELECT']).join() === 'INSERT,UPDATE',
    'POSITIVO ⑤ INSERT/UPDATE concedidos con sólo una policy de SELECT se nombran');
  ok(escrituraSinPolicy(['SELECT'], ['SELECT']).length === 0,
    'NEGATIVO ⑤ conceder sólo SELECT no produce hallazgo');
  ok(escrituraSinPolicy(['SELECT', 'INSERT'], ['ALL']).length === 0,
    'CLASE    ⑤ una policy ALL cubre el INSERT: eso es una decisión, no un permiso huérfano');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ las seis preguntas producen su rojo y su verde antes de mirar la base.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
if (ESTE) {
  const f = sql(`select pg_get_function_identity_arguments(p.oid) as args,
                        pg_get_functiondef(p.oid) as cuerpo
                 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='${PUERTA}'`);
  if (!f?.length) {
    di(`⚠️ NO CONCLUYENTE — la puerta \`${PUERTA}\` no existe.`);
    di('   Las seis reglas y sus jueces quedan escritos y PROBADOS (--control).');
    process.exit(2);
  }

  di(`verify:boveda · puerta \`${PUERTA}\` · tablas \`${TABLA}\`/\`${VALORES}\` · bucket \`${BUCKET}\``);
  const rojos = [];
  const notas = [];

  // ① procedencia decible
  const voc = sql(`select pg_get_constraintdef(oid) as d from pg_constraint
                   where conrelid='${TABLA}'::regclass and contype='c'
                     and pg_get_constraintdef(oid) ilike '%modo_captura%'`);
  const declarados = [...String(voc?.[0]?.d ?? '').matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1]);
  if (declarados.length) {
    const al = valoresAlcanzables({ vocabulario: declarados, columna: 'modo_captura', ...f[0] });
    di(`   ① modo_captura: ${declarados.length} declarado(s) · ${al.alcanzables.length} alcanzable(s) por la puerta`);
    if (al.alcanzables.length < declarados.length) {
      const mudos = declarados.filter((v) => !al.alcanzables.includes(v));
      rojos.push({ regla: '① procedencia muda',
        detalle: `el vocabulario declara «${declarados.join('», «')}» y la puerta sólo puede escribir «${al.alcanzables.join('», «') || '(ninguno)'}»: «${mudos.join('», «')}» no tiene productor` });
    }
  } else notas.push('① no encontré un CHECK de `modo_captura`: la regla queda sin medir');

  // ② la confirmación
  const conf = exigeConfirmacion(f[0]);
  if (!conf.exige) {
    rojos.push({ regla: '② confirmación',
      detalle: 'la puerta ESCRIBE la confirmación pero no la EXIGE: quien la llame desde PostgREST produce un papel firmado que nadie confirmó' });
  } else di(`   ② la confirmación se exige (${conf.donde})`);

  // ③⑥ el literal y el rango
  const cols = sql(`select column_name from information_schema.columns
                    where table_schema='public' and table_name='${VALORES}'`)?.map((r) => r.column_name) ?? [];
  const leidos = [...String(f[0].cuerpo).matchAll(/->>\s*'([a-z_]+)'/g)].map((m) => m[1]);
  const caen = camposQueSeCaen(['analito', 'valor', 'unidad', 'literal'], cols, leidos);
  if (caen.includes('literal')) {
    rojos.push({ regla: '③ sin testigo',
      detalle: '`literal` —lo que el extractor produce PARA PODER COMPROBAR la lectura sin reabrir el papel— no tiene dónde guardarse' });
  }
  const parteAfuera = cols.includes('ref_min') && cols.includes('ref_max') && !leidos.includes('referencia');
  if (parteAfuera) {
    rojos.push({ regla: '⑥ rango partido afuera',
      detalle: 'el extractor devuelve `referencia` como UNA cadena impresa y la tabla guarda `ref_min`/`ref_max`: el corte lo hace el cliente, fuera del motor' });
  }

  // ④ el bucket
  const b = sql(`select public from storage.buckets where id='${BUCKET}'`);
  if (!b?.length) notas.push(`④ el bucket \`${BUCKET}\` no existe todavía`);
  else {
    if (b[0].public === true) rojos.push({ regla: '④ bucket público', detalle: `\`${BUCKET}\` es PÚBLICO: un examen se lee con su URL, sin sesión` });
    else di('   ④ el bucket es privado');
    if (!/foldername\s*\(\s*p_archivo_path\s*\)/.test(String(f[0].cuerpo))) {
      rojos.push({ regla: '④ carpeta libre', detalle: 'la puerta no verifica que el archivo esté en la carpeta de SU mascota' });
    } else di('   ④ la puerta exige que el archivo viva en la carpeta de su mascota');
  }

  // ⑤ permisos huérfanos
  for (const t of [TABLA, VALORES]) {
    const g = sql(`select distinct privilege_type as p from information_schema.role_table_grants
                   where table_schema='public' and table_name='${t}' and grantee='authenticated'`)?.map((r) => r.p) ?? [];
    const pol = sql(`select cmd from pg_policies where schemaname='public' and tablename='${t}'`)?.map((r) => r.cmd) ?? [];
    const huerfanos = escrituraSinPolicy(g, pol);
    if (huerfanos.length) {
      rojos.push({ regla: '⑤ permiso huérfano',
        detalle: `\`${t}\`: ${huerfanos.join('/')} concedido(s) a authenticated y ninguna policy los cubre — hoy los frena la AUSENCIA de policy, no la ausencia de permiso` });
    }
  }

  for (const n of notas) di(`   ⚠️ ${n}`);
  if (rojos.length) {
    di(`\n🔴 ${rojos.length} incumplimiento(s):`);
    for (const r of rojos) di(`   ${r.regla.padEnd(24)} ${r.detalle}`);
    process.exit(1);
  }
  di('✅ procedencia decible · confirmación exigida · literal con testigo · bucket privado por mascota · sin permisos huérfanos.');
}
