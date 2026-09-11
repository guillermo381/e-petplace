/**
 * S115-E · INSTRUMENTO 23 — LA CLAVE SE RECALCULA DESDE LOS DATOS DE LA FILA.
 *
 * QUÉ MIDE: que la clave de acceso ALMACENADA coincida **byte a byte** con la que se
 * deriva de los datos de su propia fila. Es lo que vuelve la clave **reconstruible**:
 * si mañana se pierde, se recalcula; si alguien la edita, se nota.
 *
 * 🔴 HOY ESE CRUCE NO EXISTE EN LA BASE. Medido: el único constraint sobre
 * `clave_acceso` es `UNIQUE` — nada la ata a `establecimiento`, `punto_emision`,
 * `secuencial`, `ruc_emisor`, `fecha_emision` ni `sri_ambiente`. *Una clave que no se
 * puede recalcular no falla: simplemente deja de poder verificarse, y el día que un
 * dato de la fila y la clave discrepen, no hay forma de saber cuál de los dos miente.*
 *
 * 🔴 Y DEPENDE DE UN CAMBIO QUE A TODAVÍA NO HIZO: el código numérico. Hoy
 * `fiscal-emitir` usa `Math.random()`; con eso la clave **es irreconstruible por
 * definición** — falta un dato que no está en ninguna fila. Las dos facturas reales
 * medidas (Multicines y 227ITALY) usan **el secuencial sin su cero inicial**, y ése es
 * el cambio que vuelve el cruce posible.
 *
 * EL CÁLCULO ES PROPIO, NO EL DE LA PIEZA. Usar `construirClaveAcceso()` sería
 * preguntarle a la pieza si está de acuerdo consigo misma — la clave almacenada la
 * generó ella. Esta implementación se validó contra DOS facturas reales de producción.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';
import { writeFileSync } from 'node:fs';

const RUTA = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/supabase/functions/_shared/facturacion/clave_acceso.ts';
const SP = '/private/tmp/claude-501/-Users-guillo381gmail-com-proyectos-ePetPlace-e-petplace/e31c9cf9-5517-4887-9e34-60a4227ba727/scratchpad';

const iN = process.argv.indexOf('--docs');
const N = iN >= 0 ? Number(process.argv[iN + 1]) : 100;

/** Módulo 11 del SRI — pesos 2..7 cíclicos de derecha a izquierda. */
function dv(cuerpo48) {
  let s = 0, p = 2;
  for (let i = cuerpo48.length - 1; i >= 0; i--) { s += Number(cuerpo48[i]) * p; p = p === 7 ? 2 : p + 1; }
  const d = 11 - (s % 11);
  return d === 11 ? 0 : d === 10 ? 1 : d;
}

const TIPO = { factura: '01', nota_credito: '04' };

/** La clave que DEBERÍA tener una fila, derivada sólo de sus datos. */
function claveDe(fila) {
  const f = new Date(fila.fecha_emision);
  const dd = String(f.getUTCDate()).padStart(2, '0');
  const mm = String(f.getUTCMonth() + 1).padStart(2, '0');
  const aaaa = String(f.getUTCFullYear());
  /* 🔴 EL CÓDIGO NUMÉRICO SE DERIVA DEL SECUENCIAL — Y NO PORQUE LO HAGA EL MERCADO.
     Con CUATRO facturas reales medidas hay **DOS convenciones**, y ninguna es
     obligatoria:
        · Multicines (015-118) y 227ITALY (003-001) → el secuencial sin su cero inicial
        · TOGA (004-002) y Sweet & Coffee (047-050) → la constante `12345678`
     Proveedores distintos y tamaños de empresa opuestos —un RIMPE y un gran
     contribuyente— usando cada convención. *El mercado no tiene una sola forma, así
     que «lo que hace el mercado» no puede ser el criterio.*

     **Nuestro criterio es OTRO: la reconstrucción.** Derivarlo del secuencial es la
     única forma de que la clave se pueda recalcular desde los datos de la fila — con
     una constante también sería determinista, pero con `Math.random()` es
     irreconstruible por definición, y ahí no hay forma de saber si una clave
     almacenada corresponde a su fila. */
  const codigo = String(fila.secuencial).slice(1);
  /* 🔴 DOS VOCABULARIOS PARA EL AMBIENTE, y confundirlos devuelve NULL en silencio:
     en la CLAVE es el dígito `1|2`; en la COLUMNA `sri_ambiente` es
     `pruebas|produccion`. `fiscal_clave_acceso` recibe el de la columna y traduce.
     Mi arnés le pasaba el dígito ⇒ la función devolvía NULL, el CHECK rebotaba con
     razón, y yo lo leí como que su derivación estaba mal. */
  const amb = { pruebas: '1', produccion: '2' }[String(fila.sri_ambiente)] ?? String(fila.sri_ambiente);
  const cuerpo = `${dd}${mm}${aaaa}${TIPO[fila.tipo] ?? '01'}${fila.ruc_emisor}${amb}` +
                 `${fila.establecimiento}${fila.punto_emision}${fila.secuencial}${codigo}1`;
  return cuerpo.length === 48 ? cuerpo + dv(cuerpo) : { error: `cuerpo de ${cuerpo.length}, se esperaban 48` };
}

await correr('i23 · la clave se recalcula desde los datos de la fila', async (r) => {
  // ── (a) 🔴 EL CRUCE NO EXISTE EN LA BASE — se declara, no se supone ───────
  const ata = q(
    `select conname, pg_get_constraintdef(oid) as def
       from pg_constraint where conrelid='public.documentos_fiscales'::regclass
        and pg_get_constraintdef(oid) ~ 'clave_acceso'`);
  const soloUnique = ata.every((c) => /^UNIQUE/.test(c.def));
  r.dato('constraints sobre clave_acceso', ata.map((c) => c.def).join(' · ') || 'ninguno');
  r.dato('¿algo la ata a los datos de la fila?', soloUnique ? '🔴 NO — sólo UNIQUE' : 'sí');

  // ── (b) EL GENERADOR DEL CÓDIGO NUMÉRICO ────────────────────────────────
  /* 🔴 SI NO SE ENCUENTRA EL GENERADOR, ES NO CONCLUYENTE — JAMÁS VERDE.
     La primera versión miraba un archivo fijo (`fiscal-emitir/index.ts`) y hacía
     `esAleatorio = /random/.test(linea)`. Cuando A movió el código a la pieza
     compartida, la línea salió vacía, el test dio `false` y el instrumento publicó
     **«¿derivado del secuencial? sí ✓»** — un VERDE POR AUSENCIA DE DATO, que acertó
     de casualidad porque A además había hecho el cambio.
     *No encontrar el generador no dice que esté bien: dice que no lo encontré.* */
  const { spawnSync } = await import('node:child_process');
  const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
  const gr = (patron) => {
    const g = spawnSync('grep', ['-rn', '--include=*.ts', patron, 'supabase/functions'],
      { encoding: 'utf8', cwd: RAIZ });
    return g.status === 0 ? g.stdout.trim().split('\n').filter(Boolean) : [];
  };
  const asignaciones = gr('codigoNumerico').filter((l) => /codigoNumerico\s*[:=]/.test(l) && !/^\S+:\d+:\s*(\*|\/\/)/.test(l));
  const aleatorias = asignaciones.filter((l) => /random/i.test(l));
  const derivadas  = gr('codigoNumericoDesdeSecuencial').filter((l) => /export function|=\s*codigoNumericoDesdeSecuencial|codigoNumerico:\s*codigoNumericoDesdeSecuencial/.test(l));

  r.di('');
  r.dato('asignaciones de codigoNumerico', `${asignaciones.length}`);
  for (const a of asignaciones.slice(0, 4)) r.dato('  ·', a.trim().slice(0, 110));
  r.dato('con Math.random()', aleatorias.length ? `🔴 ${aleatorias.length}` : '0 ✓');
  r.dato('derivadas del secuencial', `${derivadas.length}`);

  if (!asignaciones.length && !derivadas.length)
    noConcluyente('no se encontró NINGUNA asignación del código numérico en supabase/functions: no puedo decir cómo se genera, y no encontrarlo no es que esté bien.');
  if (aleatorias.length)
    rojo(`el código numérico todavía se genera al azar (${aleatorias.length} sitio(s)):\n   ${aleatorias[0].trim()}\n   Con Math.random() la clave es irreconstruible POR DEFINICIÓN: le falta un dato que no está en ninguna columna.`);

  // ── (b bis) MI DERIVACIÓN CONTRA LA DE LA CASA ──────────────────────────
  /* Dos implementaciones del mismo criterio, escritas por separado. Si difieren, una
     de las dos produce claves que no coinciden con la almacenada — y el cruce entero
     se vuelve ruido. Se prueban los bordes, no sólo el caso de 9 dígitos. */
  const casos = ['000017078', '000126825', '000000001', '999999999', '100000000'];
  const arnes = `${SP}/arnes-codigo.ts`;
  writeFileSync(arnes, `
import { codigoNumericoDesdeSecuencial } from '${RUTA}';
const cs = JSON.parse(Deno.args[0]);
console.log(JSON.stringify(cs.map((c: string) => { try { return codigoNumericoDesdeSecuencial(c); } catch (e) { return 'ERR:' + String(e); } })));
`);
  const res = spawnSync('deno', ['run', '--allow-read', arnes, JSON.stringify(casos)], { encoding: 'utf8', timeout: 60000 });
  if (res.status !== 0) {
    r.dato('  ⚪ comparación con la pieza', `deno no corrió: ${String(res.stderr).slice(0, 90)}`);
  } else {
    const dellaCasa = JSON.parse(res.stdout.trim().split('\n').pop());
    r.di('');
    let difieren = 0;
    for (const [i, c] of casos.entries()) {
      const mio = String(c).slice(1);
      const suyo = dellaCasa[i];
      if (mio !== suyo) difieren++;
      r.dato(`  ${c}`, `mío ${mio} · la casa ${suyo}${mio === suyo ? ' ✓' : ' 🔴'}`);
    }
    if (difieren)
      rojo(`${difieren} caso(s) donde mi derivación y la de la casa difieren: el cruce compararía contra un código distinto del que se emitió.`);
  }

  // ── (c) 🔴 EL DETECTOR, PRIMERO Y SIN TOCAR LA BASE ──────────────────────
  /* 🔴 VA ANTES DE LA CONSULTA A PROPÓSITO. Este brazo es puro cálculo y no necesita
     la base para nada — pero en la primera versión estaba DESPUÉS de leer
     `documentos_fiscales`, así que cuando el canal falló
     (`LegacyDbConfigConnectTempRoleError`) el instrumento salió NO CONCLUYENTE **sin
     haber probado su propio detector**, que sí podía probarse.
     *Un brazo que no depende de la base no debería morir por la base.* */
  /* La tabla puede estar vacía y el cruce igual tiene que estar probado. Se fabrican
     N documentos en una transacción que se deshace sola: N−1 con la clave bien
     derivada y UNO con código aleatorio. El cruce tiene que encontrar exactamente ese. */
  const filas = [];
  for (let i = 1; i <= N; i++) {
    const base = {
      secuencial: String(i).padStart(9, '0'), establecimiento: '001', punto_emision: '002',
      fecha_emision: '2026-09-10', tipo: 'factura', ruc_emisor: '1793240435001', sri_ambiente: '2',
    };
    filas.push({ ...base, clave_acceso: claveDe(base) });
  }
  // El intruso: mismo dato de fila, código numérico ALEATORIO.
  const intruso = filas[Math.floor(N / 2)];
  const f = intruso;
  const cuerpoMalo = `10092026` + `01` + f.ruc_emisor + f.sri_ambiente + f.establecimiento +
                     f.punto_emision + f.secuencial + '87654321' + '1';
  intruso.clave_acceso = cuerpoMalo + dv(cuerpoMalo);

  let cazado = 0, sanos = 0;
  for (const fila of filas) {
    const esperada = claveDe(fila);
    if (esperada === fila.clave_acceso) sanos++; else cazado++;
  }
  r.di('');
  r.dato(`rojo ejercido · ${N} documentos fabricados`, `${sanos} derivados correctamente · ${cazado} cazado(s)`);
  if (cazado !== 1)
    noConcluyente(`el cruce encontró ${cazado} desviados sobre ${N} fabricados y se esperaba exactamente 1 (el del código aleatorio): no está discriminando.`);

  // Control positivo: los N−1 restantes NO se marcan.
  if (sanos !== N - 1)
    noConcluyente(`${N - 1 - sanos} documento(s) bien derivados se marcaron igual: el cruce marca de más.`);
  r.dato('control · los otros no se marcan', `${sanos} de ${N - 1} ✓`);

  // ── (d) LA MEDICIÓN sobre los documentos REALES ─────────────────────────
  const conClave = q(
    `select id, clave_acceso, establecimiento, punto_emision, secuencial,
            fecha_emision, tipo::text as tipo, ruc_emisor, sri_ambiente
       from documentos_fiscales
      where clave_acceso is not null and secuencial is not null
      order by created_at desc limit ${N}`);
  r.di('');
  r.dato(`documentos con clave (tope ${N})`, `${conClave.length}`);

  const desviados = [];
  for (const d of conClave) {
    const esperada = claveDe(d);
    if (typeof esperada !== 'string') { desviados.push({ id: d.id, motivo: esperada.error }); continue; }
    if (esperada !== d.clave_acceso) {
      const i = [...d.clave_acceso].findIndex((ch, k) => ch !== esperada[k]);
      desviados.push({ id: d.id, motivo: `difiere en la posición ${i}`, guardada: d.clave_acceso.slice(Math.max(0, i - 4), i + 6), derivada: esperada.slice(Math.max(0, i - 4), i + 6) });
    }
  }
  if (conClave.length) {
    r.dato('coinciden byte a byte', `${conClave.length - desviados.length} de ${conClave.length}`);
    for (const d of desviados.slice(0, 5)) r.dato('  🔴', JSON.stringify(d));
  }

  // ── (d bis) 🔴 EL CRUCE EN LA BASE, EJERCIDO ────────────────────────────
  /* Que el CHECK exista no dice que funcione. Se le da de comer una clave que NO se
     deriva de la fila y tiene que rebotar; y una que SÍ, y tiene que pasar. Sin el
     segundo brazo, un CHECK que rechazara TODO también «rebotaría». */
  const atado = ata.some((c) => /fiscal_clave_acceso|reconstruible/.test(c.def));
  if (atado) {
    const fila = { secuencial: '000000042', establecimiento: '001', punto_emision: '002',
                   fecha_emision: '2026-09-10', tipo: 'factura',
                   ruc_emisor: '1793240435001', sri_ambiente: 'produccion' };
    const buena = claveDe(fila);
    const mala = buena.slice(0, 30) + '999999999' + buena.slice(39);   // secuencial movido

    const ins = (clave) => {
      try {
        q(`begin;
           insert into documentos_fiscales (total, sentido, rol, tipo, estado, emitida_por_tercero,
               establecimiento, punto_emision, secuencial, fecha_emision, ruc_emisor, sri_ambiente, clave_acceso)
             values (10.00,'emitido','venta_cliente','factura','autorizada',false,
               '${fila.establecimiento}','${fila.punto_emision}','${fila.secuencial}',
               '${fila.fecha_emision}','${fila.ruc_emisor}','${fila.sri_ambiente}','${clave}');
           rollback;`);
        return null;
      } catch (e) { return String(e?.message ?? e); }
    };

    r.di('');
    const conBuena = ins(buena);
    /* 🔴 UN `RAISE` DE LA FUNCIÓN NO ES UN RECHAZO DEL CHECK, y confundirlos me hizo
       publicar un rojo contra la derivación de A que no era. `fiscal_clave_acceso`
       devuelve NULL y grita `clave_sin_insumos` cuando le falta un dato — eso dice que
       MI INSERT está incompleto, no que su derivación esté mal. *Rebotar no es una
       medición: hay que saber QUIÉN rebotó.* */
    const porInsumos = conBuena !== null && /clave_sin_insumos|insumo/i.test(conBuena);
    r.dato('clave DERIVADA de la fila', conBuena === null ? 'pasa ✓'
      : porInsumos ? `⚪ el arnés no dio todos los insumos: ${(conBuena.match(/Falta[^"]*/) ?? [''])[0].slice(0, 90)}`
      : `🔴 rebota: ${conBuena.slice(0, 110)}`);
    if (porInsumos)
      noConcluyente(`mi INSERT no le dio a fiscal_clave_acceso todos sus insumos, así que la función devolvió NULL y el CHECK rebotó con razón.\n   Es defecto del ARNÉS, no de la derivación — y decirlo al revés mandaría a A a curar lo que funciona.`);
    if (conBuena !== null)
      rojo(`el CHECK rechaza una clave correctamente derivada:\n   ${conBuena.slice(0, 300)}\n   La derivación de la BASE y la de este instrumento no coinciden — y la que emite es la de la base.`);

    const conMala = ins(mala);
    const porElCheck = conMala !== null && /reconstruible|clave/i.test(conMala);
    r.dato('rojo ejercido · clave que NO deriva', conMala === null
      ? '🔴 PASÓ — el cruce no frena nada' : porElCheck ? 'rebota por el CHECK ✓' : `rebota por otra causa: ${conMala.slice(0, 90)}`);
    if (conMala === null)
      rojo('una clave que no se deriva de su fila ENTRÓ igual: el CHECK existe y no frena.');
    if (!porElCheck)
      noConcluyente(`la clave mala rebotó por otra causa — rebotar no es una medición:\n   ${conMala.slice(0, 250)}`);

    r.di('      ⇒ la derivación de la BASE coincide con la mía: tres implementaciones (SQL, TS y este instrumento) dicen lo mismo.');
  }

  // ── (e) VEREDICTO ───────────────────────────────────────────────────────
  if (desviados.length)
    rojo(`${desviados.length} de ${conClave.length} clave(s) almacenada(s) NO se derivan de los datos de su fila.\n` +
         desviados.slice(0, 3).map((d) => `   · ${d.id}: ${d.motivo}${d.guardada ? ` — guardada …${d.guardada}… vs derivada …${d.derivada}…` : ''}`).join('\n'));

  if (aleatorias.length) {
    r.di('');
    r.di('   ⚠️ EL CRUCE NO PUEDE CERRAR: el código numérico es ALEATORIO.');
    r.di('      Con `Math.random()` la clave es irreconstruible POR DEFINICIÓN — le falta un');
    r.di('      dato que no está en ninguna columna. El detector quedó probado sobre');
    r.di(`      ${N} documentos fabricados (caza el intruso, no marca a los otros ${N - 1});`);
    r.di('      cuando A derive el código del secuencial, este instrumento mide solo.');
    noConcluyente('el código numérico todavía es aleatorio: la clave no puede recalcularse desde la fila.');
  }

  if (conClave.length === 0)
    noConcluyente(`no hay documentos con clave almacenada. El detector SÍ quedó probado sobre ${N} fabricados.`);

  r.di(`\n   → las ${conClave.length} claves almacenadas se recalculan byte a byte desde su fila.`);
});
