#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:plantillas-categoria — S114-E · la deriva silenciosa de Meta
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **POR QUÉ ESTE GATE NO ES DE UNA VEZ.** Meta **reclasifica una plantilla de
 * `utility` a `marketing` DESPUÉS de aprobarla** — `allow_category_change` es
 * el default desde abril de 2025 —, **sin rechazo y sin aviso**. ⇒ *«las ocho
 * están en utility» es un hecho con fecha de vencimiento*, y una medición de
 * ayer no dice nada de hoy. Este gate se corre **cuando se quiera**.
 *
 * Y lo que está en juego no es cosmético: `MODELO_FINANCIERO` §11bis lo dice —
 * **Ecuador está en una banda cara**, y una plantilla derivada a `marketing`
 * es *el país caro con la tarifa cara*, cobrando por un mensaje que el
 * producto manda como operativo.
 *
 * ── DE DÓNDE SALE CADA MITAD, Y NINGUNA SE ESCRIBE A MANO ────────────────
 * · **La categoría VIVA** sale de Meta, por la edge `despachar-whatsapp` en
 *   modo `?verificar=1`. **Es la categoría YA APROBADA, no la declarada al
 *   enviar la plantilla** — que es justo la diferencia que la deriva explota.
 * · **La lista CABLEADA** sale del objeto: `cat_notificacion_tipos.plantilla_whatsapp`.
 *   *Una lista escrita a mano en este archivo envejecería en silencio, que es
 *   el mismo defecto que el gate vino a cazar.*
 *
 * ── LOS DOS NIVELES DE ROJO ──────────────────────────────────────────────
 * ① **cableada y fuera de `utility`** — el rojo que pidió la mesa. Es la que
 *    el producto va a mandar.
 * ② **aprobada en la cuenta y fuera de `utility`, todavía sin cablear** —
 *    también rojo. *Una plantilla que deriva antes de cablearse está
 *    exactamente igual de rota; que todavía no la usemos es suerte, no
 *    defensa.* Para eso existe `EXCEPCIONES`, **hoy vacía y declarada**: si
 *    algún día la cuenta guarda una `marketing` a propósito, se escribe ahí
 *    con su razón — nunca se ablanda el gate.
 * ③ **cableada a una plantilla que no existe en la cuenta** — rojo: el
 *    producto la nombra y Meta no la tiene.
 *
 * ── NO CONCLUYENTE (jamás verde) ─────────────────────────────────────────
 * · la edge no contesta, o falta el secreto ⇒ no hay categoría que comparar
 * · la cuenta devuelve CERO plantillas ⇒ sin sujeto, «ninguna fuera de
 *   utility» es verdad y no significa nada
 * · no existe `cat_notificacion_tipos.plantilla_whatsapp` ⇒ no se puede saber
 *   qué está cableado
 *
 * ── ¿PERDONA ALGO QUE EL PRODUCTO NO PERDONA? ────────────────────────────
 * **Sí, una cosa y se declara: no mira el IDIOMA.** Una plantilla cableada en
 * `es` que en Meta sólo existe en `en` pasa este gate y falla al enviar. Ese
 * rojo es de otro instrumento. **Tampoco mira el número de variables**, que es
 * la otra forma de que un envío bien categorizado reviente.
 *
 * Salidas: 0 verde · 1 rojo · 2 no concluyente.
 */
import { execFileSync } from 'node:child_process';
import { dbQuery } from './lib-db.mjs';

const ESPERADA = 'UTILITY';
/** Plantillas que la cuenta guarda fuera de `utility` A PROPÓSITO.
 *  Cada una con su razón escrita. **Hoy vacía, y así se declara.** */
const EXCEPCIONES = Object.create(null); // p.ej. { promo_navidad: 'campaña firmada S120' }

const EDGE = 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/despachar-whatsapp?verificar=1';

// ── ① La categoría VIVA, de Meta ─────────────────────────────────────────
let vivo;
try {
  const secreto = execFileSync('security',
    ['find-generic-password', '-s', 'epetplace-despacho-secret', '-w'], { encoding: 'utf8' }).trim();
  const r = await fetch(EDGE, {
    method: 'POST',
    headers: { 'x-despacho-secret': secreto, 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(60_000),   // un arnés colgado no falla: se cuelga
  });
  if (!r.ok) throw new Error(`la edge respondió ${r.status}`);
  vivo = JSON.parse(await r.text());
} catch (e) {
  console.error('🟠 NO CONCLUYENTE · no se pudo leer la categoría viva en Meta.');
  console.error(`   ${String(e.message).slice(0, 200)}`);
  console.error('   Sin la categoría de Meta no hay nada que comparar: el gate NO dice verde.');
  process.exit(2);
}

const enCuenta = Array.isArray(vivo.plantillas) ? vivo.plantillas : [];
if (enCuenta.length === 0) {
  console.error('🟠 NO CONCLUYENTE · la cuenta devolvió CERO plantillas.');
  console.error(`   http_plantillas=${vivo.http_plantillas} · error=${vivo.error_plantillas ?? '—'}`);
  console.error('   Sin sujeto, «ninguna fuera de utility» es verdad y no significa nada.');
  process.exit(2);
}

// ── ② La lista CABLEADA, del objeto ──────────────────────────────────────
let cableadas;
try {
  const col = dbQuery(`select count(*)::int as n from pg_attribute a
     join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='cat_notificacion_tipos'
      and a.attname='plantilla_whatsapp' and not a.attisdropped`)[0].n;
  if (col === 0) {
    console.error('🟠 NO CONCLUYENTE · no existe `cat_notificacion_tipos.plantilla_whatsapp`.');
    console.error('   Sin ella no se puede saber qué plantilla está cableada, y el rojo que');
    console.error('   pidió la mesa es exactamente sobre las cableadas.');
    process.exit(2);
  }
  cableadas = dbQuery(`select codigo, plantilla_whatsapp as plantilla
     from cat_notificacion_tipos where plantilla_whatsapp is not null order by 1`);
} catch (e) {
  console.error(`🟠 NO CONCLUYENTE · no se pudo leer el cableado: ${e.message.slice(0, 160)}`);
  process.exit(2);
}

const porNombre = new Map(enCuenta.map((p) => [p.name, p]));
const nombresCableados = new Set(cableadas.map((c) => c.plantilla));
const fallos = [];

console.log('verify:plantillas-categoria · la deriva silenciosa de Meta');
console.log(`  esperada: ${ESPERADA} · leída de Meta (categoría APROBADA, no la declarada)\n`);
console.log('  plantilla                        idioma  categoría   estado      cableada por');
for (const p of enCuenta) {
  const cab = cableadas.filter((c) => c.plantilla === p.name).map((c) => c.codigo);
  const exenta = p.name in EXCEPCIONES;
  const mal = p.category !== ESPERADA && !exenta;
  console.log(
    `  ${mal ? '🔴' : '  '} ${String(p.name).padEnd(30)} ${String(p.language).padEnd(6)} ` +
    `${String(p.category).padEnd(11)} ${String(p.status).padEnd(11)} ${cab.join(', ') || '—'}` +
    (exenta ? `  (excepción: ${EXCEPCIONES[p.name]})` : ''),
  );
  if (mal) {
    fallos.push(cab.length
      ? `① CABLEADA fuera de ${ESPERADA}: \`${p.name}\` está en ${p.category} y la usa ${cab.join(', ')}`
      : `② aprobada fuera de ${ESPERADA} (aún sin cablear): \`${p.name}\` está en ${p.category}`);
  }
  if (cab.length && p.status !== 'APPROVED') {
    fallos.push(`① CABLEADA sin aprobar: \`${p.name}\` está en ${p.status} y la usa ${cab.join(', ')}`);
  }
}

// ── ③ Cableada a algo que Meta no tiene ──────────────────────────────────
for (const c of cableadas) {
  if (!porNombre.has(c.plantilla)) {
    fallos.push(`③ \`${c.codigo}\` está cableado a \`${c.plantilla}\`, que NO existe en la cuenta`);
  }
}

console.log(`\n  en la cuenta: ${enCuenta.length} · cableadas: ${nombresCableados.size}` +
            ` (${cableadas.map((c) => c.codigo).join(', ') || 'ninguna'})`);
if (nombresCableados.size === 0) {
  console.log('  ⚠️ NOTA: hoy no hay ninguna plantilla cableada, así que el nivel ① no tiene');
  console.log('     sujeto. El nivel ② sí lo tiene y por eso el gate igual mide.');
}

if (fallos.length) {
  console.error(`\n🔴 ROJO · ${fallos.length} plantilla(s) fuera de ${ESPERADA}.`);
  for (const f of fallos) console.error(`   · ${f}`);
  console.error('   Meta reclasifica después de aprobar y no avisa: esto se cura en la');
  console.error('   consola de Meta, no editando este gate.');
  process.exit(1);
}
console.log(`\n🟢 VERDE · las ${enCuenta.length} plantillas de la cuenta están en ${ESPERADA}.`);
console.log('   (Vale para AHORA: la deriva de Meta es silenciosa — se vuelve a correr.)');
