#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIEMBRA · casos de postventa — S114-E (7-sep-2026)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **POR QUÉ EXISTE.** `casos_postventa` estaba en CERO filas: C tenía cuatro
 * pantallas verificadas por typecheck y **ninguna caminada**, y los cinco
 * asientos de `verify:asientos-caso` se medían sobre tablas vacías. *Sobre cero
 * filas, «el tercero ve cero» es verdad y no significa nada.*
 *
 * 🔴 **TODO ENTRA POR LAS RPCs DE A, JAMÁS POR `INSERT`.** No es prolijidad:
 * `abrir_caso` es quien asigna la **clase desde la fila del catálogo** (§4),
 * quien **rutea por clase** (§5), quien escribe el primer mensaje del hilo
 * («no hay hilo vacío», §3.3) y quien aplica los seis guards —sesión, dueño,
 * memorial, ventana de 7 días, motivo del objeto, caso ya abierto—. *Un INSERT
 * fabrica filas que ninguna de esas reglas tocó, y después se miden como si
 * las hubieran pasado.*
 *
 * ── ⚠️ ESTO ES SIEMBRA, NO TRÁFICO ──────────────────────────────────────
 * **Marca:** todo `relato` empieza con `[SIEMBRA S114-E]`.
 * **Censo (el comando, para que ninguna medición futura los lea como uso real):**
 *
 *   select count(*) from casos_postventa where relato like '[SIEMBRA S114-E]%';
 *
 * **Ningún número que salga de estas filas es línea base.** Ningún dato de
 * servicio de esta base es real y producción es octubre.
 *
 * ⚠️ **La marca vive en `relato` porque `casos_postventa` NO tiene columna de
 * procedencia sintética** (`creado_por_sistema`, la que S113 puso en
 * `mascotas`). Se declara el atajo: *una marca dentro de un campo de texto que
 * la familia también escribe es más frágil que una columna* — el día que exista
 * la columna, esto se migra y el censo cambia de comando.
 *
 * ── LO QUE SIEMBRA, Y POR QUÉ ASÍ ───────────────────────────────────────
 * Una de cada clase, **en objetos distintos**, para que ninguna pantalla se
 * pruebe contra un solo caso disfrazado:
 *
 *   · clase 2 · CITA     — sobre un servicio **realmente cerrado** por este
 *     mismo script (iniciar → terminar → cerrar con calidad). *«Ejecutó y salió
 *     distinto» necesita una ejecución;* sobre una cita cuyo horario apenas
 *     pasó, la historia no se sostiene. **Y después se resuelve con monto**,
 *     así queda en ELEGIR DESTINO **con plata** — el sujeto de C4.
 *   · clase 1 · ESTADÍA  — `no_recogida_prestador`. El motor la resuelve solo
 *     (§5) y queda en ELEGIR DESTINO **sin monto**: los dos sabores del mismo
 *     estado, que se ven distinto en pantalla.
 *   · clase 3 · PEDIDO   — `producto_en_mal_estado`, urgente ⇒ `con_casa`.
 *
 * ⚠️ **EFECTO DECLARADO:** cerrar el paseo **DEVENGA** — nace un evento
 * económico. Es deliberado (le da a §6 un objeto con devengo, que es el camino
 * interesante) **y mueve el universo de `verify:devengo-por-sujeto`**. Se dice
 * acá para que nadie lea ese delta como un cambio del producto.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { dbQuery } from '../lib-db.mjs';

const MARCA = '[SIEMBRA S114-E]';
const RAIZ = resolve(new URL('../..', import.meta.url).pathname);
const FAMILIA = 'guillo381+8@gmail.com';
const PRESTADOR = 'demo-prestador@epetplace.dev';

const env = Object.fromEntries(
  readFileSync(`${RAIZ}/apps/cliente/.env.local`, 'utf8').split('\n')
    .filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const cl = (svc, acct) => execFileSync('security',
  acct ? ['find-generic-password', '-a', acct, '-s', svc, '-w'] : ['find-generic-password', '-s', svc, '-w'],
  { encoding: 'utf8' }).trim();

async function sesion(email, pass) {
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error(`${email}: ${error.message}`);
  return c;
}
const sFam = await sesion(FAMILIA, cl('epetplace-siembra-s97', 'siembra'));
const sPre = await sesion(PRESTADOR, cl('epetplace-cuenta-prueba'));
const uid = dbQuery(`select id from auth.users where email = '${FAMILIA}'`)[0].id;

const hechos = [];
const decir = (t) => { console.log(t); hechos.push(t); };

// ══ ① UN SERVICIO REALMENTE CERRADO ══════════════════════════════════════
decir('── ① el servicio cerrado ──');
let citaCerrada = dbQuery(`
  select c.id from evento_cita_servicio c
   join evento_atencion a on a.cita_id = c.id
  where c.user_id = '${uid}' and a.cerrada_en >= now() - interval '7 days'
  limit 1`)[0]?.id ?? null;

if (citaCerrada) {
  decir(`   ya existía una cita con atención cerrada en ventana: ${citaCerrada}`);
} else {
  /* ⚠️ Se busca PRIMERO una atención ya abierta: una corrida anterior de este
     mismo script pudo dejar una a medias (pasó: `iniciar_atencion_paseo`
     devuelve **jsonb**, no uuid, y la primera versión le pasó el objeto entero
     al siguiente paso). *Un sembrador que no retoma lo que dejó abierto deja
     residuo peor que el que vino a curar.* */
  const abierta = dbQuery(`
    select a.id from evento_atencion a join evento_cita_servicio c on c.id = a.cita_id
     where c.user_id = '${uid}' and a.cerrada_en is null and c.tipo_servicio = 'paseo'
     order by a.iniciada_en desc limit 1`)[0]?.id ?? null;
  const cand = abierta ? null : dbQuery(`
    select c.id from evento_cita_servicio c
     where c.user_id = '${uid}' and c.tipo_servicio = 'paseo'
       and c.estado_reserva = 'pagada' and c.estado = 'confirmada'
       and (c.fecha + c.hora)::timestamptz between now() - interval '7 days' and now()
       and not exists (select 1 from evento_atencion a where a.cita_id = c.id)
     order by c.fecha desc limit 1`)[0]?.id;
  if (!abierta && !cand) { decir('   🟠 no hay paseo pagado y sin atención dentro de la ventana.'); }
  else {
    let atId = abierta;
    if (!atId) {
      const ini = await sPre.rpc('iniciar_atencion_paseo', { p_cita_id: cand, p_empleado_id: null });
      // devuelve JSONB, no uuid — el id vive en `evento_atencion_id`.
      atId = ini.data?.evento_atencion_id ?? null;
      if (ini.error || !atId) decir(`   🟠 iniciar rebotó: ${ini.error?.message ?? JSON.stringify(ini.data)}`);
    } else decir(`   ↻ retomo una atención abierta de una corrida anterior: ${atId}`);
    if (atId) {
      /* `cerrar_paseo_con_calidad` exige el PARTE del perro (`falta_novedad_paseo`)
         — el guard funcionando. Se registra una novedad real del catálogo. */
      await sPre.rpc('agregar_novedad_paseo', {
        p_atencion_id: atId, p_novedad_codigo: 'paseo_tranquilo',
        p_detalle: `${MARCA} novedad mínima para poder cerrar.`,
      });
      const ter = await sPre.rpc('terminar_atencion_paseo', { p_atencion_id: atId, p_gps_motivo_fallo: 'siembra: sin GPS' });
      const cer = await sPre.rpc('cerrar_paseo_con_calidad', { p_atencion_id: atId, p_mensaje_familia: `${MARCA} paseo cerrado para poder abrir un caso.` });
      if (cer.error || cer.data?.ok === false) decir(`   🟠 cerrar rebotó: ${cer.error?.message ?? JSON.stringify(cer.data)} (terminar: ${JSON.stringify(ter.data ?? ter.error?.message)})`);
      else {
        citaCerrada = dbQuery(`select cita_id from evento_atencion where id = '${atId}'`)[0]?.cita_id ?? null;
        decir(`   ✅ paseo ${citaCerrada} CERRADO con calidad (y devengó — efecto declarado)`);
      }
    }
  }
}

// ══ ② LOS TRES CASOS, POR LA PUERTA ══════════════════════════════════════
decir('\n── ② los tres casos, por `abrir_caso` ──');
const estadia = dbQuery(`
  select e.id from guarderia_estadias e join evento_cita_servicio c on c.id = e.cita_id
   where c.user_id = '${uid}' and c.prestador_id is not null
     and coalesce(e.entregada_en, e.no_recogida_en, c.fecha::timestamptz) >= now() - interval '7 days'
   limit 1`)[0]?.id;
const pedido = dbQuery(`
  select p.id from pedidos p where p.user_id = '${uid}'
    and p.created_at >= now() - interval '7 days' limit 1`)[0]?.id;

const receta = [
  { clase: 2, tipo: 'cita',    id: citaCerrada, motivo: 'calidad',
    relato: `${MARCA} El paseo fue más corto de lo que decía la reserva.` },
  { clase: 1, tipo: 'estadia', id: estadia,     motivo: 'no_recogida_prestador',
    relato: `${MARCA} No pasaron a buscarlo y nadie avisó.` },
  { clase: 3, tipo: 'pedido',  id: pedido,      motivo: 'producto_en_mal_estado',
    relato: `${MARCA} El alimento llegó con olor raro y mi mascota comió.` },
];

const abiertos = [];
for (const r of receta) {
  if (!r.id) { decir(`   🟠 clase ${r.clase} · ${r.tipo}: sin objeto disponible en ventana`); continue; }
  const { data, error } = await sFam.rpc('abrir_caso', {
    p_objeto_tipo: r.tipo, p_objeto_id: r.id, p_motivo: r.motivo,
    p_relato: r.relato, p_procedencia: 'familia', p_modo: 'texto',
  });
  if (error || data?.ok !== true) {
    decir(`   🟠 clase ${r.clase} · ${r.tipo}: ${error?.message ?? JSON.stringify(data)}`);
    continue;
  }
  const et = dbQuery(`select etapa, clase, resuelto_en is not null resuelto from casos_postventa where id = '${data.caso_id}'`)[0];
  decir(`   ✅ clase ${et.clase} · ${r.tipo.padEnd(7)} ${data.caso_id} → etapa \`${et.etapa}\` (${r.motivo})`);
  abiertos.push({ ...r, caso: data.caso_id, etapa: et.etapa });
}

// ══ ③ UNO EN ELEGIR DESTINO, CON MONTO ═══════════════════════════════════
decir('\n── ③ el caso de C4: resuelto CON monto y destino sin elegir ──');
const c2 = abiertos.find((a) => a.clase === 2);
if (!c2) decir('   🟠 no se abrió el caso de clase 2: no hay a cuál ponerle monto');
else {
  const { data, error } = await sPre.rpc('caso_resolver', {
    p_caso_id: c2.caso, p_alcance: 'parcial', p_monto: 4.5,
    p_motivo: `${MARCA} reconocido por el prestador: la salida fue más corta.`,
  });
  if (error || data?.ok !== true) decir(`   🟠 caso_resolver rebotó: ${error?.message ?? JSON.stringify(data)}`);
  else {
    const v = dbQuery(`select etapa, monto_devuelto, destino, camino from casos_postventa where id = '${c2.caso}'`)[0];
    decir(`   ✅ ${c2.caso} → etapa \`${v.etapa}\` · monto ${v.monto_devuelto} · destino ${v.destino ?? 'SIN ELEGIR'} · camino ${v.camino ?? '—'}`);
  }
}
const c1 = abiertos.find((a) => a.clase === 1);
if (c1) decir(`   ✅ ${c1.caso} (clase 1) queda en elegir destino SIN monto — el otro sabor`);

// ══ CENSO FINAL ══════════════════════════════════════════════════════════
const censo = dbQuery(`
  select clase, etapa, count(*)::int n from casos_postventa
   where relato like '${MARCA}%' group by 1,2 order by 1`);
console.log('\n── LO SEMBRADO (marca `' + MARCA + '`) ──');
for (const c of censo) console.log(`   clase ${c.clase} · ${c.etapa.padEnd(16)} ${c.n}`);
const total = dbQuery(`select count(*)::int n from casos_postventa where relato like '${MARCA}%'`)[0].n;
const todos = dbQuery('select count(*)::int n from casos_postventa')[0].n;
console.log(`\n   sembrados: ${total} de ${todos} casos en la base` +
            (total === todos ? '  ⇒ TODO lo que hay es siembra' : ''));
console.log("   censo:  select count(*) from casos_postventa where relato like '" + MARCA + "%';");
console.log('   ⚠️ SIEMBRA, NO TRÁFICO: ningún número que salga de estas filas es línea base.');
