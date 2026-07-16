// Asserts E2E S63-B (Bloque 3 experiencia) — la atención de adiestramiento
// contra el MOTOR REAL con la sesión demo (regla 47 / L-114).
//
// LO QUE PRUEBA HOY: oferta+programa por la puerta única → matrícula
// REAL vía contratar_programa (el dueño demo compra para el Zeus demo)
// → las citas k/N aparecen en la jornada → el detalle porta "Sesión 1
// de 2" → iniciar HOY rebota `cita_aun_no_ocurre` TIPADO (el gate
// temporal del motor Y el mapeo de códigos del wrapper, probados en
// runtime) → vocabulario y currículum responden.
//
// LO QUE NO PUEDE PROBAR HOY (declarado): el ciclo iniciar→chips→nota→
// cerrar→parte exige que la cita SEA del día y contratar_programa
// rebota `slot_en_pasado` para hoy — la primera sesión nace MAÑANA por
// diseño. Ese tramo es el GATE EN DISPOSITIVO del founder: LA MATRÍCULA
// CREADA ACÁ QUEDA VIVA COMO SEED DEL GATE (patrón D-385) — no se
// limpia, se declara.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  obtenerOfertaAdiestramientoPropia,
  guardarOfertaAdiestramiento,
  guardarProgramaAdiestramiento,
  obtenerIniciosAdiestramiento,
  contratarPrograma,
  obtenerCitasAdiestramientoDelDia,
  obtenerCitaAdiestramientoPorId,
  obtenerAdiestramientoPorCita,
  iniciarAtencionAdiestramiento,
  obtenerObjetivosAdiestramiento,
  obtenerCurriculumNivel,
} from '../packages/api/src/index.ts';

const ZEUS_DEMO = 'de300000-0000-4000-8000-000000000a5c';
const NOMBRE_PROGRAMA_GATE = 'Obediencia desde cero (gate S63)';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}
function fechaLocal(masDias = 0) {
  const d = new Date();
  return new Intl.DateTimeFormat('en-CA').format(new Date(d.getFullYear(), d.getMonth(), d.getDate() + masDias));
}

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ sin sesión demo:', login.mensaje);
  process.exit(1);
}
const prestador = await obtenerMiPrestador();
if (!prestador.ok) {
  console.log('✗ sin prestador demo:', prestador.mensaje);
  process.exit(1);
}
const prestadorId = prestador.data.id;

// ── T1: la oferta del gate (idempotente: reusa si ya existe) ──────────
let mundo = await obtenerOfertaAdiestramientoPropia(prestadorId);
if (!mundo.ok) {
  console.log('✗ lectura de oferta:', mundo.mensaje);
  process.exit(1);
}
if (mundo.data.oferta === null || !mundo.data.oferta.activo) {
  const r = await guardarOfertaAdiestramiento({
    prestadorId,
    ofertaId: mundo.data.oferta?.id ?? null,
    activo: true,
    precio: 25,
    duracionMinutos: 60,
    especies: ['perro'],
  });
  check(r.ok, 'T1 oferta de adiestramiento activa', r.ok ? r.data.id : r.mensaje);
  if (!r.ok) process.exit(1);
} else {
  check(true, 'T1 oferta de adiestramiento activa', 'preexistente');
}
mundo = await obtenerOfertaAdiestramientoPropia(prestadorId);
const ofertaId = mundo.ok && mundo.data.oferta ? mundo.data.oferta.id : null;

let programa = mundo.ok ? mundo.data.programas.find((p) => p.nombre === NOMBRE_PROGRAMA_GATE && p.activo) : undefined;
if (!programa && ofertaId !== null) {
  const r = await guardarProgramaAdiestramiento({
    ofertaId,
    programaId: null,
    nivel: 'basico',
    nombre: NOMBRE_PROGRAMA_GATE,
    nSesiones: 2,
    precioPrograma: 90,
    vigenciaDias: 21,
    duracionMinutosSesion: 60,
    activo: true,
  });
  check(r.ok, 'T2 programa del gate creado', r.ok ? r.data.id : r.mensaje);
  if (r.ok) programa = r.data;
} else {
  check(programa !== undefined, 'T2 programa del gate', 'preexistente');
}
if (!programa || ofertaId === null) process.exit(1);

// ── T3: inicios reales de MAÑANA (la grilla del server, 7.13) ─────────
const manana = fechaLocal(1);
const inicios = await obtenerIniciosAdiestramiento(manana, ZEUS_DEMO, 'programa');
check(inicios.ok && inicios.data.length > 0, 'T3 inicios disponibles mañana', inicios.ok ? `${inicios.data.length} horas` : inicios.mensaje);
if (!inicios.ok || inicios.data.length === 0) process.exit(1);
const hora = inicios.data[0];

// ── T4: LA MATRÍCULA (todas-al-comprar, pago simulado declarado) ──────
// Si el seed del gate YA existe (re-run), no se duplica: se reusa la
// cita futura existente.
const semanaPrevia = await obtenerCitasAdiestramientoDelDia({
  prestador_id: prestadorId,
  fecha: fechaLocal(0),
  fecha_hasta: fechaLocal(6),
});
let citaK1 = semanaPrevia.ok ? semanaPrevia.data.find((c) => c.estado === 'confirmada') : undefined;
if (!citaK1) {
  const compra = await contratarPrograma({
    prestadorId,
    servicioId: ofertaId,
    programaId: programa.id,
    mascotaId: ZEUS_DEMO,
    fechaInicio: manana,
    hora,
  });
  check(compra.ok, 'T4 contratar_programa (matrícula real)', compra.ok ? compra.data.programa_contratado_id : compra.mensaje);
  if (!compra.ok) process.exit(1);
  check(compra.data.n_sesiones === 2, 'T4b todas-al-comprar: 2 sesiones generadas');
} else {
  check(true, 'T4 matrícula del gate', 'preexistente (re-run)');
}

// ── T5: la jornada del prestador la VE (mi gemela del día) ────────────
const semana = await obtenerCitasAdiestramientoDelDia({
  prestador_id: prestadorId,
  fecha: fechaLocal(0),
  fecha_hasta: fechaLocal(6),
});
check(semana.ok && semana.data.some((c) => c.fecha === manana), 'T5 la cita k=1 aparece en la semana', semana.ok ? `${semana.data.length} citas` : semana.mensaje);
citaK1 = semana.ok ? semana.data.find((c) => c.fecha === manana) : undefined;
if (!citaK1) process.exit(1);

// ── T6: el detalle porta el CONTEXTO k/N ──────────────────────────────
const detalle = await obtenerCitaAdiestramientoPorId(citaK1.id);
check(
  detalle.ok && detalle.data.sesion_numero === 1 && detalle.data.programa?.n_sesiones === 2,
  'T6 detalle con "Sesión 1 de 2"',
  detalle.ok ? `k=${detalle.data.sesion_numero}/${detalle.data.programa?.n_sesiones} · ${detalle.data.programa?.nombre}` : detalle.mensaje,
);

// ── T7: la reconstrucción 7.5 — sin iniciar, estado null ──────────────
const atencion = await obtenerAdiestramientoPorCita(citaK1.id);
check(atencion.ok && atencion.data.estado === null, 'T7 sin iniciar (estado null)', atencion.ok ? '' : atencion.mensaje);

// ── T8: EL GATE TEMPORAL — iniciar HOY una cita de MAÑANA rebota
//        TIPADO (prueba el motor Y el mapeo de códigos del wrapper) ───
const inicio = await iniciarAtencionAdiestramiento(citaK1.id);
check(
  !inicio.ok && inicio.codigo === 'cita_aun_no_ocurre',
  'T8 gate temporal cita_aun_no_ocurre (tipado, voz honesta)',
  inicio.ok ? 'INICIÓ (mal)' : `${inicio.codigo} · "${inicio.mensaje}"`,
);

// ── T9: vocabulario y currículum del Durante responden ────────────────
const [vocabulario, curriculum] = await Promise.all([
  obtenerObjetivosAdiestramiento(),
  obtenerCurriculumNivel('basico'),
]);
check(vocabulario.ok && vocabulario.data.length > 0, 'T9 vocabulario de objetivos', vocabulario.ok ? `${vocabulario.data.length} objetivos` : vocabulario.mensaje);
check(curriculum.ok && curriculum.data.length > 0, 'T9b currículum del nivel básico', curriculum.ok ? `${curriculum.data.length} sugeridos` : curriculum.mensaje);

await cerrarSesion();
console.log(`\nSEED DEL GATE (queda VIVO, patrón D-385): cita k=1 ${citaK1.id} · ${manana} ${hora} · Zeus demo`);
console.log(fallos === 0 ? 'ASSERTS ATENCIÓN ADIESTRAMIENTO: 0 fallos' : `ASSERTS: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
