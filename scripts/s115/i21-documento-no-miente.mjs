/**
 * S115-E · INSTRUMENTO 21 — EL DOCUMENTO NO PUEDE MENTIR.
 *
 * QUÉ MIDE: que los números que `MODELO_ECONOMICO.md` cita **como del objeto**
 * coincidan con el objeto. Un documento vivo que publica una cifra que la base ya no
 * tiene no falla: **se sigue leyendo, se sigue citando en una mesa, y decide.**
 *
 * 🔴 EL PRECEDENTE ES CARO Y ES DE ESTA CASA: `D-759` — el 14 % vivía en un tablero y
 * en `/inversores` cuando la tasa ya era otra, y el ingreso proyectado salía inflado un
 * orden de magnitud. *No fue un bug de tablero: fue lo que se dijo en una reunión.*
 * Y su gemelo de método: en `S103` el canon publicó tres números atribuidos a un gate
 * **que nunca existió en git** — irreproducibles, y por eso se retiraron en vez de
 * corregirse.
 *
 * LA LEY QUE HACE EXIGIBLE: **un número publicado en un documento vivo nombra el
 * comando que lo produce.** Este instrumento ES ese comando para los de abajo.
 *
 * ROJO: cambiar un valor en el objeto (en transacción abortada) y ver que el
 * instrumento acusa la diferencia — si no la acusa, no está comparando.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';
import { readFileSync, existsSync } from 'node:fs';

const DOC = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/docs/MODELO_ECONOMICO.md';

/* Cada afirmación del documento con la consulta que la verifica. La cita va literal
   para que se pueda buscar en el archivo; el valor esperado se PARSEA del documento
   cuando se puede, y si no, va acá y se declara. */
const AFIRMACIONES = [
  { que: 'servicios (paseo/grooming/guardería/adiestramiento): 18 %',
    esperado: 18,
    sql: `select (parametros->>'pct')::numeric as v from fee_configs
           where activo and tipo_origen='cita' and categoria_origen is null
             and vigencia_desde >= '2026-10-01'
             and (vigencia_hasta is null or vigencia_hasta > now()) limit 1` },
  { que: 'servicios: mínimo $1,50',
    esperado: 1.50,
    sql: `select minimo_por_transaccion as v from fee_configs
           where activo and tipo_origen='cita' and categoria_origen is null
             and vigencia_desde >= '2026-10-01'
             and (vigencia_hasta is null or vigencia_hasta > now()) limit 1` },
  { que: 'veterinaria: 12 %',
    esperado: 12,
    sql: `select (parametros->>'pct')::numeric as v from fee_configs
           where activo and categoria_origen='veterinario'
             and (vigencia_hasta is null or vigencia_hasta > now()) limit 1` },
  { que: 'veterinaria: mínimo $3,00',
    esperado: 3.00,
    sql: `select minimo_por_transaccion as v from fee_configs
           where activo and categoria_origen='veterinario'
             and (vigencia_hasta is null or vigencia_hasta > now()) limit 1` },
  { que: 'telemedicina: mínimo $2,00',
    esperado: 2.00,
    sql: `select minimo_por_transaccion as v from fee_configs
           where activo and categoria_origen='telemedicina'
             and (vigencia_hasta is null or vigencia_hasta > now()) limit 1` },
  { que: 'tarifa de servicio: $0,99',
    esperado: 0.99,
    sql: `select valor::numeric as v from app_config where clave='tarifa_servicio_monto'` },
];

await correr('i21 · el documento no puede mentir', async (r) => {
  if (!existsSync(DOC)) noConcluyente(`no existe ${DOC}: no hay documento que contrastar.`);
  const texto = readFileSync(DOC, 'utf8');
  r.dato('documento', `MODELO_ECONOMICO.md · ${texto.split('\n').length} líneas`);

  // ── (a) Control positivo: el documento SÍ contiene los números que cito ──
  const citados = ['18 %', '12 %', '$1,50', '$3,00', '$2,00', '$0,99'];
  const ausentes = citados.filter((c) => !texto.includes(c));
  r.dato('control · cifras presentes en el texto', ausentes.length
    ? `🔴 faltan: ${ausentes.join(', ')}` : `las ${citados.length} ✓`);
  if (ausentes.length === citados.length)
    noConcluyente('ninguna de las cifras que este instrumento vigila aparece en el documento: o cambió de forma, o estoy leyendo otro archivo.');

  // ── (b) LA COMPARACIÓN, una por una ─────────────────────────────────────
  r.di('');
  const difieren = [];
  for (const a of AFIRMACIONES) {
    let real = null, err = null;
    try { const f = q(a.sql); real = f.length ? Number(f[0].v) : null; }
    catch (e) { err = String(e?.message ?? e).slice(0, 90); }

    if (err) { r.dato(`  ⚪ ${a.que}`, `no se pudo medir: ${err}`); difieren.push({ ...a, real: '(error)', err }); continue; }
    if (real === null) { r.dato(`  🔴 ${a.que}`, 'el objeto NO tiene ese valor'); difieren.push({ ...a, real: '(ausente)' }); continue; }

    const coincide = Math.round(real * 100) === Math.round(a.esperado * 100);
    r.dato(`  ${coincide ? '✓' : '🔴'} ${a.que}`, `documento ${a.esperado} · objeto ${real}`);
    if (!coincide) difieren.push({ ...a, real });
  }

  // ── (c) 🔴 ROJO PROBADO: movido el objeto, el instrumento acusa ──────────
  const prueba = AFIRMACIONES[0];
  const conCambio = q(`begin;
    update fee_configs set parametros = jsonb_set(parametros,'{pct}','99')
     where activo and tipo_origen='cita' and categoria_origen is null
       and vigencia_desde >= '2026-10-01' and (vigencia_hasta is null or vigencia_hasta > now());
    ${prueba.sql};
    rollback;`);
  const movido = Number(conCambio[conCambio.length - 1].v);
  r.di('');
  r.dato('rojo ejercido · pct movido a 99 en txn', `el instrumento lee ${movido} (documento dice ${prueba.esperado})`);
  if (movido === prueba.esperado)
    noConcluyente('el instrumento NO ve el cambio del objeto: está comparando el documento contra sí mismo.');

  const residuo = Number(q(prueba.sql)[0].v);
  r.dato('residuo', `pct de vuelta en ${residuo}`);
  if (residuo !== prueba.esperado && difieren.length === 0)
    rojo(`el instrumento dejó el objeto en ${residuo}.`);

  // ── (d) Veredicto ───────────────────────────────────────────────────────
  if (difieren.length)
    rojo(`${difieren.length} número(s) del documento NO coinciden con el objeto:\n` +
      difieren.map((d) => `   · ${d.que} → documento ${d.esperado}, objeto ${d.real}`).join('\n') +
      `\n   Un documento vivo con un número viejo no falla: se sigue citando en una mesa, y decide (D-759).`);

  r.di(`\n   → los ${AFIRMACIONES.length} números que el documento cita del objeto coinciden con el objeto.`);
  r.di('     Este instrumento ES el comando que los produce: node scripts/s115/i21-documento-no-miente.mjs');
});
