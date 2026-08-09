/**
 * 🔴 P0-C · ¿EL MINUTO ESTÁ EN LA RED O EN LA BASE?
 *
 * La base ya está medida y NO es: `get_estado_onboarding_dueno` **7.5 ms** y el
 * SELECT de mascotas con la RLS del founder **3.2 ms** (EXPLAIN ANALYZE con sus
 * claims). Lo que falta del camino es **PostgREST + red**, y eso solo se mide
 * golpeando el endpoint como lo golpea la app.
 *
 * ⚠️ NO se mide con la sesión del founder —no tengo su contraseña y no se pide—,
 * así que **esto no prueba nada sobre SU cuenta**: prueba si el transporte está
 * sano o enfermo. Si acá todo vuelve en milisegundos, el minuto vive en el
 * dispositivo y se declara ROJO hasta el gate.
 */
import { URL, ANON, linea, guardarSeg2 } from './lib-seg2.mjs';

const cronometrar = async (etiqueta, fn) => {
  const t0 = Date.now();
  let detalle = '';
  try {
    detalle = await fn();
  } catch (e) {
    detalle = `error de red: ${e.message}`;
  }
  const ms = Date.now() - t0;
  linea(`  ${ms > 3000 ? '🔴' : ms > 1000 ? '⚠️ ' : '✅'} ${etiqueta.padEnd(46)} ${String(ms).padStart(6)} ms  ${detalle}`);
  return { etiqueta, ms, detalle };
};

const filas = [];
linea('\n══ P0-C · el camino por HTTP (PostgREST + red) ══\n');

// ── ① El endpoint de la RPC, con la anon key ────────────────────────────────
filas.push(
  await cronometrar('POST /rpc/get_estado_onboarding_dueno', async () => {
    const r = await fetch(`${URL}/rest/v1/rpc/get_estado_onboarding_dueno`, {
      method: 'POST',
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    return `HTTP ${r.status}`;
  }),
);

// ── ② El SELECT de mascotas ─────────────────────────────────────────────────
filas.push(
  await cronometrar('GET /mascotas?familia_id=eq.…', async () => {
    const r = await fetch(
      `${URL}/rest/v1/mascotas?select=id,nombre,especie,estado_vida&familia_id=eq.ce057f90-82d8-40f8-a816-796c0f2b5b2a`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
    );
    const j = await r.json().catch(() => []);
    return `HTTP ${r.status} · ${Array.isArray(j) ? j.length : 0} fila(s)`;
  }),
);

// ── ③ El catálogo de especies (lo que la pantalla pide en paralelo) ─────────
filas.push(
  await cronometrar('GET /tipos_servicio (catálogo del paseo)', async () => {
    const r = await fetch(`${URL}/rest/v1/tipos_servicio?select=especies_elegibles&categoria=eq.paseo&activo=eq.true`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    });
    const j = await r.json().catch(() => []);
    return `HTTP ${r.status} · ${Array.isArray(j) ? j.length : 0} fila(s)`;
  }),
);

// ── ④ Un login, que es el otro camino que la app toca al arrancar ───────────
filas.push(
  await cronometrar('POST /auth/v1/token (¿el transporte de auth?)', async () => {
    const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'no-existe-medicion@epetplace.dev', password: 'x' }),
    });
    return `HTTP ${r.status} (se espera 400: mide el VIAJE, no el login)`;
  }),
);

const lento = filas.filter((f) => f.ms > 3000);
linea(
  lento.length === 0
    ? '\n  ⇒ el transporte responde en milisegundos. **El minuto NO está ni en la base ni en la red.**\n    Queda el DISPOSITIVO — y eso no se puede medir desde acá (R5).'
    : `\n  🔴 ${lento.length} llamada(s) por encima de 3 s: ${lento.map((f) => f.etiqueta).join(', ')}`,
);

guardarSeg2('p0c-http.json', filas);
linea('');
