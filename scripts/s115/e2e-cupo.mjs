/**
 * S115-E · EL RECORRIDO E2E DEL CUPO — contra la edge REAL.
 *
 * ⚠️ ESTE SCRIPT ESCRIBE. Siembra un documento, acciona la palanca del cupo, invoca
 * `fiscal-emitir` dos veces y limpia. **Consume un secuencial real** del contador de
 * Satori — es inevitable: el punto de la prueba es que la edge tome uno y después lo
 * REUSE. El número consumido se declara al final, no se esconde.
 *
 * Uso: node scripts/s115/e2e-cupo.mjs
 */
import { dbQuery } from '../lib-db.mjs';
import { spawnSync } from 'node:child_process';

const REF = 'zyltipqscdsdsxnjclhp';
const URL = `https://${REF}.supabase.co/functions/v1/fiscal-emitir`;
const paso = (n, t) => console.log(`\n── ${n} · ${t}`);
const j = (x) => JSON.stringify(x);

// El secreto se lee del llavero AL MOMENTO y no se imprime jamás.
const sec = spawnSync('security', ['find-generic-password', '-s', 'epetplace-despacho-secret', '-w'], { encoding: 'utf8' });
if (sec.status !== 0) { console.log('⚪ NO CONCLUYENTE · no está el secreto de despacho en el llavero'); process.exit(2); }
const SECRETO = sec.stdout.trim();

const llamar = () => {
  const r = spawnSync('curl', ['-sS', '-X', 'POST', URL, '-H', `x-despacho-secret: ${SECRETO}`,
    '-H', 'Content-Type: application/json', '-d', '{}', '--max-time', '120'], { encoding: 'utf8' });
  try { return JSON.parse(r.stdout); } catch { return { crudo: (r.stdout || r.stderr || '').slice(0, 300) }; }
};

let sujeto = null, docId = null;
try {
  // ── ⓪ el sujeto ────────────────────────────────────────────────────────
  paso('⓪', 'el sujeto');
  const c = dbQuery(`select pi.id, pi.monto from pagos_intentos pi
     where pi.estado='aprobado' and (pi.compra_id is not null or pi.pedido_id is not null)
       and not exists (select 1 from documentos_fiscales d where d.pago_intento_id = pi.id)
     order by pi.creado_en desc limit 1`);
  if (!c.length) { console.log('⚪ no hay pago aprobado sin documento'); process.exit(2); }
  sujeto = c[0].id;
  const antes = dbQuery(`select ultimo_secuencial from fiscal_sequences where tipo_documento='factura' limit 1`)[0].ultimo_secuencial;
  console.log(`   pago ${sujeto} · $${c[0].monto} · contador de facturas ANTES: ${antes}`);

  // Las líneas y el documento en borrador — por las puertas reales.
  dbQuery(`select escribir_lineas_del_intento('${sujeto}'::uuid)`);
  const lineas = dbQuery(`select count(*)::int n from pagos_desglose_lineas where pago_intento_id='${sujeto}'::uuid`)[0].n;
  dbQuery(`update pagos_intentos set estado='pendiente' where id='${sujeto}'::uuid`);
  dbQuery(`update pagos_intentos set estado='aprobado' where id='${sujeto}'::uuid`);   // dispara el outbox
  const d = dbQuery(`select id, estado, secuencial, clave_acceso from documentos_fiscales where pago_intento_id='${sujeto}'::uuid`);
  if (!d.length) { console.log('⚪ el outbox no creó el documento'); process.exit(2); }
  docId = d[0].id;
  console.log(`   ${lineas} línea(s) · documento ${docId} en «${d[0].estado}»`);
  if (d[0].estado !== 'borrador') {
    console.log(`   ⚠️ nació en «${d[0].estado}», no en borrador — se lo lleva a borrador para el ensayo`);
    dbQuery(`update documentos_fiscales set estado='borrador', motivo_rechazo=null where id='${docId}'::uuid`);
  }

  // ── ① cupo agotado ─────────────────────────────────────────────────────
  paso('①', 'con el cupo AGOTADO');
  dbQuery(`update app_config set valor='true' where clave='fiscal_simular_cupo_agotado'`);
  const r1 = llamar();
  console.log(`   edge → ${j(r1).slice(0, 220)}`);
  const e1 = dbQuery(`select estado::text, secuencial, clave_acceso, motivo_rechazo from documentos_fiscales where id='${docId}'::uuid`)[0];
  console.log(`   documento → estado=${e1.estado} · secuencial=${e1.secuencial} · clave=${String(e1.clave_acceso).slice(0,12)}… · motivo=${e1.motivo_rechazo}`);

  const vuelveConNumero = e1.estado === 'emitiendo' && e1.secuencial && e1.clave_acceso;
  console.log(`   ① ${vuelveConNumero ? '🟢 vuelve a la cola CON su secuencial y su clave' : '🔴 NO conservó número o no quedó en cola'}`);

  // ── ② reactivar ────────────────────────────────────────────────────────
  paso('②', 'reactivando: tiene que salir UNA sola vez');
  dbQuery(`update app_config set valor='false' where clave='fiscal_simular_cupo_agotado'`);
  const r2 = llamar();
  console.log(`   edge → ${j(r2).slice(0, 220)}`);
  const e2 = dbQuery(`select estado::text, secuencial, clave_acceso from documentos_fiscales where id='${docId}'::uuid`)[0];
  const cuantos = dbQuery(`select count(*)::int n from documentos_fiscales where pago_intento_id='${sujeto}'::uuid`)[0].n;
  console.log(`   documento → estado=${e2.estado} · secuencial=${e2.secuencial}`);
  console.log(`   documentos para ese pago: ${cuantos}`);

  /* 🔴 `null === null` NO ES «reusó el secuencial»: es que no hubo secuencial ninguna
     de las dos veces. La primera versión comparó los dos nulls y publicó 🟢 REUSÓ —
     un falso verde sobre el defecto más grave que este e2e vino a buscar. */
  const hubo = e1.secuencial != null && e2.secuencial != null;
  const mismoNumero = hubo && String(e1.secuencial) === String(e2.secuencial);
  const unoSolo = cuantos === 1;
  console.log(`   ② ${unoSolo ? '🟢 salió UNA sola vez' : `🔴 hay ${cuantos} documentos para el mismo pago`}`);
  console.log(`   ② ${!hubo ? `🔴 el documento NUNCA tuvo secuencial (${e1.secuencial} → ${e2.secuencial}) — no hay reúso que medir`
      : mismoNumero ? '🟢 REUSÓ su secuencial' : `🔴 cambió de secuencial: ${e1.secuencial} → ${e2.secuencial}`}`);
  const consumidos = Number(dbQuery(`select ultimo_secuencial from fiscal_sequences where tipo_documento='factura' limit 1`)[0].ultimo_secuencial) - Number(antes);
  if (!hubo && consumidos > 0)
    console.log(`   🔴 Y LA EDGE CONSUMIÓ ${consumidos} SECUENCIAL(ES) que no quedaron en ninguna fila:\n` +
                `      cada pase toma número, reporta haberlo persistido, y la fila sigue sin él.\n` +
                `      *Son huecos en la numeración fiscal que hay que explicarle al SRI.*`);

  const despues = dbQuery(`select ultimo_secuencial from fiscal_sequences where tipo_documento='factura' limit 1`)[0].ultimo_secuencial;
  console.log(`\n   contador de facturas: ${antes} → ${despues} (consumió ${Number(despues) - Number(antes)})`);

  const ok = vuelveConNumero && unoSolo && mismoNumero;
  console.log(`\n${ok ? '🟢 E2E VERDE' : '🔴 E2E ROJO'} · cupo agotado → cola con número → reactivar → una sola vez`);
  process.exitCode = ok ? 0 : 1;
} finally {
  // ── limpieza, pase lo que pase ─────────────────────────────────────────
  paso('③', 'limpieza');
  try { dbQuery(`update app_config set valor='false' where clave='fiscal_simular_cupo_agotado'`); } catch {}
  if (docId) { try { dbQuery(`delete from documentos_fiscales where id='${docId}'::uuid`); } catch (e) { console.log('   ⚠️ no se pudo borrar el documento:', String(e.message).slice(0,90)); } }
  if (sujeto) { try { dbQuery(`delete from pagos_desglose_lineas where pago_intento_id='${sujeto}'::uuid`); } catch {} }
  const resto = dbQuery(`select (select count(*) from documentos_fiscales)::int docs,
     (select valor from app_config where clave='fiscal_simular_cupo_agotado') bandera`)[0];
  console.log(`   residuo → documentos=${resto.docs} · bandera=${resto.bandera}`);
}
