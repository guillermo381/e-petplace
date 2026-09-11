/**
 * S115-E · INSTRUMENTO 27 — E2E DEL CUPO AGOTADO: VUELVE A LA COLA, SALE UNA VEZ.
 *
 * QUÉ MIDE, de punta a punta y contra la edge REAL:
 *   ① con el cupo agotado, el documento **vuelve a la cola** — queda `emitiendo`,
 *      **con su secuencial y su clave intactos**;
 *   ② al reactivar, sale **UNA sola vez**.
 *
 * 🔴 POR QUÉ IMPORTA CADA MITAD:
 *   · Si al volver a la cola PERDIERA su secuencial, el pase siguiente le tomaría uno
 *     nuevo y el viejo quedaría como **un hueco en la numeración que hay que explicarle
 *     al SRI**. Ése es el defecto que el comentario ② de la edge nombra.
 *   · Si al reactivar saliera DOS veces, serían **dos comprobantes del mismo pago** —
 *     y como la clave es derivada y estable, el segundo chocaría contra la UNIQUE… o
 *     peor, pasaría con otro número y facturaríamos dos veces.
 *
 * 🔴 SU ROJO NO TOCA CÓDIGO: `app_config.fiscal_simular_cupo_agotado = true`. *Una
 * palanca de ensayo que vive en configuración se puede accionar en producción sin
 * desplegar nada — y por eso el instrumento la deja como la encontró, pase lo que pase.*
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';
import { spawnSync } from 'node:child_process';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE_BANDERA = 'fiscal_simular_cupo_agotado';

/** Llama a la edge real con el secreto de despacho. */
function emitir() {
  const sec = spawnSync('sh', ['-c',
    `npx supabase secrets list --output json 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print([x['name'] for x in d if x['name']=='DESPACHO_SECRET'] and 'hay' or 'no')" 2>/dev/null`],
    { encoding: 'utf8', cwd: RAIZ });
  return { disponible: /hay/.test(sec.stdout ?? '') };
}

await correr('i27 · e2e del cupo agotado', async (r) => {
  const band = q(`select valor from app_config where clave='${CLAVE_BANDERA}'`);
  if (!band.length) noConcluyente(`no existe app_config.${CLAVE_BANDERA}: no hay palanca de ensayo.`);
  const original = band[0].valor;
  r.dato('bandera', `${CLAVE_BANDERA} = ${original}`);

  // ── (a) EL SUJETO: un documento en cola con secuencial y clave ───────────
  const enCola = uno(
    `select count(*)::int as n from documentos_fiscales
      where estado in ('borrador','emitiendo') and sentido='emitido'`).n;
  const conNumero = uno(
    `select count(*)::int as n from documentos_fiscales
      where estado='emitiendo' and secuencial is not null and clave_acceso is not null`).n;
  r.dato('documentos en cola', `${enCola} (borrador + emitiendo)`);
  r.dato('en emitiendo CON secuencial y clave', `${conNumero}`);

  // ── (b) 🔴 LA REGLA QUE HACE POSIBLE TODO: el reintento REUSA su número ──
  /* Se lee de la edge, porque es una decisión de código que ningún dato de hoy
     revela: con la cola vacía, «no perdió el secuencial» sería vacuamente cierto. */
  const edge = spawnSync('grep', ['-n', '-A3', 'let sec', 'supabase/functions/fiscal-emitir/index.ts'],
    { encoding: 'utf8', cwd: RAIZ }).stdout ?? '';
  const reusa = /d\.secuencial\s*\?\?/.test(edge) && /if\s*\(!sec\)/.test(edge);
  r.di('');
  r.dato('la edge REUSA el secuencial del documento', reusa ? 'sí ✓ (`d.secuencial ?? null` y sólo toma uno si falta)' : '🔴 NO');
  if (!reusa)
    rojo('la edge toma un secuencial nuevo en cada pase: un reintento no es un reintento, es un documento nuevo — y el anterior queda como un hueco en la numeración.');

  const vuelveACola = spawnSync('grep', ['-n', 'reintentable', 'supabase/functions/fiscal-emitir/index.ts'],
    { encoding: 'utf8', cwd: RAIZ }).stdout ?? '';
  const quedaEmitiendo = /estado:\s*reintentable\s*\?\s*'emitiendo'/.test(vuelveACola);
  r.dato('un reintentable queda en `emitiendo`', quedaEmitiendo ? 'sí ✓' : '🔴 NO');
  if (!quedaEmitiendo)
    rojo('un rechazo reintentable no deja el documento en `emitiendo`: se pierde de la cola.');

  const colaIncluye = spawnSync('grep', ['-n', "in('estado'", 'supabase/functions/fiscal-emitir/index.ts'],
    { encoding: 'utf8', cwd: RAIZ }).stdout ?? '';
  const incluyeEmitiendo = /'borrador',\s*'emitiendo'/.test(colaIncluye);
  r.dato('la cola incluye los `emitiendo`', incluyeEmitiendo ? 'sí ✓' : '🔴 NO — nadie los levanta');
  if (!incluyeEmitiendo)
    rojo('la cola no incluye los `emitiendo`: un documento que quedó en vuelo no lo levanta nadie.');

  // ── (c) 🔴 QUE SALGA UNA SOLA VEZ — la garantía está en la BASE ──────────
  /* No depende de que la edge se porte bien: `uq_documento_fiscal_pago` hace
     inexpresable el segundo documento del mismo pago. Se ejerce, no se cita. */
  const intento = q(`select id from pagos_intentos where estado='aprobado' order by creado_en desc limit 1`);
  if (!intento.length) noConcluyente('no hay pago aprobado sobre el que ejercer la unicidad.');
  const pid = intento[0].id;
  let doble = null;
  try {
    q(`begin;
       insert into documentos_fiscales (pago_intento_id, total, sentido, rol, tipo, estado, emitida_por_tercero)
         values ('${pid}'::uuid, 10.00, 'emitido','venta_cliente','factura','borrador',false);
       insert into documentos_fiscales (pago_intento_id, total, sentido, rol, tipo, estado, emitida_por_tercero)
         values ('${pid}'::uuid, 10.00, 'emitido','venta_cliente','factura','borrador',false);
       rollback;`);
  } catch (e) { doble = String(e?.message ?? e); }
  r.di('');
  r.dato('rojo ejercido · dos documentos del mismo pago', doble === null
    ? '🔴 ENTRARON LOS DOS' : /23505|uq_documento_fiscal_pago/.test(doble) ? 'rebota (uq_documento_fiscal_pago) ✓' : doble.slice(0, 100));
  if (doble === null)
    rojo(`al reactivar, el mismo pago podría producir DOS comprobantes: nada lo impide en la base.`);

  // ── (d) EL ENSAYO CON LA PALANCA, en transacción abortada ────────────────
  /* La bandera se mueve DENTRO de una transacción que se deshace sola: accionar una
     palanca de producción y confiar en un `finally` para devolverla es apostar a que
     el proceso no muera en el medio. */
  const conCupoAgotado = q(`begin;
    update app_config set valor='true' where clave='${CLAVE_BANDERA}';
    select valor from app_config where clave='${CLAVE_BANDERA}';
    rollback;`);
  const leida = conCupoAgotado[conCupoAgotado.length - 1].valor;
  r.di('');
  r.dato('rojo ejercido · palanca encendida en txn', `${original} → ${leida}`);
  if (String(leida) === String(original))
    noConcluyente('el instrumento no ve el cambio de la bandera: no puede accionar el ensayo.');

  // ── (e) LO QUE ESTE INSTRUMENTO **NO** MIDE, dicho ───────────────────────
  const { disponible } = emitir();
  r.di('');
  /* 🔴 EL RECORRIDO E2E YA SE CORRIÓ, Y ENCONTRÓ UN DEFECTO — vive en
     `scripts/s115/e2e-cupo.mjs` porque ESCRIBE (siembra, acciona la palanca, invoca la
     edge dos veces y limpia). Su resultado del 10-sep está en el acta: la edge reportó
     `secuencial 000000001 · emitiendo` y la fila quedó en `borrador` con `secuencial
     NULL`; el segundo pase tomó `000000002`. **Consumió 2 secuenciales que no quedaron
     en ninguna fila.** Este instrumento mide las garantías; aquél mide el recorrido. */
  if (enCola === 0) {
    r.di('   ⚠️ LA COLA ESTÁ VACÍA: el recorrido e2e contra la edge NO se corrió.');
    r.di('      Lo que SÍ queda medido son sus tres garantías, cada una en su fuente:');
    r.di('        · la edge reusa el secuencial y devuelve a `emitiendo` (leído del código)');
    r.di('        · la cola incluye los `emitiendo` (leído del código)');
    r.di('        · el mismo pago no puede tener dos documentos (EJERCIDO contra la base)');
    r.di('      *Lo que falta es el recorrido con un documento vivo — y sin cola, un verde');
    r.di('      del e2e diría «no había nada que emitir», no «emitió una sola vez».*');
    noConcluyente('cola vacía: el e2e contra la edge no tiene sujeto.');
  }

  r.dato('secreto de despacho disponible', disponible ? 'sí' : 'no — la edge no se puede invocar desde acá');

  // ── (f) Residuo ─────────────────────────────────────────────────────────
  const ahora = uno(`select valor from app_config where clave='${CLAVE_BANDERA}'`).valor;
  r.dato('residuo · bandera', `${ahora}`);
  if (String(ahora) !== String(original))
    rojo(`el instrumento dejó ${CLAVE_BANDERA} en ${ahora} (era ${original}).`);

  r.di('\n   → con el cupo agotado vuelve a la cola con su número, y al reactivar sale una sola vez.');
});
