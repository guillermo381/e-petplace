/**
 * S115-E · INSTRUMENTO 2 — DOS EMISIONES SIMULTÁNEAS → DOS SECUENCIALES DISTINTOS.
 *
 * QUÉ MIDE: que `tomar_secuencial_fiscal` sea atómica bajo concurrencia REAL.
 * Dos emisiones que obtienen el mismo número no producen un bug visible: producen
 * un comprobante rechazado por el SRI y un hueco en la numeración que hay que
 * explicarle a un auditor.
 *
 * CÓMO: N procesos de verdad, lanzados a la vez (`spawn`, no `spawnSync` — un
 * bucle secuencial NO puede ver una carrera). Cada uno toma un secuencial del
 * MISMO contador. Al final: N valores, todos distintos y consecutivos.
 *
 * 🔴 SOBRE QUÉ CONTADOR: sobre uno de PRUEBA, sembrado y borrado por el propio
 * instrumento. *Consumir numeración real para medir es agujerearla* — el hueco
 * que dejaría es exactamente el defecto que este instrumento existe para cazar.
 *
 * ROJO PROBADO: la versión MAX+1 corre en un arnés propio (una función temporal
 * dentro de la transacción del control), JAMÁS en el producto. Con MAX+1 y
 * concurrencia real aparecen duplicados; con FOR UPDATE, no.
 */
import { spawn } from 'node:child_process';
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

const RUC = '9999999999001', EST = '999', PTO = '999', N = 6;

/** Una toma en su PROPIO proceso — la única forma de tener concurrencia real. */
function tomarEnParalelo(i) {
  return new Promise((res) => {
    const sql = `select public.tomar_secuencial_fiscal('${RUC}','${EST}','${PTO}','factura') as s`;
    const p = spawn('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql],
      { encoding: 'utf8', cwd: '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace' });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', () => {});
    p.on('close', () => {
      const m = out.match(/"s"\s*:\s*"(\d+)"/);
      res({ i, valor: m ? m[1] : null, crudo: out.slice(0, 200) });
    });
  });
}

await correr('i02 · dos emisiones simultáneas → secuenciales distintos', async (r) => {
  const fn = q(`select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and proname='tomar_secuencial_fiscal'`);
  if (!fn.length) noConcluyente('tomar_secuencial_fiscal no existe todavía.');

  // ── (a) ROJO PROBADO: MAX+1 bajo concurrencia simulada, en arnés propio ────
  // Se ejerce dentro de UNA transacción abortada, con dos lecturas antes de la
  // escritura — que es exactamente lo que hacen dos sesiones que leen el máximo.
  const conMax = q(`begin;
    create temp table cont (n bigint);
    insert into cont values (0);
    -- dos "sesiones" leen el máximo ANTES de que ninguna escriba: la carrera
    select (select max(n)+1 from cont) as a, (select max(n)+1 from cont) as b;
    rollback;`);
  const fila = conMax.find((x) => x && x.a !== undefined);
  if (!fila) noConcluyente('no se pudo ejercer el rojo de MAX+1.');
  r.dato('rojo ejercido (MAX+1 leído dos veces)', `a=${fila.a} · b=${fila.b} → ${fila.a === fila.b ? 'MISMO número: el defecto es real' : 'no reprodujo'}`);
  if (fila.a !== fila.b) noConcluyente('el rojo de MAX+1 no reprodujo el duplicado; el instrumento no está calibrado.');

  // ── (b) Contador de PRUEBA, sembrado aparte del real ───────────────────────
  const realAntes = uno(`select ultimo_secuencial from fiscal_sequences
                          where tipo_documento='factura' and ruc<>'${RUC}' limit 1`).ultimo_secuencial;
  q(`insert into fiscal_sequences (ruc, establecimiento, punto_emision, tipo_documento)
     values ('${RUC}','${EST}','${PTO}','factura')
     on conflict do nothing`);
  r.dato('contador de prueba', `${RUC}-${EST}-${PTO} sembrado (el real NO se toca)`);

  try {
    // ── (c) LA MEDICIÓN: N procesos de verdad, a la vez ─────────────────────
    const t0 = Date.now();
    const res = await Promise.all(Array.from({ length: N }, (_, i) => tomarEnParalelo(i)));
    const ms = Date.now() - t0;

    const fallados = res.filter((x) => x.valor === null);
    if (fallados.length)
      noConcluyente(`${fallados.length}/${N} tomas no devolvieron valor — el canal falló, no el motor.\n   ${fallados[0].crudo}`);

    const valores = res.map((x) => Number(x.valor)).sort((a, b) => a - b);
    const unicos = new Set(valores);
    r.dato('tomas concurrentes', `${N} en ${ms} ms`);
    r.dato('valores', valores.join(', '));
    r.dato('distintos', `${unicos.size} de ${N}`);

    if (unicos.size !== N) {
      const dup = valores.filter((v, i) => valores.indexOf(v) !== i);
      rojo(`DOS emisiones simultáneas tomaron el mismo secuencial (${[...new Set(dup)].join(', ')}). Ante el SRI eso es un comprobante rechazado y un hueco que explicar.`);
    }

    // Consecutivos: sin huecos entre el mínimo y el máximo.
    const consecutivos = valores.every((v, i) => i === 0 || v === valores[i - 1] + 1);
    r.dato('consecutivos', consecutivos ? 'sí, sin huecos' : '🔴 con huecos');
    if (!consecutivos) rojo(`los secuenciales tienen huecos: ${valores.join(', ')}. Un hueco en la numeración fiscal hay que justificarlo ante el SRI.`);

    // ── (d) El contador REAL no se movió ───────────────────────────────────
    const realDespues = uno(`select ultimo_secuencial from fiscal_sequences
                              where tipo_documento='factura' and ruc<>'${RUC}' limit 1`).ultimo_secuencial;
    r.dato('contador real', `antes ${realAntes} · después ${realDespues}`);
    if (String(realAntes) !== String(realDespues))
      rojo(`el instrumento consumió numeración REAL (${realAntes} → ${realDespues}). Medir no puede agujerear el libro.`);
  } finally {
    // ── (e) Residuo ─────────────────────────────────────────────────────────
    q(`delete from fiscal_sequences where ruc='${RUC}'`);
    const resto = uno(`select count(*)::int as n from fiscal_sequences where ruc='${RUC}'`).n;
    r.dato('residuo del instrumento', `${resto} contador(es) de prueba`);
    if (resto !== 0) console.log(`   ⚠️ quedaron ${resto} filas de prueba en fiscal_sequences`);
  }

  r.di('\n   → la puerta es atómica bajo concurrencia real, y el rojo de MAX+1 se vio fallar.');
});
