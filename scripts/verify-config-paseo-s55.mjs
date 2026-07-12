// Asserts imperativos S55-B (B2) — wrappers de configuración del paseo
// contra DB viva con la sesión demo (regla 47 / L-114). ESTADO COMPARTIDO:
// todo lo que se crea acá se limpia por id al final y se verifica 0
// residuos. La oferta seed de 30' NO se toca (solo lectura y rechazos).
import { readFileSync } from 'node:fs';
import {
  initApi,
  getClient,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  obtenerOfertasPaseoPropias,
  crearOfertaPaseo,
  actualizarOfertaPaseo,
  obtenerFranjasHorario,
  crearFranjaHorario,
  actualizarFranjaHorario,
  eliminarFranjaHorario,
  obtenerOfertaPaseo,
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

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const prestador = await obtenerMiPrestador();
check(prestador.ok, 'T1 obtenerMiPrestador', prestador.ok ? prestador.data.id : prestador.mensaje);
if (!prestador.ok) process.exit(1);
const prestadorId = prestador.data.id;

// T2 — lectura de ofertas propias: el seed de 30' está y tiene shape
const o1 = await obtenerOfertasPaseoPropias(prestadorId);
check(o1.ok, 'T2 ofertas propias responde', o1.ok ? `${o1.data.length} oferta(s)` : o1.mensaje);
const seed30 = o1.ok ? o1.data.find((o) => o.duracionMinutos === 30) : undefined;
check(seed30 !== undefined, 'T2b la oferta 30 del seed existe');

// T3 — duplicado del bloque 30 → rechazo tipado sin escritura
const dup = await crearOfertaPaseo({ prestadorId, duracionMinutos: 30, precio: 9 });
check(!dup.ok && dup.codigo === 'bloque_duplicado', 'T3 bloque duplicado → bloque_duplicado');

// T4 — duración fuera del menú canónico → rechazo
const fuera = await crearOfertaPaseo({ prestadorId, duracionMinutos: 45, precio: 9 });
check(!fuera.ok && fuera.codigo === 'bloque_invalido', 'T4 duración 45 → bloque_invalido');
const precioMalo = await crearOfertaPaseo({ prestadorId, duracionMinutos: 60, precio: 0 });
check(!precioMalo.ok && precioMalo.codigo === 'precio_invalido', 'T4b precio 0 → precio_invalido');

// T5 — POST-MOTOR (S55-A B2 verificado literal): el bloque 60 nace OFERTABLE
const b60 = await crearOfertaPaseo({
  prestadorId,
  duracionMinutos: 60,
  precio: 18,
  nombre: '[TEST S55] Paseo 1 hora',
});
check(b60.ok, 'T5 crear bloque 60 responde ok', b60.ok ? b60.data.id : b60.mensaje);
check(b60.ok && b60.data.activo === true, 'T5b nace activo=true (el motor ocupa por ventana)');
const oferta60Id = b60.ok ? b60.data.id : null;

// T6 — el DUEÑO lo ve mientras está activo (obtener_oferta_paseo)
const ofertaGlobal = await obtenerOfertaPaseo();
check(ofertaGlobal.ok, 'T6 obtener_oferta_paseo (dueño) responde');
if (ofertaGlobal.ok) {
  check(
    ofertaGlobal.data.some((o) => o.duracion_minutos === 60),
    'T6b el bloque 60 activo SÍ se oferta al cliente',
  );
}

if (oferta60Id) {
  // T7 — pausar es la compuerta: desaparece de la oferta al dueño
  const pau = await actualizarOfertaPaseo({ id: oferta60Id, activo: false });
  check(pau.ok && pau.data.activo === false, 'T7 pausado');
  const ofertaGlobal2 = await obtenerOfertaPaseo();
  check(
    ofertaGlobal2.ok && !ofertaGlobal2.data.some((o) => o.duracion_minutos === 60),
    'T7b pausado → fuera de la oferta al cliente',
  );

  // T8 — el precio SÍ se edita (rige holds futuros; snapshot protege lo creado)
  const pre = await actualizarOfertaPaseo({ id: oferta60Id, precio: 19.5 });
  check(pre.ok && pre.data.precio === 19.5, 'T8 precio editado a 19.50', pre.ok ? '' : pre.mensaje);
}

// T9 — franja nueva en domingo (el seed es lun-sáb: no colisiona)
const f1 = await crearFranjaHorario({ prestadorId, diaSemana: 0, horaInicio: '09:00', horaFin: '11:00', maxCitasPorSlot: 2 });
check(f1.ok, 'T9 franja domingo 09-11 cupo 2', f1.ok ? f1.data.id : f1.mensaje);
const franjaId = f1.ok ? f1.data.id : null;

// T10 — solape sobre la misma franja → rechazo
const sol = await crearFranjaHorario({ prestadorId, diaSemana: 0, horaInicio: '10:00', horaFin: '12:00', maxCitasPorSlot: 1 });
check(!sol.ok && sol.codigo === 'franja_solapada', 'T10 franja solapada → franja_solapada');

// T11 — cupo y pausa editables
if (franjaId) {
  const c1 = await actualizarFranjaHorario({ id: franjaId, maxCitasPorSlot: 3 });
  check(c1.ok && c1.data.maxCitasPorSlot === 3, 'T11 cupo → 3');
  const p1 = await actualizarFranjaHorario({ id: franjaId, activo: false });
  check(p1.ok && p1.data.activo === false, 'T11b pausada');
}

// T12 — validaciones de forma
const rango = await crearFranjaHorario({ prestadorId, diaSemana: 3, horaInicio: '10:00', horaFin: '09:00', maxCitasPorSlot: 1 });
check(!rango.ok && rango.codigo === 'rango_horario_invalido', 'T12 fin antes de inicio → rango_horario_invalido');
const cupo = await crearFranjaHorario({ prestadorId, diaSemana: 3, horaInicio: '06:00', horaFin: '07:00', maxCitasPorSlot: 5 });
check(!cupo.ok && cupo.codigo === 'cupo_invalido', 'T12b cupo 5 → cupo_invalido');

// T13 — la lectura de franjas refleja lo creado (y el seed sigue intacto)
const f2 = await obtenerFranjasHorario(prestadorId);
check(f2.ok && f2.data.filter((f) => f.diaSemana !== 0).length === 12, 'T13 las 12 franjas seed intactas', f2.ok ? String(f2.data.length) : '');

// ── LIMPIEZA QUIRÚRGICA por id (estado compartido) ──
if (franjaId) {
  const del = await eliminarFranjaHorario(franjaId);
  check(del.ok, 'L1 franja de prueba eliminada');
}
if (oferta60Id) {
  const { error: errDel } = await getClient().from('prestador_servicios').delete().eq('id', oferta60Id);
  check(!errDel, 'L2 oferta 60 de prueba eliminada (RLS owner)');
}
const o2 = await obtenerOfertasPaseoPropias(prestadorId);
const f3 = await obtenerFranjasHorario(prestadorId);
check(
  o2.ok && !o2.data.some((o) => o.duracionMinutos === 60) && f3.ok && !f3.data.some((f) => f.diaSemana === 0),
  'L3 cero residuos verificado',
  o2.ok && f3.ok ? `${o2.data.length} oferta(s), ${f3.data.length} franja(s)` : '',
);

// T14 — sin sesión: error tipado
await cerrarSesion();
const s1 = await obtenerOfertasPaseoPropias(prestadorId);
check(!s1.ok && s1.codigo === 'sin_sesion', 'T14 ofertas sin sesión → sin_sesion');
const s2 = await crearFranjaHorario({ prestadorId, diaSemana: 0, horaInicio: '09:00', horaFin: '10:00', maxCitasPorSlot: 1 });
check(!s2.ok && s2.codigo === 'sin_sesion', 'T14b crear franja sin sesión → sin_sesion');

console.log(fallos === 0 ? '\nTODOS LOS ASSERTS PASARON' : `\n${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
