#!/usr/bin/env node
/**
 * S113-E · FIXTURE DE MEMORIAL — «Sombra».
 *
 * La mascota con la que B y C prueban que Nexo NO aparece en memorial.
 *
 * ═══ 🔴 HALLAZGO: NO EXISTE FLUJO PARA PASAR UNA MASCOTA A MEMORIAL ════════
 * Medido (3-sep-2026), las cuatro vías:
 *   · `cat_tipos_evento` tiene `fin_vida`, **activo=true** ✓
 *   · el trigger `_trg_propagar_estado_vida_desde_evento` lo traduce a
 *     `mascotas.estado_vida='fallecida'` + `estado_vida_desde` ✓
 *   · `grep fin_vida` en `apps/` y `packages/` → **0 ocurrencias**
 *   · `select count(*) from eventos_mascota where tipo='fin_vida'` → **0**
 * ⇒ **El motor existe y la puerta no.** Es `L-318` (motor sin puerta) en el
 * momento más delicado del producto: la app sabe comportarse distinto en
 * memorial —`esMemorial` se lee en el Coach, en la ficha, en cuatro wrappers—
 * y **no hay forma de que una familia le diga a e-PetPlace que su animal
 * murió.** Con 89/89 mascotas en `activa`, ese brazo nunca se ejerció con
 * datos vivos.
 *
 * ═══ CÓMO SE CREA, y por qué así ═══════════════════════════════════════════
 * ① El alta va por el **camino real**: `agregar_mascota_a_familia` con la
 *    sesión de la cuenta de prueba. Nada de INSERT directo — una fixture que
 *    entra por un costado prueba menos que el camino que la gente usa.
 * ② El paso a memorial va por el **motor real**: se inserta el evento
 *    `fin_vida` y el trigger hace el resto. **No se escribe `estado_vida` a
 *    mano.** Escribir la columna directo dejaría a Sombra en un estado que el
 *    motor nunca produjo, y los tres triggers hermanos (cierre de solicitudes,
 *    planes, purga de la cola) no correrían. *Una fixture que no pasa por el
 *    motor mide un estado que no existe en producción.*
 *    El INSERT del evento es la parte declarada como fixture: es exactamente
 *    el hueco que la puerta ausente deja.
 *
 * Uso:  node scripts/ia-conjuntos/fixture-memorial.mjs [--crear]
 *       (sin `--crear` sólo informa si ya existe; con `--crear` la crea)
 */
import { spawnSync } from 'node:child_process';
import { consultar, URL_BASE, PROJECT_REF } from './lib-conjuntos.mjs';

const di = (s) => process.stdout.write(s + '\n');
const CUENTA = 'guillo381+8@gmail.com';
const NOMBRE = 'Sombra';

const ya = consultar(`
  select left(m.id::text,8) id8, m.id::text id, m.estado_vida, m.estado_vida_desde::text desde
  from public.mascotas m
  join public.familia_miembro fm on fm.familia_id = m.familia_id
  join auth.users u on u.id = fm.user_id
  where u.email = '${CUENTA}' and m.nombre = '${NOMBRE}'
`);

if (ya.length > 0) {
  for (const m of ya) di(`ya existe · ${NOMBRE} ${m.id8} · estado_vida=${m.estado_vida} · desde=${m.desde}`);
  di(`\nid completo: ${ya[0].id}`);
  process.exit(0);
}
if (!process.argv.includes('--crear')) {
  di(`${NOMBRE} no existe en la familia de ${CUENTA}. Corré con --crear.`);
  process.exit(0);
}

// ── sesión de persona (camino real) ───────────────────────────────────────
const pass = spawnSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).stdout.trim();
if (!pass) throw new Error('sin clave de siembra en el keychain. La fixture PARA.');

const salida = spawnSync('npx', ['supabase', 'projects', 'api-keys', '--project-ref', PROJECT_REF],
  { encoding: 'utf8' }).stdout;
const anon = JSON.parse(salida.slice(salida.indexOf('{'))).keys.find((k) => k.id === 'anon').api_key;

const auth = await (await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: CUENTA, password: pass }),
})).json();
if (!auth.access_token) throw new Error('no pude abrir sesión. La fixture PARA.');

// ① ALTA POR EL CAMINO REAL ────────────────────────────────────────────────
const r = await fetch(`${URL_BASE}/rest/v1/rpc/agregar_mascota_a_familia`, {
  method: 'POST',
  headers: {
    apikey: anon,
    Authorization: `Bearer ${auth.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    p_nombre_mascota: NOMBRE,
    p_especie: 'perro',
    p_fecha_nacimiento: '2015-06-01',
    p_precision_fecha: 'aproximada',
    p_sexo: 'macho',
  }),
});
const cuerpo = await r.text();
if (!r.ok) { di(`🔴 el alta rebotó (${r.status}): ${cuerpo.slice(0, 300)}`); process.exit(1); }
di(`① alta por camino real: ${cuerpo.slice(0, 200)}`);

const creada = consultar(`
  select m.id::text id, left(m.id::text,8) id8, m.estado_vida
  from public.mascotas m
  join public.familia_miembro fm on fm.familia_id = m.familia_id
  join auth.users u on u.id = fm.user_id
  where u.email='${CUENTA}' and m.nombre='${NOMBRE}'
`)[0];
if (!creada) { di('🔴 el alta dijo OK y la mascota no está. PARA.'); process.exit(1); }
di(`   ${NOMBRE} ${creada.id8} · estado_vida=${creada.estado_vida}`);

// ② MEMORIAL POR EL MOTOR REAL ─────────────────────────────────────────────
// 🔴 Este INSERT es la parte declarada como FIXTURE: es el hueco exacto que
//    deja la puerta ausente. El día que exista la pantalla, esta línea se
//    reemplaza por su llamada y la fixture mide MÁS, no menos.
// ── Columnas RELEVADAS, no adivinadas — y cada una costó un rebote ────────
// `eventos_mascota` NO tiene `titulo` (el texto va en `datos`, jsonb NOT
// NULL) · `eje_jtbd` es NOT NULL y sale del catálogo (`fin_vida`→'identidad')
// · `country_code` es NOT NULL sin default por vía directa · y
// `chk_eventos_origen` exige `creado_por_user_id` O `creado_por_sistema`.
//
// 🔴 Los cuatro rebotes son la MEDIDA de lo que falta: **por el camino real
// —una RPC— esos cuatro valores los resuelve el servidor.** Que una fixture
// tenga que saberlos a mano es la forma que tiene la puerta ausente de
// aparecer. Es `L-057` en acción: el primer intento adivinó `titulo`, rebotó
// con 42703, y el helper se tragó el error — la fixture culpó al trigger de
// algo que nunca corrió. Los dos defectos quedaron curados.
//
// `creado_por_sistema='fixture_s113e_memorial'` sigue el precedente vivo de
// S92 (`sonda_s91d_purgada`, 48 filas): la fixture queda **censable y
// borrable** por una sola consulta, en vez de indistinguible de un dato real.
consultar(`
  insert into public.eventos_mascota
    (mascota_id, tipo, eje_jtbd, fecha_evento, datos, procedencia,
     country_code, creado_por_sistema)
  values ('${creada.id}', 'fin_vida', 'identidad', now() - interval '30 days',
          '{"nota":"Fixture S113-E memorial: B y C prueban que Nexo no aparece"}'::jsonb,
          'declarado_por_familia', 'EC', 'fixture_s113e_memorial')
`);

const final = consultar(`
  select estado_vida, estado_vida_desde::text desde from public.mascotas where id='${creada.id}'
`)[0];

di(`② evento fin_vida insertado · el trigger dejó estado_vida=${final.estado_vida} desde=${final.desde}`);
if (final.estado_vida !== 'fallecida') {
  di('🔴 el trigger NO propagó. La fixture no sirve.');
  process.exit(1);
}
di(`\n✅ fixture lista · ${NOMBRE} · id ${creada.id} · memorial por el motor real`);
