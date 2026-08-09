/**
 * S92-A · B1 · TANDA 1 — EL VERDE, con sus DOS BRAZOS (REGLA 3).
 *
 * «El anon ya no entra» sin «el titular sigue entrando» es media prueba — y la
 * mitad que faltó en S91 fue exactamente la que rompió ocho policies.
 *
 *   BRAZO ① · el camino cerrado REBOTA  → catálogo + camino real
 *   BRAZO ② · el camino legítimo SIGUE FUNCIONANDO → camino real con sesión,
 *             pidiendo LAS COLUMNAS REALES (L-212: un count(*) no toca ninguna
 *             columna y pasa siempre).
 *
 * El brazo ② es el que importa: las 31 policies que usan los helpers revocados
 * se ejercitan de verdad leyendo mascotas, familia, citas y caso clínico.
 *
 * Corre: node scripts/s92/b1-verde-tanda1.mjs
 */

import { readFileSync } from 'node:fs';
import { rest, rpc, sql, tokenDe, guardar, linea } from './lib-s92.mjs';

const envTxt = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = envTxt.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = envTxt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const LAS_30 = [
  '_trg_eventos_auto_log_atencion', '_trg_eventos_update_ultimo', '_trg_eventos_validar_profundidad',
  '_trg_mascotas_auto_crear_visibilidad_config', '_trg_mascotas_crear_perfil_vigente',
  '_trg_mascotas_espejar_user_id_a_titular', '_trg_otorgar_acceso_por_cita_confirmada',
  '_trg_propagar_estado_vida_desde_evento', 'audit_fee_configs',
  'trg_prestador_documentos_notif_cambio_estado', 'update_device_last_seen',
  '_atencion_en_estados', '_atencion_operable', '_familia_tiene_miembros_vigentes',
  '_user_es_familiar_autorizado_mascota', '_user_es_miembro_familia', '_user_es_titular_familia',
  '_user_es_codueño_mascota', '_validar_ownership_cuenta_comercial', '_notificar_dueño_prestador',
  'mi_email', 'escenario_paseo_iniciado', 'simular_cliente_crea_familia', 'simular_cliente_crea_mascota',
  'simular_cliente_otorga_acceso_prestador', 'simular_prestador_inicia_paseo', 'test_guard_activo',
  'test_marca_metadata', 'test_marca_nombre', 'test_registry_insert',
];
const ANDAMIAJE = ['escenario_paseo_iniciado', 'simular_cliente_crea_familia', 'simular_cliente_crea_mascota',
  'simular_cliente_otorga_acceso_prestador', 'simular_prestador_inicia_paseo', 'test_guard_activo',
  'test_marca_metadata', 'test_marca_nombre', 'test_registry_insert'];
const HELPERS_VIVOS = ['_atencion_en_estados', '_atencion_operable', '_familia_tiene_miembros_vigentes',
  '_user_es_familiar_autorizado_mascota', '_user_es_miembro_familia', '_user_es_titular_familia',
  '_user_es_codueño_mascota', '_validar_ownership_cuenta_comercial', 'mi_email'];

const lista = (a) => a.map((n) => `'${n}'`).join(',');
const filas = [];
const anotar = (id, pregunta, obtenido, ok) => {
  filas.push({ id, pregunta, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(48)} ${obtenido}`);
};

linea('\n══ B1 · TANDA 1 — EL VERDE EN SUS DOS BRAZOS ══\n');

// ─── BRAZO ① · el camino cerrado rebota ─────────────────────────────────────
linea('BRAZO ① — el camino cerrado REBOTA\n');
const catAnon = await sql(
  `SELECT count(*)::int AS n FROM pg_proc p JOIN pg_namespace n2 ON n2.oid=p.pronamespace
   WHERE n2.nspname='public' AND p.proname IN (${lista(LAS_30)})
     AND has_function_privilege('anon', p.oid, 'EXECUTE')`,
  'verde-anon',
);
anotar('30 funciones · anon EXECUTE', '¿queda alguna de las 30 alcanzable por anon?',
  `${catAnon[0].n} de 30 abiertas`, catAnon[0].n === 0);

const catAndamiaje = await sql(
  `SELECT count(*)::int AS n FROM pg_proc p JOIN pg_namespace n2 ON n2.oid=p.pronamespace
   WHERE n2.nspname='public' AND p.proname IN (${lista(ANDAMIAJE)})
     AND has_function_privilege('authenticated', p.oid, 'EXECUTE')`,
  'verde-andamiaje',
);
anotar('andamiaje · authenticated EXECUTE', '¿un autenticado cualquiera alcanza el andamiaje de test?',
  `${catAndamiaje[0].n} de 9 abiertas`, catAndamiaje[0].n === 0);

/**
 * ⚠️ Los nombres de parámetro van MEDIDOS (`b1-firmas-reales.mjs`), no a mano:
 * la primera corrida de este verde escribió `p_user_id` donde la firma dice
 * `p_session_id` y cosechó un PGRST202 que parecía un rojo de la cura. Un rojo
 * que no contesta la pregunta se lee igual que uno que sí — L-211, cobrada dos
 * veces en esta misma sesión.
 */
for (const [fn, args] of [
  ['mi_email', {}],
  ['test_marca_nombre', { p_nombre: 'x', p_session_id: '00000000-0000-0000-0000-000000000000' }],
  ['_user_es_titular_familia', { p_user_id: '00000000-0000-0000-0000-000000000000', p_familia_id: '00000000-0000-0000-0000-000000000000' }],
]) {
  const r = await rpc(fn, args);
  const denegado = /permission denied for function/i.test(r.cuerpo);
  anotar(`camino real anon · ${fn}`, 'la que ANTES ejecutaba de verdad para anon, ¿rebota ahora?',
    `HTTP ${r.status} ${r.cuerpo.slice(0, 70)}`, denegado);
}

// ─── BRAZO ② · el camino legítimo SIGUE FUNCIONANDO ─────────────────────────
linea('\nBRAZO ② — el camino legítimo SIGUE FUNCIONANDO  ← el que importa\n');

const catAuth = await sql(
  `SELECT count(*)::int AS n FROM pg_proc p JOIN pg_namespace n2 ON n2.oid=p.pronamespace
   WHERE n2.nspname='public' AND p.proname IN (${lista(HELPERS_VIVOS)})
     AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')`,
  'verde-auth',
);
anotar('9 helpers · authenticated EXECUTE', '¿quedó algún helper de policy cerrado a authenticated?',
  `${catAuth[0].n} de 9 rotos`, catAuth[0].n === 0);

const token = await tokenDe(DEMO_MAIL, DEMO_PW);

// las policies que USAN los helpers revocados, ejercitadas de verdad y con
// COLUMNAS REALES — mascotas, familia, citas, caso clínico, acceso
const lecturas = [
  ['mascotas', '/rest/v1/mascotas?select=id,nombre,especie&limit=3', 'policies de mascota (_user_es_codueño_mascota, 17 policies)'],
  ['familia_miembro', '/rest/v1/familia_miembro?select=id,familia_id,rol&limit=3', 'policies de familia (_user_es_titular_familia, 8)'],
  ['evento_cita_servicio', '/rest/v1/evento_cita_servicio?select=id,estado,fecha&limit=3', 'agenda del prestador'],
  ['caso_clinico', '/rest/v1/caso_clinico?select=id,estado&limit=3', 'caso clínico (la policy del INSERT del vet vive acá)'],
  ['mascota_acceso_prestador', '/rest/v1/mascota_acceso_prestador?select=id,mascota_id&limit=3', 'acceso por cita'],
  ['cuentas_comerciales', '/rest/v1/cuentas_comerciales?select=id,estado&limit=2', 'la cuenta del titular'],
];
for (const [id, ruta, porque] of lecturas) {
  const r = await rest(ruta, { token });
  anotar(`titular lee · ${id}`, porque, `HTTP ${r.status} ${r.cuerpo.slice(0, 60)}`, r.status === 200);
}

// y las dos puertas de negocio del síntoma de S91
for (const [fn, rot] of [['obtener_mi_prestador', '«Tu negocio» abre'], ['obtener_sedes_de_mis_citas', 'lector angosto']]) {
  const r = await rpc(fn, fn === 'obtener_sedes_de_mis_citas' ? { p_prestador_ids: [] } : {}, { token });
  anotar(`titular · ${fn}`, rot, `HTTP ${r.status}`, r.status === 200);
}

guardar('b1-verde-tanda1.json', filas);
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 ${r.id}: ${r.obtenido}`);
linea('');
