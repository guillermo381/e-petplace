#!/usr/bin/env node
// scripts/ia-conjuntos/medir-carnet.mjs — S113-E, lote 1.0
//
// Corre la pieza `carnet` sobre el conjunto y entrega los CUATRO números:
// exactitud por campo · INVENCIÓN · latencia (p50/p95) · costo real.
//
// ── DOS COSAS QUE ESTE ARNÉS YA NO NECESITA, y son cura, no ahorro ──────────
// ① **No corre `supabase projects api-keys`** — la línea prohibida de D-1013,
//    que vuelca `anon` Y `service_role` en claro por stdout. El arnés del lote 0
//    la usaba (la escribí yo, antes de que esa ficha existiera). La `anon` es
//    PÚBLICA por diseño —viaja en cada bundle— y ya vive commiteada en el repo,
//    así que se lee de ahí y se verifica su claim antes de usarla.
// ② **No necesita `service_role`**: el conjunto sintético son archivos locales.
//    El del lote 0 bajaba de Storage y por eso pedía la clave de servicio.
//
// ── LA LATENCIA SE MIDE EN DOS RELOJES, y la diferencia ES el dato ──────────
// `ms_pared` incluye subir el base64 y la red; `ia_uso.latencia_ms` es sólo la
// llamada al modelo, medida del lado del servidor. **La resta responde la
// pregunta de dónde se va el tiempo**, que es lo que el encargo pide si no se
// llega a la meta de 15 s. Por eso la corrida es SECUENCIAL: paralelizarla
// bajaría el reloj de pared 5× y ensuciaría justo el número que se vino a medir.
//
// Uso:  node scripts/ia-conjuntos/medir-carnet.mjs [--limite=N] [--desde=N]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { puntuarCaso, CAMPOS, percentil } from './puntuar-carnet.mjs';
import { claveAnon } from './lib-conjuntos.mjs';
import { normalizarRespuesta, repartoEvidencia, repartoConfianza } from './puntuar-carnet.mjs';

const DIR = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
const REF = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
const URL_BASE = `https://${REF}.supabase.co`;
const CORREO = 'guillo381+8@gmail.com';
const di = (s) => { console.log(s); };

async function jwtDePersona() {
  const cl = spawnSync('security', ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'], { encoding: 'utf8' });
  const pass = cl.stdout.trim();
  if (!pass) throw new Error('sin clave de siembra en el keychain. El arnés PARA.');
  const r = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: claveAnon(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CORREO, password: pass }),
  });
  if (!r.ok) throw new Error(`no pude abrir sesión (${r.status}). El arnés PARA.`);
  const j = await r.json();
  const rol = JSON.parse(Buffer.from(j.access_token.split('.')[1], 'base64url').toString('utf8')).role;
  if (rol !== 'authenticated') throw new Error(`token con role=${rol}. El arnés PARA.`);
  return j.access_token;
}

/** Las filas que la edge registró en `ia_uso` durante la ventana de la corrida. */
function usoDeLaVentana(desdeIso) {
  const sql = `select tokens_entrada, tokens_salida, latencia_ms, costo_estimado_usd, resultado
               from public.ia_uso
               where pieza = 'carnet' and created_at >= '${desdeIso}'::timestamptz
               order by created_at`;
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], { encoding: 'utf8' });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { return JSON.parse(r.stdout.slice(i)).rows ?? null; } catch { return null; }
}

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? Number(a.slice(n.length + 3)) : d; };
const argT = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };

async function main() {
  const ruta = join(DIR, `${argT('conjunto', 'carnets-sinteticos')}.json`);
  if (!existsSync(ruta)) { di(`🔴 falta ${ruta}. Corré construir-carnets-sinteticos.mjs primero.`); process.exit(2); }
  const conj = JSON.parse(readFileSync(ruta, 'utf8'));

  const desde = arg('desde', 0);
  const limite = arg('limite', conj.casos.length);
  const casos = conj.casos.slice(desde, desde + limite);

  /* `--prompt=v2` sólo sirve DESPUÉS de que A despliegue la v2 de D: es esa
     edge la que valida `modelo` contra `MODELOS_MEDIBLES` y devuelve
     `plan_impreso`. Contra la v1 desplegada, el parámetro se ignora y la
     respuesta no trae plan impreso — y el resumen lo dice, en vez de reportar
     un plan_impreso de 0 que se leería como «v2 no separó nada». */
  const version = argT('prompt', 'v1');
  if (version !== 'v1' && version !== 'v2') { di(`🔴 --prompt debe ser v1 o v2, no "${version}".`); process.exit(2); }
  const modelo = argT('modelo', null);
  const conjNombre = argT('conjunto', 'carnets-sinteticos');

  const jwt = await jwtDePersona();
  const arranqueIso = new Date().toISOString();

  di(`medir-carnet · ${casos.length} de ${conj.n_casos} carnets · conjunto ${conj.nombre} · prompt ${version}`);
  di(modelo ? `  modelo pedido a la edge: ${modelo} (la v2 lo valida contra MODELOS_MEDIBLES)`
            : `  el modelo lo decide la edge desplegada; acá NO se elige.`);
  di(`  ⚠️ corrida SECUENCIAL a propósito: la latencia es uno de los números.\n`);

  const detalle = [];
  const salida = join(DIR, `medicion-carnet-${arranqueIso.replace(/[:.]/g, '-')}.json`);
  mkdirSync(DIR, { recursive: true });

  for (const [i, caso] of casos.entries()) {
    const img = readFileSync(caso.ruta);
    const t0 = Date.now();
    let r, err = null;
    try {
      r = await fetch(`${URL_BASE}/functions/v1/extract-vacuna`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: img.toString('base64'),
          mediaType: 'image/jpeg',
          ...(modelo ? { modelo } : {}),
        }),
      });
    } catch (e) { err = String(e); }
    const ms = Date.now() - t0;

    if (err || !r.ok) {
      const cuerpo = r ? (await r.text()).slice(0, 160) : err;
      di(`🔴 ${i + 1}/${casos.length} ${caso.caso}: ${r ? 'HTTP ' + r.status : 'excepción'} ${cuerpo} (${ms} ms)`);
      detalle.push({ caso: caso.caso, plantilla: caso.plantilla, condicion: caso.condicion_captura, fallo: cuerpo, ms_pared: ms });
      writeFileSync(salida, JSON.stringify({ parcial: true, arranque: arranqueIso, detalle }, null, 2));
      continue;
    }

    const bruto = await r.json();
    const { vacunas, plan_impreso } = normalizarRespuesta(version, bruto);
    const p = puntuarCaso(caso, vacunas);
    detalle.push({
      caso: caso.caso, plantilla: caso.plantilla, condicion: caso.condicion_captura,
      formato_fecha: caso.formato_fecha, relleno: caso.relleno,
      ms_pared: ms, n_plan_impreso: plan_impreso.length,
      evidencia: repartoEvidencia(vacunas), confianza: repartoConfianza(vacunas),
      ...p,
    });
    di(`   ${i + 1}/${casos.length} ${caso.caso.padEnd(40)} vis=${p.n_visibles} dev=${p.n_devueltas} emp=${p.n_emparejadas} inv=${p.n_inventadas}${plan_impreso.length ? ` plan=${plan_impreso.length}` : ''} · ${(ms / 1000).toFixed(1)}s`);
    // Escritura incremental: una corrida de media hora no se pierde por un corte.
    writeFileSync(salida, JSON.stringify({ parcial: true, arranque: arranqueIso, detalle }, null, 2));
  }

  // ── agregados ──────────────────────────────────────────────────────────────
  const vivos = detalle.filter((d) => !d.fallo);
  const total = {};
  for (const c of CAMPOS) total[c] = { aciertos: 0, evaluados: 0, sin_verdad: 0, excluidos: 0 };
  let devueltas = 0, inventadas = 0, emparejadas = 0, visibles = 0, noDevueltas = 0, planImpreso = 0;
  const evidencia = {}, confianza = {};
  for (const d of vivos) {
    for (const c of CAMPOS) for (const k of ['aciertos', 'evaluados', 'sin_verdad', 'excluidos']) total[c][k] += d.campos[c][k] ?? 0;
    devueltas += d.n_devueltas; inventadas += d.n_inventadas; emparejadas += d.n_emparejadas;
    visibles += d.n_visibles; noDevueltas += d.n_no_devueltas; planImpreso += d.n_plan_impreso ?? 0;
    for (const [k, n] of Object.entries(d.evidencia ?? {})) evidencia[k] = (evidencia[k] ?? 0) + n;
    for (const [k, n] of Object.entries(d.confianza ?? {})) confianza[k] = (confianza[k] ?? 0) + n;
  }
  const exactitud = {};
  for (const c of CAMPOS) exactitud[c] = total[c].evaluados ? +(total[c].aciertos / total[c].evaluados * 100).toFixed(1) : null;

  const pared = vivos.map((d) => d.ms_pared);
  const uso = usoDeLaVentana(arranqueIso);
  const usoOk = (uso ?? []).filter((u) => u.resultado === 'ok');
  const servidor = usoOk.map((u) => Number(u.latencia_ms));
  const costo = usoOk.reduce((s, u) => s + Number(u.costo_estimado_usd ?? 0), 0);

  const resumen = {
    pieza: 'carnet',
    prompt: version,
    modelo_pedido: modelo,
    conjunto: conj.nombre,
    corrida_el: arranqueIso,
    n_casos: vivos.length,
    fallos: detalle.length - vivos.length,
    exactitud_pct: exactitud,
    detalle_campos: total,
    filas: { visibles, devueltas, emparejadas, inventadas, no_devueltas: noDevueltas, plan_impreso: planImpreso },
    evidencia_declarada: Object.keys(evidencia).length ? evidencia : null,
    confianza_declarada: Object.keys(confianza).length ? confianza : null,
    invencion_pct: devueltas ? +(inventadas / devueltas * 100).toFixed(1) : null,
    recall_pct: visibles ? +(emparejadas / visibles * 100).toFixed(1) : null,
    latencia_pared_ms: { p50: percentil(pared, 0.5), p95: percentil(pared, 0.95), max: Math.max(...pared) },
    latencia_modelo_ms: servidor.length ? { p50: percentil(servidor, 0.5), p95: percentil(servidor, 0.95), n: servidor.length } : null,
    costo_usd: +costo.toFixed(5),
    origen_costo: usoOk.length ? `REAL · ${usoOk.length} filas de ia_uso` : 'NO DISPONIBLE (ia_uso sin filas en la ventana)',
    costo_por_carnet_usd: usoOk.length ? +(costo / usoOk.length).toFixed(5) : null,
    detalle,
  };
  writeFileSync(salida, JSON.stringify(resumen, null, 2));

  di(`\n── RESUMEN ────────────────────────────────────────────────`);
  for (const c of CAMPOS) di(`  ${c.padEnd(28)} ${String(exactitud[c] ?? '—').padStart(6)}%   (${total[c].aciertos}/${total[c].evaluados}${total[c].sin_verdad ? ` · ${total[c].sin_verdad} sin verdad` : ''}${total[c].excluidos ? ` · ${total[c].excluidos} excluidos` : ''})`);
  di(`  ${'INVENCIÓN'.padEnd(28)} ${String(resumen.invencion_pct).padStart(6)}%   (${inventadas}/${devueltas} filas devueltas)`);
  di(`  ${'recall de filas'.padEnd(28)} ${String(resumen.recall_pct).padStart(6)}%   (${emparejadas}/${visibles} visibles)`);
  if (version === 'v2') {
    di(`  ${'plan impreso (v2)'.padEnd(28)} ${String(planImpreso).padStart(6)}     filas separadas — NO cuentan como invención`);
    if (resumen.evidencia_declarada) di(`  ${'evidencia declarada'.padEnd(28)} ${JSON.stringify(resumen.evidencia_declarada)}`);
    if (resumen.confianza_declarada) di(`  ${'confianza declarada'.padEnd(28)} ${JSON.stringify(resumen.confianza_declarada)}`);
    if (planImpreso === 0) di('  ⚠️ plan_impreso vino en 0: o el conjunto no tiene renglones de plan, o la edge desplegada NO es la v2.');
  }
  di(`  ${'latencia pared'.padEnd(28)} p50 ${resumen.latencia_pared_ms.p50} ms · p95 ${resumen.latencia_pared_ms.p95} ms`);
  if (resumen.latencia_modelo_ms) di(`  ${'latencia modelo (ia_uso)'.padEnd(28)} p50 ${resumen.latencia_modelo_ms.p50} ms · p95 ${resumen.latencia_modelo_ms.p95} ms`);
  di(`  ${'costo'.padEnd(28)} $${resumen.costo_usd}  (${resumen.origen_costo}) · $${resumen.costo_por_carnet_usd}/carnet`);
  di(`\n  → ${salida}`);
}

main().catch((e) => { console.error('🔴', e.message); process.exit(1); });
