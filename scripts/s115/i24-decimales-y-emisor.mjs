/**
 * S115-E · INSTRUMENTO 24 — LOS DECIMALES DE LA LÍNEA Y LAS LEYENDAS DEL EMISOR.
 *
 * Tres cosas que las facturas reales medidas traen y que nuestro emisor va a necesitar.
 * Ninguna se inventó: las tres salieron de cuatro RIDE de producción.
 *
 * (a) 🔴 **PRECIO UNITARIO CON CUATRO DECIMALES, TOTAL CON DOS.** TOGA factura a
 *     `147.8261` y Sweet & Coffee a `2.8696`. Con `numeric(12,2)` Postgres **redondea
 *     al insertar, sin avisar**, y la base deja de cuadrar con la del proveedor.
 *     Medido: `147.8261 × 7` da **1034.78**; guardado a dos decimales da **1034.81**.
 *     *Tres centavos que nadie ve, en una línea que el proveedor factura distinto.*
 *
 * (b) Las dos leyendas del RIDE son **DATO**, no texto fijo: TOGA imprime
 *     «CONTRIBUYENTE RÉGIMEN RIMPE» y «Obligado a llevar contabilidad: NO». Satori es
 *     RIMPE y **SÍ** obligado ⇒ un RIDE con la leyenda hardcodeada mentiría hoy, y
 *     volvería a mentir el día que Satori salga del RIMPE.
 *
 * (c) «RUC Proveedor» en información adicional — el campo de la Res. 27, **confirmado
 *     en producción en dos proveedores distintos**.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

const DECIMALES_REALES = [
  { emisor: 'TOGA FASHION',    unitario: '147.8261' },
  { emisor: 'Sweet & Coffee',  unitario: '2.8696'   },
];

await correr('i24 · decimales de la línea y leyendas del emisor', async (r) => {
  /* 🔴 LOS TRES BRAZOS ACUMULAN. Con `rojo()` en cada uno, el primero tapa a los
     otros dos: la primera corrida murió en los decimales y NO llegó a mirar las
     leyendas ni el campo de información adicional. *Es la misma cura que i14, y acá
     debí aplicarla desde el principio en vez de reaprenderla.* Sobre un frente que
     recién nace, lo que hace falta es el cuadro COMPLETO en una corrida. */
  const hallazgos = [];
  // ── (a) 🔴 EL UNITARIO TIENE QUE AGUANTAR CUATRO DECIMALES ───────────────
  const cols = q(
    `select attname, format_type(atttypid, atttypmod) as tipo
       from pg_attribute where attrelid='public.pagos_desglose_lineas'::regclass
        and attnum>0 and not attisdropped
        and attname in ('precio_unitario','base','valor_iva','cantidad','descuento')
      order by attname`);
  if (!cols.length) noConcluyente('pagos_desglose_lineas no existe.');
  for (const c of cols) r.dato(`  ${c.attname}`, c.tipo);

  const unitario = cols.find((c) => c.attname === 'precio_unitario');
  const escala = Number((unitario?.tipo.match(/,(\d+)\)/) ?? [])[1] ?? NaN);
  r.di('');
  r.dato('escala de precio_unitario', Number.isNaN(escala) ? '(no es numeric con escala)' : `${escala} decimales`);

  // El daño se MIDE, no se argumenta: se guarda el unitario real en las dos escalas.
  const dano = q(`begin;
    create temp table sonda (n text, u2 numeric(12,2), u4 numeric(12,4));
    insert into sonda values ${DECIMALES_REALES.map((d) => `('${d.emisor}', ${d.unitario}, ${d.unitario})`).join(', ')};
    select n, u2, u4, round(u2*7,2) as base2, round(u4*7,2) as base4,
           round(u4*7,2) - round(u2*7,2) as dif
      from sonda order by n;
    rollback;`);
  const filas = dano.filter((x) => x && x.n);
  r.di('');
  for (const f of filas)
    r.dato(`  ${f.n}`, `${f.u4} → guardado ${f.u2} · base×7: ${f.base4} vs ${f.base2} · dif ${f.dif}`);

  const pierden = filas.filter((f) => Number(f.dif) !== 0);
  if (escala < 4) {
    hallazgos.push(`precio_unitario es numeric(12,${escala}) y NO aguanta los cuatro decimales que facturan los proveedores reales. ` +
      `Postgres redondea al INSERTAR, sin avisar — ${pierden.length} de ${filas.length} casos medidos ya pierden plata: ` +
      pierden.map((f) => `${f.n} ${f.u4}→${f.u2}, base×7 cambia ${f.dif}`).join(' · ') +
      `. El total sigue en dos decimales, que está bien: lo que necesita más precisión es la BASE UNITARIA`);
  }

  // ── (b) LAS DOS LEYENDAS SON DATO ────────────────────────────────────────
  const emisor = q(`select leyenda_regimen, obligado_contabilidad, contribuyente_especial, agente_retencion from fiscal_emisor`);
  r.di('');
  if (!emisor.length) noConcluyente('fiscal_emisor no tiene fila: no hay leyendas que verificar.');
  const e = emisor[0];
  r.dato('leyenda_regimen', `${e.leyenda_regimen ?? '🔴 NULL'}`);
  r.dato('obligado_contabilidad', `${e.obligado_contabilidad}`);
  r.dato('contribuyente_especial', `${e.contribuyente_especial ?? '(no lo es)'}`);
  r.dato('agente_retencion', `${e.agente_retencion}`);

  if (!e.leyenda_regimen) hallazgos.push('fiscal_emisor.leyenda_regimen está vacía: el RIDE no tendría qué imprimir');
  if (e.obligado_contabilidad === null) hallazgos.push('obligado_contabilidad es NULL: el RIDE no puede decir SÍ ni NO');

  /* El contraste que hace visible por qué son DATO: TOGA es RIMPE y NO obligado;
     Satori es RIMPE y SÍ obligado. Misma leyenda de régimen, distinta de contabilidad. */
  r.dato('  contraste con TOGA (RIMPE, no obligado)', `Satori: RIMPE, obligado=${e.obligado_contabilidad} ⇒ las dos leyendas NO se pueden hardcodear juntas`);

  // Y que ninguna esté escrita a mano en el código del RIDE.
  const { spawnSync } = await import('node:child_process');
  const g = spawnSync('grep', ['-rn', '--include=*.ts', '-i', 'RÉGIMEN RIMPE\\|REGIMEN RIMPE\\|Obligado a llevar', 'supabase/functions'],
    { encoding: 'utf8', cwd: '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace' });
  const enCodigo = (g.stdout || '').trim().split('\n').filter(Boolean)
    .filter((l) => !/^\S+:\d+:\s*(\*|\/\/|--)/.test(l));       // comentarios no cuentan
  r.dato('leyendas escritas a mano en el código', enCodigo.length ? `🔴 ${enCodigo.length}` : '0 ✓');
  for (const l of enCodigo.slice(0, 3)) r.dato('  🔴', l.trim().slice(0, 120));
  if (enCodigo.length)
    hallazgos.push(`${enCodigo.length} leyenda(s) del RIDE escritas en el código en vez de leídas de fiscal_emisor — el día que Satori salga del RIMPE el papel va a seguir diciendo que lo es`);

  // ── (c) «RUC PROVEEDOR» / INFORMACIÓN ADICIONAL ─────────────────────────
  const info = q(
    `select c.relname, a.attname from pg_attribute a
       join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and a.attnum>0 and not a.attisdropped
        and (a.attname ~ 'info_adicional|informacion_adicional|ruc_proveedor')
      order by 1,2`);
  r.di('');
  r.dato('campo de información adicional', info.length
    ? info.map((x) => `${x.relname}.${x.attname}`).join(', ') : '🔴 NINGUNO');
  if (!info.length)
    hallazgos.push('no existe ningún campo de información adicional donde llevar «RUC Proveedor» — el campo de la Res. 27, CONFIRMADO en producción en dos proveedores distintos (TOGA y Sweet & Coffee)');

  if (hallazgos.length)
    rojo(`${hallazgos.length} hueco(s) que las facturas reales destapan:\n` +
         hallazgos.map((h, i) => `   ${i + 1}. ${h}`).join('\n'));

  r.di('\n   → el unitario aguanta la precisión real, las leyendas son dato, y hay dónde llevar el RUC del proveedor.');
});
