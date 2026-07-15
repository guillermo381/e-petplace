// Asserts imperativos S61-B5 (D-391) — editarFranjaHorario contra DB
// viva con la sesión demo (regla 47 / L-114). ESTADO COMPARTIDO: las
// franjas de PRUEBA nacen en ventanas LIBRES relevadas, se editan y se
// limpian por id al final con verificación de 0 residuos — la config
// demo real no se toca jamás.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  obtenerFranjasHorario,
  crearFranjaHorario,
  editarFranjaHorario,
  eliminarFranjaHorario,
} from '../packages/api/src/index.ts';

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

const sesion = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!sesion.ok) { console.log('✗ login demo falló'); process.exit(1); }
const prest = await obtenerMiPrestador();
if (!prest.ok) { console.log('✗ sin prestador demo'); process.exit(1); }
const prestadorId = prest.data.id;

const antes = await obtenerFranjasHorario(prestadorId);
if (!antes.ok) { console.log('✗ no se pudieron leer las franjas'); process.exit(1); }
const conteoOriginal = antes.data.length;

// la grilla 05:00–22:00 en pasos de 30 (la misma de la sección)
const SLOTS = [];
for (let m = 5 * 60; m <= 22 * 60; m += 30) {
  SLOTS.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}
const libre = (dia, ini, fin) =>
  !antes.data.some((f) => f.diaSemana === dia && ini < f.horaFin && f.horaInicio < fin);

// CUATRO medias horas libres consecutivas: A=s0-s1 · B=s1-s2 · destino=s2-s3
let ventana = null;
for (let dia = 0; dia <= 6 && ventana === null; dia++) {
  for (let i = 0; i + 3 < SLOTS.length; i++) {
    if (libre(dia, SLOTS[i], SLOTS[i + 3])) { ventana = { dia, s: SLOTS.slice(i, i + 4) }; break; }
  }
}
if (ventana === null) { console.log('✗ sin ventana libre de 2h en la agenda demo — assert no corrió'); process.exit(1); }
const { dia, s } = ventana;
console.log(`ventana de prueba: día ${dia}, ${s[0]}–${s[3]}`);

const creadas = [];
try {
  const a = await crearFranjaHorario({ prestadorId, diaSemana: dia, horaInicio: s[0], horaFin: s[1], maxCitasPorSlot: 1 });
  check(a.ok, 'T0a franja de prueba A creada');
  if (a.ok) creadas.push(a.data.id);
  const b = await crearFranjaHorario({ prestadorId, diaSemana: dia, horaInicio: s[1], horaFin: s[2], maxCitasPorSlot: 2 });
  check(b.ok, 'T0b franja de prueba B creada');
  if (b.ok) creadas.push(b.data.id);
  if (!a.ok || !b.ok) throw new Error('setup falló');

  // T1 — editar A en su lugar a la ventana libre s2-s3 (mismo id)
  const t1 = await editarFranjaHorario({ id: a.data.id, prestadorId, horaInicio: s[2], horaFin: s[3] });
  check(t1.ok && t1.data.horaInicio === s[2] && t1.data.horaFin === s[3] && t1.data.id === a.data.id,
    'T1 la edición mueve las horas SIN cambiar el id (muere eliminar+crear)');

  // T2 — editar A encima de B rebota TIPADO
  const t2 = await editarFranjaHorario({ id: a.data.id, prestadorId, horaInicio: s[1], horaFin: s[2] });
  check(!t2.ok && t2.codigo === 'franja_solapada', 'T2 el solape con OTRA franja rebota franja_solapada');

  // T3 — la propia franja NO se cuenta como solape (exclusión D-349):
  // re-declarar el MISMO rango de A es legal
  const t3 = await editarFranjaHorario({ id: a.data.id, prestadorId, horaInicio: s[2], horaFin: s[3], maxCitasPorSlot: 3 });
  check(t3.ok && t3.data.maxCitasPorSlot === 3, 'T3 la exclusión de la propia franja (mismo rango + cupo nuevo)');

  // T4 — rango inválido rebota tipado
  const t4 = await editarFranjaHorario({ id: a.data.id, prestadorId, horaInicio: s[3], horaFin: s[2] });
  check(!t4.ok && t4.codigo === 'rango_horario_invalido', 'T4 fin <= inicio rebota rango_horario_invalido');

  // T5 — id inexistente rebota no_encontrada
  const t5 = await editarFranjaHorario({ id: '00000000-0000-0000-0000-000000000000', prestadorId, horaInicio: s[0], horaFin: s[1] });
  check(!t5.ok && t5.codigo === 'no_encontrada', 'T5 id inexistente rebota no_encontrada');

  // T6 — B quedó intacta (la edición de A jamás la tocó)
  const despues = await obtenerFranjasHorario(prestadorId);
  const bViva = despues.ok ? despues.data.find((f) => f.id === b.data.id) : undefined;
  check(bViva !== undefined && bViva.horaInicio === s[1] && bViva.horaFin === s[2] && bViva.maxCitasPorSlot === 2,
    'T6 la franja vecina B intacta');
} finally {
  // limpieza QUIRÚRGICA por id (receta D-322) + residuos 0
  for (const id of creadas) await eliminarFranjaHorario(id);
  const final = await obtenerFranjasHorario(prestadorId);
  check(final.ok && final.data.length === conteoOriginal, 'LIMPIEZA residuos 0 (conteo original restaurado)',
    final.ok ? `${final.data.length}/${conteoOriginal}` : 'lectura falló');
  await cerrarSesion();
}

console.log(fallos === 0 ? '\nASSERTS EDITAR FRANJA S61: TODO OK' : `\nASSERTS EDITAR FRANJA S61: ${fallos} FALLOS`);
process.exit(fallos === 0 ? 0 : 1);
