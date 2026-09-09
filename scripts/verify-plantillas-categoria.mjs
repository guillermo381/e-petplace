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
 * ── ④ CONTRA QUÉ WABA MIDIÓ — DICHO, NO INFERIDO ────────────────────────
 * **Hay DOS WABAs con el mismo nombre en el portafolio**, así que *una medición
 * que no nombra su `WABA_ID` no es interpretable: un identificador correcto y
 * uno equivocado se leen igual.*
 *
 * **La edge no lo devuelve** (ver abajo), pero **no hace falta que lo derive**:
 * `supabase secrets list` publica, por cada secreto, **`sha256` CRUDO de su
 * valor** (censo de A, `S114-A-CENSO-DIGEST-SECRETS.md`). ⇒ el gate **compara
 * el digest publicado contra los candidatos declarados** y confirma cuál está
 * configurado **sin leer el secreto nunca**.
 *
 * ⚠️ **No es heredar la respuesta de A: es re-correr su método.** El gate
 * vuelve a hacer la comparación en cada corrida, así que **el día que alguien
 * cambie el secreto al WABA gemelo, se pone rojo solo.**
 *
 * 🔒 **Sólo lee la entrada `META_WABA_ID`.** El listado trae los digests de
 * TODOS los secretos y —por el propio hallazgo de A— para los de baja entropía
 * *el digest ES el valor*. Este gate no los imprime ni los toca.
 *
 * ── 🔴 LO QUE SIGUE SIN PODERSE MEDIR DESDE ACÁ ─────────────────────────
 * **Hay DOS WABAs con el mismo nombre en el portafolio.** ⇒ *una medición de
 * WhatsApp que no nombra su `WABA_ID` no es interpretable: un identificador
 * correcto y uno equivocado se leen igual*, y las diez plantillas que este
 * gate lee podrían ser las de la cuenta que el producto **no** usa. Con eso,
 * una deriva a `marketing` en la cuenta buena **pasaría invisible**.
 *
 * **El par WABA↔NÚMERO.** La edge LEE plantillas de `META_WABA_ID` y ENVÍA
 * desde `META_PHONE_NUMBER_ID`. **Si esos dos apuntaran a WABAs distintos**
 * —justo lo que dos cuentas homónimas vuelven fácil— *el gate leería las
 * plantillas de una cuenta y el producto mandaría desde la otra, y las dos
 * lecturas serían creíbles*. **Eso exige preguntarle a Meta
 * `/{waba}/phone_numbers` con el token, y desde afuera de la edge no se puede.**
 * Queda **pedido a A por el buzón**, no supuesto.
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
import { createHash } from 'node:crypto';
import { dbQuery } from './lib-db.mjs';

const ESPERADA = 'UTILITY';
/** Plantillas que la cuenta guarda fuera de `utility` A PROPÓSITO.
 *  Cada una con su razón escrita. **Hoy vacía, y así se declara.** */
const EXCEPCIONES = Object.create(null); // p.ej. { promo_navidad: 'campaña firmada S120' }

const EDGE = 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/despachar-whatsapp?verificar=1';

/** Los dos WABAs homónimos del portafolio. El gate dice CUÁL está configurado
 *  comparando digests; no elige por nombre, que es lo que los hace confundibles. */
const WABAS_CONOCIDOS = {
  '1352301540326788': 'la del número ecuatoriano (+593) — la que el producto usa',
};
/** Control negativo: un id fabricado NUNCA puede coincidir. Si coincidiera, la
 *  comparación no discrimina y todo lo de abajo es ruido. */
const WABA_FALSO = '9999999999999999';

/**
 * Confirma el `META_WABA_ID` configurado comparando el **sha256 crudo** que
 * publica `supabase secrets list` contra los candidatos. **Nunca lee el valor**
 * y **sólo mira la entrada `META_WABA_ID`**: el listado trae los digests de
 * todos los secretos y, para los de baja entropía, *el digest es el valor*.
 */
function wabaConfigurado() {
  let crudo;
  try {
    crudo = execFileSync('npx', ['supabase', 'secrets', 'list'], { encoding: 'utf8' });
  } catch { return { err: 'no se pudo leer `supabase secrets list` (¿CLI sin sesión?)' }; }
  const ini = crudo.indexOf('{');
  if (ini === -1) return { err: 'la salida de `secrets list` no trae JSON' };
  let lista;
  try { lista = JSON.parse(crudo.slice(ini)).secrets ?? []; }
  catch { return { err: 'no se pudo parsear `secrets list`' }; }
  const fila = lista.find((x) => x.name === 'META_WABA_ID');
  if (!fila?.value) return { err: 'el listado no trae `META_WABA_ID`' };

  const sha = (v) => createHash('sha256').update(String(v)).digest('hex');
  if (sha(WABA_FALSO) === fila.value) {
    return { err: 'el CONTROL NEGATIVO coincidió: la comparación de digests no discrimina' };
  }
  const hit = Object.keys(WABAS_CONOCIDOS).find((id) => sha(id) === fila.value);
  return hit
    ? { id: hit, nota: WABAS_CONOCIDOS[hit] }
    : { err: 'el digest de `META_WABA_ID` no coincide con NINGÚN candidato conocido' };
}

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

// ── ④ IDENTIDAD DE LA MEDICIÓN — contra qué se midió ─────────────────────
const numero = vivo.numero ?? {};
const huella = [...enCuenta.map((p) => p.name)].sort().join('|');
const huellaCorta = [...huella].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16);
const waba = vivo.waba_id ? { id: vivo.waba_id, nota: 'devuelto por la edge' } : wabaConfigurado();
console.log('  ── IDENTIDAD DE LA MEDICIÓN ──');
console.log(`   waba_id ................. ${waba.id ?? `🔴 ${waba.err}`}`);
if (waba.id) console.log(`                            ${waba.nota}`);
console.log('                            (confirmado por sha256 del secreto, con su control negativo)');
console.log(`   número que ENVÍA ........ ${numero.display_phone_number ?? '?'} · ${numero.verified_name ?? '?'}`);
console.log(`   huella de plantillas .... ${huellaCorta} (${enCuenta.length} nombres)`);
console.log('');
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
let pendientes = 0;
for (const p of enCuenta) {
  const cab = cableadas.filter((c) => c.plantilla === p.name).map((c) => c.codigo);
  const exenta = p.name in EXCEPCIONES;
  /* 🔴 UNA PLANTILLA EN REVISIÓN TRAE SU CATEGORÍA **DECLARADA**, NO LA APROBADA.
     Meta todavía no falló, y con `allow_category_change` puede aprobarla en otra.
     ⇒ su `UTILITY` **no confirma nada**: se cuenta aparte y jamás como verde. */
  const enRevision = p.status !== 'APPROVED';
  if (enRevision) pendientes += 1;
  const mal = p.category !== ESPERADA && !exenta;
  console.log(
    `  ${mal ? '🔴' : enRevision ? '⏳' : '  '} ${String(p.name).padEnd(30)} ${String(p.language).padEnd(6)} ` +
    `${(String(p.category) + (enRevision ? '*' : '')).padEnd(11)} ${String(p.status).padEnd(11)} ${cab.join(', ') || '—'}` +
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

console.log(`\n  en la cuenta: ${enCuenta.length} · aprobadas: ${enCuenta.length - pendientes}` +
            ` · en revisión: ${pendientes} · cableadas: ${nombresCableados.size}` +
            ` (${cableadas.map((c) => c.codigo).join(', ') || 'ninguna'})`);
if (pendientes) {
  console.log(`  ⏳ las marcadas con * están EN REVISIÓN: su categoría es la DECLARADA al`);
  console.log('     enviarlas, no la que Meta aprobó. No confirman nada todavía.');
}
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
if (!waba.id) {
  console.error(`\n🟠 NO CONCLUYENTE · ninguna plantilla está fuera de ${ESPERADA}, **pero el gate`);
  console.error('   no puede decir contra qué WABA midió** y hay DOS homónimos en el portafolio.');
  console.error(`   ${waba.err}`);
  console.error('   Un identificador correcto y uno equivocado se leen igual.');
  process.exit(2);
}
console.log(`\n🟢 VERDE · las ${enCuenta.length} plantillas del WABA ${waba.id} están en ${ESPERADA}.`);
/* ═══ EL PAR waba ↔ número — TRISTATE, y los tres estados se ramifican ═════
   S114-A lo construyó y desplegó (`866df2cd`) después de que midiéramos que un
   `includes()` sobre una lista VACÍA da `false` SIEMPRE. **Yo casi publico
   «apuntan a cuentas distintas» sobre una lista que nunca se llenó** — de ahí
   que el campo sea tristate y no booleano.

   🔴 **`null` NO ES `false`, y tratarlos igual reintroduce el defecto exacto
   que el tristate vino a curar.** Por eso acá hay TRES ramas, no dos:
     · `true`  → medido y coherente.
     · `false` → se enumeraron números y el configurado NO está ⇒ cuentas
                 distintas. **Ahí sí se afirma incoherencia**, y va a ROJO.
     · `null`  → no se pudo concluir. Se dice el motivo y **no se afirma nada**.

   ⚠️ Y el gate NO se pone rojo con `null` **a propósito**: no saber si el par
   coincide no es lo mismo que saber que no coincide. *Un gate que grita ante la
   ignorancia enseña a ignorarlo.* Se muestra, con dueño. */
/* 🔴 EL CONTROL DE ESTA RAMA, porque un rojo que nunca se produjo no es un rojo.
   `PAR_FORZADO=false|true|null` inyecta el veredicto **sin tocar la edge**, para
   probar que las tres ramas hacen lo que dicen. *El resto del gate sigue midiendo
   de verdad: lo único que se fuerza es este campo.* Se declara en la salida para
   que ninguna corrida forzada se confunda con una medición. */
const forzado = process.env.PAR_FORZADO;
const par = forzado === undefined
  ? (vivo.par_coherente ?? null)
  : (forzado === 'true' ? true : forzado === 'false' ? false : null);
const parMotivo = forzado === undefined
  ? (vivo.par_coherente_motivo ?? 'sin motivo declarado')
  : `CONTROL FORZADO (PAR_FORZADO=${forzado}) — NO es una medición`;
if (forzado !== undefined) console.log(`\n   ⚠️ CORRIDA DE CONTROL: par_coherente forzado a ${forzado}`);

if (par === false) {
  console.error('\n🔴 ROJO · `META_WABA_ID` y `META_PHONE_NUMBER_ID` apuntan a CUENTAS DISTINTAS.');
  console.error(`   la edge enumeró los números del WABA configurado y el configurado NO está.`);
  console.error(`   motivo: ${parMotivo}`);
  console.error('   Con dos WABA homónimas en el portafolio, esto manda mensajes desde la otra.');
  process.exit(1);
}
if (par === true) {
  console.log(`   ✅ el par waba↔número es COHERENTE (medido por la edge: ${parMotivo}).`);
} else {
  console.log('   ⚠️ EL PAR waba↔número SIGUE SIN PODERSE CONCLUIR, y el gate NO lo llama rojo:');
  console.log(`      \`par_coherente = null\` · motivo: \`${parMotivo}\``);
  console.log('      *No saber si coincide no es saber que no coincide.*');
  console.log('      🔴 Y la causa de fondo sigue viva: `waba_alcanzables` vuelve VACÍO y');
  console.log('      `waba_configurado_alcanzable` dice `false` **con token válido, los dos');
  console.log('      permisos y `http_plantillas: 200` trayendo las 10 de ese mismo WABA** ⇒');
  console.log('      si no fuera alcanzable, esa llamada no habría respondido. **El tristate');
  console.log('      convirtió un falso rojo en un `null` honesto —que es una mejora real—');
  console.log('      pero la pregunta sigue abierta: se cierra cuando la enumeración funcione.**');
  console.log('      (dueño: A · la enumeración sale de los scopes granulares del debug_token,');
  console.log('       que para un token de usuario de sistema puede no listar `target_ids`.)');
}
console.log('   (Vale para AHORA: la deriva de Meta es silenciosa — se vuelve a correr.)');
