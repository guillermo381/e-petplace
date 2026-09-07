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
 * **Sí, una cosa, y se declara:** para la estadía acepta el evento anclado
 * **a la estadía O a su cita**, porque la letra todavía no fijó el ancla
 * (`origen_tipo` hoy sólo tiene el valor `cita`, medido). Hardcodear uno de
 * los dos produciría un rojo falso el día que el motor elija el otro.
 * **El día que la letra fije el ancla, esta tolerancia se cierra** — y hasta
 * entonces el gate lo dice en su salida, no en un comentario.
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
import { dbQuery } from './lib-db.mjs';

const NEG = '00000000-0000-0000-0000-0000000000ff'; // ejecutado SIN evento
const POS = '00000000-0000-0000-0000-0000000000aa'; // ejecutado CON evento

const SQL = `
with objetos as (
  -- Cita ejecutada y pagada. Se excluyen las que tienen estadía: ésas se
  -- miden por su estadía, que es donde vive su cierre real (el acta).
  select 'cita'::text as obj, c.id as id, null::uuid as id_alterno,
         coalesce(c.tipo_servicio,'(cita sin oficio)') as via,
         c.estado::text as estado, false as sintetico
    from evento_cita_servicio c
   where c.estado in ('completada','no_show')
     and c.estado_reserva = 'pagada'
     and not exists (select 1 from guarderia_estadias g where g.cita_id = c.id)
  union all
  -- Estadia entregada. id_alterno = su cita: la tolerancia declarada.
  select 'estadia', e.id, e.cita_id, 'guarderia', e.estado::text, false
    from guarderia_estadias e
   where e.estado = 'entregada'
  union all
  select 'pedido', p.id, null::uuid, 'despensa', p.estado::text, false
    from pedidos p
   where p.estado = 'entregado'
  union all
  select 'cita', '${NEG}'::uuid, null::uuid, '__control_negativo__', 'completada', true
  union all
  select 'cita', '${POS}'::uuid, null::uuid, '__control_positivo__', 'completada', true
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
            where (ee.origen_id = o.id or (o.id_alterno is not null and ee.origen_id = o.id_alterno))
              and ( ee.origen_tipo = o.obj
                 or (o.obj = 'estadia' and ee.origen_tipo in ('estadia','guarderia_estadia','cita'))
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
console.log('  tolerancia declarada: para la estadía se acepta el evento anclado');
console.log('  a la estadía O a su cita (la letra todavía no fijó el ancla).\n');
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
