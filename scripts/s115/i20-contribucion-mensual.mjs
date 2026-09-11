/**
 * S115-E · INSTRUMENTO 20 — REPORTE MENSUAL DE CONTRIBUCIÓN, MEDIDO DEL OBJETO.
 *
 * 🔴 ES UN INSTRUMENTO DE LECTURA Y SE DECLARA COMO TAL: **no tiene rojo y no puede
 * fallar por el producto.** Sale 0 si pudo leer y 2 si no pudo — nunca 1.
 * *Un lector que además juzga se apaga el día que a alguien no le gusta el número.*
 *
 * QUÉ REPORTA, todo del objeto y NADA del Excel: GMV · ingreso de plataforma · costo
 * del riel · variables · contribución · y la mezcla de medios de pago.
 *
 * Y por qué importa que salga del objeto: un P&L que se arma a mano diverge del motor
 * sin que nadie lo note — el precedente de la casa es `D-759`, donde el ingreso
 * proyectado estaba inflado un orden de magnitud porque el tablero multiplicaba GMV
 * por una tasa que ya no regía.
 */
import { correr, q, uno, noConcluyente } from './_lib-e.mjs';

const $ = (x) => `$${Number(x ?? 0).toFixed(2)}`;

await correr('i20 · contribución mensual (lectura, sin rojo)', async (r) => {
  const hay = uno(`select count(*)::int as n from eventos_economicos`).n;
  if (hay === 0) noConcluyente('no hay eventos económicos: no hay nada que reportar.');

  // ── GMV, ingreso, riel y payout por mes ─────────────────────────────────
  const meses = q(
    `select to_char(date_trunc('month', fecha_devengo),'YYYY-MM') as mes,
            count(*)::int as eventos,
            sum(monto_bruto)::numeric(12,2)      as gmv,
            sum(monto_plataforma)::numeric(12,2) as ingreso,
            sum(monto_kushki_fee)::numeric(12,2) as riel,
            sum(monto_payout)::numeric(12,2)     as payout
       from eventos_economicos
      -- El vocabulario se lee del enum, no se supone: los estados son
      -- pendiente_liquidar · liquidado · reversado · en_disputa · no_aplica.
      -- 'anulado' NO existe, y suponerlo tiraba la consulta entera.
      where estado is distinct from 'reversado'
      group by 1 order by 1`);
  if (!meses.length) noConcluyente('la agrupación por mes no devolvió filas.');

  r.di('\n   mes        eventos        GMV     ingreso        riel      payout   contrib.   take');
  let tG = 0, tI = 0, tR = 0;
  for (const m of meses) {
    const contrib = Number(m.ingreso) - Number(m.riel);
    const take = Number(m.gmv) ? (Number(m.ingreso) / Number(m.gmv) * 100) : 0;
    tG += Number(m.gmv); tI += Number(m.ingreso); tR += Number(m.riel);
    r.di(`   ${m.mes}   ${String(m.eventos).padStart(7)}  ${$(m.gmv).padStart(9)}  ${$(m.ingreso).padStart(10)}  ${$(m.riel).padStart(10)}  ${$(m.payout).padStart(10)}  ${$(contrib).padStart(9)}  ${take.toFixed(1).padStart(5)}%`);
  }
  r.di(`   ${'TOTAL'.padEnd(10)} ${String(meses.reduce((a, m) => a + m.eventos, 0)).padStart(7)}  ${$(tG).padStart(9)}  ${$(tI).padStart(10)}  ${$(tR).padStart(10)}  ${''.padStart(10)}  ${$(tI - tR).padStart(9)}  ${(tG ? tI / tG * 100 : 0).toFixed(1).padStart(5)}%`);

  // ── Por tipo de evento (de dónde viene el ingreso) ──────────────────────
  const porTipo = q(
    `select tipo_evento::text as tipo, count(*)::int as n,
            sum(monto_bruto)::numeric(12,2) as gmv,
            sum(monto_plataforma)::numeric(12,2) as ingreso
       from eventos_economicos group by 1 order by 4 desc nulls last`);
  r.di('\n   por tipo de evento:');
  for (const t of porTipo) r.dato(`  ${t.tipo}`, `${t.n} · GMV ${$(t.gmv)} · ingreso ${$(t.ingreso)}`);

  // ── Mezcla de MEDIOS DE PAGO, del riel real ────────────────────────────
  const medios = q(
    `select coalesce(proveedor,'(sin proveedor)') as medio, count(*)::int as n,
            sum(monto)::numeric(12,2) as monto
       from pagos_intentos where estado='aprobado' group by 1 order by 3 desc`);
  const totalPagos = medios.reduce((a, m) => a + Number(m.monto), 0);
  r.di('\n   mezcla de medios de pago (pagos aprobados):');
  for (const m of medios)
    r.dato(`  ${m.medio}`, `${m.n} pago(s) · ${$(m.monto)} · ${totalPagos ? (Number(m.monto) / totalPagos * 100).toFixed(1) : '0.0'} %`);

  // ── Lo que el reporte NO puede decir todavía, dicho ─────────────────────
  r.di('');
  const conRiel = uno(`select count(*)::int as n from eventos_economicos where round(monto_kushki_fee,2) <> 0`).n;
  if (conRiel === 0)
    r.di('   ⚠️ El costo del riel es CERO en todos los eventos ⇒ la contribución de arriba\n      es igual al ingreso. No es que el riel sea gratis: es que no se está registrando.\n      *Un cero que se lee como «no cuesta» en vez de «no se mide» infla la contribución.*');
  const sinTarifa = uno(
    `select count(*)::int as n from pagos_desglose_lineas where origen_tipo ~* 'tarifa'`).n;
  if (sinTarifa === 0)
    r.di('   ⚠️ La tarifa de servicio no aparece en ninguna línea ⇒ el ingreso de arriba NO la incluye.');

  r.di('\n   → reporte leído del objeto. Sin rojo por diseño: es un lector, no un juez.');
});
