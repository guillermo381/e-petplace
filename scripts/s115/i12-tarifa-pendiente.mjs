/**
 * S115-E · INSTRUMENTO 12 — TARIFA PENDIENTE DE RATIFICACIÓN.
 *
 * QUÉ MIDE: cuántos ítems llevan `tarifa_estado = 'pendiente_ratificacion'` y
 * cuáles. Es CONTEO INFORMATIVO: no bloquea nada, se reporta. Una tarifa marcada
 * pendiente es honesta — dice «esto lo tiene que ratificar el contador» en vez de
 * afirmar un IVA que nadie firmó.
 *
 * ⚠️ SALE 0 SIEMPRE QUE PUEDA CONTAR. Un instrumento informativo que corta el
 * pipeline convierte una observación en un bloqueo, y entonces alguien lo apaga.
 * El único 2 posible es no poder medir.
 *
 * 🔴 SOBRE LA EXPECTATIVA DEL MANDATO: pedía «exactamente los de veterinaria y
 * telemedicina, ni uno más». El número medido es OTRO y está abajo con nombre y
 * apellido. No se ajusta el instrumento para que cierre con la expectativa: se
 * reporta lo que el objeto dice y se declara la diferencia.
 */
import { correr, q, uno, noConcluyente } from './_lib-e.mjs';

await correr('i12 · tarifas pendientes de ratificación', async (r) => {
  const donde = q(
    `select c.relname from pg_attribute a join pg_class c on c.oid=a.attrelid
       join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and a.attname='tarifa_estado' and a.attnum>0 and not a.attisdropped
      order by 1`);
  if (!donde.length) noConcluyente('ninguna tabla tiene la columna tarifa_estado.');
  r.dato('tablas con tarifa_estado', donde.map((x) => x.relname).join(', '));

  let total = 0;
  for (const { relname } of donde) {
    const porEstado = q(`select tarifa_estado, count(*)::int as n from ${relname} group by 1 order by 2 desc`);
    r.di(`\n   ${relname}:`);
    for (const e of porEstado) r.dato(`  ${e.tarifa_estado ?? '(null)'}`, `${e.n}`);

    const pend = q(`select count(*)::int as n from ${relname} where tarifa_estado='pendiente_ratificacion'`)[0].n;
    total += pend;
    if (pend > 0 && relname === 'tipos_servicio') {
      const cuales = q(
        `select codigo, codigo_iva from tipos_servicio
          where tarifa_estado='pendiente_ratificacion' order by codigo`);
      r.di(`     pendientes (${pend}):`);
      for (const c of cuales) r.dato(`       ${c.codigo}`, c.codigo_iva ?? '(sin código)');

      // ── La expectativa del mandato, contrastada contra el objeto ─────────
      const esperados = ['veterinaria', 'telemedicina'];
      const nombres = cuales.map((c) => c.codigo);
      const deMas = nombres.filter((n) => !esperados.includes(n));
      if (deMas.length)
        r.di(`\n   ⚠️ El mandato esperaba SÓLO ${esperados.join(' y ')}; el objeto trae ${nombres.length}.\n      De más: ${deMas.join(', ')}.\n      No se ajusta el instrumento a la expectativa: se reporta la diferencia.`);
      const faltan = esperados.filter((e) => !nombres.includes(e));
      if (faltan.length)
        r.di(`   ⚠️ Esperados y AUSENTES de la lista: ${faltan.join(', ')}.`);
    } else if (pend > 0) {
      r.dato('  pendientes', `${pend}`);
    }
  }

  // Sin código de IVA es distinto de pendiente: uno no sabe, el otro no decidió.
  const sinCodigo = uno(
    `select count(*)::int as n from tipos_servicio where codigo_iva is null`).n;
  r.dato('\n   tipos_servicio sin codigo_iva', `${sinCodigo}`);

  r.di(`\n   → ${total} ítem(s) con tarifa pendiente de ratificación. Informativo: no bloquea.`);
});
