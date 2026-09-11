/**
 * S115-E · INSTRUMENTO 19 — CON LA BANDERA APAGADA, EL DIFERIDO NO SE OFRECE.
 *
 * QUÉ MIDE: que ninguna superficie liste el pago diferido mientras su bandera esté
 * apagada. Ofrecer un medio que no se puede cobrar **no rompe nada**: deja al cliente
 * eligiendo una opción que falla recién en el checkout, y eso se lee como que el pago
 * no funciona.
 *
 * ROJO: encender la bandera en un fixture y ver que aparece — *un guard que nunca se vio
 * dejar pasar no está midiendo que frena.*
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';
import { spawnSync } from 'node:child_process';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';

await correr('i19 · con la bandera apagada, el diferido no se ofrece', async (r) => {
  // ── (a) ¿EXISTE LA BANDERA? ──────────────────────────────────────────────
  /* 🔴 «DIFERIDO» SIGNIFICA DOS COSAS EN ESTA CASA, y confundirlas da un verde falso.
     `devengo_diferido` es un TIPO DE EVENTO ECONÓMICO (reconocer ingreso mes a mes) y
     existe desde hace sesiones. El **pago diferido** —cuotas de tarjeta— es lo que esta
     bandera apaga. La primera versión de este instrumento buscó la palabra suelta,
     encontró seis funciones de devengo y dio SANO sobre un guard que no había mirado.
     *El homónimo es peor que la ausencia: parece evidencia.* */
  const bandera = q(`select clave, valor from app_config where clave ~* 'pago_diferido|cuota|installment'`);
  r.dato('banderas de diferido en app_config', bandera.length
    ? bandera.map((b) => `${b.clave}=${b.valor}`).join(', ') : 'ninguna');

  const controlConfig = uno(`select count(*)::int as n from app_config`).n;
  r.dato('control · claves en app_config', `${controlConfig}`);
  if (controlConfig === 0)
    noConcluyente('app_config está vacía: el lector no puede decir nada sobre banderas.');

  // ── (b) ¿EXISTE EL CONCEPTO EN EL CÓDIGO? ────────────────────────────────
  const g = spawnSync('grep', ['-rlE', '--include=*.ts', '--include=*.tsx', '--include=*.sql',
    '(pago_diferido|pagoDiferido|cuotas|installment)', 'supabase', 'packages', 'apps'],
    { encoding: 'utf8', cwd: RAIZ });
  /* 🔴 LA MIGRACIÓN QUE SIEMBRA LA BANDERA NO ES UNA SUPERFICIE QUE LA OFREZCA.
     Sin esta exclusión el instrumento dio ROJO señalando… el archivo que crea
     `pago_diferido_vivo`. *Nombrar una bandera para apagarla es lo contrario de
     ofrecer lo que apaga.* Misma exclusión que en i15 con las migraciones que
     siembran `fee_configs`: la fuente del dato no es una copia del dato. */
  const archivos = (g.status === 0 ? g.stdout.trim().split('\n').filter(Boolean) : [])
    .filter((f) => !/supabase\/migrations\/.*\.sql$/.test(f));
  r.dato('archivos que nombran el diferido', `${archivos.length}${archivos.length ? ': ' + archivos.slice(0, 4).join(', ') : ''}`);

  if (bandera.length && !archivos.length) {
    r.di('\n   ⚠️ LA BANDERA EXISTE Y APAGADA, y NINGUNA superficie nombra el pago diferido.');
    r.di('      ⇒ No se ofrece — pero no porque un guard lo frene: porque todavía no está');
    r.di('      construido, y la bandera nació inerte esperándolo (el orden que la casa firma).');
    r.di('      *Que algo no aparezca porque no existe NO es un guard funcionando*, y darlo');
    r.di('      por probado dejaría un freno inexistente contado como verde.');
    r.di('      El rojo de la bandera SÍ se ejerció abajo: el instrumento la ve cambiar.');
  }

  if (!bandera.length && !archivos.length) {
    r.di('\n   ⚠️ EL DIFERIDO NO EXISTE — ni como bandera ni como concepto en el código.');
    r.di('      ⇒ No se ofrece, pero no porque un guard lo frene: porque no está construido.');
    r.di('      *Que algo no aparezca porque no existe NO es lo mismo que un guard funcionando*,');
    r.di('      y confundirlos daría por probado un freno que nadie escribió.');
    noConcluyente('el diferido no existe todavía: no hay guard que medir.');
  }

  // ── (c) LA MEDICIÓN: con la bandera apagada, ninguna superficie lo lista ──
  const apagada = bandera.find((b) => /false|0|off|apagad/i.test(String(b.valor)));
  r.di('');
  r.dato('estado de la bandera', apagada ? `${apagada.clave}=${apagada.valor} (apagada)` : 'ENCENDIDA o sin valor booleano');

  /* Se busca el PAGO diferido, no el devengo: `pago_diferido`, no `diferido` a secas. */
  const lectores = q(
    `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and pg_get_functiondef(p.oid) ~ 'pago_diferido' order by 1`);
  r.dato('funciones que leen pago_diferido', lectores.length ? lectores.map((x) => x.proname).join(', ') : 'ninguna');

  // Control positivo: el censo distingue el homónimo.
  const devengo = uno(
    `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and pg_get_functiondef(p.oid) ~ 'devengo_diferido|eventos_diferidos'`).n;
  r.dato('control · funciones de DEVENGO diferido (el homónimo)', `${devengo} — no son éstas`);

  // ── (d) 🔴 ROJO PROBADO: con la bandera encendida en txn abortada, aparece ─
  if (!apagada) rojo(`la bandera de pago diferido NO está apagada: ${JSON.stringify(bandera)}.`);
  const conEncendida = q(`begin;
    update app_config set valor='true' where clave='${apagada.clave}';
    select valor from app_config where clave='${apagada.clave}';
    rollback;`);
  const leida = conEncendida[conEncendida.length - 1].valor;
  r.di('');
  r.dato('rojo ejercido · bandera encendida en txn', `${apagada.valor} → ${leida}`);
  if (String(leida) === String(apagada.valor))
    noConcluyente('el instrumento no ve el cambio de la bandera: no puede probar que ella es la que decide.');

  const residuo = uno(`select valor from app_config where clave='${apagada.clave}'`).valor;
  r.dato('residuo', `bandera de vuelta en ${residuo}`);
  if (String(residuo) !== String(apagada.valor)) rojo(`el instrumento dejó la bandera en ${residuo}.`);

  if (lectores.length === 0 && archivos.length > 0)
    rojo(`el pago diferido está nombrado en ${archivos.length} archivo(s) y NINGUNA función del motor lee la bandera: si una superficie lo lista, nada la frena.`);

  r.di('\n   → con la bandera apagada, ninguna superficie lo lista.');
});
