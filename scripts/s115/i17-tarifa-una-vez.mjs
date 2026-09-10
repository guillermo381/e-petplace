/**
 * S115-E · INSTRUMENTO 17 — LA TARIFA DE SERVICIO: UNA VEZ POR PAGO, CON SU IVA.
 *
 * QUÉ MIDE: que la tarifa se cobre **una sola vez por pago**, no una por ítem, y que
 * lleve su IVA. Cobrarla por ítem no rompe nada visible: un carrito de tres productos
 * sale un poco más caro, y nadie lo nota hasta que un cliente suma.
 *
 * ROJO: un carrito de TRES ítems que la cobre tres veces.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

await correr('i17 · la tarifa de servicio: una vez por pago, con su IVA', async (r) => {
  const fn = q(
    `select pg_get_function_identity_arguments(p.oid) as args
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and proname='tarifa_servicio_vigente'`);
  if (!fn.length) noConcluyente('tarifa_servicio_vigente no existe: no hay tarifa que medir.');
  r.dato('función', `tarifa_servicio_vigente(${fn[0].args})`);

  // ── (a) ¿ESTÁ VIGENTE? ───────────────────────────────────────────────────
  const vig = uno(`select tarifa_servicio_vigente() as r`).r;
  r.dato('estado', JSON.stringify(vig));

  // ── (b) 🔴 ¿QUIÉN LA COBRA? Motor sin puerta es un defecto propio ────────
  const consumidores = q(
    `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and pg_get_functiondef(p.oid) ~ 'tarifa_servicio_vigente'
        and proname <> 'tarifa_servicio_vigente' order by 1`);
  r.dato('consumidores en el motor', consumidores.length ? consumidores.map((x) => x.proname).join(', ') : '🔴 NINGUNO');

  const enLineas = uno(
    `select count(*)::int as n from pagos_desglose_lineas where origen_tipo ~* 'tarifa|servicio_fee'`).n;
  r.dato('líneas de tarifa escritas', `${enLineas}`);

  if (!consumidores.length) {
    r.di('\n   ⚠️ LA TARIFA EXISTE Y NADIE LA COBRA — motor sin puerta (L-318).');
    r.di('      «Aparece una vez por pago» es hoy vacuamente cierto: aparece CERO veces.');
    r.di('      *Un verde sobre una regla que nada ejerce no dice que la regla se cumple:');
    r.di('      dice que no hay nada que la incumpla.* Se declara, no se cuenta como verde.');
    noConcluyente('ninguna función del motor llama a tarifa_servicio_vigente: la regla no se puede ejercer.');
  }

  // ── (c) LA MEDICIÓN sobre pagos reales: una línea por pago, jamás por ítem ─
  const porPago = q(
    `select pago_intento_id, count(*)::int as veces
       from pagos_desglose_lineas
      where origen_tipo ~* 'tarifa|servicio_fee'
      group by 1 having count(*) > 1 limit 10`);
  r.di('');
  r.dato('pagos con la tarifa MÁS DE UNA vez', `${porPago.length}`);
  if (porPago.length) {
    for (const p of porPago.slice(0, 5)) r.dato('  🔴', `${p.pago_intento_id} → ${p.veces} veces`);
    rojo(`${porPago.length} pago(s) cobran la tarifa más de una vez. En un carrito de N ítems la familia paga N tarifas y nadie lo nota hasta que suma.`);
  }

  // ── (d) CON SU IVA ───────────────────────────────────────────────────────
  const sinIva = uno(
    `select count(*)::int as n from pagos_desglose_lineas
      where origen_tipo ~* 'tarifa|servicio_fee' and (codigo_iva is null or tarifa_pct is null)`).n;
  r.dato('líneas de tarifa sin IVA declarado', `${sinIva}`);
  if (sinIva > 0) rojo(`${sinIva} línea(s) de tarifa sin codigo_iva o sin tarifa_pct: la tarifa viaja sin su impuesto.`);

  r.di('\n   → una tarifa por pago, con su IVA.');
});
