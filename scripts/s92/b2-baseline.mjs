/**
 * S92-A · B2 — EL BASELINE: qué ve HOY cada actor en las 29 tablas afectadas.
 *
 * Sin esta foto, después de migrar 29 policies no hay forma de distinguir «lo
 * rompí yo» de «ya estaba así» — y una tabla que devuelve [] puede ser correcta
 * (no hay filas) o catastrófica (el titular perdió acceso). El baseline lo
 * separa, y es la lección de S83 que esta sesión hereda.
 *
 * DOS ACTORES:
 *   · TITULAR — el prestador demo, que SÍ debe ver lo suyo.
 *   · AJENO   — un usuario recién creado sin prestador ni familia, que NO debe
 *               ver nada de nadie. Es el brazo que prueba que la policy filtra
 *               y no que simplemente «hay pocas filas».
 *
 * Se piden COLUMNAS REALES, jamás count(*) — L-212: un count no toca ninguna
 * columna y pasa siempre.
 *
 * Corre: node scripts/s92/b2-baseline.mjs [rotulo]
 */

import { readFileSync } from 'node:fs';
import { rest, guardar, URL, ANON, linea } from './lib-s92.mjs';
import { tokenDe } from './lib-s92.mjs';

const rotulo = process.argv[2] ?? 'antes';
const envTxt = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = envTxt.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = envTxt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

/** El ajeno: cuenta fija de la sesión, prefijo declarado en el arranque §4. */
const AJENO_MAIL = 's92a-ajeno@epetplace.dev';
const AJENO_PW = 'S92-ajeno-2026!';

async function tokenAjeno() {
  try {
    return await tokenDe(AJENO_MAIL, AJENO_PW);
  } catch {
    const r = await fetch(`${URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: AJENO_MAIL, password: AJENO_PW, data: { nombre: 'Sonda S92' } }),
    });
    const d = await r.json();
    if (d.access_token) return d.access_token;
    return await tokenDe(AJENO_MAIL, AJENO_PW);
  }
}

/** tabla → columnas reales que la pantalla pediría. */
const TABLAS = [
  ['bonos', 'id,prestador_id,estado'],
  ['certificaciones', 'id,prestador_id'],
  ['certificado_salud', 'id,prestador_id'],
  ['estadias', 'id,prestador_id'],
  ['evento_cita_servicio', 'id,prestador_id,estado,fecha'],
  ['mascota_acceso_prestador', 'id,mascota_id,cuenta_comercial_id'],
  ['notificaciones', 'id,user_id'],
  ['prestador_atencion_log', 'id,prestador_id'],
  ['prestador_empleado_servicios', 'id,empleado_id'],
  ['prestador_especialidades', 'id,prestador_id'],
  ['prestador_fotos', 'id,prestador_id'],
  ['prestador_horarios', 'id,prestador_id,activo'],
  ['prestador_servicios', 'id,prestador_id,activo'],
  ['prestador_zonas', 'id,prestador_id'],
  ['programas_contratados', 'id,prestador_id'],
  ['solicitudes_emergencia', 'id,prestador_id'],
  ['suscripciones_servicio', 'id,prestador_id'],
  ['prestadores', 'id,nombre_comercial'],
  ['cuentas_comerciales', 'id,estado'],
  ['caso_clinico', 'id,estado'],
];

const tTitular = await tokenDe(DEMO_MAIL, DEMO_PW);
const tAjeno = await tokenAjeno();

const foto = [];
for (const [tabla, cols] of TABLAS) {
  const rT = await rest(`/rest/v1/${tabla}?select=${cols}&limit=200`, { token: tTitular });
  const rA = await rest(`/rest/v1/${tabla}?select=${cols}&limit=200`, { token: tAjeno });
  const contar = (r) => {
    if (r.status !== 200) return `HTTP ${r.status}`;
    try {
      // el cuerpo viene truncado a 400 chars por la lib: se cuentan los `{"` de apertura
      return (r.cuerpo.match(/\{"/g) ?? []).length + (r.cuerpo.trim() === '[]' ? 0 : 0);
    } catch {
      return '?';
    }
  };
  foto.push({
    tabla,
    titular_status: rT.status,
    titular_vacio: rT.cuerpo.trim() === '[]',
    titular_muestra: contar(rT),
    ajeno_status: rA.status,
    ajeno_vacio: rA.cuerpo.trim() === '[]',
    ajeno_muestra: contar(rA),
  });
}

guardar(`b2-baseline-${rotulo}.json`, foto);

linea(`\n══ B2 · BASELINE «${rotulo}» — qué ve cada actor ══\n`);
linea('  tabla                              titular            ajeno');
linea('  ' + '─'.repeat(68));
for (const f of foto) {
  const t = f.titular_status !== 200 ? `HTTP ${f.titular_status}` : f.titular_vacio ? 'vacío' : `${f.titular_muestra}+ filas`;
  const a = f.ajeno_status !== 200 ? `HTTP ${f.ajeno_status}` : f.ajeno_vacio ? 'vacío ✅' : `${f.ajeno_muestra}+ filas ⚠️`;
  linea(`  ${f.tabla.padEnd(34)} ${t.padEnd(18)} ${a}`);
}
linea('\n  titular «vacío» no siempre es malo (puede no tener filas);');
linea('  ajeno «con filas» es lo que hay que mirar: o es lectura pública legítima, o es fuga.\n');
