/**
 * S99-A · LÍNEA BASE DEL CARRIL R (N16: <1 s caliente · <2 s frío).
 *
 * Mide, con token real y por la puerta de la app (PostgREST), la latencia
 * p50/p95 de las lecturas que el prestador paga más seguido — las del HOY
 * (la peor pantalla del censo b1: 28 peticiones · 13 olas) y las del panel
 * de ventas que S99 va a tocar (L1–L5). Método repetible (§3.6 del plan):
 * mismo instrumento, misma cuenta (`demovet` / Clínica Aurora), calentamiento
 * declarado, ejecutado desde escritorio — ES EL PISO, no el teléfono. Cada
 * cierre de lote re-corre ESTE script y compara contra
 * `scripts/perf/salida/d0-linea-base-s99.json`.
 *
 * Identidad: correo de la matriz S97; clave del keychain AL MOMENTO (jamás
 * transcrita — R6).
 */
import { execSync } from 'node:child_process';
import { rest, tokenDe, linea, guardarPerf, cronometrar, r1 } from './lib-perf.mjs';

const MAIL = 'guillo381+demovet@gmail.com';
const PW = execSync('security find-generic-password -a siembra -s epetplace-siembra-s97 -w')
  .toString()
  .trim();

const token = await tokenDe(MAIL, PW);
linea('sesión demovet abierta (identidad por keychain, no se transcribe)');

const g = (ruta, o = {}) => rest(ruta, { token, ...o });
const rpc = (n, args = {}) => g(`/rest/v1/rpc/${n}`, { metodo: 'POST', cuerpo: args });
const idDe = (r) => r.cuerpo.match(/"id"\s*:\s*"([0-9a-f-]{36})"/)?.[1] ?? null;

const prestadorId = idDe(await rpc('obtener_mi_prestador'));
if (!prestadorId) throw new Error('demovet no resuelve prestador');
// La cuenta comercial de Aurora (demo S98) — medida en el censo A3.
const CC = 'de680000-0000-4000-8000-0000000000cc';
const hoy = new Date().toISOString().slice(0, 10);

const CASOS = [
  ['peaje (catálogo de 1 fila)', () => g('/rest/v1/cat_estados_pedido?select=codigo&limit=1')],
  ['obtener_mi_prestador (28 focos)', () => rpc('obtener_mi_prestador')],
  ['obtener_jornada_recepcion', () => rpc('obtener_jornada_recepcion', { p_prestador_id: prestadorId, p_fecha: hoy })],
  ['obtener_plata_del_dia', () => rpc('obtener_plata_del_dia', { p_prestador_id: prestadorId })],
  ['citas del día (evento_cita_servicio, 1 oficio)', () =>
    g(`/rest/v1/evento_cita_servicio?select=id,fecha,estado,tipo_servicio&prestador_id=eq.${prestadorId}&fecha=gte.${hoy}&limit=50`)],
  ['cupo_reparto_del_dia', () => rpc('cupo_reparto_del_dia', { p_cuenta_comercial_id: CC, p_fecha: hoy })],
  ['v_pedidos_narrativa (lista panel)', () =>
    g(`/rest/v1/v_pedidos_narrativa?select=pedido_id,narrativa,es_terminal&cuenta_comercial_id=eq.${CC}&order=created_at.desc&limit=50`)],
  ['v_pedidos_narrativa POR RANGO (nuevo)', () =>
    g(`/rest/v1/v_pedidos_narrativa?select=pedido_id,narrativa,es_terminal,entrega_fecha_objetivo&cuenta_comercial_id=eq.${CC}&or=(and(entrega_fecha_objetivo.gte.${hoy},entrega_fecha_objetivo.lte.${hoy}),and(entrega_fecha_objetivo.is.null,es_terminal.eq.false))`)],
  ['repartidores de la cuenta', () =>
    g(`/rest/v1/repartidores?select=id,nombre,activo&cuenta_comercial_id=eq.${CC}`)],
  ['mis cuentas comerciales', () =>
    g(`/rest/v1/cuentas_comerciales?select=id,nombre_comercial,estado&limit=10`)],
];

const resultados = [];
for (const [rotulo, fn] of CASOS) {
  const m = await cronometrar(fn, { veces: 8, calentar: 2, rotulo });
  resultados.push(m);
  linea(`  ${String(m.p50).padStart(7)} ms p50 · ${String(m.p95).padStart(7)} ms p95 · ${rotulo}`);
}

// El prólogo SERIAL del HOY (D-738 sigue vivo): lo que cuesta «resolver quién
// soy» ANTES de poder disparar el Promise.all grande. Encadenado a propósito,
// porque así lo paga la pantalla.
const prologo = await cronometrar(
  async () => {
    const p = idDe(await rpc('obtener_mi_prestador'));
    await g(`/rest/v1/prestador_empleados?select=id&prestador_id=eq.${p}&limit=1`);
    await rpc('empleado_tiene_rol', { p_prestador_id: p, p_roles: ['dueño', 'administrador'] });
  },
  { veces: 6, calentar: 1, rotulo: 'prólogo serial del HOY (3 olas de identidad)' },
);
resultados.push(prologo);
linea(`  ${String(prologo.p50).padStart(7)} ms p50 · ${String(prologo.p95).padStart(7)} ms p95 · ${prologo.rotulo}`);

const peaje = resultados[0].p50;
const olasHoy = 13; // censo b1 del 15-ago (cota superior)
linea('');
linea(`  peaje por petición (p50): ${peaje} ms`);
linea(`  HOY según censo b1: 28 peticiones · ${olasHoy} olas ⇒ ~${r1(peaje * olasHoy)} ms de pura red encadenada (piso escritorio)`);
linea(`  presupuesto N16: <1000 ms caliente · <2000 ms frío — el HOY ya lo excede SOLO en red`);

const p = guardarPerf('d0-linea-base-s99.json', {
  fecha: new Date().toISOString(),
  cuenta: 'demovet/Aurora',
  origen: 'escritorio (piso, no teléfono)',
  peaje_p50: peaje,
  olas_hoy_censo_b1: olasHoy,
  resultados,
});
linea(`\n  guardado: ${p}`);
