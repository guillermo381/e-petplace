#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EL SELLO DEL RELOJ F1 — esperar el tick DESATENDIDO y decir qué pasó
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Por qué existe.** A curó el CHECK que hacía abortar `expirar_objetos_sin_cierre`
 * y **ejercitó la función a mano** (`ok:true`). Eso prueba **la función**.
 * *«Corrió a mano» y «el cron corre» son dos afirmaciones distintas*: el lazo lo
 * prueba un tick de `0 * * * *` que nadie disparó.
 *
 * ── 🔴 LA LECCIÓN QUE ESTE ARCHIVO LLEVA ADENTRO, y me la cobré yo ──────
 * La primera versión vivía en `/tmp` e importaba `./scripts/lib-db.mjs`. **Un
 * import de ESM se resuelve contra el ARCHIVO, no contra el cwd** ⇒ murió con
 * `ERR_MODULE_NOT_FOUND`… **y salió con código 1**, que en mi propio contrato
 * significaba *«el tick falló»*.
 *
 * **El fallo del instrumento se disfrazó del hallazgo exacto que el instrumento
 * buscaba.** Sin abrir el archivo de salida, el parte habría dicho *«el reloj
 * volvió a caer»* — un rojo del instrumento leído como rojo del producto, sobre
 * un tick que ni siquiera había ocurrido.
 *
 * **La cura no es la ruta: es que los códigos no se pisen.**
 *   · 0 → hubo tick y fue `succeeded`  ⇒ el LAZO está sano
 *   · 1 → hubo tick y NO fue succeeded ⇒ rojo del PRODUCTO
 *   · 2 → no hubo tick, o el instrumento no pudo mirar ⇒ NO CONCLUYENTE
 * *Un instrumento que puede fallar con el mismo código que su hallazgo no está
 * midiendo: está adivinando.*
 *
 * ⚠️ Y emite en **cualquier** estado terminal, no sólo en éxito: un filtro que
 * mira sólo el éxito **se queda mudo si vuelve a fallar**, y ese silencio se lee
 * igual que «todavía no corrió».
 */
import { dbQuery } from '../lib-db.mjs';

const CORTE = process.argv[2] ?? '2026-09-10 06:00:00+00';
const VUELTAS = 60;          // 30 min a 30 s
let pudoMirar = false;

for (let i = 0; i < VUELTAS; i += 1) {
  try {
    const r = dbQuery(`
      select status, start_time::text t, left(coalesce(return_message,''),90) m
        from cron.job_run_details d join cron.job j on j.jobid = d.jobid
       where j.jobname = 'expirar-objetos-sin-cierre'
         and d.start_time >= '${CORTE}'::timestamptz
       order by d.start_time limit 1`);
    pudoMirar = true;
    if (r.length) {
      const x = r[0];
      const ok = x.status === 'succeeded';
      console.log(`${ok ? '🟢 TICK SUCCEEDED' : '🔴 TICK ' + String(x.status).toUpperCase()} · ${String(x.t).slice(0, 19)} · ${x.m}`);
      console.log(ok
        ? '   ⇒ el LAZO está sano: corrió solo, sin que nadie lo disparara.'
        : '   ⇒ ROJO DEL PRODUCTO: el reloj volvió a fallar sin intervención.');
      process.exit(ok ? 0 : 1);
    }
  } catch (e) {
    /* Un rebote de conexión no mata la espera — pero tampoco cuenta como
       «miré y no había». Por eso `pudoMirar` sólo se marca cuando la consulta
       de verdad respondió. */
    console.error(`   (rebote al consultar, sigo: ${String(e.message).slice(0, 80)})`);
  }
  await new Promise((s) => { setTimeout(s, 30000); });
}

console.log(pudoMirar
  ? `🟠 NO CONCLUYENTE · no apareció ningún tick posterior a ${CORTE} en 30 min.`
  : `🟠 NO CONCLUYENTE · el instrumento nunca pudo consultar la base.`);
console.log('   Un cron que se saltea una hora YA es un hallazgo — pero no es');
console.log('   el mismo hallazgo que un tick fallido, y no se reportan igual.');
process.exit(2);
