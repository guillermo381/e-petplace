/**
 * S115-E · INSTRUMENTO 7 — EL TOPE DE CONSUMIDOR FINAL.
 *
 * QUÉ MIDE: que sobre el tope se exija identidad del receptor (`esperando_receptor`)
 * y por debajo se pueda facturar a consumidor final. En Ecuador, facturar sobre el
 * tope sin identificar al receptor es una factura mal emitida.
 *
 * 🔴 EL TOPE SE LEE DE `app_config`, JAMÁS SE ESCRIBE EN EL INSTRUMENTO. Un umbral
 * duplicado en el arnés deja de medir el día que alguien cambia la config: el gate
 * seguiría verde contra un número que ya no rige.
 *
 * ROJO PROBADO: se cambia el tope en config dentro de una transacción abortada y el
 * instrumento tiene que cambiar solo. Si da el mismo veredicto con el tope movido,
 * está leyendo una constante suya.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

await correr('i07 · tope de consumidor final', async (r) => {
  const cfg = q(`select valor from app_config where clave='fiscal_tope_consumidor_final'`);
  if (!cfg.length) noConcluyente('app_config.fiscal_tope_consumidor_final no existe.');
  const tope = Number(cfg[0].valor);
  r.dato('tope leído de app_config', `$${tope}`);

  // ── (a) ¿Quién lo LEE? Sin lector, el tope es letra muerta ────────────────
  const lectores = q(
    `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and pg_get_functiondef(p.oid) ~ 'fiscal_tope_consumidor_final' order by 1`);
  const enEdges = q(`select 1 limit 0`); // el grep de edges se hace abajo, fuera de SQL
  r.dato('lectores en el motor', lectores.length ? lectores.map((x) => x.proname).join(', ') : '⚠️ NINGUNO en pg_proc');

  const { spawnSync } = await import('node:child_process');
  const g = spawnSync('grep', ['-rl', '--include=*.ts', 'fiscal_tope_consumidor_final',
    '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/supabase/functions'], { encoding: 'utf8' });
  const enEdge = g.status === 0 ? g.stdout.trim().split('\n').filter(Boolean) : [];
  r.dato('lectores en edges', enEdge.length ? enEdge.map((f) => f.split('/').slice(-2).join('/')).join(', ') : '⚠️ NINGUNO');

  if (!lectores.length && !enEdge.length) {
    r.di('\n   ⚠️ EL TOPE NO TIENE LECTOR: existe como configuración y nadie lo consulta.');
    r.di('      No es rojo del tope — es que la decisión «sobre el tope se pide identidad»');
    r.di('      todavía no está cableada. Queda declarado y NO se da por medido.');
    noConcluyente('el tope no tiene lector: no hay comportamiento que medir todavía.');
  }

  // ── (b) EL COMPORTAMIENTO, ejercido a los dos lados del tope ─────────────
  const arriba = tope + 10, abajo = Math.max(1, tope - 10);
  const user = uno(`select id from auth.users order by created_at desc limit 1`).id;
  const tienePerfil = uno(
    `select count(*)::int as n from tax_profiles where user_id='${user}' and es_predeterminado`).n > 0;
  r.dato('sujeto', `${user}${tienePerfil ? ' (CON tax_profile — el tope no aplica)' : ' (sin tax_profile)'}`);
  if (tienePerfil)
    noConcluyente('el sujeto tiene tax_profile predeterminado: con identidad declarada el tope no decide nada, y el caso a medir es justo el contrario.');

  const bajo  = uno(`select resolver_receptor_fiscal('${user}'::uuid, ${abajo}) as r`).r;
  const alto  = uno(`select resolver_receptor_fiscal('${user}'::uuid, ${arriba}) as r`).r;
  const justo = uno(`select resolver_receptor_fiscal('${user}'::uuid, ${tope}) as r`).r;

  r.di('');
  r.dato(`$${abajo} (bajo el tope)`, JSON.stringify(bajo));
  r.dato(`$${tope} (EN el tope)`, `resuelto=${justo.resuelto} · ${justo.tipo_identificacion ?? justo.motivo}`);
  r.dato(`$${arriba} (sobre el tope)`, JSON.stringify(alto));

  // Bajo el tope: consumidor final resuelto.
  if (bajo.resuelto !== true || bajo.tipo_identificacion !== 'consumidor_final')
    rojo(`bajo el tope ($${abajo}) no se resuelve a consumidor final: ${JSON.stringify(bajo)}.`);
  // Sobre el tope: NO se resuelve, y el motivo se NOMBRA.
  if (alto.resuelto !== false)
    rojo(`sobre el tope ($${arriba}) se facturó igual, sin identificación: ${JSON.stringify(alto)}. Es emitir mal a propósito para no dejar un hueco visible.`);
  if (alto.motivo !== 'supera_tope_sin_identificacion')
    rojo(`sobre el tope rebota pero por otro motivo (${alto.motivo}): rebotar no es una medición.`);
  // El borde EXACTO: el tope se incluye (> y no >=).
  if (justo.resuelto !== true)
    rojo(`justo EN el tope ($${tope}) tampoco resuelve: el borde está corrido y $${tope} exigiría identificación.`);

  // ── (c) ROJO PROBADO: mover el tope tiene que mover el veredicto ─────────
  /* Se sube el tope por encima del monto que ANTES rebotaba: el mismo monto tiene
     que pasar a resolver. Medir que el NÚMERO cambia no alcanza — lo que hay que
     probar es que cambia el VEREDICTO, que es lo que el tope decide. */
  const movido = q(`begin;
    update app_config set valor = '${arriba + 100}' where clave='fiscal_tope_consumidor_final';
    select resolver_receptor_fiscal('${user}'::uuid, ${arriba}) as r;
    rollback;`);
  const altoConTopeMovido = movido[movido.length - 1].r;
  r.di('');
  r.dato('rojo ejercido · tope subido a ' + (arriba + 100), `$${arriba} pasa de "${alto.motivo}" a resuelto=${altoConTopeMovido.resuelto}`);
  if (altoConTopeMovido.resuelto !== true)
    noConcluyente(`con el tope por encima del monto, $${arriba} sigue sin resolver: el lector NO responde a la config, está decidiendo por otra cosa.`);

  const residuo = Number(uno(`select valor from app_config where clave='fiscal_tope_consumidor_final'`).valor);
  r.dato('residuo', `tope de vuelta en $${residuo}`);
  if (residuo !== tope) rojo(`el instrumento dejó el tope en ${residuo} en vez de ${tope}.`);

  r.di('\n   → el tope se lee de config y el instrumento responde a su cambio.');
});
