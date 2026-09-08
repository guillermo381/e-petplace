#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:devengo-por-sujeto — S114-E · el rojo de §8 de `LETRA_POSTVENTA`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **SUJETO:** los objetos EJECUTADOS. §8 lo dice en una línea — *«el evento
 * económico nace de lo ejecutado»* — así que la unidad de medida no es el
 * comprable (cómo se pagó) sino **el objeto que ocurrió**:
 *
 *   · cita     `estado ∈ (completada, no_show)` y `estado_reserva='pagada'`
 *   · estadía  `estado='entregada'`   (guardería día · paquete · mensualidad)
 *   · pedido   `estado='entregado'`   (despensa, cuarto escalón)
 *
 * Los siete comprables aparecen en el desglose, no en el universo: un plan, un
 * bono, un paquete o una mensualidad **entran por su cita o su estadía**
 * (`LETRA_POSTVENTA` §1), y por eso contarlos aparte sería contar dos veces.
 *
 * **🔴 EL ROJO:** un objeto ejecutado y pagado que no produjo evento económico.
 * Sin devengo no hay liquidación, y sin liquidación **no hay de dónde
 * descontar una devolución** — que es exactamente lo que este arco viene a
 * construir.
 *
 * ── POR QUÉ LOS DOS CONTROLES VIVEN ADENTRO Y CORREN SIEMPRE ──────────────
 * Hoy el rojo lo produce el dato solo (`L-459` cumplida sin esfuerzo: hay
 * objetos ejecutados sin evento). **El problema es el día después de la
 * cura:** con todo en verde, un `join` roto, una tabla renombrada o un
 * `origen_tipo` que cambia de valor darían **cero violaciones** — y cero se
 * lee como salud. Por eso el mismo predicado se aplica, en cada corrida, a
 * dos filas sintéticas:
 *
 *   · **control negativo** — un objeto ejecutado SIN evento ⇒ tiene que salir
 *     marcado. Si no sale, el gate **no está midiendo** y sale 2.
 *   · **control positivo** — un objeto ejecutado CON evento ⇒ NO tiene que
 *     salir marcado. Si sale, el predicado marca de más y sale 2.
 *
 * Las dos filas son literales dentro del `SELECT`: **el gate no escribe nada**
 * en la base, ni siquiera dentro de una transacción.
 *
 * ── ¿PERDONA ALGO QUE EL PRODUCTO NO PERDONA? ─────────────────────────────
 * **La tolerancia grande SE CERRÓ.** Una versión anterior aceptaba, para la
 * estadía, el evento anclado **a la estadía O a su cita**, porque la letra no
 * había fijado el ancla. **La mesa la fijó: el ancla del evento de guardería
 * es la ESTADÍA** (decisión del 7-sep; A deposita la enmienda a §8 —al
 * escribir esto, la versión de §8 en `main` todavía dice «el acta de
 * `entregar`» sin nombrar el ancla, y se cita la mesa, no el documento).
 * ⇒ **un evento anclado a la cita de una estadía ya NO cuenta**, y el arnés
 * es más estricto que ayer, no menos.
 *
 * **Y la tolerancia de VOCABULARIO también se cerró** (7-sep, tras A6): cuando
 * no había un solo evento de guardería, el literal de `origen_tipo` era una
 * incógnita y el gate aceptaba `estadia` **o** `guarderia_estadia`. **Medido
 * ahora que el productor existe: el motor escribe `estadia`** (`origen_tipo`
 * vivo: `cita` 53 · `estadia` 1 · `pedido` 3). ⇒ **se acepta sólo ése.**
 * *Una tolerancia se abre cuando el objeto no puede contestar y se cierra el
 * día que contesta — dejarla abierta después sería no haber preguntado.*
 *
 * **Y sigue sin mirar el MONTO**, sólo la existencia del evento.
 *
 * ── LO QUE NO MIDE, DECLARADO ─────────────────────────────────────────────
 * · **No mide el MONTO** del evento, sólo su existencia. Un evento por el
 *   número equivocado sale verde acá.
 * · **No distingue dato de prueba de dato real.** `evento_cita_servicio` no
 *   tiene `creado_por_sistema` (la marca que S113 puso en `mascotas`), así que
 *   no hay forma limpia de separar seed de real — y **ningún número de hoy
 *   sirve como línea base**: producción es octubre.
 * · **No mide la mensualidad de guardería por día.** §8 firma que devenga
 *   *por día ejecutado*; el día ejecutado es una estadía, así que el conteo
 *   cae acá — pero si una mensualidad produjera UN evento por el mes entero,
 *   este gate lo vería como una estadía con evento y **no lo marcaría**.
 *   Ese rojo es de otro instrumento y todavía no tiene sujeto.
 *
 * Salidas: 0 verde · 1 rojo (hay objetos sin evento) · 2 no concluyente.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dbQuery } from './lib-db.mjs';
import { arbolAlDia, lineaDeArbol } from './lib-arbol.mjs';

/* ═══════════════════════════════════════════════════════════════════════════
 * ANTES / DESPUÉS — la medición que prueba que el ledger dejó de estar mudo
 * ═══════════════════════════════════════════════════════════════════════════
 *   node scripts/verify-devengo-por-sujeto.mjs --instantanea <ruta>
 *   node scripts/verify-devengo-por-sujeto.mjs --contra <ruta>
 *
 * 🔴 **UNA BAJA DEL NÚMERO NO PRUEBA, POR SÍ SOLA, QUE APARECIERON LOS
 * PRODUCTORES.** «19 → 9» puede significar tres cosas distintas y sólo una es
 * la buena:
 *   · el universo quedó igual y aparecieron eventos ⇒ **el productor nació** ✅
 *   · el universo se achicó ⇒ **desaparecieron objetos**, no nacieron eventos
 *   · el universo creció y los sin-evento también ⇒ tráfico nuevo sin productor
 * Por eso la comparación es **por oficio y en dos columnas** (`n` y
 * `sin evento`), y el veredicto **nombra cuál de los tres pasó**. *Mirar sólo
 * el total deja las tres indistinguibles.*
 *
 * ⚠️ **La instantánea lleva FECHA, HORA y SHA.** En una sesión de seis pistas
 * un cero del motor vence en horas; sin su hora, un «antes» no se puede
 * comparar con nada. */
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const RUTA_GUARDAR = arg('--instantanea');
const RUTA_CONTRA = arg('--contra');

const NEG = '00000000-0000-0000-0000-0000000000ff'; // ejecutado SIN evento
const POS = '00000000-0000-0000-0000-0000000000aa'; // ejecutado CON evento

const SQL = `
with objetos as (
  -- Cita ejecutada y pagada. Se excluyen las que tienen estadía: ésas se
  -- miden por su estadía, que es donde vive su cierre real (el acta).
  select 'cita'::text as obj, c.id as id,
         coalesce(c.tipo_servicio,'(cita sin oficio)') as via,
         c.estado::text as estado, false as sintetico
    from evento_cita_servicio c
   where c.estado in ('completada','no_show')
     and c.estado_reserva = 'pagada'
     and not exists (select 1 from guarderia_estadias g where g.cita_id = c.id)
  union all
  -- Estadía entregada. EL ANCLA ES LA ESTADÍA (mesa, 7-sep): su cita ya NO
  -- sirve de rebote. Un evento colgado de la cita de una guardería no cuenta.
  select 'estadia', e.id, 'guarderia', e.estado::text, false
    from guarderia_estadias e
   where e.estado = 'entregada'
  union all
  select 'pedido', p.id, 'despensa', p.estado::text, false
    from pedidos p
   where p.estado = 'entregado'
  union all
  select 'cita', '${NEG}'::uuid, '__control_negativo__', 'completada', true
  union all
  select 'cita', '${POS}'::uuid, '__control_positivo__', 'completada', true
),
eventos as (
  select origen_tipo, origen_id from eventos_economicos
  union all
  select 'cita', '${POS}'::uuid   -- el evento que hace limpio al control positivo
),
marcados as (
  select o.*,
         not exists (
           select 1 from eventos ee
            where ee.origen_id = o.id
              and ( ee.origen_tipo = o.obj
                 or (o.obj = 'estadia' and ee.origen_tipo = 'estadia')
                 or (o.obj = 'pedido'  and ee.origen_tipo in ('pedido','compra')) )
         ) as sin_evento
    from objetos o
)
select obj, via, estado, sintetico,
       count(*)::int as n,
       count(*) filter (where sin_evento)::int as sin_evento
  from marcados
 group by 1,2,3,4
 order by sintetico, sin_evento desc, obj, via`;

let filas;
try {
  filas = dbQuery(SQL);
} catch (e) {
  console.error('🟠 NO CONCLUYENTE · la consulta no corrió — el gate NO dice verde.');
  console.error(`   ${e.message}`);
  process.exit(2);
}

const sint = (v) => filas.find((f) => f.via === v) ?? null;
const cn = sint('__control_negativo__');
const cp = sint('__control_positivo__');

// ── LOS DOS CONTROLES, ANTES DE MIRAR NINGÚN NÚMERO REAL ──────────────────
if (!cn || cn.sin_evento !== 1) {
  console.error('🟠 NO CONCLUYENTE · EL CONTROL NEGATIVO NO PRODUJO SU ROJO.');
  console.error('   Un objeto ejecutado sin evento NO salió marcado ⇒ el predicado');
  console.error('   dejó de medir. Un cero de este gate hoy no significa salud.');
  console.error(`   control negativo: ${JSON.stringify(cn)}`);
  process.exit(2);
}
if (!cp || cp.sin_evento !== 0) {
  console.error('🟠 NO CONCLUYENTE · EL CONTROL POSITIVO SALIÓ MARCADO.');
  console.error('   Un objeto ejecutado CON evento fue contado como sin evento ⇒ el');
  console.error('   predicado marca de más y todo rojo de abajo es sospechoso.');
  console.error(`   control positivo: ${JSON.stringify(cp)}`);
  process.exit(2);
}

const reales = filas.filter((f) => !f.sintetico);

// ── INSTANTÁNEA ──────────────────────────────────────────────────────────
if (RUTA_GUARDAR) {
  const sha = (() => { try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return null; } })();
  /* La instantánea guarda TAMBIÉN si el árbol estaba al día: un «antes» tomado
     desde un árbol viejo compara supuestos viejos con actuales, y el delta
     resultante mezcla la cura con el cambio de instrumento. */
  const arbolSnap = arbolAlDia();
  writeFileSync(RUTA_GUARDAR, JSON.stringify({
    arbol_al_dia: arbolSnap.ok, commits_ajenos: arbolSnap.ajenos,
    tomada_en: new Date().toISOString(),
    tomada_en_local: new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
    sha, filas: reales,
  }, null, 1));
  console.log(`instantánea guardada en ${RUTA_GUARDAR}`);
  console.log(`   ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })} Guayaquil · sha ${sha?.slice(0, 8)}`);
  console.log(`   ${lineaDeArbol(arbolSnap)}`);
}

// ── COMPARACIÓN ──────────────────────────────────────────────────────────
if (RUTA_CONTRA) {
  if (!existsSync(RUTA_CONTRA)) {
    console.error(`🟠 NO CONCLUYENTE · no existe la instantánea ${RUTA_CONTRA}.`);
    process.exit(2);
  }
  const antes = JSON.parse(readFileSync(RUTA_CONTRA, 'utf8'));
  const clave = (f) => `${f.obj}·${f.via}`;
  const mapA = new Map(antes.filas.map((f) => [clave(f), f]));
  const mapD = new Map(reales.map((f) => [clave(f), f]));
  const todas = [...new Set([...mapA.keys(), ...mapD.keys()])].sort();

  console.log('\n═══ ANTES / DESPUÉS ═══');
  console.log(`  ANTES   ${antes.tomada_en_local} Guayaquil · sha ${String(antes.sha).slice(0, 8)}` +
              (antes.arbol_al_dia === false ? '  🔴 tomada desde un ÁRBOL VIEJO' : ''));
  console.log(`  DESPUÉS ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })} Guayaquil · sha ${(() => { try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim().slice(0, 8); } catch { return '?'; } })()}`);
  console.log(`          ${lineaDeArbol()}`);
  console.log('\n  vía                            n antes→después   sin evento antes→después');
  for (const k of todas) {
    const a = mapA.get(k), d = mapD.get(k);
    const nA = a?.n ?? 0, nD = d?.n ?? 0, sA = a?.sin_evento ?? 0, sD = d?.sin_evento ?? 0;
    const marca = sD < sA ? '🟢' : sD > sA ? '🔴' : '  ';
    console.log(`  ${marca} ${k.padEnd(30)} ${String(nA).padStart(3)} → ${String(nD).padEnd(6)}    ${String(sA).padStart(3)} → ${String(sD)}`);
  }
  const uA = antes.filas.reduce((x, f) => x + f.n, 0), uD = reales.reduce((x, f) => x + f.n, 0);
  const sAt = antes.filas.reduce((x, f) => x + f.sin_evento, 0), sDt = reales.reduce((x, f) => x + f.sin_evento, 0);
  console.log(`\n  universo ${uA} → ${uD}  ·  SIN evento ${sAt} → ${sDt}`);

  // 🔴 EL VEREDICTO NOMBRA CUÁL DE LOS TRES PASÓ.
  if (sDt < sAt && uD >= uA) {
    console.log(`\n🟢 EL LEDGER DEJÓ DE ESTAR MUDO en ${sAt - sDt} sujeto(s).`);
    console.log('   El universo NO se achicó, así que la baja es por eventos que antes');
    console.log('   no existían: **nacieron productores**, no desaparecieron objetos.');
  } else if (sDt < sAt && uD < uA) {
    console.log(`\n🟠 El número bajó (${sAt} → ${sDt}) PERO el universo también (${uA} → ${uD}).`);
    console.log('   No se puede atribuir a productores nuevos: desaparecieron objetos.');
    console.log('   *Una baja con universo menor no prueba nada del ledger.*');
  } else if (sDt > sAt) {
    console.log(`\n🔴 SUBIÓ: ${sAt} → ${sDt}. Entraron objetos ejecutados sin productor.`);
  } else {
    console.log('\n⚪ Sin cambio en los sujetos sin evento.');
  }
}
const universo = reales.reduce((a, f) => a + f.n, 0);
const sinEvento = reales.reduce((a, f) => a + f.sin_evento, 0);
const conEvento = universo - sinEvento;

// Un universo vacío no es verde: es que no hay nada que medir.
if (universo === 0) {
  console.error('🟠 NO CONCLUYENTE · CERO objetos ejecutados en la base.');
  console.error('   Sin universo, «cero violaciones» no distingue salud de vacío.');
  process.exit(2);
}
// Y si NINGUNO tiene evento, el join podría estar roto en vez de faltar el motor.
if (conEvento === 0) {
  console.error('🟠 NO CONCLUYENTE · ningún objeto real tiene evento económico.');
  console.error('   Con 0 de 0 aciertos no se puede separar «el motor no devenga» de');
  console.error('   «el join no encuentra». El control positivo es sintético; éste');
  console.error('   tiene que salir del dato.');
  process.exit(2);
}

console.log('verify:devengo-por-sujeto · §8 de LETRA_POSTVENTA');
console.log('  controles: negativo produjo su rojo ✅ · positivo no marcó ✅');
console.log('  ancla de guardería: LA ESTADÍA (mesa 7-sep) — un evento colgado de');
console.log('  su cita no cuenta, y el literal quedó fijado en `estadia`: medido');
console.log('  contra el motor una vez que su productor existió. Cero tolerancias.\n');
console.log('  obj      vía                        estado       n   sin evento');
for (const f of reales) {
  const marca = f.sin_evento > 0 ? '🔴' : '  ';
  console.log(
    `  ${marca} ${f.obj.padEnd(8)} ${String(f.via).padEnd(26)} ${String(f.estado).padEnd(11)} ` +
    `${String(f.n).padStart(3)}  ${String(f.sin_evento).padStart(6)}`,
  );
}
console.log(`\n  universo ${universo} · con evento ${conEvento} · SIN evento ${sinEvento}`);

if (sinEvento > 0) {
  console.error(`\n🔴 ROJO · ${sinEvento} objetos ejecutados y pagados sin evento económico.`);
  console.error('   Sin devengo no hay liquidación, y sin liquidación no hay de dónde');
  console.error('   descontar una devolución (§6). Faltan los productores de F10.');
  process.exit(1);
}
console.log('\n🟢 VERDE · todo objeto ejecutado y pagado produjo su evento económico.');
