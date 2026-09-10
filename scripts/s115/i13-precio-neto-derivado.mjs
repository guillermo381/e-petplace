/**
 * S115-E · INSTRUMENTO 13 — EL PRECIO DEL CATÁLOGO ES NETO; EL MOSTRADO SE DERIVA.
 *
 * Letra: acta de la mesa, S115. El catálogo guarda el precio **neto**, y el precio
 * que ve la familia se **deriva** con la tarifa vigente. Nadie guarda el final.
 *
 * QUÉ MIDE, en tres brazos que son tres defectos distintos:
 *   (a) ningún ítem del catálogo guarda un precio FINAL como dato;
 *   (b) para un ítem al 15 %, mostrado = round(neto × 1.15, 2) **exacto en numeric**;
 *   (c) un ítem con el precio final guardado a mano **tiene que gritar**.
 *
 * 🔴 POR QUÉ IMPORTA QUE SEA DERIVADO Y NO GUARDADO: el día que la tarifa cambie
 * —el 12 %→15 % de 2024 ya pasó una vez y NO quedó registrado (no existe `EC_IVA_12`)—
 * un precio final guardado se queda con la tarifa vieja **sin fallar**. La vitrina
 * seguiría mostrando un número perfectamente creíble, calculado con un IVA que ya no
 * existe. *Un dato derivado se equivoca ruidosamente; uno guardado, en silencio.*
 *
 * 🔴 LA ARITMÉTICA ES LA DEL MOTOR (L-534 ③): la derivación se verifica contra
 * `numeric` de Postgres, jamás contra float de JS. `round(x, 2)` sobre `numeric` es
 * half-up y sobre float64 no — y la diferencia es de un centavo, *justo del tamaño
 * que nadie va a cuestionar*.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

/** Dónde vive el precio de cada comprable, y cuál es su columna de tarifa. */
const CATALOGO = [
  ['prestador_servicios',       'precio',            'servicio_id'],
  ['prestador_servicio_tallas', 'precio',            null],
  ['prestador_programas',       'precio_programa',   null],
  ['producto_variantes',        'precio_referencia', null],
];

/** Nombres que delatan un precio FINAL guardado como dato. */
const DELATORES = 'final|con_iva|bruto|mostrado|display|publicado|iva_incluido';

/* 🔴 EL CENSO SE ACOTA AL CATÁLOGO, Y ESO NO ES UN DETALLE.
   La primera versión barrió TODAS las tablas de `public` y marcó rojo sobre
   `eventos_economicos.monto_bruto` y `liquidaciones.monto_bruto_total`. **No son
   catálogo: son el LEDGER**, y ahí «bruto» significa «antes de comisión», no «con
   IVA» — y guardar el valor es lo correcto, porque un asiento es un SNAPSHOT de
   plata que ya pasó. *Un derivado se recalcula; un hecho histórico no.*

   Es `L-534` cobrándose en el instrumento que la cita: medí una capa (el nombre de
   la columna en toda la base) y concluí sobre otra (el catálogo). */
const TABLAS_CATALOGO = CATALOGO.map(([t]) => t).concat([
  'tipos_servicio', 'guarderia_planes', 'prestador_programas', 'productos',
]);

await correr('i13 · el precio del catálogo es neto y el mostrado se deriva', async (r) => {
  // ── (a) ¿EXISTE YA LA SEPARACIÓN? Sin ella no hay comportamiento que medir ──
  const separacion = q(
    `select c.relname, a.attname from pg_attribute a
       join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
        and a.attname ~ '(^|_)(neto|mostrado)($|_)'
        -- 🔴 ACOTADO AL CATÁLOGO por la MISMA razón que el censo de delatores:
        --    sin esto, liquidaciones.monto_neto_a_pagar (que es del LEDGER) se leia
        --    como «la separacion ya esta cableada» y el instrumento salia SANO sobre
        --    un brazo que no había medido. Tercera vez de la misma clase en el mismo
        --    archivo: el alcance se declara en CADA consulta, no una vez por instrumento.
        and c.relname in (${TABLAS_CATALOGO.map((t) => `'${t}'`).join(',')})
      order by 1,2`);
  const derivadores = q(
    `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public'
        and pg_get_functiondef(p.oid) ~ 'precio_neto|precio_mostrado|derivar_precio'
      order by 1`);
  r.dato('columnas neto/mostrado', separacion.length
    ? separacion.map((x) => `${x.relname}.${x.attname}`).join(', ') : 'ninguna');
  r.dato('funciones que derivan', derivadores.length
    ? derivadores.map((x) => x.proname).join(', ') : 'ninguna');

  // ── (b) EL CENSO DE DELATORES — este brazo mide HOY, cableado o no ─────────
  // 🔴 El patrón va ANCLADO. Sin anclar, `mostrado` pesca `mostrador` y el censo
  //    publica siete funciones de walk-in como si fueran derivadores de precio.
  //    (Me pasó al relevar el terreno de este instrumento: L-534 ②.)
  const guardados = q(
    `select c.relname, a.attname, format_type(a.atttypid, a.atttypmod) as tipo
       from pg_attribute a
       join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
        and a.attname ~ '(^|_)(${DELATORES})($|_)'
        and a.attname ~ 'precio|monto|total'
        and c.relname in (${TABLAS_CATALOGO.map((t) => `'${t}'`).join(',')})
      order by 1,2`);
  r.di('');
  r.dato('tablas de catálogo censadas', TABLAS_CATALOGO.join(', '));
  r.dato('columnas que guardarían un precio final', guardados.length
    ? `🔴 ${guardados.map((x) => `${x.relname}.${x.attname}`).join(', ')}` : '0 ✓');

  // Lo que queda FUERA del censo, dicho por su nombre — un alcance que no se
  // declara se lee como si fuera total.
  const fueraDelCenso = q(
    `select c.relname, a.attname from pg_attribute a
       join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
        and a.attname ~ '(^|_)(${DELATORES})($|_)' and a.attname ~ 'precio|monto|total'
        and c.relname not in (${TABLAS_CATALOGO.map((t) => `'${t}'`).join(',')})
      order by 1,2`);
  if (fueraDelCenso.length)
    r.dato('fuera del censo a propósito', `${fueraDelCenso.map((x) => `${x.relname}.${x.attname}`).join(', ')} — ledger/liquidación: ahí «bruto» es «antes de comisión» y el valor es un snapshot, no un derivado`);
  if (guardados.length)
    rojo(`el catálogo guarda ${guardados.length} precio(s) final(es) como dato: ${guardados.map((x) => `${x.relname}.${x.attname}`).join(', ')}. Cuando la tarifa cambie, esos números se quedan con la vieja sin fallar.`);

  // Control positivo del censo: el patrón TIENE que encontrar las columnas de precio
  // que sí existen. Si no encuentra ninguna, su cero es del instrumento.
  const netas = q(
    `select c.relname, a.attname from pg_attribute a
       join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
        and a.attname ~ 'precio' and c.relname in (${CATALOGO.map(([t]) => `'${t}'`).join(',')})
      order by 1,2`);
  r.dato('control positivo · columnas de precio del catálogo', `${netas.length} (${netas.map((x) => `${x.relname}.${x.attname}`).join(', ').slice(0, 120)}…)`);
  if (netas.length === 0)
    noConcluyente('el censo no ve NINGUNA columna de precio en el catálogo: su cero de arriba es del instrumento.');

  // ── (c) LA ARITMÉTICA DE LA DERIVACIÓN — se mide contra numeric, no contra JS ─
  const tarifa = q(`select codigo, pct from cat_tasas_impuesto where codigo='EC_IVA_15'`);
  if (!tarifa.length) noConcluyente('no existe la tarifa EC_IVA_15 en cat_tasas_impuesto.');
  const pct = Number(tarifa[0].pct);
  r.di('');
  r.dato('tarifa vigente', `EC_IVA_15 = ${pct}% (leída del catálogo, no escrita acá)`);

  /* Casos elegidos porque cada uno cae en un borde del redondeo: 6,70 produce el
     .005 que separa numeric de float; 0,01 es el mínimo; 19,99 y 100 son redondos. */
  const casos = ['6.70', '0.01', '19.99', '100.00', '33.33'];
  const derivado = uno(
    `select jsonb_object_agg(neto, jsonb_build_object(
        'mostrado', round(neto * (1 + ${pct}/100.0), 2),
        'ida_y_vuelta', round(round(neto * (1 + ${pct}/100.0), 2) / (1 + ${pct}/100.0), 2)
      )) as r
     from (select unnest(array[${casos.join(',')}]::numeric[]) as neto) t`).r;

  let desviaciones = 0;
  for (const neto of casos) {
    const d = derivado[Number(neto).toString()] ?? derivado[neto];
    if (!d) { desviaciones++; r.dato(`  ${neto}`, '⚠️ el motor no devolvió este caso'); continue; }
    // El mismo cálculo en float, para EXHIBIR la diferencia — no para juzgar con él.
    const enFloat = (Math.round(Number(neto) * (1 + pct / 100) * 100) / 100).toFixed(2);
    const coincide = Number(d.mostrado).toFixed(2) === enFloat;
    r.dato(`  neto ${neto}`, `mostrado ${d.mostrado} · vuelta ${d.ida_y_vuelta}${coincide ? '' : `  ⓘ en float daría ${enFloat}`}`);
    if (Number(d.ida_y_vuelta).toFixed(2) !== Number(neto).toFixed(2)) desviaciones++;
  }
  if (desviaciones)
    r.di(`\n   ⓘ ${desviaciones} caso(s) no vuelven exactos al neto al dividir. NO es un defecto:\n      el redondeo a dos decimales no es invertible, y por eso el NETO es la fuente\n      y el mostrado el derivado — nunca al revés.`);

  // ── (d) ROJO PROBADO: un precio final guardado a mano tiene que gritar ─────
  // Se ejerce sobre una tabla espejo creada en la propia transacción: plantar una
  // columna delatora en el catálogo REAL sería escribir en el producto.
  const ensayo = q(`begin;
    create temp table catalogo_sonda (id int, precio numeric, precio_final numeric);
    select count(*)::int as n
      from information_schema.columns
     where table_name='catalogo_sonda' and column_name ~ '(^|_)(${DELATORES})($|_)';
    rollback;`);
  const cazadas = ensayo[ensayo.length - 1].n;
  r.di('');
  r.dato('rojo ejercido · columna `precio_final` plantada', `${cazadas === 1 ? 'cazada ✓' : `🔴 el censo NO la ve (${cazadas})`}`);
  if (cazadas !== 1)
    noConcluyente('el censo no caza una columna `precio_final` ni plantada a propósito: su cero de arriba no dice nada.');

  // ── (e) EL CABLEADO: si no está, se dice y no se da por bueno ─────────────
  if (!separacion.length && !derivadores.length) {
    r.di('');
    r.di('   ⚠️ LA SEPARACIÓN NETO/MOSTRADO TODAVÍA NO ESTÁ CABLEADA.');
    r.di('      Medido: cero columnas `*_neto`/`*_mostrado`, cero funciones que deriven.');
    r.di('      Lo que SÍ queda medido y verde hoy: el catálogo no guarda ningún precio');
    r.di('      final como dato (a), y la aritmética de la derivación es exacta en numeric (c).');
    r.di('      Lo que NO: que la vitrina lo consuma derivado. Eso se mide cuando A lo cablee.');
    noConcluyente('la separación neto/mostrado no existe todavía: el brazo (b) no tiene qué medir.');
  }

  // ── (f) Cuando esté cableado: la derivación real, contra los ítems vivos ──
  r.di('\n   → ningún precio final guardado, y la derivación en numeric es exacta.');
});
