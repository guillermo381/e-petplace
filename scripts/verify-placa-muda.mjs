#!/usr/bin/env node
/**
 * verify:placa-muda — S113-E, fase 3 · **un código sin activar no dice nada de nadie.**
 *
 * ── POR QUÉ ESTO NECESITA UN GATE ───────────────────────────────────────────
 * Hoy la propiedad se cumple, y se cumple por una razón frágil: `leer_pasaporte`
 * devuelve `NULL` en los tres casos y **ninguna rama explica cuál fue**. Eso es
 * exactamente lo que un día alguien va a «mejorar»:
 *   «esta placa todavía no fue activada» · «esta placa fue dada de baja»
 * *Dos mensajes que ayudan al que la encontró, y que de paso le confirman a
 * cualquiera que ese código pertenece a una mascota real de una familia real.*
 * Un lote impreso se puede tener en la mano antes de venderse: si el sistema
 * distingue «no existe» de «existe y espera», el que tiene la caja sabe cuáles
 * ya se vendieron, y puede acampar sobre ellas hasta que se activen.
 *
 * ── LOS TRES ESTADOS ────────────────────────────────────────────────────────
 *   ① un token que no existe        ② uno acuñado y SIN activar
 *   ③ uno activado y REVOCADO
 * Los tres tienen que dar **la misma respuesta**, y se pregunta como pregunta la
 * página: **desde `anon`**, que es quien la abre.
 *
 * ── LO QUE NO MIDE, declarado ───────────────────────────────────────────────
 * No mide el tiempo de respuesta: los tres caminos hacen una búsqueda indexada y
 * la red domina cualquier diferencia (medido en S113: el peaje por petición p95
 * ≈ 600 ms contra ~20 ms de trabajo). *Declarar que no se midió es más honesto
 * que un número que sólo describe la red.*
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE.
 *
 *   node scripts/verify-placa-muda.mjs --control
 *   node scripts/verify-placa-muda.mjs
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exigirArgumentos } from './lib-argumentos.mjs';

const ESTE = fileURLToPath(import.meta.url) === process.argv[1];
if (ESTE) exigirArgumentos(['--control'], 0);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const LEER = process.env.PLACA_RPC ?? 'leer_pasaporte';
const di = (s) => console.log(s);

export function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { const j = JSON.parse(r.stdout.slice(i)); return j?.error ? null : (j.rows ?? null); } catch { return null; }
}

/**
 * **La huella de una respuesta**: lo que un desconocido puede aprender de ella.
 * No es el cuerpo entero — dos `null` con distinto `Content-Length` son iguales
 * para quien mira. Es el código HTTP y la FORMA de lo que vuelve.
 */
export function huella({ estado, cuerpo }) {
  const c = cuerpo === null || cuerpo === undefined || cuerpo === 'null' ? 'nulo'
    : typeof cuerpo === 'object' ? `claves:${Object.keys(cuerpo).sort().join(',')}`
    : `texto:${String(cuerpo).slice(0, 40)}`;
  return `${estado}|${c}`;
}

/** Rojo si dos estados distintos se distinguen. Devuelve los pares delatores. */
export function distinguibles(casos) {
  const pares = [];
  for (let i = 0; i < casos.length; i += 1) {
    for (let j = i + 1; j < casos.length; j += 1) {
      if (casos[i].huella !== casos[j].huella) {
        pares.push({ a: casos[i].que, b: casos[j].que, ha: casos[i].huella, hb: casos[j].huella });
      }
    }
  }
  return pares;
}

/**
 * ④ **Entropía del código.** Un token que se puede adivinar no lo salva ningún
 * rate limit: quien enumera pega contra códigos DISTINTOS, y un contador por
 * pasaporte cuenta cada uno por separado. *El límite protege a un pasaporte
 * conocido del raspado; no protege al espacio de tokens de la enumeración.*
 * Por eso lo que decide acá son los bits, y se leen del generador.
 */
export function bitsDelToken(cuerpo) {
  const m = String(cuerpo ?? '').match(/gen_random_bytes\(\s*(\d+)\s*\)/);
  if (!m) return { bits: null, por: 'no encontré el generador' };
  return { bits: Number(m[1]) * 8, por: `gen_random_bytes(${m[1]})` };
}

/**
 * ⑤ **El orden de los rebotes también informa.** Si `activar_placa` mirara
 * primero el token y después el acceso, un desconocido con una placa ajena
 * sabría si ese código existe antes de que le digan que no puede. Lo correcto es
 * lo que hace hoy: **el acceso primero**, y entonces el rebote habla de QUIEN
 * pregunta y nunca de la placa.
 */
export function accesoAntesQueToken(cuerpo) {
  const c = String(cuerpo ?? '').toLowerCase();
  const iAcceso = c.search(/user_es_familiar_adulto_de_mascota|no_access_to_mascota/);
  const iToken = c.search(/from pasaporte_placa|placa_no_existe/);
  if (iAcceso === -1 || iToken === -1) return { ok: null, por: 'no encontré los dos guards' };
  return { ok: iAcceso < iToken, por: iAcceso < iToken ? 'el acceso se mira primero' : 'el TOKEN se mira antes que el acceso' };
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (ESTE && process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et) => { di(`${b ? '✅' : '🔴'} ${et}`); if (!b) fallos += 1; };
  const H = (e, c) => huella({ estado: e, cuerpo: c });

  // POSITIVO primero: el «mejorá el mensaje» que este gate existe para frenar.
  ok(distinguibles([
    { que: 'no existe', huella: H(200, null) },
    { que: 'sin activar', huella: H(200, { motivo: 'placa_sin_activar' }) },
  ]).length === 1, 'POSITIVO un mensaje que explica «sin activar» se delata contra «no existe»');

  ok(distinguibles([
    { que: 'no existe', huella: H(200, null) },
    { que: 'sin activar', huella: H(200, null) },
    { que: 'revocado', huella: H(200, null) },
  ]).length === 0, 'NEGATIVO los tres con la misma respuesta no producen hallazgo');

  ok(distinguibles([
    { que: 'no existe', huella: H(200, null) },
    { que: 'revocado', huella: H(404, null) },
  ]).length === 1, 'CLASE    el código HTTP también delata, aunque el cuerpo sea igual');

  ok(H(200, { a: 1, b: 2 }) === H(200, { b: 9, a: 8 }),
    'CLASE    la huella mira las CLAVES, no los valores: dos pasaportes distintos no se distinguen entre sí');

  ok(bitsDelToken("v_tok := encode(extensions.gen_random_bytes(16),'base64')").bits === 128,
    'POSITIVO ④ los bits se leen del generador, no se suponen');
  ok(bitsDelToken('sin generador').bits === null,
    'NEGATIVO ④ sin generador se devuelve null, no un número inventado');
  ok(bitsDelToken("gen_random_bytes(4)").bits === 32,
    'CLASE    ④ un generador más chico da menos bits — el juez no está clavado en 128');

  ok(accesoAntesQueToken('if not user_es_familiar_adulto_de_mascota(x) then raise; end if; select * from pasaporte_placa').ok === true,
    'NEGATIVO ⑤ el orden correcto no produce hallazgo');
  ok(accesoAntesQueToken('select * from pasaporte_placa where token=t; if not user_es_familiar_adulto_de_mascota(x) then raise; end if;').ok === false,
    'POSITIVO ⑤ mirar el token primero se delata');
  ok(accesoAntesQueToken('nada').ok === null,
    'CLASE    ⑤ sin los dos guards se devuelve null, no un verde');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ el juez delata un mensaje servicial y no marca la respuesta muda.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
if (ESTE) {
  const existe = sql(`select 1 as x from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                      where n.nspname='public' and p.proname='${LEER}'`);
  if (!existe?.length) { di(`⚠️ NO CONCLUYENTE — \`${LEER}\` no existe.`); process.exit(2); }

  /* Los tres sujetos se BUSCAN en la base; ninguno se fabrica. *Un arnés que
     acuña su propia placa para medirla prueba que su INSERT funciona, no que la
     placa que se imprimió de verdad esté muda.* Si un estado no existe todavía,
     se dice y no se cuenta como verde. */
  const sinActivar = sql(`select token from pasaporte_placa where activada_en is null limit 1`)?.[0]?.token ?? null;
  const revocado = sql(`select token from pasaporte where revocado_en is not null limit 1`)?.[0]?.token ?? null;
  const inexistente = 'zzzzzzzzzzzzzzzzzzzzzz'; // 22 chars: pasa el regex de forma, no existe

  const REF = readFileSync(`${RAIZ}supabase/.temp/project-ref`, 'utf8').trim();
  const ANON = readFileSync(`${RAIZ}scripts/seg2/d713-cron.mjs`, 'utf8')
    .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
  if (!ANON) { di('⚠️ NO CONCLUYENTE — no encontré la clave pública con la que pregunta la página.'); process.exit(2); }

  /** Se pregunta como pregunta la página: sin sesión. */
  async function comoUnDesconocido(token) {
    const r = await fetch(`https://${REF}.supabase.co/rest/v1/rpc/${LEER}`, {
      method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' },
      body: JSON.stringify({ p_token: token }),
    });
    let cuerpo = null; const t = await r.text();
    try { cuerpo = JSON.parse(t); } catch { cuerpo = t; }
    return { estado: r.status, cuerpo };
  }

  di(`verify:placa-muda · \`${LEER}\` preguntado desde \`anon\`, como la página`);
  /* 🔴 EL ESTADO SIN ACTIVAR NO ES UNO DE TRES: ES EL SUJETO DE LA LEY.
     Sin una placa acuñada y sin activar, este gate puede comparar «no existe»
     contra «revocado» y salir VERDE **sin haber mirado nunca lo que vino a
     mirar**. *Un gate que pasa por vacío sobre su propio sujeto es peor que no
     tenerlo: su verde se lee como que la placa está probada.* */
  /* ④⑤ se miden SIEMPRE: no dependen de que exista una placa acuñada. */
  const cuerpos = sql(`select p.proname, pg_get_functiondef(p.oid) as d from pg_proc p
                       join pg_namespace n on n.oid=p.pronamespace
                       where n.nspname='public' and p.proname in ('crear_lote_placas','activar_placa')`) ?? [];
  const crear = cuerpos.find((x) => x.proname === 'crear_lote_placas')?.d ?? '';
  const activar = cuerpos.find((x) => x.proname === 'activar_placa')?.d ?? '';
  const previos = [];

  const B = bitsDelToken(crear);
  if (B.bits === null) previos.push({ regla: '④ entropía', detalle: `no pude leer el generador del token (${B.por}): NO medida` });
  else {
    di(`   ④ entropía del código: ${B.bits} bits (${B.por})`);
    if (B.bits < 96) previos.push({ regla: '④ entropía', detalle: `${B.bits} bits: un espacio así se enumera, y el rate limit NO lo cubre — cuenta por pasaporte, y quien enumera pega contra códigos distintos` });
  }

  const O = accesoAntesQueToken(activar);
  if (O.ok === null) previos.push({ regla: '⑤ orden de guards', detalle: `no encontré los dos guards en \`activar_placa\`: NO medido` });
  else if (!O.ok) previos.push({ regla: '⑤ orden de guards', detalle: `${O.por}: un desconocido con una placa ajena sabría si ese código existe antes de que le digan que no puede` });
  else di(`   ⑤ activar_placa: ${O.por} — el rebote habla de quien pregunta, nunca de la placa`);

  if (previos.length) {
    di(`\n🔴 ${previos.length} incumplimiento(s) que NO dependen de que haya placas:`);
    for (const r of previos) di(`   ${r.regla.padEnd(20)} ${r.detalle}`);
    process.exit(1);
  }

  if (!sinActivar) {
    di('\n⚠️ NO CONCLUYENTE — no hay ninguna placa acuñada y sin activar.');
    di('   `crear_lote_placas` existe y no se corrió nunca: 0 lotes, 0 placas.');
    di('   Es el ÚNICO estado que esta ley nombra, así que el gate NO da verde');
    di('   sin él. Vuelve a decidir solo el día que exista el primer lote.');
    process.exit(2);
  }
  const casos = [
    { que: 'un token que no existe', token: inexistente },
    { que: 'una placa acuñada y SIN activar', token: sinActivar },
  ];
  if (revocado) casos.push({ que: 'un pasaporte REVOCADO', token: revocado });
  else di('   ⚠️ no hay ningún pasaporte revocado: ese estado NO se midió');

  for (const c of casos) {
    const r = await comoUnDesconocido(c.token);
    c.huella = huella(r);
    di(`   ${c.que.padEnd(34)} → ${c.huella}`);
  }

  const delatores = distinguibles(casos);
  if (delatores.length) {
    di(`\n🔴 ${delatores.length} par(es) DISTINGUIBLE(S):`);
    for (const d of delatores) di(`   «${d.a}» (${d.ha})  ≠  «${d.b}» (${d.hb})`);
    di('   Quien tiene un código en la mano puede saber en cuál de esos estados está.');
    process.exit(1);
  }
  di(`\n✅ los ${casos.length} estados dan la MISMA respuesta: un código sin activar no dice nada de nadie.`);
}
