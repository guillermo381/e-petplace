#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:cierre-ausente — S114-E · el reloj de 24/48 h de §2 (F1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **La firma que mide** (`LETRA_POSTVENTA` §2): cerrar es obligatorio. A las
 * **24 h** del fin declarado, aviso al prestador; a las **48 h**, el objeto
 * queda **`no_ejecutado`** — no devenga y dispara la clase 1.
 *
 * **El fin declarado, del objeto y no de un supuesto:**
 *   · cita     `fecha + hora + duracion_minutos`
 *   · estadía  su cita (la estadía cuelga de `cita_id`)
 *   · pedido   `envios.promesa_entrega_hasta`
 *
 * **🔴 EL ROJO QUE ESTE ARNÉS TIENE QUE PODER PRODUCIR** — y es el que §2 pide
 * con todas las letras: *«un objeto que debía expirar y no expiró»*.
 *
 * ── EL CONTROL POSITIVO VA PRIMERO, Y ES UNA ORDEN DE LA LETRA ────────────
 * §2: *«el arnés confirma que su sujeto existe antes de medir»*. Sin objetos
 * pasados de 48 h, «cero que debían expirar y no expiraron» **es verdad y no
 * significa nada** — y se leería como salud. Por eso, sin sujeto, sale 2.
 *
 * ── POR QUÉ HOY SALE NO CONCLUYENTE Y NO ROJO ─────────────────────────────
 * Medido: **`no_ejecutado` no existe en ningún CHECK de la base** (cero
 * ocurrencias en `pg_constraint`). Sin el estado, el arnés no puede separar
 * *«el cron no corrió»* de *«el estado al que tenía que mover no existe»* —
 * son dos rojos distintos y uno manda a mirar el reloj mientras el otro manda
 * a escribir una migración. **Un instrumento que no puede distinguir sus dos
 * rojos no reporta ninguno: dice qué le falta y sale 2.**
 *
 * ── ¿PERDONA ALGO QUE EL PRODUCTO NO PERDONA? — NO, Y HAY QUE DECIR POR QUÉ ─
 * Una versión anterior de esta cabecera declaraba como *tolerancia* que el
 * arnés «no distingue un incumplimiento de un servicio prestado que nadie
 * cerró». **Era una mala lectura de F1, y se retira.**
 *
 * **F1 hace la causa deliberadamente irrelevante.** Su tabla no tiene una fila
 * para «el prestador incumplió»: tiene tres actos —`cierre_con_calidad`,
 * `cierre_no_show`, y **nada marcado**— y es el tercero el que dispara. *El
 * prestador cobra sólo si marca uno.* Un servicio prestado y no cerrado **no
 * devenga igual**, y eso no es un hueco de medición: es la firma.
 *
 * ⇒ **el sujeto de este arnés y el de F1 son el mismo objeto**, y no hay nada
 * que perdonar. Lo único que hay que cuidar es el NOMBRE del número: es
 * *ausencia de cierre*, que es lo que F1 castiga — **no** un índice de
 * prestadores que fallaron. *Esa distinción es de lectura, no de alcance.*
 *
 * ── LO QUE NO MIDE ────────────────────────────────────────────────────────
 * · **No mide que el AVISO de 24 h haya salido.** Eso es un contador de
 *   `notificacion_intencion` sobre un tipo que todavía no existe.
 * · **No distingue dato de prueba.** `evento_cita_servicio` no tiene
 *   `creado_por_sistema`. Ningún número de hoy es línea base.
 * · **La estadía hereda el fin de su cita.** Si una estadía declarara su
 *   propia hora de devolución, este arnés la ignoraría.
 *
 * Salidas: 0 verde · 1 rojo · 2 no concluyente.
 */
import { dbQuery } from './lib-db.mjs';

const FIN_CITA = "(c.fecha + c.hora + make_interval(mins => coalesce(c.duracion_minutos, 0))) at time zone 'America/Guayaquil'";

let existeEstado, sujeto;
try {
  existeEstado = dbQuery(
    "select count(*)::int as n from pg_constraint where pg_get_constraintdef(oid) like '%no_ejecutado%'",
  )[0].n;

  sujeto = dbQuery(`
    with objetos as (
      select 'cita'::text as obj, c.id, ${FIN_CITA} as fin, c.estado::text as estado
        from evento_cita_servicio c
       where c.estado_reserva = 'pagada'
         and c.estado not in ('completada','no_show','cancelada','rechazada','no_realizable')
         and c.hora is not null
      union all
      select 'pedido', p.id, e.promesa_entrega_hasta, p.estado::text
        from pedidos p
        join envios e on e.pedido_id = p.id
       where e.promesa_entrega_hasta is not null
         and e.entregado_en is null
         and p.estado not in ('entregado','cancelado_cliente','cancelado_sistema','cancelado_vendedor')
    )
    select obj,
           case when now() - fin > interval '48 hours' then 'c · pasó 48 h'
                when now() - fin > interval '24 hours' then 'b · entre 24 y 48 h'
                when now() > fin                       then 'a · terminó, menos de 24 h'
                else 'z · todavía no termina' end as ventana,
           count(*)::int as n,
           count(*) filter (where estado = 'no_ejecutado')::int as ya_marcados
      from objetos
     group by 1, 2 order by 1, 2`);
} catch (e) {
  console.error('🟠 NO CONCLUYENTE · la consulta no corrió — el gate NO dice verde.');
  console.error(`   ${e.message.slice(0, 300)}`);
  process.exit(2);
}

const pasaron48 = sujeto.filter((f) => f.ventana.startsWith('c ·'));
const total48 = pasaron48.reduce((a, f) => a + f.n, 0);
const marcados = pasaron48.reduce((a, f) => a + f.ya_marcados, 0);

console.log('verify:cierre-ausente · §2 (F1) de LETRA_POSTVENTA\n');
console.log('  obj      ventana desde el fin declarado        n   ya en no_ejecutado');
for (const f of sujeto) {
  console.log(`  ${f.obj.padEnd(8)} ${f.ventana.padEnd(30)} ${String(f.n).padStart(4)}  ${String(f.ya_marcados).padStart(6)}`);
}

// ── ① CONTROL POSITIVO DEL SUJETO — antes de medir nada (orden de §2) ─────
if (total48 === 0) {
  console.error('\n🟠 NO CONCLUYENTE · CERO objetos con más de 48 h desde su fin declarado.');
  console.error('   Sin sujeto, «ninguno dejó de expirar» es verdad y no significa nada.');
  console.error('   §2 lo pide literal: el arnés confirma que su sujeto existe antes de medir.');
  process.exit(2);
}
console.log(`\n  control positivo del sujeto: ${total48} objetos pasaron las 48 h ✅`);

// ── ② ¿EXISTE EL ESTADO AL QUE HABÍA QUE MOVER? ──────────────────────────
if (existeEstado === 0) {
  console.error('\n🟠 NO CONCLUYENTE · el estado `no_ejecutado` NO EXISTE en ningún CHECK.');
  console.error(`   Hay ${total48} objetos que ya deberían estar en él, pero el arnés no puede`);
  console.error('   separar «el cron no corrió» de «el estado al que mover no existe»:');
  console.error('   son dos rojos distintos y mandan a lugares distintos.');
  console.error('   BLOQUEANTE NOMBRADO, con su dueño: el estado nace con **A6**, el arco');
  console.error('   de la regla del cierre ausente (F1). Hasta entonces falta agregar');
  console.error('   `no_ejecutado` al CHECK de `evento_cita_servicio.estado` (y su gemelo');
  console.error('   en pedido). **Este naranja NO se fuerza a verde**: mientras el estado');
  console.error('   no exista, un verde acá diría que el reloj corrió, y no hay reloj.');
  process.exit(2);
}

// ── ③ EL ROJO REAL ───────────────────────────────────────────────────────
const sinMarcar = total48 - marcados;
if (sinMarcar > 0) {
  console.error(`\n🔴 ROJO · ${sinMarcar} objetos pasaron las 48 h y NO están en \`no_ejecutado\`.`);
  console.error('   El reloj de §2 no corrió sobre ellos: siguen pudiendo devengar.');
  console.error('   (F1: dispara «nada marcado», cualquiera sea la causa — es ausencia');
  console.error('   de cierre, no un índice de prestadores que fallaron.)');
  process.exit(1);
}
console.log('\n🟢 VERDE · todo objeto pasado de 48 h sin cierre quedó en `no_ejecutado`.');
