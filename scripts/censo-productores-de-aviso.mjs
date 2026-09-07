#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * censo:productores-de-aviso — S114-E · el ciego que A declaró, curado
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **El ciego, con las palabras de A** (`S114-A-RELEVAMIENTO` §5):
 * *«Mi censo mide productores por LITERAL en el cuerpo de una función, y eso
 * no ve a los que emiten POR DATO.»* `guarderia_entregada` y
 * `guarderia_no_recogida` salieron «SIN PRODUCTOR» **y tienen intenciones
 * reales**: su productor es `_guarderia_aplicar_acto`, que lee
 * `cat_guarderia_transiciones.tipo_notificacion` y emite lo que el catálogo
 * diga. **Su productor es una fila, no una línea.**
 *
 * ── CÓMO SE LE PREGUNTA AL OBJETO ─────────────────────────────────────────
 * No se busca la tabla que uno ya sabe que existe — eso mide la memoria del
 * que escribe el censo. Se recorren **TODAS las columnas de texto de todas las
 * tablas de `public`** y se pregunta cuáles CONTIENEN un código de
 * `cat_notificacion_tipos`. Una columna que guarda códigos de aviso **es** un
 * productor por dato, se llame como se llame y esté en la tabla que esté.
 *
 * 🔴 **Por qué no se filtra por nombre de columna:** filtrar por
 * `~* 'notificacion|aviso'` habría encontrado `tipo_notificacion` y habría
 * dado el mismo resultado **por casualidad**. Un censo atado a un nombre mide
 * la convención, no el hecho (`L-489` de la casa) — y la convención se rompe
 * en la primera tabla que llame `evento` a lo que otra llama `notificacion`.
 *
 * ── LOS DOS CENSOS CORREN JUNTOS, A PROPÓSITO ─────────────────────────────
 * El script reproduce **el censo por literal de A** y corre **el censo por
 * dato** en la misma pasada, y reporta la diferencia. *No se trata de
 * reemplazar el instrumento de A: se trata de medir cuánto no veía* — y eso
 * sólo se puede decir si los dos números salen de la misma corrida.
 *
 * ── LO QUE ESTE CENSO TAMPOCO VE, DECLARADO ───────────────────────────────
 * · **`jsonb`.** Sólo recorre `text`, `varchar` y `citext`. Un código de aviso
 *   guardado dentro de un `jsonb` de configuración **no lo encuentra**, y esta
 *   casa guarda mucha cosa en `jsonb`. *Acota, no cierra* — igual que el de A.
 * · **Un productor por dato cuya fila todavía no existe.** Si el catálogo está
 *   vacío, el tipo sale sin productor aunque el código sepa leerlo.
 * · **No prueba que el productor CORRA.** Prueba que existe quien podría
 *   emitirlo. El contador de intenciones es otra medición, y va al lado.
 *
 * Salida: tabla por tipo con `literal` · `dato` · `intenciones`, y el delta.
 */
import { dbQuery } from './lib-db.mjs';

const CHUNK = 120;

/* 🔴 REINTENTO — medido en la primera corrida: con dos consultas del CLI en
   vuelo al mismo tiempo, un lote rebotó con `LegacyDbConfigConnectTempRoleError`
   («failed to connect as temp role»). **No es un rechazo del motor: es la
   conexión.** Y su daño era del peor tipo: el censo imprimía «⚠️ 120 columnas
   sin leer» y seguía — *publicando un número más chico y llamándolo
   resultado*. Se reintenta, y si igual no entra, el censo NO publica: sale 2.
   El `dbQuery` compartido no se toca — el reintento es de este arnés. */
function dbQueryReintento(sql, intentos = 3) {
  let ultimo;
  for (let i = 0; i < intentos; i += 1) {
    try { return dbQuery(sql); } catch (e) {
      ultimo = e;
      if (!/Failed to connect|temp role/i.test(e.message)) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500 * (i + 1));
    }
  }
  throw ultimo;
}

// ── ① El universo de tipos, y cuántas veces emitió cada uno ───────────────
const tipos = dbQueryReintento(`
  select t.codigo, t.categoria::text as categoria,
         (select count(*)::int from notificacion_intencion i where i.tipo = t.codigo) as intenciones
    from cat_notificacion_tipos t order by t.codigo`);

// ── ② CENSO POR LITERAL — el método de A, reproducido tal cual ────────────
const porLiteral = new Map(dbQueryReintento(`
  select t.codigo,
         (select string_agg(p.proname, ', ' order by p.proname)
            from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and pg_get_functiondef(p.oid) like '%' || quote_literal(t.codigo) || '%'
             and p.proname not like '\\_voz%'
             and p.proname <> 'obtener_avisos_del_hogar') as funciones
    from cat_notificacion_tipos t`).map((r) => [r.codigo, r.funciones]));

// ── ③ CENSO POR DATO — todas las columnas de texto de public ──────────────
const cols = dbQueryReintento(`
  select c.relname as tabla, a.attname as col
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and a.attnum > 0 and not a.attisdropped
     and format_type(a.atttypid, a.atttypmod) in ('text','character varying','citext')
     and c.relname <> 'cat_notificacion_tipos'
     and c.relname <> 'notificacion_intencion'
   order by 1, 2`);

const porDato = new Map();   // codigo -> Set('tabla.col')
let columnasLeidas = 0, columnasQueRebotaron = 0;

for (let i = 0; i < cols.length; i += CHUNK) {
  const lote = cols.slice(i, i + CHUNK);
  const sql = lote.map(({ tabla, col }) =>
    `select ${quote(`${tabla}.${col}`)} as fuente, x.${ident(col)}::text as codigo
       from ${ident(tabla)} x
      where x.${ident(col)}::text in (select codigo from cat_notificacion_tipos)`,
  ).join('\n union all \n');
  try {
    for (const r of dbQueryReintento(`select distinct fuente, codigo from (\n${sql}\n) u`)) {
      if (!porDato.has(r.codigo)) porDato.set(r.codigo, new Set());
      porDato.get(r.codigo).add(r.fuente);
    }
    columnasLeidas += lote.length;
  } catch (e) {
    // Un lote que rebota NO se traga: se cuenta y se dice. Un censo que
    // esconde lo que no pudo leer publica un número más chico y lo llama
    // resultado.
    columnasQueRebotaron += lote.length;
    console.error(`🟠 NO CONCLUYENTE · un lote de ${lote.length} columnas no se pudo leer`);
    console.error(`   tras 3 intentos: ${e.message.slice(0, 200)}`);
    console.error('   Un censo que esconde lo que no pudo leer publica un número más');
    console.error('   chico y lo llama resultado. No se publica nada.');
    process.exit(2);
  }
}

function ident(s) { return `"${String(s).replace(/"/g, '""')}"`; }
function quote(s) { return `'${String(s).replace(/'/g, "''")}'`; }

// ── ④ EL DISCRIMINADOR CAUSAL — contener un código no es emitirlo ─────────
// `registrar_intencion_notificacion` es la PUERTA ÚNICA de emisión (medido:
// es la única función que hace `insert into notificacion_intencion`). Una
// columna es productor POR DATO sólo si alguna función **lee su tabla** y
// **llama a esa puerta**. Sin este paso el censo marcaba como productor a
// `notificaciones.tipo` —que es la SALIDA— y a `user_notificacion_prefs_legacy.tipo`
// —que es la CONFIGURACIÓN—: dos falsos verdes, encontrados corriéndolo.
//
// ⚠️ DOS VERSIONES DE ESTE DISCRIMINADOR FALLARON, EN DIRECCIONES OPUESTAS,
// y las dos las encontró correrlo — no leerlo:
//   ① `~ '\m'||tabla||'\M'` escrito desde un runner de shell ⇒ el patrón
//      llegaba mutilado y devolvía NULL **hasta para el caso conocido**
//      (`cat_guarderia_transiciones`). Falso rojo silencioso.
//   ② `like '%'||tabla||'%'` ⇒ la palabra `notificaciones` es SUBCADENA de
//      `despachar_notificaciones`, así que la tabla de SALIDA salió marcada
//      como productora. Falso verde.
// Rige ① con el escape correcto (`\\m` en la fuente = `\m` en SQL), y el
// control del caso conocido corre abajo, antes de publicar cualquier número.
//
// 🔴 **LÍMITE DEL DISCRIMINADOR, DECLARADO:** prueba CO-OCURRENCIA en el
// cuerpo de una función —lee la tabla y llama a la puerta—, **jamás flujo de
// dato**. `cat_tipos_evento → reservar_salida_paquete` sale marcado y es
// casualidad: la función nombra el catálogo por otra cosa y emite por otra.
// Por eso el resultado se publica como **candidato**, y lo único que se
// afirma duro es el conteo de tipos que EMITIERON sin productor literal.
const tablasCandidatas = [...new Set([...porDato.values()].flatMap((s) => [...s]))]
  .map((f) => f.split('.')[0]);
const emisoresPorTabla = new Map();
if (tablasCandidatas.length) {
  const lista = [...new Set(tablasCandidatas)].map((t) => `(${quote(t)})`).join(',');
  for (const r of dbQueryReintento(`
    select t.tabla,
           (select string_agg(p.proname, ', ' order by p.proname)
              from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public'
               and pg_get_functiondef(p.oid) ~ ('\\m' || t.tabla || '\\M')
               and pg_get_functiondef(p.oid) like '%registrar_intencion_notificacion%'
               and p.proname <> 'registrar_intencion_notificacion') as emisores
      from (values ${lista}) t(tabla)`)) {
    emisoresPorTabla.set(r.tabla, r.emisores);
  }
}
const emite = (fuente) => Boolean(emisoresPorTabla.get(fuente.split('.')[0]));

// Control del discriminador: el caso que A ya probó tiene que dar emisor.
if (tablasCandidatas.includes('cat_guarderia_transiciones') &&
    !emisoresPorTabla.get('cat_guarderia_transiciones')) {
  console.error('🟠 NO CONCLUYENTE · el discriminador no encuentra el emisor de');
  console.error('   `cat_guarderia_transiciones`, que A ya probó que existe');
  console.error('   (`_guarderia_aplicar_acto`). El instrumento está roto, no el motor.');
  process.exit(2);
}

// ── ⑤ El cruce ────────────────────────────────────────────────────────────
const filas = tipos.map((t) => {
  const fuentes = porDato.has(t.codigo) ? [...porDato.get(t.codigo)] : [];
  return {
    codigo: t.codigo,
    categoria: t.categoria,
    intenciones: t.intenciones,
    literal: porLiteral.get(t.codigo) ?? null,
    emiten: fuentes.filter(emite),
    solo_contienen: fuentes.filter((f) => !emite(f)),
  };
});

const conLiteral = filas.filter((f) => f.literal);
const soloDato = filas.filter((f) => !f.literal && f.emiten.length);
const sinNada = filas.filter((f) => !f.literal && !f.emiten.length);

console.log('censo:productores-de-aviso — los DOS métodos, misma corrida\n');
console.log(`  tipos en catálogo ......................... ${filas.length}`);
console.log(`  columnas de texto recorridas .............. ${columnasLeidas} de ${cols.length}` +
            (columnasQueRebotaron ? `  ⚠️ ${columnasQueRebotaron} sin leer` : ''));
console.log(`  con productor por LITERAL (método de A) ... ${conLiteral.length}`);
console.log(`  con productor SÓLO por DATO ............... ${soloDato.length}   ← lo que el literal no veía`);
console.log(`  SIN productor por ningún método ........... ${sinNada.length}\n`);

if (soloDato.length) {
  console.log('  ── LOS QUE EL CENSO POR LITERAL MARCABA «SIN PRODUCTOR» ──');
  for (const f of soloDato) {
    console.log(`   · ${f.codigo.padEnd(30)} intenciones ${String(f.intenciones).padStart(4)}   ← ${f.emiten.join(' · ')}`);
  }
  console.log('');
}

const contienenSinEmitir = filas.filter((f) => f.solo_contienen.length && !f.emiten.length && !f.literal);
if (contienenSinEmitir.length) {
  console.log('  ── CONTIENEN EL CÓDIGO Y NO LO EMITEN (falsos verdes evitados) ──');
  for (const f of contienenSinEmitir) {
    console.log(`   · ${f.codigo.padEnd(30)} aparece en ${f.solo_contienen.join(' · ')}`);
  }
  console.log('   Son la SALIDA o la CONFIGURACIÓN, no el productor.\n');
}

console.log('  ── LOS QUE SIGUEN SIN PRODUCTOR, POR LOS DOS MÉTODOS ──');
for (const f of sinNada) {
  const marca = f.intenciones > 0 ? '🔴' : '  ';
  console.log(`   ${marca} ${f.codigo.padEnd(30)} ${f.categoria.padEnd(18)} intenciones ${String(f.intenciones).padStart(4)}`);
}

const mienten = sinNada.filter((f) => f.intenciones > 0);
if (mienten.length) {
  console.log(`\n🔴 ${mienten.length} tipo(s) emitieron sin que ningún método les encuentre productor:`);
  console.log(`   ${mienten.map((f) => f.codigo).join(', ')}`);
  console.log('   Eso no es «sin productor»: es que el censo sigue ciego a su forma.');
  process.exit(1);
}
console.log('\n🟢 Ningún tipo con intenciones quedó sin productor: los dos censos se cierran entre sí.');
