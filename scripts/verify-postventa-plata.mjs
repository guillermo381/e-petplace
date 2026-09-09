#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * verify:postventa-plata — S114-E · el rojo de §6 de `LETRA_POSTVENTA`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **La firma que mide** (§6): al resolver, la RPC **le pregunta al objeto si
 * tiene evento económico**, y de ahí sale el camino de la plata:
 *
 *   · tiene devengo  → `aplicar_reembolso()`: evento inverso, el original a
 *     `reversado`, y el inverso se descuenta del payout siguiente.
 *   · no tiene devengo → **se declara sobre el pago** (patrón 7.14/7.16).
 *
 * **🔴 EL ROJO, con las palabras de la letra:** *«una devolución DECLARADA
 * sobre un objeto que tiene evento económico»*. Y su daño está escrito ahí
 * mismo, que es por lo que este arnés existe: *la plata vuelve a la familia,
 * el prestador conserva el devengo, y la casa paga la diferencia sin que
 * nadie lo vea.* **No hay excepción, ni error, ni traza: hay un descuadre
 * silencioso que sólo aparece cuando alguien suma.**
 *
 * ── ESTE ARNÉS MIDE ANTES DE QUE EXISTA SU TABLA, Y POR ESO SIRVE ─────────
 * `casos_postventa` todavía no existe (medido). Un arnés que se limitara a
 * decir «no hay tabla» no probaría nada el día que la haya. Éste corre **el
 * predicado real contra `eventos_economicos` REALES**, con casos sintéticos
 * armados sobre objetos de verdad:
 *
 *   · **control negativo (EL ROJO):** un caso `declarado` sobre una cita que
 *     SÍ tiene evento ⇒ tiene que salir marcado.
 *   · **control positivo ①:** un caso `declarado` sobre una cita SIN evento
 *     ⇒ no tiene que salir marcado (es el camino correcto).
 *   · **control positivo ②:** un caso `aplicar_reembolso` sobre una cita CON
 *     evento ⇒ no tiene que salir marcado (también es el correcto).
 *
 * Los tres objetos salen del dato: el arnés los ELIGE de la base, no los
 * inventa. Si no encuentra una cita con evento y otra sin evento, **sale 2**:
 * sin los dos casos no puede probar que discrimina.
 *
 * ── EL CONTRATO QUE ESTE ARNÉS NECESITA (para quien construya §6) ─────────
 * Cuando exista la tabla del caso, tiene que poder responder tres cosas:
 *   ① el objeto del caso        → `objeto_tipo` + `objeto_id`
 *   ② por qué camino salió      → `camino_plata ∈ (declarado, aplicar_reembolso)`
 *   ③ con qué monto             → `monto_devuelto`
 * §6 lo pide literal: *«el caso registra por cuál de los dos caminos salió, y
 * con qué monto»*. **Sin esas tres, este rojo es inmedible** — y se dice acá
 * para que la forma no se descubra después de la primera devolución.
 *
 * ── ¿PERDONA ALGO QUE EL PRODUCTO NO PERDONA? ─────────────────────────────
 * **Sí, dos cosas:**
 * · **No mira el MONTO.** Un `aplicar_reembolso` por el número equivocado sale
 *   verde acá. Mide el CAMINO, no la cifra.
 * · **Un evento en estado `reversado` sigue contando como «tiene evento».**
 *   Es deliberado: un objeto ya reversado que además reciba una devolución
 *   declarada es doble devolución, y este arnés lo quiere marcar.
 *
 * Salidas: 0 verde · 1 rojo · 2 no concluyente.
 */
import { dbQuery } from './lib-db.mjs';

const TABLAS_CANDIDATAS = ['casos_postventa', 'postventa_casos', 'casos'];
/* 🔴 EL CONTRATO SE ESCRIBIÓ ANTES QUE LA TABLA, Y EL NOMBRE NO COINCIDIÓ.
   Este arnés pedía `camino_plata`; A construyó `camino`, con el vocabulario
   `aplicar_reembolso | declarado_sobre_pago` (CHECK medido). *El gate se
   adapta al objeto — el objeto no se renombra para que el gate pase.* */
const COL_CAMINO = 'camino';
const VAL_DECLARADO = 'declarado_sobre_pago';

// ── ① Dos objetos REALES que discriminan: uno con evento y uno sin él ─────
let conEvento, sinEvento;
try {
  conEvento = dbQuery(`
    select c.id from evento_cita_servicio c
     where exists (select 1 from eventos_economicos e
                    where e.origen_tipo = 'cita' and e.origen_id = c.id)
     limit 1`)[0]?.id ?? null;
  /* 🔴 EL «SIN EVENTO» ES UN UUID FABRICADO, Y ESA ES LA CURA DE UN DEFECTO
     DE DISEÑO MÍO. La primera versión lo buscaba en la base — y funcionó
     mientras hubo objetos sin devengo. **El día que A6 llevó los 19 a 0, este
     arnés se quedó sin su control positivo y salió NO CONCLUYENTE justo cuando
     el sistema se puso sano.**
     *Un instrumento que necesita que el sistema esté roto para poder medir se
     apaga exactamente cuando deja de hacer falta arreglarlo.* Un uuid que no
     existe no tiene evento POR CONSTRUCCIÓN, y sirve igual para probar que el
     predicado distingue. */
  sinEvento = '00000000-0000-0000-0000-00000000515e';
} catch (e) {
  console.error('🟠 NO CONCLUYENTE · la consulta no corrió — el gate NO dice verde.');
  console.error(`   ${e.message.slice(0, 300)}`);
  process.exit(2);
}

if (!conEvento) {
  console.error('🟠 NO CONCLUYENTE · no hay en la base ninguna cita CON evento económico.');
  console.error('   Sin ella el control positivo es sintético de los dos lados y el arnés');
  console.error('   no puede probar que encuentra un evento cuando existe.');
  process.exit(2);
}

// ── ② EL PREDICADO — uno solo, aplicado a los controles y a los casos reales ─
//    `tiene_evento` se pregunta al objeto, igual que lo hará la RPC de §6.
function consultaSobre(fuenteCasos) {
  return `
    with casos as (${fuenteCasos}),
    marcados as (
      select k.*,
             exists (select 1 from eventos_economicos e
                      where e.origen_id = k.objeto_id
                        and ( e.origen_tipo = k.objeto_tipo
                           or (k.objeto_tipo = 'estadia' and e.origen_tipo in ('estadia','guarderia_estadia','cita'))
                           or (k.objeto_tipo = 'pedido'  and e.origen_tipo in ('pedido','compra')) )
                    ) as tiene_evento
        from casos k
    )
    select etiqueta, camino_plata, tiene_evento,
           (camino_plata = '${VAL_DECLARADO}' and tiene_evento) as es_rojo
      from marcados order by etiqueta`;
}

const CONTROLES = `
  select '1 · NEGATIVO declarado sobre objeto CON evento'::text as etiqueta,
         'cita'::text as objeto_tipo, '${conEvento}'::uuid as objeto_id,
         '${VAL_DECLARADO}'::text as camino_plata
  union all
  select '2 · positivo declarado sobre objeto SIN evento (uuid fabricado)', 'cita', '${sinEvento}'::uuid, '${VAL_DECLARADO}'
  union all
  select '3 · positivo aplicar_reembolso sobre objeto CON evento', 'cita', '${conEvento}'::uuid, 'aplicar_reembolso'`;

const ctrl = dbQuery(consultaSobre(CONTROLES));
console.log('verify:postventa-plata · §6 de LETRA_POSTVENTA\n');
console.log('  ── LOS TRES CONTROLES, sobre objetos REALES de la base ──');
for (const c of ctrl) {
  console.log(`   ${c.es_rojo ? '🔴' : '  '} ${c.etiqueta.padEnd(52)} evento=${String(c.tiene_evento).padEnd(5)} rojo=${c.es_rojo}`);
}
const esperado = [true, false, false];
const obtenido = ctrl.map((c) => c.es_rojo);
if (ctrl.length !== 3 || esperado.some((v, i) => v !== obtenido[i])) {
  console.error('\n🟠 NO CONCLUYENTE · EL PREDICADO NO DISCRIMINA.');
  console.error(`   esperado ${JSON.stringify(esperado)} · obtenido ${JSON.stringify(obtenido)}`);
  console.error('   El control negativo tiene que dar rojo y los dos positivos no.');
  console.error('   Mientras eso no pase, un cero de este gate no significa nada.');
  process.exit(2);
}
console.log('\n  ✅ el predicado produce su rojo y no marca los dos caminos correctos.');

// ── ③ ¿EXISTE YA LA TABLA DEL CASO? ──────────────────────────────────────
const hallada = dbQuery(
  `select ${TABLAS_CANDIDATAS.map((t) => `to_regclass('public.${t}') as ${t}`).join(', ')}`,
)[0];
const tabla = TABLAS_CANDIDATAS.find((t) => hallada[t]);

if (!tabla) {
  console.error('\n🟠 NO CONCLUYENTE · todavía no existe la tabla del caso.');
  console.error(`   buscadas: ${TABLAS_CANDIDATAS.join(' · ')}`);
  console.error('   El predicado ya está probado; lo que falta es su sujeto.');
  console.error('   Contrato que necesita para medir: `objeto_tipo` · `objeto_id` ·');
  console.error('   `camino_plata ∈ (declarado, aplicar_reembolso)` · `monto_devuelto`.');
  process.exit(2);
}

const cols = dbQuery(`
  select string_agg(a.attname, ',') as c from pg_attribute a
   join pg_class cl on cl.oid = a.attrelid join pg_namespace n on n.oid = cl.relnamespace
  where n.nspname = 'public' and cl.relname = '${tabla}' and a.attnum > 0 and not a.attisdropped`,
)[0].c.split(',');
const faltan = ['objeto_tipo', 'objeto_id', COL_CAMINO].filter((c) => !cols.includes(c));
if (faltan.length) {
  console.error(`\n🟠 NO CONCLUYENTE · \`${tabla}\` existe pero le faltan columnas: ${faltan.join(', ')}`);
  console.error('   §6 exige registrar por cuál de los dos caminos salió la plata.');
  process.exit(2);
}

const reales = dbQuery(consultaSobre(`
  select coalesce(etapa::text,'?') || ' · clase ' || clase::text || ' · ' || id::text as etiqueta,
         objeto_tipo, objeto_id, ${COL_CAMINO} as camino_plata
    from ${tabla} where ${COL_CAMINO} is not null`));
const rojos = reales.filter((r) => r.es_rojo);
console.log(`\n  casos con camino de plata registrado: ${reales.length}`);
if (rojos.length) {
  console.error(`\n🔴 ROJO · ${rojos.length} devoluciones DECLARADAS sobre objetos CON evento económico.`);
  for (const r of rojos) console.error(`   · ${r.etiqueta}`);
  console.error('   La plata volvió a la familia, el prestador conservó el devengo, y la');
  console.error('   casa paga la diferencia. §6 existe para que esto no pueda pasar.');
  process.exit(1);
}
console.log('\n🟢 VERDE · ninguna devolución declarada cayó sobre un objeto que devengó.');
