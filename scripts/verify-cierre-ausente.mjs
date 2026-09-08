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
  /* 🔴 `no_ejecutado` EXISTE COMO MOTIVO Y NO COMO ESTADO — y esa colisión de
     nombre es una trampa. Quien haga `grep no_ejecutado` lo encuentra en
     `cat_motivos_postventa` (objeto `cita`, clase 1: «No vino / no me
     atendieron») y concluye que la regla está construida. **No lo está:** ése
     es el MOTIVO que la familia elige, no el ESTADO al que el reloj mueve al
     objeto a las 48 h. Por eso se busca el estado donde un estado vive —un
     CHECK o un enum— y NUNCA en una fila de catálogo. */
  existeEstado = dbQuery(`
    select (select count(*) from pg_constraint
             where pg_get_constraintdef(oid) like '%no_ejecutado%')
         + (select count(*) from pg_type t join pg_enum e on e.enumtypid = t.oid
             where e.enumlabel = 'no_ejecutado') as n`)[0].n;
  /* Y se mide aparte si existe QUIEN lo mueva: sin reloj, el estado solo no
     alcanza — serían dos verdes distintos y uno no implica al otro. */
  var existeReloj = dbQuery(`
    select count(*)::int as n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public'
       and (p.proname ~ 'cierre_ausente|sin_cerrar|no_ejecut'
            or pg_get_functiondef(p.oid) ~ 'cierre ausente')`)[0].n;

  sujeto = dbQuery(`
    with objetos as (
      /* 🔴 EL UNIVERSO INCLUYE LOS CERRADOS, Y ESA ES LA CURA DE UN DEFECTO
         DE DISEÑO MÍO. La primera versión los excluía, así que el universo
         ERA la lista de incumplimientos: **el día que todo se cierre a tiempo
         quedaría en cero y el arnés saldría NO CONCLUYENTE justo cuando el
         producto empiece a funcionar** — y nadie lo notaría, porque todo
         estaria verde. Es la misma clase que se comio el control de
         verify:postventa-plata.
         Ahora el universo es **todo objeto pagado cuyo fin declarado pasó**,
         se haya cerrado o no; el ROJO son los que no se resolvieron de
         ninguna de las dos formas. *El sujeto de este arnés es el paso del
         tiempo, que no se arregla nunca.* */
      select 'cita'::text as obj, c.id, ${FIN_CITA} as fin,
             (c.estado in ('completada','no_show','cancelada','rechazada','no_realizable')) as resuelto,
             (c.estado = 'no_ejecutado') as marcado
        from evento_cita_servicio c
       where c.estado_reserva = 'pagada' and c.hora is not null
      union all
      select 'pedido', p.id, e.promesa_entrega_hasta,
             (p.estado in ('entregado','cancelado_cliente','cancelado_sistema','cancelado_vendedor')
              or e.entregado_en is not null),
             (p.estado = 'no_ejecutado')
        from pedidos p
        join envios e on e.pedido_id = p.id
       where e.promesa_entrega_hasta is not null
    )
    select obj,
           case when now() - fin > interval '48 hours' then 'c · pasó 48 h'
                when now() - fin > interval '24 hours' then 'b · entre 24 y 48 h'
                when now() > fin                       then 'a · terminó, menos de 24 h'
                else 'z · todavía no termina' end as ventana,
           count(*)::int as n,
           count(*) filter (where resuelto)::int as cerrados,
           count(*) filter (where marcado)::int as ya_marcados,
           count(*) filter (where not resuelto and not marcado)::int as sin_resolver
      from objetos
     group by 1, 2 order by 1, 2`);
} catch (e) {
  console.error('🟠 NO CONCLUYENTE · la consulta no corrió — el gate NO dice verde.');
  console.error(`   ${e.message.slice(0, 300)}`);
  process.exit(2);
}

const pasaron48 = sujeto.filter((f) => f.ventana.startsWith('c ·'));
const total48 = pasaron48.reduce((a, f) => a + f.n, 0);
const sinResolver = pasaron48.reduce((a, f) => a + f.sin_resolver, 0);

console.log('verify:cierre-ausente · §2 (F1) de LETRA_POSTVENTA\n');
console.log('  obj      ventana desde el fin declarado      n  cerrados  no_ejec  SIN RESOLVER');
for (const f of sujeto) {
  console.log(`  ${f.obj.padEnd(8)} ${f.ventana.padEnd(28)} ${String(f.n).padStart(4)}` +
              ` ${String(f.cerrados).padStart(8)} ${String(f.ya_marcados).padStart(8)} ${String(f.sin_resolver).padStart(12)}`);
}

// ── ① CONTROL POSITIVO DEL SUJETO — antes de medir nada (orden de §2) ─────
if (total48 === 0) {
  console.error('\n🟠 NO CONCLUYENTE · CERO objetos con más de 48 h desde su fin declarado.');
  console.error('   Sin sujeto, «ninguno dejó de expirar» es verdad y no significa nada.');
  console.error('   §2 lo pide literal: el arnés confirma que su sujeto existe antes de medir.');
  console.error('   (El universo son TODOS los objetos pagados cuyo fin pasó, cerrados');
  console.error('    incluidos: si esto da cero, es que no hay objetos, no que estén sanos.)');
  process.exit(2);
}
console.log(`\n  control positivo del sujeto: ${total48} objetos pasaron las 48 h ✅`);
console.log('  (incluye los cerrados: el sujeto es el paso del tiempo, que no se arregla)');

// ── ② ¿EXISTE EL ESTADO AL QUE HABÍA QUE MOVER? ──────────────────────────
if (existeEstado === 0) {
  console.error('\n🟠 NO CONCLUYENTE · el estado `no_ejecutado` NO EXISTE en ningún CHECK.');
  console.error(`   Hay ${sinResolver} objetos SIN RESOLVER que ya deberían estar en él (de ${total48}`);
  console.error('   que pasaron las 48 h; el resto se cerró bien), pero el arnés no puede');
  console.error('   separar «el cron no corrió» de «el estado al que mover no existe»:');
  console.error('   son dos rojos distintos y mandan a lugares distintos.');
  console.error(`   (reloj que lo mueva: ${existeReloj} funciones — se mide aparte, porque el`);
  console.error('   estado sin reloj y el reloj sin estado son dos verdes distintos.)');
  console.error('   ⚠️ OJO CON EL NOMBRE: `no_ejecutado` SÍ existe como MOTIVO en');
  console.error('   `cat_motivos_postventa` (clase 1). Ése es el que la familia elige, NO el');
  console.error('   estado al que el reloj mueve el objeto. Un grep lo confunde.');
  console.error('   BLOQUEANTE NOMBRADO, con su dueño: el estado nace con **A6**, el arco');
  console.error('   de la regla del cierre ausente (F1). Hasta entonces falta agregar');
  console.error('   `no_ejecutado` al CHECK de `evento_cita_servicio.estado` (y su gemelo');
  console.error('   en pedido). **Este naranja NO se fuerza a verde**: mientras el estado');
  console.error('   no exista, un verde acá diría que el reloj corrió, y no hay reloj.');
  process.exit(2);
}

// ── ③ EL ROJO REAL ───────────────────────────────────────────────────────
if (sinResolver > 0) {
  console.error(`\n🔴 ROJO · ${sinResolver} objetos pasaron las 48 h SIN cerrarse y SIN quedar en \`no_ejecutado\`.`);
  console.error('   El reloj de §2 no corrió sobre ellos: siguen pudiendo devengar.');
  console.error('   (F1: dispara «nada marcado», cualquiera sea la causa — es ausencia');
  console.error('   de cierre, no un índice de prestadores que fallaron.)');
  process.exit(1);
}
console.log('\n🟢 VERDE · todo objeto pasado de 48 h se cerró o quedó en `no_ejecutado`.');
