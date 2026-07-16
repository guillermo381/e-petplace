// Asserts imperativos S63-B — wrappers de la oferta del adiestrador
// contra DB viva con la sesión demo (regla 47 / L-114). ESTADO
// COMPARTIDO: todo lo creado se limpia por id al final y se verifica
// 0 residuos. El corazón del test es EL GUARD DEL FANTASMA: guardar
// con especies [] rebota TIPADO — el default silencioso es imposible
// por la puerta única.
import { readFileSync } from 'node:fs';
import {
  initApi,
  getClient,
  iniciarSesion,
  cerrarSesion,
  obtenerMiPrestador,
  obtenerOfertaAdiestramientoPropia,
  guardarOfertaAdiestramiento,
  guardarProgramaAdiestramiento,
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
if (!prestador.ok) {
  console.log('✗ sin prestador demo:', prestador.mensaje);
  process.exit(1);
}
const prestadorId = prestador.data.id;

// T1 — lectura: el demo no tiene oferta de adiestramiento previa (o la
// tiene: el test se adapta y NO la toca — solo crea si no existe).
const antes = await obtenerOfertaAdiestramientoPropia(prestadorId);
check(antes.ok, 'T1 lectura de la oferta propia', antes.ok ? (antes.data.oferta ? 'ya existe' : 'sin oferta') : antes.mensaje);
if (!antes.ok) process.exit(1);
const preexistente = antes.data.oferta !== null;

// T2 — EL GUARD DEL FANTASMA: especies [] rebota tipado, nada se escribe.
const fantasma = await guardarOfertaAdiestramiento({
  prestadorId,
  ofertaId: antes.data.oferta?.id ?? null,
  activo: true,
  precio: 25,
  duracionMinutos: 60,
  especies: [],
});
check(
  !fantasma.ok && fantasma.codigo === 'especies_sin_declarar',
  'T2 especies [] rebota especies_sin_declarar',
  fantasma.ok ? 'ESCRIBIÓ (mal)' : fantasma.codigo,
);

// T3 — el camino feliz: especies ['perro'] declaradas explícitas.
const guardada = await guardarOfertaAdiestramiento({
  prestadorId,
  ofertaId: antes.data.oferta?.id ?? null,
  activo: true,
  precio: 25,
  duracionMinutos: 60,
  especies: ['perro'],
});
check(guardada.ok, 'T3 guardar con especies declaradas', guardada.ok ? guardada.data.id : guardada.mensaje);
if (!guardada.ok) process.exit(1);
const ofertaId = guardada.data.id;
check(
  guardada.ok && guardada.data.especies.length === 1 && guardada.data.especies[0] === 'perro',
  'T3b especies persistidas = ["perro"]',
);

// T4 — CHECK de vigencia espejado del motor: 8 sesiones con 30 días
// (< 49) rebota tipado.
const corta = await guardarProgramaAdiestramiento({
  ofertaId,
  programaId: null,
  nivel: 'basico',
  nombre: 'Programa de prueba S63',
  nSesiones: 8,
  precioPrograma: 200,
  vigenciaDias: 30,
  duracionMinutosSesion: 60,
  activo: true,
});
check(
  !corta.ok && corta.codigo === 'vigencia_no_cubre_cadencia',
  'T4 vigencia corta rebota vigencia_no_cubre_cadencia',
  corta.ok ? 'ESCRIBIÓ (mal)' : corta.codigo,
);

// T5 — programa válido (8 sesiones · 70 días · $200 · 60').
const programa = await guardarProgramaAdiestramiento({
  ofertaId,
  programaId: null,
  nivel: 'basico',
  nombre: 'Programa de prueba S63',
  nSesiones: 8,
  precioPrograma: 200,
  vigenciaDias: 70,
  duracionMinutosSesion: 60,
  activo: true,
});
check(programa.ok, 'T5 programa válido se crea', programa.ok ? programa.data.id : programa.mensaje);

// T6 — edición: el programa se oculta (activo=false) por la misma vía.
if (programa.ok) {
  const oculto = await guardarProgramaAdiestramiento({
    ofertaId,
    programaId: programa.data.id,
    nivel: 'basico',
    nombre: 'Programa de prueba S63',
    nSesiones: 8,
    precioPrograma: 200,
    vigenciaDias: 70,
    duracionMinutosSesion: 60,
    activo: false,
  });
  check(oculto.ok && oculto.data.activo === false, 'T6 edición apaga el programa');
}

// ── LIMPIEZA por id (receta D-322) + verificación 0 residuos ──────────
const cliente = getClient();
if (programa.ok) {
  const d1 = await cliente.from('prestador_programas').delete().eq('id', programa.data.id);
  check(d1.error === null, 'L1 programa de prueba borrado', d1.error?.message ?? '');
}
if (!preexistente) {
  const d2 = await cliente.from('prestador_servicios').delete().eq('id', ofertaId);
  check(d2.error === null, 'L2 oferta de prueba borrada', d2.error?.message ?? '');
} else {
  console.log('  (oferta preexistente del demo: se conserva — el test no la creó)');
}
const residuos = await obtenerOfertaAdiestramientoPropia(prestadorId);
check(
  residuos.ok && (preexistente ? residuos.data.programas.length === 0 : residuos.data.oferta === null),
  'L3 cero residuos',
  residuos.ok ? '' : residuos.mensaje,
);

await cerrarSesion();
console.log(fallos === 0 ? '\nASSERTS ADIESTRAMIENTO-OFERTA: 0 fallos' : `\nASSERTS: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
