// ═══════════════════════════════════════════════════════════════════════════
// S107-A · E2E DE LOS WRAPPERS DE CONFIGURACIÓN DE GUARDERÍA
//
// Por qué existe: **build TS verde ≠ contrato real** (L-114, regla 47). El
// cinturón de la migración probó el MOTOR por su camino real; esto prueba la
// PUERTA — que es otra cosa: los guards de shape, la normalización de códigos
// por prefijo (L-115) y que la RLS deje pasar al titular y no a otro.
//
// La forma es la de la casa (precedente S46/S95-E): sesión REAL por wrapper,
// escritura de verdad, **desmontaje por id y residuo verificado en CERO**.
// 🔴 La clave se lee del keychain EN EL MOMENTO — jamás viaja al repo.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dbQuery } from './lib-db.mjs';
import {
  initApi,
  iniciarSesion,
  definirEspacioGuarderia,
  declararExcepcionEspacioGuarderia,
  definirFranjaGuarderia,
  obtenerFranjasGuarderia,
  obtenerCupoGuarderia,
  definirOfertaGuarderia,
  obtenerOfertaGuarderiaPropia,
  obtenerGuarderiasDisponibles,
  evaluarRequisitosGuarderia,
  reservarDiaGuarderia,
  obtenerEstadiasDelDia,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const clave = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();

let fallos = 0;
const check = (cond, nombre, detalle = '') => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
};
const NOMBRE = '__e2e_s107a__';

// ── El sujeto sale de datos REALES ──────────────────────────────────────────
const ctx = dbQuery(`
  SELECT u.email, p.id AS prestador
    FROM prestadores p JOIN auth.users u ON u.id = p.user_id
   WHERE p.estado='activo' AND u.email = 'guillo381+duenotodo@gmail.com' LIMIT 1`)[0];
if (!ctx) { console.error('ABORTA: no existe el titular de prueba.'); process.exit(1); }

const ses = await iniciarSesion({ email: ctx.email, password: clave });
check(ses.ok === true, 'sesión real del titular', ses.ok ? ctx.email : ses.codigo);
if (!ses.ok) process.exit(1);

const base = dbQuery(`SELECT count(*)::int n FROM guarderia_espacios`)[0].n;

// ── ① ESCRITURA: el espacio ─────────────────────────────────────────────────
const esp = await definirEspacioGuarderia({
  prestadorId: ctx.prestador, nombre: NOMBRE, capacidadPorDia: 8,
  diasOperacion: [1, 2, 3, 4, 5],
});
check(esp.ok === true, 'definirEspacioGuarderia crea', esp.ok ? esp.data.espacioId : esp.codigo);
if (!esp.ok) process.exit(1);
const espacioId = esp.data.espacioId;

// ── ② EL GUARD, POR SU CÓDIGO TIPADO (no por el texto) ──────────────────────
const malo = await definirEspacioGuarderia({
  prestadorId: ctx.prestador, nombre: NOMBRE + '_cap0', capacidadPorDia: 0,
});
check(malo.ok === false && malo.codigo === 'capacidad_invalida',
  'capacidad 0 rebota TIPADO', malo.ok ? 'PASÓ' : malo.codigo);

// ── ③ LAS FRANJAS, con su cruce ─────────────────────────────────────────────
const r1 = await definirFranjaGuarderia({
  prestadorId: ctx.prestador, tipo: 'recogida', desde: '07:00', hasta: '09:00',
  diasSemana: [1, 2, 3, 4, 5],
});
check(r1.ok === true, 'franja de recogida 07:00–09:00', r1.ok ? '' : r1.codigo);

const cruce = await definirFranjaGuarderia({
  prestadorId: ctx.prestador, tipo: 'devolucion', desde: '08:00', hasta: '10:00',
  diasSemana: [1, 2, 3, 4, 5],
});
check(cruce.ok === false && cruce.codigo === 'franjas_se_cruzan',
  'la devolución que pisa la recogida REBOTA', cruce.ok ? 'PASÓ' : cruce.codigo);

const r2 = await definirFranjaGuarderia({
  prestadorId: ctx.prestador, tipo: 'devolucion', desde: '16:30', hasta: '18:30',
  diasSemana: [1, 2, 3, 4, 5],
});
check(r2.ok === true, 'franja de devolución 16:30–18:30', r2.ok ? '' : r2.codigo);

const fr = await obtenerFranjasGuarderia(ctx.prestador);
check(fr.ok === true && fr.data.length === 2 && fr.data[0].tipo === 'recogida',
  'obtenerFranjasGuarderia devuelve las dos, recogida primero',
  fr.ok ? `${fr.data.length} franjas` : fr.codigo);

// ── ④ EL CUPO, EN UN SOLO VIAJE ─────────────────────────────────────────────
const hoy = dbQuery(`SELECT hoy_local()::text d`)[0].d;
const hasta = dbQuery(`SELECT (hoy_local() + 29)::text d`)[0].d;
const cupo = await obtenerCupoGuarderia(ctx.prestador, hoy, hasta);
check(cupo.ok === true && cupo.data.length === 30, 'cupo de 30 días en UN viaje',
  cupo.ok ? `${cupo.data.length} días` : cupo.codigo);
if (cupo.ok) {
  const habiles = cupo.data.filter((d) => d.capacidad === 8).length;
  check(habiles >= 20 && habiles <= 22, 'sólo los días del patrón tienen capacidad',
    `${habiles} días con capacidad 8`);
  check(cupo.data.every((d) => d.sobrevendido === false), 'ningún día nace sobrevendido');
}

// ── ⑤ LA EXCEPCIÓN GANA AL PATRÓN ───────────────────────────────────────────
const manana = dbQuery(
  `SELECT d::text AS d FROM generate_series(hoy_local()+1, hoy_local()+9, interval '1 day') d
    WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 5 LIMIT 1`)[0].d;
const exc = await declararExcepcionEspacioGuarderia({
  espacioId, fecha: manana, disponible: false, motivo: 'e2e',
});
check(exc.ok === true, 'declararExcepcionEspacioGuarderia cierra un día', exc.ok ? '' : exc.codigo);
const cupo2 = await obtenerCupoGuarderia(ctx.prestador, manana, manana);
check(cupo2.ok === true && cupo2.data[0].capacidad === 0,
  'la excepción GANA: capacidad 0 ese día',
  cupo2.ok ? `capacidad ${cupo2.data[0].capacidad}` : cupo2.codigo);

// ── ⑥ EL RANGO INVERTIDO REBOTA TIPADO ──────────────────────────────────────
const inv = await obtenerCupoGuarderia(ctx.prestador, hasta, hoy);
check(inv.ok === false && inv.codigo === 'rango_invertido',
  'rango invertido rebota TIPADO', inv.ok ? 'PASÓ' : inv.codigo);

// ── ⑦ LA OFERTA — precio y visibilidad, que es lo que destraba a C ──────────
// El orden importa y es el de la letra: sin franjas y sin espacios NO se
// publica. Acá ya hay de las dos, así que la oferta tiene que entrar.
const of = await definirOfertaGuarderia({
  prestadorId: ctx.prestador, precioDia: 20, precioPaquete: 18, precioMensual: 320,
});
check(of.ok === true, 'definirOfertaGuarderia publica', of.ok ? `jornada ${of.data.jornadaMinutos}min · cupo ${of.data.capacidadDia}` : of.codigo);
check(of.ok === true && of.data.jornadaMinutos === 690,
  'la JORNADA se deriva de las franjas (07:00→18:30 = 690)',
  of.ok ? `${of.data.jornadaMinutos}` : '');

const propia = await obtenerOfertaGuarderiaPropia(ctx.prestador);
check(propia.ok === true && propia.data !== null && propia.data.precio === 20,
  'obtenerOfertaGuarderiaPropia la lee', propia.ok && propia.data ? `$${propia.data.precio}` : 'sin oferta');

// La vitrina se mira con la sesión de la FAMILIA, no del titular.
const fam = dbQuery(`
  SELECT fm.user_id AS usuario, (array_agg(m.id ORDER BY m.id) FILTER (WHERE m.especie='perro'))[1] AS perro,
         u.email
    FROM familia_miembro fm
    JOIN mascotas m ON m.familia_id = fm.familia_id AND m.estado_vida='activa'
    JOIN auth.users u ON u.id = fm.user_id
   WHERE u.email LIKE 'guillo381+%'
   GROUP BY fm.user_id, u.email
  HAVING count(*) FILTER (WHERE m.especie='perro') > 0
   LIMIT 1`)[0];
if (fam) {
  const ses2 = await iniciarSesion({ email: fam.email, password: clave });
  check(ses2.ok === true, 'sesión de la familia', ses2.ok ? fam.email : ses2.codigo);
  /* 🔴 LA FECHA SE ELIGE LIMPIA, Y POR QUÉ: el paso ⑤ CERRÓ un día con una
     excepción, y el patrón del espacio es L-V. La primera versión de este
     assert miró `hoy+1` — que era justo el día cerrado — y dio ROJO acusando
     al motor de no publicar. **El motor tenía razón y el assert estaba mal.**
     Se toma el primer día hábil bien lejos de la excepción. */
  const manana2 = dbQuery(`
    SELECT d::text AS d
      FROM generate_series(hoy_local()+10, hoy_local()+20, interval '1 day') d
     WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 5 LIMIT 1`)[0].d;
  const vit = await obtenerGuarderiasDisponibles({ fecha: manana2, mascotaId: fam.perro });
  check(vit.ok === true, 'obtenerGuarderiasDisponibles responde', vit.ok ? `${vit.data.length} lugares` : vit.codigo);
  check(vit.ok === true && vit.data.some((g) => g.prestadorId === ctx.prestador),
    '🔴 EL PRESTADOR APARECE EN LA VITRINA — lo que C necesitaba');
  // Y de vuelta a la sesión del titular para el desmontaje.
  await iniciarSesion({ email: ctx.email, password: clave });
} else {
  console.log('⚠️ sin familia de prueba con perro: la vitrina no se ejerció (declarado, no asumido)');
}

// ── ⑧ EL GATE SANITARIO Y LA RESERVA, POR EL CAMINO REAL ────────────────────
if (fam) {
  await iniciarSesion({ email: fam.email, password: clave });
  const req = await evaluarRequisitosGuarderia(fam.perro);
  check(req.ok === true, 'evaluarRequisitosGuarderia responde', req.ok ? (req.data.alDia ? 'al día' : `faltan ${req.data.faltantes.length}`) : req.codigo);
  // 🔴 El faltante NOMBRA lo que falta: sin eso la pantalla no puede llevar a
  // resolverlo, y un pendiente que el dueño no puede resolver es peor que no
  // mostrarlo.
  check(req.ok === true && (req.data.alDia || req.data.faltantes.every((f) => f.codigo && f.estado)),
    'cada faltante viaja con su código y su estado');

  const diaLibre = dbQuery(`
    SELECT d::text AS d FROM generate_series(hoy_local()+11, hoy_local()+21, interval '1 day') d
     WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 5 LIMIT 1`)[0].d;
  const res = await reservarDiaGuarderia({ prestadorId: ctx.prestador, mascotaId: fam.perro, fecha: diaLibre });
  if (req.ok && !req.data.alDia) {
    // El gate está CERRADO: la reserva tiene que rebotar POR ESO y no por otra cosa.
    check(res.ok === false && res.codigo === 'requisitos_sanitarios',
      '🔴 sin requisitos, la reserva REBOTA por el motivo correcto', res.ok ? 'PASÓ' : res.codigo);
  } else {
    check(res.ok === true, 'con requisitos al día, la reserva entra', res.ok ? res.data.citaId : res.codigo);
    if (res.ok) dbQuery(`DELETE FROM evento_cita_servicio WHERE id = '${res.data.citaId}'`);
  }
  await iniciarSesion({ email: ctx.email, password: clave });
}

// ── ⑨ LA JORNADA DEL PRESTADOR — el wrapper que faltaba ─────────────────────
const hoyD = dbQuery(`SELECT hoy_local()::text d`)[0].d;
const jor = await obtenerEstadiasDelDia(ctx.prestador, hoyD);
check(jor.ok === true, 'obtenerEstadiasDelDia responde', jor.ok ? `${jor.data.length} estadías` : jor.codigo);
// 🔴 Sólo verdad firme: un hold sin pagar NO sale en la lista del día.
check(jor.ok === true && jor.data.length === 0,
  'la jornada no trae holds sin pagar (verdad firme)', jor.ok ? `${jor.data.length}` : '');

// ── DESMONTAJE POR ID, y residuo medido ─────────────────────────────────────
dbQuery(`DELETE FROM prestador_servicios WHERE prestador_id = '${ctx.prestador}' AND tipo_servicio = 'guarderia_dia'`);
dbQuery(`DELETE FROM guarderia_espacios WHERE id = '${espacioId}'`);
dbQuery(`DELETE FROM guarderia_franjas WHERE prestador_id = '${ctx.prestador}'`);
const fin = dbQuery(`
  SELECT (SELECT count(*)::int FROM guarderia_espacios) esp,
         (SELECT count(*)::int FROM guarderia_franjas) fr,
         (SELECT count(*)::int FROM guarderia_espacio_excepciones) exc,
         (SELECT count(*)::int FROM prestador_servicios WHERE tipo_servicio='guarderia_dia') ofe`)[0];
check(fin.esp === base && fin.fr === 0 && fin.exc === 0 && fin.ofe === 0,
  'residuo 0 (la excepción cae por CASCADE del espacio)',
  `espacios ${fin.esp} (base ${base}) · franjas ${fin.fr} · excepciones ${fin.exc} · ofertas ${fin.ofe}`);

console.log(fallos === 0 ? '\n✅ E2E GUARDERÍA-CONFIG: TODO VERDE\n' : `\n🔴 ${fallos} FALLO(S)\n`);
process.exit(fallos === 0 ? 0 : 1);
