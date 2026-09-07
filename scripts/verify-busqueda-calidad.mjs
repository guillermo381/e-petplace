#!/usr/bin/env node
/**
 * verify:busqueda-calidad — S113-E, fase 3.
 *
 * `verify:busqueda-propia` ya mide **privacidad** (dos cuentas, cero cruce),
 * **tiempo** (p95) e **inyección**. Falta la tercera pata que la fase nombra:
 * **calidad** — y calidad no es «encontró»: es que **lo que promete se pueda
 * cumplir**.
 *
 * ── 🔴 ① LA RUTA ES UNA PROMESA QUE NADIE TIPEA ─────────────────────────────
 * La búsqueda arma su destino como una CADENA dentro de SQL
 * (`'/hogar/mascota/' || x.id`). Ni el typecheck, ni `gen:types`, ni el router
 * la ven. Cuando la fase 3 le sume papeles de la bóveda, alguien va a escribir
 * un prefijo nuevo ahí adentro, **y si se equivoca el resultado sale perfecto**:
 * el título correcto, el subtítulo correcto, y un toque que no lleva a ninguna
 * parte. *Un destino roto no se ve como un error: se ve como una app lenta.*
 *
 * ── ② UN RESULTADO INVENTADO ES UNO QUE NO RESUELVE ─────────────────────────
 * «La búsqueda nunca inventa un resultado» se mide preguntando si el id que
 * devuelve **existe y es alcanzable para esa cuenta**. Un id que no resuelve es
 * una fila que se ve igual que las demás.
 *
 * ── ③ RECALL, Y POR QUÉ NO ME ESCRIBO EL CORPUS ─────────────────────────────
 * Un corpus escrito a mano mide que la búsqueda encuentre **lo que yo le dije
 * que encontrara**. Acá lo esperado se DERIVA de la base con una regla
 * independiente de la búsqueda —«una mascota de mi familia cuyo nombre contiene
 * el término tiene que aparecer»— y recién después se le pregunta al sujeto.
 *
 * Las cuentas salen del llavero AL MOMENTO. Nunca se imprime un valor.
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE.
 *
 *   node scripts/verify-busqueda-calidad.mjs --control
 *   node scripts/verify-busqueda-calidad.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { exigirArgumentos } from './lib-argumentos.mjs';

const ESTE = fileURLToPath(import.meta.url) === process.argv[1];
if (ESTE) exigirArgumentos(['--control'], 0);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const RPC = process.env.BUSQUEDA_RPC ?? 'buscar_en_mi_familia';
const APP = process.env.BUSQUEDA_APP ?? 'apps/cliente/src/app';
const di = (s) => console.log(s);

export function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { const j = JSON.parse(r.stdout.slice(i)); return j?.error ? null : (j.rows ?? null); } catch { return null; }
}

/**
 * El árbol de rutas de una app de expo-router, leído de los ARCHIVOS.
 * Los grupos `(tabs)` no viajan en la URL; `index` es su directorio;
 * `[param]` y `[...resto]` son comodines.
 */
export function rutasDeLaApp(dir) {
  const salida = [];
  const caminar = (d, pre) => {
    for (const e of readdirSync(d)) {
      const full = join(d, e);
      if (statSync(full).isDirectory()) {
        // Un grupo `(x)` no aporta segmento a la URL.
        caminar(full, /^\(.*\)$/.test(e) ? pre : `${pre}/${e}`);
        continue;
      }
      if (!/\.tsx?$/.test(e)) continue;
      const base = e.replace(/\.[jt]sx?$/, '');
      if (base === '_layout' || base.startsWith('+')) continue;
      salida.push(base === 'index' ? (pre || '/') : `${pre}/${base}`);
    }
  };
  caminar(dir, '');
  return salida;
}

/** ¿Una ruta concreta cae en alguno de los patrones del árbol? */
export function rutaExiste(ruta, patrones) {
  const seg = ruta.split('/').filter(Boolean);
  return patrones.some((p) => {
    const ps = p.split('/').filter(Boolean);
    let i = 0;
    for (const t of ps) {
      if (/^\[\.\.\..*\]$/.test(t)) return true;      // catch-all: se come el resto
      if (i >= seg.length) return false;
      if (/^\[.*\]$/.test(t)) { i += 1; continue; }   // comodín: un segmento
      if (t !== seg[i]) return false;
      i += 1;
    }
    return i === seg.length;
  });
}

/**
 * Los prefijos que la función arma como cadena. **Candidatos, no veredicto**:
 * un censo por patrón acota, no cierra (L-437). Lo que cierra es el harvest de
 * rutas REALES; esto sirve para ver los tipos que hoy no devuelven nada.
 */
export function prefijosDeclarados(cuerpo) {
  return [...new Set([...String(cuerpo ?? '').matchAll(/'(\/[a-z0-9/_-]*)'\s*\|\|/gi)].map((m) => m[1]))];
}

/**
 * ⑤ **Un filtro por un valor que la columna no tiene.** No falla, no avisa: la
 * rama aporta cero filas a un `UNION ALL` y la búsqueda se ve completa.
 * Devuelve `{alias, columna, valor, tabla}` por cada comparación con un literal.
 * *Si un alias no se puede resolver a su tabla, se DEVUELVE sin tabla y el gate
 * lo declara sin medir — adivinar la tabla es cómo un censo empieza a mentir.*
 */
export function filtrosLiterales(cuerpo) {
  const c = String(cuerpo ?? '');
  const alias = new Map();
  for (const m of c.matchAll(/\b(?:from|join)\s+([a-z_][a-z0-9_]*)\s+([a-z][a-z0-9_]*)\b/gi)) {
    const [, tabla, al] = m;
    if (['on', 'where', 'as', 'select', 'using'].includes(al.toLowerCase())) continue;
    if (!alias.has(al)) alias.set(al, tabla);
  }
  const out = [];
  for (const m of c.matchAll(/\b([a-z][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\s*=\s*'([^']+)'/gi)) {
    const [, al, col, val] = m;
    out.push({ alias: al, columna: col, valor: val, tabla: alias.get(al) ?? null });
  }
  return out;
}

/**
 * ④ **El techo se aplicó antes de decidir a quién dejar entrar.** Cuando el
 * resultado llega JUSTO al techo y trae un solo tipo, las otras fuentes quedan
 * inalcanzables para ese término: no porque no casen, sino porque el corte se
 * hizo sin mirar de qué fuente venía cada fila.
 */
export function techoCiego(resultados, techo) {
  const tipos = new Set(resultados.map((r) => r.tipo));
  return { saturado: resultados.length >= techo, tipos: [...tipos],
           ciego: resultados.length >= techo && tipos.size === 1 };
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (ESTE && process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et) => { di(`${b ? '✅' : '🔴'} ${et}`); if (!b) fallos += 1; };
  const P = ['/hogar/mascota/[mascotaId]', '/citas/[mascotaId]', '/pedidos/pedido/[pedidoId]', '/', '/nexo'];

  // POSITIVO primero: la ruta que no existe se delata.
  ok(!rutaExiste('/boveda/papel/abc', P), 'POSITIVO una ruta que el árbol no tiene se delata');
  ok(rutaExiste('/hogar/mascota/abc-123', P), 'NEGATIVO una ruta real cae en su patrón');
  ok(!rutaExiste('/hogar/mascota/abc/extra', P), 'CLASE    un segmento de MÁS no cuela: el comodín come uno, no el resto');
  ok(!rutaExiste('/hogar/mascota', P), 'CLASE    un segmento de MENOS tampoco');
  ok(rutaExiste('/nexo', P), 'CLASE    una ruta sin parámetro también se reconoce');
  ok(rutaExiste('/x/y/z', ['/x/[...resto]']), 'CLASE    un catch-all sí se come el resto');

  ok(prefijosDeclarados("'/hogar/mascota/' || x.id, '/citas/' || y.id").length === 2,
    'POSITIVO los prefijos armados como cadena se extraen');
  ok(prefijosDeclarados('nada que ver').length === 0, 'NEGATIVO un cuerpo sin rutas no inventa prefijos');

  const F = filtrosLiterales("from productos pd where pd.estado = 'publicado' and x");
  ok(F.length === 1 && F[0].tabla === 'productos' && F[0].valor === 'publicado',
    'POSITIVO ⑤ un filtro por literal se extrae con su tabla resuelta');
  ok(filtrosLiterales("where zz.estado = 'x'")[0].tabla === null,
    'CLASE    ⑤ un alias que no se puede resolver vuelve SIN tabla — no se adivina');
  ok(filtrosLiterales('from productos pd where pd.estado = v_estado').length === 0,
    'NEGATIVO ⑤ comparar contra una variable no es un filtro por literal');

  const R50 = Array.from({ length: 50 }, () => ({ tipo: 'cita' }));
  ok(techoCiego(R50, 50).ciego, 'POSITIVO ④ 50 de 50 y un solo tipo: el techo cortó antes de priorizar');
  ok(!techoCiego([{ tipo: 'cita' }, { tipo: 'prestador' }], 50).ciego,
    'NEGATIVO ④ un resultado que no llega al techo no acusa nada');
  ok(!techoCiego(R50.map((r, i) => (i ? r : { tipo: 'prestador' })), 50).ciego,
    'CLASE    ④ saturado pero con dos tipos tampoco: lo que delata es el tipo ÚNICO');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ el árbol de rutas discrimina, y en los dos sentidos.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
if (ESTE) {
  const f = sql(`select pg_get_functiondef(p.oid) as d from pg_proc p
                 join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='${RPC}'`);
  if (!f?.length) { di(`⚠️ NO CONCLUYENTE — la RPC \`${RPC}\` no existe.`); process.exit(2); }

  const patrones = rutasDeLaApp(join(RAIZ, APP));
  if (patrones.length < 10) { di(`⚠️ NO CONCLUYENTE — leí ${patrones.length} rutas en \`${APP}\`: eso no es el árbol.`); process.exit(2); }

  const REF = readFileSync(join(RAIZ, 'supabase/.temp/project-ref'), 'utf8').trim();
  const ANON = readFileSync(join(RAIZ, 'scripts/seg2/d713-cron.mjs'), 'utf8')
    .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
  const leer = (s, fl) => execFileSync('security', ['find-generic-password', '-s', s, ...fl], { encoding: 'utf8' });
  async function sesion(servicio) {
    try {
      const correo = leer(servicio, []).split('\n').find((l) => l.includes('"acct"'))?.replace(/.*<blob>="/, '').replace(/"$/, '');
      const clave = leer(servicio, ['-w']).trim();
      const j = await (await fetch(`https://${REF}.supabase.co/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' },
        body: JSON.stringify({ email: correo, password: clave }) })).json();
      return j.access_token ? { tok: j.access_token, uid: j.user.id } : null;
    } catch { return null; }
  }
  const A = await sesion('epetplace-cuenta-founder');
  if (!A) { di('⚠️ NO CONCLUYENTE — no pude abrir la sesión del llavero.'); process.exit(2); }
  const buscar = async (q, limite = 50) => {
    const r = await fetch(`https://${REF}.supabase.co/rest/v1/rpc/${RPC}`, {
      method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${A.tok}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_q: q, p_limite: limite }) });
    try { return (await r.json())?.resultados ?? []; } catch { return []; }
  };

  di(`verify:busqueda-calidad · \`${RPC}\` · ${patrones.length} rutas leídas de \`${APP}\``);
  const rojos = [];

  /* ① Se cosechan rutas REALES con términos anchos, para que salga más de un
     tipo. Lo que no aparezca queda declarado como no medido, no como bueno. */
  const cosecha = new Map();
  const cosechaCruda = [];
  /* Términos anchos y REALES: nada de palabras vacías —«a», «de», «el» los come
     el diccionario español y devuelven cero, que no es lo mismo que «no hay». */
  for (const q of ['thor', 'zeus', 'consulta', 'paseo', 'pedido', 'nota', 'alimento',
                   'clinica', 'perro', 'gato', 'vacuna', 'bano']) {
    for (const r of await buscar(q)) { cosechaCruda.push(r); if (!cosecha.has(r.ruta)) cosecha.set(r.ruta, r.tipo); }
  }
  const tipos = new Set([...cosecha.values()]);
  di(`   ① ${cosecha.size} ruta(s) distinta(s) devuelta(s) de verdad · tipos: ${[...tipos].join(', ') || '(ninguno)'}`);
  for (const [ruta, tipo] of cosecha) {
    if (!rutaExiste(ruta, patrones)) {
      rojos.push({ regla: '① destino roto', detalle: `un resultado de tipo «${tipo}» apunta a \`${ruta}\`, que no existe en el árbol de rutas` });
    }
  }

  /* Los prefijos que el cuerpo declara y que NINGÚN término hizo aparecer: no
     son un rojo — son lo que este gate NO alcanzó a probar, y se dice. */
  const vistos = new Set([...cosecha.keys()].map((r) => r.replace(/[^/]*$/, '')));
  const mudos = prefijosDeclarados(f[0].d).filter((p) => ![...vistos].some((v) => v.startsWith(p)));
  if (mudos.length) di(`   ⚠️ ${mudos.length} prefijo(s) declarado(s) sin ningún resultado en esta corrida: ${mudos.join(' ')} — NO medidos`);

  /* ② Cada mascota devuelta tiene que resolver contra la base para esa cuenta. */
  /* 🔴 Se reusa LA COSECHA, no una búsqueda nueva. Mi primera versión volvía a
     preguntar con «a» y «e» — que son palabras vacías del diccionario español y
     devuelven cero: la regla decía «no se midió» sobre una cuenta que sí tiene
     mascotas. *Un corpus mal elegido no da rojo: da «no medido», y eso se lee
     como que no había nada que medir.* */
  const ids = [...new Set([...cosechaCruda].filter((r) => r.tipo === 'mascota').map((r) => r.id))];
  if (ids.length) {
    const vivas = sql(`select count(*) as n from mascotas m
       join familia_miembro fm on fm.familia_id = m.familia_id
      where fm.user_id='${A.uid}' and fm.hasta is null
        and m.id in ('${ids.join("','")}')`)?.[0]?.n ?? 0;
    di(`   ② ${ids.length} mascota(s) devuelta(s) · ${vivas} resuelven en la familia de quien preguntó`);
    if (Number(vivas) !== ids.length) {
      rojos.push({ regla: '② resultado que no resuelve', detalle: `${ids.length - Number(vivas)} id(s) devuelto(s) que no son de una familia de quien preguntó` });
    }
  } else di('   ⚠️ ② ninguna mascota devuelta: la regla no se midió');

  /* ③ Recall derivado de la base, no de un corpus escrito a mano. */
  const esperadas = sql(`select m.nombre from mascotas m
     join familia_miembro fm on fm.familia_id = m.familia_id
    where fm.user_id='${A.uid}' and fm.hasta is null and m.nombre is not null
      and length(m.nombre) >= 3 limit 8`)?.map((r) => r.nombre) ?? [];
  let hallada = 0;
  for (const n of esperadas) {
    const rs = await buscar(n);
    if (rs.some((r) => r.tipo === 'mascota' && String(r.titulo).toLowerCase() === n.toLowerCase())) hallada += 1;
    else rojos.push({ regla: '③ no encuentra lo suyo', detalle: `buscar «${n}» no devuelve a «${n}», que es de esta familia` });
  }
  if (esperadas.length) di(`   ③ recall sobre nombres propios: ${hallada}/${esperadas.length}`);
  else di('   ⚠️ ③ esta cuenta no tiene mascotas con nombre: el recall no se midió');

  /* ⑤ Filtros por un valor que la columna no tiene. */
  for (const fl of filtrosLiterales(f[0].d)) {
    if (!fl.tabla) { di(`   ⚠️ ⑤ no pude resolver el alias \`${fl.alias}\`: ese filtro NO se midió`); continue; }
    const hay = sql(`select count(*) as n from ${fl.tabla} where ${fl.columna} = '${fl.valor}'`)?.[0]?.n;
    if (hay === undefined || hay === null) { di(`   ⚠️ ⑤ no pude contar \`${fl.tabla}.${fl.columna}\`: sin medir`); continue; }
    if (Number(hay) === 0) {
      const tot = sql(`select count(*) as n from ${fl.tabla}`)?.[0]?.n ?? '?';
      const otros = sql(`select string_agg(distinct ${fl.columna}, ', ') as v from ${fl.tabla}`)?.[0]?.v ?? '?';
      rojos.push({ regla: '⑤ filtro muerto',
        detalle: `\`${fl.tabla}.${fl.columna} = '${fl.valor}'\` no casa con NINGUNA de las ${tot} filas (los valores que hay: ${otros}) — esa rama no puede devolver nada` });
    }
  }

  /* ④ El techo cortando antes de priorizar. */
  const TECHO = 50;
  for (const q of ['clinica', 'paseo', 'consulta']) {
    const rs = await buscar(q, TECHO);
    const t = techoCiego(rs, TECHO);
    if (t.ciego) {
      rojos.push({ regla: '④ techo ciego',
        detalle: `«${q}» devuelve ${rs.length}/${TECHO} y TODOS son «${t.tipos[0]}»: para ese término las otras fuentes son inalcanzables — el corte se hizo por relevancia, sin mirar de qué fuente venía cada fila` });
    }
  }

  if (rojos.length) {
    di(`\n🔴 ${rojos.length} incumplimiento(s):`);
    for (const r of rojos) di(`   ${r.regla.padEnd(26)} ${r.detalle}`);
    process.exit(1);
  }
  di('\n✅ todo destino existe · todo resultado resuelve · encuentra lo propio.');
}
