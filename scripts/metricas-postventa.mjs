#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * metricas:postventa — S114-E · §12 de `LETRA_POSTVENTA`, con su comando
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §12 pide catorce números y pone la condición en la misma línea: **«cada
 * número nombra el comando que lo produce, o lleva su fecha y su SHA. Ninguno
 * usa los datos de hoy como línea base.»**
 *
 * Por eso esto es un SCRIPT y no una tabla en un documento. Una tabla envejece
 * en silencio —el canon de esta casa tiene el contador de migraciones caído
 * cuatro veces y el de fichas seis para probarlo—; un script vuelve a medir
 * cada vez que alguien lo corre, y **dice qué todavía no tiene sujeto en vez
 * de publicar un cero.**
 *
 * 🔴 **UN CERO Y UNA AUSENCIA NO SON LO MISMO, Y ACÁ NO SE CONFUNDEN.**
 * «0 casos resueltos por el motor» y «la tabla de casos no existe» se ven
 * igual en un tablero y significan cosas opuestas. Cada fila sale como
 * `MEDIDO` (con su número) o `SIN SUJETO` (con lo que le falta, nombrado).
 *
 * ⚠️ **NINGÚN NÚMERO DE HOY ES LÍNEA BASE.** Al correr esto, ningún dato de
 * servicio de la base es real: todo es prueba de construcción y producción es
 * octubre. Los números que salen sirven para saber **si el instrumento
 * mide**, jamás para calibrar un umbral.
 */
import { dbQuery } from './lib-db.mjs';

const existe = (t) => dbQuery(`select to_regclass('public.${t}') as x`)[0].x !== null;
const TABLA_CASO = ['casos_postventa', 'postventa_casos'].find(existe) ?? null;
const TABLA_SALDO = ['saldo_hogar', 'saldo_movimientos'].find(existe) ?? null;

const filas = [];
const medir = (n, titulo, comando, fn, faltaSi) => {
  if (faltaSi) { filas.push({ n, titulo, comando, estado: 'SIN SUJETO', valor: faltaSi }); return; }
  try { filas.push({ n, titulo, comando, estado: 'MEDIDO', valor: fn() }); }
  catch (e) { filas.push({ n, titulo, comando, estado: 'REBOTÓ', valor: e.message.slice(0, 90) }); }
};

const sinCaso = TABLA_CASO ? null : 'no existe la tabla del caso (§5)';

// El denominador que TODAS las tasas de §12 comparten.
const OBJETOS_SQL = `
  select (select count(*) from evento_cita_servicio
           where estado in ('completada','no_show') and estado_reserva='pagada')
       + (select count(*) from guarderia_estadias where estado='entregada')
       + (select count(*) from pedidos where estado='entregado') as n`;

medir(0, 'denominador · objetos ejecutados', 'ver OBJETOS_SQL en este archivo',
  () => `${dbQuery(OBJETOS_SQL)[0].n} objetos`);

medir(1, 'casos por 100 objetos ejecutados',
  `select count(*) from ${TABLA_CASO ?? '<tabla_caso>'}  ÷  OBJETOS_SQL × 100`,
  () => null, sinCaso);

medir(2, '% resueltos por el motor (clase 1)',
  `select 100.0*count(*) filter (where clase=1 and estado in ('resuelto','cerrado'))/nullif(count(*),0) from <tabla_caso>`,
  () => null, sinCaso);

medir(3, '% resueltos entre partes antes de la casa',
  `... where estado='resuelto_entre_partes'`, () => null, sinCaso);

medir(4, '% que llegaron a la casa',
  `... where estado_maximo_alcanzado='con_casa'`, () => null, sinCaso);

medir(5, 'tiempo a resolución (mediana y p90)',
  `select percentile_cont(0.5) within group (order by resuelto_en-creado_en), percentile_cont(0.9) ...`,
  () => null, sinCaso);

medir(6, 'prestadores que responden dentro de 24 h',
  `... where respondido_en - con_prestador_en < interval '24 hours'`, () => null, sinCaso);

// ── El único de §12 que ya tiene sujeto entero, y por eso se mide ────────
medir(7, 'objetos que llegan a `no_ejecutado`',
  "pnpm verify:cierre-ausente  ·  y el conteo: select count(*) from evento_cita_servicio where estado='no_ejecutado'",
  () => {
    const hay = dbQuery(
      "select count(*)::int as n from pg_constraint where pg_get_constraintdef(oid) like '%no_ejecutado%'")[0].n;
    if (hay === 0) {
      const cand = dbQuery(`
        select count(*)::int as n from evento_cita_servicio c
         where c.estado_reserva='pagada' and c.hora is not null
           and c.estado not in ('completada','no_show','cancelada','rechazada','no_realizable')
           and now() - ((c.fecha + c.hora + make_interval(mins => coalesce(c.duracion_minutos,0)))
                        at time zone 'America/Guayaquil') > interval '48 hours'`)[0].n;
      return `0 — el estado NO EXISTE en ningún CHECK · ${cand} citas ya lo cumplirían`;
    }
    return `${dbQuery("select count(*)::int as n from evento_cita_servicio where estado='no_ejecutado'")[0].n}`;
  });

medir(8, 'reabiertos', `... count(*) where reabierto_en is not null`, () => null, sinCaso);

// ── La plata: medible HOY, y su cero tiene control positivo ──────────────
medir(9, 'plata devuelta · por camino',
  "select count(*), coalesce(sum(monto_bruto),0) from eventos_economicos where tipo_evento='reembolso'",
  () => {
    const r = dbQuery(`select
        (select count(*)::int from eventos_economicos where tipo_evento='reembolso') as reembolsos,
        (select count(*)::int from eventos_economicos where estado='reversado') as reversados,
        (select count(*)::int from eventos_economicos) as eventos_totales`)[0];
    return `aplicar_reembolso: ${r.reembolsos} · originales reversados: ${r.reversados}` +
           `  (control positivo: la tabla tiene ${r.eventos_totales} eventos, no está vacía)`;
  });

medir(10, 'plata devuelta · por riel',
  "select proveedor, count(*), sum(monto) from pagos_intentos where estado in ('reversado','reverso_fallido') group by 1",
  () => dbQuery(`select proveedor, count(*)::int n, coalesce(sum(monto),0)::text total
                   from pagos_intentos where estado in ('reversado','reverso_fallido')
                  group by 1 order by 1`)
        .map((r) => `${r.proveedor} ${r.n} (${r.total})`).join(' · ') || 'ninguno');

medir(11, 'plata devuelta · por causa',
  `select motivo, count(*) from <tabla_caso> ... group by 1`, () => null, sinCaso);

medir(12, 'casos por familia',
  `select familia_id, count(*) from <tabla_caso> group by 1`, () => null, sinCaso);

/* ═══ LA TARIFA, CON SU PROCEDENCIA — y la procedencia es parte del número ═══
   🔴 **Ecuador NO tiene línea propia en el rate card de Meta.** El código 593
   cae en el bucket **«Resto de Latinoamérica»**, y de ahí sale este precio.
   *Publicarlo como si fuera una tarifa-país sería exacto en la cifra y falso en
   lo que la cifra es* — y el día que Meta desagregue Ecuador, nadie sabría que
   este número venía de un promedio regional.
   · **UTILITY = USD 0,0113 por mensaje ENTREGADO** (no por enviado)
   · hojas **vigentes desde el 1-jul-2026** · doc **actualizado el 5-ago-2026**
   · **leído de la calculadora oficial de Meta**, porque **el CSV del CDN
     devuelve 403** ⇒ la fuente es la calculadora, no el archivo. Se dice. */
const TARIFA_UTILITY_RESTO_LATAM = 0.0113;
const TARIFA_PROCEDENCIA = 'bucket «Resto de Latinoamérica» (EC no tiene línea propia) · ' +
  'hojas vigentes 1-jul-2026 · doc actualizado 5-ago-2026 · calculadora oficial de Meta ' +
  '(el CSV del CDN devuelve 403)';
/* 🟢 LA WABA QUEDÓ EN **USD** Y **America/Guayaquil** (consola, 7-sep).
   Las dos mitades importan y por razones distintas:
   · **USD** ⇒ la tarifa se aplica tal cual, sin conversión ni spread. El número
     de arriba es el número que se factura.
   · **America/Guayaquil** ⇒ **el corte del 1-oct-2026 cae en NUESTRA hora**.
     *Antes había que saber en qué huso caía la medianoche de Meta para saber
     qué mensaje entra al régimen pago; ahora la frontera es la del reloj de
     acá.* Un costo que depende de una zona horaria ajena tiene un borde que
     nadie puede verificar desde su propia pantalla. */
const WABA_MONEDA = 'USD';
const WABA_HUSO = 'America/Guayaquil';
const MENSAJES_POR_CASO = 2;   // §10: sólo ACTUAR y PLATA MOVIDA

medir(13, 'costo de WhatsApp por caso',
  `${MENSAJES_POR_CASO} × USD ${TARIFA_UTILITY_RESTO_LATAM} × familias con opt-in`,
  () => {
    const c = dbQuery(`select
        (select count(*)::int from notificacion_intencion
          where resuelto_como->>'canal_elegido' = 'whatsapp') as enviados,
        (select count(*)::int from user_notificacion_prefs
          where canal = 'whatsapp' and habilitada) as optin_si,
        (select count(*)::int from user_notificacion_prefs
          where canal = 'whatsapp' and not habilitada) as optin_no,
        (select exige_evidencia from cat_notificacion_canales where codigo='whatsapp') as exige_evidencia,
        (select transporte_vivo from cat_notificacion_canales where codigo='whatsapp') as transporte_vivo`)[0];
    /* 🔴 El «fila ausente = habilitada» de la casa (S54-B4) NO puede aplicar a
       WhatsApp: el canal tiene `exige_evidencia = true`, y **la ausencia de una
       fila no es evidencia de nada**. Se cuenta por filas en `true`. */
    const optin = c.exige_evidencia ? c.optin_si : null;
    const porCaso = MENSAJES_POR_CASO * TARIFA_UTILITY_RESTO_LATAM;
    return [
      `POR CASO: ${MENSAJES_POR_CASO} mensajes × USD ${TARIFA_UTILITY_RESTO_LATAM} = **USD ${porCaso.toFixed(4)}**`,
      `tarifa: ${TARIFA_PROCEDENCIA}`,
      `familias con opt-in: ${optin} (filas whatsapp: ${c.optin_si} sí / ${c.optin_no} no · exige_evidencia=${c.exige_evidencia})`,
      `⇒ TECHO HOY: ${MENSAJES_POR_CASO} × ${TARIFA_UTILITY_RESTO_LATAM} × ${optin} = USD ${(porCaso * (optin ?? 0)).toFixed(4)} — exacto, no estimado`,
      `canal transporte_vivo=${c.transporte_vivo} · mensajes por WhatsApp enviados: ${c.enviados}`,
      `WABA en ${WABA_MONEDA} y ${WABA_HUSO}: la tarifa se factura sin conversión, y el`,
      `  corte del 1-oct-2026 cae en NUESTRA hora — no depende de un huso ajeno.`,
      `NO se estima el VOLUMEN (casos por familia): ese dato no existe, y §11bis`,
      `  existe para no tenerlo inventado. Lo de arriba es costo POR CASO y su techo,`,
      `  jamás un gasto proyectado.`,
    ].join('\n      ');
  });

medir(14, '«¿Quedó resuelto?» (un toque al cerrar)',
  `select count(*) filter (where quedo_resuelto), count(*) from <tabla_caso> where estado='cerrado'`,
  () => null, sinCaso);

// ── Salida ───────────────────────────────────────────────────────────────
console.log('metricas:postventa · §12 de LETRA_POSTVENTA');
console.log(`corrida: ${new Date().toISOString()}`);
console.log('⚠️ ningún dato de servicio de la base es real — producción es octubre.');
console.log('   Estos números dicen si el instrumento mide, JAMÁS calibran un umbral.\n');
for (const f of filas) {
  const marca = f.estado === 'MEDIDO' ? '🟢' : f.estado === 'SIN SUJETO' ? '🟠' : '🔴';
  console.log(`${marca} ${String(f.n).padStart(2)} · ${f.titulo}`);
  console.log(`      ${f.estado}: ${f.valor ?? '—'}`);
  console.log(`      comando: ${f.comando}`);
}
const medidos = filas.filter((f) => f.estado === 'MEDIDO').length;
console.log(`\n  ${medidos} de ${filas.length} tienen sujeto hoy.`);
if (!TABLA_CASO)  console.log('  El resto espera la tabla del caso (§5).');
if (!TABLA_SALDO) console.log('  El saldo de §7 tampoco existe: no hay tabla de saldo de la familia.');
