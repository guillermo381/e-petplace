// S91-A · SONDA DE RESOLUCIÓN DE FIRMAS por PostgREST — cero escrituras.
//
// Qué prueba y por qué importa (D-662: el repo y el teléfono son dos
// versiones de la verdad): la migración 20260807183000 DROPeó las firmas
// viejas de las dos RPCs del dueño para agregarles p_raza/p_tipo_agua.
// El bundle VIVO del cliente (1.0.3 / OTA 019fde4c) sigue mandando el set
// VIEJO de argumentos nombrados. Si PostgREST no resolviera ese set, el
// alta del cliente quedaría rota en producción sin que ningún typecheck
// lo vea.
//
// El discriminador es el CÓDIGO DE ERROR, sin loguearse:
//   · PGRST202 = «no encuentro esa función con esos argumentos» ⇒ FIRMA ROTA
//   · 42501    = la encontró y negó permiso a anon ⇒ FIRMA VIVA
// Corre como anon (la key pública del .env), no escribe nada y no puede:
// el REVOKE de L-140 la frena antes de tocar una fila.
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const URL = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

async function sonda(fn, args) {
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, code: body.code ?? null, message: body.message ?? '' };
}

// ── ① EL SET VIEJO — exactamente lo que manda el bundle publicado ────────
const viejoOnboarding = await sonda('crear_familia_con_primera_mascota', {
  p_nombre_familia: 'x', p_nombre_mascota: 'x', p_especie: 'perro',
  p_fecha_nacimiento: null, p_precision_fecha: null, p_sexo: null, p_foto_url: null,
});
check(
  viejoOnboarding.code !== 'PGRST202',
  '① el bundle VIVO resuelve crear_familia_con_primera_mascota (set viejo)',
  `${viejoOnboarding.status} ${viejoOnboarding.code}`,
);

const viejoAgregar = await sonda('agregar_mascota_a_familia', {
  p_nombre_mascota: 'x', p_especie: 'perro',
  p_fecha_nacimiento: null, p_precision_fecha: null, p_sexo: null, p_foto_url: null,
});
check(
  viejoAgregar.code !== 'PGRST202',
  '①b el bundle VIVO resuelve agregar_mascota_a_familia (set viejo)',
  `${viejoAgregar.status} ${viejoAgregar.code}`,
);

// ── ② EL SET NUEVO — lo que manda el wrapper de hoy ──────────────────────
const nuevoOnboarding = await sonda('crear_familia_con_primera_mascota', {
  p_nombre_familia: 'x', p_nombre_mascota: 'x', p_especie: 'pez',
  p_fecha_nacimiento: null, p_precision_fecha: null, p_sexo: null, p_foto_url: null,
  p_raza: null, p_tipo_agua: 'marino',
});
check(
  nuevoOnboarding.code !== 'PGRST202',
  '② el wrapper NUEVO resuelve crear_familia_con_primera_mascota (9 args)',
  `${nuevoOnboarding.status} ${nuevoOnboarding.code}`,
);

const nuevoAgregar = await sonda('agregar_mascota_a_familia', {
  p_nombre_mascota: 'x', p_especie: 'perro',
  p_fecha_nacimiento: null, p_precision_fecha: null, p_sexo: null, p_foto_url: null,
  p_raza: 'Mestizo', p_tipo_agua: null,
});
check(
  nuevoAgregar.code !== 'PGRST202',
  '②b el wrapper NUEVO resuelve agregar_mascota_a_familia (8 args)',
  `${nuevoAgregar.status} ${nuevoAgregar.code}`,
);

// ── ③ EL PAR QUE PRUEBA QUE LA SONDA DISCRIMINA ──────────────────────────
// Una firma que NO existe tiene que dar PGRST202: sin esto, los cuatro
// verdes de arriba podrían ser una sonda que siempre dice que sí.
const inventada = await sonda('agregar_mascota_a_familia', {
  p_nombre_mascota: 'x', p_especie: 'perro', p_argumento_que_no_existe: 1,
});
check(
  inventada.code === 'PGRST202',
  '③ DISCRIMINADOR: un argumento inventado SÍ da PGRST202',
  `${inventada.status} ${inventada.code}`,
);

// ── ④ L-140 vivo: anon no ejecuta ninguna de las dos ─────────────────────
check(
  viejoOnboarding.status === 401 || viejoOnboarding.status === 403 ||
    viejoOnboarding.code === '42501',
  '④ L-140: anon NO ejecuta el alta',
  `${viejoOnboarding.status} ${viejoOnboarding.code}`,
);

console.log(fallos === 0 ? '\nTODO VERDE (cero escrituras)' : `\n${fallos} FALLOS`);
process.exit(fallos === 0 ? 0 : 1);
