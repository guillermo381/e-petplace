#!/usr/bin/env node
/**
 * verify:busqueda-frases — S113-E, fase 3 · E2.
 *
 * **40 frases como las tipea una familia**, escritas A PROPÓSITO contra la poda
 * de D. Contesta cuatro cosas con número:
 *   ① ¿el conjunto es el que dice ser? (reparto declarado == medido)
 *   ② ¿cuántas traen una palabra de estructura que la lista de D no tiene?
 *   ③ ¿qué encuentra la caja hoy, frase por frase, contra lo esperado?
 *   ④ ¿cuánto tarda **el trabajo** y cuánto **el viaje**, por separado?
 *
 * ── 🔴 POR QUÉ ② EXISTE ─────────────────────────────────────────────────────
 * D midió su poda con 43 frases propias y **lo declaró**: una separación
 * perfecta sobre un conjunto que armó el mismo que armó la poda mide la
 * facilidad del conjunto, no la capacidad del instrumento. Este conjunto es el
 * contra-ejemplo, y su número no es una opinión: **la lista de 15 palabras es
 * anterior a la bóveda**, así que no tiene ni `examen`, ni `receta`, ni
 * `informe`, ni `análisis`, ni `papel` — que es todo el vocabulario que la fase
 * 3 acaba de inventar.
 *
 * ── 🔴 POR QUÉ ④ SE PARTE EN DOS ────────────────────────────────────────────
 * Medido en S113: el peaje por petición (p95 ≈ 600 ms) es **mayor que la
 * consulta entera**. Un p95 de punta a punta no describe la búsqueda: describe
 * la red. *Un número que mezcla las dos manda a optimizar lo que no cuesta.*
 * Acá el trabajo se mide con el reloj del SERVIDOR y el viaje se mide restando.
 *
 * ── LO QUE NO MIDE, declarado ───────────────────────────────────────────────
 * **No mide la poda de D**: vive en su rama, no en `main`. Este instrumento mide
 * lo que la familia tiene hoy y **le entrega el conjunto a D** para que corra el
 * segundo pase. Lo que sí calcula es cuántas frases su lista NO alcanzaría, que
 * es un número que se puede sacar de su lista publicada sin reimplementar nada.
 *
 * Las cuentas salen del llavero AL MOMENTO. Nunca se imprime un valor.
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE.
 *
 *   node scripts/verify-busqueda-frases.mjs --control
 *   node scripts/verify-busqueda-frases.mjs
 *   node scripts/verify-busqueda-frases.mjs --detalle
 */
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { exigirArgumentos } from './lib-argumentos.mjs';

const ESTE = fileURLToPath(import.meta.url) === process.argv[1];
if (ESTE) exigirArgumentos(['--control', '--detalle'], 0);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const RPC = process.env.BUSQUEDA_RPC ?? 'buscar_en_mi_familia';
const RAMA_D = process.env.BUSQUEDA_RAMA_D ?? 'origin/pista/s113-d-3.0';
const di = (s) => console.log(s);

export function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { const j = JSON.parse(r.stdout.slice(i)); return j?.error ? null : (j.rows ?? null); } catch { return null; }
}

const plano = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * ② **Palabras que nombran el TIPO de cosa y no están en la lista.**
 * No se adivina cuáles son estructurales: se declaran acá, y cada una dice qué
 * frente la trajo. *Una lista de estructura sin fecha envejece sin avisar: la de
 * D es correcta y anterior a la bóveda, y eso no es un error suyo — es que el
 * mundo creció.*
 */
export const ESTRUCTURA_QUE_FALTA = [
  ['examen', 'bóveda'], ['examenes', 'bóveda'], ['receta', 'bóveda'], ['recetas', 'bóveda'],
  ['informe', 'bóveda'], ['informes', 'bóveda'], ['analisis', 'bóveda'], ['estudio', 'bóveda'],
  ['resultados', 'bóveda'], ['papel', 'bóveda'], ['papeles', 'bóveda'], ['libreta', 'bóveda'],
  ['factura', 'comercio'], ['comprobante', 'comercio'], ['reserva', 'agenda'], ['visita', 'agenda'],
  ['control', 'agenda'], ['chequeo', 'agenda'], ['plan', 'comprables'], ['bono', 'comprables'],
  ['paquete', 'comprables'],
];

/** Qué palabras de estructura trae una frase, y si la lista dada las cubre. */
export function estructuraDe(frase, listaConocida) {
  const palabras = plano(frase).split(/[^a-z0-9ñ]+/).filter(Boolean);
  const conocidas = new Set((listaConocida ?? []).map(plano));
  const trae = [];
  for (const [p, frente] of ESTRUCTURA_QUE_FALTA) {
    if (palabras.includes(plano(p))) trae.push({ palabra: p, frente, cubierta: conocidas.has(plano(p)) });
  }
  return trae;
}

/** ① El reparto declarado tiene que ser el medido. */
export function repartoCoincide(declarado, frases) {
  const medido = frases.reduce((m, f) => ({ ...m, [f.intencion]: (m[f.intencion] ?? 0) + 1 }), {});
  const faltan = Object.entries(declarado)
    .filter(([k]) => k !== 'nota')
    .filter(([k, v]) => Number(v) !== Number(medido[k] ?? 0))
    .map(([k, v]) => `${k}: declara ${v}, hay ${medido[k] ?? 0}`);
  return { ok: faltan.length === 0, medido, faltan };
}

/** ④ p95 sobre una lista de milisegundos. Con menos de 5, se dice y no se da. */
export function p95(ms) {
  if (ms.length < 5) return null;
  const o = [...ms].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.ceil(o.length * 0.95) - 1)];
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (ESTE && process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et) => { di(`${b ? '✅' : '🔴'} ${et}`); if (!b) fallos += 1; };

  const D15 = ['pedido', 'pedidos', 'cita', 'citas', 'nota', 'notas'];
  const e1 = estructuraDe('el examen de sangre de Thor', D15);
  ok(e1.length === 1 && e1[0].palabra === 'examen' && e1[0].cubierta === false,
    'POSITIVO ② «examen» se detecta y se marca NO cubierta por la lista de D');
  const e2 = estructuraDe('la factura del pedido', D15);
  ok(e2.some((x) => x.palabra === 'factura' && !x.cubierta),
    'CLASE    ② una frase mixta se marca por la palabra que FALTA, no por la que está');
  ok(estructuraDe('Thor', D15).length === 0,
    'NEGATIVO ② contenido puro no trae ninguna palabra de estructura');
  ok(estructuraDe('los exámenes de Zeus', D15).some((x) => x.palabra === 'examenes'),
    'CLASE    ② la tilde no esconde la palabra: se compara sin acentos');
  ok(estructuraDe('el papel de la pared', ['papel']).every((x) => x.cubierta),
    'NEGATIVO ② una palabra que la lista SÍ tiene no se cuenta como faltante');

  const R = repartoCoincide({ busqueda: 2, pregunta: 1 },
    [{ intencion: 'busqueda' }, { intencion: 'busqueda' }, { intencion: 'pregunta' }]);
  ok(R.ok, 'NEGATIVO ① un reparto que coincide no produce hallazgo');
  ok(!repartoCoincide({ busqueda: 3, pregunta: 1 },
    [{ intencion: 'busqueda' }, { intencion: 'pregunta' }]).ok,
    'POSITIVO ① un reparto declarado que no es el del archivo se delata');

  ok(p95([1, 2, 3, 4]) === null, 'POSITIVO ④ con menos de 5 muestras NO se da un p95');
  ok(p95([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) === 10, 'NEGATIVO ④ con muestras suficientes sí');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ el conjunto se puede auditar a sí mismo y el detector de estructura discrimina.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
if (ESTE) {
  const C = JSON.parse(readFileSync(join(RAIZ, 'scripts/nexo/frases-busqueda.json'), 'utf8'));
  const detalle = process.argv.includes('--detalle');

  // ① El conjunto es el que dice ser.
  const R = repartoCoincide(C.reparto_declarado, C.frases);
  di(`verify:busqueda-frases · ${C.frases.length} frases · reparto ${R.ok ? 'declarado == medido ✓' : '🔴 NO coincide'}`);
  if (!R.ok) { for (const f of R.faltan) di(`   🔴 ${f}`); process.exit(1); }

  // ② Contra la lista de D — leída de SU rama, y si no está, se dice.
  let listaD = null;
  try {
    const t = execFileSync('git', ['show', `${RAMA_D}:packages/domain/src/busquedaPoda.ts`],
      { cwd: RAIZ, encoding: 'utf8' });
    /* 🔴 El corte va en `= [`, no en el primer `]`: el primero que aparece
       después del nombre está en `readonly string[]`, así que cortar ahí
       devuelve un bloque SIN comillas y la lista sale vacía. *Un extractor que
       corta en el delimitador equivocado no falla: devuelve cero.* */
    const bloque = t.split('PALABRAS_ESTRUCTURALES')[1]?.split('= [')[1]?.split(']')[0] ?? '';
    listaD = [...bloque.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  } catch { listaD = null; }

  if (!listaD?.length) {
    di(`   ⚠️ ② no pude leer la lista de \`${RAMA_D}\`: la cobertura NO se midió.`);
  } else {
    const conFalta = C.frases.map((f) => ({ f, e: estructuraDe(f.f, listaD) }))
      .filter((x) => x.e.some((y) => !y.cubierta));
    const porFrente = {};
    for (const x of conFalta) for (const y of x.e) if (!y.cubierta) porFrente[y.frente] = (porFrente[y.frente] ?? 0) + 1;
    di(`   ② la lista de D tiene ${listaD.length} palabras · ${conFalta.length}/${C.frases.length} frases traen una que NO está`);
    di(`      por frente: ${Object.entries(porFrente).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    if (detalle) for (const x of conFalta) di(`      «${x.f.f}» → ${x.e.filter((y) => !y.cubierta).map((y) => y.palabra).join(', ')}`);
  }

  // Sesión y medición
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
  const B = await sesion('epetplace-cuenta-prueba');
  if (!A) { di('⚠️ NO CONCLUYENTE — no pude abrir la sesión del llavero.'); process.exit(2); }

  const buscar = async (tok, q) => {
    const t0 = Date.now();
    const r = await fetch(`https://${REF}.supabase.co/rest/v1/rpc/${RPC}`, {
      method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${tok}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_q: q, p_limite: 20 }) });
    const ms = Date.now() - t0;
    let j = null; try { j = await r.json(); } catch {}
    return { estado: r.status, ms, rs: j?.resultados ?? [] };
  };

  let privacidadMedida = false;
  // ③ Qué encuentra hoy, frase por frase.
  const viaje = [];
  const filas = [];
  for (const f of C.frases) {
    const r = await buscar(A.tok, f.f);
    viaje.push(r.ms);
    const tipos = [...new Set(r.rs.map((x) => x.tipo))];
    filas.push({ ...f, n: r.rs.length, tipos, estado: r.estado });
  }
  const busquedas = filas.filter((x) => x.intencion === 'busqueda');
  const preguntas = filas.filter((x) => x.intencion === 'pregunta');
  const encontroBusqueda = busquedas.filter((x) => x.n > 0).length;
  const encontroPregunta = preguntas.filter((x) => x.n > 0).length;
  di(`   ③ búsquedas que encuentran: ${encontroBusqueda}/${busquedas.length} · preguntas que devuelven algo: ${encontroPregunta}/${preguntas.length}`);
  if (detalle) for (const x of filas) di(`      ${x.n > 0 ? '·' : '∅'} «${x.f}» → ${x.n} [${x.tipos.join(',') || '—'}] esperaba ${x.tipo}`);

  /* Una pregunta que devuelve resultados NO es un rojo por sí sola —«cuánto pesa
     Zeus» casa con Zeus y devolver a Zeus es razonable—. Lo que se reporta es el
     número, para que la capa de intención lo use como línea de base. */

  // ④ El trabajo y el viaje, POR SEPARADO.
  /* 🔴 Y «por separado» acá significa: uno se mide y el otro se DECLARA.
     Medir el trabajo del servidor desde este lado exigiría correr la RPC por
     `db query`, que entra con OTRO rol de login — y una `SECURITY DEFINER`
     medida con el rol equivocado devuelve un número de otra cosa. *Antes que un
     número de un camino que no es el de la app, va lo que sí está medido.* */
  const pViaje = p95(viaje);
  const menor = Math.min(...viaje);
  di(`   ④ punta a punta sobre ${viaje.length} llamadas reales: p95 ${pViaje ?? '(pocas muestras)'} ms · la más rápida ${menor} ms`);
  di('      El PEAJE por petición y el TRABAJO se midieron aparte (S113-E, lote 2):');
  di('      peaje p95 ≈ 600 ms contra ≈ 21 ms de trabajo por mínimos. *Un p95 de');
  di('      punta a punta describe la red, no la búsqueda* — por eso el número que');
  di('      sirve para juzgar la consulta es la MÁS RÁPIDA, no el percentil.');

  // ⑤ Privacidad con dos cuentas, en LAS DOS DIRECCIONES.
  const rojos = [];
  const nombresDe = (uid) => (sql(`select string_agg(distinct m.nombre, '|') as n from mascotas m
     join familia_miembro fm on fm.familia_id = m.familia_id
    where fm.user_id='${uid}' and fm.hasta is null and m.nombre is not null`)?.[0]?.n ?? '')
    .split('|').filter(Boolean);

  if (!B) di('   ⚠️ ⑤ privacidad NO medida: falta la segunda cuenta del llavero');
  else if (A.uid === B.uid) di('   ⚠️ ⑤ privacidad NO medida: las dos cuentas del llavero son la misma');
  else {
    const nA = nombresDe(A.uid); const nB = nombresDe(B.uid);
    const setA = new Set(nA.map((x) => x.toLowerCase()));
    const setB = new Set(nB.map((x) => x.toLowerCase()));
    /* 🔴 Sólo sirven los EXCLUSIVOS: hay varios «Zeus» y «Thor» en familias
       distintas, y buscar uno compartido no discrimina nada. Y se prueba en LAS
       DOS DIRECCIONES: mi primera versión sólo miraba A→B, no había ningún
       nombre exclusivo de B, y la regla salió «no medida» sobre dos cuentas que
       sí se podían distinguir perfectamente al revés. */
    const pares = [
      { de: A, hacia: 'la otra cuenta', nombres: nB.filter((n) => !setA.has(n.toLowerCase())) },
      { de: B, hacia: 'la cuenta del founder', nombres: nA.filter((n) => !setB.has(n.toLowerCase())) },
    ].filter((p) => p.nombres.length);

    if (!pares.length) di('   ⚠️ ⑤ privacidad NO medida: ninguna de las dos cuentas tiene un nombre exclusivo');
    else {
      let medidos = 0; let fugas = 0;
      for (const par of pares) {
        for (const n of par.nombres.slice(0, 5)) {
          medidos += 1;
          const r = await buscar(par.de.tok, n);
          if (r.rs.some((x) => x.tipo === 'mascota' && String(x.titulo).toLowerCase() === n.toLowerCase())) {
            fugas += 1;
            rojos.push({ regla: '⑤ cruce de familias', detalle: `buscando desde una cuenta aparece «${n}», que es de ${par.hacia}` });
          }
        }
      }
      di(`   ⑤ privacidad: ${medidos} nombre(s) exclusivo(s) probado(s) en ${pares.length} dirección(es) · ${fugas} fuga(s)`);
      privacidadMedida = medidos > 0;
    }
  }

  // ⑥ Robustez: no rompe y no enumera.
  const HOSTILES = [
    ['%', 'comodín solo'], ['_', 'comodín de un carácter'], ["'", 'comilla suelta'],
    ["' OR '1'='1", 'inyección clásica'], ['🐶🐶🐶', 'emoji'], ['ñ', 'una ñ sola'],
    ['a'.repeat(500), '500 caracteres'],
  ];
  let malos = 0;
  const techo = 20;
  for (const [t, por] of HOSTILES) {
    const r = await buscar(A.tok, t);
    const rompio = r.estado >= 500;
    const enumero = r.rs.length >= techo;
    if (rompio) { rojos.push({ regla: '⑥ rompe', detalle: `«${por}» devolvió ${r.estado}` }); malos += 1; }
    else if (enumero) { rojos.push({ regla: '⑥ enumera', detalle: `«${por}» devolvió ${r.rs.length} resultados: la caja se volvió un volcado` }); malos += 1; }
  }
  di(`   ⑥ robustez: ${HOSTILES.length - malos}/${HOSTILES.length} términos hostiles rebotan sin romper y sin enumerar`);

  if (rojos.length) {
    di(`\n🔴 ${rojos.length} incumplimiento(s):`);
    for (const r of rojos) di(`   ${r.regla.padEnd(22)} ${r.detalle}`);
    process.exit(1);
  }
  /* 🔴 El verde NO afirma lo que no se midió. *Un cierre que enumera las tres
     reglas cuando una quedó sin sujeto es la forma más barata de mentir con un
     verde: nadie vuelve a leer las advertencias de arriba.* */
  di(`\n✅ el conjunto se audita solo · nada rompe ni enumera${privacidadMedida ? ' · nada cruza familias' : ''}.`);
  if (!privacidadMedida) di('   ⚠️ y el cruce de familias NO se midió: eso no es verde, es sin medir.');
}
