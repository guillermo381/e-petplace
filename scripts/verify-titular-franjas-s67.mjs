// Asserts imperativos S67 (V0 T7) — los wrappers de franjas resuelven
// el TITULAR (la conspiración de NULLs murió en 20260717170000) con
// contrato hacia pantallas IDÉNTICO. Sesión demo contra DB viva (regla
// 47 / L-114). Todo lo creado se limpia por id; 0 residuos verificados.
// NOTA: eliminarFranjasPrestador NO se ejerce en vivo (borraría la
// agenda real del demo); su cambio es el MISMO filtro titular que acá.
import { readFileSync } from 'node:fs';
import {
  initApi,
  getClient,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  obtenerFranjasHorario,
  crearFranjaHorario,
  actualizarFranjaHorario,
  eliminarFranjaHorario,
} from '../packages/api/src/index.ts';
import { obtenerFranjasDeServicios, crearFranjaServicio } from '../packages/api/src/wrappers/horarios-modo.ts';
import { obtenerTitularId } from '../packages/api/src/wrappers/titular.ts';

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

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const prestador = await obtenerMiPrestador();
check(prestador.ok, 'T1 obtenerMiPrestador', prestador.ok ? prestador.data.id : prestador.mensaje);
if (!prestador.ok) process.exit(1);
const prestadorId = prestador.data.id;

// T2 — el titular existe y es visible por RLS del dueño
const titularId = await obtenerTitularId(prestadorId);
check(titularId !== null, 'T2 obtenerTitularId resuelve la persona dueño', titularId ?? 'null');

// T3 — lectura de franjas generales: mismo contrato, ahora vía titular
const f1 = await obtenerFranjasHorario(prestadorId);
check(f1.ok && f1.data.length > 0, 'T3 obtenerFranjasHorario devuelve la agenda', f1.ok ? `${f1.data.length} franjas` : f1.mensaje);
const antesN = f1.ok ? f1.data.length : 0;

// T4 — crear franja general: nace CON persona (empleado_id = titular)
const creada = await crearFranjaHorario({
  prestadorId, diaSemana: 1, horaInicio: '19:00', horaFin: '20:00', maxCitasPorSlot: 2,
});
check(creada.ok, 'T4 crearFranjaHorario', creada.ok ? creada.data.id : creada.mensaje);
let franjaId = null;
if (creada.ok) {
  franjaId = creada.data.id;
  const { data: fila } = await getClient()
    .from('prestador_horarios')
    .select('empleado_id, servicio_id, max_citas_por_slot')
    .eq('id', franjaId)
    .single();
  check(fila?.empleado_id === titularId, 'T4b la franja nueva porta al titular', `empleado_id=${fila?.empleado_id}`);
  check(fila?.servicio_id === null && fila?.max_citas_por_slot === 2, 'T4c shape general con cupo 2');
}

// T5 — el solape se valida contra las franjas del titular
const solapada = await crearFranjaHorario({
  prestadorId, diaSemana: 1, horaInicio: '19:30', horaFin: '20:30', maxCitasPorSlot: 1,
});
check(!solapada.ok && solapada.codigo === 'franja_solapada', 'T5 solape → franja_solapada', solapada.ok ? 'creó (mal)' : solapada.codigo);

// T6 — la lectura ve la franja nueva (contrato idéntico)
const f2 = await obtenerFranjasHorario(prestadorId);
check(f2.ok && f2.data.length === antesN + 1, 'T6 la lectura ve la franja nueva', f2.ok ? `${f2.data.length}` : f2.mensaje);

// T7 — actualizar cupo sobre la franja nueva
if (franjaId) {
  const upd = await actualizarFranjaHorario({ id: franjaId, maxCitasPorSlot: 3 });
  check(upd.ok && upd.data.maxCitasPorSlot === 3, 'T7 actualizarFranjaHorario cupo 3', upd.ok ? '' : upd.mensaje);
}

// T8 — franja por servicio en modo universal → el guard D-386 sigue
// rebotando tipado (el camino del titular no lo esquivó)
const ofertaSeed = await getClient()
  .from('prestador_servicios')
  .select('id')
  .eq('prestador_id', prestadorId)
  .eq('activo', true)
  .limit(1)
  .single();
if (ofertaSeed.data) {
  const fs = await crearFranjaServicio({
    prestadorId, servicioId: ofertaSeed.data.id,
    diaSemana: 1, horaInicio: '21:00', horaFin: '22:00', maxCitasPorSlot: 1,
  });
  check(!fs.ok && fs.codigo === 'franja_especifica_en_modo_universal',
    'T8 franja por servicio en modo universal → guard D-386 intacto', fs.ok ? 'creó (mal)' : fs.codigo);
  const lect = await obtenerFranjasDeServicios(prestadorId, [ofertaSeed.data.id]);
  check(lect.ok, 'T8b obtenerFranjasDeServicios responde', lect.ok ? `${lect.data.length} filas` : lect.mensaje);
}

// LIMPIEZA por id + 0 residuos
if (franjaId) {
  const del = await eliminarFranjaHorario(franjaId);
  check(del.ok, 'T9 limpieza: eliminarFranjaHorario', del.ok ? '' : del.mensaje);
}
const f3 = await obtenerFranjasHorario(prestadorId);
check(f3.ok && f3.data.length === antesN, 'T10 residuos 0 (la agenda quedó como estaba)', f3.ok ? `${f3.data.length}` : f3.mensaje);

await cerrarSesion();
console.log(fallos === 0 ? '\nTODOS LOS ASSERTS VERDES' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
